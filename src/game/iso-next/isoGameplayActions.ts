import { serverSync } from '../ServerSync';

export type IsoAction =
  | { kind: 'attack'; targetId: string }
  | { kind: 'cast'; spellIndex: number; targetId?: string }
  | { kind: 'use-item'; itemId: string }
  | { kind: 'equip'; itemId: string }
  | { kind: 'unequip'; slot: string }
  | { kind: 'pickup'; groundId: string }
  | { kind: 'drop'; itemId: string }
  | { kind: 'mount'; action?: string; payload?: Record<string, unknown> }
  | { kind: 'travel'; targetMap: string }
  | { kind: 'talent'; talentId: string }
  | { kind: 'talent-reset' }
  | { kind: 'task'; action: string; payload?: Record<string, unknown> }
  | { kind: 'housing'; action: string; payload?: Record<string, unknown> }
  | { kind: 'social'; action: string; payload?: Record<string, unknown> }
  | { kind: 'appearance'; action: string; payload?: Record<string, unknown> };

export function dispatchIsoAction(action: IsoAction): boolean {
  if (!serverSync.isActive()) return false;
  switch (action.kind) {
    case 'attack': serverSync.sendAttack(action.targetId); break;
    case 'cast': serverSync.sendCast(action.spellIndex, action.targetId); break;
    case 'use-item': serverSync.sendUseItem(action.itemId); break;
    case 'equip': serverSync.sendEquip(action.itemId); break;
    case 'unequip': serverSync.sendUnequip(action.slot); break;
    case 'pickup': serverSync.sendPickup(action.groundId); break;
    case 'drop': serverSync.sendDrop(action.itemId); break;
    case 'mount': serverSync.sendMount(action.action || 'toggle', action.payload || {}); break;
    case 'travel': serverSync.sendTravel(action.targetMap); break;
    case 'talent': serverSync.sendTalent(action.talentId); break;
    case 'talent-reset': serverSync.sendTalentReset(); break;
    case 'task': serverSync.sendTask(action.action, action.payload || {}); break;
    case 'housing': serverSync.sendHousing(action.action, action.payload || {}); break;
    case 'social': serverSync.sendSocial(action.action, action.payload || {}); break;
    case 'appearance': serverSync.sendAppearance(action.action, action.payload || {}); break;
  }
  return true;
}

export type IsoGameplaySnapshot = {
  inventory: unknown[];
  equipment: Record<string, unknown>;
  groundItems: unknown[];
  activeQuests: unknown[];
  tasks: unknown[];
  talents: unknown[];
  professions: unknown[];
  reputation: unknown;
  mounts: unknown[];
};

export function selectIsoGameplaySnapshot(snapshot: any): IsoGameplaySnapshot {
  const player = snapshot?.player || {};
  return {
    inventory: Array.isArray(player.inventory) ? player.inventory : [],
    equipment: player.equipment && typeof player.equipment === 'object' ? player.equipment : {},
    groundItems: Array.isArray(snapshot?.groundItems) ? snapshot.groundItems : [],
    activeQuests: Array.isArray(player.activeQuests) ? player.activeQuests : [],
    tasks: Array.isArray(player.tasks) ? player.tasks : Array.isArray(snapshot?.tasks) ? snapshot.tasks : [],
    talents: Array.isArray(player.talents) ? player.talents : [],
    professions: Array.isArray(player.professions) ? player.professions : [],
    reputation: player.reputation || {},
    mounts: Array.isArray(player.mounts) ? player.mounts : [],
  };
}
