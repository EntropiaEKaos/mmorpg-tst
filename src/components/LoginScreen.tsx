import { useState, useEffect } from 'react';
import type { Account } from '../game/types';
import { VOCATIONS } from '../game/classes';
import { audio } from '../game/audio';
const VOCATION_LIST = Object.values(VOCATIONS);

interface Props {
  onLogin: (account: Account) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [charName, setCharName] = useState('');
  const [vocation, setVocation] = useState('Knight');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tibia_current');
    if (saved) {
      setUsername(saved);
    }
    const accs: Account[] = JSON.parse(localStorage.getItem('tibia_accounts') || '[]');
    setAccounts(accs);
    // Start menu music on first interaction
    const startMusic = () => {
      audio.init();
      audio.resume();
      audio.startMusic('plains');
      window.removeEventListener('click', startMusic);
      window.removeEventListener('keydown', startMusic);
    };
    window.addEventListener('click', startMusic);
    window.addEventListener('keydown', startMusic);
    return () => {
      window.removeEventListener('click', startMusic);
      window.removeEventListener('keydown', startMusic);
    };
  }, []);

  const deleteAccount = (username: string) => {
    if (confirm(`Delete account "${username}"? This cannot be undone.`)) {
      const accs: Account[] = JSON.parse(localStorage.getItem('tibia_accounts') || '[]');
      const filtered = accs.filter((a) => a.username !== username);
      localStorage.setItem('tibia_accounts', JSON.stringify(filtered));
      if (localStorage.getItem('tibia_current') === username) {
        localStorage.removeItem('tibia_current');
      }
      setAccounts(filtered);
      if (username === savedUsername) {
        setUsername('');
      }
    }
  };
  const savedUsername = localStorage.getItem('tibia_current') || '';

  const handleLogin = () => {
    setError('');
    if (!username || !password) {
      setError('Fill in all fields.');
      return;
    }
    const accounts: Account[] = JSON.parse(localStorage.getItem('tibia_accounts') || '[]');
    const acc = accounts.find((a) => a.username === username && a.password === password);
    if (!acc) {
      setError('Invalid account name or password.');
      return;
    }
    localStorage.setItem('tibia_current', username);
    setStatus('Connecting to server...');
    setTimeout(() => {
      setStatus('Entering game world...');
      setTimeout(() => onLogin(acc), 600);
    }, 600);
  };

  const handleCreate = () => {
    setError('');
    if (!username || !password || !charName) {
      setError('Fill in all fields.');
      return;
    }
    if (username.length < 3) {
      setError('Account name must be at least 3 characters.');
      return;
    }
    if (password.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }
    if (charName.length < 3) {
      setError('Character name must be at least 3 characters.');
      return;
    }
    const accounts: Account[] = JSON.parse(localStorage.getItem('tibia_accounts') || '[]');
    if (accounts.some((a) => a.username === username)) {
      setError('Account already exists.');
      return;
    }
    if (accounts.some((a) => a.characterName === charName)) {
      setError('Character name is already in use.');
      return;
    }
    const newAcc: Account = {
      username,
      password,
      characterName: charName,
      vocation,
      level: 1,
      created: Date.now(),
    };
    accounts.push(newAcc);
    localStorage.setItem('tibia_accounts', JSON.stringify(accounts));
    localStorage.setItem('tibia_current', username);
    setAccounts([...accounts]);
    setStatus('Creating your character...');
    setTimeout(() => onLogin(newAcc), 800);
  };

  const handleDemoLogin = () => {
    const accounts: Account[] = JSON.parse(localStorage.getItem('tibia_accounts') || '[]');
    let demo = accounts.find((a) => a.username === 'demo');
    if (!demo) {
      demo = {
        username: 'demo',
        password: 'demo',
        characterName: 'Hero',
        vocation: 'Knight',
        level: 1,
        created: Date.now(),
      };
      accounts.push(demo);
      localStorage.setItem('tibia_accounts', JSON.stringify(accounts));
    }
    setStatus('Connecting...');
    setTimeout(() => onLogin(demo!), 500);
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/images/login-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(10,5,3,0.7) 0%, rgba(10,5,3,0.5) 50%, rgba(10,5,3,0.85) 100%)' }} />
      {/* Background stars/embers */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-200 opacity-40"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              animation: `twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Mountain silhouettes */}
      <svg
        className="absolute bottom-0 left-0 w-full h-64 opacity-40"
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
      >
        <polygon points="0,300 150,100 300,200 450,50 600,180 750,80 900,150 1050,60 1200,180 1200,300" fill="#1a0f05" />
        <polygon points="0,300 200,180 400,240 600,140 800,220 1000,160 1200,240 1200,300" fill="#2a1a0a" />
      </svg>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,180,50,0.6), 0 0 40px rgba(255,120,0,0.4); }
          50% { text-shadow: 0 0 30px rgba(255,200,80,0.9), 0 0 60px rgba(255,150,0,0.6); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-6">
          <img
            src="/images/logo.png"
            alt="Mor'ia"
            className="mx-auto max-w-[280px] w-full drop-shadow-[0_0_30px_rgba(255,180,50,0.5)]"
            style={{ animation: 'float 4s ease-in-out infinite' }}
          />
          <p className="text-amber-200/70 mt-3 text-sm tracking-[0.3em] font-semibold">
            ✦ REALM OF SHADOWS ✦
          </p>
          <p className="text-amber-100/40 mt-1 text-[10px] tracking-widest">A LIVING ONLINE WORLD</p>
        </div>

        {/* Login box */}
        <div
          className="rounded-lg border-2 p-6 backdrop-blur-sm"
          style={{
            background:
              'linear-gradient(180deg, rgba(60,40,20,0.9) 0%, rgba(30,20,10,0.95) 100%)',
            borderColor: '#8b6914',
            boxShadow:
              '0 0 40px rgba(255,150,50,0.15), inset 0 0 20px rgba(0,0,0,0.5)',
          }}
        >
          {/* Tabs */}
          <div className="flex mb-5 gap-2">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded font-semibold text-sm tracking-wide transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-black shadow-lg'
                  : 'bg-black/40 text-amber-200/60 hover:bg-black/60'
              }`}
            >
              ENTER GAME
            </button>
            <button
              onClick={() => { setMode('create'); setError(''); }}
              className={`flex-1 py-2 rounded font-semibold text-sm tracking-wide transition-all ${
                mode === 'create'
                  ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-black shadow-lg'
                  : 'bg-black/40 text-amber-200/60 hover:bg-black/60'
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-amber-200/80 text-xs mb-1 tracking-wider">
                ACCOUNT NAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleCreate())}
                className="w-full px-3 py-2 rounded bg-black/60 border border-amber-900/50 text-amber-100 focus:outline-none focus:border-amber-500 focus:shadow-[0_0_10px_rgba(255,180,50,0.3)]"
                placeholder="Enter account name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-amber-200/80 text-xs mb-1 tracking-wider">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleCreate())}
                className="w-full px-3 py-2 rounded bg-black/60 border border-amber-900/50 text-amber-100 focus:outline-none focus:border-amber-500 focus:shadow-[0_0_10px_rgba(255,180,50,0.3)]"
                placeholder="Enter password"
              />
            </div>

            {mode === 'create' && (
              <>
                <div>
                  <label className="block text-amber-200/80 text-xs mb-1 tracking-wider">
                    CHARACTER NAME
                  </label>
                  <input
                    type="text"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    className="w-full px-3 py-2 rounded bg-black/60 border border-amber-900/50 text-amber-100 focus:outline-none focus:border-amber-500 focus:shadow-[0_0_10px_rgba(255,180,50,0.3)]"
                    placeholder="Your hero's name"
                  />
                </div>

                <div>
                  <label className="block text-amber-200/80 text-xs mb-1 tracking-wider">
                    VOCATION ({VOCATION_LIST.length} CLASSES)
                  </label>
                  <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                    {VOCATION_LIST.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setVocation(v.name)}
                        className={`py-2 text-[10px] font-semibold rounded transition-all flex flex-col items-center ${
                          vocation === v.name
                            ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-black'
                            : 'bg-black/40 text-amber-200/70 hover:bg-black/60'
                        }`}
                        title={v.description}
                      >
                        <span className="text-lg">{v.icon}</span>
                        <span>{v.name}</span>
                      </button>
                    ))}
                  </div>
                  {VOCATIONS[vocation.toLowerCase()] && (
                    <div className="mt-2 p-2 rounded bg-black/40 border border-amber-900/40 text-[10px] text-amber-200/70">
                      <div className="font-bold text-amber-300 text-xs">{VOCATIONS[vocation.toLowerCase()].name}</div>
                      <div className="italic">{VOCATIONS[vocation.toLowerCase()].description}</div>
                      <div className="mt-1 text-green-400">★ {VOCATIONS[vocation.toLowerCase()].passive}</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-950/40 border border-red-900/50 rounded py-2">
                ⚠ {error}
              </div>
            )}

            {status && (
              <div className="text-amber-300 text-sm text-center bg-amber-950/40 border border-amber-900/50 rounded py-2 animate-pulse">
                ⏳ {status}
              </div>
            )}

            <button
              onClick={mode === 'login' ? handleLogin : handleCreate}
              className="w-full py-3 rounded font-bold tracking-widest text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  'linear-gradient(180deg, #f4e04d 0%, #d4a017 50%, #8b6914 100%)',
                boxShadow:
                  '0 4px 20px rgba(255,180,50,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              {mode === 'login' ? '⚔ ENTER TIBIA ⚔' : '✦ CREATE HERO ✦'}
            </button>

            {mode === 'login' && (
              <button
                onClick={handleDemoLogin}
                className="w-full py-2 rounded text-sm text-amber-200/70 hover:text-amber-100 bg-black/30 hover:bg-black/50 border border-amber-900/30 transition-all"
              >
                ▶ Quick Play (demo / demo)
              </button>
            )}
          </div>

          {/* Saved Accounts */}
          {accounts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-amber-900/30">
              <div className="text-amber-200/60 text-xs mb-2 tracking-wider">💾 SAVED ACCOUNTS ({accounts.length})</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {accounts.map((acc) => (
                  <div
                    key={acc.username}
                    className="flex items-center gap-2 p-2 rounded bg-black/40 border border-amber-900/30 hover:border-amber-600/50 transition-all"
                  >
                    <div className="text-lg">{VOCATIONS[acc.vocation.toLowerCase()]?.icon || '⚔'}</div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setUsername(acc.username); setPassword(acc.password); setMode('login'); }}>
                      <div className="text-amber-100 text-sm font-semibold truncate">{acc.characterName}</div>
                      <div className="text-amber-200/50 text-[10px]">{acc.username} · Lv {acc.level} {acc.vocation}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAccount(acc.username); }}
                      className="text-red-400 hover:text-red-300 text-xs px-2"
                      title="Delete account"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-amber-900/30 text-center text-amber-200/40 text-xs">
            <p>🌍 Players Online: <span className="text-amber-300 font-semibold">1,247</span></p>
            <p className="mt-1">Realm: Eldoria · Build 2.0</p>
          </div>
        </div>

        {/* Footer tips */}
        <div className="mt-4 text-center text-amber-200/40 text-xs space-y-1">
          <p>🗡 Use <span className="text-amber-300">WASD</span> or arrow keys to move · Click monsters to attack</p>
          <p>✨ Press <span className="text-amber-300">1-4</span> for spells · <span className="text-amber-300">I</span> for inventory</p>
        </div>
      </div>
    </div>
  );
}
