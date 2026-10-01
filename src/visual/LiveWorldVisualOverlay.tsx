import type { MutableRefObject } from 'react';
import type { Monster, NPC, Player } from '../game/types';
import LegacyEldoriaHybridOverlay from './LegacyEldoriaHybridOverlay';
import { buildLiveVisualState, type LiveServerPlayer, type VisualCamera } from './liveEntityVisuals';

type Props={
  playerRef:MutableRefObject<Player>;monstersRef:MutableRefObject<Monster[]>;npcsRef:MutableRefObject<NPC[]>;
  serverPlayersRef:MutableRefObject<LiveServerPlayer[]>;cameraRef:MutableRefObject<VisualCamera>;
  mapRef:MutableRefObject<string>;mapId:string;tileSize:number;width:number;height:number;daylight:number;weather:string;
};

export default function LiveWorldVisualOverlay(p:Props){
  const state=()=>buildLiveVisualState({player:p.playerRef.current,monsters:p.monstersRef.current,npcs:p.npcsRef.current,serverPlayers:p.serverPlayersRef.current,camera:p.cameraRef.current,tileSize:p.tileSize,width:p.width,height:p.height,daylight:p.daylight,weather:p.weather,visualProfile:p.mapRef.current});
  return <LegacyEldoriaHybridOverlay state={{...state(),visualProfile:p.mapId}} getState={state}/>;
}
