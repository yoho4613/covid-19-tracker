import { defineConfig, type Plugin } from 'vite';
import { CONFIG } from './src/config.ts';
import { LOCATION } from './src/data/status.ts';
import { SHARK_SVG } from './src/ui/sharkSvg.ts';
import { MAP_LINKS, escapeHtml, faqHtml, jsonLd, profileHtml, statusView, timelineHtml } from './src/ui/statusView.ts';

function verifyMeta(): string {
  const { naver, google } = CONFIG.verification;
  return [
    naver && `<meta name="naver-site-verification" content="${escapeHtml(naver)}" />`,
    google && `<meta name="google-site-verification" content="${escapeHtml(google)}" />`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

// 빌드 시점의 상태를 HTML에 미리 채워 넣는다 (검색엔진·링크 미리보기용). 화면에서는 JS가 다시 계산한다.
function prerenderStatus(): Plugin {
  return {
    name: 'prerender-status',
    transformIndexHtml(html) {
      const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
      const siteUrl = host ? `https://${host}` : 'http://localhost:5173';
      const v = statusView();
      const values: Record<string, string> = {
        SITE_URL: siteUrl,
        SHARK_SVG,
        STATUS_MODE: v.mode,
        MODE_BADGE: escapeHtml(v.badge),
        MODE_LINE: escapeHtml(v.line),
        DAY_LABEL: escapeHtml(v.dayLabel),
        DAY_COUNT: escapeHtml(v.dayCount),
        DAY_UNIT: escapeHtml(v.dayUnit),
        UPDATED: escapeHtml(v.updated),
        NEXT_TITLE: escapeHtml(v.nextTitle),
        NEXT_DATE: escapeHtml(v.nextDate),
        NEXT_DDAY: escapeHtml(v.nextDday),
        PROFILE: profileHtml(),
        TIMELINE: timelineHtml(),
        FAQ: faqHtml(),
        JSON_LD: jsonLd(siteUrl),
        VERIFY_META: verifyMeta(),
        LOCATION_LATEST: escapeHtml(LOCATION.latest),
        LOCATION_ADDRESS: escapeHtml(LOCATION.address),
        LOCATION_ACCESS: escapeHtml(LOCATION.access),
        KAKAO_ROUTE: MAP_LINKS.kakaoRoute,
        NAVER_SEARCH: MAP_LINKS.naverSearch,
      };
      return html.replace(/%([A-Z_]+)%/g, (m, key: string) => values[key] ?? m);
    },
  };
}

export default defineConfig({
  plugins: [prerenderStatus()],
  // 지도 라이브러리(maplibre-gl)는 지도 섹션에 가까워질 때만 따로 불러오는 큰 청크다
  build: { target: 'es2020', chunkSizeWarningLimit: 1100 },
});
