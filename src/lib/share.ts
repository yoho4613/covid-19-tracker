import { CONFIG } from '../config.ts';
import type { GameResult } from '../game/tiers.ts';
import { SHARK_SVG } from '../ui/sharkSvg.ts';

export const GAME_NAMES = { lure: '부캉이 유인하기', follow: '부캉이 따라다니기' } as const;

export function scoreSlug(r: GameResult): string {
  if (r.game === 'lure') return r.score === null ? 'fail' : r.score.toFixed(1);
  return String(r.score);
}

export function shareUrl(r: GameResult): string {
  return `${location.origin}/s/${r.game}/${scoreSlug(r)}`;
}

export function headline(r: GameResult): string {
  if (r.game === 'lure') {
    return r.score === null ? '부캉이가 끝까지 버텼어요…' : `${r.score.toFixed(1)}초 만에 부캉이를 바다로 보냈어요!`;
  }
  return `부캉이 추적률 ${r.score}%!`;
}

export function shareText(r: GameResult): string {
  if (r.game === 'lure') {
    return r.score === null
      ? '부캉이가 안 나가고 버텼다… 🦈 너는 바다로 보낼 수 있어?'
      : `나는 ${r.score.toFixed(1)}초 만에 부캉이를 바다로 보냈다 🦈🌊 [${r.tier.name}] 너도 해봐!`;
  }
  return `부캉이 추적률 ${r.score}%, 나는 '${r.tier.name}' 🎯 너는 몇 %?`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

// 링크 공유: 카카오톡 등에서 결과별 미리보기 카드가 뜬다
export async function shareLink(r: GameResult): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = shareUrl(r);
  const text = shareText(r);
  if (navigator.share) {
    try {
      await navigator.share({ title: '부캉이 트래커', text, url });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyText(`${text}\n${url}`)) ? 'copied' : 'cancelled';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 인스타 스토리 등에 올릴 결과 카드 (1080x1350)
export async function makeCard(r: GameResult, topPercent: number | null): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const font = "'Jua', 'Apple SD Gothic Neo', sans-serif";
  try {
    await document.fonts.load(`80px Jua`);
  } catch {
    /* 기본 글꼴로 그린다 */
  }
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#5fd0e8');
  g.addColorStop(0.45, '#1f8ac0');
  g.addColorStop(1, '#0b3a5b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0b3a5b';
  ctx.font = `52px ${font}`;
  ctx.fillText(`부캉이 트래커 · ${GAME_NAMES[r.game]}`, W / 2, 110);

  try {
    const svg = SHARK_SVG.replace('<svg ', '<svg width="720" height="420" ');
    const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    ctx.drawImage(img, (W - 720) / 2, 170, 720, 420);
  } catch {
    /* 그림 없이 진행 */
  }

  const big = r.game === 'follow' ? `${r.score}%` : r.score === null ? '버팀!' : `${r.score.toFixed(1)}초`;
  ctx.font = `200px ${font}`;
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#0b3a5b';
  ctx.strokeText(big, W / 2, 740);
  ctx.fillStyle = '#fff';
  ctx.fillText(big, W / 2, 740);

  ctx.font = `68px ${font}`;
  const tw = ctx.measureText(r.tier.name).width + 90;
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.roundRect((W - tw) / 2, 880, tw, 110, 55);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(r.tier.name, W / 2, 938);

  ctx.font = `44px ${font}`;
  ctx.fillStyle = '#e8f7fc';
  ctx.fillText(r.tier.desc, W / 2, 1060);
  if (topPercent !== null) {
    ctx.fillStyle = '#ffe08a';
    ctx.fillText(`전국 상위 ${topPercent}%`, W / 2, 1130);
  }

  ctx.font = `38px ${font}`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(`${location.host} · 너도 해봐!`, W / 2, 1270);

  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
}

// 미리 만들어 둔 카드 이미지를 공유 시트로 보내거나 내려받는다 (클릭 직후 바로 실행돼야 해서 blob 을 미리 받는다)
export async function saveCard(blob: Blob): Promise<void> {
  const file = new File([blob], 'bukangi.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bukangi.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

interface KakaoSdk {
  isInitialized(): boolean;
  init(key: string): void;
  Share: { sendDefault(opts: unknown): void };
}

let kakao: Promise<KakaoSdk> | null = null;

export function loadKakao(): Promise<KakaoSdk> | null {
  if (!CONFIG.kakaoJsKey) return null;
  kakao ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.0/kakao.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      const K = (window as unknown as { Kakao: KakaoSdk }).Kakao;
      if (!K.isInitialized()) K.init(CONFIG.kakaoJsKey);
      resolve(K);
    };
    s.onerror = reject;
    document.head.append(s);
  });
  return kakao;
}

export function kakaoShare(K: KakaoSdk, r: GameResult): void {
  const url = shareUrl(r);
  K.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: headline(r),
      description: `[${r.tier.name}] 너도 해볼래? 부캉이 트래커 미니게임`,
      imageUrl: `${location.origin}/og/${r.game}-${r.tier.id}.png`,
      link: { mobileWebUrl: url, webUrl: url },
    },
    buttons: [{ title: '나도 도전하기', link: { mobileWebUrl: url, webUrl: url } }],
  });
}
