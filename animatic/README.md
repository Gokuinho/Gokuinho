# ITSGOK — couche d'animation pour l'animatic

L'animatic d'origine enchaîne 24 cartes en fondu. Ce dossier ajoute la partie
« animée » : montage, mouvements de caméra, parallaxe, mise en scène des
personnages et synchronisation avec les dialogues — **sans toucher au moteur
de lecture, aux voix, aux SFX ni aux images**.

| Fichier | Rôle |
| --- | --- |
| `motion.css` | Toutes les animations (transitions, caméra, étalonnage, overlays). |
| `motion.js` | Se branche seule sur les scènes et déclenche la bonne mise en scène. |
| `demo.html` | Démo autonome : mêmes 24 scènes, décors et personnages dessinés en CSS. |

## Brancher la couche sur ton fichier

Pose `motion.css` et `motion.js` à côté de ton fichier HTML, puis ajoute deux
lignes.

Dans le `<head>`, **après** ton `<style>` existant :

```html
<link rel="stylesheet" href="motion.css" />
```

Juste avant `</body>`, **après** le `<script>` qui construit les scènes :

```html
<script src="motion.js"></script>
```

C'est tout. Rien d'autre à modifier : la couche repère les éléments `.scene`,
attend qu'ils passent en `.active` et fait le reste.

> Si tu tiens à garder un seul fichier, colle le contenu de `motion.css` dans
> ton `<style>` et celui de `motion.js` dans un nouveau `<script>` en fin de
> `<body>`. L'ordre compte : la couche doit venir en dernier.

## Ce que ça ajoute

**Montage.** Chaque type de scène a sa transition d'entrée : cut sec sur les
gags (`toilet`, `hair`, `cindydoor`), whip-pan sur la panique, travelling
avant sur les moments intimes (`kiss`, `door`, `prayer`), contre-plongée sur
les plans héroïques (`champion`, `ready`), ouverture à l'iris sur `epic`,
`awake` et `final`, poussée latérale sur les déplacements (`corridor`,
`gaming`, `bathroom`).

**Caméra vivante.** Aucun plan n'est figé : zoom lent, panoramique, caméra à
l'épaule sur les scènes nerveuses, tremblement sur `panic` et `power`. Le
décor est déplacé dans un plan séparé qui bouge deux fois moins vite que les
sujets — c'est ce qui donne la profondeur.

**Mise en scène.** À l'entrée d'une scène, les personnages et accessoires
apparaissent en décalé (0,11 s d'écart), avec un léger dépassement, puis
gardent une respiration permanente.

**Dialogue.** `speechSynthesis.speak()` est enveloppé (pas réécrit) pour
savoir qui parle : celui qui parle rebondit et s'éclaire, l'autre recule et
se désature. Si la synthèse vocale est coupée, un observateur du DOM prend le
relais à partir de la réplique affichée.

**Étalonnage.** Une teinte par humeur : chaud sur le bisou, désaturé et
contrasté sur la tension, rouge sur la panique, doré sur les plans héroïques,
froid sur le setup. Cache scope 2.35:1 qui se ferme sur les plans « ciné ».

**Finitions.** Grain animé, voile de fondu au noir sur les cuts, flash sur les
impacts, et synchronisation avec le sélecteur 1× / 2× / 4× (les animations
accélèrent avec la lecture).

`prefers-reduced-motion: reduce` désactive tout le mouvement.

## Régler la mise en scène

Tout se pilote depuis la table `SHOTS`, en haut de `motion.js` — une ligne par
type de scène :

```js
panic: { in: 'whip', amb: 'shake', mood: 'panic' },
```

- `in` — `fade`, `cut`, `snap`, `pushL`, `pushR`, `dollyIn`, `tiltUp`, `whip`, `iris`
- `amb` — `driftIn`, `driftOut`, `panL`, `panR`, `float`, `handheld`, `shake`
- `mood` — `calm`, `warm`, `tense`, `panic`, `comic`, `run`, `hero`, `cool`
- `wide: true` — ferme le cache scope · `dip: true` — fondu au noir · `flash: true` — flash

Un type absent de la table retombe sur `fade` + `driftIn`.

## Voir la démo

Ouvre `demo.html` dans un navigateur (ou sers le dossier :
`python3 -m http.server` puis `http://localhost:8000/animatic/demo.html`).

Les personnages y sont dessinés en CSS et réellement animés : cycles de marche
et de course, position assise, bras levés, tremblement de panique, clignement
des yeux. Les textes sont des **placeholders** — seule la mise en mouvement
est représentative. Ton animatic garde ses vrais dialogues et ses vraies
images ; la démo sert à juger la caméra et le rythme.
