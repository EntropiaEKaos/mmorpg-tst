export type CityStyle =
  | 'royal'
  | 'harbor'
  | 'ironwood'
  | 'alpine'
  | 'marsh'
  | 'forge'
  | 'crystal'
  | 'storm'
  | 'void'
  | 'nightfall'
  | 'sanctum';

export type CityLandmarkKind = 'keep' | 'market' | 'temple' | 'depot' | 'gate' | 'forge' | 'dock' | 'arena' | 'obelisk' | 'library' | 'graveyard' | 'lodge' | 'tower' | 'house';
export type CityPropKind = 'banner' | 'lamp' | 'statue' | 'brazier' | 'crystal' | 'grave' | 'tent' | 'sign' | 'barrel' | 'cart' | 'pine' | 'mushroom' | 'anchor' | 'rune';

export interface CityDistrict {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface CityLandmark {
  id: string;
  name: string;
  kind: CityLandmarkKind;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CityProp {
  id: string;
  kind: CityPropKind;
  x: number;
  y: number;
  color?: string;
  label?: string;
}

export interface CityPalette {
  accent: string;
  roof: string;
  wall: string;
  road: string;
  district: string;
}

export interface CityIdentitySeed {
  id: string;
  name: string;
  style?: CityStyle;
  biome?: string;
  townCenter: { x: number; y: number };
  cityAccent?: string;
  roofColor?: string;
  wallColor?: string;
  roadColor?: string;
  districts?: CityDistrict[];
  landmarks?: CityLandmark[];
  props?: CityProp[];
}

export const CITY_STYLES: readonly CityStyle[] = Object.freeze([
  'royal', 'harbor', 'ironwood', 'alpine', 'marsh', 'forge', 'crystal', 'storm', 'void', 'nightfall', 'sanctum',
]);

export const CITY_STYLE_LABELS: Record<CityStyle, string> = {
  royal: 'Royal Capital', harbor: 'Harbor City', ironwood: 'Frontier Stronghold', alpine: 'Alpine Fortress',
  marsh: 'Marsh Settlement', forge: 'Forge Citadel', crystal: 'Crystal Enclave', storm: 'Storm Bastion',
  void: 'Void Necropolis', nightfall: 'Blacksteel Citadel', sanctum: 'Astral Sanctum',
};

export const CITY_PALETTES: Record<CityStyle, CityPalette> = {
  royal: { accent: '#d8b45a', roof: '#7e2f34', wall: '#c9b68d', road: '#9b8764', district: '#d7c49a' },
  harbor: { accent: '#55b9d8', roof: '#326177', wall: '#c2bda5', road: '#8f8068', district: '#78b7bd' },
  ironwood: { accent: '#b48b4a', roof: '#4a3324', wall: '#8f8066', road: '#755b42', district: '#65754a' },
  alpine: { accent: '#9dd8ff', roof: '#334b67', wall: '#cbd4d8', road: '#7f8c92', district: '#86a9ba' },
  marsh: { accent: '#8fb85a', roof: '#334229', wall: '#76755c', road: '#5f6048', district: '#557348' },
  forge: { accent: '#ff9b45', roof: '#7c3923', wall: '#aa7950', road: '#744a38', district: '#a65c31' },
  crystal: { accent: '#74e1ff', roof: '#443d72', wall: '#8582a5', road: '#56536e', district: '#5d7794' },
  storm: { accent: '#8ddcff', roof: '#405169', wall: '#aab4bf', road: '#657180', district: '#607d98' },
  void: { accent: '#a86dff', roof: '#21192d', wall: '#4c4259', road: '#342c42', district: '#4b3760' },
  nightfall: { accent: '#e85b75', roof: '#201b24', wall: '#55515b', road: '#39343d', district: '#5a3340' },
  sanctum: { accent: '#f5de8f', roof: '#d8d9e7', wall: '#d5d0c2', road: '#a79f8d', district: '#9fa9ca' },
};

const STYLE_BY_MAP: Record<string, CityStyle> = {
  eldoria: 'royal', sunreach_coast: 'harbor', ironwood: 'ironwood', frostpeak: 'alpine', shadowfen: 'marsh',
  emberhold: 'forge', crystal_deep: 'crystal', stormwatch_isle: 'storm', voidlands: 'void', nightfall_citadel: 'nightfall', gm_sanctum: 'sanctum',
};

const LANDMARK_NAMES: Record<CityStyle, Array<[string, CityLandmarkKind, string]>> = {
  royal: [['Sunspire Keep','keep','♜'],['Grand Market','market','⚖'],['Temple of Dawn','temple','✦'],['Royal Depot','depot','▣'],['Oath Fountain','tower','◈']],
  harbor: [['Tidewatch Hall','keep','⚓'],['Salt Market','market','⚖'],['Sea Chapel','temple','✦'],['Harbor Depot','depot','▣'],['Mariner Gate','dock','⚓']],
  ironwood: [['Marchwarden Hall','keep','♜'],['Timber Exchange','market','⚖'],['Grove Shrine','temple','✦'],['Ironwood Depot','depot','▣'],['East Palisade','gate','◆']],
  alpine: [['Frostguard Keep','keep','♜'],['Anvil Hall','forge','⚒'],['Ice Chapel','temple','✦'],['Expedition Depot','depot','▣'],['Northwatch Gate','gate','◆']],
  marsh: [['Mirewatch Hall','keep','♜'],['Lantern Market','market','⚖'],['Witch Shrine','temple','✦'],['Fen Depot','depot','▣'],['Ferryman Dock','dock','⚓']],
  forge: [['Ember Citadel','keep','♜'],['Great Foundry','forge','⚒'],['Ash Bazaar','market','⚖'],['Flame Shrine','temple','✦'],['Cinder Arena','arena','◎']],
  crystal: [['Prism Hall','keep','◆'],['Shard Exchange','market','⚖'],['Resonance Shrine','temple','✦'],['Deep Depot','depot','▣'],['Crystal Spire','obelisk','◇']],
  storm: [['Tempest Bastion','keep','♜'],['Gale Exchange','market','⚖'],['Storm Chapel','temple','✦'],['Fleet Depot','depot','▣'],['Thunderwatch','tower','⚡']],
  void: [['Black Obelisk','obelisk','◇'],['Bone Market','market','⚖'],['Silent Sanctum','temple','✦'],['Rift Depot','depot','▣'],['Necropolis Gate','graveyard','☠']],
  nightfall: [['Regent Keep','keep','♜'],['Blacksteel Market','market','⚖'],['Moonless Chapel','temple','✦'],['Citadel Depot','depot','▣'],['Dread Gate','gate','◆']],
  sanctum: [['Astral Command','keep','✧'],['Review Forum','library','▤'],['Aether Shrine','temple','✦'],['GM Vault','depot','▣'],['Event Gate','obelisk','◇']],
};

const DISTRICT_NAMES: Record<CityStyle, Array<[string, string]>> = {
  royal: [['Crown Plaza','♜'],['Market Ward','⚖'],['Temple Ward','✦'],['South Commons','⌂']],
  harbor: [['Harborfront','⚓'],['Salt Ward','⚖'],['Mariners Row','⌂'],['Beacon Hill','✦']],
  ironwood: [['Palisade','◆'],['Timber Ward','♣'],['Warden Row','♜'],['Grove Quarter','✦']],
  alpine: [['Keep Ward','♜'],['Forge Row','⚒'],['Pilgrim Steps','✦'],['Expedition Yard','◆']],
  marsh: [['Lantern Row','✧'],['Stilt Market','⚖'],['Mire Chapel','✦'],['Ferryman Reach','⚓']],
  forge: [['Citadel Ring','♜'],['Foundry Ward','⚒'],['Ash Bazaar','⚖'],['Arena Quarter','◎']],
  crystal: [['Prism Court','◇'],['Shard Ward','◆'],['Resonance Row','✦'],['Delver Yard','▣']],
  storm: [['Bastion Ring','♜'],['Fleet Ward','⚓'],['Thunder Row','⚡'],['Gale Market','⚖']],
  void: [['Obelisk Court','◇'],['Bone Ward','☠'],['Silent Quarter','✦'],['Rift Approach','◆']],
  nightfall: [['Regent Ward','♜'],['Blacksteel Row','⚔'],['Dusk Market','⚖'],['Moonless Ward','✦']],
  sanctum: [['Command Ring','✧'],['Review Ward','▤'],['Event Yard','◇'],['Quiet Quarter','✦']],
};

function clampCoord(value: number): number { return Math.max(2, Math.min(77, Math.round(value))); }

export function defaultCityStyle(mapId: string, biome = 'plains'): CityStyle {
  if (STYLE_BY_MAP[mapId]) return STYLE_BY_MAP[mapId];
  if (biome === 'snow') return 'alpine';
  if (biome === 'swamp') return 'marsh';
  if (biome === 'desert') return 'forge';
  if (biome === 'shadow') return 'void';
  return 'royal';
}

export function getCityPalette(seed: Pick<CityIdentitySeed, 'id'|'style'|'biome'|'cityAccent'|'roofColor'|'wallColor'|'roadColor'>): CityPalette {
  const style = seed.style || defaultCityStyle(seed.id, seed.biome);
  const base = CITY_PALETTES[style];
  return {
    accent: seed.cityAccent || base.accent,
    roof: seed.roofColor || base.roof,
    wall: seed.wallColor || base.wall,
    road: seed.roadColor || base.road,
    district: base.district,
  };
}

export function makeDefaultDistricts(seed: CityIdentitySeed): CityDistrict[] {
  const style = seed.style || defaultCityStyle(seed.id, seed.biome);
  const { x, y } = seed.townCenter;
  const palette = getCityPalette(seed);
  const offsets = [[-5,-2],[5,-2],[-4,5],[5,5]];
  return DISTRICT_NAMES[style].map(([name, icon], index) => ({
    id: `${seed.id}_district_${index + 1}`, name, icon,
    x: clampCoord(x + offsets[index][0]), y: clampCoord(y + offsets[index][1]), radius: index === 0 ? 5 : 4,
    color: index % 2 ? palette.accent : palette.district,
  }));
}

export function makeDefaultLandmarks(seed: CityIdentitySeed): CityLandmark[] {
  const style = seed.style || defaultCityStyle(seed.id, seed.biome);
  const { x, y } = seed.townCenter;
  const offsets = [[-3,-8],[-9,-1],[5,-7],[6,1],[0,5]];
  const sizes: Array<[number,number]> = [[6,5],[5,4],[4,5],[5,4],[3,3]];
  return LANDMARK_NAMES[style].map(([name, kind, icon], index) => ({
    id: `${seed.id}_landmark_${index + 1}`, name, kind, icon,
    x: clampCoord(x + offsets[index][0]), y: clampCoord(y + offsets[index][1]), w: sizes[index][0], h: sizes[index][1],
  }));
}

export function makeDefaultProps(seed: CityIdentitySeed): CityProp[] {
  const style = seed.style || defaultCityStyle(seed.id, seed.biome);
  const { x, y } = seed.townCenter;
  const palette = getCityPalette(seed);
  const styleProps: Record<CityStyle, CityPropKind[]> = {
    royal:['banner','lamp','statue','barrel','cart'], harbor:['anchor','lamp','barrel','cart','sign'], ironwood:['sign','barrel','cart','pine','banner'],
    alpine:['brazier','pine','banner','sign','barrel'], marsh:['lamp','mushroom','sign','barrel','grave'], forge:['brazier','banner','barrel','cart','sign'],
    crystal:['crystal','rune','lamp','crystal','sign'], storm:['banner','lamp','anchor','brazier','sign'], void:['grave','rune','brazier','statue','grave'],
    nightfall:['banner','brazier','grave','statue','sign'], sanctum:['rune','crystal','banner','lamp','statue'],
  };
  const offsets = [[-8,5],[-5,4],[-2,4],[2,4],[5,4],[8,5],[-8,-5],[-5,-4],[-2,-4],[2,-4],[5,-4],[8,-5],[-10,0],[10,0],[0,7],[0,-10]];
  return offsets.map(([dx,dy], index) => ({
    id: `${seed.id}_prop_${index + 1}`, kind: styleProps[style][index % styleProps[style].length],
    x: clampCoord(x + dx), y: clampCoord(y + dy), color: palette.accent,
  }));
}

export function withCityDefaults<T extends CityIdentitySeed>(seed: T): T & { style: CityStyle; cityAccent: string; roofColor: string; wallColor: string; roadColor: string; districts: CityDistrict[]; landmarks: CityLandmark[]; props: CityProp[] } {
  const style = seed.style || defaultCityStyle(seed.id, seed.biome);
  const palette = getCityPalette({ ...seed, style });
  const based = { ...seed, style, cityAccent: palette.accent, roofColor: palette.roof, wallColor: palette.wall, roadColor: palette.road };
  return {
    ...based,
    districts: Array.isArray(seed.districts) && seed.districts.length ? seed.districts : makeDefaultDistricts(based),
    landmarks: Array.isArray(seed.landmarks) && seed.landmarks.length ? seed.landmarks : makeDefaultLandmarks(based),
    props: Array.isArray(seed.props) && seed.props.length ? seed.props : makeDefaultProps(based),
  };
}
