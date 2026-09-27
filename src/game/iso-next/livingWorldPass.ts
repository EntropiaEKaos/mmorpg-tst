import { Container, Graphics } from 'pixi.js';

const TILE_W = 96;
const TILE_H = 48;
const iso = (x: number, y: number) => ({ x: (x - y) * TILE_W / 2, y: (x + y) * TILE_H / 2 });

export function drawEldoriaLivingWorld(layer: Container): void {
  const crates = [[5, 7], [11, 7], [9, 12]] as const;
  for (const [x, y] of crates) {
    const p = iso(x, y);
    const g = new Graphics()
      .ellipse(0, 8, 23, 7).fill({ color: 0x000000, alpha: .2 })
      .poly([-14, -2, 0, 5, 0, 21, -14, 13]).fill(0x765238)
      .poly([14, -2, 0, 5, 0, 21, 14, 13]).fill(0x513724)
      .poly([-14, -2, 0, -9, 14, -2, 0, 5]).fill(0x9a7048)
      .poly([-9, 0, 0, 4, 9, 0]).stroke({ width: 2, color: 0xc39a65, alpha: .7 });
    g.position.set(p.x, p.y - 12); layer.addChild(g);
  }

  const barrels = [[6, 10], [12, 9], [4, 9]] as const;
  for (const [x, y] of barrels) {
    const p = iso(x, y);
    const g = new Graphics()
      .ellipse(0, 10, 18, 6).fill({ color: 0x000000, alpha: .2 })
      .roundRect(-9, -14, 18, 27, 7).fill(0x6f4930).stroke({ width: 2, color: 0x35261f })
      .rect(-10, -8, 20, 3).fill(0x34373b).rect(-10, 5, 20, 3).fill(0x34373b)
      .ellipse(0, -13, 15, 5).fill(0x8b6242);
    g.position.set(p.x, p.y - 7); layer.addChild(g);
  }

  for (const [x, y] of [[5, 6], [11, 6], [5, 12], [11, 12]] as const) {
    const p = iso(x, y);
    const g = new Graphics()
      .rect(-3, -42, 6, 45).fill(0x3d3329)
      .poly([-9, -43, 0, -53, 9, -43, 6, -33, -6, -33]).fill(0x302b2b).stroke({ width: 2, color: 0x17191b })
      .circle(0, -42, 5).fill(0xffc85c)
      .circle(0, -42, 14).fill({ color: 0xffa83d, alpha: .08 });
    g.position.set(p.x, p.y); layer.addChild(g);
  }

  for (const [x, y] of [[3, 7], [13, 11], [6, 14], [14, 6]] as const) {
    const p = iso(x, y);
    const g = new Graphics()
      .circle(-7, 0, 7).fill(0x345f39).circle(6, -3, 9).fill(0x477947)
      .circle(0, -10, 8).fill(0x56894e)
      .circle(-4, -12, 2).fill(0xd7bd5c).circle(6, -7, 2).fill(0xb96d75);
    g.position.set(p.x, p.y); layer.addChild(g);
  }
}

export function drawArcanePulse(layer: Container): void {
  const p = iso(10, 8);
  const g = new Graphics()
    .circle(0, 0, 42).fill({ color: 0x5f62ff, alpha: .025 })
    .circle(0, 0, 27).stroke({ width: 3, color: 0x8c79ff, alpha: .18 })
    .circle(0, 0, 16).fill({ color: 0x785cff, alpha: .14 })
    .circle(0, 0, 8).fill({ color: 0xb7a7ff, alpha: .42 })
    .circle(0, 0, 3).fill(0xf0eaff)
    .poly([-45, 5, -25, -4, -8, 1]).stroke({ width: 3, color: 0x927dff, alpha: .35 })
    .poly([8, -1, 25, 5, 46, -7]).stroke({ width: 2, color: 0xc2b6ff, alpha: .28 });
  g.position.set(p.x, p.y - 55); layer.addChild(g);
}
