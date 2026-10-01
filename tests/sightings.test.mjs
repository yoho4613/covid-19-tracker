import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SIGHTING_BOUNDS, LOCATION } from '../src/data/status.ts';

process.env.KV_REST_API_URL = 'https://redis.test';
process.env.KV_REST_API_TOKEN = 'token';
const { BOUNDS, decode, encode, validPoint, default: handler } = await import('../api/sightings.js');

function mockRes() {
  const res = { code: 0, headers: {}, body: null };
  res.setHeader = (k, v) => (res.headers[k] = v);
  res.status = (c) => ((res.code = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
}

test('report area matches the client and contains the canal', () => {
  assert.deepEqual(BOUNDS, SIGHTING_BOUNDS);
  assert.ok(validPoint(LOCATION.lat, LOCATION.lng));
  assert.ok(!validPoint(35.2, 129.0464));
  assert.ok(!validPoint('35.11', 129.04));
});

test('members round-trip', () => {
  const m = encode(1790000000000, 35.11441234, 129.04641234);
  assert.deepEqual(decode(m), { t: 1790000000000, lat: 35.11441, lng: 129.04641 });
});

test('post stores a sighting once per cooldown', async () => {
  let first = 'OK';
  const calls = [];
  globalThis.fetch = async (_url, init) => {
    const cmds = JSON.parse(init.body);
    calls.push(cmds);
    return { ok: true, json: async () => cmds.map((c) => ({ result: c[0] === 'SET' ? first : 1 })) };
  };
  const req = { method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4' }, body: { lat: 35.1144, lng: 129.0464 } };
  const ok = mockRes();
  await handler(req, ok);
  assert.equal(ok.code, 200);
  assert.equal(calls[1][0][0], 'ZADD');
  assert.ok(!JSON.stringify(calls).includes('1.2.3.4'), 'raw IP must not be sent to storage');

  first = null;
  const again = mockRes();
  await handler(req, again);
  assert.equal(again.code, 429);

  const out = mockRes();
  await handler({ method: 'POST', headers: {}, body: { lat: 37.5, lng: 127 } }, out);
  assert.equal(out.code, 400);
});
