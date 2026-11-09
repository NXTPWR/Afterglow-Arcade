const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../game-core.js');

test('Perfect Circle rewards a closed, even circle and rejects empty strokes', () => {
  const points = Array.from({ length: 361 }, (_, i) => {
    const angle = i * Math.PI * 2 / 360;
    return [150 + Math.cos(angle) * 70, 110 + Math.sin(angle) * 70];
  });
  assert.equal(core.scoreCircle(points).score, 100);
  assert.equal(core.scoreCircle([]).invalid, true);
  const line = Array.from({ length: 30 }, (_, i) => [i * 4, 40]);
  assert.ok(core.scoreCircle(line).score < 20);
});

test('score estimators normalize and clamp their results', () => {
  assert.equal(core.scoreEstimate(30, 30), 100);
  assert.equal(core.scoreEstimate(30, 60), 0);
  assert.equal(core.scoreAngle(90, 90), 100);
  assert.equal(core.scoreAngle(0, 90), 50);
  assert.equal(core.scoreFraction(62, 62), 100);
  assert.equal(core.scoreFraction(62, 0), 38);
  assert.equal(core.scoreKrillion(7, 7), 100);
  assert.equal(core.scoreKrillion(0, 7), 0);
});

test('tempo compares each tap interval to the matching displayed interval', () => {
  assert.equal(core.scoreTempo([400, 500, 600], [1000, 1400, 1900, 2500]), 100);
  assert.equal(core.scoreTempo([400, 500, 600], [1000, 3000, 5000, 7000]), 0);
});

test('logo recall uses a symmetric tolerant mask score', () => {
  const target = new Uint8Array(100);
  target[44] = target[45] = target[54] = target[55] = 1;
  const same = target.slice();
  const nearby = new Uint8Array(100);
  nearby[45] = nearby[46] = nearby[55] = nearby[56] = 1;
  const empty = new Uint8Array(100);
  assert.equal(core.scoreTraceMatch(target, same, 0), 100);
  assert.ok(core.scoreTraceMatch(target, nearby, 2) >= 80);
  assert.equal(core.scoreTraceMatch(target, empty, 2), 0);
});

test('Gamer Percentage requires six valid best scores', () => {
  const ids = ['circle', 'krillion', 'perceptle', 'headcount', 'logos', 'contexto'];
  assert.equal(core.gamerPercentage({ circle: 100, krillion: 80 }, ids), null);
  assert.equal(core.gamerPercentage(Object.fromEntries(ids.map(id => [id, 80])), ids), 80);
  assert.equal(core.gamerPercentage(Object.fromEntries(ids.map(id => [id, 101])), ids), null);
});

test('Contexto gives full credit to a first-guess solve and none for an unfinished round', () => {
  assert.equal(core.scoreContexto(1), 100);
  assert.equal(core.scoreContexto(3), 80);
  assert.equal(core.scoreContexto(0), 0);
});
