import type { Toast } from '../game/types';

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function Toaster({ toasts, onDismiss }: Props) {
  const now = Date.now();
  const visible = toasts.filter((t) => now - t.startTime < t.duration);

  // Auto-cleanup
  setTimeout(() => {
    const stillVisible = toasts.filter((t) => now - t.startTime < t.duration);
    if (stillVisible.length !== toasts.length) {
      for (const t of toasts) {
        if (now - t.startTime >= t.duration) onDismiss(t.id);
      }
    }
  }, 500);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-30 pointer-events-none">
      {visible.slice(-3).map((t) => {
        const progress = (now - t.startTime) / t.duration;
        return (
          <div
            key={t.id}
            className="rounded-lg border-2 px-4 py-2 backdrop-blur-sm min-w-[300px] shadow-2xl animate-slide-in"
            style={{
              background: 'linear-gradient(180deg, rgba(40,30,10,0.95) 0%, rgba(20,15,5,0.98) 100%)',
              borderColor: t.color,
              boxShadow: `0 0 30px ${t.color}40`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl" style={{ filter: `drop-shadow(0 0 8px ${t.color})` }}>
                {t.icon}
              </div>
              <div className="flex-1">
                <div className="text-[10px] tracking-widest font-bold" style={{ color: t.color }}>
                  {t.type === 'achievement' ? '🏆 ACHIEVEMENT UNLOCKED' :
                    t.type === 'quest' ? '📜 QUEST' :
                    t.type === 'levelup' ? '⭐ LEVEL UP' :
                    t.type === 'loot' ? '💎 RARE LOOT' :
                    t.type === 'warning' ? '⚠ WARNING' : 'ℹ INFO'}
                </div>
                <div className="text-amber-100 font-bold text-sm">{t.title}</div>
                <div className="text-amber-200/70 text-xs">{t.description}</div>
              </div>
            </div>
            <div className="h-0.5 bg-black/60 mt-2 rounded overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${(1 - progress) * 100}%`,
                  background: t.color,
                }}
              />
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes slide-in {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
