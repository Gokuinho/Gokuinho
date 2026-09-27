'use strict';

/**
 * Serveur local du kit live GTA RP × TikTok.
 *
 *   /           télécommande (PC ou téléphone sur le même Wi-Fi)
 *   /overlay    overlay vertical 9:16 (source « Lien » dans TikTok LIVE Studio)
 *   /chat       chat TikTok + lecture vocale (2e écran ou téléphone)
 *
 * Aucune dépendance obligatoire : Node.js ≥ 18 suffit.
 */

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { URL } = require('url');

const { MODES, defaultState, applyPatch, restoreState, sanitizeAlert, sanitizeChat } = require('./lib/state');
const { createTikTokBridge } = require('./lib/tiktok-bridge');

const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY = 64 * 1024;
const CHAT_HISTORY = 60;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const ROUTES = {
  '/': 'control.html',
  '/control': 'control.html',
  '/overlay': 'overlay.html',
  '/chat': 'chat.html',
};

function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
  }
  return out;
}

function createApp(options = {}) {
  const dataDir = options.dataDir || path.join(__dirname, 'data');
  const stateFile = path.join(dataDir, 'state.json');
  const pin = options.pin || '';
  const log = options.log || console;

  let state = defaultState();
  try {
    state = restoreState(JSON.parse(fs.readFileSync(stateFile, 'utf8')));
  } catch (_) {
    /* premier lancement ou fichier illisible : valeurs par défaut */
  }
  // Les stats sont propres à un live : on repart de zéro à chaque démarrage.
  state = applyPatch(state, { stats: { viewers: 0, likes: 0, followers: 0, shares: 0, gifts: 0 } });

  const chatHistory = [];
  const clients = new Set();
  let saveTimer = null;
  let bridgeStatus = { state: 'idle', handle: '', message: 'Chat TikTok non connecté' };

  function persist() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      const { stats, pinned, ...toSave } = state;
      try {
        fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(stateFile, JSON.stringify(toSave, null, 2));
      } catch (err) {
        log.warn(`[save] ${err.message}`);
      }
    }, options.saveDelay ?? 300);
    if (saveTimer.unref) saveTimer.unref();
  }

  function broadcast(event, payload) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of clients) res.write(msg);
  }

  function update(patch, { save = true } = {}) {
    state = applyPatch(state, patch);
    broadcast('state', state);
    if (save) persist();
    return state;
  }

  function pushAlert(input) {
    const alert = sanitizeAlert(input);
    if (!alert) return null;
    alert.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    broadcast('alert', alert);
    return alert;
  }

  function pushChat(input) {
    const msg = sanitizeChat(input);
    if (!msg) return null;
    msg.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    msg.at = Date.now();
    chatHistory.push(msg);
    if (chatHistory.length > CHAT_HISTORY) chatHistory.shift();
    broadcast('chat', msg);
    return msg;
  }

  function bumpStat(key, by) {
    update({ stats: { [key]: (state.stats[key] || 0) + by } }, { save: false });
  }

  const bridge = (options.createBridge || createTikTokBridge)({
    apiKey: options.eulerApiKey,
    log,
    onStatus(s) {
      bridgeStatus = s;
      broadcast('tiktok', s);
    },
    onAction(action) {
      if (action.kind === 'chat') pushChat(action.chat);
      if (action.kind === 'alert') {
        pushAlert(action.alert);
        if (action.stat) bumpStat(action.stat[0], action.stat[1]);
      }
      if (action.kind === 'stats') update({ stats: action.stats }, { save: false });
    },
  });

  function authorized(req, url) {
    if (!pin) return true;
    return req.headers['x-live-pin'] === pin || url.searchParams.get('pin') === pin;
  }

  function sendJson(res, code, body) {
    res.writeHead(code, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      let size = 0;
      let tooBig = false;
      const chunks = [];
      req.on('data', (c) => {
        if (tooBig) return; // on vide le flux sans le garder, puis on répond 413
        size += c.length;
        if (size > MAX_BODY) {
          tooBig = true;
          chunks.length = 0;
          reject(Object.assign(new Error('Requête trop volumineuse'), { status: 413 }));
          return;
        }
        chunks.push(c);
      });
      req.on('end', () => {
        if (tooBig) return;
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        if (!raw) return resolve({});
        try {
          resolve(JSON.parse(raw));
        } catch (_) {
          reject(Object.assign(new Error('JSON invalide'), { status: 400 }));
        }
      });
      req.on('error', reject);
    });
  }

  function serveStatic(res, pathname) {
    const rel = ROUTES[pathname] || pathname.replace(/^\/+/, '');
    const file = path.resolve(PUBLIC_DIR, rel);
    if (!file.startsWith(PUBLIC_DIR + path.sep)) return sendJson(res, 403, { error: 'Interdit' });
    fs.readFile(file, (err, buf) => {
      if (err) return sendJson(res, 404, { error: 'Introuvable' });
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(buf);
    });
  }

  function openEventStream(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 2000\n\n');
    res.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
    res.write(`event: tiktok\ndata: ${JSON.stringify(bridgeStatus)}\n\n`);
    res.write(`event: history\ndata: ${JSON.stringify(chatHistory)}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
  }

  async function handleApi(req, res, url) {
    const { pathname } = url;
    const method = req.method;

    if (method === 'GET' && pathname === '/api/events') return openEventStream(req, res);
    if (method === 'GET' && pathname === '/api/state') return sendJson(res, 200, state);
    if (method === 'GET' && pathname === '/api/info') {
      return sendJson(res, 200, {
        port: options.port,
        lan: lanAddresses().map((ip) => `http://${ip}:${options.port}/`),
        pinRequired: Boolean(pin),
        tiktok: bridgeStatus,
        modes: MODES,
      });
    }
    if (method === 'GET' && pathname === '/api/chat') return sendJson(res, 200, chatHistory);

    if (!['POST', 'PATCH', 'PUT'].includes(method)) return sendJson(res, 405, { error: 'Méthode non autorisée' });
    if (!authorized(req, url)) return sendJson(res, 401, { error: 'Code PIN requis' });

    if (pathname === '/api/state') {
      const body = await readBody(req);
      return sendJson(res, 200, update(body));
    }

    const modeMatch = pathname.match(/^\/api\/mode\/([a-z]+)$/);
    if (modeMatch) {
      const mode = modeMatch[1];
      if (!MODES.includes(mode)) return sendJson(res, 400, { error: `Mode inconnu (${MODES.join(', ')})` });
      const patch = { mode };
      // Le compte à rebours de démarrage repart pour 5 minutes par défaut.
      if (mode === 'starting' && !(state.countdownEnd > Date.now())) patch.countdownEnd = Date.now() + 5 * 60 * 1000;
      return sendJson(res, 200, update(patch));
    }

    if (pathname === '/api/countdown') {
      const body = await readBody(req);
      const minutes = Number(body.minutes);
      if (!Number.isFinite(minutes) || minutes < 0 || minutes > 180) {
        return sendJson(res, 400, { error: 'minutes doit être entre 0 et 180' });
      }
      return sendJson(res, 200, update({ countdownEnd: minutes === 0 ? null : Date.now() + minutes * 60 * 1000 }));
    }

    if (pathname === '/api/alert') {
      const alert = pushAlert(await readBody(req));
      return alert ? sendJson(res, 200, alert) : sendJson(res, 400, { error: 'Alerte vide' });
    }

    if (pathname === '/api/chat') {
      const msg = pushChat(await readBody(req));
      return msg ? sendJson(res, 200, msg) : sendJson(res, 400, { error: 'Message vide' });
    }

    if (pathname === '/api/pin') {
      const body = await readBody(req);
      return sendJson(res, 200, update({ pinned: body && body.text ? body : null }, { save: false }));
    }

    if (pathname === '/api/stats/reset') {
      return sendJson(res, 200, update({ stats: { viewers: 0, likes: 0, followers: 0, shares: 0, gifts: 0 }, goal: { current: 0 } }));
    }

    if (pathname === '/api/reset') {
      state = defaultState();
      broadcast('state', state);
      persist();
      return sendJson(res, 200, state);
    }

    if (pathname === '/api/tiktok/connect') {
      const body = await readBody(req);
      if (body.handle !== undefined) update({ streamer: { handle: body.handle } });
      bridge.connect(state.streamer.handle);
      return sendJson(res, 200, bridge.status());
    }

    if (pathname === '/api/tiktok/disconnect') {
      bridge.disconnect();
      return sendJson(res, 200, bridge.status());
    }

    return sendJson(res, 404, { error: 'Route API inconnue' });
  }

  const server = http.createServer((req, res) => {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch (_) {
      return sendJson(res, 400, { error: 'URL invalide' });
    }
    if (url.pathname.startsWith('/api/')) {
      handleApi(req, res, url).catch((err) => {
        if (!res.headersSent) sendJson(res, err.status || 500, { error: err.message });
      });
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Méthode non autorisée' });
    return serveStatic(res, decodeURIComponent(url.pathname));
  });

  // Commentaire SSE régulier : garde la connexion ouverte à travers proxys et veille.
  const heartbeat = setInterval(() => {
    for (const res of clients) res.write(': ping\n\n');
  }, 15000);
  heartbeat.unref();

  function close(cb) {
    clearInterval(heartbeat);
    bridge.disconnect();
    for (const res of clients) res.end();
    clients.clear();
    server.close(cb);
  }

  return {
    server,
    bridge,
    close,
    getState: () => state,
    flush() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      const { stats, pinned, ...toSave } = state;
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(stateFile, JSON.stringify(toSave, null, 2));
    },
  };
}

function main() {
  const port = Number(process.env.PORT) || 7777;
  const host = process.env.HOST || '0.0.0.0';
  const app = createApp({
    port,
    pin: process.env.LIVE_PIN || '',
    eulerApiKey: process.env.EULER_API_KEY || undefined,
  });

  app.server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Le port ${port} est déjà utilisé. Le kit tourne peut-être déjà, ou lance avec PORT=7778.\n`);
      process.exit(1);
    }
    throw err;
  });

  app.server.listen(port, host, () => {
    const local = `http://localhost:${port}`;
    const lan = lanAddresses();
    console.log('\n🎮  Kit live GTA RP × TikTok prêt !\n');
    console.log(`   Télécommande     ${local}/`);
    console.log(`   Overlay          ${local}/overlay     (source « Lien » dans TikTok LIVE Studio)`);
    console.log(`   Chat + vocal     ${local}/chat`);
    if (lan.length) console.log(`\n   📱 Sur ton téléphone (même Wi-Fi) : http://${lan[0]}:${port}/`);
    if (!process.env.LIVE_PIN && lan.length) {
      console.log('   ⚠️  Astuce : définis LIVE_PIN=1234 pour protéger la télécommande sur le réseau.');
    }
    console.log('\n   Ctrl+C pour arrêter.\n');

    const handle = process.env.TIKTOK_USERNAME || app.getState().streamer.handle;
    if (handle && process.env.TIKTOK_AUTOCONNECT !== '0') app.bridge.connect(handle);
  });

  const stop = () => {
    try {
      app.flush();
    } catch (_) {
      /* rien à sauvegarder */
    }
    app.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (require.main === module) main();

module.exports = { createApp, lanAddresses };
