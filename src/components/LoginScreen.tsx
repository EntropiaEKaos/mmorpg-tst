import { useEffect, useState } from 'react';
import type { Account } from '../game/types';
import { VOCATIONS } from '../game/classes';
import { audio } from '../game/audio';
import VocationPortrait from './VocationPortrait';
import { translateGameText as tr } from '../i18n';
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
      vocation: 'knight',
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
        <div className="moria-panel moria-fade-up mx-auto w-full max-w-xl rounded-3xl p-7 sm:p-9">
          <div className="mb-6 flex items-start gap-4">
            <div className="moria-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl">🔐</div>
            <div>
              <div className="moria-eyebrow mb-1">{tr('Account recovery')}</div>
              <h2 className="moria-title text-2xl font-bold">{tr('Save your recovery code')}</h2>
            </div>
          </div>
          <p className="mb-5 text-sm leading-6 text-slate-300/75">
            {tr('This code is shown once. Store it somewhere private: anyone holding it can recover the account.')}
          </p>
          <div className="select-all break-all rounded-2xl border border-amber-300/25 bg-black/45 p-5 font-mono text-sm leading-6 text-amber-100 shadow-inner">
            {oneTimeRecoveryCode}
          </div>
          <button onClick={continueAfterRecovery} className="moria-button-primary mt-6 w-full rounded-xl py-3.5 text-sm font-black tracking-[0.16em]">
            {tr('I SAVED IT — CONTINUE')}
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <section className="hidden lg:block moria-fade-up">
          <div className="moria-eyebrow mb-5">{tr('Persistent online realm')}</div>
          <h1 className="moria-title max-w-xl text-5xl font-black leading-[1.02] xl:text-6xl">
            {tr('Enter a world built for')} <span className="text-amber-200">{tr('danger')}</span>{tr(', mastery and legend.')}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300/70">
            {tr("Mor'ia blends old-school MMO tension with a modern authoritative server, living progression and a world that grows with its players.")}
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            <Feature icon="⚔" title="Authoritative" subtitle="Server-owned combat" />
            <Feature icon="🌍" title="Persistent" subtitle="Characters & quests" />
            <Feature icon="✦" title="Evolving" subtitle="Live world content" />
          </div>
        </section>

        <section className="moria-panel moria-fade-up w-full rounded-3xl p-5 sm:p-7" style={{ animationDelay: '80ms' }}>
          <div className="mb-6 text-center">
            <div className="relative mx-auto mb-2 w-full max-w-[260px]">
              <div className="absolute inset-6 rounded-full bg-amber-200/10 blur-3xl" />
              <img src="/images/logo.png" alt="Mor'ia" className="relative mx-auto w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.75)]" />
            </div>
            <p className="moria-eyebrow">{tr('Realm of Shadows')}</p>
            <p className="mt-2 text-[11px] tracking-[0.16em] text-slate-400">{tr('SECURE ACCOUNT · AUTHORITATIVE WORLD')}</p>
          </div>

          {mode !== 'character' && (
            <div className="moria-card mb-5 grid grid-cols-3 gap-1 rounded-xl p-1">
              <Tab active={mode === 'login'} onClick={() => switchMode('login')}>LOGIN</Tab>
              <Tab active={mode === 'create'} onClick={() => switchMode('create')}>REGISTER</Tab>
              <Tab active={mode === 'recover'} onClick={() => switchMode('recover')}>RECOVER</Tab>
            </div>
          )}

          {mode === 'character' ? (
            <>
              <div className="mb-5">
                <div className="moria-eyebrow">{tr('New adventurer')}</div>
                <h2 className="moria-title mt-1 text-2xl font-bold">{tr('Create your character')}</h2>
                <p className="mt-1 text-xs text-slate-400">{tr('Signed in as ')}{serverAccount?.username}</p>
              </div>
              <Field label="CHARACTER NAME" value={charName} onChange={setCharName} type="text" onEnter={submit} autoComplete="off" />
              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-bold tracking-[0.18em] text-slate-400">{tr('VOCATION')}</label>
                <div className="moria-scrollbar grid max-h-[390px] grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {VOCATION_LIST.map(v => {
                    const active = vocation === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVocation(v.id)}
                        className={`relative min-h-[104px] rounded-xl border p-2.5 text-left transition-all ${active ? 'border-amber-200/55 bg-amber-200/10 shadow-[0_0_22px_rgba(229,196,119,0.08)]' : 'border-slate-500/15 bg-white/[0.025] hover:border-slate-400/30 hover:bg-white/[0.045]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <VocationPortrait id={v.id} color={v.color} active={active} />
                          <div className="min-w-0">
                            <div className={`truncate text-xs font-bold ${active ? 'text-amber-100' : 'text-slate-200'}`}>{tr(v.name)}</div>
                            <div className="mt-1 text-[9px] tracking-wider text-slate-500">{active ? tr('SELECTED') : tr('CHOOSE')}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <Field label="ACCOUNT NAME" value={username} onChange={setUsername} type="text" onEnter={submit} autoComplete="username" />
              {mode === 'recover' ? (
                <>
                  <Field label="RECOVERY CODE" value={recoveryCode} onChange={setRecoveryCode} type="text" onEnter={submit} autoComplete="off" />
                  <Field label="NEW PASSWORD" value={newPassword} onChange={setNewPassword} type="password" onEnter={submit} autoComplete="new-password" />
                </>
              ) : (
                <Field label="PASSWORD" value={password} onChange={setPassword} type="password" onEnter={submit} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} />
              )}
            </>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/8 px-3 py-2.5 text-center text-xs text-rose-200">
              <span className="mr-1.5">⚠</span>{tr(error)}
            </div>
          )}
          {status && (
            <div aria-live="polite" className="mt-4 rounded-xl border border-sky-300/15 bg-sky-400/7 px-3 py-2.5 text-center text-xs text-sky-100/80">
              <span className="mr-1.5 inline-block moria-soft-pulse">✦</span>{tr(status)}
            </div>
          )}

          <button onClick={submit} className="moria-button-primary mt-5 w-full rounded-xl py-3.5 text-sm font-black tracking-[0.14em]">
            {tr(mode === 'login' ? "ENTER MOR'IA" : mode === 'create' ? 'CREATE ACCOUNT' : mode === 'recover' ? 'RESET PASSWORD' : 'CREATE HERO')}
          </button>

          {mode === 'login' && (
            <button onClick={handleDemoLogin} className="moria-button mt-2.5 w-full rounded-xl py-2.5 text-xs font-semibold tracking-wide text-slate-300">
              {tr('▶ OFFLINE QUICK PLAY')}
            </button>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
            {tr('Passwords are hashed server-side and never stored in browser account lists.')}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#05070c] p-4 sm:p-7">
      <div className="absolute inset-0 scale-[1.035] bg-cover bg-center" style={{ backgroundImage: 'url(/images/login-bg.jpg)' }} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,9,0.96)_0%,rgba(4,7,12,0.80)_45%,rgba(4,6,10,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(110,168,255,0.16),transparent_28%),radial-gradient(circle_at_80%_72%,rgba(229,196,119,0.13),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}

function Feature({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="moria-card rounded-2xl p-3.5">
      <div className="text-xl">{icon}</div>
      <div className="mt-2 text-xs font-bold text-slate-100">{tr(title)}</div>
      <div className="mt-1 text-[10px] leading-4 text-slate-400">{tr(subtitle)}</div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg py-2.5 text-[10px] font-black tracking-[0.14em] transition-all ${active ? 'bg-white/[0.08] text-amber-100 shadow-inner' : 'text-slate-500 hover:bg-white/[0.035] hover:text-slate-300'}`}
    >
      {typeof children === 'string' ? tr(children) : children}
    </button>
  );
}

function Field({ label, value, onChange, type, onEnter, autoComplete }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: 'text' | 'password';
  onEnter: () => void;
  autoComplete: string;
}) {
  return (
    <div className="mt-3.5">
      <label className="mb-1.5 block text-[10px] font-bold tracking-[0.18em] text-slate-400">{tr(label)}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter()}
        className="moria-input w-full rounded-xl px-3.5 py-3 text-sm placeholder:text-slate-600 focus:outline-none"
        autoComplete={autoComplete}
      />
    </div>
  );
}
