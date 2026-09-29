import { ItemTooltip, SpellTooltip, T as Tooltip } from '../../components/Tooltip';
import type { Player } from '../types';

type AnyRecord=Record<string,any>;
const num=(value:unknown,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

export function normalizeIsoItem(raw:AnyRecord={}){
 const equipment=raw.equipment||raw.stats?{
  ...(raw.equipment||{}),
  ...(raw.stats||{}),
  rarity:String(raw.equipment?.rarity||raw.rarity||'common'),
  level:num(raw.equipment?.level??raw.level,1),
  slot:String(raw.equipment?.slot||raw.slot||raw.type||'item'),
 }:undefined;
 return {name:String(raw.name||'Unknown item'),icon:String(raw.icon||'◇'),description:raw.description?String(raw.description):undefined,value:num(raw.value??raw.price),equipment};
}

export function normalizeIsoSpell(raw:AnyRecord={}){
 return {
  ...raw,
  name:String(raw.name||'Unknown spell'),icon:String(raw.icon||'✦'),mana:num(raw.mana??raw.manaCost),cooldown:num(raw.cooldown),damage:num(raw.damage),range:num(raw.range,1),color:String(raw.color||'#9b7cff'),type:String(raw.type||'spell'),
 };
}

export function IsoItemTooltip({item,children}:{item:AnyRecord;children:React.ReactNode}){
 return <Tooltip position="right" content={<ItemTooltip item={normalizeIsoItem(item) as any}/>}>{children}</Tooltip>;
}

export function IsoSpellTooltip({spell,player,index=0,children}:{spell:AnyRecord;player?:Player;index?:number;children:React.ReactNode}){
 const normalized=normalizeIsoSpell(spell);
 const noMana=Boolean(player&&num((player as AnyRecord).mana)<normalized.mana);
 return <Tooltip position="top" content={<SpellTooltip spell={normalized as any} player={player} idx={index} noMana={noMana} onCd={Boolean(spell.onCd||spell.cooldownRemaining>0)} locked={Boolean(spell.locked)}/>}>{children}</Tooltip>;
}

export function IsoStatTooltip({label,value,description,children}:{label:string;value:string|number;description:string;children:React.ReactNode}){
 return <Tooltip position="right" content={<div data-testid="iso-stat-tooltip" className="min-w-[180px] space-y-1"><div className="font-black text-amber-200">{label}</div><div className="text-lg font-black text-white">{value}</div><div className="text-[10px] text-amber-100/70">{description}</div></div>}>{children}</Tooltip>;
}
