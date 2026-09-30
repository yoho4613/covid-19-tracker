import type { GameId } from '../game/tiers.ts';

// 서버 저장소(Upstash Redis)가 연결되지 않았거나 실패하면 null 을 돌려주고, 화면은 전국 통계만 숨긴다.

export interface Stats {
  cheers: number;
  plays: Record<GameId, number>;
  released: number;
}

export interface PlayResult {
  topPercent: number | null;
  released: number | null;
}

async function call<T>(init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch('/api/stats', init);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.enabled ? (data as T) : null;
  } catch {
    return null;
  }
}

export function getStats(): Promise<Stats | null> {
  return call<Stats>();
}

export function submitPlay(game: GameId, score: number | null): Promise<PlayResult | null> {
  return call<PlayResult>({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'play', game, score }),
  });
}

// 응원 클릭은 모아서 한 번에 보낸다
let pending = 0;
let timer = 0;

function flushCheers(beacon = false): void {
  if (!pending) return;
  const body = JSON.stringify({ type: 'cheer', n: pending });
  pending = 0;
  clearTimeout(timer);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/stats', new Blob([body], { type: 'application/json' }));
    return;
  }
  void call({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
}

export function addCheer(): void {
  pending++;
  clearTimeout(timer);
  timer = window.setTimeout(() => flushCheers(), 1500);
}

window.addEventListener('pagehide', () => flushCheers(true));
