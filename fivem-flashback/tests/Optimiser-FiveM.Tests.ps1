#Requires -Modules Pester
# Lancer : Invoke-Pester -Path .\tests -Output Detailed

BeforeAll {
    $script:ScriptPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'Optimiser-FiveM.ps1'
    . $script:ScriptPath

    function New-FakeFiveM {
        param([string]$Root)
        $data = Join-Path $Root 'FiveM/FiveM.app/data'
        $files = @{
            'cache/a.bin'                  = 2048
            'cache/sub/b.bin'              = 1024
            'server-cache/c.rpf'           = 4096
            'server-cache-priv/d.rpf'      = 512
            'game-storage/gta.rpf'         = 8192
        }
        foreach ($k in $files.Keys) {
            $f = Join-Path $data $k
            New-Item -ItemType Directory -Force -Path (Split-Path $f) | Out-Null
            [System.IO.File]::WriteAllBytes($f, (New-Object byte[] $files[$k]))
        }
        $app = Join-Path $Root 'FiveM/FiveM.app'
        New-Item -ItemType Directory -Force -Path (Join-Path $app 'logs'), (Join-Path $app 'crashes'), (Join-Path $app 'plugins') | Out-Null
        [System.IO.File]::WriteAllBytes((Join-Path $app 'logs/log.txt'), (New-Object byte[] 100))
        [System.IO.File]::WriteAllBytes((Join-Path $app 'plugins/reshade.dll'), (New-Object byte[] 10))
        Set-Content -Path (Join-Path $app 'CitizenFX.ini') -Value "[Game]`nUpdateChannel=production"
    }

    function New-Report {
        param($RamGB = 16, $VramGB = 8, $FreeDiskGB = 100, $PagefileAuto = $true, $PagefileMB = 0,
              $OnBattery = $false, $IsHighPerfPlan = $true, $GpuNames = $null, $HasVendorControlApp = $null)
        [pscustomobject]@{
            RamGB = $RamGB; VramGB = $VramGB; FreeDiskGB = $FreeDiskGB; PagefileAuto = $PagefileAuto
            PagefileMB = $PagefileMB; OnBattery = $OnBattery; IsHighPerfPlan = $IsHighPerfPlan
            GpuNames = $GpuNames; HasVendorControlApp = $HasVendorControlApp
        }
    }
}

Describe 'Fichiers livrés' {
    It 'le script PowerShell se parse sans erreur' {
        $errors = $null; $tokens = $null
        [System.Management.Automation.Language.Parser]::ParseFile($script:ScriptPath, [ref]$tokens, [ref]$errors) | Out-Null
        $errors.Count | Should -Be 0
    }
    It 'le .ps1 a un BOM UTF-8 (sinon les accents cassent sous Windows PowerShell 5.1)' {
        $bytes = [System.IO.File]::ReadAllBytes($script:ScriptPath)
        $bytes[0..2] | Should -Be @(0xEF, 0xBB, 0xBF)
    }
    It 'le .bat est en fins de ligne Windows (CRLF) et en ASCII' {
        $bat = Join-Path (Split-Path $PSScriptRoot -Parent) 'Lancer-Kit-FiveM.bat'
        $bytes = [System.IO.File]::ReadAllBytes($bat)
        @($bytes | Where-Object { $_ -gt 127 }).Count | Should -Be 0
        $text = [System.Text.Encoding]::ASCII.GetString($bytes)
        ([regex]::Matches($text, "(?<!`r)`n")).Count | Should -Be 0
        $text | Should -Match 'ExecutionPolicy Bypass'
    }
}

Describe 'Get-FiveMPaths' {
    It 'construit les bons chemins' {
        $p = Get-FiveMPaths -LocalAppData '/x'
        $p.Exe  | Should -Be (Join-Path (Join-Path '/x' 'FiveM') 'FiveM.exe')
        $p.Data | Should -Match 'FiveM.app[\\/]data$'
    }
    It 'ne classe jamais game-storage comme nettoyable' {
        $p = Get-FiveMPaths -LocalAppData '/x'
        ($p.Clearable | Where-Object { $_ -match 'game-storage' }) | Should -BeNullOrEmpty
        ($p.Protected | Where-Object { $_ -match 'game-storage' }) | Should -Not -BeNullOrEmpty
    }
}

Describe 'Clear-FiveMCache' {
    BeforeEach {
        $script:Root = Join-Path ([System.IO.Path]::GetTempPath()) ("fivem-test-" + [guid]::NewGuid())
        New-FakeFiveM -Root $script:Root
        $script:Data = Join-Path $script:Root 'FiveM/FiveM.app/data'
        $script:App  = Join-Path $script:Root 'FiveM/FiveM.app'
    }
    AfterEach { Remove-Item -Recurse -Force $script:Root -ErrorAction SilentlyContinue }

    It 'vide les caches, garde les dossiers, et calcule la place libérée' {
        $r = Clear-FiveMCache -LocalAppData $script:Root -IsRunning { $false }
        $r.Status | Should -Be 'OK'
        $r.FreedBytes | Should -Be (2048 + 1024 + 4096 + 512 + 100)
        (Get-ChildItem -Recurse -File (Join-Path $script:Data 'cache')) | Should -BeNullOrEmpty
        (Get-ChildItem -Recurse -File (Join-Path $script:Data 'server-cache')) | Should -BeNullOrEmpty
        Test-Path (Join-Path $script:Data 'cache') | Should -BeTrue
    }
    It 'ne touche JAMAIS à game-storage, CitizenFX.ini ni plugins' {
        Clear-FiveMCache -LocalAppData $script:Root -IsRunning { $false } | Out-Null
        Test-Path (Join-Path $script:Data 'game-storage/gta.rpf') | Should -BeTrue
        Test-Path (Join-Path $script:App 'CitizenFX.ini') | Should -BeTrue
        Test-Path (Join-Path $script:App 'plugins/reshade.dll') | Should -BeTrue
    }
    It 'en simulation (DryRun) ne supprime rien mais annonce la taille' {
        $r = Clear-FiveMCache -LocalAppData $script:Root -DryRun -IsRunning { $false }
        $r.FreedBytes | Should -Be (2048 + 1024 + 4096 + 512 + 100)
        Test-Path (Join-Path $script:Data 'cache/a.bin') | Should -BeTrue
    }
    It 'refuse de nettoyer si FiveM est ouvert' {
        $r = Clear-FiveMCache -LocalAppData $script:Root -IsRunning { $true }
        $r.Status | Should -Be 'FiveMRunning'
        Test-Path (Join-Path $script:Data 'cache/a.bin') | Should -BeTrue
    }
    It 'signale FiveM non installé' {
        $empty = Join-Path ([System.IO.Path]::GetTempPath()) ("vide-" + [guid]::NewGuid())
        (Clear-FiveMCache -LocalAppData $empty -IsRunning { $false }).Status | Should -Be 'NotInstalled'
    }
    It 'fonctionne même si certains dossiers de cache n''existent pas' {
        Remove-Item -Recurse -Force (Join-Path $script:Data 'server-cache-priv')
        $r = Clear-FiveMCache -LocalAppData $script:Root -IsRunning { $false }
        $r.Status | Should -Be 'OK'
        $r.FreedBytes | Should -Be (2048 + 1024 + 4096 + 100)
    }
}

Describe 'Détection des processus' {
    It 'reconnaît le processus du jeu <Name>' -ForEach @(
        @{ Name = 'FiveM_GTAProcess' }, @{ Name = 'FiveM_b3258_GTAProcess' }, @{ Name = 'FiveM_b2944_GTAProcess.exe' }
    ) { Test-IsGtaProcessName $Name | Should -BeTrue }

    It 'ignore <Name>' -ForEach @(
        @{ Name = 'FiveM' }, @{ Name = 'FiveM_ChromeBrowser' }, @{ Name = 'GTA5' }, @{ Name = 'chrome' }
    ) { Test-IsGtaProcessName $Name | Should -BeFalse }

    It 'reconnaît tous les processus FiveM pour bloquer le nettoyage' {
        Test-IsFiveMProcessName 'FiveM' | Should -BeTrue
        Test-IsFiveMProcessName 'FiveM_ChromeBrowser' | Should -BeTrue
        Test-IsFiveMProcessName 'FiveM_b3258_GTAProcess' | Should -BeTrue
        Test-IsFiveMProcessName 'chrome' | Should -BeFalse
    }
}

Describe 'Test-IsIntegratedGpu' {
    It '<Name> est intégrée : <Expected>' -ForEach @(
        @{ Name = 'Intel(R) UHD Graphics 630'; Expected = $true }
        @{ Name = 'Intel(R) Iris(R) Xe Graphics'; Expected = $true }
        @{ Name = 'AMD Radeon(TM) Graphics'; Expected = $true }
        @{ Name = 'Microsoft Basic Display Adapter'; Expected = $true }
        @{ Name = 'NVIDIA GeForce RTX 4060 Laptop GPU'; Expected = $false }
        @{ Name = 'AMD Radeon RX 6700 XT'; Expected = $false }
        @{ Name = 'Intel(R) Arc(TM) A770 Graphics'; Expected = $false }
        @{ Name = ''; Expected = $false }
    ) { Test-IsIntegratedGpu $Name | Should -Be $Expected }
}

Describe 'Get-RecommendedSettings' {
    It 'PC modeste -> textures Normale' {
        $s = Get-RecommendedSettings -VramGB 4 -RamGB 8
        $s.Profil | Should -Match 'Faible'
        $s['Qualite des textures'] | Should -Be 'Normale'
    }
    It '8 Go VRAM / 16 Go RAM -> Moyen' {
        (Get-RecommendedSettings -VramGB 8 -RamGB 16).Profil | Should -Match 'Moyen'
    }
    It 'gros GPU mais peu de RAM -> reste Faible' {
        (Get-RecommendedSettings -VramGB 12 -RamGB 8).Profil | Should -Match 'Faible'
    }
    It '12 Go VRAM / 32 Go RAM -> Eleve' {
        (Get-RecommendedSettings -VramGB 12 -RamGB 32).Profil | Should -Match 'Eleve'
    }
    It 'impose toujours DirectX 11' {
        foreach ($v in 2, 8, 16) { (Get-RecommendedSettings -VramGB $v -RamGB 32)['Version DirectX'] | Should -Be 'DirectX 11' }
    }
}

Describe 'Get-Recommendations' {
    It 'PC sain -> aucune alerte critique' {
        $r = Get-Recommendations -Report (New-Report -RamGB 32 -VramGB 12 -GpuNames @('NVIDIA GeForce RTX 4070'))
        ($r | Where-Object Niveau -eq 'CRITIQUE') | Should -BeNullOrEmpty
    }
    It 'RAM sous 8 Go -> critique' {
        (Get-Recommendations -Report (New-Report -RamGB 6)) | Where-Object { $_.Niveau -eq 'CRITIQUE' -and $_.Conseil -match 'RAM' } | Should -Not -BeNullOrEmpty
    }
    It 'fichier d''échange désactivé -> critique' {
        (Get-Recommendations -Report (New-Report -PagefileAuto $false -PagefileMB 0)) | Where-Object { $_.Conseil -match 'DÉSACTIVÉ' } | Should -Not -BeNullOrEmpty
    }
    It 'peu de disque -> critique' {
        (Get-Recommendations -Report (New-Report -FreeDiskGB 5)) | Where-Object { $_.Niveau -eq 'CRITIQUE' -and $_.Conseil -match 'disque' } | Should -Not -BeNullOrEmpty
    }
    It 'VRAM sous 4 Go -> texture loss signalée' {
        (Get-Recommendations -Report (New-Report -VramGB 2)) | Where-Object { $_.Conseil -match 'texture loss' } | Should -Not -BeNullOrEmpty
    }
    It 'portable ASUS en mode Eco (GPU intégré seul) -> critique' {
        $r = Get-Recommendations -Report (New-Report -GpuNames @('AMD Radeon(TM) Graphics') -HasVendorControlApp 'Armoury Crate (ASUS)')
        $r | Where-Object { $_.Niveau -eq 'CRITIQUE' -and $_.Conseil -match 'Eco' } | Should -Not -BeNullOrEmpty
        $r | Where-Object { $_.Conseil -match 'Armoury Crate' -and $_.Conseil -match 'NE le ferme PAS' } | Should -Not -BeNullOrEmpty
    }
    It 'GPU dédié présent à côté de l''intégré -> pas d''alerte Eco' {
        $r = Get-Recommendations -Report (New-Report -GpuNames @('AMD Radeon(TM) Graphics', 'NVIDIA GeForce RTX 4060 Laptop GPU'))
        $r | Where-Object { $_.Conseil -match 'Eco' -and $_.Niveau -eq 'CRITIQUE' } | Should -BeNullOrEmpty
    }
    It 'sur batterie -> avertit' {
        (Get-Recommendations -Report (New-Report -OnBattery $true)) | Where-Object { $_.Conseil -match 'batterie' } | Should -Not -BeNullOrEmpty
    }
    It 'tolère un rapport sans les champs GPU (ancien format)' {
        $old = [pscustomobject]@{ RamGB = 16; VramGB = 8; FreeDiskGB = 100; PagefileAuto = $true; PagefileMB = 0; OnBattery = $false; IsHighPerfPlan = $true }
        { Get-Recommendations -Report $old } | Should -Not -Throw
    }
}

Describe 'Format-Size' {
    It 'formate <Bytes> -> <Expected>' -ForEach @(
        @{ Bytes = 500; Expected = 'o$' }, @{ Bytes = 2048; Expected = 'Ko$' },
        @{ Bytes = 5MB; Expected = 'Mo$' }, @{ Bytes = 3GB; Expected = 'Go$' }
    ) { Format-Size $Bytes | Should -Match $Expected }
}
