// Mor'ia 9.9 — authoritative damage-school and spell-scaling domain.
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
