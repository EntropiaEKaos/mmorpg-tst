import { useEffect, useMemo, useState } from 'react';
import type { WorldWeather } from '../game/worldAtmosphere';

interface Props { type: WorldWeather; }

type Drop = { id: number; x: number; y: number; delay: number; duration: number; scale: number; opacity: number };

function makeDrops(type: WorldWeather): Drop[] {
  if (type === 'clear') return [];
  const count = type === 'storm' ? 132 : type === 'rain' ? 94 : 82;
  let seed = type === 'storm' ? 771 : type === 'rain' ? 421 : 197;
  const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: random() * 108 - 4,
    y: random() * 108 - 4,
    delay: random() * 3.4,
    duration: type === 'snow' ? 3.5 + random() * 3.2 : 0.46 + random() * 0.48,
    scale: 0.55 + random() * 0.95,
    opacity: 0.35 + random() * 0.55,
  }));
}

export default function Weather({ type }: Props) {
  const drops = useMemo(() => makeDrops(type), [type]);
  const [flash, setFlash] = useState(false);
  const [flashCount, setFlashCount] = useState(0);

  useEffect(() => {
    if (type !== 'storm') { setFlash(false); setFlashCount(0); return; }
    let secondary: number | undefined;
    const pulse = window.setInterval(() => {
      setFlash(true);
      setFlashCount((value) => value + 1);
      window.setTimeout(() => setFlash(false), 85);
      secondary = window.setTimeout(() => {
        setFlash(true);
        window.setTimeout(() => setFlash(false), 55);
      }, 155);
    }, 5900);
    return () => {
      window.clearInterval(pulse);
      if (secondary) window.clearTimeout(secondary);
    };
  }, [type]);

  if (type === 'clear') return null;

  const rain = type === 'rain' || type === 'storm';
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="true" data-weather={type}>
      <div className="moria-weather-lens absolute inset-0" />
      <div className="moria-weather-haze absolute inset-0" />
      {rain && <div className="absolute inset-0 bg-gradient-to-b from-slate-300/[0.035] via-transparent to-slate-950/20" />}
      {type === 'snow' && <div className="absolute inset-0 bg-gradient-to-b from-sky-100/[0.035] via-transparent to-sky-950/8" />}
      <div
        key={flashCount}
        className={`moria-lightning-flash absolute inset-0 transition-opacity duration-75 ${flash ? 'opacity-100' : 'opacity-0'}`}
      />
      {drops.map((drop) => (
        <span
          key={drop.id}
          className={type === 'snow' ? 'moria-snow-drop-v2 absolute rounded-full' : 'moria-rain-drop-v2 absolute'}
          style={{
            left: `${drop.x}%`,
            top: `${drop.y}%`,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
            opacity: drop.opacity,
            width: type === 'snow' ? `${3.5 * drop.scale}px` : `${Math.max(0.7, drop.scale)}px`,
            height: type === 'snow' ? `${3.5 * drop.scale}px` : `${(type === 'storm' ? 29 : 18) * drop.scale}px`,
            background: type === 'snow'
              ? 'radial-gradient(circle, rgba(255,255,255,.95) 0 35%, rgba(218,236,255,.55) 55%, transparent 72%)'
              : 'linear-gradient(180deg, rgba(226,241,255,0), rgba(190,220,246,.86))',
          }}
        />
      ))}
      {type === 'storm' && (
        <div className="absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-slate-200/[0.045] to-transparent" />
      )}
    </div>
  );
}
