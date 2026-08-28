import type { DamageSchool } from './types';
export type ReactionHint={when:string;name:string;multiplier?:number;result:string};
export const REACTION_HINTS:Record<string,ReactionHint[]>=Object.freeze({
 physical:[{when:'Frozen',name:'Shatter',multiplier:1.50,result:'Consumes Frozen + heavy stagger'},{when:'Fractured',name:'Fracture Exploit',multiplier:1.20,result:'Ignores 25% target defense'}],
 fire:[{when:'Wet',name:'Steam Burst',multiplier:1.20,result:'Consumes Wet; target briefly vulnerable'},{when:'Frozen',name:'Thermal Shock',multiplier:1.35,result:'Consumes Frozen'},{when:'Otherwise',name:'Burn',result:'Applies Burn'}],
 water:[{when:'Burning',name:'Steam Burst',multiplier:1.22,result:'Extinguishes Burn + applies Wet'},{when:'Otherwise',name:'Wet',result:'Primes Lightning and Ice'}],
 lightning:[{when:'Wet',name:'Conductive Burst',multiplier:1.40,result:'Consumes Wet + brief stun'},{when:'Otherwise',name:'Shocked',result:'Applies Shocked'}],
 ice:[{when:'Wet',name:'Flash Freeze',multiplier:1.25,result:'Consumes Wet + Frozen/stun'},{when:'Chilled',name:'Deep Freeze',multiplier:1.15,result:'Converts Chilled to Frozen'},{when:'Otherwise',name:'Chilled',result:'Applies Chilled'}],
 earth:[{when:'Shocked',name:'Grounded',multiplier:1.20,result:'Consumes Shocked'},{when:'Otherwise',name:'Fractured',result:'Primes Physical damage'}],
 arcane:[{when:'Unstable',name:'Arcane Detonation',multiplier:1.30,result:'Consumes Unstable'},{when:'Otherwise',name:'Unstable',result:'Next non-Arcane school catalyzes ×1.18'}],
 death:[{when:'Cursed',name:'Soul Rend',multiplier:1.20,result:'Refreshes Cursed'},{when:'Otherwise',name:'Cursed',result:'Primes Holy/Shadow interactions'}],
 holy:[{when:'Cursed',name:'Purify',multiplier:1.40,result:'Consumes Cursed'},{when:'Death-aligned',name:'Exorcism',multiplier:1.25,result:'Bonus vs Death-school monsters'}],
 nature:[{when:'Poisoned',name:'Toxic Bloom',multiplier:1.25,result:'Amplifies poisoned target'},{when:'Otherwise',name:'Rooted',result:'Applies Root + Slow'}],
 poison:[{when:'Rooted',name:'Venom Bloom',multiplier:1.25,result:'Amplifies rooted target'},{when:'Otherwise',name:'Poison',result:'Applies Poison'}],
 shadow:[{when:'Cursed',name:'Eclipse',multiplier:1.25,result:'Amplifies cursed target'},{when:'Otherwise',name:'Cursed',result:'Applies Cursed'}],
 magic:[{when:'Any',name:'Pure Magic',result:'No intrinsic state; keeps generic magic scaling'}],
});
export function reactionHintsForSchool(school:DamageSchool|string){return REACTION_HINTS[String(school)]||REACTION_HINTS.magic}
