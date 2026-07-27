import { useState, useContext, createContext, useRef } from 'react';

// Generic drag payload
export interface DragPayload {
  type: 'item' | 'spell' | 'ground' | 'equipment';
  data: any;
  source?: string; // origin identifier
}

interface DragCtx {
  payload: DragPayload | null;
  setPayload: (p: DragPayload | null) => void;
}

const DragContext = createContext<DragCtx>({ payload: null, setPayload: () => {} });

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<DragPayload | null>(null);
  return <DragContext.Provider value={{ payload, setPayload }}>{children}</DragContext.Provider>;
}

export function useDrag() {
  return useContext(DragContext);
}

// Wrapper that makes something draggable via HTML5 drag events
export function Draggable({ payload, children, className, onDoubleClick }: {
  payload: DragPayload;
  children: React.ReactNode;
  className?: string;
  onDoubleClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        // Slight visual feedback
        if (ref.current) ref.current.style.opacity = '0.4';
      }}
      onDragEnd={() => {
        if (ref.current) ref.current.style.opacity = '1';
      }}
      onDoubleClick={onDoubleClick}
      className={className}
      title={onDoubleClick ? 'Double-click to use · Drag to move' : 'Drag to move'}
    >
      {children}
    </div>
  );
}

// Drop zone
export function DropZone({ onDrop, children, className, activeClassName }: {
  onDrop: (payload: DragPayload) => void;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        try {
          const data = e.dataTransfer.getData('application/json');
          if (data) onDrop(JSON.parse(data));
        } catch {}
      }}
      className={`${className || ''} ${over ? (activeClassName || 'ring-2 ring-amber-400') : ''}`}
    >
      {children}
    </div>
  );
}
