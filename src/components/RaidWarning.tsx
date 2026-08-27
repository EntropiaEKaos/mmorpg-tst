import { useEffect, useRef, useState } from 'react';

interface RaidWarningData {
  text: string;
  icon: string;
  color: string;
  duration: number;
}

export default function RaidWarning() {
  const [warning, setWarning] = useState<RaidWarningData | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
      hideTimerRef.current = null;
      clearTimerRef.current = null;
    };

    const handler = (event: CustomEvent<RaidWarningData>) => {
      clearTimers();
      const duration = Math.max(800, Number(event.detail.duration) || 3000);
      const next = { ...event.detail, duration };
      setWarning(next);
      setVisible(true);
      hideTimerRef.current = window.setTimeout(() => setVisible(false), Math.max(300, duration - 450));
      clearTimerRef.current = window.setTimeout(() => setWarning(null), duration);
    };

    window.addEventListener('tibia-raid-warning' as never, handler as never);
    return () => {
      clearTimers();
      window.removeEventListener('tibia-raid-warning' as never, handler as never);
    };
  }, []);

  if (!warning) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="moria-raid-in relative max-w-[82vw] text-center">
        <div className="absolute left-1/2 top-1/2 h-36 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: `${warning.color}1f` }} />
        <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-5xl shadow-2xl backdrop-blur-sm" style={{ boxShadow: `0 0 42px ${warning.color}22, inset 0 1px rgba(255,255,255,.06)` }}>
          <span style={{ filter: `drop-shadow(0 0 12px ${warning.color})` }}>{warning.icon}</span>
        </div>
        <div className="moria-eyebrow relative mb-2" style={{ color: warning.color }}>WORLD EVENT</div>
        <div className="moria-title relative text-3xl font-black tracking-[0.08em] sm:text-4xl lg:text-5xl" style={{ color: warning.color, textShadow: `0 0 28px ${warning.color}66, 0 3px 18px rgba(0,0,0,.95)` }}>
          {warning.text}
        </div>
      </div>
    </div>
  );
}

export function showRaidWarning(text: string, icon: string, color: string, duration = 3000) {
  window.dispatchEvent(new CustomEvent('tibia-raid-warning', { detail: { text, icon, color, duration } }));
}
