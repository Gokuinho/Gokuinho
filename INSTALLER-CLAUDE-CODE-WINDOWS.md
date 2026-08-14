# Donner à Claude l'accès à ton PC (Windows)

Ce guide explique comment installer **Claude Code** directement sur ta machine Windows,
pour que Claude puisse lire tes fichiers, lancer des commandes et travailler sur tes
projets en local — au lieu de tourner dans un conteneur cloud isolé.

---

## ⚠️ Ce que ça implique vraiment

Avant de commencer, comprends bien ce que tu autorises :

| Ce que Claude Code **peut** faire | Ce qu'il **ne peut pas** faire |
| --- | --- |
| Lire et modifier les fichiers du dossier où tu le lances | Voir ton écran ou bouger ta souris |
| Exécuter des commandes dans le terminal | Agir quand la session est fermée |
| Installer des dépendances, lancer des tests, faire des commits | Sortir des permissions que tu accordes |
| Accéder à Internet pour de la doc | Se connecter tout seul à d'autres machines |

**Point clé :** Claude Code demande ta validation avant chaque action sensible (écriture
de fichier, commande shell). Tu gardes la main. Ce n'est pas une prise de contrôle à
distance : c'est un assistant qui travaille dans le dossier que tu lui ouvres.

**Bonne pratique :** lance-le depuis un dossier de projet précis (ex. `C:\Users\Toi\Projets\monsite`),
jamais depuis la racine `C:\` ou depuis ton dossier utilisateur entier.

---

## Prérequis

- Windows 10 (build 1809+) ou Windows 11
- 4 Go de RAM minimum, processeur x64 ou ARM64
- Un abonnement **Claude Pro, Max, Team ou Enterprise** (le plan gratuit ne donne pas
  accès à Claude Code) — ou une clé API Console
- Une connexion Internet

---

## Option A — L'application Desktop (le plus simple, sans terminal)

Si tu n'es pas à l'aise avec la ligne de commande, commence par là.

1. Télécharge l'app depuis **https://claude.com/download**
2. Installe-la, lance-la, connecte-toi avec ton compte Claude
3. Ouvre un dossier de projet et discute avec Claude — il agit sur tes fichiers réels

C'est la même chose que Claude Code, avec une interface graphique.

---

## Option B — Installation en ligne de commande (recommandé pour développer)

### 1. Installer Git for Windows (optionnel mais recommandé)

Télécharge et installe depuis **https://git-scm.com/downloads/win**

Sans Git for Windows, Claude Code utilise PowerShell pour exécuter des commandes.
Avec, il utilise Git Bash — plus complet, et la plupart des outils de dev le supposent.
Tu n'as pas besoin de l'exécuter en tant qu'administrateur.

### 2. Installer Claude Code

Ouvre **PowerShell** (touche Windows → tape `PowerShell` → Entrée) et colle :

```powershell
irm https://claude.ai/install.ps1 | iex
```

> Si tu préfères l'invite de commandes **CMD** (le prompt affiche `C:\` sans `PS` devant) :
> ```batch
> curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
> ```
>
> Erreur `'irm' is not recognized` → tu es dans CMD, utilise la commande CMD.
> Erreur `The token '&&' is not a valid statement separator` → tu es dans PowerShell,
> utilise la commande PowerShell.

Alternative avec WinGet (mais **pas de mise à jour automatique**) :

```powershell
winget install Anthropic.ClaudeCode
```

### 3. Vérifier l'installation

Ferme puis rouvre ton terminal, et lance :

```powershell
claude --version
```

Tu dois voir un numéro de version, du type `2.1.211 (Claude Code)`.

Pour un diagnostic complet (santé de l'install, erreurs de config) :

```powershell
claude doctor
```

### 4. Se connecter

Place-toi dans un dossier de projet et lance Claude :

```powershell
cd C:\Users\TonNom\Projets\mon-projet
claude
```

Au premier lancement, ton navigateur s'ouvre pour l'authentification. Suis les étapes,
et c'est bon — Claude travaille désormais sur ta machine.

---

## Récupérer ce dépôt en local

Une fois Claude Code installé, tu peux cloner ce projet et bosser dessus en local :

```powershell
cd C:\Users\TonNom\Projets
git clone https://github.com/Gokuinho/Gokuinho.git
cd Gokuinho
claude
```

---

## Configuration utile

### Si Claude Code ne trouve pas Git Bash

Crée ou édite `%USERPROFILE%\.claude\settings.json` :

```json
{
  "env": {
    "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"
  }
}
```

### Canal de mise à jour

Les installations natives se mettent à jour automatiquement en arrière-plan.
Pour privilégier la stabilité plutôt que la nouveauté :

```json
{
  "autoUpdatesChannel": "stable"
}
```

Le canal `stable` a environ une semaine de retard et évite les versions à régressions.
Le canal `latest` (par défaut) livre chaque nouveauté immédiatement.

Mise à jour manuelle immédiate : `claude update`

---

## Native Windows ou WSL ?

| Option | Nécessite | Sandboxing | Quand l'utiliser |
| --- | --- | --- | --- |
| **Windows natif** | Rien (Git for Windows optionnel) | Non supporté | Projets et outils Windows |
| **WSL 2** | WSL 2 activé | Supporté | Toolchains Linux, exécution sandboxée |
| **WSL 1** | WSL 1 activé | Non supporté | Si WSL 2 indisponible |

Pour du web (HTML/CSS/JS comme ce dépôt), le **Windows natif suffit largement**.
Si tu veux la sécurité du sandboxing — les commandes s'exécutent isolées du reste du
système — passe par WSL 2 et installe avec `curl -fsSL https://claude.ai/install.sh | bash`
depuis le terminal WSL.

---

## Désinstaller

Si tu changes d'avis :

```powershell
Remove-Item -Path "$env:USERPROFILE\.local\bin\claude.exe" -Force
Remove-Item -Path "$env:USERPROFILE\.local\share\claude" -Recurse -Force
```

Et pour supprimer aussi la configuration et l'historique des sessions :

```powershell
Remove-Item -Path "$env:USERPROFILE\.claude" -Recurse -Force
Remove-Item -Path "$env:USERPROFILE\.claude.json" -Force
```

(Si tu as installé via WinGet : `winget uninstall Anthropic.ClaudeCode`)

---

## Ressources

- Installation détaillée : https://code.claude.com/docs/en/setup
- Démarrage rapide : https://code.claude.com/docs/en/quickstart
- Guide du terminal (si tu débutes) : https://code.claude.com/docs/en/terminal-guide
- Dépannage installation : https://code.claude.com/docs/en/troubleshoot-install
- Permissions et sécurité : https://code.claude.com/docs/en/permissions
