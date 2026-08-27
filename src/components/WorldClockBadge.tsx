import type { WorldClockSnapshot } from '../game/dayNight';
import { worldClockLabel } from '../game/dayNight';

const PHASE_LABEL: Record<WorldClockSnapshot['phase'], string> = {
  dawn: 'Dawn',
  day: 'Day',
  dusk: 'Dusk',
  night: 'Night',
};

const PHASE_ICON: Record<WorldClockSnapshot['phase'], string> = {
  dawn: '🌅',
  day: '☀️',
  dusk: '🌇',
  night: '🌙',
};

export default function WorldClockBadge({ clock }: { clock: WorldClockSnapshot }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-slate-100 shadow-lg backdrop-blur-sm">
      <span className="mr-1.5">{PHASE_ICON[clock.phase]}</span>
      <span>{worldClockLabel(clock)}</span>
      <span className="mx-1.5 text-slate-500">·</span>
      <span className="text-slate-300">{PHASE_LABEL[clock.phase]}</span>
      <span className="ml-1.5 text-slate-500">D{clock.dayNumber + 1}</span>
    </div>
  );
}
