import type { IsoAssetAnimation, IsoAssetDirection } from './assetPipeline';

export type EuphoriaArtProfile = {
  silhouette: { head: number; torso: number; shoulder: number; leg: number; weaponReach: number };
  palette: { armor: number; cloth: number; accent: number; skin: number; hair: number; magic: number };
  secondaryMotion: { cape: number; hair: number; weapon: number };
};

export const EUPHORIA_ART_PROFILE: Readonly<EuphoriaArtProfile> = {
  silhouette: { head: 16, torso: 38, shoulder: 34, leg: 31, weaponReach: 46 },
  palette: { armor: 0xc7d2da, cloth: 0x28527d, accent: 0xb8344b, skin: 0xdca66f, hair: 0x332821, magic: 0x78dfff },
  secondaryMotion: { cape: .78, hair: .42, weapon: .2 },
};

export type EuphoriaPoseSample = { lean: number; lift: number; cape: number; hair: number; weaponArc: number; squash: number; glow: number };

/** Presentation-only pose sampling used equally by procedural fallback and future atlas validation. */
export function sampleEuphoriaPose(animation: IsoAssetAnimation, phase: number, direction: Exclude<IsoAssetDirection, 'omni'>): EuphoriaPoseSample {
  const p = Math.max(0, Math.min(1, phase));
  const side = direction === 'nw' || direction === 'sw' ? -1 : 1;
  const cycle = Math.sin(p * Math.PI * 2);
  switch (animation) {
    case 'walk': return { lean: cycle * 1.8 * side, lift: Math.abs(cycle) * 2.2, cape: -cycle * 5.5, hair: -cycle * 2.4, weaponArc: cycle * 3, squash: 1 - Math.abs(cycle) * .025, glow: .15 };
    case 'windup': return { lean: -6 * p * side, lift: 0, cape: 5 * p * side, hair: 2 * p * side, weaponArc: -18 * p * side, squash: 1 + p * .025, glow: .2 + p * .35 };
    case 'attack': return { lean: 9 * Math.sin(p * Math.PI) * side, lift: -2 * Math.sin(p * Math.PI), cape: -9 * Math.sin(p * Math.PI) * side, hair: -4 * Math.sin(p * Math.PI) * side, weaponArc: 74 * p * side, squash: 1 - Math.sin(p * Math.PI) * .045, glow: .35 };
    case 'hit': return { lean: -7 * (1-p) * side, lift: -2 * (1-p), cape: 7 * (1-p) * side, hair: 4 * (1-p) * side, weaponArc: -5 * (1-p) * side, squash: .94 + p * .06, glow: .08 };
    case 'cast': return { lean: 0, lift: -Math.sin(p*Math.PI)*3, cape: Math.sin(p*Math.PI*2)*2, hair: Math.sin(p*Math.PI*2)*1.5, weaponArc: -12*p*side, squash: 1, glow: .35 + Math.sin(p*Math.PI)*.65 };
    case 'death': return { lean: 18*p*side, lift: 5*p, cape: -4*p*side, hair: -3*p*side, weaponArc: 25*p*side, squash: 1-.22*p, glow: .1*(1-p) };
    default: return { lean: Math.sin(p*Math.PI*2)*.5, lift: Math.sin(p*Math.PI*2)*.8, cape: Math.sin(p*Math.PI*2)*1.5, hair: Math.sin(p*Math.PI*2)*.8, weaponArc: 0, squash: 1, glow: .18 };
  }
}

export function euphoriaDirectionMirror(direction: Exclude<IsoAssetDirection, 'omni'>): boolean {
  return direction === 'nw' || direction === 'sw';
}
