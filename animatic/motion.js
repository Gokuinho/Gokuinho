/* =========================================================================
   ITSGOK — Couche d'animation (motion layer)
   -------------------------------------------------------------------------
   Se branche toute seule sur l'animatic existant : elle observe les scènes
   qui deviennent `.active`, construit un rig caméra autour de leur contenu,
   et déclenche transition d'entrée + mouvement continu + mise en scène.

   Aucune fonction du moteur d'origine n'est réécrite. Le seul point
   d'accroche est speechSynthesis.speak(), enveloppé pour savoir qui parle.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     Grammaire de mise en scène : une entrée par type de scène.
     in   = transition d'entrée      amb = mouvement continu
     mood = étalonnage               wide = cache scope (plan large "ciné")
     --------------------------------------------------------------------- */
  var SHOTS = {
    living:    { in: 'fade',    amb: 'driftIn',  mood: 'calm' },
    phone:     { in: 'snap',    amb: 'handheld', mood: 'tense', flash: true },
    panic:     { in: 'whip',    amb: 'shake',    mood: 'panic' },
    kiss:      { in: 'dollyIn', amb: 'driftIn',  mood: 'warm', wide: true },
    corridor:  { in: 'pushL',   amb: 'panL',     mood: 'run' },
    door:      { in: 'dollyIn', amb: 'driftIn',  mood: 'tense' },
    toilet:    { in: 'cut',     amb: 'handheld', mood: 'comic', dip: true },
    champion:  { in: 'tiltUp',  amb: 'driftOut', mood: 'hero', wide: true },
    bathroom:  { in: 'pushR',   amb: 'panR',     mood: 'calm' },
    hair:      { in: 'cut',     amb: 'handheld', mood: 'comic' },
    perfume:   { in: 'dollyIn', amb: 'float',    mood: 'cool' },
    ready:     { in: 'tiltUp',  amb: 'driftOut', mood: 'hero', wide: true },
    epic:      { in: 'iris',    amb: 'driftIn',  mood: 'hero', wide: true },
    handle:    { in: 'dollyIn', amb: 'driftIn',  mood: 'tense' },
    gaming:    { in: 'pushL',   amb: 'panR',     mood: 'cool' },
    setup:     { in: 'whip',    amb: 'driftOut', mood: 'cool' },
    prayer:    { in: 'dollyIn', amb: 'float',    mood: 'calm' },
    power:     { in: 'snap',    amb: 'shake',    mood: 'tense', flash: true },
    awake:     { in: 'iris',    amb: 'driftIn',  mood: 'cool', flash: true },
    sit:       { in: 'pushR',   amb: 'handheld', mood: 'calm' },
    cindydoor: { in: 'cut',     amb: 'handheld', mood: 'warm', dip: true },
    launch:    { in: 'dollyIn', amb: 'driftIn',  mood: 'hero', wide: true },
    final:     { in: 'iris',    amb: 'driftOut', mood: 'hero', wide: true }
  };
  var FALLBACK = { in: 'fade', amb: 'driftIn', mood: 'calm' };

  /* Sélecteurs de ce qui compte comme décor (plan lointain, parallaxe lente). */
  var PLATE_SEL = '.bg, .backdrop, .decor, [class*="bg-"]';
  /* Sélecteurs de ce qui compte comme personnage (peut parler, respire). */
  var CHAR_SEL = '[class*="ok" i][class*="ard" i], [class*="indy" i], .char, .perso';

  var stage = null;
  var veil = null, flash = null, bars = null;
  var enterToken = 0;

  /* =====================================================================
     Utilitaires
     ===================================================================== */
  function norm(s) {
    return String(s || '')
      .replace(/[‘’ʼ]/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function restart(el, classes) {
    if (!el) return;
    el.className = el.className.replace(/\bmo-in(-\w+)?\b/g, '').trim();
    classes.forEach(function (c) { el.classList.remove(c); });
    void el.offsetWidth; // force un reflow : sinon l'animation ne rejoue pas
    classes.forEach(function (c) { el.classList.add(c); });
  }

  function sceneType(scene) {
    if (scene.dataset && scene.dataset.type) return scene.dataset.type;
    var found = null;
    scene.classList.forEach(function (c) {
      if (found) return;
      if (c === 'scene' || c === 'active' || c.indexOf('mo-') === 0) return;
      found = c;
    });
    return found || '';
  }

  function shotFor(scene) {
    return SHOTS[sceneType(scene)] || FALLBACK;
  }

  /* =====================================================================
     Construction du rig caméra autour du contenu d'une scène
     ===================================================================== */
  function rig(scene) {
    if (scene.__moRigged) return;
    scene.__moRigged = true;

    var cam = document.createElement('div');
    cam.className = 'mo-cam';
    var plate = document.createElement('div');
    plate.className = 'mo-plate';
    var body = document.createElement('div');
    body.className = 'mo-rig';
    cam.appendChild(plate);
    cam.appendChild(body);

    // On déplace le contenu existant tel quel : styles et animations d'origine
    // suivent leurs éléments, rien n'est réécrit.
    var kids = Array.prototype.slice.call(scene.children);
    kids.forEach(function (k) {
      (k.matches && k.matches(PLATE_SEL) ? plate : body).appendChild(k);
    });
    scene.appendChild(cam);

    scene.__moCam = cam;
    scene.__moPlate = plate;
    scene.__moBody = body;
    scene.classList.add('mo-mood');
  }

  /* =====================================================================
     Entrée en scène
     ===================================================================== */
  function enter(scene) {
    var shot = shotFor(scene);
    var token = ++enterToken;

    rig(scene);
    restart(scene.__moCam, ['mo-in', 'mo-in-' + shot.in]);

    // Mouvement continu : le décor reçoit la même intention, en plus lent.
    [scene.__moBody, scene.__moPlate].forEach(function (el) {
      el.className = el.className.replace(/\bmo-amb(-\w+)?\b/g, '').trim();
      void el.offsetWidth;
      el.classList.add('mo-amb', 'mo-amb-' + shot.amb);
    });

    // Étalonnage
    scene.className = scene.className.replace(/\bmo-mood-\w+\b/g, '').trim();
    scene.classList.add('mo-mood', 'mo-mood-' + shot.mood);

    // Cache scope
    if (bars) bars.classList.toggle('mo-wide', !!shot.wide);

    // Accents de montage
    if (shot.dip && veil) restart(veil, ['mo-dip']);
    if (shot.flash && flash) restart(flash, ['mo-fire']);

    // Mise en scène des sujets : apparition décalée, puis respiration.
    var els = Array.prototype.slice.call(scene.__moBody.children);
    els.forEach(function (el, i) {
      el.classList.remove('mo-el', 'mo-breathe', 'mo-talk', 'mo-listen');
      el.style.animationDelay = '';
      void el.offsetWidth;
      if (token !== enterToken) return;
      el.style.animationDelay = (0.08 + i * 0.11).toFixed(2) + 's';
      el.classList.add('mo-el');
      if (el.matches && el.matches(CHAR_SEL)) el.classList.add('mo-breathe');
    });
  }

  /* =====================================================================
     Synchronisation dialogue -> personnage
     ===================================================================== */
  var lineIndex = null; // texte normalisé -> nom du personnage

  function buildLineIndex() {
    if (lineIndex) return lineIndex;
    lineIndex = {};
    try {
      /* SCENES est déclaré en `const` au niveau racine d'un script classique :
         la liaison est partagée entre scripts classiques du même document. */
      var src = (typeof SCENES !== 'undefined') ? SCENES
              : (typeof window !== 'undefined' && window.SCENES) ? window.SCENES
              : null;
      if (src) {
        src.forEach(function (s) {
          (s.dialogue || []).forEach(function (d) { lineIndex[norm(d[1])] = d[0]; });
        });
      }
    } catch (e) { /* pas de SCENES accessible : on retombera sur le DOM */ }
    return lineIndex;
  }

  function speakerFromDom(scene) {
    var t = (scene.textContent || '').toUpperCase();
    var g = t.lastIndexOf('GOK'), c = t.lastIndexOf('CINDY');
    if (g < 0 && c < 0) return null;
    return g > c ? 'GOK' : 'CINDY';
  }

  function charsOf(scene) {
    var all = Array.prototype.slice.call(scene.__moBody ? scene.__moBody.children : []);
    return all.filter(function (el) { return el.matches && el.matches(CHAR_SEL); });
  }

  function talk(who, on) {
    var scene = stage && stage.querySelector('.scene.active');
    if (!scene || !scene.__moBody) return;
    var chars = charsOf(scene);
    if (!chars.length) return;

    if (!on) {
      chars.forEach(function (el) { el.classList.remove('mo-talk', 'mo-listen'); });
      return;
    }
    var key = who ? who.toLowerCase() : null;
    var speaker = null;
    if (key) {
      chars.forEach(function (el) {
        if (!speaker && el.className.toLowerCase().indexOf(key.slice(0, 4)) >= 0) speaker = el;
      });
    }
    chars.forEach(function (el) {
      var isSpeaker = speaker ? el === speaker : true;
      el.classList.toggle('mo-talk', isSpeaker);
      el.classList.toggle('mo-listen', !isSpeaker);
    });
  }

  var talkTimer = null;
  function talkFor(who, seconds) {
    clearTimeout(talkTimer);
    talk(who, true);
    talkTimer = setTimeout(function () { talk(null, false); }, seconds * 1000);
  }

  function hookSpeech() {
    if (!('speechSynthesis' in window)) return;
    var native = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = function (utt) {
      try {
        var idx = buildLineIndex();
        var who = idx[norm(utt.text)] || null;
        // addEventListener plutôt que onstart/onend : on n'écrase pas le moteur.
        utt.addEventListener('start', function () {
          clearTimeout(talkTimer);
          if (!who) {
            var sc = stage && stage.querySelector('.scene.active');
            who = sc ? speakerFromDom(sc) : null;
          }
          talk(who, true);
        });
        utt.addEventListener('end', function () { talk(null, false); });
        utt.addEventListener('error', function () { talk(null, false); });
      } catch (e) { /* on ne casse jamais la lecture pour une animation */ }
      return native(utt);
    };
  }

  /* Filet de sécurité : si la synthèse vocale est indisponible ou muette,
     on déclenche l'animation de parole sur l'apparition d'une réplique. */
  function watchDialogue() {
    var last = '';
    var obs = new MutationObserver(function () {
      var scene = stage && stage.querySelector('.scene.active');
      if (!scene) return;
      var node = scene.querySelector('.dialogue, .line, [class*="dialog"]')
              || document.querySelector('.dialogue, #dialogue, [class*="dialog"]');
      if (!node) return;
      var txt = (node.textContent || '').trim();
      if (!txt || txt === last) return;
      last = txt;
      var m = txt.match(/^\s*(GOK|CINDY)/i);
      talkFor(m ? m[1].toUpperCase() : speakerFromDom(scene),
              Math.max(1.6, txt.length * 0.055));
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* =====================================================================
     Synchronisation de la vitesse de lecture (1x / 2x / 4x)
     ===================================================================== */
  function hookSpeed() {
    var sel = null;
    Array.prototype.slice.call(document.querySelectorAll('select')).forEach(function (s) {
      if (sel) return;
      var vals = Array.prototype.map.call(s.options, function (o) { return parseFloat(o.value); });
      if (vals.length && vals.every(function (v) { return !isNaN(v); })) sel = s;
    });
    if (!sel) return;
    var apply = function () {
      var v = parseFloat(sel.value) || 1;
      document.documentElement.style.setProperty('--mo-speed', v);
    };
    sel.addEventListener('change', apply);
    apply();
  }

  /* =====================================================================
     Overlays de montage
     ===================================================================== */
  function overlays() {
    var mk = function (cls) {
      var d = document.createElement('div');
      d.className = cls;
      stage.appendChild(d);
      return d;
    };
    veil = mk('mo-veil');
    flash = mk('mo-flash');
    bars = mk('mo-bars');
    mk('mo-grain');
  }

  /* =====================================================================
     Démarrage
     ===================================================================== */
  function boot() {
    var scenes = document.querySelectorAll('.scene');
    if (!scenes.length) return false;

    stage = scenes[0].parentElement;
    if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
    document.documentElement.classList.add('mo-on');

    overlays();
    Array.prototype.forEach.call(scenes, function (scene) {
      rig(scene);
      new MutationObserver(function () {
        if (scene.classList.contains('active')) {
          if (!scene.__moActive) { scene.__moActive = true; enter(scene); }
        } else {
          scene.__moActive = false;
        }
      }).observe(scene, { attributes: true, attributeFilter: ['class'] });

      if (scene.classList.contains('active')) { scene.__moActive = true; enter(scene); }
    });

    hookSpeech();
    watchDialogue();
    hookSpeed();
    return true;
  }

  function start() {
    if (boot()) return;
    // Les scènes sont injectées par script : on attend qu'elles arrivent.
    var obs = new MutationObserver(function () { if (boot()) obs.disconnect(); });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
