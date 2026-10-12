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
  private renderScale = 1;
  private lastPaint = 0;
  private renderedFrames = 0;
  private mobileProfile = false;
  private biome = 'plains';
  private biomeActive = false;
  private readonly biomeColors:Record<string,{color:number,mist:number}>={
    plains:{color:0x6da47a,mist:.7},snow:{color:0xaecfe3,mist:.77},
    swamp:{color:0x5c8063,mist:1.25},desert:{color:0xd59b6e,mist:.52},
    shadow:{color:0x62568e,mist:1.12},
  };
  /** The map/biome is server-authored; this tint is purely visual. */
  setBiome(biome:string,authoritative=false):void{
    this.biome=this.biomeColors[biome]?biome:'plains';
    this.biomeActive=authoritative;
    if(this.canvas){this.canvas.dataset.biome=this.biome;this.canvas.dataset.worldAtmosphere=authoritative?'server-biome':'fixture';}
    if(this.material){
      const data=this.biomeColors[this.biome];
      (this.material.uniforms.uBiomeTint.value as THREE.Color).setHex(data.color);
      this.material.uniforms.uMistStrength.value=data.mist;
      this.material.uniforms.uWorldActive.value=authoritative?1:0;
    }
  }


  mount(host: HTMLElement) {
    host.dataset.threeMount='starting';
    const canvas=document.createElement('canvas');
    this.canvas=canvas;
    this.mobileProfile=host.clientWidth<720;
    this.renderScale=this.mobileProfile?.65:1;
    canvas.dataset.shaderProfile=this.mobileProfile?'mobile-lite':'desktop-full';
    canvas.dataset.renderScale=String(this.renderScale);
    canvas.dataset.testid='iso-three-atmosphere';
    canvas.dataset.rendererState='mounting';
    canvas.setAttribute('aria-label','Three.js atmospheric presentation layer');
    // Pixi owns z=0. Three deliberately composites above it at z=1; React HUD remains outside this host.
    Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'1',pointerEvents:'none',mixBlendMode:'screen',opacity:'0.82'});
    host.appendChild(canvas);
    host.dataset.threeMount='canvas-attached';
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance',premultipliedAlpha:true });
      renderer.setPixelRatio(this.mobileProfile?1:Math.min(window.devicePixelRatio||1,1.25));
      renderer.setClearColor(0x000000,0);
      renderer.autoClear=true;
      const width=host.clientWidth || 1280,height=host.clientHeight || 720;
      renderer.setSize(Math.max(1,Math.round(width*this.renderScale)),Math.max(1,Math.round(height*this.renderScale)),false);
      this.renderer=renderer;
      canvas.dataset.rendererState='active';
      canvas.dataset.composite='pixi-under-three';
      host.dataset.threeMount='renderer-active';
      this.camera.position.z=5;
      const geometry=new THREE.PlaneGeometry(2,2);
      const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:THREE.NormalBlending,uniforms:{uTime:{value:0},uResolution:{value:new THREE.Vector2(Math.max(1,Math.round(width*this.renderScale)),Math.max(1,Math.round(height*this.renderScale)))},uBiomeTint:{value:new THREE.Color(0x6da47a)},uWorldActive:{value:0},uMistStrength:{value:.7},uMobileQuality:{value:this.mobileProfile?1:0}},vertexShader:'void main(){gl_Position=vec4(position,1.0);}',fragmentShader:`
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uBiomeTint;
uniform float uWorldActive;
uniform float uMistStrength;
uniform float uMobileQuality;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){if(uMobileQuality>.5&&i>=3)break;v+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return v;}
float orb(vec2 uv,vec2 center,float radius){return 1.-smoothstep(radius*.25,radius,length(uv-center));}
void main(){
 vec2 uv=gl_FragCoord.xy/max(uResolution,vec2(1.));
 float aspect=uResolution.x/max(uResolution.y,1.);
 vec2 suv=vec2((uv.x-.5)*aspect+.5,uv.y);
 float t=uTime*.035;
 float mist=fbm(uv*vec2(5.8,3.2)+vec2(t,-t*.42));
 float fine=uMobileQuality>.5?0.:fbm(uv*vec2(14.,8.)+vec2(-t*.6,t*.25));
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
 vec3 color=mix(moon,eldoria,smoothstep(.38,.75,mist));color=mix(color,uBiomeTint,uWorldActive*.80);
 float alpha=((mist*.052+fine*.026)*ground+horizon*.022)*uMistStrength;
 color+=gold*fireflies*.7;alpha+=fireflies*.22;
 float localGlow=1.-uWorldActive;
 color+=gold*(crownGlow*.13+shafts*.16)*localGlow;alpha+=(crownGlow*.022+shafts*.018)*localGlow;
 color+=wine*marketGlow*.055*localGlow;alpha+=marketGlow*.008*localGlow;
 color+=cyan*archiveGlow*.052*localGlow;alpha+=archiveGlow*.008*localGlow;
 color+=ember*guildGlow*.05*localGlow;alpha+=guildGlow*.007*localGlow;
 color+=(violet*arcaneGlow*.11+cyan*arcaneGlow*.035)*localGlow;alpha+=arcaneGlow*.018*localGlow;
 float edgeMist=uMobileQuality>.5?0.:fbm(vec2(uv.x*3.2+t*.2,uv.y*4.8-t*.12))*smoothstep(.58,.98,length(uv-.5)*1.25);
 color+=vec3(.13,.29,.23)*edgeMist*.12;alpha+=edgeMist*.022;
 gl_FragColor=vec4(color,clamp(alpha*vignette,0.,.42));
}`});
      this.material=material;
      this.setBiome(this.biome,this.biomeActive);
      this.scene.add(new THREE.Mesh(geometry,material));
      const animate=(now:number)=>{
        if(!this.renderer)return;
        const interval=this.mobileProfile?66:33;
        if(document.hidden){this.lastPaint=now;this.raf=requestAnimationFrame(animate);return;}
        if(now-this.lastPaint>=interval){
          material.uniforms.uTime.value=(now-this.start)/1000;
          renderer.render(this.scene,this.camera);
          this.lastPaint=now;
          canvas.dataset.renderedFrames=String(++this.renderedFrames);
        }
        this.raf=requestAnimationFrame(animate);
      };
      this.raf=requestAnimationFrame(animate);
    } catch (error) {
      canvas.dataset.rendererState='unavailable';
      host.dataset.threeMount='renderer-unavailable';
      host.dataset.threeError=error instanceof Error ? error.message.slice(0,180) : String(error).slice(0,180);
      console.warn('[ISO Next] Three.js atmosphere unavailable; Pixi gameplay presentation remains active.',error);
    }
  }

  resize(width:number,height:number){
    const w=Math.max(1,Math.round(width*this.renderScale)),h=Math.max(1,Math.round(height*this.renderScale));
    this.renderer?.setSize(w,h,false);
    this.material?.uniforms.uResolution.value.set(w,h);
  }

  destroy(){cancelAnimationFrame(this.raf);this.material?.dispose();this.material=null;if(this.renderer){this.renderer.dispose();this.renderer=null;}this.canvas?.remove();this.canvas=null;this.scene.clear();}
}
