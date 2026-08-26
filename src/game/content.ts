// ============ BOOK SYSTEM ============
export interface Book {
  id: string;
  title: string;
  icon: string;
  author: string;
  pages: string[];
  color: string;
  createdAt: number;
}

const BOOKS_KEY = 'moria_books';
const READ_BOOKS_KEY = (playerName: string) => `moria_read_books_${playerName}`;

export function getAllBooks(): Book[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKS_KEY) || '[]');
  } catch { return []; }
}

export function saveBook(book: Book) {
  const books = getAllBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) books[idx] = book;
  else books.push(book);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function deleteBook(id: string) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(getAllBooks().filter((b) => b.id !== id)));
}

export function getReadBooks(playerName: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_BOOKS_KEY(playerName)) || '[]');
  } catch { return []; }
}

export function markBookRead(playerName: string, bookId: string) {
  const read = getReadBooks(playerName);
  if (!read.includes(bookId)) {
    read.push(bookId);
    localStorage.setItem(READ_BOOKS_KEY(playerName), JSON.stringify(read));
  }
}

// ============ MAIL SYSTEM ============
export interface MailItem {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  gold?: number;
  attachedItem?: { name: string; icon: string; value: number };
  sentAt: number;
  read: boolean;
  claimed: boolean;
  isSystem?: boolean;
}

const MAIL_KEY = (playerName: string) => `moria_mail_${playerName}`;

export function getMail(playerName: string): MailItem[] {
  try {
    return JSON.parse(localStorage.getItem(MAIL_KEY(playerName)) || '[]');
  } catch { return []; }
}

export function saveMail(playerName: string, mail: MailItem[]) {
  localStorage.setItem(MAIL_KEY(playerName), JSON.stringify(mail));
}

export function sendMail(mail: Omit<MailItem, 'id' | 'sentAt' | 'read' | 'claimed'>): void {
  const inbox = getMail(mail.to);
  inbox.push({
    ...mail,
    id: `mail_${Date.now()}_${Math.random()}`,
    sentAt: Date.now(),
    read: false,
    claimed: false,
  });
  saveMail(mail.to, inbox);
}

// System mail (from NPC/events to player)
export function sendSystemMail(playerName: string, from: string, subject: string, body: string, gold = 0, attachedItem?: { name: string; icon: string; value: number }) {
  sendMail({ from, to: playerName, subject, body, gold, attachedItem, isSystem: true });
}

export function markMailRead(playerName: string, mailId: string) {
  const mail = getMail(playerName).map((m) => m.id === mailId ? { ...m, read: true } : m);
  saveMail(playerName, mail);
}

export function claimMail(playerName: string, mailId: string): MailItem | null {
  const mail = getMail(playerName);
  const item = mail.find((m) => m.id === mailId);
  if (!item || item.claimed) return null;
  item.claimed = true;
  item.read = true;
  saveMail(playerName, mail);
  return item;
}

export function deleteMail(playerName: string, mailId: string) {
  saveMail(playerName, getMail(playerName).filter((m) => m.id !== mailId));
}

// ============ CUSTOM NPC SYSTEM ============
export interface CustomNPC {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  posX: number;
  posY: number;
  dialogueText: string;
  mapId?: string;
  createdAt: number;
}

const NPC_KEY = 'moria_custom_npcs';

export function getCustomNPCs(): CustomNPC[] {
  try {
    const data = JSON.parse(localStorage.getItem(NPC_KEY) || '[]');
    if (!Array.isArray(data)) return [];
    return data
      .filter((npc): npc is CustomNPC => Boolean(npc && typeof npc === 'object' && typeof npc.id === 'string' && typeof npc.name === 'string'))
      .map((npc) => ({ ...npc, mapId: typeof npc.mapId === 'string' && npc.mapId ? npc.mapId : 'eldoria' }));
  } catch { return []; }
}

export function saveCustomNPC(npc: CustomNPC) {
  const npcs = getCustomNPCs();
  const idx = npcs.findIndex((n) => n.id === npc.id);
  if (idx >= 0) npcs[idx] = npc;
  else npcs.push(npc);
  localStorage.setItem(NPC_KEY, JSON.stringify(npcs));
}

export function deleteCustomNPC(id: string) {
  localStorage.setItem(NPC_KEY, JSON.stringify(getCustomNPCs().filter((n) => n.id !== id)));
}

// ============ CUSTOM MONSTER SYSTEM ============
export interface CustomMonster {
  id: string;
  name: string;
  emoji: string;
  color: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  xp: number;
  size: number;
  type: 'normal' | 'elite' | 'boss';
  level: number;
  posX: number;
  posY: number;
  mapId?: string;
  createdAt: number;
}

const MONSTER_KEY = 'moria_custom_monsters';

export function getCustomMonsters(): CustomMonster[] {
  try {
    const data = JSON.parse(localStorage.getItem(MONSTER_KEY) || '[]');
    if (!Array.isArray(data)) return [];
    return data
      .filter((monster): monster is CustomMonster => Boolean(monster && typeof monster === 'object' && typeof monster.id === 'string' && typeof monster.name === 'string'))
      .map((monster) => ({ ...monster, mapId: typeof monster.mapId === 'string' && monster.mapId ? monster.mapId : 'eldoria' }));
  } catch { return []; }
}

export function saveCustomMonster(monster: CustomMonster) {
  const monsters = getCustomMonsters();
  const idx = monsters.findIndex((m) => m.id === monster.id);
  if (idx >= 0) monsters[idx] = monster;
  else monsters.push(monster);
  localStorage.setItem(MONSTER_KEY, JSON.stringify(monsters));
}

export function deleteCustomMonster(id: string) {
  localStorage.setItem(MONSTER_KEY, JSON.stringify(getCustomMonsters().filter((m) => m.id !== id)));
}

// ============ UI LAYOUT SYSTEM (editable backpacks/panels) ============
export interface UILayout {
  panelOrder: string[]; // ordered list of panel ids
  scale: number;
}

const UI_KEY = (playerName: string) => `moria_ui_layout_${playerName}`;

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
