from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# UI layout persistence: normalize old saves and include every quick panel.
# ---------------------------------------------------------------------
p = Path('src/game/content.ts')
s = p.read_text()
s = replace_once(s,
'''const UI_KEY = (playerName: string) => `moria_ui_layout_${playerName}`;

export function getUILayout(playerName: string): UILayout {
  try {
    const layout = JSON.parse(localStorage.getItem(UI_KEY(playerName)) || 'null');
    if (layout) return layout;
  } catch {}
  return { panelOrder: ['inv', 'char', 'quests', 'talents', 'bestiary', 'dps', 'mail', 'books'], scale: 1 };
}

export function saveUILayout(playerName: string, layout: UILayout) {
  localStorage.setItem(UI_KEY(playerName), JSON.stringify(layout));
}
''',
'''const UI_KEY = (playerName: string) => `moria_ui_layout_${playerName}`;

export const DEFAULT_UI_PANEL_ORDER = [
  'quests', 'char', 'talents', 'bestiary', 'dps', 'dungeon', 'pet', 'mystery',
  'depot', 'books', 'auction', 'coins', 'world', 'mail', 'inv',
] as const;

function normalizeUILayout(layout?: Partial<UILayout> | null): UILayout {
  const allowed = new Set<string>(DEFAULT_UI_PANEL_ORDER);
  const seen = new Set<string>();
  const supplied = Array.isArray(layout?.panelOrder) ? layout!.panelOrder : [];
  const panelOrder = supplied.filter((id): id is string => {
    if (typeof id !== 'string' || !allowed.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  for (const id of DEFAULT_UI_PANEL_ORDER) {
    if (!seen.has(id)) panelOrder.push(id);
  }
  const rawScale = typeof layout?.scale === 'number' && Number.isFinite(layout.scale) ? layout.scale : 1;
  return { panelOrder, scale: Math.max(0.75, Math.min(1.25, rawScale)) };
}

export function getUILayout(playerName: string): UILayout {
  try {
    const layout = JSON.parse(localStorage.getItem(UI_KEY(playerName)) || 'null');
    return normalizeUILayout(layout);
  } catch {
    return normalizeUILayout(null);
  }
}

export function saveUILayout(playerName: string, layout: UILayout): UILayout {
  const normalized = normalizeUILayout(layout);
  localStorage.setItem(UI_KEY(playerName), JSON.stringify(normalized));
  return normalized;
}
''', 'layout normalization')
p.write_text(s)

# ---------------------------------------------------------------------
# GameScreen: topbar now obeys the saved order immediately.
# ---------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = s.replace(
    "import { getCustomNPCs, getCustomMonsters, getMail, sendSystemMail, getUILayout, saveUILayout, type CustomNPC, type CustomMonster } from '../game/content';",
    "import { getCustomNPCs, getCustomMonsters, getMail, sendSystemMail, getUILayout, saveUILayout, DEFAULT_UI_PANEL_ORDER, type UILayout, type CustomNPC, type CustomMonster } from '../game/content';",
    1,
)
s = replace_once(s,
'''  const [showWorldEventCreator, setShowWorldEventCreator] = useState(false);
  const simPlayersRef = useRef<SimPlayer[]>(generateSimPlayers(6, MAP_WIDTH, MAP_HEIGHT));
''',
'''  const [showWorldEventCreator, setShowWorldEventCreator] = useState(false);
  const [uiLayout, setUILayoutState] = useState<UILayout>(() => getUILayout(account.characterName));
  const simPlayersRef = useRef<SimPlayer[]>(generateSimPlayers(6, MAP_WIDTH, MAP_HEIGHT));
''', 'ui layout state')
anchor = '''  const availableQuests = getAvailableQuests(player.quests, player.level, player.activeQuests.map((a) => a.questId));

'''
addition = anchor + '''  const quickActions: Record<string, { icon: string; label: string; hotkey: string; onClick: () => void }> = {
    quests: { icon: '📜', label: 'Quests', hotkey: 'Q', onClick: () => setShowQuestLog((v) => !v) },
    char: { icon: '👤', label: 'Char', hotkey: 'C', onClick: () => setShowCharacter((v) => !v) },
    talents: { icon: '🌟', label: 'Talents', hotkey: 'T', onClick: () => setShowTalents((v) => !v) },
    bestiary: { icon: '📖', label: 'Bestiary', hotkey: 'B', onClick: () => setShowBestiary((v) => !v) },
    dps: { icon: '📊', label: 'DPS', hotkey: 'D', onClick: () => setShowDPS((v) => !v) },
    dungeon: { icon: '🌀', label: 'Dungeon', hotkey: '', onClick: () => setShowDungeon(true) },
    pet: { icon: '🐾', label: 'Pet', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Companions are local-only until server support lands.', '#ff9090', 'system') : setShowPetShop(true) },
    mystery: { icon: '✦', label: 'Mystery', hotkey: '', onClick: () => setShowMysteryBook(true) },
    depot: { icon: '🗄', label: 'Depot', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Depot is local-only until server support lands.', '#ff9090', 'system') : setShowDepot(true) },
    books: { icon: '📚', label: 'Books', hotkey: '', onClick: () => setShowBooks(true) },
    auction: { icon: '🏛', label: 'AH', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Auction House is local-only until server support lands.', '#ff9090', 'system') : setShowAuction(true) },
    coins: { icon: '💎', label: 'Coins', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Coin Shop is local-only until server support lands.', '#ff9090', 'system') : setShowCoinShop(true) },
    world: { icon: '🌍', label: 'World', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Browser world events are disabled in authoritative mode.', '#ff9090', 'system') : setShowWorldEvents(true) },
    mail: { icon: '📮', label: 'Mail', hotkey: '', onClick: () => onlineAccount ? addMessage('System', 'Mail is local-only until server support lands.', '#ff9090', 'system') : setShowMail(true) },
    inv: { icon: '📦', label: 'Inv', hotkey: 'I', onClick: () => setShowInventory((v) => !v) },
  };
  const orderedQuickActions = uiLayout.panelOrder.map((id) => ({ id, action: quickActions[id] })).filter((entry) => Boolean(entry.action));

'''
if 'const quickActions: Record<string' not in s:
    if anchor not in s: raise SystemExit('quick action anchor missing')
    s = s.replace(anchor, addition, 1)
old_buttons = '''          <TopButton icon="📜" label="Quests" hotkey="Q" onClick={() => setShowQuestLog((s) => !s)} />
          <TopButton icon="👤" label="Char" hotkey="C" onClick={() => setShowCharacter((s) => !s)} />
          <TopButton icon="🌟" label="Talents" hotkey="T" onClick={() => setShowTalents((s) => !s)} />
          <TopButton icon="📖" label="Bestiary" hotkey="B" onClick={() => setShowBestiary((s) => !s)} />
          <TopButton icon="📊" label="DPS" hotkey="D" onClick={() => setShowDPS((s) => !s)} />
          <TopButton icon="🌀" label="Dungeon" hotkey="" onClick={() => setShowDungeon(true)} />
          <TopButton icon="🐾" label="Pet" hotkey="" onClick={() => onlineAccount ? addMessage('System', 'Companions are local-only until server support lands.', '#ff9090', 'system') : setShowPetShop(true)} />
          <TopButton icon="✦" label="Mystery" hotkey="" onClick={() => setShowMysteryBook(true)} />
          <TopButton icon="🗄" label="Depot" hotkey="" onClick={() => onlineAccount ? addMessage('System', 'Depot is local-only until server support lands.', '#ff9090', 'system') : setShowDepot(true)} />
          <TopButton icon="📚" label="Books" hotkey="" onClick={() => setShowBooks(true)} />
          <TopButton icon="🏛" label="AH" hotkey="" onClick={() => onlineAccount ? addMessage('System', 'Auction House is local-only until server support lands.', '#ff9090', 'system') : setShowAuction(true)} />
          <TopButton icon="💎" label="Coins" hotkey="" onClick={() => onlineAccount ? addMessage('System', 'Coin Shop is local-only until server support lands.', '#ff9090', 'system') : setShowCoinShop(true)} />
          <TopButton icon="🌍" label="World" hotkey="" onClick={() => onlineAccount ? addMessage('System', 'Browser world events are disabled in authoritative mode.', '#ff9090', 'system') : setShowWorldEvents(true)} />
          <TopButton icon="📮" label="Mail" hotkey="" onClick={() => onlineAccount ? addMessage('System', 'Mail is local-only until server support lands.', '#ff9090', 'system') : setShowMail(true)} />
          <TopButton icon="📦" label="Inv" hotkey="I" onClick={() => setShowInventory((s) => !s)} />
'''
new_buttons = '''          {orderedQuickActions.map(({ id, action }) => (
            <TopButton key={id} icon={action.icon} label={action.label} hotkey={action.hotkey} onClick={action.onClick} />
          ))}
'''
s = replace_once(s, old_buttons, new_buttons, 'topbar ordered actions')
s = replace_once(s,
'''            <UILayoutEditor player={player} onClose={() => setShowUIEditor(false)} />
''',
'''            <UILayoutEditor player={player} layout={uiLayout} onLayoutChange={setUILayoutState} onClose={() => setShowUIEditor(false)} />
''', 'ui editor invocation')
# Replace the editor component header/state and panel model.
s = replace_once(s,
'''function UILayoutEditor({ player, onClose }: { player: Player; onClose: () => void }) {
  const [layout, setLayout] = useState(getUILayout(player.name));

  const PANELS = [
    { id: 'inv', label: 'Inventory', icon: '📦' },
    { id: 'char', label: 'Character', icon: '👤' },
    { id: 'quests', label: 'Quest Log', icon: '📜' },
    { id: 'talents', label: 'Talents', icon: '🌟' },
    { id: 'bestiary', label: 'Bestiary', icon: '📖' },
    { id: 'dps', label: 'DPS Meter', icon: '📊' },
    { id: 'mail', label: 'Mail', icon: '📮' },
    { id: 'books', label: 'Library', icon: '📚' },
    { id: 'depot', label: 'Depot', icon: '🗄' },
    { id: 'mystery', label: 'Mystery', icon: '✦' },
  ];
''',
'''function UILayoutEditor({ player, layout, onLayoutChange, onClose }: { player: Player; layout: UILayout; onLayoutChange: (layout: UILayout) => void; onClose: () => void }) {
  const PANELS = [
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
''', 'ui editor signature')
s = replace_once(s,
'''    const newLayout = { ...layout, panelOrder: newOrder };
    setLayout(newLayout);
    saveUILayout(player.name, newLayout);
''',
'''    const newLayout = saveUILayout(player.name, { ...layout, panelOrder: newOrder });
    onLayoutChange(newLayout);
''', 'ui editor move')
# Premium styling + truthful copy + reset.
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-20"\n         style={{ background: \'rgba(0,0,0,0.85)\', backdropFilter: \'blur(8px)\' }} onClick={onClose}', 'className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5" onClick={onClose}', 1)
s = replace_once(s,
'''           className="rounded-xl border-2 p-5 max-w-md w-full"
           style={{ background: 'linear-gradient(180deg, rgba(50,40,20,0.98) 0%, rgba(25,20,8,0.98) 100%)', borderColor: '#9bd4ff', boxShadow: '0 0 40px rgba(155,212,255,0.3)' }}>
''',
'''           className="moria-panel w-full max-w-md rounded-3xl border border-sky-300/20 p-4 sm:p-5">
''', 'ui editor panel')
s = s.replace('Customize which panels appear and their order. Reorder with the arrows.', 'Reorder the quick-access buttons in the top bar. Changes apply immediately and persist for this character.', 1)
s = replace_once(s,
'''        <div className="text-[10px] text-blue-200/40 text-center">Tip: Use + / − keys or the zoom buttons (bottom-right) to zoom the game map!</div>
''',
'''        <button onClick={() => {
          const reset = saveUILayout(player.name, { ...layout, panelOrder: [...DEFAULT_UI_PANEL_ORDER] });
          onLayoutChange(reset);
        }} className="moria-button mb-3 w-full rounded-lg py-2 text-xs text-sky-200">↺ Reset default order</button>
        <div className="text-[10px] text-blue-200/40 text-center">Operational controls such as UI, Mount, Admin, Audio, Network and Logout stay fixed for safety.</div>
''', 'ui editor reset')
p.write_text(s)

# ---------------------------------------------------------------------
# Library visual polish and empty-page guard.
# ---------------------------------------------------------------------
p = Path('src/components/BookLibrary.tsx')
s = p.read_text()
s = replace_once(s,
'''  const openBook = (book: Book) => {
    setActive(book);
    setPage(0);
    markBookRead(player.name, book.id);
  };
''',
'''  const openBook = (book: Book) => {
    setActive(book);
    setPage(0);
    markBookRead(player.name, book.id);
  };
  const pageCount = Math.max(1, active?.pages.length || 0);
''', 'library page count')
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-20"', 'className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"', 1)
s = replace_once(s,
'''           className="rounded-xl border-2 p-5 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(50,35,15,0.98) 0%, rgba(25,18,8,0.98) 100%)', borderColor: '#9b59ff', boxShadow: '0 0 50px rgba(155,89,255,0.3)' }}>
''',
'''           className="moria-panel w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-violet-300/20 p-4 sm:p-6 flex flex-col">
''', 'library panel')
s = s.replace('className="overflow-y-auto flex-1"', 'className="moria-scrollbar overflow-y-auto flex-1 pr-1"', 1)
s = s.replace('className="grid grid-cols-4 gap-3"', 'className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"', 1)
s = s.replace('{active.pages[page]}', "{active.pages[page] || 'This volume has no written pages yet.'}", 1)
s = s.replace('Page {page + 1} of {active.pages.length}', 'Page {Math.min(page + 1, pageCount)} of {pageCount}', 1)
s = s.replace('disabled={page >= active.pages.length - 1}', 'disabled={page >= pageCount - 1}', 1)
s = s.replace('onClick={() => setPage((p) => Math.min(active.pages.length - 1, p + 1))}', 'onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}', 1)
p.write_text(s)

print('functional UI layout polish applied')
