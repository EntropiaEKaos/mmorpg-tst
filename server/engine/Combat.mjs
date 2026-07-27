// Server-side Combat — plain JS ESM
import { WORLD } from './World.mjs';

class CombatManager {
  playerAttackMonster(player, monster) {
    const baseAttack = player.attack + Math.floor(Math.random() * 8);
    const crit = Math.random() < 0.15;
    let damage = Math.max(1, baseAttack - monster.defense);
    if (crit) damage = Math.floor(damage * 2);
    const lifestealPercent = this.getLifesteal(player);
    const lifesteal = lifestealPercent > 0 ? Math.floor(damage * lifestealPercent / 100) : 0;
    monster.hp -= damage;
    return { damage, crit, lifesteal };
  }

  getLifesteal(player) {
    let total = 0;
    for (const eq of Object.values(player.equipment || {})) {
      if (eq && eq.lifesteal) total += eq.lifesteal;
    }
    return total;
  }

  rollLoot(monster) {
    const drops = [];
    const goldChance = monster.type === 'boss' ? 1 : monster.type === 'elite' ? 0.8 : 0.5;
    if (Math.random() < goldChance) {
      const goldAmount = monster.type === 'boss' ? monster.level * 100 : monster.level * 10;
      drops.push({ id: `gold_${Date.now()}_${Math.random()}`, name: 'Gold', icon: '🪙', quantity: goldAmount, value: goldAmount, isGold: true });
    }
    if (Math.random() < 0.3) {
      const mats = ['Bone', 'Meat', 'Orc Tooth', 'Dragon Scale'];
      const mat = mats[Math.floor(Math.random() * mats.length)];
      drops.push({ id: `mat_${Date.now()}_${Math.random()}`, name: mat, icon: '🦴', quantity: 1, value: 10 });
    }
    const equipChance = monster.type === 'boss' ? 0.8 : monster.type === 'elite' ? 0.3 : 0.04;
    if (Math.random() < equipChance) {
      drops.push({
        id: `eq_${Date.now()}_${Math.random()}`, name: 'Steel Sword', icon: '⚔', quantity: 1, value: 200, type: 'equipment',
        equipment: { id: 'steel_drop', name: 'Steel Sword', icon: '⚔', slot: 'weapon', attack: 12, rarity: 'uncommon', level: 5, value: 120 },
      });
    }
    return drops;
  }
}

export const Combat = new CombatManager();
