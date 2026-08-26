from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# GameScreen: restore unified inventory, remove legacy account writes,
# remove duplicate custom spawns, and make welcome grants one-shot.
# ---------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()

s = replace_once(s,
'''  const [inventory, setInventory] = useState<Item[]>([\n    { id: 'hp1', name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 10, value: 50, description: 'Restores 50 HP' },\n    { id: 'mp1', name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 5, value: 50, description: 'Restores 50 Mana' },\n    { id: 'hpg', name: 'Greater Health Potion', icon: '🍷', type: 'potion', quantity: 2, value: 150, description: 'Restores 200 HP' },\n  ]);\n''',
'''  const [inventory, setInventory] = useState<Item[]>(() => {\n    const loadedSave = loadLocal(account.characterName);\n    if (loadedSave && Array.isArray(loadedSave.inventory)) return loadedSave.inventory;\n    return [\n      { id: 'hp1', name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 10, value: 50, description: 'Restores 50 HP' },\n      { id: 'mp1', name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 5, value: 50, description: 'Restores 50 Mana' },\n      { id: 'hpg', name: 'Greater Health Potion', icon: '🍷', type: 'potion', quantity: 2, value: 150, description: 'Restores 200 HP' },\n    ];\n  });\n''', 'restore unified inventory')

s = replace_once(s,
'''      // Also update account list for login screen (level display)\n      const accounts: Account[] = JSON.parse(localStorage.getItem('tibia_accounts') || '[]');\n      const idx = accounts.findIndex((a) => a.username === account.username);\n      if (idx >= 0) {\n        accounts[idx] = { ...accounts[idx], savedPlayer: JSON.stringify(playerRef.current), level: playerRef.current.level };\n        localStorage.setItem('tibia_accounts', JSON.stringify(accounts));\n      }\n''', '', 'remove legacy account autosave')

s = replace_once(s,
'''    return () => { clearInterval(interval); window.removeEventListener('beforeunload', onUnload); };\n  }, [account.username]);\n''',
'''    return () => {\n      saveLocal(playerRef.current, inventoryRef.current);\n      clearInterval(interval);\n      window.removeEventListener('beforeunload', onUnload);\n    };\n  }, []);\n''', 'save on component unmount')

s = replace_once(s,
'''  // Spawn custom monsters on mount + check mail welcome + seed AH + welcome coins\n  useEffect(() => {\n    seedAuctionHouse(); // populate AH with NPC listings on first load\n    // Welcome coins for new players\n    if (getCoins(account.characterName) === 0) {\n      addCoins(account.characterName, 200);\n    }\n    const customs = getCustomMonsters();\n    if (customs.length > 0) {\n      const spawned: Monster[] = customs.map((cm) => ({\n        id: `customm_${cm.id}`,\n        name: cm.name,\n        pos: { x: cm.posX, y: cm.posY },\n        hp: cm.hp, maxHp: cm.hp,\n        attack: cm.attack, defense: cm.defense,\n        speed: cm.speed, xp: cm.xp,\n        color: cm.color, emoji: cm.emoji, size: cm.size,\n        level: cm.level, type: cm.type,\n        lastMove: 0, lastAttack: 0,\n        respawnPos: { x: cm.posX, y: cm.posY },\n        dead: false, respawnAt: 0,\n        loot: [{ name: 'Gold', icon: '🪙', chance: 0.8, value: cm.level * 10 }],\n      }));\n      monstersRef.current = [...monstersRef.current, ...spawned];\n    }\n    // Welcome mail for new players\n    const mail = getMail(account.characterName);\n    if (mail.length === 0) {\n      sendSystemMail(account.characterName, 'Postmaster Edwin',\n        'Welcome to Mor\\'ia!',\n        `Dear ${account.characterName},\\n\\nWelcome to the realm of Mor'ia! May your adventures be legendary.\\n\\nTo help you get started, here is some gold. Visit me at the post office (near the bank) anytime.\\n\\nSafe travels,\\nPostmaster Edwin`,\n        100);\n    }\n  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n''',
'''  // Seed local-only starter content exactly once per character.\n  useEffect(() => {\n    seedAuctionHouse();\n\n    const welcomeCoinsKey = `moria_welcome_coins_${account.characterName}`;\n    if (localStorage.getItem(welcomeCoinsKey) !== '1') {\n      if (getCoins(account.characterName) === 0) addCoins(account.characterName, 200);\n      localStorage.setItem(welcomeCoinsKey, '1');\n    }\n\n    const welcomeMailKey = `moria_welcome_mail_${account.characterName}`;\n    if (localStorage.getItem(welcomeMailKey) !== '1') {\n      if (getMail(account.characterName).length === 0) {\n        sendSystemMail(account.characterName, 'Postmaster Edwin',\n          'Welcome to Mor\\'ia!',\n          `Dear ${account.characterName},\\n\\nWelcome to the realm of Mor'ia! May your adventures be legendary.\\n\\nTo help you get started, here is some gold. Visit me at the post office (near the bank) anytime.\\n\\nSafe travels,\\nPostmaster Edwin`,\n          100);\n      }\n      localStorage.setItem(welcomeMailKey, '1');\n    }\n  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n''', 'one-shot starter grants and duplicate custom spawn removal')

p.write_text(s)

# ---------------------------------------------------------------------
# SaveManager: unified save is the only client persistence source.
# Remove unreachable legacy account parsing and repair stale subsystem keys.
# ---------------------------------------------------------------------
p = Path('src/game/SaveManager.ts')
s = p.read_text()

old_migration = '''    // MIGRATION: old fragmented save detected — try to rebuild from playerFactory save\n    const oldPlayerRaw = localStorage.getItem('tibia_accounts');\n    if (oldPlayerRaw) {\n      const accounts = JSON.parse(oldPlayerRaw);\n      const acc = accounts.find((a: any) => a.characterName === name || a.username === name);\n      if (acc?.savedPlayer) {\n        // We have an old save — convert to unified and save\n        const oldPlayer = JSON.parse(acc.savedPlayer);\n        const migrated: PlayerSave = {\n          version: CURRENT_VERSION, name,\n          vocation: oldPlayer.vocation || 'knight',\n          level: oldPlayer.level || 1, xp: oldPlayer.xp || 0,\n          gold: oldPlayer.gold || 100, bankGold: oldPlayer.bankGold || 0,\n          hp: oldPlayer.hp || 150, maxHp: oldPlayer.maxHp || 150,\n          mana: oldPlayer.mana || 50, maxMana: oldPlayer.maxMana || 50,\n          attack: oldPlayer.attack || 20, defense: oldPlayer.defense || 5, magic: oldPlayer.magic || 10,\n          skills: oldPlayer.skills || {}, talents: {},\n          blessings: [], achievements: oldPlayer.achievements || [],\n          professions: { miner: { level: 1, progress: 0 }, herbalist: { level: 1, progress: 0 }, fisher: { level: 1, progress: 0 } },\n          reputation: { town: 0 }, stamina: 42 * 60, bestiary: {}, mysteryProgress: {},\n          inventory: [], equipment: oldPlayer.equipment || {}, depot: [],\n          coins: 0, pets: [], activePet: null, mounts: [],\n          skull: { type: 'none', aggressionPoints: 0, lastDecay: Date.now() },\n          pvpEnabled: false, dailyReward: { lastClaim: 0, streak: 0 },\n          stats: oldPlayer.stats || {}, lastSaved: Date.now(),\n        };\n        localStorage.setItem(SAVE_KEY(name), JSON.stringify(migrated));\n        return migrated;\n      }\n    }\n'''
s = replace_once(s, old_migration, '', 'remove client legacy account migration')

s = replace_once(s,
'''    if (raw) {\n      const save = JSON.parse(raw) as PlayerSave;\n      return migrate(save, name);\n    }\n''',
'''    if (raw) {\n      const save = JSON.parse(raw) as PlayerSave;\n      if (!save || typeof save !== 'object' || save.name !== name || !Array.isArray(save.inventory)) return null;\n      return migrate(save, name);\n    }\n''', 'basic unified save validation')

s = replace_once(s,
'''    localStorage.setItem(`tibia_stamina_${save.name}`, JSON.stringify({ value: save.stamina || (42 * 60), lastUpdate: Date.now() }));\n''',
'''    localStorage.setItem(`tibia_stamina_${save.name}`, JSON.stringify({ value: save.stamina ?? (42 * 60), lastUpdate: Date.now() }));\n''', 'preserve zero stamina')

s = replace_once(s,
'''    if (save.activePet) localStorage.setItem(`tibia_activepet_${save.name}`, save.activePet);\n''',
'''    if (save.activePet) localStorage.setItem(`tibia_activepet_${save.name}`, save.activePet);\n    else localStorage.removeItem(`tibia_activepet_${save.name}`);\n''', 'clear stale active pet')

p.write_text(s)
print('save integrity 3.6 applied')
