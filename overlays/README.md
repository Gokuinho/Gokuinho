# Overlays verticaux ItsGokTV — 1080 × 1920

Déclinaison 9:16 de l'identité rouge et noir des overlays Twitch : obliques
animées, typographie condensée massive, cadres à coins entaillés, panneaux
d'activité. Cinq écrans à ajouter dans OBS en **source navigateur**, plus un
calque de repérage.

| Fichier | Scène | Rôle |
| --- | --- | --- |
| `v-jeu.html` | V-Jeu | Cadres gameplay + webcam, panneaux follower/abonné, bandeau du jeu |
| `v-parler.html` | V-Parler | Webcam plein cadre, sujet du moment, réseaux |
| `v-debut.html` | V-Début | Compte à rebours avec jauge |
| `v-pause.html` | V-Pause | « Je reviens / Tout de suite » |
| `v-fin.html` | V-Fin | « Le stream / Se termine » + appel à l'abonnement |
| `safe-zone.html` | *(outil)* | Calque de repérage des zones TikTok |

Fichiers communs : `theme.css` (palette, typo, composants) et `common.js`
(fond animé, icônes SVG, paramètres d'URL).

---

## Installation dans OBS

Pour chaque scène verticale, dans le dock **Aitum Vertical** :

1. **+** → **Navigateur**
2. Coche **Fichier local**, puis sélectionne le fichier `.html`
3. **Largeur `1080`**, **Hauteur `1920`**
4. Coche **Fermer la source quand elle est invisible** — libère le CPU sur les
   scènes inactives
5. **OK**, puis place la source **tout en bas** de la liste : c'est le fond, tes
   sources vidéo passent par-dessus

---

## Positions à respecter

Les cadres sont dessinés autour de ces rectangles. Si tu déplaces une source,
modifie les variables `:root` en haut du fichier concerné pour que le liseré suive.

**V-Jeu**

| Source | Position | Taille |
| --- | --- | --- |
| Capture de jeu 2 | `0, 270` | `1080 × 608` |
| Webcam | `40, 1020` | `700 × 394` |

**V-Parler**

| Source | Position | Taille |
| --- | --- | --- |
| Webcam | `40, 420` | `840 × 472` |

Toutes les valeurs tiennent dans la zone exploitable TikTok : `y` entre 250 et
1420, `x` sous 880. Seul le gameplay de V-Jeu occupe la largeur complète — ses
bords droits passent sous la colonne de boutons TikTok, ce qui est le compromis
habituel en vertical. Si le HUD de ton jeu est collé au bord droit, réduis
`--game-w` à `880px`.

---

## Personnalisation

### Par l'URL, sans ouvrir les fichiers

Ajoute les paramètres au chemin de la source navigateur :

```
v-jeu.html?jeu=FiveM&follower=greatace_xset
v-debut.html?min=5
v-pause.html?sous=Je reviens dans 5 minutes
v-parler.html?sujet=Vos questions
v-fin.html?accent=1E90FF
```

| Paramètre | Effet | Fichiers |
| --- | --- | --- |
| `name` | Pseudo du bandeau | tous sauf `v-jeu` |
| `accent` | Couleur dominante, hexa sans `#` | tous |
| `jeu` | Bandeau vertical du jeu | `v-jeu` |
| `follower`, `abonne` | Valeurs des panneaux | `v-jeu` |
| `sujet` | Ligne « On parle de » | `v-parler` |
| `sous` | Sous-titre | `v-debut`, `v-pause`, `v-fin` |
| `min` | Durée du compte à rebours, en minutes | `v-debut` |
| `twitch`, `instagram`, `youtube` | Pseudos réseaux | `v-parler`, `v-pause`, `v-fin` |

### Palette

Les variables en haut de `theme.css` pilotent les six écrans d'un coup :

```css
--ink:     #0A0406;   /* noir de fond   */
--red-500: #D91F35;   /* rouge principal */
--hot:     #FF5C74;   /* rouge vif des obliques */
```

### Panneaux d'activité en temps réel

Les panneaux `Dernier follower` / `Dernier abonné` de `v-jeu.html` affichent une
valeur statique passée par l'URL. Pour qu'ils se mettent à jour tout seuls, garde
plutôt tes widgets 6klabs ou StreamElements en source navigateur par-dessus — ils
sont déjà connectés à ton compte. Les panneaux d'ici servent de repli, ou de
gabarit visuel si tu veux recréer les tiens au même format.

---

## Le calque de repérage

`safe-zone.html` affiche en rouge les zones recouvertes par l'interface TikTok
(bandeau haut, colonne de boutons, commentaires), en vert la zone exploitable, et
une graduation tous les 100 px.

Place-le **tout en haut** de la scène pendant le réglage, lance un live en privé,
compare avec ton téléphone — puis **décoche la source avant de partir en direct**.

---

## Polices

Les titres utilisent **Anton** et **Barlow Condensed**, chargées depuis Google
Fonts. Si le réseau est indisponible au démarrage d'OBS, le repli est
`Haettenschweiler` puis `Impact`, présentes sur Windows : le rendu reste
condensé et lourd, très proche.

Pour supprimer toute dépendance réseau, télécharge les deux polices, installe-les
sur Windows et retire la ligne `@import` en tête de `theme.css`.

---

## Voir le rendu sans OBS

Double-clique sur un `.html` : il s'ouvre dans ton navigateur. Réduis le zoom à
50 % (`Ctrl` + `-`) pour voir les 1920 px de haut d'un coup.
