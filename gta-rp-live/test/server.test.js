'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createApp } = require('../server');

const quiet = { warn() {}, log() {} };

function fakeBridgeFactory(calls) {
  return ({ onAction, onStatus }) => {
    calls.onAction = onAction;
    return {
      connect(h) {
        calls.connect = h;
        onStatus({ state: 'connected', handle: h, message: 'ok' });
      },
      disconnect() {
        calls.disconnected = true;
      },
      status: () => ({ state: 'connected' }),
    };
  };
}

async function start(opts = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'live-'));
  const calls = {};
  const app = createApp({ dataDir, log: quiet, saveDelay: 0, createBridge: fakeBridgeFactory(calls), ...opts });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const req = async (method, p, body, headers = {}) => {
    const res = await fetch(base + p, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    const type = res.headers.get('content-type') || '';
    return { status: res.status, type, body: type.includes('json') ? await res.json() : await res.text() };
  };
  return { app, base, req, dataDir, calls, stop: () => new Promise((r) => app.close(r)) };
}

/** Ouvre le flux SSE et collecte les événements. */
function listen(base) {
  const events = [];
  let buffer = '';
  const waiters = [];
  const request = http.get(base + '/api/events', (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const ev = /^event: (.+)$/m.exec(block);
        const data = /^data: (.+)$/m.exec(block);
        if (ev && data) {
          events.push({ event: ev[1], data: JSON.parse(data[1]) });
          waiters.splice(0).forEach((w) => w());
        }
      }
    });
    res.on('error', () => {});
  });
  request.on('error', () => {});
  const waitFor = async (pred, ms = 2000) => {
    const end = Date.now() + ms;
    for (;;) {
      const hit = events.find(pred);
      if (hit) return hit;
      if (Date.now() > end) throw new Error('événement SSE non reçu');
      await new Promise((r) => {
        waiters.push(r);
        setTimeout(r, 50);
      });
    }
  };
  return { events, waitFor, close: () => request.destroy() };
}

test('pages servies', async (t) => {
  const s = await start();
  t.after(s.stop);
  for (const [p, needle] of [['/', 'Télécommande'], ['/overlay', 'id="stage"'], ['/chat', 'Chat TikTok'], ['/layout.js', 'LAYOUTS']]) {
    const r = await s.req('GET', p);
    assert.equal(r.status, 200, p);
    assert.ok(r.body.includes(needle), p);
  }
  assert.equal((await s.req('GET', '/nope.html')).status, 404);
});

test('traversée de répertoire bloquée', async (t) => {
  const s = await start();
  t.after(s.stop);
  for (const p of ['/..%2fserver.js', '/%2e%2e/%2e%2e/etc/passwd', '/..%5cserver.js']) {
    const r = await s.req('GET', p);
    assert.ok([403, 404].includes(r.status), `${p} → ${r.status}`);
    assert.ok(!String(r.body).includes('createApp'));
  }
});

test('PATCH état → diffusé en direct et sauvegardé', async (t) => {
  const s = await start();
  t.after(s.stop);
  const sse = listen(s.base);
  t.after(sse.close);
  await sse.waitFor((e) => e.event === 'state');

  const r = await s.req('PATCH', '/api/state', { character: { name: 'Lina' }, mode: 'nimporte' });
  assert.equal(r.status, 200);
  assert.equal(r.body.character.name, 'Lina');
  assert.equal(r.body.mode, 'starting', 'mode invalide ignoré');
  await sse.waitFor((e) => e.event === 'state' && e.data.character.name === 'Lina');

  s.app.flush();
  const saved = JSON.parse(fs.readFileSync(path.join(s.dataDir, 'state.json'), 'utf8'));
  assert.equal(saved.character.name, 'Lina');
  assert.equal(saved.stats, undefined, 'les stats du live ne sont pas sauvegardées');
});

test('état rechargé au redémarrage', async () => {
  const s1 = await start();
  await s1.req('PATCH', '/api/state', { objective: 'Braquer la Fleeca' });
  s1.app.flush();
  await s1.stop();
  const s2 = await start({ dataDir: s1.dataDir });
  const r = await s2.req('GET', '/api/state');
  assert.equal(r.body.objective, 'Braquer la Fleeca');
  await s2.stop();
});

test('modes, compte à rebours, épinglage', async (t) => {
  const s = await start();
  t.after(s.stop);
  assert.equal((await s.req('POST', '/api/mode/pause')).body.mode, 'pause');
  assert.equal((await s.req('POST', '/api/mode/inconnu')).status, 400);
  const before = Date.now();
  const cd = await s.req('POST', '/api/countdown', { minutes: 10 });
  assert.ok(cd.body.countdownEnd >= before + 10 * 60 * 1000 - 50);
  assert.equal((await s.req('POST', '/api/countdown', { minutes: 0 })).body.countdownEnd, null);
  assert.equal((await s.req('POST', '/api/countdown', { minutes: 999 })).status, 400);
  assert.deepEqual((await s.req('POST', '/api/pin', { user: 'bob', text: 'Il a quel âge ?' })).body.pinned, { user: 'bob', text: 'Il a quel âge ?' });
  assert.equal((await s.req('POST', '/api/pin', {})).body.pinned, null);
});

test('alertes et chat diffusés, historique conservé', async (t) => {
  const s = await start();
  t.after(s.stop);
  const sse = listen(s.base);
  t.after(sse.close);
  await s.req('POST', '/api/alert', { type: 'follow', user: 'bob', text: 's’abonne' });
  await sse.waitFor((e) => e.event === 'alert' && e.data.user === 'bob');
  assert.equal((await s.req('POST', '/api/alert', {})).status, 400);
  await s.req('POST', '/api/chat', { user: 'amy', text: 'coucou' });
  await sse.waitFor((e) => e.event === 'chat' && e.data.text === 'coucou');
  const hist = await s.req('GET', '/api/chat');
  assert.equal(hist.body.at(-1).text, 'coucou');
});

test('événements TikTok → alertes + compteurs + objectif', async (t) => {
  const s = await start();
  t.after(s.stop);
  const r = await s.req('POST', '/api/tiktok/connect', { handle: '@gokuinho' });
  assert.equal(r.status, 200);
  assert.equal(s.calls.connect, 'gokuinho');
  s.calls.onAction({ kind: 'alert', alert: { type: 'follow', user: 'a', text: 'x' }, stat: ['followers', 1] });
  s.calls.onAction({ kind: 'stats', stats: { likes: 500, viewers: 42 } });
  const st = (await s.req('GET', '/api/state')).body;
  assert.equal(st.stats.followers, 1);
  assert.equal(st.stats.viewers, 42);
  assert.equal(st.goal.current, 500, 'objectif likes synchronisé');
  await s.req('POST', '/api/tiktok/disconnect');
  assert.ok(s.calls.disconnected);
});

test('code PIN protège les modifications, pas la lecture', async (t) => {
  const s = await start({ pin: '4321' });
  t.after(s.stop);
  assert.equal((await s.req('GET', '/api/state')).status, 200);
  assert.equal((await s.req('POST', '/api/mode/live')).status, 401);
  assert.equal((await s.req('POST', '/api/mode/live', undefined, { 'x-live-pin': '0000' })).status, 401);
  assert.equal((await s.req('POST', '/api/mode/live', undefined, { 'x-live-pin': '4321' })).status, 200);
  assert.equal((await s.req('GET', '/api/info')).body.pinRequired, true);
});

test('requêtes malformées refusées proprement', async (t) => {
  const s = await start();
  t.after(s.stop);
  assert.equal((await s.req('PATCH', '/api/state', '{pas du json')).status, 400);
  assert.equal((await s.req('PATCH', '/api/state', JSON.stringify({ objective: 'x'.repeat(70000) }))).status, 413);
  assert.equal((await s.req('DELETE', '/api/state')).status, 405);
  assert.equal((await s.req('POST', '/api/inconnu')).status, 404);
});
