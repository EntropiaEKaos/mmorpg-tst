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
    await app.init({ resizeTo: host, antialias: true, background: '#091017', preference: 'webgl' });
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
      if (layerName === 'fx') this.drawAtmosphere(layer);
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
    this.world.position.set(this.app.renderer.width / 2 - this.camera.x * this.camera.zoom, this.app.renderer.height / 2 - this.camera.y * this.camera.zoom);
  }

  private iso(x: number, y: number) { return { x: (x - y) * TILE_W / 2, y: (x + y) * TILE_H / 2 }; }

  private drawGround(layer: Container): void {
    for (let x = 0; x < 18; x += 1) for (let y = 0; y < 18; y += 1) {
      const p = this.iso(x, y); const plaza = x >= 6 && x <= 11 && y >= 6 && y <= 11; const road = Math.abs(x - y) <= 1 || Math.abs((x + y) - 17) <= 1; const water = x >= 14 && y <= 5; const edge = x === 0 || y === 0 || x === 17 || y === 17;
      const fill = water ? 0x1f536b : plaza ? 0x70685a : road ? 0x78654e : ((x + y) % 2 ? 0x315b3b : 0x3d6b44);
      const tile = new Graphics().poly([0,-TILE_H/2,TILE_W/2,0,0,TILE_H/2,-TILE_W/2,0]).fill(fill).stroke({ width: edge ? 2 : 1, color: water ? 0x4b8ca3 : 0x22382a, alpha: edge ? .7 : .38 });
      if (water) { tile.poly([-30,2,-10,-6,15,-1,32,-8]).stroke({ width:2,color:0x82c7d3,alpha:.4 }); tile.poly([-25,10,-3,4,22,9]).stroke({ width:1,color:0xb2e0df,alpha:.22 }); }
      else if (!plaza && !road && (x*3+y*5)%7===0) { tile.circle(-10,-2,2).fill({color:0x82a95d,alpha:.7}); tile.circle(7,5,1.5).fill({color:0xc9b55b,alpha:.6}); }
      tile.position.set(p.x,p.y); layer.addChild(tile);
    }
  }

  private drawEldoriaStructures(layer: Container): void {
    const buildings = [{x:4,y:8,w:104,h:78,roof:0x8d3442,trim:0xd7a35b},{x:8,y:4,w:120,h:92,roof:0x4b5278,trim:0xb7c4d2},{x:12,y:8,w:112,h:84,roof:0x815039,trim:0xe0b56c},{x:8,y:13,w:136,h:96,roof:0x5f365d,trim:0xd5a5c8}];
    for (const b of buildings) { const p=this.iso(b.x,b.y); const g=new Graphics(); g.ellipse(0,22,b.w*.52,20).fill({color:0x000000,alpha:.28}); g.poly([-b.w/2,-8,0,18,0,b.h-22,-b.w/2,b.h-48]).fill(0x655849); g.poly([b.w/2,-8,0,18,0,b.h-22,b.w/2,b.h-48]).fill(0x443d3b); g.poly([-b.w/2-16,-10,0,-54,b.w/2+16,-10,0,28]).fill(b.roof).stroke({width:4,color:0x241d25}); g.poly([-b.w/2-8,-9,0,-44,b.w/2+8,-9]).stroke({width:3,color:b.trim,alpha:.55}); g.roundRect(-10,b.h-56,20,32,5).fill(0x211918).stroke({width:2,color:b.trim,alpha:.5}); g.rect(-b.w/2+14,14,15,18).fill(0xf0b95c).stroke({width:2,color:0x3b2c24}); g.rect(b.w/2-29,14,15,18).fill(0xf0b95c).stroke({width:2,color:0x3b2c24}); g.position.set(p.x,p.y-b.h+38); layer.addChild(g); }
    const p=this.iso(8,8); const f=new Graphics().ellipse(0,9,52,24).fill(0x4c575d).ellipse(0,3,41,17).fill(0x2c7890).ellipse(0,1,32,11).fill({color:0x75c1cc,alpha:.5}).rect(-6,-39,12,44).fill(0x727e83).circle(0,-43,10).fill(0x9aa5a7).circle(0,-47,4).fill(0xc8e4df); f.position.set(p.x,p.y); layer.addChild(f);
  }

  private drawForeground(layer: Container): void {
    for (const [x,y,s] of [[3,5,1],[5,13,1.15],[12,4,1.1],[14,12,1.25],[2,11,.82],[15,8,.9]] as const) { const p=this.iso(x,y); const t=new Graphics(); t.ellipse(0,13,31*s,11*s).fill({color:0,alpha:.24}); t.poly([-6*s,12*s,-4*s,-37*s,7*s,-34*s,6*s,12*s]).fill(0x513624); t.circle(-17*s,-43*s,25*s).fill(0x244b31); t.circle(15*s,-49*s,29*s).fill(0x32653c); t.circle(0,-70*s,27*s).fill(0x43804a); t.circle(-8*s,-72*s,12*s).fill({color:0x78a957,alpha:.55}); t.position.set(p.x,p.y); layer.addChild(t); }
  }

  private drawLighting(layer: Container): void {
    for (const [x,y] of [[6,7],[9,6],[10,10],[7,11],[4,8],[12,8]] as const) { const p=this.iso(x,y); const l=new Graphics().circle(0,0,52).fill({color:0xf4a94f,alpha:.04}).circle(0,0,26).fill({color:0xffbd5d,alpha:.065}).circle(0,0,11).fill({color:0xffd47b,alpha:.16}).circle(0,0,3).fill(0xffe4a3); l.position.set(p.x,p.y-25); layer.addChild(l); }
  }

  private drawAtmosphere(layer: Container): void {
    for (const [x,y,lift] of [[5,6,-52],[7,8,-75],[9,5,-61],[11,9,-88],[6,12,-66],[13,7,-48],[3,10,-57]] as const) { const p=this.iso(x,y); const m=new Graphics().circle(0,0,5).fill({color:0xffd77d,alpha:.035}).circle(0,0,1.5).fill({color:0xffe5a8,alpha:.65}); m.position.set(p.x,p.y+lift); layer.addChild(m); }
  }

  private drawNode(node: IsoSceneNode): Graphics {
    const g=new Graphics();
    if (node.layer==='entities') {
      const hero=node.visualId==='hero-v1'; const wolf=node.visualId==='shadow-wolf';
      if (wolf) { g.ellipse(0,11,27,9).fill({color:0,alpha:.34}); g.ellipse(-2,-1,27,15).fill(0x303541); g.poly([12,-9,29,-20,23,-1]).fill(0x303541); g.poly([-12,-8,-21,-18,-6,-13]).fill(0x242936); g.circle(19,-10,2.3).fill(0xe14f5c); }
      else if (hero) this.drawEuphoria(g,node);
      else { g.ellipse(0,17,21,9).fill({color:0,alpha:.3}); g.circle(0,-22,12).fill(0xa7a7a2); g.poly([-12,-7,12,-7,10,24,-10,24]).fill(0x596774); }
    } else g.circle(0,0,8).fill(0xc79b4a);
    g.position.set(node.x,node.y); g.alpha=node.opacity??1; return g;
  }

  private drawEuphoria(g: Graphics, node: IsoSceneNode): void {
    const walking=node.motion==='walk'; const phase=(node.animationPhase??0)*Math.PI*2; const stride=walking?Math.sin(phase):0; const bob=walking?Math.abs(Math.sin(phase))*2:0; const faceLeft=node.facing==='nw'||node.facing==='sw'; const dir=faceLeft?-1:1;
    g.ellipse(0,18,30-(walking?Math.abs(stride)*3:0),10).fill({color:0,alpha:.34});
    if (walking) { g.circle(-10*dir+stride*5,16,3.5).fill({color:0xb8a37c,alpha:.24}); g.circle(-15*dir+stride*8,18,2).fill({color:0xd8c69d,alpha:.18}); }
    g.poly([-23*dir,-5-bob,-11*dir,-17-bob,-(10+stride*3)*dir,30-bob,-(27+stride*5)*dir,20-bob]).fill(0x9f2e40).stroke({width:2,color:0x4c1825});
    g.poly([-17*dir,-9-bob,0,-22-bob,17*dir,-9-bob,12*dir,2-bob,-12*dir,2-bob]).fill(0xc5d0d6).stroke({width:2,color:0x53606a});
    g.poly([-15*dir,-7-bob,15*dir,-7-bob,(13+stride*2)*dir,29-bob,(-13+stride*2)*dir,29-bob]).fill(0x28527d).stroke({width:2,color:0x162d48});
    g.poly([-13*dir,4-bob,13*dir,4-bob,9*dir,12-bob,-9*dir,12-bob]).fill(0x182c42);
    g.circle(0,-24-bob,16).fill(0xdca66f).stroke({width:2,color:0x684630});
    g.poly([-15*dir,-29-bob,-5*dir,-39-bob,9*dir,-36-bob,17*dir,-27-bob,9*dir,-30-bob,0,-27-bob]).fill(0x332821);
    g.circle(-5*dir,-24-bob,1.6).fill(0x24313b); g.circle(5*dir,-24-bob,1.6).fill(0x24313b);
    const swordX=(15+stride*2)*dir; g.rect(swordX,-5-bob,5*dir,39).fill(0xded8c4).stroke({width:1,color:0x6f6a61}); g.poly([12*dir,-10-bob,23*dir,-10-bob,17*dir,-28-bob]).fill(0xe8e3cf).stroke({width:1,color:0x6f6a61});
    g.circle(0,4-bob,6).fill(0xd9ad45).stroke({width:2,color:0x76551d}); g.circle(0,4-bob,2).fill(0xffdc6a);
  }
}
