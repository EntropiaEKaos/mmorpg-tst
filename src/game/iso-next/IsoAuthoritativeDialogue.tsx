import DialogBox from '../../components/DialogBox';
import { serverSync } from '../ServerSync';

export function IsoAuthoritativeDialogue({snapshot}:{snapshot:any}){
  const interaction=snapshot?.interaction??snapshot?.activeInteraction??null;
  const npc=interaction?.npc??snapshot?.dialogue?.npc??snapshot?.activeNpc??null;
  if(!npc)return null;
  const player=snapshot?.player;
  if(!player)return null;
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
  return <DialogBox npc={npc} player={player} questCatalog={snapshot?.quests??snapshot?.questCatalog} onAction={action} onClose={close}/>;
}
