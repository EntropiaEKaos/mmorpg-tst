const RARITY_RANK: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const RARITY_COLOR: Record<string, string> = {
  common: '#d7d7d7', uncommon: '#5ee06f', rare: '#5aa7ff', epic: '#b86cff', legendary: '#ffb347',
};

type Point = { x: number; y: number };
type GroundLike = {
  id?: string;
  x?: number;
  y?: number;
  pos?: Point;
  items?: any[];
  createdAt?: number;
  expireAt?: number;
  monsterEmoji?: string;
};

function positionOf(ground: GroundLike): Point | null {
  if (ground?.pos && Number.isFinite(ground.pos.x) && Number.isFinite(ground.pos.y)) return ground.pos;
  if (Number.isFinite(ground?.x) && Number.isFinite(ground?.y)) return { x: Number(ground.x), y: Number(ground.y) };
  return null;
}

export function highestGroundRarity(ground: GroundLike): string {
  let best = 'common';
  for (const item of Array.isArray(ground?.items) ? ground.items : []) {
    const rarity = String(item?.rarity || item?.equipment?.rarity || 'common').toLowerCase();
    if ((RARITY_RANK[rarity] ?? 0) > (RARITY_RANK[best] ?? 0)) best = rarity;
  }
  return best;
}

export function drawGroundLootPresentation(
  ctx: CanvasRenderingContext2D,
  groundItems: GroundLike[],
  camera: Point,
  tileSize: number,
  now: number,
): void {
  for (const ground of Array.isArray(groundItems) ? groundItems : []) {
    const pos = positionOf(ground);
    if (!pos) continue;
    const sx = (pos.x - camera.x) * tileSize;
    const sy = (pos.y - camera.y) * tileSize;
    if (sx < -tileSize || sx > ctx.canvas.width || sy < -tileSize * 5 || sy > ctx.canvas.height) continue;

    const items = Array.isArray(ground.items) ? ground.items : [];
    const hasItems = items.length > 0;
    const rarity = highestGroundRarity(ground);
    const rank = RARITY_RANK[rarity] ?? 0;
    const color = RARITY_COLOR[rarity] || RARITY_COLOR.common;
    const pulse = 0.72 + Math.sin(now / Math.max(120, 300 - rank * 30)) * 0.18;
    const bornAt = Number(ground.createdAt) || (Number(ground.expireAt) ? Number(ground.expireAt) - 120000 : now);
    const lifetime = Math.max(1, (Number(ground.expireAt) || (bornAt + 120000)) - bornAt);
    const age = Math.max(0, (now - bornAt) / lifetime);
    const flicker = age > 0.8 ? (Math.sin(now / 80) > 0 ? 1 : 0.42) : 1;

    ctx.save();
    ctx.globalAlpha = flicker;

    if (hasItems) {
      const beamHeight = tileSize * (1.2 + rank * 0.85);
      const centerX = sx + tileSize / 2;
      const groundY = sy + tileSize * 0.78;
      const beam = ctx.createLinearGradient(centerX, groundY - beamHeight, centerX, groundY);
      beam.addColorStop(0, 'transparent');
      beam.addColorStop(0.25, `${color}${rank >= 3 ? '55' : '32'}`);
      beam.addColorStop(0.82, `${color}${rank >= 2 ? 'aa' : '58'}`);
      beam.addColorStop(1, `${color}dd`);
      ctx.fillStyle = beam;
      ctx.globalAlpha = flicker * (0.35 + rank * 0.1) * pulse;
      ctx.fillRect(centerX - Math.max(1.5, 2 + rank), groundY - beamHeight, Math.max(3, 4 + rank * 2), beamHeight);

      ctx.globalAlpha = flicker * (0.18 + rank * 0.06) * pulse;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(centerX, groundY, tileSize * (0.35 + rank * 0.035), tileSize * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      if (rank >= 2) {
        ctx.globalAlpha = flicker * 0.75;
        ctx.fillStyle = color;
        const sparkleCount = 3 + rank;
        for (let i = 0; i < sparkleCount; i++) {
          const phase = now / (180 + i * 20) + i * 1.7;
          const px = centerX + Math.sin(phase) * tileSize * (0.18 + i * 0.018);
          const py = groundY - ((now / (6 + i)) % Math.max(12, beamHeight * 0.75));
          ctx.fillRect(px, py, rank >= 4 ? 2.4 : 1.5, rank >= 4 ? 2.4 : 1.5);
        }
      }
    }

    ctx.globalAlpha = flicker;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(sx + tileSize / 2, sy + tileSize - 4, tileSize * 0.35, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const bestItem = items.reduce((best, item) => {
      const rarityNow = String(item?.rarity || item?.equipment?.rarity || 'common').toLowerCase();
      const rarityBest = String(best?.rarity || best?.equipment?.rarity || 'common').toLowerCase();
      return (RARITY_RANK[rarityNow] ?? 0) > (RARITY_RANK[rarityBest] ?? 0) ? item : best;
    }, items[0]);
    const icon = ground.monsterEmoji || bestItem?.icon || (hasItems ? '🎁' : '💀');
    ctx.font = `${tileSize * 0.65}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, sx + tileSize / 2, sy + tileSize / 2);

    ctx.font = 'bold 8px system-ui';
    ctx.fillStyle = hasItems ? color : '#666';
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 2;
    const label = hasItems ? `${items.length} item(s) · ${rarity}` : 'empty';
    ctx.strokeText(label, sx + tileSize / 2, sy + tileSize - 2);
    ctx.fillText(label, sx + tileSize / 2, sy + tileSize - 2);
    ctx.restore();
  }
}
