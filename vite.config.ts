import { defineConfig, type Plugin } from 'vite';
import { SHARK_SVG } from './src/ui/sharkSvg';
import { escapeHtml, profileHtml, statusView, timelineHtml } from './src/ui/statusView';

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
      };
      return html.replace(/%([A-Z_]+)%/g, (m, key: string) => values[key] ?? m);
    },
  };
}

export default defineConfig({
  plugins: [prerenderStatus()],
  build: { target: 'es2020' },
});
