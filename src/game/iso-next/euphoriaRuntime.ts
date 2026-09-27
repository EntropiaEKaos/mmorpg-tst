import { IsoCamera } from './camera';
import { adaptAuthoritativeEntities, type AuthoritativeVisualEntity } from './worldAdapter';
import { buildEntitySceneFrame, sortIsoSceneFrame, type IsoCombatCue, type IsoFacing, type IsoSceneFrame } from './sceneModel';
import type { IsoRenderer, IsoViewport } from './rendererContract';

type PreviousVisual = { x: number; y: number; facing: IsoFacing; phase: number };
type CombatVisual = { cue: IsoCombatCue; phase: number };

/** Presentation coordinator only. It never owns simulation, damage or hit resolution. */
export class EuphoriaPresentationRuntime {
  readonly camera = new IsoCamera();
  private renderer: IsoRenderer | null = null;
  private frame: IsoSceneFrame = sortIsoSceneFrame(buildEntitySceneFrame([]));
  private previous = new Map<string, PreviousVisual>();
  private combat = new Map<string, CombatVisual>();

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
      const combat = this.combat.get(node.id);
      node.motion = moving ? 'walk' : 'idle';
      node.facing = facing;
      node.animationPhase = phase;
      node.combatCue = combat?.cue ?? 'none';
      node.combatPhase = combat?.phase ?? 0;
      this.previous.set(node.id, { x: node.x, y: node.y, facing, phase });
    }
    this.frame = next;
    this.renderer?.render(this.frame);
  }

  /** Accept a cue only after authoritative gameplay has emitted/confirmed the event. */
  presentCombatCue(entityId: string, cue: Exclude<IsoCombatCue, 'none'>, phase = 0): boolean {
    if (!this.frame.entities.some((entity) => entity.id === entityId)) return false;
    this.combat.set(entityId, { cue, phase: Math.max(0, Math.min(1, phase)) });
    const entity = this.frame.entities.find((candidate) => candidate.id === entityId);
    if (entity) {
      entity.combatCue = cue;
      entity.combatPhase = Math.max(0, Math.min(1, phase));
      this.renderer?.render(this.frame);
    }
    return true;
  }

  clearCombatCue(entityId: string): void {
    this.combat.delete(entityId);
    const entity = this.frame.entities.find((candidate) => candidate.id === entityId);
    if (entity) { entity.combatCue = 'none'; entity.combatPhase = 0; this.renderer?.render(this.frame); }
  }

  followEntity(entityId: string): boolean {
    const entity = this.frame.entities.find((candidate) => candidate.id === entityId);
    if (!entity) return false;
    this.camera.follow(entity.x, entity.y);
    this.renderer?.setCamera(this.camera.snapshot());
    return true;
  }

  resize(viewport: IsoViewport): void { this.renderer?.resize(viewport); }
  zoom(value: number): void { this.camera.setZoom(value); this.renderer?.setCamera(this.camera.snapshot()); }
  snapshot(): Readonly<IsoSceneFrame> { return this.frame; }
  destroy(): void { this.previous.clear(); this.combat.clear(); this.renderer?.destroy(); this.renderer = null; }
}
