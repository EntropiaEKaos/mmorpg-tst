import { useEffect, useRef, useState, memo } from 'react';
import type { ChatMessage } from '../game/types';

interface Props {
  messages: ChatMessage[];
  onSendMessage?: (text: string) => void;
}

type Filter = 'all' | 'world' | 'battle' | 'system' | 'loot' | 'quest';

function ChatInner({ messages, onSendMessage }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, filter]);

  const filtered = filter === 'all' ? messages : messages.filter((m) => m.channel === filter);
  const channelIcons: Record<string, string> = { world: '💬', battle: '⚔', system: '✦', loot: '💎', quest: '📜' };
  const channelColors: Record<string, string> = { world: '#d9e0eb', battle: '#ff9aa5', system: '#e5c477', loot: '#ffb56b', quest: '#8fc8ff', all: '#e5c477' };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage?.(text);
    setInput('');
  };

  return (
    <div className={`moria-panel absolute bottom-3 left-3 z-20 flex max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl transition-[width,height] duration-300 ${expanded ? 'h-[360px] w-[520px]' : 'h-[154px] w-[410px]'}`}>
      <div className="flex shrink-0 items-center gap-1 border-b border-white/[0.06] px-2 py-1.5">
        <div className="moria-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {(['all', 'world', 'battle', 'loot', 'quest', 'system'] as const).map((t) => {
            const active = filter === t;
            return (
              <button key={t} onClick={() => setFilter(t)} className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-black tracking-wider transition-all ${active ? 'bg-white/[0.07] text-slate-100' : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'}`} style={active ? { boxShadow: `inset 0 -1px ${channelColors[t]}` } : undefined}>
                {t === 'all' ? 'ALL' : t.toUpperCase()}
              </button>
            );
          })}
        </div>
        <button onClick={() => setExpanded((s) => !s)} className="moria-chip flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] text-slate-400 hover:text-slate-100" title={expanded ? 'Collapse chat' : 'Expand chat'}>
          {expanded ? '▼' : '▲'}
        </button>
      </div>

      <div ref={scrollRef} className="moria-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 py-2 font-mono text-[11px]">
        {filtered.slice(-80).map((m) => {
          const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const systemSender = m.sender === 'System' || m.sender === 'Loot' || m.sender === 'Quest';
          return (
            <div key={m.id} className="group flex gap-1.5 rounded px-1 py-0.5 leading-[1.35] hover:bg-white/[0.025]">
              <span className="w-9 shrink-0 text-[8px] text-slate-600">{time}</span>
              <span className="w-3 shrink-0 text-center text-[9px]" title={m.channel}>{channelIcons[m.channel] || '💬'}</span>
              {!systemSender && <span className="shrink-0 font-bold text-amber-200/85">{m.sender}:</span>}
              <span className="min-w-0 break-words" style={{ color: m.color }}>{m.text}</span>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-t border-white/[0.06] bg-black/15 p-1.5">
        <span className="pl-1 text-[10px] text-slate-500">›</span>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Message the realm..." className="moria-input min-w-0 flex-1 rounded-lg border-0 px-2 py-1.5 text-[11px] focus:outline-none" maxLength={200} />
        <button onClick={send} disabled={!input.trim()} className="moria-button flex h-7 items-center justify-center rounded-lg px-2 text-[9px] font-black tracking-wider disabled:opacity-30">SEND</button>
      </div>
    </div>
  );
}

function areEqual(prev: Props, next: Props) {
  if (prev.messages === next.messages && prev.onSendMessage === next.onSendMessage) return true;
  if (prev.messages.length !== next.messages.length) return false;
  const lastPrev = prev.messages[prev.messages.length - 1];
  const lastNext = next.messages[next.messages.length - 1];
  if (!lastPrev || !lastNext) return lastPrev === lastNext && prev.onSendMessage === next.onSendMessage;
  return lastPrev.id === lastNext.id && lastPrev.text === lastNext.text && lastPrev.channel === lastNext.channel && prev.onSendMessage === next.onSendMessage;
}

const Chat = memo(ChatInner, areEqual);
export default Chat;
