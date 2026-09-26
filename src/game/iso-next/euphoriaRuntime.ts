import { IsoCamera } from './camera';
import { adaptAuthoritativeEntities, type AuthoritativeVisualEntity } from './worldAdapter';
import { buildEntitySceneFrame, sortIsoSceneFrame, type IsoSceneFrame } from './sceneModel';
import type { IsoRenderer, IsoViewport } from './rendererContract';

/**
 * Presentation coordinator for ISO Next. It deliberately has no simulation authority:
 * authoritative entities enter through updateAuthoritativeEntities and are projected
 * into a scene frame for the active renderer.
 */
export class EuphoriaPresentationRuntime {
  readonly camera = new IsoCamera();
  private renderer: IsoRenderer | null = null;
  private frame: IsoSceneFrame = sortIsoSceneFrame(buildEntitySceneFrame([]));

  async mount(renderer: IsoRenderer, host: HTMLElement, viewport: IsoViewport): Promise<void> {
    this.renderer = renderer;
    await renderer.mount(host);
    renderer.resize(viewport);
    renderer.setCamera(this.camera.snapshot());
    renderer.render(this.frame);
  }

  updateAuthoritativeEntities(entities: readonly AuthoritativeVisualEntity[]): void {
    const projected = adaptAuthoritativeEntities(entities);
    this.frame = sortIsoSceneFrame(buildEntitySceneFrame(projected));
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
    this.renderer?.destroy();
    this.renderer = null;
  }
}
