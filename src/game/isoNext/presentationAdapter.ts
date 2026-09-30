export type IsoInteractionState = 'idle' | 'available' | 'pending' | 'accepted' | 'denied';

export interface IsoPoint {
  x: number;
  y: number;
}

export interface IsoActorPresentation {
  id: string;
  kind: 'player' | 'npc' | 'monster';
  mapId: string;
  position: IsoPoint;
  label?: string;
  classId?: string;
  hp?: number;
  maxHp?: number;
  interactionKinds?: readonly string[];
}

export interface IsoWorldPresentation {
  mapId: string;
  cityId?: string;
  actors: readonly IsoActorPresentation[];
  interaction: {
    state: IsoInteractionState;
    targetId?: string;
    kind?: string;
    reason?: string;
  };
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function actorFromServer(value: unknown, fallbackKind: IsoActorPresentation['kind'], mapId: string): IsoActorPresentation | null {
  const source = record(value);
  if (!source) return null;

  const id = text(source.id) ?? text(source.npcId) ?? text(source.monsterId) ?? text(source.playerId);
  const x = finite(source.x);
  const y = finite(source.y);
  if (!id || x === undefined || y === undefined) return null;

  const interactionKinds = Array.isArray(source.interactionKinds)
    ? source.interactionKinds.filter((entry): entry is string => typeof entry === 'string')
    : undefined;

  return {
    id,
    kind: fallbackKind,
    mapId: text(source.mapId) ?? mapId,
    position: { x, y },
    label: text(source.name) ?? text(source.label),
    classId: text(source.classId) ?? text(source.class),
    hp: finite(source.hp),
    maxHp: finite(source.maxHp),
    interactionKinds,
  };
}

/**
 * Converts an authoritative server snapshot into renderer-safe presentation data.
 * It intentionally contains no mutation methods and never derives rewards, damage,
 * quest completion, prices, inventory state or permissions on the client.
 */
export function buildIsoWorldPresentation(snapshot: unknown): IsoWorldPresentation | null {
  const root = record(snapshot);
  if (!root) return null;

  const mapId = text(root.mapId) ?? text(record(root.player)?.mapId);
  if (!mapId) return null;

  const actors: IsoActorPresentation[] = [];
  const player = actorFromServer(root.player, 'player', mapId);
  if (player) actors.push(player);

  const append = (values: unknown, kind: IsoActorPresentation['kind']) => {
    if (!Array.isArray(values)) return;
    for (const value of values) {
      const actor = actorFromServer(value, kind, mapId);
      if (actor) actors.push(actor);
    }
  };

  append(root.npcs, 'npc');
  append(root.monsters, 'monster');

  const interactionSource = record(root.interaction);
  const rawState = text(interactionSource?.state);
  const state: IsoInteractionState =
    rawState === 'available' || rawState === 'pending' || rawState === 'accepted' || rawState === 'denied'
      ? rawState
      : 'idle';

  return {
    mapId,
    cityId: text(root.cityId),
    actors,
    interaction: {
      state,
      targetId: text(interactionSource?.targetId),
      kind: text(interactionSource?.kind),
      reason: text(interactionSource?.reason),
    },
  };
}
