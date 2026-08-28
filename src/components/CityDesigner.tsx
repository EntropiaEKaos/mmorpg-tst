import { useMemo, useRef, useState } from 'react';
import { MAPS, MAP_WIDTH, MAP_HEIGHT, syncServerMaps, type GameMap } from '../game/maps';
import {
  CITY_STYLES, CITY_STYLE_LABELS, CITY_PALETTES,
  type CityStyle, type CityLandmark, type CityDistrict, type CityProp,
} from '../game/cityIdentity';

interface Props { onApplied?: () => void; }
type Tool = 'select' | 'landmark' | 'district' | 'prop';
type Selection = { type: 'landmark' | 'district' | 'prop'; id: string } | null;
const LANDMARK_KINDS: CityLandmark['kind'][] = ['house','keep','market','temple','depot','gate','forge','dock','arena','obelisk','library','graveyard','lodge','tower'];
const PROP_KINDS: CityProp['kind'][] = ['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune'];
const CITY_STYLE_PT_BR: Record<CityStyle, string> = {
  royal: 'Capital Real', harbor: 'Portuária', ironwood: 'Bosque de Ferro', alpine: 'Alpina', marsh: 'Pântano', forge: 'Forja',
  crystal: 'Cristalina', storm: 'Tempestade', void: 'Vazio', nightfall: 'Anoitecer', sanctum: 'Santuário',
};
const OPTION_LABELS: Record<string, string> = {
  nearby: 'Próximo', always: 'Sempre', hidden: 'Oculto',
  house: 'Casa', keep: 'Fortaleza', market: 'Mercado', temple: 'Templo', depot: 'Depósito', gate: 'Portão', forge: 'Forja', dock: 'Doca', arena: 'Arena', obelisk: 'Obelisco', library: 'Biblioteca', graveyard: 'Cemitério', lodge: 'Alojamento', tower: 'Torre',
  banner: 'Estandarte', lamp: 'Luminária', statue: 'Estátua', brazier: 'Braseiro', crystal: 'Cristal', grave: 'Túmulo', tent: 'Tenda', sign: 'Placa', barrel: 'Barril', cart: 'Carroça', pine: 'Pinheiro', mushroom: 'Cogumelo', anchor: 'Âncora', rune: 'Runa',
};
const TOOL_LABELS: Record<Tool, string> = { select: 'SELEÇÃO', landmark: 'CONSTRUIR', district: 'DISTRITO', prop: 'OBJETO' };
const SETTLEMENT_LABELS: Record<string, string> = { wilderness: 'ERMO', town: 'VILA', city: 'CIDADE', capital: 'CAPITAL' };
const optionLabel = (value: string) => OPTION_LABELS[value] || value;


function cloneMap(map: GameMap): GameMap { return JSON.parse(JSON.stringify(map)); }
function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'entry'; }
function clamp(value: number, min = 1, max = Number.MAX_SAFE_INTEGER) { return Math.max(min, Math.min(max, Math.round(value))); }
function iconFor(kind: CityLandmark['kind']) { return kind === 'house' ? '⌂' : kind === 'temple' ? '✦' : kind === 'forge' ? '⚒' : kind === 'dock' ? '⚓' : kind === 'graveyard' ? '☠' : '◆'; }

export default function CityDesigner({ onApplied }: Props) {
  const ids = Object.keys(MAPS);
  const [mapId, setMapId] = useState(ids[0] || 'eldoria');
  const [draft, setDraft] = useState<GameMap>(() => cloneMap(MAPS[ids[0] || 'eldoria']));
  const [tool, setTool] = useState<Tool>('select');
  const [selection, setSelection] = useState<Selection>(null);
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState({ x: draft.townCenter.x, y: draft.townCenter.y });
  const [landmarkName, setLandmarkName] = useState('Nova Casa');
  const [landmarkKind, setLandmarkKind] = useState<CityLandmark['kind']>('house');
  const [propKind, setPropKind] = useState<CityProp['kind']>('banner');
  const [districtName, setDistrictName] = useState('Novo Distrito');
  const previewRef = useRef<HTMLDivElement>(null);
  const palette = CITY_PALETTES[draft.cityStyle];
  const mapWidth = Math.max(40, Math.min(192, Math.round(Number(draft.width) || MAP_WIDTH)));
  const mapHeight = Math.max(40, Math.min(192, Math.round(Number(draft.height) || MAP_HEIGHT)));
  const isCapital = draft.settlementClass === 'capital';
  const districtLimit = isCapital ? 24 : 8;
  const landmarkLimit = isCapital ? 64 : 12;
  const propLimit = isCapital ? 320 : 80;
  const districtRadiusLimit = isCapital ? 24 : 12;
  const landmarkSizeLimit = isCapital ? 20 : 10;
  const roadXPct = Math.max(1.2, 7 / mapWidth * 100);
  const roadYPct = Math.max(1.2, 7 / mapHeight * 100);

  const chooseMap = (id: string) => {
    setMapId(id); const next = cloneMap(MAPS[id]); setDraft(next); setCursor({ ...next.townCenter }); setSelection(null);
  };
  const updateStyle = (style: CityStyle) => {
    const p = CITY_PALETTES[style];
    setDraft((current) => ({ ...current, cityStyle: style, cityAccent: p.accent, roofColor: p.roof, wallColor: p.wall, roadColor: p.road }));
  };
  const point = (clientX: number, clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return cursor;
    return { x: clamp(((clientX - rect.left) / rect.width) * mapWidth), y: clamp(((clientY - rect.top) / rect.height) * mapHeight) };
  };
  const moveSelection = (next: { x: number; y: number }) => {
    if (!selection) return;
    setDraft((current) => {
      if (selection.type === 'landmark') return { ...current, landmarks: current.landmarks.map((entry) => entry.id === selection.id ? { ...entry, x: clamp(next.x, 1, mapWidth - entry.w - 1), y: clamp(next.y, 1, mapHeight - entry.h - 1) } : entry) };
      if (selection.type === 'district') return { ...current, districts: current.districts.map((entry) => entry.id === selection.id ? { ...entry, x: next.x, y: next.y } : entry) };
      return { ...current, props: current.props.map((entry) => entry.id === selection.id ? { ...entry, x: next.x, y: next.y } : entry) };
    });
  };
  const addAt = (at: { x: number; y: number }) => {
    const stamp = Date.now();
    if (tool === 'landmark') {
      const w = landmarkKind === 'keep' ? 6 : landmarkKind === 'house' ? 3 : 4;
      const h = landmarkKind === 'keep' ? 5 : landmarkKind === 'house' ? 3 : 4;
      const entry: CityLandmark = { id: `${draft.id}_${slug(landmarkName)}_${stamp}`, name: landmarkName.trim().slice(0, 60) || 'Marco', kind: landmarkKind, icon: iconFor(landmarkKind), x: clamp(at.x, 1, mapWidth - w - 1), y: clamp(at.y, 1, mapHeight - h - 1), w, h };
      setDraft((current) => ({ ...current, landmarks: [...current.landmarks, entry].slice(-landmarkLimit) })); setSelection({ type: 'landmark', id: entry.id }); setTool('select');
    } else if (tool === 'district') {
      const entry: CityDistrict = { id: `${draft.id}_${slug(districtName)}_${stamp}`, name: districtName.trim().slice(0, 60) || 'Distrito', icon: '◇', x: at.x, y: at.y, radius: 4, color: draft.cityAccent };
      setDraft((current) => ({ ...current, districts: [...current.districts, entry].slice(-districtLimit) })); setSelection({ type: 'district', id: entry.id }); setTool('select');
    } else if (tool === 'prop') {
      const entry: CityProp = { id: `${draft.id}_${propKind}_${stamp}`, kind: propKind, x: at.x, y: at.y, color: draft.cityAccent };
      setDraft((current) => ({ ...current, props: [...current.props, entry].slice(-propLimit) })); setSelection({ type: 'prop', id: entry.id }); setTool('select');
    }
  };
  const previewPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const next = point(event.clientX, event.clientY); setCursor(next);
    if (tool !== 'select') addAt(next); else setSelection(null);
  };
  const beginDrag = (event: React.PointerEvent, next: Selection) => {
    event.stopPropagation(); setSelection(next); setDragging(true); (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };
  const dragMove = (event: React.PointerEvent) => { if (!dragging || !selection) return; event.stopPropagation(); const next = point(event.clientX, event.clientY); setCursor(next); moveSelection(next); };
  const endDrag = (event: React.PointerEvent) => { if (!dragging) return; event.stopPropagation(); setDragging(false); };

  const updateLandmark = (patch: Partial<CityLandmark>) => setDraft((current) => ({ ...current, landmarks: current.landmarks.map((entry) => selection?.type === 'landmark' && entry.id === selection.id ? { ...entry, ...patch } : entry) }));
  const updateDistrict = (patch: Partial<CityDistrict>) => setDraft((current) => ({ ...current, districts: current.districts.map((entry) => selection?.type === 'district' && entry.id === selection.id ? { ...entry, ...patch } : entry) }));
  const updateProp = (patch: Partial<CityProp>) => setDraft((current) => ({ ...current, props: current.props.map((entry) => selection?.type === 'prop' && entry.id === selection.id ? { ...entry, ...patch } : entry) }));
  const removeSelected = () => {
    if (!selection) return;
    setDraft((current) => selection.type === 'landmark' ? { ...current, landmarks: current.landmarks.filter((x) => x.id !== selection.id) } : selection.type === 'district' ? { ...current, districts: current.districts.filter((x) => x.id !== selection.id) } : { ...current, props: current.props.filter((x) => x.id !== selection.id) });
    setSelection(null);
  };
  const duplicateSelected = () => {
    if (!selection) return; const stamp = Date.now();
    setDraft((current) => {
      if (selection.type === 'landmark') { const source = current.landmarks.find((x) => x.id === selection.id); if (!source || current.landmarks.length >= landmarkLimit) return current; const copy = { ...source, id: `${source.id}_copy_${stamp}`, name: `${source.name} Cópia`, x: clamp(source.x + 1, 1, mapWidth - source.w - 1), y: clamp(source.y + 1, 1, mapHeight - source.h - 1) }; setSelection({ type: 'landmark', id: copy.id }); return { ...current, landmarks: [...current.landmarks, copy] }; }
      if (selection.type === 'district') { const source = current.districts.find((x) => x.id === selection.id); if (!source || current.districts.length >= districtLimit) return current; const copy = { ...source, id: `${source.id}_copy_${stamp}`, name: `${source.name} Cópia`, x: clamp(source.x + 1, 1, mapWidth - 2), y: clamp(source.y + 1, 1, mapHeight - 2) }; setSelection({ type: 'district', id: copy.id }); return { ...current, districts: [...current.districts, copy] }; }
      const source = current.props.find((x) => x.id === selection.id); if (!source || current.props.length >= propLimit) return current; const copy = { ...source, id: `${source.id}_copy_${stamp}`, x: clamp(source.x + 1, 1, mapWidth - 2), y: clamp(source.y + 1, 1, mapHeight - 2) }; setSelection({ type: 'prop', id: copy.id }); return { ...current, props: [...current.props, copy] };
    });
  };

  const selectedLandmark = selection?.type === 'landmark' ? draft.landmarks.find((x) => x.id === selection.id) : undefined;
  const selectedDistrict = selection?.type === 'district' ? draft.districts.find((x) => x.id === selection.id) : undefined;
  const selectedProp = selection?.type === 'prop' ? draft.props.find((x) => x.id === selection.id) : undefined;
  const occupancy = useMemo(() => draft.landmarks.reduce((sum, x) => sum + x.w * x.h, 0), [draft.landmarks]);

  const apply = () => {
    const records = Object.values(MAPS).map((map) => map.id === draft.id ? cloneMap(draft) : cloneMap(map));
    syncServerMaps(records); try { localStorage.setItem('moria_city_designer_maps', JSON.stringify(records)); } catch {} setDraft(cloneMap(MAPS[draft.id])); onApplied?.();
  };
  const reset = () => { try { localStorage.removeItem('moria_city_designer_maps'); } catch {} location.reload(); };

  return <div data-city-designer-root="true" className="grid gap-3 xl:grid-cols-[330px_minmax(420px,1fr)_350px]">
    <section className="space-y-3 rounded border border-cyan-400/25 bg-black/40 p-3">
      <div><div className="text-[10px] font-black tracking-[.22em] text-cyan-200">DESIGNER DE CIDADE · EDIÇÃO DIRETA</div><div className="mt-1 text-[10px] text-purple-100/55">Posicione, selecione, arraste e redimensione áreas autoritativas de construções.</div></div>
      <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-200/60">MAPA<select data-city-designer-map-select="true" value={mapId} onChange={(e) => chooseMap(e.target.value)} className="mt-1 w-full rounded border border-purple-500/35 bg-black/65 px-2 py-2 text-xs text-purple-100">{ids.map((id) => <option key={id} value={id}>{MAPS[id].name}</option>)}</select></label>
      <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-200/60">ESTILO DA CIDADE<select value={draft.cityStyle} onChange={(e) => updateStyle(e.target.value as CityStyle)} className="mt-1 w-full rounded border border-purple-500/35 bg-black/65 px-2 py-2 text-xs text-purple-100">{CITY_STYLES.map((style) => <option key={style} value={style}>{CITY_STYLE_PT_BR[style] || CITY_STYLE_LABELS[style]}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-2"><ColorField label="Destaque" value={draft.cityAccent} onChange={(cityAccent) => setDraft({ ...draft, cityAccent })} /><ColorField label="Telhado" value={draft.roofColor} onChange={(roofColor) => setDraft({ ...draft, roofColor })} /><ColorField label="Paredes" value={draft.wallColor} onChange={(wallColor) => setDraft({ ...draft, wallColor })} /><ColorField label="Vias" value={draft.roadColor} onChange={(roadColor) => setDraft({ ...draft, roadColor })} /></div>
      <div className="rounded border border-purple-400/20 bg-purple-950/20 p-2"><div className="mb-2 text-[9px] font-black tracking-wider text-purple-200">POLÍTICA DE RÓTULOS DO MUNDO</div><div className="grid grid-cols-2 gap-2"><SelectMini label="Rótulos de NPCs" value={draft.npcNameplateMode || 'nearby'} options={['nearby','always','hidden']} onChange={(npcNameplateMode) => setDraft({ ...draft, npcNameplateMode: npcNameplateMode as GameMap['npcNameplateMode'] })} /><NumberField label="Distância de NPCs" value={draft.npcNameplateDistance ?? 7} min={2} max={20} onChange={(npcNameplateDistance) => setDraft({ ...draft, npcNameplateDistance })} /><SelectMini label="Rótulos de monstros" value={draft.monsterNameplateMode || 'nearby'} options={['nearby','always','hidden']} onChange={(monsterNameplateMode) => setDraft({ ...draft, monsterNameplateMode: monsterNameplateMode as GameMap['monsterNameplateMode'] })} /><NumberField label="Distância dos monstros" value={draft.monsterNameplateDistance ?? 9} min={2} max={24} onChange={(monsterNameplateDistance) => setDraft({ ...draft, monsterNameplateDistance })} /><NumberField label="Distância da barra de PV" value={draft.monsterBarDistance ?? 7} min={1} max={20} onChange={(monsterBarDistance) => setDraft({ ...draft, monsterBarDistance })} /><NumberField label="Fonte" value={draft.monsterNameplateFontSize ?? 8} min={7} max={14} onChange={(monsterNameplateFontSize) => setDraft({ ...draft, monsterNameplateFontSize })} /><NumberField label="Largura da barra" value={draft.monsterNameplateBarWidth ?? 30} min={18} max={72} onChange={(monsterNameplateBarWidth) => setDraft({ ...draft, monsterNameplateBarWidth })} /><NumberField label="Escala de chefe ×10" value={Math.round((draft.bossNameplateScale ?? 1.18) * 10)} min={8} max={18} onChange={(v) => setDraft({ ...draft, bossNameplateScale: v / 10 })} /></div><div className="mt-2 grid grid-cols-2 gap-1 text-[9px] text-purple-100/70"><Check label="Nível dos monstros" checked={draft.monsterNameplateShowLevel ?? true} onChange={(monsterNameplateShowLevel) => setDraft({ ...draft, monsterNameplateShowLevel })} /><Check label="Valores de PV" checked={draft.monsterNameplateShowValues ?? false} onChange={(monsterNameplateShowValues) => setDraft({ ...draft, monsterNameplateShowValues })} /><Check label="Chefes sempre visíveis" checked={draft.bossNameplateAlwaysVisible ?? true} onChange={(bossNameplateAlwaysVisible) => setDraft({ ...draft, bossNameplateAlwaysVisible })} /></div></div>
      <div className="grid grid-cols-2 gap-2"><button onClick={apply} className="rounded border border-emerald-300/45 bg-emerald-800/45 px-3 py-2 text-[10px] font-black text-emerald-100">APLICAR AO MUNDO</button><button onClick={reset} className="rounded border border-red-300/30 bg-red-950/35 px-3 py-2 text-[10px] font-black text-red-200">REDEFINIR LOCAL</button></div>
    </section>

    <section className="rounded border border-amber-300/20 bg-[#080705] p-3">
      <div className="mb-2 flex items-center justify-between gap-3"><div><div className="font-black text-amber-100">{draft.name}</div><div className="text-[9px] text-amber-100/45">{tool === 'select' ? 'Selecione e arraste áreas diretamente' : `Clique no mapa para posicionar ${TOOL_LABELS[tool].toLowerCase()}`} · {cursor.x},{cursor.y}</div></div><div className="text-right text-[9px] text-amber-100/50"><div>{mapWidth}×{mapHeight} · {SETTLEMENT_LABELS[draft.settlementClass || 'city'] || String(draft.settlementClass || 'city').toUpperCase()}</div><div>{draft.landmarks.length}/{landmarkLimit} construções · {occupancy} tiles bloqueados</div></div></div>
      <div ref={previewRef} data-city-designer-preview="true" data-map-width={mapWidth} data-map-height={mapHeight} data-settlement-class={draft.settlementClass || 'city'} data-landmark-limit={landmarkLimit} onPointerDown={previewPointerDown} onPointerMove={dragMove} onPointerUp={endDrag} onPointerCancel={endDrag} className="relative mx-auto w-full max-w-[620px] touch-none cursor-crosshair overflow-hidden border-2 border-[#665332] shadow-[inset_0_0_35px_rgba(0,0,0,.75)]" style={{ aspectRatio: `${mapWidth} / ${mapHeight}`, background: palette.district, backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: `${100 / mapWidth}% ${100 / mapHeight}%` }}>
        <div className="pointer-events-none absolute left-0 right-0" style={{ top: `${draft.townCenter.y / mapHeight * 100 - roadYPct / 2}%`, height: `${roadYPct}%`, background: `${draft.roadColor}bb` }} /><div className="pointer-events-none absolute bottom-0 top-0" style={{ left: `${draft.townCenter.x / mapWidth * 100 - roadXPct / 2}%`, width: `${roadXPct}%`, background: `${draft.roadColor}bb` }} />
        {draft.districts.map((d) => <div key={d.id} onPointerDown={(e) => beginDrag(e, { type: 'district', id: d.id })} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed ${selection?.id === d.id ? 'ring-2 ring-white' : ''}`} title={`${d.name} · arraste para mover`} style={{ left: `${d.x / mapWidth * 100}%`, top: `${d.y / mapHeight * 100}%`, width: `max(18px, ${d.radius * 2 / mapWidth * 100}%)`, height: `max(18px, ${d.radius * 2 / mapHeight * 100}%)`, borderColor: d.color, background: `${d.color}22` }}><span className="absolute inset-0 flex items-center justify-center text-[9px]" style={{ color: d.color }}>{d.icon}</span></div>)}
        {draft.landmarks.map((l) => <div key={l.id} data-city-landmark-id={l.id} onPointerDown={(e) => beginDrag(e, { type: 'landmark', id: l.id })} className={`absolute overflow-hidden border bg-black/70 ${selection?.id === l.id ? 'ring-2 ring-white z-20' : 'z-10'}`} title={`${l.name} · ${l.w}×${l.h} · arraste para mover`} style={{ left: `${l.x / mapWidth * 100}%`, top: `${l.y / mapHeight * 100}%`, width: `${l.w / mapWidth * 100}%`, height: `${l.h / mapHeight * 100}%`, minWidth: 14, minHeight: 14, borderColor: `${draft.cityAccent}cc` }}><div className="h-[38%] border-b border-black/60" style={{ background: draft.roofColor }} /><div className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color: draft.cityAccent }}>{l.icon}</div></div>)}
        {draft.props.map((p) => <div key={p.id} onPointerDown={(e) => beginDrag(e, { type: 'prop', id: p.id })} className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border border-black ${selection?.id === p.id ? 'ring-2 ring-white z-30' : 'z-20'}`} style={{ left: `${p.x / mapWidth * 100}%`, top: `${p.y / mapHeight * 100}%`, background: p.color || draft.cityAccent }} title={`${p.kind} · arraste para mover`} />)}
        <div className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 border border-white/80 bg-cyan-400/50" style={{ left: `${cursor.x / mapWidth * 100}%`, top: `${cursor.y / mapHeight * 100}%` }} />
      </div>
    </section>

    <section className="space-y-3 rounded border border-purple-400/25 bg-black/40 p-3">
      <div className="grid grid-cols-4 gap-1">{(['select','landmark','district','prop'] as Tool[]).map((entry) => <button key={entry} onClick={() => setTool(entry)} className={`rounded px-1 py-2 text-[8px] font-black uppercase ${tool === entry ? 'bg-purple-600 text-white' : 'bg-purple-950/50 text-purple-300'}`}>{TOOL_LABELS[entry]}</button>)}</div>
      {tool === 'landmark' && <><TextField label="Nome da construção" value={landmarkName} onChange={setLandmarkName} /><SelectMini label="Tipo da construção" value={landmarkKind} options={LANDMARK_KINDS} onChange={(v) => setLandmarkKind(v as CityLandmark['kind'])} /><div className="text-[9px] text-cyan-100/60">Clique no mapa: casas começam em 3×3 e podem ser redimensionadas após o posicionamento.</div></>}
      {tool === 'district' && <TextField label="Nome do distrito" value={districtName} onChange={setDistrictName} />}
      {tool === 'prop' && <SelectMini label="Objeto predefinido" value={propKind} options={PROP_KINDS} onChange={(v) => setPropKind(v as CityProp['kind'])} />}
      {selectedLandmark && <div className="space-y-2 rounded border border-amber-300/25 bg-amber-950/15 p-2"><div className="text-[9px] font-black text-amber-200">CONSTRUÇÃO SELECIONADA</div><TextField label="Nome" value={selectedLandmark.name} onChange={(name) => updateLandmark({ name })} /><SelectMini label="Tipo" value={selectedLandmark.kind} options={LANDMARK_KINDS} onChange={(kind) => updateLandmark({ kind: kind as CityLandmark['kind'], icon: iconFor(kind as CityLandmark['kind']) })} /><div className="grid grid-cols-4 gap-1"><NumberField label="X" value={selectedLandmark.x} min={1} max={mapWidth - selectedLandmark.w - 1} onChange={(x) => updateLandmark({ x })} /><NumberField label="Y" value={selectedLandmark.y} min={1} max={mapHeight - selectedLandmark.h - 1} onChange={(y) => updateLandmark({ y })} /><NumberField label="W" value={selectedLandmark.w} min={1} max={landmarkSizeLimit} onChange={(w) => updateLandmark({ w, x: clamp(selectedLandmark.x, 1, mapWidth - w - 1) })} /><NumberField label="H" value={selectedLandmark.h} min={1} max={landmarkSizeLimit} onChange={(h) => updateLandmark({ h, y: clamp(selectedLandmark.y, 1, mapHeight - h - 1) })} /></div><div className="grid grid-cols-2 gap-1"><button onClick={duplicateSelected} className="rounded bg-cyan-900/45 px-2 py-1.5 text-[9px] font-bold text-cyan-100">DUPLICAR</button><button onClick={removeSelected} className="rounded bg-red-950/55 px-2 py-1.5 text-[9px] font-bold text-red-200">EXCLUIR</button></div></div>}
      {selectedDistrict && <div className="space-y-2 rounded border border-cyan-300/20 p-2"><div className="text-[9px] font-black text-cyan-100">DISTRITO SELECIONADO</div><TextField label="Nome" value={selectedDistrict.name} onChange={(name) => updateDistrict({ name })} /><NumberField label="Raio" value={selectedDistrict.radius} min={1} max={districtRadiusLimit} onChange={(radius) => updateDistrict({ radius })} /><button onClick={removeSelected} className="w-full rounded bg-red-950/55 px-2 py-1.5 text-[9px] text-red-200">EXCLUIR</button></div>}
      {selectedProp && <div className="space-y-2 rounded border border-cyan-300/20 p-2"><div className="text-[9px] font-black text-cyan-100">OBJETO SELECIONADO</div><SelectMini label="Tipo" value={selectedProp.kind} options={PROP_KINDS} onChange={(kind) => updateProp({ kind: kind as CityProp['kind'] })} /><button onClick={removeSelected} className="w-full rounded bg-red-950/55 px-2 py-1.5 text-[9px] text-red-200">EXCLUIR</button></div>}
      {!selection && tool === 'select' && <div className="rounded border border-purple-400/20 bg-purple-950/20 p-3 text-[10px] leading-relaxed text-purple-100/65">Clique em uma construção, distrito ou objeto para inspecioná-lo. Arraste diretamente no mapa. A largura e a altura da construção atualizam a mesma área de colisão usada pelo servidor.</div>}
    </section>
  </div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-[9px] text-purple-200/60">{label}<div className="mt-1 flex items-center gap-1 rounded border border-purple-500/30 bg-black/55 p-1"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-8 bg-transparent" /><span className="font-mono text-[9px] text-purple-100">{value}</span></div></label>; }
function NumberField({ label, value, onChange, min = 1, max = 192 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) { return <label className="text-[9px] text-purple-200/60">{label}<input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))} className="mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100" /></label>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-[9px] text-purple-200/60">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100" /></label>; }
function SelectMini({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className="block text-[9px] text-purple-200/60">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100">{options.map((x) => <option key={x} value={x}>{optionLabel(x)}</option>)}</select></label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-1"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>; }
