import { useState, useEffect } from 'react';

interface RaidWarningData {
  text: string;
  icon: string;
  color: string;
  duration: number;
}

export default function RaidWarning() {
  const [warning, setWarning] = useState<RaidWarningData | null>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handler = (e: CustomEvent<RaidWarningData>) => {
      setWarning(e.detail);
      setOpacity(1);
      setTimeout(() => {
        setOpacity(0);
        setTimeout(() => setWarning(null), 500);
      }, e.detail.duration - 500);
    };
    window.addEventListener('tibia-raid-warning' as never, handler as never);
    return () => window.removeEventListener('tibia-raid-warning' as never, handler as never);
  }, []);

  if (!warning) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-25 transition-opacity duration-500"
      style={{ opacity }}
    >
      <div
        className="text-center"
        style={{
          animation: 'raid-warning-pulse 0.3s ease-out',
        }}
      >
        <div className="text-6xl mb-2">{warning.icon}</div>
        <div
          className="text-4xl font-black tracking-wider"
          style={{
            color: warning.color,
            textShadow: `0 0 30px ${warning.color}, 0 0 60px ${warning.color}80, 0 2px 0 rgba(0,0,0,0.8)`,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {warning.text}
        </div>
      </div>
      <style>{`
        @keyframes raid-warning-pulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function showRaidWarning(text: string, icon: string, color: string, duration = 3000) {
  window.dispatchEvent(
    new CustomEvent('tibia-raid-warning', {
      detail: { text, icon, color, duration },
    })
  );
}
