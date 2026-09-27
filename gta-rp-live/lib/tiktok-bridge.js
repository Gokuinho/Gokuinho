'use strict';

/**
 * Pont optionnel vers le chat TikTok LIVE via `tiktok-live-connector`
 * (bibliothèque non officielle). Si elle n'est pas installée ou que TikTok
 * change son API, le reste du kit continue de fonctionner normalement :
 * seules les alertes automatiques et le chat à l'écran sont désactivés.
 */

const EVENTS = {
  CHAT: 'chat',
  GIFT: 'gift',
  LIKE: 'like',
  FOLLOW: 'follow',
  SHARE: 'share',
  ROOM_USER: 'roomUser',
  STREAM_END: 'streamEnd',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

function userOf(data) {
  const u = (data && data.user) || {};
  return {
    user: String(u.uniqueId || u.nickname || 'viewer'),
    nickname: String(u.nickname || ''),
  };
}

/**
 * Transforme un événement brut TikTok en action pour le kit.
 * Retourne `null` si l'événement doit être ignoré.
 */
function normalizeEvent(name, data = {}) {
  switch (name) {
    case EVENTS.CHAT: {
      if (!data.comment) return null;
      return { kind: 'chat', chat: { ...userOf(data), text: String(data.comment) } };
    }
    case EVENTS.FOLLOW:
      return { kind: 'alert', alert: { type: 'follow', user: userOf(data).user, text: 's’abonne !' }, stat: ['followers', 1] };
    case EVENTS.SHARE:
      return { kind: 'alert', alert: { type: 'share', user: userOf(data).user, text: 'partage le live !' }, stat: ['shares', 1] };
    case EVENTS.GIFT: {
      const details = data.giftDetails || {};
      // Cadeaux « en série » : TikTok envoie un événement par répétition, on
      // n'affiche que le dernier (repeatEnd) pour ne pas spammer l'écran.
      if (details.giftType === 1 && !data.repeatEnd) return null;
      const amount = Math.max(1, Number(data.repeatCount) || 1);
      const giftName = details.giftName || (data.extendedGiftInfo && data.extendedGiftInfo.name) || 'un cadeau';
      return {
        kind: 'alert',
        alert: { type: 'gift', user: userOf(data).user, text: `envoie ${giftName}`, amount },
        stat: ['gifts', amount],
      };
    }
    case EVENTS.LIKE: {
      const total = Number(data.totalLikeCount);
      return Number.isFinite(total) && total > 0 ? { kind: 'stats', stats: { likes: total } } : null;
    }
    case EVENTS.ROOM_USER: {
      const viewers = Number(data.viewerCount);
      return Number.isFinite(viewers) ? { kind: 'stats', stats: { viewers } } : null;
    }
    default:
      return null;
  }
}

function describeError(err) {
  if (!err) return 'inconnue';
  if (typeof err === 'string') return err;
  const inner = err.exception || err.error;
  const msg = err.message || err.info || (inner && inner.message);
  if (msg) return String(msg);
  try {
    return JSON.stringify(err).slice(0, 200);
  } catch (_) {
    return String(err);
  }
}

function defaultLoader() {
  // eslint-disable-next-line global-require
  return require('tiktok-live-connector');
}

/**
 * @param {object} opts
 * @param {(action: object) => void} opts.onAction  reçoit les sorties de normalizeEvent
 * @param {(status: object) => void} opts.onStatus  état de connexion (pour l'UI)
 * @param {() => object} [opts.loadConnector]       injectable pour les tests
 * @param {string} [opts.apiKey]                     clé Euler Stream optionnelle
 * @param {number} [opts.retryMs]                    délai avant reconnexion
 */
function createTikTokBridge({ onAction, onStatus, loadConnector = defaultLoader, apiKey, retryMs = 30000, log = console }) {
  let connection = null;
  let handle = '';
  let retryTimer = null;
  let stopped = true;
  let status = { state: 'idle', handle: '', message: 'Chat TikTok non connecté' };

  const setStatus = (state, message) => {
    status = { state, handle, message };
    onStatus(status);
  };

  const clearRetry = () => {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
  };

  const scheduleRetry = (why) => {
    if (stopped) return;
    clearRetry();
    setStatus('waiting', `${why} — nouvel essai dans ${Math.round(retryMs / 1000)} s`);
    retryTimer = setTimeout(() => {
      retryTimer = null;
      open();
    }, retryMs);
    if (retryTimer.unref) retryTimer.unref();
  };

  const teardown = () => {
    if (!connection) return;
    const c = connection;
    connection = null;
    try {
      if (c.removeAllListeners) c.removeAllListeners();
      if (c.disconnect) Promise.resolve(c.disconnect()).catch(() => {});
    } catch (_) {
      /* déjà fermé */
    }
  };

  function open() {
    if (stopped || !handle) return;
    let lib;
    try {
      lib = loadConnector();
    } catch (err) {
      stopped = true;
      setStatus('unavailable', 'Module tiktok-live-connector absent : lance « npm install » pour activer le chat TikTok');
      return;
    }
    const Connection = lib.TikTokLiveConnection || lib.WebcastPushConnection;
    if (typeof Connection !== 'function') {
      stopped = true;
      setStatus('unavailable', 'Version de tiktok-live-connector incompatible');
      return;
    }

    teardown();
    const options = apiKey ? { signApiKey: apiKey } : {};
    const conn = new Connection(handle, options);
    connection = conn;

    for (const name of [EVENTS.CHAT, EVENTS.GIFT, EVENTS.LIKE, EVENTS.FOLLOW, EVENTS.SHARE, EVENTS.ROOM_USER]) {
      conn.on(name, (data) => {
        if (conn !== connection) return;
        try {
          const action = normalizeEvent(name, data);
          if (action) onAction(action);
        } catch (err) {
          log.warn(`[tiktok] événement ${name} ignoré : ${err.message}`);
        }
      });
    }
    conn.on(EVENTS.STREAM_END, () => {
      if (conn !== connection) return;
      teardown();
      scheduleRetry('Live terminé');
    });
    conn.on(EVENTS.DISCONNECTED, () => {
      if (conn !== connection) return;
      teardown();
      scheduleRetry('Déconnecté de TikTok');
    });
    conn.on(EVENTS.ERROR, (err) => log.warn(`[tiktok] ${describeError(err)}`));

    setStatus('connecting', `Connexion au live de @${handle}…`);
    Promise.resolve()
      .then(() => conn.connect())
      .then(() => {
        if (conn !== connection) return;
        setStatus('connected', `Connecté au live de @${handle}`);
      })
      .catch((err) => {
        if (conn !== connection) return;
        teardown();
        const offline = /offline|not live|UserOffline/i.test(`${err && err.name} ${err && err.message}`);
        scheduleRetry(offline ? `@${handle} n’est pas (encore) en live` : `Erreur : ${describeError(err)}`);
      });
  }

  return {
    connect(newHandle) {
      clearRetry();
      teardown();
      handle = String(newHandle || '').replace(/^@/, '');
      if (!handle) {
        stopped = true;
        setStatus('idle', 'Renseigne ton pseudo TikTok pour connecter le chat');
        return;
      }
      stopped = false;
      open();
    },
    disconnect() {
      stopped = true;
      clearRetry();
      teardown();
      setStatus('idle', 'Chat TikTok déconnecté');
    },
    status() {
      return status;
    },
  };
}

module.exports = { createTikTokBridge, normalizeEvent, EVENTS };
