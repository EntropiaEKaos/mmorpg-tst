import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import BookLibrary from './components/BookLibrary';
import MailBox from './components/MailBox';
import SocialHub from './components/SocialHub';
import Inventory from './components/Inventory';
import Depot from './components/Depot';
import AuctionHouse from './components/AuctionHouse';
import CoinShop from './components/CoinShop';
import TalentTree from './components/TalentTree';
import ActionBar from './components/ActionBar';
import CastBar, { triggerCast } from './components/CastBar';
import DPSMeter from './components/DPSMeter';
import WorldMiniMap from './components/WorldMiniMap';
import CityDesigner from './components/CityDesigner';
import GrandEldoriaPanorama from './components/GrandEldoriaPanorama';
import GrandSunreachPanorama from './components/GrandSunreachPanorama';
import GrandIronwoodPanorama from './components/GrandIronwoodPanorama';
import GrandFrostpeakPanorama from './components/GrandFrostpeakPanorama';
import GrandShadowfenPanorama from './components/GrandShadowfenPanorama';
import GrandEmberholdPanorama from './components/GrandEmberholdPanorama';
import GrandCrystalDeepPanorama from './components/GrandCrystalDeepPanorama';
import GlobalTooltipRenderer from './components/Tooltip';
import LocaleBridge from './components/LocaleBridge';
import { saveBook, sendSystemMail } from './game/content';
import type { Item, Player } from './game/types';
import { saveAuctionListings, setCoins } from './game/economy';
import { VOCATIONS } from './game/classes';
import { dpsMeter } from './game/dpsMeter';
import { MAPS, syncServerMaps } from './game/maps';

const QA_PLAYER = {
  name: 'Aurora',
  level: 14,
  gold: 9480,
  bankGold: 12650,
  vocation: 'knight',
  hp: 420,
  maxHp: 460,
  mana: 115,
  maxMana: 140,
  attack: 52,
  defense: 31,
  magic: 12,
  activeQuests: [],
} as unknown as Player;


const QA_GRAND_MAP = {
  id: 'qa_grand_capital', name: 'Nova Auroria', description: 'Capital sintética para prova visual de escala.', biome: 'plains',
  width: 160, height: 160, settlementClass: 'capital', urbanBounds: { x: 28, y: 28, width: 104, height: 104 },
  seed: 935, spawnX: 80, spawnY: 80, townX: 80, townY: 80, townRange: 18,
  cityStyle: 'royal', cityAccent: '#d8b45a', roofColor: '#7e2f34', wallColor: '#c9b68d', roadColor: '#9b8764',
  districts: [
    { id: 'qa_civic', name: 'Distrito Cívico', icon: '♜', x: 80, y: 80, radius: 14, color: '#d8b45a' },
    { id: 'qa_high', name: 'Distrito Alto', icon: '◇', x: 126, y: 68, radius: 11, color: '#caa6ff' },
  ],
  landmarks: [
    { id: 'qa_sun_keep', name: 'Fortaleza Solar', kind: 'keep', icon: '♜', x: 70, y: 62, w: 18, h: 14 },
    { id: 'qa_far_keep', name: 'Bastião do Horizonte', kind: 'tower', icon: '◆', x: 124, y: 72, w: 16, h: 12 },
    { id: 'qa_grand_market', name: 'Grande Mercado', kind: 'market', icon: '⚖', x: 102, y: 110, w: 14, h: 10 },
  ],
  props: [
    { id: 'qa_banner_far', kind: 'banner', x: 142, y: 118, color: '#d8b45a' },
    { id: 'qa_statue', kind: 'statue', x: 80, y: 94, color: '#f5de8f' },
  ],
  portals: [{ x: 150, y: 80, targetMap: 'eldoria', targetX: 40, targetY: 40, label: 'Portal de Eldoria' }],
};

const QA_GRAND_PLAYER = { ...QA_PLAYER, mapId: 'qa_grand_capital', pos: { x: 136, y: 118 } } as unknown as Player;

function seedVisualQa() {
  localStorage.removeItem('moria_books');
  localStorage.removeItem('moria_read_books_Aurora');
  localStorage.removeItem('moria_mail_Aurora');
  localStorage.removeItem('moria_city_designer_maps');
  syncServerMaps([QA_GRAND_MAP]);
  // Deterministic HUD position for screenshot proof. This only affects visual-qa.html.
  localStorage.setItem('moria:hud:action-bar:position', JSON.stringify({ x: 220, y: 820 }));
  saveBook({
    id: 'qa-eldoria',
    title: 'Chronicles of Eldoria',
    author: 'Archivist Selene',
    icon: '📜',
    color: '#9b59ff',
    pages: [
      'Eldoria was raised around the first safe roads of the realm. Its walls became a promise: civilization could survive the darkness.',
      'Travelers still gather beneath the old banners, trading stories before crossing into the wilds.',
    ],
    createdAt: 1,
  });
  sendSystemMail(
    QA_PLAYER.name,
    'Royal Courier',
    "Welcome to Mor'ia",
    'Your field report has been accepted. Supplies are attached for the next expedition.',
    275,
    { name: 'Health Potion', icon: '🧪', value: 50 },
  );
  localStorage.setItem(`tibia_depot_${QA_PLAYER.name}`, JSON.stringify([
    { id: 'depot-scale', name: 'Dragon Scale', icon: '🔷', type: 'material', quantity: 4, value: 800 },
    { id: 'depot-bone', name: 'Bone', icon: '🦴', type: 'material', quantity: 17, value: 12 },
  ]));
  saveAuctionListings([]);
  setCoins(QA_PLAYER.name, 850);
  dpsMeter.clear();
  dpsMeter.record(QA_PLAYER.name, 'Orc Warrior', 184, 'physical', false);
  dpsMeter.record(QA_PLAYER.name, 'Orc Warrior', 332, 'physical', true);
  dpsMeter.record(QA_PLAYER.name, QA_PLAYER.name, 146, 'heal', false);
}

seedVisualQa();

const socialFixture = {
  friends: [
    { key: 'thane', name: 'Thane', online: true, player: { level: 18, mapId: 'eldoria' } },
    { key: 'lyra', name: 'Lyra', online: false },
  ],
  nearby: [
    { id: 'near-1', name: 'Kael', level: 12 },
    { id: 'near-2', name: 'Selene', level: 16 },
  ],
  ignored: [],
  party: null,
  guild: null,
  trade: null,
};


function CastVisualQa() {
  useEffect(() => {
    const id = window.setTimeout(() => triggerCast('Fierce Berserk', '🔥', 4000, '#ff6a00'), 60);
    return () => window.clearTimeout(id);
  }, []);
  return <CastBar />;
}


const ELDORIA_QA_PLAYER = { ...QA_PLAYER, mapId: 'eldoria', pos: { x: 120, y: 120 } } as unknown as Player;
type EldoriaQaMode = 'eldoria-minimap' | 'eldoria-city-designer' | 'eldoria-panorama';

function AuthoritativeGrandEldoriaQa({ mode }: { mode: EldoriaQaMode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const base = params.get('qaServer') || 'http://127.0.0.1:3000';
    const token = params.get('qaToken') || '';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        const records = Array.isArray(payload?.items) ? payload.items : [];
        const eldoria = records.find((record: any) => record?.id === 'eldoria');
        if (!eldoria || Number(eldoria.width) !== 160 || Number(eldoria.height) !== 160 || eldoria.settlementClass !== 'capital') {
          throw new Error('Grand Eldoria autoritativa 160×160 não foi recebida do servidor');
        }
        syncServerMaps(records);
        setStatus('ready');
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : String(reason));
        setStatus('error');
      });
    return () => { active = false; };
  }, []);

  if (status === 'loading') return <div className="relative z-10 p-8 text-amber-100" data-grand-eldoria-server-loading="true">Sincronizando Grand Eldoria com o servidor autoritativo…</div>;
  if (status === 'error') return <div className="relative z-10 p-8 text-red-200" data-grand-eldoria-server-error="true">{error}</div>;

  const map = MAPS.eldoria;
  if (mode === 'eldoria-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-eldoria-server-ready="minimap" className="rounded-xl border border-amber-300/30 bg-black/70 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-amber-100">GRAND ELDORIA · CAPITAL 160×160</div><div className="mt-1 text-[10px] text-amber-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · jogador 120,120</div></div><WorldMiniMap player={ELDORIA_QA_PLAYER} monsters={[]} mapId="eldoria" /></div></div>;
  if (mode === 'eldoria-city-designer') return <div className="relative z-10 p-4" data-grand-eldoria-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-eldoria-server-ready="panorama"><GrandEldoriaPanorama /></div>;
}


const SUNREACH_QA_PLAYER = { ...QA_PLAYER, mapId: 'sunreach_coast', pos: { x: 120, y: 90 } } as unknown as Player;
type SunreachQaMode = 'sunreach-minimap' | 'sunreach-city-designer' | 'sunreach-panorama';

function AuthoritativeGrandSunreachQa({ mode }: { mode: SunreachQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true; const params=new URLSearchParams(window.location.search); const base=params.get('qaServer')||'http://127.0.0.1:3000'; const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`); return response.json();}).then(payload=>{
      if(!active) return; const records=Array.isArray(payload?.items)?payload.items:[]; const sunreach=records.find((record:any)=>record?.id==='sunreach_coast');
      if(!sunreach||Number(sunreach.width)!==160||Number(sunreach.height)!==160||sunreach.settlementClass!=='capital'||sunreach.urbanPlan!=='harbor-crescent') throw new Error('Grand Sunreach autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records); setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');}); return()=>{active=false;};
  },[]);
  if(status==='loading') return <div className="relative z-10 p-8 text-cyan-100" data-grand-sunreach-server-loading="true">Sincronizando Grand Sunreach com o servidor autoritativo…</div>;
  if(status==='error') return <div className="relative z-10 p-8 text-red-200" data-grand-sunreach-server-error="true">{error}</div>;
  const map=MAPS.sunreach_coast;
  if(mode==='sunreach-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-sunreach-server-ready="minimap" className="rounded-xl border border-cyan-300/30 bg-black/70 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-cyan-50">GRAND SUNREACH · CAPITAL PORTUÁRIA 160×160</div><div className="mt-1 text-[10px] text-cyan-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · jogador 120,90</div></div><WorldMiniMap player={SUNREACH_QA_PLAYER} monsters={[]} mapId="sunreach_coast" /></div></div>;
  if(mode==='sunreach-city-designer') return <div className="relative z-10 p-4" data-grand-sunreach-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-sunreach-server-ready="panorama"><GrandSunreachPanorama /></div>;
}


const IRONWOOD_QA_PLAYER = { ...QA_PLAYER, mapId: 'ironwood', pos: { x: 120, y: 118 } } as unknown as Player;
type IronwoodQaMode = 'ironwood-minimap' | 'ironwood-city-designer' | 'ironwood-panorama';

function AuthoritativeGrandIronwoodQa({ mode }: { mode: IronwoodQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true; const params=new URLSearchParams(window.location.search); const base=params.get('qaServer')||'http://127.0.0.1:3000'; const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`); return response.json();}).then(payload=>{
      if(!active) return; const records=Array.isArray(payload?.items)?payload.items:[]; const ironwood=records.find((record:any)=>record?.id==='ironwood');
      if(!ironwood||Number(ironwood.width)!==160||Number(ironwood.height)!==160||ironwood.settlementClass!=='capital'||ironwood.urbanPlan!=='forest-rings') throw new Error('Grand Ironwood autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records); setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');}); return()=>{active=false;};
  },[]);
  if(status==='loading') return <div className="relative z-10 p-8 text-lime-100" data-grand-ironwood-server-loading="true">Sincronizando Grand Ironwood com o servidor autoritativo…</div>;
  if(status==='error') return <div className="relative z-10 p-8 text-red-200" data-grand-ironwood-server-error="true">{error}</div>;
  const map=MAPS.ironwood;
  if(mode==='ironwood-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-ironwood-server-ready="minimap" className="rounded-xl border border-lime-300/25 bg-black/70 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-lime-50">GRAND IRONWOOD · CAPITAL FLORESTAL 160×160</div><div className="mt-1 text-[10px] text-lime-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · jogador 120,118</div></div><WorldMiniMap player={IRONWOOD_QA_PLAYER} monsters={[]} mapId="ironwood" /></div></div>;
  if(mode==='ironwood-city-designer') return <div className="relative z-10 p-4" data-grand-ironwood-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-ironwood-server-ready="panorama"><GrandIronwoodPanorama /></div>;
}


const FROSTPEAK_QA_PLAYER = { ...QA_PLAYER, mapId: 'frostpeak', pos: { x: 118, y: 116 } } as unknown as Player;
type FrostpeakQaMode = 'frostpeak-minimap' | 'frostpeak-city-designer' | 'frostpeak-panorama';

function AuthoritativeGrandFrostpeakQa({ mode }: { mode: FrostpeakQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true; const params=new URLSearchParams(window.location.search); const base=params.get('qaServer')||'http://127.0.0.1:3000'; const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`); return response.json();}).then(payload=>{
      if(!active)return; const records=Array.isArray(payload?.items)?payload.items:[]; const frostpeak=records.find((record:any)=>record?.id==='frostpeak');
      if(!frostpeak||Number(frostpeak.width)!==160||Number(frostpeak.height)!==160||frostpeak.settlementClass!=='capital'||frostpeak.urbanPlan!=='terraced-bastion'||!Array.isArray(frostpeak.landmarks)||frostpeak.landmarks.length!==41) throw new Error('Grand Frostpeak autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records);setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');});return()=>{active=false;};
  },[]);
  if(status==='loading') return <div className="relative z-10 p-8 text-cyan-100" data-grand-frostpeak-server-loading="true">Sincronizando Grand Frostpeak com o servidor autoritativo…</div>;
  if(status==='error') return <div className="relative z-10 p-8 text-red-200" data-grand-frostpeak-server-error="true">{error}</div>;
  const map=MAPS.frostpeak;
  if(mode==='frostpeak-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-frostpeak-server-ready="minimap" className="rounded-xl border border-cyan-200/30 bg-black/75 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-cyan-50">GRAND FROSTPEAK · CAPITAL ALPINA 160×160</div><div className="mt-1 text-[10px] text-cyan-50/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · 4 acessos · jogador 118,116</div></div><WorldMiniMap player={FROSTPEAK_QA_PLAYER} monsters={[]} mapId="frostpeak" /></div></div>;
  if(mode==='frostpeak-city-designer') return <div className="relative z-10 p-4" data-grand-frostpeak-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-frostpeak-server-ready="panorama"><GrandFrostpeakPanorama /></div>;
}


const SHADOWFEN_QA_PLAYER = { ...QA_PLAYER, mapId: 'shadowfen', pos: { x: 116, y: 122 } } as unknown as Player;
type ShadowfenQaMode = 'shadowfen-minimap' | 'shadowfen-city-designer' | 'shadowfen-panorama';

function AuthoritativeGrandShadowfenQa({ mode }: { mode: ShadowfenQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true; const params=new URLSearchParams(window.location.search); const base=params.get('qaServer')||'http://127.0.0.1:3000'; const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`); return response.json();}).then(payload=>{
      if(!active)return; const records=Array.isArray(payload?.items)?payload.items:[]; const shadowfen=records.find((record:any)=>record?.id==='shadowfen');
      if(!shadowfen||Number(shadowfen.width)!==160||Number(shadowfen.height)!==160||shadowfen.settlementClass!=='capital'||shadowfen.urbanPlan!=='marsh-wards'||!Array.isArray(shadowfen.landmarks)||shadowfen.landmarks.length!==42) throw new Error('Grand Shadowfen autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records);setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');});return()=>{active=false;};
  },[]);
  if(status==='loading') return <div className="relative z-10 p-8 text-lime-100" data-grand-shadowfen-server-loading="true">Sincronizando Grand Shadowfen com o servidor autoritativo…</div>;
  if(status==='error') return <div className="relative z-10 p-8 text-red-200" data-grand-shadowfen-server-error="true">{error}</div>;
  const map=MAPS.shadowfen;
  if(mode==='shadowfen-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-shadowfen-server-ready="minimap" className="rounded-xl border border-lime-200/25 bg-black/75 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-lime-50">GRAND SHADOWFEN · CAPITAL DO BREJO 160×160</div><div className="mt-1 text-[10px] text-lime-50/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · 4 acessos físicos · jogador 116,122</div></div><WorldMiniMap player={SHADOWFEN_QA_PLAYER} monsters={[]} mapId="shadowfen" /></div></div>;
  if(mode==='shadowfen-city-designer') return <div className="relative z-10 p-4" data-grand-shadowfen-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-shadowfen-server-ready="panorama"><GrandShadowfenPanorama /></div>;
}


const EMBERHOLD_QA_PLAYER = { ...QA_PLAYER, mapId: 'emberhold', pos: { x: 116, y: 122 } } as unknown as Player;
type EmberholdQaMode = 'emberhold-minimap' | 'emberhold-city-designer' | 'emberhold-panorama';

function AuthoritativeGrandEmberholdQa({ mode }: { mode: EmberholdQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;const params=new URLSearchParams(window.location.search);const base=params.get('qaServer')||'http://127.0.0.1:3000';const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error(`Servidor de conteúdo respondeu ${response.status}`);return response.json();}).then(payload=>{
      if(!active)return;const records=Array.isArray(payload?.items)?payload.items:[];const emberhold=records.find((record:any)=>record?.id==='emberhold');
      if(!emberhold||Number(emberhold.width)!==160||Number(emberhold.height)!==160||emberhold.settlementClass!=='capital'||emberhold.urbanPlan!=='caldera-radials'||!Array.isArray(emberhold.landmarks)||emberhold.landmarks.length!==42)throw new Error('Grand Emberhold autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records);setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');});return()=>{active=false;};
  },[]);
  if(status==='loading')return <div className="relative z-10 p-8 text-orange-100" data-grand-emberhold-server-loading="true">Sincronizando Grand Emberhold com o servidor autoritativo…</div>;
  if(status==='error')return <div className="relative z-10 p-8 text-red-200" data-grand-emberhold-server-error="true">{error}</div>;
  const map=MAPS.emberhold;
  if(mode==='emberhold-minimap')return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-emberhold-server-ready="minimap" className="rounded-xl border border-orange-300/25 bg-black/75 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-orange-50">GRAND EMBERHOLD · CAPITAL VULCÂNICA 160×160</div><div className="mt-1 text-[10px] text-orange-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · 4 acessos físicos · jogador 116,122</div></div><WorldMiniMap player={EMBERHOLD_QA_PLAYER} monsters={[]} mapId="emberhold" /></div></div>;
  if(mode==='emberhold-city-designer')return <div className="relative z-10 p-4" data-grand-emberhold-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-emberhold-server-ready="panorama"><GrandEmberholdPanorama /></div>;
}


const CRYSTAL_DEEP_QA_PLAYER = { ...QA_PLAYER, mapId: 'crystal_deep', pos: { x: 108, y: 118 } } as unknown as Player;
type CrystalDeepQaMode = 'crystal-deep-minimap' | 'crystal-deep-city-designer' | 'crystal-deep-panorama';

function AuthoritativeGrandCrystalDeepQa({ mode }: { mode: CrystalDeepQaMode }) {
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;const params=new URLSearchParams(window.location.search);const base=params.get('qaServer')||'http://127.0.0.1:3000';const token=params.get('qaToken')||'';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`,{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error(`Servidor de conteúdo respondeu ${response.status}`);return response.json();}).then(payload=>{
      if(!active)return;const records=Array.isArray(payload?.items)?payload.items:[];const crystal=records.find((record:any)=>record?.id==='crystal_deep');
      if(!crystal||Number(crystal.width)!==160||Number(crystal.height)!==160||crystal.settlementClass!=='capital'||crystal.urbanPlan!=='geode-chambers'||!Array.isArray(crystal.landmarks)||crystal.landmarks.length!==42)throw new Error('Grand Crystal Deep autoritativa 160×160 não foi recebida do servidor');
      syncServerMaps(records);setStatus('ready');
    }).catch(reason=>{if(!active)return;setError(reason instanceof Error?reason.message:String(reason));setStatus('error');});return()=>{active=false;};
  },[]);
  if(status==='loading')return <div className="relative z-10 p-8 text-cyan-100" data-grand-crystal-deep-server-loading="true">Sincronizando Grand Crystal Deep com o servidor autoritativo…</div>;
  if(status==='error')return <div className="relative z-10 p-8 text-red-200" data-grand-crystal-deep-server-error="true">{error}</div>;
  const map=MAPS.crystal_deep;
  if(mode==='crystal-deep-minimap')return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-crystal-deep-server-ready="minimap" className="rounded-xl border border-cyan-300/25 bg-black/80 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-cyan-50">GRAND CRYSTAL DEEP · CAPITAL SUBTERRÂNEA 160×160</div><div className="mt-1 text-[10px] text-cyan-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · 4 poços/acessos físicos · jogador 108,118</div></div><WorldMiniMap player={CRYSTAL_DEEP_QA_PLAYER} monsters={[]} mapId="crystal_deep" /></div></div>;
  if(mode==='crystal-deep-city-designer')return <div className="relative z-10 p-4" data-grand-crystal-deep-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-crystal-deep-server-ready="panorama"><GrandCrystalDeepPanorama /></div>;
}

function VisualQa() {
  const panel = new URLSearchParams(window.location.search).get('panel') || 'library';
  const [inventory, setInventory] = useState<Item[]>([
    { id: 'qa-potion', name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 3, value: 50 } as Item,
    { id: 'qa-mana', name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 5, value: 50 } as Item,
    { id: 'qa-bone', name: 'Bone', icon: '🦴', type: 'material', quantity: 8, value: 12 } as Item,
    { id: 'qa-sword', name: 'Steel Sword', icon: '⚔', type: 'equipment', quantity: 1, value: 120, equipment: { id: 'steel_sword', name: 'Steel Sword', icon: '⚔', slot: 'weapon', attack: 12, rarity: 'uncommon', level: 5, value: 120 } } as Item,
  ]);
  const [qaPlayer, setQaPlayer] = useState<Player>(QA_PLAYER);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100" data-visual-qa-ready={panel}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(139,92,246,0.14),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.08),transparent_30%)]" />
      {panel === 'library' && <BookLibrary player={QA_PLAYER} onClose={() => {}} />}
      {panel === 'mail' && <MailBox player={QA_PLAYER} inventory={inventory} setInventory={setInventory} onClose={() => {}} addMessage={() => {}} onClaimGold={() => {}} />}
      {panel === 'social' && <SocialHub player={QA_PLAYER} inventory={inventory} social={socialFixture} onAction={() => {}} onClose={() => {}} />}
      {panel === 'inventory' && <Inventory items={inventory} onClose={() => {}} onUse={() => {}} onEquip={() => {}} playerLevel={qaPlayer.level} playerName={qaPlayer.name} onDropItem={() => {}} showShop shopName="Gorn" shopItems={[{ name: 'Health Potion', icon: '🧪', type: 'potion', price: 50, description: 'Restores 50 HP' } as any]} onBuy={() => {}} />}
      {panel === 'depot' && <Depot player={qaPlayer} inventory={inventory} setInventory={setInventory} onClose={() => {}} />}
      {panel === 'auction' && <AuctionHouse player={qaPlayer} inventory={inventory} setInventory={setInventory} setPlayer={setQaPlayer} onClose={() => {}} addMessage={() => {}} />}
      {panel === 'coinshop' && <CoinShop player={qaPlayer} onClose={() => {}} addMessage={() => {}} onPurchase={() => true} />}
      {panel === 'talents' && <TalentTree player={qaPlayer} setPlayer={setQaPlayer} onClose={() => {}} />}
      {panel === 'actionbar' && <div data-qa-actionbar><GlobalTooltipRenderer /><ActionBar player={qaPlayer} spells={VOCATIONS.knight.spells} potions={{ hp: 4, mp: 3, hpg: 1 }} onCastSpell={() => {}} onUsePotion={() => {}} /></div>}
      {panel === 'castbar' && <CastVisualQa />}
      {panel === 'dps' && <DPSMeter onClose={() => {}} />}
      {panel === 'grand-minimap' && <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-minimap-proof="true" className="rounded border border-amber-300/25 bg-black/65 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-amber-100">NOVA AURORIA · CAPITAL 160×160</div><div className="text-[10px] text-amber-100/55">Prova de escala · jogador 136,118 · Bastião do Horizonte 124,72</div></div><WorldMiniMap player={QA_GRAND_PLAYER} monsters={[]} mapId="qa_grand_capital" /></div></div>}
      {panel === 'grand-city-designer' && <div className="relative z-10 p-4"><CityDesigner /></div>}
      {panel === 'eldoria-minimap' && <AuthoritativeGrandEldoriaQa mode="eldoria-minimap" />}
      {panel === 'eldoria-city-designer' && <AuthoritativeGrandEldoriaQa mode="eldoria-city-designer" />}
      {panel === 'eldoria-panorama' && <AuthoritativeGrandEldoriaQa mode="eldoria-panorama" />}
      {panel === 'sunreach-minimap' && <AuthoritativeGrandSunreachQa mode="sunreach-minimap" />}
      {panel === 'sunreach-city-designer' && <AuthoritativeGrandSunreachQa mode="sunreach-city-designer" />}
      {panel === 'sunreach-panorama' && <AuthoritativeGrandSunreachQa mode="sunreach-panorama" />}
      {panel === 'ironwood-minimap' && <AuthoritativeGrandIronwoodQa mode="ironwood-minimap" />}
      {panel === 'ironwood-city-designer' && <AuthoritativeGrandIronwoodQa mode="ironwood-city-designer" />}
      {panel === 'ironwood-panorama' && <AuthoritativeGrandIronwoodQa mode="ironwood-panorama" />}
      {panel === 'frostpeak-minimap' && <AuthoritativeGrandFrostpeakQa mode="frostpeak-minimap" />}
      {panel === 'frostpeak-city-designer' && <AuthoritativeGrandFrostpeakQa mode="frostpeak-city-designer" />}
      {panel === 'frostpeak-panorama' && <AuthoritativeGrandFrostpeakQa mode="frostpeak-panorama" />}
      {panel === 'shadowfen-minimap' && <AuthoritativeGrandShadowfenQa mode="shadowfen-minimap" />}
      {panel === 'shadowfen-city-designer' && <AuthoritativeGrandShadowfenQa mode="shadowfen-city-designer" />}
      {panel === 'shadowfen-panorama' && <AuthoritativeGrandShadowfenQa mode="shadowfen-panorama" />}
      {panel === 'emberhold-minimap' && <AuthoritativeGrandEmberholdQa mode="emberhold-minimap" />}
      {panel === 'emberhold-city-designer' && <AuthoritativeGrandEmberholdQa mode="emberhold-city-designer" />}
      {panel === 'emberhold-panorama' && <AuthoritativeGrandEmberholdQa mode="emberhold-panorama" />}
      {panel === 'crystal-deep-minimap' && <AuthoritativeGrandCrystalDeepQa mode="crystal-deep-minimap" />}
      {panel === 'crystal-deep-city-designer' && <AuthoritativeGrandCrystalDeepQa mode="crystal-deep-city-designer" />}
      {panel === 'crystal-deep-panorama' && <AuthoritativeGrandCrystalDeepQa mode="crystal-deep-panorama" />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><LocaleBridge /><VisualQa /></StrictMode>);
