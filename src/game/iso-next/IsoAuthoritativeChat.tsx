import { useMemo } from 'react';
import Chat, { type SendChannel } from '../../components/Chat';
import { broadcastChat } from '../network';
import { serverSync } from '../ServerSync';

export function IsoAuthoritativeChat({snapshot}:{snapshot:any}){
  const messages=useMemo(()=>{
    const raw=snapshot?.chat?.messages??snapshot?.messages??snapshot?.chatMessages??[];
    return Array.isArray(raw)?raw:[];
  },[snapshot?.chat?.messages,snapshot?.messages,snapshot?.chatMessages]);
  const social=snapshot?.social??snapshot?.player?.social??{};
  const playerName=String(snapshot?.player?.name??snapshot?.playerName??'Player');
  const send=(text:string,channel:SendChannel)=>{
    if(!text.trim())return;
    if(serverSync.isActive()){
      broadcastChat(playerName,text.trim(),'#ffffff',channel);
      return;
    }
    broadcastChat(playerName,text.trim(),'#ffffff','world');
  };
  return <Chat messages={messages} social={social} onSendMessage={send}/>;
}
