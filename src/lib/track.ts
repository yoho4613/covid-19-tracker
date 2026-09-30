// Vercel Web Analytics 사용자 이벤트. 스크립트가 늦게 로드돼도 큐에 쌓아 둔다.
type Va = (...args: unknown[]) => void;

declare global {
  interface Window {
    va?: Va;
    vaq?: unknown[][];
  }
}

window.va ??= (...args: unknown[]) => {
  (window.vaq ??= []).push(args);
};

export function track(name: string, data?: Record<string, string | number>): void {
  window.va?.('event', { name, data });
}
