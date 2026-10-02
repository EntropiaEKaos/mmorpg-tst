export type IsoFxKind =
  | 'projectile' | 'trail' | 'beam' | 'lightning' | 'fire' | 'ice'
  | 'poison' | 'shadow' | 'holy' | 'necromancy' | 'impact' | 'decal' | 'status';

export type IsoFxEvent = {
  id: string;
  kind: IsoFxKind;
  visualId: string;
  sourceEntityId?: string;
  targetEntityId?: string;
  worldX?: number;
  worldY?: number;
  durationMs: number;
  intensity?: number;
};

/** FX events describe already-authorized outcomes; they never resolve hits or damage. */
export interface IsoFxSink {
  present(event: Readonly<IsoFxEvent>): void;
  cancel(eventId: string): void;
  clear(): void;
}
