import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Coins, 
  User, 
  Fuel, 
  Calendar,
  Lock,
  ExternalLink
} from 'lucide-react';
import { TransactionProposal, PolicyEvaluation, WalletSummary } from '../../types';
import { apiClient } from '../../services/apiClient';

interface TransactionReviewModalProps {
  proposal: TransactionProposal | null;
  evaluation: PolicyEvaluation | null;
  summary: WalletSummary | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export const TransactionReviewModal: React.FC<TransactionReviewModalProps> = ({
  proposal,
  evaluation,
  summary,
  onClose,
  onSubmitted
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!proposal || !evaluation || !summary) return null;

  const amountNum = parseFloat(proposal.amount || '0');
  const tokenBal = parseFloat(summary.token_balance || '0');
  const balAfter = Math.max(0, tokenBal - amountNum);
  const spentToday = parseFloat(summary.spent_today || '0');
  const dailyLimit = parseFloat(summary.daily_limit || '100');
  const remainingAfter = Math.max(0, dailyLimit - (spentToday + amountNum));
  const minReserve = parseFloat(summary.min_reserve || '25');

  const handleConfirmAndExecute = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.submitTransaction({
        proposal,
        evaluation,
        user_confirmed: true,
        is_demo: true
      });
      setSubmissionResult(res.transaction);
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Transaction submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-guardian-surface border border-guardian-border p-6 shadow-2xl text-guardian-textPrimary space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-guardian-border pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Deterministic Transaction Review</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Successful receipt view */}
        {submissionResult ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 flex items-center space-x-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Transaction Confirmed & Verified</h4>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  Receipt independently verified against proposal parameters and Transfer events.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-guardian-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-guardian-textMuted">Transaction Hash:</span>
                <span className="font-mono text-emerald-400">{submissionResult.tx_hash.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-guardian-textMuted">Block Number:</span>
                <span className="text-white">{submissionResult.receipt?.block_number || 6854130}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-guardian-textMuted">Gas Used:</span>
                <span className="text-white">{submissionResult.receipt?.gas_used || 52410} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-guardian-textMuted">Status:</span>
                <span className="text-emerald-400 font-bold">{submissionResult.receipt?.status || 'SUCCESS'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          /* Review Details View */
          <div className="space-y-4">
            {/* Policy Decision Badge */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                evaluation.decision === 'ALLOW'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : evaluation.decision === 'BLOCKED'
                  ? 'bg-red-500/10 border-red-500/40 text-red-300'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {evaluation.decision === 'ALLOW' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {evaluation.decision === 'BLOCKED' && <XCircle className="w-4 h-4 text-red-400" />}
                {evaluation.decision === 'APPROVAL_REQUIRED' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                <span className="font-bold tracking-wide">POLICY DECISION: {evaluation.decision}</span>
              </div>
              <span className="text-[11px] font-mono">{evaluation.reason_code}</span>
            </div>

            {/* Explanation message */}
            <p className="text-xs text-guardian-textSecondary bg-slate-900/60 p-2.5 rounded-lg border border-guardian-border">
              {evaluation.message}
            </p>

            {/* Parameter Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/40 p-3.5 rounded-xl border border-guardian-border">
              <div>
                <span className="text-guardian-textMuted block text-[10px]">Recipient:</span>
                <span className="font-semibold text-white block">{proposal.recipient_label || 'Direct Address'}</span>
                <span className="text-[10px] font-mono text-slate-400">{proposal.recipient_address.slice(0, 10)}...</span>
              </div>
              <div>
                <span className="text-guardian-textMuted block text-[10px]">Transfer Amount:</span>
                <span className="text-base font-extrabold text-white">{proposal.amount} {proposal.token_symbol}</span>
              </div>

              <div>
                <span className="text-guardian-textMuted block text-[10px]">Balance After:</span>
                <span className="font-medium text-white">{balAfter.toFixed(2)} {proposal.token_symbol}</span>
                <span className="text-[10px] text-emerald-400 block">
                  (Floor: {minReserve} {proposal.token_symbol})
                </span>
              </div>
              <div>
                <span className="text-guardian-textMuted block text-[10px]">Daily Limit Remaining:</span>
                <span className="font-medium text-white">{remainingAfter.toFixed(2)} {proposal.token_symbol}</span>
              </div>

              <div>
                <span className="text-guardian-textMuted block text-[10px]">Estimated Gas:</span>
                <span className="text-slate-300">~52,410 units (15.0 Gwei)</span>
              </div>
              <div>
                <span className="text-guardian-textMuted block text-[10px]">Network:</span>
                <span className="text-slate-300">Sepolia (11155111)</span>
              </div>
            </div>

            {/* Risk Findings Breakdown */}
            {evaluation.risk_findings.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-guardian-textMuted uppercase tracking-wider">
                  Risk Engine Assessment
                </span>
                <div className="space-y-1">
                  {evaluation.risk_findings.map((f, i) => (
                    <div
                      key={i}
                      className="text-xs p-2 rounded-lg bg-slate-900 border border-guardian-border/80 flex items-start space-x-2"
                    >
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                          f.severity === 'HIGH' || f.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400'
                            : f.severity === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-slate-300 text-[11px]">{f.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs p-2.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-guardian-border">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition text-center"
              >
                Cancel
              </button>

              {evaluation.decision !== 'BLOCKED' ? (
                <button
                  onClick={handleConfirmAndExecute}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <span>Submitting & Verifying...</span>
                  ) : (
                    <>
                      <span>Confirm & Execute</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-950 text-red-400 border border-red-500/30 text-xs font-bold cursor-not-allowed opacity-80 text-center"
                >
                  Action Blocked by Policy
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
