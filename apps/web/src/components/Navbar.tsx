import React from 'react';
import { Shield, Radio, AlertOctagon, CheckCircle2, Copy } from 'lucide-react';
import { WalletSummary } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  summary: WalletSummary | null;
  isDemo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  summary,
  isDemo
}) => {
  const [copied, setCopied] = React.useState(false);

  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (summary?.wallet_address) {
      navigator.clipboard.writeText(summary.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'assistant', label: 'AI Console' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'activity', label: 'Activity' },
    { id: 'security', label: 'Security & Audit' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#070b13]/90 backdrop-blur-lg shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand */}
          <div 
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer min-w-0" 
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 flex-shrink-0 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight truncate">
                  Guardian Wallet
                </span>
                {isDemo && (
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Demo
                  </span>
                )}
                {summary?.is_paused && (
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 flex items-center">
                    <AlertOctagon className="w-3 h-3 mr-0.5 inline" /> PAUSED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                Your AI can act. Your rules stay in control.
              </p>
            </div>
          </div>

          {/* Network & Account Info */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs text-slate-300 font-mono">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Sepolia Testnet</span>
            </div>

            {summary && (
              <button
                onClick={copyAddress}
                title="Click to copy address"
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 text-xs text-slate-200 hover:text-white transition font-mono shadow-[0_0_10px_rgba(0,210,255,0.08)]"
              >
                <span>{shortenAddress(summary.wallet_address)}</span>
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300 flex-shrink-0" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation tabs with horizontal smooth scroll on mobile */}
        <div className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-none border-t border-slate-800/80 text-xs sm:text-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
                currentTab === item.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,210,255,0.2)] font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
