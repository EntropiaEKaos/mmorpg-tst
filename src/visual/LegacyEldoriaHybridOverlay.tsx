import { useEffect, useRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import * as THREE from 'three';

export interface LegacyEldoriaVisualEntity {
  id: string;
  kind: 'player' | 'npc' | 'monster';
  x: number;
  y: number;
  name?: string;
  vocation?: string;
  hostile?: boolean;
}

/** Visual-only state resolved by the legacy game. No gameplay authority lives here. */
export interface LegacyEldoriaVisualState {
  width: number;
  height: number;
  daylight: number;
  raining: boolean;
  lightning: boolean;
  entities?: LegacyEldoriaVisualEntity[];
}

function drawCartoonEntity(g: Graphics, entity: LegacyEldoriaVisualEntity, t: number) {
  g.clear();
  const bob = Math.sin(t * 0.004 + entity.x * 0.07) * 1.5;
  const player = entity.kind === 'player';
  const monster = entity.kind === 'monster';
  const body = player ? 0x3b82f6 : monster ? 0xb73b52 : 0xd7a53b;
  const trim = player ? 0x9bd7ff : monster ? 0xff8798 : 0xffe19a;
  const skin = monster ? 0x73505a : 0xe8b98f;

  // Soft ground shadow, bold silhouette and exaggerated proportions create the new cartoon read.
  g.ellipse(0, 17, monster ? 15 : 12, 5).fill({ color: 0x05070b, alpha: 0.42 });
  g.roundRect(-10, -4 + bob, 20, 24, 7).fill({ color: 0x111827 }).stroke({ width: 3, color: 0x080b12, alpha: 0.95 });
  g.roundRect(-7, -2 + bob, 14, 18, 5).fill({ color: body }).stroke({ width: 2, color: trim, alpha: 0.9 });
  g.circle(0, -12 + bob, monster ? 9 : 8).fill({ color: skin }).stroke({ width: 3, color: 0x080b12 });
  g.circle(-3, -13 + bob, 1.3).fill({ color: 0xffffff });
  g.circle(3, -13 + bob, 1.3).fill({ color: 0xffffff });

  if (player) {
    // Distinct heroic mantle + weapon silhouette. Presentation only.
    g.moveTo(-9, 1 + bob).lineTo(-15, 12 + bob).lineTo(-8, 9 + bob).fill({ color: 0x17345f });
    g.moveTo(9, 2 + bob).lineTo(15, -7 + bob).stroke({ width: 3, color: 0xd8e6f2 });
    g.circle(15, -8 + bob, 2).fill({ color: 0x7dd3fc });
  } else if (monster) {
    g.moveTo(-7, -18 + bob).lineTo(-12, -25 + bob).lineTo(-2, -20 + bob).fill({ color: 0x9b3147 });
    g.moveTo(7, -18 + bob).lineTo(12, -25 + bob).lineTo(2, -20 + bob).fill({ color: 0x9b3147 });
  } else {
    g.roundRect(-11, 2 + bob, 5, 13, 2).fill({ color: 0x5b3a22 });
  }
}

export default function LegacyEldoriaHybridOverlay({ state }: { state: LegacyEldoriaVisualState }) {
  const threeHostRef = useRef<HTMLDivElement>(null);
  const pixiHostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const threeHost = threeHostRef.current;
    const pixiHost = pixiHostRef.current;
    if (!threeHost || !pixiHost) return;

    let disposed = false;
    let frame = 0;
    let pixiApp: Application | null = null;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(state.width, state.height, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    threeHost.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = { uNight: { value: 0 }, uLightning: { value: 0 }, uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms,
      vertexShader: 'void main(){gl_Position=vec4(position,1.0);}',
      fragmentShader: `uniform float uNight; uniform float uLightning; uniform float uTime; void main(){ vec3 nightTint=vec3(0.035,0.075,0.18); float vignette=smoothstep(1.15,.25,length(gl_FragCoord.xy/vec2(${Math.max(1, state.width)}.0,${Math.max(1, state.height)}.0)-.5)); float alpha=uNight*(0.34+(1.0-vignette)*0.16); vec3 color=mix(nightTint,vec3(.82,.91,1.0),uLightning); gl_FragColor=vec4(color,clamp(alpha+uLightning*.20,0.0,.62)); }`,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const startPixi = async () => {
      const app = new Application();
      await app.init({ width: state.width, height: state.height, backgroundAlpha: 0, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 1.5), autoDensity: true });
      if (disposed) { app.destroy(true); return; }
      pixiApp = app;
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.pointerEvents = 'none';
      pixiHost.appendChild(app.canvas);

      const entityLayer = new Container();
      const weather = new Container();
      app.stage.addChild(entityLayer);
      app.stage.addChild(weather);
      const entityGraphics = new Map<string, Graphics>();
      const drops = Array.from({ length: 72 }, (_, i) => {
        const drop = new Graphics().moveTo(0, 0).lineTo(-5, 14).stroke({ width: 1.2, color: 0xc7e5ff, alpha: 0.48 });
        drop.x = (i * 83) % state.width; drop.y = (i * 47) % state.height; weather.addChild(drop); return drop;
      });

      app.ticker.add((ticker) => {
        const live = stateRef.current;
        const now = performance.now();
        const seen = new Set<string>();
        for (const entity of live.entities || []) {
          seen.add(entity.id);
          let g = entityGraphics.get(entity.id);
          if (!g) { g = new Graphics(); entityGraphics.set(entity.id, g); entityLayer.addChild(g); }
          g.x = entity.x; g.y = entity.y; g.visible = entity.x > -40 && entity.y > -50 && entity.x < live.width + 40 && entity.y < live.height + 50;
          drawCartoonEntity(g, entity, now);
        }
        for (const [id, g] of entityGraphics) if (!seen.has(id)) { entityLayer.removeChild(g); g.destroy(); entityGraphics.delete(id); }
        weather.visible = live.raining;
        if (live.raining) for (const drop of drops) { drop.y += 12 * ticker.deltaTime; drop.x -= 2.5 * ticker.deltaTime; if (drop.y > live.height + 20) drop.y = -20; if (drop.x < -20) drop.x = live.width + 20; }
      });
    };
    void startPixi();

    const animate = (now: number) => { if (disposed) return; const live = stateRef.current; uniforms.uNight.value = Math.max(0, Math.min(1, 1 - live.daylight)); uniforms.uLightning.value = live.lightning ? 1 : 0; uniforms.uTime.value = now / 1000; renderer.render(scene, camera); frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);

    return () => { disposed = true; cancelAnimationFrame(frame); pixiApp?.destroy(true, { children: true }); material.dispose(); renderer.dispose(); renderer.domElement.remove(); threeHost.replaceChildren(); pixiHost.replaceChildren(); };
  }, [state.height, state.width]);

  return <div data-legacy-eldoria-hybrid="true" aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><div ref={threeHostRef} data-three-atmosphere-layer="active" className="absolute inset-0" /><div ref={pixiHostRef} data-pixi-entity-layer="active" className="absolute inset-0" /></div>;
}
