export type EnvironmentMotionSample = {
  water: number;
  foliage: number;
  lantern: number;
  motes: number;
};

/** Visual-only deterministic motion; no gameplay clock or simulation state is mutated. */
export function sampleEnvironmentMotion(timeMs: number): EnvironmentMotionSample {
  const t = Math.max(0, timeMs) / 1000;
  return {
    water: Math.sin(t * 1.45),
    foliage: Math.sin(t * .82) * .65 + Math.sin(t * 1.71) * .35,
    lantern: .82 + Math.sin(t * 5.4) * .08 + Math.sin(t * 11.7) * .04,
    motes: (t * .075) % 1,
  };
}

export function deterministicMote(index: number, phase: number): { x: number; y: number; alpha: number } {
  const seed = index * 1.61803398875;
  const p = (phase + seed) % 1;
  return {
    x: Math.sin(seed * 7.1 + p * Math.PI * 2) * (10 + (index % 4) * 5),
    y: -p * (38 + (index % 5) * 9),
    alpha: Math.sin(p * Math.PI) * .62,
  };
}
