import { FONT, H, W, Effects, bigText, drawBait, drawShark, hudPill, speechBubble, waterSparkles } from './draw.ts';
import type { Game } from './engine.ts';
import { Path, type Pt, angleTo, pick, rand, turnToward } from './path.ts';
import { LURE_LIMIT, lureTier, type GameResult } from './tiers.ts';

// 부캉이 유인하기: 먹이로 길을 만들어 S자 수로 끝의 바다까지 데려간다.

export const CANAL = new Path([
  { x: 180, y: 690 },
  { x: 180, y: 540 },
  { x: 92, y: 450 },
  { x: 92, y: 340 },
  { x: 268, y: 250 },
  { x: 268, y: 160 },
  { x: 180, y: 95 },
  { x: 180, y: -40 },
]);
export const HALF = 42; // 수로 반폭
export const SEA_Y = 80; // 이보다 위는 탁 트인 바다
const EXIT_Y = 34;
export const HOME_S = 110; // 부캉이가 좋아하는 자리 (경로 거리)
export const BAIT_COUNT = 14;
const BAIT_LIFE = 7;
export const DETECT = 150;
const EAT_R = 16;
const COUNTDOWN = 3;

const STUBBORN_LINES = [
  '싫어! 여기가 좋아',
  '안 가! 🫧',
  '여기 뷰 맛집인데?',
  '사람 구경 더 할래',
  '5분만 더…',
  '나 명예홍보대사야!',
];

export interface Bait extends Pt {
  s: number;
  lateral: number;
  age: number;
}

type Phase = 'countdown' | 'play' | 'escape' | 'done';

function along(s: number, lateral: number): Pt {
  const p = CANAL.at(s);
  return { x: p.x + p.nx * lateral, y: p.y + p.ny * lateral };
}

export class LureGame implements Game {
  phase: Phase = 'countdown';
  private countdown = COUNTDOWN;
  elapsed = 0;
  baitsLeft = BAIT_COUNT;
  baits: Bait[] = [];
  shark = { x: 0, y: 0, angle: -Math.PI / 2, speed: 0, t: 0 };
  private stubborn = 0;
  private nextStubborn = rand(3.5, 6);
  private munch = 0;
  private bubble: { text: string; age: number } | null = null;
  private idle = 0;
  private outOfBait = 0;
  private escape = 0;
  successTime: number | null = null;
  private readonly fx = new Effects();
  private t = 0;
  private readonly crowd: { x: number; y: number; c: string }[] = [];

  constructor(private readonly onFinish: (r: GameResult) => void) {
    const home = CANAL.at(HOME_S);
    this.shark.x = home.x;
    this.shark.y = home.y;
    const colors = ['#ff8a80', '#ffd180', '#80d8ff', '#b9f6ca', '#ea80fc', '#ffe57f'];
    for (let s = 40; s < CANAL.total; s += 24) {
      for (const side of [-1, 1]) {
        const p = along(s, side * (HALF + 16 + ((s * 7) % 9)));
        if (p.x < 10 || p.x > W - 10 || p.y < SEA_Y + 14 || p.y > H - 8) continue;
        if (CANAL.nearest(p).dist < HALF + 8) continue;
        this.crowd.push({ ...p, c: colors[(s + (side > 0 ? 3 : 0)) % colors.length] });
      }
    }
  }

  static inWater(x: number, y: number): boolean {
    if (y < SEA_Y) return x > 6 && x < W - 6 && y > 0;
    return CANAL.nearest({ x, y }).dist < HALF - 4;
  }

  pointerDown(x: number, y: number): void {
    if (this.phase !== 'play') return;
    if (this.baitsLeft <= 0) {
      this.fx.add(x, y, '먹이 끝!', '#ffd0c0', 16);
      return;
    }
    if (!LureGame.inWater(x, y)) {
      this.fx.add(x, y, '물 위에 톡!', '#fff', 15);
      return;
    }
    const n = CANAL.nearest({ x, y });
    this.baits.push({ x, y, s: n.s, lateral: n.lateral, age: 0 });
    this.baitsLeft--;
  }

  private chooseBait(s: number): Bait | null {
    let best: Bait | null = null;
    let bestD = Infinity;
    for (const b of this.baits) {
      const ds = Math.abs(b.s - s);
      if (ds > DETECT || Math.hypot(b.x - this.shark.x, b.y - this.shark.y) > DETECT + 40) continue;
      if (ds < bestD) {
        best = b;
        bestD = ds;
      }
    }
    return best;
  }

  // 굽은 수로를 따라가도록 먼 먹이는 중심선 위의 중간 지점을 목표로 삼는다
  private navTarget(s: number, b: Bait): Pt {
    const ds = b.s - s;
    if (Math.abs(ds) <= 45) return b;
    const lat = Math.max(-HALF + 14, Math.min(HALF - 14, b.lateral)) * 0.6;
    return along(s + Math.sign(ds) * 45, lat);
  }

  update(dt: number): void {
    this.t += dt;
    this.fx.update(dt);
    const sh = this.shark;
    sh.t += dt * (0.6 + sh.speed / 70);

    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) this.phase = 'play';
      return;
    }
    if (this.phase === 'done') return;
    if (this.phase === 'play') this.elapsed += dt;

    for (const b of this.baits) b.age += dt;
    this.baits = this.baits.filter((b) => b.age < BAIT_LIFE);
    if (this.bubble && (this.bubble.age += dt) > 1.7) this.bubble = null;

    const near = CANAL.nearest(sh);
    let target: Pt;
    let speed: number;

    if (this.phase === 'escape' || sh.y < SEA_Y) {
      target = { x: sh.x, y: -120 };
      speed = 95;
    } else if (this.stubborn > 0) {
      this.stubborn -= dt;
      target = along(near.s - 70, near.lateral * 0.5);
      speed = 110;
    } else {
      const bait = this.chooseBait(near.s);
      if (bait) {
        this.idle = 0;
        target = this.navTarget(near.s, bait);
        speed = 82;
      } else {
        this.idle += dt;
        if (this.idle > 1) {
          // 먹이가 없으면 슬금슬금 최애 자리로 돌아간다
          target = along(Math.max(HOME_S, near.s - 50), Math.sin(this.t) * 14);
          speed = near.s > HOME_S + 20 ? 34 : 22;
        } else {
          target = along(near.s + 12, near.lateral);
          speed = 30;
        }
      }
    }

    if (this.phase === 'play' && this.stubborn <= 0) {
      this.nextStubborn -= dt;
      if (this.nextStubborn <= 0) {
        this.nextStubborn = rand(3.5, 6);
        if (near.s > HOME_S + 90 && sh.y > SEA_Y + 30 && Math.random() < 0.55) {
          this.stubborn = 1.5;
          this.bubble = { text: pick(STUBBORN_LINES), age: 0 };
        }
      }
    }

    if (this.munch > 0) {
      this.munch -= dt;
      speed = 12;
    }
    sh.angle = turnToward(sh.angle, angleTo(sh, target), 3.4 * dt);
    sh.speed += (speed - sh.speed) * Math.min(1, dt * 3);
    sh.x += Math.cos(sh.angle) * sh.speed * dt;
    sh.y += Math.sin(sh.angle) * sh.speed * dt;
    this.constrain();

    for (const b of this.baits) {
      if (Math.hypot(b.x - sh.x, b.y - sh.y) < EAT_R) {
        b.age = BAIT_LIFE;
        this.munch = 0.4;
        this.fx.add(b.x, b.y - 10, '냠!', '#ffe08a', 18);
      }
    }

    if (this.phase === 'play') {
      if (sh.y < EXIT_Y) {
        this.successTime = Math.round(this.elapsed * 10) / 10;
        this.phase = 'escape';
        this.fx.add(sh.x, sh.y + 20, '바다다!', '#b3f0ff', 26);
      } else if (this.elapsed >= LURE_LIMIT) {
        this.finish(null);
      } else if (this.baitsLeft === 0 && this.baits.length === 0 && sh.y > SEA_Y) {
        this.outOfBait += dt;
        if (this.outOfBait > 2.5) this.finish(null);
      }
    } else if (this.phase === 'escape') {
      this.escape += dt;
      if (this.escape > 1.3) this.finish(this.successTime);
    }
  }

  private constrain(): void {
    const sh = this.shark;
    if (sh.y < SEA_Y - 10) {
      sh.x = Math.max(14, Math.min(W - 14, sh.x));
      return;
    }
    const n = CANAL.nearest(sh);
    const lim = HALF - 12;
    if (n.dist > lim) {
      sh.x = n.x + ((sh.x - n.x) * lim) / n.dist;
      sh.y = n.y + ((sh.y - n.y) * lim) / n.dist;
    }
    if (n.s < 40) {
      const p = along(40, Math.max(-lim, Math.min(lim, n.lateral)));
      sh.x = p.x;
      sh.y = p.y;
    }
  }

  private finish(score: number | null): void {
    if (this.phase === 'done') return;
    this.phase = 'done';
    this.onFinish({ game: 'lure', score, tier: lureTier(score) });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 친수공원 바닥
    ctx.fillStyle = '#ece4d0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c5e3ae';
    for (const [x, y, w, h] of [
      [8, 110, 60, 90],
      [300, 300, 52, 110],
      [14, 560, 70, 70],
      [250, 470, 90, 60],
    ]) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 18);
      ctx.fill();
    }

    // 수로
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    const trace = () => {
      ctx.beginPath();
      CANAL.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    };
    trace();
    ctx.strokeStyle = '#bfae90';
    ctx.lineWidth = HALF * 2 + 12;
    ctx.stroke();
    trace();
    ctx.strokeStyle = '#3aa3d3';
    ctx.lineWidth = HALF * 2;
    ctx.stroke();
    trace();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = HALF;
    ctx.stroke();
    ctx.restore();

    // 바다
    const g = ctx.createLinearGradient(0, 0, 0, SEA_Y);
    g.addColorStop(0, '#12598a');
    g.addColorStop(1, '#2a8fc4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, SEA_Y);
    waterSparkles(ctx, this.t, 0, 12, W, SEA_Y - 20);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('바다 🌊', 12, SEA_Y - 10);
    ctx.textAlign = 'center';
    ctx.fillText('▲ 출구', 180, SEA_Y + 16);

    // 관람객
    for (const c of this.crowd) {
      ctx.fillStyle = c.c;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3d2b3';
      ctx.beginPath();
      ctx.arc(c.x, c.y - 1, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    const home = along(HOME_S, -HALF - 30);
    ctx.fillStyle = '#6d5f47';
    ctx.font = `13px ${FONT}`;
    ctx.fillText('부캉이 최애 자리', home.x + 30, home.y + 30);

    // 감지 범위
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.shark.x, this.shark.y, DETECT * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (const b of this.baits) drawBait(ctx, b.x, b.y, b.age, BAIT_LIFE);
    drawShark(ctx, { ...this.shark, wiggle: this.stubborn > 0 ? 1.8 : 1 });
    if (this.bubble) speechBubble(ctx, this.shark.x, this.shark.y - 20, this.bubble.text, Math.min(1, (1.7 - this.bubble.age) * 3));
    this.fx.draw(ctx);

    const left = Math.max(0, LURE_LIMIT - this.elapsed);
    hudPill(ctx, 10, 10, `⏱ ${left.toFixed(1)}`, 'left');
    hudPill(ctx, W - 10, 10, `🐟 × ${this.baitsLeft}`, 'right');

    if (this.phase === 'countdown') {
      ctx.fillStyle = 'rgba(11,58,91,0.35)';
      ctx.fillRect(0, 0, W, H);
      bigText(ctx, String(Math.ceil(this.countdown)), H / 2 - 30, 88);
      bigText(ctx, '물을 톡 누르면 먹이가 떨어져요', H / 2 + 50, 20);
    }
  }
}
