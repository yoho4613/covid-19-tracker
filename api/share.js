// 게임 결과 공유 링크 (/s/:game/:score). 카카오톡 등 링크 미리보기에 결과별 제목·이미지를 보여 주고 게임으로 보낸다.

// src/game/tiers.ts 와 같은 기준 (tests/share.test.mjs 에서 확인)
export const LURE_THRESHOLDS = [12, 17, 24, 33, 45];
export const FOLLOW_THRESHOLDS = [90, 75, 55, 35];

export function lureTierId(seconds) {
  if (seconds === null) return 0;
  const i = LURE_THRESHOLDS.findIndex((t) => seconds <= t);
  return i === -1 ? 0 : i + 1;
}

export function followTierId(percent) {
  const i = FOLLOW_THRESHOLDS.findIndex((t) => percent >= t);
  return i === -1 ? FOLLOW_THRESHOLDS.length + 1 : i + 1;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// 잘못된 값이면 null (기본 미리보기로 대체)
export function describe(game, raw) {
  if (game === 'lure') {
    if (raw === 'fail') {
      return { title: '부캉이가 45초 동안 버텼다… 너는 바다로 보낼 수 있어?', image: 'lure-0' };
    }
    const n = Number(raw);
    if (!(n > 0 && n <= 45)) return null;
    return { title: `${n.toFixed(1)}초 만에 부캉이를 바다로 보냈다! 🦈🌊`, image: `lure-${lureTierId(n)}` };
  }
  if (game === 'follow') {
    const p = Number(raw);
    if (!Number.isInteger(p) || p < 0 || p > 100) return null;
    return { title: `부캉이 추적률 ${p}%! 너는 몇 %?`, image: `follow-${followTierId(p)}` };
  }
  return null;
}

export function renderShare(origin, game, raw) {
  const safeGame = game === 'follow' ? 'follow' : 'lure';
  const d = describe(game, raw);
  const title = d ? d.title : '부캉이 트래커 미니게임';
  const image = `${origin}/og/${d ? d.image : 'default'}.png`;
  const url = `${origin}/s/${esc(safeGame)}/${esc(raw)}`;
  const target = `/?utm_source=share#/${safeGame}`;
  const desc = '북항 상어 부캉이를 바다까지 유인하고, 놓치지 않고 따라가 보세요. 너도 해봐!';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | 부캉이 트래커</title>
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="부캉이 트래커">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body style="font-family:sans-serif;text-align:center;padding:40px 16px">
<p>${esc(title)}</p>
<p><a href="${target}">부캉이 게임하러 가기 →</a></p>
</body>
</html>`;
}

export default function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const game = String(req.query.game ?? '');
  const raw = String(req.query.score ?? '').slice(0, 10);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(renderShare(`https://${host}`, game, raw));
}
