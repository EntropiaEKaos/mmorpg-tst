// Mor'ia 9.10 — authoritative elemental states and reactions.
import { applyStatus, hasStatus, removeStatus, addStagger } from './CombatDepth.mjs';
import { normalizeDamageSchool } from './ElementalScaling.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
export const ELEMENTAL_REACTION_STATES=Object.freeze(['wet','chilled','frozen','shocked','cursed','unstable','fractured','rooted','burn','poison']);
export const REACTION_RULES=Object.freeze({
  physical:['Frozen → Shatter ×1.50','Fractured → exploit armor ×1.20'],
  fire:['Wet → Steam Burst ×1.20','Frozen → Thermal Shock ×1.35','Otherwise applies Burn'],
  water:['Burn → Steam Burst ×1.22','Applies Wet for Lightning/Ice combos'],
  lightning:['Wet → Conductive Burst ×1.40 + brief stun','Applies Shocked'],
  ice:['Wet → Flash Freeze ×1.25 + Frozen','Chilled → Deep Freeze ×1.15','Otherwise applies Chilled'],
  earth:['Shocked → Grounded ×1.20','Applies Fractured'],
  arcane:['Unstable → Arcane Detonation ×1.30','Otherwise applies Unstable; another school catalyzes it ×1.18'],
  death:['Cursed → Soul Rend ×1.20','Applies/refreshes Cursed'],
  holy:['Cursed → Purify ×1.40','Death-aligned target → Exorcism ×1.25'],
  nature:['Poisoned → Toxic Bloom ×1.25','Applies Rooted + Slow'],
  poison:['Rooted → Venom Bloom ×1.25','Applies Poison'],
  shadow:['Cursed → Eclipse ×1.25','Otherwise applies Cursed'],
  magic:['No intrinsic reaction; uses generic magical scaling'],
});
function mark(result, label, mult=1){result.labels.push(label);result.damageMultiplier*=mult;}
function apply(result,target,type,duration,value,now){if(applyStatus(target,type,duration,value,now)){if(!result.applied.includes(type))result.applied.push(type)}}
function remove(result,target,type,now){if(removeStatus(target,type,now))result.removed.push(type)}
export function resolveElementalReaction(target, rawSchool, {now=Date.now()}={}){
  const school=normalizeDamageSchool(rawSchool); const result={school,damageMultiplier:1,defenseMultiplier:1,labels:[],applied:[],removed:[]};
  if(school!=='arcane'&&hasStatus(target,'unstable',now)){mark(result,'Arcane Catalysis',1.18);remove(result,target,'unstable',now)}
  if(school==='physical'){
    if(hasStatus(target,'frozen',now)){mark(result,'Shatter',1.50);remove(result,target,'frozen',now);addStagger(target,50,100,now)}
    if(hasStatus(target,'fractured',now)){mark(result,'Fracture Exploit',1.20);result.defenseMultiplier=.75}
  } else if(school==='fire'){
    if(hasStatus(target,'frozen',now)){mark(result,'Thermal Shock',1.35);remove(result,target,'frozen',now)}
    if(hasStatus(target,'wet',now)){mark(result,'Steam Burst',1.20);remove(result,target,'wet',now);apply(result,target,'vulnerable',1800,12,now)} else apply(result,target,'burn',4500,4,now)
  } else if(school==='water'){
    if(hasStatus(target,'burn',now)){mark(result,'Steam Burst',1.22);remove(result,target,'burn',now)}
    apply(result,target,'wet',6000,0,now)
  } else if(school==='lightning'){
    if(hasStatus(target,'wet',now)){mark(result,'Conductive Burst',1.40);remove(result,target,'wet',now);apply(result,target,'stun',650,0,now)}
    apply(result,target,'shocked',3500,10,now)
  } else if(school==='ice'){
    if(hasStatus(target,'wet',now)){mark(result,'Flash Freeze',1.25);remove(result,target,'wet',now);apply(result,target,'frozen',1800,0,now);apply(result,target,'stun',900,0,now)}
    else if(hasStatus(target,'chilled',now)){mark(result,'Deep Freeze',1.15);remove(result,target,'chilled',now);apply(result,target,'frozen',1400,0,now);apply(result,target,'stun',650,0,now)}
    else apply(result,target,'chilled',4500,20,now)
  } else if(school==='earth'){
    if(hasStatus(target,'shocked',now)){mark(result,'Grounded',1.20);remove(result,target,'shocked',now)}
    apply(result,target,'fractured',6000,20,now)
  } else if(school==='arcane'){
    if(hasStatus(target,'unstable',now)){mark(result,'Arcane Detonation',1.30);remove(result,target,'unstable',now)} else apply(result,target,'unstable',6000,0,now)
  } else if(school==='death'){
    if(hasStatus(target,'cursed',now))mark(result,'Soul Rend',1.20)
    apply(result,target,'cursed',8000,15,now)
  } else if(school==='holy'){
    if(hasStatus(target,'cursed',now)){mark(result,'Purify',1.40);remove(result,target,'cursed',now)}
    if(normalizeDamageSchool(target?.damageType||target?.school)==='death')mark(result,'Exorcism',1.25)
  } else if(school==='nature'){
    if(hasStatus(target,'poison',now))mark(result,'Toxic Bloom',1.25)
    apply(result,target,'rooted',2800,0,now);apply(result,target,'slow',2800,30,now)
  } else if(school==='poison'){
    if(hasStatus(target,'rooted',now))mark(result,'Venom Bloom',1.25)
    apply(result,target,'poison',5000,4,now)
  } else if(school==='shadow'){
    if(hasStatus(target,'cursed',now))mark(result,'Eclipse',1.25); else apply(result,target,'cursed',6500,10,now)
  }
  result.damageMultiplier=clamp(result.damageMultiplier,.5,2.5); result.defenseMultiplier=clamp(result.defenseMultiplier,.25,1);
  return result;
}
