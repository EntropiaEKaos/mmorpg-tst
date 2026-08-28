import type { Equipment, Player, Spell } from './types';
export const DAMAGE_SCHOOLS = ['physical','magic','arcane','fire','water','earth','lightning','ice','death','holy','nature','poison','shadow'] as const;
export type DamageSchool = typeof DAMAGE_SCHOOLS[number];
export const SCHOOL_META: Record<DamageSchool,{label:string;color:string;icon:string}> = {
 physical:{label:'Physical',color:'#f1d7d7',icon:'⚔'}, magic:{label:'Magic',color:'#bd9cff',icon:'✦'}, arcane:{label:'Arcane',color:'#d77cff',icon:'🔮'},
 fire:{label:'Fire',color:'#ff7438',icon:'🔥'}, water:{label:'Water',color:'#53b8ff',icon:'💧'}, earth:{label:'Earth',color:'#b88955',icon:'🪨'},
 lightning:{label:'Lightning',color:'#ffe66d',icon:'⚡'}, ice:{label:'Ice',color:'#9fe8ff',icon:'❄'}, death:{label:'Death',color:'#a675d8',icon:'☠'},
 holy:{label:'Holy',color:'#fff0a6',icon:'☀'}, nature:{label:'Nature',color:'#68d391',icon:'🌿'}, poison:{label:'Poison',color:'#9ed64d',icon:'☣'}, shadow:{label:'Shadow',color:'#8b7cbf',icon:'🌑'}
};
const num=(v:unknown,f=0)=>Number.isFinite(Number(v))?Number(v):f;
export function normalizeSchool(value?:string):DamageSchool{ const a:Record<string,string>={energy:'lightning',frost:'ice',necrotic:'death',dark:'shadow'}; const k=(a[String(value||'magic').toLowerCase()]||String(value||'magic').toLowerCase()) as DamageSchool; return (DAMAGE_SCHOOLS as readonly string[]).includes(k)?k:'magic'; }
function skillLevel(player:Player,id:string){ const raw=((player.skills || {}) as unknown as Record<string,{level:number}|number|undefined>)[id]; return Math.max(1,num(typeof raw==='object'&&raw?raw.level:raw,10)); }
function equipment(player:Player){ return Object.values(player.equipment||{}).filter(Boolean) as Equipment[]; }
export function buildSpellScalingBreakdown(player:Player,spell:Spell){
 const school=normalizeSchool(spell.damageType); const skillId=spell.skillId||(school==='physical'?(spell.weaponSkill||'sword'):school==='magic'?'magic':school);
 let schoolPower=0,genericPower=0,skillBonus=0,pierce=0;
 for(const item of equipment(player)){ schoolPower+=num(item.damageBonuses?.[school]); genericPower+=school==='physical'?num(item.damageBonuses?.physical)+num(item.physicalPower):num(item.damageBonuses?.magic)+num(item.spellPower); skillBonus+=num(item.skillBonuses?.[skillId]); pierce+=num(item.resistancePierce?.[school]); }
 const derivedAttack=player.attack+equipment(player).reduce((s,i)=>s+num(i.attack),0); const derivedMagic=player.magic+equipment(player).reduce((s,i)=>s+num(i.magic),0);
 const statKind=spell.scalingStat||(school==='physical'?'attack':'magic'); const stat=statKind==='attack'?derivedAttack:statKind==='hybrid'?(derivedAttack+derivedMagic)/2:derivedMagic;
 const coeff=num(spell.scalingCoeff,1), effectiveSkill=skillLevel(player,skillId)+skillBonus, rate=num(spell.skillScaling,.0125), skillMultiplier=1+Math.max(0,effectiveSkill-10)*rate;
 const itemBonus=schoolPower+genericPower,itemMultiplier=1+itemBonus/100; const base=spell.damage+stat*coeff*.5; const estimated=Math.max(0,Math.floor(base*skillMultiplier*itemMultiplier));
 return {school,skillId,statKind,stat,coeff,effectiveSkill,skillBonus,skillMultiplier,schoolPower,genericPower,itemBonus,itemMultiplier,pierce,base,estimated};
}
