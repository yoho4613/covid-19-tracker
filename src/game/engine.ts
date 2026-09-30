import { H, W } from './draw.ts';

export interface Game {
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  pointerDown?(x: number, y: number): void;
  pointerMove?(x: number, y: number): void;
  pointerUp?(): void;
}

// 360x640 논리 좌표를 화면에 맞춰 그려 주는 캔버스
export class Stage {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private game: Game | null = null;
  private raf = 0;
  private last = 0;
  private scale = 1;
  private readonly resize: ResizeObserver;

  constructor(private readonly host: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.ctx = this.canvas.getContext('2d')!;
    host.appendChild(this.canvas);
    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(host);
    this.fit();

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.canvas.setPointerCapture?.(e.pointerId);
      const p = this.toLogical(e);
      this.game?.pointerDown?.(p.x, p.y);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      const p = this.toLogical(e);
      this.game?.pointerMove?.(p.x, p.y);
    });
    const up = () => this.game?.pointerUp?.();
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private fit(): void {
    const cs = getComputedStyle(this.host);
    const w = this.host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const h = this.host.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (w <= 0 || h <= 0) return;
    const s = Math.min(w / W, h / H);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = `${W * s}px`;
    this.canvas.style.height = `${H * s}px`;
    this.canvas.width = Math.round(W * s * dpr);
    this.canvas.height = Math.round(H * s * dpr);
    this.scale = s * dpr;
    if (this.game) this.render();
  }

  private toLogical(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  run(game: Game): void {
    this.stop();
    this.game = game;
    this.last = performance.now();
    const loop = (t: number) => {
      // 탭 전환 등으로 멈췄다 돌아와도 시간이 튀지 않게 한 프레임 최대 50ms
      const dt = Math.min((t - this.last) / 1000, 0.05);
      this.last = t;
      this.game?.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private render(): void {
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.ctx.clearRect(0, 0, W, H);
    this.game?.draw(this.ctx);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.game = null;
  }
}
