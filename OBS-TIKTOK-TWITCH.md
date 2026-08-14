# Config OBS — Twitch + TikTok Live (simulcast)

Configuration de référence pour un setup double sortie : canvas horizontal vers
Twitch, canvas vertical vers TikTok via le plugin **Aitum Vertical**.

## Matériel de référence

| Composant | Valeur |
| --- | --- |
| GPU | GeForce RTX 4070 Ti SUPER (16 Go) — 2 encodeurs NVENC |
| Pilote NVIDIA | 610.88 WHQL (22/07/2026) |
| Réseau | Intel Wi-Fi 6E AX211, 5 GHz, 802.11ax, RSSI -55 dBm |
| OBS | 32.1.2 + plugin Aitum Vertical |

Deux encodeurs NVENC = les deux flux s'encodent en parallèle sur du silicium
dédié, sans impact sur les FPS en jeu. **La contrainte n'est pas le GPU, c'est
l'upload.**

---

## ⚠️ Règle n°1 : les bitrates s'additionnent

En simulcast, tu n'envoies pas un flux mais deux, simultanément.

```
Total = bitrate Twitch + bitrate TikTok + 2 × 160 kbps (audio)
```

**Ne dépasse jamais 50 % de ton upload mesuré.** La marge absorbe les variations
du réseau, Windows Update, Discord, et les pics d'encodage sur scènes chargées.

Mesure ton upload réel sur [fast.com](https://fast.com) → « Show more info » →
chiffre **Upload**. Le débit de liaison WiFi (1441 Mbps) n'a rien à voir : c'est
le lien PC ↔ box, pas le lien vers Internet.

---

## Les trois modes

### Mode A — Twitch seul (horizontal)

| Réglage | Valeur |
| --- | --- |
| Canvas base / sortie | 1920 x 1080 |
| FPS | 60 |
| Encodeur | NVIDIA NVENC H.264 (`obs_nvenc_h264_tex`) |
| Contrôle du débit | CBR |
| Bitrate | 6000 kbps |
| Keyframe | 2 s |

6000 kbps est le plafond pratique pour un compte non-partenaire Twitch.
Monter au-dessus n'améliore rien et risque le rejet.

### Mode B — TikTok seul (vertical)

Le canvas principal **reste en 1920x1080**. Tout se règle dans le dock Aitum
Vertical — ne touche pas aux paramètres vidéo globaux d'OBS.

| Réglage | Valeur |
| --- | --- |
| Canvas vertical | 1080 x 1920 |
| Encodeur | **NVENC H.264** — explicitement |
| Contrôle du débit | CBR |
| Bitrate | 6000 kbps |
| Keyframe | 2 s |

**TikTok refuse le HEVC en RTMP.** Si `stream_encoder` est laissé vide, le
plugin prend l'encodeur par défaut, qui peut être du HEVC — le flux est alors
rejeté ou coupé. Force H.264 à la main.

### Mode C — Simulcast Twitch + TikTok

Prends la ligne correspondant à ton upload mesuré :

| Upload mesuré | Twitch | TikTok | Total réseau |
| --- | --- | --- | --- |
| ≥ 30 Mbps | 6000 | 6000 | ≈ 12,3 Mbps |
| 20 – 30 Mbps | 5000 | 4500 | ≈ 9,8 Mbps |
| 15 – 20 Mbps | 4000 | 3000 | ≈ 7,3 Mbps |
| 10 – 15 Mbps | 2500 | 2000 | ≈ 4,8 Mbps |
| < 10 Mbps | Simulcast déconseillé — un seul flux à la fois | | |

En dessous de 15 Mbps, la bonne réponse n'est pas de rogner les réglages mais de
passer par un service de restream côté cloud : tu envoies un flux unique, leur
infrastructure duplique vers les deux plateformes.

---

## Réglages NVENC détaillés

Identiques pour les deux flux. Paramètres → Sortie → mode **Avancé**.

| Réglage | Valeur | Pourquoi |
| --- | --- | --- |
| Encodeur | NVIDIA NVENC H.264 | Encodage matériel, CPU libre pour le jeu |
| Contrôle du débit | CBR | Exigé par les plateformes RTMP |
| Intervalle d'image clé | 2 s | En dessous, TikTok peut couper le flux |
| Préréglage | P5 : Slow (Quality) | Bon compromis qualité / latence |
| Réglage | High Quality | |
| Multipass | Two Passes (Quarter Res) | Gratuit en pratique sur Ada |
| Profil | high | |
| Look-ahead | Désactivé | Source d'instabilité en live |
| Psycho Visual Tuning | Activé | Gain visible sur les scènes chargées |
| Images B max | 2 | |

### Vidéo (global)

- Filtre de mise à l'échelle : **Lanczos**
- Format vidéo : **NV12** · Espace **Rec. 709** · Plage **Partielle**

### Audio

- **128–160 kbps**, 48 kHz, stéréo
- Chaîne micro, dans l'ordre : Filtre de bruit (RNNoise) → Compresseur (4:1) →
  Limiteur (-6 dB)
- Voix en crête à **-6 dB** ; jeu à **-15 à -20 dB** sous la voix

### Avancé

- Priorité du processus : **Au-dessus de la normale**

---

## Réseau — le point le plus important

### Canal DFS

La carte est en 5 GHz sur le **canal 124**, qui appartient à la plage DFS
(100–144), partagée avec les radars météo et aéronautiques.

Comportement imposé par la réglementation : si la box détecte un radar, elle
**doit quitter le canal sous 10 secondes** et ne peut y revenir avant 30 minutes.
En plein live, c'est une coupure sèche — et rien dans les logs OBS ne l'explique.

**Correctif :** dans l'interface de la box, passer le canal 5 GHz de « Auto » à
une valeur fixe **non-DFS** :

- Bande basse : **36, 40, 44, 48**
- Bande haute : **149, 153, 157, 161** (souvent moins encombrée)

### 6 GHz

La carte AX211 est **6E**, donc capable de 6 GHz — bande sans DFS ni voisinage.
Le 6 GHz **exige WPA3** ; la connexion actuelle est en WPA2, ce qui explique
qu'elle reste en 5 GHz. Si la box propose WPA3, l'activer donne la meilleure
configuration possible sans câble.

### Ethernet

Reste l'option la plus fiable pour du simulcast. Même un câble qui traîne par
terre bat le meilleur WiFi sur la stabilité en continu.

---

## Test avant un vrai live

1. Ouvrir le dock **Statistiques** (Affichage → Docks → Statistiques)
2. Lancer les deux flux vers des lives en privé / non listés
3. Jouer **15 minutes** sur une scène chargée, pas 30 secondes au menu

Ce qu'il faut lire :

| Indicateur | Seuil acceptable |
| --- | --- |
| Images perdues (réseau) | **0,0 %** — toute valeur > 0 signale un upload saturé |
| Images perdues (encodage) | 0 % — si > 0, baisser le préréglage à P4 |
| Images perdues (rendu) | 0 % — si > 0, c'est le GPU qui sature, pas le réseau |

Des frames perdues côté réseau ne se corrigent jamais par un réglage d'encodeur :
il faut baisser le bitrate ou fiabiliser la connexion.

---

## Layout vertical TikTok

```
┌─────────────────┐  1080 x 1920
│    FACECAM      │  haut  · ~1080x600
├─────────────────┤
│    GAMEPLAY     │  centre · 1080x608 (16:9 pleine largeur)
├─────────────────┤
│  zone réservée  │  bas · ~1080x700 — LAISSER VIDE
│   UI TikTok     │  commentaires, cadeaux, boutons
└─────────────────┘
```

Deux erreurs classiques :

- **Contenu important en bas.** L'interface TikTok recouvre le tiers inférieur.
- **Gameplay en timbre-poste.** Mieux vaut rogner sur la zone d'action (clic
  droit sur la source → Transformer → Modifier la transformation) que d'afficher
  tout l'écran en miniature.

Sur TikTok, le visage retient davantage que le gameplay : facecam grande et en
haut.

---

## Sécurité

- **Ne jamais partager une clé de stream** — elle permet à quiconque de diffuser
  sur le compte. La saisir directement dans l'interface OBS, pas dans un fichier
  partagé.
- `basic.ini` et `service.json` contiennent les tokens et clés **en clair**.
  C'est le fonctionnement normal d'OBS, mais ces fichiers ne doivent jamais être
  partagés ni capturés à l'écran.
- Penser à reconnecter le compte Twitch quand les docks chat et statistiques
  cessent de se charger : le token OAuth a expiré.
