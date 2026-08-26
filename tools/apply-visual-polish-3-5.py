from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'pattern not found: {marker}')
    return text.replace(old, new, 1)

# ---------------------------------------------------------------------
# Browser ESM correctness: remove CommonJS require() from client modules.
# ---------------------------------------------------------------------
p = 'src/game/types.ts'
s = read(p)
s = replace_once(s,
    "export type TileType =\n",
    "import { GEMS, computeSetBonusStats } from './itemSets';\n\nexport type TileType =\n",
    'types itemSets import')
s = replace_once(s,
'''  // Gems cache
  const gemMap: Record<string, { stat: string; value: number }> = {};
  try {
    const gems = require('./itemSets').GEMS;
    for (const g of gems) gemMap[g.id] = { stat: g.stat, value: g.value };
  } catch {}
''',
'''  // Gem lookup is a real ESM dependency; using require() in the browser silently
  // disabled socket bonuses under Vite.
  const gemMap: Record<string, { stat: string; value: number }> = {};
  for (const gem of GEMS) gemMap[gem.id] = { stat: gem.stat, value: gem.value };
''', 'gem require')
s = replace_once(s,
'''  // Apply set bonuses
  try {
    const setBonus = require('./itemSets').computeSetBonusStats(player);
    stats.critChance += setBonus.crit;
    stats.lifesteal += setBonus.lifesteal;
    stats.thorns += setBonus.thorns;
    stats.moveSpeed += setBonus.speed;
    stats.xpBonus += setBonus.xp;
    stats.goldBonus += setBonus.gold;
    stats.damageReduction += setBonus.reduction;
    stats.totalMaxHp += setBonus.hp;
    stats.totalMaxMana += setBonus.mana;
    // damage and magic from sets apply as flat multipliers - convert to a usable form via helper
    (stats as any)._setDamageBonus = setBonus.damage;
    (stats as any)._setMagicBonus = setBonus.magic;
  } catch {}
''',
'''  // Apply set bonuses. itemSets imports Player as a type-only dependency, so this
  // static import does not create a runtime cycle.
  const setBonus = computeSetBonusStats(player);
  stats.critChance += setBonus.crit;
  stats.lifesteal += setBonus.lifesteal;
  stats.thorns += setBonus.thorns;
  stats.moveSpeed += setBonus.speed;
  stats.xpBonus += setBonus.xp;
  stats.goldBonus += setBonus.gold;
  stats.damageReduction += setBonus.reduction;
  stats.totalMaxHp += setBonus.hp;
  stats.totalMaxMana += setBonus.mana;
  (stats as any)._setDamageBonus = setBonus.damage;
  (stats as any)._setMagicBonus = setBonus.magic;
''', 'set bonus require')
write(p, s)

p = 'src/game/economy.ts'
s = read(p)
s = replace_once(s,
    "// ============ PREMIUM CURRENCY (Coins) ============\n",
    "import { sendSystemMail } from './content';\n\n// ============ PREMIUM CURRENCY (Coins) ============\n",
    'economy content import')
s = replace_once(s,
'''  // Send gold to seller via mail
  const { sendSystemMail } = require('./content');
  sendSystemMail(listing.sellerName, 'Auction House',
''',
'''  // Send gold to seller via mail.
  sendSystemMail(listing.sellerName, 'Auction House',
''', 'auction require')
write(p, s)

# ---------------------------------------------------------------------
# World-event contribution is bounded by remaining progress and returns
# the accepted delta, preventing repeated-click reward farming.
# ---------------------------------------------------------------------
p = 'src/game/worldEvents.ts'
s = read(p)
s = replace_once(s,
'''export function contributeToWorldEvent(eventId: string, playerName: string, amount: number): { completed: boolean; contribution: number } {
  const events = getWorldEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event || event.status !== 'active') return { completed: false, contribution: 0 };
  event.progress.current = Math.min(event.progress.required, event.progress.current + amount);
  event.contributors[playerName] = (event.contributors[playerName] || 0) + amount;
  let completed = false;
  if (event.progress.current >= event.progress.required) {
    event.status = 'completed';
    completed = true;
  }
  saveWorldEvents(events);
  return { completed, contribution: event.contributors[playerName] };
}
''',
'''export interface WorldEventContributionResult {
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
''', 'world event contribution')
write(p, s)

# ---------------------------------------------------------------------
# Pet persistence integrity.
# ---------------------------------------------------------------------
p = 'src/game/dungeons.ts'
s = read(p)
s = replace_once(s,
'''export function buyPet(playerName: string, petId: string): boolean {
  const owned = getOwnedPets(playerName);
  if (owned.includes(petId)) return false;
  owned.push(petId);
  localStorage.setItem(`tibia_pets_${playerName}`, JSON.stringify(owned));
  return true;
}

export function setActivePet(playerName: string, petId: string | null) {
  if (petId) localStorage.setItem(`tibia_activepet_${playerName}`, petId);
  else localStorage.removeItem(`tibia_activepet_${playerName}`);
}
''',
'''export function buyPet(playerName: string, petId: string): boolean {
  if (!PETS.some((pet) => pet.id === petId)) return false;
  const owned = getOwnedPets(playerName);
  if (owned.includes(petId)) return false;
  owned.push(petId);
  localStorage.setItem(`tibia_pets_${playerName}`, JSON.stringify(owned));
  return true;
}

export function setActivePet(playerName: string, petId: string | null): boolean {
  if (petId) {
    if (!PETS.some((pet) => pet.id === petId) || !getOwnedPets(playerName).includes(petId)) return false;
    localStorage.setItem(`tibia_activepet_${playerName}`, petId);
  } else {
    localStorage.removeItem(`tibia_activepet_${playerName}`);
  }
  return true;
}
''', 'pet ownership validation')
write(p, s)

# ---------------------------------------------------------------------
# Dungeon visual hierarchy + accurate preview.
# ---------------------------------------------------------------------
p = 'src/components/DungeonPortal.tsx'
s = read(p)
s = replace_once(s,
'''export default function DungeonPortal({ player: _player, onClose, onEnterDungeon, highestWave }: Props) {
  const [selectedWaves, setSelectedWaves] = useState(10);

  return (
''',
'''export default function DungeonPortal({ player: _player, onClose, onEnterDungeon, highestWave }: Props) {
  const [selectedWaves, setSelectedWaves] = useState(10);
  const completionReward = getDungeonReward(selectedWaves);

  return (
''', 'dungeon reward')
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-20"', 'className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"', 1)
s = replace_once(s,
'''        className="rounded-xl border-2 p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(80,20,80,0.95) 0%, rgba(30,5,30,0.98) 100%)',
          borderColor: '#c832ff',
          boxShadow: '0 0 50px rgba(200,50,255,0.4)',
        }}
''',
'''        className="moria-panel moria-scrollbar w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-violet-300/25 p-4 sm:p-6"
        style={{ boxShadow: '0 30px 90px rgba(0,0,0,.58), 0 0 60px rgba(139,92,246,.12)' }}
''', 'dungeon panel')
s = s.replace('className="grid grid-cols-5 gap-1.5"', 'className="grid grid-cols-4 gap-2"', 1)
s = replace_once(s,
'''                    {w.monsters.map((m, i) => (
                      <span key={i} className="text-base">{m.emoji}</span>
                    ))}
''',
'''                    {w.monsters.map((m, i) => (
                      <span key={i} className="moria-chip rounded-md px-1.5 py-0.5 text-[10px] text-slate-300">{m.emoji} ×{m.count}</span>
                    ))}
''', 'dungeon monster counts')
s = s.replace('{selectedWaves * 100}🪙', '{completionReward.gold}🪙', 1)
s = s.replace('{selectedWaves * 150}', '{completionReward.xp}', 1)
s = s.replace('className="w-full py-3 rounded-lg font-black tracking-widest text-lg transition-all hover:scale-[1.02]"', 'className="moria-button-primary w-full rounded-xl py-3 text-base font-black tracking-[0.12em] sm:text-lg"', 1)
write(p, s)

# ---------------------------------------------------------------------
# Pet shop: state now reacts immediately to summon/dismiss/buy.
# ---------------------------------------------------------------------
p = 'src/components/PetShop.tsx'
s = read(p)
s = replace_once(s, "import type { Player } from '../game/types';\n", "import { useState } from 'react';\nimport type { Player } from '../game/types';\n", 'pet useState')
s = replace_once(s,
'''  onBuyPet?: (petId: string, price: number) => void;
''',
'''  onBuyPet?: (petId: string, price: number) => boolean;
''', 'pet callback type')
s = replace_once(s,
'''export default function PetShop({ player, onClose, onBuyPet }: Props) {
  const owned = getOwnedPets(player.name);
  const active = getActivePet(player.name);

  return (
''',
'''export default function PetShop({ player, onClose, onBuyPet }: Props) {
  const [owned, setOwned] = useState<string[]>(() => getOwnedPets(player.name));
  const [active, setActive] = useState<string | null>(() => getActivePet(player.name));

  const summon = (petId: string) => {
    if (setActivePet(player.name, petId)) setActive(petId);
  };
  const dismiss = () => {
    if (setActivePet(player.name, null)) setActive(null);
  };
  const buy = (petId: string, price: number) => {
    if (!onBuyPet?.(petId, price)) return;
    setOwned(getOwnedPets(player.name));
  };

  return (
''', 'pet reactive state')
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-20"', 'className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"', 1)
s = replace_once(s,
'''        className="rounded-xl border-2 p-5 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(40,30,60,0.98) 0%, rgba(20,10,30,0.98) 100%)',
          borderColor: '#ff9bcc',
          boxShadow: '0 0 40px rgba(255,155,204,0.3)',
        }}
''',
'''        className="moria-panel moria-scrollbar w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-fuchsia-300/20 p-4 sm:p-6"
        style={{ boxShadow: '0 30px 90px rgba(0,0,0,.58), 0 0 55px rgba(244,114,182,.10)' }}
''', 'pet panel')
s = s.replace('className="grid grid-cols-2 gap-3"', 'className="grid grid-cols-1 gap-3 md:grid-cols-2"', 1)
s = s.replace("onClick={() => setActivePet(player.name, null)}", 'onClick={dismiss}', 1)
s = s.replace("onClick={() => setActivePet(player.name, pet.id)}", 'onClick={() => summon(pet.id)}', 1)
s = s.replace("onClick={() => { if (canBuy && onBuyPet) onBuyPet(pet.id, pet.price); }}", 'onClick={() => { if (canBuy) buy(pet.id, pet.price); }}', 1)
write(p, s)

# ---------------------------------------------------------------------
# Depot: immutable stacking, hard capacity, responsive two-pane layout.
# ---------------------------------------------------------------------
p = 'src/components/Depot.tsx'
s = read(p)
s = replace_once(s,
'''export default function Depot({ player, inventory, setInventory, onClose }: Props) {
  const [depot, setDepot] = useState<Item[]>(getDepot(player.name));
''',
'''export default function Depot({ player, inventory, setInventory, onClose }: Props) {
  const [depot, setDepot] = useState<Item[]>(getDepot(player.name));
  const [notice, setNotice] = useState('');
''', 'depot notice')
s = replace_once(s,
'''    const newDepot = [...depot];
    if (isStack) {
      const existing = newDepot.find((i) => i.name === item.name);
      if (existing) {
        existing.quantity += qty;
      } else {
        newDepot.push({ ...item, quantity: qty });
      }
    } else {
      newDepot.push({ ...item, quantity: 1 });
    }
    updateDepot(newDepot);

    // Remove from inventory
    let newInv;
    if (isStack) {
      newInv = inventory.filter((i) => i.id !== item.id);
    } else {
      newInv = inventory.filter((i) => i.id !== item.id);
    }
    setInventory(newInv);
''',
'''    const existing = isStack ? depot.find((i) => i.name === item.name) : undefined;
    if (!existing && depot.length >= DEPOT_SLOTS) {
      setNotice(`Depot is full (${DEPOT_SLOTS}/${DEPOT_SLOTS}). Withdraw something first.`);
      return;
    }
    const newDepot = existing
      ? depot.map((i) => i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i)
      : [...depot, { ...item, quantity: isStack ? qty : 1 }];
    updateDepot(newDepot);
    setInventory(inventory.filter((i) => i.id !== item.id));
    setNotice('');
''', 'depot deposit logic')
s = replace_once(s,
'''    const newInv = [...inventory];
    if (isStack) {
      const existing = newInv.find((i) => i.name === item.name);
      if (existing) {
        existing.quantity += qty;
      } else {
        newInv.push({ ...item, quantity: qty });
      }
    } else {
      newInv.push({ ...item, quantity: 1 });
    }
    setInventory(newInv);
''',
'''    const existing = isStack ? inventory.find((i) => i.name === item.name) : undefined;
    const newInv = existing
      ? inventory.map((i) => i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i)
      : [...inventory, { ...item, quantity: isStack ? qty : 1 }];
    setInventory(newInv);
    setNotice('');
''', 'depot withdraw logic')
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-20"', 'className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"', 1)
s = replace_once(s,
'''           className="rounded-xl border-2 p-4 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(60,45,20,0.98) 0%, rgba(30,22,8,0.98) 100%)', borderColor: '#f4e04d', boxShadow: '0 0 50px rgba(244,224,77,0.3)' }}>
''',
'''           className="moria-panel w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-5 flex flex-col">
''', 'depot panel')
s = s.replace('className="grid grid-cols-2 gap-4 flex-1 overflow-hidden"', 'className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden"', 1)
s = s.replace('className="grid grid-cols-6 gap-1.5 overflow-y-auto p-1 rounded border border-amber-900/40 bg-black/30"', 'className="moria-scrollbar grid grid-cols-5 gap-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-2 sm:grid-cols-6"', 1)
s = s.replace('className="grid grid-cols-6 gap-1.5 overflow-y-auto p-1 rounded border border-amber-900/40 bg-black/30"', 'className="moria-scrollbar grid grid-cols-5 gap-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-2 sm:grid-cols-6"', 1)
s = replace_once(s,
'''        <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
''',
'''        {notice && <div className="mb-3 rounded-lg border border-rose-400/30 bg-rose-950/35 px-3 py-2 text-xs text-rose-200">⚠ {notice}</div>}
        <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
''', 'depot notice render')
write(p, s)

# ---------------------------------------------------------------------
# Mail: real ESM send, real gold claim callback, premium panel styling.
# ---------------------------------------------------------------------
p = 'src/components/MailBox.tsx'
s = read(p)
s = s.replace("import { getMail, markMailRead, claimMail, deleteMail, type MailItem } from '../game/content';", "import { getMail, markMailRead, claimMail, deleteMail, sendMail, type MailItem } from '../game/content';")
s = replace_once(s,
'''  addMessage: (sender: string, text: string, color: string, channel: 'world' | 'system' | 'battle' | 'loot' | 'quest') => void;
}

export default function MailBox({ player, inventory, setInventory, onClose, addMessage }: Props) {
''',
'''  addMessage: (sender: string, text: string, color: string, channel: 'world' | 'system' | 'battle' | 'loot' | 'quest') => void;
  onClaimGold: (amount: number) => void;
}

export default function MailBox({ player, inventory, setInventory, onClose, addMessage, onClaimGold }: Props) {
''', 'mail claim callback')
s = replace_once(s,
'''    if (claimed.gold) {
      // gold handled by parent via addMessage; we reflect via inventory isn't right. Use a callback.
      addMessage('Mail', `Claimed ${claimed.gold} gold from mail.`, '#f4e04d', 'loot');
    }
''',
'''    if (claimed.gold && claimed.gold > 0) {
      onClaimGold(claimed.gold);
      addMessage('Mail', `Claimed ${claimed.gold} gold from mail.`, '#f4e04d', 'loot');
    }
''', 'mail gold claim')
s = replace_once(s,
'''    const { sendMail } = require('../game/content');
    sendMail({ from: player.name, to: to.trim(), subject: subject.trim(), body: body.trim() });
''',
'''    sendMail({ from: player.name, to: to.trim(), subject: subject.trim(), body: body.trim() });
''', 'mail require')
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-20"', 'className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"', 1)
s = replace_once(s,
'''           className="rounded-xl border-2 p-5 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(50,40,15,0.98) 0%, rgba(25,20,8,0.98) 100%)', borderColor: '#f4e04d', boxShadow: '0 0 40px rgba(244,224,77,0.3)' }}>
''',
'''           className="moria-panel w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-6 flex flex-col">
''', 'mail panel')
s = s.replace('className="overflow-y-auto flex-1 space-y-2"', 'className="moria-scrollbar overflow-y-auto flex-1 space-y-2 pr-1"', 1)
write(p, s)

# ---------------------------------------------------------------------
# World Events: reward exactly in proportion to accepted progress.
# ---------------------------------------------------------------------
p = 'src/components/WorldEvents.tsx'
s = read(p)
s = replace_once(s,
'''    if (result.completed) {
      onContribute(event.rewardGold, event.rewardXp);
    } else if (result.contribution > 0) {
      // partial contribution reward
      onContribute(Math.floor(event.rewardGold * 0.1), Math.floor(event.rewardXp * 0.1));
    }
''',
'''    if (result.accepted > 0 && result.required > 0) {
      const share = result.accepted / result.required;
      onContribute(Math.floor(event.rewardGold * share), Math.floor(event.rewardXp * share));
    }
''', 'world event proportional reward')
s = s.replace('const pct = (event.progress.current / event.progress.required) * 100;', 'const pct = Math.max(0, Math.min(100, (event.progress.current / Math.max(1, event.progress.required)) * 100));')
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-20"', 'className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"', 1)
s = replace_once(s,
'''           className="rounded-xl border-2 p-5 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(50,20,20,0.98) 0%, rgba(25,10,10,0.98) 100%)', borderColor: '#ff6a00', boxShadow: '0 0 50px rgba(255,106,0,0.3)' }}>
''',
'''           className="moria-panel w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-orange-300/20 p-4 sm:p-6 flex flex-col"
           style={{ boxShadow: '0 30px 90px rgba(0,0,0,.58), 0 0 55px rgba(249,115,22,.10)' }}>
''', 'world event panel')
s = s.replace('className="flex-1 overflow-y-auto space-y-2"', 'className="moria-scrollbar flex-1 overflow-y-auto space-y-2 pr-1"', 1)
write(p, s)

# ---------------------------------------------------------------------
# GameScreen: no CommonJS, online/local authority guardrails, event rewards,
# pet/stamina render cadence, derived max healing correctness.
# ---------------------------------------------------------------------
p = 'src/components/GameScreen.tsx'
s = read(p)
s = s.replace("import { createCorpse, rollLoot, CORPSE_LIFETIME, type GroundItem, type LootItem } from '../game/loot';", "import { createCorpse, createLootBag, rollLoot, CORPSE_LIFETIME, type GroundItem, type LootItem } from '../game/loot';")
s = s.replace("import { randomGemDrop, GEMS } from '../game/itemSets';", "import { randomGemDrop, GEMS } from '../game/itemSets';\nimport { RECIPES, canCraft } from '../game/crafting';")
s = replace_once(s,
'''  const lastBroadcastRef = useRef(0);
  const lastHudTickRef = useRef(0);
''',
'''  const lastBroadcastRef = useRef(0);
  const lastHudTickRef = useRef(0);
  const lastStaminaDrainRef = useRef(0);
''', 'stamina ref')
s = s.replace("  const [, setPetTick] = useState(0);\n", '')
s = replace_once(s,
'''    const { createLootBag } = require('../game/loot');
    groundItemsRef.current.push(createLootBag({ ...p.pos }, bagItems));
''',
'''    groundItemsRef.current.push(createLootBag({ ...p.pos }, bagItems));
''', 'loot require')
s = replace_once(s,
'''    const { RECIPES: recipes, canCraft } = require('../game/crafting');
    const recipe = recipes.find((r: any) => r.result.name === name);
''',
'''    const recipe = RECIPES.find((r) => r.result.name === name);
''', 'craft require')
s = replace_once(s,
'''      // Stamina decreases over time (1 min per 30s real time)
      if (now % 30000 < 20) {
        const currentStamina = getStamina(p);
        if (currentStamina > 0) saveStamina(p, currentStamina - 1);
      }
''',
'''      // Stamina decreases once per 30s. Modulo-based checks could execute on
      // multiple animation frames inside the same time window.
      if (now - lastStaminaDrainRef.current >= 30000) {
        lastStaminaDrainRef.current = now;
        const currentStamina = getStamina(p);
        if (currentStamina > 0) saveStamina(p, currentStamina - 1);
      }
''', 'stamina cadence')
s = s.replace('          setPetTick((t) => t + 1);\n', '')
s = replace_once(s,
'''        const result = contributeToWorldEvent(event.id, p.name, 1);
        addMessage('World', `🌍 ${event.name}: ${event.progress.current}/${event.progress.required} (${result.contribution} contributed)`, '#ff6a00', 'world');
        if (result.completed) {
          p.gold += event.rewardGold;
          p.xp += event.rewardXp;
          addMessage('System', `🌍 WORLD EVENT COMPLETE: ${event.name}! +${event.rewardGold}g, +${event.rewardXp} XP`, '#ffd700', 'system');
          addToast('loot', 'World Event Done!', `${event.name}: +${event.rewardGold}g +${event.rewardXp}XP`, event.icon, '#ff6a00');
          showRaidWarning('WORLD EVENT COMPLETE!', event.icon, '#ff6a00', 4000);
        }
''',
'''        const result = contributeToWorldEvent(event.id, p.name, 1);
        if (result.accepted > 0 && result.required > 0) {
          const rewardGold = Math.floor(event.rewardGold * (result.accepted / result.required));
          const rewardXp = Math.floor(event.rewardXp * (result.accepted / result.required));
          p.gold += rewardGold;
          p.xp += rewardXp;
          p.stats.goldEarned += rewardGold;
        }
        addMessage('World', `🌍 ${event.name}: ${result.current}/${result.required} (${result.contribution} contributed)`, '#ff6a00', 'world');
        if (result.completed) {
          addMessage('System', `🌍 WORLD EVENT COMPLETE: ${event.name}!`, '#ffd700', 'system');
          addToast('loot', 'World Event Done!', event.name, event.icon, '#ff6a00');
          showRaidWarning('WORLD EVENT COMPLETE!', event.icon, '#ff6a00', 4000);
        }
''', 'world event kill rewards')
# Derived max values for consumables/heals.
s = replace_once(s,
'''    const p = playerRef.current;
    if (type === 'hp') {
      if (p.hp >= p.maxHp) return;
      p.hp = Math.min(p.maxHp, p.hp + 50);
''',
'''    const p = playerRef.current;
    const potionDerived = computeDerivedStats(p);
    if (type === 'hp') {
      if (p.hp >= potionDerived.totalMaxHp) return;
      p.hp = Math.min(potionDerived.totalMaxHp, p.hp + 50);
''', 'hp potion derived')
s = s.replace('      if (p.mana >= p.maxMana) return;\n      p.mana = Math.min(p.maxMana, p.mana + 50);', '      if (p.mana >= potionDerived.totalMaxMana) return;\n      p.mana = Math.min(potionDerived.totalMaxMana, p.mana + 50);', 1)
s = s.replace('      if (p.hp >= p.maxHp) return;\n      p.hp = Math.min(p.maxHp, p.hp + 200);', '      if (p.hp >= potionDerived.totalMaxHp) return;\n      p.hp = Math.min(potionDerived.totalMaxHp, p.hp + 200);', 1)
s = s.replace('      p.hp = Math.min(p.maxHp, p.hp + heal);', '      p.hp = Math.min(derived.totalMaxHp, p.hp + heal);', 1)
s = s.replace('        p.hp = Math.min(p.maxHp, p.hp + heal);', '        p.hp = Math.min(derivedForSpell.totalMaxHp, p.hp + heal);', 1)
s = s.replace('        p.hp = Math.min(p.maxHp, p.hp + healAmt);', '        p.hp = Math.min(derivedForSpell.totalMaxHp, p.hp + healAmt);', 1)
# Local-only panels must not mutate client-only stores during authoritative play.
for label, old, new in [
    ('pet gate', '<TopButton icon="🐾" label="Pet" hotkey="" onClick={() => setShowPetShop(true)} />', '<TopButton icon="🐾" label="Pet" hotkey="" onClick={() => serverSync.isActive() ? addMessage(\'System\', \'Companions are local-only until server support lands.\', \'#ff9090\', \'system\') : setShowPetShop(true)} />'),
    ('depot gate', '<TopButton icon="🗄" label="Depot" hotkey="" onClick={() => setShowDepot(true)} />', '<TopButton icon="🗄" label="Depot" hotkey="" onClick={() => serverSync.isActive() ? addMessage(\'System\', \'Depot is local-only until server support lands.\', \'#ff9090\', \'system\') : setShowDepot(true)} />'),
    ('auction gate', '<TopButton icon="🏛" label="AH" hotkey="" onClick={() => { setShowAuction(true); }} />', '<TopButton icon="🏛" label="AH" hotkey="" onClick={() => serverSync.isActive() ? addMessage(\'System\', \'Auction House is local-only until server support lands.\', \'#ff9090\', \'system\') : setShowAuction(true)} />'),
    ('coin gate', '<TopButton icon="💎" label="Coins" hotkey="" onClick={() => { setShowCoinShop(true); }} />', '<TopButton icon="💎" label="Coins" hotkey="" onClick={() => serverSync.isActive() ? addMessage(\'System\', \'Coin Shop is local-only until server support lands.\', \'#ff9090\', \'system\') : setShowCoinShop(true)} />'),
    ('world gate', '<TopButton icon="🌍" label="World" hotkey="" onClick={() => setShowWorldEvents(true)} />', '<TopButton icon="🌍" label="World" hotkey="" onClick={() => serverSync.isActive() ? addMessage(\'System\', \'Browser world events are disabled in authoritative mode.\', \'#ff9090\', \'system\') : setShowWorldEvents(true)} />'),
    ('mail gate', '<TopButton icon="📮" label="Mail" hotkey="" onClick={() => setShowMail(true)} />', '<TopButton icon="📮" label="Mail" hotkey="" onClick={() => serverSync.isActive() ? addMessage(\'System\', \'Mail is local-only until server support lands.\', \'#ff9090\', \'system\') : setShowMail(true)} />'),
]:
    s = replace_once(s, old, new, label)
# Mail gold actually reaches the player.
s = replace_once(s,
'''            <MailBox player={player} inventory={inventory} setInventory={setInventory} onClose={() => setShowMail(false)} addMessage={addMessage} />
''',
'''            <MailBox
              player={player}
              inventory={inventory}
              setInventory={setInventory}
              onClose={() => setShowMail(false)}
              addMessage={addMessage}
              onClaimGold={(amount) => {
                const p = playerRef.current;
                p.gold += Math.max(0, Math.floor(amount));
                p.stats.goldEarned += Math.max(0, Math.floor(amount));
                setPlayer({ ...p });
              }}
            />
''', 'mail invocation')
# Pet purchases are transactional: no gold is lost if ownership write fails.
s = replace_once(s,
'''            <PetShop player={player} onClose={() => setShowPetShop(false)} onBuyPet={(petId, price) => {
              const p = playerRef.current;
              if (p.gold < price) { addMessage('System', 'Not enough gold.', '#ff9090', 'system'); return; }
              p.gold -= price;
              buyPet(p.name, petId);
              const pet = PETS.find((pd) => pd.id === petId);
              addMessage('System', `🐾 Tamed ${pet?.icon} ${pet?.name}!`, pet?.color || '#ff9bcc', 'system');
              addToast('info', 'New Companion!', `${pet?.name} joins you!`, pet?.icon || '🐾', pet?.color || '#ff9bcc');
              setPlayer({ ...p });
            }} />
''',
'''            <PetShop player={player} onClose={() => setShowPetShop(false)} onBuyPet={(petId, price) => {
              const p = playerRef.current;
              const pet = PETS.find((pd) => pd.id === petId);
              if (!pet) { addMessage('System', 'Unknown companion.', '#ff9090', 'system'); return false; }
              if (p.gold < price) { addMessage('System', 'Not enough gold.', '#ff9090', 'system'); return false; }
              if (!buyPet(p.name, petId)) { addMessage('System', 'Companion already owned.', '#ff9090', 'system'); return false; }
              p.gold -= price;
              addMessage('System', `🐾 Tamed ${pet.icon} ${pet.name}!`, pet.color, 'system');
              addToast('info', 'New Companion!', `${pet.name} joins you!`, pet.icon, pet.color);
              setPlayer({ ...p });
              return true;
            }} />
''', 'pet purchase transaction')
write(p, s)

# No CommonJS require() is allowed in browser source after this migration.
remaining = []
for path in Path('src').rglob('*'):
    if path.suffix not in {'.ts', '.tsx'}:
        continue
    text = path.read_text()
    if 'require(' in text:
        remaining.append(str(path))
if remaining:
    raise SystemExit('CommonJS require() remains in browser source: ' + ', '.join(remaining))

print('visual polish 3.5 source transform applied')
