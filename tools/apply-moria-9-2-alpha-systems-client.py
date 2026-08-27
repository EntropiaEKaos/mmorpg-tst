from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def write(path, content):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')

def replace_once(path, old, new):
    target = ROOT / path
    text = target.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'anchor missing in {path}: {old[:120]!r}')
    target.write_text(text.replace(old, new, 1), encoding='utf-8')

def regex_once(path, pattern, repl):
    target = ROOT / path
    text = target.read_text(encoding='utf-8')
    next_text, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'regex anchor missing in {path}: {pattern[:120]!r}')
    target.write_text(next_text, encoding='utf-8')

write('src/game/playerAvatar.ts', r'''// ===================================================================
// MOR'IA 9.2 — PROCEDURAL PLAYER AVATAR
// Layered, content-driven presentation. No gameplay authority lives here.
// ===================================================================

export interface AvatarColors {
  head: string;
  primary: string;
  secondary: string;
  detail: string;
}

export interface AvatarAppearance {
  outfit?: { id?: string; name?: string; icon?: string; style?: string } | null;
  colors?: Partial<AvatarColors> | null;
  addonMask?: number;
}

export interface AvatarMount {
  id?: string;
  name?: string;
  icon?: string;
  color?: string;
  speedBonus?: number;
}

const DEFAULT_COLORS: AvatarColors = {
  head: '#d7a06b',
  primary: '#506aa6',
  secondary: '#343f59',
  detail: '#d9c271',
};

const safeColor = (value: unknown, fallback: string) => /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;

function mountPalette(id: string, color: string) {
  const accent = id.includes('nightmare') ? '#9a6ee8'
    : id.includes('astral') ? '#f0d579'
    : id.includes('tiger') ? '#33241c'
    : id.includes('drake') || id.includes('raptor') ? '#f0a05b'
    : id.includes('unicorn') ? '#f1d5ff'
    : '#d6c19c';
  return { body: color, accent };
}

function drawMount(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  mount: AvatarMount,
  direction: string,
  time: number,
) {
  const id = String(mount.id || 'horse');
  const color = safeColor(mount.color, '#8b6f47');
  const { body, accent } = mountPalette(id, color);
  const stride = Math.sin(time / 120) * size * 0.025;
  const face = direction === 'left' ? -1 : 1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(face, 1);

  // Body and hindquarters.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.13, size * 0.34, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck / head adapt to quadruped vs drake/raptor silhouette.
  const reptile = /raptor|drake/.test(id);
  const bulky = /boar|bear|lion/.test(id);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(size * 0.28, reptile ? -size * 0.01 : size * 0.02, size * (bulky ? 0.18 : 0.14), size * 0.12, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(size * 0.18, -size * 0.01, size * 0.12, size * 0.17);

  // Legs — deliberately chunky to read at the game's pixel scale.
  ctx.fillStyle = body;
  for (const lx of [-0.22, -0.08, 0.12, 0.24]) {
    ctx.fillRect(size * lx, size * 0.22, size * 0.07, size * 0.20 + stride * (lx > 0 ? 1 : -1));
  }

  // Tail / special silhouettes.
  ctx.strokeStyle = body;
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(-size * 0.28, size * 0.08);
  ctx.quadraticCurveTo(-size * 0.48, -size * 0.02, -size * 0.43, -size * 0.18);
  ctx.stroke();

  ctx.fillStyle = accent;
  if (/wolf|tiger|lion/.test(id)) {
    ctx.beginPath(); ctx.moveTo(size * 0.22, -size * 0.09); ctx.lineTo(size * 0.25, -size * 0.23); ctx.lineTo(size * 0.31, -size * 0.10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(size * 0.32, -size * 0.08); ctx.lineTo(size * 0.36, -size * 0.22); ctx.lineTo(size * 0.40, -size * 0.06); ctx.fill();
  } else if (/unicorn/.test(id)) {
    ctx.beginPath(); ctx.moveTo(size * 0.32, -size * 0.12); ctx.lineTo(size * 0.42, -size * 0.36); ctx.lineTo(size * 0.37, -size * 0.10); ctx.fill();
  } else if (/boar/.test(id)) {
    ctx.fillRect(size * 0.35, size * 0.02, size * 0.13, size * 0.035);
  } else if (/raptor|drake/.test(id)) {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo((-0.12 + i * 0.08) * size, -size * 0.06); ctx.lineTo((-0.08 + i * 0.08) * size, -size * 0.18); ctx.lineTo((-0.03 + i * 0.08) * size, -size * 0.05); ctx.fill();
    }
    if (/drake/.test(id)) {
      ctx.globalAlpha = 0.65;
      ctx.beginPath(); ctx.moveTo(-size * 0.05, size * 0.04); ctx.lineTo(-size * 0.35, -size * 0.22); ctx.lineTo(size * 0.03, -size * 0.05); ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else {
    // Horse/nightmare/bear readable ears.
    ctx.beginPath(); ctx.moveTo(size * 0.23, -size * 0.09); ctx.lineTo(size * 0.25, -size * 0.22); ctx.lineTo(size * 0.30, -size * 0.09); ctx.fill();
    ctx.beginPath(); ctx.moveTo(size * 0.31, -size * 0.09); ctx.lineTo(size * 0.35, -size * 0.21); ctx.lineTo(size * 0.38, -size * 0.07); ctx.fill();
  }

  // Saddle and reins.
  ctx.fillStyle = '#3d2b22';
  ctx.fillRect(-size * 0.10, -size * 0.03, size * 0.24, size * 0.07);
  ctx.strokeStyle = '#d1b06e';
  ctx.lineWidth = Math.max(1, size * 0.018);
  ctx.beginPath(); ctx.moveTo(size * 0.10, 0); ctx.quadraticCurveTo(size * 0.30, -size * 0.02, size * 0.36, size * 0.04); ctx.stroke();

  // Eye / magical accent.
  ctx.fillStyle = /nightmare|astral/.test(id) ? accent : '#11151b';
  ctx.fillRect(size * 0.34, -size * 0.035, Math.max(1.5, size * 0.025), Math.max(1.5, size * 0.025));
  ctx.restore();
}

function drawStyleLayers(
  ctx: CanvasRenderingContext2D,
  style: string,
  cx: number,
  cy: number,
  size: number,
  scale: number,
  offsetY: number,
  colors: AvatarColors,
  addonMask: number,
) {
  const s = size * scale;
  const y = cy + offsetY;

  // Legs and boots.
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(cx - s * 0.16, y + s * 0.12, s * 0.12, s * 0.24);
  ctx.fillRect(cx + s * 0.04, y + s * 0.12, s * 0.12, s * 0.24);
  ctx.fillStyle = '#2a2525';
  ctx.fillRect(cx - s * 0.17, y + s * 0.31, s * 0.14, s * 0.08);
  ctx.fillRect(cx + s * 0.03, y + s * 0.31, s * 0.14, s * 0.08);

  // Cape/back addon. Addon #1 intentionally reads behind the body.
  if (addonMask & 1) {
    ctx.fillStyle = colors.detail;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.22, y - s * 0.04);
    ctx.lineTo(cx + s * 0.22, y - s * 0.04);
    ctx.lineTo(cx + s * 0.27, y + s * 0.35);
    ctx.lineTo(cx - s * 0.27, y + s * 0.35);
    ctx.closePath(); ctx.fill();
  }

  // Torso silhouette.
  ctx.fillStyle = colors.primary;
  if (/mage|warlock|shaman|necromancer/.test(style)) {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.20, y - s * 0.06); ctx.lineTo(cx + s * 0.20, y - s * 0.06);
    ctx.lineTo(cx + s * 0.29, y + s * 0.32); ctx.lineTo(cx - s * 0.29, y + s * 0.32); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillRect(cx - s * 0.22, y - s * 0.07, s * 0.44, s * 0.25);
  }

  // Arms.
  ctx.fillStyle = colors.primary;
  ctx.fillRect(cx - s * 0.31, y - s * 0.02, s * 0.10, s * 0.24);
  ctx.fillRect(cx + s * 0.21, y - s * 0.02, s * 0.10, s * 0.24);
  ctx.fillStyle = colors.head;
  ctx.fillRect(cx - s * 0.31, y + s * 0.16, s * 0.10, s * 0.07);
  ctx.fillRect(cx + s * 0.21, y + s * 0.16, s * 0.10, s * 0.07);

  // Style details.
  ctx.fillStyle = colors.detail;
  if (/knight|templar/.test(style)) {
    ctx.fillRect(cx - s * 0.29, y - s * 0.08, s * 0.13, s * 0.10);
    ctx.fillRect(cx + s * 0.16, y - s * 0.08, s * 0.13, s * 0.10);
    ctx.fillRect(cx - s * 0.04, y - s * 0.07, s * 0.08, s * 0.24);
  } else if (/ranger/.test(style)) {
    ctx.strokeStyle = colors.detail; ctx.lineWidth = Math.max(2, s * 0.04);
    ctx.beginPath(); ctx.moveTo(cx - s * 0.20, y - s * 0.05); ctx.lineTo(cx + s * 0.20, y + s * 0.18); ctx.stroke();
  } else if (/assassin/.test(style)) {
    ctx.fillRect(cx - s * 0.22, y + s * 0.08, s * 0.44, s * 0.05);
  } else if (/noble/.test(style)) {
    ctx.fillRect(cx - s * 0.22, y - s * 0.02, s * 0.44, s * 0.05);
  } else if (/barbarian/.test(style)) {
    for (const dx of [-0.22, -0.12, 0.12, 0.22]) {
      ctx.beginPath(); ctx.arc(cx + s * dx, y - s * 0.05, s * 0.07, 0, Math.PI * 2); ctx.fill();
    }
  } else if (/shaman/.test(style)) {
    ctx.fillRect(cx - s * 0.04, y - s * 0.06, s * 0.08, s * 0.28);
  }

  // Head / hair / hood.
  ctx.fillStyle = colors.head;
  ctx.beginPath(); ctx.arc(cx, y - s * 0.22, s * 0.15, 0, Math.PI * 2); ctx.fill();
  const hooded = /mage|warlock|necromancer|assassin|ranger/.test(style);
  ctx.fillStyle = hooded ? colors.secondary : '#33261f';
  ctx.beginPath(); ctx.arc(cx, y - s * 0.25, s * 0.16, Math.PI, Math.PI * 2); ctx.fill();
  if (hooded) {
    ctx.strokeStyle = colors.detail; ctx.lineWidth = Math.max(1, s * 0.025);
    ctx.beginPath(); ctx.arc(cx, y - s * 0.20, s * 0.18, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  }

  // Addon #2 is the head/crest layer.
  if (addonMask & 2) {
    ctx.fillStyle = colors.detail;
    if (/warlock|necromancer|barbarian|shaman/.test(style)) {
      ctx.beginPath(); ctx.moveTo(cx - s * 0.10, y - s * 0.34); ctx.lineTo(cx - s * 0.21, y - s * 0.48); ctx.lineTo(cx - s * 0.04, y - s * 0.36); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + s * 0.10, y - s * 0.34); ctx.lineTo(cx + s * 0.21, y - s * 0.48); ctx.lineTo(cx + s * 0.04, y - s * 0.36); ctx.fill();
    } else if (/noble/.test(style)) {
      ctx.fillRect(cx - s * 0.15, y - s * 0.37, s * 0.30, s * 0.06);
      for (const dx of [-0.11, 0, 0.11]) { ctx.beginPath(); ctx.moveTo(cx + s * dx - s * 0.035, y - s * 0.37); ctx.lineTo(cx + s * dx, y - s * 0.49); ctx.lineTo(cx + s * dx + s * 0.035, y - s * 0.37); ctx.fill(); }
    } else {
      ctx.fillRect(cx - s * 0.03, y - s * 0.44, s * 0.06, s * 0.18);
    }
  }
}

export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: string,
  name: string,
  hp: number,
  maxHp: number,
  time: number,
  vocationColor = '#8b2e2e',
  mounted = false,
  fallbackMountIcon?: string,
  appearance?: AvatarAppearance | null,
  mount?: AvatarMount | null,
) {
  const colors: AvatarColors = {
    head: safeColor(appearance?.colors?.head, DEFAULT_COLORS.head),
    primary: safeColor(appearance?.colors?.primary, vocationColor || DEFAULT_COLORS.primary),
    secondary: safeColor(appearance?.colors?.secondary, DEFAULT_COLORS.secondary),
    detail: safeColor(appearance?.colors?.detail, DEFAULT_COLORS.detail),
  };
  const style = String(appearance?.outfit?.style || 'citizen').toLowerCase();
  const addonMask = Math.max(0, Math.min(3, Math.floor(Number(appearance?.addonMask) || 0)));

  ctx.save();
  const cx = x + size / 2;
  const bob = Math.sin(time / 200) * (mounted ? 1.4 : 1.0);
  const cy = y + size / 2 + bob;

  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.68);
  glow.addColorStop(0, colors.primary + '26'); glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, size * 0.68, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath(); ctx.ellipse(cx, y + size - 3, size * (mounted ? 0.43 : 0.34), size * 0.09, 0, 0, Math.PI * 2); ctx.fill();

  if (mounted) {
    const effectiveMount: AvatarMount = mount || { id:'legacy', icon:fallbackMountIcon, color:vocationColor };
    drawMount(ctx, cx, cy + size * 0.15, size, effectiveMount, direction, time);
  }

  const scale = mounted ? 0.73 : 1;
  const offsetY = mounted ? -size * 0.28 : 0;
  drawStyleLayers(ctx, style, cx, cy, size, scale, offsetY, colors, addonMask);

  // Face direction cue and small eye highlights.
  const eyeShiftX = direction === 'left' ? -1.2 : direction === 'right' ? 1.2 : 0;
  const eyeShiftY = direction === 'up' ? -0.8 : direction === 'down' ? 0.8 : 0;
  const faceY = cy - size * 0.22 * scale + offsetY;
  ctx.fillStyle = '#151515';
  ctx.fillRect(cx - 3 + eyeShiftX, faceY + eyeShiftY, 1.5, 1.5);
  ctx.fillRect(cx + 1.5 + eyeShiftX, faceY + eyeShiftY, 1.5, 1.5);

  // Nameplate.
  ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 3; ctx.strokeText(name, cx, y - 2);
  ctx.fillStyle = '#f4e04d'; ctx.fillText(name, cx, y - 2);

  // HP bar.
  const hpBarW = size * 0.9, hpBarH = 3, hpX = cx - hpBarW / 2, hpY = y + size - 6;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(hpX - 1, hpY - 1, hpBarW + 2, hpBarH + 2);
  ctx.fillStyle = '#3a1a1a'; ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
  ctx.fillRect(hpX, hpY, hpBarW * hpPct, hpBarH);
  ctx.restore();
}
''')

write('src/game/housingPresentation.ts', r'''import type { HousingSnapshot } from './types';

export function drawHousing(
  ctx: CanvasRenderingContext2D,
  housing: HousingSnapshot | null | undefined,
  camera: { x: number; y: number },
  tileSize: number,
  time: number,
) {
  if (!housing?.houses?.length) return;
  for (const house of housing.houses) {
    const sx = (house.x - camera.x) * tileSize;
    const sy = (house.y - camera.y) * tileSize;
    const width = house.width * tileSize;
    const height = house.height * tileSize;
    if (sx > ctx.canvas.width || sy > ctx.canvas.height || sx + width < 0 || sy + height < 0) continue;

    ctx.save();
    ctx.fillStyle = house.access ? 'rgba(91,75,48,0.22)' : 'rgba(80,28,28,0.20)';
    ctx.fillRect(sx, sy, width, height);
    ctx.strokeStyle = house.access ? 'rgba(218,183,111,0.52)' : 'rgba(225,90,90,0.48)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 1, sy + 1, width - 2, height - 2);

    const doorX = (house.entranceX - camera.x) * tileSize;
    const doorY = (house.entranceY - camera.y) * tileSize;
    const pulse = 0.55 + Math.sin(time / 350) * 0.15;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = house.ownerName ? '#d9bd7a' : '#63d29b';
    ctx.fillRect(doorX + tileSize * 0.28, doorY + tileSize * 0.20, tileSize * 0.44, tileSize * 0.68);
    ctx.globalAlpha = 1;

    ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const label = house.ownerName ? `${house.name} · ${house.ownerName}` : `${house.name} · FOR SALE`;
    ctx.strokeStyle = 'rgba(0,0,0,0.92)'; ctx.lineWidth = 3; ctx.strokeText(label, sx + width / 2, sy - 3);
    ctx.fillStyle = house.ownerName ? '#e9d7a3' : '#7fe3b0'; ctx.fillText(label, sx + width / 2, sy - 3);

    for (const decor of house.decor || []) {
      const dx = (decor.x - camera.x) * tileSize;
      const dy = (decor.y - camera.y) * tileSize;
      ctx.fillStyle = decor.color || '#d9bd7a';
      ctx.globalAlpha = 0.24;
      ctx.beginPath(); ctx.arc(dx + tileSize / 2, dy + tileSize / 2, tileSize * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = `${Math.floor(tileSize * 0.55)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(decor.icon || '📦', dx + tileSize / 2, dy + tileSize / 2);
    }
    ctx.restore();
  }
}
''')

write('src/components/LifeStylePanel.tsx', r'''import { useMemo, useState } from 'react';
import type { Player } from '../game/types';

type Tab = 'tasks' | 'housing' | 'outfits' | 'mounts';
type Action = (action: string, payload?: Record<string, unknown>) => void;

interface Props {
  player: Player;
  onTask: Action;
  onHousing: Action;
  onAppearance: Action;
  onMount: Action;
  onClose: () => void;
}

const money = (value: unknown) => Math.max(0, Number(value) || 0).toLocaleString();
const dateLabel = (value: unknown) => Number(value) > 0 ? new Date(Number(value)).toLocaleString() : '—';

export default function LifeStylePanel({ player, onTask, onHousing, onAppearance, onMount, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('tasks');
  const [guestName, setGuestName] = useState('');
  const [colors, setColors] = useState(() => ({
    head: player.appearance?.colors?.head || '#d7a06b',
    primary: player.appearance?.colors?.primary || '#506aa6',
    secondary: player.appearance?.colors?.secondary || '#343f59',
    detail: player.appearance?.colors?.detail || '#d9c271',
  }));

  const ownedHouse = useMemo(() => player.housing?.houses?.find(h => h.id === player.housing?.ownedHouseId), [player.housing]);
  const tabs: Array<{ id: Tab; icon: string; label: string }> = [
    { id:'tasks', icon:'🎯', label:'Tasks' }, { id:'housing', icon:'🏠', label:'Housing' },
    { id:'outfits', icon:'🧥', label:'Outfits' }, { id:'mounts', icon:'🐎', label:'Mounts' },
  ];

  return (
    <div className="moria-overlay absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="moria-panel flex h-[min(760px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-amber-200/20 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="moria-eyebrow text-[9px] text-amber-200/60">ALPHA LIFE SYSTEMS</div>
            <h2 className="text-xl font-black tracking-[0.16em] text-amber-100">🏠 LIFE & STYLE</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400"><span>🪙 {money(player.gold)}</span><button onClick={onClose} className="moria-button rounded-xl px-3 py-2 text-lg">✕</button></div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-4 py-2">
          {tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`moria-button shrink-0 rounded-xl px-4 py-2 text-xs font-black ${tab===item.id?'text-amber-100 ring-1 ring-amber-300/30':'text-slate-400'}`}>{item.icon} {item.label}</button>)}
        </div>
        <div className="moria-scrollbar flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === 'tasks' && <TasksTab player={player} onTask={onTask} />}
          {tab === 'housing' && <HousingTab player={player} ownedHouse={ownedHouse} guestName={guestName} setGuestName={setGuestName} onHousing={onHousing} />}
          {tab === 'outfits' && <OutfitsTab player={player} colors={colors} setColors={setColors} onAppearance={onAppearance} />}
          {tab === 'mounts' && <MountsTab player={player} onMount={onMount} />}
        </div>
      </div>
    </div>
  );
}

function TasksTab({ player, onTask }: { player: Player; onTask: Action }) {
  const state = player.tasks;
  if (!state) return <Empty text="Tasks are available when connected to the authoritative alpha server." />;
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat icon="🏹" label="Hunter Rank" value={state.rank || 'Novice'} />
      <Stat icon="✦" label="Task Points" value={String(state.points || 0)} />
      <Stat icon="📋" label="Active Slots" value={`${state.active?.length || 0}/${state.maxActive || 3}`} />
    </div>
    <section><SectionTitle>ACTIVE TASKS</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">{(state.active || []).map(task => <div key={task.id} className="rounded-2xl border border-sky-300/15 bg-sky-950/20 p-4">
        <div className="flex items-start justify-between gap-3"><div><div className="font-black text-slate-100">{task.name}</div><div className="mt-1 text-[11px] text-slate-400">{task.targetName} · Lv {task.minLevel}+</div></div><span className={`rounded-full px-2 py-1 text-[9px] font-black ${task.ready?'bg-amber-300/15 text-amber-200':'bg-sky-300/10 text-sky-200'}`}>{task.ready?'READY':'HUNTING'}</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50"><div className={`h-full ${task.ready?'bg-amber-300':'bg-sky-400'}`} style={{width:`${Math.min(100,(task.progress/Math.max(1,task.count))*100)}%`}} /></div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{task.progress}/{task.count}</span><span>+{task.taskPoints} pts · {money(task.rewardGold)}g · {money(task.rewardXp)} XP</span></div>
        <div className="mt-3 flex gap-2"><button disabled={!task.ready} onClick={() => onTask('claim',{taskId:task.id})} className="moria-button-primary flex-1 rounded-lg py-2 text-[10px] font-black disabled:opacity-30">🏆 CLAIM AT MASTER</button><button onClick={() => onTask('abandon',{taskId:task.id})} className="moria-button rounded-lg px-3 text-[10px] text-rose-300">ABANDON</button></div>
      </div>)}</div>
      {(state.active || []).length===0&&<Empty text="No active hunting tasks. Visit the task master associated with a task to accept it." />}
    </section>
    <section><SectionTitle>TASK BOARD</SectionTitle><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{(state.catalog || []).map(task => {
      const active=(state.active||[]).some(item=>item.id===task.id); const done=task.completedCount>=task.repeatLimit;
      return <div key={task.id} className={`rounded-xl border p-3 ${task.locked||done?'border-white/5 bg-black/20 opacity-55':'border-white/10 bg-white/[0.025]'}`}><div className="flex justify-between gap-2"><div className="font-bold text-slate-100">{task.name}</div><span className="text-[9px] text-amber-200">{task.completedCount}/{task.repeatLimit} runs</span></div><div className="mt-1 text-[10px] leading-relaxed text-slate-400">{task.description}</div><div className="mt-2 text-[10px] text-slate-500">🎯 {task.count} {task.targetName} · Lv {task.minLevel}–{task.maxLevel}</div><button disabled={task.locked||done||active} onClick={()=>onTask('accept',{taskId:task.id})} className="moria-button mt-3 w-full rounded-lg py-2 text-[10px] font-black disabled:opacity-30">{active?'ACTIVE':done?'COMPLETE':task.locked?'LEVEL LOCKED':'ACCEPT AT TASK MASTER'}</button></div>;
    })}</div></section>
  </div>;
}

function HousingTab({ player, ownedHouse, guestName, setGuestName, onHousing }: { player: Player; ownedHouse: any; guestName: string; setGuestName:(v:string)=>void; onHousing:Action }) {
  const state=player.housing;
  if(!state)return <Empty text="Housing is available when connected to the authoritative alpha server."/>;
  return <div className="space-y-5">
    {ownedHouse && <section><SectionTitle>YOUR HOUSE</SectionTitle><div className="rounded-2xl border border-amber-300/20 bg-amber-950/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-lg font-black text-amber-100">🏠 {ownedHouse.name}</div><div className="text-xs text-slate-400">{ownedHouse.mapId} · rent {money(ownedHouse.weeklyRent)}g/week · due {dateLabel(ownedHouse.rentDueAt)}</div></div><div className="flex gap-2"><button onClick={()=>onHousing('pay_rent',{houseId:ownedHouse.id})} className="moria-button-primary rounded-lg px-3 py-2 text-[10px] font-black">PAY RENT</button><button onClick={()=>onHousing('release',{houseId:ownedHouse.id})} className="moria-button rounded-lg px-3 py-2 text-[10px] text-rose-300">RELEASE</button></div></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><div><div className="mb-2 text-[10px] font-black text-slate-300">GUEST LIST</div><div className="flex gap-2"><input value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="Character name" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none focus:border-amber-300/40"/><button onClick={()=>{if(guestName.trim()){onHousing('guest_add',{houseId:ownedHouse.id,name:guestName.trim()});setGuestName('');}}} className="moria-button rounded-lg px-3 text-xs">ADD</button></div><div className="mt-2 flex flex-wrap gap-1">{(ownedHouse.guests||[]).map((guest:string)=><button key={guest} onClick={()=>onHousing('guest_remove',{houseId:ownedHouse.id,name:guest})} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-slate-300" title="Remove guest">{guest} ✕</button>)}</div></div>
      <div><div className="mb-2 text-[10px] font-black text-slate-300">PLACED DECOR</div><div className="flex flex-wrap gap-1">{(ownedHouse.decor||[]).map((item:any)=><button key={item.id} onClick={()=>onHousing('decor_remove',{houseId:ownedHouse.id,placementId:item.id})} className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-[10px]" title="Remove decoration">{item.icon} {item.name} ✕</button>)}</div></div></div>
      <div className="mt-4"><div className="mb-2 text-[10px] font-black text-slate-300">DECOR SHOP · place at your current tile inside the house</div><div className="grid gap-2 grid-cols-2 lg:grid-cols-4">{(state.decorCatalog||[]).map(item=><button key={item.id} onClick={()=>onHousing('decor_add',{houseId:ownedHouse.id,decorId:item.id,x:player.pos.x,y:player.pos.y})} className="moria-button rounded-lg p-2 text-left"><div className="text-lg">{item.icon}</div><div className="text-[10px] font-bold text-slate-200">{item.name}</div><div className="text-[9px] text-amber-300">{money(item.price)}g</div></button>)}</div></div>
    </div></section>}
    <section><SectionTitle>HOUSES ON THIS MAP</SectionTitle><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(state.houses||[]).map(house=><div key={house.id} className={`rounded-xl border p-3 ${house.ownerName?'border-white/10 bg-black/20':'border-emerald-300/20 bg-emerald-950/10'}`}><div className="flex items-start justify-between gap-2"><div className="font-black text-slate-100">{house.name}</div><span className="text-[9px] text-slate-400">Lv {house.levelRequired}+</span></div><div className="mt-1 text-[10px] text-slate-400">{house.ownerName?`Owner: ${house.ownerName}`:`For sale · ${money(house.price)}g`}</div><div className="mt-1 text-[9px] text-slate-500">Interior {house.width}×{house.height} · rent {money(house.weeklyRent)}g</div>{!house.ownerName&&!state.ownedHouseId&&<button onClick={()=>onHousing('buy',{houseId:house.id})} className="moria-button-primary mt-3 w-full rounded-lg py-2 text-[10px] font-black">BUY AT DOOR</button>}{house.ownerName&&<div className={`mt-3 text-[9px] font-black ${house.access?'text-emerald-300':'text-rose-300'}`}>{house.access?'✓ YOU HAVE ACCESS':'🔒 PRIVATE HOUSE'}</div>}</div>)}</div></section>
  </div>;
}

function OutfitsTab({ player, colors, setColors, onAppearance }: { player:Player; colors:Record<string,string>; setColors:(v:any)=>void; onAppearance:Action }) {
  const state=player.appearance;
  if(!state)return <Empty text="Outfits are available when connected to the authoritative alpha server."/>;
  const selected=state.catalog?.find(item=>item.id===state.selectedOutfitId);
  return <div className="space-y-5"><div className="rounded-2xl border border-violet-300/20 bg-violet-950/10 p-4"><div className="flex items-center gap-3"><div className="text-4xl">{selected?.icon||'🧑'}</div><div><div className="text-lg font-black text-violet-100">{selected?.name||state.selectedOutfitId}</div><div className="text-xs text-slate-400">Layered colors and addons are visible to nearby players.</div></div></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{(['head','primary','secondary','detail'] as const).map(key=><label key={key} className="rounded-xl border border-white/10 bg-black/25 p-2 text-[10px] uppercase text-slate-400"><span>{key}</span><div className="mt-1 flex items-center gap-2"><input type="color" value={colors[key]} onChange={e=>setColors({...colors,[key]:e.target.value})} className="h-8 w-10 cursor-pointer border-0 bg-transparent"/><span className="font-mono text-[9px]">{colors[key]}</span></div></label>)}</div><button onClick={()=>onAppearance('colors',{colors})} className="moria-button-primary mt-3 rounded-lg px-4 py-2 text-[10px] font-black">APPLY COLORS</button></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(state.catalog||[]).map(outfit=>{const owned=state.ownedOutfits.includes(outfit.id);const selectedNow=state.selectedOutfitId===outfit.id;const addons=state.ownedAddons[outfit.id]||[];const mask=state.addonMasks[outfit.id]||0;return <div key={outfit.id} className={`rounded-2xl border p-4 ${selectedNow?'border-violet-300/40 bg-violet-950/20':'border-white/10 bg-black/20'}`}><div className="flex items-start gap-3"><div className="text-3xl">{outfit.icon}</div><div className="min-w-0 flex-1"><div className="font-black text-slate-100">{outfit.name}</div><div className="text-[10px] text-slate-500">Lv {outfit.levelRequired}+ · {outfit.style}</div></div>{selectedNow&&<span className="text-[9px] font-black text-violet-200">EQUIPPED</span>}</div><button disabled={selectedNow||(!owned&&player.level<outfit.levelRequired)} onClick={()=>owned?onAppearance('select',{outfitId:outfit.id}):onAppearance('buy',{outfitId:outfit.id})} className="moria-button-primary mt-3 w-full rounded-lg py-2 text-[10px] font-black disabled:opacity-30">{owned?(selectedNow?'SELECTED':'SELECT'):`UNLOCK · ${money(outfit.price)}g`}</button>{owned&&<div className="mt-3 grid grid-cols-2 gap-2">{[1,2].map(addon=>{const label=addon===1?outfit.addon1Name:outfit.addon2Name;if(!label)return <div key={addon}/>;const has=addons.includes(addon);const visible=(mask&(addon===1?1:2))!==0;return <button key={addon} onClick={()=>has?onAppearance('toggle_addon',{outfitId:outfit.id,addon}):onAppearance('buy_addon',{outfitId:outfit.id,addon})} className={`moria-button rounded-lg p-2 text-[9px] ${visible?'text-amber-200 ring-1 ring-amber-300/25':'text-slate-300'}`}>{has?(visible?'✓ ':'○ '):'🔒 '}{label}{!has&&` · ${money(outfit.addonPrice)}g`}</button>})}</div>}</div>})}</div></div>;
}

function MountsTab({ player, onMount }: { player:Player; onMount:Action }) {
  const state=player.mounts;
  if(!state)return <Empty text="Mounts are available when connected to the authoritative alpha server."/>;
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-950/10 p-4"><div><div className="font-black text-amber-100">{state.mounted?'🐎 MOUNTED':'🚶 ON FOOT'}</div><div className="text-xs text-slate-400">Selected: {state.catalog.find(m=>m.id===state.selectedId)?.name||'none'} · server-authoritative movement speed</div></div><button disabled={!state.selectedId} onClick={()=>onMount('toggle',{})} className="moria-button-primary rounded-xl px-5 py-2 text-xs font-black disabled:opacity-30">{state.mounted?'DISMOUNT':'MOUNT'}</button></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{state.catalog.map(mount=>{const owned=state.ownedMounts.includes(mount.id);const selected=state.selectedId===mount.id;return <div key={mount.id} className={`rounded-2xl border p-4 ${selected?'border-amber-300/40 bg-amber-950/15':'border-white/10 bg-black/20'}`}><div className="flex gap-3"><div className="text-4xl">{mount.icon}</div><div className="min-w-0 flex-1"><div className="font-black text-slate-100">{mount.name}</div><div className="text-[10px] text-slate-400">+{mount.speedBonus}% speed · Lv {mount.levelRequired}+</div><div className="mt-1 text-[9px] leading-relaxed text-slate-500">{mount.description}</div></div></div><button disabled={selected||(!owned&&player.level<mount.levelRequired)} onClick={()=>owned?onMount('select',{mountId:mount.id}):onMount('buy',{mountId:mount.id})} className="moria-button mt-3 w-full rounded-lg py-2 text-[10px] font-black disabled:opacity-30">{owned?(selected?'SELECTED':'SELECT'):`BUY AT STABLE · ${money(mount.price)}g`}</button></div>})}</div></div>;
}

function SectionTitle({children}:{children:React.ReactNode}){return <div className="moria-eyebrow mb-2 text-[9px] text-amber-200/60">{children}</div>}
function Stat({icon,label,value}:{icon:string;label:string;value:string}){return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-xl">{icon}</div><div className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">{label}</div><div className="font-black text-slate-100">{value}</div></div>}
function Empty({text}:{text:string}){return <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">{text}</div>}
''')

# Type system additions.
replace_once('src/game/types.ts', "  // Stats\n  mounted: boolean;\n  mountId?: string;", r'''  // Alpha life systems (authoritative server snapshots when online)
  mounted: boolean;
  mountId?: string;
  tasks?: TaskSnapshot;
  appearance?: AppearanceSnapshot;
  mounts?: MountSnapshot;
  housing?: HousingSnapshot;''')
replace_once('src/game/types.ts', "  role: 'merchant' | 'quest' | 'banker' | 'trainer' | 'guard' | 'innkeeper';", "  role: 'merchant' | 'quest' | 'banker' | 'trainer' | 'guard' | 'innkeeper' | 'taskmaster' | 'stablemaster' | 'outfitter' | 'realtor';")
replace_once('src/game/types.ts', "  action?: 'shop' | 'quest' | 'bank' | 'train' | 'heal' | 'bye' | 'mail' | 'books' | 'depot' | 'food';", "  action?: 'shop' | 'quest' | 'bank' | 'train' | 'heal' | 'bye' | 'mail' | 'books' | 'depot' | 'food' | 'life';")
replace_once('src/game/types.ts', "// Mount system\nexport interface Mount {", r'''// Alpha 9.2 life-system snapshots.
export interface TaskCatalogEntry {
  id: string; name: string; npcId: string; mapId: string; target: string; targetName: string; count: number;
  minLevel: number; maxLevel: number; repeatLimit: number; taskPoints: number; rewardGold: number; rewardXp: number;
  bossUnlock?: string; description?: string; completedCount: number; locked: boolean;
}
export interface ActiveTaskEntry extends TaskCatalogEntry { progress: number; ready: boolean; startedAt: number; }
export interface TaskSnapshot { points: number; rank: string; maxActive: number; completed: Record<string,number>; unlockedBosses: string[]; active: ActiveTaskEntry[]; catalog: TaskCatalogEntry[]; }

export interface OutfitCatalogEntry { id:string; name:string; icon:string; style:string; price:number; levelRequired:number; addon1Name?:string; addon2Name?:string; addonPrice:number; }
export interface PublicAppearance { outfit:{id:string;name:string;icon?:string;style:string}; colors:{head:string;primary:string;secondary:string;detail:string}; addonMask:number; }
export interface AppearanceSnapshot { selectedOutfitId:string; ownedOutfits:string[]; ownedAddons:Record<string,number[]>; addonMasks:Record<string,number>; colors:{head:string;primary:string;secondary:string;detail:string}; catalog:OutfitCatalogEntry[]; public:PublicAppearance; }

export interface MountCatalogEntry { id:string; name:string; icon:string; color:string; speedBonus:number; price:number; levelRequired:number; description?:string; }
export interface MountSnapshot { ownedMounts:string[]; selectedId:string; mounted:boolean; catalog:MountCatalogEntry[]; }

export interface HousingDecoration { id:string; decorId:string; x:number; y:number; name:string; icon:string; color:string; }
export interface HouseSnapshot { id:string; name:string; mapId:string; x:number; y:number; width:number; height:number; entranceX:number; entranceY:number; price:number; weeklyRent:number; levelRequired:number; style?:string; ownerName:string; rentDueAt:number; access:boolean; guests?:string[]; decor:HousingDecoration[]; }
export interface HousingDecorCatalogEntry { id:string; name:string; icon:string; kind:string; color:string; price:number; }
export interface HousingSnapshot { ownedHouseId:string; houses:HouseSnapshot[]; decorCatalog:HousingDecorCatalogEntry[]; }

// Mount system (legacy Quick Play catalog; authoritative mode uses MountSnapshot.catalog)
export interface Mount {''')

# NPC adapters.
replace_once('src/game/serverContentAdapters.ts', "  const validRoles: NPC['role'][] = ['merchant', 'quest', 'banker', 'trainer', 'guard', 'innkeeper'];", "  const validRoles: NPC['role'][] = ['merchant', 'quest', 'banker', 'trainer', 'guard', 'innkeeper', 'taskmaster', 'stablemaster', 'outfitter', 'realtor'];")
replace_once('src/game/serverContentAdapters.ts', "  if (role === 'innkeeper') {\n    options.unshift({ text: 'Food & drinks', action: 'food' });\n    options.unshift({ text: 'Rest (50 gold)', action: 'heal' });\n  }", "  if (role === 'innkeeper') {\n    options.unshift({ text: 'Food & drinks', action: 'food' });\n    options.unshift({ text: 'Rest (50 gold)', action: 'heal' });\n  }\n  if (['taskmaster','stablemaster','outfitter','realtor'].includes(role)) options.unshift({ text: 'Life & Style', action: 'life' });")
# second validRoles occurrence
replace_once('src/game/serverContentAdapters.ts', "  const validRoles: NPC['role'][] = ['merchant', 'quest', 'banker', 'trainer', 'guard', 'innkeeper'];", "  const validRoles: NPC['role'][] = ['merchant', 'quest', 'banker', 'trainer', 'guard', 'innkeeper', 'taskmaster', 'stablemaster', 'outfitter', 'realtor'];")
replace_once('src/game/serverContentAdapters.ts', "  options.push({ text: 'Farewell.', action: 'bye' });", "  if (['taskmaster','stablemaster','outfitter','realtor'].includes(role)) options.unshift({ text: '🏠 Life & Style', action: 'life' });\n  options.push({ text: 'Farewell.', action: 'bye' });")

# ServerSync intents/events.
replace_once('src/game/ServerSync.ts', "  sendMount() {\n    if (!this.isActive()) return;\n    sendIntent({ type: 'mount', payload: {} });\n  }", r'''  sendMount(action = 'toggle', payload: Record<string, unknown> = {}) {
    if (!this.isActive()) return;
    sendIntent({ type: 'mount', payload: { action, ...payload } });
  }

  sendAppearance(action: string, payload: Record<string, unknown> = {}) {
    if (!this.isActive() || !action) return;
    sendIntent({ type: 'appearance', payload: { action, ...payload } });
  }

  sendTask(action: string, payload: Record<string, unknown> = {}) {
    if (!this.isActive() || !action) return;
    sendIntent({ type: 'task', payload: { action, ...payload } });
  }

  sendHousing(action: string, payload: Record<string, unknown> = {}) {
    if (!this.isActive() || !action) return;
    sendIntent({ type: 'housing', payload: { action, ...payload } });
  }''')
replace_once('src/game/ServerSync.ts', "        case 'adventure_claimed':\n          if (event.text) addMessage('Hunt', event.text, event.color || '#ffd87b', 'loot');\n          break;", r'''        case 'adventure_claimed':
          if (event.text) addMessage('Hunt', event.text, event.color || '#ffd87b', 'loot');
          break;
        case 'task_progress':
          if (event.text) addMessage('Task', event.text, event.color || '#7dd3fc', 'quest');
          break;
        case 'task_ready':
        case 'task_update':
          if (event.text) addMessage('Task', event.text, event.color || '#ffd87b', 'quest');
          break;
        case 'housing_update':
          if (event.text) addMessage('Housing', event.text, event.color || '#d9bd7a', 'system');
          break;
        case 'appearance_update':
          if (event.text) addMessage('Outfit', event.text, event.color || '#d49bc8', 'system');
          break;
        case 'mount_update':
          if (event.text) addMessage('Mount', event.text, event.color || '#d9bd7a', 'system');
          break;''')

# render.ts delegates drawPlayer to procedural avatar.
replace_once('src/game/render.ts', "import type { Tile, Monster, NPC } from './types';", "import type { Tile, Monster, NPC } from './types';\nimport { drawAvatar, type AvatarAppearance, type AvatarMount } from './playerAvatar';")
regex_once('src/game/render.ts', r"export function drawPlayer\(.*?\n\}\n\nexport function drawMonster\(", r'''export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: string,
  name: string,
  hp: number,
  maxHp: number,
  time: number,
  vocationColor = '#8b2e2e',
  mounted = false,
  mountIcon?: string,
  appearance?: AvatarAppearance | null,
  mount?: AvatarMount | null,
) {
  drawAvatar(ctx, x, y, size, direction, name, hp, maxHp, time, vocationColor, mounted, mountIcon, appearance, mount);
}

export function drawMonster(''')

# GameScreen minimal integration.
replace_once('src/components/GameScreen.tsx', "import SocialHub from './SocialHub';", "import SocialHub from './SocialHub';\nimport LifeStylePanel from './LifeStylePanel';")
replace_once('src/components/GameScreen.tsx', "import { drawWorldAtmosphere, weatherForMap, type WorldWeather } from '../game/worldAtmosphere';", "import { drawWorldAtmosphere, weatherForMap, type WorldWeather } from '../game/worldAtmosphere';\nimport { drawHousing } from '../game/housingPresentation';")
replace_once('src/components/GameScreen.tsx', "  const [showSocialHub, setShowSocialHub] = useState(false);", "  const [showSocialHub, setShowSocialHub] = useState(false);\n  const [showLifeStyle, setShowLifeStyle] = useState(false);")
replace_once('src/components/GameScreen.tsx', "      if (e.key.toLowerCase() === 'h') setShowAdventure((s) => !s);", "      if (e.key.toLowerCase() === 'h') setShowAdventure((s) => !s);\n      if (e.key.toLowerCase() === 'l') { if (serverSync.isActive()) setShowLifeStyle((s) => !s); else addMessage('System', 'Life & Style requires the authoritative alpha server.', '#ffb86b', 'system'); }")
replace_once('src/components/GameScreen.tsx', "    if (serverSync.isActive()) { serverSync.sendMount(); return; }", "    if (serverSync.isActive()) { serverSync.sendMount('toggle'); return; }")
replace_once('src/components/GameScreen.tsx', "      else if (action === 'food' || action === 'heal' || action === 'train' || action === 'shop') openOfficial('services');", "      else if (action === 'food' || action === 'heal' || action === 'train' || action === 'shop') openOfficial('services');\n      else if (action === 'life') setShowLifeStyle(true);")
replace_once('src/components/GameScreen.tsx', "    // NPCs\n    for (const n of npcsRef.current) {", "    // Houses and decoration are presentation-only projections of global server state.\n    if (serverSync.isActive()) drawHousing(ctx, p.housing, cam, TILE_SIZE, now);\n\n    // NPCs\n    for (const n of npcsRef.current) {")
replace_once('src/components/GameScreen.tsx', "    const mount = p.mountId ? MOUNTS.find((m) => m.id === p.mountId) : null;", "    const mount = serverSync.isActive() ? p.mounts?.catalog?.find((m) => m.id === p.mountId) : (p.mountId ? MOUNTS.find((m) => m.id === p.mountId) : null);")
replace_once('src/components/GameScreen.tsx', "      vocation?.color ?? '#8b2e2e', p.mounted, mount?.icon);", "      vocation?.color ?? '#8b2e2e', p.mounted, mount?.icon, p.appearance?.public, mount);")
replace_once('src/components/GameScreen.tsx', "        drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction || 'down', `${op.name} [Lv${op.level}]`, op.hp, op.maxHp, now, voc?.color || '#8b2e2e', op.mounted, undefined);", "        drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction || 'down', `${op.name} [Lv${op.level}]`, op.hp, op.maxHp, now, voc?.color || '#8b2e2e', op.mounted, op.mount?.icon, op.appearance, op.mount);")
replace_once('src/components/GameScreen.tsx', "          {onlineAccount && <TopButton icon=\"🌐\" label=\"Hub\" hotkey=\"O\" onClick={() => openOfficial('progress')} />}", "          {onlineAccount && <TopButton icon=\"🌐\" label=\"Hub\" hotkey=\"O\" onClick={() => openOfficial('progress')} />}\n          <TopButton icon=\"🏠\" label=\"Life\" hotkey=\"L\" onClick={() => serverSync.isActive() ? setShowLifeStyle((v) => !v) : addMessage('System', 'Life & Style requires the authoritative alpha server.', '#ffb86b', 'system')} />")
replace_once('src/components/GameScreen.tsx', "          {showSocialHub && serverSync.isActive() && socialState && (\n            <SocialHub", "          {showLifeStyle && serverSync.isActive() && (\n            <LifeStylePanel\n              player={player}\n              onTask={(action, payload) => serverSync.sendTask(action, payload)}\n              onHousing={(action, payload) => serverSync.sendHousing(action, payload)}\n              onAppearance={(action, payload) => serverSync.sendAppearance(action, payload)}\n              onMount={(action, payload) => serverSync.sendMount(action, payload)}\n              onClose={() => setShowLifeStyle(false)}\n            />\n          )}\n\n          {showSocialHub && serverSync.isActive() && socialState && (\n            <SocialHub")

# Static client architecture guard for 9.2.
write('server/test/client-alpha-systems-9-2.test.mjs', r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('9.2 avatar renderer is layered, extracted and consumes authoritative public appearance', () => {
  const avatar=read('src/game/playerAvatar.ts'), render=read('src/game/render.ts'), screen=read('src/components/GameScreen.tsx');
  assert.match(avatar,/export function drawAvatar/);
  assert.match(avatar,/addonMask/);
  assert.match(avatar,/drawMount/);
  assert.match(render,/drawAvatar\(ctx/);
  assert.match(screen,/op\.appearance, op\.mount/);
  assert.doesNotMatch(screen,/ownedOutfits\s*=|ownedMounts\s*=/);
});

test('9.2 Life & Style UI sends intents instead of mutating authoritative systems', () => {
  const panel=read('src/components/LifeStylePanel.tsx'), sync=read('src/game/ServerSync.ts');
  for(const action of ['onTask','onHousing','onAppearance','onMount']) assert.match(panel,new RegExp(action));
  assert.match(sync,/sendTask\(/); assert.match(sync,/sendHousing\(/); assert.match(sync,/sendAppearance\(/); assert.match(sync,/sendMount\(action/);
  assert.doesNotMatch(panel,/player\.gold\s*[-+]=/);
  assert.doesNotMatch(panel,/player\.mounted\s*=/);
});

test('9.2 housing presentation stays outside GameScreen and uses server snapshot only', () => {
  const housing=read('src/game/housingPresentation.ts'), screen=read('src/components/GameScreen.tsx');
  assert.match(housing,/export function drawHousing/);
  assert.match(screen,/drawHousing\(ctx, p\.housing/);
  assert.doesNotMatch(screen,/moria-housing|weeklyRent\s*=/);
});

test('9.2 server content adapters expose life-service NPC roles', () => {
  const adapters=read('src/game/serverContentAdapters.ts'), types=read('src/game/types.ts');
  for(const role of ['taskmaster','stablemaster','outfitter','realtor']) { assert.match(adapters,new RegExp(role)); assert.match(types,new RegExp(role)); }
  assert.match(adapters,/Life & Style/);
});
''')

# Append client-facing completion notes to 9.2 docs.
replace_once('docs/MORIA_9_2_ALPHA_SYSTEMS.md', "## Persistence", r'''## Client presentation and UX
- `LifeStylePanel` provides four player-facing tabs: Tasks, Housing, Outfits and Mounts.
- `playerAvatar.ts` replaces the fixed generic avatar with layered procedural silhouettes, four outfit colors, two addon layers and mount-specific bodies.
- Nearby authoritative players carry their public outfit/addon/color and selected mount projection, so appearance is consistent for every observer.
- `housingPresentation.ts` renders current-map house footprints, ownership/for-sale labels, doors and placed decoration without moving any authority into the renderer.
- Life-system UI sends intents only; prices, ownership, rewards, speed and access remain server-owned.

## Persistence''')

print('9.2 alpha client systems applied')
