import { IsoStatTooltip } from './IsoTooltip';

const n=(value:unknown)=>Number.isFinite(Number(value))?Number(value):0;
const pct=(value:number,max:number)=>Math.max(0,Math.min(100,max>0?(value/max)*100:0));

export function IsoAuthoritativeStats({snapshot}:{snapshot:any}){
 const player=snapshot?.player;
 if(!player)return null;
 const stats=[
  {id:'hp',label:'HP',value:n(player.hp),max:n(player.maxHp),icon:'♥',description:'Vida atual. Ao chegar a zero, o personagem é derrotado.',color:'#ff737d'},
  {id:'mana',label:'MANA',value:n(player.mana),max:n(player.maxMana),icon:'✦',description:'Recurso usado para lançar magias e habilidades.',color:'#72aefc'},
  {id:'xp',label:'XP',value:n(player.xp),max:n(player.xpNext),icon:'◆',description:'Experiência acumulada para alcançar o próximo nível.',color:'#e5c477'},
  {id:'gold',label:'GOLD',value:n(player.gold),max:0,icon:'◈',description:'Ouro autoritativo disponível para comércio e serviços.',color:'#e5c477'},
 ];
 return <div data-testid="iso-authoritative-stats" style={{position:'absolute',left:20,bottom:168,zIndex:42,width:300,padding:9,borderRadius:13,background:'rgba(7,11,17,.94)',border:'1px solid rgba(238,203,126,.28)',boxShadow:'0 12px 34px rgba(0,0,0,.4)',color:'#f4e8c8',fontFamily:'system-ui',display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>{stats.map(stat=><IsoStatTooltip key={stat.id} label={stat.label} value={stat.value} description={stat.description}><div data-testid={`iso-stat-${stat.id}`} tabIndex={0} style={{padding:'7px 8px',borderRadius:9,border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.035)',cursor:'help',outline:'none'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:10,fontWeight:800}}><span>{stat.icon} {stat.label}</span><span style={{color:stat.color}}>{stat.max>0?`${Math.round(stat.value)}/${Math.round(stat.max)}`:Math.round(stat.value)}</span></div>{stat.max>0&&<div style={{height:4,marginTop:5,borderRadius:4,overflow:'hidden',background:'rgba(255,255,255,.08)'}}><div style={{height:'100%',width:`${pct(stat.value,stat.max)}%`,background:stat.color}}/></div>}</div></IsoStatTooltip>)}</div>;
}
