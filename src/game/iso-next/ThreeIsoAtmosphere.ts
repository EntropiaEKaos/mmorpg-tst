import * as THREE from 'three';

/** Presentation-only Three.js layer. It never owns movement, collision or gameplay state. */
export class ThreeIsoAtmosphere {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1,1,1,-1,0.1,20);
  private raf = 0;
  private start = typeof performance !== 'undefined' ? performance.now() : 0;
  private canvas: HTMLCanvasElement | null = null;
  private material: THREE.ShaderMaterial | null = null;

  mount(host: HTMLElement) {
    host.dataset.threeMount='starting';
    const canvas=document.createElement('canvas');
    this.canvas=canvas;
    canvas.dataset.testid='iso-three-atmosphere';
    canvas.dataset.rendererState='mounting';
    canvas.setAttribute('aria-label','Three.js atmospheric presentation layer');
    // Pixi owns z=0. Three deliberately composites above it at z=1; React HUD remains outside this host.
    Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'1',pointerEvents:'none',mixBlendMode:'screen',opacity:'0.82'});
    host.appendChild(canvas);
    host.dataset.threeMount='canvas-attached';
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance',premultipliedAlpha:true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000,0);
      renderer.autoClear=true;
      const width=host.clientWidth || 1280,height=host.clientHeight || 720;
      renderer.setSize(width,height,false);
      this.renderer=renderer;
      canvas.dataset.rendererState='active';
      canvas.dataset.composite='pixi-under-three';
      host.dataset.threeMount='renderer-active';
      this.camera.position.z=5;
      const geometry=new THREE.PlaneGeometry(2,2);
      const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:THREE.NormalBlending,uniforms:{uTime:{value:0},uResolution:{value:new THREE.Vector2(width,height)}},vertexShader:'void main(){gl_Position=vec4(position,1.0);}',fragmentShader:`
uniform float uTime;
uniform vec2 uResolution;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return v;}
float orb(vec2 uv,vec2 center,float radius){return 1.-smoothstep(radius*.25,radius,length(uv-center));}
void main(){
 vec2 uv=gl_FragCoord.xy/max(uResolution,vec2(1.));
 float aspect=uResolution.x/max(uResolution.y,1.);
 vec2 suv=vec2((uv.x-.5)*aspect+.5,uv.y);
 float t=uTime*.035;
 float mist=fbm(uv*vec2(5.8,3.2)+vec2(t,-t*.42));
 float fine=fbm(uv*vec2(14.,8.)+vec2(-t*.6,t*.25));
 float ground=smoothstep(.2,.95,1.-uv.y);
 float horizon=exp(-pow((uv.y-.47)*5.2,2.));
 float vignette=smoothstep(.95,.25,length(uv-.5));
 float fireflies=step(.992,hash(floor((uv+vec2(t*.08,0.))*vec2(72.,42.))))*smoothstep(.18,.78,uv.y)*vignette;
 float shafts=pow(max(0.,sin((uv.x*8.5+uv.y*2.2)+t*3.)),18.)*smoothstep(.18,.82,uv.y)*.18;
 float crownGlow=orb(suv,vec2(.5,.49),.19)*(0.55+0.45*sin(uTime*.55));
 float marketGlow=orb(suv,vec2(.29,.57),.12);
 float archiveGlow=orb(suv,vec2(.50,.33),.12);
 float guildGlow=orb(suv,vec2(.71,.56),.12);
 float arcaneGlow=orb(suv,vec2(.50,.72),.13)*(0.62+0.38*sin(uTime*.72));
 vec3 moon=vec3(.18,.34,.48),eldoria=vec3(.18,.42,.31),gold=vec3(.78,.61,.25),violet=vec3(.47,.29,.72),cyan=vec3(.25,.62,.68),ember=vec3(.73,.34,.20),wine=vec3(.55,.20,.34);
 vec3 color=mix(moon,eldoria,smoothstep(.38,.75,mist));
 float alpha=(mist*.052+fine*.026)*ground+horizon*.022;
 color+=gold*fireflies*.7;alpha+=fireflies*.22;
 color+=gold*(crownGlow*.13+shafts*.16);alpha+=crownGlow*.022+shafts*.018;
 color+=wine*marketGlow*.055;alpha+=marketGlow*.008;
 color+=cyan*archiveGlow*.052;alpha+=archiveGlow*.008;
 color+=ember*guildGlow*.05;alpha+=guildGlow*.007;
 color+=violet*arcaneGlow*.11+cyan*arcaneGlow*.035;alpha+=arcaneGlow*.018;
 float edgeMist=fbm(vec2(uv.x*3.2+t*.2,uv.y*4.8-t*.12))*smoothstep(.58,.98,length(uv-.5)*1.25);
 color+=vec3(.13,.29,.23)*edgeMist*.12;alpha+=edgeMist*.022;
 gl_FragColor=vec4(color,clamp(alpha*vignette,0.,.42));
}`});
      this.material=material;
      this.scene.add(new THREE.Mesh(geometry,material));
      const animate=()=>{if(!this.renderer)return;material.uniforms.uTime.value=(performance.now()-this.start)/1000;renderer.render(this.scene,this.camera);this.raf=requestAnimationFrame(animate)};
      animate();
    } catch (error) {
      canvas.dataset.rendererState='unavailable';
      host.dataset.threeMount='renderer-unavailable';
      host.dataset.threeError=error instanceof Error ? error.message.slice(0,180) : String(error).slice(0,180);
      console.warn('[ISO Next] Three.js atmosphere unavailable; Pixi gameplay presentation remains active.',error);
    }
  }

  resize(width:number,height:number){this.renderer?.setSize(width,height,false);this.material?.uniforms.uResolution.value.set(width,height)}

  destroy(){cancelAnimationFrame(this.raf);this.material?.dispose();this.material=null;if(this.renderer){this.renderer.dispose();this.renderer=null;}this.canvas?.remove();this.canvas=null;this.scene.clear();}
}
