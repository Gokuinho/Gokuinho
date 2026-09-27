/* Chat TikTok pour le streamer : lecture vocale, filtre questions, épinglage à l'écran. */
(function () {
  const $ = (id) => document.getElementById(id);
  const list = $('list');
  const MAX_MESSAGES = 200;
  const seen = new Set();
  let state = null;

  const prefs = (() => {
    try {
      return JSON.parse(localStorage.getItem('chat-prefs')) || {};
    } catch (_) {
      return {};
    }
  })();
  const savePrefs = () => {
    try {
      localStorage.setItem('chat-prefs', JSON.stringify(prefs));
    } catch (_) {
      /* stockage indisponible */
    }
  };

  // ---------- Lecture vocale ----------
  const synth = window.speechSynthesis;
  const speakQueue = [];
  let voice = null;
  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    voice = voices.find((v) => /^fr(-|_)FR/i.test(v.lang)) || voices.find((v) => /^fr/i.test(v.lang)) || null;
  }
  if (synth) {
    pickVoice();
    synth.onvoiceschanged = pickVoice;
  }

  function cleanForSpeech(text) {
    return text
      .replace(/https?:\/\/\S+/g, 'un lien')
      .replace(/(.)\1{3,}/g, '$1$1$1') // « trooooop » → « trooop »
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
      .trim();
  }

  function speak(msg) {
    if (!prefs.tts || !synth) return;
    const text = cleanForSpeech(msg.text);
    if (!text || text.length > 200) return;
    // Si ça va trop vite, on ne garde que les 3 derniers pour rester dans le rythme du jeu.
    speakQueue.push(`${msg.nickname || msg.user} : ${text}`);
    while (speakQueue.length > 3) speakQueue.shift();
    pump();
  }
  function pump() {
    if (synth.speaking || !speakQueue.length) return;
    const u = new SpeechSynthesisUtterance(speakQueue.shift());
    u.lang = 'fr-FR';
    if (voice) u.voice = voice;
    u.rate = 1.1;
    u.onend = pump;
    u.onerror = pump;
    synth.speak(u);
  }

  // ---------- Affichage ----------
  const isQuestion = (t) =>
    /\?/.test(t) || /^(qui|quoi|comment|pourquoi|combien|où|quel|quelle|quels|quelles|est-ce|c'est quoi|t'as|tu)(?=\s|$)/i.test(t.trim());

  function nearBottom() {
    return list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  }

  function add(msg, { silent = false } = {}) {
    if (seen.has(msg.id)) return;
    seen.add(msg.id);
    $('empty')?.remove();
    const stick = nearBottom();
    const question = isQuestion(msg.text);
    const charName = state && state.character.name.split(' ')[0];
    const mention = charName && charName.length > 2 && msg.text.toLowerCase().includes(charName.toLowerCase());

    const row = Live.el(
      'div',
      { class: 'msg' + (question ? ' question' : '') + (mention ? ' mention' : '') },
      Live.el('span', { class: 'who', text: msg.nickname || msg.user, title: '@' + msg.user }),
      Live.el('span', { class: 'txt', text: msg.text }),
      Live.el('button', {
        class: 'act',
        text: '📌',
        title: 'Afficher ce message à l’écran',
        onclick: () => Live.api('/api/pin', { user: msg.user, text: msg.text }).catch((e) => alert(e.message)),
      })
    );
    row.dataset.question = question ? '1' : '';
    list.append(row);
    while (list.children.length > MAX_MESSAGES) list.firstElementChild.remove();
    applyFilter(row);
    if (stick) list.scrollTop = list.scrollHeight;
    else $('more').classList.add('show');
    if (!silent) speak(msg);
  }

  function addEvent(a) {
    $('empty')?.remove();
    const stick = nearBottom();
    const icon = { follow: '❤️', gift: '🎁', share: '🔁' }[a.type] || '📣';
    const amount = a.amount > 1 ? ` ×${a.amount}` : '';
    list.append(Live.el('div', { class: 'msg event', text: `${icon} ${a.user ? '@' + a.user + ' ' : ''}${a.text}${amount}` }));
    if (stick) list.scrollTop = list.scrollHeight;
  }

  function applyFilter(row) {
    row.hidden = Boolean(prefs.questions) && !row.dataset.question && !row.classList.contains('event');
  }

  list.addEventListener('scroll', () => {
    if (nearBottom()) $('more').classList.remove('show');
  });
  $('more').addEventListener('click', () => {
    list.scrollTop = list.scrollHeight;
    $('more').classList.remove('show');
  });

  // ---------- Barre d'outils ----------
  function toggle(button, key, after) {
    button.setAttribute('aria-pressed', String(Boolean(prefs[key])));
    button.addEventListener('click', () => {
      prefs[key] = !prefs[key];
      button.setAttribute('aria-pressed', String(prefs[key]));
      savePrefs();
      if (after) after();
    });
  }
  if (!synth) {
    $('tts').disabled = true;
    $('tts').title = 'Lecture vocale non disponible ici : ouvre cette page dans Chrome ou Edge';
  }
  toggle($('tts'), 'tts', () => {
    if (!prefs.tts && synth) {
      speakQueue.length = 0;
      synth.cancel();
    } else if (synth) {
      speakQueue.push('Lecture vocale activée');
      pump();
    }
  });
  toggle($('questions'), 'questions', () => {
    for (const row of list.children) if (row.classList.contains('msg')) applyFilter(row);
  });

  $('size').value = prefs.size || '16px';
  document.body.style.setProperty('--size', $('size').value);
  $('size').addEventListener('change', () => {
    prefs.size = $('size').value;
    document.body.style.setProperty('--size', prefs.size);
    savePrefs();
  });

  $('test').addEventListener('click', () =>
    Live.api('/api/chat', { user: 'test_viewer', nickname: 'Viewer Test', text: 'Il a quel âge ton perso ?' }).catch((e) => alert(e.message))
  );

  Live.connect({
    state(s) {
      state = s;
    },
    history(msgs) {
      for (const m of msgs) add(m, { silent: true });
    },
    chat: (m) => add(m),
    alert: addEvent,
    tiktok(s) {
      const chip = $('tt-chip');
      chip.className = 'chip ' + ({ connected: 'ok', connecting: 'warn', waiting: 'warn', unavailable: 'bad' }[s.state] || '');
      chip.textContent = s.state === 'connected' ? 'TikTok ✓' : 'TikTok ✗';
      chip.title = s.message;
    },
  });
})();
