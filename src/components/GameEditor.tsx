import { useState } from 'react';
import type { Player } from '../game/types';
import { VOCATIONS } from '../game/classes';
import { EQUIPMENT_LOOT, RARITY_COLORS } from '../game/equipment';
import { MAPS, MAP_WIDTH, MAP_HEIGHT } from '../game/maps';
import CityDesigner from './CityDesigner98';
import QuestGraphDesigner98 from './QuestGraphDesigner98';
import InteriorDesigner98 from './InteriorDesigner98';
import WorldDirector98 from './WorldDirector98';
import LivingRealmDirector916 from './LivingRealmDirector916';
import RoadToTenDirector926 from './RoadToTenDirector926';
import {
  getAllBooks, saveBook, deleteBook, type Book,
  getCustomNPCs, saveCustomNPC, deleteCustomNPC, type CustomNPC,
  getCustomMonsters, saveCustomMonster, deleteCustomMonster, type CustomMonster,
} from '../game/content';

const RC: Record<string, string> = RARITY_COLORS as Record<string, string>;

interface Props {
  player: Player;
  setPlayer: (p: Player) => void;
  onClose: () => void;
  onMapsChanged?: () => void;
}

type EditorTab = 'items' | 'spells' | 'classes' | 'maps' | 'quests98' | 'interiors98' | 'director98' | 'realm916' | 'road926' | 'books' | 'npcs' | 'monsters';
// Backward-compatible capability marker: City Designer · Live

export default function GameEditor({ player, setPlayer: _setPlayer, onClose, onMapsChanged }: Props) {
  const [tab, setTab] = useState<EditorTab>('items');

  const tabs: { id: EditorTab; label: string; icon: string }[] = [
    { id: 'items', label: 'Items · Preview', icon: '⚔' },
    { id: 'spells', label: 'Spells · Preview', icon: '🔮' },
    { id: 'classes', label: 'Classes · View', icon: '👤' },
    { id: 'maps', label: 'City Designer 2.0', icon: '🏙' },
    { id: 'quests98', label: 'Quest Graph 9.8', icon: '🕸' },
    { id: 'interiors98', label: 'Interiors 9.8', icon: '🚪' },
    { id: 'director98', label: 'World Director 9.8', icon: '🌍' },
    { id: 'realm916', label: 'Living Realm 9.16', icon: '🏰' },
    { id: 'road926', label: 'Road to 10 · 9.26', icon: '✦' },
    { id: 'books', label: 'Books', icon: '📚' },
    { id: 'npcs', label: 'NPCs', icon: '🧙' },
    { id: 'monsters', label: 'Monsters', icon: '👹' },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-50"
         style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="rounded-lg border-2 p-4 max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(80,0,80,0.95) 0%, rgba(30,0,30,0.98) 100%)', borderColor: '#ff00ff', boxShadow: '0 0 60px rgba(255,0,255,0.5)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #ff00ff 0%, #880088 100%)' }}>
            🔧 GAME EDITOR
          </h2>
          <button onClick={onClose} className="text-purple-200 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
                    className={`px-4 py-2 rounded font-bold text-sm tracking-wider transition-all ${
                      tab === t.id ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white' : 'bg-black/40 text-purple-300 hover:bg-purple-900/40'
                    }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {(['items', 'spells', 'classes'] as EditorTab[]).includes(tab) && (
          <div className="mb-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-[11px] text-amber-100/80">
            ⚠ This section is a design preview. Its data is not part of the live gameplay runtime yet, so it will not silently claim to change the active game. Books, NPCs and Monsters are live local content.
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {tab === 'items' && <ItemEditor />}
          {tab === 'spells' && <SpellEditor player={player} />}
          {tab === 'classes' && <ClassEditor player={player} />}
          {tab === 'maps' && <CityDesigner onApplied={onMapsChanged} />}
          {tab === 'quests98' && <QuestGraphDesigner98 />}
          {tab === 'interiors98' && <InteriorDesigner98 />}
          {tab === 'director98' && <WorldDirector98 />}
          {tab === 'realm916' && <LivingRealmDirector916 />}
          {tab === 'road926' && <RoadToTenDirector926 />}
          {tab === 'books' && <BookCreator />}
          {tab === 'npcs' && <NPCCreator />}
          {tab === 'monsters' && <MonsterCreator />}
        </div>
      </div>
    </div>
  );
}

// ============ ITEM EDITOR ============
function ItemEditor() {
  const [customItems, setCustomItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tibia_custom_items') || '[]'); } catch { return []; }
  });
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    id: '', name: '', icon: '⚔', slot: 'weapon', attack: 0, defense: 0, armor: 0,
    hp: 0, mana: 0, magic: 0, critChance: 0, lifesteal: 0, thorns: 0,
    moveSpeed: 0, xpBonus: 0, goldBonus: 0, damageReduction: 0,
    rarity: 'common', level: 1, value: 100, description: '',
  });

  const saveCustomItems = (items: any[]) => {
    setCustomItems(items);
    localStorage.setItem('tibia_custom_items', JSON.stringify(items));
  };

  const handleSave = () => {
    const item = { ...form, id: form.id || `custom_${Date.now()}` };
    const existing = customItems.findIndex((i: any) => i.id === item.id);
    const newItems = existing >= 0 ? customItems.map((i: any, idx: number) => idx === existing ? item : i) : [...customItems, item];
    saveCustomItems(newItems);
    setEditItem(null);
    setForm({ id: '', name: '', icon: '⚔', slot: 'weapon', attack: 0, defense: 0, armor: 0, hp: 0, mana: 0, magic: 0, critChance: 0, lifesteal: 0, thorns: 0, moveSpeed: 0, xpBonus: 0, goldBonus: 0, damageReduction: 0, rarity: 'common', level: 1, value: 100, description: '' });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-purple-300 tracking-widest mb-2">📦 ALL ITEMS ({EQUIPMENT_LOOT.length + customItems.length})</div>
        <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto">
          {[...EQUIPMENT_LOOT, ...customItems].map((item) => (
            <div key={item.id} className="p-1.5 rounded border text-xs cursor-pointer hover:scale-105 transition-all"
                 style={{ borderColor: RC[item.rarity] || '#aaa', background: `${RC[item.rarity] || '#aaa'}15` }}
                 onClick={() => { setEditItem(item); setForm({ ...item }); }}>
              <div className="text-lg text-center">{item.icon}</div>
              <div className="text-[9px] text-center truncate" style={{ color: RC[item.rarity] || '#aaa' }}>{item.name}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 rounded border-2 border-purple-600/50 bg-black/40">
        <div className="text-xs text-purple-300 tracking-widest mb-2">{editItem ? '✏ EDIT ITEM' : '➕ CREATE NEW ITEM'}</div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Icon" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
          <Field label="🔒 Equip Level" type="number" value={form.level} onChange={(v) => setForm({ ...form, level: parseInt(v) || 1 })} />
          <Field label="Value" type="number" value={form.value} onChange={(v) => setForm({ ...form, value: parseInt(v) || 0 })} />
          <SelectField label="Slot" value={form.slot} options={['weapon','armor','helmet','legs','boots','shield','ring','ring2','amulet','cloak','belt','gloves','relic']} onChange={(v) => setForm({ ...form, slot: v })} />
          <SelectField label="Rarity" value={form.rarity} options={['common','uncommon','rare','epic','legendary']} onChange={(v) => setForm({ ...form, rarity: v })} />
          <Field label="Attack" type="number" value={form.attack} onChange={(v) => setForm({ ...form, attack: parseInt(v) || 0 })} />
          <Field label="Defense" type="number" value={form.defense} onChange={(v) => setForm({ ...form, defense: parseInt(v) || 0 })} />
          <Field label="Armor" type="number" value={form.armor} onChange={(v) => setForm({ ...form, armor: parseInt(v) || 0 })} />
          <Field label="HP" type="number" value={form.hp} onChange={(v) => setForm({ ...form, hp: parseInt(v) || 0 })} />
          <Field label="Mana" type="number" value={form.mana} onChange={(v) => setForm({ ...form, mana: parseInt(v) || 0 })} />
          <Field label="Magic" type="number" value={form.magic} onChange={(v) => setForm({ ...form, magic: parseInt(v) || 0 })} />
          <Field label="Crit %" type="number" value={form.critChance} onChange={(v) => setForm({ ...form, critChance: parseInt(v) || 0 })} />
          <Field label="Lifesteal %" type="number" value={form.lifesteal} onChange={(v) => setForm({ ...form, lifesteal: parseInt(v) || 0 })} />
          <Field label="Thorns" type="number" value={form.thorns} onChange={(v) => setForm({ ...form, thorns: parseInt(v) || 0 })} />
          <Field label="Speed %" type="number" value={form.moveSpeed} onChange={(v) => setForm({ ...form, moveSpeed: parseInt(v) || 0 })} />
          <Field label="XP %" type="number" value={form.xpBonus} onChange={(v) => setForm({ ...form, xpBonus: parseInt(v) || 0 })} />
          <Field label="Gold %" type="number" value={form.goldBonus} onChange={(v) => setForm({ ...form, goldBonus: parseInt(v) || 0 })} />
          <Field label="Dmg Red %" type="number" value={form.damageReduction} onChange={(v) => setForm({ ...form, damageReduction: parseInt(v) || 0 })} />
          <div className="col-span-4"><Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} /></div>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={handleSave} className="px-4 py-2 rounded bg-gradient-to-b from-green-500 to-green-700 text-white font-bold text-xs">💾 {editItem ? 'Update' : 'Create'} Item</button>
          {editItem && (
            <button disabled title="Custom item runtime wiring is pending" className="cursor-not-allowed rounded bg-slate-800/70 px-4 py-2 text-xs font-bold text-slate-500">📦 Runtime wiring pending</button>
          )}
          {editItem && customItems.some((i: any) => i.id === editItem.id) && (
            <button onClick={() => { saveCustomItems(customItems.filter((i: any) => i.id !== editItem.id)); setEditItem(null); }} className="px-4 py-2 rounded bg-gradient-to-b from-red-500 to-red-700 text-white font-bold text-xs">🗑 Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ SPELL EDITOR ============
function SpellEditor({ player }: { player: Player }) {
  const [customSpells, setCustomSpells] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tibia_custom_spells') || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState<any>({
    id: '', name: '', icon: '✨', type: 'attack', mana: 10, cooldown: 2000, damage: 50, range: 5, color: '#9b59ff',
    levelRequired: 1, scalingCoeff: 1.0, critChance: 0, critMult: 2, lifestealPercent: 0, variance: 0.2,
    hitCount: 1, piercePercent: 0, damageType: 'energy',
  });

  const save = () => {
    const spell = { ...form, id: form.id || `spell_${Date.now()}`, lastCast: 0 };
    const existing = customSpells.findIndex((s: any) => s.id === spell.id);
    const newSpells = existing >= 0 ? customSpells.map((s: any, i: number) => i === existing ? spell : s) : [...customSpells, spell];
    setCustomSpells(newSpells);
    localStorage.setItem('tibia_custom_spells', JSON.stringify(newSpells));
    setForm({ id: '', name: '', icon: '✨', type: 'attack', mana: 10, cooldown: 2000, damage: 50, range: 5, color: '#9b59ff', levelRequired: 1, scalingCoeff: 1.0, critChance: 0, critMult: 2, lifestealPercent: 0, variance: 0.2, hitCount: 1, piercePercent: 0, damageType: 'energy' });
  };

  const vocation = VOCATIONS[player.vocation];
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-purple-300 tracking-widest mb-2">🔮 {vocation?.name} BUILT-IN SPELLS ({vocation?.spells.length})</div>
        <div className="grid grid-cols-2 gap-2">
          {vocation?.spells.map((spell, i) => (
            <div key={spell.id} className="p-2 rounded border bg-black/40" style={{ borderColor: spell.color + '60' }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl" style={{ filter: `drop-shadow(0 0 4px ${spell.color})` }}>{spell.icon}</span>
                <div className="flex-1">
                  <div className="font-bold text-xs" style={{ color: spell.color }}>{spell.name}</div>
                  <div className="text-[9px] text-purple-200/50">Hotkey {i + 1} · {spell.type} · {spell.mana}MP · {spell.damage}DMG</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 rounded border-2 border-purple-600/50 bg-black/40">
        <div className="text-xs text-purple-300 tracking-widest mb-2">➕ CREATE CUSTOM SPELL (DETAILED)</div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Icon" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
          <SelectField label="Type" value={form.type} options={['attack', 'heal', 'aoe', 'buff', 'summon']} onChange={(v) => setForm({ ...form, type: v })} />
          <SelectField label="Damage Type" value={form.damageType} options={['physical', 'fire', 'ice', 'energy', 'death', 'holy', 'nature']} onChange={(v) => setForm({ ...form, damageType: v })} />
          <Field label="Mana Cost" type="number" value={form.mana} onChange={(v) => setForm({ ...form, mana: parseInt(v) || 0 })} />
          <Field label="Base Damage" type="number" value={form.damage} onChange={(v) => setForm({ ...form, damage: parseInt(v) || 0 })} />
          <Field label="Cooldown (ms)" type="number" value={form.cooldown} onChange={(v) => setForm({ ...form, cooldown: parseInt(v) || 0 })} />
          <Field label="Range" type="number" value={form.range} onChange={(v) => setForm({ ...form, range: parseFloat(v) || 0 })} />
          <Field label="🔒 Level Req" type="number" value={form.levelRequired} onChange={(v) => setForm({ ...form, levelRequired: parseInt(v) || 1 })} />
          <Field label="Scaling Coeff" type="number" value={form.scalingCoeff} onChange={(v) => setForm({ ...form, scalingCoeff: parseFloat(v) || 1 })} />
          <Field label="Crit Chance %" type="number" value={form.critChance} onChange={(v) => setForm({ ...form, critChance: parseFloat(v) || 0 })} />
          <Field label="Crit Multiplier" type="number" value={form.critMult} onChange={(v) => setForm({ ...form, critMult: parseFloat(v) || 2 })} />
          <Field label="Lifesteal %" type="number" value={form.lifestealPercent} onChange={(v) => setForm({ ...form, lifestealPercent: parseFloat(v) || 0 })} />
          <Field label="Variance ±" type="number" value={form.variance} onChange={(v) => setForm({ ...form, variance: parseFloat(v) || 0.2 })} />
          <Field label="Hit Count" type="number" value={form.hitCount} onChange={(v) => setForm({ ...form, hitCount: parseInt(v) || 1 })} />
          <Field label="Pierce %" type="number" value={form.piercePercent} onChange={(v) => setForm({ ...form, piercePercent: parseFloat(v) || 0 })} />
          <Field label="Color (hex)" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
          <div className="flex items-end col-span-3"><div className="w-full h-8 rounded border border-purple-700/50" style={{ background: form.color }} /></div>
        </div>
        {/* Formula preview */}
        <div className="mt-2 p-2 rounded bg-black/50 border border-purple-700/30 text-[10px] text-purple-200/70 font-mono">
          <div className="text-purple-300 font-bold mb-0.5">📊 FORMULA PREVIEW (at Magic 20):</div>
          dmg = base({form.damage}) + magic·coeff({20 * (form.scalingCoeff || 1) * 0.5}) ± {(form.variance * 100).toFixed(0)}% ·
          {form.critChance > 0 ? ` crit ${(form.critChance)}% ×${form.critMult}` : ''}
          {form.piercePercent > 0 ? ` pierce ${form.piercePercent}% DEF` : ''}
          {form.hitCount > 1 ? ` ×${form.hitCount}hits` : ''}
          {form.lifestealPercent > 0 ? ` lifesteal ${form.lifestealPercent}%` : ''}
        </div>
        <button onClick={save} className="mt-2 px-4 py-2 rounded bg-gradient-to-b from-green-500 to-green-700 text-white font-bold text-xs">💾 Create Spell</button>
      </div>
      {customSpells.length > 0 && (
        <div>
          <div className="text-xs text-purple-300 tracking-widest mb-2">✦ CUSTOM SPELLS ({customSpells.length})</div>
          <div className="space-y-1">
            {customSpells.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded border border-purple-700/40 bg-black/40 text-xs">
                <span className="text-lg" style={{ color: s.color }}>{s.icon}</span>
                <div className="flex-1"><span className="text-purple-200 font-bold">{s.name}</span><span className="text-purple-200/50 text-[10px] ml-2">{s.type} · {s.mana}MP · {s.damage}DMG</span></div>
                <button onClick={() => { setForm(s); setCustomSpells(customSpells.filter((x: any) => x.id !== s.id)); }} className="text-amber-400 px-2 text-[10px]">Edit</button>
                <button onClick={() => { const f = customSpells.filter((x: any) => x.id !== s.id); setCustomSpells(f); localStorage.setItem('tibia_custom_spells', JSON.stringify(f)); }} className="text-red-400 px-2 text-[10px]">🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ CLASS EDITOR ============
function ClassEditor({ player }: { player: Player }) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-purple-300 tracking-widest mb-2">👤 ALL CLASSES ({Object.keys(VOCATIONS).length})</div>
      <div className="grid grid-cols-2 gap-3">
        {Object.values(VOCATIONS).map((v) => {
          const isActive = player.vocation === v.id;
          return (
            <div key={v.id} className={`p-3 rounded border-2 ${isActive ? 'border-amber-500 bg-amber-900/20' : 'border-purple-700/40 bg-black/40'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{v.icon}</span>
                <div>
                  <div className="font-bold text-sm" style={{ color: v.color }}>{v.name}</div>
                  <div className="text-[10px] text-purple-200/60">{v.description}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] mb-2">
                <div className="bg-black/40 rounded px-1 py-0.5"><span className="text-red-300">HP:</span> {v.baseHp}+{v.hpPerLevel}</div>
                <div className="bg-black/40 rounded px-1 py-0.5"><span className="text-blue-300">MP:</span> {v.baseMana}+{v.manaPerLevel}</div>
                <div className="bg-black/40 rounded px-1 py-0.5"><span className="text-amber-300">ATK:</span> {v.baseAttack}+{v.atkPerLevel}</div>
              </div>
              <div className="text-[9px] text-green-400">★ {v.passive}</div>
              <div className="mt-1 text-[9px] text-purple-200/50">{v.spells.map((s) => s.icon).join(' ')}</div>
              {isActive && <div className="mt-1 text-[10px] text-amber-400 font-bold">★ YOUR CLASS</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ BOOK CREATOR ============
function BookCreator() {
  const [books, setBooks] = useState<Book[]>(getAllBooks());
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [icon, setIcon] = useState('📖');
  const [color, setColor] = useState('#9b59ff');
  const [pages, setPages] = useState<string[]>(['']);

  const save = () => {
    if (!title.trim() || !pages[0].trim()) return;
    const book: Book = { id: `book_${Date.now()}`, title: title.trim(), author: author.trim() || 'Unknown', icon, color, pages: pages.filter((p) => p.trim()), createdAt: Date.now() };
    saveBook(book);
    setBooks(getAllBooks());
    setTitle(''); setAuthor(''); setPages(['']);
    alert(`📚 Book "${book.title}" added to the Library!`);
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-purple-300 tracking-widest mb-2">📚 EXISTING BOOKS ({books.length})</div>
      {books.length === 0 ? <div className="text-purple-200/40 text-xs italic">No books yet. Create one below!</div> : (
        <div className="grid grid-cols-5 gap-2">
          {books.map((b) => (
            <div key={b.id} className="p-2 rounded border text-center" style={{ borderColor: b.color, background: `${b.color}15` }}>
              <div className="text-2xl">{b.icon}</div>
              <div className="text-[9px] text-purple-200 truncate">{b.title}</div>
              <button onClick={() => { deleteBook(b.id); setBooks(getAllBooks()); }} className="text-red-400 text-[9px] mt-1">🗑</button>
            </div>
          ))}
        </div>
      )}
      <div className="p-3 rounded border-2 border-purple-600/50 bg-black/40 space-y-2">
        <div className="text-xs text-purple-300 tracking-widest">➕ CREATE BOOK</div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Author" value={author} onChange={setAuthor} />
          <Field label="Icon" value={icon} onChange={setIcon} />
          <div>
            <label className="text-[9px] text-purple-200/60 block mb-0.5">Color</label>
            <div className="flex gap-1">{['#9b59ff', '#c13030', '#2ecc71', '#3498db', '#f4e04d', '#ff8c00'].map((c) => (
              <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded border-2" style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }} />
            ))}</div>
          </div>
        </div>
        <div className="text-xs">
          <div className="flex items-center justify-between mb-1">
            <label className="text-purple-300 tracking-widest">📄 PAGES</label>
            <button onClick={() => setPages([...pages, ''])} className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-200 text-[10px] border border-purple-700/50">+ Add Page</button>
          </div>
          <div className="space-y-2">
            {pages.map((p, idx) => (
              <div key={idx} className="flex gap-1">
                <textarea value={p} onChange={(e) => { const np = [...pages]; np[idx] = e.target.value; setPages(np); }} rows={2} placeholder={`Page ${idx + 1}...`} className="flex-1 px-2 py-1 rounded bg-black/60 border border-purple-700/40 text-purple-100" />
                {pages.length > 1 && <button onClick={() => setPages(pages.filter((_, i) => i !== idx))} className="text-red-400 px-1">✕</button>}
              </div>
            ))}
          </div>
        </div>
        <button onClick={save} className="w-full py-2 rounded bg-gradient-to-b from-green-500 to-green-700 text-white font-bold text-xs">💾 Add to Library</button>
      </div>
    </div>
  );
}

// ============ NPC CREATOR ============
function NPCCreator() {
  const [npcs, setNpcs] = useState<CustomNPC[]>(getCustomNPCs());
  const [form, setForm] = useState({ name: '', emoji: '🧙', color: '#9bd4ff', role: 'guard', mapId: 'eldoria', posX: 40, posY: 42, dialogueText: 'Greetings, traveler!' });

  const save = () => {
    const name = form.name.trim().slice(0, 64);
    if (!name || !MAPS[form.mapId]) return;
    const npc: CustomNPC = {
      id: `npc_${Date.now()}`, ...form, name,
      emoji: form.emoji.trim().slice(0, 8) || '🧙',
      posX: Math.max(0, Math.min(MAP_WIDTH - 1, Math.floor(form.posX))),
      posY: Math.max(0, Math.min(MAP_HEIGHT - 1, Math.floor(form.posY))),
      dialogueText: form.dialogueText.trim().slice(0, 600) || 'Greetings, traveler!',
      createdAt: Date.now(),
    };
    saveCustomNPC(npc);
    setNpcs(getCustomNPCs());
    setForm({ name: '', emoji: '🧙', color: '#9bd4ff', role: 'guard', mapId: form.mapId, posX: 40, posY: 42, dialogueText: 'Greetings, traveler!' });
    alert(`🧙 NPC "${npc.name}" created in ${MAPS[npc.mapId || 'eldoria']?.name || 'Eldoria'}! Close the editor to refresh the world.`);
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-purple-300 tracking-widest mb-2">🧙 CUSTOM NPCs ({npcs.length})</div>
      {npcs.length > 0 && (
        <div className="space-y-1">
          {npcs.map((n) => (
            <div key={n.id} className="flex items-center gap-2 p-2 rounded border border-purple-700/40 bg-black/40 text-xs">
              <span className="text-lg">{n.emoji}</span>
              <div className="flex-1"><span className="text-purple-200 font-bold">{n.name}</span><span className="text-purple-200/50 text-[10px] ml-2">{MAPS[n.mapId || 'eldoria']?.name || n.mapId || 'Eldoria'} · {n.role} · {n.posX},{n.posY}</span></div>
              <button onClick={() => { deleteCustomNPC(n.id); setNpcs(getCustomNPCs()); }} className="text-red-400 text-[10px]">🗑</button>
            </div>
          ))}
        </div>
      )}
      <div className="p-3 rounded border-2 border-purple-600/50 bg-black/40 space-y-2">
        <div className="text-xs text-purple-300 tracking-widest">➕ CREATE NPC</div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Emoji" value={form.emoji} onChange={(v) => setForm({ ...form, emoji: v })} />
          <SelectField label="Role" value={form.role} options={['guard', 'merchant', 'quest', 'innkeeper', 'banker', 'trainer']} onChange={(v) => setForm({ ...form, role: v })} />
          <SelectField label="Map" value={form.mapId} options={Object.keys(MAPS)} optionLabels={Object.fromEntries(Object.values(MAPS).map((m) => [m.id, m.name]))} onChange={(v) => setForm({ ...form, mapId: v })} />
          <div>
            <label className="text-[9px] text-purple-200/60 block mb-0.5">Color</label>
            <div className="flex gap-1">{['#9bd4ff', '#9b59ff', '#f4e04d', '#2ecc71', '#ff8c00', '#ff9bcc'].map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })} className="w-5 h-5 rounded border" style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent' }} />
            ))}</div>
          </div>
          <Field label="Pos X" type="number" value={form.posX} onChange={(v) => setForm({ ...form, posX: parseInt(v) || 40 })} />
          <Field label="Pos Y" type="number" value={form.posY} onChange={(v) => setForm({ ...form, posY: parseInt(v) || 42 })} />
        </div>
        <div>
          <label className="text-[9px] text-purple-200/60 block mb-0.5">Dialogue Text</label>
          <textarea value={form.dialogueText} onChange={(e) => setForm({ ...form, dialogueText: e.target.value })} rows={2} className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/40 text-purple-100 text-xs" />
        </div>
        <button onClick={save} className="w-full py-2 rounded bg-gradient-to-b from-green-500 to-green-700 text-white font-bold text-xs">💾 Create NPC</button>
      </div>
    </div>
  );
}

// ============ MONSTER CREATOR ============
function MonsterCreator() {
  const [monsters, setMonsters] = useState<CustomMonster[]>(getCustomMonsters());
  const [form, setForm] = useState({ name: '', emoji: '👹', color: '#c13030', hp: 100, attack: 15, defense: 5, speed: 1100, xp: 50, size: 1, type: 'normal' as 'normal' | 'elite' | 'boss', level: 5, mapId: 'eldoria', posX: 25, posY: 25 });

  const save = () => {
    const name = form.name.trim().slice(0, 64);
    if (!name || !MAPS[form.mapId]) return;
    const m: CustomMonster = {
      id: `monster_${Date.now()}`, ...form, name,
      emoji: form.emoji.trim().slice(0, 8) || '👹',
      hp: Math.max(1, Math.min(1_000_000, Math.floor(form.hp))),
      attack: Math.max(0, Math.min(100_000, Math.floor(form.attack))),
      defense: Math.max(0, Math.min(100_000, Math.floor(form.defense))),
      speed: Math.max(100, Math.min(60_000, Math.floor(form.speed))),
      xp: Math.max(0, Math.min(10_000_000, Math.floor(form.xp))),
      size: Math.max(0.5, Math.min(4, Number(form.size) || 1)),
      level: Math.max(1, Math.min(999, Math.floor(form.level))),
      posX: Math.max(0, Math.min(MAP_WIDTH - 1, Math.floor(form.posX))),
      posY: Math.max(0, Math.min(MAP_HEIGHT - 1, Math.floor(form.posY))),
      createdAt: Date.now(),
    };
    saveCustomMonster(m);
    setMonsters(getCustomMonsters());
    setForm({ name: '', emoji: '👹', color: '#c13030', hp: 100, attack: 15, defense: 5, speed: 1100, xp: 50, size: 1, type: 'normal', level: 5, mapId: form.mapId, posX: 25, posY: 25 });
    alert(`👹 Monster "${m.name}" created in ${MAPS[m.mapId || 'eldoria']?.name || 'Eldoria'}! Close the editor to refresh the world.`);
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-purple-300 tracking-widest mb-2">👹 CUSTOM MONSTERS ({monsters.length})</div>
      {monsters.length > 0 && (
        <div className="space-y-1">
          {monsters.map((m) => (
            <div key={m.id} className="flex items-center gap-2 p-2 rounded border border-purple-700/40 bg-black/40 text-xs">
              <span className="text-lg">{m.emoji}</span>
              <div className="flex-1"><span className="text-purple-200 font-bold">{m.name}</span><span className="text-purple-200/50 text-[10px] ml-2">{MAPS[m.mapId || 'eldoria']?.name || m.mapId || 'Eldoria'} · Lv{m.level} {m.type} · {m.hp}HP {m.attack}ATK · {m.posX},{m.posY}</span></div>
              <button onClick={() => { deleteCustomMonster(m.id); setMonsters(getCustomMonsters()); }} className="text-red-400 text-[10px]">🗑</button>
            </div>
          ))}
        </div>
      )}
      <div className="p-3 rounded border-2 border-purple-600/50 bg-black/40 space-y-2">
        <div className="text-xs text-purple-300 tracking-widest">➕ CREATE MONSTER</div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Emoji" value={form.emoji} onChange={(v) => setForm({ ...form, emoji: v })} />
          <SelectField label="Type" value={form.type} options={['normal', 'elite', 'boss']} onChange={(v) => setForm({ ...form, type: v as 'normal' | 'elite' | 'boss' })} />
          <SelectField label="Map" value={form.mapId} options={Object.keys(MAPS)} optionLabels={Object.fromEntries(Object.values(MAPS).map((m) => [m.id, m.name]))} onChange={(v) => setForm({ ...form, mapId: v })} />
          <Field label="Level" type="number" value={form.level} onChange={(v) => setForm({ ...form, level: parseInt(v) || 1 })} />
          <Field label="HP" type="number" value={form.hp} onChange={(v) => setForm({ ...form, hp: parseInt(v) || 1 })} />
          <Field label="Attack" type="number" value={form.attack} onChange={(v) => setForm({ ...form, attack: parseInt(v) || 1 })} />
          <Field label="Defense" type="number" value={form.defense} onChange={(v) => setForm({ ...form, defense: parseInt(v) || 0 })} />
          <Field label="XP" type="number" value={form.xp} onChange={(v) => setForm({ ...form, xp: parseInt(v) || 1 })} />
          <Field label="Speed ms" type="number" value={form.speed} onChange={(v) => setForm({ ...form, speed: parseInt(v) || 1000 })} />
          <Field label="Size" type="number" value={form.size} onChange={(v) => setForm({ ...form, size: parseFloat(v) || 1 })} />
          <Field label="Pos X" type="number" value={form.posX} onChange={(v) => setForm({ ...form, posX: parseInt(v) || 25 })} />
          <Field label="Pos Y" type="number" value={form.posY} onChange={(v) => setForm({ ...form, posY: parseInt(v) || 25 })} />
          <div>
            <label className="text-[9px] text-purple-200/60 block mb-0.5">Color</label>
            <div className="flex gap-1">{['#c13030', '#4a7c3a', '#9b59ff', '#3498db', '#f4e04d', '#8b0000'].map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })} className="w-5 h-5 rounded border" style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent' }} />
            ))}</div>
          </div>
        </div>
        <button onClick={save} className="w-full py-2 rounded bg-gradient-to-b from-green-500 to-green-700 text-white font-bold text-xs">💾 Create Monster</button>
      </div>
    </div>
  );
}

// ============ SHARED ============
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[9px] text-purple-200/60 block mb-0.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100 text-xs focus:outline-none focus:border-purple-500" />
    </div>
  );
}

function SelectField({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: Record<string, string>; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[9px] text-purple-200/60 block mb-0.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/40 text-purple-100">
        {options.map((o) => <option key={o} value={o}>{optionLabels?.[o] || o}</option>)}
      </select>
    </div>
  );
}
