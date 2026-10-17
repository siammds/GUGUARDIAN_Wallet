import React from 'react';
import { Shield, Sparkles, Mic, Lock, ArrowRight, Radio } from 'lucide-react';

interface WelcomeModalProps {
  onEnterDemo: () => void;
  onConnectWallet: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  onEnterDemo,
  onConnectWallet
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b1322]/95 border border-cyan-500/30 p-5 sm:p-7 shadow-[0_0_50px_rgba(0,210,255,0.15)] text-slate-100 space-y-5 my-auto max-h-[94vh] overflow-y-auto">
        {/* Brand */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          <div className="inline-flex p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400 mb-1 shadow-[0_0_15px_rgba(0,210,255,0.3)]">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Guardian Wallet</h2>
          <p className="text-xs sm:text-sm font-semibold text-emerald-400">
            Your AI can act. Your rules stay in control.
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 max-w-md mx-auto pt-1 leading-relaxed">
            FinTechathon 2026 Prototype — Topic F: Agent Wallet / Autonomous On-Chain Wallet.
            AI autonomy strictly bounded by independent financial permissions.
          </p>
        </div>

        {/* Feature pillars */}
        <div className="space-y-2 text-xs">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-white">Autonomous Agent Proposal Pipeline:</span>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Generates validated transaction proposals and verifies parameters prior to execution.
              </p>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-white">Deterministic Policy Engine:</span>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Enforces spending caps, token allowlists, and protected reserve thresholds.
              </p>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2.5">
            <Radio className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-white">Sepolia Testnet & Verifiable Receipts:</span>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Configured for Sepolia EVM testnet with verified on-chain transfer event topics.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onEnterDemo}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(0,245,160,0.3)]"
          >
            <span>Enter Demo Mode (Instant, Zero Keys Needed)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onConnectWallet}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 text-slate-300 font-semibold text-xs hover:bg-slate-700 hover:text-white border border-slate-700 transition flex items-center justify-center space-x-1.5"
          >
            <span>Connect Web3 Wallet (Sepolia Testnet)</span>
          </button>
        </div>

        {/* Security Notice */}
        <div className="text-[10px] sm:text-[11px] text-slate-500 text-center">
          Notice: Never exposes private keys to LLMs. Unaudited research prototype.
        </div>
      </div>
    </div>
  );
};
