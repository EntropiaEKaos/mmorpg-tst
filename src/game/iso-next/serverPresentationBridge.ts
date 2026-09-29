import { buildIsoWorldPresentation, type IsoWorldPresentation } from '../isoNext/presentationAdapter';
import type { AuthoritativeVisualEntity } from './worldAdapter';
import { resolveCharacterVisualIdentity, resolveNamedNpcVisual } from './characterVisualResolver';

export interface IsoServerPresentationFrame {
  world: IsoWorldPresentation;
  entities: readonly AuthoritativeVisualEntity[];
  playerId?: string;
}
type AnyRecord=Record<string,any>;
const records=(value:unknown):AnyRecord[]=>Array.isArray(value)?value.filter(Boolean) as AnyRecord[]:[];
const byId=(list:AnyRecord[])=>new Map(list.map(entry=>[String(entry.id||entry.playerId||entry.entityId||''),entry]));

/** Server-owned snapshot -> presentation contract. No gameplay authority is introduced here. */
export function bridgeServerSnapshot(snapshot: unknown): IsoServerPresentationFrame | null {
  const world = buildIsoWorldPresentation(snapshot);
  if (!world) return null;
  const raw=(snapshot&&typeof snapshot==='object'?snapshot:{}) as AnyRecord;
  const player=raw.player&&typeof raw.player==='object'?raw.player as AnyRecord:{};
  const npcIndex=byId(records(raw.npcs));
  const monsterIndex=byId(records(raw.monsters));
  const entities: AuthoritativeVisualEntity[] = world.actors.map((actor) => {
    let visualId:string;
    if(actor.kind==='player') visualId=resolveCharacterVisualIdentity({...player,class:player.class||actor.classId}).visualId;
    else if(actor.kind==='npc') visualId=resolveNamedNpcVisual(npcIndex.get(actor.id)||{})||'npc-villager';
    else {
      const monster=monsterIndex.get(actor.id)||{};
      const key=String(monster.visualId||monster.type||monster.species||actor.classId||'').toLowerCase();
      visualId=key.includes('wisp')?'forest-wisp':key.includes('boar')?'moss-boar':key.includes('wolf')?'shadow-wolf':String(monster.visualId||'shadow-wolf');
    }
    return {id:actor.id,kind:actor.kind,world:{x:actor.position.x,y:actor.position.y},visualId};
  });
  return {world,entities,playerId:world.actors.find((actor)=>actor.kind==='player')?.id};
}
