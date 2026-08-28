import { memo, useEffect, useRef, useState } from 'react';
import { t as tr } from '../i18n';

interface CastInfo {
  name: string;
  icon: string;
  duration: number;
  startTime: number;
  color: string;
}

function CastBarInner() {
  const [cast, setCast] = useState<CastInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (event: CustomEvent<CastInfo>) => {
      const duration = Math.max(100, Number(event.detail.duration) || 100);
      setCast({ ...event.detail, duration, startTime: Date.now() });
      setProgress(0);
    };
    window.addEventListener('tibia-cast' as never, handler as never);
    return () => window.removeEventListener('tibia-cast' as never, handler as never);
  }, []);

  useEffect(() => {
    if (!cast) return;
    const tick = () => {
      const next = Math.max(0, Math.min(1, (Date.now() - cast.startTime) / cast.duration));
      setProgress(next);
      if (next >= 1) {
        rafRef.current = null;
        setCast(null);
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [cast]);

  if (!cast) return null;

  const remainingMs = Math.max(0, cast.duration * (1 - progress));

  return (
    <div className="pointer-events-none absolute bottom-[90px] left-1/2 z-[25] w-80 max-w-[calc(100vw-32px)] -translate-x-1/2">
      <div className="moria-panel overflow-hidden rounded-2xl border p-2.5" style={{ borderColor: `${cast.color}66`, boxShadow: `0 18px 46px rgba(0,0,0,.4), 0 0 24px ${cast.color}18` }}>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-black/25 text-xl" style={{ filter: `drop-shadow(0 0 7px ${cast.color}aa)` }}>{cast.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="moria-eyebrow text-[8px]" style={{ color: cast.color }}>{tr('CASTING')}</div>
            <div className="truncate text-xs font-black text-slate-100">{tr(cast.name)}</div>
          </div>
          <span className="font-mono text-[10px] text-slate-400">{(remainingMs / 1000).toFixed(1)}s</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-white/[0.05] bg-black/60 p-[1px]">
          <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${cast.color}99, ${cast.color})`, boxShadow: `0 0 10px ${cast.color}88` }} />
        </div>
      </div>
    </div>
  );
}

const CastBar = memo(CastBarInner);
export default CastBar;

export function triggerCast(name: string, icon: string, duration: number, color: string) {
  window.dispatchEvent(new CustomEvent('tibia-cast', { detail: { name, icon, duration: Math.max(100, duration), startTime: Date.now(), color } }));
}
