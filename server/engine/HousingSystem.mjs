import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { contentDB as defaultContentDB } from './ContentDB.mjs';
import { isGmCharacter } from './ContentAccess.mjs';
import { WORLD } from './World.mjs';

const __filename=fileURLToPath(import.meta.url); const __dirname=path.dirname(__filename);
const DEFAULT_FILE=process.env.MORIA_HOUSING_DB||path.join(__dirname,'..','moria-housing.json');
const WEEK=7*24*60*60*1000; const GRACE=14*24*60*60*1000;
const cleanName=value=>typeof value==='string'?value.trim().slice(0,80):''; const keyName=value=>cleanName(value).toLowerCase();
const cleanId=value=>typeof value==='string'?value.trim().slice(0,100):'';

function blank(){return{version:1,houses:{}};}
function inside(def,x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=Number(def.x)&&x<Number(def.x)+Number(def.width)&&y>=Number(def.y)&&y<Number(def.y)+Number(def.height);}
function publicDef(def){return{id:def.id,name:def.name,mapId:def.mapId,x:Number(def.x),y:Number(def.y),width:Number(def.width),height:Number(def.height),entranceX:Number(def.entranceX),entranceY:Number(def.entranceY),price:Math.max(0,Math.floor(Number(def.price)||0)),weeklyRent:Math.max(0,Math.floor(Number(def.weeklyRent)||0)),levelRequired:Math.max(1,Math.floor(Number(def.levelRequired)||1)),style:def.style||'cottage'};}
function overlap(a,b){return Number(a.x)<Number(b.x)+Number(b.width??b.w)&&Number(a.x)+Number(a.width??a.w)>Number(b.x)&&Number(a.y)<Number(b.y)+Number(b.height??b.h)&&Number(a.y)+Number(a.height??a.h)>Number(b.y);}
function protectedPoint(def,p){return p&&inside(def,Number(p.x),Number(p.y));}

export class HousingSystem{
  constructor(contentDB=defaultContentDB,file=DEFAULT_FILE){this.contentDB=contentDB;this.file=file;this.state=blank();this.load();}
  load(){if(!fs.existsSync(this.file))return false;try{const raw=JSON.parse(fs.readFileSync(this.file,'utf8'));if(raw&&typeof raw==='object'&&!Array.isArray(raw)){this.state={version:1,houses:raw.houses&&typeof raw.houses==='object'&&!Array.isArray(raw.houses)?raw.houses:{}};return true;}}catch(e){console.warn('⚠ Housing DB load failed:',e.message);}return false;}
  save(){const tmp=`${this.file}.tmp`;try{fs.mkdirSync(path.dirname(this.file),{recursive:true});fs.writeFileSync(tmp,JSON.stringify(this.state,null,2));fs.renameSync(tmp,this.file);return true;}catch(e){try{fs.rmSync(tmp,{force:true});}catch{}console.warn('⚠ Housing DB save failed:',e.message);return false;}}
  defs(contentDB=this.contentDB){return contentDB.get('houses');}
  validateDefinition(def,contentDB=this.contentDB){
    if(!def||typeof def!=='object')return'Invalid house definition.';
    const map=WORLD.getMap(def.mapId); if(!map)return'House map does not exist.';
    const d=publicDef(def);
    if(!Number.isInteger(d.x)||!Number.isInteger(d.y)||!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<2||d.height<2||d.x<1||d.y<1||d.x+d.width>=map.width||d.y+d.height>=map.height)return'House footprint is outside playable map bounds.';
    if(!Number.isInteger(d.entranceX)||!Number.isInteger(d.entranceY)||!map.tiles?.[d.entranceY]?.[d.entranceX]?.walkable)return'House entrance must be on a walkable public tile.';
    const nearBox=d.entranceX>=d.x-2&&d.entranceX<=d.x+d.width+1&&d.entranceY>=d.y-2&&d.entranceY<=d.y+d.height+1;
    if(!nearBox)return'House entrance must stay beside its footprint.';
    if(protectedPoint(d,map.spawnPoint)||(map.portals||[]).some(p=>protectedPoint(d,p.pos)))return'House footprint overlaps a protected spawn or portal tile.';
    for(const source of WORLD.getDefinitions())for(const portal of source.portals||[])if(portal.targetMap===d.mapId&&protectedPoint(d,{x:portal.targetX,y:portal.targetY}))return'House footprint overlaps a protected portal arrival tile.';
    if((map.landmarks||[]).some(mark=>overlap(d,{...mark,width:mark.w,height:mark.h})))return'House footprint overlaps authoritative city architecture.';
    if(this.defs(contentDB).some(other=>other?.id!==d.id&&other?.mapId===d.mapId&&overlap(d,other)))return'House footprint overlaps another housing plot.';
    return null;
  }
  validateMapEdit(record,contentDB=this.contentDB){
    if(!record||typeof record!=='object'||!record.id)return null;
    const houses=this.defs(contentDB).filter(h=>h?.mapId===record.id);
    const landmarks=Array.isArray(record.landmarks)?record.landmarks:[];
    const spawn={x:Number(record.spawnX??record.spawnPoint?.x),y:Number(record.spawnY??record.spawnPoint?.y)};
    const portals=Array.isArray(record.portals)?record.portals:[];
    for(const house of houses){
      if(landmarks.some(mark=>overlap(house,{...mark,width:mark.w,height:mark.h})))return`Map architecture overlaps housing plot ${house.id}.`;
      if(protectedPoint(house,spawn)||portals.some(p=>protectedPoint(house,{x:Number(p.x??p.pos?.x),y:Number(p.y??p.pos?.y)})))return`Map spawn/portal overlaps housing plot ${house.id}.`;
    }
    return null;
  }
  resolvePublicPosition(mapId,origin,contentDB=this.contentDB){
    const map=WORLD.getMap(mapId); if(!map)return null;
    const houses=this.defs(contentDB).filter(def=>def?.mapId===mapId&&this.validateDefinition(def,contentDB)===null);
    return WORLD.findNearestWalkable(map,origin,14,(x,y)=>houses.some(def=>inside(def,x,y)));
  }
  record(id){const key=cleanId(id);return this.state.houses[key]||null;}
  ownedBy(name){const wanted=keyName(name);for(const [id,record] of Object.entries(this.state.houses))if(keyName(record?.ownerName)===wanted)return id;return '';}
  houseAt(mapId,x,y,contentDB=this.contentDB){return this.defs(contentDB).find(def=>def.mapId===mapId&&this.validateDefinition(def,contentDB)===null&&inside(def,x,y))||null;}
  hasAccess(player,def,contentDB=this.contentDB){if(!def)return true;if(isGmCharacter(contentDB,player))return true;const rec=this.record(def.id);if(!rec?.ownerName)return false;const name=keyName(player?.name);if(name===keyName(rec.ownerName))return true;return [...(rec.subowners||[]),...(rec.guests||[])].some(entry=>keyName(entry)===name);}
  canStep(player,mapId,x,y,contentDB=this.contentDB){const def=this.houseAt(mapId,x,y,contentDB);return !def||this.hasAccess(player,def,contentDB);}
  nearEntrance(player,def){return player?.mapId===def?.mapId&&Math.abs(Number(player.x)-Number(def.entranceX))+Math.abs(Number(player.y)-Number(def.entranceY))<=2;}
  maintainPlayer(player,contentDB=this.contentDB,now=Date.now()){const id=this.ownedBy(player?.name);if(!id)return false;const rec=this.record(id);if(rec&&Number(rec.rentDueAt)>0&&now>Number(rec.rentDueAt)+GRACE){delete this.state.houses[id];this.save();return true;}return false;}
  buy(player,houseId,contentDB=this.contentDB,now=Date.now()){const def=this.defs(contentDB).find(entry=>entry.id===cleanId(houseId));if(!def)return{ok:false,error:'Unknown house.'};const spatialError=this.validateDefinition(def,contentDB);if(spatialError)return{ok:false,error:spatialError};if(this.record(def.id)?.ownerName)return{ok:false,error:'House already owned.'};if(this.ownedBy(player.name))return{ok:false,error:'A character may own only one house.'};if(!this.nearEntrance(player,def))return{ok:false,error:'Stand near the house door to buy it.'};const d=publicDef(def);if(player.level<d.levelRequired)return{ok:false,error:`Requires level ${d.levelRequired}.`};if(player.gold<d.price)return{ok:false,error:'Not enough gold.'};player.gold-=d.price;this.state.houses[d.id]={ownerName:player.name,purchasedAt:now,rentDueAt:now+WEEK,guests:[],subowners:[],decor:[]};this.save();return{ok:true,action:'buy',house:d,spent:d.price};}
  release(player,houseId,contentDB=this.contentDB){const id=cleanId(houseId),rec=this.record(id);if(!rec||keyName(rec.ownerName)!==keyName(player.name))return{ok:false,error:'Only the owner can release this house.'};delete this.state.houses[id];this.save();return{ok:true,action:'release',houseId:id};}
  payRent(player,houseId,contentDB=this.contentDB,now=Date.now()){const def=this.defs(contentDB).find(entry=>entry.id===cleanId(houseId)),rec=def?this.record(def.id):null;if(!def||!rec||keyName(rec.ownerName)!==keyName(player.name))return{ok:false,error:'Only the owner can pay rent.'};const rent=Math.max(0,Math.floor(Number(def.weeklyRent)||0));const total=Math.max(0,Number(player.bankGold)||0)+Math.max(0,Number(player.gold)||0);if(total<rent)return{ok:false,error:'Not enough gold for rent.'};const fromBank=Math.min(Math.max(0,Number(player.bankGold)||0),rent);player.bankGold-=fromBank;player.gold-=rent-fromBank;rec.rentDueAt=Math.max(now,Number(rec.rentDueAt)||now)+WEEK;this.save();return{ok:true,action:'pay_rent',houseId:def.id,spent:rent,rentDueAt:rec.rentDueAt};}
  guest(player,houseId,name,add=true){const id=cleanId(houseId),rec=this.record(id);if(!rec||keyName(rec.ownerName)!==keyName(player.name))return{ok:false,error:'Only the owner can edit the guest list.'};const guest=cleanName(name);if(!guest||keyName(guest)===keyName(player.name))return{ok:false,error:'Invalid guest name.'};const list=Array.isArray(rec.guests)?rec.guests:[];const filtered=list.filter(entry=>keyName(entry)!==keyName(guest));if(add){if(filtered.length>=30)return{ok:false,error:'Guest list is full.'};filtered.push(guest);}rec.guests=filtered;this.save();return{ok:true,action:add?'guest_add':'guest_remove',houseId:id,guest};}
  decorate(player,payload,contentDB=this.contentDB){const id=cleanId(payload?.houseId),rec=this.record(id),def=this.defs(contentDB).find(entry=>entry.id===id);if(!def||!rec||!this.hasAccess(player,def,contentDB))return{ok:false,error:'You cannot decorate this house.'};const owner=keyName(rec.ownerName)===keyName(player.name),sub=(rec.subowners||[]).some(name=>keyName(name)===keyName(player.name));if(!owner&&!sub)return{ok:false,error:'Guests cannot move furniture.'};if(payload?.action==='decor_remove'){const placementId=cleanId(payload?.placementId);const before=(rec.decor||[]).length;rec.decor=(rec.decor||[]).filter(entry=>entry.id!==placementId);if(rec.decor.length===before)return{ok:false,error:'Decoration not found.'};this.save();return{ok:true,action:'decor_remove',placementId};}
    const decor=contentDB.get('housingDecor').find(entry=>entry.id===cleanId(payload?.decorId));if(!decor)return{ok:false,error:'Unknown decoration.'};const x=Math.floor(Number(payload?.x)),y=Math.floor(Number(payload?.y));if(player.mapId!==def.mapId||!inside(def,x,y))return{ok:false,error:'Decoration must be placed inside the house.'};if((rec.decor||[]).length>=50)return{ok:false,error:'House decoration limit reached.'};const price=Math.max(0,Math.floor(Number(decor.price)||0));if(player.gold<price)return{ok:false,error:'Not enough gold.'};player.gold-=price;const placement={id:`decor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,decorId:decor.id,x,y};rec.decor=[...(rec.decor||[]),placement];this.save();return{ok:true,action:'decor_add',placement,spent:price};}
  handle(player,payload,contentDB=this.contentDB){const action=cleanId(payload?.action);if(action==='buy')return this.buy(player,payload?.houseId,contentDB);if(action==='release')return this.release(player,payload?.houseId,contentDB);if(action==='pay_rent')return this.payRent(player,payload?.houseId,contentDB);if(action==='guest_add')return this.guest(player,payload?.houseId,payload?.name,true);if(action==='guest_remove')return this.guest(player,payload?.houseId,payload?.name,false);if(action==='decor_add'||action==='decor_remove')return this.decorate(player,payload,contentDB);return{ok:false,error:'Unknown housing action.'};}
  snapshot(player,contentDB=this.contentDB){this.maintainPlayer(player,contentDB);const mapId=player?.mapId;const ownedId=this.ownedBy(player?.name);const houses=this.defs(contentDB).filter(def=>def.mapId===mapId&&this.validateDefinition(def,contentDB)===null).map(def=>{const d=publicDef(def),rec=this.record(d.id);const own=keyName(rec?.ownerName)===keyName(player?.name);return{...d,ownerName:rec?.ownerName||'',rentDueAt:Number(rec?.rentDueAt)||0,access:this.hasAccess(player,def,contentDB),guests:own?[...(rec?.guests||[])]:undefined,decor:(rec?.decor||[]).map(place=>{const item=contentDB.get('housingDecor').find(entry=>entry.id===place.decorId);return{...place,name:item?.name||place.decorId,icon:item?.icon||'📦',color:item?.color||'#d9bd7a'};})};});return{ownedHouseId:ownedId,houses,decorCatalog:contentDB.get('housingDecor').map(entry=>({id:entry.id,name:entry.name,icon:entry.icon||'📦',kind:entry.kind||'decor',color:entry.color||'#d9bd7a',price:Math.max(0,Math.floor(Number(entry.price)||0))}))};}
}

export const housingSystem=new HousingSystem(defaultContentDB);
export { WEEK as HOUSING_RENT_PERIOD_MS, GRACE as HOUSING_RENT_GRACE_MS };
