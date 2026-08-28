// MOR'IA 9.8 — authoritative interior/door contract derived from maps + housing.
const key=(mapId,id)=>`${mapId}:${id}`;
const num=(v,f=0)=>Number.isFinite(Number(v))?Math.floor(Number(v)):f;
function normalizeRoom(raw,mapId,source='map'){if(!raw||typeof raw!=='object')return null;const id=String(raw.id||'').trim();if(!id)return null;const w=Math.max(3,Math.min(40,num(raw.width,8))),h=Math.max(3,Math.min(40,num(raw.height,8)));return {id,mapId,name:String(raw.name||id).slice(0,80),kind:String(raw.kind||source),width:w,height:h,entrance:{x:num(raw.entranceX,1),y:num(raw.entranceY,h-1)},exit:{x:num(raw.exitX,1),y:num(raw.exitY,h-1)},tiles:Array.isArray(raw.tiles)?raw.tiles.slice(0,w*h):[],props:Array.isArray(raw.props)?raw.props.slice(0,160):[],source}}
class InteriorSystem{
  constructor(){this.rooms=new Map()}
  sync(contentDB){this.rooms.clear();for(const map of contentDB?.get?.('maps')||[]){for(const raw of Array.isArray(map.interiors)?map.interiors:[]){const room=normalizeRoom(raw,map.id,'map');if(room)this.rooms.set(key(map.id,room.id),room)}}for(const house of contentDB?.get?.('houses')||[]){const room=normalizeRoom({id:`house_${house.id}`,name:house.name,kind:'house',width:house.width,height:house.height,entranceX:1,entranceY:Math.max(2,num(house.height,6)-1),exitX:1,exitY:Math.max(2,num(house.height,6)-1)},house.mapId,'housing');if(room)this.rooms.set(key(house.mapId,room.id),room)}}
  list(mapId){return [...this.rooms.values()].filter(r=>r.mapId===mapId).map(r=>({...r}))}
  get(mapId,id){const r=this.rooms.get(key(mapId,id));return r?{...r}:null}
  validate(room){if(!room)return 'interior is required';if(room.width<3||room.height<3)return 'interior must be at least 3x3';if(room.entrance.x<0||room.entrance.x>=room.width||room.entrance.y<0||room.entrance.y>=room.height)return 'entrance must be inside interior bounds';return null}
  enter(player,mapId,id){const room=this.rooms.get(key(mapId,id));const error=this.validate(room);if(error)return {ok:false,error};player.interior={mapId,id,x:room.entrance.x,y:room.entrance.y};return {ok:true,interior:{...room},position:{...room.entrance}}}
  exit(player){if(!player?.interior)return {ok:false,error:'not inside an interior'};const previous={...player.interior};delete player.interior;return {ok:true,previous}}
  snapshot(player){if(!player?.interior)return {inside:false};const room=this.get(player.interior.mapId,player.interior.id);return {inside:Boolean(room),room,position:room?{x:num(player.interior.x),y:num(player.interior.y)}:null}}
}
export const interiorSystem=new InteriorSystem();
