import { useEffect, useRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import * as THREE from 'three';

export interface LegacyEldoriaVisualEntity { id:string; kind:'player'|'npc'|'monster'; x:number; y:number; name?:string; vocation?:string; hostile?:boolean }
export interface LegacyEldoriaVisualState { width:number; height:number; daylight:number; raining:boolean; lightning:boolean; entities?:LegacyEldoriaVisualEntity[] }

function drawCartoonEntity(g:Graphics,e:LegacyEldoriaVisualEntity,t:number){
  g.clear(); const bob=Math.sin(t*.004+e.x*.07)*1.7, player=e.kind==='player', monster=e.kind==='monster';
  const body=player?0x397de5:monster?0xa8324d:0xd79a35, trim=player?0xa8e5ff:monster?0xff8395:0xffe5a8, skin=monster?0x65434d:0xf0bf94;
  g.ellipse(0,18,monster?16:13,5).fill({color:0x05070b,alpha:.38});
  if(player){ g.circle(0,-2+bob,17).fill({color:0x5cc8ff,alpha:.08}); g.circle(0,-2+bob,14).stroke({width:1.5,color:0x83dcff,alpha:.24}); }
  g.roundRect(-10,-4+bob,20,24,7).fill({color:0x111827}).stroke({width:3,color:0x080b12,alpha:.96});
  g.roundRect(-7,-2+bob,14,18,5).fill({color:body}).stroke({width:2,color:trim,alpha:.92});
  g.circle(0,-12+bob,monster?9:8).fill({color:skin}).stroke({width:3,color:0x080b12});
  g.circle(-3,-13+bob,1.3).fill({color:0xffffff}); g.circle(3,-13+bob,1.3).fill({color:0xffffff});
  if(player){ g.moveTo(-9,1+bob).lineTo(-16,13+bob).lineTo(-8,9+bob).fill({color:0x17345f}); g.moveTo(9,2+bob).lineTo(16,-8+bob).stroke({width:3,color:0xe5f4ff}); g.circle(16,-9+bob,2.5).fill({color:0x7dd3fc}); }
  else if(monster){ g.moveTo(-7,-18+bob).lineTo(-12,-25+bob).lineTo(-2,-20+bob).fill({color:0x9b3147}); g.moveTo(7,-18+bob).lineTo(12,-25+bob).lineTo(2,-20+bob).fill({color:0x9b3147}); }
  else { g.roundRect(-11,2+bob,5,13,2).fill({color:0x5b3a22}); }
}

export default function LegacyEldoriaHybridOverlay({state}:{state:LegacyEldoriaVisualState}){
 const threeHostRef=useRef<HTMLDivElement>(null),pixiHostRef=useRef<HTMLDivElement>(null),stateRef=useRef(state); stateRef.current=state;
 useEffect(()=>{ const threeHost=threeHostRef.current,pixiHost=pixiHostRef.current;if(!threeHost||!pixiHost)return;let disposed=false,frame=0,pixiApp:Application|null=null;
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(state.width,state.height,false);Object.assign(renderer.domElement.style,{width:'100%',height:'100%',pointerEvents:'none'});threeHost.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),uniforms={uNight:{value:0},uLightning:{value:0},uTime:{value:0},uRain:{value:0}};
  const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms,vertexShader:'void main(){gl_Position=vec4(position,1.0);}',fragmentShader:`uniform float uNight;uniform float uLightning;uniform float uTime;uniform float uRain;void main(){vec2 uv=gl_FragCoord.xy/vec2(${Math.max(1,state.width)}.0,${Math.max(1,state.height)}.0);float d=distance(uv,vec2(.5));float vignette=smoothstep(.24,.79,d);float pulse=.5+.5*sin(uTime*.22);float horizon=smoothstep(.92,.12,uv.y);vec3 dusk=mix(vec3(.025,.055,.15),vec3(.08,.13,.26),pulse*.12);vec3 rainTint=vec3(.035,.075,.11)*uRain;vec3 color=mix(dusk+rainTint,vec3(.84,.93,1.),uLightning);float alpha=uNight*(.25+vignette*.2)+horizon*.035+uRain*.025;gl_FragColor=vec4(color,clamp(alpha+uLightning*.22,0.,.64));}`});scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
  const startPixi=async()=>{const app=new Application();await app.init({width:state.width,height:state.height,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio||1,1.5),autoDensity:true});if(disposed){app.destroy(true);return}pixiApp=app;Object.assign(app.canvas.style,{width:'100%',height:'100%',pointerEvents:'none'});pixiHost.appendChild(app.canvas);
   const ambience=new Container(),entities=new Container(),weather=new Container(),foreground=new Container();app.stage.addChild(ambience,entities,weather,foreground);
   const motes=Array.from({length:36},(_,i)=>{const m=new Graphics().circle(0,0,1+(i%3)*.45).fill({color:i%5?0xffe5a3:0x9be7ff,alpha:.22});m.x=(i*137)%state.width;m.y=(i*71)%state.height;ambience.addChild(m);return m});
   const fireflies=Array.from({length:12},(_,i)=>{const f=new Graphics().circle(0,0,2).fill({color:0xffd76a,alpha:.34});f.x=(i*211+53)%state.width;f.y=state.height*.35+((i*97)%Math.max(1,state.height*.55));ambience.addChild(f);return f});
   const entityGraphics=new Map<string,Graphics>();const drops=Array.from({length:82},(_,i)=>{const d=new Graphics().moveTo(0,0).lineTo(-5,14).stroke({width:1.2,color:0xc7e5ff,alpha:.48});d.x=(i*83)%state.width;d.y=(i*47)%state.height;weather.addChild(d);return d});
   const mistBands=Array.from({length:3},(_,i)=>{const m=new Graphics().ellipse(0,0,state.width*.38,22+i*8).fill({color:0xd8ecff,alpha:.025});m.x=state.width*(.18+i*.31);m.y=state.height*(.67+i*.09);foreground.addChild(m);return m});
   const topGlow=new Graphics().rect(0,0,state.width,4).fill({color:0xffd37a,alpha:.08});foreground.addChild(topGlow);
   app.ticker.add(ticker=>{const live=stateRef.current,now=performance.now(),seen=new Set<string>();ambience.alpha=.3+live.daylight*.5;for(let i=0;i<motes.length;i++){const m=motes[i];m.y-=.08*ticker.deltaTime;m.x+=Math.sin(now*.00035+i)*.06*ticker.deltaTime;if(m.y<0)m.y=live.height+4}
    for(let i=0;i<fireflies.length;i++){const f=fireflies[i],phase=now*.0012+i*1.7;f.x+=Math.sin(phase)*.16*ticker.deltaTime;f.y+=Math.cos(phase*.73)*.09*ticker.deltaTime;f.alpha=(.12+.28*(.5+.5*Math.sin(phase*1.9)))*(1-live.daylight*.55)}
    for(const e of live.entities||[]){seen.add(e.id);let g=entityGraphics.get(e.id);if(!g){g=new Graphics();entityGraphics.set(e.id,g);entities.addChild(g)}g.x=e.x;g.y=e.y;g.visible=e.x>-40&&e.y>-50&&e.x<live.width+40&&e.y<live.height+50;drawCartoonEntity(g,e,now)}for(const[id,g]of entityGraphics)if(!seen.has(id)){entities.removeChild(g);g.destroy();entityGraphics.delete(id)}weather.visible=live.raining;if(live.raining)for(const d of drops){d.y+=12*ticker.deltaTime;d.x-=2.5*ticker.deltaTime;if(d.y>live.height+20)d.y=-20;if(d.x<-20)d.x=live.width+20}for(let i=0;i<mistBands.length;i++){const m=mistBands[i];m.x+=Math.sin(now*.00012+i)*.08*ticker.deltaTime;m.alpha=(live.raining?.045:.018)+(1-live.daylight)*.018}topGlow.alpha=.035+live.daylight*.055;});};void startPixi();
  const animate=(now:number)=>{if(disposed)return;const live=stateRef.current;uniforms.uNight.value=Math.max(0,Math.min(1,1-live.daylight));uniforms.uLightning.value=live.lightning?1:0;uniforms.uRain.value=live.raining?1:0;uniforms.uTime.value=now/1000;renderer.render(scene,camera);frame=requestAnimationFrame(animate)};frame=requestAnimationFrame(animate);
  return()=>{disposed=true;cancelAnimationFrame(frame);pixiApp?.destroy(true,{children:true});material.dispose();renderer.dispose();renderer.domElement.remove();threeHost.replaceChildren();pixiHost.replaceChildren()};},[state.height,state.width]);
 return <div data-legacy-eldoria-hybrid="true" aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><div ref={threeHostRef} data-three-atmosphere-layer="active" className="absolute inset-0"/><div ref={pixiHostRef} data-pixi-entity-layer="active" className="absolute inset-0"/></div>;
}
