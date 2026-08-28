from pathlib import Path


def replace(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f'anchor missing in {path}: {old[:120]!r}')
    p.write_text(s.replace(old,new,1))

# Versions
for path in ['package.json','package-lock.json']:
    p=Path(path); s=p.read_text(); p.write_text(s.replace('"version": "9.9.0"','"version": "9.10.0"',1))
for path in ['server/package.json','server/package-lock.json']:
    p=Path(path); s=p.read_text(); p.write_text(s.replace('"version": "9.9.0"','"version": "9.10.0"',1))

# Combat status vocabulary
replace('server/engine/CombatDepth.mjs',
"export const STATUS_TYPES=Object.freeze(['stun','slow','burn','poison','silence','vulnerable']);",
"export const STATUS_TYPES=Object.freeze(['stun','slow','burn','poison','silence','vulnerable','wet','chilled','frozen','shocked','cursed','unstable','fractured','rooted']);")
replace('server/engine/CombatDepth.mjs',
"export function hasStatus(entity,type,now=Date.now()){return activeStatuses(entity,now).some(s=>s.type===type)}\n",
"export function hasStatus(entity,type,now=Date.now()){return activeStatuses(entity,now).some(s=>s.type===type)}\nexport function removeStatus(entity,type,now=Date.now()){const c=ensure(entity);activeStatuses(entity,now);const before=c.status.length;c.status=c.status.filter(s=>s.type!==type);return c.status.length!==before}\n")

# Authoritative reaction domain
Path('server/engine/ElementalReactions.mjs').write_text(r'''// Mor'ia 9.10 — authoritative elemental states and reactions.
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
''')

# GameState integration
replace('server/engine/GameState.mjs',
"import { resolveSpellScaling, resolveSchoolDefense, skillForSchool, normalizeDamageSchool } from './ElementalScaling.mjs';\n",
"import { resolveSpellScaling, resolveSchoolDefense, skillForSchool, normalizeDamageSchool } from './ElementalScaling.mjs';\nimport { resolveElementalReaction } from './ElementalReactions.mjs';\n")
old="""        const schoolDefense = resolveSchoolDefense(monster, scalingProfile.school, scalingProfile.pierce);\n        const rawDamage = Math.floor(basePower * multiplier * schoolDefense.multiplier);\n        const damage = Math.max(1, rawDamage - Math.max(0, Number(monster.defense) || 0));\n        monster.hp -= damage;\n        player.stats.damageDealt += damage;\n        this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: damage, text: `${spell.name} x${multiplier.toFixed(2)}`, pos: { x: monster.x, y: monster.y }, color: spell.color, vocation: player.vocation });\n"""
new="""        const schoolDefense = resolveSchoolDefense(monster, scalingProfile.school, scalingProfile.pierce);\n        const reaction = resolveElementalReaction(monster, scalingProfile.school, { now });\n        const rawDamage = Math.floor(basePower * multiplier * schoolDefense.multiplier * reaction.damageMultiplier);\n        const effectiveDefense = Math.max(0, Number(monster.defense) || 0) * reaction.defenseMultiplier;\n        const damage = Math.max(1, Math.floor(rawDamage - effectiveDefense));\n        monster.hp -= damage;\n        player.stats.damageDealt += damage;\n        const reactionText = reaction.labels.length ? ` · ${reaction.labels.join(' + ')}` : '';\n        this.emitEvent(player.mapId, { kind: 'damage', targetId: monster.id, amount: damage, text: `${spell.name} x${multiplier.toFixed(2)}${reactionText}`, pos: { x: monster.x, y: monster.y }, color: spell.color, vocation: player.vocation, reaction: reaction.labels, school: scalingProfile.school });\n        if (reaction.labels.length) this.emitEvent(player.mapId, { kind:'elemental_reaction', targetId:monster.id, text:`${reaction.labels.join(' + ')} · ×${reaction.damageMultiplier.toFixed(2)}`, color:spell.color, pos:{x:monster.x,y:monster.y}, school:scalingProfile.school });\n"""
replace('server/engine/GameState.mjs',old,new)

# Client reaction reference for transparent tooltip
Path('src/game/elementalReactions.ts').write_text(r'''import type { DamageSchool } from './types';
export type ReactionHint={when:string;name:string;multiplier?:number;result:string};
export const REACTION_HINTS:Record<string,ReactionHint[]>=Object.freeze({
 physical:[{when:'Frozen',name:'Shatter',multiplier:1.50,result:'Consumes Frozen + heavy stagger'},{when:'Fractured',name:'Fracture Exploit',multiplier:1.20,result:'Ignores 25% target defense'}],
 fire:[{when:'Wet',name:'Steam Burst',multiplier:1.20,result:'Consumes Wet; target briefly vulnerable'},{when:'Frozen',name:'Thermal Shock',multiplier:1.35,result:'Consumes Frozen'},{when:'Otherwise',name:'Burn',result:'Applies Burn'}],
 water:[{when:'Burning',name:'Steam Burst',multiplier:1.22,result:'Extinguishes Burn + applies Wet'},{when:'Otherwise',name:'Wet',result:'Primes Lightning and Ice'}],
 lightning:[{when:'Wet',name:'Conductive Burst',multiplier:1.40,result:'Consumes Wet + brief stun'},{when:'Otherwise',name:'Shocked',result:'Applies Shocked'}],
 ice:[{when:'Wet',name:'Flash Freeze',multiplier:1.25,result:'Consumes Wet + Frozen/stun'},{when:'Chilled',name:'Deep Freeze',multiplier:1.15,result:'Converts Chilled to Frozen'},{when:'Otherwise',name:'Chilled',result:'Applies Chilled'}],
 earth:[{when:'Shocked',name:'Grounded',multiplier:1.20,result:'Consumes Shocked'},{when:'Otherwise',name:'Fractured',result:'Primes Physical damage'}],
 arcane:[{when:'Unstable',name:'Arcane Detonation',multiplier:1.30,result:'Consumes Unstable'},{when:'Otherwise',name:'Unstable',result:'Next non-Arcane school catalyzes ×1.18'}],
 death:[{when:'Cursed',name:'Soul Rend',multiplier:1.20,result:'Refreshes Cursed'},{when:'Otherwise',name:'Cursed',result:'Primes Holy/Shadow interactions'}],
 holy:[{when:'Cursed',name:'Purify',multiplier:1.40,result:'Consumes Cursed'},{when:'Death-aligned',name:'Exorcism',multiplier:1.25,result:'Bonus vs Death-school monsters'}],
 nature:[{when:'Poisoned',name:'Toxic Bloom',multiplier:1.25,result:'Amplifies poisoned target'},{when:'Otherwise',name:'Rooted',result:'Applies Root + Slow'}],
 poison:[{when:'Rooted',name:'Venom Bloom',multiplier:1.25,result:'Amplifies rooted target'},{when:'Otherwise',name:'Poison',result:'Applies Poison'}],
 shadow:[{when:'Cursed',name:'Eclipse',multiplier:1.25,result:'Amplifies cursed target'},{when:'Otherwise',name:'Cursed',result:'Applies Cursed'}],
 magic:[{when:'Any',name:'Pure Magic',result:'No intrinsic state; keeps generic magic scaling'}],
});
export function reactionHintsForSchool(school:DamageSchool|string){return REACTION_HINTS[String(school)]||REACTION_HINTS.magic}
''')

# Tooltip reaction transparency
replace('src/components/Tooltip.tsx',
"import { buildSpellScalingBreakdown, normalizeSchool, SCHOOL_META } from '../game/elementalScaling';\n",
"import { buildSpellScalingBreakdown, normalizeSchool, SCHOOL_META } from '../game/elementalScaling';\nimport { reactionHintsForSchool } from '../game/elementalReactions';\n")
replace('src/components/Tooltip.tsx',
"  const scaling = player ? buildSpellScalingBreakdown(player, spell as Spell) : null;\n",
"  const scaling = player ? buildSpellScalingBreakdown(player, spell as Spell) : null;\n  const reactionHints = reactionHintsForSchool(school);\n")
anchor="""        {(spell.critChance ?? 0) > 0 && (\n          <div className=\"flex justify-between\"><span className=\"text-amber-200/70\">Crit:</span><span className=\"text-red-300\">{spell.critChance}% (×{spell.critMult})</span></div>\n        )}\n"""
insert="""        <div className=\"mt-1 space-y-1 border-t border-cyan-300/20 pt-1\">\n          <div className=\"font-black uppercase tracking-wider text-cyan-200\">Reactive combos</div>\n          {reactionHints.slice(0,3).map((hint) => (\n            <div key={`${hint.when}-${hint.name}`} className=\"rounded border border-white/5 bg-black/20 px-1.5 py-1\">\n              <div className=\"flex justify-between gap-2\"><span className=\"text-slate-400\">{hint.when}</span><span className=\"font-bold\" style={{color:meta.color}}>{hint.name}{hint.multiplier ? ` ×${hint.multiplier.toFixed(2)}` : ''}</span></div>\n              <div className=\"text-[9px] text-cyan-100/65\">{hint.result}</div>\n            </div>\n          ))}\n        </div>\n"""+anchor
replace('src/components/Tooltip.tsx',anchor,insert)

# Tests
Path('server/test/elemental-reactions-9-10.test.mjs').write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { applyStatus, hasStatus } from '../engine/CombatDepth.mjs';
import { resolveElementalReaction, REACTION_RULES } from '../engine/ElementalReactions.mjs';
import fs from 'node:fs';

test('9.10 wet chains into authoritative lightning and ice reactions',()=>{
 const a={hp:100,maxHp:100,defense:10}; applyStatus(a,'wet',6000,0,1000); const r=resolveElementalReaction(a,'lightning',{now:1001});
 assert.equal(r.damageMultiplier,1.4); assert.ok(r.labels.includes('Conductive Burst')); assert.equal(hasStatus(a,'wet',1001),false); assert.equal(hasStatus(a,'shocked',1001),true); assert.equal(hasStatus(a,'stun',1001),true);
 const b={hp:100,maxHp:100,defense:10}; applyStatus(b,'wet',6000,0,1000); const f=resolveElementalReaction(b,'ice',{now:1001});
 assert.equal(f.damageMultiplier,1.25); assert.ok(f.labels.includes('Flash Freeze')); assert.equal(hasStatus(b,'frozen',1001),true);
});

test('9.10 frozen and fractured targets create physical build payoffs',()=>{
 const target={hp:100,maxHp:100,defense:20}; applyStatus(target,'frozen',5000,0,1000); applyStatus(target,'fractured',5000,20,1000);
 const r=resolveElementalReaction(target,'physical',{now:1001});
 assert.equal(r.damageMultiplier,1.8); assert.equal(r.defenseMultiplier,.75); assert.ok(r.labels.includes('Shatter')); assert.ok(r.labels.includes('Fracture Exploit')); assert.equal(hasStatus(target,'frozen',1001),false);
});

test('9.10 death holy arcane and nature poison have deterministic reaction chains',()=>{
 const cursed={damageType:'death'}; applyStatus(cursed,'cursed',5000,0,1000); const holy=resolveElementalReaction(cursed,'holy',{now:1001});
 assert.equal(holy.damageMultiplier,1.75); assert.deepEqual(holy.labels,['Purify','Exorcism']);
 const unstable={}; applyStatus(unstable,'unstable',5000,0,1000); const fire=resolveElementalReaction(unstable,'fire',{now:1001}); assert.equal(fire.damageMultiplier,1.18); assert.ok(fire.labels.includes('Arcane Catalysis'));
 const rooted={}; applyStatus(rooted,'rooted',5000,0,1000); const poison=resolveElementalReaction(rooted,'poison',{now:1001}); assert.equal(poison.damageMultiplier,1.25); assert.ok(hasStatus(rooted,'poison',1001));
});

test('9.10 reaction rules and client tooltip expose transparent combos',()=>{
 assert.ok(REACTION_RULES.lightning.some(v=>v.includes('Wet')));
 const tooltip=fs.readFileSync(new URL('../../src/components/Tooltip.tsx',import.meta.url),'utf8');
 const client=fs.readFileSync(new URL('../../src/game/elementalReactions.ts',import.meta.url),'utf8');
 assert.match(tooltip,/Reactive combos/); assert.match(tooltip,/reactionHintsForSchool/); assert.match(client,/Conductive Burst/); assert.match(client,/Flash Freeze/); assert.match(client,/Shatter/); assert.match(client,/Purify/);
});

test('9.10 GameState applies reaction multiplier before authoritative defense',()=>{
 const state=fs.readFileSync(new URL('../engine/GameState.mjs',import.meta.url),'utf8');
 assert.match(state,/resolveElementalReaction\(monster, scalingProfile\.school/);
 assert.match(state,/schoolDefense\.multiplier \* reaction\.damageMultiplier/);
 assert.match(state,/effectiveDefense = .*reaction\.defenseMultiplier/);
 assert.match(state,/kind:'elemental_reaction'/);
});
''')

print("Mor'ia 9.10 elemental reactions applied")
