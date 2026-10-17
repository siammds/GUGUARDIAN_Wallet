import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  FileText, 
  AlertOctagon, 
  CheckCircle2, 
  XCircle,
  Shield
} from 'lucide-react';
import { WalletSummary, AuditEvent } from '../../types';
import { apiClient } from '../../services/apiClient';

interface SecurityAuditViewProps {
  summary: WalletSummary | null;
  onRefresh: () => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  summary,
  onRefresh
}) => {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (summary) {
      apiClient.getAuditTrail(summary.wallet_address).then(events => {
        setAuditEvents(events);
        setIsLoading(false);
      });
    }
  }, [summary]);

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="border-b border-guardian-border pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span>Security & Audit Center</span>
        </h2>
        <p className="text-xs text-guardian-textSecondary mt-0.5">
          Auditable decision trail, cryptographic boundary disclosures, and system event logs.
        </p>
      </div>

      {/* Security Architecture & Limitations Card */}
      <div className="p-5 rounded-2xl bg-guardian-surface border border-guardian-border space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center space-x-1.5">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Security Boundary & Architectural Guarantees</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-guardian-border/70 space-y-1">
            <span className="font-semibold text-emerald-400 block">Separation of AI from Signing:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              The AI LLM never has access to private keys or signing capabilities. It only interprets natural language into structured parameter proposals.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-guardian-border/70 space-y-1">
            <span className="font-semibold text-emerald-400 block">Deterministic Policy Enforcement:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Every proposal is validated against spending caps, allowlists, and reserve minimums by a deterministic engine prior to transaction assembly.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-guardian-border/70 space-y-1">
            <span className="font-semibold text-amber-400 block">Emergency Control Scope:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Emergency pause suspends autonomous proposal execution. It cannot revoke already confirmed on-chain transactions or bypass public blockchain finality.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-guardian-border/70 space-y-1">
            <span className="font-semibold text-blue-400 block">Independent Receipt Verification:</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              A transaction is only marked as verified when its mined block receipt confirms a matching ERC-20 Transfer event for the intended recipient and amount.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Event Trail */}
      <div className="p-5 rounded-2xl bg-guardian-surface border border-guardian-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Application Audit Trail</span>
          </h3>
          <span className="text-[10px] text-guardian-textMuted">Persisted to SQLite database</span>
        </div>

        {isLoading ? (
          <div className="text-center py-6 text-xs text-guardian-textMuted">Loading audit logs...</div>
        ) : auditEvents.length === 0 ? (
          <div className="text-center py-6 text-xs text-guardian-textMuted">No audit events recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {auditEvents.map(evt => (
              <div
                key={evt.event_id}
                className="p-3 rounded-xl bg-slate-900/60 border border-guardian-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {evt.decision === 'ALLOW' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-white flex items-center space-x-2 flex-wrap gap-y-0.5">
                      <span className="truncate">{evt.event_type}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        {evt.reason_code}
                      </span>
                    </div>
                    <div className="text-[11px] text-guardian-textMuted font-mono mt-0.5 truncate">
                      Req ID: {evt.request_identifier}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] text-guardian-textMuted self-end sm:self-auto flex-shrink-0 font-mono">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
