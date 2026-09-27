import { IsoCamera } from './camera';
import { adaptAuthoritativeEntities, type AuthoritativeVisualEntity } from './worldAdapter';
import { buildEntitySceneFrame, sortIsoSceneFrame, type IsoFacing, type IsoSceneFrame } from './sceneModel';
import type { IsoRenderer, IsoViewport } from './rendererContract';

type PreviousVisual = { x: number; y: number; facing: IsoFacing; phase: number };

/**
 * Presentation coordinator for ISO Next. It deliberately has no simulation authority:
 * authoritative entities enter through updateAuthoritativeEntities and are projected
 * into a scene frame for the active renderer. Motion state is derived only for visuals.
 */
export class EuphoriaPresentationRuntime {
  readonly camera = new IsoCamera();
  private renderer: IsoRenderer | null = null;
  private frame: IsoSceneFrame = sortIsoSceneFrame(buildEntitySceneFrame([]));
  private previous = new Map<string, PreviousVisual>();

  async mount(renderer: IsoRenderer, host: HTMLElement, viewport: IsoViewport): Promise<void> {
    this.renderer = renderer;
    await renderer.mount(host);
    renderer.resize(viewport);
    renderer.setCamera(this.camera.snapshot());
    renderer.render(this.frame);
  }

  updateAuthoritativeEntities(entities: readonly AuthoritativeVisualEntity[]): void {
    const projected = adaptAuthoritativeEntities(entities);
    const next = sortIsoSceneFrame(buildEntitySceneFrame(projected));
    for (const node of next.entities) {
      const prior = this.previous.get(node.id);
      const dx = prior ? node.x - prior.x : 0;
      const dy = prior ? node.y - prior.y : 0;
      const moving = Math.hypot(dx, dy) > 0.35;
      let facing: IsoFacing = prior?.facing ?? 'se';
      if (moving) {
        if (Math.abs(dx) >= Math.abs(dy)) facing = dx >= 0 ? 'se' : 'nw';
        else facing = dy >= 0 ? 'sw' : 'ne';
      }
      const phase = moving ? ((prior?.phase ?? 0) + Math.min(0.32, Math.hypot(dx, dy) * 0.035 + 0.08)) % 1 : 0;
      node.motion = moving ? 'walk' : 'idle';
      node.facing = facing;
      node.animationPhase = phase;
      this.previous.set(node.id, { x: node.x, y: node.y, facing, phase });
    }
    this.frame = next;
    this.renderer?.render(this.frame);
  }

  followEntity(entityId: string): boolean {
    const entity = this.frame.entities.find((candidate) => candidate.id === entityId);
    if (!entity) return false;
    this.camera.follow(entity.x, entity.y);
    this.renderer?.setCamera(this.camera.snapshot());
    return true;
  }

  resize(viewport: IsoViewport): void {
    this.renderer?.resize(viewport);
  }

  zoom(value: number): void {
    this.camera.setZoom(value);
    this.renderer?.setCamera(this.camera.snapshot());
  }

  snapshot(): Readonly<IsoSceneFrame> {
    return this.frame;
  }

  destroy(): void {
    this.previous.clear();
    this.renderer?.destroy();
    this.renderer = null;
  }
}
