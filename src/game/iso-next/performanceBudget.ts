export type IsoPerformanceBudget = {
  targetFps: number;
  maxFrameMs: number;
  maxDynamicLights: number;
  maxActiveParticles: number;
  maxVisibleEntities: number;
};

export const ISO_DESKTOP_BUDGET: IsoPerformanceBudget = {
  targetFps: 60,
  maxFrameMs: 16.7,
  maxDynamicLights: 24,
  maxActiveParticles: 1800,
  maxVisibleEntities: 300,
};

export const ISO_MOBILE_BUDGET: IsoPerformanceBudget = {
  targetFps: 30,
  maxFrameMs: 33.4,
  maxDynamicLights: 8,
  maxActiveParticles: 500,
  maxVisibleEntities: 120,
};
