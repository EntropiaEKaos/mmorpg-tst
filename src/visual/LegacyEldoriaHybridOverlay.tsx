import { useEffect, useRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import * as THREE from 'three';

/** Visual-only state resolved by the legacy game. No gameplay authority lives here. */
export interface LegacyEldoriaVisualState {
  width: number;
  height: number;
  daylight: number;
  raining: boolean;
  lightning: boolean;
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

    // THREE: transparent atmospheric grade. It never owns world/camera coordinates.
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(state.width, state.height, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    threeHost.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uNight: { value: 0 },
      uLightning: { value: 0 },
      uTime: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms,
      vertexShader: 'void main(){gl_Position=vec4(position,1.0);}',
      fragmentShader: `
        uniform float uNight;
        uniform float uLightning;
        uniform float uTime;
        void main(){
          vec3 nightTint = vec3(0.035, 0.075, 0.18);
          float vignette = smoothstep(1.15, .25, length(gl_FragCoord.xy / vec2(${Math.max(1, state.width)}.0, ${Math.max(1, state.height)}.0) - .5));
          float alpha = uNight * (0.34 + (1.0-vignette)*0.16);
          vec3 color = mix(nightTint, vec3(.82,.91,1.0), uLightning);
          gl_FragColor = vec4(color, clamp(alpha + uLightning*.20, 0.0, .62));
        }
      `,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    // PIXI: high-frequency 2D FX and the future character/NPC presentation layer.
    const startPixi = async () => {
      const app = new Application();
      await app.init({
        width: state.width,
        height: state.height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 1.5),
        autoDensity: true,
      });
      if (disposed) {
        app.destroy(true);
        return;
      }
      pixiApp = app;
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.pointerEvents = 'none';
      pixiHost.appendChild(app.canvas);

      const weather = new Container();
      app.stage.addChild(weather);
      const drops = Array.from({ length: 72 }, (_, i) => {
        const drop = new Graphics().moveTo(0, 0).lineTo(-5, 14).stroke({ width: 1.2, color: 0xc7e5ff, alpha: 0.48 });
        drop.x = (i * 83) % state.width;
        drop.y = (i * 47) % state.height;
        weather.addChild(drop);
        return drop;
      });

      // A small visual marker proves the entity layer is live without replacing legacy authority.
      const entityFx = new Graphics().circle(0, 0, 18).stroke({ width: 2, color: 0xffd36a, alpha: 0.32 });
      entityFx.visible = false;
      app.stage.addChild(entityFx);

      app.ticker.add((ticker) => {
        const live = stateRef.current;
        weather.visible = live.raining;
        if (live.raining) {
          for (const drop of drops) {
            drop.y += 12 * ticker.deltaTime;
            drop.x -= 2.5 * ticker.deltaTime;
            if (drop.y > live.height + 20) drop.y = -20;
            if (drop.x < -20) drop.x = live.width + 20;
          }
        }
      });
    };
    void startPixi();

    const animate = (now: number) => {
      if (disposed) return;
      const live = stateRef.current;
      uniforms.uNight.value = Math.max(0, Math.min(1, 1 - live.daylight));
      uniforms.uLightning.value = live.lightning ? 1 : 0;
      uniforms.uTime.value = now / 1000;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      pixiApp?.destroy(true, { children: true });
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      threeHost.replaceChildren();
      pixiHost.replaceChildren();
    };
  }, [state.height, state.width]);

  return (
    <div data-legacy-eldoria-hybrid="true" aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div ref={threeHostRef} data-three-atmosphere-layer="active" className="absolute inset-0" />
      <div ref={pixiHostRef} data-pixi-entity-layer="active" className="absolute inset-0" />
    </div>
  );
}
