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
    await app.init({ resizeTo: host, antialias: true, background: '#0b1117', preference: 'webgl' });
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
      if (layerName === 'structures') this.drawEldoriaStructures(layer);
      if (layerName === 'foreground') this.drawForeground(layer);
      if (layerName === 'lighting') this.drawLighting(layer);
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

  private iso(x: number, y: number) {
    return { x: (x - y) * TILE_W / 2, y: (x + y) * TILE_H / 2 };
  }

  private drawGround(layer: Container): void {
    for (let x = 0; x < 18; x += 1) {
      for (let y = 0; y < 18; y += 1) {
        const p = this.iso(x, y);
        const plaza = x >= 6 && x <= 11 && y >= 6 && y <= 11;
        const road = Math.abs(x - y) <= 1 || Math.abs((x + y) - 17) <= 1;
        const water = x >= 14 && y <= 5;
        const fill = water ? 0x245268 : plaza ? 0x6d6658 : road ? 0x75644f : ((x + y) % 2 ? 0x355b3e : 0x3e6846);
        const tile = new Graphics()
          .poly([0, -TILE_H / 2, TILE_W / 2, 0, 0, TILE_H / 2, -TILE_W / 2, 0])
          .fill(fill)
          .stroke({ width: 1, color: water ? 0x3b7890 : 0x263c2d, alpha: 0.42 });
        if (water) tile.poly([-28, 0, -8, -8, 18, -2, 32, -8]).stroke({ width: 2, color: 0x73afbd, alpha: 0.32 });
        tile.position.set(p.x, p.y);
        layer.addChild(tile);
      }
    }
  }

  private drawEldoriaStructures(layer: Container): void {
    const buildings = [
      { x: 4, y: 8, w: 104, h: 78, roof: 0x7d3340 },
      { x: 8, y: 4, w: 120, h: 92, roof: 0x4b506d },
      { x: 12, y: 8, w: 112, h: 84, roof: 0x75472f },
      { x: 8, y: 13, w: 136, h: 96, roof: 0x51334f },
    ];
    for (const b of buildings) {
      const p = this.iso(b.x, b.y);
      const g = new Graphics();
      g.ellipse(0, 20, b.w * .48, 18).fill({ color: 0x000000, alpha: .22 });
      g.poly([-b.w / 2, -8, 0, 18, 0, b.h - 22, -b.w / 2, b.h - 48]).fill(0x554b42);
      g.poly([b.w / 2, -8, 0, 18, 0, b.h - 22, b.w / 2, b.h - 48]).fill(0x403b39);
      g.poly([-b.w / 2 - 12, -12, 0, -48, b.w / 2 + 12, -12, 0, 25]).fill(b.roof).stroke({ width: 3, color: 0x241f25 });
      g.roundRect(-9, b.h - 54, 18, 30, 4).fill(0x211b1a);
      g.rect(-b.w / 2 + 15, 15, 13, 16).fill(0xe3ad55);
      g.rect(b.w / 2 - 28, 15, 13, 16).fill(0xe3ad55);
      g.position.set(p.x, p.y - b.h + 38);
      layer.addChild(g);
    }
    const fountain = this.iso(8, 8);
    const fg = new Graphics().ellipse(0, 7, 48, 22).fill(0x555e63).ellipse(0, 2, 36, 14).fill(0x2f7187).rect(-5, -38, 10, 42).fill(0x68737a).circle(0, -42, 9).fill(0x87939a);
    fg.position.set(fountain.x, fountain.y);
    layer.addChild(fg);
  }

  private drawForeground(layer: Container): void {
    for (const [x, y, scale] of [[3, 5, 1], [5, 13, 1.15], [12, 4, 1.1], [14, 12, 1.25]] as const) {
      const p = this.iso(x, y);
      const tree = new Graphics();
      tree.ellipse(0, 12, 28 * scale, 10 * scale).fill({ color: 0x000000, alpha: .2 });
      tree.rect(-5 * scale, -32 * scale, 10 * scale, 45 * scale).fill(0x4b3425);
      tree.circle(-14 * scale, -44 * scale, 24 * scale).fill(0x254a31);
      tree.circle(13 * scale, -49 * scale, 28 * scale).fill(0x315e3a);
      tree.circle(0, -68 * scale, 25 * scale).fill(0x3c7043);
      tree.position.set(p.x, p.y);
      layer.addChild(tree);
    }
  }

  private drawLighting(layer: Container): void {
    for (const [x, y] of [[6, 7], [9, 6], [10, 10], [7, 11]] as const) {
      const p = this.iso(x, y);
      const light = new Graphics().circle(0, 0, 42).fill({ color: 0xf4b85a, alpha: .055 }).circle(0, 0, 13).fill({ color: 0xffd37a, alpha: .14 }).circle(0, 0, 3).fill(0xffdf8e);
      light.position.set(p.x, p.y - 24);
      layer.addChild(light);
    }
  }

  private drawNode(node: IsoSceneNode): Graphics {
    const g = new Graphics();
    if (node.layer === 'entities') {
      const hero = node.visualId === 'hero-v1';
      const wolf = node.visualId === 'shadow-wolf';
      if (wolf) {
        g.ellipse(0, 10, 25, 8).fill({ color: 0x000000, alpha: .3 });
        g.ellipse(0, -2, 25, 14).fill(0x303541).poly([12, -8, 27, -19, 22, -2]).fill(0x303541).circle(18, -9, 2).fill(0xd84a55);
      } else {
        g.ellipse(0, 16, hero ? 27 : 21, 9).fill({ color: 0x000000, alpha: .3 });
        g.circle(0, -22, hero ? 15 : 12).fill(hero ? 0xd9a46e : 0xa7a7a2);
        g.poly(hero ? [-16, -9, 16, -9, 13, 28, -13, 28] : [-12, -7, 12, -7, 10, 24, -10, 24]).fill(hero ? 0x294d72 : 0x596774);
        if (hero) {
          g.poly([-21, -6, -9, -15, -8, 28, -24, 19]).fill(0xa12f3e);
          g.poly([-13, -12, 0, -20, 13, -12, 8, -3, -8, -3]).fill(0xb9c3c9);
          g.rect(14, -6, 5, 39).fill(0xd9d2bb).poly([12, -10, 21, -10, 16, -25]).fill(0xd9d2bb);
          g.circle(0, 3, 5).fill(0xd3a949);
        }
      }
    } else {
      g.circle(0, 0, 8).fill(0xc79b4a);
    }
    g.position.set(node.x, node.y);
    g.alpha = node.opacity ?? 1;
    return g;
  }
}
