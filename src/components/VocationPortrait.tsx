import { useEffect, useRef } from 'react';
import { drawPixelHuman } from '../game/playerAvatar';

export default function VocationPortrait({ id, color, active = false }: { id: string; color: string; active?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled = false;
    const colors = { head:'#d7a06b', primary:color, secondary:'#30394a', detail:'#d9c271' };
    drawPixelHuman(ctx, canvas.width/2, canvas.height-6, 46, 'down', id, colors, 0, 520, id);
  }, [id,color]);
  return (
    <span className={`relative flex h-[76px] w-[72px] shrink-0 items-end justify-center overflow-hidden rounded-xl border ${active ? 'border-amber-200/35 bg-amber-200/[0.055]' : 'border-white/8 bg-black/20'}`}>
      <span className="absolute inset-x-2 bottom-1 h-2 rounded-full bg-black/35 blur-sm" />
      <canvas ref={ref} width={88} height={92} className="relative h-[76px] w-[72px] [image-rendering:pixelated]" data-vocation-preview={id} aria-label={`Prévia visual: ${id}`} />
    </span>
  );
}
