import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  Player, Monster, Projectile, FloatingText, Particle, ChatMessage,
  Item, Spell, Account, NPC, Toast, ActiveQuest, Equipment, Quest,
} from '../game/types';
import { computeDerivedStats } from '../game/types';
import {
  spawnInitialMonsters, spawnNPCs,
  TILE_SIZE,
} from '../game/world';
import { drawTile, drawPlayer, drawMonster, drawNPC } from '../game/render';
import { VOCATIONS } from '../game/classes';
import { EQUIPMENT_LOOT, RARITY_COLORS } from '../game/equipment';
import { QUESTS, getAvailableQuests } from '../game/quests';
import { checkAchievements } from '../game/achievements';
import { MOUNTS } from '../game/types';
import { createPlayer } from '../game/playerFactory';
import HUD from './HUD';
import Chat from './Chat';
import Inventory from './Inventory';
import DialogBox from './DialogBox';
import QuestLog from './QuestLog';
import CharacterPanel from './CharacterPanel';
import Toaster from './Toaster';
import AdminPanel from './AdminPanel';
import GameEditor from './GameEditor';
import DungeonPortal from './DungeonPortal';
import PetShop from './PetShop';
import { DUNGEON_WAVES, spawnDungeonWave, getDungeonReward, PETS, getActivePet, buyPet, type ActivePetState } from '../game/dungeons';
import { randomGemDrop, GEMS } from '../game/itemSets';
import { RECIPES, canCraft } from '../game/crafting';
import { generateMap, MAPS, MAP_WIDTH, MAP_HEIGHT, syncServerMaps } from '../game/maps';
import { createCorpse, createLootBag, rollLoot, type GroundItem, type LootItem } from '../game/loot';
import { drawGroundLootPresentation } from '../game/groundLootPresentation';
import QuestCreator from './QuestCreator';
import MysteryQuestBook from './MysteryQuestBook';
import Depot from './Depot';
import BookLibrary from './BookLibrary';
import MailBox from './MailBox';
import AuctionHouse from './AuctionHouse';
import CoinShop from './CoinShop';
import { getItemMastery, addItemMasteryProgress, getMasteryMultiplier, seedAuctionHouse, getCoins, addCoins } from '../game/economy';
import { getSkullState, setSkullType as adminSetSkull, isPvpEnabled, togglePvp, SKULLS } from '../game/skull';
import { audio } from '../game/audio';
import ActionBar from './ActionBar';
import WorldEvents from './WorldEvents';
import WorldEventCreator from './WorldEventCreator';
import { getWorldEvents, maybeSpawnSystemEvent, contributeToWorldEvent, generateSimPlayers, getRandomChatLine, type SimPlayer } from '../game/worldEvents';
import { net, broadcastPlayer, broadcastChat, type NetPlayer, type NetMessage } from '../game/network';
import { serverSync } from '../game/ServerSync';
import { loadLocal, saveLocal, applySave, persistSubSystems } from '../game/SaveManager';
import { getCustomNPCs, getCustomMonsters, getMail, sendSystemMail, getUILayout, saveUILayout, DEFAULT_UI_PANEL_ORDER, type UILayout, type CustomNPC, type CustomMonster } from '../game/content';
import { customContentOnMap, customMonsterToRuntime, customNpcToRuntime, mergeServerSpells, serverNpcToClient, serverQuestToClient, spellContentSlug } from '../game/serverContentAdapters';
import { getTownBuildings } from '../game/world';
import { drawBuilding, type Building } from '../game/render';
import Weather from './Weather';
import RegionBanner from './RegionBanner';
import { drawWorldAtmosphere, weatherForMap, type WorldWeather } from '../game/worldAtmosphere';
import { drawHousing } from '../game/housingPresentation';
import CastBar from './CastBar';
import RaidWarning from './RaidWarning';
import { triggerCast } from './CastBar';
import { showRaidWarning } from './RaidWarning';
import TalentTree from './TalentTree';
import Bestiary from './Bestiary';
import DPSMeter from './DPSMeter';
import AdventureBoard, { type AdventureSnapshot } from './AdventureBoard';
import OfficialSystemsHub, { type OfficialTab } from './OfficialSystemsHub';
import SocialHub from './SocialHub';
import LifeStylePanel from './LifeStylePanel';
import CombatTargetFrame from './CombatTargetFrame';
import ActiveQuestTracker from './ActiveQuestTracker';
import WorldClockBadge from './WorldClockBadge';
import { legacyOverrideDarkness, localWorldClock, sanitizeWorldClock, type WorldClockSnapshot } from '../game/dayNight';
import { applyAuthoritativeCombatFeedback, resolveCombatTarget } from '../game/combatPresentation';
import { dpsMeter } from '../game/dpsMeter';
import { recordKill } from '../game/bestiary';
import {
  getXPMultiplierFromBlessings, getDamageMultiplierFromBlessings,
  getDamageReductionFromBlessings, getDeathXPLossMultiplier, keepItemsOnDeath,
  gatherFromTile, addReputation, getShopDiscountFromRep,
  getStamina, saveStamina, getStaminaMultiplier,
  canClaimDaily, claimDaily,
  FOOD_ITEMS, applyFoodBuff, getActiveFoodBonus, grantAllBlessings,
} from '../game/systems';

interface Props {
  account: Account;
  onLogout: () => void;
}

const VIEW_W = 19;
const VIEW_H = 13;

export default function GameScreen({ account, onLogout }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onlineAccount = Boolean(account.sessionToken && !account.offline);
  const allowLocalAdmin = account.offline === true;

  // Panels state
  const [showInventory, setShowInventory] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showAdventure, setShowAdventure] = useState(false);
  const [adventureState, setAdventureState] = useState<AdventureSnapshot | null>(null);
  const lastAdventureSignatureRef = useRef('');
  const [showOfficialHub, setShowOfficialHub] = useState(false);
  const [officialTab, setOfficialTab] = useState<OfficialTab>('progress');
  const [officialState, setOfficialState] = useState<any>(null);
  const lastOfficialSignatureRef = useRef('');
  const [showSocialHub, setShowSocialHub] = useState(false);
  const [showLifeStyle, setShowLifeStyle] = useState(false);
  const [socialState, setSocialState] = useState<any>(null);
  const lastSocialSignatureRef = useRef('');
  const openOfficial = useCallback((tab: OfficialTab) => { setOfficialTab(tab); setShowOfficialHub(true); }, []);
  const serverQuestsRef = useRef<{ active: any[]; completed: string[] } | null>(null);
  const [serverQuestCatalog, setServerQuestCatalog] = useState<Quest[]>([]);
  const serverNpcCatalogRef = useRef<Array<{ mapId: string; npc: NPC }>>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTalents, setShowTalents] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showDPS, setShowDPS] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showDungeon, setShowDungeon] = useState(false);
  const [showPetShop, setShowPetShop] = useState(false);
  const [showQuestCreator, setShowQuestCreator] = useState(false);
  const [showMysteryBook, setShowMysteryBook] = useState(false);
  const [showDepot, setShowDepot] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [showUIEditor, setShowUIEditor] = useState(false);
  const [showAuction, setShowAuction] = useState(false);
  const [showCoinShop, setShowCoinShop] = useState(false);
  const [showWorldEvents, setShowWorldEvents] = useState(false);
  const [showWorldEventCreator, setShowWorldEventCreator] = useState(false);
  const [uiLayout, setUILayoutState] = useState<UILayout>(() => getUILayout(account.characterName));
  const simPlayersRef = useRef<SimPlayer[]>(generateSimPlayers(6, MAP_WIDTH, MAP_HEIGHT));
  const lastSimChatRef = useRef(0);
  const lastEventCheckRef = useRef(0);

  // ===== REAL NETWORK (online players) =====
  const onlinePlayersRef = useRef<Map<string, NetPlayer>>(new Map());
  const [netMode, setNetMode] = useState<'offline' | 'local' | 'online'>('offline');
  const [serverUrl, setServerUrl] = useState('');
  const [showConnect, setShowConnect] = useState(false);
  const [netStatus, setNetStatus] = useState('');
  const lastBroadcastRef = useRef(0);
  const lastHudTickRef = useRef(0);
  const lastStaminaDrainRef = useRef(0);
  const [onlineCount, setOnlineCount] = useState(1);
  const [muted, setMuted] = useState(false);
  // Server-authoritative state refs (used when connected to authoritative server)
  const serverMonstersRef = useRef<any[]>([]);
  const serverPlayersRef = useRef<any[]>([]);
  const serverGroundRef = useRef<any[]>([]);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const [activeDialog, setActiveDialog] = useState<NPC | null>(null);

  // Buildings + custom NPCs/monsters for current map
  const buildingsRef = useRef<Building[]>(getTownBuildings('plains'));
  const customNpcsRef = useRef<CustomNPC[]>(getCustomNPCs());
  const customMonstersRef = useRef<CustomMonster[]>(getCustomMonsters());
  // Force refresh of custom content (used after admin edits)
  const refreshCustomContent = () => {
    const previousNpcIds = new Set(customNpcsRef.current.map((npc) => npc.id));
    const previousMonsterIds = new Set(customMonstersRef.current.map((monster) => monster.id));
    customNpcsRef.current = getCustomNPCs();
    customMonstersRef.current = getCustomMonsters();
    const mapId = currentMapIdRef.current;
    npcsRef.current = [
      ...npcsRef.current.filter((npc) => !previousNpcIds.has(npc.id)),
      ...customContentOnMap(customNpcsRef.current, mapId).map(customNpcToRuntime),
    ];
    monstersRef.current = [
      ...monstersRef.current.filter((monster) => !previousMonsterIds.has(monster.id)),
      ...customContentOnMap(customMonstersRef.current, mapId).map(customMonsterToRuntime),
    ];
  };

  // Dungeon state
  const [inDungeon, setInDungeon] = useState(false);
  const [dungeonWave, setDungeonWave] = useState(0);
  const dungeonTotalWavesRef = useRef(0);
  const inDungeonRef = useRef(false);
  const dungeonWaveRef = useRef(0);
  const [highestDungeonWave, setHighestDungeonWave] = useState(() => {
    return parseInt(localStorage.getItem(`tibia_dungeon_high_${account.characterName}`) || '0');
  });

  // Pet state
  const petStateRef = useRef<ActivePetState | null>(null);

  // Auto-attack
  const autoAttackRef = useRef(true);
  const [_autoAttack, setAutoAttack] = useState(true);

  // Food shop from innkeeper
  const [showFoodShop, setShowFoodShop] = useState(false);

  // Admin/Cheats
  const [godMode, setGodMode] = useState(false);
  const [noClip, setNoClip] = useState(false);
  const [oneHitKill, setOneHitKill] = useState(false);
  const [xpMultiplier, setXpMultiplier] = useState(1);
  const [damageMultiplier, setDamageMultiplier] = useState(1);
  const [dayTimeOverride, setDayTimeOverride] = useState<number | null>(null);
  const godModeRef = useRef(godMode);
  const noClipRef = useRef(noClip);
  const oneHitKillRef = useRef(oneHitKill);
  const xpMultiplierRef = useRef(xpMultiplier);
  const damageMultiplierRef = useRef(damageMultiplier);
  const dayTimeOverrideRef = useRef(dayTimeOverride);
  const worldClockRef = useRef<WorldClockSnapshot>(localWorldClock());
  useEffect(() => { godModeRef.current = godMode; }, [godMode]);
  useEffect(() => { noClipRef.current = noClip; }, [noClip]);
  useEffect(() => { oneHitKillRef.current = oneHitKill; }, [oneHitKill]);
  useEffect(() => { xpMultiplierRef.current = xpMultiplier; }, [xpMultiplier]);
  useEffect(() => { damageMultiplierRef.current = damageMultiplier; }, [damageMultiplier]);
  useEffect(() => { dayTimeOverrideRef.current = dayTimeOverride; }, [dayTimeOverride]);

  // Combo system
  const comboRef = useRef({ count: 0, lastHit: 0 });
  const [comboDisplay, setComboDisplay] = useState<{ count: number; mult: number } | null>(null);

  // Weather
  const [weather, setWeather] = useState<WorldWeather>('clear');

  // Load or create player (using Unified Save System)
  const [player, setPlayer] = useState<Player>(() => {
    const basePlayer = createPlayer(account.characterName, account.vocation.toLowerCase());
    const loadedSave = loadLocal(account.characterName);
    if (loadedSave) {
      // Restore subsystems (blessings, professions, etc) from unified save
      persistSubSystems(loadedSave);
      return applySave(basePlayer, loadedSave);
    }
    // Fallback: try old savedPlayer format
    if (account.savedPlayer) {
      try { return JSON.parse(account.savedPlayer); } catch { /* ignore */ }
    }
    return basePlayer;
  });
  const playerRef = useRef(player);
  playerRef.current = player;

  // Map system
  const [currentMapId, setCurrentMapId] = useState('eldoria');
  const currentMapIdRef = useRef('eldoria');
  const worldRef = useRef(generateMap('eldoria'));
  const monstersRef = useRef<Monster[]>([
    ...spawnInitialMonsters(),
    ...customContentOnMap(customMonstersRef.current, 'eldoria').map(customMonsterToRuntime),
  ]);
  const npcsRef = useRef<NPC[]>([
    ...spawnNPCs(),
    ...customContentOnMap(customNpcsRef.current, 'eldoria').map(customNpcToRuntime),
  ]);
  const groundItemsRef = useRef<GroundItem[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const lastMoveRef = useRef(0);
  const cameraRef = useRef({ x: 0, y: 0 });
  const mouseTileRef = useRef<{ x: number; y: number } | null>(null);
  const screenShakeRef = useRef(0);
  const dayTimeRef = useRef(0);

  const [hudTick, setHudTick] = useState(0);
  const [spells, setSpells] = useState<Spell[]>(
    (VOCATIONS[account.vocation.toLowerCase()] || VOCATIONS.knight).spells
  );
  const spellsRef = useRef(spells);
  spellsRef.current = spells;

  const [inventory, setInventory] = useState<Item[]>(() => {
    const loadedSave = loadLocal(account.characterName);
    if (loadedSave && Array.isArray(loadedSave.inventory)) return loadedSave.inventory;
    return [
      { id: 'hp1', name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 10, value: 50, description: 'Restores 50 HP' },
      { id: 'mp1', name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 5, value: 50, description: 'Restores 50 Mana' },
      { id: 'hpg', name: 'Greater Health Potion', icon: '🍷', type: 'potion', quantity: 2, value: 150, description: 'Restores 200 HP' },
    ];
  });
  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;
  const lastServerInventorySignatureRef = useRef('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'w', sender: 'System', text: `Welcome to Mor'ia, ${account.characterName}!`, color: '#f4e04d', time: Date.now(), channel: 'system' },
    { id: 't1', sender: 'System', text: '🔊 Audio active! WASD/Arrows: move · Click monsters: attack · 1-4: spells · I: inventory · C: character', color: '#9bd4ff', time: Date.now(), channel: 'system' },
    { id: 't2', sender: 'System', text: 'Talk to NPCs (walk up + press E) for quests, shops, and services!', color: '#9bd4ff', time: Date.now(), channel: 'system' },
    { id: 't3', sender: 'System', text: '🧟 Killed monsters leave corpses! Walk over or click them to collect loot (Tibia-style).', color: '#f4e04d', time: Date.now(), channel: 'system' },
    { id: 't4', sender: 'System', text: '🌀 Find glowing portals to travel between cities: Eldoria, Frostpeak, Shadowfen, Emberhold, Voidlands!', color: '#9b59ff', time: Date.now(), channel: 'system' },
    { id: 't5', sender: 'System', text: '✦ Open Mystery Quests (top bar) to solve riddles and uncover hidden stories!', color: '#9b59ff', time: Date.now(), channel: 'system' },
    { id: 't6', sender: 'System', text: '🗄 Talk to the Banker or use the Depot button to safely store items (never lost on death)!', color: '#f4e04d', time: Date.now(), channel: 'system' },
    { id: 't7', sender: 'System', text: '📮 Visit the Postmaster for mail! Books at the Library. Use + / − keys or bottom-right buttons to zoom.', color: '#9bd4ff', time: Date.now(), channel: 'system' },
    { id: 't8', sender: 'System', text: '⚙ Customize your UI panel order with the UI button in the top bar!', color: '#9bd4ff', time: Date.now(), channel: 'system' },
    { id: 't9', sender: 'System', text: '🔒 Spells, items, and regions unlock by level! Watch for 🔴 red portals (locked zones) and 🔒 spells. Level up to unlock more!', color: '#ff6060', time: Date.now(), channel: 'system' },
    { id: 't10', sender: 'System', text: '🏛 Visit the Auction House (top bar) to buy/sell items! Drag items in your inventory to drop them on the ground.', color: '#f4e04d', time: Date.now(), channel: 'system' },
    { id: 't11', sender: 'System', text: '⚔ Enable PvP (top-right) for skull system like Tibia. Aggression raises your skull: White→Yellow→Orange→Red→Black.', color: '#ff6060', time: Date.now(), channel: 'system' },
    { id: 't12', sender: 'System', text: '💎 Earn Moria Coins from hunts, dungeons, events and achievements, then spend them in the official Coin Shop.', color: '#c8a0ff', time: Date.now(), channel: 'system' },
    { id: 't13', sender: 'System', text: '🌍 World Events happen automatically! Check the World button to join global missions for big rewards.', color: '#ff6a00', time: Date.now(), channel: 'system' },
    { id: 't14', sender: 'System', text: '✨ Other adventurers roam the world. Loot is auto-collected when you walk near corpses!', color: '#9bd4ff', time: Date.now(), channel: 'system' },
  ]);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], title: string, description: string, icon: string, color: string) => {
    setToasts((prev) => [
      ...prev,
      { id: `t_${Date.now()}_${Math.random()}`, type, title, description, icon, color, startTime: Date.now(), duration: 4500 },
    ]);
  }, []);

  const addMessage = useCallback((sender: string, text: string, color: string, channel: ChatMessage['channel'] = 'world') => {
    setMessages((prev) => [
      ...prev.slice(-80),
      { id: `m_${Date.now()}_${Math.random()}`, sender, text, color, time: Date.now(), channel },
    ]);
  }, []);

  const addFloatingText = useCallback((text: string, pos: { x: number; y: number }, color: string, big = false) => {
    floatingTextsRef.current.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text, pos: { ...pos }, color, big,
      startTime: Date.now(), duration: big ? 1800 : 1200,
    });
  }, []);

  const spawnParticles = useCallback((pos: { x: number; y: number }, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1 + Math.random() * 2;
      particlesRef.current.push({
        id: `p_${Date.now()}_${Math.random()}`,
        pos: { ...pos },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        color,
        size: 2 + Math.random() * 2,
        life: 1,
        startTime: Date.now(),
        duration: 600 + Math.random() * 400,
      });
    }
  }, []);

  // Save player periodically — UNIFIED SAVE SYSTEM
  useEffect(() => {
    const interval = setInterval(() => {
      // Save to unified localStorage (works for Quick Play AND as cache for Online)
      saveLocal(playerRef.current, inventoryRef.current);
      // If online, also upload the rich save to the server
      if (serverSync.isActive()) {
        serverSync.uploadSave(playerRef.current, inventoryRef.current);
      }
    }, 5000);
    // Save on unmount too (critical for tab close)
    const onUnload = () => saveLocal(playerRef.current, inventoryRef.current);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      saveLocal(playerRef.current, inventoryRef.current);
      clearInterval(interval);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  // Seed local-only starter content exactly once per character.
  useEffect(() => {
    if (onlineAccount) return;
    seedAuctionHouse();

    const welcomeCoinsKey = `moria_welcome_coins_${account.characterName}`;
    if (localStorage.getItem(welcomeCoinsKey) !== '1') {
      if (getCoins(account.characterName) === 0) addCoins(account.characterName, 200);
      localStorage.setItem(welcomeCoinsKey, '1');
    }

    const welcomeMailKey = `moria_welcome_mail_${account.characterName}`;
    if (localStorage.getItem(welcomeMailKey) !== '1') {
      if (getMail(account.characterName).length === 0) {
        sendSystemMail(account.characterName, 'Postmaster Edwin',
          'Welcome to Mor\'ia!',
          `Dear ${account.characterName},\n\nWelcome to the realm of Mor'ia! May your adventures be legendary.\n\nTo help you get started, here is some gold. Visit me at the post office (near the bank) anytime.\n\nSafe travels,\nPostmaster Edwin`,
          100);
      }
      localStorage.setItem(welcomeMailKey, '1');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== AUDIO: init on first interaction + start music =====
  useEffect(() => {
    const startAudio = () => {
      audio.init();
      audio.resume();
      audio.startMusic(MAPS[currentMapIdRef.current]?.biome || 'plains');
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);
    return () => {
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
      audio.stopMusic();
    };
  }, []);

  // Restart music when changing maps
  useEffect(() => {
    audio.startMusic(MAPS[currentMapId]?.biome || 'plains');
  }, [currentMapId]);


  // Cosmetic realm weather is deterministic per map/time window so players in
  // the same region see the same atmosphere without affecting server authority.
  useEffect(() => {
    const refreshWeather = () => {
      const map = MAPS[currentMapId] || MAPS.eldoria;
      setWeather(weatherForMap(map.id, map.biome));
    };
    refreshWeather();
    const timer = window.setInterval(refreshWeather, 45_000);
    return () => window.clearInterval(timer);
  }, [currentMapId]);

  // ===== NETWORK: connect to BroadcastChannel on mount (local multiplayer) =====
  useEffect(() => {
    // Always enable local multiplayer (cross-tab on same machine)
    if (net.connectLocal()) {
      setNetMode('local');
      addMessage('System', '🟡 Local multiplayer active — other browser tabs can join your world!', '#9bd4ff', 'system');
    }
    // Only authenticated online accounts connect to the authoritative world.
    // Quick Play remains local and never opens an unauthenticated server session.
    if (onlineAccount && account.sessionToken) {
      // Store auth payload before connecting so reconnect/retry authenticates on open.
      serverSync.authenticate(account.sessionToken, account.characterName);
      net.connectOnline().then((ok) => {
        if (ok) {
          setNetMode('online');
          addMessage('System', '🟢 CONNECTED to Mor\'ia authoritative server! Anti-cheat active.', '#2ecc71', 'system');
          addToast('info', 'Online!', `Connected to ${net.isHosted() ? 'world server' : 'local server'}`, '🟢', '#2ecc71');
        } else if (net.isHosted()) {
          setTimeout(() => net.connectOnline().then(ok2 => {
            if (ok2) setNetMode('online');
          }), 3000);
        }
      });
    }

    // Handle incoming network messages
    const handler = (msg: NetMessage) => {
      if (msg.from === net.id) return; // ignore own echoes
      switch (msg.kind) {
        case 'player:move':
        case 'player:join': {
          const p = msg.payload as NetPlayer;
          // Only track players on the same map
          if (p.mapId === currentMapIdRef.current) {
            onlinePlayersRef.current.set(p.id, p);
            setOnlineCount(1 + onlinePlayersRef.current.size);
          }
          break;
        }
        case 'player:leave': {
          onlinePlayersRef.current.delete(msg.payload.id);
          setOnlineCount(1 + onlinePlayersRef.current.size);
          break;
        }
        case 'roster': {
          // From server: full player list
          const roster = msg.payload as NetPlayer[];
          onlinePlayersRef.current.clear();
          for (const p of roster) {
            if (p.mapId === currentMapIdRef.current) onlinePlayersRef.current.set(p.id, p);
          }
          setOnlineCount(1 + onlinePlayersRef.current.size);
          break;
        }
        case 'chat': {
          const c = msg.payload;
          setMessages((prev) => [...prev.slice(-80), { id: c.id, sender: c.sender, text: c.text, color: c.color, time: c.time, channel: c.channel }]);
          break;
        }
        // ===== AUTHORITATIVE MODE: server sends the truth =====
        case 'auth_ok': {
          serverSync.handleAuthOk();
          addMessage('System', '🔒 Authenticated! Server-authoritative mode active.', '#2ecc71', 'system');
          // Request our full save from the server (talents, gems, blessings, etc.)
          serverSync.requestServerSave();
          break;
        }
        case 'auth_error': {
          serverSync.handleAuthError();
          addMessage('System', `🔴 Auth failed: ${msg.payload?.text}`, '#ff6060', 'system');
          break;
        }
        case 'snapshot': {
          // THE TRUTH — server sends complete state. Store it for rendering.
          serverSync.updateSnapshot(msg.payload);
          // Store server quests for QuestLog
          if (msg.payload?.player?.quests) {
            serverQuestsRef.current = msg.payload.player.quests;
          }
          break;
        }
        case 'load_response': {
          // Server sent back our full unified save (talents, gems, etc.)
          if (msg.payload) {
            persistSubSystems(msg.payload);
            addMessage('System', '💾 Character data loaded from server!', '#2ecc71', 'system');
          }
          break;
        }
        case 'content_sync': {
          // SERVER-OWNED CONTENT: items, monsters, NPCs, quests, etc.
          // created via the admin panel at /admin
          try {
            const content = msg.payload;
            localStorage.setItem('moria_server_content', JSON.stringify(content));
            syncServerMaps(content.maps);
            if (MAPS[currentMapIdRef.current]) {
              worldRef.current = generateMap(currentMapIdRef.current);
              buildingsRef.current = getTownBuildings(MAPS[currentMapIdRef.current].biome);
            }
            const quests = Array.isArray(content.quests)
              ? content.quests.map(serverQuestToClient).filter((q: Quest | null): q is Quest => Boolean(q))
              : [];
            setServerQuestCatalog(quests);
            const serverNpcs: Array<{ mapId: string; npc: NPC }> = Array.isArray(content.npcs)
              ? content.npcs.map((npc: any) => serverNpcToClient(npc, quests)).filter((entry: { mapId: string; npc: NPC } | null): entry is { mapId: string; npc: NPC } => Boolean(entry))
              : [];
            serverNpcCatalogRef.current = serverNpcs;
            npcsRef.current = serverNpcs.filter((entry) => entry.mapId === currentMapIdRef.current).map((entry) => entry.npc);
            const vocationId = account.vocation.toLowerCase();
            const baseSpells = (VOCATIONS[vocationId] || VOCATIONS.knight).spells;
            const syncedSpells = mergeServerSpells(vocationId, baseSpells, content.spells);
            const previousSpells = spellsRef.current;
            for (const spell of syncedSpells) {
              const previous = previousSpells.find((candidate) => candidate.id === spell.id || spellContentSlug(candidate.name) === spellContentSlug(spell.name));
              if (previous) spell.lastCast = previous.lastCast;
            }
            spellsRef.current = syncedSpells;
            setSpells(syncedSpells);
            addMessage('System', `📡 Server content synced: ${content.items?.length||0} items, ${content.monsters?.length||0} monsters, ${quests.length} quests, ${serverNpcs.length} NPCs, ${syncedSpells.length} spells`, '#9bd4ff', 'system');
          } catch {}
          break;
        }
        case 'system': {
          if (msg.payload?.text) addMessage('Server', msg.payload.text, '#9bd4ff', 'system');
          break;
        }
      }
    };
    const unsubscribeNet = net.on(handler);

    // Cleanup on unmount
    return () => {
      unsubscribeNet();
      serverSync.reset();
      net.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doConnectServer = async () => {
    if (!onlineAccount || !account.sessionToken) {
      setNetStatus('🔒 Sign in to an online account first.');
      return;
    }
    setNetStatus('Connecting...');
    let url = serverUrl.trim();
    if (!url) return;
    // Normalize URL to ws:// or wss://
    if (url.startsWith('http')) url = url.replace('http', 'ws');
    if (!url.startsWith('ws')) url = 'ws://' + url;
    // Ensure /ws path
    if (!url.includes('/ws')) url = url.replace(/\/$/, '') + '/ws';
    const ok = await net.connectOnline(url);
    if (ok) {
      setNetMode('online');
      setNetStatus('🟢 Connected!');
      addMessage('System', `🟢 Connected to server ${url}! Real online multiplayer active.`, '#2ecc71', 'system');
      addToast('info', 'Online!', 'Connected to server', '🟢', '#2ecc71');
      setShowConnect(false);
    } else {
      setNetStatus('🔴 Failed to connect. Is the server running?');
      addMessage('System', '🔴 Could not connect to server. Make sure it is running.', '#ff6060', 'system');
    }
  };

  // Input handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Don't capture keys when typing in inputs/textareas/contenteditable
      const tag = (e.target as HTMLElement).tagName;
      const editable = (e.target as HTMLElement).isContentEditable;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return;
      keysRef.current.add(e.key.toLowerCase());
      // Admin Panel: Ctrl+Shift+A
      if (allowLocalAdmin && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdmin((s) => !s);
        return;
      }
      if (/^[1-8]$/.test(e.key)) {
        e.preventDefault();
        castSpell(parseInt(e.key, 10) - 1);
      }
      if (e.key.toLowerCase() === 'i') setShowInventory((s) => !s);
      if (e.key.toLowerCase() === 'c') setShowCharacter((s) => !s);
      if (e.key.toLowerCase() === 'q') setShowQuestLog((s) => !s);
      if (e.key.toLowerCase() === 'h') setShowAdventure((s) => !s);
      if (e.key.toLowerCase() === 'l') { if (serverSync.isActive()) setShowLifeStyle((s) => !s); else addMessage('System', 'Life & Style requires the authoritative alpha server.', '#ffb86b', 'system'); }
      if (e.key.toLowerCase() === 't') setShowTalents((s) => !s);
      if (e.key.toLowerCase() === 'r') setAutoAttack((s) => { autoAttackRef.current = !s; return !s; });
      if (e.key.toLowerCase() === 'b') onlineAccount ? openOfficial('progress') : setShowBestiary((s) => !s);
      if (e.key.toLowerCase() === 'd') onlineAccount ? openOfficial('progress') : setShowDPS((s) => !s);
      if (e.key.toLowerCase() === 'o' && onlineAccount) openOfficial('progress');
      if (e.key.toLowerCase() === 'p') usePotion('hp');
      if (e.key.toLowerCase() === 'm') usePotion('mp');
      if (e.key.toLowerCase() === 'e') interactNPC();
      if (e.key === ' ') { e.preventDefault(); toggleMount(); }
      if (e.key === '+' || e.key === '=') { const nz = Math.min(2.5, zoomRef.current + 0.25); zoomRef.current = nz; setZoom(nz); }
      if (e.key === '-' || e.key === '_') { const nz = Math.max(0.6, zoomRef.current - 0.25); zoomRef.current = nz; setZoom(nz); }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMount = () => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { serverSync.sendMount('toggle'); return; }
    const p = playerRef.current;
    const ownedMounts = MOUNTS.filter((m) => m.levelRequired <= p.level);
    if (ownedMounts.length === 0) {
      addMessage('System', 'You have no mounts available yet.', '#ff9090', 'system');
      return;
    }
    if (!p.mounted) {
      const mount = ownedMounts[ownedMounts.length - 1];
      p.mounted = true;
      p.mountId = mount.id;
      p.speed = Math.max(80, 180 / (1 + mount.speedBonus / 100));
      addMessage('System', `You mounted your ${mount.name}!`, mount.color, 'system');
    } else {
      p.mounted = false;
      p.speed = 180;
      addMessage('System', 'You dismounted.', '#9bd4ff', 'system');
    }
    setPlayer({ ...p });
  };

  const interactNPC = () => {
    const p = playerRef.current;
    const npc = npcsRef.current.find((n) =>
      Math.abs(n.pos.x - p.pos.x) <= 1.5 && Math.abs(n.pos.y - p.pos.y) <= 1.5
    );
    if (npc) {
      setActiveDialog(npc);
    } else {
      addMessage('System', 'No NPC nearby. Walk close and press E.', '#ff9090', 'system');
    }
  };

  const usePotion = (type: 'hp' | 'mp' | 'hpg') => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) {
      const desired = type === 'mp' ? 'Mana Potion' : type === 'hpg' ? 'Greater Health Potion' : 'Health Potion';
      const serverItems = serverSync.getRenderState()?.player?.inventory;
      const item = Array.isArray(serverItems) ? serverItems.find((i: any) => i?.name === desired && i.quantity > 0) : null;
      if (!item) addMessage('System', `No ${desired}.`, '#ff9090', 'system');
      else serverSync.sendUseItem(item.id);
      return;
    }
    const inv = inventoryRef.current;
    const id = type === 'hp' ? 'hp1' : type === 'mp' ? 'mp1' : 'hpg';
    const potion = inv.find((i) => i.id === id);
    if (!potion || potion.quantity <= 0) {
      addMessage('System', 'No such potion.', '#ff9090', 'system');
      return;
    }
    const p = playerRef.current;
    const potionDerived = computeDerivedStats(p);
    if (type === 'hp') {
      if (p.hp >= potionDerived.totalMaxHp) return;
      p.hp = Math.min(potionDerived.totalMaxHp, p.hp + 50);
      addFloatingText('+50 HP', p.pos, '#2ecc71');
      spawnParticles(p.pos, '#2ecc71', 8);
    } else if (type === 'mp') {
      if (p.mana >= potionDerived.totalMaxMana) return;
      p.mana = Math.min(potionDerived.totalMaxMana, p.mana + 50);
      addFloatingText('+50 MP', p.pos, '#3498db');
      spawnParticles(p.pos, '#3498db', 8);
    } else {
      if (p.hp >= potionDerived.totalMaxHp) return;
      p.hp = Math.min(potionDerived.totalMaxHp, p.hp + 200);
      addFloatingText('+200 HP', p.pos, '#2ecc71', true);
      spawnParticles(p.pos, '#2ecc71', 15);
    }
    const newInv = inv.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i)).filter((i) => i.quantity > 0 || i.type !== 'potion');
    inventoryRef.current = newInv;
    setInventory(newInv);
    setPlayer({ ...p });
  };

  const castSpell = (idx: number) => {
    if (onlineAccount && !serverSync.isActive()) return;
    // AUTHORITATIVE MODE: send cast intent to server
    if (serverSync.isActive()) {
      serverSync.sendCast(idx, playerRef.current.targetId || undefined);
      audio.spellCast(spellsRef.current[idx]?.color || '#9b59ff');
      return;
    }
    const spell = spellsRef.current[idx];
    if (!spell) return;
    const now = Date.now();
    const p = playerRef.current;
    // Level gating
    if ((spell.levelRequired || 1) > p.level) {
      addMessage('System', `🔒 Requires level ${spell.levelRequired} to cast ${spell.name}.`, '#ff9090', 'system');
      addToast('warning', 'Locked!', `${spell.name} needs level ${spell.levelRequired}`, '🔒', '#ff9090');
      return;
    }
    if (now - spell.lastCast < spell.cooldown) {
      addMessage('System', `${spell.name} on cooldown.`, '#ff9090', 'system');
      return;
    }
    if (p.mana < spell.mana) {
      addMessage('System', 'Not enough mana.', '#ff9090', 'system');
      return;
    }
    p.mana -= spell.mana;
    p.stats.spellsCast++;
    p.skills.magic.progress += 1;
    audio.spellCast(spell.color);

    // Show cast bar for significant spells
    if (spell.cooldown >= 3000 || spell.type === 'aoe') {
      triggerCast(spell.name, spell.icon, Math.min(spell.cooldown, 2000), spell.color);
    }
    if (p.skills.magic.progress >= p.skills.magic.level * 10) {
      p.skills.magic.level++;
      p.skills.magic.progress = 0;
      addMessage('System', `✦ Magic skill up! (${p.skills.magic.level})`, '#9b59ff', 'system');
    }
    const newSpells = [...spellsRef.current];
    newSpells[idx] = { ...spell, lastCast: now };
    spellsRef.current = newSpells;
    setSpells(newSpells);

    const vocation = VOCATIONS[p.vocation];
    const derivedForSpell = computeDerivedStats(p);
    const magicBonus = 1 + (vocation?.magPerLevel ?? 1) * (p.level - 1) * 0.05 + p.skills.magic.level * 0.02 + (derivedForSpell.totalMagic - p.magic) * 0.01;

    // ===== DETAILED DAMAGE CALCULATOR =====
    const computeSpellDamage = (baseDef: number) => {
      const coeff = spell.scalingCoeff ?? 1;
      // Base = spell damage + (magic stat * scalingCoeff)
      let base = spell.damage + (derivedForSpell.totalMagic * coeff * 0.5);
      // Apply variance (±X%)
      const variance = spell.variance ?? 0.2;
      base *= 1 + (Math.random() * 2 - 1) * variance;
      // Pierce: ignore % of enemy defense
      const pierce = (spell.piercePercent ?? 0) / 100;
      const effectiveDef = baseDef * (1 - pierce);
      base = Math.max(1, base - effectiveDef);
      // Magic scaling bonus
      base *= magicBonus;
      // Crit roll (spell crit + player crit)
      const totalCrit = (spell.critChance ?? 0) + derivedForSpell.critChance;
      const crit = Math.random() < totalCrit / 100;
      if (crit) base *= (spell.critMult ?? 2);
      // Multihit
      const hits = spell.hitCount ?? 1;
      return { dmg: Math.max(1, Math.floor(base)), crit, hits };
    };

    if (spell.type === 'heal') {
      if (spell.id === 'summon') {
        addMessage('System', '🔥 You summoned a demon ally!', '#ff4444', 'battle');
        addToast('info', 'Summon!', 'A demon fights by your side', '👹', '#ff4444');
      } else if (spell.id === 'utani_hur' || spell.id === 'shadow') {
        p.buffs.push({ id: `b_${now}`, name: 'Haste', icon: '💨', duration: 15000, startTime: now, value: 30, type: 'haste', color: '#9bd4ff' });
        p.speed = Math.max(60, p.speed * 0.6);
        addMessage('System', '💨 You feel faster!', '#9bd4ff', 'battle');
        setTimeout(() => { p.speed = p.mounted ? p.speed : 180; setPlayer({ ...p }); }, 15000);
      } else if (spell.id === 'utamo_vita') {
        p.buffs.push({ id: `b_${now}`, name: 'Magic Shield', icon: '🛡', duration: 30000, startTime: now, value: spell.damage, type: 'shield', color: '#4a90e2' });
        addMessage('System', '🛡 Magic Shield active!', '#4a90e2', 'battle');
      } else if (spell.id === 'utana_vid') {
        p.buffs.push({ id: `b_${now}`, name: 'Invisible', icon: '👻', duration: 10000, startTime: now, value: 0, type: 'invisible', color: '#cccccc' });
        addMessage('System', '👻 You vanish into shadows!', '#cccccc', 'battle');
      } else if (spell.id === 'unholy') {
        p.buffs.push({ id: `b_${now}`, name: 'Unholy Frenzy', icon: '💀', duration: 20000, startTime: now, value: 50, type: 'frenzy', color: '#6a0a6a' });
        addMessage('System', '💀 Unholy Frenzy! +50% damage!', '#6a0a6a', 'battle');
      } else if (spell.id === 'blood_tap') {
        const heal = 80;
        p.hp = Math.min(derivedForSpell.totalMaxHp, p.hp + heal);
        p.stats.healingDone += heal;
        addFloatingText(`+${heal} HP`, p.pos, '#c13030', true);
        spawnParticles(p.pos, '#c13030', 12);
      } else {
        const healAmt = Math.floor((spell.damage + Math.random() * 20) * magicBonus);
        p.hp = Math.min(derivedForSpell.totalMaxHp, p.hp + healAmt);
        p.stats.healingDone += healAmt;
        addFloatingText(`+${healAmt}`, p.pos, '#2ecc71', true);
        spawnParticles(p.pos, '#2ecc71', 10);
        audio.heal();
        addMessage('System', `✨ ${spell.name}: +${healAmt} HP`, '#2ecc71', 'battle');
      }
    } else if (spell.type === 'aoe') {
      let hits = 0;
      for (const m of monstersRef.current) {
        if (m.dead) continue;
        const dist = Math.hypot(m.pos.x - p.pos.x, m.pos.y - p.pos.y);
        if (dist <= spell.range) {
          const frenzyBonus = p.buffs.find((b) => b.type === 'frenzy') ? 1.5 : 1;
          const { dmg, crit } = computeSpellDamage(m.defense);
          const finalDmg = Math.floor(dmg * frenzyBonus);
          m.hp -= finalDmg;
          p.stats.damageDealt += finalDmg;
          dpsMeter.record(p.name, m.name, finalDmg, 'magical', crit);
          addFloatingText(`${crit ? '💥 ' : ''}${finalDmg}`, m.pos, crit ? '#ff4444' : spell.color, crit);
          spawnParticles(m.pos, spell.damageType === 'ice' ? '#9bd4ff' : spell.damageType === 'fire' ? '#ff6a00' : spell.color, 6);
          hits++;
          if (m.hp <= 0) killMonster(m);
        }
      }
      addMessage('System', `${spell.name}: ${hits} hit(s)!`, spell.color, 'battle');
      projectilesRef.current.push({
        id: `p_${Date.now()}`, from: { ...p.pos }, to: { ...p.pos },
        pos: { ...p.pos }, color: spell.color, startTime: now, duration: 500, type: 'aoe',
      });
      spawnParticles(p.pos, spell.color, 20);
      if (hits > 0) screenShakeRef.current = Math.max(screenShakeRef.current, Math.min(9, 4 + hits));
    } else {
      const target = p.targetId
        ? monstersRef.current.find((m) => m.id === p.targetId && !m.dead)
        : findClosestMonster(p.pos, spell.range);
      if (!target) {
        p.mana += spell.mana; // refund
        addMessage('System', 'No target in range.', '#ff9090', 'system');
        return;
      }
      projectilesRef.current.push({
        id: `p_${Date.now()}`, from: { ...p.pos }, to: { ...target.pos },
        pos: { ...p.pos }, color: spell.color, startTime: now, duration: 400, type: 'magic',
        emoji: spell.icon,
      });
      setTimeout(() => {
        if (target.dead) return;
        const frenzyBonus = playerRef.current.buffs.find((b) => b.type === 'frenzy') ? 1.5 : 1;
        const { dmg, crit } = computeSpellDamage(target.defense);
        const finalDmg = Math.floor(dmg * frenzyBonus);
        target.hp -= finalDmg;
        playerRef.current.stats.damageDealt += finalDmg;
        dpsMeter.record(playerRef.current.name, target.name, finalDmg, 'magical', crit);
        addFloatingText(`${crit ? '💥 ' : ''}${finalDmg}`, target.pos, crit ? '#ff4444' : spell.color, crit);
        spawnParticles(target.pos, spell.damageType === 'ice' ? '#9bd4ff' : spell.damageType === 'fire' ? '#ff6a00' : spell.color, crit ? 14 : 8);
        screenShakeRef.current = Math.max(screenShakeRef.current, crit ? 8 : 4);
        addMessage('System', `${spell.name} → ${target.name}: ${finalDmg}${crit ? ' CRIT!' : ''}!`, spell.color, 'battle');
        // Lifesteal from spell
        if (spell.lifestealPercent && spell.lifestealPercent > 0) {
          const heal = Math.floor(finalDmg * (spell.lifestealPercent / 100));
          if (heal > 0) {
            playerRef.current.hp = Math.min(playerRef.current.maxHp, playerRef.current.hp + heal);
            addFloatingText(`+${heal}`, playerRef.current.pos, '#ff5599');
            playerRef.current.stats.healingDone += heal;
          }
        }
        if (target.hp <= 0) killMonster(target);
      }, 400);
    }
    setPlayer({ ...p });
  };

  const findClosestMonster = (pos: { x: number; y: number }, maxDist: number): Monster | null => {
    let closest: Monster | null = null;
    let minDist = maxDist;
    for (const m of monstersRef.current) {
      if (m.dead) continue;
      const dist = Math.hypot(m.pos.x - pos.x, m.pos.y - pos.y);
      if (dist < minDist) { minDist = dist; closest = m; }
    }
    return closest;
  };

  const killMonster = (m: Monster) => {
    m.dead = true;
    m.respawnAt = Date.now() + (m.type === 'boss' ? 60000 : 15000);
    const p = playerRef.current;
    const derived = computeDerivedStats(p);
    const blessingXpMult = getXPMultiplierFromBlessings(p);
    const staminaXpMult = getStaminaMultiplier(getStamina(p));
    const foodXpBonus = getActiveFoodBonus(p, 'xp') / 100;
    const equipXpBonus = derived.xpBonus / 100;
    const finalXp = Math.floor(m.xp * xpMultiplierRef.current * blessingXpMult * staminaXpMult * (1 + foodXpBonus + equipXpBonus));
    p.xp += finalXp;
    p.stats.monstersKilled++;
    if (m.type === 'boss') p.stats.bossesKilled++;
    addMessage('System', `☠ Killed ${m.name} (+${finalXp} XP)`, '#f4e04d', 'battle');
    addFloatingText(`+${finalXp} XP`, m.pos, '#f4e04d', true);
    spawnParticles(m.pos, m.color, 15);
    // Bestiary tracking
    recordKill(p, m.name);
    // World event contribution (if this monster matches an active event)
    const activeEvents = getWorldEvents().filter((e) => e.status === 'active');
    for (const event of activeEvents) {
      if (event.monsterTemplate && event.monsterTemplate.name === m.name) {
        const result = contributeToWorldEvent(event.id, p.name, 1);
        if (result.accepted > 0 && result.required > 0) {
          const rewardGold = Math.floor(event.rewardGold * (result.accepted / result.required));
          const rewardXp = Math.floor(event.rewardXp * (result.accepted / result.required));
          p.gold += rewardGold;
          p.xp += rewardXp;
          p.stats.goldEarned += rewardGold;
        }
        addMessage('World', `🌍 ${event.name}: ${result.current}/${result.required} (${result.contribution} contributed)`, '#ff6a00', 'world');
        if (result.completed) {
          addMessage('System', `🌍 WORLD EVENT COMPLETE: ${event.name}!`, '#ffd700', 'system');
          addToast('loot', 'World Event Done!', event.name, event.icon, '#ff6a00');
          showRaidWarning('WORLD EVENT COMPLETE!', event.icon, '#ff6a00', 4000);
        }
      }
    }
    // Reputation gain
    addReputation(p, 'town', m.type === 'boss' ? 500 : m.type === 'elite' ? 50 : 10);
    // Raid warning on boss kill
    if (m.type === 'boss') {
      showRaidWarning(`${m.name} Defeated!`, m.emoji, '#ffd700', 4000);
    }

    // Skill progress (sword + magic from spells)
    p.skills.sword.progress += 1;
    if (p.skills.sword.progress >= p.skills.sword.level * 10) {
      p.skills.sword.level++;
      p.skills.sword.progress = 0;
      addMessage('System', `⚔ Sword skill up! (${p.skills.sword.level})`, '#f4e04d', 'system');
    }

    // Update quest progress
    for (const aq of p.activeQuests) {
      for (const obj of aq.objectives) {
        if (obj.type === 'kill' && obj.target === m.name && obj.current < obj.count) {
          obj.current++;
          addMessage('Quest', `[${QUESTS.find(q => q.id === aq.questId)?.name}] ${obj.targetName}: ${obj.current}/${obj.count}`, '#9bd4ff', 'quest');
        }
      }
      // Check completion
      if (aq.objectives.every((o) => o.current >= o.count)) {
        const quest = questCatalog.find((q) => q.id === aq.questId);
        if (quest) {
          p.quests.push(aq.questId);
          p.activeQuests = p.activeQuests.filter((x) => x.questId !== aq.questId);
          p.xp += quest.rewards.xp;
          p.gold += quest.rewards.gold;
          p.stats.goldEarned += quest.rewards.gold;
          addMessage('Quest', `✅ Quest Complete: ${quest.name}!`, '#2ecc71', 'quest');
          addToast('quest', 'Quest Complete!', `${quest.name}: +${quest.rewards.xp} XP, +${quest.rewards.gold} gold`, '✅', '#2ecc71');
          spawnParticles(p.pos, '#f4e04d', 25);
        }
      }
    }

    // Tibia-style drops: generate corpse with loot on the ground
    const corpseItems: LootItem[] = [];
    if (m.loot) {
      corpseItems.push(...rollLoot(m.loot));
    }

    // Equipment drop (from elites and bosses) - added to corpse
    if ((m.type === 'elite' || m.type === 'boss') && Math.random() < (m.type === 'boss' ? 0.8 : 0.3)) {
      const eligible = EQUIPMENT_LOOT.filter((e) => e.level <= p.level + 5);
      if (eligible.length > 0) {
        const drop = eligible[Math.floor(Math.random() * eligible.length)];
        corpseItems.push({
          id: `eq_${Date.now()}_${Math.random()}`, name: drop.name, icon: drop.icon,
          quantity: 1, value: drop.value, rarity: drop.rarity,
          equipment: { ...drop, sockets: Math.random() < (m.type === 'boss' ? 0.6 : 0.3) ? Math.floor(Math.random() * 3) + 1 : 0, socketedGems: [] },
          description: drop.description,
        });
      }
    }

    // Gem drop added to corpse
    const gemChance = m.type === 'boss' ? 0.7 : m.type === 'elite' ? 0.25 : 0.04;
    if (Math.random() < gemChance) {
      const gem = randomGemDrop(p.level);
      if (gem) {
        corpseItems.push({
          id: `gem_${Date.now()}_${Math.random()}`, name: gem.name, icon: gem.icon,
          quantity: 1, value: gem.tier * 100, rarity: gem.rarity, description: gem.description,
        });
      }
    }

    // Always spawn a corpse (even if empty, like Tibia)
    const corpse = createCorpse(m.pos, m.name, m.emoji, corpseItems);
    groundItemsRef.current.push(corpse);
    if (corpseItems.length > 0) {
      addMessage('Loot', `🧟 ${m.name} dropped loot! Walk over the corpse to collect.`, '#f4e04d', 'loot');
    }

    // Level up
    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level++;
      p.xpNext = Math.floor(p.xpNext * 1.4);
      const v = VOCATIONS[p.vocation];
      if (v) {
        p.maxHp += v.hpPerLevel;
        p.maxMana += v.manaPerLevel;
        p.attack += v.atkPerLevel;
        p.defense += v.defPerLevel;
        p.magic += v.magPerLevel;
      }
      const levelDerived = computeDerivedStats(p);
      p.hp = levelDerived.totalMaxHp;
      p.mana = levelDerived.totalMaxMana;
      p.stats.levelUps++;
      addMessage('System', `🎉 LEVEL UP! You are now level ${p.level}!`, '#f4e04d', 'system');
      addFloatingText(`LEVEL ${p.level}!`, p.pos, '#f4e04d', true);
      addToast('levelup', 'Level Up!', `You are now level ${p.level}`, '⭐', '#f4e04d');
      spawnParticles(p.pos, '#f4e04d', 30);
      audio.levelUp();
      // Check for newly unlocked spells
      const vocForUnlock = VOCATIONS[p.vocation];
      if (vocForUnlock) {
        for (const sp of vocForUnlock.spells) {
          if (sp.levelRequired === p.level) {
            addMessage('System', `✨ New spell unlocked: ${sp.icon} ${sp.name}!`, sp.color, 'system');
            addToast('info', 'Spell Unlocked!', `${sp.icon} ${sp.name} is now available`, sp.icon, sp.color);
          }
        }
      }
    }

    // Check achievements
    const newAch = checkAchievements(p);
    for (const a of newAch) {
      p.achievements.push(a.id);
      if (a.reward.xp) p.xp += a.reward.xp;
      if (a.reward.gold) { p.gold += a.reward.gold; p.stats.goldEarned += a.reward.gold; }
      addToast('achievement', 'Achievement!', `${a.icon} ${a.name}`, a.icon, '#ff8c00');
      addMessage('System', `🏆 Achievement: ${a.name}!`, '#ff8c00', 'system');
    }

    setPlayer({ ...p });
  };

  const travelToMap = (targetMapId: string, spawn: { x: number; y: number }) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { serverSync.sendTravel(targetMapId); return; }
    const p = playerRef.current;
    const mapData = MAPS[targetMapId];
    if (!mapData) return;
    // Level gate for dangerous zones
    if (mapData.levelRequired && p.level < mapData.levelRequired) {
      addMessage('System', `🔒 ${mapData.name} requires level ${mapData.levelRequired}! (${mapData.dangerLevel} danger)`, '#ff9090', 'system');
      addToast('warning', 'Area Locked!', `${mapData.name} requires level ${mapData.levelRequired}`, '🔒', '#ff9090');
      return;
    }
    currentMapIdRef.current = targetMapId;
    setCurrentMapId(targetMapId);
    worldRef.current = generateMap(targetMapId);
    buildingsRef.current = getTownBuildings(mapData.biome);
    // Reset monsters and NPCs for the new map, including local admin-created content.
    customNpcsRef.current = getCustomNPCs();
    customMonstersRef.current = getCustomMonsters();
    monstersRef.current = [
      ...spawnInitialMonsters(),
      ...customContentOnMap(customMonstersRef.current, targetMapId).map(customMonsterToRuntime),
    ];
    npcsRef.current = [
      ...spawnNPCs(),
      ...customContentOnMap(customNpcsRef.current, targetMapId).map(customNpcToRuntime),
    ];
    groundItemsRef.current = [];
    p.pos = { ...spawn };
    addMessage('System', `🌍 You traveled to ${mapData.name}. ${mapData.description}`, '#9bd4ff', 'system');
    audio.teleport();
    addToast('info', 'New Region!', mapData.name, '🌍', '#9bd4ff');
    showRaidWarning(mapData.name.toUpperCase(), '🌍', '#9bd4ff', 2500);
    setPlayer({ ...p });
  };

  const pickupGroundItem = (ground: GroundItem) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { serverSync.sendPickup(ground.id); return; }
    const p = playerRef.current;
    let pickedUp: string[] = [];
    for (const item of ground.items) {
      if (item.isGold) {
        const goldGain = Math.floor(item.quantity * (1 + computeDerivedStats(p).goldBonus / 100));
        p.gold += goldGain;
        p.stats.goldEarned += goldGain;
        pickedUp.push(`+${goldGain} gold`);
      } else if (item.equipment) {
        const newInv = [...inventoryRef.current, {
          id: `loot_${Date.now()}_${Math.random()}`, name: item.name, icon: item.icon,
          type: 'equipment' as const, quantity: 1, value: item.value, equipment: item.equipment,
          description: item.equipment.description,
        }];
        inventoryRef.current = newInv;
        setInventory(newInv);
        pickedUp.push(`${item.icon} ${item.name}`);
        addToast('loot', 'Looted!', `${item.icon} ${item.name}`, item.icon, (item.rarity ? RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] : '#f4e04d'));
      } else {
        const existing = inventoryRef.current.find((i) => i.name === item.name);
        let newInv;
        if (existing) {
          newInv = inventoryRef.current.map((i) => i.name === item.name ? { ...i, quantity: i.quantity + item.quantity } : i);
        } else {
          newInv = [...inventoryRef.current, {
            id: `loot_${Date.now()}_${Math.random()}`, name: item.name, icon: item.icon,
            type: 'misc' as const, quantity: item.quantity, value: item.value,
          }];
        }
        inventoryRef.current = newInv;
        setInventory(newInv);
        pickedUp.push(`${item.icon} ${item.name}`);
      }
    }
    // Remove ground item
    groundItemsRef.current = groundItemsRef.current.filter((g) => g.id !== ground.id);
    addMessage('Loot', `🧺 Picked up: ${pickedUp.join(', ')}`, '#f4e04d', 'loot');
    setPlayer({ ...p });
  };

  const handleMysteryComplete = (gold: number, xp: number, itemName?: string, itemIcon?: string) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { openOfficial('library'); return; }
    const p = playerRef.current;
    p.gold += gold;
    p.xp += xp;
    p.stats.goldEarned += gold;
    if (itemName) {
      const newInv = [...inventoryRef.current, {
        id: `mystery_${Date.now()}_${Math.random()}`, name: itemName, icon: itemIcon || '🎁',
        type: 'misc' as const, quantity: 1, value: gold,
      }];
      inventoryRef.current = newInv;
      setInventory(newInv);
    }
    addMessage('System', `✦ Mystery solved! +${gold} gold, +${xp} XP${itemName ? `, ${itemIcon} ${itemName}` : ''}!`, '#9b59ff', 'quest');
    addToast('quest', 'Mystery Solved!', `+${gold}g +${xp}XP`, '✦', '#9b59ff');
    spawnParticles(p.pos, '#9b59ff', 25);
    setPlayer({ ...p });
  };

  const enterDungeon = (totalWaves: number) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { serverSync.sendOfficial('dungeon_start', { waves: totalWaves }); setShowDungeon(false); return; }
    const p = playerRef.current;
    dungeonTotalWavesRef.current = totalWaves;
    dungeonWaveRef.current = 1;
    setDungeonWave(1);
    inDungeonRef.current = true;
    setInDungeon(true);
    // Teleport to a dungeon area (lava pit region, far corner)
    p.pos = { x: 70, y: 70 };
    // Remove existing dungeon monsters
    monstersRef.current = monstersRef.current.filter((m) => !m.id.startsWith('dungeon_'));
    const wave1 = DUNGEON_WAVES[0];
    const spawned = spawnDungeonWave(wave1, { x: 73, y: 73 });
    monstersRef.current = [...monstersRef.current, ...spawned];
    addToast('warning', 'DUNGEON STARTED!', `Wave 1/${totalWaves} - Survive!`, '🌀', '#c832ff');
    showRaidWarning(`DUNGEON - WAVE 1`, '🌀', '#c832ff', 3000);
    addMessage('System', `🌀 You entered the dungeon! Wave 1 of ${totalWaves}.`, '#c832ff', 'system');
    setShowDungeon(false);
    setPlayer({ ...p });
  };

  const attackTarget = (m: Monster) => {
    if (onlineAccount && !serverSync.isActive()) return;
    // AUTHORITATIVE MODE: send attack intent to server
    if (serverSync.isActive()) {
      serverSync.sendAttack(m.id);
      return;
    }
    const p = playerRef.current;
    const now = Date.now();
    const dist = Math.hypot(m.pos.x - p.pos.x, m.pos.y - p.pos.y);
    if (dist > 1.8) {
      addMessage('System', 'Too far away.', '#ff9090', 'system');
      return;
    }
    if (now - p.lastAttack < 700) return;
    p.lastAttack = now;

    // Combo system
    if (now - comboRef.current.lastHit < 3000) {
      comboRef.current.count++;
    } else {
      comboRef.current.count = 1;
    }
    comboRef.current.lastHit = now;
    const comboMult = 1 + Math.min(comboRef.current.count - 1, 10) * 0.1;
    if (comboRef.current.count >= 2) {
      setComboDisplay({ count: comboRef.current.count, mult: comboMult });
      setTimeout(() => setComboDisplay(null), 1500);
    }

    const frenzyBonus = p.buffs.find((b) => b.type === 'frenzy') ? 1.5 : 1;
    const blessingDmgMult = getDamageMultiplierFromBlessings(p);
    const foodAtkBonus = getActiveFoodBonus(p, 'attack');
    const derived = computeDerivedStats(p);
    const crit = Math.random() < (derived.critChance / 100);
    // Berserker passive: +50% damage below 30% HP
    const berserkerBonus = p.vocation === 'berserker' && p.hp < p.maxHp * 0.3 ? 1.5 : 1;
    // Monk passive: stronger combos
    const monkComboMult = p.vocation === 'monk' ? comboMult + (comboMult - 1) * 0.5 : comboMult;
    // Weapon mastery bonus (+5% per mastery level to weapon attack portion)
    const eqWeapon = p.equipment.weapon;
    const weaponMasteryMult = eqWeapon ? getMasteryMultiplier(getItemMastery(p.name, eqWeapon.id).level) : 1;
    const weaponBonus = eqWeapon ? Math.floor((eqWeapon.attack ?? 0) * (weaponMasteryMult - 1)) : 0;
    let dmg = Math.max(1, Math.floor((derived.totalAttack + weaponBonus + foodAtkBonus + Math.random() * 8 - m.defense) * frenzyBonus * monkComboMult * damageMultiplierRef.current * blessingDmgMult * berserkerBonus));
    if (crit) dmg = Math.floor(dmg * 2);
    if (oneHitKillRef.current) dmg = m.maxHp * 10;
    m.hp -= dmg;
    p.stats.damageDealt += dmg;
    dpsMeter.record(p.name, m.name, dmg, 'physical', crit);
    addFloatingText(
      `${oneHitKillRef.current ? '💀 ' : crit ? '💥 ' : ''}${dmg}`,
      m.pos,
      oneHitKillRef.current ? '#ff00ff' : crit ? '#ff4444' : '#ffdddd',
      crit || oneHitKillRef.current
    );
    spawnParticles(m.pos, oneHitKillRef.current ? '#ff00ff' : '#ff6060', crit || oneHitKillRef.current ? 12 : 4);
    screenShakeRef.current = oneHitKillRef.current ? 15 : crit ? 8 : 3;
    // Audio
    if (crit || oneHitKillRef.current) audio.hitCrit(); else audio.hit();
    // Lifesteal
    if (derived.lifesteal > 0 && !oneHitKillRef.current) {
      const heal = Math.max(1, Math.floor(dmg * (derived.lifesteal / 100)));
      p.hp = Math.min(derived.totalMaxHp, p.hp + heal);
      addFloatingText(`+${heal}`, p.pos, '#ff5599');
      p.stats.healingDone += heal;
    }
    // Item mastery progression (like skills) - weapon gains % toward next level
    const weapon = p.equipment.weapon;
    if (weapon && !oneHitKillRef.current) {
      const weaponKey = `${weapon.id}`;
      const result = addItemMasteryProgress(p.name, weaponKey, 1);
      if (result.leveledUp) {
        addMessage('System', `📈 Weapon mastery up! ${weapon.name} reached Lv ${result.level} (+5% stats)`, '#f4e04d', 'system');
        addFloatingText(`+Mastery!`, p.pos, '#f4e04d', true);
      }
    }
    // Thorns - not applicable on player's own attack (thorns reflect when hit)
    if (m.hp <= 0) killMonster(m);
    setPlayer({ ...p });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const px = (e.clientX - rect.left) * sx;
    const py = (e.clientY - rect.top) * sx;
    mouseTileRef.current = {
      x: Math.floor(px / TILE_SIZE) + cameraRef.current.x,
      y: Math.floor(py / TILE_SIZE) + cameraRef.current.y,
    };
  };

  const handleCanvasClick = () => {
    if (onlineAccount && !serverSync.isActive()) return;
    const tile = mouseTileRef.current;
    if (!tile) return;
    const p = playerRef.current;
    if (serverSync.isActive()) {
      const ground = serverGroundRef.current.find((g: any) => g.x === tile.x && g.y === tile.y);
      if (ground && Math.hypot(tile.x - p.pos.x, tile.y - p.pos.y) <= 2) { serverSync.sendPickup(ground.id); return; }
      const monster = serverMonstersRef.current.find((m: any) => m.x === tile.x && m.y === tile.y && m.hp > 0);
      if (monster) { p.targetId = monster.id; serverSync.sendAttack(monster.id); return; }
      const npc = npcsRef.current.find((candidate) => candidate.pos.x === tile.x && candidate.pos.y === tile.y);
      if (npc && Math.abs(npc.pos.x - p.pos.x) <= 2 && Math.abs(npc.pos.y - p.pos.y) <= 2) {
        setActiveDialog(npc);
        return;
      }
      const otherPlayer = serverPlayersRef.current.find((candidate: any) => candidate.x === tile.x && candidate.y === tile.y);
      if (otherPlayer) {
        p.targetId = otherPlayer.id;
        setPlayer({ ...p });
        if (officialState?.state?.pvp?.enabled) serverSync.sendOfficial('pvp_attack', { targetId: otherPlayer.id });
        return;
      }
      p.targetId = undefined;
      return;
    }
    // Click corpse to loot (Tibia-style)
    const ground = groundItemsRef.current.find((g) => g.pos.x === tile.x && g.pos.y === tile.y);
    if (ground && Math.hypot(tile.x - p.pos.x, tile.y - p.pos.y) <= 2) {
      pickupGroundItem(ground);
      return;
    }
    const m = monstersRef.current.find((mm) => !mm.dead && mm.pos.x === tile.x && mm.pos.y === tile.y);
    if (m) {
      p.targetId = m.id;
      if (m.type === 'boss' && m.hp === m.maxHp) {
        showRaidWarning(`${m.name} Engaged!`, m.emoji, '#ffd700', 3000);
      }
      attackTarget(m);
      setPlayer({ ...p });
    } else {
      const npc = npcsRef.current.find((n) => n.pos.x === tile.x && n.pos.y === tile.y);
      if (npc && Math.abs(npc.pos.x - p.pos.x) <= 2 && Math.abs(npc.pos.y - p.pos.y) <= 2) {
        setActiveDialog(npc);
      } else {
        p.targetId = undefined;
        setPlayer({ ...p });
      }
    }
  };

  const handleNPCAction = (action: string, npc: NPC, questId?: string) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) {
      if (action === 'quest' && questId) serverSync.sendQuestAccept(questId);
      else if (action === 'bank' || action === 'depot') openOfficial('depot');
      else if (action === 'mail') openOfficial('mail');
      else if (action === 'books') openOfficial('library');
      else if (action === 'food' || action === 'heal' || action === 'train' || action === 'shop') openOfficial('services');
      else if (action === 'life') setShowLifeStyle(true);
      setActiveDialog(null);
      return;
    }
    const p = playerRef.current;
      if (action === 'shop' && npc.shop) {
        addMessage('System', `🛒 ${npc.name}'s shop opened.`, '#f4e04d', 'system');
        setShowInventory(true);
        setActiveDialog(null);
      } else if (action === 'food') {
        setShowFoodShop(true);
        setActiveDialog(null);
    } else if (action === 'bank') {
      const amt = p.gold;
      if (amt > 0) {
        p.bankGold += amt;
        p.gold = 0;
        addMessage('System', `🏦 Deposited ${amt} gold. Bank: ${p.bankGold}.`, '#f4e04d', 'system');
        addToast('info', 'Bank', `Deposited ${amt} gold`, '🏦', '#f4e04d');
        setPlayer({ ...p });
      }
      setShowDepot(true);
      setActiveDialog(null);
    } else if (action === 'depot') {
      setShowDepot(true);
      setActiveDialog(null);
    } else if (action === 'mail') {
      setShowMail(true);
      setActiveDialog(null);
    } else if (action === 'books') {
      setShowBooks(true);
      setActiveDialog(null);
    } else if (action === 'heal') {
      if (p.gold >= 50) {
        p.gold -= 50;
        const healDerived = computeDerivedStats(p);
        p.hp = healDerived.totalMaxHp;
        p.mana = healDerived.totalMaxMana;
        saveStamina(p, getStamina(p) + 120); // +2h stamina
        addMessage('System', '💚 Fully rested! HP & Mana restored. (+2h stamina)', '#2ecc71', 'system');
        addFloatingText('Full!', p.pos, '#2ecc71', true);
        spawnParticles(p.pos, '#2ecc71', 20);
        setPlayer({ ...p });
      } else {
        addMessage('System', 'Not enough gold to rest (50g).', '#ff9090', 'system');
      }
      setActiveDialog(null);
    } else if (action === 'train') {
      if (p.gold >= 200) {
        p.gold -= 200;
        p.attack += 2;
        p.defense += 1;
        p.magic += 1;
        addMessage('System', '📚 Training complete! +2 ATK, +1 DEF, +1 MAG.', '#ff8c00', 'system');
        addToast('info', 'Training Complete!', 'Stats improved', '📚', '#ff8c00');
        spawnParticles(p.pos, '#ff8c00', 15);
        setPlayer({ ...p });
      } else {
        addMessage('System', 'Need 200 gold to train.', '#ff9090', 'system');
      }
      setActiveDialog(null);
    } else if (action === 'quest' && questId) {
      const quest = QUESTS.find((q) => q.id === questId);
      if (quest && !p.quests.includes(questId) && !p.activeQuests.find((a) => a.questId === questId)) {
        if (p.level < quest.levelRequired) {
          addMessage('System', `Need level ${quest.levelRequired} for this quest.`, '#ff9090', 'system');
        } else {
          const aq: ActiveQuest = {
            questId,
            objectives: quest.objectives.map((o) => ({ ...o, current: 0 })),
            startedAt: Date.now(),
          };
          p.activeQuests.push(aq);
          addMessage('Quest', `📜 Quest accepted: ${quest.name}`, '#9bd4ff', 'quest');
          addToast('quest', 'New Quest!', quest.name, '📜', '#9bd4ff');
          setPlayer({ ...p });
        }
      } else {
        addMessage('System', 'Quest already active or completed.', '#ff9090', 'system');
      }
      setActiveDialog(null);
    } else if (action === 'bye') {
      setActiveDialog(null);
    }
  };

  const buyItem = (shopItem: { name: string; icon: string; type: Item['type']; price: number; description?: string; equipment?: Equipment }) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { const itemId = shopItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); serverSync.sendOfficial('shop_buy', { itemId, quantity: 1 }); return; }
    const p = playerRef.current;
    const discount = getShopDiscountFromRep(p);
    const finalPrice = Math.floor(shopItem.price * (1 - discount));
    if (p.gold < finalPrice) {
      addMessage('System', 'Not enough gold.', '#ff9090', 'system');
      return;
    }
    p.gold -= finalPrice;
    const newItem: Item = {
      id: `shop_${Date.now()}_${Math.random()}`,
      name: shopItem.name,
      icon: shopItem.icon,
      type: shopItem.type,
      quantity: 1,
      value: shopItem.price,
      description: shopItem.description,
      equipment: shopItem.equipment,
    };
    const existing = inventoryRef.current.find((i) => i.name === shopItem.name);
    let newInv;
    if (existing && existing.type === 'potion') {
      newInv = inventoryRef.current.map((i) => i.name === shopItem.name ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      newInv = [...inventoryRef.current, newItem];
    }
    inventoryRef.current = newInv;
    setInventory(newInv);
    addMessage('System', `🛒 Bought ${shopItem.name} for ${finalPrice}g${discount > 0 ? ` (${Math.round(discount * 100)}% rep discount!)` : ''}.`, '#2ecc71', 'system');
    setPlayer({ ...p });
  };

  // Drop item on the ground (Tibia-style)
  const dropItemOnGround = (item: Item) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { serverSync.sendDrop(item.id); return; }
    const p = playerRef.current;
    // Create a loot bag / ground item at player's position
    const bagItems = [];
    if (item.equipment) {
      bagItems.push({
        id: `drop_${Date.now()}`, name: item.name, icon: item.icon,
        quantity: item.quantity, value: item.value, equipment: item.equipment, rarity: item.equipment.rarity,
      });
    } else if (item.name === 'Gold') {
      bagItems.push({ id: `drop_${Date.now()}`, name: 'Gold', icon: '🪙', quantity: item.quantity, value: item.value, isGold: true });
    } else {
      bagItems.push({ id: `drop_${Date.now()}`, name: item.name, icon: item.icon, quantity: item.quantity, value: item.value });
    }
    groundItemsRef.current.push(createLootBag({ ...p.pos }, bagItems));
    // Remove from inventory
    inventoryRef.current = inventoryRef.current.filter((i) => i.id !== item.id);
    setInventory(inventoryRef.current);
    addMessage('System', `📉 Dropped ${item.icon} ${item.name} on the ground.`, '#9bd4ff', 'system');
  };

  // PvP & Skull
  const [pvpEnabled, setPvpEnabled] = useState(isPvpEnabled(player.name));

  const socketGem = (itemId: string, gemId: string) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { const targetGem = inventoryRef.current.find((i: any) => i.gemId === gemId || i.name === GEMS.find((g) => g.id === gemId)?.name); if (targetGem) serverSync.sendOfficial('socket_gem', { itemId, gemItemId: targetGem.id }); return; }
    const inv = inventoryRef.current;
    const item = inv.find((i) => i.id === itemId);
    if (!item?.equipment) return;
    const gem = GEMS.find((g) => g.id === gemId);
    if (!gem) return;
    const gemItem = inv.find((i) => i.name === gem.name);
    if (!gemItem || gemItem.quantity <= 0) return;
    // Add socket to equipment if needed (first socketing grants 1 socket)
    const sockets = item.equipment.sockets ?? 1;
    const filled = item.equipment.socketedGems?.length ?? 0;
    if (filled >= sockets) {
      addMessage('System', 'No empty sockets!', '#ff9090', 'system');
      return;
    }
    // Socket the gem (clone equipment to avoid mutation issues)
    item.equipment = {
      ...item.equipment,
      sockets,
      socketedGems: [...(item.equipment.socketedGems || []), gemId],
    };
    // Consume gem
    gemItem.quantity -= 1;
    if (gemItem.quantity <= 0) {
      inventoryRef.current = inv.filter((i) => i.id !== gemItem.id);
    } else {
      inventoryRef.current = [...inv];
    }
    setInventory(inventoryRef.current);
    addMessage('System', `💎 Socketed ${gem.icon} ${gem.name} into ${item.name}!`, gem.color, 'system');
    addToast('info', 'Gem Socketed!', `${gem.name} → ${item.name}`, '💎', gem.color);
    spawnParticles(playerRef.current.pos, gem.color, 10);
  };

  const craftItem = (name: string, icon: string, value: number, description?: string) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { const onlineRecipe = RECIPES.find((r) => r.result.name === name || r.name === name); if (onlineRecipe) serverSync.sendOfficial('craft', { recipeId: onlineRecipe.id }); return; }
    const recipe = RECIPES.find((r) => r.result.name === name);
    if (!recipe) return;
    if (!canCraft(recipe, inventoryRef.current, playerRef.current.level)) {
      addMessage('System', 'Not enough materials.', '#ff9090', 'system');
      return;
    }
    // Remove ingredients
    const newInv = [...inventoryRef.current];
    for (const ing of recipe.ingredients) {
      const idx = newInv.findIndex((i) => i.name === ing.name);
      if (idx < 0) return;
      if (ing.name === 'Gold') {
        const p = playerRef.current;
        if (p.gold < ing.quantity) return;
        p.gold -= ing.quantity;
        setPlayer({ ...p });
      } else {
        newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity - ing.quantity };
        if (newInv[idx].quantity <= 0) newInv.splice(idx, 1);
      }
    }
    // Add result
    const existing = newInv.find((i) => i.name === name);
    if (existing) {
      existing.quantity += recipe.result.quantity;
    } else {
      newInv.push({
        id: `craft_${Date.now()}_${Math.random()}`,
        name, icon,
        type: 'misc',
        quantity: recipe.result.quantity,
        value,
        description,
      });
    }
    inventoryRef.current = newInv;
    setInventory(newInv);
    addMessage('System', `⚒ Crafted ${icon} ${name}!`, '#2ecc71', 'system');
    addToast('info', 'Crafted!', `${icon} ${name}`, icon, '#2ecc71');
    spawnParticles(playerRef.current.pos, '#2ecc71', 10);
  };

  const equipItem = (item: Item) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (!item.equipment) return;
    if (serverSync.isActive()) { serverSync.sendEquip(item.id); return; }
    const p = playerRef.current;
    // Level requirement check
    if ((item.equipment.level || 1) > p.level) {
      addMessage('System', `🔒 You need level ${item.equipment.level} to equip ${item.name}!`, '#ff9090', 'system');
      addToast('warning', 'Level Too Low!', `${item.name} requires level ${item.equipment.level}`, '🔒', '#ff9090');
      return;
    }
    const slot = item.equipment.slot;
    const currentEquipped = p.equipment[slot];
    // Unequip current (return to inventory)
    if (currentEquipped) {
      const unequipped: Item = {
        id: `eq_${Date.now()}_${Math.random()}`,
        name: currentEquipped.name, icon: currentEquipped.icon,
        type: 'equipment', quantity: 1, value: currentEquipped.value,
        equipment: currentEquipped,
      };
      inventoryRef.current = [...inventoryRef.current, unequipped];
    }
    // Equipment stats are computed dynamically via computeDerivedStats, not stored on player
    p.equipment[slot] = item.equipment;
    // Remove from inventory
    inventoryRef.current = inventoryRef.current.filter((i) => i.id !== item.id);
    setInventory(inventoryRef.current);
    addMessage('System', `⚔ Equipped ${item.name}.`, RARITY_COLORS[item.equipment.rarity], 'system');
    setPlayer({ ...p });
  };

  const unequipItem = (slot: keyof Player['equipment']) => {
    if (onlineAccount && !serverSync.isActive()) return;
    if (serverSync.isActive()) { serverSync.sendUnequip(String(slot)); return; }
    const p = playerRef.current;
    const eq = p.equipment[slot];
    if (!eq) return;
    const unequipped: Item = {
      id: `eq_${Date.now()}_${Math.random()}`,
      name: eq.name, icon: eq.icon,
      type: 'equipment', quantity: 1, value: eq.value, equipment: eq,
    };
    inventoryRef.current = [...inventoryRef.current, unequipped];
    // Equipment stats removed automatically via computeDerivedStats
    delete p.equipment[slot];
    setInventory(inventoryRef.current);
    setPlayer({ ...p });
  };

  // Game loop
  useEffect(() => {
    let rafId = 0;
    const loop = () => {
      const now = Date.now();
      const p = playerRef.current;
      const world = worldRef.current;

      // Day/night cycle (1 cycle = 3 minutes)
      dayTimeRef.current = (now / 1000) % 180;

      // ===== DUAL MODE: Authoritative (send intent) vs Local (simulate) =====
      if (serverSync.isActive()) {
        // AUTHORITATIVE MODE: send movement intent to server, sync state from snapshot
        const moveSpeed = 120;
        if (now - lastMoveRef.current > moveSpeed) {
          let dx = 0, dy = 0;
          if (keysRef.current.has('w') || keysRef.current.has('arrowup')) dy = -1;
          else if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) dy = 1;
          else if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) dx = -1;
          else if (keysRef.current.has('d') || keysRef.current.has('arrowright')) dx = 1;
          if (dx !== 0 || dy !== 0) {
            serverSync.sendMove(dx, dy);
            lastMoveRef.current = now;
          }
        }
        // Sync player state from server snapshot (THE TRUTH)
        const renderState = serverSync.getRenderState();
        if (renderState) {
          const sp = renderState.player || {};
          const { x, y, inventory: serverInventory, quests: serverQuestState, adventure: serverAdventure, skills: serverSkills, stats: serverStats, ws: _ws, ...compatibleServerPlayer } = sp;
          const serverOfficial = renderState.official;
          const serverSocial = renderState.social;
          worldClockRef.current = sanitizeWorldClock(renderState.worldClock, now);
          Object.assign(p, compatibleServerPlayer);
          if (serverSkills && typeof serverSkills === 'object') p.skills = serverSkills;
          if (Number.isFinite(x) && Number.isFinite(y)) p.pos = { x, y };
          if (serverStats && typeof serverStats === 'object') p.stats = { ...p.stats, ...serverStats };
          if (serverAdventure && typeof serverAdventure === 'object') {
            const signature = JSON.stringify(serverAdventure);
            if (signature !== lastAdventureSignatureRef.current) {
              lastAdventureSignatureRef.current = signature;
              setAdventureState(serverAdventure as AdventureSnapshot);
            }
          }
          if (serverOfficial && typeof serverOfficial === 'object') {
            const signature = JSON.stringify(serverOfficial);
            if (signature !== lastOfficialSignatureRef.current) {
              lastOfficialSignatureRef.current = signature;
              setOfficialState(serverOfficial);
              if (Array.isArray(serverOfficial.state?.achievements)) p.achievements = serverOfficial.state.achievements;
              if (serverOfficial.state?.reputation && typeof serverOfficial.state.reputation === 'object') p.reputation = serverOfficial.state.reputation;
            }
          }
          if (serverSocial && typeof serverSocial === 'object') {
            const signature = JSON.stringify(serverSocial);
            if (signature !== lastSocialSignatureRef.current) {
              lastSocialSignatureRef.current = signature;
              setSocialState(serverSocial);
            }
          }
          if (serverQuestState && typeof serverQuestState === 'object') {
            p.quests = Array.isArray(serverQuestState.completed) ? serverQuestState.completed : p.quests;
            p.activeQuests = Array.isArray(serverQuestState.active) ? serverQuestState.active.map((q: any) => ({
              questId: q.questId,
              objectives: [{ type: 'kill', target: q.target, targetName: q.target, count: q.needed, current: q.current }],
              startedAt: 0,
            })) : p.activeQuests;
          }
          if (Array.isArray(serverInventory)) {
            const signature = JSON.stringify(serverInventory);
            if (signature !== lastServerInventorySignatureRef.current) {
              lastServerInventorySignatureRef.current = signature;
              inventoryRef.current = serverInventory;
              setInventory(serverInventory);
            }
          }
          if (typeof sp.mapId === 'string' && MAPS[sp.mapId] && sp.mapId !== currentMapIdRef.current) {
            currentMapIdRef.current = sp.mapId;
            setCurrentMapId(sp.mapId);
            worldRef.current = generateMap(sp.mapId);
            buildingsRef.current = getTownBuildings(MAPS[sp.mapId].biome);
            if (serverNpcCatalogRef.current.length > 0) {
              npcsRef.current = serverNpcCatalogRef.current
                .filter((entry) => entry.mapId === sp.mapId)
                .map((entry) => entry.npc);
            }
            audio.teleport();
          }
          serverMonstersRef.current = renderState.monsters;
          serverPlayersRef.current = renderState.nearbyPlayers;
          serverGroundRef.current = renderState.groundItems;
          serverSync.processEvents(addFloatingText, addMessage, (event) => {
            applyAuthoritativeCombatFeedback(event, p.pos, spawnParticles, (strength) => {
              screenShakeRef.current = Math.max(screenShakeRef.current, strength);
            });
          });
        }
      } else if (!onlineAccount) {
      // LOCAL MODE (single-player or BroadcastChannel): original simulation
      const moveSpeed = Math.max(80, p.speed * 0.7);
      if (now - lastMoveRef.current > moveSpeed) {
        let dx = 0, dy = 0;
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) { dy = -1; p.direction = 'up'; }
        else if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) { dy = 1; p.direction = 'down'; }
        else if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) { dx = -1; p.direction = 'left'; }
        else if (keysRef.current.has('d') || keysRef.current.has('arrowright')) { dx = 1; p.direction = 'right'; }
          if (dx !== 0 || dy !== 0) {
            const nx = p.pos.x + dx, ny = p.pos.y + dy;

            // Profession gathering on movement
            if (!noClipRef.current && world[ny]?.[nx]) {
              const gathered = gatherFromTile(p, world[ny][nx].type);
              if (gathered) {
                const existing = inventoryRef.current.find((i) => i.name === gathered.material.name);
                let newInv;
                if (existing) {
                  newInv = inventoryRef.current.map((i) => i.name === gathered.material.name ? { ...i, quantity: i.quantity + gathered.quantity } : i);
                } else {
                  newInv = [...inventoryRef.current, {
                    id: `mat_${Date.now()}_${Math.random()}`, name: gathered.material.name,
                    icon: gathered.material.icon, type: 'material' as const,
                    quantity: gathered.quantity, value: gathered.material.value,
                  }];
                }
                inventoryRef.current = newInv;
                setInventory(newInv);
                addFloatingText(`+${gathered.material.icon}`, p.pos, '#2ecc71');
                addMessage('System', `⛏ Gathered ${gathered.material.icon} ${gathered.material.name}`, '#2ecc71', 'loot');
              }
            }

            const canMove = noClipRef.current
              ? (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT)
              : (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT &&
                world[ny][nx].walkable &&
                !monstersRef.current.some((m) => !m.dead && m.pos.x === nx && m.pos.y === ny) &&
                !npcsRef.current.some((n) => n.pos.x === nx && n.pos.y === ny));
            if (canMove) {
              p.pos.x = nx;
              p.pos.y = ny;
              p.stats.distanceWalked++;

              // Pickup ground loot (Tibia-style: walk over corpse)
              const groundHere = groundItemsRef.current.find((g) => g.pos.x === nx && g.pos.y === ny);
              if (groundHere) {
                pickupGroundItem(groundHere);
              }

              // Travel through portals
              const mapData = MAPS[currentMapIdRef.current];
              if (mapData) {
                const portal = mapData.portals.find((pp) => pp.pos.x === nx && pp.pos.y === ny);
                if (portal) {
                  travelToMap(portal.targetMap, portal.targetSpawn);
                }
              }
            }
            lastMoveRef.current = now;
          }
      }
      } // end else (local mode)

      if (!onlineAccount) {
      // Auto-loot adjacent corpses (within 1 tile) for fluidity
      const adjacentCorpse = groundItemsRef.current.find((g) => {
        const d = Math.hypot(g.pos.x - p.pos.x, g.pos.y - p.pos.y);
        return d <= 1.2 && g.items.length > 0;
      });
      if (adjacentCorpse && now - (adjacentCorpse.createdAt + 300) > 0) {
        pickupGroundItem(adjacentCorpse);
      }

      // Expire old corpses
      groundItemsRef.current = groundItemsRef.current.filter((g) => now < g.expireAt);

      // Regen (caps at derived totals including equipment HP/Mana bonuses)
      if (now - p.lastRegen > 2000) {
        const priestBonus = p.vocation === 'priest' ? 1.5 : 1;
        const derived = computeDerivedStats(p);
        if (p.hp < derived.totalMaxHp) p.hp = Math.min(derived.totalMaxHp, p.hp + Math.floor(2 * priestBonus));
        if (p.mana < derived.totalMaxMana) p.mana = Math.min(derived.totalMaxMana, p.mana + Math.floor(3 * priestBonus));
        p.lastRegen = now;
      }

      // Buff expiry
      p.buffs = p.buffs.filter((b) => now - b.startTime < b.duration);

      // Stamina decreases once per 30s. Modulo-based checks could execute on
      // multiple animation frames inside the same time window.
      if (now - lastStaminaDrainRef.current >= 30000) {
        lastStaminaDrainRef.current = now;
        const currentStamina = getStamina(p);
        if (currentStamina > 0) saveStamina(p, currentStamina - 1);
      }

      // Daily reward check (once on load)
      if (now - lastMoveRef.current < 100 && canClaimDaily(p)) {
        const reward = claimDaily(p);
        if (reward) {
          p.xp += reward.xp;
          p.gold += reward.gold;
          addMessage('System', `🎁 Daily Reward Day ${reward.day}: ${reward.icon} +${reward.xp} XP, +${reward.gold} gold!`, '#f4e04d', 'system');
          addToast('info', 'Daily Reward!', `Day ${reward.day}: +${reward.xp} XP, +${reward.gold}g`, reward.icon, '#f4e04d');
          setPlayer({ ...p });
        }
      }

      // Auto-attack (WoW-style: automatically attack target in range)
      if (autoAttackRef.current && p.targetId && now - p.lastAttack > 700) {
        const target = monstersRef.current.find((m) => m.id === p.targetId && !m.dead);
        if (target) {
          const dist = Math.hypot(target.pos.x - p.pos.x, target.pos.y - p.pos.y);
          if (dist <= 1.8) {
            attackTarget(target);
          }
        }
      }

      // Pet AI - follow player and attack target
      const activePetId = getActivePet(p.name);
      if (activePetId) {
        const petData = PETS.find((pd) => pd.id === activePetId);
        if (petData) {
          if (!petStateRef.current || petStateRef.current.petId !== activePetId) {
            petStateRef.current = { petId: activePetId, pos: { ...p.pos }, hp: petData.hp, maxHp: petData.hp, lastAttack: 0 };
          }
          const pet = petStateRef.current;
          // Follow player
          const petDistToPlayer = Math.hypot(pet.pos.x - p.pos.x, pet.pos.y - p.pos.y);
          if (petDistToPlayer > 1.5 && now - (pet.lastAttack || 0) > petData.speed) {
            const dx = Math.sign(p.pos.x - pet.pos.x);
            const dy = Math.sign(p.pos.y - pet.pos.y);
            if (Math.abs(p.pos.x - pet.pos.x) > Math.abs(p.pos.y - pet.pos.y)) pet.pos.x += dx;
            else pet.pos.y += dy;
          }
          // Attack player's target
          if (p.targetId && now - pet.lastAttack > petData.speed) {
            const target = monstersRef.current.find((m) => m.id === p.targetId && !m.dead);
            if (target) {
              const dist = Math.hypot(target.pos.x - pet.pos.x, target.pos.y - pet.pos.y);
              if (dist <= 1.8) {
                pet.lastAttack = now;
                const petDmg = Math.max(1, petData.attack + Math.floor(Math.random() * 5) - target.defense);
                target.hp -= petDmg;
                addFloatingText(`🐾${petDmg}`, target.pos, petData.color);
                spawnParticles(target.pos, petData.color, 4);
                if (target.hp <= 0) killMonster(target);
              }
            }
          }
        }
      } else {
        petStateRef.current = null;
      }

      // Dungeon progress check
      if (inDungeonRef.current) {
        const aliveDungeon = monstersRef.current.some((m) => m.id.startsWith('dungeon_') && !m.dead);
        if (!aliveDungeon) {
          const nextWave = dungeonWaveRef.current + 1;
          if (nextWave > dungeonTotalWavesRef.current) {
            const reward = getDungeonReward(dungeonWaveRef.current);
            p.gold += reward.gold;
            p.xp += reward.xp;
            inDungeonRef.current = false;
            setInDungeon(false);
            setHighestDungeonWave((h: number) => {
              const newHigh = Math.max(h, dungeonWaveRef.current);
              localStorage.setItem(`tibia_dungeon_high_${p.name}`, newHigh.toString());
              return newHigh;
            });
            addToast('loot', 'DUNGEON CLEARED!', `+${reward.gold} gold, +${reward.xp} XP!`, '🏆', '#ffd700');
            showRaidWarning('DUNGEON CLEARED!', '🏆', '#ffd700', 4000);
            addMessage('System', `🏆 Dungeon complete! +${reward.gold} gold, +${reward.xp} XP`, '#ffd700', 'battle');
            p.pos = { x: 40, y: 40 };
          } else {
            const waveData = DUNGEON_WAVES[nextWave - 1];
            const spawned = spawnDungeonWave(waveData, { x: 73, y: 73 });
            monstersRef.current = [...monstersRef.current, ...spawned];
            dungeonWaveRef.current = nextWave;
            setDungeonWave(nextWave);
            showRaidWarning(`WAVE ${nextWave}`, waveData.monsters[0].emoji, '#c832ff', 2500);
            addMessage('System', `🌀 Wave ${nextWave}/${dungeonTotalWavesRef.current} incoming!`, '#c832ff', 'battle');
          }
        }
      }

      // Monster AI
      for (const m of monstersRef.current) {
        if (m.dead) {
          if (now >= m.respawnAt) {
            m.dead = false;
            m.hp = m.maxHp;
            m.pos = { ...m.respawnPos };
          }
          continue;
        }
        // Check if player is invisible
        const isInvisible = p.buffs.some((b) => b.type === 'invisible');
        const distToPlayer = Math.hypot(m.pos.x - p.pos.x, m.pos.y - p.pos.y);
        const aggroRange = isInvisible ? 1.5 : 8;

        if (distToPlayer <= 1.5 && now - m.lastAttack > 1200 && !godModeRef.current) {
          m.lastAttack = now;
          const derived = computeDerivedStats(p);
          const blessingReduction = getDamageReductionFromBlessings(p);
          const foodDefBonus = getActiveFoodBonus(p, 'defense');
          // Templar passive: -10% damage when above 50% HP
          const templarReduction = p.vocation === 'templar' && p.hp > p.maxHp * 0.5 ? 0.1 : 0;
          const totalReduction = blessingReduction + (derived.damageReduction / 100) + templarReduction;
          let dmg = Math.max(1, Math.floor((m.attack + Math.floor(Math.random() * 4) - derived.totalDefense - foodDefBonus - derived.totalArmor) * (1 - totalReduction)));
          // Shield buff absorbs
          const shieldBuff = p.buffs.find((b) => b.type === 'shield');
          if (shieldBuff) {
            const absorb = Math.min(dmg, shieldBuff.value);
            shieldBuff.value -= absorb;
            dmg -= absorb;
            if (shieldBuff.value <= 0) {
              p.buffs = p.buffs.filter((b) => b !== shieldBuff);
              addMessage('System', '🛡 Magic Shield broke!', '#4a90e2', 'battle');
            }
          }
          if (dmg > 0) {
            p.hp -= dmg;
            p.stats.damageTaken += dmg;
            addFloatingText(`-${dmg}`, p.pos, '#ff6060');
            spawnParticles(p.pos, '#ff6060', 4);
            screenShakeRef.current = 5;
            p.skills.shielding.progress += 1;
          }
          // Thorns - reflect damage to attacker
          if (derived.thorns > 0 && !m.dead) {
            const reflect = derived.thorns;
            m.hp -= reflect;
            addFloatingText(`🌵${reflect}`, m.pos, '#4a7c3a');
            if (m.hp <= 0) killMonster(m);
          }
          if (p.hp <= 0) {
            // Check AOL or blessing
            if (p.aol) {
              p.aol = false;
              p.hp = Math.floor(p.maxHp / 2);
              addMessage('System', '📿 Amulet of Loss saved you!', '#9b59ff', 'system');
              addToast('info', 'Saved!', 'Your amulet shattered', '📿', '#9b59ff');
            } else {
              p.stats.deaths++;
              // Exit dungeon on death (no reward)
              if (inDungeonRef.current) {
                inDungeonRef.current = false;
                setInDungeon(false);
                monstersRef.current = monstersRef.current.filter((m) => !m.id.startsWith('dungeon_'));
                addMessage('System', '💀 You failed the dungeon! Try again.', '#ff4444', 'system');
              }
              const deathDerived = computeDerivedStats(p);
              p.hp = deathDerived.totalMaxHp;
              p.mana = deathDerived.totalMaxMana;
              p.pos = { x: 40, y: 40 };
              if (!p.quests.includes('protected')) {
                const deathXPLoss = getDeathXPLossMultiplier(p);
              p.xp = Math.max(0, p.xp - Math.floor(p.xpNext * 0.1 * deathXPLoss));
              if (!keepItemsOnDeath(p)) {
                // Lose some gold on death
                const goldLost = Math.floor(p.gold * 0.05);
                p.gold = Math.max(0, p.gold - goldLost);
                if (goldLost > 0) addMessage('System', `Lost ${goldLost} gold.`, '#ff9090', 'system');
              }
              }
              addMessage('System', '💀 You died! Respawned in town. (-10% XP)', '#ff4444', 'system');
              addToast('warning', 'You Died!', 'Respawned in town', '💀', '#ff4444');
              showRaidWarning('YOU DIED', '💀', '#ff0000', 3000);
              screenShakeRef.current = 20;
            }
          }
        } else if (distToPlayer < aggroRange && distToPlayer > 1.2 && now - m.lastMove > m.speed) {
          m.lastMove = now;
          const ddx = Math.sign(p.pos.x - m.pos.x);
          const ddy = Math.sign(p.pos.y - m.pos.y);
          let nx = m.pos.x, ny = m.pos.y;
          if (Math.abs(p.pos.x - m.pos.x) > Math.abs(p.pos.y - m.pos.y)) nx += ddx;
          else ny += ddy;
          if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT &&
              world[ny][nx].walkable &&
              !monstersRef.current.some((mm) => mm.id !== m.id && !mm.dead && mm.pos.x === nx && mm.pos.y === ny)) {
            m.pos.x = nx; m.pos.y = ny;
          }
        } else if (distToPlayer >= aggroRange && now - m.lastMove > m.speed * 2) {
          m.lastMove = now;
          if (Math.random() < 0.3) {
            const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            const d = dirs[Math.floor(Math.random() * 4)];
            const nx = m.pos.x + d.x, ny = m.pos.y + d.y;
            const respawn = m.respawnPos;
            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT &&
                world[ny][nx].walkable &&
                Math.abs(nx - respawn.x) < 8 && Math.abs(ny - respawn.y) < 8 &&
                !monstersRef.current.some((mm) => mm.id !== m.id && !mm.dead && mm.pos.x === nx && mm.pos.y === ny)) {
              m.pos.x = nx; m.pos.y = ny;
            }
          }
        }
      }

      // ===== SIMULATED ONLINE WORLD (makes it feel alive) =====
      // Move sim players randomly
      for (const sim of simPlayersRef.current) {
        if (now - sim.lastMove < 600) continue;
        sim.lastMove = now;
        const distToTarget = Math.hypot(sim.targetPos.x - sim.pos.x, sim.targetPos.y - sim.pos.y);
        if (distToTarget < 2) {
          // Pick new target
          sim.targetPos = { x: 10 + Math.floor(Math.random() * (MAP_WIDTH - 20)), y: 10 + Math.floor(Math.random() * (MAP_HEIGHT - 20)) };
        }
        const dx = Math.sign(sim.targetPos.x - sim.pos.x);
        const dy = Math.sign(sim.targetPos.y - sim.pos.y);
        const nx = sim.pos.x + (Math.abs(sim.targetPos.x - sim.pos.x) > Math.abs(sim.targetPos.y - sim.pos.y) ? dx : 0);
        const ny = sim.pos.y + (Math.abs(sim.targetPos.x - sim.pos.x) > Math.abs(sim.targetPos.y - sim.pos.y) ? 0 : dy);
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT && world[ny][nx].walkable) {
          sim.pos.x = nx; sim.pos.y = ny;
        }
      }

      // Random world chat (every ~25-40s)
      if (now - lastSimChatRef.current > 25000 + Math.random() * 15000) {
        lastSimChatRef.current = now;
        const line = getRandomChatLine();
        if (line) {
          addMessage(line.sender, line.text, '#cccccc', 'world');
        }
      }

      // World events: check for system-spawned events every 60s
      if (now - lastEventCheckRef.current > 60000) {
        lastEventCheckRef.current = now;
        const newEvent = maybeSpawnSystemEvent();
        if (newEvent) {
          addMessage('System', `🌍 WORLD EVENT: ${newEvent.icon} ${newEvent.name}! ${newEvent.description}`, '#ff6a00', 'system');
          addToast('warning', 'World Event!', newEvent.name, newEvent.icon, '#ff6a00');
          // Spawn event monsters if on this map
          const eventMap = newEvent.targetMap;
          if (eventMap === currentMapIdRef.current && newEvent.monsterTemplate) {
            const spawned: Monster[] = [];
            for (let i = 0; i < newEvent.monsterTemplate.count; i++) {
              const pos = { x: newEvent.targetPos!.x + Math.floor((Math.random() - 0.5) * 6), y: newEvent.targetPos!.y + Math.floor((Math.random() - 0.5) * 6) };
              spawned.push({
                id: `we_${newEvent.id}_${i}`, name: newEvent.monsterTemplate.name,
                pos, hp: newEvent.monsterTemplate.hp, maxHp: newEvent.monsterTemplate.hp,
                attack: newEvent.monsterTemplate.attack, defense: newEvent.monsterTemplate.defense,
                speed: 800, xp: newEvent.monsterTemplate.xp,
                color: newEvent.monsterTemplate.color, emoji: newEvent.monsterTemplate.emoji,
                size: newEvent.monsterTemplate.size || 1, level: newEvent.monsterTemplate.level,
                type: newEvent.type === 'worldboss' ? 'boss' : 'elite',
                lastMove: 0, lastAttack: 0, respawnPos: { ...pos }, dead: false, respawnAt: 0,
                loot: [{ name: 'Gold', icon: '🪙', chance: 1, value: newEvent.monsterTemplate.level * 50 }],
              });
            }
            monstersRef.current = [...monstersRef.current, ...spawned];
          }
        }
      }

      } // end local-only simulation

      // Update projectiles & particles
      projectilesRef.current = projectilesRef.current.filter((pp) => now - pp.startTime < pp.duration);
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => now - ft.startTime < ft.duration);
      particlesRef.current = particlesRef.current.filter((pp) => now - pp.startTime < pp.duration);
      for (const pp of particlesRef.current) {
        const t = (now - pp.startTime) / pp.duration;
        pp.pos.x += pp.vel.x * 0.05;
        pp.pos.y += pp.vel.y * 0.05;
        pp.life = 1 - t;
      }

      // Camera
      cameraRef.current.x = Math.max(0, Math.min(MAP_WIDTH - VIEW_W, p.pos.x - Math.floor(VIEW_W / 2)));
      cameraRef.current.y = Math.max(0, Math.min(MAP_HEIGHT - VIEW_H, p.pos.y - Math.floor(VIEW_H / 2)));

      // Broadcast player position to network every ~150ms (throttled)
      if (net.mode === 'local' && now - lastBroadcastRef.current > 150) {
        lastBroadcastRef.current = now;
        const voc = VOCATIONS[p.vocation];
        const mount = serverSync.isActive() ? p.mounts?.catalog?.find((m) => m.id === p.mountId) : (p.mountId ? MOUNTS.find((m) => m.id === p.mountId) : null);
        broadcastPlayer({
          id: net.id,
          name: p.name,
          vocation: p.vocation,
          level: p.level,
          x: p.pos.x,
          y: p.pos.y,
          direction: p.direction,
          color: voc?.color || '#8b2e2e',
          icon: voc?.icon || '⚔',
          hp: p.hp,
          maxHp: p.maxHp,
          lastSeen: now,
          mapId: currentMapIdRef.current,
          mounted: p.mounted,
          mountIcon: mount?.icon,
        });
      }

      render(now);
      // Keep the canvas at display refresh rate without forcing a full React
      // reconciliation every frame. 10fps is ample for cooldown/HUD text.
      if (now - lastHudTickRef.current >= 100) {
        lastHudTickRef.current = now;
        setHudTick((t) => (t + 1) % 100000);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const render = (now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cam = cameraRef.current;
    const p = playerRef.current;
    const world = worldRef.current;
    ctx.imageSmoothingEnabled = false;

    // Screen shake
    const shake = screenShakeRef.current;
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    if (shake > 0) screenShakeRef.current = Math.max(0, shake - 0.5);

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.fillStyle = '#000';
    ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);

    // Tiles
    for (let y = 0; y < VIEW_H + 1; y++) {
      for (let x = 0; x < VIEW_W + 1; x++) {
        const tx = cam.x + x, ty = cam.y + y;
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;
        drawTile(ctx, world[ty][tx], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE);
      }
    }

    // Biome ground tint (recolor grass tiles for snow/swamp/desert/shadow)
    const biome = MAPS[currentMapIdRef.current]?.biome;
    if (biome && biome !== 'plains') {
      const tint: Record<string, string> = {
        snow: 'rgba(220,232,240,0.55)',
        swamp: 'rgba(60,70,40,0.4)',
        desert: 'rgba(220,195,140,0.35)',
        shadow: 'rgba(15,12,25,0.55)',
      };
      ctx.fillStyle = tint[biome];
      for (let y = 0; y < VIEW_H + 1; y++) {
        for (let x = 0; x < VIEW_W + 1; x++) {
          const tx = cam.x + x, ty = cam.y + y;
          if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT && world[ty][tx].type === 'grass') {
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    // Lava glow
    ctx.globalCompositeOperation = 'screen';
    for (let y = 0; y < VIEW_H + 1; y++) {
      for (let x = 0; x < VIEW_W + 1; x++) {
        const tx = cam.x + x, ty = cam.y + y;
        if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT && world[ty][tx].type === 'lava') {
          const pulse = Math.sin(now / 300 + x + y) * 0.3 + 0.5;
          ctx.fillStyle = `rgba(255,100,0,${pulse * 0.3})`;
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';

    // Buildings (rendered after tiles, behind entities)
    for (const b of buildingsRef.current) {
      const sx = (b.x - cam.x) * TILE_SIZE;
      const sy = (b.y - cam.y) * TILE_SIZE;
      if (sx > canvas.width || sy > canvas.height || sx + b.w * TILE_SIZE < 0 || sy + b.h * TILE_SIZE < 0) continue;
      drawBuilding(ctx, sx, sy, b, TILE_SIZE, now);
    }

    // Houses and decoration are presentation-only projections of global server state.
    if (serverSync.isActive()) drawHousing(ctx, p.housing, cam, TILE_SIZE, now);

    // NPCs
    for (const n of npcsRef.current) {
      const sx = (n.pos.x - cam.x) * TILE_SIZE;
      const sy = (n.pos.y - cam.y) * TILE_SIZE;
      if (sx < -TILE_SIZE || sx > canvas.width || sy < -TILE_SIZE || sy > canvas.height) continue;
      drawNPC(ctx, sx, sy, TILE_SIZE, n, now);
    }

    // Portals (map transitions)
    const mapData = MAPS[currentMapIdRef.current];
    if (mapData) {
      for (const portal of mapData.portals) {
        const sx = (portal.pos.x - cam.x) * TILE_SIZE;
        const sy = (portal.pos.y - cam.y) * TILE_SIZE;
        if (sx < -TILE_SIZE || sx > canvas.width || sy < -TILE_SIZE || sy > canvas.height) continue;
        const pulse = 0.5 + Math.sin(now / 300) * 0.3;
        // Locked portal is red, accessible is purple
        const targetMap = MAPS[portal.targetMap];
        const locked = targetMap?.levelRequired && p.level < targetMap.levelRequired;
        const grad = ctx.createRadialGradient(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, 2, sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, TILE_SIZE / 2);
        if (locked) {
          grad.addColorStop(0, `rgba(255,60,60,${pulse})`);
          grad.addColorStop(0.7, 'rgba(140,20,20,0.4)');
        } else {
          grad.addColorStop(0, `rgba(155,89,255,${pulse})`);
          grad.addColorStop(0.7, 'rgba(100,40,180,0.4)');
        }
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${TILE_SIZE * 0.6}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(locked ? '🔒' : '🌀', sx + TILE_SIZE / 2, sy + TILE_SIZE / 2);
        // Locked label
        if (locked) {
          ctx.font = 'bold 9px system-ui';
          ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(0,0,0,0.9)';
          ctx.lineWidth = 3;
          const lbl = `Lv ${targetMap?.levelRequired}+`;
          ctx.strokeText(lbl, sx + TILE_SIZE / 2, sy - 2);
          ctx.fillStyle = '#ff6060';
          ctx.fillText(lbl, sx + TILE_SIZE / 2, sy - 2);
        }
      }
    }

    // Ground loot is extracted from the orchestrator and supports authoritative rarity beams.
    drawGroundLootPresentation(ctx, serverSync.isActive() ? serverGroundRef.current : groundItemsRef.current, cam, TILE_SIZE, now);

    // Monsters — use server data in authoritative mode, local data otherwise
    const renderMonsters = serverSync.isActive() ? serverMonstersRef.current : monstersRef.current.filter(m => !m.dead);
    for (const m of renderMonsters) {
      const mx = m.pos ? m.pos.x : m.x;
      const my = m.pos ? m.pos.y : m.y;
      const sx = (mx - cam.x) * TILE_SIZE;
      const sy = (my - cam.y) * TILE_SIZE;
      if (sx < -TILE_SIZE || sx > canvas.width || sy < -TILE_SIZE || sy > canvas.height) continue;
      if (m.type === 'boss' || m.type === 'elite') {
        const accent = m.type === 'boss' ? '#ffd87b' : '#b88aff';
        const aura = 0.24 + (Math.sin(now / (m.type === 'boss' ? 220 : 320)) + 1) * 0.09;
        ctx.save();
        ctx.globalAlpha = aura;
        ctx.strokeStyle = accent;
        ctx.lineWidth = m.type === 'boss' ? 3 : 2;
        ctx.beginPath();
        ctx.arc(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, TILE_SIZE * (m.type === 'boss' ? 0.58 : 0.48), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      drawMonster(ctx, sx, sy, TILE_SIZE, {
        name: m.name, hp: m.hp, maxHp: m.maxHp,
        color: m.color, emoji: m.emoji, msSize: m.size,
        level: m.level, type: m.type,
      }, now);
    }

    // Player
    const px = (p.pos.x - cam.x) * TILE_SIZE;
    const py = (p.pos.y - cam.y) * TILE_SIZE;
    const vocation = VOCATIONS[p.vocation];
    const mount = p.mountId ? MOUNTS.find((m) => m.id === p.mountId) : null;
    const isInvisible = p.buffs.some((b) => b.type === 'invisible');
    if (isInvisible) ctx.globalAlpha = 0.4;
    drawPlayer(ctx, px, py, TILE_SIZE, p.direction, p.name, p.hp, p.maxHp, now,
      vocation?.color ?? '#8b2e2e', p.mounted, mount?.icon, p.appearance?.public, mount);
    ctx.globalAlpha = 1;

    // Draw other players — authoritative server data takes priority
    if (serverSync.isActive()) {
      // AUTHORITATIVE: draw server-provided nearby players
      for (const op of serverPlayersRef.current) {
        const sx = (op.x - cam.x) * TILE_SIZE;
        const sy = (op.y - cam.y) * TILE_SIZE;
        if (sx < -TILE_SIZE || sx > canvas.width || sy < -TILE_SIZE || sy > canvas.height) continue;
        const voc = VOCATIONS[op.vocation];
        drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction || 'down', `${op.name} [Lv${op.level}]`, op.hp, op.maxHp, now, voc?.color || '#8b2e2e', op.mounted, op.mount?.icon, op.appearance, op.mount);
      }
    } else {
      // LOCAL/RELAY: draw BroadcastChannel players or simulated bots
      const hasRealPlayers = onlinePlayersRef.current.size > 0;
      if (hasRealPlayers) {
        for (const op of onlinePlayersRef.current.values()) {
          if (now - op.lastSeen > 10000) { onlinePlayersRef.current.delete(op.id); continue; }
          const sx = (op.x - cam.x) * TILE_SIZE;
          const sy = (op.y - cam.y) * TILE_SIZE;
          if (sx < -TILE_SIZE || sx > canvas.width || sy < -TILE_SIZE || sy > canvas.height) continue;
          drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction, `${op.name} [${op.level}]`, op.hp, op.maxHp, now, op.color, op.mounted, op.mountIcon);
        }
      } else {
        for (const sim of simPlayersRef.current) {
          const sx = (sim.pos.x - cam.x) * TILE_SIZE;
          const sy = (sim.pos.y - cam.y) * TILE_SIZE;
          if (sx < -TILE_SIZE || sx > canvas.width || sy < -TILE_SIZE || sy > canvas.height) continue;
          drawPlayer(ctx, sx, sy, TILE_SIZE, 'down', `${sim.name} [${sim.level}]`, 100, 100, now, sim.color, false, undefined);
        }
      }
    }

    // Draw active pet (server-owned online, local state in Quick Play).
    if (serverSync.isActive() && officialState?.state?.pets?.active) {
      const petData = officialState?.catalogs?.pets?.find((pet: any) => pet.id === officialState.state.pets.active);
      if (petData) {
        const petX = (p.pos.x + 1 - cam.x) * TILE_SIZE;
        const petY = (p.pos.y - cam.y) * TILE_SIZE;
        drawMonster(ctx, petX, petY, TILE_SIZE, { name: petData.name, hp: 1, maxHp: 1, color: petData.color, emoji: petData.icon, msSize: 0.7 }, now);
      }
    } else if (petStateRef.current) {
      const pet = petStateRef.current;
      const petData = PETS.find((pd) => pd.id === pet.petId);
      if (petData) {
        const petX = (pet.pos.x - cam.x) * TILE_SIZE;
        const petY = (pet.pos.y - cam.y) * TILE_SIZE;
        if (petX > -TILE_SIZE && petX < canvas.width && petY > -TILE_SIZE && petY < canvas.height) {
          drawMonster(ctx, petX, petY, TILE_SIZE, {
            name: petData.name, hp: pet.hp, maxHp: pet.maxHp,
            color: petData.color, emoji: petData.icon, msSize: 0.7,
          }, now);
        }
      }
    }

    // Target highlight — use the same authoritative/local collection used to render monsters.
    if (p.targetId) {
      const t = renderMonsters.find((monster: any) => monster.id === p.targetId);
      if (t) {
        const targetX = t.pos ? t.pos.x : t.x;
        const targetY = t.pos ? t.pos.y : t.y;
        const tx = (targetX - cam.x) * TILE_SIZE;
        const ty = (targetY - cam.y) * TILE_SIZE;
        const boss = t.type === 'boss';
        const elite = t.type === 'elite';
        const accent = boss ? '#ffd87b' : elite ? '#b88aff' : '#ff6060';
        const pulse = 0.62 + Math.sin(now / 140) * 0.22;
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = boss ? 3 : 2;
        ctx.beginPath();
        ctx.ellipse(tx + TILE_SIZE / 2, ty + TILE_SIZE * 0.84, TILE_SIZE * (boss ? 0.52 : 0.43), TILE_SIZE * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.22 + pulse * 0.16;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.ellipse(tx + TILE_SIZE / 2, ty + TILE_SIZE * 0.84, TILE_SIZE * (boss ? 0.48 : 0.39), TILE_SIZE * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Projectiles
    for (const pr of projectilesRef.current) {
      const t = (now - pr.startTime) / pr.duration;
      const cx = (pr.from.x + (pr.to.x - pr.from.x) * t - cam.x + 0.5) * TILE_SIZE;
      const cy = (pr.from.y + (pr.to.y - pr.from.y) * t - cam.y + 0.5) * TILE_SIZE;
      if (pr.type === 'aoe') {
        const radius = t * TILE_SIZE * 2.5;
        ctx.fillStyle = pr.color + '40';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pr.color;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
        grad.addColorStop(0, pr.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fill();
        if (pr.emoji) {
          ctx.font = '16px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pr.emoji, cx, cy);
        } else {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Particles
    for (const pp of particlesRef.current) {
      const sx = (pp.pos.x - cam.x + 0.5) * TILE_SIZE;
      const sy = (pp.pos.y - cam.y + 0.5) * TILE_SIZE;
      ctx.globalAlpha = pp.life;
      ctx.fillStyle = pp.color;
      ctx.beginPath();
      ctx.arc(sx, sy, pp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Floating texts
    for (const ft of floatingTextsRef.current) {
      const t = (now - ft.startTime) / ft.duration;
      const sx = (ft.pos.x - cam.x + 0.5) * TILE_SIZE;
      const sy = (ft.pos.y - cam.y) * TILE_SIZE - t * 30;
      ctx.font = ft.big ? 'bold 18px system-ui' : 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = ft.big ? 4 : 3;
      ctx.globalAlpha = 1 - t;
      ctx.strokeText(ft.text, sx, sy);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sx, sy);
      ctx.globalAlpha = 1;
    }

    // Mouse hover
    const mt = mouseTileRef.current;
    if (mt) {
      const hx = (mt.x - cam.x) * TILE_SIZE;
      const hy = (mt.y - cam.y) * TILE_SIZE;
      if (hx >= 0 && hy >= 0 && hx < canvas.width && hy < canvas.height) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(hx + 0.5, hy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }

      // Authoritative day/night overlay. Admin override remains offline/debug presentation only.
      const worldClock = worldClockRef.current;
      const nightAlpha = legacyOverrideDarkness(dayTimeOverrideRef.current, worldClock.darkness);
      if (nightAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(10,10,40,${nightAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    drawWorldAtmosphere(
      ctx,
      canvas,
      MAPS[currentMapIdRef.current]?.biome || 'plains',
      nightAlpha,
      p.pos,
      cam,
      TILE_SIZE,
      now,
    );

    ctx.restore();
  };

  const localAvailableQuests = getAvailableQuests(player.quests, player.level, player.activeQuests.map((a) => a.questId));
  const questCatalog = serverSync.isActive() && serverQuestCatalog.length > 0 ? serverQuestCatalog : QUESTS;
  const activeQuestIds = new Set(player.activeQuests.map((quest) => quest.questId));
  const completedQuestIds = new Set(player.quests);
  const authoritativeAvailableQuests = questCatalog.filter((quest) =>
    player.level >= quest.levelRequired
    && !activeQuestIds.has(quest.id)
    && !completedQuestIds.has(quest.id)
    && (quest.requires || []).every((required) => completedQuestIds.has(required))
  );
  const availableQuests = serverSync.isActive() ? authoritativeAvailableQuests : localAvailableQuests;

  const quickActions: Record<string, { icon: string; label: string; hotkey: string; onClick: () => void }> = {
    adventure: { icon: '⚔', label: 'Hunts', hotkey: 'H', onClick: () => setShowAdventure((v) => !v) },
    quests: { icon: '📜', label: 'Quests', hotkey: 'Q', onClick: () => setShowQuestLog((v) => !v) },
    char: { icon: '👤', label: 'Char', hotkey: 'C', onClick: () => setShowCharacter((v) => !v) },
    talents: { icon: '🌟', label: 'Talents', hotkey: 'T', onClick: () => setShowTalents((v) => !v) },
    bestiary: { icon: '📖', label: 'Bestiary', hotkey: 'B', onClick: () => onlineAccount ? openOfficial('progress') : setShowBestiary((v) => !v) },
    dps: { icon: '📊', label: 'DPS', hotkey: 'D', onClick: () => onlineAccount ? openOfficial('progress') : setShowDPS((v) => !v) },
    dungeon: { icon: '🌀', label: 'Dungeon', hotkey: '', onClick: () => onlineAccount ? openOfficial('dungeon') : setShowDungeon(true) },
    pet: { icon: '🐾', label: 'Pet', hotkey: '', onClick: () => onlineAccount ? openOfficial('pets') : setShowPetShop(true) },
    mystery: { icon: '✦', label: 'Mystery', hotkey: '', onClick: () => onlineAccount ? openOfficial('library') : setShowMysteryBook(true) },
    depot: { icon: '🗄', label: 'Depot', hotkey: '', onClick: () => onlineAccount ? openOfficial('depot') : setShowDepot(true) },
    books: { icon: '📚', label: 'Books', hotkey: '', onClick: () => onlineAccount ? openOfficial('library') : setShowBooks(true) },
    auction: { icon: '🏛', label: 'AH', hotkey: '', onClick: () => onlineAccount ? openOfficial('auction') : setShowAuction(true) },
    coins: { icon: '💎', label: 'Coins', hotkey: '', onClick: () => onlineAccount ? openOfficial('coins') : setShowCoinShop(true) },
    world: { icon: '🌍', label: 'World', hotkey: '', onClick: () => onlineAccount ? openOfficial('world') : setShowWorldEvents(true) },
    mail: { icon: '📮', label: 'Mail', hotkey: '', onClick: () => onlineAccount ? openOfficial('mail') : setShowMail(true) },
    social: { icon: '👥', label: 'Social', hotkey: '', onClick: () => onlineAccount && setShowSocialHub(true) },
    inv: { icon: '📦', label: 'Inv', hotkey: 'I', onClick: () => setShowInventory((v) => !v) },
  };
  const orderedQuickActions = uiLayout.panelOrder.map((id) => ({ id, action: quickActions[id] })).filter((entry) => Boolean(entry.action));
  const activeTarget = resolveCombatTarget(
    player.targetId,
    serverSync.isActive(),
    serverMonstersRef.current,
    monstersRef.current,
  );

  return (
    <div className="w-screen h-screen flex flex-col bg-[#05070c] text-slate-100 overflow-hidden select-none">
      {/* Top bar */}
      <div className="moria-panel relative z-40 flex min-h-12 shrink-0 items-center gap-3 rounded-none border-x-0 border-t-0 px-3 py-1.5 text-xs">
        <div className="flex shrink-0 items-center gap-3 pr-2">
          <span className="moria-title text-base font-black tracking-[0.16em] text-amber-100">MOR'IA</span>
          <span className="hidden text-slate-500 md:inline">{VOCATIONS[player.vocation]?.name} · Lv {player.level}</span>
          <span className="moria-chip rounded-lg px-2 py-1 text-[9px] font-bold tracking-wider" style={{ color: MAPS[currentMapId]?.biome === 'snow' ? '#9bd4ff' : MAPS[currentMapId]?.biome === 'shadow' ? '#b398ff' : '#71d8ac', borderColor: 'currentColor' }}>◆ {MAPS[currentMapId]?.name}</span>
        </div>
        <div className="moria-scrollbar flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto pb-0.5">
          {orderedQuickActions.map(({ id, action }) => (
            <TopButton key={id} icon={action.icon} label={action.label} hotkey={action.hotkey} onClick={action.onClick} />
          ))}
          {onlineAccount && <TopButton icon="🌐" label="Hub" hotkey="O" onClick={() => openOfficial('progress')} />}
          <TopButton icon="🏠" label="Life" hotkey="L" onClick={() => serverSync.isActive() ? setShowLifeStyle((v) => !v) : addMessage('System', 'Life & Style requires the authoritative alpha server.', '#ffb86b', 'system')} />
          <TopButton icon="⚙" label="UI" hotkey="" onClick={() => setShowUIEditor(true)} />
          <TopButton icon="🐎" label="Mount" hotkey="SPACE" onClick={toggleMount} />
          {allowLocalAdmin && (
            <button
              onClick={() => setShowAdmin((s) => !s)}
              className="moria-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-violet-200"
              title="Offline Debug Admin (Ctrl+Shift+A)"
            >
              <span>⚡</span><span className="hidden lg:inline">Debug</span>
            </button>
          )}
          <button
            onClick={() => { const m = !muted; setMuted(m); audio.setMuted(m); if (!m) audio.startMusic(MAPS[currentMapId]?.biome || 'plains'); }}
            className={`moria-button shrink-0 rounded-lg px-2 py-1 text-[10px] ${muted ? 'text-slate-600' : 'text-sky-200'}`}
            title={muted ? 'Unmute' : 'Mute audio'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => setShowConnect(true)}
            className={`moria-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] ${netMode === 'online' ? 'text-emerald-200' : netMode === 'local' ? 'text-amber-200' : 'text-slate-500'}`}
            title="Connect to Mor'ia server for real online play"
          >
            {netMode === 'online' ? '🟢' : netMode === 'local' ? '🟡' : '⚫'} <span className="hidden lg:inline">{onlineCount} online</span>
          </button>
          <button
            onClick={onLogout}
            className="moria-button shrink-0 rounded-lg px-2 py-1 text-[10px] text-rose-200"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#03060a]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(70,100,140,0.10),transparent_44%),linear-gradient(180deg,rgba(8,12,19,0.2),rgba(0,0,0,0.72))]" />
          <div className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-amber-200/20 to-transparent" />
          <canvas
            ref={canvasRef}
            width={VIEW_W * TILE_SIZE}
            height={VIEW_H * TILE_SIZE}
            onMouseMove={handleCanvasMouseMove}
            onClick={handleCanvasClick}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              imageRendering: 'pixelated',
              cursor: 'crosshair',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
              borderRadius: '16px',
              background: '#05080d',
              boxShadow: '0 28px 90px rgba(0,0,0,0.58), 0 0 0 1px rgba(164,184,216,0.10), 0 0 55px rgba(110,168,255,0.05)',
            }}
          />
          <RegionBanner key={currentMapId} map={MAPS[currentMapId] || MAPS.eldoria} weather={weather} />

          {/* Zoom controls */}
          <div className="moria-panel absolute bottom-4 right-4 z-20 flex flex-col gap-1 rounded-xl p-1.5">
            <button onClick={() => { const nz = Math.min(2.5, zoomRef.current + 0.25); zoomRef.current = nz; setZoom(nz); }} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-base font-black">+</button>
            <div className="text-center font-mono text-[8px] text-slate-400">{Math.round(zoom * 100)}%</div>
            <button onClick={() => { const nz = Math.max(0.6, zoomRef.current - 0.25); zoomRef.current = nz; setZoom(nz); }} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-base font-black">−</button>
            <button onClick={() => { zoomRef.current = 1; setZoom(1); }} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-xs" title="Reset zoom">⊙</button>
          </div>

          {/* Combat target presentation is isolated from the game orchestrator. */}
          <CombatTargetFrame target={activeTarget} playerLevel={player.level} playerPos={player.pos} />

          {/* Active Hunt Tracker */}
          {serverSync.isActive() && adventureState?.active && (
            <div className="moria-panel absolute left-3 top-[132px] z-10 w-[245px] rounded-2xl border border-sky-300/25 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="moria-eyebrow text-[8px] text-sky-200/70">⚔ ACTIVE HUNT</div>
                {adventureState.combo.count > 1 && <div className="text-[9px] font-black text-amber-300">⚡ {adventureState.combo.count}x · +{Math.round((adventureState.combo.multiplier - 1) * 100)}% XP</div>}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl">{adventureState.active.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-black text-slate-100">{adventureState.active.title}</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/50">
                    <div className={`h-full ${adventureState.active.ready ? 'bg-amber-300' : 'bg-sky-400'}`} style={{ width: `${Math.min(100, (adventureState.active.progress / Math.max(1, adventureState.active.count)) * 100)}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-slate-400"><span>{adventureState.active.targetLabel}</span><span>{adventureState.active.progress}/{adventureState.active.count}</span></div>
                </div>
              </div>
              {adventureState.active.ready && <button onClick={() => setShowAdventure(true)} className="moria-button-primary mt-2 w-full rounded-lg py-1 text-[9px] font-black">🏆 REWARD READY</button>}
            </div>
          )}

          <WorldClockBadge clock={worldClockRef.current} />

          {/* Active Quest Tracker is extracted to keep GameScreen an orchestrator. */}
          <ActiveQuestTracker activeQuests={player.activeQuests} questCatalog={questCatalog} />

          {/* Overlays */}
          {showInventory && (
            <Inventory
              items={inventory}
              onClose={() => setShowInventory(false)}
              onUse={(item) => {
                if (serverSync.isActive()) {
                  if (item.name === 'Health Potion') usePotion('hp');
                  else if (item.name === 'Mana Potion') usePotion('mp');
                  else if (item.name === 'Greater Health Potion') usePotion('hpg');
                } else {
                  if (item.id === 'hp1') usePotion('hp');
                  else if (item.id === 'mp1') usePotion('mp');
                  else if (item.id === 'hpg') usePotion('hpg');
                }
              }}
              onEquip={equipItem}
              shopItems={activeDialog?.shop}
              onBuy={buyItem}
              showShop={!!activeDialog?.shop}
              shopName={activeDialog?.name}
              onCraft={(name, icon, value, desc) => craftItem(name, icon, value, desc)}
              playerLevel={player.level}
              onSocketGem={(itemId, gemId) => socketGem(itemId, gemId)}
              playerName={player.name}
              onDropItem={dropItemOnGround}
            />
          )}
          {showCharacter && (
            <CharacterPanel
              player={player}
              official={serverSync.isActive() ? officialState : null}
              onClose={() => setShowCharacter(false)}
              onUnequip={unequipItem}
            />
          )}
          {showTalents && (
            <TalentTree
              player={player}
              setPlayer={(p) => setPlayer(p)}
              onClose={() => setShowTalents(false)}
            />
          )}
          {showBestiary && (
            <Bestiary player={player} onClose={() => setShowBestiary(false)} />
          )}
          {showDPS && !serverSync.isActive() && (
            <DPSMeter onClose={() => setShowDPS(false)} />
          )}
          {showDungeon && (
            <DungeonPortal player={player} onClose={() => setShowDungeon(false)} onEnterDungeon={enterDungeon} highestWave={highestDungeonWave} />
          )}
          {showMysteryBook && (
            <MysteryQuestBook player={player} onClose={() => setShowMysteryBook(false)} onComplete={handleMysteryComplete} />
          )}
          {showDepot && (
            <Depot player={player} inventory={inventory} setInventory={setInventory} onClose={() => setShowDepot(false)} />
          )}
          {showBooks && (
            <BookLibrary player={player} onClose={() => setShowBooks(false)} />
          )}
          {showAuction && (
            <AuctionHouse player={player} inventory={inventory} setInventory={setInventory} setPlayer={setPlayer} onClose={() => setShowAuction(false)} addMessage={addMessage} />
          )}
          {showCoinShop && (
            <CoinShop
              player={player}
              onClose={() => setShowCoinShop(false)}
              addMessage={addMessage}
              onPurchase={(item) => {
                if (item.effect !== 'allblessings') return false;
                const p = playerRef.current;
                grantAllBlessings(p);
                setPlayer({ ...p });
                addToast('loot', 'Blessings Granted', 'All five blessings and AOL are active.', item.icon, '#f4e04d');
                return true;
              }}
            />
          )}
          {showWorldEvents && (
            <WorldEvents player={player} onClose={() => setShowWorldEvents(false)} onContribute={(gold: number, xp: number) => {
              const p = playerRef.current; p.gold += gold; p.xp += xp; setPlayer({ ...p });
              addMessage('System', `🌍 World event reward: +${gold}g, +${xp} XP`, '#ff6a00', 'system');
            }} />
          )}
          {allowLocalAdmin && showWorldEventCreator && (
            <WorldEventCreator onClose={() => setShowWorldEventCreator(false)} />
          )}
          {showConnect && (
            <div className="moria-overlay absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
                 onClick={() => setShowConnect(false)}>
              <div onClick={(e) => e.stopPropagation()}
                   className="moria-panel w-full max-w-md rounded-3xl border p-5 sm:p-6"
                   style={{ borderColor: netMode === 'online' ? 'rgba(46,204,113,.35)' : 'rgba(125,211,252,.25)', boxShadow: `0 30px 90px rgba(0,0,0,.6), 0 0 45px ${netMode === 'online' ? 'rgba(46,204,113,.10)' : 'rgba(56,189,248,.08)'}` }}>
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
                      style={{ backgroundImage: `linear-gradient(180deg, ${netMode === 'online' ? '#2ecc71' : '#9bd4ff'} 0%, #4a90e2 100%)` }}>🔌 CONNECT TO SERVER</h2>
                  <div className="text-sm mt-2">
                    Status: <span style={{ color: netMode === 'online' ? '#2ecc71' : netMode === 'local' ? '#f4e04d' : '#888' }}>{netMode === 'online' ? '🟢 ONLINE' : netMode === 'local' ? '🟡 LOCAL (same machine)' : '⚫ OFFLINE'}</span>
                  </div>
                </div>
                <div className="text-xs text-blue-200/60 mb-3 space-y-1">
                  <p>📍 <b>Local</b> (already active): other browser tabs on this machine see each other in real time.</p>
                  <p>🌐 <b>Internet</b>: connect to a Mor'ia server to play with people worldwide!</p>
                </div>
                <label className="text-xs text-blue-200/70 block mb-1">Server URL (ws:// or wss://):</label>
                <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doConnectServer()}
                       placeholder={net.detectServerUrl() || 'ws://localhost:3000/ws'}
                       className="moria-input mb-2 w-full rounded-xl px-3 py-2 text-sm text-sky-100" />
                <button onClick={doConnectServer}
                        className="moria-button-primary mb-2 w-full rounded-xl py-2.5 text-sm font-bold">
                  🔌 Connect
                </button>
                {netStatus && <div className="text-center text-xs text-blue-200/70 mb-2">{netStatus}</div>}
                <div className="text-[10px] text-blue-200/40 border-t border-blue-900/30 pt-2 mt-2">
                  <b>To run your own server:</b> Open the <code className="text-blue-300">server/</code> folder, run <code className="text-blue-300">npm install && npm start</code>.<br/>
                  For internet play, tunnel with <code className="text-blue-300">npm run tunnel</code> and paste the URL here.
                </div>
                <button onClick={() => setShowConnect(false)} className="moria-button mt-2 w-full rounded-lg py-1.5 text-xs text-sky-200">Close</button>
              </div>
            </div>
          )}
          {showMail && (
            <MailBox
              player={player}
              inventory={inventory}
              setInventory={setInventory}
              onClose={() => setShowMail(false)}
              addMessage={addMessage}
              onClaimGold={(amount) => {
                const p = playerRef.current;
                p.gold += Math.max(0, Math.floor(amount));
                p.stats.goldEarned += Math.max(0, Math.floor(amount));
                setPlayer({ ...p });
              }}
            />
          )}
          {showUIEditor && (
            <UILayoutEditor player={player} layout={uiLayout} onLayoutChange={setUILayoutState} onClose={() => setShowUIEditor(false)} />
          )}
          {allowLocalAdmin && showQuestCreator && (
            <QuestCreator onClose={() => setShowQuestCreator(false)} />
          )}
          {showPetShop && (
            <PetShop player={player} onClose={() => setShowPetShop(false)} onBuyPet={(petId, price) => {
              const p = playerRef.current;
              const pet = PETS.find((pd) => pd.id === petId);
              if (!pet) { addMessage('System', 'Unknown companion.', '#ff9090', 'system'); return false; }
              if (p.gold < price) { addMessage('System', 'Not enough gold.', '#ff9090', 'system'); return false; }
              if (!buyPet(p.name, petId)) { addMessage('System', 'Companion already owned.', '#ff9090', 'system'); return false; }
              p.gold -= price;
              addMessage('System', `🐾 Tamed ${pet.icon} ${pet.name}!`, pet.color, 'system');
              addToast('info', 'New Companion!', `${pet.name} joins you!`, pet.icon, pet.color);
              setPlayer({ ...p });
              return true;
            }} />
          )}

          {/* Dungeon indicator */}
          {inDungeon && (
            <div className="moria-panel pointer-events-none absolute left-1/2 top-14 z-10 -translate-x-1/2 animate-pulse rounded-full border border-violet-300/40 px-4 py-1.5"
                 style={{ boxShadow: '0 0 28px rgba(168,85,247,.18)' }}>
              <span className="text-purple-200 font-bold text-sm tracking-wider">🌀 DUNGEON · WAVE {dungeonWave}/{dungeonTotalWavesRef.current}</span>
            </div>
          )}

          {/* Food Shop */}
          {showFoodShop && (
            <div className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"
                 onClick={() => setShowFoodShop(false)}>
              <div onClick={(e) => e.stopPropagation()}
                   className="moria-panel w-full max-w-lg rounded-3xl border border-pink-300/20 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold tracking-widest text-amber-100">🍽 FOOD & DRINKS</h2>
                  <button onClick={() => setShowFoodShop(false)} className="text-amber-200/60 hover:text-amber-100 text-xl">✕</button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {FOOD_ITEMS.map((food) => {
                    const canBuy = player.level >= food.levelRequired && player.gold >= food.cost;
                    return (
                      <button key={food.id} onClick={() => {
                        if (!canBuy) return;
                        const p = playerRef.current;
                        p.gold -= food.cost;
                        applyFoodBuff(p, food);
                        addMessage('System', `🍽 Ate ${food.icon} ${food.name}: ${food.description}`, '#ff9bcc', 'system');
                        addToast('info', 'Food Buff!', food.description, food.icon, '#ff9bcc');
                        setPlayer({ ...p });
                        setShowFoodShop(false);
                      }} disabled={!canBuy}
                        className={`p-2 rounded border text-left transition-all ${canBuy ? 'border-pink-700/50 bg-pink-900/20 hover:bg-pink-900/40' : 'border-gray-700/40 bg-black/40 opacity-40'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{food.icon}</span>
                          <div className="flex-1">
                            <div className="text-amber-100 font-bold text-xs">{food.name}</div>
                            <div className="text-amber-200/70 text-[10px]">{food.description}</div>
                            <div className="text-amber-400 text-[10px]">{food.cost} 🪙 {food.levelRequired > player.level ? `(Lv ${food.levelRequired}+)` : ''}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Horizontal Action Bar (spells center bottom) */}
          <ActionBar
            player={player}
            spells={spells}
            potions={{
              hp: inventory.find((i) => serverSync.isActive() ? i.name === 'Health Potion' : i.id === 'hp1')?.quantity ?? 0,
              mp: inventory.find((i) => serverSync.isActive() ? i.name === 'Mana Potion' : i.id === 'mp1')?.quantity ?? 0,
              hpg: inventory.find((i) => serverSync.isActive() ? i.name === 'Greater Health Potion' : i.id === 'hpg')?.quantity ?? 0,
            }}
            onCastSpell={castSpell}
            onUsePotion={usePotion}
          />

          {/* Skull / PvP indicator */}
          {(() => {
            const onlinePvp = serverSync.isActive() ? officialState?.state?.pvp : null;
            const skullType = (onlinePvp?.skull || getSkullState(player.name).type) as keyof typeof SKULLS;
            const info = SKULLS[skullType] || SKULLS.none;
            const enabled = onlinePvp ? Boolean(onlinePvp.enabled) : pvpEnabled;
            return (
              <div className="absolute top-14 right-2 flex flex-col items-end gap-1 z-10 pointer-events-auto">
                <button
                  onClick={() => { if (serverSync.isActive()) serverSync.sendOfficial('pvp_toggle'); else { const en = togglePvp(player.name); setPvpEnabled(en); addMessage('System', `PvP ${en ? 'ENABLED ⚔' : 'disabled'}.`, en ? '#ff6060' : '#9bd4ff', 'system'); } }}
                  className={`px-2 py-1 rounded text-[10px] font-bold border ${enabled ? 'bg-red-900/50 text-red-300 border-red-600' : 'bg-black/50 text-gray-400 border-gray-700'}`}>
                  ⚔ PvP {enabled ? 'ON' : 'OFF'}
                </button>
                {skullType !== 'none' && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded border" style={{ background: info.color + '30', borderColor: info.color }}>
                    <span style={{ color: info.color }}>{info.icon}</span>
                    <span className="text-[10px] font-bold" style={{ color: info.color }}>{info.name}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Chat - WoW style bottom-left */}
          <Chat messages={messages} social={socialState} onSendMessage={(text, channel) => {
            if (serverSync.isActive()) broadcastChat(player.name, text, '#ffffff', channel);
            else { addMessage(player.name, text, '#ffffff', 'world'); broadcastChat(player.name, text, '#ffffff', 'world'); }
          }} />

          {showLifeStyle && serverSync.isActive() && (
            <LifeStylePanel
              player={player}
              onTask={(action, payload) => serverSync.sendTask(action, payload)}
              onHousing={(action, payload) => serverSync.sendHousing(action, payload)}
              onAppearance={(action, payload) => serverSync.sendAppearance(action, payload)}
              onMount={(action, payload) => serverSync.sendMount(action, payload)}
              onClose={() => setShowLifeStyle(false)}
            />
          )}

          {showSocialHub && serverSync.isActive() && socialState && (
            <SocialHub player={player} inventory={inventory} social={socialState} onAction={(action, payload) => serverSync.sendSocial(action, payload)} onClose={() => setShowSocialHub(false)} />
          )}

          {showOfficialHub && serverSync.isActive() && officialState && (
            <OfficialSystemsHub
              player={player}
              inventory={inventory}
              official={officialState}
              nearbyPlayers={serverPlayersRef.current}
              initialTab={officialTab}
              onAction={(action, payload) => serverSync.sendOfficial(action, payload)}
              onClose={() => setShowOfficialHub(false)}
            />
          )}

          {showAdventure && (
            <AdventureBoard
              state={adventureState}
              connected={serverSync.isActive()}
              onStart={(contractId) => serverSync.sendAdventureStart(contractId)}
              onAbandon={() => serverSync.sendAdventureAbandon()}
              onClaim={() => serverSync.sendAdventureClaim()}
              onClose={() => setShowAdventure(false)}
            />
          )}

          {showQuestLog && (
            <QuestLog
              activeQuests={player.activeQuests}
              completedQuests={serverSync.isActive() && serverQuestsRef.current ? serverQuestsRef.current.completed : player.quests}
              availableQuests={availableQuests}
              questCatalog={questCatalog}
              achievements={serverSync.isActive() ? (officialState?.state?.achievements || []) : player.achievements}
              stats={player.stats}
              onClose={() => setShowQuestLog(false)}
              onAcceptQuest={serverSync.isActive() ? (id: string) => serverSync.sendQuestAccept(id) : undefined}
              onCompleteQuest={serverSync.isActive() ? (id: string) => serverSync.sendQuestComplete(id) : undefined}
            />
          )}
          {activeDialog && (
            <DialogBox
              npc={activeDialog}
              onAction={(action: string, questId?: string) => handleNPCAction(action, activeDialog, questId)}
              onClose={() => setActiveDialog(null)}
              player={player}
              questCatalog={questCatalog}
            />
          )}
          <Toaster toasts={toasts} onDismiss={(id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

          {/* Weather */}
          <Weather type={weather} />

          {/* Cast Bar & Raid Warning */}
          <CastBar />
          <RaidWarning />

          {/* Combo Display */}
          {comboDisplay && (
            <div
              className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none z-10 animate-pulse"
              style={{
                fontSize: `${32 + comboDisplay.count * 2}px`,
                fontWeight: 900,
                color: comboDisplay.count >= 10 ? '#ff00ff' : comboDisplay.count >= 5 ? '#f4e04d' : '#ff6060',
                textShadow: `0 0 20px currentColor, 0 0 40px currentColor`,
                fontFamily: 'system-ui, sans-serif',
                animation: 'combo-pop 0.4s ease-out',
              }}
            >
              {comboDisplay.count}x COMBO! ×{comboDisplay.mult.toFixed(1)}
              <style>{`
                @keyframes combo-pop {
                  0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
                  50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
                  100% { transform: translateX(-50%) scale(1); opacity: 1; }
                }
              `}</style>
            </div>
          )}

          {/* Admin badge */}
          {(godMode || noClip || oneHitKill || xpMultiplier > 1 || damageMultiplier > 1) && (
            <div className="absolute top-14 left-2 flex flex-col gap-1 pointer-events-none z-10">
              {godMode && <CheatBadge icon="👼" label="GOD" color="#f4e04d" />}
              {noClip && <CheatBadge icon="👻" label="NOCLIP" color="#9b59ff" />}
              {oneHitKill && <CheatBadge icon="💀" label="OHK" color="#ff0000" />}
              {xpMultiplier > 1 && <CheatBadge icon="⚡" label={`${xpMultiplier}x XP`} color="#2ecc71" />}
              {damageMultiplier > 1 && <CheatBadge icon="💥" label={`${damageMultiplier}x DMG`} color="#ff6060" />}
            </div>
          )}

          {allowLocalAdmin && showEditor && (
            <GameEditor
              player={player}
              setPlayer={(p) => setPlayer(p)}
              onClose={() => { setShowEditor(false); refreshCustomContent(); }}
            />
          )}
          {allowLocalAdmin && showAdmin && (
            <AdminPanel
              player={player}
              setPlayer={(p) => setPlayer(p)}
              monstersRef={monstersRef}
              inventoryRef={inventoryRef}
              setInventory={setInventory}
              onClose={() => setShowAdmin(false)}
              addMessage={addMessage}
              addToast={addToast}
              godMode={godMode} setGodMode={setGodMode}
              noClip={noClip} setNoClip={setNoClip}
              oneHitKill={oneHitKill} setOneHitKill={setOneHitKill}
              xpMultiplier={xpMultiplier} setXpMultiplier={setXpMultiplier}
              damageMultiplier={damageMultiplier} setDamageMultiplier={setDamageMultiplier}
              setDayTime={setDayTimeOverride}
              weather={weather} setWeather={setWeather}
              onOpenEditor={() => { setShowEditor(true); refreshCustomContent(); }}
              onOpenQuestCreator={() => setShowQuestCreator(true)}
              onSetSkull={(skull: string) => { adminSetSkull(player.name, skull as any); addToast('info', 'Skull Set', `Your skull is now: ${skull}`, SKULLS[skull as keyof typeof SKULLS].icon, SKULLS[skull as keyof typeof SKULLS].color); }}
              onOpenWorldEventCreator={() => setShowWorldEventCreator(true)}
            />
          )}
        </div>

        <HUD player={player} tick={hudTick} spells={spells} onCastSpell={castSpell} monsters={monstersRef.current} official={serverSync.isActive() ? officialState : null} />
      </div>

    </div>
  );
}

// ============ UI LAYOUT EDITOR (editable backpacks/panels) ============
function UILayoutEditor({ player, layout, onLayoutChange, onClose }: { player: Player; layout: UILayout; onLayoutChange: (layout: UILayout) => void; onClose: () => void }) {
  const PANELS = [
    { id: 'adventure', label: 'Hunt Board', icon: '⚔' },
    { id: 'quests', label: 'Quest Log', icon: '📜' },
    { id: 'char', label: 'Character', icon: '👤' },
    { id: 'talents', label: 'Talents', icon: '🌟' },
    { id: 'bestiary', label: 'Bestiary', icon: '📖' },
    { id: 'dps', label: 'DPS Meter', icon: '📊' },
    { id: 'dungeon', label: 'Dungeon', icon: '🌀' },
    { id: 'pet', label: 'Companions', icon: '🐾' },
    { id: 'mystery', label: 'Mystery', icon: '✦' },
    { id: 'depot', label: 'Depot', icon: '🗄' },
    { id: 'books', label: 'Library', icon: '📚' },
    { id: 'auction', label: 'Auction House', icon: '🏛' },
    { id: 'coins', label: 'Coin Shop', icon: '💎' },
    { id: 'world', label: 'World Events', icon: '🌍' },
    { id: 'mail', label: 'Mail', icon: '📮' },
    { id: 'inv', label: 'Inventory', icon: '📦' },
  ];

  const move = (idx: number, dir: -1 | 1) => {
    const newOrder = [...layout.panelOrder];
    const target = idx + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    const newLayout = saveUILayout(player.name, { ...layout, panelOrder: newOrder });
    onLayoutChange(newLayout);
  };

  return (
    <div className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="moria-panel w-full max-w-md rounded-3xl border border-sky-300/20 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(180deg, #9bd4ff 0%, #4a90e2 100%)' }}>⚙ UI SETTINGS</h2>
          <button onClick={onClose} className="text-blue-200/60 hover:text-white text-2xl">✕</button>
        </div>
        <div className="text-xs text-blue-200/60 mb-3">Reorder the quick-access buttons in the top bar. Changes apply immediately and persist for this character.</div>
        <div className="space-y-1 mb-4">
          {layout.panelOrder.map((panelId: string, idx: number) => {
            const panel = PANELS.find((p) => p.id === panelId);
            if (!panel) return null;
            return (
              <div key={panelId} className="flex items-center gap-2 p-2 rounded border border-blue-700/40 bg-black/40">
                <span className="text-lg">{panel.icon}</span>
                <span className="flex-1 text-blue-100 text-sm">{panel.label}</span>
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="px-2 text-blue-300 disabled:opacity-20">▲</button>
                <button onClick={() => move(idx, 1)} disabled={idx === layout.panelOrder.length - 1} className="px-2 text-blue-300 disabled:opacity-20">▼</button>
              </div>
            );
          })}
        </div>
        <button onClick={() => {
          const reset = saveUILayout(player.name, { ...layout, panelOrder: [...DEFAULT_UI_PANEL_ORDER] });
          onLayoutChange(reset);
        }} className="moria-button mb-3 w-full rounded-lg py-2 text-xs text-sky-200">↺ Reset default order</button>
        <div className="text-[10px] text-blue-200/40 text-center">Operational controls such as UI, Mount, Admin, Audio, Network and Logout stay fixed for safety.</div>
      </div>
    </div>
  );
}

function TopButton({ icon, label, hotkey, onClick }: { icon: string; label: string; hotkey: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="moria-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-300"
      title={`${label} (${hotkey})`}
    >
      <span>{icon}</span>
      <span className="hidden lg:inline">{label}</span>
      {hotkey && <span className="text-[8px] text-amber-200/45">{hotkey}</span>}
    </button>
  );
}

function CheatBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div
      className="px-2 py-0.5 rounded border-2 text-xs font-black tracking-wider animate-pulse"
      style={{
        background: `${color}30`,
        borderColor: color,
        color,
        textShadow: `0 0 10px ${color}`,
        boxShadow: `0 0 15px ${color}60`,
      }}
    >
      {icon} {label}
    </div>
  );
}
