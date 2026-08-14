# Overlays verticaux TikTok — 1080 × 1920

Six fichiers HTML à ajouter dans OBS en **source navigateur**. Aucune dépendance
externe : pas de CDN, pas de police à télécharger, tout est local. Les animations
n'utilisent que `transform` et `opacity`, donc elles tournent sur le GPU et ne
coûtent quasiment rien en CPU — important quand quatre encodages tournent déjà.

| Fichier | Scène | Rôle |
| --- | --- | --- |
| `v-jeu.html` | V-Jeu | Fond + cadres pour le gameplay et la webcam |
| `v-parler.html` | V-Parler | Webcam plein cadre + sujet du moment |
| `v-debut.html` | V-Début | Écran d'attente avec compte à rebours animé |
| `v-pause.html` | V-Pause | Écran de pause |
| `v-fin.html` | V-Fin | Écran de fin + appel à l'abonnement |
| `safe-zone.html` | *(outil)* | Calque de repérage des zones TikTok |

---

## Installation dans OBS

Pour chaque scène verticale, dans le dock **Aitum Vertical** :

1. **+** → **Navigateur**
2. Coche **Fichier local**, puis sélectionne le fichier `.html`
3. **Largeur `1080`**, **Hauteur `1920`**
4. Coche **Fermer la source quand elle est invisible** — libère le CPU sur les
   scènes inactives
5. **OK**, puis place la source **tout en bas** de la liste (c'est le fond)

Ensuite, ajoute par-dessus tes sources vidéo (`Capture de jeu 2`, `Webcam`) aux
positions indiquées ci-dessous.

---

## Positions à respecter

Les cadres dessinés dans `v-jeu.html` supposent ces coordonnées. Si tu déplaces
une source, modifie les variables en haut du fichier pour que le liseré suive.

**V-Jeu**

| Source | Position | Taille |
| --- | --- | --- |
| Capture de jeu 2 | `0, 250` | `1080 × 608` |
| Webcam | `40, 1040` | `480 × 270` |

**V-Parler**

| Source | Position | Taille |
| --- | --- | --- |
| Webcam | `0, 400` | `1080 × 608` |

> La webcam de V-Jeu a été agrandie (`480 × 270` au lieu de `432 × 243`) et
> remontée à `y = 1040`. Son bord bas tombe ainsi à `1310`, avec 110 px de marge
> avant la zone des commentaires — au lieu d'être à la limite.

---

## Personnalisation

### Par l'URL, sans éditer les fichiers

Ajoute des paramètres à la fin du chemin dans la source navigateur :

```
v-jeu.html?name=itsgoktv&titre=FiveM · RP
v-debut.html?min=5&name=itsgoktv
v-pause.html?sous=Je reviens dans 5 minutes
v-parler.html?sujet=Vos questions&tiktok=@itsgoktv
```

| Paramètre | Effet | Fichiers |
| --- | --- | --- |
| `name` | Pseudo affiché | tous |
| `accent` | Couleur d'accent, en hexa sans `#` (ex. `accent=F43F5E`) | tous |
| `titre` | Ligne « En direct » | `v-jeu` |
| `sujet` | Ligne « On parle de » | `v-parler` |
| `sous` | Sous-titre | `v-debut`, `v-pause`, `v-fin` |
| `min` | Durée du compte à rebours, en minutes | `v-debut` |
| `twitch`, `tiktok` | Pseudos des réseaux | `v-parler`, `v-pause`, `v-fin` |

### En profondeur

Ouvre `theme.css` : les trois premières variables suffisent à changer toute
l'identité visuelle des six écrans d'un coup.

```css
--accent:   #8B5CF6;   /* violet principal */
--accent-2: #22D3EE;   /* cyan secondaire  */
--bg:       #0A0A0F;   /* fond profond     */
```

---

## L'outil de repérage

`safe-zone.html` est le fichier le plus utile de tous, et il ne sert qu'une fois.

Ajoute-le **tout en haut** de ta scène verticale : il affiche en rouge les trois
zones recouvertes par l'interface TikTok (bandeau haut, colonne de boutons à
droite, commentaires en bas), en vert la zone réellement exploitable, et une
graduation tous les 100 px pour positionner tes sources au pixel près.

Lance un live en privé, compare avec ton téléphone, ajuste — puis **décoche la
source avant de partir en direct**.

Ces limites sont fiables comme point de départ, mais l'interface TikTok varie
légèrement selon la taille d'écran du spectateur. Rien ne remplace une
vérification sur ton propre live.

---

## Vérifier le rendu sans OBS

Double-clique simplement sur un fichier `.html` : il s'ouvre dans ton navigateur.
Réduis le zoom à 50 % (`Ctrl` + `-`) pour voir les 1920 px de haut d'un coup.
