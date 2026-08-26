import { useEffect, useState } from 'react';
import type { Account } from '../game/types';
import { VOCATIONS } from '../game/classes';
import { audio } from '../game/audio';
import {
  createCharacter,
  loginAccount,
  recoverAccount,
  registerAccount,
  toGameAccount,
  type ServerAccount,
} from '../game/auth';

const VOCATION_LIST = Object.values(VOCATIONS);

type Mode = 'login' | 'create' | 'recover' | 'character';

interface Props {
  onLogin: (account: Account) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [charName, setCharName] = useState('');
  const [vocation, setVocation] = useState('knight');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [serverAccount, setServerAccount] = useState<ServerAccount | null>(null);
  const [oneTimeRecoveryCode, setOneTimeRecoveryCode] = useState('');

  useEffect(() => {
    // Purge the legacy credential store. Old versions kept plaintext passwords here.
    localStorage.removeItem('tibia_accounts');
    localStorage.removeItem('tibia_current');

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

  const begin = () => {
    setError('');
    setStatus('');
  };

  const handleLogin = async () => {
    begin();
    if (!username || !password) return setError('Fill in account name and password.');
    setStatus('Authenticating with server...');
    try {
      const result = await loginAccount(username, password);
      setSessionToken(result.sessionToken);
      setServerAccount(result.account);
      if (!result.account.characters.length) {
        setMode('character');
        setStatus('Account authenticated. Create your first character.');
        return;
      }
      onLogin(toGameAccount(result.account, result.sessionToken));
    } catch (err) {
      setStatus('');
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  const handleRegister = async () => {
    begin();
    if (!username || !password) return setError('Fill in account name and password.');
    if (password.length < 10) return setError('Password must be at least 10 characters.');
    setStatus('Creating secure server account...');
    try {
      const result = await registerAccount(username, password);
      setSessionToken(result.sessionToken);
      setServerAccount(result.account);
      setOneTimeRecoveryCode(result.recoveryCode || '');
      setStatus('Account created. Save your recovery code before continuing.');
    } catch (err) {
      setStatus('');
      setError(err instanceof Error ? err.message : 'Account creation failed.');
    }
  };

  const handleRecover = async () => {
    begin();
    if (!username || !recoveryCode || !newPassword) return setError('Fill in account, recovery code and new password.');
    if (newPassword.length < 10) return setError('New password must be at least 10 characters.');
    setStatus('Verifying recovery code...');
    try {
      const result = await recoverAccount(username, recoveryCode, newPassword);
      setSessionToken(result.sessionToken);
      setServerAccount(result.account);
      setOneTimeRecoveryCode(result.recoveryCode || '');
      setStatus('Password reset. Your recovery code was rotated; save the new code.');
    } catch (err) {
      setStatus('');
      setError(err instanceof Error ? err.message : 'Recovery failed.');
    }
  };

  const continueAfterRecovery = () => {
    if (!serverAccount || !sessionToken) return;
    setOneTimeRecoveryCode('');
    if (serverAccount.characters.length) onLogin(toGameAccount(serverAccount, sessionToken));
    else setMode('character');
  };

  const handleCreateCharacter = async () => {
    begin();
    if (!sessionToken || !serverAccount) return setError('Authenticate the account first.');
    if (charName.trim().length < 3) return setError('Character name must be at least 3 characters.');
    setStatus('Creating server-owned character...');
    try {
      const result = await createCharacter(sessionToken, charName, vocation);
      onLogin(toGameAccount(result.account, sessionToken, result.character));
    } catch (err) {
      setStatus('');
      setError(err instanceof Error ? err.message : 'Character creation failed.');
    }
  };

  const handleDemoLogin = () => {
    const demo = {
      accountId: 'offline-demo',
      username: 'offline-demo',
      characterName: 'Hero',
      vocation: 'Knight',
      level: 1,
      created: Date.now(),
      offline: true,
    } as Account;
    onLogin(demo);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setStatus('');
    setOneTimeRecoveryCode('');
  };

  const submit = () => {
    if (mode === 'login') void handleLogin();
    else if (mode === 'create') void handleRegister();
    else if (mode === 'recover') void handleRecover();
    else void handleCreateCharacter();
  };

  if (oneTimeRecoveryCode) {
    return (
      <Shell>
        <div className="rounded-lg border-2 border-amber-600 bg-black/80 p-6 text-amber-100 shadow-2xl">
          <h2 className="text-xl font-bold text-amber-300 mb-3">🔐 SAVE YOUR RECOVERY CODE</h2>
          <p className="text-sm text-amber-100/70 mb-4">
            This code is shown once. It can reset your password if you lose access. Anyone with it can recover the account.
          </p>
          <div className="select-all break-all rounded border border-amber-700 bg-black p-4 font-mono text-sm text-amber-200">
            {oneTimeRecoveryCode}
          </div>
          <button onClick={continueAfterRecovery} className="mt-5 w-full rounded bg-amber-500 py-3 font-bold text-black hover:bg-amber-400">
            I SAVED IT — CONTINUE
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center mb-6">
        <img src="/images/logo.png" alt="Mor'ia" className="mx-auto max-w-[280px] w-full drop-shadow-[0_0_30px_rgba(255,180,50,0.5)]" />
        <p className="text-amber-200/70 mt-3 text-sm tracking-[0.3em] font-semibold">✦ REALM OF SHADOWS ✦</p>
        <p className="text-amber-100/40 mt-1 text-[10px] tracking-widest">SERVER-AUTHENTICATED ONLINE WORLD</p>
      </div>

      <div className="rounded-lg border-2 border-[#8b6914] p-6 backdrop-blur-sm bg-[linear-gradient(180deg,rgba(60,40,20,0.92),rgba(30,20,10,0.97))] shadow-2xl">
        {mode !== 'character' && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            <Tab active={mode === 'login'} onClick={() => switchMode('login')}>LOGIN</Tab>
            <Tab active={mode === 'create'} onClick={() => switchMode('create')}>REGISTER</Tab>
            <Tab active={mode === 'recover'} onClick={() => switchMode('recover')}>RECOVER</Tab>
          </div>
        )}

        {mode === 'character' ? (
          <>
            <h2 className="text-lg font-bold text-amber-300 mb-1">CREATE CHARACTER</h2>
            <p className="text-xs text-amber-100/50 mb-4">Account: {serverAccount?.username}</p>
            <Field label="CHARACTER NAME" value={charName} onChange={setCharName} type="text" onEnter={submit} />
            <div className="mt-3">
              <label className="block text-amber-200/80 text-xs mb-2 tracking-wider">VOCATION</label>
              <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto">
                {VOCATION_LIST.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVocation(v.id)}
                    className={`py-2 rounded text-[10px] font-semibold ${vocation === v.id ? 'bg-amber-500 text-black' : 'bg-black/40 text-amber-200/70'}`}
                  >
                    <span className="text-lg block">{v.icon}</span>{v.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <Field label="ACCOUNT NAME" value={username} onChange={setUsername} type="text" onEnter={submit} />
            {mode === 'recover' ? (
              <>
                <Field label="RECOVERY CODE" value={recoveryCode} onChange={setRecoveryCode} type="text" onEnter={submit} />
                <Field label="NEW PASSWORD" value={newPassword} onChange={setNewPassword} type="password" onEnter={submit} />
              </>
            ) : (
              <Field label="PASSWORD" value={password} onChange={setPassword} type="password" onEnter={submit} />
            )}
          </>
        )}

        {error && <div className="mt-3 text-red-400 text-sm text-center bg-red-950/40 border border-red-900/50 rounded py-2">⚠ {error}</div>}
        {status && <div className="mt-3 text-amber-300 text-sm text-center bg-amber-950/40 border border-amber-900/50 rounded py-2">⏳ {status}</div>}

        <button onClick={submit} className="mt-4 w-full py-3 rounded font-bold tracking-widest text-black bg-[linear-gradient(180deg,#f4e04d,#d4a017,#8b6914)] hover:scale-[1.01] transition-transform">
          {mode === 'login' ? '⚔ ENTER MOR\'IA ⚔' : mode === 'create' ? '✦ CREATE ACCOUNT ✦' : mode === 'recover' ? '🔐 RESET PASSWORD' : '✦ CREATE HERO ✦'}
        </button>

        {mode === 'login' && (
          <button onClick={handleDemoLogin} className="mt-2 w-full py-2 rounded text-sm text-amber-200/70 bg-black/30 border border-amber-900/30">
            ▶ Offline Quick Play (no server account)
          </button>
        )}

        <p className="mt-4 text-center text-[10px] text-amber-100/35">
          Online passwords are hashed on the server and are never stored in browser account lists.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4" style={{ backgroundImage: 'url(/images/login-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,5,3,0.75),rgba(10,5,3,0.55),rgba(10,5,3,0.9))]" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`py-2 rounded text-xs font-semibold ${active ? 'bg-amber-500 text-black' : 'bg-black/40 text-amber-200/60'}`}>{children}</button>;
}

function Field({ label, value, onChange, type, onEnter }: { label: string; value: string; onChange: (value: string) => void; type: 'text' | 'password'; onEnter: () => void }) {
  return (
    <div className="mt-3">
      <label className="block text-amber-200/80 text-xs mb-1 tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter()}
        className="w-full px-3 py-2 rounded bg-black/60 border border-amber-900/50 text-amber-100 focus:outline-none focus:border-amber-500"
        autoComplete={type === 'password' ? 'current-password' : 'username'}
      />
    </div>
  );
}
