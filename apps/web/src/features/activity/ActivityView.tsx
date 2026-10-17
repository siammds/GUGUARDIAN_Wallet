import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  Filter, 
  History,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { TransactionRecord } from '../../types';
import { ReceiptInspectorModal } from '../wallet/ReceiptInspectorModal';

interface ActivityViewProps {
  transactions: TransactionRecord[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'BLOCKED' | 'REVERTED'>('ALL');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<TransactionRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filtered = transactions.filter(tx => {
    if (filter === 'ALL') return true;
    return tx.state === filter;
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-guardian-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Activity & Cryptographic Ledger</span>
          </h2>
          <p className="text-xs text-guardian-textSecondary mt-0.5">
            Full audit log of permitted on-chain executions with verifiable hashes and policy-blocked attempts.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
          {(['ALL', 'CONFIRMED', 'BLOCKED', 'REVERTED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === tab
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-guardian-surface text-slate-400 hover:text-white border border-guardian-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-guardian-surface border border-guardian-border text-guardian-textMuted text-xs font-mono">
          No transactions found under filter '{filter}'.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => {
            const hash = tx.tx_hash || '';
            const shortHash = hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : null;

            return (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-[#090e17] border border-slate-800 space-y-3 hover:border-cyan-500/30 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="mt-0.5 flex-shrink-0">
                      {tx.state === 'CONFIRMED' && (
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      {tx.state === 'BLOCKED' && (
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-5 h-5" />
                        </div>
                      )}
                      {tx.state === 'REVERTED' && (
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-semibold text-sm text-white truncate max-w-[200px] sm:max-w-none">
                          Transfer to {tx.recipient_label || `${tx.recipient_address.slice(0, 8)}...`}
                        </span>
                        {tx.is_demo && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-guardian-textMuted mt-0.5 font-mono truncate select-all">
                        {tx.recipient_address}
                      </div>
                      {shortHash && (
                        <div className="flex items-center space-x-1.5 font-mono text-[11px] text-cyan-400 mt-1 flex-wrap">
                          <span>Hash:</span>
                          <span className="text-slate-300 select-all">{shortHash}</span>
                          <button
                            onClick={() => handleCopyHash(hash)}
                            title="Copy full 66-character hash"
                            className="text-slate-500 hover:text-white transition p-0.5"
                          >
                            {copiedHash === hash ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right flex sm:flex-col justify-between items-baseline sm:items-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="text-sm font-bold text-white font-mono">
                      {tx.amount} {tx.token_symbol}
                    </div>
                    <div className="text-[10px] text-guardian-textMuted mt-0.5 font-mono">
                      {new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>

                {/* Status & verification notes */}
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                        tx.state === 'CONFIRMED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : tx.state === 'BLOCKED'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {tx.state} • {tx.reason_code}
                    </span>

                    {tx.rejection_reason && (
                      <span className="text-[11px] text-red-300 break-words">
                        Reason: {tx.rejection_reason}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2.5 self-start sm:self-auto flex-wrap gap-y-1">
                    {tx.tx_hash && (
                      <>
                        <button
                          onClick={() => setSelectedTxForReceipt(tx)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] flex items-center space-x-1 transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Verify Receipt</span>
                        </button>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono text-[11px] px-2 py-1"
                        >
                          <span>Etherscan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cryptographic Receipt Inspector Modal */}
      {selectedTxForReceipt && (
        <ReceiptInspectorModal
          transaction={selectedTxForReceipt}
          onClose={() => setSelectedTxForReceipt(null)}
        />
      )}
    </div>
  );
};
