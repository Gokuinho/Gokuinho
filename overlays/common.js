/* ============================================================
   Socle commun aux overlays ItsGokTV
   - construit le fond animé (obliques rouges)
   - fournit les icônes réseaux et les icônes de panneaux
   - lit les paramètres passés dans l'URL
   ============================================================ */

const Q = new URLSearchParams(location.search);

/** Valeur d'un paramètre d'URL, avec repli. */
function param(key, fallback) {
  const v = Q.get(key);
  return (v === null || v === '') ? fallback : v;
}

/* ---------- Icônes (SVG inline, aucune requête réseau) ---------- */
const ICONS = {
  tiktok:    '<svg viewBox="0 0 24 24"><path d="M16.6 5.8a5 5 0 0 1-1.2-3.3h-3.3v13.2a2.8 2.8 0 1 1-2-2.7V9.6a6.1 6.1 0 1 0 5.3 6V9.1a8.3 8.3 0 0 0 4.8 1.5V7.3a5 5 0 0 1-3.6-1.5z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 3.3.15 4.8 1.7 5 5 .06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.15 3.3-1.7 4.8-5 5-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-3.3-.15-4.8-1.7-5-5C2.07 15.6 2.06 15.2 2.06 12s0-3.6.07-4.9c.15-3.3 1.7-4.8 5-5C8.4 2.2 8.8 2.2 12 2.2zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.1-8.3a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3z"/></svg>',
  youtube:   '<svg viewBox="0 0 24 24"><path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5C.5 9.4.5 12 .5 12s0 2.6.5 4.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.5.5-4.5s0-2.6-.5-4.5zM9.8 15.4V8.6l5.9 3.4-5.9 3.4z"/></svg>',
  twitch:    '<svg viewBox="0 0 24 24"><path d="M4.3 1.7 2 6.2v14.1h5v3h3.7l3-3h4.1L23 18V1.7H4.3zm16.8 15.4-3.4 3.4h-4.9l-3 3v-3H5V3.6h16.1v13.5zM17 7.1v6.4h-2V7.1h2zm-5.3 0v6.4h-2V7.1h2z"/></svg>',
  star:      '<svg viewBox="0 0 24 24"><path d="m12 2 3 6.6 7 .9-5.2 4.9 1.4 7L12 18l-6.2 3.4 1.4-7L2 9.5l7-.9L12 2z"/></svg>',
  heart:     '<svg viewBox="0 0 24 24"><path d="M12 21s-8.5-5.3-8.5-11A4.9 4.9 0 0 1 12 6.6 4.9 4.9 0 0 1 20.5 10c0 5.7-8.5 11-8.5 11z"/></svg>',
  dollar:    '<svg viewBox="0 0 24 24"><path d="M13 2v2.3c2.5.3 4.2 1.7 4.4 4h-2.7c-.2-1-1-1.7-2.6-1.7-1.6 0-2.6.7-2.6 1.8 0 1 .7 1.5 3 2 3.4.7 5.1 1.8 5.1 4.4 0 2.4-1.8 4-4.6 4.4V21h-2v-2.3c-2.8-.3-4.7-1.9-4.9-4.4h2.8c.2 1.2 1.2 2 3.1 2 1.8 0 2.8-.8 2.8-1.9 0-1-.6-1.6-3.1-2.1-3.4-.7-5-1.9-5-4.4 0-2.3 1.8-3.9 4.3-4.3V2h2z"/></svg>',
  diamond:   '<svg viewBox="0 0 24 24"><path d="M12 2 22 12 12 22 2 12 12 2z"/></svg>',
  chat:      '<svg viewBox="0 0 24 24"><path d="M21 4H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4v4l5-4h9a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/></svg>'
};

/* ---------- Fond animé ---------- */
/* Chaque oblique a sa largeur, sa position et son décalage d'animation :
   le motif ne se répète jamais à l'identique. */
const STREAKS = [
  { x: 4,  w: 210, t: 'dark', d: -6  },
  { x: 16, w: 46,  t: 'lite', d: -2  },
  { x: 22, w: 120, t: 'dark', d: -11 },
  { x: 33, w: 26,  t: 'lite', d: -14 },
  { x: 39, w: 300, t: 'dark', d: -4  },
  { x: 57, w: 70,  t: 'lite', d: -9  },
  { x: 64, w: 18,  t: 'lite', d: -17 },
  { x: 70, w: 180, t: 'dark', d: -1  },
  { x: 82, w: 40,  t: 'lite', d: -13 },
  { x: 90, w: 96,  t: 'dark', d: -7  }
];

function mountStage(target) {
  const host = target || document.body;
  const stage = document.createElement('div');
  stage.className = 'stage';

  const base = document.createElement('div');
  base.className = 'base';

  const wrap = document.createElement('div');
  wrap.className = 'streaks';
  for (const s of STREAKS) {
    const el = document.createElement('div');
    el.className = 'streak ' + s.t;
    el.style.left = s.x + '%';
    el.style.width = s.w + 'px';
    el.style.animationDelay = s.d + 's';
    wrap.appendChild(el);
  }

  const vig = document.createElement('div');
  vig.className = 'vignette';

  stage.append(base, wrap, vig);
  host.prepend(stage);
}

/* ---------- Application des paramètres d'URL ---------- */
/* Tout élément portant data-p="clef" reçoit la valeur du paramètre. */
function applyParams() {
  document.querySelectorAll('[data-p]').forEach(el => {
    const v = Q.get(el.dataset.p);
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-icon]').forEach(el => {
    el.innerHTML = ICONS[el.dataset.icon] || '';
  });
  const accent = Q.get('accent');
  if (accent) {
    const hex = '#' + accent.replace('#', '');
    document.documentElement.style.setProperty('--red-500', hex);
    document.documentElement.style.setProperty('--red-600', hex);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  mountStage();
  applyParams();
});
