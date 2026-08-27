import { useEffect, useMemo, useState } from 'react';
import type { WorldWeather } from '../game/worldAtmosphere';

interface Props { type: WorldWeather; }

type Drop = { id: number; x: number; y: number; delay: number; duration: number; scale: number };

function makeDrops(type: WorldWeather): Drop[] {
  if (type === 'clear') return [];
  const count = type === 'storm' ? 110 : type === 'rain' ? 82 : 68;
  let seed = type === 'storm' ? 771 : type === 'rain' ? 421 : 197;
  const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: random() * 104 - 2,
    y: random() * 104 - 2,
    delay: random() * 3,
    duration: type === 'snow' ? 3 + random() * 2.5 : 0.55 + random() * 0.4,
    scale: 0.65 + random() * 0.75,
  }));
}

export default function Weather({ type }: Props) {
  const drops = useMemo(() => makeDrops(type), [type]);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (type !== 'storm') { setFlash(false); return; }
    const pulse = window.setInterval(() => {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 110);
    }, 7200);
    return () => window.clearInterval(pulse);
  }, [type]);

  if (type === 'clear') return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="true">
      <div className={`absolute inset-0 transition-opacity duration-100 ${flash ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'rgba(220,235,255,.26)' }} />
      {(type === 'rain' || type === 'storm') && <div className="absolute inset-0 bg-gradient-to-b from-slate-950/12 via-transparent to-blue-950/10" />}
      {drops.map((drop) => (
        <span
          key={drop.id}
          className={type === 'snow' ? 'moria-snow-drop absolute rounded-full bg-white/80' : 'moria-rain-drop absolute bg-blue-100/65'}
          style={{
            left: `${drop.x}%`, top: `${drop.y}%`,
            animationDelay: `${drop.delay}s`, animationDuration: `${drop.duration}s`,
            transform: `scale(${drop.scale})`,
            width: type === 'snow' ? 5 : 1,
            height: type === 'snow' ? 5 : type === 'storm' ? 22 : 14,
          }}
        />
      ))}
    </div>
  );
}
