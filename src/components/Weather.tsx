import { useEffect, useState } from 'react';

interface Props {
  type: 'clear' | 'rain' | 'snow' | 'storm';
}

export default function Weather({ type }: Props) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (type === 'clear') {
      setParticles([]);
      return;
    }
    const count = type === 'storm' ? 150 : type === 'rain' ? 100 : 80;
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: type === 'snow' ? 3 + Math.random() * 2 : 0.5 + Math.random() * 0.5,
    }));
    setParticles(newParticles);
  }, [type]);

  if (type === 'clear') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-5" style={{ zIndex: 5 }}>
      {type === 'storm' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0,0,30,0.3)',
            animation: 'storm-flash 8s infinite',
          }}
        />
      )}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animationName: type === 'snow' ? 'snow-fall' : 'rain-fall',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        >
          {type === 'snow' ? (
            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" style={{ filter: 'blur(0.5px)' }} />
          ) : (
            <div
              className="bg-blue-200 opacity-60"
              style={{
                width: '1px',
                height: type === 'storm' ? '20px' : '12px',
                filter: 'blur(0.3px)',
              }}
            />
          )}
        </div>
      ))}
      <style>{`
        @keyframes rain-fall {
          0% { transform: translateY(-100vh) translateX(0); }
          100% { transform: translateY(100vh) translateX(-20px); }
        }
        @keyframes snow-fall {
          0% { transform: translateY(-100vh) translateX(0) rotate(0deg); }
          100% { transform: translateY(100vh) translateX(-50px) rotate(360deg); }
        }
        @keyframes storm-flash {
          0%, 95%, 100% { background: rgba(0,0,30,0.3); }
          96%, 97% { background: rgba(255,255,255,0.5); }
        }
      `}</style>
    </div>
  );
}
