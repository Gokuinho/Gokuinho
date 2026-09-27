/* Télécommande : modifie l'état du live, utilisable sur le PC ou sur le téléphone pendant que tu joues. */
(function () {
  const $ = (id) => document.getElementById(id);
  const MODES = ['starting', 'intro', 'live', 'pause', 'ending'];
  let state = null;
  const timers = new Map();

  function toast(msg, isError) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'show' + (isError ? ' err' : '');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.className = ''), 2200);
  }

  async function call(path, body, method) {
    try {
      return await Live.api(path, body, method);
    } catch (err) {
      if (err.status === 401) $('pin-box').hidden = false;
      toast(err.message, true);
      throw err;
    }
  }

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  function buildPatch(path, value) {
    const keys = path.split('.');
    const patch = {};
    let node = patch;
    keys.forEach((k, i) => {
      node[k] = i === keys.length - 1 ? value : {};
      node = node[k];
    });
    return patch;
  }

  function readField(field) {
    if (field.type === 'checkbox') return field.checked;
    if (field.type === 'number') return field.value === '' ? undefined : Number(field.value);
    if ('list' in field.dataset) return field.value.split('\n');
    return field.value;
  }

  function writeField(field, value) {
    if (field.type === 'checkbox') field.checked = Boolean(value);
    else if (Array.isArray(value)) field.value = value.join('\n');
    else field.value = value == null ? '' : value;
  }

  // Sauvegarde automatique à la frappe (anti-rebond 400 ms)
  for (const field of document.querySelectorAll('[data-path]')) {
    const save = () => {
      const value = readField(field);
      if (value === undefined) return;
      clearTimeout(timers.get(field));
      timers.set(
        field,
        setTimeout(async () => {
          timers.delete(field);
          await call('/api/state', buildPatch(field.dataset.path, value), 'PATCH');
          field.classList.add('saved');
          setTimeout(() => field.classList.remove('saved'), 600);
        }, field.type === 'checkbox' || field.tagName === 'SELECT' ? 0 : 400)
      );
    };
    field.addEventListener('input', save);
    field.addEventListener('change', save);
  }

  function render(next) {
    state = next;
    for (const b of document.querySelectorAll('[data-mode]')) b.classList.toggle('active', b.dataset.mode === state.mode);
    for (const b of document.querySelectorAll('[data-layout]')) b.classList.toggle('active', b.dataset.layout === state.layout);
    for (const field of document.querySelectorAll('[data-path]')) {
      // Ne jamais écraser un champ en cours d'édition.
      if (field === document.activeElement || timers.has(field)) continue;
      writeField(field, getPath(state, field.dataset.path));
    }
    const goalManual = state.goal.source === 'manual';
    document.querySelector('[data-path="goal.current"]').disabled = !goalManual;
    $('st-viewers').textContent = state.stats.viewers;
    $('st-likes').textContent = state.stats.likes;
    $('unpin').disabled = !state.pinned;
    if (document.activeElement !== $('tt-handle')) $('tt-handle').value = state.streamer.handle ? '@' + state.streamer.handle : '';
  }

  function setMode(mode) {
    return call('/api/mode/' + mode).then(() => toast('Mode : ' + document.querySelector(`[data-mode="${mode}"]`).textContent.replace(/\d$/, '').trim()));
  }

  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => setMode(b.dataset.mode));
  for (const b of document.querySelectorAll('[data-layout]')) {
    b.addEventListener('click', () => call('/api/state', { layout: b.dataset.layout }, 'PATCH'));
  }
  for (const b of document.querySelectorAll('[data-countdown]')) {
    b.addEventListener('click', () => call('/api/countdown', { minutes: Number(b.dataset.countdown) }).then(() => toast('Compte à rebours mis à jour')));
  }
  const TEST_ALERTS = {
    follow: { type: 'follow', user: 'test_viewer', text: 's’abonne !' },
    gift: { type: 'gift', user: 'test_viewer', text: 'envoie Rose', amount: 5 },
  };
  for (const b of document.querySelectorAll('[data-alert]')) {
    b.addEventListener('click', () => call('/api/alert', TEST_ALERTS[b.dataset.alert]).then(() => toast('Alerte envoyée')));
  }

  $('shout-send').addEventListener('click', async () => {
    const text = $('shout').value.trim();
    if (!text) return;
    await call('/api/alert', { type: 'custom', user: '', text });
    $('shout').value = '';
    toast('Message affiché');
  });
  $('pin-send').addEventListener('click', async () => {
    const text = $('pin-text').value.trim();
    if (!text) return;
    await call('/api/pin', { user: state.streamer.handle || 'annonce', text });
    $('pin-text').value = '';
    toast('Épinglé à l’écran');
  });
  $('unpin').addEventListener('click', () => call('/api/pin', {}).then(() => toast('Question retirée')));
  $('stats-reset').addEventListener('click', () => {
    if (confirm('Remettre likes, abonnés et cadeaux à zéro ?')) call('/api/stats/reset').then(() => toast('Compteurs remis à zéro'));
  });

  $('tt-connect').addEventListener('click', () => call('/api/tiktok/connect', { handle: $('tt-handle').value }));
  $('tt-disconnect').addEventListener('click', () => call('/api/tiktok/disconnect'));

  function renderTikTok(s) {
    const chip = $('tt-chip');
    chip.className = 'chip ' + ({ connected: 'ok', connecting: 'warn', waiting: 'warn', unavailable: 'bad' }[s.state] || '');
    chip.textContent = s.state === 'connected' ? 'TikTok ✓' : 'TikTok';
    $('tt-status').textContent = s.message;
  }

  $('pin-save').addEventListener('click', () => {
    try {
      localStorage.setItem('live-pin', $('pin-input').value);
    } catch (_) {
      /* stockage indisponible */
    }
    $('pin-box').hidden = true;
    toast('Code enregistré');
  });

  // Raccourcis 1 à 5 quand la page a le focus
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
    const i = Number(e.key) - 1;
    if (i >= 0 && i < MODES.length) setMode(MODES[i]);
  });

  async function loadLinks() {
    const info = await fetch('/api/info').then((r) => r.json());
    if (info.pinRequired && !Live.pin()) $('pin-box').hidden = false;
    const origin = location.origin;
    const links = [
      ['Overlay → source « Lien » LIVE Studio', origin + '/overlay'],
      ['Aperçu overlay', origin + '/overlay?preview=1&debug=1'],
      ['Chat + lecture vocale', origin + '/chat'],
      ...info.lan.map((u) => ['📱 Télécommande téléphone', u]),
    ];
    $('links').replaceChildren(
      ...links.map(([label, url]) =>
        Live.el(
          'li',
          {},
          Live.el('div', {}, Live.el('div', { text: label }), Live.el('code', { text: url })),
          Live.el('button', {
            text: 'Copier',
            onclick: () => navigator.clipboard.writeText(url).then(() => toast('Lien copié'), () => toast(url)),
          })
        )
      )
    );
  }

  Live.connect({
    state: render,
    tiktok: renderTikTok,
    onOpen() {
      $('conn').className = 'chip ok';
      $('conn').textContent = '● Connecté';
    },
    onClose() {
      $('conn').className = 'chip bad';
      $('conn').textContent = '● Hors ligne';
    },
  });
  loadLinks().catch(() => {});
})();
