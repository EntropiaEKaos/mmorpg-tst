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
    Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',mixBlendMode:'screen',opacity:'0.76'});
    host.appendChild(canvas);
    host.dataset.threeMount='canvas-attached';
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      const width=host.clientWidth || 1280,height=host.clientHeight || 720;
      renderer.setSize(width,height,false);
      this.renderer=renderer;
      canvas.dataset.rendererState='active';
      host.dataset.threeMount='renderer-active';
      this.camera.position.z=5;
      const geometry=new THREE.PlaneGeometry(2,2);
      const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,uniforms:{uTime:{value:0},uResolution:{value:new THREE.Vector2(width,height)}},vertexShader:'void main(){gl_Position=vec4(position,1.0);}',fragmentShader:`
uniform float uTime;
uniform vec2 uResolution;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/max(uResolution,vec2(1.));
 float t=uTime*.035;
 float mist=fbm(uv*vec2(5.8,3.2)+vec2(t,-t*.42));
 float fine=fbm(uv*vec2(14.,8.)+vec2(-t*.6,t*.25));
 float ground=smoothstep(.2,.95,1.-uv.y);
 float horizon=exp(-pow((uv.y-.47)*5.2,2.));
 float vignette=smoothstep(.95,.25,length(uv-.5));
 float fireflies=step(.992,hash(floor((uv+vec2(t*.08,0.))*vec2(72.,42.))))*smoothstep(.18,.78,uv.y)*vignette;
 vec3 moon=vec3(.18,.34,.48);
 vec3 eldoria=vec3(.18,.42,.31);
 vec3 gold=vec3(.78,.61,.25);
 vec3 color=mix(moon,eldoria,smoothstep(.38,.75,mist));
 float alpha=(mist*.052+fine*.026)*ground+horizon*.022;
 color+=gold*fireflies*.7;
 alpha+=fireflies*.22;
 gl_FragColor=vec4(color,alpha*vignette);
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

  destroy(){
    cancelAnimationFrame(this.raf);
    this.material?.dispose();this.material=null;
    if(this.renderer){this.renderer.dispose();this.renderer=null;}
    this.canvas?.remove();
    this.canvas=null;
    this.scene.clear();
  }
}
