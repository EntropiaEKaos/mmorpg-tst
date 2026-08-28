import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveSpellScaling,resolveSchoolDefense,normalizeDamageSchool,skillForSchool} from '../engine/ElementalScaling.mjs';
import {validateStudioRecord} from '../engine/ContentStudio.mjs';
import {ALPHA_CONTENT} from '../engine/AlphaContent.mjs';

test('9.9 damage schools normalize legacy aliases and infer scaling skills',()=>{
 assert.equal(normalizeDamageSchool('energy'),'lightning'); assert.equal(skillForSchool('fire',{}),'fire'); assert.equal(skillForSchool('physical',{weaponSkill:'axe'}),'axe');
});

test('9.9 item school power and character skill multiply spell output transparently',()=>{
 const player={attack:20,magic:30,skills:{fire:{level:30},magic:{level:20}},equipment:{weapon:{damageBonuses:{fire:20,magic:10},skillBonuses:{fire:4},resistancePierce:{fire:15},spellPower:5}}};
 const spell={damage:100,damageType:'fire',scalingCoeff:1.5,skillScaling:.01};
 const r=resolveSpellScaling(player,spell,{totalAttack:20,totalMagic:40});
 assert.equal(r.school,'fire'); assert.equal(r.effectiveSkill,34); assert.ok(r.skillMultiplier>1.2); assert.equal(r.itemBonus,35); assert.equal(r.pierce,15); assert.ok(r.power>r.base);
});

test('9.9 monster resistance weakness and item pierce alter elemental multiplier',()=>{
 const target={resistances:{fire:50},weaknesses:{water:25}};
 assert.equal(resolveSchoolDefense(target,'fire',0).multiplier,.5);
 assert.equal(resolveSchoolDefense(target,'fire',20).multiplier,.7);
 assert.equal(resolveSchoolDefense(target,'water',0).multiplier,1.25);
});

test('9.9 Studio fails closed for unknown schools and unsafe school values',()=>{
 assert.match(validateStudioRecord('monsters',{id:'bad_school',name:'Bad',hp:1,attack:1,defense:1,xp:1,level:1,type:'normal',color:'#fff',damageBonuses:{banana:5}})||'',/unknown damage school/);
 assert.match(validateStudioRecord('items',{id:'bad_res',name:'Bad',slot:'weapon',rarity:'common',level:1,value:1,resistances:{fire:999}})||'',/resistances.fire/);
 assert.match(validateStudioRecord('spells',{id:'bad_spell',name:'Bad',mana:1,cooldown:1000,damage:1,range:1,color:'#fff',type:'attack',vocation:'mage',levelRequired:1,damageType:'laser'})||'',/damageType/);
});

test('9.9 alpha equipment and monsters ship with editable regional school identities',()=>{
 const content=ALPHA_CONTENT;
 assert.ok(content.items.some(i=>i.damageBonuses&&Object.keys(i.damageBonuses).length));
 assert.ok(content.monsters.some(m=>m.resistances&&m.weaknesses&&m.damageType));
});

test('9.9 tooltips expose influence chain instead of hiding multipliers',()=>{
 const tooltip=fs.readFileSync(new URL('../../src/components/Tooltip.tsx',import.meta.url),'utf8');
 const action=fs.readFileSync(new URL('../../src/components/ActionBar.tsx',import.meta.url),'utf8');
 assert.match(tooltip,/Influence chain/); assert.match(tooltip,/Estimated power/); assert.match(tooltip,/resistance pierce/); assert.match(action,/player=\{player\}/);
});
