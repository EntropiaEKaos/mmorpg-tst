import { useEffect, useRef } from 'react';
import { drawPixelHuman } from '../game/playerAvatar';

type PortraitSize = 'card' | 'hero';

export default function VocationPortrait({ id, color, active = false, size = 'card' }: { id: string; color: string; active?: boolean; size?: PortraitSize }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hero = size === 'hero';

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    const colors = { head: '#d7a06b', primary: color, secondary: '#30394a', detail: '#d9c271' };
    drawPixelHuman(
      ctx,
      canvas.width / 2,
      canvas.height - (hero ? 9 : 6),
      hero ? 68 : 46,
      'down',
      id,
      colors,
      0,
      520,
      id,
    );
  }, [id, color, hero]);

  const frameSize = hero ? 'h-[116px] w-[108px]' : 'h-[76px] w-[72px]';
  const canvasSize = hero ? 'h-[116px] w-[108px]' : 'h-[76px] w-[72px]';

  return (
    <span className={`relative flex ${frameSize} shrink-0 items-end justify-center overflow-hidden rounded-xl border ${active ? 'border-amber-200/35 bg-amber-200/[0.055]' : 'border-white/8 bg-black/20'}`}>
      <span className="absolute inset-x-2 bottom-1 h-2 rounded-full bg-black/35 blur-sm" />
      <span className="absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-amber-100/20 to-transparent" />
      <canvas
        ref={ref}
        width={hero ? 132 : 88}
        height={hero ? 144 : 92}
        className={`relative ${canvasSize} [image-rendering:pixelated]`}
        data-vocation-preview={id}
        aria-label={`Prévia visual: ${id}`}
      />
    </span>
  );
}
