import type { HousingSnapshot } from './types';

export function drawHousing(
  ctx: CanvasRenderingContext2D,
  housing: HousingSnapshot | null | undefined,
  camera: { x: number; y: number },
  tileSize: number,
  time: number,
) {
  if (!housing?.houses?.length) return;
  for (const house of housing.houses) {
    const sx = (house.x - camera.x) * tileSize;
    const sy = (house.y - camera.y) * tileSize;
    const width = house.width * tileSize;
    const height = house.height * tileSize;
    if (sx > ctx.canvas.width || sy > ctx.canvas.height || sx + width < 0 || sy + height < 0) continue;

    ctx.save();
    ctx.fillStyle = house.access ? 'rgba(91,75,48,0.22)' : 'rgba(80,28,28,0.20)';
    ctx.fillRect(sx, sy, width, height);
    ctx.strokeStyle = house.access ? 'rgba(218,183,111,0.52)' : 'rgba(225,90,90,0.48)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 1, sy + 1, width - 2, height - 2);

    const doorX = (house.entranceX - camera.x) * tileSize;
    const doorY = (house.entranceY - camera.y) * tileSize;
    const pulse = 0.55 + Math.sin(time / 350) * 0.15;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = house.ownerName ? '#d9bd7a' : '#63d29b';
    ctx.fillRect(doorX + tileSize * 0.28, doorY + tileSize * 0.20, tileSize * 0.44, tileSize * 0.68);
    ctx.globalAlpha = 1;

    ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const label = house.ownerName ? `${house.name} · ${house.ownerName}` : `${house.name} · FOR SALE`;
    ctx.strokeStyle = 'rgba(0,0,0,0.92)'; ctx.lineWidth = 3; ctx.strokeText(label, sx + width / 2, sy - 3);
    ctx.fillStyle = house.ownerName ? '#e9d7a3' : '#7fe3b0'; ctx.fillText(label, sx + width / 2, sy - 3);

    for (const decor of house.decor || []) {
      const dx = (decor.x - camera.x) * tileSize;
      const dy = (decor.y - camera.y) * tileSize;
      ctx.fillStyle = decor.color || '#d9bd7a';
      ctx.globalAlpha = 0.24;
      ctx.beginPath(); ctx.arc(dx + tileSize / 2, dy + tileSize / 2, tileSize * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = `${Math.floor(tileSize * 0.55)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(decor.icon || '📦', dx + tileSize / 2, dy + tileSize / 2);
    }
    ctx.restore();
  }
}
