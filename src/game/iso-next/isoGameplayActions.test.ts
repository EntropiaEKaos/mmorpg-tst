import { describe, expect, it } from 'vitest';
import { selectIsoGameplaySnapshot } from './isoGameplayActions';

describe('ISO gameplay migration snapshot', () => {
  it('projects mature MMORPG systems from the authoritative snapshot', () => {
    const result = selectIsoGameplaySnapshot({
      player: {
        inventory: [{ id: 'potion' }],
        equipment: { weapon: { id: 'sword' } },
        activeQuests: [{ questId: 'q1' }],
        tasks: [{ id: 't1' }],
        talents: [{ id: 'talent-1' }],
        professions: [{ id: 'smithing' }],
        reputation: { eldoria: 10 },
        mounts: [{ id: 'horse' }],
      },
      groundItems: [{ id: 'drop-1' }],
    });
    expect(result.inventory).toHaveLength(1);
    expect(result.equipment.weapon).toBeTruthy();
    expect(result.groundItems).toHaveLength(1);
    expect(result.activeQuests).toHaveLength(1);
    expect(result.tasks).toHaveLength(1);
    expect(result.talents).toHaveLength(1);
    expect(result.professions).toHaveLength(1);
    expect(result.reputation).toEqual({ eldoria: 10 });
    expect(result.mounts).toHaveLength(1);
  });

  it('never invents client-side state when fields are absent', () => {
    expect(selectIsoGameplaySnapshot({ player: {} })).toEqual({
      inventory: [], equipment: {}, groundItems: [], activeQuests: [], tasks: [],
      talents: [], professions: [], reputation: {}, mounts: [],
    });
  });
});
