from pathlib import Path
import json

ROOT=Path('.')

def read(path): return (ROOT/path).read_text()
def write(path, text):
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(text)
def replace(path, old, new, count=1):
    s=read(path)
    if old not in s: raise SystemExit(f'anchor missing in {path}: {old[:120]!r}')
    write(path,s.replace(old,new,count))

# ------------------------------------------------------------------
# Shared authoritative elemental/scaling engine.
# ------------------------------------------------------------------
write('server/engine/ElementalScaling.mjs', r'''// Mor'ia 9.9 — authoritative damage-school and spell-scaling domain.
export const DAMAGE_SCHOOLS = Object.freeze([
  'physical','magic','arcane','fire','water','earth','lightning','ice','death','holy','nature','poison','shadow'
]);
const SCHOOLS = new Set(DAMAGE_SCHOOLS);
const MAGICAL = new Set(DAMAGE_SCHOOLS.filter(s => s !== 'physical'));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;

export function normalizeDamageSchool(value){
  const raw=String(value||'magic').trim().toLowerCase();
  const aliases={energy:'lightning',electric:'lightning',electricity:'lightning',frost:'ice',necrotic:'death',dark:'shadow',arcane_magic:'arcane'};
  const school=aliases[raw]||raw;
  return SCHOOLS.has(school)?school:'magic';
}

export function skillForSchool(school, spell={}){
  if(typeof spell.skillId==='string'&&spell.skillId.trim()) return spell.skillId.trim().toLowerCase();
  school=normalizeDamageSchool(school);
  if(school==='physical') return String(spell.weaponSkill||'sword').toLowerCase();
  if(school==='magic') return 'magic';
  return school;
}

function skillLevel(player,id){
  const raw=player?.skills?.[id];
  return Math.max(1,num(raw&&typeof raw==='object'?raw.level:raw,10));
}
function equipment(player){ return Object.values(player?.equipment||{}).filter(Boolean); }
function mapValue(obj,key){ return obj&&typeof obj==='object'?num(obj[key],0):0; }

export function collectEquipmentSchoolStats(player, school, skillId){
  school=normalizeDamageSchool(school);
  let schoolPower=0, genericPower=0, skillBonus=0, pierce=0;
  for(const item of equipment(player)){
    schoolPower += mapValue(item.damageBonuses,school);
    if(MAGICAL.has(school)) genericPower += mapValue(item.damageBonuses,'magic') + num(item.spellPower,0);
    else genericPower += mapValue(item.damageBonuses,'physical') + num(item.physicalPower,0);
    skillBonus += mapValue(item.skillBonuses,skillId);
    pierce += mapValue(item.resistancePierce,school);
    for(const affix of item.affixes||[]){
      schoolPower += mapValue(affix?.stats?.damageBonuses,school);
      skillBonus += mapValue(affix?.stats?.skillBonuses,skillId);
    }
  }
  return {schoolPower,genericPower,skillBonus,pierce:clamp(pierce,0,80)};
}

export function resolveSpellScaling(player, spell, derived={}){
  const school=normalizeDamageSchool(spell?.damageType || (spell?.scalingStat==='attack'?'physical':'magic'));
  const scalingStat=spell?.scalingStat || (school==='physical'?'attack':'magic');
  const attack=num(derived.totalAttack,player?.attack||0), magic=num(derived.totalMagic,player?.magic||0);
  const stat=scalingStat==='attack'?attack:scalingStat==='hybrid'?(attack+magic)/2:magic;
  const coeff=clamp(num(spell?.scalingCoeff,1),0,20);
  const base=num(spell?.damage,0)+stat*coeff*.5;
  const skillId=skillForSchool(school,spell);
  const item=collectEquipmentSchoolStats(player,school,skillId);
  const effectiveSkill=skillLevel(player,skillId)+item.skillBonus;
  const skillRate=clamp(num(spell?.skillScaling,.0125),0,.05);
  const skillMultiplier=1+Math.max(0,effectiveSkill-10)*skillRate;
  const itemBonus=item.schoolPower+item.genericPower;
  const itemMultiplier=1+clamp(itemBonus,-80,400)/100;
  const power=Math.max(0,Math.floor(base*skillMultiplier*itemMultiplier));
  return {
    school,scalingStat,stat,coeff,base,skillId,effectiveSkill,skillRate,skillMultiplier,
    schoolPower:item.schoolPower,genericPower:item.genericPower,itemBonus,itemMultiplier,pierce:item.pierce,power,
    breakdown:[
      {source:scalingStat==='attack'?'Attack':'Magic',value:stat,effect:`Base scaling ×${coeff}`},
      {source:`${skillId} skill`,value:effectiveSkill,effect:`×${skillMultiplier.toFixed(3)}`},
      {source:`${school} item power`,value:itemBonus,effect:`×${itemMultiplier.toFixed(3)}`},
    ]
  };
}

export function resolveSchoolDefense(target, school, pierce=0){
  school=normalizeDamageSchool(school);
  const resistance=mapValue(target?.resistances,school);
  const weakness=mapValue(target?.weaknesses,school);
  const effective=clamp(resistance-clamp(num(pierce,0),0,80)-weakness,-100,90);
  return {school,resistance,weakness,effective,multiplier:1-effective/100};
}
''')

# Client mirror is presentation-only; the server remains authoritative.
write('src/game/elementalScaling.ts', r'''import type { Equipment, Player, Spell } from './types';
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
function skillLevel(player:Player,id:string){ const raw=(player.skills as unknown as Record<string,{level:number}|number|undefined>)[id]; return Math.max(1,num(typeof raw==='object'&&raw?raw.level:raw,10)); }
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
''')

# ------------------------------------------------------------------
# Types: broaden school vocabulary and item/skill contracts.
# ------------------------------------------------------------------
replace('src/game/types.ts', "export interface Monster {", "export type DamageSchool = 'physical' | 'magic' | 'arcane' | 'fire' | 'water' | 'earth' | 'lightning' | 'ice' | 'death' | 'holy' | 'nature' | 'poison' | 'shadow';\nexport type SchoolValues = Partial<Record<DamageSchool, number>>;\n\nexport interface Monster {")
replace('src/game/types.ts', "  damageType?: 'physical' | 'fire' | 'ice' | 'death' | 'energy' | 'holy';", "  damageType?: DamageSchool;\n  resistances?: SchoolValues;\n  weaknesses?: SchoolValues;\n  damageBonuses?: SchoolValues;")
replace('src/game/types.ts', "    magic: { level: number; progress: number };\n    fishing:", "    magic: { level: number; progress: number };\n    arcane?: { level: number; progress: number }; fire?: { level: number; progress: number }; water?: { level: number; progress: number };\n    earth?: { level: number; progress: number }; lightning?: { level: number; progress: number }; ice?: { level: number; progress: number };\n    death?: { level: number; progress: number }; holy?: { level: number; progress: number }; nature?: { level: number; progress: number };\n    poison?: { level: number; progress: number }; shadow?: { level: number; progress: number };\n    fishing:")
replace('src/game/types.ts', "  damageReduction?: number; // % damage reduction\n  rarity:", "  damageReduction?: number; // % damage reduction\n  damageBonuses?: SchoolValues; // % outgoing power by school (magic also acts as generic magical power)\n  resistances?: SchoolValues; // % incoming mitigation by school\n  weaknesses?: SchoolValues; // % incoming vulnerability by school\n  skillBonuses?: Record<string, number>; // effective skill levels used by spell/weapon scaling\n  resistancePierce?: SchoolValues; // percentage points of target resistance ignored\n  spellPower?: number;\n  physicalPower?: number;\n  rarity:")
replace('src/game/types.ts', "  damageType?: 'physical' | 'fire' | 'ice' | 'energy' | 'death' | 'holy' | 'nature';\n  scalingCoeff?: number;", "  damageType?: DamageSchool;\n  scalingStat?: 'attack' | 'magic' | 'hybrid';\n  skillId?: string;\n  weaponSkill?: 'fist' | 'sword' | 'axe' | 'club' | 'distance';\n  skillScaling?: number; // multiplicative gain per effective skill level above 10\n  scalingCoeff?: number;")

# ------------------------------------------------------------------
# Action bar sends live player context to the tooltip.
# ------------------------------------------------------------------
replace('src/components/ActionBar.tsx', '<SpellTooltip spell={spell} idx={i} noMana={noMana} onCd={onCd} locked={locked} />', '<SpellTooltip spell={spell} player={player} idx={i} noMana={noMana} onCd={onCd} locked={locked} />')

# Tooltip: item school stats + explicit spell source/multiplier breakdown.
p='src/components/Tooltip.tsx'; s=read(p)
s=s.replace("import { createPortal } from 'react-dom';", "import { createPortal } from 'react-dom';\nimport type { Player, Spell, SchoolValues } from '../game/types';\nimport { buildSpellScalingBreakdown, normalizeSchool, SCHOOL_META } from '../game/elementalScaling';",1)
s=s.replace("    damageReduction?: number;\n    rarity: string;", "    damageReduction?: number;\n    damageBonuses?: SchoolValues; resistances?: SchoolValues; weaknesses?: SchoolValues; skillBonuses?: Record<string,number>; resistancePierce?: SchoolValues; spellPower?: number; physicalPower?: number;\n    rarity: string;",1)
needle="          {item.equipment.damageReduction ? <div style={{ color: '#4a90e2' }}>🛡 -{item.equipment.damageReduction}% Dmg Taken</div> : null}"
insert=needle+"\n          {Object.entries(item.equipment.damageBonuses || {}).map(([school,value]) => <div key={`power-${school}`} style={{ color: SCHOOL_META[normalizeSchool(school)].color }}>{SCHOOL_META[normalizeSchool(school)].icon} +{value}% {SCHOOL_META[normalizeSchool(school)].label} Power</div>)}\n          {Object.entries(item.equipment.resistances || {}).map(([school,value]) => <div key={`res-${school}`} className=\"text-cyan-200\">🛡 +{value}% {SCHOOL_META[normalizeSchool(school)].label} Resistance</div>)}\n          {Object.entries(item.equipment.weaknesses || {}).map(([school,value]) => <div key={`weak-${school}`} className=\"text-rose-300\">⚠ +{value}% {SCHOOL_META[normalizeSchool(school)].label} Vulnerability</div>)}\n          {Object.entries(item.equipment.skillBonuses || {}).map(([skill,value]) => <div key={`skill-${skill}`} className=\"text-emerald-300\">📈 +{value} {skill} skill</div>)}\n          {Object.entries(item.equipment.resistancePierce || {}).map(([school,value]) => <div key={`pierce-${school}`} className=\"text-orange-300\">✦ {value}% {SCHOOL_META[normalizeSchool(school)].label} resist pierce</div>)}"
if needle not in s: raise SystemExit('Tooltip item stat anchor missing')
s=s.replace(needle,insert,1)
s=s.replace("  spell: {", "  player?: Player;\n  spell: {",1)
s=s.replace("    damageType?: string;\n    scalingCoeff?: number;", "    damageType?: string; scalingStat?: 'attack'|'magic'|'hybrid'; skillId?: string; weaponSkill?: 'fist'|'sword'|'axe'|'club'|'distance'; skillScaling?: number;\n    scalingCoeff?: number;",1)
s=s.replace("  spell,\n  idx,", "  spell,\n  player,\n  idx,",1)
old="""  const dmgTypeColors: Record<string, string> = {
    fire: '#ff6a00', ice: '#9bd4ff', energy: '#4a90e2', death: '#9b59ff',
    holy: '#f4e04d', nature: '#2ecc71', physical: '#ffdddd',
  };
  return ("""
new="""  const school = normalizeSchool(spell.damageType);
  const meta = SCHOOL_META[school];
  const scaling = player ? buildSpellScalingBreakdown(player, spell as Spell) : null;
  return ("""
if old not in s: raise SystemExit('Tooltip spell color anchor missing')
s=s.replace(old,new,1)
s=s.replace("style={{ color: dmgTypeColors[spell.damageType] || '#fff' }}>{spell.damageType}", "style={{ color: meta.color }}>{meta.icon} {meta.label}",1)
formula_anchor="""        {spell.scalingCoeff && (
          <div className=\"flex justify-between\"><span className=\"text-amber-200/70\">Scaling:</span><span className=\"text-purple-300\">×{spell.scalingCoeff} MAG</span></div>
        )}"""
formula_new="""        {spell.scalingCoeff && (
          <div className=\"flex justify-between\"><span className=\"text-amber-200/70\">Scaling:</span><span className=\"text-purple-300\">×{spell.scalingCoeff} {(spell.scalingStat || (school==='physical'?'attack':'magic')).toUpperCase()}</span></div>
        )}
        {scaling && (
          <div className=\"mt-1 space-y-1 border-t border-fuchsia-400/20 pt-1\">
            <div className=\"font-black uppercase tracking-wider text-fuchsia-200\">Influence chain</div>
            <div className=\"flex justify-between\"><span className=\"text-slate-400\">{scaling.statKind} stat</span><span className=\"text-purple-200\">{scaling.stat.toFixed(0)} × {scaling.coeff}</span></div>
            <div className=\"flex justify-between\"><span className=\"text-slate-400\">{scaling.skillId} skill</span><span className=\"text-emerald-300\">Lv {scaling.effectiveSkill.toFixed(0)} → ×{scaling.skillMultiplier.toFixed(3)}</span></div>
            <div className=\"flex justify-between\"><span className=\"text-slate-400\">gear · {meta.label}</span><span style={{color:meta.color}}>+{scaling.itemBonus.toFixed(1)}% → ×{scaling.itemMultiplier.toFixed(3)}</span></div>
            {scaling.pierce > 0 && <div className=\"flex justify-between\"><span className=\"text-slate-400\">resistance pierce</span><span className=\"text-orange-300\">{scaling.pierce.toFixed(0)}%</span></div>}
            <div className=\"flex justify-between border-t border-white/10 pt-1 font-black\"><span className=\"text-amber-100\">Estimated power</span><span className=\"text-white\">{scaling.estimated}</span></div>
          </div>
        )}"""
if formula_anchor not in s: raise SystemExit('Tooltip spell formula anchor missing')
s=s.replace(formula_anchor,formula_new,1)
write(p,s)

# ------------------------------------------------------------------
# Studio schemas: all elemental metadata is editable and validated.
# ------------------------------------------------------------------
p='server/engine/ContentStudio.mjs'; s=read(p)
s=s.replace("const SPELL_TARGET_MODES = Object.freeze(['smart', 'self', 'target', 'area']);", "const SPELL_TARGET_MODES = Object.freeze(['smart', 'self', 'target', 'area']);\nconst DAMAGE_SCHOOLS = Object.freeze(['physical','magic','arcane','fire','water','earth','lightning','ice','death','holy','nature','poison','shadow']);\nconst SCALING_STATS = Object.freeze(['attack','magic','hybrid']);",1)
s=s.replace("    field('damageReduction', 'Damage reduction %', 'number'), field('rarity'", "    field('damageReduction', 'Damage reduction %', 'number'), field('damageBonuses','School power %','json'), field('resistances','School resistances %','json'), field('weaknesses','School vulnerabilities %','json'), field('skillBonuses','Skill bonuses','json'), field('resistancePierce','Resistance pierce %','json'), field('spellPower','Generic spell power %','number'), field('physicalPower','Generic physical power %','number'), field('rarity'",1)
s=s.replace("    field('telegraphMs','Telegraph ms','number')", "    field('damageType','Attack school','select',{optionKey:'damageSchools'}), field('damageBonuses','School power %','json'), field('resistances','School resistances %','json'), field('weaknesses','School vulnerabilities %','json'),\n    field('telegraphMs','Telegraph ms','number')",1)
s=s.replace("    field('buffDuration', 'Buff duration ms', 'number'), field('buffValue', 'Buff value', 'number'), field('scalingCoeff', 'Scaling', 'number'),", "    field('buffDuration', 'Buff duration ms', 'number'), field('buffValue', 'Buff value', 'number'), field('damageType','Damage school','select',{optionKey:'damageSchools'}), field('scalingStat','Scaling stat','select',{optionKey:'scalingStats'}), field('skillId','Scaling skill'), field('weaponSkill','Weapon skill'), field('skillScaling','Skill multiplier / level','number'), field('scalingCoeff', 'Stat coefficient', 'number'),",1)
# expose select option maps
s=s.replace("    spellTargetModes: SPELL_TARGET_MODES,", "    spellTargetModes: SPELL_TARGET_MODES, damageSchools: DAMAGE_SCHOOLS, scalingStats: SCALING_STATS,",1)
# semantic validator utility for school maps
anchor="function requiredText(record, key, max = 100) {"
helper="""function schoolMap(record,key,{min=-100,max=400}={}) {
  const raw=record?.[key]; if(raw===undefined||raw===null||raw==='') return null;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)) return `${key} must be an object`;
  for(const [school,value] of Object.entries(raw)){ if(!DAMAGE_SCHOOLS.includes(school)) return `${key}.${school} uses an unknown damage school`; const n=Number(value); if(!Number.isFinite(n)||n<min||n>max) return `${key}.${school} must be from ${min} to ${max}`; }
  return null;
}
function skillMap(record,key){ const raw=record?.[key]; if(raw===undefined||raw===null||raw==='') return null; if(!raw||typeof raw!=='object'||Array.isArray(raw)) return `${key} must be an object`; for(const [skill,value] of Object.entries(raw)){ if(!/^[a-z0-9_-]{2,40}$/i.test(skill)) return `${key} has invalid skill ${skill}`; const n=Number(value); if(!Number.isFinite(n)||n<-50||n>100) return `${key}.${skill} must be from -50 to 100`; } return null; }

"""
if anchor not in s: raise SystemExit('ContentStudio helper anchor missing')
s=s.replace(anchor,helper+anchor,1)
# insert generic map checks near start of validateStudioRecord
val_anchor="export function validateStudioRecord(type, record) {"
if val_anchor not in s: raise SystemExit('validateStudioRecord anchor missing')
s=s.replace(val_anchor,val_anchor+"\n  for (const key of ['damageBonuses','resistances','weaknesses','resistancePierce']) { const error=schoolMap(record,key,{min:key==='resistances'?0:-100,max:key==='resistancePierce'?80:400}); if(error) return error; }\n  { const error=skillMap(record,'skillBonuses'); if(error) return error; }",1)
# spell-specific checks before items checks
spell_anchor="  if (type === 'items') {"
checks="""  if (type === 'spells') {
    if(record.damageType!==undefined && !DAMAGE_SCHOOLS.includes(record.damageType)) return 'damageType is invalid';
    if(record.scalingStat!==undefined && !SCALING_STATS.includes(record.scalingStat)) return 'scalingStat is invalid';
    const skillScaling=numberIn(record,'skillScaling',0,0.05); if(skillScaling) return skillScaling;
  }

"""
if spell_anchor not in s: raise SystemExit('ContentStudio items validation anchor missing')
s=s.replace(spell_anchor,checks+spell_anchor,1)
write(p,s)

# ------------------------------------------------------------------
# Server GameState: skills + spell ingestion + authoritative scaling/resists.
# ------------------------------------------------------------------
p='server/engine/GameState.mjs'; s=read(p)
s=s.replace("import { worldEventDirector } from './WorldEventDirector.mjs';", "import { worldEventDirector } from './WorldEventDirector.mjs';\nimport { resolveSpellScaling, resolveSchoolDefense, skillForSchool, normalizeDamageSchool } from './ElementalScaling.mjs';",1)
s=s.replace("    magic: { level: 10, progress: 0 }, fishing: { level: 10, progress: 0 },", "    magic: { level: 10, progress: 0 }, arcane:{level:10,progress:0}, fire:{level:10,progress:0}, water:{level:10,progress:0}, earth:{level:10,progress:0}, lightning:{level:10,progress:0}, ice:{level:10,progress:0}, death:{level:10,progress:0}, holy:{level:10,progress:0}, nature:{level:10,progress:0}, poison:{level:10,progress:0}, shadow:{level:10,progress:0}, fishing: { level: 10, progress: 0 },",1)
# ingest new authored fields after levelRequired
old="""        levelRequired: Math.floor(boundedNumber(raw.levelRequired, 1, 100_000, previous?.levelRequired ?? 1)),
      };"""
new="""        levelRequired: Math.floor(boundedNumber(raw.levelRequired, 1, 100_000, previous?.levelRequired ?? 1)),
        damageType: normalizeDamageSchool(raw.damageType ?? previous?.damageType),
        scalingStat: ['attack','magic','hybrid'].includes(raw.scalingStat) ? raw.scalingStat : (previous?.scalingStat || undefined),
        skillId: typeof raw.skillId === 'string' && raw.skillId.trim() ? raw.skillId.trim().toLowerCase().slice(0,40) : previous?.skillId,
        weaponSkill: typeof raw.weaponSkill === 'string' && ['fist','sword','axe','club','distance'].includes(raw.weaponSkill) ? raw.weaponSkill : previous?.weaponSkill,
        skillScaling: boundedNumber(raw.skillScaling,0,.05,previous?.skillScaling ?? .0125),
      };"""
if old not in s: raise SystemExit('GameState spell ingestion anchor missing')
s=s.replace(old,new,1)
# skill progress and base power
old="""    this.progressSkill(player, 'magic', 1);
    if (requestedTargetId) player.targetId = requestedTargetId;

    const casterDerived = this.computeDerivedStats(player);
    const clock = createWorldClockSnapshot(now);
    const basePower = Math.max(0, Number(spell.damage) || 0) + Math.floor(casterDerived.totalMagic * (Number(spell.scalingCoeff) || 1) * 0.5);"""
new="""    const school = normalizeDamageSchool(spell.damageType);
    const scalingSkill = skillForSchool(school, spell);
    this.progressSkill(player, scalingSkill, 1);
    if (scalingSkill !== 'magic' && school !== 'physical') this.progressSkill(player, 'magic', 1);
    if (requestedTargetId) player.targetId = requestedTargetId;

    const casterDerived = this.computeDerivedStats(player);
    const clock = createWorldClockSnapshot(now);
    const scalingProfile = resolveSpellScaling(player, spell, casterDerived);
    const basePower = scalingProfile.power;"""
if old not in s: raise SystemExit('GameState basePower anchor missing')
s=s.replace(old,new,1)
old="""        const rawDamage = Math.floor(basePower * multiplier);
        const damage = Math.max(1, rawDamage - Math.max(0, Number(monster.defense) || 0));"""
new="""        const schoolDefense = resolveSchoolDefense(monster, scalingProfile.school, scalingProfile.pierce);
        const rawDamage = Math.floor(basePower * multiplier * schoolDefense.multiplier);
        const damage = Math.max(1, rawDamage - Math.max(0, Number(monster.defense) || 0));"""
if old not in s: raise SystemExit('GameState monster spell damage anchor missing')
s=s.replace(old,new,1)
write(p,s)

# ------------------------------------------------------------------
# Seed existing alpha regions with real school identities.
# ------------------------------------------------------------------
p='server/engine/AlphaContent.mjs'; s=read(p)
anchor="const MONSTER_THEMES = Object.freeze({"
profiles="""const SCHOOL_BY_REGION = Object.freeze({ eldoria:'nature',sunreach_coast:'water',ironwood:'earth',frostpeak:'ice',shadowfen:'poison',emberhold:'fire',crystal_deep:'arcane',stormwatch_isle:'lightning',voidlands:'shadow',nightfall_citadel:'death' });
const OPPOSING_SCHOOL = Object.freeze({ nature:'fire',water:'lightning',earth:'arcane',ice:'fire',poison:'holy',fire:'water',arcane:'physical',lightning:'earth',shadow:'holy',death:'holy' });

"""
if anchor not in s: raise SystemExit('AlphaContent profile anchor missing')
s=s.replace(anchor,profiles+anchor,1)
# item identity before push
item_anchor="""    if (rarity === 'legendary') { record.critChance=5; record.lifesteal=3; record.goldBonus=4; }
    items.push(record);"""
item_new="""    if (rarity === 'legendary') { record.critChance=5; record.lifesteal=3; record.goldBonus=4; }
    const school=SCHOOL_BY_REGION[region.id];
    record.damageBonuses={ [school]: rarity==='legendary'?18:rarity==='epic'?12:rarity==='rare'?8:5 };
    if(i===5 || slot==='shield') record.resistances={ [school]: rarity==='legendary'?20:12 };
    if(i===0 || slot==='weapon') record.skillBonuses={ [school]: rarity==='legendary'?5:rarity==='epic'?3:2 };
    items.push(record);"""
if item_anchor not in s: raise SystemExit('AlphaContent item anchor missing')
s=s.replace(item_anchor,item_new,1)
monster_anchor="""      speed:boss?850:elite?950:1100, lootTableId:`loot_${region.id}`,
    });"""
monster_new="""      speed:boss?850:elite?950:1100, lootTableId:`loot_${region.id}`,
      damageType:SCHOOL_BY_REGION[region.id], damageBonuses:{[SCHOOL_BY_REGION[region.id]]:boss?30:elite?15:5},
      resistances:{[SCHOOL_BY_REGION[region.id]]:boss?55:elite?35:20}, weaknesses:{[OPPOSING_SCHOOL[SCHOOL_BY_REGION[region.id]]]:boss?30:elite?22:15},
    });"""
if monster_anchor not in s: raise SystemExit('AlphaContent monster anchor missing')
s=s.replace(monster_anchor,monster_new,1)
write(p,s)

# ------------------------------------------------------------------
# Versions.
# ------------------------------------------------------------------
for p in ['package.json','server/package.json']:
    s=read(p); s=s.replace('"version": "9.8.0"','"version": "9.9.0"',1); write(p,s)
for p in ['package-lock.json','server/package-lock.json']:
    s=read(p); s=s.replace('"version": "9.8.0"','"version": "9.9.0"',2); write(p,s)

# ------------------------------------------------------------------
# Regression suite for formulas, content seed and source wiring.
# ------------------------------------------------------------------
write('server/test/elemental-scaling-9-9.test.mjs', r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveSpellScaling,resolveSchoolDefense,normalizeDamageSchool,skillForSchool} from '../engine/ElementalScaling.mjs';
import {validateStudioRecord} from '../engine/ContentStudio.mjs';
import {buildAlphaContent} from '../engine/AlphaContent.mjs';

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
 const content=buildAlphaContent();
 assert.ok(content.items.some(i=>i.damageBonuses&&Object.keys(i.damageBonuses).length));
 assert.ok(content.monsters.some(m=>m.resistances&&m.weaknesses&&m.damageType));
});

test('9.9 tooltips expose influence chain instead of hiding multipliers',()=>{
 const tooltip=fs.readFileSync(new URL('../../src/components/Tooltip.tsx',import.meta.url),'utf8');
 const action=fs.readFileSync(new URL('../../src/components/ActionBar.tsx',import.meta.url),'utf8');
 assert.match(tooltip,/Influence chain/); assert.match(tooltip,/Estimated power/); assert.match(tooltip,/resistance pierce/); assert.match(action,/player=\{player\}/);
});
''')

print('Mor\'ia 9.9 elemental scaling applied')
