import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  defaultStyle?: CSSProperties;
  compact?: boolean;
}

type SavedPosition = { x: number; y: number };

const storageKey = (id: string) => `moria:hud:${id}:position`;

function loadPosition(id: string): SavedPosition | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed?.x) || !Number.isFinite(parsed?.y)) return null;
    return { x: Math.max(0, Number(parsed.x)), y: Math.max(0, Number(parsed.y)) };
  } catch {
    return null;
  }
}

export default function MovableHudWindow({
  id,
  title,
  children,
  className = '',
  contentClassName = '',
  defaultStyle,
  compact = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<null | { pointerId: number; startX: number; startY: number; originX: number; originY: number }>(null);
  const [position, setPosition] = useState<SavedPosition | null>(() => loadPosition(id));
  const [dragging, setDragging] = useState(false);

  const currentPosition = () => {
    const el = rootRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return { x: position?.x || 0, y: position?.y || 0 };
    const rect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    return { x: rect.left - parentRect.left, y: rect.top - parentRect.top };
  };

  const clamp = (x: number, y: number) => {
    const el = rootRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return { x: Math.max(0, x), y: Math.max(0, y) };
    const parentRect = parent.getBoundingClientRect();
    const maxX = Math.max(0, parentRect.width - el.offsetWidth);
    const maxY = Math.max(0, parentRect.height - el.offsetHeight);
    return { x: Math.min(maxX, Math.max(0, x)), y: Math.min(maxY, Math.max(0, y)) };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-no-drag]')) return;
    const origin = currentPosition();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
    };
    setPosition(origin);
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const next = clamp(
      drag.originX + event.clientX - drag.startX,
      drag.originY + event.clientY - drag.startY,
    );
    setPosition(next);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    const next = clamp(position?.x ?? drag.originX, position?.y ?? drag.originY);
    setPosition(next);
    try { localStorage.setItem(storageKey(id), JSON.stringify(next)); } catch { /* local preference only */ }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const reset = () => {
    dragRef.current = null;
    setDragging(false);
    setPosition(null);
    try { localStorage.removeItem(storageKey(id)); } catch { /* local preference only */ }
  };

  const anchored: CSSProperties = position
    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto', transform: 'none' }
    : (defaultStyle || { left: 12, top: 12 });

  return (
    <div
      ref={rootRef}
      data-hud-window={id}
      className={`moria-hud-window pointer-events-auto absolute z-30 overflow-hidden ${dragging ? 'moria-hud-dragging' : ''} ${className}`}
      style={anchored}
    >
      <div
        className={`moria-hud-titlebar flex touch-none select-none items-center gap-2 ${compact ? 'h-6 px-2' : 'h-7 px-2.5'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onDoubleClick={reset}
        title="Drag to move · double-click to reset"
      >
        <span className="text-[10px] text-amber-200/55">⠿</span>
        <span className="min-w-0 flex-1 truncate text-[9px] font-black uppercase tracking-[0.16em] text-amber-100/85">{title}</span>
        <button
          type="button"
          data-no-drag
          onClick={reset}
          className="rounded px-1 text-[8px] font-bold text-slate-600 hover:bg-white/5 hover:text-slate-300"
          title="Reset panel position"
        >
          ↺
        </button>
      </div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
