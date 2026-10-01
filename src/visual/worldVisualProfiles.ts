export type WorldVisualProfileId='eldoria'|'capital'|'forest'|'coast'|'desert'|'snow'|'swamp'|'volcanic'|'crystal'|'storm'|'void'|'nightfall';
export interface WorldVisualProfile { id:WorldVisualProfileId; mote:number; accent:number; mist:number; warmWindows:number; foliage:number; water:number; ember:number; dust:number; snow:number; storm?:number; crystal?:number; shadow?:number; }
const profiles:Record<WorldVisualProfileId,WorldVisualProfile>={
 eldoria:{id:'eldoria',mote:0xffe5a3,accent:0x9be7ff,mist:0xd8ecff,warmWindows:0xffc96b,foliage:.65,water:.45,ember:.18,dust:.08,snow:0},
 capital:{id:'capital',mote:0xffd58a,accent:0xb7d9ff,mist:0xe1ecff,warmWindows:0xffb85c,foliage:.35,water:.3,ember:.28,dust:.12,snow:0},
 forest:{id:'forest',mote:0xc9ff8f,accent:0x7ee6b2,mist:0xcfead8,warmWindows:0xffd37a,foliage:1,water:.5,ember:.05,dust:.05,snow:0},
 coast:{id:'coast',mote:0xc8f4ff,accent:0x65d9ff,mist:0xdaf7ff,warmWindows:0xffd18a,foliage:.45,water:1,ember:.05,dust:.08,snow:0},
 desert:{id:'desert',mote:0xffd08a,accent:0xffa85c,mist:0xffe3bd,warmWindows:0xffb34d,foliage:.08,water:.08,ember:.18,dust:1,snow:0},
 snow:{id:'snow',mote:0xffffff,accent:0xa9ddff,mist:0xe9f7ff,warmWindows:0xffc36b,foliage:.12,water:.2,ember:.12,dust:0,snow:1},
 swamp:{id:'swamp',mote:0xb8ff78,accent:0x7dd9a0,mist:0xc7dfc5,warmWindows:0xffc45e,foliage:.8,water:.75,ember:.04,dust:.02,snow:0},
 volcanic:{id:'volcanic',mote:0xffb05e,accent:0xff6548,mist:0xc8a08d,warmWindows:0xff7b39,foliage:.02,water:.02,ember:1,dust:.4,snow:0},
 crystal:{id:'crystal',mote:0xdcc7ff,accent:0x8de8ff,mist:0xcfd7ff,warmWindows:0xbda7ff,foliage:.06,water:.32,ember:.02,dust:.06,snow:0,crystal:1},
 storm:{id:'storm',mote:0xccecff,accent:0x75bfff,mist:0xbacde2,warmWindows:0xffd28a,foliage:.22,water:1,ember:.02,dust:.03,snow:0,storm:1},
 void:{id:'void',mote:0xc5a4ff,accent:0x875cff,mist:0x81739a,warmWindows:0xd48cff,foliage:.01,water:.04,ember:.16,dust:.55,snow:0,shadow:.8},
 nightfall:{id:'nightfall',mote:0x9dc5ff,accent:0x6d7cff,mist:0x7887ad,warmWindows:0xffb86e,foliage:.18,water:.18,ember:.22,dust:.08,snow:0,shadow:1}
};
export const GRAND_CAPITAL_VISUAL_PROFILE:Record<string,WorldVisualProfileId>={
 eldoria:'eldoria',sunreach_coast:'coast',ironwood:'forest',frostpeak:'snow',shadowfen:'swamp',emberhold:'volcanic',crystal_deep:'crystal',stormwatch_isle:'storm',voidlands:'void',nightfall_citadel:'nightfall'
};
export function getWorldVisualProfile(id?:string):WorldVisualProfile { return profiles[(id as WorldVisualProfileId)]||profiles.eldoria; }
export function getCapitalVisualProfile(cityId?:string):WorldVisualProfile { return getWorldVisualProfile(cityId?GRAND_CAPITAL_VISUAL_PROFILE[cityId]:undefined); }
