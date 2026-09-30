import { Container, Graphics } from 'pixi.js';

const TILE_W = 96;
const TILE_H = 48;
const iso = (x: number, y: number) => ({ x: (x - y) * TILE_W / 2, y: (x + y) * TILE_H / 2 });

/** Presentation-only regional identity pass for Eldoria. */
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

  // Eldoria waystones: a repeatable regional silhouette that marks civic routes.
  for (const [x, y, rune] of [[5, 6, 0x72d9c1], [11, 6, 0x8fc8ff], [5, 12, 0xe0b65e], [11, 12, 0xb992ff]] as const) {
    const p = iso(x, y);
    const g = new Graphics()
      .ellipse(0, 5, 17, 6).fill({ color: 0x000000, alpha: .24 })
      .poly([-7, 0, -5, -40, 0, -49, 6, -39, 7, 0]).fill(0x4b514d).stroke({ width: 2, color: 0x272d2b })
      .poly([-4, -27, 0, -34, 4, -27, 0, -20]).fill({ color: rune, alpha: .36 }).stroke({ width: 2, color: rune, alpha: .82 })
      .circle(0, -27, 15).fill({ color: rune, alpha: .035 });
    g.position.set(p.x, p.y); layer.addChild(g);
  }

  // Market district signage makes the south-west route readable without HUD labels.
  for (const [x, y, flip] of [[4, 7, -1], [6, 9, 1], [10, 12, -1]] as const) {
    const p = iso(x, y), g = new Graphics();
    g.rect(-2, -35, 4, 38).fill(0x4b3527);
    g.moveTo(0, -31).lineTo(18 * flip, -38).stroke({ width: 3, color: 0x5c412c });
    g.poly([18 * flip, -45, 37 * flip, -39, 18 * flip, -31]).fill(0x7b3651).stroke({ width: 2, color: 0xd6b15e });
    g.circle(27 * flip, -38, 3).fill(0xf0cf72);
    g.position.set(p.x, p.y); layer.addChild(g);
  }

  // Old Grove border: roots and standing stones foreshadow the forest/boss route.
  for (const [x, y, scale] of [[3, 7, 1], [13, 11, 1.1], [6, 14, .9], [14, 6, 1.15]] as const) {
    const p = iso(x, y);
    const g = new Graphics()
      .ellipse(0, 4, 21 * scale, 7 * scale).fill({ color: 0x000000, alpha: .18 })
      .circle(-7 * scale, 0, 7 * scale).fill(0x345f39).circle(6 * scale, -3, 9 * scale).fill(0x477947)
      .circle(0, -10 * scale, 8 * scale).fill(0x56894e)
      .circle(-4 * scale, -12 * scale, 2).fill(0xd7bd5c).circle(6 * scale, -7 * scale, 2).fill(0xb96d75)
      .poly([-13 * scale, 5, -4 * scale, -7, 1 * scale, 5]).fill(0x5c4934);
    g.position.set(p.x, p.y); layer.addChild(g);
  }

  // Crown of Eldoria: central landmark around the fountain/plaza.
  const crown = iso(8, 8);
  const landmark = new Graphics()
    .ellipse(0, 20, 82, 29).stroke({ width: 3, color: 0xd6b45d, alpha: .28 })
    .ellipse(0, 18, 67, 23).stroke({ width: 2, color: 0x75c9bc, alpha: .25 })
    .poly([-45, 12, -31, -3, -21, 8, -7, -8, 0, 5, 8, -8, 22, 8, 32, -3, 46, 12]).stroke({ width: 3, color: 0xc9a853, alpha: .52 });
  for (const x of [-52, 52]) {
    landmark.rect(x - 4, -25, 8, 42).fill(0x4a504c).stroke({ width: 2, color: 0x252b29 });
    landmark.poly([x - 10, -25, x, -40, x + 10, -25]).fill(0x51685a).stroke({ width: 2, color: 0xd4b75f });
    landmark.circle(x, -24, 5).fill(0x78d5c4).circle(x, -24, 14).fill({ color: 0x78d5c4, alpha: .05 });
  }
  landmark.position.set(crown.x, crown.y - 4); layer.addChild(landmark);

  // Ancient broken arch: visual promise of Eldoria's older civilization.
  const ruin = iso(14, 10);
  const arch = new Graphics()
    .ellipse(0, 10, 40, 11).fill({ color: 0x000000, alpha: .2 })
    .rect(-31, -54, 12, 61).fill(0x515851).stroke({ width: 2, color: 0x2b302d })
    .rect(20, -41, 12, 48).fill(0x515851).stroke({ width: 2, color: 0x2b302d })
    .moveTo(-26, -51).quadraticCurveTo(0, -78, 27, -40).stroke({ width: 10, color: 0x596158 })
    .poly([-12, 3, 1, -4, 15, 4]).stroke({ width: 3, color: 0x78926a, alpha: .7 })
    .circle(-24, -37, 3).fill(0x7bc09b).circle(25, -27, 3).fill(0x7bc09b);
  arch.position.set(ruin.x, ruin.y); layer.addChild(arch);
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
