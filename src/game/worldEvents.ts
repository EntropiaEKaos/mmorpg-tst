// World Events / World Missions - makes the world feel alive and "online"
// These are server-like global events that all players (accounts) on the browser share.

export interface WorldEvent {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'worldboss' | 'invasion' | 'gathering' | 'bounty';
  targetMap?: string;
  targetPos?: { x: number; y: number };
  monsterTemplate?: {
    name: string; emoji: string; color: string; hp: number; attack: number; defense: number;
    xp: number; level: number; count: number; size?: number;
  };
  rewardGold: number;
  rewardXp: number;
  startTime: number;
  endTime: number;
  progress: { current: number; required: number };
  contributors: Record<string, number>; // playerName -> contribution
  status: 'active' | 'completed' | 'expired';
  createdBy: string; // 'system' or admin name
}

const KEY = 'moria_world_events';

export function getWorldEvents(): WorldEvent[] {
  try {
    const events = JSON.parse(localStorage.getItem(KEY) || '[]');
    const now = Date.now();
    // Update statuses
    return events.map((e: WorldEvent) => {
      if (e.status === 'active' && now > e.endTime) e.status = 'expired';
      return e;
    }).filter((e: WorldEvent) => now - e.endTime < 86400000); // keep for 24h after end
  } catch { return []; }
}

export function saveWorldEvents(events: WorldEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events));
}

export function addWorldEvent(event: WorldEvent) {
  const events = getWorldEvents();
  events.push(event);
  saveWorldEvents(events);
}

export function deleteWorldEvent(id: string) {
  saveWorldEvents(getWorldEvents().filter((e) => e.id !== id));
}

export interface WorldEventContributionResult {
  completed: boolean;
  contribution: number;
  accepted: number;
  current: number;
  required: number;
}

export function contributeToWorldEvent(eventId: string, playerName: string, amount: number): WorldEventContributionResult {
  const events = getWorldEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event || event.status !== 'active') {
    return { completed: false, contribution: 0, accepted: 0, current: 0, required: 0 };
  }
  const requested = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  const remaining = Math.max(0, event.progress.required - event.progress.current);
  const accepted = Math.min(requested, remaining);
  if (accepted <= 0) {
    return {
      completed: false,
      contribution: event.contributors[playerName] || 0,
      accepted: 0,
      current: event.progress.current,
      required: event.progress.required,
    };
  }
  event.progress.current += accepted;
  event.contributors[playerName] = (event.contributors[playerName] || 0) + accepted;
  const completed = event.progress.current >= event.progress.required;
  if (completed) event.status = 'completed';
  saveWorldEvents(events);
  return {
    completed,
    contribution: event.contributors[playerName],
    accepted,
    current: event.progress.current,
    required: event.progress.required,
  };
}

// Auto-generate periodic system events (simulates a live server)
export function generateSystemEvent(): WorldEvent | null {
  const now = Date.now();
  const templates = [
    {
      name: 'Dragon Invasion', icon: '🐉', type: 'worldboss' as const, description: 'A Dragon Lord terrorizes the Voidlands! Slay it for glory.',
      monster: { name: 'Dragon Lord', emoji: '🐉', color: '#8b0000', hp: 5000, attack: 120, defense: 40, xp: 10000, level: 50, count: 1, size: 1.8 },
      targetMap: 'voidlands', targetPos: { x: 50, y: 50 },
      progress: { current: 0, required: 1 }, rewardGold: 5000, rewardXp: 15000, duration: 1800000,
    },
    {
      name: 'Rat Plague', icon: '🐀', type: 'invasion' as const, description: 'Rats are invading Eldoria! Clear 20 of them.',
      monster: { name: 'Plague Rat', emoji: '🐀', color: '#6a4a2a', hp: 40, attack: 8, defense: 2, xp: 20, level: 3, count: 5, size: 0.7 },
      targetMap: 'eldoria', targetPos: { x: 35, y: 50 },
      progress: { current: 0, required: 20 }, rewardGold: 800, rewardXp: 1200, duration: 900000,
    },
    {
      name: 'Skeleton Uprising', icon: '💀', type: 'invasion' as const, description: 'The undead rise in Shadowfen. Destroy 15 skeletons.',
      monster: { name: 'Skeleton Warrior', emoji: '💀', color: '#d4d4c8', hp: 120, attack: 25, defense: 8, xp: 80, level: 15, count: 4 },
      targetMap: 'shadowfen', targetPos: { x: 30, y: 40 },
      progress: { current: 0, required: 15 }, rewardGold: 2000, rewardXp: 4000, duration: 1200000,
    },
    {
      name: 'Demon Bounty', icon: '😈', type: 'bounty' as const, description: 'A bounty has been placed on 5 Demons in Emberhold.',
      monster: { name: 'Demon', emoji: '😈', color: '#c13030', hp: 400, attack: 50, defense: 15, xp: 300, level: 25, count: 3 },
      targetMap: 'emberhold', targetPos: { x: 30, y: 40 },
      progress: { current: 0, required: 5 }, rewardGold: 3000, rewardXp: 6000, duration: 1500000,
    },
  ];
  const tmpl = templates[Math.floor(Math.random() * templates.length)];
  return {
    id: `we_${now}_${Math.random()}`,
    name: tmpl.name, icon: tmpl.icon, description: tmpl.description, type: tmpl.type,
    targetMap: tmpl.targetMap, targetPos: tmpl.targetPos,
    monsterTemplate: tmpl.monster,
    rewardGold: tmpl.rewardGold, rewardXp: tmpl.rewardXp,
    startTime: now, endTime: now + tmpl.duration,
    progress: tmpl.progress, contributors: {}, status: 'active', createdBy: 'system',
  };
}

// Check if we should spawn a new system event (every ~20 min, max 2 active)
export function maybeSpawnSystemEvent(): WorldEvent | null {
  const events = getWorldEvents();
  const active = events.filter((e) => e.status === 'active' && e.createdBy === 'system');
  if (active.length >= 2) return null;
  // Only spawn if last system event was > 20 min ago
  const lastSystem = events.filter((e) => e.createdBy === 'system').sort((a, b) => b.startTime - a.startTime)[0];
  if (lastSystem && Date.now() - lastSystem.startTime < 1200000) return null;
  const newEvent = generateSystemEvent();
  if (newEvent) {
    addWorldEvent(newEvent);
    return newEvent;
  }
  return null;
}

// ===== SIMULATED ONLINE PLAYERS (bots that make the world feel alive) =====
export interface SimPlayer {
  id: string;
  name: string;
  vocation: string;
  level: number;
  pos: { x: number; y: number };
  targetPos: { x: number; y: number };
  color: string;
  icon: string;
  lastMove: number;
}

const SIM_NAMES = ['Aragorn', 'Legolaz', 'GimliSon', 'Elaria', 'Thundar', 'Mystara', 'Borin', 'Lyssia', 'Kael', 'Seraphina', 'Draug', 'Nova', 'Zephyr', 'Ember', 'Frost', 'Raven'];
const SIM_VOCATIONS = ['knight', 'paladin', 'sorcerer', 'druid', 'rogue', 'monk', 'ranger', 'necromancer'];
const SIM_COLORS = ['#c13030', '#4a7c3a', '#9b59ff', '#2ecc71', '#555555', '#e6a817', '#1a6b3a', '#2a6a4a'];

export function generateSimPlayers(count: number, mapW: number, mapH: number): SimPlayer[] {
  const players: SimPlayer[] = [];
  for (let i = 0; i < count; i++) {
    const x = 15 + Math.floor(Math.random() * (mapW - 30));
    const y = 15 + Math.floor(Math.random() * (mapH - 30));
    players.push({
      id: `sim_${i}`,
      name: SIM_NAMES[i % SIM_NAMES.length] + (Math.floor(Math.random() * 99)),
      vocation: SIM_VOCATIONS[i % SIM_VOCATIONS.length],
      level: 1 + Math.floor(Math.random() * 40),
      pos: { x, y },
      targetPos: { x, y },
      color: SIM_COLORS[i % SIM_COLORS.length],
      icon: ['⚔', '🏹', '🔮', '🌿', '🗡', '🥋'][i % 6],
      lastMove: 0,
    });
  }
  return players;
}

// Simulated world chat messages
const CHAT_LINES = [
  { sender: 'Aragorn', text: 'WTS Excalibur 7k gold, pm me', channel: 'world' as const },
  { sender: 'Mystara', text: 'Anyone doing the Dragon Invasion?', channel: 'world' as const },
  { sender: 'Legolaz', text: 'LFG dungeon, need tank', channel: 'world' as const },
  { sender: 'Seraphina', text: 'Selling Greater Health Potions cheap in town', channel: 'world' as const },
  { sender: 'Borin', text: 'gg easy boss kill', channel: 'world' as const },
  { sender: 'Elaria', text: 'How do I get to Frostpeak?', channel: 'world' as const },
  { sender: 'Thundar', text: 'Level 30 finally! 🎉', channel: 'world' as const },
  { sender: 'Nova', text: 'Watch out for the Orc King, he hits hard', channel: 'world' as const },
  { sender: 'Zephyr', text: 'Buying Dragon Scales, paying well', channel: 'world' as const },
  { sender: 'Draug', text: 'RIP my amulet of loss 💀', channel: 'world' as const },
];

export function getRandomChatLine(): { sender: string; text: string; channel: 'world' } | null {
  if (Math.random() < 0.3) {
    return CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)];
  }
  return null;
}
