import type { NPC } from '../types';
import { projectIso } from './projection';
import type { AuthoritativeVisualEntity } from './worldAdapter';

export type LegacyNpcVisualRole='merchant'|'guard'|'scholar'|'banker'|'trainer'|'innkeeper'|'quest'|'citizen';
export type LegacyNpcVisualIdentity={visualId:string;role:LegacyNpcVisualRole;signature:string};

const normalize=(value:string)=>value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

/** Presentation identity only. Gameplay capability remains server-owned. */
export function resolveLegacyNpcVisualIdentity(npc:Pick<NPC,'id'|'name'>):LegacyNpcVisualIdentity{
 const key=normalize(`${npc.id} ${npc.name}`);
 const role:LegacyNpcVisualRole=
  /bank|vault|orwin|archive/.test(key)?'banker':
  /guard|sentinel|warden/.test(key)?'guard':
  /scholar|sage|librar|scribe|mage|arcane/.test(key)?'scholar':
  /trainer|master|mentor/.test(key)?'trainer':
  /inn|tavern|food|cook|rest/.test(key)?'innkeeper':
  /merchant|shop|vendor|trader|maelis/.test(key)?'merchant':
  /quest|elder|captain/.test(key)?'quest':'citizen';
 return{role,visualId:`npc-${role}`,signature:`legacy-npc:${role}:${npc.id}`};
}

/**
 * Converts legacy/server NPC snapshots into ISO Next presentation entities.
 * The original NPC id and position are preserved. This adapter never invents
 * services, dialogue, quests, economy state, collision or proximity results.
 */
export function adaptLegacyNpcToIso(npc:NPC):AuthoritativeVisualEntity{
 const visual=resolveLegacyNpcVisualIdentity(npc);
 return{id:npc.id,kind:'npc',world:{x:npc.pos.x,y:npc.pos.y},visualId:visual.visualId,visualSignature:visual.signature};
}

export function adaptLegacyNpcsToIso(npcs:readonly NPC[]):AuthoritativeVisualEntity[]{
 const seen=new Set<string>();
 return npcs.filter(npc=>{if(!npc?.id||seen.has(npc.id))return false;seen.add(npc.id);return true;}).map(adaptLegacyNpcToIso);
}

/** Screen-space occupancy used only to suppress decorative citizens near real NPCs. */
export function buildAuthoritativeNpcScreenOccupancy(npcs:readonly NPC[],radius=46):ReadonlyArray<{id:string;x:number;y:number;radius:number}>{
 return npcs.map(npc=>{const p=projectIso(npc.pos);return{id:npc.id,x:p.x,y:p.y,radius};});
}

export function isDecorativeCitizenSuppressed(x:number,y:number,occupancy:ReadonlyArray<{x:number;y:number;radius:number}>):boolean{
 return occupancy.some(n=>Math.hypot(x-n.x,y-n.y)<=n.radius);
}
