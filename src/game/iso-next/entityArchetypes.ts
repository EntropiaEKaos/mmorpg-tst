import type { IsoAssetAnimation, IsoAssetDirection, IsoAssetKind } from './assetPipeline';

export type IsoEntityArchetypeId='eldoria-villager'|'eldoria-guard'|'eldoria-merchant'|'forest-wisp'|'moss-boar'|'shadow-wolf';
export type IsoAmbientBehavior='idle'|'wander'|'patrol'|'graze'|'hover'|'watch';
export type IsoEntityArchetype={id:IsoEntityArchetypeId;kind:Extract<IsoAssetKind,'hero'|'creature'>;visualId:string;scale:number;anchorY:number;shadow:{width:number;height:number;alpha:number};directions:readonly Exclude<IsoAssetDirection,'omni'>[];animations:readonly IsoAssetAnimation[];ambient:readonly IsoAmbientBehavior[];palette:{primary:number;secondary:number;accent:number};};

const FOUR_DIRS=['nw','ne','sw','se'] as const;
const HUMANOID_ANIMS=['idle','walk','windup','attack','hit','cast','death'] as const;
const CREATURE_ANIMS=['idle','walk','windup','attack','hit','death'] as const;

export const ISO_ENTITY_ARCHETYPES:readonly IsoEntityArchetype[]=[
 {id:'eldoria-villager',kind:'hero',visualId:'npc-villager',scale:.96,anchorY:.86,shadow:{width:50,height:15,alpha:.28},directions:FOUR_DIRS,animations:HUMANOID_ANIMS,ambient:['idle','wander','watch'],palette:{primary:0x7b6650,secondary:0x416b55,accent:0xd4ad63}},
 {id:'eldoria-guard',kind:'hero',visualId:'npc-guard',scale:1.02,anchorY:.86,shadow:{width:56,height:17,alpha:.32},directions:FOUR_DIRS,animations:HUMANOID_ANIMS,ambient:['idle','patrol','watch'],palette:{primary:0x596b78,secondary:0x2d4561,accent:0xcaa45d}},
 {id:'eldoria-merchant',kind:'hero',visualId:'npc-merchant',scale:1,anchorY:.86,shadow:{width:52,height:16,alpha:.29},directions:FOUR_DIRS,animations:HUMANOID_ANIMS,ambient:['idle','wander','watch'],palette:{primary:0x81565d,secondary:0x514168,accent:0xe0b86d}},
 {id:'forest-wisp',kind:'creature',visualId:'forest-wisp',scale:.72,anchorY:.62,shadow:{width:28,height:9,alpha:.18},directions:FOUR_DIRS,animations:['idle','walk','hit','cast','death'],ambient:['hover','wander'],palette:{primary:0x72d6b1,secondary:0x397f74,accent:0xc9ffe4}},
 {id:'moss-boar',kind:'creature',visualId:'moss-boar',scale:1.08,anchorY:.78,shadow:{width:68,height:18,alpha:.34},directions:FOUR_DIRS,animations:CREATURE_ANIMS,ambient:['graze','wander','watch'],palette:{primary:0x53664b,secondary:0x354535,accent:0x9cab64}},
 {id:'shadow-wolf',kind:'creature',visualId:'shadow-wolf',scale:1,anchorY:.78,shadow:{width:62,height:16,alpha:.36},directions:FOUR_DIRS,animations:[...CREATURE_ANIMS,'cast'],ambient:['wander','watch'],palette:{primary:0x303541,secondary:0x171b25,accent:0x9a5cff}},
];

export function findEntityArchetype(visualId:string|undefined):IsoEntityArchetype|undefined{return ISO_ENTITY_ARCHETYPES.find(a=>a.visualId===visualId);}
export function ambientBehaviorAt(archetype:IsoEntityArchetype,seed:number):IsoAmbientBehavior{return archetype.ambient[Math.abs(Math.floor(seed))%archetype.ambient.length]??'idle';}
