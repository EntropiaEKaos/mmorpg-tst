import { memo, useEffect, useRef, useState } from 'react';
import type { GameMap } from '../game/maps';
import { ATMOSPHERE_PROFILES, type WorldWeather } from '../game/worldAtmosphere';
import { CINEMATIC_EVENT_NAME, type CinematicRewardDescriptor } from '../game/cinematicRewards';
import { t as tr } from '../i18n';

interface Props {
  map: GameMap;
  weather: WorldWeather;
}

const WEATHER_ICON: Record<WorldWeather, string> = { clear: '✦', rain: '🌧', snow: '❄', storm: '⚡' };

function RegionBannerInner({ map, weather }: Props) {
  const profile = ATMOSPHERE_PROFILES[map.biome];
  const [cinematic, setCinematic] = useState<CinematicRewardDescriptor | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const onCinematic = (raw: Event) => {
      const next = (raw as CustomEvent<CinematicRewardDescriptor>).detail;
      if (!next?.kind) return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      setCinematic(next);
      timerRef.current = window.setTimeout(() => setCinematic(null), Math.max(1600, next.duration || 2800));
    };
    window.addEventListener(CINEMATIC_EVENT_NAME, onCinematic);
    return () => {
      window.removeEventListener(CINEMATIC_EVENT_NAME, onCinematic);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      <div className="moria-region-banner pointer-events-none absolute left-1/2 top-16 z-20 w-[min(520px,88%)] -translate-x-1/2 text-center">
        <div className="text-[9px] font-black uppercase tracking-[0.42em]" style={{ color: profile.accent }}>
          {WEATHER_ICON[weather]} {tr(profile.name)} {map.dangerLevel ? `· ${map.dangerLevel}` : ''}
        </div>
        <div className="moria-title mt-1 text-2xl font-black tracking-[0.18em] text-amber-50 sm:text-3xl">{tr(map.name)}</div>
        <div className="mx-auto mt-2 h-px w-40 bg-gradient-to-r from-transparent via-current to-transparent opacity-60" style={{ color: profile.accent }} />
        <div className="mx-auto mt-2 max-w-md text-[10px] font-semibold tracking-wide text-slate-300/75">{tr(map.description)}</div>
        {map.levelRequired && map.levelRequired > 1 && (
          <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-rose-300">{tr('Recommended level')} {map.levelRequired}+</div>
        )}
      </div>

      {cinematic && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-start justify-center overflow-hidden pt-[18%]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.52))]" />
          <div
            className="relative w-[min(760px,90%)] rounded-[28px] border px-6 py-5 text-center backdrop-blur-md"
            style={{
              borderColor: `${cinematic.color}80`,
              background: `linear-gradient(180deg, ${cinematic.color}16, rgba(5,7,12,0.92))`,
              boxShadow: `0 0 ${24 + cinematic.intensity * 12}px ${cinematic.color}35, 0 30px 80px rgba(0,0,0,.55)`,
              animation: 'moria-fade-up .28s ease-out both',
            }}
          >
            <div className="text-4xl drop-shadow-[0_0_18px_currentColor] sm:text-5xl" style={{ color: cinematic.color }}>{cinematic.icon}</div>
            <div className="mt-2 text-[10px] font-black uppercase tracking-[0.48em]" style={{ color: cinematic.color }}>{tr(cinematic.title)}</div>
            <div className="moria-title mt-2 text-2xl font-black tracking-[0.12em] text-white sm:text-4xl">{tr(cinematic.subtitle)}</div>
            {cinematic.description && <div className="mx-auto mt-2 max-w-xl text-[11px] font-semibold tracking-wide text-slate-300/80">{tr(cinematic.description)}</div>}
            <div className="mx-auto mt-4 h-px w-56 bg-gradient-to-r from-transparent via-current to-transparent" style={{ color: cinematic.color }} />
          </div>
        </div>
      )}
    </>
  );
}

export default memo(RegionBannerInner);
