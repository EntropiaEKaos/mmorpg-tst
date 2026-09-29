import type { ReactNode } from 'react';
import { T as Tooltip, ItemTooltip, SpellTooltip, StatTooltip } from '../../components/Tooltip';
import type { Player, Spell } from '../types';

type AnyRecord=Record<string,any>;
type AnyItem={name?:string;icon?:string;description?:string;value?:number;price?:number;rarity?:string;level?:number;slot?:string;equipment?:AnyRecord;stats?:AnyRecord};
const num=(value:unknown,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

export function normalizeIsoItem(item:AnyItem={}){
 const equipment=item.equipment||item.stats?{
  ...(item.equipment||{}),
  ...(item.stats||{}),
  rarity:String(item.equipment?.rarity||item.rarity||'common'),
  level:num(item.equipment?.level??item.level,1),
  slot:String(item.equipment?.slot||item.slot||'item'),
 }:undefined;
 return {name:item.name||'Item',icon:item.icon||'◇',description:item.description,value:num(item.value??item.price),equipment};
}

export function normalizeIsoSpell(spell:Spell|AnyRecord={}){
 const raw=spell as AnyRecord;
 return {...raw,name:String(raw.name||'Unknown spell'),icon:String(raw.icon||'✦'),mana:num(raw.mana??raw.manaCost),cooldown:num(raw.cooldown),damage:num(raw.damage),range:num(raw.range,1),color:String(raw.color||'#9b7cff'),type:String(raw.type||'spell')};
}

export function IsoItemTooltip({item,children}:{item:AnyItem;children:ReactNode}){
 return <Tooltip content={<ItemTooltip item={normalizeIsoItem(item) as any}/>} position="right">{children}</Tooltip>;
}
export function IsoSpellTooltip({spell,player,index,noMana=false,onCd=false,locked=false,children}:{spell:Spell|any;player?:Player;index:number;noMana?:boolean;onCd?:boolean;locked?:boolean;children:ReactNode}){
 const normalized=normalizeIsoSpell(spell);
 const normalizedNoMana=noMana||Boolean(player&&num((player as AnyRecord).mana)<normalized.mana);
 return <Tooltip content={<SpellTooltip spell={normalized as any} player={player} idx={index} noMana={normalizedNoMana} onCd={onCd||Boolean((spell as AnyRecord)?.cooldownRemaining>0)} locked={locked||Boolean((spell as AnyRecord)?.locked)}/>} position="top">{children}</Tooltip>;
}
export function IsoStatTooltip({label,value,description='',children}:{label:string;value:number;description?:string;children:ReactNode}){
 return <Tooltip content={<StatTooltip label={label} value={value} description={description}/>} position="right">{children}</Tooltip>;
}
export { Tooltip as IsoTooltip };
