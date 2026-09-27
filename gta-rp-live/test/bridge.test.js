'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createTikTokBridge, normalizeEvent } = require('../lib/tiktok-bridge');

const quiet = { warn() {}, log() {} };

test('normalise chat, follow, partage, likes, spectateurs', () => {
  assert.deepEqual(normalizeEvent('chat', { user: { uniqueId: 'bob', nickname: 'Bob' }, comment: 'salut' }), {
    kind: 'chat',
    chat: { user: 'bob', nickname: 'Bob', text: 'salut' },
  });
  assert.equal(normalizeEvent('chat', { user: {} }), null, 'message vide ignoré');
  assert.equal(normalizeEvent('follow', { user: { uniqueId: 'a' } }).alert.type, 'follow');
  assert.deepEqual(normalizeEvent('share', { user: { uniqueId: 'a' } }).stat, ['shares', 1]);
  assert.deepEqual(normalizeEvent('like', { totalLikeCount: 420 }), { kind: 'stats', stats: { likes: 420 } });
  assert.deepEqual(normalizeEvent('roomUser', { viewerCount: 12 }), { kind: 'stats', stats: { viewers: 12 } });
  assert.equal(normalizeEvent('inconnu', {}), null);
});

test('cadeaux en série : seul le dernier événement compte', () => {
  const base = { user: { uniqueId: 'x' }, giftDetails: { giftType: 1, giftName: 'Rose' }, repeatCount: 7 };
  assert.equal(normalizeEvent('gift', { ...base, repeatEnd: false }), null);
  const done = normalizeEvent('gift', { ...base, repeatEnd: true });
  assert.equal(done.alert.amount, 7);
  assert.equal(done.alert.text, 'envoie Rose');
  assert.deepEqual(done.stat, ['gifts', 7]);
  const single = normalizeEvent('gift', { user: { uniqueId: 'x' }, giftDetails: { giftType: 2, giftName: 'Lion' } });
  assert.equal(single.alert.amount, 1);
});

function fakeLib({ failConnect } = {}) {
  const instances = [];
  class TikTokLiveConnection extends EventEmitter {
    constructor(handle, options) {
      super();
      this.handle = handle;
      this.options = options;
      instances.push(this);
    }
    connect() {
      return failConnect ? Promise.reject(Object.assign(new Error('User is offline'), { name: 'UserOfflineError' })) : Promise.resolve({});
    }
    disconnect() {
      this.closed = true;
    }
  }
  return { lib: { TikTokLiveConnection }, instances };
}

test('pont : connexion, relais des événements, déconnexion', async () => {
  const { lib, instances } = fakeLib();
  const actions = [];
  const statuses = [];
  const bridge = createTikTokBridge({ loadConnector: () => lib, onAction: (a) => actions.push(a), onStatus: (s) => statuses.push(s.state), log: quiet, apiKey: 'k' });
  bridge.connect('@moi');
  await new Promise((r) => setImmediate(r));
  assert.equal(instances[0].handle, 'moi');
  assert.deepEqual(instances[0].options, { signApiKey: 'k' });
  assert.equal(bridge.status().state, 'connected');
  instances[0].emit('chat', { user: { uniqueId: 'v' }, comment: 'yo' });
  assert.equal(actions[0].chat.text, 'yo');
  bridge.disconnect();
  assert.ok(instances[0].closed);
  instances[0].emit('chat', { user: { uniqueId: 'v' }, comment: 'fantôme' });
  assert.equal(actions.length, 1, 'plus rien après déconnexion');
  assert.deepEqual(statuses, ['connecting', 'connected', 'idle']);
});

test('pont : pas en live → nouvel essai programmé', async () => {
  const { lib, instances } = fakeLib({ failConnect: true });
  const bridge = createTikTokBridge({ loadConnector: () => lib, onAction() {}, onStatus() {}, log: quiet, retryMs: 20 });
  bridge.connect('moi');
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(bridge.status().state, 'waiting');
  assert.match(bridge.status().message, /pas \(encore\) en live/);
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(instances.length >= 2, 'reconnexion tentée');
  bridge.disconnect();
});

test('pont : module absent → message clair, pas de crash', () => {
  const bridge = createTikTokBridge({
    loadConnector: () => {
      throw new Error('Cannot find module');
    },
    onAction() {},
    onStatus() {},
    log: quiet,
  });
  bridge.connect('moi');
  assert.equal(bridge.status().state, 'unavailable');
  assert.match(bridge.status().message, /npm install/);
});

test('pont : pseudo vide → idle', () => {
  const bridge = createTikTokBridge({ loadConnector: () => fakeLib().lib, onAction() {}, onStatus() {}, log: quiet });
  bridge.connect('');
  assert.equal(bridge.status().state, 'idle');
});

test('pont : erreurs de la bibliothèque lisibles dans les logs', async () => {
  const { lib, instances } = fakeLib();
  const warnings = [];
  const bridge = createTikTokBridge({ loadConnector: () => lib, onAction() {}, onStatus() {}, log: { warn: (m) => warnings.push(m) } });
  bridge.connect('moi');
  instances[0].emit('error', { info: 'Room ID introuvable', exception: {} });
  instances[0].emit('error', new Error('boom'));
  assert.deepEqual(warnings, ['[tiktok] Room ID introuvable', '[tiktok] boom']);
  bridge.disconnect();
});
