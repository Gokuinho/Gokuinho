/* Overlay vertical : suit l'état envoyé par le serveur. */
(function () {
  const params = new URLSearchParams(location.search);
  const forcedMode = params.get('mode'); // ex : ?mode=pause pour un écran de pause fixe
  const forcedLayout = params.get('layout');
  const preview = params.has('preview');
  const stage = document.getElementById('stage');
  const $ = (id) => document.getElementById(id);
  const L = window.LIVE_LAYOUT;

  if (preview) $('preview').hidden = false;

  // Mise à l'échelle : la source « Lien » de LIVE Studio peut avoir n'importe
  // quelle taille, on garde la toile 1080×1920 entière et centrée.
  function fit() {
    const k = Math.min(window.innerWidth / L.CANVAS.width, window.innerHeight / L.CANVAS.height) || 1;
    const x = (window.innerWidth - L.CANVAS.width * k) / 2;
    const y = (window.innerHeight - L.CANVAS.height * k) / 2;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
  }
  window.addEventListener('resize', fit);
  fit();
  if (params.has('debug')) stage.classList.add('debug');

  let state = null;
  let tickerIndex = 0;
  let pausedAt = null;

  function place(node, box) {
    Object.assign(node.style, {
      left: box.x + 'px',
      top: box.y + 'px',
      width: box.width + 'px',
      height: box.height + 'px',
    });
    node.style.position = 'absolute';
  }

  function applyLayout(layoutName, webcam) {
    const lay = L.LAYOUTS[layoutName] || L.LAYOUTS.classic;
    for (const node of document.querySelectorAll('[data-zone]')) {
      const zone = node.dataset.zone;
      const box = zone === 'card' && !webcam ? lay.cardNoCam : lay[zone];
      if (box) place(node, box);
    }
    for (const node of document.querySelectorAll('[data-ui]')) place(node, L.TIKTOK_UI[node.dataset.ui]);
  }

  // Positions en % de l'écran : LIVE Studio n'affiche pas de coordonnées en pixels.
  const toPct = (v, total) => Math.round((v / total) * 1000) / 10 + ' %';
  function describe(box) {
    const { width: W, height: H } = L.CANVAS;
    return `haut ${toPct(box.y, H)} · gauche ${toPct(box.x, W)} · largeur ${toPct(box.width, W)} · hauteur ${toPct(box.height, H)}`;
  }
  function describeGuides(layoutName) {
    const lay = L.LAYOUTS[layoutName] || L.LAYOUTS.classic;
    $('g-game').textContent = lay.game.height === L.CANVAS.height ? 'plein écran : remplis toute la zone' : describe(lay.game);
    $('g-cam').textContent = describe(lay.webcam);
  }

  function setText(id, value) {
    $(id).textContent = value || '';
  }

  function setTraits(id, traits) {
    const ul = $(id);
    ul.replaceChildren(...(traits || []).map((t) => Live.el('li', { text: t })));
  }

  function hexToRgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function formatNumber(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' M';
    if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.0', '') + ' k';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function render(next) {
    const prevMode = state && state.mode;
    state = next;
    const mode = forcedMode || state.mode;
    const layout = forcedLayout || state.layout;
    const c = state.character;

    stage.className =
      `mode-${mode} layout-${layout}` +
      (state.webcam ? '' : ' no-cam') +
      (state.guides || params.has('guides') ? ' guides' : '') +
      (params.has('debug') ? ' debug' : '');
    stage.style.setProperty('--accent', state.accent);
    stage.style.setProperty('--accent-soft', hexToRgba(state.accent, 0.45));
    applyLayout(layout, state.webcam);
    describeGuides(layout);

    if (mode === 'pause' && prevMode !== 'pause') pausedAt = Date.now();

    // HUD
    setText('hud-server', state.server.name);
    setText('hud-objective', state.objective);
    $('hud-objective-wrap').classList.toggle('empty', !state.objective);
    setText('c-name', c.name);
    setText('c-age', c.age);
    setText('c-job', c.job);
    setTraits('c-traits', c.traits);

    const g = state.goal;
    const pct = Math.min(100, (g.current / g.target) * 100);
    setText('goal-label', g.label);
    setText('goal-value', `${formatNumber(g.current)} / ${formatNumber(g.target)}`);
    $('goal-fill').style.width = pct + '%';
    $('goal').classList.toggle('done', pct >= 100);
    $('goal').hidden = !g.label;

    // Question épinglée : remplace le bandeau défilant
    const pinned = state.pinned;
    $('pinned').hidden = !pinned;
    $('ticker').classList.toggle('hidden', Boolean(pinned) || !state.ticker.length);
    if (pinned) {
      setText('pinned-user', '@' + pinned.user);
      setText('pinned-text', pinned.text);
    }
    if (!$('ticker-text').textContent && state.ticker.length) setText('ticker-text', state.ticker[0]);

    // Présentation
    setText('i-server', state.server.name);
    setText('i-name', c.name);
    setText('i-age', c.age);
    setText('i-job', c.job);
    setText('i-faction', c.faction);
    setText('i-origin', c.origin);
    setText('i-bio', c.bio);
    setText('i-quote', c.quote);
    setText('i-objective', state.objective);
    document.querySelector('.id-foot').classList.toggle('empty', !state.objective);
    setTraits('i-traits', c.traits);

    // Écrans
    setText('s-server', state.server.name);
    setText('s-name', c.name);
    setText('p-message', state.pauseMessage);
    setText('e-server', state.server.name);
    setText('e-message', state.endingMessage);
    setText('e-followers', formatNumber(state.stats.followers));
    setText('e-likes', formatNumber(state.stats.likes));
    setText('e-gifts', formatNumber(state.stats.gifts));
    tick();
  }

  function mmss(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function tick() {
    if (!state) return;
    const cd = $('s-countdown');
    if (state.countdownEnd && state.countdownEnd > Date.now()) {
      cd.textContent = mmss(state.countdownEnd - Date.now());
      cd.classList.remove('hidden');
    } else if (state.countdownEnd) {
      cd.textContent = 'ÇA ARRIVE';
      cd.classList.remove('hidden');
    } else {
      cd.classList.add('hidden');
    }
    $('p-timer').textContent = pausedAt ? mmss(Date.now() - pausedAt) : '00:00';
  }
  setInterval(tick, 500);

  // Bandeau défilant : un message toutes les 8 secondes
  setInterval(() => {
    if (!state || !state.ticker.length) return;
    const node = $('ticker-text');
    node.classList.add('out');
    setTimeout(() => {
      tickerIndex = (tickerIndex + 1) % state.ticker.length;
      node.textContent = state.ticker[tickerIndex];
      node.classList.remove('out');
    }, 400);
  }, 8000);

  // File d'alertes : une à la fois, 5 s chacune
  const ICONS = { follow: '❤️', gift: '🎁', share: '🔁', like: '👍', custom: '📣' };
  const queue = [];
  let showing = false;

  function nextAlert() {
    if (showing || !queue.length) return;
    showing = true;
    const a = queue.shift();
    const text = a.amount && a.amount > 1 ? `${a.text} ×${a.amount}` : a.text;
    const node = Live.el(
      'div',
      { class: `alert ${a.type}` },
      Live.el('div', { class: 'icon', text: ICONS[a.type] || ICONS.custom }),
      Live.el('div', {}, Live.el('div', { class: 'user', text: a.user ? '@' + a.user : '' }), Live.el('div', { class: 'text', text }))
    );
    $('alerts').append(node);
    const duration = queue.length > 4 ? 2500 : 5000; // accélère si ça s'accumule
    setTimeout(() => {
      node.classList.add('leaving');
      setTimeout(() => {
        node.remove();
        showing = false;
        nextAlert();
      }, 400);
    }, duration);
  }

  Live.connect({
    state: render,
    alert(a) {
      if (queue.length < 30) queue.push(a);
      nextAlert();
    },
    onOpen() {
      $('offline').hidden = true;
    },
    onClose() {
      // Le bandeau d'erreur n'apparaît jamais à l'antenne, seulement en aperçu.
      if (preview) $('offline').hidden = false;
    },
  });

  applyLayout(forcedLayout || 'classic', true);
})();
