#!/usr/bin/env node
'use strict';

/*
 * Génère les aperçus de docs/images (overlay dans chaque mode, télécommande, chat).
 * Nécessite Playwright : `npx playwright install chromium` puis `npm run screenshots`.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../server');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (_) {
  console.error('Playwright est requis : npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const OUT = path.join(__dirname, '..', 'docs', 'images');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const app = createApp({ dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'live-shots-')), log: { warn() {} } });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const post = (p, body) =>
    fetch(base + p, { method: p === '/api/state' ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const overlay = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 });
  await overlay.goto(base + '/overlay?preview=1&debug');
  await overlay.waitForSelector('#c-name:not(:empty)', { state: 'attached' });

  const shot = async (name, setup, wait = 900) => {
    if (setup) await setup();
    await overlay.waitForTimeout(wait);
    await overlay.screenshot({ path: path.join(OUT, name) });
    console.log('📸', name);
  };

  await post('/api/stats/reset');
  await shot('overlay-debut.png', () => post('/api/mode/starting'));
  await shot('overlay-presentation.png', () => post('/api/mode/intro'));
  await shot('overlay-en-jeu.png', async () => {
    await post('/api/mode/live');
    await post('/api/state', { stats: { likes: 6200, viewers: 87 } });
  });
  await shot('overlay-alerte.png', () => post('/api/alert', { type: 'gift', user: 'lina_rp', text: 'envoie Rose', amount: 5 }), 700);
  await overlay.waitForTimeout(5000);
  await shot('overlay-question.png', () => post('/api/pin', { user: 'mehdi.13', text: 'Il bosse pour qui ton perso ? 👀' }));
  await post('/api/pin', {});
  await shot('overlay-plein-ecran.png', () => post('/api/state', { layout: 'full' }));
  await shot('overlay-calage.png', () => post('/api/state', { layout: 'classic', guides: true }));
  await post('/api/state', { guides: false });
  await shot('overlay-pause.png', () => post('/api/mode/pause'));
  await shot('overlay-fin.png', async () => {
    await post('/api/state', { stats: { followers: 48, gifts: 131 } });
    await post('/api/mode/ending');
  });

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await post('/api/mode/live');
  await phone.goto(base + '/');
  await phone.waitForTimeout(800);
  await phone.screenshot({ path: path.join(OUT, 'telecommande-mobile.png') });
  console.log('📸 telecommande-mobile.png');

  const chat = await browser.newPage({ viewport: { width: 420, height: 640 }, deviceScaleFactor: 2 });
  await chat.goto(base + '/chat');
  await chat.waitForTimeout(400);
  for (const [user, text] of [
    ['lina_rp', 'Bonsoir tout le monde 👋'],
    ['mehdi.13', 'Il bosse pour qui ton perso ?'],
    ['kenzo', 'Tony c’est le meilleur mécano de la ville'],
    ['sarah_gta', 'le serveur c’est lequel ?'],
  ]) {
    await post('/api/chat', { user, nickname: user, text });
  }
  await post('/api/alert', { type: 'follow', user: 'kenzo', text: 's’abonne !' });
  await chat.waitForTimeout(600);
  await chat.screenshot({ path: path.join(OUT, 'chat.png') });
  console.log('📸 chat.png');

  await browser.close();
  app.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
