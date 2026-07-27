// Mystery Quest System - Tibia-style text mysteries with clues and riddles

export interface MysteryChapter {
  clue: string;       // the cryptic text/clue presented to the player
  riddle: string;     // the riddle/question to answer
  answer: string;     // the correct answer (case-insensitive, trimmed)
  hint: string;       // hint if the player is stuck
}

export interface MysteryQuest {
  id: string;
  name: string;
  icon: string;
  intro: string;        // the opening story/lore
  chapters: MysteryChapter[];
  rewardGold: number;
  rewardXp: number;
  rewardItem?: { name: string; icon: string; value: number };
  requiredLevel: number;
  author: string;
  createdAt: number;
}

// Built-in mystery quests (Tibia-style)
export const BUILTIN_MYSTERY_QUESTS: MysteryQuest[] = [
  {
    id: 'builtin_lost_tome',
    name: 'The Lost Tome of Eldoria',
    icon: '📖',
    intro: 'An ancient tome was hidden by the Archmage centuries ago. Whispers say its secret lies in riddles of the elements...',
    chapters: [
      { clue: 'The tome begins: "I am born of the heavens, yet I burn all I touch. What am I?"', riddle: 'Speak the answer:', answer: 'lightning', hint: 'It comes from storms in the sky.' },
      { clue: 'The page turns: "I have a heart that does not beat. A home but no doors. What am I?"', riddle: 'Speak the answer:', answer: 'artichoke', hint: 'It is a vegetable.' },
      { clue: 'Final seal: "I guard the tome. I am slain by time but never by steel. Speak the secret word: MORIA."', riddle: 'Speak the secret word:', answer: 'moria', hint: 'The realm itself.' },
    ],
    rewardGold: 500,
    rewardXp: 800,
    rewardItem: { name: 'Ancient Rune', icon: '📜', value: 300 },
    requiredLevel: 5,
    author: 'Archmage',
    createdAt: 0,
  },
  {
    id: 'builtin_phantom',
    name: 'The Phantom of Frostpeak',
    icon: '👻',
    intro: 'A wailing phantom haunts the frozen peaks. To lay it to rest, you must unravel its tragic riddles...',
    chapters: [
      { clue: 'The phantom wails: "The more you take, the more you leave behind. What am I?"', riddle: 'Answer the phantom:', answer: 'footsteps', hint: 'You make them when you walk.' },
      { clue: 'It sighs: "I am cold to the touch but warm the soul. I melt in hand but never in heart. What am I?"', riddle: 'Answer the phantom:', answer: 'snow', hint: 'It falls in Frostpeak.' },
      { clue: 'The phantom fades: "Name what I was in life — a keeper of the mountain pass."', riddle: 'What was I?', answer: 'guard', hint: 'One who watches and defends.' },
    ],
    rewardGold: 750,
    rewardXp: 1000,
    rewardItem: { name: 'Frozen Heart', icon: '💙', value: 500 },
    requiredLevel: 10,
    author: 'The Chronicler',
    createdAt: 0,
  },
];

const STORAGE_KEY = 'moria_mystery_quests';
const PROGRESS_KEY = (playerName: string) => `moria_mystery_progress_${playerName}`;

export function getAllMysteryQuests(): MysteryQuest[] {
  try {
    const custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return [...BUILTIN_MYSTERY_QUESTS, ...custom];
  } catch {
    return BUILTIN_MYSTERY_QUESTS;
  }
}

export function getCustomMysteryQuests(): MysteryQuest[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCustomMysteryQuests(quests: MysteryQuest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quests));
}

export function addMysteryQuest(quest: MysteryQuest) {
  const custom = getCustomMysteryQuests();
  custom.push(quest);
  saveCustomMysteryQuests(custom);
}

export function deleteMysteryQuest(id: string) {
  const custom = getCustomMysteryQuests().filter((q) => q.id !== id);
  saveCustomMysteryQuests(custom);
}

export interface MysteryProgress {
  [questId: string]: {
    solvedChapters: number; // how many chapters solved
    completed: boolean;
  };
}

export function getMysteryProgress(playerName: string): MysteryProgress {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY(playerName)) || '{}');
  } catch {
    return {};
  }
}

export function setMysteryProgress(playerName: string, progress: MysteryProgress) {
  localStorage.setItem(PROGRESS_KEY(playerName), JSON.stringify(progress));
}
