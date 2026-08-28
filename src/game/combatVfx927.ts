import type { Projectile, Particle } from './types';

export function drawProjectile927(
  ctx: CanvasRenderingContext2D,
  pr: Projectile,
  cx: number,
  cy: number,
  px: number,
  py: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = pr.color;
  ctx.globalAlpha = .26;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.globalAlpha = .82;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 13);
  g.addColorStop(0, '#fff');
  g.addColorStop(.18, pr.color);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (pr.emoji) {
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pr.emoji, cx, cy);
  }
}

export function drawParticle927(
  ctx: CanvasRenderingContext2D,
  pp: Particle,
  sx: number,
  sy: number,
) {
  ctx.save();
  ctx.globalAlpha = pp.life;
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = pp.color;
  ctx.shadowBlur = Math.max(2, pp.size * 2.5);
  ctx.fillStyle = pp.color;
  const ps = Math.max(1, Math.round(pp.size));
  ctx.fillRect(Math.round(sx - ps / 2), Math.round(sy - ps / 2), ps, ps);
  if (ps >= 3) {
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
  }
  ctx.restore();
}
