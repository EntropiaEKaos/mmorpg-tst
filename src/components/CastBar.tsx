import { useState, useEffect } from 'react';

interface CastInfo {
  name: string;
  icon: string;
  duration: number;
  startTime: number;
  color: string;
}

export default function CastBar() {
  const [cast, setCast] = useState<CastInfo | null>(null);

  useEffect(() => {
    // Listen for cast events via custom event
    const handler = (e: CustomEvent<CastInfo>) => {
      setCast(e.detail);
    };
    window.addEventListener('tibia-cast' as never, handler as never);
    return () => window.removeEventListener('tibia-cast' as never, handler as never);
  }, []);

  if (!cast) return null;

  const elapsed = Date.now() - cast.startTime;
  const progress = Math.min(1, elapsed / cast.duration);

  if (progress >= 1) {
    setTimeout(() => setCast(null), 100);
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 z-15 pointer-events-none">
      <div
        className="rounded-lg border-2 p-2 backdrop-blur-md"
        style={{
          background: 'linear-gradient(180deg, rgba(40,20,40,0.95) 0%, rgba(20,10,20,0.98) 100%)',
          borderColor: cast.color,
          boxShadow: `0 0 20px ${cast.color}50`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl" style={{ filter: `drop-shadow(0 0 4px ${cast.color})` }}>{cast.icon}</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-amber-100">{cast.name}</div>
          </div>
          <span className="text-xs text-amber-200/70">{(elapsed / 1000).toFixed(1)}s</span>
        </div>
        <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-black/50">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${cast.color} 0%, ${cast.color}cc 100%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 0 8px ${cast.color}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function triggerCast(name: string, icon: string, duration: number, color: string) {
  window.dispatchEvent(
    new CustomEvent('tibia-cast', {
      detail: { name, icon, duration, startTime: Date.now(), color },
    })
  );
}
