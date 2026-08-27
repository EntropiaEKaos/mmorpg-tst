export type WorldPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface WorldClockSnapshot {
  serverNow: number;
  dayLengthMs: number;
  dayNumber: number;
  progress: number;
  minuteOfDay: number;
  hour: number;
  minute: number;
  phase: WorldPhase;
  isNight: boolean;
  darkness: number;
  daylight: number;
}

const DEFAULT_DAY_LENGTH_MS = 24 * 60 * 1000;

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / Math.max(1, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function localWorldClock(now = Date.now(), dayLengthMs = DEFAULT_DAY_LENGTH_MS): WorldClockSnapshot {
  const length = Math.max(5 * 60_000, Math.min(2 * 60 * 60_000, Number(dayLengthMs) || DEFAULT_DAY_LENGTH_MS));
  const progress = (((now % length) + length) % length) / length;
  const minuteOfDay = Math.floor(progress * 1440);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  let phase: WorldPhase = 'night';
  if (minuteOfDay >= 300 && minuteOfDay < 420) phase = 'dawn';
  else if (minuteOfDay >= 420 && minuteOfDay < 1080) phase = 'day';
  else if (minuteOfDay >= 1080 && minuteOfDay < 1200) phase = 'dusk';
  let darkness = 0.55;
  if (phase === 'day') darkness = 0;
  else if (phase === 'dawn') darkness = 0.55 * (1 - smoothstep(300, 420, minuteOfDay));
  else if (phase === 'dusk') darkness = 0.55 * smoothstep(1080, 1200, minuteOfDay);
  return {
    serverNow: now,
    dayLengthMs: length,
    dayNumber: Math.floor(now / length),
    progress,
    minuteOfDay,
    hour,
    minute,
    phase,
    isNight: phase === 'night',
    darkness,
    daylight: Math.max(0, Math.min(1, 1 - darkness / 0.55)),
  };
}

export function sanitizeWorldClock(raw: unknown, now = Date.now()): WorldClockSnapshot {
  if (!raw || typeof raw !== 'object') return localWorldClock(now);
  const clock = raw as Partial<WorldClockSnapshot>;
  const phase: WorldPhase = ['dawn', 'day', 'dusk', 'night'].includes(String(clock.phase))
    ? clock.phase as WorldPhase
    : 'day';
  return {
    serverNow: Number(clock.serverNow) || now,
    dayLengthMs: Number(clock.dayLengthMs) || DEFAULT_DAY_LENGTH_MS,
    dayNumber: Math.max(0, Math.floor(Number(clock.dayNumber) || 0)),
    progress: Math.max(0, Math.min(1, Number(clock.progress) || 0)),
    minuteOfDay: Math.max(0, Math.min(1439, Math.floor(Number(clock.minuteOfDay) || 0))),
    hour: Math.max(0, Math.min(23, Math.floor(Number(clock.hour) || 0))),
    minute: Math.max(0, Math.min(59, Math.floor(Number(clock.minute) || 0))),
    phase,
    isNight: Boolean(clock.isNight),
    darkness: Math.max(0, Math.min(0.65, Number(clock.darkness) || 0)),
    daylight: Math.max(0, Math.min(1, Number(clock.daylight) || 0)),
  };
}

export function legacyOverrideDarkness(dayTime: number | null, fallback: number): number {
  if (dayTime === null || !Number.isFinite(dayTime)) return fallback;
  if (dayTime > 120) return Math.min(0.55, ((dayTime - 120) / 30) * 0.55);
  if (dayTime < 30) return Math.max(0, 0.55 - (dayTime / 30) * 0.55);
  return 0;
}

export function worldClockLabel(clock: WorldClockSnapshot): string {
  const hh = String(clock.hour).padStart(2, '0');
  const mm = String(clock.minute).padStart(2, '0');
  return `${hh}:${mm}`;
}
