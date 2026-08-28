import test from 'node:test';
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
 assert.ok(Math.abs(r.damageMultiplier-1.8)<1e-12); assert.equal(r.defenseMultiplier,.75); assert.ok(r.labels.includes('Shatter')); assert.ok(r.labels.includes('Fracture Exploit')); assert.equal(hasStatus(target,'frozen',1001),false);
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
