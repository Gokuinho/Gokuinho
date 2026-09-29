<#
.SYNOPSIS
    Kit anti-bug / anti-lag FiveM pour Flashback FA (serveur très chargé en scripts et en mapping).

.DESCRIPTION
    - Vide le cache FiveM (cache, server-cache, server-cache-priv) SANS toucher à game-storage
      (qui ferait retélécharger plusieurs Go).
    - Active le mode performances élevées de Windows, le Mode Jeu, et coupe l'enregistrement
      en arrière-plan de la Xbox Game Bar.
    - Analyse ton PC (RAM, VRAM, disque, fichier d'échange) et te donne les réglages GTA/FiveM
      adaptés à TA machine.
    - Lance FiveM et passe le processus du jeu en priorité haute dès qu'il démarre.

    Rien n'est supprimé en dehors du dossier FiveM. Chaque action est optionnelle.

.PARAMETER Auto
    Fait tout d'un coup sans menu (nettoyage + optimisations + analyse + lancement).

.PARAMETER DryRun
    Mode simulation : affiche ce qui serait fait, ne modifie rien.

.PARAMETER LocalAppData
    Dossier AppData\Local (détecté automatiquement, sert surtout aux tests).

.EXAMPLE
    .\Optimiser-FiveM.ps1            # menu interactif
    .\Optimiser-FiveM.ps1 -Auto      # tout faire puis lancer FiveM
    .\Optimiser-FiveM.ps1 -DryRun    # simulation
#>
[CmdletBinding()]
param(
    [switch]$Auto,
    [switch]$DryRun,
    [string]$LocalAppData = $env:LOCALAPPDATA
)

Set-StrictMode -Version Latest

# --------------------------------------------------------------------------------------------
# Fonctions "pures" (testées automatiquement, aucun effet de bord)
# --------------------------------------------------------------------------------------------

function Get-FiveMPaths {
    param([Parameter(Mandatory)][string]$LocalAppData)

    $root = Join-Path $LocalAppData 'FiveM'
    $app  = Join-Path $root 'FiveM.app'
    $data = Join-Path $app 'data'

    [pscustomobject]@{
        Root        = $root
        Exe         = Join-Path $root 'FiveM.exe'
        App         = $app
        Data        = $data
        # Dossiers qu'on peut vider sans risque : FiveM les recrée au prochain lancement.
        Clearable   = @(
            (Join-Path $data 'cache'),
            (Join-Path $data 'server-cache'),
            (Join-Path $data 'server-cache-priv'),
            (Join-Path $app 'crashes'),
            (Join-Path $app 'logs')
        )
        # Ne JAMAIS supprimer : fichiers du jeu (plusieurs Go), config, plugins (ReShade...).
        Protected   = @(
            (Join-Path $data 'game-storage'),
            (Join-Path $app 'CitizenFX.ini'),
            (Join-Path $app 'plugins'),
            (Join-Path $app 'citizen')
        )
    }
}

function Format-Size {
    param([double]$Bytes)
    if ($Bytes -ge 1GB) { return ('{0:N2} Go' -f ($Bytes / 1GB)) }
    if ($Bytes -ge 1MB) { return ('{0:N1} Mo' -f ($Bytes / 1MB)) }
    if ($Bytes -ge 1KB) { return ('{0:N0} Ko' -f ($Bytes / 1KB)) }
    return ('{0:N0} o' -f $Bytes)
}

function Get-FolderSize {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return 0 }
    $total = 0.0
    foreach ($f in @(Get-ChildItem -LiteralPath $Path -Recurse -Force -File -ErrorAction SilentlyContinue)) {
        $total += $f.Length
    }
    return $total
}

function Test-IsGtaProcessName {
    # FiveM lance le jeu sous un nom qui dépend du build : FiveM_GTAProcess, FiveM_b3258_GTAProcess...
    param([string]$Name)
    return [bool]($Name -match '^FiveM(_b\d+)?_GTAProcess(\.exe)?$')
}

function Test-IsFiveMProcessName {
    param([string]$Name)
    return [bool]($Name -match '^FiveM(\.exe)?$' -or $Name -match '^FiveM_.*(\.exe)?$')
}

function Test-IsIntegratedGpu {
    # Puces graphiques intégrées au processeur (insuffisantes pour un serveur aussi mappé).
    param([string]$Name)
    if (-not $Name) { return $false }
    if ($Name -match 'NVIDIA|GeForce|RTX|GTX|Quadro|Radeon RX|Radeon Pro|Arc\(TM\) A|Arc A\d') { return $false }
    return [bool]($Name -match 'Intel.*(UHD|HD Graphics|Iris)|^AMD Radeon\(TM\) Graphics$|Radeon\(TM\) (Vega|\d+M)|Radeon Graphics|Intel\(R\) Graphics|Microsoft Basic Display')
}

function Get-RecommendedSettings {
    <#
        Renvoie un profil de réglages GTA V / FiveM adapté à la VRAM et à la RAM.
        Sur Flashback le mapping est très lourd : on garde toujours de la marge en VRAM
        pour éviter la "texture loss" (sol / bâtiments qui disparaissent).
    #>
    param(
        [Parameter(Mandatory)][double]$VramGB,
        [Parameter(Mandatory)][double]$RamGB
    )

    if ($VramGB -lt 5 -or $RamGB -lt 12) {
        $tier = 'Faible'
    } elseif ($VramGB -lt 10 -or $RamGB -lt 24) {
        $tier = 'Moyen'
    } else {
        $tier = 'Eleve'
    }

    switch ($tier) {
        'Faible' {
            [ordered]@{
                Profil                      = 'Faible (PC modeste)'
                'Version DirectX'           = 'DirectX 11'
                'Qualite des textures'      = 'Normale'
                'Qualite des ombres'        = 'Normale'
                'Qualite des reflets'       = 'Normale'
                'Qualite de l''herbe'       = 'Normale'
                'Effets post-traitement'    = 'Normale'
                'MSAA'                      = 'Desactive'
                'FXAA'                      = 'Active'
                'Densite de population'     = '0 - 30 %'
                'Variete de population'     = '0 - 30 %'
                'Echelle de distance'       = '0 - 20 %'
                'Distance etendue (avance)' = '0 %'
                'Ombres longues (avance)'   = 'Desactive'
                'Streaming haute qualite en vol' = 'Desactive'
                'Budget textures etendu FiveM'   = '0 - 25 %'
                'Limite FPS conseillee'     = '60'
            }
        }
        'Moyen' {
            [ordered]@{
                Profil                      = 'Moyen (PC gamer standard)'
                'Version DirectX'           = 'DirectX 11'
                'Qualite des textures'      = 'Haute'
                'Qualite des ombres'        = 'Haute'
                'Qualite des reflets'       = 'Haute'
                'Qualite de l''herbe'       = 'Normale'
                'Effets post-traitement'    = 'Haute'
                'MSAA'                      = 'Desactive'
                'FXAA'                      = 'Active'
                'Densite de population'     = '30 - 50 %'
                'Variete de population'     = '30 - 50 %'
                'Echelle de distance'       = '30 - 50 %'
                'Distance etendue (avance)' = '0 %'
                'Ombres longues (avance)'   = 'Desactive'
                'Streaming haute qualite en vol' = 'Desactive'
                'Budget textures etendu FiveM'   = '50 %'
                'Limite FPS conseillee'     = '75 - 120'
            }
        }
        'Eleve' {
            [ordered]@{
                Profil                      = 'Eleve (grosse config)'
                'Version DirectX'           = 'DirectX 11'
                'Qualite des textures'      = 'Tres haute'
                'Qualite des ombres'        = 'Tres haute'
                'Qualite des reflets'       = 'Tres haute'
                'Qualite de l''herbe'       = 'Haute (Ultra = grosse perte de FPS)'
                'Effets post-traitement'    = 'Tres haute'
                'MSAA'                      = 'Desactive ou 2x'
                'FXAA'                      = 'Active'
                'Densite de population'     = '50 - 70 %'
                'Variete de population'     = '50 - 70 %'
                'Echelle de distance'       = '70 - 100 %'
                'Distance etendue (avance)' = '0 - 30 %'
                'Ombres longues (avance)'   = 'Active'
                'Streaming haute qualite en vol' = 'Active'
                'Budget textures etendu FiveM'   = '100 %'
                'Limite FPS conseillee'     = 'Frequence de ton ecran'
            }
        }
    }
}

function Get-Recommendations {
    <#
        Transforme un rapport machine en liste d'alertes/conseils.
        $Report : objet avec RamGB, VramGB, FreeDiskGB, PagefileAuto, PagefileMB, OnBattery, IsHighPerfPlan
    #>
    param([Parameter(Mandatory)]$Report)

    $out = New-Object System.Collections.Generic.List[object]
    function Add-Rec($Level, $Text) { $out.Add([pscustomobject]@{ Niveau = $Level; Conseil = $Text }) }

    if ($Report.RamGB -lt 8) {
        Add-Rec 'CRITIQUE' "Seulement $([math]::Round($Report.RamGB,1)) Go de RAM : Flashback risque de crasher (ERR_MEM / Out of memory). Ferme TOUT le reste (navigateur, Discord en fenêtre...) et vérifie que le fichier d'échange est actif."
    } elseif ($Report.RamGB -lt 16) {
        Add-Rec 'ATTENTION' "$([math]::Round($Report.RamGB,1)) Go de RAM : jouable, mais ferme le navigateur et les apps lourdes avant de te connecter. 16 Go est le confort pour un serveur aussi mappé."
    } else {
        Add-Rec 'OK' "$([math]::Round($Report.RamGB,1)) Go de RAM : suffisant."
    }

    if ($Report.VramGB -gt 0 -and $Report.VramGB -lt 4) {
        Add-Rec 'CRITIQUE' "Carte graphique avec $([math]::Round($Report.VramGB,1)) Go de VRAM : textures en Normale OBLIGATOIRE, sinon la map va disparaître (texture loss)."
    } elseif ($Report.VramGB -gt 0 -and $Report.VramGB -lt 6) {
        Add-Rec 'ATTENTION' "$([math]::Round($Report.VramGB,1)) Go de VRAM : reste en textures Normale/Haute et n'augmente pas trop le budget textures étendu."
    } elseif ($Report.VramGB -ge 6) {
        Add-Rec 'OK' "$([math]::Round($Report.VramGB,1)) Go de VRAM : correct."
    } else {
        Add-Rec 'INFO' "VRAM non détectée : suis le profil 'Moyen' par défaut."
    }

    # Propriétés optionnelles (absentes des vieux rapports / des tests) : lecture tolérante.
    $opt = { param($n) $p = $Report.PSObject.Properties[$n]; if ($p) { $p.Value } else { $null } }
    $gpus = @(& $opt 'GpuNames' | Where-Object { $_ })
    if ($gpus.Count -gt 0 -and -not ($gpus | Where-Object { -not (Test-IsIntegratedGpu $_) })) {
        Add-Rec 'CRITIQUE' "Seule la puce graphique intégrée est active ($($gpus -join ' / ')). Sur un PC portable ASUS/MSI/Lenovo, repasse le mode GPU de 'Eco' à 'Standard/Ultimate' (Armoury Crate, MSI Center, Lenovo Vantage) et branche le chargeur."
    }

    $vendorApp = & $opt 'HasVendorControlApp'
    if ($vendorApp) {
        Add-Rec 'INFO' "Logiciel constructeur détecté ($vendorApp) : NE le ferme PAS, ouvre-le et mets le mode 'Turbo/Performance' + GPU 'Standard/Ultimate' (jamais 'Eco')."
    }

    if ($Report.FreeDiskGB -lt 10) {
        Add-Rec 'CRITIQUE' "Seulement $([math]::Round($Report.FreeDiskGB,1)) Go libres sur le disque de FiveM : le premier téléchargement des ressources Flashback peut échouer. Libère au moins 20-30 Go."
    } elseif ($Report.FreeDiskGB -lt 30) {
        Add-Rec 'ATTENTION' "$([math]::Round($Report.FreeDiskGB,1)) Go libres : un peu juste avec tout le mapping du serveur. Vise 30 Go libres."
    } else {
        Add-Rec 'OK' "$([math]::Round($Report.FreeDiskGB,1)) Go libres sur le disque : parfait."
    }

    if (-not $Report.PagefileAuto -and $Report.PagefileMB -eq 0) {
        Add-Rec 'CRITIQUE' "Fichier d'échange DÉSACTIVÉ : cause n°1 des crashs 'ERR_MEM_EMBEDDEDALLOC' sur les serveurs lourds. Réactive-le (Gestion automatique) — voir le guide."
    } elseif (-not $Report.PagefileAuto -and $Report.PagefileMB -lt 16384) {
        Add-Rec 'ATTENTION' "Fichier d'échange limité à $($Report.PagefileMB) Mo : mets-le en 'Gestion automatique' ou au moins 16 Go."
    }

    if ($Report.OnBattery) {
        Add-Rec 'ATTENTION' "PC portable sur batterie : branche le chargeur, sinon la carte graphique est bridée."
    }

    if (-not $Report.IsHighPerfPlan) {
        Add-Rec 'INFO' "Le mode d'alimentation n'est pas en 'Performances élevées' (l'option 2 du menu s'en charge)."
    }

    return $out
}

# --------------------------------------------------------------------------------------------
# Actions (effets de bord)
# --------------------------------------------------------------------------------------------

function Write-Title([string]$Text) {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor DarkCyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ('=' * 70) -ForegroundColor DarkCyan
}

function Write-Step([string]$Text, [string]$Color = 'Gray') { Write-Host "  > $Text" -ForegroundColor $Color }

function Test-FiveMRunning {
    $procs = Get-Process -ErrorAction SilentlyContinue | Where-Object { Test-IsFiveMProcessName $_.ProcessName }
    return [bool]$procs
}

function Clear-FiveMCache {
    <#
        Vide les dossiers de cache FiveM. Refuse de tourner si FiveM est ouvert.
        -IsRunning permet d'injecter la détection (tests).
    #>
    param(
        [Parameter(Mandatory)][string]$LocalAppData,
        [switch]$DryRun,
        [scriptblock]$IsRunning = { Test-FiveMRunning }
    )

    $paths = Get-FiveMPaths -LocalAppData $LocalAppData

    if (-not (Test-Path -LiteralPath $paths.App)) {
        return [pscustomobject]@{ Status = 'NotInstalled'; FreedBytes = 0; Cleared = @() }
    }
    if (& $IsRunning) {
        return [pscustomobject]@{ Status = 'FiveMRunning'; FreedBytes = 0; Cleared = @() }
    }

    $freed   = 0
    $cleared = New-Object System.Collections.Generic.List[string]
    foreach ($dir in $paths.Clearable) {
        if (-not (Test-Path -LiteralPath $dir)) { continue }

        # Garde-fou : on ne supprime jamais un chemin protégé ni rien hors de FiveM.app.
        $full = [System.IO.Path]::GetFullPath($dir)
        $appFull = [System.IO.Path]::GetFullPath($paths.App)
        if (-not $full.StartsWith($appFull, [System.StringComparison]::OrdinalIgnoreCase)) { continue }
        if ($paths.Protected | Where-Object { [System.IO.Path]::GetFullPath($_) -eq $full }) { continue }

        $size = Get-FolderSize $dir
        if (-not $DryRun) {
            # On vide le contenu mais on garde le dossier.
            Get-ChildItem -LiteralPath $dir -Force -ErrorAction SilentlyContinue |
                Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            $size = $size - (Get-FolderSize $dir)   # ce qui a vraiment été libéré
        }
        $freed += $size
        $cleared.Add($dir)
    }

    return [pscustomobject]@{ Status = 'OK'; FreedBytes = $freed; Cleared = $cleared.ToArray() }
}

function Invoke-ClearCache {
    Write-Title 'Nettoyage du cache FiveM'
    $r = Clear-FiveMCache -LocalAppData $LocalAppData -DryRun:$DryRun
    switch ($r.Status) {
        'NotInstalled' { Write-Step "FiveM introuvable dans $LocalAppData\FiveM. Installe-le depuis https://fivem.net" 'Yellow' }
        'FiveMRunning' { Write-Step 'FiveM est ouvert : ferme-le complètement (y compris dans la barre des tâches) puis relance.' 'Yellow' }
        'OK' {
            foreach ($d in $r.Cleared) { Write-Step "vidé : $d" }
            $verb = if ($DryRun) { 'serait libéré' } else { 'libéré' }
            Write-Step ("{0} {1}. game-storage conservé (pas de retéléchargement du jeu)." -f (Format-Size $r.FreedBytes), $verb) 'Green'
            Write-Step 'Le prochain chargement de Flashback sera plus long (retéléchargement des ressources) : c''est normal.' 'DarkYellow'
        }
    }
}

function Invoke-WindowsTweaks {
    Write-Title 'Optimisations Windows (réversibles)'

    # 1. Plan d'alimentation Performances élevées (SCHEME_MIN = alias officiel).
    if ($DryRun) { Write-Step '[simulation] powercfg /setactive SCHEME_MIN' }
    else {
        & powercfg.exe /setactive SCHEME_MIN 2>$null
        if ($LASTEXITCODE -eq 0) { Write-Step 'Plan d''alimentation : Performances élevées' 'Green' }
        else { Write-Step 'Plan Performances élevées indisponible (PC portable / Windows restreint) : ignoré.' 'Yellow' }
    }

    # 2. Mode Jeu Windows ON + 3. Enregistrement Xbox Game Bar en arrière-plan OFF.
    $regs = @(
        @{ Path = 'HKCU:\Software\Microsoft\GameBar'; Name = 'AutoGameModeEnabled'; Value = 1; Label = 'Mode Jeu Windows activé' },
        @{ Path = 'HKCU:\Software\Microsoft\GameBar'; Name = 'AllowAutoGameMode'; Value = 1; Label = $null },
        @{ Path = 'HKCU:\System\GameConfigStore'; Name = 'GameDVR_Enabled'; Value = 0; Label = 'Enregistrement Xbox Game Bar en arrière-plan désactivé' },
        @{ Path = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\GameDVR'; Name = 'AppCaptureEnabled'; Value = 0; Label = $null }
    )
    foreach ($r in $regs) {
        if ($DryRun) { Write-Step "[simulation] $($r.Path)\$($r.Name) = $($r.Value)"; continue }
        try {
            if (-not (Test-Path $r.Path)) { New-Item -Path $r.Path -Force | Out-Null }
            New-ItemProperty -Path $r.Path -Name $r.Name -Value $r.Value -PropertyType DWord -Force | Out-Null
            if ($r.Label) { Write-Step $r.Label 'Green' }
        } catch {
            Write-Step "Impossible de régler $($r.Name) : $($_.Exception.Message)" 'Yellow'
        }
    }
}

function Get-VramGB {
    # Win32_VideoController.AdapterRAM plafonne à 4 Go : on lit d'abord la valeur 64 bits du registre.
    $best = 0
    try {
        $key = 'HKLM:\SYSTEM\ControlSet001\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}'
        Get-ChildItem $key -ErrorAction Stop | Where-Object { $_.PSChildName -match '^\d{4}$' } | ForEach-Object {
            $v = (Get-ItemProperty $_.PSPath -Name 'HardwareInformation.qwMemorySize' -ErrorAction SilentlyContinue).'HardwareInformation.qwMemorySize'
            if ($v -and [double]$v -gt $best) { $best = [double]$v }
        }
    } catch { }
    if ($best -eq 0) {
        try {
            Get-CimInstance Win32_VideoController -ErrorAction Stop | ForEach-Object {
                if ([double]$_.AdapterRAM -gt $best) { $best = [double]$_.AdapterRAM }
            }
        } catch { }
    }
    return [math]::Round($best / 1GB, 1)
}

function Get-SystemReport {
    $os   = Get-CimInstance Win32_OperatingSystem
    $cs   = Get-CimInstance Win32_ComputerSystem
    $gpus = @(Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })
    $drive = (Split-Path -Qualifier $LocalAppData).TrimEnd(':')
    $disk = Get-PSDrive -Name $drive -ErrorAction SilentlyContinue
    $pf   = @(Get-CimInstance Win32_PageFileSetting -ErrorAction SilentlyContinue)
    $bat  = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
    $plan = (& powercfg.exe /getactivescheme 2>$null) -join ' '
    $procNames = @(Get-Process -ErrorAction SilentlyContinue | ForEach-Object { $_.ProcessName })
    $vendor = @(
        @{ Name = 'Armoury Crate (ASUS)';     Pattern = '^(ArmouryCrate|ArmourySocketServer|AsusOptimization)' },
        @{ Name = 'MSI Center';               Pattern = '^MSI[._ ]?Cent' },
        @{ Name = 'Lenovo Vantage';           Pattern = '^(LenovoVantage|LegionZone)' },
        @{ Name = 'OMEN Gaming Hub (HP)';     Pattern = '^(OmenCommandCenter|OmenGamingHub)' },
        @{ Name = 'Alienware Command Center'; Pattern = '^AWCC' }
    ) | Where-Object { $pat = $_.Pattern; $procNames -match $pat } | Select-Object -First 1
    if (-not $vendor -and (Get-Service -Name 'ArmouryCrateService' -ErrorAction SilentlyContinue)) { $vendor = @{ Name = 'Armoury Crate (ASUS)' } }

    [pscustomobject]@{
        Windows        = "$($os.Caption) ($($os.BuildNumber))"
        CPU            = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name.Trim()
        GPU            = ($gpus -join ' / ')
        GpuNames       = $gpus
        HasVendorControlApp = if ($vendor) { $vendor.Name } else { $null }
        RamGB          = [math]::Round($cs.TotalPhysicalMemory / 1GB, 1)
        RamLibreGB     = [math]::Round($os.FreePhysicalMemory * 1KB / 1GB, 1)
        VramGB         = Get-VramGB
        FreeDiskGB     = if ($disk) { [math]::Round($disk.Free / 1GB, 1) } else { 0 }
        PagefileAuto   = [bool]$cs.AutomaticManagedPagefile
        PagefileMB     = [int](($pf | Measure-Object -Property MaximumSize -Sum).Sum)
        OnBattery      = [bool]($bat -and $bat.BatteryStatus -eq 1)
        IsHighPerfPlan = [bool]($plan -match '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c|e9a42b02-d5df-448d-aa00-03f14749eb61')
    }
}

function Invoke-Analysis {
    Write-Title 'Analyse de ton PC + réglages conseillés'
    $rep = Get-SystemReport
    Write-Step "Windows : $($rep.Windows)"
    Write-Step "CPU     : $($rep.CPU)"
    Write-Step "GPU     : $($rep.GPU) ($($rep.VramGB) Go VRAM)"
    Write-Step "RAM     : $($rep.RamGB) Go (libre maintenant : $($rep.RamLibreGB) Go)"
    Write-Host ''

    foreach ($rec in Get-Recommendations -Report $rep) {
        $color = switch ($rec.Niveau) { 'CRITIQUE' { 'Red' } 'ATTENTION' { 'Yellow' } 'OK' { 'Green' } default { 'Gray' } }
        Write-Host ("  [{0}] {1}" -f $rec.Niveau, $rec.Conseil) -ForegroundColor $color
    }

    $vram = if ($rep.VramGB -gt 0) { $rep.VramGB } else { 6 }
    $settings = Get-RecommendedSettings -VramGB $vram -RamGB $rep.RamGB
    Write-Host ''
    Write-Host '  Réglages GTA V (Paramètres > Graphismes) conseillés pour TON PC :' -ForegroundColor Cyan
    foreach ($k in $settings.Keys) { Write-Host ('    {0,-34} {1}' -f $k, $settings[$k]) }

    # Sauvegarde du rapport à côté du script.
    $file = Join-Path $PSScriptRoot 'rapport-fivem.txt'
    $lines = @("Rapport FiveM / Flashback FA - $(Get-Date -Format 'dd/MM/yyyy HH:mm')", '')
    $lines += ($rep | Format-List | Out-String).Trim()
    $lines += '', 'Conseils :'
    $lines += (Get-Recommendations -Report $rep | ForEach-Object { "[$($_.Niveau)] $($_.Conseil)" })
    $lines += '', 'Reglages GTA V conseilles :'
    $lines += ($settings.Keys | ForEach-Object { '{0,-34} {1}' -f $_, $settings[$_] })
    if (-not $DryRun) {
        try { $lines | Set-Content -LiteralPath $file -Encoding UTF8; Write-Step "Rapport enregistré : $file" 'Green' } catch { }
    }
}

function Show-TopMemoryApps {
    Write-Title 'Applications qui mangent ta RAM en ce moment'
    Get-Process -ErrorAction SilentlyContinue |
        Group-Object ProcessName |
        ForEach-Object { [pscustomobject]@{ App = $_.Name; RAM = ($_.Group | Measure-Object WorkingSet64 -Sum).Sum } } |
        Sort-Object RAM -Descending | Select-Object -First 8 |
        ForEach-Object { Write-Step ('{0,-30} {1}' -f $_.App, (Format-Size $_.RAM)) }
    Write-Step 'Ferme ce qui ne sert pas (navigateur surtout) AVANT de rejoindre Flashback.' 'Yellow'
}

function Start-FiveMBoosted {
    Write-Title 'Lancement de FiveM (priorité haute automatique)'
    $paths = Get-FiveMPaths -LocalAppData $LocalAppData
    if (-not (Test-Path -LiteralPath $paths.Exe)) {
        Write-Step "FiveM.exe introuvable ($($paths.Exe)). Installe FiveM depuis https://fivem.net" 'Red'
        return
    }
    if ($DryRun) { Write-Step "[simulation] lancement de $($paths.Exe)"; return }

    Start-Process -FilePath $paths.Exe
    Write-Step 'FiveM démarre... connecte-toi à Flashback FA comme d''habitude.' 'Green'
    Write-Step 'En attente du processus du jeu pour le passer en priorité haute (10 min max)...'

    $deadline = (Get-Date).AddMinutes(10)
    while ((Get-Date) -lt $deadline) {
        $gta = Get-Process -ErrorAction SilentlyContinue | Where-Object { Test-IsGtaProcessName $_.ProcessName }
        if ($gta) {
            foreach ($p in $gta) {
                try { $p.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::High; Write-Step "$($p.ProcessName) -> priorité HAUTE" 'Green' }
                catch { Write-Step "Priorité non modifiable : $($_.Exception.Message)" 'Yellow' }
            }
            return
        }
        Start-Sleep -Seconds 3
    }
    Write-Step 'Jeu non détecté après 10 min : priorité inchangée (pas grave).' 'Yellow'
}

function Invoke-DefenderExclusion {
    Write-Title 'Exclusion antivirus Windows Defender (optionnel)'
    Write-Step 'Accélère le chargement des milliers de fichiers de cache. Nécessite les droits admin.'
    Write-Step 'Le dossier FiveM ne sera plus scanné en temps réel : ne mets JAMAIS de fichiers douteux dedans.' 'Yellow'
    $ok = Read-Host '  Confirmer ? (o/n)'
    if ($ok -notmatch '^[oOyY]') { Write-Step 'Annulé.'; return }
    $root = (Get-FiveMPaths -LocalAppData $LocalAppData).Root
    if ($DryRun) { Write-Step "[simulation] Add-MpPreference -ExclusionPath '$root'"; return }
    try {
        Start-Process powershell.exe -Verb RunAs -Wait -ArgumentList @(
            '-NoProfile', '-Command', "Add-MpPreference -ExclusionPath '$root'"
        )
        Write-Step "Exclusion ajoutée pour $root" 'Green'
    } catch { Write-Step "Refusé ou impossible : $($_.Exception.Message)" 'Yellow' }
}

function Invoke-All {
    Invoke-ClearCache
    Invoke-WindowsTweaks
    Invoke-Analysis
    Show-TopMemoryApps
    Start-FiveMBoosted
}

function Show-Menu {
    while ($true) {
        Write-Title 'KIT FIVEM - FLASHBACK FA   (anti-bug / anti-lag)'
        if ($DryRun) { Write-Host '  *** MODE SIMULATION : rien ne sera modifié ***' -ForegroundColor Magenta }
        Write-Host '  1. TOUT FAIRE puis lancer FiveM (recommandé)' -ForegroundColor Green
        Write-Host '  2. Vider le cache FiveM (à faire après chaque grosse MAJ du serveur)'
        Write-Host '  3. Optimisations Windows (perfs élevées, Mode Jeu, Game Bar off)'
        Write-Host '  4. Analyser mon PC + réglages GTA conseillés'
        Write-Host '  5. Voir les applis qui mangent la RAM'
        Write-Host '  6. Lancer FiveM avec priorité haute'
        Write-Host '  7. Exclure FiveM de Windows Defender (optionnel, admin)'
        Write-Host '  0. Quitter'
        switch (Read-Host "`n  Ton choix") {
            '1' { Invoke-All }
            '2' { Invoke-ClearCache }
            '3' { Invoke-WindowsTweaks }
            '4' { Invoke-Analysis }
            '5' { Show-TopMemoryApps }
            '6' { Start-FiveMBoosted }
            '7' { Invoke-DefenderExclusion }
            '0' { return }
            default { Write-Step 'Choix invalide.' 'Yellow' }
        }
        Read-Host "`n  Appuie sur Entrée pour revenir au menu" | Out-Null
    }
}

# --------------------------------------------------------------------------------------------
# Point d'entrée (ignoré quand le script est chargé par les tests avec ". .\Optimiser-FiveM.ps1")
# --------------------------------------------------------------------------------------------
if ($MyInvocation.InvocationName -eq '.') { return }

if (-not $LocalAppData) {
    Write-Host 'Ce script est fait pour Windows (variable LOCALAPPDATA introuvable).' -ForegroundColor Red
    exit 1
}

if ($Auto) { Invoke-All } else { Show-Menu }
