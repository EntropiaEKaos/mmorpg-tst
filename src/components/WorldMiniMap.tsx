import { useMemo } from 'react';
import type { Monster, Player, TileType } from '../game/types';
import { MAPS, generateMap, getBiomeTint, getMapDimensions } from '../game/maps';
import { getCityMinimapMarkers } from '../game/cityPresentation';

const CRYSTAL_TILE_COLORS: Partial<Record<TileType,string>> = { wall:'#17182b', floor:'#4d5277', path:'#6ca9c7' };
const TILE_COLORS: Partial<Record<TileType, string>> = {
  water: '#285a86', tree: '#294838', stone: '#77736b', sand: '#bba36c', path: '#8a7456', wall: '#27272c',
  floor: '#8f826b', lava: '#a13a2d', bush: '#37563b', rock: '#554e4d', wood_floor: '#765a3a', bridge: '#8b704b',
};

interface Props {
  player: Player;
  monsters: Monster[];
  mapId: string;
}

export default function WorldMiniMap({ player, monsters, mapId }: Props) {
  const map = MAPS[mapId] || MAPS.eldoria;
  const size = 232;
  const { width: mapWidth, height: mapHeight } = getMapDimensions(map);
  const scale = size / mapWidth;
  const height = size * (mapHeight / mapWidth);
  const sample = Math.max(2, Math.ceil(Math.max(mapWidth, mapHeight) / 80));

  const { tiles, markers } = useMemo(() => {
    const world = generateMap(map.id);
    const tint = getBiomeTint(map.biome);
    const nextTiles: Array<{ x: number; y: number; color: string }> = [];
    for (let y = 0; y < mapHeight; y += sample) {
      for (let x = 0; x < mapWidth; x += sample) {
        const tile = world[y]?.[x];
        const fallback = ((x + y) & 2) === 0 ? tint.ground : tint.groundDark;
        nextTiles.push({ x, y, color: tile ? (tile.variant === 'crystal' ? (CRYSTAL_TILE_COLORS[tile.type] || TILE_COLORS[tile.type] || fallback) : (TILE_COLORS[tile.type] || fallback)) : fallback });
      }
    }
    return { tiles: nextTiles, markers: getCityMinimapMarkers(map) };
  }, [map.id, map.biome, map.cityAccent, map.districts, map.landmarks, map.portals, mapWidth, mapHeight, sample]);

  return (
    <div data-minimap-map={map.id} data-map-width={mapWidth} data-map-height={mapHeight} className="relative overflow-hidden border border-[#806437] bg-[#070a10] shadow-[inset_0_0_18px_rgba(0,0,0,.85)]" style={{ width: `${size}px`, height: `${height}px` }}>
      {tiles.map((tile, index) => <div key={index} className="absolute" style={{ left: tile.x * scale, top: tile.y * scale, width: sample * scale + .4, height: sample * scale + .4, background: tile.color }} />)}

      {map.districts.map((district) => <div key={district.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed" title={district.name} style={{ left: district.x * scale, top: district.y * scale, width: Math.max(8, district.radius * scale * 2), height: Math.max(8, district.radius * scale * 2), borderColor: `${district.color}aa`, background: `${district.color}18` }} />)}

      {markers.filter((marker) => marker.kind !== 'district').map((marker) => <div key={marker.id} data-minimap-marker={marker.id} className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-black/70 bg-black/65 font-black" title={marker.name} style={{ left: marker.x * scale, top: marker.y * scale, width: marker.kind === 'portal' ? 7 : 10, height: marker.kind === 'portal' ? 7 : 10, color: marker.color, fontSize: marker.kind === 'portal' ? 6 : 7, boxShadow: `0 0 4px ${marker.color}66` }}>{marker.kind === 'portal' ? '' : marker.icon}</div>)}

      {monsters.filter((monster) => !monster.dead).slice(0, 50).map((monster) => <div key={monster.id} className="absolute z-30" style={{ left: monster.pos.x * scale - 1.5, top: monster.pos.y * scale - 1.5, width: 3, height: 3, background: monster.type === 'boss' ? '#ffd87b' : monster.type === 'elite' ? '#b88aff' : '#ff5666' }} />)}
      <div data-minimap-player="true" className="absolute z-40 -translate-x-1/2 -translate-y-1/2 border border-black bg-amber-200" style={{ left: player.pos.x * scale, top: player.pos.y * scale, width: 7, height: 7, boxShadow: '0 0 7px rgba(255,225,160,.95)' }} />
      <div className="pointer-events-none absolute bottom-1 left-1 z-50 max-w-[150px] border border-black/50 bg-black/65 px-1.5 py-0.5 text-[7px] font-black tracking-wider" style={{ color: map.cityAccent }}>{map.name}</div>
    </div>
  );
}
