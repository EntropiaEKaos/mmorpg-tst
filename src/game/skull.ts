// Tibia-style Skull System for PvP alignment/karma
// None (green) → White → Yellow → Orange → Red → Black

export type SkullType = 'none' | 'white' | 'yellow' | 'orange' | 'red' | 'black';

export interface SkullInfo {
  type: SkullType;
  color: string;
  name: string;
  description: string;
  icon: string;
}

export const SKULLS: Record<SkullType, SkullInfo> = {
  none: { type: 'none', color: '#2ecc71', name: 'Lawful', description: 'You have a clean record. No penalties.', icon: '🟢' },
  white: { type: 'white', color: '#ffffff', name: 'Suspect', description: 'Recently attacked another player. Minor reputation loss.', icon: '⚪' },
  yellow: { type: 'yellow', color: '#f4e04d', name: 'Aggressor', description: 'You attacked an innocent. Guards may attack you.', icon: '🟡' },
  orange: { type: 'orange', color: '#ff8c00', name: 'Outlaw', description: 'Repeated aggression. Shops charge more, you take more damage.', icon: '🟠' },
  red: { type: 'red', color: '#ff3030', name: 'Murderer', description: 'You killed an innocent. You drop loot on death and are hunted.', icon: '🔴' },
  black: { type: 'black', color: '#8b0000', name: 'Wanted', description: 'Maximum infamy. Anyone can attack you freely. Huge penalties.', icon: '⚫' },
};

const KEY = (playerName: string) => `moria_skull_${playerName}`;

export interface SkullState {
  type: SkullType;
  aggressionPoints: number; // accumulates with attacks, decays over time
  lastDecay: number;
}

export function getSkullState(playerName: string): SkullState {
  try {
    const data = JSON.parse(localStorage.getItem(KEY(playerName)) || 'null');
    if (data) {
      // Decay aggression points over time (1 point per 5 minutes real time)
      const now = Date.now();
      const elapsedMin = (now - data.lastDecay) / 60000;
      const decay = Math.floor(elapsedMin / 5);
      if (decay > 0) {
        data.aggressionPoints = Math.max(0, data.aggressionPoints - decay);
        data.type = recomputeSkull(data.aggressionPoints);
        data.lastDecay = now;
        localStorage.setItem(KEY(playerName), JSON.stringify(data));
      }
      return data;
    }
  } catch {}
  return { type: 'none', aggressionPoints: 0, lastDecay: Date.now() };
}

export function recomputeSkull(points: number): SkullType {
  if (points >= 50) return 'black';
  if (points >= 25) return 'red';
  if (points >= 15) return 'orange';
  if (points >= 8) return 'yellow';
  if (points >= 3) return 'white';
  return 'none';
}

export function addAggression(playerName: string, points: number): SkullState {
  const state = getSkullState(playerName);
  state.aggressionPoints += points;
  state.type = recomputeSkull(state.aggressionPoints);
  state.lastDecay = Date.now();
  localStorage.setItem(KEY(playerName), JSON.stringify(state));
  return state;
}

export function setSkullType(playerName: string, type: SkullType): void {
  const points = { none: 0, white: 3, yellow: 8, orange: 15, red: 25, black: 50 } as Record<SkullType, number>;
  const state: SkullState = { type, aggressionPoints: points[type], lastDecay: Date.now() };
  localStorage.setItem(KEY(playerName), JSON.stringify(state));
}

export function clearSkull(playerName: string): void {
  localStorage.setItem(KEY(playerName), JSON.stringify({ type: 'none', aggressionPoints: 0, lastDecay: Date.now() }));
}

// PvP toggling
const PVP_KEY = (playerName: string) => `moria_pvp_enabled_${playerName}`;
export function isPvpEnabled(playerName: string): boolean {
  return localStorage.getItem(PVP_KEY(playerName)) === '1';
}
export function togglePvp(playerName: string): boolean {
  const cur = isPvpEnabled(playerName);
  localStorage.setItem(PVP_KEY(playerName), cur ? '0' : '1');
  return !cur;
}
