import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.KV_REST_API_URL = 'https://redis.test';
process.env.KV_REST_API_TOKEN = 'token';
const { bucketOf, topPercent, validScore, default: handler } = await import('../api/stats.js');

function mockRes() {
  const res = { code: 0, headers: {}, body: null };
  res.setHeader = (k, v) => (res.headers[k] = v);
  res.status = (c) => ((res.code = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
}

test('score validation', () => {
  assert.ok(validScore('lure', 12.3));
  assert.ok(validScore('lure', null));
  assert.ok(!validScore('lure', 0));
  assert.ok(!validScore('lure', 99));
  assert.ok(validScore('follow', 87));
  assert.ok(!validScore('follow', 87.5));
  assert.ok(!validScore('follow', null));
  assert.ok(!validScore('other', 1));
});

test('top percent: lure lower is better, follow higher is better', () => {
  assert.equal(bucketOf('lure', 12.9), '12');
  assert.equal(bucketOf('lure', null), 'fail');
  // 10명 중 나보다 빠른 사람 1명 → 상위 20%
  assert.equal(topPercent('lure', '12', { 10: 1, 12: 3, 20: 4, fail: 2 }), 20);
  // 첫 기록이면 상위 100%
  assert.equal(topPercent('follow', '50', { 50: 1 }), 100);
  // 100명 중 1등 → 상위 1%
  assert.equal(topPercent('follow', '99', { 99: 1, 40: 99 }), 1);
});

test('play request records histogram and returns rank', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const cmds = JSON.parse(init.body);
    calls.push(cmds);
    return {
      ok: true,
      json: async () =>
        cmds.map((c) => ({ result: c[0] === 'HGETALL' ? ['12', '1', '20', '3'] : c[0] === 'INCR' ? 7 : 1 })),
    };
  };
  const res = mockRes();
  await handler({ method: 'POST', body: { type: 'play', game: 'lure', score: 12.4 } }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { enabled: true, topPercent: 25, released: 7 });
  assert.deepEqual(calls[0][1], ['HINCRBY', 'bk:hist:lure', '12', 1]);

  const bad = mockRes();
  await handler({ method: 'POST', body: { type: 'play', game: 'follow', score: 300 } }, bad);
  assert.equal(bad.code, 400);

  const cheer = mockRes();
  await handler({ method: 'POST', body: JSON.stringify({ type: 'cheer', n: 9999 }) }, cheer);
  assert.deepEqual(calls.at(-1), [['INCRBY', 'bk:cheers', 50]]);
});
