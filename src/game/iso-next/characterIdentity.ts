export type CharacterArchetype = 'player'|'merchant'|'banker'|'guard'|'mage'|'warrior'|'villager';
export type CharacterVisualProfile = {
  id:string; archetype:CharacterArchetype; body:'slender'|'average'|'broad'|'heavy';
  stance:'open'|'formal'|'alert'|'mystic'|'combat'|'relaxed';
  primary:number; secondary:number; accent:number; skin:number; hair:number;
  hairStyle:'long'|'short'|'braid'|'bald'|'hood'; accessory:'satchel'|'ledger'|'shield'|'staff'|'blade'|'none';
  shoulderScale:number; heightScale:number; signature:'coins'|'seal'|'crest'|'runes'|'steel'|'none';
};
const profiles:Record<string,CharacterVisualProfile>={
  maelis:{id:'maelis',archetype:'merchant',body:'slender',stance:'open',primary:0x873c56,secondary:0xd6b15e,accent:0xf1c86e,skin:0xc99673,hair:0x3b261e,hairStyle:'long',accessory:'satchel',shoulderScale:.92,heightScale:1.04,signature:'coins'},
  orwin:{id:'orwin',archetype:'banker',body:'average',stance:'formal',primary:0x35566b,secondary:0x8fc8d9,accent:0xd9eef0,skin:0xb98c6d,hair:0x77716a,hairStyle:'short',accessory:'ledger',shoulderScale:1,heightScale:.98,signature:'seal'},
  guard:{id:'guard',archetype:'guard',body:'broad',stance:'alert',primary:0x5d4b3b,secondary:0xb99b65,accent:0xe0a85e,skin:0xb98968,hair:0x392b22,hairStyle:'short',accessory:'shield',shoulderScale:1.22,heightScale:1.06,signature:'crest'},
  mage:{id:'mage',archetype:'mage',body:'slender',stance:'mystic',primary:0x543c76,secondary:0xb992ff,accent:0x79d7d2,skin:0xc89a78,hair:0x29263a,hairStyle:'hood',accessory:'staff',shoulderScale:.88,heightScale:1.08,signature:'runes'},
  warrior:{id:'warrior',archetype:'warrior',body:'broad',stance:'combat',primary:0x704638,secondary:0xb37a4b,accent:0xd7c784,skin:0xb98464,hair:0x422a20,hairStyle:'braid',accessory:'blade',shoulderScale:1.28,heightScale:1.02,signature:'steel'},
  player:{id:'player',archetype:'player',body:'average',stance:'combat',primary:0x3e6b58,secondary:0x75c9bc,accent:0xd6b45d,skin:0xc79572,hair:0x30241e,hairStyle:'short',accessory:'blade',shoulderScale:1.06,heightScale:1.05,signature:'crest'},
  villager:{id:'villager',archetype:'villager',body:'average',stance:'relaxed',primary:0x536b52,secondary:0x8b6242,accent:0xc9a873,skin:0xc79a78,hair:0x554035,hairStyle:'short',accessory:'none',shoulderScale:.98,heightScale:.96,signature:'none'}
};
export function characterVisualProfile(id?:string,kind?:string):CharacterVisualProfile{
 const key=(id??'').toLowerCase(); if(key.includes('maelis'))return profiles.maelis;if(key.includes('orwin'))return profiles.orwin;
 const k=(kind??key).toLowerCase();if(k.includes('guard'))return profiles.guard;if(k.includes('mage')||k.includes('arcane'))return profiles.mage;if(k.includes('warrior'))return profiles.warrior;if(k.includes('player'))return profiles.player;return profiles.villager;
}
export const CHARACTER_IDENTITY_LINEUP=['player','maelis','orwin','guard','mage','warrior'] as const;
