import { useEffect, useRef, useState, memo } from 'react';
import type { ChatMessage } from '../game/types';

interface Props {
  messages: ChatMessage[];
  onSendMessage?: (text: string) => void;
}

function ChatInner({ messages, onSendMessage }: Props) {
  const [filter, setFilter] = useState<'all' | 'world' | 'battle' | 'system' | 'loot' | 'quest'>('all');
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filtered = filter === 'all' ? messages : messages.filter((m) => m.channel === filter);

  const channelIcons: Record<string, string> = {
    world: '💬', battle: '⚔', system: '⚙', loot: '💎', quest: '📜',
  };

  const channelColors: Record<string, string> = {
    world: '#ffffff', battle: '#ff9090', system: '#f4e04d', loot: '#ff8c00', quest: '#9bd4ff',
  };

  return (
    <div
      className={`absolute bottom-0 left-0 flex flex-col transition-all duration-300 ${expanded ? 'w-[500px] h-[350px]' : 'w-[420px] h-[160px]'}`}
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(10,5,0,0.9) 100%)',
        borderTop: '1px solid rgba(139,105,20,0.4)',
        borderRight: '1px solid rgba(139,105,20,0.3)',
        borderTopRightRadius: '8px',
        zIndex: 15,
      }}
    >
      {/* Tab bar - WoW style minimal */}
      <div className="flex items-center border-b border-amber-900/30 px-1 py-0.5 shrink-0">
        <div className="flex gap-0.5 flex-1">
          {(['all', 'world', 'battle', 'loot', 'quest', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-2 py-0.5 text-[10px] rounded-sm font-medium tracking-wider transition-all ${
                filter === t
                  ? 'text-amber-200 bg-amber-900/40'
                  : 'text-amber-200/40 hover:text-amber-200/70'
              }`}
              style={filter === t ? { borderBottom: `2px solid ${channelColors[t] || '#8b6914'}` } : {}}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setExpanded((s) => !s)}
          className="text-amber-200/40 hover:text-amber-200 text-[10px] px-1"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▼' : '▲'}
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-1 space-y-px text-[11px] font-mono"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#3a2a1a transparent' }}
      >
        {filtered.slice(-50).map((m) => {
          const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={m.id} className="flex gap-1.5 leading-tight opacity-90 hover:opacity-100 transition-opacity">
              <span className="text-amber-200/20 text-[9px] shrink-0 w-10">{time}</span>
              <span className="text-[9px] shrink-0 w-3 text-center" title={m.channel}>
                {channelIcons[m.channel] || '💬'}
              </span>
              {m.sender !== 'System' && m.sender !== 'Loot' && m.sender !== 'Quest' && (
                <span className="text-amber-300 shrink-0 font-semibold">{m.sender}:</span>
              )}
              <span style={{ color: m.color }}>{m.text}</span>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-amber-900/30 px-1 py-0.5 flex gap-1 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              onSendMessage?.(input);
              setInput('');
            }
          }}
          placeholder="Type a message..."
          className="flex-1 px-2 py-1 text-[11px] bg-transparent border-none text-amber-100 placeholder:text-amber-200/30 focus:outline-none"
        />
        <button
          onClick={() => {
            if (input.trim()) {
              onSendMessage?.(input);
              setInput('');
            }
          }}
          className="text-amber-200/40 hover:text-amber-200 text-[10px] px-1"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

// Memoize to prevent re-render on every game-frame tick (only re-render when messages change)
function areEqual(prev: Props, next: Props) {
  if (prev.messages.length !== next.messages.length) return false;
  const lastPrev = prev.messages[prev.messages.length - 1];
  const lastNext = next.messages[next.messages.length - 1];
  if (!lastPrev || !lastNext) return lastPrev === lastNext;
  return lastPrev.id === lastNext.id;
}

const Chat = memo(ChatInner, areEqual);
export default Chat;
