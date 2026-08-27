// ===================================================================
// MOR'IA 9.2 — AUTHORITATIVE WORLD CLOCK
// One server-owned clock drives presentation and gameplay multipliers.
// ===================================================================

const DEFAULT_DAY_LENGTH_MS = 24 * 60 * 1000;
const MIN_DAY_LENGTH_MS = 5 * 60 * 1000;
const MAX_DAY_LENGTH_MS = 2 * 60 * 60 * 1000;

function boundedDayLength(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_DAY_LENGTH_MS;
  return Math.max(MIN_DAY_LENGTH_MS, Math.min(MAX_DAY_LENGTH_MS, Math.floor(parsed)));
}

export const WORLD_DAY_LENGTH_MS = boundedDayLength(process.env.MORIA_DAY_LENGTH_MS);

function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function createWorldClockSnapshot(now = Date.now(), dayLengthMs = WORLD_DAY_LENGTH_MS) {
  const safeNow = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const length = boundedDayLength(dayLengthMs);
  const absoluteDay = Math.floor(safeNow / length);
  const progress = ((safeNow % length) + length) % length / length;
  const minuteOfDay = Math.floor(progress * 1440);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;

  let phase = 'night';
  if (minuteOfDay >= 300 && minuteOfDay < 420) phase = 'dawn';
  else if (minuteOfDay >= 420 && minuteOfDay < 1080) phase = 'day';
  else if (minuteOfDay >= 1080 && minuteOfDay < 1200) phase = 'dusk';

  let darkness = 0.55;
  if (phase === 'day') darkness = 0;
  else if (phase === 'dawn') darkness = 0.55 * (1 - smoothstep(300, 420, minuteOfDay));
  else if (phase === 'dusk') darkness = 0.55 * smoothstep(1080, 1200, minuteOfDay);

  const daylight = Math.max(0, Math.min(1, 1 - darkness / 0.55));
  return Object.freeze({
    serverNow: safeNow,
    dayLengthMs: length,
    dayNumber: absoluteDay,
    progress,
    minuteOfDay,
    hour,
    minute,
    phase,
    isNight: phase === 'night',
    darkness,
    daylight,
  });
}

export function worldPhaseMultiplier(clock, dayMultiplier = 1, nightMultiplier = 1) {
  const day = Math.max(0.25, Math.min(3, Number(dayMultiplier) || 1));
  const night = Math.max(0.25, Math.min(3, Number(nightMultiplier) || 1));
  const snapshot = clock && typeof clock === 'object' ? clock : createWorldClockSnapshot();
  // Dawn/dusk blend both identities instead of creating discontinuous combat math.
  if (snapshot.phase === 'day') return day;
  if (snapshot.phase === 'night') return night;
  const daylight = Math.max(0, Math.min(1, Number(snapshot.daylight) || 0));
  return night + (day - night) * daylight;
}
