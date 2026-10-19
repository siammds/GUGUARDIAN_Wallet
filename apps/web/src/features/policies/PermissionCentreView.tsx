import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Coins, 
  UserCheck, 
  AlertOctagon, 
  Fuel, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertTriangle,
  Search
} from 'lucide-react';
import { WalletSummary, AgentTier, RecipientEntry, PolicyConfig } from '../../types';
import { apiClient } from '../../services/apiClient';

interface PermissionCentreViewProps {
  summary: WalletSummary | null;
  onRefresh: () => void;
}

export const PermissionCentreView: React.FC<PermissionCentreViewProps> = ({
  summary,
  onRefresh
}) => {
  if (!summary) return null;

  const [agentTier, setAgentTier] = useState<AgentTier>(summary.agent_tier);
  const [maxTransfer, setMaxTransfer] = useState(summary.max_transfer_amount);
  const [dailyLimit, setDailyLimit] = useState(summary.daily_limit);
  const [minReserve, setMinReserve] = useState(summary.min_reserve);
  const [maxGas, setMaxGas] = useState(summary.gas_price_gwei || '50.0');
  const [isPaused, setIsPaused] = useState(summary.is_paused);

  const [recipients, setRecipients] = useState<RecipientEntry[]>(
    summary.approved_recipients || []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [newRecipientLabel, setNewRecipientLabel] = useState('');
  const [newRecipientAddress, setNewRecipientAddress] = useState('');

  const [userConfirmed, setUserConfirmed] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddRecipient = () => {
    if (!newRecipientAddress.startsWith('0x') || newRecipientAddress.length !== 42) {
      setStatusMsg({ type: 'error', text: 'Recipient must be a valid 42-character 0x address.' });
      return;
    }
    const label = newRecipientLabel.trim() || 'Custom Contact';
    setRecipients(prev => [...prev, { address: newRecipientAddress, label, is_approved: true }]);
    setNewRecipientAddress('');
    setNewRecipientLabel('');
    setStatusMsg({ type: 'success', text: `Added ${label} to approved allowlist.` });
  };

  const handleRemoveRecipient = (addr: string) => {
    setRecipients(prev => prev.filter(r => r.address.toLowerCase() !== addr.toLowerCase()));
  };

  const handleSavePolicy = async () => {
    if (!userConfirmed) {
      setStatusMsg({ type: 'error', text: 'You must check the confirmation box to authorize elevated policy updates.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);

    const updatedConfig: PolicyConfig = {
      wallet_address: summary.wallet_address,
      policy_version: summary.policy_version,
      agent_tier: agentTier,
      chain_id: summary.chain_id,
      allowed_tokens: [summary.token_address, '0x0000000000000000000000000000000000000000'],
      approved_recipients: recipients,
      max_transfer_amount: maxTransfer,
      daily_spending_limit: dailyLimit,
      min_reserve_amount: minReserve,
      max_gas_gwei: maxGas,
      is_paused: isPaused,
      require_approval_for_policy_change: true
    };

    try {
      const res = await apiClient.updatePolicy(summary.wallet_address, updatedConfig, true);
      setStatusMsg({ type: 'success', text: 'Policy parameters updated successfully. Stale authorizations invalidated.' });
      setUserConfirmed(false);
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update policy.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEmergencyPause = async () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    try {
      await apiClient.togglePause(summary.wallet_address, nextState);
      setStatusMsg({
        type: 'success',
        text: nextState
          ? 'Emergency pause activated! All autonomous agent actions are blocked.'
          : 'Emergency pause lifted. Autonomous actions resumed under configured policy.'
      });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to toggle pause.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-guardian-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <span>Financial Permission Centre</span>
          </h2>
          <p className="text-xs text-guardian-textSecondary mt-0.5">
            Configure hard deterministic boundaries for AI autonomy. The AI cannot grant itself additional authority.
          </p>
        </div>

        {/* Emergency Pause Toggle */}
        <button
          onClick={handleToggleEmergencyPause}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            isPaused
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>{isPaused ? 'Resume Autonomous Actions' : 'Emergency Pause All'}</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border border-red-500/40 text-red-300'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Grid: 3 Permission Columns / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tier Selector */}
        <div className="p-5 rounded-2xl bg-guardian-surface border border-guardian-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Agent Operating Tier</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Active: {agentTier}
            </span>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'OBSERVE' as AgentTier,
                name: 'Tier 1: Observe Only',
                desc: 'Read balances, inspect history, evaluate hypotheticals. Zero transfer or approval authority.'
              },
              {
                id: 'LIMITED_AUTONOMY' as AgentTier,
                name: 'Tier 2: Limited Autonomy',
                desc: 'Autonomous transfers allowed only within spending caps, allowlists, and reserve limits.'
              },
              {
                id: 'HUMAN_APPROVAL' as AgentTier,
                name: 'Tier 3: Human Approval',
                desc: 'Every proposal requires explicit user signature confirmation regardless of amount.'
              }
            ].map(tier => (
              <label
                key={tier.id}
                className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                  agentTier === tier.id
                    ? 'bg-slate-900 border-emerald-500/50 text-white shadow-sm'
                    : 'bg-slate-900/40 border-guardian-border text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="agent_tier"
                  value={tier.id}
                  checked={agentTier === tier.id}
                  onChange={() => setAgentTier(tier.id)}
                  className="mt-1 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">{tier.name}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{tier.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Financial Limits */}
        <div className="p-5 rounded-2xl bg-guardian-surface border border-guardian-border space-y-4">
          <h3 className="text-sm font-semibold text-white">Deterministic Financial Caps</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-guardian-textMuted block text-[11px] mb-1">
                Maximum Single Transfer Cap (USDC):
              </label>
              <input
                type="number"
                value={maxTransfer}
                onChange={e => setMaxTransfer(e.target.value)}
                className="w-full bg-slate-900 border border-guardian-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-guardian-textMuted mt-0.5 block">
                Any transfer above this amount is blocked in Tier 2.
              </span>
            </div>

            <div>
              <label className="text-guardian-textMuted block text-[11px] mb-1">
                Daily Spending Limit (USDC):
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={e => setDailyLimit(e.target.value)}
                className="w-full bg-slate-900 border border-guardian-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-guardian-textMuted mt-0.5 block">
                Total cumulative transfers permitted per 24 hours.
              </span>
            </div>

            <div>
              <label className="text-guardian-textMuted block text-[11px] mb-1">
                Protected Floor Reserve (USDC):
              </label>
              <input
                type="number"
                value={minReserve}
                onChange={e => setMinReserve(e.target.value)}
                className="w-full bg-slate-900 border border-guardian-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-guardian-textMuted mt-0.5 block">
                Balance cannot drop below this minimum.
              </span>
            </div>

            <div>
              <label className="text-guardian-textMuted block text-[11px] mb-1">
                Max Gas Price Ceiling (Gwei):
              </label>
              <input
                type="number"
                value={maxGas}
                onChange={e => setMaxGas(e.target.value)}
                className="w-full bg-slate-900 border border-guardian-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Approved Recipient Allowlist */}
      <div className="p-5 rounded-2xl bg-guardian-surface border border-guardian-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Approved Counterparty Allowlist</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {recipients.filter(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()) || r.address.toLowerCase().includes(searchQuery.toLowerCase())).length} Active
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search counterparties..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-guardian-border rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Existing recipients */}
        <div className="space-y-2">
          {recipients
            .filter(rec => rec.label.toLowerCase().includes(searchQuery.toLowerCase()) || rec.address.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((rec) => (
            <div
              key={rec.address}
              className="p-3 rounded-xl bg-slate-900 border border-guardian-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-cyan-500/30 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white truncate">{rec.label}</div>
                <div className="font-mono text-slate-400 text-[10px] sm:text-[11px] break-all select-all">{rec.address}</div>
              </div>
              <button
                onClick={() => handleRemoveRecipient(rec.address)}
                title="Remove recipient"
                className="p-1.5 rounded text-slate-500 hover:text-red-400 transition self-end sm:self-center flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {recipients.filter(rec => rec.label.toLowerCase().includes(searchQuery.toLowerCase()) || rec.address.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 font-mono">
              No approved counterparties matching '{searchQuery}'
            </div>
          )}
        </div>

        {/* Add new recipient */}
        <div className="pt-2 border-t border-guardian-border flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Label (e.g. Approved Supplier)"
            value={newRecipientLabel}
            onChange={e => setNewRecipientLabel(e.target.value)}
            className="sm:w-1/3 bg-slate-900 border border-guardian-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            placeholder="0x Ethereum Address (42 chars)"
            value={newRecipientAddress}
            onChange={e => setNewRecipientAddress(e.target.value)}
            className="flex-1 bg-slate-900 border border-guardian-border rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 min-w-0"
          />
          <button
            onClick={handleAddRecipient}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700 transition flex items-center justify-center space-x-1 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Confirmation & Save Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-guardian-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={userConfirmed}
            onChange={e => setUserConfirmed(e.target.checked)}
            className="rounded text-emerald-500 focus:ring-emerald-500"
          />
          <span>I explicitly confirm and authorize these policy updates.</span>
        </label>

        <button
          onClick={handleSavePolicy}
          disabled={!userConfirmed || isSaving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center space-x-1.5"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Updating...' : 'Save & Invalidate Stale Auth'}</span>
        </button>
      </div>
    </div>
  );
};
