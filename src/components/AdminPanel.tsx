import type { Player, Monster, Item } from '../game/types';
import { EQUIPMENT_LOOT } from '../game/equipment';
import { VOCATIONS } from '../game/classes';
import { dpsMeter } from '../game/dpsMeter';

interface Props {
  player: Player;
  setPlayer: (p: Player) => void;
  monstersRef: React.MutableRefObject<Monster[]>;
  inventoryRef: React.MutableRefObject<Item[]>;
  setInventory: (items: Item[]) => void;
  onClose: () => void;
  addMessage: (sender: string, text: string, color: string, channel: 'world' | 'system' | 'battle' | 'loot' | 'quest') => void;
  addToast: (type: 'achievement' | 'quest' | 'levelup' | 'loot' | 'info' | 'warning', title: string, description: string, icon: string, color: string) => void;
  godMode: boolean;
  setGodMode: (v: boolean) => void;
  noClip: boolean;
  setNoClip: (v: boolean) => void;
  oneHitKill: boolean;
  setOneHitKill: (v: boolean) => void;
  xpMultiplier: number;
  setXpMultiplier: (v: number) => void;
  damageMultiplier: number;
  setDamageMultiplier: (v: number) => void;
  setDayTime: (v: number) => void;
  weather: 'clear' | 'rain' | 'snow' | 'storm';
  setWeather: (v: 'clear' | 'rain' | 'snow' | 'storm') => void;
  onOpenEditor: () => void;
  onOpenQuestCreator: () => void;
  onSetSkull?: (skull: string) => void;
  onOpenWorldEventCreator?: () => void;
}

export default function AdminPanel({
  player, setPlayer, monstersRef, inventoryRef, setInventory, onClose,
  addMessage, addToast, godMode, setGodMode, noClip, setNoClip,
  oneHitKill, setOneHitKill, xpMultiplier, setXpMultiplier,
  damageMultiplier, setDamageMultiplier, setDayTime,
  weather, setWeather, onOpenEditor, onOpenQuestCreator, onSetSkull, onOpenWorldEventCreator,
}: Props) {
  const giveXP = (amount: number) => {
    const p = { ...player };
    p.xp += amount;
    const voc = VOCATIONS[p.vocation];
    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level++;
      p.xpNext = Math.floor(p.xpNext * 1.4);
      if (voc) {
        p.maxHp += voc.hpPerLevel;
        p.maxMana += voc.manaPerLevel;
        p.attack += voc.atkPerLevel;
        p.defense += voc.defPerLevel;
        p.magic += voc.magPerLevel;
      }
      p.hp = p.maxHp;
      p.mana = p.maxMana;
      p.stats.levelUps++;
    }
    setPlayer(p);
    addMessage('Admin', `+${amount} XP (now level ${p.level})`, '#ff00ff', 'system');
    addToast('info', 'Admin', `+${amount} XP`, '⚡', '#ff00ff');
  };

  const giveGold = (amount: number) => {
    const p = { ...player };
    p.gold += amount;
    p.stats.goldEarned += amount;
    setPlayer(p);
    addMessage('Admin', `+${amount} gold`, '#f4e04d', 'system');
  };

  const maxSkills = () => {
    const p = { ...player };
    for (const key of Object.keys(p.skills) as Array<keyof typeof p.skills>) {
      p.skills[key] = { level: 100, progress: 0 };
    }
    p.attack += 200;
    p.defense += 100;
    p.magic += 200;
    setPlayer(p);
    addMessage('Admin', 'All skills maxed!', '#ff00ff', 'system');
  };

  const maxStats = () => {
    const p = { ...player };
    p.maxHp = 9999;
    p.hp = 9999;
    p.maxMana = 9999;
    p.mana = 9999;
    p.attack = 999;
    p.defense = 500;
    p.magic = 500;
    setPlayer(p);
    addMessage('Admin', 'Stats maxed!', '#ff00ff', 'system');
  };

  const giveAllItems = () => {
    const newItems: Item[] = [...inventoryRef.current];
    for (const eq of EQUIPMENT_LOOT) {
      if (!newItems.find((i) => i.name === eq.name)) {
        newItems.push({
          id: `admin_${eq.id}`,
          name: eq.name,
          icon: eq.icon,
          type: 'equipment',
          quantity: 1,
          value: eq.value,
          equipment: eq,
        });
      }
    }
    // Add lots of potions
    const hpPot = newItems.find((i) => i.id === 'hp1');
    if (hpPot) hpPot.quantity = 999;
    const mpPot = newItems.find((i) => i.id === 'mp1');
    if (mpPot) mpPot.quantity = 999;
    const hpgPot = newItems.find((i) => i.id === 'hpg');
    if (hpgPot) hpgPot.quantity = 999;
    else newItems.push({ id: 'hpg', name: 'Greater Health Potion', icon: '🍷', type: 'potion', quantity: 999, value: 150 });
    inventoryRef.current = newItems;
    setInventory(newItems);
    addMessage('Admin', 'All items given!', '#ff00ff', 'system');
  };

  const killAllMonsters = () => {
    let count = 0;
    for (const m of monstersRef.current) {
      if (!m.dead) {
        m.dead = true;
        m.respawnAt = Date.now() + 60000;
        count++;
      }
    }
    addMessage('Admin', `Killed ${count} monsters`, '#ff00ff', 'system');
  };

  const teleportTo = (x: number, y: number) => {
    const p = { ...player };
    p.pos = { x, y };
    setPlayer(p);
    addMessage('Admin', `Teleported to ${x},${y}`, '#ff00ff', 'system');
  };

  const resetAccount = () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const giveMounts = () => {
    const p = { ...player };
    p.level = Math.max(p.level, 25);
    p.mounted = true;
    p.mountId = 'dragon';
    p.speed = 180 / (1 + 0.75);
    setPlayer(p);
    addMessage('Admin', 'All mounts unlocked! Dragon equipped.', '#ff00ff', 'system');
    addToast('info', 'Admin', 'Dragon Mount unlocked', '🐉', '#ff00ff');
  };

  const healFull = () => {
    const p = { ...player };
    p.hp = p.maxHp;
    p.mana = p.maxMana;
    setPlayer(p);
    addMessage('Admin', 'Fully healed!', '#2ecc71', 'system');
  };

  const locations = [
    { name: '🏰 Town Center', x: 40, y: 40 },
    { name: '🏦 Bank', x: 34, y: 38 },
    { name: '🛏 Inn', x: 49, y: 38 },
    { name: '🌊 Lake', x: 18, y: 18 },
    { name: '🔥 Lava Pit', x: 65, y: 65 },
    { name: '👑 Orc King Lair', x: 13, y: 59 },
    { name: '🐉 Dragon Lord', x: 67, y: 67 },
    { name: '🧙 Lich', x: 56, y: 45 },
  ];

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg border-2 p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(80,0,80,0.95) 0%, rgba(30,0,30,0.98) 100%)',
          borderColor: '#ff00ff',
          boxShadow: '0 0 60px rgba(255,0,255,0.5)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #ff00ff 0%, #880088 100%)' }}>
            ⚡ ADMIN PANEL
          </h2>
          <button onClick={onClose} className="text-purple-200 hover:text-white text-xl">✕</button>
        </div>

        <div className="text-xs text-purple-300/80 mb-3 italic">
          Ctrl+Shift+A to toggle · God Mode · Cheats · Debug
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Toggles */}
          <div className="space-y-2">
            <SectionTitle>🎛 TOGGLES</SectionTitle>
            <ToggleButton label="God Mode (Invincible)" active={godMode} onClick={() => setGodMode(!godMode)} icon="👼" />
            <ToggleButton label="NoClip (Walk Through)" active={noClip} onClick={() => setNoClip(!noClip)} icon="👻" />
            <ToggleButton label="One-Hit Kill" active={oneHitKill} onClick={() => setOneHitKill(!oneHitKill)} icon="💀" />

            <SectionTitle>⚡ MULTIPLIERS</SectionTitle>
            <div className="bg-black/40 rounded p-2 space-y-2 border border-purple-700/40">
              <div>
                <label className="text-xs text-purple-200">XP Multiplier: {xpMultiplier}x</label>
                <input type="range" min="1" max="100" value={xpMultiplier}
                       onChange={(e) => setXpMultiplier(parseInt(e.target.value))}
                       className="w-full accent-purple-500" />
              </div>
              <div>
                <label className="text-xs text-purple-200">Damage Multiplier: {damageMultiplier}x</label>
                <input type="range" min="1" max="100" value={damageMultiplier}
                       onChange={(e) => setDamageMultiplier(parseInt(e.target.value))}
                       className="w-full accent-purple-500" />
              </div>
            </div>

            <SectionTitle>🌅 TIME</SectionTitle>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setDayTime(60)} className="flex-1 px-2 py-1 text-xs bg-yellow-900/40 hover:bg-yellow-700/60 rounded border border-yellow-600/50">☀ Day</button>
              <button onClick={() => setDayTime(150)} className="flex-1 px-2 py-1 text-xs bg-blue-900/40 hover:bg-blue-700/60 rounded border border-blue-600/50">🌙 Night</button>
              <button onClick={() => setDayTime(30)} className="flex-1 px-2 py-1 text-xs bg-orange-900/40 hover:bg-orange-700/60 rounded border border-orange-600/50">🌅 Dawn</button>
              <button onClick={() => setDayTime(120)} className="flex-1 px-2 py-1 text-xs bg-red-900/40 hover:bg-red-700/60 rounded border border-red-600/50">🌆 Dusk</button>
            </div>

            <SectionTitle>🌦 WEATHER</SectionTitle>
            <div className="grid grid-cols-2 gap-1">
              {(['clear', 'rain', 'snow', 'storm'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  className={`px-2 py-1 text-xs rounded border transition-all ${
                    weather === w
                      ? 'bg-purple-700/60 border-purple-500 text-white'
                      : 'bg-black/40 border-purple-700/40 text-purple-300 hover:border-purple-500'
                  }`}
                >
                  {w === 'clear' ? '☀ Clear' : w === 'rain' ? '🌧 Rain' : w === 'snow' ? '❄ Snow' : '⛈ Storm'}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <SectionTitle>💪 CHARACTER</SectionTitle>
            <div className="grid grid-cols-2 gap-1">
              <AdminButton onClick={() => giveXP(100)} icon="⚡" label="+100 XP" />
              <AdminButton onClick={() => giveXP(1000)} icon="⚡" label="+1k XP" />
              <AdminButton onClick={() => giveXP(10000)} icon="⚡" label="+10k XP" />
              <AdminButton onClick={() => giveXP(100000)} icon="⚡" label="+100k XP" />
              <AdminButton onClick={() => giveGold(1000)} icon="🪙" label="+1k Gold" />
              <AdminButton onClick={() => giveGold(10000)} icon="🪙" label="+10k Gold" />
              <AdminButton onClick={healFull} icon="💚" label="Full Heal" />
              <AdminButton onClick={maxStats} icon="💪" label="Max Stats" />
              <AdminButton onClick={maxSkills} icon="🎯" label="Max Skills" />
              <AdminButton onClick={giveMounts} icon="🐉" label="All Mounts" />
              <AdminButton onClick={giveAllItems} icon="📦" label="All Items" />
              <AdminButton onClick={() => {
                const p = { ...player };
                // Unlock all achievements
                p.achievements = ['first_blood','hunter_10','hunter_100','slayer','first_boss',
                  'dragon_slayer','level_5','level_10','level_20','level_30','rich',
                  'millionaire','walker','wanderer','tank','destroyer','healer','survivor','mage'];
                setPlayer(p);
                addMessage('Admin', 'All achievements unlocked!', '#ff8c00', 'system');
              }} icon="🏆" label="All Achievements" />
              <AdminButton onClick={() => {
                const p = { ...player };
                p.blessings = 5;
                p.aol = true;
                setPlayer(p);
                addMessage('Admin', 'All 5 Blessings + AOL activated!', '#f4e04d', 'system');
              }} icon="✨" label="All Blessings" />
              <AdminButton onClick={() => {
                // Unlock all bestiary
                const data: Record<string, number> = {};
                ['Rat','Snake','Spider','Wolf','Bear','Orc','Orc Warrior','Skeleton','Ghost',
                 'Troll','Demon','Orc King','Lich','Dragon Lord'].forEach((n) => { data[n] = 999; });
                localStorage.setItem(`tibia_bestiary_${player.name}`, JSON.stringify(data));
                addMessage('Admin', 'Bestiary fully unlocked!', '#f4e04d', 'system');
              }} icon="📖" label="Unlock Bestiary" />
              <AdminButton onClick={() => {
                localStorage.removeItem(`tibia_talents_${player.name}`);
                addMessage('Admin', 'Talents reset (free)!', '#ff00ff', 'system');
              }} icon="🌟" label="Reset Talents" />
            </div>

            <SectionTitle>🗺 TELEPORT</SectionTitle>
            <div className="grid grid-cols-2 gap-1">
              {locations.map((l) => (
                <AdminButton key={l.name} onClick={() => teleportTo(l.x, l.y)} label={l.name} />
              ))}
            </div>
          </div>

          {/* World Actions */}
          <div className="space-y-2">
            <SectionTitle>📊 DPS METER</SectionTitle>
            <div className="grid grid-cols-1 gap-1">
              <AdminButton onClick={() => {
                dpsMeter.start();
                addMessage('Admin', 'DPS Meter started!', '#ff6060', 'system');
              }} icon="▶" label="Start DPS" />
              <AdminButton onClick={() => {
                dpsMeter.stop();
                addMessage('Admin', 'DPS Meter stopped!', '#ff6060', 'system');
              }} icon="⏹" label="Stop DPS" />
              <AdminButton onClick={() => {
                dpsMeter.clear();
                addMessage('Admin', 'DPS Meter cleared!', '#ff6060', 'system');
              }} icon="🔄" label="Clear DPS" />
            </div>

            <SectionTitle>🎯 LEVEL SET</SectionTitle>
            <div className="grid grid-cols-3 gap-1">
              {[1, 5, 10, 15, 20, 25, 30, 40, 50].map((lv) => (
                <AdminButton key={lv} onClick={() => {
                  const p = { ...player };
                  p.level = lv;
                  p.xpNext = Math.floor(100 * Math.pow(1.4, lv - 1));
                  const voc = VOCATIONS[p.vocation];
                  if (voc) {
                    p.maxHp = voc.baseHp + voc.hpPerLevel * (lv - 1);
                    p.maxMana = voc.baseMana + voc.manaPerLevel * (lv - 1);
                    p.attack = voc.baseAttack + voc.atkPerLevel * (lv - 1);
                    p.defense = voc.baseDefense + voc.defPerLevel * (lv - 1);
                    p.magic = voc.baseMagic + voc.magPerLevel * (lv - 1);
                  }
                  p.hp = p.maxHp;
                  p.mana = p.maxMana;
                  setPlayer(p);
                  addMessage('Admin', `Level set to ${lv}!`, '#ff00ff', 'system');
                }} label={`Lv ${lv}`} />
              ))}
            </div>

            <SectionTitle>💀 SKULL / PVP</SectionTitle>
            <div className="grid grid-cols-3 gap-1">
              {(['none', 'white', 'yellow', 'orange', 'red', 'black'] as const).map((sk) => (
                <AdminButton key={sk} onClick={() => onSetSkull?.(sk)} label={sk === 'none' ? '🟢 Clear' : sk === 'white' ? '⚪ White' : sk === 'yellow' ? '🟡 Yellow' : sk === 'orange' ? '🟠 Orange' : sk === 'red' ? '🔴 Red' : '⚫ Black'} />
              ))}
            </div>

            <SectionTitle>🌍 WORLD</SectionTitle>
            <div className="grid grid-cols-1 gap-1">
              <AdminButton onClick={killAllMonsters} icon="💀" label="Kill All Monsters" color="red" />
              <AdminButton onClick={() => {
                for (const m of monstersRef.current) {
                  m.dead = false;
                  m.hp = m.maxHp;
                  m.pos = { ...m.respawnPos };
                }
                addMessage('Admin', 'All monsters respawned', '#ff00ff', 'system');
              }} icon="🔄" label="Respawn All" />
              <AdminButton onClick={() => {
                const p = { ...player };
                p.quests = [];
                p.activeQuests = [];
                setPlayer(p);
                addMessage('Admin', 'Quests reset', '#ff00ff', 'system');
              }} icon="📜" label="Reset Quests" />
              <AdminButton onClick={() => {
                const p = { ...player };
                p.achievements = [];
                setPlayer(p);
                addMessage('Admin', 'Achievements reset', '#ff00ff', 'system');
              }} icon="🏆" label="Reset Achievements" />
            </div>

            <SectionTitle>🔧 EDITOR</SectionTitle>
            <div className="grid grid-cols-1 gap-1">
              <AdminButton onClick={onOpenEditor} icon="🔧" label="Game Editor (Items/Spells/Maps/NPCs/Monsters/Books)" />
              <AdminButton onClick={onOpenQuestCreator} icon="✦" label="Mystery Quest Creator" />
              {onOpenWorldEventCreator && <AdminButton onClick={onOpenWorldEventCreator} icon="🌍" label="World Event Creator" />}
            </div>

            <SectionTitle>💾 DATA</SectionTitle>
            <div className="grid grid-cols-1 gap-1">
              <AdminButton onClick={() => {
                const data = {
                  player: player,
                  inventory: inventoryRef.current,
                  accounts: JSON.parse(localStorage.getItem('tibia_accounts') || '[]'),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tibia-save-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                addMessage('Admin', 'Save exported', '#ff00ff', 'system');
              }} icon="💾" label="Export Save" />
              <AdminButton onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const data = JSON.parse(ev.target?.result as string);
                      if (data.player) setPlayer(data.player);
                      if (data.inventory) { inventoryRef.current = data.inventory; setInventory(data.inventory); }
                      addMessage('Admin', 'Save imported', '#ff00ff', 'system');
                    } catch {
                      addMessage('Admin', 'Import failed', '#ff0000', 'system');
                    }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }} icon="📥" label="Import Save" />
              <AdminButton onClick={resetAccount} icon="🗑" label="Reset All Data" color="red" />
            </div>

            <SectionTitle>📊 PLAYER INFO</SectionTitle>
            <div className="bg-black/40 rounded p-2 text-[10px] text-purple-200 space-y-0.5 border border-purple-700/40 font-mono">
              <div>Name: <span className="text-white">{player.name}</span></div>
              <div>Class: <span className="text-white">{player.vocation}</span></div>
              <div>Level: <span className="text-white">{player.level}</span></div>
              <div>XP: <span className="text-white">{player.xp}/{player.xpNext}</span></div>
              <div>Pos: <span className="text-white">{player.pos.x},{player.pos.y}</span></div>
              <div>HP: <span className="text-white">{player.hp}/{player.maxHp}</span></div>
              <div>Mana: <span className="text-white">{player.mana}/{player.maxMana}</span></div>
              <div>Gold: <span className="text-white">{player.gold}</span></div>
              <div>Kills: <span className="text-white">{player.stats.monstersKilled}</span></div>
              <div>Deaths: <span className="text-white">{player.stats.deaths}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] text-purple-300 tracking-widest font-bold border-b border-purple-700/50 pb-0.5">{children}</div>;
}

function ToggleButton({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 text-xs rounded border-2 transition-all flex items-center gap-2 ${
        active
          ? 'bg-gradient-to-r from-green-700/60 to-green-900/60 border-green-500 text-green-200 shadow-[0_0_15px_rgba(0,255,0,0.3)]'
          : 'bg-black/40 border-purple-700/40 text-purple-300 hover:border-purple-500'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <span className={`w-8 h-4 rounded-full transition-all relative ${active ? 'bg-green-500' : 'bg-gray-700'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-4' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

function AdminButton({ onClick, icon, label, color = 'purple' }: { onClick: () => void; icon?: string; label: string; color?: 'purple' | 'red' }) {
  const colors = color === 'red'
    ? 'bg-red-900/40 hover:bg-red-700/60 border-red-600/50 text-red-200'
    : 'bg-purple-900/40 hover:bg-purple-700/60 border-purple-600/50 text-purple-200';
  return (
    <button onClick={onClick}
            className={`px-2 py-1.5 text-xs rounded border transition-all hover:scale-[1.02] ${colors} flex items-center gap-1.5`}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
