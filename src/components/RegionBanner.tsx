import { memo } from 'react';
import type { GameMap } from '../game/maps';
import { ATMOSPHERE_PROFILES, type WorldWeather } from '../game/worldAtmosphere';

interface Props {
  map: GameMap;
  weather: WorldWeather;
}

const WEATHER_ICON: Record<WorldWeather, string> = { clear: '✦', rain: '🌧', snow: '❄', storm: '⚡' };

function RegionBannerInner({ map, weather }: Props) {
  const profile = ATMOSPHERE_PROFILES[map.biome];
  return (
    <div className="moria-region-banner pointer-events-none absolute left-1/2 top-16 z-20 w-[min(520px,88%)] -translate-x-1/2 text-center">
      <div className="text-[9px] font-black uppercase tracking-[0.42em]" style={{ color: profile.accent }}>
        {WEATHER_ICON[weather]} {profile.name} {map.dangerLevel ? `· ${map.dangerLevel}` : ''}
      </div>
      <div className="moria-title mt-1 text-2xl font-black tracking-[0.18em] text-amber-50 sm:text-3xl">{map.name}</div>
      <div className="mx-auto mt-2 h-px w-40 bg-gradient-to-r from-transparent via-current to-transparent opacity-60" style={{ color: profile.accent }} />
      <div className="mx-auto mt-2 max-w-md text-[10px] font-semibold tracking-wide text-slate-300/75">{map.description}</div>
      {map.levelRequired && map.levelRequired > 1 && (
        <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-rose-300">Recommended level {map.levelRequired}+</div>
      )}
    </div>
  );
}

export default memo(RegionBannerInner);
