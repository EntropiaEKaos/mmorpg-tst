import { dispatchIsoAction } from './isoGameplayActions';

type MonsterView={id?:string;name?:string;level?:number;hp?:number;maxHp?:number;x?:number;y?:number;type?:string};
type PlayerView={x?:number;y?:number;mapId?:string;hp?:number};

export function IsoNearbyHostiles({snapshot}:{snapshot:any}){
  const player:PlayerView=snapshot?.player||{};
  const px=Number(player.x),py=Number(player.y);
  const positioned=Number.isFinite(px)&&Number.isFinite(py);
  const monsters:MonsterView[]=Array.isArray(snapshot?.monsters)?snapshot.monsters:[];
  const nearby=monsters.filter(monster=>monster?.id&&Number(monster.hp)>0
    &&Number.isFinite(Number(monster.x))&&Number.isFinite(Number(monster.y)))
    .map(monster=>({monster,distance:positioned
      ?Math.hypot(Number(monster.x)-px,Number(monster.y)-py):Infinity}))
    .filter(entry=>entry.distance<=12)
    .sort((a,b)=>a.distance-b.distance||String(a.monster.id).localeCompare(String(b.monster.id)))
    .slice(0,8);
  return <section data-testid="iso-nearby-hostiles" style={{padding:12,color:'#f4e8c8',fontFamily:'system-ui'}}>
    <b>⚔ Criaturas próximas</b>
    <div style={{fontSize:11,opacity:.75,margin:'4px 0 12px'}}>
      Alvos do servidor, ordenados por distância. O servidor valida alcance, recarga e dano.
    </div>
    <div style={{display:'grid',gap:7}}>
      {nearby.map(({monster,distance})=>{
        const health=Math.max(0,Number(monster.hp)||0),maxHealth=Math.max(1,Number(monster.maxHp)||health||1);
        const percent=Math.max(0,Math.min(100,100*health/maxHealth));
        const close=distance<=2;
        return <div data-testid="iso-nearby-enemy" data-monster-id={monster.id} key={monster.id}
          style={{border:'1px solid rgba(219,139,104,.3)',background:'rgba(92,38,28,.17)',padding:9,borderRadius:10}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:9,alignItems:'center'}}>
            <div style={{minWidth:0,flex:1}}>
              <b style={{fontSize:12}}>{monster.name||monster.id}</b>
              <div style={{fontSize:10,opacity:.7}}>
                Nível {monster.level??'?'} · {distance.toFixed(1)} casas {close?'· perto':'· aproxime-se'}
              </div>
            </div>
            <button type="button" data-testid="iso-nearby-attack" data-monster-id={monster.id}
              onClick={()=>dispatchIsoAction({kind:'attack',targetId:String(monster.id)})}
              title="Solicitar ataque ao servidor; o alcance e o resultado são validados online"
              style={{padding:'7px 10px',borderRadius:8,border:'1px solid rgba(245,168,104,.45)',background:'rgba(104,42,28,.55)',color:'#fff'}}>
              ⚔ Atacar
            </button>
          </div>
          <div style={{height:5,background:'rgba(255,255,255,.1)',borderRadius:4,marginTop:8,overflow:'hidden'}}>
            <div style={{width:`${percent}%`,height:'100%',background:'#d8725e'}}/>
          </div>
          <small style={{opacity:.8}}>{health}/{maxHealth} HP</small>
        </div>;
      })}
      {!nearby.length&&<div data-testid="iso-nearby-no-hostiles" style={{fontSize:12,opacity:.7,padding:10}}>
        Nenhuma criatura viva nos arredores. Explore Eldoria para encontrar inimigos.
      </div>}
    </div>
  </section>;
}
