import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import GameScreen from './components/GameScreen';
import GlobalTooltipRenderer from './components/Tooltip';
import type { Account } from './game/types';

// Start DPS meter on game load
try {
  const { dpsMeter } = require('./game/dpsMeter');
  dpsMeter.start();
} catch { /* ignore */ }

export default function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try auto-login
    const current = localStorage.getItem('tibia_current');
    if (current) {
      const accounts: Account[] = JSON.parse(
        localStorage.getItem('tibia_accounts') || '[]'
      );
      const acc = accounts.find((a) => a.username === current);
      if (acc) {
        setAccount(acc);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tibia_current');
    setAccount(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-amber-400">
        <div className="text-xl tracking-widest animate-pulse" style={{ fontFamily: 'serif' }}>LOADING MOR'IA...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <>
        <LoginScreen onLogin={setAccount} />
        <GlobalTooltipRenderer />
      </>
    );
  }

  return (
    <>
      <GameScreen account={account} onLogout={handleLogout} />
      <GlobalTooltipRenderer />
    </>
  );
}
