import { Application, Container, Graphics } from 'pixi.js';
import type { IsoCameraState } from './camera';
import { ISO_LAYER_ORDER, type IsoSceneFrame, type IsoSceneNode } from './sceneModel';
import type { IsoRenderer, IsoViewport } from './rendererContract';

const TILE_W = 96;
const TILE_H = 48;

export class PixiIsoRenderer implements IsoRenderer {
  private app: Application | null = null;
  private world = new Container();
  private layers = new Map<string, Container>();
  private camera: IsoCameraState = { x: 0, y: 0, zoom: 1 };

  async mount(host: HTMLElement): Promise<void> {
    const app = new Application();
    await app.init({ resizeTo: host, antialias: true, background: '#10151d', preference: 'webgl' });
    host.replaceChildren(app.canvas);
    this.app = app;
    app.stage.addChild(this.world);
    for (const layerName of ISO_LAYER_ORDER) {
      const layer = new Container();
      layer.label = `iso-${layerName}`;
      this.layers.set(layerName, layer);
      this.world.addChild(layer);
    }
    this.applyCamera();
  }

  resize(viewport: IsoViewport): void {
    this.app?.renderer.resize(viewport.width, viewport.height);
    this.applyCamera();
  }

  setCamera(camera: Readonly<IsoCameraState>): void {
    this.camera = { ...camera };
    this.applyCamera();
  }

  render(frame: Readonly<IsoSceneFrame>): void {
    for (const layerName of ISO_LAYER_ORDER) {
      const layer = this.layers.get(layerName);
      if (!layer) continue;
      layer.removeChildren().forEach((child) => child.destroy());
      if (layerName === 'terrain') this.drawGround(layer);
      for (const node of frame[layerName]) layer.addChild(this.drawNode(node));
    }
  }

  destroy(): void {
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.layers.clear();
  }

  private applyCamera(): void {
    if (!this.app) return;
    this.world.scale.set(this.camera.zoom);
    this.world.position.set(
      this.app.renderer.width / 2 - this.camera.x * this.camera.zoom,
      this.app.renderer.height / 2 - this.camera.y * this.camera.zoom,
    );
  }

  private drawGround(layer: Container): void {
    for (let x = 0; x < 18; x += 1) {
      for (let y = 0; y < 18; y += 1) {
        const sx = (x - y) * TILE_W / 2;
        const sy = (x + y) * TILE_H / 2;
        const tile = new Graphics()
          .poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0])
          .fill((x + y) % 2 === 0 ? 0x395c43 : 0x42694b)
          .stroke({ width: 1, color: 0x294433, alpha: 0.45 });
        tile.position.set(sx, sy);
        layer.addChild(tile);
      }
    }
  }

  private drawNode(node: IsoSceneNode): Graphics {
    const g = new Graphics();
    if (node.layer === 'entities') {
      const isHero = node.visualId === 'hero-v1';
      g.ellipse(0, 12, isHero ? 24 : 20, 9).fill({ color: 0x000000, alpha: 0.28 });
      g.circle(0, -12, isHero ? 14 : 11).fill(isHero ? 0xe4b968 : 0x9aa8b8);
      g.roundRect(isHero ? -13 : -10, 0, isHero ? 26 : 20, isHero ? 34 : 27, 7)
        .fill(isHero ? 0x345e87 : 0x5b6875);
      if (isHero) {
        g.poly([-18, 4, -8, -5, -6, 22, -20, 17]).fill(0x8f2638);
        g.rect(12, 1, 4, 30).fill(0xd9d1b5);
      }
    } else {
      g.circle(0, 0, 8).fill(0xc79b4a);
    }
    g.position.set(node.x, node.y);
    g.alpha = node.opacity ?? 1;
    return g;
  }
}
