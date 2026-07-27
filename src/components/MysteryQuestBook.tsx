import { useState } from 'react';
import type { Player } from '../game/types';
import { getAllMysteryQuests, getMysteryProgress, setMysteryProgress } from '../game/questCreator';

interface Props {
  player: Player;
  onClose: () => void;
  onComplete: (gold: number, xp: number, itemName?: string, itemIcon?: string) => void;
}

export default function MysteryQuestBook({ player, onClose, onComplete }: Props) {
  const allQuests = getAllMysteryQuests();
  const [progress, setProgress] = useState(getMysteryProgress(player.name));
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);

  const updateProgress = (newProgress: typeof progress) => {
    setProgress(newProgress);
    setMysteryProgress(player.name, newProgress);
  };

  const activeQuest = allQuests.find((q) => q.id === activeQuestId);
  const questProgress = activeQuestId ? progress[activeQuestId] : null;
  const currentChapter = activeQuest && questProgress ? questProgress.solvedChapters : 0;

  const handleSubmit = () => {
    if (!activeQuest || !questProgress) return;
    const chapter = activeQuest.chapters[questProgress.solvedChapters];
    if (!chapter) return;
    const userAnswer = answer.trim().toLowerCase();
    if (userAnswer === chapter.answer.toLowerCase()) {
      setFeedback('✓ Correct! The mystery deepens...');
      const newSolved = questProgress.solvedChapters + 1;
      if (newSolved >= activeQuest.chapters.length) {
        // Quest complete!
        updateProgress({ ...progress, [activeQuest.id]: { solvedChapters: newSolved, completed: true } });
        onComplete(activeQuest.rewardGold, activeQuest.rewardXp, activeQuest.rewardItem?.name, activeQuest.rewardItem?.icon);
        setTimeout(() => {
          setActiveQuestId(null);
          setAnswer('');
          setFeedback('');
          setShowHint(false);
        }, 2000);
      } else {
        updateProgress({ ...progress, [activeQuest.id]: { ...questProgress, solvedChapters: newSolved } });
        setAnswer('');
        setFeedback('');
        setShowHint(false);
      }
    } else {
      setFeedback('✗ Incorrect. The riddle resists your answer.');
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-20"
         style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="rounded-xl border-2 p-5 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
           style={{ background: 'linear-gradient(180deg, rgba(40,30,60,0.98) 0%, rgba(20,15,30,0.98) 100%)', borderColor: '#9b59ff', boxShadow: '0 0 50px rgba(155,89,255,0.4)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #9b59ff 0%, #4a2090 100%)' }}>
            ✦ MYSTERY QUESTS
          </h2>
          <button onClick={onClose} className="text-purple-200/60 hover:text-white text-2xl">✕</button>
        </div>

        {!activeQuest ? (
          /* Quest list */
          <div className="space-y-2">
            {allQuests.length === 0 && <div className="text-purple-200/40 text-center py-8">No mystery quests available.</div>}
            {allQuests.map((q) => {
              const prog = progress[q.id];
              const completed = prog?.completed;
              const inProgress = prog && !completed;
              const canStart = player.level >= q.requiredLevel;
              return (
                <div key={q.id}
                     className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.01] ${
                       completed ? 'border-green-600/50 bg-green-900/15'
                       : inProgress ? 'border-amber-500/60 bg-amber-900/15'
                       : canStart ? 'border-purple-600/50 bg-purple-900/15'
                       : 'border-gray-700/40 bg-black/40 opacity-60 cursor-not-allowed'
                     }`}
                     onClick={() => { if (canStart && !completed) setActiveQuestId(q.id); }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2"
                         style={{ borderColor: completed ? '#2ecc71' : '#9b59ff', background: 'rgba(0,0,0,0.4)' }}>
                      {q.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: completed ? '#2ecc71' : '#c8a0ff' }}>{q.name}</span>
                        {completed && <span className="text-green-400 text-[10px]">✓ COMPLETED</span>}
                        {inProgress && <span className="text-amber-400 text-[10px]">● IN PROGRESS ({prog.solvedChapters}/{q.chapters.length})</span>}
                      </div>
                      <div className="text-purple-200/60 text-[11px] italic mt-0.5 line-clamp-2">{q.intro}</div>
                      <div className="text-purple-200/40 text-[10px] mt-1">
                        Lv {q.requiredLevel}+ · {q.chapters.length} chapters · {q.rewardGold}g · {q.rewardXp}XP
                        {q.rewardItem && ` · ${q.rewardItem.icon} ${q.rewardItem.name}`}
                        {!canStart && !completed && <span className="text-red-400"> (level too low)</span>}
                      </div>
                    </div>
                    {!completed && canStart && (
                      <button className="px-3 py-1.5 rounded bg-purple-700/60 text-purple-100 text-xs font-bold border border-purple-500">
                        {inProgress ? 'Continue' : 'Begin'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Active quest solver */
          <div>
            {activeQuest && questProgress && (
              <>
                <button onClick={() => { setActiveQuestId(null); setAnswer(''); setFeedback(''); setShowHint(false); }}
                        className="text-purple-300 hover:text-purple-100 text-xs mb-3">← Back to list</button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{activeQuest.icon}</div>
                  <div>
                    <div className="text-xl font-bold text-purple-200">{activeQuest.name}</div>
                    <div className="text-purple-200/50 text-xs">Chapter {currentChapter + 1} of {activeQuest.chapters.length}</div>
                  </div>
                </div>

                {/* Intro */}
                {currentChapter === 0 && (
                  <div className="mb-4 p-3 rounded border-l-4 border-purple-500 bg-purple-900/20 text-purple-100/90 italic text-sm">
                    {activeQuest.intro}
                  </div>
                )}

                {/* Progress dots */}
                <div className="flex items-center gap-1 mb-4">
                  {activeQuest.chapters.map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${i < currentChapter ? 'bg-green-500' : i === currentChapter ? 'bg-purple-500 animate-pulse' : 'bg-gray-700'}`} />
                      {i < activeQuest.chapters.length - 1 && <div className={`w-8 h-0.5 ${i < currentChapter ? 'bg-green-700' : 'bg-gray-800'}`} />}
                    </div>
                  ))}
                </div>

                {/* Current chapter */}
                {currentChapter < activeQuest.chapters.length && (
                  <div className="p-4 rounded-lg border border-purple-700/40 bg-black/40">
                    <div className="text-purple-200/60 text-[10px] tracking-widest mb-2">📜 CLUE</div>
                    <div className="text-purple-100 mb-4 leading-relaxed" style={{ fontFamily: 'serif' }}>
                      {activeQuest.chapters[currentChapter].clue}
                    </div>
                    <div className="text-purple-300 font-bold mb-2">{activeQuest.chapters[currentChapter].riddle}</div>
                    <div className="flex gap-2">
                      <input value={answer} onChange={(e) => setAnswer(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                             placeholder="Type your answer..."
                             autoFocus
                             className="flex-1 px-3 py-2 rounded bg-black/60 border border-purple-700/50 text-purple-100 focus:outline-none focus:border-purple-500" />
                      <button onClick={handleSubmit}
                              className="px-4 py-2 rounded font-bold text-sm transition-all hover:scale-105"
                              style={{ background: 'linear-gradient(180deg, #9b59ff 0%, #4a2090 100%)', color: '#fff' }}>
                        Answer
                      </button>
                    </div>
                    {feedback && <div className="mt-2 text-sm" style={{ color: feedback.startsWith('✓') ? '#2ecc71' : '#ff6060' }}>{feedback}</div>}
                    <button onClick={() => setShowHint((s) => !s)} className="mt-2 text-amber-400/70 hover:text-amber-300 text-xs">
                      💡 {showHint ? 'Hide hint' : 'Need a hint?'}
                    </button>
                    {showHint && (
                      <div className="mt-1 p-2 rounded bg-amber-900/20 border border-amber-700/40 text-amber-200/80 text-xs italic">
                        {activeQuest.chapters[currentChapter].hint}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
