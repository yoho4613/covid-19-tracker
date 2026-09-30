// 전국 통계 API: 응원 수, 게임 플레이 수, 점수 분포(전국 상위 %)
// 저장소는 Vercel 마켓플레이스의 Upstash Redis. 환경변수가 없으면 { enabled: false } 를 돌려주고 화면은 통계만 숨긴다.

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const P = 'bk:';
const LURE_LIMIT = 45;

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

// 유효한 점수면 true. lure: 성공 시간(초) 또는 실패 null / follow: 0~100 정수
export function validScore(game, score) {
  if (game === 'lure') return score === null || (typeof score === 'number' && score > 0 && score <= LURE_LIMIT);
  if (game === 'follow') return Number.isInteger(score) && score >= 0 && score <= 100;
  return false;
}

export function bucketOf(game, score) {
  if (game === 'lure') return score === null ? 'fail' : String(Math.floor(score));
  return String(score);
}

// hist: { 구간: 인원 } (이번 기록 포함). lure 는 짧을수록, follow 는 높을수록 좋다.
export function topPercent(game, bucket, hist) {
  let total = 0;
  let better = 0;
  for (const [k, v] of Object.entries(hist)) {
    const n = Number(v) || 0;
    total += n;
    if (game === 'lure') {
      if (k !== 'fail' && Number(k) < Number(bucket)) better += n;
    } else if (Number(k) > Number(bucket)) {
      better += n;
    }
  }
  if (!total) return null;
  return Math.min(100, Math.max(1, Math.ceil(((better + 1) / total) * 100)));
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
  try {
    if (req.method === 'GET') {
      const [[cheers, lure, follow, released]] = await redis([
        ['MGET', `${P}cheers`, `${P}plays:lure`, `${P}plays:follow`, `${P}released`],
      ]);
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=60');
      return res.status(200).json({
        enabled: true,
        cheers: Number(cheers) || 0,
        plays: { lure: Number(lure) || 0, follow: Number(follow) || 0 },
        released: Number(released) || 0,
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

    res.setHeader('Cache-Control', 'no-store');
    const body = readBody(req);

    if (body.type === 'cheer') {
      const n = Math.max(1, Math.min(50, Math.floor(Number(body.n)) || 1));
      const [cheers] = await redis([['INCRBY', `${P}cheers`, n]]);
      return res.status(200).json({ enabled: true, cheers });
    }

    if (body.type === 'play') {
      const { game } = body;
      const score = body.score ?? null;
      if (!validScore(game, score)) return res.status(400).json({ error: 'invalid score' });
      const bucket = bucketOf(game, score);
      const success = game === 'lure' && score !== null;
      const cmds = [
        ['INCR', `${P}plays:${game}`],
        ['HINCRBY', `${P}hist:${game}`, bucket, 1],
      ];
      if (success) cmds.push(['INCR', `${P}released`]);
      cmds.push(['HGETALL', `${P}hist:${game}`]);
      const out = await redis(cmds);
      const flat = out[out.length - 1] || [];
      const hist = {};
      for (let i = 0; i < flat.length; i += 2) hist[flat[i]] = Number(flat[i + 1]);
      return res.status(200).json({
        enabled: true,
        topPercent: game === 'lure' && score === null ? null : topPercent(game, bucket, hist),
        released: success ? out[2] : null,
      });
    }

    return res.status(400).json({ error: 'unknown type' });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ enabled: false });
  }
}
