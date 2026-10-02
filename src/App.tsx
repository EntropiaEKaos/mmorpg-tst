import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import GameScreen from './components/GameScreen';
import GlobalTooltipRenderer from './components/Tooltip';
import LocaleBridge, { LocaleToggle } from './components/LocaleBridge';
import { IsoNextPrototype } from './game/iso-next/IsoNextPrototype';
import { t } from './i18n';
import type { Account } from './game/types';
import { logoutSession, resumeSession } from './game/auth';
import { dpsMeter } from './game/dpsMeter';

dpsMeter.start();

export default function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const legacy = window.location.pathname === '/legacy' || new URLSearchParams(window.location.search).get('legacy') === '1';

  useEffect(() => {
    let cancelled = false;
    localStorage.removeItem('tibia_accounts');
    localStorage.removeItem('tibia_current');
    resumeSession()
      .then(acc => { if (!cancelled && acc) setAccount(acc); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    const token = (account as any)?.sessionToken as string | undefined;
    void logoutSession(token);
    setAccount(null);
  };

  if (loading) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-black text-amber-400"><div className="text-xl tracking-widest animate-pulse" style={{ fontFamily: 'serif' }}>{t("VALIDATING MOR'IA SESSION...")}</div></div>;
  }

  if (!account) {
    return <><LocaleBridge/><LocaleToggle/><LoginScreen onLogin={setAccount}/><GlobalTooltipRenderer/></>;
  }

  return <><LocaleBridge/>{legacy ? <GameScreen account={account} onLogout={handleLogout}/> : <IsoNextPrototype account={account} onLogout={handleLogout}/>}<GlobalTooltipRenderer/></>;
}
