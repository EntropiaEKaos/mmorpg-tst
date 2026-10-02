import type { IsoCombatCue, IsoSceneNode } from './sceneModel';

export type CombatJuiceSample = {
  shakeX: number;
  shakeY: number;
  zoomKick: number;
  hitStopMs: number;
  flash: number;
  trail: number;
};

/** Presentation-only feedback. Never mutates authoritative combat state or simulation time. */
export function sampleCombatJuice(node: Readonly<IsoSceneNode>): CombatJuiceSample {
  const cue: IsoCombatCue = node.combatCue ?? 'none';
  const p = Math.max(0, Math.min(1, node.combatPhase ?? 0));
  const envelope = Math.sin(p * Math.PI);
  if (cue === 'attack') return { shakeX: envelope * 1.4, shakeY: envelope * .7, zoomKick: envelope * .006, hitStopMs: 0, flash: .08 * envelope, trail: .9 * envelope };
  if (cue === 'hit') return { shakeX: Math.sin(p * Math.PI * 8) * 3.8 * (1-p), shakeY: Math.cos(p * Math.PI * 7) * 2.6 * (1-p), zoomKick: envelope * .012, hitStopMs: p < .18 ? 42 : 0, flash: .72 * (1-p), trail: .2 };
  if (cue === 'cast') return { shakeX: 0, shakeY: Math.sin(p*Math.PI*2) * .6, zoomKick: envelope * .008, hitStopMs: 0, flash: .18 * envelope, trail: .35 * envelope };
  if (cue === 'windup') return { shakeX: 0, shakeY: 0, zoomKick: -p * .004, hitStopMs: 0, flash: .05*p, trail: .12*p };
  return { shakeX: 0, shakeY: 0, zoomKick: 0, hitStopMs: 0, flash: 0, trail: 0 };
}

export function aggregateCombatJuice(nodes: readonly IsoSceneNode[]): CombatJuiceSample {
  return nodes.reduce<CombatJuiceSample>((out,node)=>{
    const s=sampleCombatJuice(node);
    return { shakeX:out.shakeX+s.shakeX, shakeY:out.shakeY+s.shakeY, zoomKick:Math.max(out.zoomKick,s.zoomKick), hitStopMs:Math.max(out.hitStopMs,s.hitStopMs), flash:Math.max(out.flash,s.flash), trail:Math.max(out.trail,s.trail) };
  },{shakeX:0,shakeY:0,zoomKick:0,hitStopMs:0,flash:0,trail:0});
}
