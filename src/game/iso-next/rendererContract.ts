import type { IsoCameraState } from './camera';
import type { IsoSceneFrame } from './sceneModel';

export type IsoViewport = { width: number; height: number; devicePixelRatio?: number };

/** Renderer boundary: implementations are presentation-only and must never mutate simulation state. */
export interface IsoRenderer {
  mount(host: HTMLElement): Promise<void> | void;
  resize(viewport: IsoViewport): void;
  setCamera(camera: Readonly<IsoCameraState>): void;
  render(frame: Readonly<IsoSceneFrame>): void;
  destroy(): void;
}
