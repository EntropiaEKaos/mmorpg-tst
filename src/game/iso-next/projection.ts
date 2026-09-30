export type WorldPoint = { x: number; y: number; elevation?: number };
export type ScreenPoint = { x: number; y: number; depth: number };

export type IsoProjectionConfig = {
  tileWidth: number;
  tileHeight: number;
  elevationStep: number;
};

export const DEFAULT_ISO_PROJECTION: IsoProjectionConfig = {
  tileWidth: 96,
  tileHeight: 48,
  elevationStep: 24,
};

export function projectIso(
  point: WorldPoint,
  config: IsoProjectionConfig = DEFAULT_ISO_PROJECTION,
): ScreenPoint {
  const elevation = point.elevation ?? 0;
  return {
    x: (point.x - point.y) * (config.tileWidth / 2),
    y: (point.x + point.y) * (config.tileHeight / 2) - elevation * config.elevationStep,
    depth: point.x + point.y + elevation * 0.001,
  };
}

export function unprojectIso(
  screenX: number,
  screenY: number,
  elevation = 0,
  config: IsoProjectionConfig = DEFAULT_ISO_PROJECTION,
): WorldPoint {
  const adjustedY = screenY + elevation * config.elevationStep;
  const x = screenX / config.tileWidth + adjustedY / config.tileHeight;
  const y = adjustedY / config.tileHeight - screenX / config.tileWidth;
  return { x, y, elevation };
}
