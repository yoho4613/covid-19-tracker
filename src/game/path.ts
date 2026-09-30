export interface Pt {
  x: number;
  y: number;
}

export interface Nearest {
  s: number; // 경로 시작점부터의 거리
  x: number;
  y: number;
  dist: number;
  lateral: number; // 진행 방향 기준 왼쪽(+) / 오른쪽(-) 거리
  nx: number; // 왼쪽 법선
  ny: number;
}

// 수로 중심선 (꺾은선)
export class Path {
  private readonly cum: number[] = [0];
  readonly total: number;

  constructor(readonly pts: Pt[]) {
    for (let i = 1; i < pts.length; i++) {
      this.cum.push(this.cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    this.total = this.cum[this.cum.length - 1];
  }

  nearest(p: Pt): Nearest {
    let best: Nearest | null = null;
    for (let i = 0; i < this.pts.length - 1; i++) {
      const a = this.pts[i];
      const b = this.pts[i + 1];
      const len = this.cum[i + 1] - this.cum[i];
      const tx = (b.x - a.x) / len;
      const ty = (b.y - a.y) / len;
      const u = Math.max(0, Math.min(len, (p.x - a.x) * tx + (p.y - a.y) * ty));
      const x = a.x + tx * u;
      const y = a.y + ty * u;
      const dist = Math.hypot(p.x - x, p.y - y);
      if (!best || dist < best.dist) {
        const nx = ty;
        const ny = -tx;
        best = { s: this.cum[i] + u, x, y, dist, nx, ny, lateral: (p.x - x) * nx + (p.y - y) * ny };
      }
    }
    return best!;
  }

  at(s: number): Pt & { nx: number; ny: number } {
    const c = Math.max(0, Math.min(this.total, s));
    let i = 0;
    while (i < this.pts.length - 2 && this.cum[i + 1] < c) i++;
    const a = this.pts[i];
    const b = this.pts[i + 1];
    const len = this.cum[i + 1] - this.cum[i];
    const tx = (b.x - a.x) / len;
    const ty = (b.y - a.y) / len;
    const u = c - this.cum[i];
    return { x: a.x + tx * u, y: a.y + ty * u, nx: ty, ny: -tx };
  }
}

export function angleTo(from: Pt, to: Pt): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function turnToward(current: number, target: number, maxStep: number): number {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return current + Math.max(-maxStep, Math.min(maxStep, d));
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
