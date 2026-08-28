import { getMapDimensions, type GameMap } from './maps';
import type { Building } from './render';
import { getCityPalette, type CityLandmark, type CityProp, type CityPropKind } from './cityIdentity';

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
    case 'house': return 'house';
    default: return 'house';
  }
}

function overlapsLandmark(map: GameMap, x: number, y: number, w: number, h: number, margin = 1) {
  return map.landmarks.some((landmark) =>
    x < landmark.x + landmark.w + margin &&
    x + w + margin > landmark.x &&
    y < landmark.y + landmark.h + margin &&
    y + h + margin > landmark.y
  );
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

  // Optional presentation-only residential ring. Disabled by default because
  // decorative houses must never masquerade as authoritative collision geometry.
  // Admins may deliberately enable a bounded density from Content Studio.
  const tc = map.townCenter;
  const { width: mapWidth, height: mapHeight } = getMapDimensions(map);
  const homes: Array<[number, number, number, number]> = [
    [-13,-6,4,3], [-13,3,3,3], [-9,7,4,3], [-4,8,3,3], [2,8,4,3],
    [8,7,4,3], [11,3,3,3], [11,-3,4,3], [8,-10,4,3], [1,-12,3,3],
  ];
  const density = map.residentialRingEnabled === true ? Math.max(0, Math.min(homes.length, Math.round(Number(map.residentialRingDensity) || homes.length))) : 0;
  for (const [dx, dy, w, h] of homes.slice(0, density)) {
    const x = Math.max(1, Math.min(mapWidth - w - 2, tc.x + dx));
    const y = Math.max(1, Math.min(mapHeight - h - 2, tc.y + dy));
    if (overlapsLandmark(map, x, y, w, h, 1)) continue;
    buildings.push({ x, y, w, h, type: 'house', roofColor: palette.roof, wallColor: palette.wall, accentColor: palette.accent });
  }
  return buildings;
}

export function getCityMinimapMarkers(map: GameMap): CityMinimapMarker[] {
  const palette = getCityPalette({ id: map.id, style: map.cityStyle, biome: map.biome, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor });
  return [
    ...map.landmarks.filter((entry) => entry.showOnMinimap !== false).map((entry) => ({ id: entry.id, name: entry.name, icon: entry.icon, x: entry.x + entry.w / 2, y: entry.y + entry.h / 2, color: palette.accent, kind: 'landmark' as const })),
    ...map.districts.map((entry) => ({ id: entry.id, name: entry.name, icon: entry.icon, x: entry.x, y: entry.y, color: entry.color || palette.accent, kind: 'district' as const })),
    ...map.portals.map((portal, index) => ({ id: `${map.id}_portal_${index}`, name: portal.label || portal.targetMap, icon: '◉', x: portal.pos.x, y: portal.pos.y, color: '#7fe7ff', kind: 'portal' as const })),
  ];
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
  if (dx > map.townRange + 2 || dy > map.townRange + 2) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const edge = Math.max(1, Math.round(size / 16));
  const corePlaza = dx <= 5 && dy <= 5;
  const avenueX = dx <= 1;
  const avenueY = dy <= 1;
  const fringe = Math.max(dx, dy) >= Math.max(4, map.townRange - 2);

  // Keep the textured base visible. Paths receive only a restrained tint.
  if (tileType === 'path') {
    ctx.globalAlpha = .14;
    ctx.fillStyle = palette.road;
    ctx.fillRect(screenX, screenY, size, size);
  }

  // Central plaza mosaic: alternating inset stones stop the town square from
  // reading as one giant repeated texture while preserving the original tile.
  if (corePlaza) {
    const inset = Math.max(2, Math.round(size / 10));
    const parity = (tileX + tileY) & 1;
    ctx.globalAlpha = parity ? .10 : .16;
    ctx.fillStyle = parity ? palette.wall : palette.road;
    ctx.fillRect(screenX + inset, screenY + inset, size - inset * 2, edge);
    ctx.fillRect(screenX + inset, screenY + size - inset - edge, size - inset * 2, edge);
    if (((tileX * 3 + tileY * 5) & 3) === 0) {
      ctx.globalAlpha = .18;
      ctx.fillStyle = palette.accent;
      ctx.fillRect(screenX + inset, screenY + inset, edge * 2, edge * 2);
    }
  }

  // Town avenue edge strips: the two principal axes now read as constructed
  // streets instead of disappearing into the surrounding plaza texture.
  if (avenueX || avenueY) {
    ctx.globalAlpha = .28;
    ctx.fillStyle = palette.road;
    if (avenueX) {
      ctx.fillRect(screenX, screenY, edge, size);
      ctx.fillRect(screenX + size - edge, screenY, edge, size);
    }
    if (avenueY) {
      ctx.fillRect(screenX, screenY, size, edge);
      ctx.fillRect(screenX, screenY + size - edge, size, edge);
    }
  }

  // Moss fringe pixels: deterministic low-density edge noise visually blends
  // masonry into the outer biome without creating fake collidable objects.
  if (fringe && tileType === 'floor') {
    const seed = ((tileX * 73856093) ^ (tileY * 19349663)) >>> 0;
    if ((seed % 3) === 0) {
      const p = Math.max(1, Math.round(size / 12));
      ctx.globalAlpha = .18;
      ctx.fillStyle = '#365a35';
      ctx.fillRect(screenX + p, screenY + size - p * 2, p * 2, p);
      if ((seed & 4) !== 0) ctx.fillRect(screenX + size - p * 3, screenY + p, p, p * 2);
    }
  }

  if (tileX === map.townCenter.x || tileY === map.townCenter.y) {
    ctx.globalAlpha = .34;
    ctx.strokeStyle = palette.road;
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX + 1, screenY + 1, size - 2, size - 2);
  }
  if (dx <= 2 && dy <= 2) {
    const p = Math.max(2, Math.round(size / 12));
    ctx.globalAlpha = .34;
    ctx.fillStyle = palette.accent;
    ctx.fillRect(screenX + p, screenY + p, p, p);
    ctx.fillRect(screenX + size - p * 2, screenY + p, p, p);
    ctx.fillRect(screenX + p, screenY + size - p * 2, p, p);
    ctx.fillRect(screenX + size - p * 2, screenY + size - p * 2, p, p);
  }
  ctx.restore();
}

const AMBIENT_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-12,-8],[-9,-10],[-5,-11],[-1,-12],[4,-11],[9,-9],[12,-6],[13,-1],
  [12,4],[10,8],[6,10],[2,11],[-3,11],[-7,10],[-11,7],[-13,3],[-13,-2],
  [-8,-5],[-7,4],[7,5],[8,-4],[-4,6],[4,6],[-5,-6],[5,-6],
];

function ambientKinds(map: GameMap): CityPropKind[] {
  const style = String(map.cityStyle || 'royal');
  if (style === 'harbor') return ['lamp','barrel','anchor','cart','sign','barrel'];
  if (style === 'alpine') return ['pine','brazier','pine','barrel','sign','banner'];
  if (style === 'ironwood') return ['pine','barrel','sign','cart','pine','banner'];
  if (style === 'marsh') return ['lamp','mushroom','barrel','sign','mushroom','grave'];
  if (style === 'forge') return ['brazier','barrel','cart','banner','brazier','sign'];
  if (style === 'crystal') return ['crystal','lamp','rune','crystal','sign','lamp'];
  if (style === 'storm') return ['banner','lamp','brazier','sign','lamp','anchor'];
  if (style === 'void' || style === 'nightfall') return ['grave','brazier','rune','statue','grave','banner'];
  if (style === 'sanctum') return ['rune','lamp','crystal','banner','statue','lamp'];
  return ['pine','lamp','barrel','banner','cart','lamp'];
}

export function getAmbientCityProps(map: GameMap): CityProp[] {
  const kinds = ambientKinds(map);
  const { width: ambientWidth, height: ambientHeight } = getMapDimensions(map);
  const existing = new Set(map.props.map((prop) => `${prop.x}:${prop.y}`));
  const props: CityProp[] = [];
  AMBIENT_OFFSETS.forEach(([dx, dy], index) => {
    const x = Math.max(2, Math.min(ambientWidth - 3, Math.round(map.townCenter.x + dx)));
    const y = Math.max(2, Math.min(ambientHeight - 3, Math.round(map.townCenter.y + dy)));
    if (existing.has(`${x}:${y}`)) return;
    if (overlapsLandmark(map, x, y, 1, 1, 0)) return;
    props.push({ id: `${map.id}_ambient_${index}`, kind: kinds[index % kinds.length], x, y });
  });
  return props;
}

function pixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = '#1d1813';
  ctx.fillRect(Math.round(x - 1), Math.round(y - 1), Math.round(w + 2), Math.round(h + 2));
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function drawLocalEmissiveHalo(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rgb: string, alpha: number) {
  // Local emissive halo is presentation-only; the crisp pixel prop remains the visual anchor.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  halo.addColorStop(0, `rgba(${rgb},${alpha})`);
  halo.addColorStop(.36, `rgba(${rgb},${alpha * .38})`);
  halo.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawPropGlyph(ctx: CanvasRenderingContext2D, prop: CityProp, x: number, y: number, size: number, time: number, accent: string, darkness = 0) {
  const cx = x + size / 2;
  const cy = y + size * 0.70;
  const u = Math.max(1, Math.round(size / 16));
  const pulse = 0.72 + Math.sin(time / 450 + prop.x) * 0.08;
  const lightDarkness = Math.max(0, Math.min(1, darkness));
  const emissiveScale = .55 + lightDarkness * 2.5;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Ground every prop before drawing the authored pixel silhouette.
  ctx.fillStyle = 'rgba(13,15,13,.24)';
  ctx.fillRect(x + size*.22, y + size*.78, size*.56, Math.max(2, size*.075));
  ctx.fillStyle = 'rgba(30,35,27,.13)';
  ctx.fillRect(x + size*.31, y + size*.75, size*.38, Math.max(1, size*.04));

  // Night-sensitive floor bounce anchors authored emissive props to nearby masonry.
  if (lightDarkness > .06 && (prop.kind === 'lamp' || prop.kind === 'brazier' || prop.kind === 'crystal')) {
    const warm = prop.kind === 'crystal' ? '151,143,255' : prop.kind === 'brazier' ? '255,112,48' : '255,205,105';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const floorAlpha = Math.min(.18, .035 + lightDarkness * .22);
    ctx.fillStyle = `rgba(${warm},${floorAlpha})`;
    ctx.fillRect(x + size*.25, y + size*.79, size*.50, Math.max(1, size*.04));
    ctx.fillStyle = `rgba(${warm},${floorAlpha*.42})`;
    ctx.fillRect(x + size*.34, y + size*.84, size*.32, Math.max(1, size*.03));
    ctx.restore();
  }

  switch (prop.kind) {
    case 'banner':
      pixelRect(ctx,cx-u,y+size*.18,u*2,size*.67,'#5b4028');
      pixelRect(ctx,cx+u,y+size*.20,u*5,u*6,prop.color || accent);
      ctx.fillStyle='rgba(255,255,255,.24)';ctx.fillRect(cx+u*2,y+size*.22,u,u*4); break;
    case 'lamp':
      drawLocalEmissiveHalo(ctx,cx,y+size*.32,size*(.46 + lightDarkness*.16),'255,205,105',(.16 + pulse*.07)*emissiveScale);
      pixelRect(ctx,cx-u,y+size*.31,u*2,size*.52,'#42392d');
      ctx.fillStyle=`rgba(255,211,104,${pulse*.25})`;ctx.fillRect(cx-u*5,y+size*.17,u*10,u*10);
      pixelRect(ctx,cx-u*2,y+size*.21,u*4,u*5,'#e7bd5c');
      ctx.fillStyle='#fff0a7';ctx.fillRect(cx-u,y+size*.23,u*2,u*2); break;
    case 'brazier':
      drawLocalEmissiveHalo(ctx,cx,cy-u*4,size*(.52 + lightDarkness*.20),'255,118,48',(.14 + pulse*.09)*emissiveScale);
      pixelRect(ctx,cx-u*4,cy,u*8,u*3,'#524438');
      ctx.fillStyle='#8f3926';ctx.fillRect(cx-u*3,cy-u*3,u*6,u*3);
      ctx.fillStyle='#ff9737';ctx.fillRect(cx-u*2,cy-u*6,u*4,u*4);ctx.fillStyle='#ffd15e';ctx.fillRect(cx-u,cy-u*7,u*2,u*4); break;
    case 'crystal':
      drawLocalEmissiveHalo(ctx,cx,y+size*.43,size*(.48 + lightDarkness*.18),'151,143,255',(.11 + pulse*.07)*emissiveScale);
      ctx.fillStyle=prop.color || accent;ctx.fillRect(cx-u*2,y+size*.28,u*4,u*8);ctx.fillRect(cx-u,y+size*.18,u*2,u*12);
      ctx.fillStyle='rgba(255,255,255,.52)';ctx.fillRect(cx-u,y+size*.22,u,u*5); break;
    case 'grave':
      pixelRect(ctx,cx-u*3,y+size*.40,u*6,u*7,'#77736d');ctx.fillStyle='#9b968c';ctx.fillRect(cx-u*2,y+size*.42,u*4,u);ctx.fillRect(cx-u*5,y+size*.47,u*10,u*2); break;
    case 'tent':
      ctx.fillStyle='#1d1813';ctx.fillRect(x+u*2,y+size*.44,size-u*4,size*.39);ctx.fillStyle=prop.color || accent;ctx.fillRect(x+u*3,y+size*.46,size-u*6,size*.35);ctx.fillStyle='#d2b67f';ctx.fillRect(cx-u,y+size*.48,u*2,size*.32); break;
    case 'sign':
      pixelRect(ctx,cx-u,y+size*.48,u*2,size*.35,'#684729');pixelRect(ctx,cx-u*5,y+size*.30,u*10,u*5,'#76512e');ctx.fillStyle='#c29b58';ctx.fillRect(cx-u*3,y+size*.34,u*5,u); break;
    case 'barrel':
      pixelRect(ctx,cx-u*4,y+size*.43,u*8,u*7,'#79502e');ctx.fillStyle='#b57a42';ctx.fillRect(cx-u*3,y+size*.45,u*6,u);ctx.fillStyle='#352a20';ctx.fillRect(cx-u*4,y+size*.48,u*8,u);ctx.fillRect(cx-u*4,y+size*.68,u*8,u); break;
    case 'cart':
      pixelRect(ctx,x+size*.16,y+size*.42,size*.67,size*.26,'#75502e');ctx.fillStyle='#a6743d';ctx.fillRect(x+size*.20,y+size*.44,size*.58,u*2);ctx.fillStyle='#241d18';ctx.fillRect(x+size*.22,y+size*.69,u*4,u*4);ctx.fillRect(x+size*.64,y+size*.69,u*4,u*4);ctx.fillStyle='#79502e';ctx.fillRect(x+size*.79,y+size*.50,size*.18,u*2); break;
    case 'pine':
      ctx.fillStyle='#513623';ctx.fillRect(cx-u,y+size*.56,u*2,size*.31);
      ctx.fillStyle='#18351f';ctx.fillRect(cx-u*5,y+size*.38,u*10,u*7);ctx.fillRect(cx-u*4,y+size*.26,u*8,u*7);ctx.fillRect(cx-u*3,y+size*.15,u*6,u*7);
      ctx.fillStyle='#2f5d34';ctx.fillRect(cx-u*3,y+size*.28,u*4,u*2);ctx.fillRect(cx-u*2,y+size*.18,u*3,u*2);ctx.fillStyle='#4f7d46';ctx.fillRect(cx,y+size*.20,u*2,u*2); break;
    case 'mushroom':
      ctx.fillStyle='#d6d2b6';ctx.fillRect(cx-u,cy,u*2,u*5);ctx.fillStyle=prop.color || '#a15d8e';ctx.fillRect(cx-u*3,cy-u*3,u*6,u*3);ctx.fillRect(cx-u*2,cy-u*4,u*4,u); break;
    case 'anchor':
      ctx.fillStyle=prop.color || accent;ctx.fillRect(cx-u,y+size*.25,u*2,size*.50);ctx.fillRect(cx-u*4,y+size*.32,u*8,u*2);ctx.fillRect(cx-u*5,y+size*.67,u*3,u*2);ctx.fillRect(cx+u*2,y+size*.67,u*3,u*2);ctx.fillRect(cx-u*4,y+size*.69,u*2,u*3);ctx.fillRect(cx+u*2,y+size*.69,u*2,u*3); break;
    case 'rune':
      pixelRect(ctx,cx-u*4,cy-u*4,u*8,u*8,'#30263b');ctx.fillStyle=prop.color || accent;ctx.fillRect(cx-u,cy-u*3,u*2,u*6);ctx.fillRect(cx-u*3,cy-u,u*6,u*2);ctx.fillRect(cx+u,cy-u*3,u*2,u*2); break;
    case 'statue':
    default:
      pixelRect(ctx,cx-u*3,y+size*.36,u*6,u*8,'#77756f');pixelRect(ctx,cx-u*5,y+size*.73,u*10,u*3,'#625f5b');ctx.fillStyle='#96938c';ctx.fillRect(cx-u*2,y+size*.25,u*4,u*4);ctx.fillRect(cx-u,y+size*.21,u*2,u*2);
  }
  ctx.restore();
}

export function drawCityDecor(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  camera: { x: number; y: number },
  tileSize: number,
  time: number,
  darkness = 0,
) {
  const palette = getCityPalette({ id: map.id, style: map.cityStyle, biome: map.biome, cityAccent: map.cityAccent, roofColor: map.roofColor, wallColor: map.wallColor, roadColor: map.roadColor });
  const visualProps = [...getAmbientCityProps(map), ...map.props];
  for (const prop of visualProps) {
    const sx = (prop.x - camera.x) * tileSize;
    const sy = (prop.y - camera.y) * tileSize;
    if (sx < -tileSize || sy < -tileSize || sx > ctx.canvas.width + tileSize || sy > ctx.canvas.height + tileSize) continue;
    drawPropGlyph(ctx, prop, sx, sy, tileSize, time, palette.accent, darkness);
  }

  // Landmarks remain navigation anchors, but typography follows the world pixel
  // language instead of looking like a floating modern web label.
  for (const landmark of map.landmarks) {
    const sx = (landmark.x + landmark.w / 2 - camera.x) * tileSize;
    const sy = (landmark.y - camera.y) * tileSize;
    if (sx < 0 || sy < 0 || sx > ctx.canvas.width || sy > ctx.canvas.height) continue;
    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,.92)';
    ctx.strokeText(landmark.name, sx, sy - 5);
    ctx.fillStyle = palette.accent;
    ctx.fillText(landmark.name, sx, sy - 5);
    ctx.restore();
  }
}