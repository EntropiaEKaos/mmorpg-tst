// ===================================================================
//  SERVER SYNC MANAGER — turns the client into a "dumb terminal"
// ===================================================================

import { sendAuth, sendIntent, setSnapshot, getSnapshot, isAuthoritative, net, type ServerSnapshot } from './network';
import { type PlayerSave } from './SaveManager';

export { net };

let pendingLoadResponse: ((save: PlayerSave | null) => void) | null = null;

export interface RenderState { player:any; nearbyPlayers:any[]; monsters:any[]; groundItems:any[]; events:any[]; official:any; social:any; worldClock?:any; }

class ServerSyncManager {
  private authed=false; private currentMapId='eldoria'; private lastProcessedEvents:any[]|null=null;
  authenticate(characterOrToken:string,characterOrVocation:string){let sessionToken=characterOrToken,characterName=characterOrVocation;if(characterOrToken.length<32){sessionToken=localStorage.getItem('moria_session_token')||'';characterName=characterOrToken;}if(!sessionToken||!characterName)return;sendAuth(sessionToken,characterName);}
  handleAuthOk(){this.authed=true;} handleAuthError(){this.authed=false;this.lastProcessedEvents=null;setSnapshot(null);}
  reset(){this.authed=false;this.currentMapId='eldoria';this.lastProcessedEvents=null;setSnapshot(null);if(pendingLoadResponse){pendingLoadResponse(null);pendingLoadResponse=null;}}
  isActive():boolean{return isAuthoritative()&&this.authed&&getSnapshot()!==null;}
  uploadSave(_player:any,_inventory:any[]){if(!this.isActive())return;net.send({kind:'save',payload:{}});}
  requestServerSave():Promise<PlayerSave|null>{return new Promise(resolve=>{pendingLoadResponse=resolve;net.send({kind:'load_request',payload:{}});setTimeout(()=>{if(pendingLoadResponse){pendingLoadResponse(null);pendingLoadResponse=null;}},3000);});}
  handleLoadResponse(save:PlayerSave|null){if(pendingLoadResponse){pendingLoadResponse(save);pendingLoadResponse=null;}}
  sendMove(dx:number,dy:number){if(!this.isActive())return;sendIntent({type:'move',payload:{dx,dy}});}
  sendAttack(monsterId:string){if(!this.isActive())return;sendIntent({type:'attack',payload:{monsterId}});}
  sendCast(spellIndex:number,targetId?:string){if(!this.isActive())return;sendIntent({type:'cast',payload:{spellIndex,...(targetId?{targetId}:{})}});}
  sendUseItem(itemId:string){if(!this.isActive())return;sendIntent({type:'use_item',payload:{itemId}});}
  sendEquip(itemId:string){if(!this.isActive())return;sendIntent({type:'equip',payload:{itemId}});}
  sendUnequip(slot:string){if(!this.isActive())return;sendIntent({type:'unequip',payload:{slot}});}
  sendPickup(groundId:string){if(!this.isActive())return;sendIntent({type:'pickup',payload:{groundId}});}
  sendDrop(itemId:string){if(!this.isActive())return;sendIntent({type:'drop',payload:{itemId}});}
  sendMount(action='toggle',payload:Record<string,unknown>={}){if(!this.isActive())return;sendIntent({type:'mount',payload:{action,...payload}});}
  sendAppearance(action:string,payload:Record<string,unknown>={}){if(!this.isActive()||!action)return;sendIntent({type:'appearance',payload:{action,...payload}});}
  sendTask(action:string,payload:Record<string,unknown>={}){if(!this.isActive()||!action)return;sendIntent({type:'task',payload:{action,...payload}});}
  sendHousing(action:string,payload:Record<string,unknown>={}){if(!this.isActive()||!action)return;sendIntent({type:'housing',payload:{action,...payload}});}
  sendTravel(targetMap:string,_spawnX?:number,_spawnY?:number){if(!this.isActive())return;sendIntent({type:'travel',payload:{targetMap}});}
  sendQuestAccept(questId:string){if(!this.isActive())return;sendIntent({type:'quest_accept',payload:{questId}});}
  sendQuestComplete(questId:string){if(!this.isActive())return;sendIntent({type:'quest_complete',payload:{questId}});}
  sendTalent(talentId:string){if(!this.isActive())return;sendIntent({type:'talent',payload:{talentId}});}
  sendTalentReset(){if(!this.isActive())return;sendIntent({type:'talent_reset',payload:{}});}
  sendAdventureStart(contractId:string){if(!this.isActive())return;sendIntent({type:'adventure_start',payload:{contractId}});}
  sendAdventureAbandon(){if(!this.isActive())return;sendIntent({type:'adventure_abandon',payload:{}});}
  sendAdventureClaim(){if(!this.isActive())return;sendIntent({type:'adventure_claim',payload:{}});}
  sendOfficial(action:string,payload:Record<string,unknown>={}){if(!this.isActive()||!action)return;sendIntent({type:'official',payload:{action,...payload}});}
  sendSocial(action:string,payload:Record<string,unknown>={}){if(!this.isActive()||!action)return;sendIntent({type:'social',payload:{action,...payload}});}
  sendInteraction(targetEntityId:string,kind:string){if(!this.isActive()||!targetEntityId||!kind)return false;sendIntent({type:'interaction',payload:{targetEntityId,kind}});return true;}
  updateSnapshot(snap:ServerSnapshot){this.authed=true;setSnapshot(snap);this.currentMapId=snap.player.mapId;}
  getRenderState():RenderState|null{const snap=getSnapshot();if(!snap)return null;return{player:snap.player,nearbyPlayers:snap.nearbyPlayers,monsters:snap.monsters,groundItems:snap.groundItems,events:snap.events||[],official:snap.official||null,social:snap.social||null};}
  processEvents(addFloatingText:(text:string,pos:{x:number;y:number},color:string,big?:boolean)=>void,addMessage:(sender:string,text:string,color:string,channel:any)=>void,onFeedback?:(event:any)=>void):string[]{const state=this.getRenderState();if(!state)return[];if(this.lastProcessedEvents===state.events)return[];this.lastProcessedEvents=state.events;const notices:string[]=[];for(const event of state.events){onFeedback?.(event);if(event?.type==='message'&&event.text){addMessage('Servidor',event.text,event.color||'#f4d28b','system');notices.push(event.text);}if(event?.type==='floating_text'&&event.text&&event.position)addFloatingText(event.text,event.position,event.color||'#fff',Boolean(event.big));}return notices;}
  getMapId(){return this.currentMapId;}
}
export const serverSync=new ServerSyncManager();
