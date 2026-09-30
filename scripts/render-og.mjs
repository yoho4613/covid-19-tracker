// 링크 미리보기용 OG 이미지(1200x630)를 public/og/ 에 만든다.
// 사용법: CHROME=/path/to/chrome FONT=/path/to/Jua.ttf node --experimental-transform-types scripts/render-og.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { FOLLOW_THRESHOLDS, LURE_THRESHOLDS, followTier, lureTier } from '../src/game/tiers.ts';
import { SHARK_SVG } from '../src/ui/sharkSvg.ts';

const CHROME = process.env.CHROME;
const FONT = process.env.FONT;
if (!CHROME || !FONT) throw new Error('CHROME, FONT 환경변수가 필요해요');

const out = resolve('public/og');
const tmp = mkdtempSync(join(tmpdir(), 'og-'));

function page({ eyebrow, title, sub, badge }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Jua; src: url('file://${FONT}'); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: Jua, sans-serif;
  background: linear-gradient(160deg, #7fdcf0 0%, #2a9fd6 45%, #0b3a5b 100%); color: #fff; position: relative; }
.shark { position: absolute; right: 40px; top: 120px; width: 560px; transform: rotate(-4deg); }
.shark svg { width: 100%; height: auto; overflow: visible; }
.text { position: absolute; left: 70px; top: 70px; width: 620px; }
.eyebrow { font-size: 40px; color: #0b3a5b; }
h1 { margin-top: 18px; font-size: 92px; line-height: 1.12; text-shadow: 0 5px 0 rgba(11,58,91,.45); }
.badge { display: inline-block; margin-top: 26px; padding: 12px 34px; border-radius: 999px; background: #ff6b4a; font-size: 50px; }
.sub { margin-top: 22px; font-size: 36px; color: #e8f7fc; }
.foot { position: absolute; left: 70px; bottom: 44px; font-size: 32px; color: rgba(255,255,255,.85); }
.wave { position: absolute; left: 0; right: 0; bottom: 0; height: 30px;
  background: radial-gradient(circle at 15px -8px, transparent 20px, rgba(255,255,255,.25) 21px) 0 0 / 42px 30px repeat-x; }
</style></head><body>
<div class="shark">${SHARK_SVG}</div>
<div class="text">
  <p class="eyebrow">${eyebrow}</p>
  <h1>${title}</h1>
  ${badge ? `<p class="badge">${badge}</p>` : ''}
  ${sub ? `<p class="sub">${sub}</p>` : ''}
</div>
<p class="foot">🦈 부캉이 트래커 · 비공식 팬사이트</p>
<div class="wave"></div>
</body></html>`;
}

function render(name, opts) {
  const html = join(tmp, `${name}.html`);
  writeFileSync(html, page(opts));
  execFileSync(CHROME, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    '--virtual-time-budget=2000',
    `--screenshot=${join(out, `${name}.png`)}`,
    `file://${html}`,
  ], { stdio: 'ignore' });
  console.log('og', name);
}

render('default', {
  eyebrow: '북항 상어 부캉이 오늘 상태',
  title: '부캉이<br>트래커',
  sub: '며칠째 버티는 중? 미니게임까지!',
});

const lure = [lureTier(null), ...LURE_THRESHOLDS.map((t) => lureTier(t))];
for (const tier of lure) {
  render(`lure-${tier.id}`, {
    eyebrow: '부캉이 유인하기 결과',
    title: tier.id === 0 ? '부캉이가<br>버텼다!' : '바다로<br>보냈다!',
    badge: tier.name,
    sub: '너도 부캉이를 바다로 보내 봐',
  });
}

const follow = [...FOLLOW_THRESHOLDS.map((t) => followTier(t)), followTier(0)];
for (const tier of follow) {
  render(`follow-${tier.id}`, {
    eyebrow: '부캉이 따라다니기 결과',
    title: '부캉이<br>추적 완료',
    badge: tier.name,
    sub: '너는 몇 % 따라갈 수 있어?',
  });
}
