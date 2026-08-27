export interface ClassVisualIdentity {
  role: string;
  signature: string;
  primary: string;
  accent: string;
  combatStyle: 'bulwark' | 'marksman' | 'arcane' | 'nature' | 'shadow' | 'assassin' | 'divine' | 'death' | 'martial' | 'predator' | 'blood' | 'storm';
  particleBias: number;
}

export const CLASS_VISUAL_IDENTITIES: Record<string, ClassVisualIdentity> = {
  knight: { role: 'Vanguard Tank', signature: 'Iron Bulwark', primary: '#c13030', accent: '#f2a1a1', combatStyle: 'bulwark', particleBias: 2 },
  paladin: { role: 'Holy Marksman', signature: 'Dawnshot', primary: '#d6c84f', accent: '#fff4a8', combatStyle: 'marksman', particleBias: 3 },
  sorcerer: { role: 'Burst Caster', signature: 'Arcane Cataclysm', primary: '#9b59ff', accent: '#e1c4ff', combatStyle: 'arcane', particleBias: 6 },
  druid: { role: 'Nature Healer', signature: 'Lifebloom', primary: '#2ecc71', accent: '#a8f0c3', combatStyle: 'nature', particleBias: 4 },
  warlock: { role: 'Drain Caster', signature: 'Soul Covenant', primary: '#8b1a8b', accent: '#e28de2', combatStyle: 'shadow', particleBias: 5 },
  rogue: { role: 'Assassin', signature: 'Nightblade', primary: '#777777', accent: '#d9d9d9', combatStyle: 'assassin', particleBias: 2 },
  priest: { role: 'Divine Support', signature: 'Beacon of Grace', primary: '#f4e04d', accent: '#fffbd0', combatStyle: 'divine', particleBias: 5 },
  deathknight: { role: 'Drain Tank', signature: 'Dreadguard', primary: '#6b1717', accent: '#d06b6b', combatStyle: 'death', particleBias: 4 },
  monk: { role: 'Tempo Fighter', signature: 'Flow State', primary: '#e6a817', accent: '#ffe49a', combatStyle: 'martial', particleBias: 3 },
  ranger: { role: 'Predator Marksman', signature: 'Hunter’s Mark', primary: '#1a6b3a', accent: '#8de0aa', combatStyle: 'predator', particleBias: 3 },
  necromancer: { role: 'Death Caster', signature: 'Grave Harvest', primary: '#2a6a4a', accent: '#8ed0ad', combatStyle: 'death', particleBias: 5 },
  berserker: { role: 'Blood Bruiser', signature: 'Bloodfury', primary: '#a02020', accent: '#ff8d8d', combatStyle: 'blood', particleBias: 4 },
  shaman: { role: 'Elemental Support', signature: 'Stormweaver', primary: '#008b8b', accent: '#86e4e4', combatStyle: 'storm', particleBias: 5 },
  templar: { role: 'Holy Tank', signature: 'Sunward Aegis', primary: '#d4af37', accent: '#fff0a6', combatStyle: 'divine', particleBias: 4 },
};

export function getClassVisualIdentity(vocation?: string): ClassVisualIdentity {
  return CLASS_VISUAL_IDENTITIES[String(vocation || '').toLowerCase()] || CLASS_VISUAL_IDENTITIES.knight;
}
