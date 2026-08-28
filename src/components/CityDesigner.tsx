import { useMemo, useState } from 'react';
import { MAPS, MAP_WIDTH, MAP_HEIGHT, syncServerMaps, type GameMap } from '../game/maps';
import {
  CITY_STYLES, CITY_STYLE_LABELS, CITY_PALETTES,
  type CityStyle, type CityLandmark, type CityDistrict, type CityProp,
} from '../game/cityIdentity';

interface Props {
  onApplied?: () => void;
}

type Tool = 'landmark' | 'district' | 'prop';

function cloneMap(map: GameMap): GameMap {
  return JSON.parse(JSON.stringify(map));
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'entry';
}

export default function CityDesigner({ onApplied }: Props) {
  const ids = Object.keys(MAPS);
  const [mapId, setMapId] = useState(ids[0] || 'eldoria');
  const [draft, setDraft] = useState<GameMap>(() => cloneMap(MAPS[ids[0] || 'eldoria']));
  const [tool, setTool] = useState<Tool>('landmark');
  const [cursor, setCursor] = useState({ x: draft.townCenter.x, y: draft.townCenter.y });
  const [landmarkName, setLandmarkName] = useState('New Landmark');
  const [landmarkKind, setLandmarkKind] = useState<CityLandmark['kind']>('market');
  const [propKind, setPropKind] = useState<CityProp['kind']>('banner');
  const [districtName, setDistrictName] = useState('New District');
  const palette = CITY_PALETTES[draft.cityStyle];

  const chooseMap = (id: string) => {
    setMapId(id);
    const next = cloneMap(MAPS[id]);
    setDraft(next);
    setCursor({ ...next.townCenter });
  };

  const updateStyle = (style: CityStyle) => {
    const p = CITY_PALETTES[style];
    setDraft((current) => ({ ...current, cityStyle: style, cityAccent: p.accent, roofColor: p.roof, wallColor: p.wall, roadColor: p.road }));
  };

  const placeCurrentTool = () => {
    const stamp = Date.now();
    if (tool === 'landmark') {
      const entry: CityLandmark = {
        id: `${draft.id}_${slug(landmarkName)}_${stamp}`,
        name: landmarkName.trim().slice(0, 60) || 'Landmark', kind: landmarkKind,
        icon: landmarkKind === 'temple' ? '✦' : landmarkKind === 'forge' ? '⚒' : landmarkKind === 'dock' ? '⚓' : landmarkKind === 'graveyard' ? '☠' : '◆',
        x: cursor.x, y: cursor.y, w: landmarkKind === 'keep' ? 6 : 4, h: landmarkKind === 'keep' ? 5 : 4,
      };
      setDraft((current) => ({ ...current, landmarks: [...current.landmarks, entry].slice(-12) }));
    } else if (tool === 'district') {
      const entry: CityDistrict = {
        id: `${draft.id}_${slug(districtName)}_${stamp}`, name: districtName.trim().slice(0, 60) || 'District', icon: '◇',
        x: cursor.x, y: cursor.y, radius: 4, color: draft.cityAccent,
      };
      setDraft((current) => ({ ...current, districts: [...current.districts, entry].slice(-8) }));
    } else {
      const entry: CityProp = { id: `${draft.id}_${propKind}_${stamp}`, kind: propKind, x: cursor.x, y: cursor.y, color: draft.cityAccent };
      setDraft((current) => ({ ...current, props: [...current.props, entry].slice(-80) }));
    }
  };

  const apply = () => {
    const records = Object.values(MAPS).map((map) => map.id === draft.id ? cloneMap(draft) : cloneMap(map));
    syncServerMaps(records);
    try { localStorage.setItem('moria_city_designer_maps', JSON.stringify(records)); } catch { /* storage is optional */ }
    setDraft(cloneMap(MAPS[draft.id]));
    onApplied?.();
  };

  const reset = () => {
    try { localStorage.removeItem('moria_city_designer_maps'); } catch { /* ignore */ }
    location.reload();
  };

  const previewMarkers = useMemo(() => [
    ...draft.districts.map((d) => ({ id: d.id, x: d.x, y: d.y, icon: d.icon, label: d.name, color: d.color, size: Math.max(16, d.radius * 7), district: true })),
    ...draft.landmarks.map((l) => ({ id: l.id, x: l.x + l.w / 2, y: l.y + l.h / 2, icon: l.icon, label: l.name, color: draft.cityAccent, size: Math.max(16, Math.max(l.w, l.h) * 7), district: false })),
  ], [draft]);

  const previewClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(1, Math.min(MAP_WIDTH - 2, Math.round(((event.clientX - rect.left) / rect.width) * MAP_WIDTH)));
    const y = Math.max(1, Math.min(MAP_HEIGHT - 2, Math.round(((event.clientY - rect.top) / rect.height) * MAP_HEIGHT)));
    setCursor({ x, y });
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[340px_minmax(360px,1fr)_330px]">
      <section className="space-y-3 rounded border border-cyan-400/25 bg-black/40 p-3">
        <div>
          <div className="text-[10px] font-black tracking-[.22em] text-cyan-200">CITY DESIGNER · LIVE OFFLINE PREVIEW</div>
          <div className="mt-1 text-[10px] text-purple-100/55">Online publication uses the same map fields through the authoritative Content Studio.</div>
        </div>
        <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-200/60">Map
          <select value={mapId} onChange={(e) => chooseMap(e.target.value)} className="mt-1 w-full rounded border border-purple-500/35 bg-black/65 px-2 py-2 text-xs text-purple-100">
            {ids.map((id) => <option key={id} value={id}>{MAPS[id].name}</option>)}
          </select>
        </label>
        <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-200/60">City style
          <select value={draft.cityStyle} onChange={(e) => updateStyle(e.target.value as CityStyle)} className="mt-1 w-full rounded border border-purple-500/35 bg-black/65 px-2 py-2 text-xs text-purple-100">
            {CITY_STYLES.map((style) => <option key={style} value={style}>{CITY_STYLE_LABELS[style]}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Accent" value={draft.cityAccent} onChange={(cityAccent) => setDraft({ ...draft, cityAccent })} />
          <ColorField label="Roof" value={draft.roofColor} onChange={(roofColor) => setDraft({ ...draft, roofColor })} />
          <ColorField label="Walls" value={draft.wallColor} onChange={(wallColor) => setDraft({ ...draft, wallColor })} />
          <ColorField label="Road" value={draft.roadColor} onChange={(roadColor) => setDraft({ ...draft, roadColor })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Town X" value={draft.townCenter.x} onChange={(x) => setDraft({ ...draft, townCenter: { ...draft.townCenter, x } })} />
          <NumberField label="Town Y" value={draft.townCenter.y} onChange={(y) => setDraft({ ...draft, townCenter: { ...draft.townCenter, y } })} />
          <NumberField label="Radius" value={draft.townRange} min={0} max={20} onChange={(townRange) => setDraft({ ...draft, townRange })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={apply} className="rounded border border-emerald-300/45 bg-emerald-800/45 px-3 py-2 text-[10px] font-black tracking-wider text-emerald-100 hover:bg-emerald-700/60">APPLY TO WORLD</button>
          <button onClick={reset} className="rounded border border-red-300/30 bg-red-950/35 px-3 py-2 text-[10px] font-black tracking-wider text-red-200">RESET LOCAL</button>
        </div>
      </section>

      <section className="rounded border border-amber-300/20 bg-[#080705] p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div><div className="font-black text-amber-100">{draft.name}</div><div className="text-[9px] text-amber-100/45">Click the map to choose placement coordinates · {cursor.x},{cursor.y}</div></div>
          <span className="rounded border px-2 py-1 text-[9px] font-black" style={{ color: draft.cityAccent, borderColor: `${draft.cityAccent}66` }}>{CITY_STYLE_LABELS[draft.cityStyle]}</span>
        </div>
        <div onClick={previewClick} className="relative mx-auto aspect-square w-full max-w-[560px] cursor-crosshair overflow-hidden border-2 border-[#665332] shadow-[inset_0_0_35px_rgba(0,0,0,.75)]" style={{ background: palette.district }}>
          <div className="absolute left-0 right-0 h-[7%]" style={{ top: `${(draft.townCenter.y / MAP_HEIGHT) * 100 - 3.5}%`, background: `${draft.roadColor}bb` }} />
          <div className="absolute bottom-0 top-0 w-[7%]" style={{ left: `${(draft.townCenter.x / MAP_WIDTH) * 100 - 3.5}%`, background: `${draft.roadColor}bb` }} />
          <div className="absolute rounded-full border-2" style={{ left: `${(draft.townCenter.x / MAP_WIDTH) * 100 - 1.2}%`, top: `${(draft.townCenter.y / MAP_HEIGHT) * 100 - 1.2}%`, width: '2.4%', height: '2.4%', borderColor: draft.cityAccent, background: '#0b0a08' }} />
          {previewMarkers.map((marker) => <div key={marker.id} className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center ${marker.district ? 'rounded-full border border-dashed' : 'border bg-black/65'}`} title={marker.label} style={{ left: `${marker.x / MAP_WIDTH * 100}%`, top: `${marker.y / MAP_HEIGHT * 100}%`, width: marker.size, height: marker.size, borderColor: `${marker.color}aa`, color: marker.color, fontSize: marker.district ? 10 : 14, opacity: marker.district ? .55 : 1 }}>{marker.icon}</div>)}
          {draft.props.map((prop) => <div key={prop.id} className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 border border-black" style={{ left: `${prop.x / MAP_WIDTH * 100}%`, top: `${prop.y / MAP_HEIGHT * 100}%`, background: prop.color || draft.cityAccent }} title={prop.kind} />)}
          <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 border-2 border-white bg-cyan-400/60" style={{ left: `${cursor.x / MAP_WIDTH * 100}%`, top: `${cursor.y / MAP_HEIGHT * 100}%` }} />
        </div>
      </section>

      <section className="space-y-3 rounded border border-purple-400/25 bg-black/40 p-3">
        <div className="flex gap-1">
          {(['landmark','district','prop'] as Tool[]).map((entry) => <button key={entry} onClick={() => setTool(entry)} className={`flex-1 rounded px-2 py-2 text-[9px] font-black uppercase tracking-wider ${tool === entry ? 'bg-purple-600 text-white' : 'bg-purple-950/50 text-purple-300'}`}>{entry}</button>)}
        </div>
        {tool === 'landmark' && <>
          <TextField label="Landmark name" value={landmarkName} onChange={setLandmarkName} />
          <label className="block text-[9px] text-purple-200/60">Kind<select value={landmarkKind} onChange={(e) => setLandmarkKind(e.target.value as CityLandmark['kind'])} className="mt-1 w-full rounded border border-purple-500/35 bg-black/65 px-2 py-2 text-xs text-purple-100">{['keep','market','temple','depot','gate','forge','dock','arena','obelisk','library','graveyard','lodge','tower'].map((kind) => <option key={kind}>{kind}</option>)}</select></label>
        </>}
        {tool === 'district' && <TextField label="District name" value={districtName} onChange={setDistrictName} />}
        {tool === 'prop' && <label className="block text-[9px] text-purple-200/60">Prop preset<select value={propKind} onChange={(e) => setPropKind(e.target.value as CityProp['kind'])} className="mt-1 w-full rounded border border-purple-500/35 bg-black/65 px-2 py-2 text-xs text-purple-100">{['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune'].map((kind) => <option key={kind}>{kind}</option>)}</select></label>}
        <button onClick={placeCurrentTool} className="w-full rounded border border-cyan-300/35 bg-cyan-950/45 px-3 py-2 text-[10px] font-black tracking-wider text-cyan-100">PLACE AT {cursor.x},{cursor.y}</button>
        <EntryList title={`Landmarks · ${draft.landmarks.length}/12`} entries={draft.landmarks} onDelete={(id) => setDraft({ ...draft, landmarks: draft.landmarks.filter((x) => x.id !== id) })} />
        <EntryList title={`Districts · ${draft.districts.length}/8`} entries={draft.districts} onDelete={(id) => setDraft({ ...draft, districts: draft.districts.filter((x) => x.id !== id) })} />
        <EntryList title={`Props · ${draft.props.length}/80`} entries={draft.props.slice(-14)} onDelete={(id) => setDraft({ ...draft, props: draft.props.filter((x) => x.id !== id) })} />
      </section>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-[9px] text-purple-200/60">{label}<div className="mt-1 flex items-center gap-1 rounded border border-purple-500/30 bg-black/55 p-1"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-8 bg-transparent" /><span className="font-mono text-[9px] text-purple-100">{value}</span></div></label>;
}
function NumberField({ label, value, onChange, min = 1, max = 78 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return <label className="text-[9px] text-purple-200/60">{label}<input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))} className="mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100" /></label>;
}
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-[9px] text-purple-200/60">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-purple-500/30 bg-black/55 px-2 py-1.5 text-xs text-purple-100" /></label>;
}
function EntryList({ title, entries, onDelete }: { title: string; entries: Array<{ id: string; name?: string; kind?: string }>; onDelete: (id: string) => void }) {
  return <div><div className="mb-1 text-[8px] font-black uppercase tracking-wider text-purple-300/60">{title}</div><div className="max-h-24 space-y-1 overflow-y-auto">{entries.map((entry) => <div key={entry.id} className="flex items-center gap-2 rounded border border-purple-500/15 bg-black/45 px-2 py-1 text-[9px]"><span className="min-w-0 flex-1 truncate text-purple-100">{entry.name || entry.kind || entry.id}</span><button onClick={() => onDelete(entry.id)} className="text-red-400">×</button></div>)}</div></div>;
}
