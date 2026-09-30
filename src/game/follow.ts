import { FONT, H, W, Effects, bigText, drawShark, pill, waterSparkles } from './draw.ts';
import type { Game } from './engine.ts';
import { angleTo, rand, turnToward } from './path.ts';
import { FOLLOW_DURATION, followTier, type GameResult } from './tiers.ts';

// 부캉이 따라다니기: 30초 동안 손가락(마우스)을 부캉이 위에 올려 두고 따라간다.

export const TRACK_R = 44;
const COUNTDOWN = 3;
const TOP = 104;
const BOTTOM = H - 30;

type Phase = 'countdown' | 'play' | 'done';

export class FollowGame implements Game {
  phase: Phase = 'countdown';
  private countdown = COUNTDOWN;
  elapsed = 0;
  tracked = 0;
  shark = { x: W / 2, y: H / 2 + 60, angle: -Math.PI / 2, speed: 60, t: 0 };
  private waypoint = { x: W / 2, y: H / 2 };
  private wpTimer = 0;
  private dash = 0;
  private dashCooldown = rand(2.5, 4);
  private dive = 0;
  private diveCooldown = rand(8, 10);
  pointer = { x: 0, y: 0, down: false };
  tracking = false;
  private lostFlash = 0;
  private streak = 0;
  private readonly fx = new Effects();
  private t = 0;
  private readonly ripples: { x: number; y: number; age: number }[] = [];
  private rippleTimer = 0;

  constructor(private readonly onFinish: (r: GameResult) => void) {}

  pointerDown(x: number, y: number): void {
    this.pointer = { x, y, down: true };
  }

  pointerMove(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  pointerUp(): void {
    this.pointer.down = false;
  }

  get percent(): number {
    return this.elapsed > 0 ? Math.round((this.tracked / this.elapsed) * 100) : 0;
  }

  private newWaypoint(): void {
    this.waypoint = { x: rand(40, W - 40), y: rand(TOP + 20, BOTTOM - 20) };
    this.wpTimer = rand(1.1, 2.3);
  }

  update(dt: number): void {
    this.t += dt;
    this.fx.update(dt);
    const sh = this.shark;
    sh.t += dt * (0.6 + sh.speed / 80);

    for (const r of this.ripples) r.age += dt;
    while (this.ripples.length && this.ripples[0].age > 1.2) this.ripples.shift();
    this.rippleTimer -= dt;
    if (this.rippleTimer <= 0) {
      this.rippleTimer = 0.18;
      this.ripples.push({ x: sh.x - Math.cos(sh.angle) * 26, y: sh.y - Math.sin(sh.angle) * 26, age: 0 });
    }

    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.phase = 'play';
        this.newWaypoint();
      }
      return;
    }
    if (this.phase === 'done') return;

    this.elapsed += dt;
    const progress = Math.min(1, this.elapsed / FOLLOW_DURATION);

    this.dashCooldown -= dt;
    if (this.dashCooldown <= 0) {
      this.dash = 0.55;
      this.dashCooldown = rand(2.4, 4.2) - progress;
      this.newWaypoint();
    }
    if (this.dash > 0) this.dash -= dt;

    if (this.elapsed > 8) {
      this.diveCooldown -= dt;
      if (this.diveCooldown <= 0) {
        this.dive = 1.1;
        this.diveCooldown = rand(5, 7);
      }
    }
    if (this.dive > 0) this.dive -= dt;

    this.wpTimer -= dt;
    if (this.wpTimer <= 0 || Math.hypot(this.waypoint.x - sh.x, this.waypoint.y - sh.y) < 30) this.newWaypoint();

    const speed = (70 + 120 * progress) * (this.dash > 0 ? 2 : 1);
    sh.speed += (speed - sh.speed) * Math.min(1, dt * 4);
    sh.angle = turnToward(sh.angle, angleTo(sh, this.waypoint), (3 + progress * 2.5) * dt);
    sh.x += Math.cos(sh.angle) * sh.speed * dt;
    sh.y += Math.sin(sh.angle) * sh.speed * dt;
    if (sh.x < 24 || sh.x > W - 24 || sh.y < TOP || sh.y > BOTTOM) {
      sh.x = Math.max(24, Math.min(W - 24, sh.x));
      sh.y = Math.max(TOP, Math.min(BOTTOM, sh.y));
      this.newWaypoint();
    }

    const was = this.tracking;
    this.tracking = this.pointer.down && Math.hypot(this.pointer.x - sh.x, this.pointer.y - sh.y) < TRACK_R;
    if (this.tracking) {
      this.tracked += dt;
      this.streak += dt;
      if (Math.floor(this.streak / 5) > Math.floor((this.streak - dt) / 5)) {
        this.fx.add(sh.x, sh.y - 30, `${Math.floor(this.streak)}초 연속!`, '#b9f6ca', 18);
      }
    } else {
      if (was) this.lostFlash = 0.6;
      this.streak = 0;
    }
    if (this.lostFlash > 0) this.lostFlash -= dt;

    if (this.elapsed >= FOLLOW_DURATION) {
      this.phase = 'done';
      const pct = Math.round((this.tracked / FOLLOW_DURATION) * 100);
      this.onFinish({ game: 'follow', score: pct, tier: followTier(pct) });
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1d7fb6');
    g.addColorStop(1, '#0f4f7d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    waterSparkles(ctx, this.t, 0, 90, W, H - 100);

    // 부두와 부표
    ctx.fillStyle = '#c9bca3';
    ctx.fillRect(0, 0, W, 86);
    ctx.fillStyle = '#b3a589';
    for (let x = 6; x < W; x += 44) ctx.fillRect(x, 78, 30, 8);

    for (const r of this.ripples) {
      ctx.strokeStyle = `rgba(255,255,255,${0.35 * (1 - r.age / 1.2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6 + r.age * 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawShark(ctx, { ...this.shark, alpha: this.dive > 0 ? 0.28 : 1, size: 1.1, wiggle: this.dash > 0 ? 1.8 : 1 });

    if (this.pointer.down && this.phase !== 'done') {
      const { x, y } = this.pointer;
      ctx.save();
      ctx.strokeStyle = this.tracking ? '#69f0ae' : '#ff8a80';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, TRACK_R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - TRACK_R - 8, y);
      ctx.lineTo(x - TRACK_R + 10, y);
      ctx.moveTo(x + TRACK_R - 10, y);
      ctx.lineTo(x + TRACK_R + 8, y);
      ctx.moveTo(x, y - TRACK_R - 8);
      ctx.lineTo(x, y - TRACK_R + 10);
      ctx.moveTo(x, y + TRACK_R - 10);
      ctx.lineTo(x, y + TRACK_R + 8);
      ctx.stroke();
      ctx.restore();
    }
    this.fx.draw(ctx);

    // 상단 정보
    const left = Math.max(0, FOLLOW_DURATION - this.elapsed);
    ctx.fillStyle = 'rgba(11,58,91,0.25)';
    pill(ctx, 12, 12, W - 24, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#ffb347';
    pill(ctx, 12, 12, Math.max(10, (W - 24) * (left / FOLLOW_DURATION)), 10, 5);
    ctx.fill();
    ctx.fillStyle = '#0b3a5b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `20px ${FONT}`;
    ctx.fillText(`추적률 ${this.percent}%`, 14, 46);
    ctx.textAlign = 'right';
    ctx.font = `16px ${FONT}`;
    const status = this.phase !== 'play' ? '' : this.tracking ? '● 추적 중' : this.lostFlash > 0 ? '놓쳤다!' : '○ 부캉이를 눌러요';
    ctx.fillStyle = this.tracking ? '#1b8a4c' : '#c0392b';
    ctx.fillText(status, W - 14, 46);
    ctx.fillStyle = '#5b4a2e';
    ctx.textAlign = 'right';
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`${left.toFixed(1)}초`, W - 14, 70);

    if (this.phase === 'countdown') {
      ctx.fillStyle = 'rgba(11,58,91,0.35)';
      ctx.fillRect(0, 0, W, H);
      bigText(ctx, String(Math.ceil(this.countdown)), H / 2 - 30, 88);
      bigText(ctx, '손가락을 부캉이 위에 올리고 따라가요', H / 2 + 50, 19);
    }
  }
}
