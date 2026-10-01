import type { GameId } from '../game/tiers.ts';

// 서버 저장소(Upstash Redis)가 연결되지 않았거나 실패하면 null 을 돌려주고, 화면은 전국 통계만 숨긴다.

export interface Stats {
  cheers: number;
  cheerers: number;
  plays: Record<GameId, number>;
  released: number;
}

export interface PlayResult {
  topPercent: number | null;
  released: number | null;
}

export interface Sighting {
  t: number;
  lat: number;
  lng: number;
}

export interface Sightings {
  now: number;
  sightings: Sighting[];
}

async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, init);
    const data = await res.json().catch(() => null);
    if (!res.ok && res.status !== 429) return null;
    return data?.enabled ? (data as T) : null;
  } catch {
    return null;
  }
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export function getStats(): Promise<Stats | null> {
  return call<Stats>('/api/stats');
}

export function submitPlay(game: GameId, score: number | null): Promise<PlayResult | null> {
  return call<PlayResult>('/api/stats', json({ type: 'play', game, score }));
}

export function getSightings(): Promise<Sightings | null> {
  return call<Sightings>('/api/sightings');
}

export async function reportSighting(lat: number, lng: number): Promise<'ok' | 'too-soon' | 'error'> {
  const r = await call<{ ok?: boolean; error?: string }>('/api/sightings', json({ lat, lng }));
  if (r?.ok) return 'ok';
  return r?.error === 'too soon' ? 'too-soon' : 'error';
}

// 응원 클릭은 모아서 한 번에 보낸다. 이 브라우저의 첫 응원이면 first 를 붙여 응원한 사람 수를 센다.
const COUNTED_KEY = 'bk-cheerer-counted';
let pending = 0;
let timer = 0;

function counted(): boolean {
  try {
    return localStorage.getItem(COUNTED_KEY) === '1';
  } catch {
    return true; // 저장소를 못 쓰면 매번 새 사람으로 세지 않도록 센 것으로 친다
  }
}

function markCounted(): void {
  try {
    localStorage.setItem(COUNTED_KEY, '1');
  } catch {
    /* 무시 */
  }
}

function flushCheers(beacon = false): void {
  if (!pending) return;
  const first = !counted();
  const body = JSON.stringify({ type: 'cheer', n: pending, first });
  pending = 0;
  clearTimeout(timer);
  if (beacon && navigator.sendBeacon) {
    if (navigator.sendBeacon('/api/stats', new Blob([body], { type: 'application/json' })) && first) markCounted();
    return;
  }
  void call('/api/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).then(
    (r) => {
      if (r && first) markCounted();
    },
  );
}

export function addCheer(): void {
  pending++;
  clearTimeout(timer);
  timer = window.setTimeout(() => flushCheers(), 1500);
}

window.addEventListener('pagehide', () => flushCheers(true));
