import { useEffect, useRef, useState, memo } from 'react';
import type { ChatMessage } from '../game/types';
import MovableHudWindow from './MovableHudWindow';

export type SendChannel = 'world' | 'say' | 'party' | 'guild' | 'trade';

interface Props {
  messages: ChatMessage[];
  onSendMessage?: (text: string, channel: SendChannel) => void;
  social?: any;
}

type Filter = 'all' | ChatMessage['channel'];

function ChatInner({ messages, onSendMessage, social }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sendChannel, setSendChannel] = useState<SendChannel>('world');
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, filter]);

  useEffect(() => {
    if (sendChannel === 'party' && !social?.party) setSendChannel('world');
    if (sendChannel === 'guild' && !social?.guild) setSendChannel('world');
  }, [sendChannel, social?.party, social?.guild]);

  const filtered = filter === 'all' ? messages : messages.filter((m) => m.channel === filter);
  const channelIcons: Record<string, string> = { world: '💬', say: '🗨', party: '👥', guild: '🛡', trade: '🤝', battle: '⚔', system: '✦', loot: '💎', quest: '📜' };
  const channelColors: Record<string, string> = { world: '#d9e0eb', say: '#bfe5ff', party: '#7dd3fc', guild: '#c084fc', trade: '#71d8ac', battle: '#ff9aa5', system: '#e5c477', loot: '#ffb56b', quest: '#8fc8ff', all: '#e5c477' };
  const filters: Filter[] = ['all', 'world', 'say', 'party', 'guild', 'trade', 'battle', 'loot', 'quest', 'system'];
  const sendChannels: SendChannel[] = ['world', 'say', ...(social?.party ? ['party' as const] : []), ...(social?.guild ? ['guild' as const] : []), 'trade'];

  const send = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage?.(text, sendChannel);
    setInput('');
  };

  return (
    <MovableHudWindow
      id="chat"
      title="Chat"
      className={`${expanded ? 'h-[390px] w-[520px]' : 'h-[204px] w-[330px]'} max-w-[calc(100vw-16px)]`}
      contentClassName="flex h-[calc(100%-28px)] flex-col"
      defaultStyle={{ left: 8, bottom: 8 }}
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-amber-200/10 px-2 py-1.5">
        <div className="moria-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {filters.map((t) => {
            const active = filter === t;
            return <button key={t} onClick={() => setFilter(t)} className={`shrink-0 border px-2 py-1 text-[9px] font-black tracking-wider transition-all ${active ? 'border-amber-200/35 bg-amber-100/8 text-amber-100' : 'border-transparent text-slate-500 hover:border-white/10 hover:text-slate-300'}`} style={active ? { boxShadow: `inset 0 -1px ${channelColors[t]}` } : undefined}>{t === 'all' ? 'ALL' : t.toUpperCase()}</button>;
          })}
        </div>
        <button data-no-drag onClick={() => setExpanded((s) => !s)} className="flex h-6 w-6 shrink-0 items-center justify-center border border-amber-200/15 bg-black/40 text-[10px] text-slate-400 hover:text-amber-100" title={expanded ? 'Collapse chat' : 'Expand chat'}>{expanded ? '▼' : '▲'}</button>
      </div>

      <div ref={scrollRef} className="moria-scrollbar flex-1 space-y-0.5 overflow-y-auto bg-black/20 px-3 py-2 font-mono text-[11px]">
        {filtered.slice(-100).map((m) => {
          const time = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const systemSender = m.sender === 'System' || m.sender === 'Loot' || m.sender === 'Quest' || m.sender === 'Server';
          return <div key={m.id} className="group flex gap-1.5 px-1 py-0.5 leading-[1.35] hover:bg-white/[0.025]"><span className="w-9 shrink-0 text-[8px] text-slate-600">{time}</span><span className="w-3 shrink-0 text-center text-[9px]" title={m.channel}>{channelIcons[m.channel] || '💬'}</span>{!systemSender && <span className="shrink-0 font-bold text-amber-200/85">{m.sender}:</span>}<span className="min-w-0 break-words" style={{ color: m.color }}>{m.text}</span></div>;
        })}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-t border-amber-200/10 bg-[#080704] p-1.5">
        <select data-no-drag value={sendChannel} onChange={e => setSendChannel(e.target.value as SendChannel)} className="moria-input rounded-none px-1 py-1.5 text-[9px] font-black uppercase">
          {sendChannels.map(channel => <option key={channel} value={channel}>{channel}</option>)}
        </select>
        <span className="text-[10px] text-slate-500">›</span>
        <input data-no-drag type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={`Message ${sendChannel}...`} className="moria-input min-w-0 flex-1 rounded-none border-0 px-2 py-1.5 text-[11px] focus:outline-none" maxLength={200} />
        <button data-no-drag onClick={send} disabled={!input.trim()} className="moria-button flex h-7 items-center justify-center rounded-none px-2 text-[9px] font-black tracking-wider disabled:opacity-30">SEND</button>
      </div>
    </MovableHudWindow>
  );
}

function areEqual(prev: Props, next: Props) {
  if (prev.messages === next.messages && prev.onSendMessage === next.onSendMessage && prev.social === next.social) return true;
  if (prev.messages.length !== next.messages.length) return false;
  const lastPrev = prev.messages[prev.messages.length - 1];
  const lastNext = next.messages[next.messages.length - 1];
  if (!lastPrev || !lastNext) return lastPrev === lastNext && prev.onSendMessage === next.onSendMessage;
  return lastPrev.id === lastNext.id && lastPrev.text === lastNext.text && lastPrev.channel === lastNext.channel && prev.onSendMessage === next.onSendMessage && prev.social === next.social;
}

const Chat = memo(ChatInner, areEqual);
export default Chat;
