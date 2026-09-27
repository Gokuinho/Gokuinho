'use strict';

/**
 * État du live : tout ce que l'overlay affiche et que la télécommande modifie.
 * Toutes les entrées extérieures passent par `sanitizePatch` / `applyPatch`,
 * pour qu'une requête mal formée ne puisse jamais casser l'affichage en direct.
 */

const MODES = ['starting', 'live', 'intro', 'pause', 'ending'];
const LAYOUTS = ['classic', 'full'];
const GOAL_SOURCES = ['likes', 'followers', 'manual'];
const ALERT_TYPES = ['follow', 'gift', 'share', 'like', 'custom'];

const LIMITS = {
  short: 40,
  medium: 80,
  long: 280,
  traits: 4,
  ticker: 8,
  tickerItem: 120,
};

function defaultState() {
  return {
    mode: 'starting',
    layout: 'classic',
    webcam: true,
    guides: false,
    server: {
      name: 'Mon Serveur RP',
      tagline: 'Serveur FiveM français',
      discord: '',
    },
    streamer: {
      handle: '',
    },
    character: {
      name: 'Tony Moreno',
      age: '32 ans',
      job: 'Mécano / garage de Paleto',
      faction: 'Civil',
      origin: 'Marseille → Los Santos',
      bio: "Arrivé à Los Santos avec 200 $ et une vieille Blista. Il répare tout ce qui roule… et pose peu de questions.",
      traits: ['Loyal', 'Tête brûlée', 'Bon mécano'],
      quote: 'Ici, tout se paie. Même le silence.',
    },
    objective: 'Première journée en ville : trouver un job',
    ticker: [
      'Abonne-toi pour suivre l’histoire de Tony 🔔',
      'Pose tes questions sur le perso dans le chat 💬',
      'Partage le live à un pote qui kiffe le RP 🚗',
    ],
    goal: {
      label: 'Objectif likes',
      current: 0,
      target: 10000,
      source: 'likes',
    },
    countdownEnd: null,
    pauseMessage: 'Scène RP en cours… je reviens tout de suite !',
    endingMessage: 'Merci d’être passé ! On se retrouve au prochain live 🔥',
    pinned: null,
    accent: '#ff2d6f',
    stats: {
      viewers: 0,
      likes: 0,
      followers: 0,
      shares: 0,
      gifts: 0,
    },
  };
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function cleanString(v, max) {
  if (typeof v !== 'string' && typeof v !== 'number') return undefined;
  // Retire les caractères de contrôle (sauf retours à la ligne) et limite la longueur.
  return String(v)
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

function cleanInt(v, { min = 0, max = 1e12 } = {}) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function cleanEnum(v, allowed) {
  return allowed.includes(v) ? v : undefined;
}

function cleanBool(v) {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

function cleanColor(v) {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : undefined;
}

function cleanList(v, maxItems, maxLen) {
  let arr = v;
  if (typeof arr === 'string') arr = arr.split('\n');
  if (!Array.isArray(arr)) return undefined;
  return arr
    .map((s) => cleanString(s, maxLen))
    .filter((s) => s)
    .slice(0, maxItems);
}

function cleanHandle(v) {
  const s = cleanString(v, 64);
  if (s === undefined) return undefined;
  // Accepte "@pseudo", "pseudo" ou l'URL complète tiktok.com/@pseudo(/live).
  const m = s.match(/@([A-Za-z0-9._]+)/);
  const handle = m ? m[1] : s.replace(/^@/, '');
  return /^[A-Za-z0-9._]{0,32}$/.test(handle) ? handle : undefined;
}

function cleanPinned(v) {
  if (v === null) return null;
  if (!isPlainObject(v)) return undefined;
  const text = cleanString(v.text, LIMITS.long);
  if (!text) return undefined;
  return { user: cleanString(v.user, LIMITS.short) || 'viewer', text };
}

/** Assainit un objet partiel. Les clés inconnues ou invalides sont ignorées. */
function sanitizePatch(input) {
  const out = {};
  if (!isPlainObject(input)) return out;

  const set = (key, value) => {
    if (value !== undefined) out[key] = value;
  };

  set('mode', cleanEnum(input.mode, MODES));
  set('layout', cleanEnum(input.layout, LAYOUTS));
  set('webcam', cleanBool(input.webcam));
  set('guides', cleanBool(input.guides));
  set('objective', cleanString(input.objective, LIMITS.medium));
  set('ticker', cleanList(input.ticker, LIMITS.ticker, LIMITS.tickerItem));
  set('pauseMessage', cleanString(input.pauseMessage, LIMITS.medium));
  set('endingMessage', cleanString(input.endingMessage, LIMITS.medium));
  set('accent', cleanColor(input.accent));
  set('pinned', cleanPinned(input.pinned));

  if ('countdownEnd' in input) {
    set('countdownEnd', input.countdownEnd === null ? null : cleanInt(input.countdownEnd, { min: 0, max: 8.64e15 }));
  }

  if (isPlainObject(input.server)) {
    const s = {};
    const name = cleanString(input.server.name, LIMITS.short);
    const tagline = cleanString(input.server.tagline, LIMITS.medium);
    const discord = cleanString(input.server.discord, LIMITS.short);
    if (name !== undefined) s.name = name;
    if (tagline !== undefined) s.tagline = tagline;
    if (discord !== undefined) s.discord = discord;
    if (Object.keys(s).length) out.server = s;
  }

  if (isPlainObject(input.streamer)) {
    const handle = cleanHandle(input.streamer.handle);
    if (handle !== undefined) out.streamer = { handle };
  }

  if (isPlainObject(input.character)) {
    const c = {};
    for (const key of ['name', 'age', 'job', 'faction', 'origin']) {
      const v = cleanString(input.character[key], LIMITS.short);
      if (v !== undefined) c[key] = v;
    }
    const bio = cleanString(input.character.bio, LIMITS.long);
    const quote = cleanString(input.character.quote, LIMITS.medium);
    const traits = cleanList(input.character.traits, LIMITS.traits, 24);
    if (bio !== undefined) c.bio = bio;
    if (quote !== undefined) c.quote = quote;
    if (traits !== undefined) c.traits = traits;
    if (Object.keys(c).length) out.character = c;
  }

  if (isPlainObject(input.goal)) {
    const g = {};
    const label = cleanString(input.goal.label, LIMITS.short);
    const current = cleanInt(input.goal.current);
    const target = cleanInt(input.goal.target, { min: 1 });
    const source = cleanEnum(input.goal.source, GOAL_SOURCES);
    if (label !== undefined) g.label = label;
    if (current !== undefined) g.current = current;
    if (target !== undefined) g.target = target;
    if (source !== undefined) g.source = source;
    if (Object.keys(g).length) out.goal = g;
  }

  if (isPlainObject(input.stats)) {
    const st = {};
    for (const key of ['viewers', 'likes', 'followers', 'shares', 'gifts']) {
      const v = cleanInt(input.stats[key]);
      if (v !== undefined) st[key] = v;
    }
    if (Object.keys(st).length) out.stats = st;
  }

  return out;
}

function deepMerge(target, patch) {
  const result = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    result[key] = isPlainObject(value) && isPlainObject(target[key]) ? deepMerge(target[key], value) : value;
  }
  return result;
}

/** Retourne un nouvel état = état courant + patch assaini. */
function applyPatch(state, input) {
  const next = deepMerge(state, sanitizePatch(input));
  return syncGoal(next);
}

/** Si l'objectif suit une stat TikTok, recopie la valeur. */
function syncGoal(state) {
  const { goal, stats } = state;
  if (goal.source === 'likes' && goal.current !== stats.likes) {
    return { ...state, goal: { ...goal, current: stats.likes } };
  }
  if (goal.source === 'followers' && goal.current !== stats.followers) {
    return { ...state, goal: { ...goal, current: stats.followers } };
  }
  return state;
}

/** Recharge un état sauvegardé en le repassant par la validation. */
function restoreState(saved) {
  return applyPatch(defaultState(), saved);
}

/** Assainit une alerte (follow, cadeau…) avant de la diffuser à l'overlay. */
function sanitizeAlert(input) {
  if (!isPlainObject(input)) return null;
  const type = cleanEnum(input.type, ALERT_TYPES) || 'custom';
  const user = cleanString(input.user, LIMITS.short) || '';
  const text = cleanString(input.text, LIMITS.medium) || '';
  const amount = cleanInt(input.amount, { min: 1, max: 100000 });
  if (!user && !text) return null;
  const alert = { type, user, text };
  if (amount !== undefined) alert.amount = amount;
  return alert;
}

function sanitizeChat(input) {
  if (!isPlainObject(input)) return null;
  const text = cleanString(input.text, LIMITS.long);
  if (!text) return null;
  return {
    user: cleanString(input.user, LIMITS.short) || 'viewer',
    nickname: cleanString(input.nickname, LIMITS.short) || '',
    text,
  };
}

module.exports = {
  MODES,
  LAYOUTS,
  GOAL_SOURCES,
  ALERT_TYPES,
  LIMITS,
  defaultState,
  sanitizePatch,
  applyPatch,
  restoreState,
  sanitizeAlert,
  sanitizeChat,
  cleanHandle,
};
