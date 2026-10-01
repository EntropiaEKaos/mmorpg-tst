import { useEffect, useRef } from 'react';

/**
 * Non-authoritative visual overlay for the legacy Eldoria renderer.
 * It intentionally owns no camera, collision, entity position or gameplay state.
 * The host supplies the already-resolved visual state from the legacy game.
 */
export interface LegacyEldoriaVisualState {
  width: number;
  height: number;
  daylight: number; // 0..1 supplied by legacy day/night
  raining: boolean;
  lightning: boolean;
}

export default function LegacyEldoriaHybridOverlay({ state }: { state: LegacyEldoriaVisualState }) {
  const atmosphereRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = atmosphereRef.current;
    if (!canvas) return;
    canvas.width = state.width;
    canvas.height = state.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const render = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Three.js will replace this fallback atmosphere pass once wired.
      // Keeping this lightweight pass means the legacy renderer remains usable
      // even if WebGL/Pixi initialization fails.
      const night = Math.max(0, Math.min(1, 1 - state.daylight));
      if (night > 0.02) {
        ctx.fillStyle = `rgba(12, 20, 48, ${night * 0.48})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (state.raining) {
        ctx.strokeStyle = 'rgba(190,220,255,.34)';
        ctx.lineWidth = 1;
        const phase = (now * 0.28) % 28;
        for (let x = -20; x < canvas.width + 20; x += 22) {
          const y = (x * 3 + phase * 9) % Math.max(1, canvas.height);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 5, y + 13);
          ctx.stroke();
        }
      }

      if (state.lightning) {
        ctx.fillStyle = 'rgba(220,235,255,.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [state.daylight, state.height, state.lightning, state.raining, state.width]);

  return (
    <div
      data-legacy-eldoria-hybrid="true"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div data-three-atmosphere-layer="pending" className="absolute inset-0" />
      <canvas
        ref={atmosphereRef}
        data-legacy-atmosphere-fallback="true"
        className="absolute inset-0 h-full w-full"
      />
      <div data-pixi-entity-layer="pending" className="absolute inset-0" />
    </div>
  );
}
