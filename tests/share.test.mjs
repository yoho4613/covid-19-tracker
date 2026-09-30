import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FOLLOW_THRESHOLDS, LURE_THRESHOLDS, describe, renderShare } from '../api/share.js';
import * as tiers from '../src/game/tiers.ts';

test('share page tiers match game tiers', () => {
  assert.deepEqual(LURE_THRESHOLDS, tiers.LURE_THRESHOLDS);
  assert.deepEqual(FOLLOW_THRESHOLDS, tiers.FOLLOW_THRESHOLDS);
  for (const s of [3, 12, 12.1, 17, 20, 24, 30, 33, 40, 45]) {
    assert.equal(describe('lure', s.toFixed(1)).image, `lure-${tiers.lureTier(Number(s.toFixed(1))).id}`, `lure ${s}`);
  }
  for (let p = 0; p <= 100; p++) {
    assert.equal(describe('follow', String(p)).image, `follow-${tiers.followTier(p).id}`, `follow ${p}`);
  }
  assert.equal(describe('lure', 'fail').image, `lure-${tiers.lureTier(null).id}`);
});

test('share page renders result meta and escapes junk', () => {
  const html = renderShare('https://bk.example.app', 'lure', '12.4');
  assert.match(html, /og:title" content="12\.4초 만에 부캉이를 바다로 보냈다!/);
  assert.match(html, /og:image" content="https:\/\/bk\.example\.app\/og\/lure-2\.png"/);
  assert.match(html, /location\.replace\("\/\?utm_source=share#\/lure"\)/);

  const bad = renderShare('https://bk.example.app', 'follow', '"><script>');
  assert.ok(!bad.includes('"><script>'));
  assert.match(bad, /og\/default\.png/);
  assert.equal(describe('follow', '101'), null);
  assert.equal(describe('lure', '0'), null);
  assert.equal(describe('lure', '46'), null);
});
