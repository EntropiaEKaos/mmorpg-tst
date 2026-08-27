import type { GameMap } from './maps';
import type { Building } from './render';
import { getCityPalette, type CityLandmark, type CityProp } from './cityIdentity';

export interface CityMinimapMarker {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  color: string;
  kind: 'landmark' | 'district' | 'portal';
}

function buildingTypeFor(kind: CityLandmark['kind']): Building['type'] {
  switch (kind) {
    case 'keep': return 'castle';
    case 'market': return 'market';
    case 'temple': return 'temple';
    case 'depot': return 'shop';
    case 'gate': return 'tower';
    case 'forge': return 'forge';
    case 'dock': return 'dock';
    case 'arena': return 'arena';
    case 'obelisk': return 'obelisk';
    case 'library': return 'library';
    case 'graveyard': return 'graveyard';
    case 'lodge': return 'inn';
    case 'tower': return 'tower';
    default: return 'house';
  }
}

export function getCityBuildings(map: GameMap): Building[] {
  const palette = getCityPalette({
    id: map.id, style: map.cityStyle, biome: map.biome,
    cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor,
  });
  const buildings: Building[] = map.landmarks.map((landmark) => ({
    x: landmark.x,
    y: landmark.y,
    w: Math.max(1, landmark.w),
    h: Math.max(1, landmark.h),
    type: buildingTypeFor(landmark.kind),
    roofColor: palette.roof,
    wallColor: palette.wall,
    accentColor: palette.accent,
    label: landmark.name,
    icon: landmark.icon,
  }));

  // Smaller houses make every city feel inhabited without making the town
  // geometry authoritative. They are visual-only and therefore never change
  // collision/pathing rules on the server.
  const tc = map.townCenter;
  const homes: Array<[number, number, number, number]> = [
    [-8, 5, 3, 3], [-4, 6, 3, 3], [4, 6, 3, 3], [8, 5, 3, 3],
  ];
  for (const [dx, dy, w, h] of homes) {
    const x = Math.max(1, Math.min(78 - w, tc.x + dx));
    const y = Math.max(1, Math.min(78 - h, tc.y + dy));
    buildings.push({ x, y, w, h, type: 'house', roofColor: palette.roof, wallColor: palette.wall, accentColor: palette.accent });
  }
  return buildings;
}

export function getCityMinimapMarkers(map: GameMap): CityMinimapMarker[] {
  const palette = getCityPalette({ id: map.id, style: map.cityStyle, biome: map.biome, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor });
  const markers: CityMinimapMarker[] = [
    ...map.landmarks.map((entry) => ({ id: entry.id, name: entry.name, icon: entry.icon, x: entry.x + entry.w / 2, y: entry.y + entry.h / 2, color: palette.accent, kind: 'landmark' as const })),
    ...map.districts.map((entry) => ({ id: entry.id, name: entry.name, icon: entry.icon, x: entry.x, y: entry.y, color: entry.color || palette.accent, kind: 'district' as const })),
    ...map.portals.map((portal, index) => ({ id: `${map.id}_portal_${index}`, name: portal.label || portal.targetMap, icon: '◉', x: portal.pos.x, y: portal.pos.y, color: '#7fe7ff', kind: 'portal' as const })),
  ];
  return markers;
}

export function drawCityTileOverlay(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  tileX: number,
  tileY: number,
  screenX: number,
  screenY: number,
  size: number,
  tileType: string,
) {
  if (tileType !== 'floor' && tileType !== 'path' && tileType !== 'wood_floor') return;
  const palette = getCityPalette({ id: map.id, style: map.cityStyle, biome: map.biome, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor });
  const dx = Math.abs(tileX - map.townCenter.x);
  const dy = Math.abs(tileY - map.townCenter.y);
  const inTown = dx <= map.townRange + 2 && dy <= map.townRange + 2;
  if (!inTown) return;

  ctx.save();
  ctx.globalAlpha = tileType === 'path' ? 0.28 : 0.14;
  ctx.fillStyle = tileType === 'path' ? palette.road : palette.wall;
  ctx.fillRect(screenX, screenY, size, size);
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = palette.road;
  ctx.lineWidth = 1;
  // Classic top-down map grammar: clear avenue seams and a stronger central plaza.
  if (tileX === map.townCenter.x || tileY === map.townCenter.y) {
    ctx.strokeRect(screenX + 1.5, screenY + 1.5, size - 3, size - 3);
  }
  if (dx <= 2 && dy <= 2) {
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = palette.accent;
    ctx.fillRect(screenX + 3, screenY + 3, size - 6, size - 6);
  }
  ctx.restore();
}

function drawPropGlyph(ctx: CanvasRenderingContext2D, prop: CityProp, x: number, y: number, size: number, time: number, accent: string) {
  const cx = x + size / 2;
  const cy = y + size * 0.68;
  const pulse = 0.75 + Math.sin(time / 450 + prop.x) * 0.12;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.strokeStyle = '#17120d';
  ctx.lineWidth = Math.max(1, size / 18);
  ctx.fillStyle = prop.color || accent;

  switch (prop.kind) {
    case 'banner':
      ctx.fillStyle = '#493421'; ctx.fillRect(cx - size * .04, y + size * .15, size * .08, size * .72);
      ctx.fillStyle = prop.color || accent; ctx.fillRect(cx, y + size * .18, size * .30, size * .28);
      ctx.strokeRect(cx, y + size * .18, size * .30, size * .28); break;
    case 'lamp':
      ctx.fillStyle = '#3d3528'; ctx.fillRect(cx - 2, y + size * .25, 4, size * .58);
      ctx.shadowColor = '#ffd56a'; ctx.shadowBlur = 8 * pulse; ctx.fillStyle = '#ffd56a'; ctx.fillRect(cx - 4, y + size * .22, 8, 8); break;
    case 'brazier':
      ctx.fillStyle = '#4b4034'; ctx.fillRect(cx - 7, cy - 4, 14, 7);
      ctx.shadowColor = '#ff7a2f'; ctx.shadowBlur = 10 * pulse; ctx.fillStyle = '#ff9a38'; ctx.beginPath(); ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx, cy - 18); ctx.lineTo(cx + 6, cy - 5); ctx.fill(); break;
    case 'crystal':
      ctx.shadowColor = prop.color || accent; ctx.shadowBlur = 9 * pulse; ctx.fillStyle = prop.color || accent;
      ctx.beginPath(); ctx.moveTo(cx, y + size * .12); ctx.lineTo(cx + size * .18, cy); ctx.lineTo(cx, y + size * .88); ctx.lineTo(cx - size * .18, cy); ctx.closePath(); ctx.fill(); break;
    case 'grave':
      ctx.fillStyle = '#706f72'; ctx.fillRect(cx - 7, y + size * .35, 14, size * .46); ctx.fillRect(cx - 11, y + size * .43, 22, 5); break;
    case 'tent':
      ctx.fillStyle = prop.color || accent; ctx.beginPath(); ctx.moveTo(cx, y + size * .18); ctx.lineTo(x + size * .12, y + size * .82); ctx.lineTo(x + size * .88, y + size * .82); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'sign':
      ctx.fillStyle = '#6e4c2b'; ctx.fillRect(cx - 2, y + size * .45, 4, size * .42); ctx.fillRect(cx - size * .28, y + size * .30, size * .56, size * .28); break;
    case 'barrel':
      ctx.fillStyle = '#78502d'; ctx.fillRect(cx - 8, y + size * .42, 16, size * .36); ctx.strokeRect(cx - 8, y + size * .42, 16, size * .36); break;
    case 'cart':
      ctx.fillStyle = '#76512d'; ctx.fillRect(x + size * .18, y + size * .43, size * .62, size * .28); ctx.fillStyle = '#2d241c'; ctx.beginPath(); ctx.arc(x + size * .28, y + size * .78, 5, 0, Math.PI * 2); ctx.arc(x + size * .70, y + size * .78, 5, 0, Math.PI * 2); ctx.fill(); break;
    case 'pine':
      ctx.fillStyle = '#2d4c32'; for (let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(cx,y+size*(.12+i*.15));ctx.lineTo(x+size*(.22+i*.05),y+size*(.58+i*.12));ctx.lineTo(x+size*(.78-i*.05),y+size*(.58+i*.12));ctx.closePath();ctx.fill();} break;
    case 'mushroom':
      ctx.fillStyle = '#d6d2b6'; ctx.fillRect(cx - 2, cy - 1, 4, 10); ctx.fillStyle = prop.color || '#a15d8e'; ctx.beginPath(); ctx.arc(cx, cy - 3, 8, Math.PI, 0); ctx.fill(); break;
    case 'anchor':
      ctx.strokeStyle = prop.color || accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, y+size*.24); ctx.lineTo(cx, y+size*.78); ctx.moveTo(cx-size*.18,y+size*.62);ctx.quadraticCurveTo(cx, y+size*.90, cx+size*.18,y+size*.62);ctx.stroke(); break;
    case 'rune':
      ctx.shadowColor = prop.color || accent; ctx.shadowBlur = 7*pulse; ctx.strokeStyle = prop.color || accent; ctx.lineWidth = 2; ctx.strokeRect(cx-8,cy-8,16,16); ctx.beginPath();ctx.moveTo(cx-6,cy+5);ctx.lineTo(cx,cy-6);ctx.lineTo(cx+6,cy+5);ctx.stroke(); break;
    case 'statue':
    default:
      ctx.fillStyle = '#77756f'; ctx.fillRect(cx - 7, y + size * .35, 14, size * .38); ctx.fillRect(cx - 11, y + size * .73, 22, 6); ctx.beginPath(); ctx.arc(cx, y + size * .27, 7, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawCityDecor(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  camera: { x: number; y: number },
  tileSize: number,
  time: number,
) {
  const palette = getCityPalette({ id: map.id, style: map.cityStyle, biome: map.biome, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor });
  for (const prop of map.props) {
    const sx = (prop.x - camera.x) * tileSize;
    const sy = (prop.y - camera.y) * tileSize;
    if (sx < -tileSize || sy < -tileSize || sx > ctx.canvas.width + tileSize || sy > ctx.canvas.height + tileSize) continue;
    drawPropGlyph(ctx, prop, sx, sy, tileSize, time, palette.accent);
  }

  // Labels are deliberately sparse: landmarks become navigation anchors instead
  // of filling the world with floating text.
  for (const landmark of map.landmarks) {
    const sx = (landmark.x + landmark.w / 2 - camera.x) * tileSize;
    const sy = (landmark.y - camera.y) * tileSize;
    if (sx < 0 || sy < 0 || sx > ctx.canvas.width || sy > ctx.canvas.height) continue;
    ctx.save();
    ctx.font = '800 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,.9)';
    ctx.strokeText(`${landmark.icon} ${landmark.name}`, sx, sy - 5);
    ctx.fillStyle = palette.accent;
    ctx.fillText(`${landmark.icon} ${landmark.name}`, sx, sy - 5);
    ctx.restore();
  }
}
