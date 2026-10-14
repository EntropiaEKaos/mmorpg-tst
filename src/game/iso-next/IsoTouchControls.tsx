import { useEffect, useRef, useState } from 'react';

type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

const BUTTONS: ReadonlyArray<Readonly<{code:Direction; label:string; sign:string; row:number; column:number}>> = [
  { code:'ArrowUp', label:'Mover para cima', sign:'▲', row:1, column:2 },
  { code:'ArrowLeft', label:'Mover para esquerda', sign:'◀', row:2, column:1 },
  { code:'ArrowRight', label:'Mover para direita', sign:'▶', row:2, column:3 },
  { code:'ArrowDown', label:'Mover para baixo', sign:'▼', row:3, column:2 },
];

/** Input-only on-screen D-pad. Uses the exact same movement dispatcher as keyboard
 * and never predicts position or decides collision on the client. */
export function IsoTouchControls({onInteract}:{onInteract:()=>void}) {
  const held = useRef(new Set<Direction>());
  const [active, setActive] = useState<Direction | null>(null);
  const emit = (code:Direction, down:boolean) =>
    window.dispatchEvent(new CustomEvent('moria:iso-touch-move',{detail:{code,down}}));
  const release = (code:Direction) => {
    if (!held.current.delete(code)) return;
    emit(code,false);
    setActive(current=>current===code?null:current);
  };
  useEffect(()=>{
    const releaseAll=()=>{
      for(const code of held.current)emit(code,false);
      held.current.clear();
      setActive(null);
    };
    const visibility=()=>{if(document.hidden)releaseAll();};
    window.addEventListener('blur',releaseAll);
    document.addEventListener('visibilitychange',visibility);
    return ()=>{
      releaseAll();
      window.removeEventListener('blur',releaseAll);
      document.removeEventListener('visibilitychange',visibility);
    };
  },[]);
  if(window.innerWidth>=720)return null;
  const base:React.CSSProperties={
    width:44,height:44,borderRadius:12,
    border:'1px solid rgba(238,203,126,.45)',
    background:'rgba(9,17,22,.68)',color:'#f3dfaa',
    fontSize:20,fontWeight:800,touchAction:'none',
    userSelect:'none',WebkitUserSelect:'none',
    display:'grid',placeItems:'center',padding:0,
  };
  return <>
    <div data-testid="iso-touch-dpad" data-touch-active={active||'none'}
      aria-label="Controles de movimento por toque"
      style={{position:'absolute',left:12,bottom:225,zIndex:47,display:'grid',
        gridTemplateColumns:'repeat(3,44px)',gridTemplateRows:'repeat(3,44px)',
        gap:5,padding:5,borderRadius:18,touchAction:'none',pointerEvents:'auto',
        background:'rgba(6,12,17,.22)'}}>
      {BUTTONS.map(({code,label,sign,row,column})=>
        <button key={code} type="button" data-testid={`iso-touch-${code}`}
          aria-label={label} style={{...base,gridRow:row,gridColumn:column,
            background:active===code?'rgba(174,122,51,.91)':'rgba(9,17,22,.68)'}}
          onPointerDown={event=>{
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            if(!held.current.has(code)){held.current.add(code);emit(code,true);}
            setActive(code);
          }}
          onPointerUp={()=>release(code)}
          onPointerCancel={()=>release(code)}
          onLostPointerCapture={()=>release(code)}>
          {sign}
        </button>)}
    </div>
    <button type="button" data-testid="iso-touch-interact"
      aria-label="Interagir com personagem ou objeto próximo"
      onClick={onInteract}
      style={{position:'absolute',right:14,bottom:265,zIndex:47,
        width:59,height:59,borderRadius:'50%',touchAction:'manipulation',
        background:'rgba(49,35,20,.81)',border:'2px solid rgba(238,203,126,.7)',
        color:'#ffdeb0',fontSize:13,fontWeight:800,
        boxShadow:'0 6px 20px rgba(0,0,0,.35)'}}>
      E <span style={{display:'block',fontSize:8,fontWeight:600}}>INTERAGIR</span>
    </button>
  </>;
}
