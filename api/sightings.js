// 부캉이 목격 제보 API. 부캉이에게는 추적 장치가 없어서, 현장 관람객이 지도에서 직접 찍은
// 목격 위치를 모아 최근 위치를 추정한다. 기기 위치(GPS)는 받지 않는다.
//
//   GET  최근 60분 제보 목록
//   POST { lat, lng } 제보 하나 추가 (같은 사람은 2분에 한 번)

import { createHash } from 'node:crypto';

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'bk:sightings';
const WINDOW_MS = 60 * 60 * 1000;
const KEEP_MS = 2 * WINDOW_MS;
const MAX_KEEP = 500;
const COOLDOWN_S = 120;

// src/data/status.ts 의 SIGHTING_BOUNDS 와 같다 (tests/sightings.test.mjs 에서 확인)
export const BOUNDS = { minLat: 35.104, maxLat: 35.125, minLng: 129.034, maxLng: 129.06 };

async function redis(commands) {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  const out = await res.json();
  return out.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}

export function validPoint(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= BOUNDS.minLat &&
    lat <= BOUNDS.maxLat &&
    lng >= BOUNDS.minLng &&
    lng <= BOUNDS.maxLng
  );
}

// 멤버 형식: "<ms>:<lat>:<lng>:<무작위>"
export function encode(t, lat, lng) {
  return `${t}:${lat.toFixed(5)}:${lng.toFixed(5)}:${Math.random().toString(36).slice(2, 8)}`;
}

export function decode(member) {
  const [t, lat, lng] = String(member).split(':');
  return { t: Number(t), lat: Number(lat), lng: Number(lng) };
}

// 원래 IP는 저장하지 않고, 제보 간격 제한에만 해시로 2분간 쓴다
function clientKey(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();
  return createHash('sha256').update(`bukangi:${ip}`).digest('hex').slice(0, 24);
}

function readBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  return req.body || {};
}

export default async function handler(req, res) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(200).json({ enabled: false });
  }
  const now = Date.now();
  try {
    if (req.method === 'GET') {
      const [, members] = await redis([
        ['ZREMRANGEBYSCORE', KEY, '-inf', String(now - KEEP_MS)],
        ['ZRANGEBYSCORE', KEY, String(now - WINDOW_MS), '+inf'],
      ]);
      res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
      return res.status(200).json({ enabled: true, now, sightings: (members || []).map(decode) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

    res.setHeader('Cache-Control', 'no-store');
    const { lat, lng } = readBody(req);
    if (!validPoint(lat, lng)) return res.status(400).json({ error: 'out of area' });

    const [first] = await redis([['SET', `bk:rl:${clientKey(req)}`, '1', 'EX', COOLDOWN_S, 'NX']]);
    if (first !== 'OK') return res.status(429).json({ enabled: true, error: 'too soon', retryAfter: COOLDOWN_S });

    await redis([
      ['ZADD', KEY, String(now), encode(now, lat, lng)],
      ['ZREMRANGEBYRANK', KEY, '0', String(-MAX_KEEP - 1)],
    ]);
    return res.status(200).json({ enabled: true, ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ enabled: false });
  }
}
