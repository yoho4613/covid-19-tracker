export const W = 360;
export const H = 640;
export const FONT = "'Jua', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

export interface SharkPose {
  x: number;
  y: number;
  angle: number;
  t: number; // 꼬리 흔들림용 시간
  alpha?: number;
  size?: number;
  wiggle?: number; // 꼬리 흔드는 속도 배수
}

// 위에서 본 부캉이 (오른쪽을 보고 있는 모양을 angle 만큼 회전)
export function drawShark(ctx: CanvasRenderingContext2D, p: SharkPose): void {
  const s = p.size ?? 1;
  const tail = Math.sin(p.t * 9 * (p.wiggle ?? 1)) * 0.38;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(s, s);
  ctx.globalAlpha = p.alpha ?? 1;

  // 물속 그림자
  ctx.fillStyle = 'rgba(8, 40, 70, 0.18)';
  ctx.beginPath();
  ctx.ellipse(3, 7, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // 꼬리
  ctx.save();
  ctx.translate(-24, 0);
  ctx.rotate(tail);
  ctx.fillStyle = '#5f7690';
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-17, -11);
  ctx.quadraticCurveTo(-11, 0, -17, 11);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 가슴지느러미
  ctx.fillStyle = '#5f7690';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(10, 6 * side);
    ctx.lineTo(-6, 20 * side);
    ctx.lineTo(-2, 6 * side);
    ctx.closePath();
    ctx.fill();
  }

  // 몸통
  ctx.fillStyle = '#7f95ad';
  ctx.beginPath();
  ctx.moveTo(33, 0);
  ctx.bezierCurveTo(31, -9, 14, -11, -2, -9.5);
  ctx.bezierCurveTo(-15, -8, -25, -3.5, -27, 0);
  ctx.bezierCurveTo(-25, 3.5, -15, 8, -2, 9.5);
  ctx.bezierCurveTo(14, 11, 31, 9, 33, 0);
  ctx.fill();

  // 등지느러미
  ctx.fillStyle = '#5f7690';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-3, -3);
  ctx.lineTo(-13, 0);
  ctx.lineTo(-3, 3);
  ctx.closePath();
  ctx.fill();

  // 눈
  ctx.fillStyle = '#1b2430';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(22, 5.6 * side, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawBait(ctx: CanvasRenderingContext2D, x: number, y: number, age: number, life: number): void {
  const fade = Math.min(1, (life - age) / 1.5);
  const bob = Math.sin(age * 5) * 1.5;
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  ctx.translate(x, y + bob);
  // 퍼지는 물결
  const r = 8 + ((age * 18) % 18);
  ctx.strokeStyle = `rgba(255,255,255,${0.55 - r / 50})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  // 물고기 모양 먹이
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-11, -4);
  ctx.lineTo(-11, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath();
  ctx.arc(3.5, -1, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function hudPill(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, align: 'left' | 'right' | 'center'): void {
  ctx.save();
  ctx.font = `18px ${FONT}`;
  const w = ctx.measureText(text).width + 24;
  const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  ctx.fillStyle = 'rgba(11, 58, 91, 0.72)';
  pill(ctx, left, y, w, 32, 16);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, left + w / 2, y + 17);
  ctx.restore();
}

export function speechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `16px ${FONT}`;
  const w = ctx.measureText(text).width + 20;
  const h = 30;
  const left = Math.max(6, Math.min(W - w - 6, x - w / 2));
  const top = Math.max(6, y - h - 12);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#0b3a5b';
  ctx.lineWidth = 2;
  pill(ctx, left, top, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0b3a5b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, left + w / 2, top + h / 2 + 1);
  ctx.restore();
}

export function bigText(ctx: CanvasRenderingContext2D, text: string, y: number, size = 64, color = '#fff'): void {
  ctx.save();
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(11, 58, 91, 0.85)';
  ctx.strokeText(text, W / 2, y);
  ctx.fillStyle = color;
  ctx.fillText(text, W / 2, y);
  ctx.restore();
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  age: number;
  color: string;
  size: number;
}

// 떠오르는 글자 효과 ("냠!", "+1" 등)
export class Effects {
  private items: FloatText[] = [];

  add(x: number, y: number, text: string, color = '#fff', size = 20): void {
    this.items.push({ x, y, text, age: 0, color, size });
  }

  update(dt: number): void {
    for (const it of this.items) it.age += dt;
    this.items = this.items.filter((it) => it.age < 1);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const it of this.items) {
      ctx.globalAlpha = 1 - it.age;
      ctx.font = `${it.size}px ${FONT}`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(11,58,91,.8)';
      ctx.strokeText(it.text, it.x, it.y - it.age * 36);
      ctx.fillStyle = it.color;
      ctx.fillText(it.text, it.x, it.y - it.age * 36);
    }
    ctx.restore();
  }
}

// 반짝이는 물결 무늬
export function waterSparkles(ctx: CanvasRenderingContext2D, t: number, x0: number, y0: number, w: number, h: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const px = x0 + ((i * 97 + t * 12) % w);
    const py = y0 + ((i * 53) % h);
    const len = 8 + (i % 3) * 5;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + i);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + len / 2, py - 3, px + len, py);
    ctx.stroke();
  }
  ctx.restore();
}
