'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultState, sanitizePatch, applyPatch, restoreState, sanitizeAlert, sanitizeChat, cleanHandle, MODES } = require('../lib/state');

test('état par défaut cohérent', () => {
  const s = defaultState();
  assert.ok(MODES.includes(s.mode));
  assert.equal(s.goal.source, 'likes');
  assert.equal(s.guides, false);
  assert.deepEqual(restoreState(s), s, 'un état par défaut repasse la validation sans changer');
});

test('rejette les valeurs invalides sans casser le reste', () => {
  const p = sanitizePatch({ mode: 'hack', layout: 'full', accent: 'red', webcam: 'oui', guides: true, unknown: 1 });
  assert.deepEqual(p, { layout: 'full', guides: true });
});

test('fusion profonde : un champ du perso ne remplace pas les autres', () => {
  const s = applyPatch(defaultState(), { character: { name: 'Lina Vargas' } });
  assert.equal(s.character.name, 'Lina Vargas');
  assert.equal(s.character.job, defaultState().character.job);
});

test('limites de longueur et caractères de contrôle', () => {
  const s = applyPatch(defaultState(), { character: { name: 'A\u0000B'.padEnd(200, 'x') }, objective: '  ok  ' });
  assert.equal(s.character.name.length, 40);
  assert.ok(!s.character.name.includes('\u0000'));
  assert.equal(s.objective, 'ok');
});

test('listes : texte multiligne, lignes vides retirées, maximum respecté', () => {
  const s = applyPatch(defaultState(), { ticker: 'un\n\ndeux\n' + 'x\n'.repeat(20), character: { traits: ['a', 'b', 'c', 'd', 'e'] } });
  assert.equal(s.ticker[0], 'un');
  assert.equal(s.ticker[1], 'deux');
  assert.equal(s.ticker.length, 8);
  assert.equal(s.character.traits.length, 4);
});

test('objectif : suit les likes, ou reste manuel', () => {
  let s = applyPatch(defaultState(), { stats: { likes: 1234 } });
  assert.equal(s.goal.current, 1234);
  s = applyPatch(s, { goal: { source: 'manual', current: 7, target: '50' } });
  assert.equal(s.goal.current, 7);
  assert.equal(s.goal.target, 50);
  s = applyPatch(s, { stats: { likes: 9999 } });
  assert.equal(s.goal.current, 7);
  s = applyPatch(s, { goal: { source: 'followers' }, stats: { followers: 3 } });
  assert.equal(s.goal.current, 3);
  assert.equal(sanitizePatch({ goal: { target: 0 } }).goal.target, 1, 'cible jamais nulle (division)');
});

test('pseudo TikTok : @, URL ou pseudo brut', () => {
  assert.equal(cleanHandle('@gokuinho'), 'gokuinho');
  assert.equal(cleanHandle('https://www.tiktok.com/@go.ku_inho/live'), 'go.ku_inho');
  assert.equal(cleanHandle('gokuinho'), 'gokuinho');
  assert.equal(cleanHandle('pas valide !'), undefined);
});

test('question épinglée : null pour retirer, texte obligatoire', () => {
  assert.deepEqual(sanitizePatch({ pinned: { user: 'bob', text: 'Salut ?' } }).pinned, { user: 'bob', text: 'Salut ?' });
  assert.equal(sanitizePatch({ pinned: null }).pinned, null);
  assert.equal('pinned' in sanitizePatch({ pinned: { user: 'bob' } }), false);
});

test('alertes et chat assainis', () => {
  assert.deepEqual(sanitizeAlert({ type: 'gift', user: 'bob', text: 'envoie Rose', amount: '5' }), { type: 'gift', user: 'bob', text: 'envoie Rose', amount: 5 });
  assert.equal(sanitizeAlert({ type: 'weird', user: 'x' }).type, 'custom');
  assert.equal(sanitizeAlert({}), null);
  assert.equal(sanitizeChat({ user: 'a', text: '' }), null);
  assert.equal(sanitizeChat({ text: 'yo' }).user, 'viewer');
});
