import { useState } from 'react';
import { getCustomMysteryQuests, addMysteryQuest, deleteMysteryQuest, type MysteryQuest, type MysteryChapter } from '../game/questCreator';

interface Props {
  onClose: () => void;
}

export default function QuestCreator({ onClose }: Props) {
  const [customQuests, setCustomQuests] = useState(getCustomMysteryQuests());
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📜');
  const [intro, setIntro] = useState('');
  const [requiredLevel, setRequiredLevel] = useState(1);
  const [rewardGold, setRewardGold] = useState(500);
  const [rewardXp, setRewardXp] = useState(500);
  const [rewardItemName, setRewardItemName] = useState('');
  const [rewardItemIcon, setRewardItemIcon] = useState('🎁');
  const [chapters, setChapters] = useState<MysteryChapter[]>([
    { clue: '', riddle: '', answer: '', hint: '' },
  ]);
  const [error, setError] = useState('');

  const updateChapter = (idx: number, field: keyof MysteryChapter, value: string) => {
    const newChapters = [...chapters];
    newChapters[idx] = { ...newChapters[idx], [field]: value };
    setChapters(newChapters);
  };

  const addChapter = () => {
    setChapters([...chapters, { clue: '', riddle: '', answer: '', hint: '' }]);
  };

  const removeChapter = (idx: number) => {
    setChapters(chapters.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setError('');
    if (!name.trim()) { setError('Quest needs a name.'); return; }
    if (!intro.trim()) { setError('Quest needs an intro story.'); return; }
    if (chapters.length === 0) { setError('Quest needs at least one chapter.'); return; }
    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i];
      if (!c.clue.trim() || !c.answer.trim()) {
        setError(`Chapter ${i + 1} needs a clue and an answer.`);
        return;
      }
    }
    const quest: MysteryQuest = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      icon,
      intro: intro.trim(),
      chapters: chapters.map((c) => ({
        clue: c.clue.trim(),
        riddle: c.riddle.trim() || 'Speak the answer:',
        answer: c.answer.trim().toLowerCase(),
        hint: c.hint.trim() || 'No hint available.',
      })),
      rewardGold,
      rewardXp,
      rewardItem: rewardItemName.trim() ? { name: rewardItemName.trim(), icon: rewardItemIcon, value: rewardGold } : undefined,
      requiredLevel,
      author: 'Admin',
      createdAt: Date.now(),
    };
    addMysteryQuest(quest);
    setCustomQuests(getCustomMysteryQuests());
    // Reset form
    setName(''); setIntro(''); setChapters([{ clue: '', riddle: '', answer: '', hint: '' }]);
    setRewardItemName('');
    setError('');
    alert(`✦ Mystery Quest "${quest.name}" created! Players can now discover it.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this mystery quest?')) {
      deleteMysteryQuest(id);
      setCustomQuests(getCustomMysteryQuests());
    }
  };

  const loadExample = () => {
    setName('The Cursed Cipher');
    setIcon('🔐');
    setIntro('A cryptic message washed ashore, written in an unknown cipher. Decode its secrets to claim the buried treasure...');
    setRequiredLevel(8);
    setRewardGold(1500);
    setRewardXp(2000);
    setRewardItemName('Treasure Key');
    setRewardItemIcon('🗝');
    setChapters([
      { clue: 'The first glyph shows a creature with eight legs. "I spin, yet have no thread."', riddle: 'What am I?', answer: 'spider', hint: 'An arachnid.' },
      { clue: 'The second glyph: "I have keys but no locks. Space but no room."', riddle: 'What am I?', answer: 'keyboard', hint: 'You use one now.' },
      { clue: 'Final cipher unlocked: "Speak the word of binding: SHADOW"', riddle: 'Speak the binding word:', answer: 'shadow', hint: 'Darkness follows light.' },
    ]);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-50"
         style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="rounded-lg border-2 p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
           style={{ background: 'linear-gradient(180deg, rgba(50,30,10,0.98) 0%, rgba(25,15,5,0.98) 100%)', borderColor: '#9b59ff', boxShadow: '0 0 50px rgba(155,89,255,0.4)' }}>
        <div className="flex items-center justify-between mb-3 sticky top-0 pb-2" style={{ background: 'inherit' }}>
          <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #9b59ff 0%, #4a2090 100%)' }}>
            ✦ MYSTERY QUEST CREATOR
          </h2>
          <button onClick={onClose} className="text-purple-200/60 hover:text-white text-xl">✕</button>
        </div>

        <div className="text-xs text-purple-200/60 mb-3">
          Create Tibia-style mystery quests with clues, riddles, and answers. Players must solve each chapter in order to unlock the next.
        </div>

        {/* Existing custom quests */}
        {customQuests.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-purple-300 tracking-widest mb-1.5">📦 YOUR MYSTERY QUESTS ({customQuests.length})</div>
            <div className="space-y-1">
              {customQuests.map((q) => (
                <div key={q.id} className="flex items-center gap-2 p-2 rounded border border-purple-700/40 bg-black/40 text-xs">
                  <span className="text-lg">{q.icon}</span>
                  <div className="flex-1">
                    <div className="text-purple-200 font-bold">{q.name}</div>
                    <div className="text-purple-200/50 text-[10px]">{q.chapters.length} chapters · Lv {q.requiredLevel}+ · {q.rewardGold}g / {q.rewardXp}XP</div>
                  </div>
                  <button onClick={() => handleDelete(q.id)} className="text-red-400 hover:text-red-300 px-2">🗑</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={loadExample}
                className="mb-3 px-3 py-1.5 text-xs rounded bg-purple-900/40 hover:bg-purple-700/60 text-purple-200 border border-purple-700/50">
          ✨ Load Example
        </button>

        {/* Form */}
        <div className="p-3 rounded border-2 border-purple-600/40 bg-black/30 space-y-2">
          <div className="text-[10px] text-purple-300 tracking-widest">➕ CREATE NEW MYSTERY</div>
          <div className="grid grid-cols-12 gap-2 text-xs">
            <div className="col-span-6">
              <label className="text-purple-200/60 block mb-0.5">Quest Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                     className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100" placeholder="The Lost Artifact" />
            </div>
            <div className="col-span-2">
              <label className="text-purple-200/60 block mb-0.5">Icon</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2}
                     className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100 text-center" />
            </div>
            <div className="col-span-2">
              <label className="text-purple-200/60 block mb-0.5">Min Level</label>
              <input type="number" value={requiredLevel} onChange={(e) => setRequiredLevel(parseInt(e.target.value) || 1)}
                     className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100" />
            </div>
            <div className="col-span-1">
              <label className="text-purple-200/60 block mb-0.5">Gold</label>
              <input type="number" value={rewardGold} onChange={(e) => setRewardGold(parseInt(e.target.value) || 0)}
                     className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100" />
            </div>
            <div className="col-span-1">
              <label className="text-purple-200/60 block mb-0.5">XP</label>
              <input type="number" value={rewardXp} onChange={(e) => setRewardXp(parseInt(e.target.value) || 0)}
                     className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100" />
            </div>
          </div>

          <div className="text-xs">
            <label className="text-purple-200/60 block mb-0.5">Intro Story / Lore (sets the mystery)</label>
            <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2}
                      className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100"
                      placeholder="An ancient evil stirs. The clues are scattered..." />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-purple-200/60 block mb-0.5">Reward Item Name (optional)</label>
              <input value={rewardItemName} onChange={(e) => setRewardItemName(e.target.value)}
                     className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100" placeholder="Mysterious Key" />
            </div>
            <div>
              <label className="text-purple-200/60 block mb-0.5">Reward Item Icon</label>
              <input value={rewardItemIcon} onChange={(e) => setRewardItemIcon(e.target.value)} maxLength={2}
                     className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100 text-center" />
            </div>
          </div>

          {/* Chapters */}
          <div className="text-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-purple-300 tracking-widest">📜 CHAPTERS (clues & riddles)</label>
              <button onClick={addChapter} className="px-2 py-0.5 rounded bg-purple-900/50 hover:bg-purple-700/60 text-purple-200 border border-purple-700/50 text-[10px]">+ Add Chapter</button>
            </div>
            <div className="space-y-2">
              {chapters.map((c, idx) => (
                <div key={idx} className="p-2 rounded border border-purple-700/30 bg-black/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-bold text-[10px]">CHAPTER {idx + 1}</span>
                    {chapters.length > 1 && (
                      <button onClick={() => removeChapter(idx)} className="text-red-400 text-[10px]">✕ remove</button>
                    )}
                  </div>
                  <div>
                    <label className="text-purple-200/50 text-[10px]">Clue / Lore (shown to player)</label>
                    <textarea value={c.clue} onChange={(e) => updateChapter(idx, 'clue', e.target.value)} rows={2}
                              className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/40 text-purple-100"
                              placeholder='An inscription reads: "I have a head but no eyes..."' />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="col-span-1">
                      <label className="text-purple-200/50 text-[10px]">Riddle prompt</label>
                      <input value={c.riddle} onChange={(e) => updateChapter(idx, 'riddle', e.target.value)}
                             className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/40 text-purple-100" placeholder="What am I?" />
                    </div>
                    <div className="col-span-1">
                      <label className="text-green-300/70 text-[10px]">✓ Answer (case-insensitive)</label>
                      <input value={c.answer} onChange={(e) => updateChapter(idx, 'answer', e.target.value)}
                             className="w-full px-2 py-1 rounded bg-black/60 border border-green-700/40 text-green-100" placeholder="coin" />
                    </div>
                    <div className="col-span-1">
                      <label className="text-amber-300/70 text-[10px]">Hint</label>
                      <input value={c.hint} onChange={(e) => updateChapter(idx, 'hint', e.target.value)}
                             className="w-full px-2 py-1 rounded bg-black/60 border border-amber-700/40 text-amber-100" placeholder="Something shiny..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 rounded px-2 py-1">⚠ {error}</div>}

          <button onClick={handleSave}
                  className="w-full py-2 rounded font-bold text-sm tracking-widest transition-all hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(180deg, #9b59ff 0%, #4a2090 100%)', color: '#fff' }}>
            ✦ CREATE MYSTERY QUEST
          </button>
        </div>
      </div>
    </div>
  );
}
