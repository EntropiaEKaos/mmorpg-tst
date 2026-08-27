import { useEffect, useRef } from 'react';
import type { Toast } from '../game/types';

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function Toaster({ toasts, onDismiss }: Props) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      for (const toast of toasts) {
        if (now - toast.startTime >= toast.duration) dismissRef.current(toast.id);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [toasts]);

  const now = Date.now();
  const visible = toasts.filter((t) => now - t.startTime < t.duration);

  return (
    <div className="pointer-events-none absolute right-4 top-16 z-40 flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2.5">
      {visible.slice(-4).map((t) => {
        const progress = Math.max(0, Math.min(1, (now - t.startTime) / t.duration));
        const eyebrow = t.type === 'achievement' ? 'ACHIEVEMENT UNLOCKED'
          : t.type === 'quest' ? 'QUEST UPDATE'
          : t.type === 'levelup' ? 'LEVEL UP'
          : t.type === 'loot' ? 'RARE LOOT'
          : t.type === 'warning' ? 'WARNING'
          : 'WORLD UPDATE';

        return (
          <div key={t.id} className="moria-panel moria-toast-in overflow-hidden rounded-2xl border px-3.5 py-3 shadow-2xl" style={{ borderColor: `${t.color}66`, boxShadow: `0 18px 46px rgba(0,0,0,.38), 0 0 24px ${t.color}16` }}>
            <div className="flex items-center gap-3">
              <div className="moria-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl" style={{ borderColor: `${t.color}44`, boxShadow: `inset 0 0 18px ${t.color}12` }}>
                <span style={{ filter: `drop-shadow(0 0 7px ${t.color}88)` }}>{t.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-black tracking-[0.18em]" style={{ color: t.color }}>{eyebrow}</div>
                <div className="mt-0.5 truncate text-sm font-black text-slate-100">{t.title}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-400">{t.description}</div>
              </div>
            </div>
            <div className="mt-2.5 h-0.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div className="h-full rounded-full" style={{ width: `${(1 - progress) * 100}%`, background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
