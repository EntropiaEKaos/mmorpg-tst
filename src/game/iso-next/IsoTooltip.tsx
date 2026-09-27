import type { ReactNode } from 'react';
import { T as Tooltip, ItemTooltip, SpellTooltip, StatTooltip } from '../../components/Tooltip';
import type { Player, Spell } from '../types';

type AnyItem={name?:string;icon?:string;description?:string;value?:number;equipment?:any};
export function IsoItemTooltip({item,children}:{item:AnyItem;children:ReactNode}){const normalized={name:item.name||'Item',icon:item.icon||'◇',description:item.description,value:Number(item.value||0),equipment:item.equipment};return <Tooltip content={<ItemTooltip item={normalized}/>} position="right">{children}</Tooltip>}
export function IsoSpellTooltip({spell,player,index,noMana=false,onCd=false,locked=false,children}:{spell:Spell|any;player?:Player;index:number;noMana?:boolean;onCd?:boolean;locked?:boolean;children:ReactNode}){return <Tooltip content={<SpellTooltip spell={spell} player={player} idx={index} noMana={noMana} onCd={onCd} locked={locked}/>} position="top">{children}</Tooltip>}
export function IsoStatTooltip({label,value,description='',children}:{label:string;value:number;description?:string;children:ReactNode}){return <Tooltip content={<StatTooltip label={label} value={value} description={description}/>} position="right">{children}</Tooltip>}
export { Tooltip as IsoTooltip };
