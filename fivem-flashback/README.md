# Kit FiveM — Flashback FA (anti-bug / anti-lag)

Flashback FA est un serveur **très chargé** : environ 1 500 joueurs le soir, énormément de scripts, et beaucoup de mapping et de décors, donc de longs chargements. Ce kit sert à éviter les problèmes classiques de ce type de serveur :

- la map qui disparaît ou le sol invisible (*texture loss*) ;
- les crashs (`ERR_MEM`, `ERR_GFX`, *game crashed*) ;
- le chargement bloqué ;
- les chutes de FPS.

---

## ⚡ En 2 minutes (à faire à chaque fois avant de jouer)

1. **Télécharge le dossier** `fivem-flashback` sur ton PC Windows.
2. **Ferme FiveM** complètement, y compris l'icône près de l'horloge.
3. **Double-clique sur `Lancer-Kit-FiveM.bat`**, puis choisis **1 (TOUT FAIRE)**. Le kit :
   - vide le cache FiveM **sans** supprimer `game-storage` : tu ne retélécharges pas le jeu ;
   - passe Windows en *Performances élevées*, active le *Mode Jeu* et coupe l'enregistrement en arrière-plan de la Xbox Game Bar ;
   - analyse ton PC (RAM, carte graphique, disque, fichier d'échange, mode Eco des portables) et affiche **les réglages GTA adaptés à ta machine**, enregistrés aussi dans `rapport-fivem.txt` ;
   - liste les applis qui consomment ta RAM ;
   - lance FiveM et met le jeu en **priorité haute** dès qu'il démarre.
4. Connecte-toi à Flashback FA et **ne fais pas Alt+Tab pendant le chargement**.

> Pour voir ce que le kit ferait sans rien modifier, lance `Optimiser-FiveM.ps1 -DryRun`.
> Si Windows affiche « Windows a protégé votre PC », clique sur **Informations complémentaires** puis **Exécuter quand même**. Le script est lisible en clair : ouvre-le avec le Bloc-notes pour vérifier ce qu'il fait.

---

## 💻 PC portable (ASUS, MSI, Lenovo, HP) : LE point le plus important

**Ne ferme pas** Armoury Crate, MSI Center, Lenovo Vantage ou OMEN Hub. Ouvre-le et règle :

| Réglage | Valeur |
|---|---|
| Mode de fonctionnement | **Turbo** (ou Performance) |
| Mode GPU | **Standard** ou **Ultimate / dGPU** — **jamais Eco** |
| Alimentation | **Chargeur branché** |

En mode **Eco**, la carte graphique NVIDIA/AMD est **éteinte** et le jeu tourne sur la puce intégrée : FPS très bas et map qui ne charge pas. Le kit détecte ce cas et affiche une alerte **CRITIQUE**.

Dans **Paramètres Windows → Système → Affichage → Graphiques**, ajoute `FiveM.exe` et `FiveM_GTAProcess` s'ils apparaissent, puis choisis **Hautes performances**.

---

## 🧹 Quoi fermer avant de lancer

| Fermer ✅ | Garder ❌ |
|---|---|
| Navigateurs (Chrome, Opera GX, Edge) : les plus gros consommateurs de RAM | Services Windows, `svchost`, `System` |
| Steam, Epic, Battle.net, Riot/Vanguard (garde Steam **seulement** si ton GTA V vient de Steam) | Windows Defender |
| Overlays : Discord (*Paramètres → Overlay du jeu → OFF*), NVIDIA, Xbox Game Bar | Pilotes audio / graphiques |
| OneDrive, Spotify, logiciels RGB tiers (iCUE…) | Armoury Crate / logiciel constructeur (à régler, voir ci-dessus) |
| | Discord lui-même (pour le vocal), sans l'overlay |

---

## ⚙️ Réglages FiveM (Échap → Paramètres, ou menu d'accueil FiveM)

- **Canal de mise à jour : `Release`**. Évite *Beta* et *Latest* : moins stables.
- **Budget de textures étendu (Extended Texture Budget)** :
  - 4 Go de VRAM ou moins : 0 à 25 % ;
  - 6 à 8 Go : environ 50 % ;
  - 10 Go ou plus : 100 %.

  Trop haut sur une petite carte graphique = crash « out of video memory ». Le kit te donne la bonne valeur.
- **Pas de ReShade / NVE / pack graphique** tant que tout ne tourne pas parfaitement : c'est la première source de crash sur les serveurs lourds.

## 🎮 Réglages GTA V (Paramètres → Graphismes)

Le kit calcule ton profil automatiquement. Règles valables pour tout le monde :

- **Version DirectX : 11** (DX12 = plus de crashs sous FiveM).
- **Qualité des textures** : ne dépasse **jamais** ta VRAM. La jauge de mémoire en haut du menu GTA doit rester sous le maximum. C'est LA cause de la *texture loss*.
- **Échelle de distance** et **Distance étendue (avancé)** : à garder basses. Avec autant de mapping, ce sont elles qui saturent la mémoire.
- **Qualité de l'herbe** : Normale ou Haute. Ultra divise les FPS.
- **MSAA : désactivé**, **FXAA : activé**.
- **Streaming haute qualité en vol : désactivé** si ton PC est modeste.

| Profil | Carte graphique | Textures | Ombres | Distance | Budget textures FiveM |
|---|---|---|---|---|---|
| Faible | ≤ 4 Go ou RAM < 12 Go | Normale | Normale | 0–20 % | 0–25 % |
| Moyen | 6–8 Go | Haute | Haute | 30–50 % | 50 % |
| Élevé | ≥ 10 Go et RAM ≥ 24 Go | Très haute | Très haute | 70–100 % | 100 % |

## 🖥️ Windows (une seule fois)

1. **Pilote graphique à jour** : NVIDIA App / AMD Adrenalin / Intel. Prends la version complète, pas celle de Windows Update.
2. **Fichier d'échange ACTIF** : *Paramètres avancés du système → Performances → Paramètres → Avancé → Mémoire virtuelle → « Gérer automatiquement »*. Le désactiver est la cause n°1 des crashs `ERR_MEM_EMBEDDEDALLOC` sur les serveurs lourds.
3. **Au moins 30 Go libres** sur le disque de FiveM, idéalement un SSD.
4. **Planification GPU à accélération matérielle** : *Paramètres → Système → Affichage → Graphiques → Paramètres graphiques par défaut*. Active-la si le jeu saccade, sinon laisse par défaut.
5. **Connexion par câble** plutôt qu'en Wi-Fi si possible : moins de « timed out » en pleine scène.

---

## 🩺 Problèmes courants → solution

| Symptôme | Solution |
|---|---|
| Sol ou bâtiments invisibles, textures floues ou qui clignotent (*texture loss*) | Baisse **Qualité des textures** et **Distance étendue**, baisse le **budget textures étendu** si ta VRAM est petite, puis relance. |
| Bloqué sur l'écran de chargement / « Awaiting scripts » | Premier chargement : **attends** (5 à 15 min, beaucoup de ressources). Si ça dure plus : menu **2 (vider le cache)** et relance. |
| `ERR_MEM_EMBEDDEDALLOC_ALLOC` / *Out of memory* | Réactive le **fichier d'échange**, ferme le navigateur, profil textures plus bas. |
| `ERR_GFX_D3D_INIT` / `ERR_GFX_STATE` | **DirectX 11**, pilote graphique à jour, ReShade retiré, mode GPU **pas en Eco**. |
| « Server → client connection timed out » | Câble plutôt que Wi-Fi, ferme les téléchargements (Steam, OneDrive), vide le cache. |
| Crash après une mise à jour du serveur | Menu **2 (vider le cache)** : les vieux fichiers entrent en conflit avec les nouveaux. |
| FPS très bas sur un portable | Chargeur branché, **Turbo** + **GPU Standard/Ultimate** dans Armoury Crate / MSI Center. |
| Écran noir en rejoignant | Alt+Entrée une fois, ou passe GTA en *Plein écran fenêtré*. |

Crash encore après tout ça ? Sur l'écran d'erreur FiveM, clique **« Save information »** et envoie le fichier au support sur le Discord Flashback : [discord.gg/flashbackfa](https://discord.gg/flashbackfa).

> ⚠️ N'installe **jamais** de « mod menu » ou de « cheat » vu sur TikTok : c'est un ban définitif, et souvent un virus.

---

## 🧪 Pour les curieux : tests

Le script est couvert par 45 tests automatiques (Pester) : le nettoyage ne touche jamais `game-storage`, ni `CitizenFX.ini`, ni `plugins` ; il refuse de tourner si FiveM est ouvert ; il détecte le mode Eco ; il calcule les profils ; les fichiers ont le bon encodage.

```powershell
Install-Module Pester -Scope CurrentUser -Force   # une seule fois
Invoke-Pester -Path .\tests -Output Detailed
```

| Fichier | Rôle |
|---|---|
| `Lancer-Kit-FiveM.bat` | Double-clic, lance le script |
| `Optimiser-FiveM.ps1` | Le kit (menu, `-Auto`, `-DryRun`) |
| `tests/Optimiser-FiveM.Tests.ps1` | Tests automatiques |
| `rapport-fivem.txt` | Créé après l'analyse : ton diagnostic et tes réglages |
