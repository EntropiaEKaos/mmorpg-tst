import * as THREE from 'three';

/** Presentation-only Three.js layer. It never owns movement, collision or gameplay state. */
export class ThreeIsoAtmosphere {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1,1,1,-1,0.1,20);
  private raf = 0;
  private start = performance.now();
  mount(host: HTMLElement) {
    const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(host.clientWidth || 1280, host.clientHeight || 720, false);
    renderer.domElement.dataset.testid='iso-three-atmosphere';
    Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',mixBlendMode:'screen',opacity:'0.72'});
    host.appendChild(renderer.domElement); this.renderer=renderer; this.camera.position.z=5;
    const geometry=new THREE.PlaneGeometry(2,2);const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},vertexShader:'void main(){gl_Position=vec4(position,1.0);}',fragmentShader:`uniform float uTime;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 uv=gl_FragCoord.xy/vec2(1440.0,900.0);float mist=smoothstep(.25,.9,hash(floor(uv*vec2(18.,11.)+uTime*.035)));float horizon=smoothstep(.05,.7,1.-uv.y);vec3 moon=vec3(.22,.36,.48);gl_FragColor=vec4(moon,(mist*.055+horizon*.018));}`});this.scene.add(new THREE.Mesh(geometry,material));
    const animate=()=>{if(!this.renderer)return;material.uniforms.uTime.value=(performance.now()-this.start)/1000;renderer.render(this.scene,this.camera);this.raf=requestAnimationFrame(animate)};animate();
  }
  resize(width:number,height:number){this.renderer?.setSize(width,height,false)}
  destroy(){cancelAnimationFrame(this.raf);if(this.renderer){this.renderer.domElement.remove();this.renderer.dispose();this.renderer=null;}this.scene.clear();}
}
