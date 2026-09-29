import { projectIso, type ScreenPoint, type WorldPoint } from './projection';
export type IsoDangerShape='circle'|'cone'|'line';
export type AuthoritativeVisualEntity={id:string;kind:'player'|'npc'|'monster'|'prop';world:WorldPoint;visualId?:string;/** Presentation-only fingerprint derived from authoritative equipment. */visualSignature?:string;/** Presentation-only danger cue sourced from authoritative cast state. */dangerShape?:IsoDangerShape;dangerProgress?:number;dangerRadius?:number;};
export type IsoVisualEntity=AuthoritativeVisualEntity&{screen:ScreenPoint};
/** Presentation-only adapter. It never mutates server-owned gameplay data. */
export function adaptAuthoritativeEntities(entities:readonly AuthoritativeVisualEntity[]):IsoVisualEntity[]{return entities.map(entity=>({...entity,screen:projectIso(entity.world)})).sort((a,b)=>a.screen.depth-b.screen.depth||a.id.localeCompare(b.id));}
