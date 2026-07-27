import type { Quest } from './types';

export const QUESTS: Quest[] = [
  {
    id: 'quest_rats',
    name: 'Rat Infestation',
    description: 'Captain Thane asked you to clear the rats near the town.',
    npcId: 'quest_giver_1',
    levelRequired: 1,
    objectives: [
      { type: 'kill', target: 'Rat', targetName: 'Rats', count: 5, current: 0 },
    ],
    rewards: { xp: 100, gold: 50 },
  },
  {
    id: 'quest_wolves',
    name: 'Wolf Menace',
    description: 'Thin the wolf population in the eastern forest.',
    npcId: 'quest_giver_2',
    levelRequired: 5,
    requires: ['quest_rats'],
    objectives: [
      { type: 'kill', target: 'Wolf', targetName: 'Wolves', count: 3, current: 0 },
    ],
    rewards: { xp: 250, gold: 120 },
  },
  {
    id: 'quest_orcs',
    name: 'Orc Invasion',
    description: 'The orcs are amassing in the south. Defeat them!',
    npcId: 'quest_giver_2',
    levelRequired: 8,
    requires: ['quest_wolves'],
    objectives: [
      { type: 'kill', target: 'Orc', targetName: 'Orcs', count: 5, current: 0 },
      { type: 'kill', target: 'Orc Warrior', targetName: 'Orc Warriors', count: 2, current: 0 },
    ],
    rewards: { xp: 600, gold: 350 },
  },
  {
    id: 'quest_skeleton',
    name: 'Undead Rising',
    description: 'Skeletons are haunting the graveyard. Put them to rest.',
    npcId: 'quest_giver_1',
    levelRequired: 6,
    requires: ['quest_rats'],
    objectives: [
      { type: 'kill', target: 'Skeleton', targetName: 'Skeletons', count: 5, current: 0 },
    ],
    rewards: { xp: 350, gold: 180 },
  },
  {
    id: 'quest_boss_orc',
    name: 'Slay the Orc King',
    description: 'The Orc King must fall for peace to return.',
    npcId: 'quest_giver_1',
    levelRequired: 15,
    requires: ['quest_orcs'],
    objectives: [
      { type: 'kill', target: 'Orc King', targetName: 'Orc King', count: 1, current: 0 },
    ],
    rewards: { xp: 1200, gold: 1000 },
  },
  {
    id: 'quest_boss_dragon',
    name: 'Dragon Slayer',
    description: 'The ultimate challenge: defeat the Dragon Lord!',
    npcId: 'quest_giver_2',
    levelRequired: 25,
    requires: ['quest_boss_orc'],
    objectives: [
      { type: 'kill', target: 'Dragon Lord', targetName: 'Dragon Lord', count: 1, current: 0 },
    ],
    rewards: { xp: 5000, gold: 5000 },
  },
];

export function getAvailableQuests(completed: string[], level: number, active: string[]): Quest[] {
  return QUESTS.filter((q) => {
    if (completed.includes(q.id)) return false;
    if (active.includes(q.id)) return false;
    if (q.levelRequired > level) return false;
    if (q.requires && !q.requires.every((r) => completed.includes(r))) return false;
    return true;
  });
}
