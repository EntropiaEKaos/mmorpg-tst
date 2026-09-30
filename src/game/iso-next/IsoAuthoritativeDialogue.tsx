import DialogBox from '../../components/DialogBox';
import { serverSync } from '../ServerSync';

export function IsoAuthoritativeDialogue({snapshot}:{snapshot:any}){
  const interaction=snapshot?.interaction??snapshot?.activeInteraction??null;
  const npc=interaction?.npc??snapshot?.dialogue?.npc??snapshot?.activeNpc??null;
  if(!npc)return null;
  const rawPlayer=snapshot?.player;
  if(!rawPlayer)return null;
  // Authoritative economy/interaction snapshots are intentionally partial. Legacy
  // dialogue assumes these collections always exist, so normalize the adapter
  // boundary instead of weakening DialogBox or the browser gate.
  const player={
    ...rawPlayer,
    activeQuests:Array.isArray(rawPlayer.activeQuests)?rawPlayer.activeQuests:[],
    quests:Array.isArray(rawPlayer.quests)?rawPlayer.quests:[],
  };
  const questCatalog=Array.isArray(snapshot?.quests)
    ? snapshot.quests
    : Array.isArray(snapshot?.questCatalog)
      ? snapshot.questCatalog
      : undefined;
  const close=()=>{
    const targetId=String(npc.id??interaction?.targetId??'');
    if(targetId&&serverSync.isActive())serverSync.sendInteraction(targetId,'close');
  };
  const action=(kind:string,questId?:string)=>{
    if(kind==='bye'||kind==='close'){close();return;}
    if((kind==='accept'||kind==='quest_accept')&&questId){serverSync.sendQuestAccept(questId);return;}
    if((kind==='complete'||kind==='quest_complete'||kind==='turnin')&&questId){serverSync.sendQuestComplete(questId);return;}
    const targetId=String(npc.id??interaction?.targetId??'');
    if(targetId&&serverSync.isActive())serverSync.sendInteraction(targetId,kind);
  };
  return <DialogBox npc={npc} player={player} questCatalog={questCatalog} onAction={action} onClose={close}/>;
}
