import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Radio, 
  Cpu, 
  Mic, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { WalletSummary } from '../../types';
import { apiClient } from '../../services/apiClient';

interface SettingsViewProps {
  summary: WalletSummary | null;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  summary,
  onRefresh
}) => {
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const handleResetDemo = async () => {
    if (!summary) return;
    try {
      await apiClient.resetDemoData(summary.wallet_address);
      setResetStatus('Demo transactions and audit logs reset successfully.');
      onRefresh();
      setTimeout(() => setResetStatus(null), 3000);
    } catch (e: any) {
      setResetStatus(`Reset error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-guardian-border pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-emerald-400" />
          <span>System & Network Settings</span>
        </h2>
        <p className="text-xs text-guardian-textSecondary mt-0.5">
          Environment configuration, RPC node endpoints, and local data controls.
        </p>
      </div>

      {resetStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{resetStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Network & Chain */}
        <div className="p-5 rounded-2xl bg-guardian-surface border border-guardian-border space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-1.5">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Blockchain Network</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-guardian-border">
              <span className="text-guardian-textMuted">Network Name:</span>
              <span className="text-white font-medium">Sepolia Testnet</span>
            </div>
            <div className="flex justify-between py-1 border-b border-guardian-border">
              <span className="text-guardian-textMuted">Chain ID:</span>
              <span className="font-mono text-white">11155111</span>
            </div>
            <div className="flex justify-between py-1 border-b border-guardian-border">
              <span className="text-guardian-textMuted">JSON-RPC Endpoint:</span>
              <span className="font-mono text-slate-300 truncate max-w-[200px]">https://rpc.sepolia.org</span>
            </div>
            <div className="flex justify-between py-1 border-b border-guardian-border">
              <span className="text-guardian-textMuted">Block Explorer:</span>
              <span className="font-mono text-slate-300">https://sepolia.etherscan.io</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-guardian-textMuted">Test Token (USDC):</span>
              <span className="font-mono text-emerald-400">0x1c7D...7238</span>
            </div>
          </div>
        </div>

        {/* AI & Speech Engine */}
        <div className="p-5 rounded-2xl bg-guardian-surface border border-guardian-border space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>AI & Speech Input Engine</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-guardian-border">
              <span className="text-guardian-textMuted">AI Mode:</span>
              <span className="text-amber-400 font-semibold">Deterministic Local Engine</span>
            </div>
            <div className="flex justify-between py-1 border-b border-guardian-border">
              <span className="text-guardian-textMuted">Structured Schema:</span>
              <span className="text-white">Active (Pydantic / TS Strict)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-guardian-border">
              <span className="text-guardian-textMuted">Web Speech Recognition:</span>
              <span className="text-emerald-400 font-medium">Web Speech API</span>
            </div>
            <div className="flex justify-between py-1 border-b border-guardian-border">
              <span className="text-guardian-textMuted">Android Native Voice:</span>
              <span className="text-emerald-400 font-medium">Capacitor Speech Integration</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-guardian-textMuted">Signing Authority:</span>
              <span className="text-emerald-400 font-bold">Isolated from AI (0% access)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy and Data Handling */}
      <div className="p-5 rounded-2xl bg-guardian-surface border border-guardian-border space-y-3 text-xs">
        <h3 className="text-sm font-semibold text-white flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Privacy & Security Notice</span>
        </h3>
        <p className="text-slate-300 text-xs leading-relaxed">
          Guardian Wallet is engineered under the principle of minimal data disclosure. Private keys and seed phrases are never stored on a server, never passed to language models, and never included in application logs or frontend builds. In accordance with competition guidelines, this prototype is demonstrated for educational and evaluation purposes on the Sepolia EVM testnet.
        </p>
      </div>

      {/* Reset Demo Data Button */}
      <div className="p-5 rounded-2xl bg-guardian-surface border border-guardian-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-white">Reset Demo Environment</h4>
          <p className="text-xs text-guardian-textMuted mt-0.5">
            Clear all local transactions, reset policy version to v1, and unpause the wallet.
          </p>
        </div>
        <button
          onClick={handleResetDemo}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 border border-guardian-border text-slate-300 hover:text-white hover:border-slate-600 font-semibold text-xs transition flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
};
