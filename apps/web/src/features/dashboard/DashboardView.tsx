import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  Lock, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  Sliders, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  Radio
} from 'lucide-react';
import { 
  WalletSummary, 
  TransactionRecord, 
  TransactionProposal, 
  PolicyEvaluation 
} from '../../types';
import { apiClient, DIVERSE_ENTITIES } from '../../services/apiClient';
import { useSpeechRecognition } from '../voice/useSpeechRecognition';
import { ReceiptInspectorModal } from '../wallet/ReceiptInspectorModal';

interface DashboardViewProps {
  summary: WalletSummary | null;
  recentActivity: TransactionRecord[];
  onNavigate: (tab: string) => void;
  onQuickCommand?: (cmd: string) => void;
  onRefresh?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  recentActivity,
  onNavigate,
  onRefresh
}) => {
  // Agent Chat & Voice State
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentStep, setAgentStep] = useState<string | null>(null);
  const [activeProposal, setActiveProposal] = useState<TransactionProposal | null>(null);
  const [activeEvaluation, setActiveEvaluation] = useState<PolicyEvaluation | null>(null);
  const [agentFeedback, setAgentFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Inspector Modal State
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<TransactionRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Payees Directory Filter
  const [payeeFilter, setPayeeFilter] = useState<string>('all');

  // Interactive Policy Adjustment Sliders
  const [interactiveCap, setInteractiveCap] = useState<number>(50);
  const [interactiveReserve, setInteractiveReserve] = useState<number>(25);
  const [isUpdatingPolicy, setIsUpdatingPolicy] = useState(false);
  const [policyUpdateSuccess, setPolicyUpdateSuccess] = useState(false);

  // Voice Recognition
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (summary) {
      setInteractiveCap(parseFloat(summary.max_transfer_amount || '50'));
      setInteractiveReserve(parseFloat(summary.min_reserve || '25'));
    }
  }, [summary]);

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const spentToday = parseFloat(summary.spent_today || '0');
  const dailyLimit = parseFloat(summary.daily_limit || '100');
  const remainingAllowance = Math.max(0, dailyLimit - spentToday);
  const spendingPercent = Math.min(100, Math.round((spentToday / dailyLimit) * 100));
  const tokenBal = parseFloat(summary.token_balance || '100');
  const minReserve = parseFloat(summary.min_reserve || '25');

  // Agent Intent Dispatch Handler
  const handleDispatch = async (textToRun?: string) => {
    const text = (textToRun || inputText).trim();
    if (!text) return;

    setIsProcessing(true);
    setAgentStep('1. Interpreting Natural Language Intent...');
    setActiveProposal(null);
    setActiveEvaluation(null);
    setAgentFeedback(null);
    setIsSuccess(false);

    try {
      const intentRes = await apiClient.parseIntent(text, summary.wallet_address);
      
      if (intentRes.intent_type === 'emergency_pause') {
        setAgentStep('2. Enforcing Emergency Pause Lock...');
        await apiClient.togglePause(summary.wallet_address, !summary.is_paused);
        setAgentFeedback(summary.is_paused ? 'Wallet unpaused successfully.' : 'Emergency pause triggered. All autonomous transactions locked.');
        if (onRefresh) onRefresh();
        setIsProcessing(false);
        setAgentStep(null);
        return;
      }

      if (intentRes.intent_type === 'query_spending_allowance') {
        setAgentFeedback(`Allowance Status: You have spent $${summary.spent_today} today. Remaining daily headroom: $${remainingAllowance.toFixed(2)} USDC (Limit: $${summary.daily_limit} USDC). Single transfer cap: $${summary.max_transfer_amount} USDC.`);
        setIsProcessing(false);
        setAgentStep(null);
        return;
      }

      if (intentRes.intent_type === 'read_balance') {
        setAgentFeedback(`Portfolio Balance: $${summary.token_balance} USDC • ${summary.native_balance} ${summary.native_symbol} (Sepolia Testnet). Protected Reserve Floor: $${summary.min_reserve} USDC.`);
        setIsProcessing(false);
        setAgentStep(null);
        return;
      }

      if (intentRes.intent_type === 'unauthorized_policy_change') {
        setAgentFeedback(intentRes.clarification_question || 'SECURITY RESTRICTION: AI agents cannot alter financial policies.');
        setIsProcessing(false);
        setAgentStep(null);
        return;
      }

      if (intentRes.intent_type === 'unsupported' || intentRes.requires_clarification) {
        setAgentFeedback(intentRes.clarification_question || 'I could not recognize that action. Try: "Pay 20 USDC to AWS Cloud" or "Check balance"');
        setIsProcessing(false);
        setAgentStep(null);
        return;
      }

      if (intentRes.intent_type === 'transfer') {
        setAgentStep('2. Evaluating Deterministic Policy Engine (Allowlist, Single Cap, Daily Limit, Reserve)...');
        
        const { proposal, evaluation } = await apiClient.prepareTransaction({
          wallet_address: summary.wallet_address,
          token_address: intentRes.token_address || summary.token_address,
          token_symbol: intentRes.token_symbol || summary.token_symbol,
          recipient_address: intentRes.recipient_address,
          recipient_label: intentRes.recipient_label,
          amount: intentRes.amount,
          chain_id: summary.chain_id
        });

        setActiveProposal(proposal);
        setActiveEvaluation(evaluation);
        setAgentStep('3. Policy Evaluation Complete.');

        if (evaluation.decision === 'BLOCKED') {
          setAgentFeedback(`Action Blocked by Policy Guard: ${evaluation.message}`);
        } else if (evaluation.decision === 'APPROVAL_REQUIRED') {
          setAgentFeedback(`Human Approval Required: ${evaluation.message}`);
        } else {
          setAgentFeedback(`Transfer of ${proposal.amount} ${proposal.token_symbol} to ${proposal.recipient_label} is approved by policy.`);
        }
      }
    } catch (err: any) {
      setAgentFeedback(`Execution Error: ${err.message || 'Failed to process request.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteProposal = async () => {
    if (!activeProposal || !activeEvaluation) return;
    setIsProcessing(true);
    setAgentStep('Executing Transaction & Requesting Cryptographic Receipt...');

    try {
      const res = await apiClient.submitTransaction({
        proposal: activeProposal,
        evaluation: activeEvaluation,
        user_confirmed: true,
        is_demo: true
      });

      setIsSuccess(true);
      setAgentStep('Transaction Confirmed & Receipt Verified On-Chain.');
      setAgentFeedback(`Transaction successfully executed! Hash: ${res.transaction.tx_hash}`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setAgentFeedback(`Execution failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Interactive Policy Slider Save
  const handleSavePolicySliders = async () => {
    setIsUpdatingPolicy(true);
    try {
      await apiClient.updatePolicy(summary.wallet_address, {
        wallet_address: summary.wallet_address,
        policy_version: summary.policy_version,
        agent_tier: summary.agent_tier,
        chain_id: summary.chain_id,
        allowed_tokens: [summary.token_address, '0x0000000000000000000000000000000000000000'],
        approved_recipients: summary.approved_recipients,
        max_transfer_amount: interactiveCap.toFixed(1),
        daily_spending_limit: summary.daily_limit,
        min_reserve_amount: interactiveReserve.toFixed(1),
        max_gas_gwei: summary.gas_price_gwei,
        is_paused: summary.is_paused
      });
      setPolicyUpdateSuccess(true);
      setTimeout(() => setPolicyUpdateSuccess(false), 2500);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingPolicy(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered Payees
  const filteredPayees = DIVERSE_ENTITIES.filter(p => {
    if (payeeFilter === 'all') return true;
    if (payeeFilter === 'approved') return p.is_approved;
    if (payeeFilter === 'flagged') return !p.is_approved;
    return p.category?.toLowerCase().includes(payeeFilter.toLowerCase());
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-full overflow-hidden">
      {/* 1. Cybernetic Top HUD Bar (100% Responsive) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#090e18]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,210,255,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        {/* Left items */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-bold tracking-wider">
              POLICY GUARD: {summary.is_paused ? 'PAUSED' : 'ONLINE'}
            </span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[11px]">
            TIER: {summary.agent_tier}
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-slate-400 text-[11px]">
            POLICY ENGINE ACTIVE
          </span>
        </div>

        {/* Right items */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] pt-1 md:pt-0 border-t md:border-t-0 border-slate-800">
          <span className="text-slate-400 flex items-center space-x-1">
            <Lock className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span>RESERVE: <strong className="text-white">${summary.min_reserve}</strong></span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            GAS: <strong className="text-emerald-400">{summary.gas_price_gwei} GWEI</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">
            SEPOLIA
          </span>
        </div>
      </div>

      {/* Alert banner if paused */}
      {summary.is_paused && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-200 shadow-[0_0_20px_rgba(255,59,105,0.15)] animate-pulse">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-red-300">Emergency Lockdown Active</h4>
              <p className="text-xs text-red-300/80 mt-0.5">
                All autonomous transfers and contract calls are halted by user override.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDispatch('emergency pause')}
            className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold self-end sm:self-center transition"
          >
            Unfreeze
          </button>
        </div>
      )}

      {/* 2. FRONT-PAGE AGENTIC COMMAND CONSOLE (100% Responsive) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-[#0e172a]/95 via-[#090e17]/95 to-[#05080e]/95 border border-cyan-500/40 shadow-[0_0_35px_rgba(0,210,255,0.12)] space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 flex-shrink-0 shadow-[0_0_15px_rgba(0,210,255,0.25)]">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                AGENTIC COMMAND CONSOLE
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                AGENTIC ENGINE
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Submit structured transaction instructions. The deterministic policy guard strictly enforces all financial permissions.
            </p>
          </div>
        </div>

        {/* Input Bar with Responsive Controls */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-xl bg-[#03060a] border border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,210,255,0.25)] transition p-1.5 gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleDispatch()}
              placeholder="e.g. 'Pay 20 USDC to AWS Cloud', 'Disburse $15 to Precision Hardware', 'Check allowance'..."
              disabled={isProcessing}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none min-w-0"
            />

            {/* Buttons Row (Responsive on mobile) */}
            <div className="flex items-center space-x-2 self-end sm:self-center w-full sm:w-auto">
              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`flex-1 sm:flex-initial px-3 py-2 sm:py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(255,59,105,0.6)]' 
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isListening ? 'Stop listening' : 'Start audio input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-cyan-400" />}
                <span className="text-xs font-semibold">
                  {isListening ? 'Listening...' : 'Voice'}
                </span>
              </button>

              {/* Dispatch Action Button */}
              <button
                type="button"
                onClick={() => handleDispatch()}
                disabled={isProcessing || !inputText.trim()}
                className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-40 text-black font-bold text-xs tracking-wider uppercase transition shadow-[0_0_15px_rgba(0,245,160,0.3)] flex items-center justify-center space-x-1.5"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Audio Visualizer Wave (When Listening) */}
          {isListening && (
            <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300 animate-pulse">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-[11px] sm:text-xs">Live Audio Stream Active — Speak instruction...</span>
              </span>
              <div className="flex items-center space-x-1">
                {[4, 10, 16, 22, 14, 20, 8, 18, 24, 12, 6].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className="w-1 bg-cyan-400 rounded-full animate-bounce"
                  />
                ))}
              </div>
            </div>
          )}

          {speechError && (
            <div className="text-xs text-amber-400 bg-amber-950/30 p-2 rounded-lg border border-amber-500/30">
              {speechError}
            </div>
          )}
        </div>

        {/* Quick Action Prompt Chips (No Emojis) */}
        <div className="space-y-1.5">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase text-slate-400">Directives:</span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              { label: 'Pay 20 USDC to AWS Cloud', cmd: 'Pay 20 USDC to AWS Cloud Infrastructure' },
              { label: 'Disburse 15 USDC to Precision Hardware', cmd: 'Disburse 15 USDC to Shenzhen Precision Hardware' },
              { label: 'Wire 10 USDC to OpenAI API', cmd: 'Wire 10 USDC to OpenAI API Billing' },
              { label: 'Check Spending Allowance', cmd: 'How much can I spend today?' },
              { label: 'Test Block: Send 30 USDC to Bob', cmd: 'Send 30 USDC to Bob' },
              { label: 'Emergency Pause', cmd: 'Emergency pause all autonomous transactions' }
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(chip.cmd);
                  handleDispatch(chip.cmd);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-[11px] sm:text-xs text-slate-300 hover:text-cyan-300 font-medium transition text-left"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step Telemetry & Proposal Card Display */}
        {(agentStep || agentFeedback || activeProposal) && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#070b13] border border-cyan-500/30 space-y-3 font-mono text-xs">
            {/* Step Progress */}
            {agentStep && (
              <div className="flex items-center space-x-2 text-cyan-400">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-300 flex-shrink-0" />
                <span className="break-words">{agentStep}</span>
              </div>
            )}

            {/* Proposal Card */}
            {activeProposal && activeEvaluation && (
              <div className={`p-3.5 sm:p-4 rounded-xl border ${
                activeEvaluation.decision === 'ALLOW' 
                  ? 'bg-emerald-950/20 border-emerald-500/40' 
                  : 'bg-red-950/20 border-red-500/40'
              } space-y-3`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-2">
                    {activeEvaluation.decision === 'ALLOW' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <span className="font-bold text-xs sm:text-sm text-white">
                      {activeEvaluation.decision === 'ALLOW' ? 'TRANSACTION PERMITTED' : 'TRANSACTION BLOCKED'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold self-start sm:self-auto ${
                    activeEvaluation.decision === 'ALLOW'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {activeEvaluation.reason_code}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="text-slate-500">Recipient: </span>
                    <span className="text-white font-medium break-words">{activeProposal.recipient_label || activeProposal.recipient_address}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Amount: </span>
                    <span className="text-emerald-400 font-bold">{activeProposal.amount} {activeProposal.token_symbol}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Single Cap: </span>
                    <span className="text-slate-300">${summary.max_transfer_amount} USDC</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Reserve Remaining: </span>
                    <span className="text-slate-300">${(tokenBal - parseFloat(activeProposal.amount)).toFixed(2)} USDC</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 break-words leading-relaxed">
                  {activeEvaluation.message}
                </div>

                {/* Execution Button */}
                {activeEvaluation.decision === 'ALLOW' && !isSuccess && (
                  <div className="pt-2">
                    <button
                      onClick={handleExecuteProposal}
                      disabled={isProcessing}
                      className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,245,160,0.4)] flex items-center justify-center space-x-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Execute Approved Transfer On-Chain</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Feedback Message */}
            {agentFeedback && !activeProposal && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed break-words">
                {agentFeedback}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. FINANCIAL HUD METERS & INTERACTIVE POLICY SLIDERS (100% Responsive Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Gauge 1: Available Balance & Reserve Floor */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090e17]/90 border border-slate-800 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Available {summary.token_symbol}</span>
            </span>
            <span className="font-mono text-cyan-400">{summary.native_balance} {summary.native_symbol}</span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ${parseFloat(summary.token_balance).toFixed(2)}
          </div>

          {/* Reserve Floor Meter */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Protected Reserve Floor</span>
              <span className="font-mono text-cyan-300 font-bold">${summary.min_reserve} USDC</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (minReserve / tokenBal) * 100)}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              ${(tokenBal - minReserve).toFixed(2)} USDC deployable without reserve violation
            </span>
          </div>
        </div>

        {/* Gauge 2: Daily Allowance Meter */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090e17]/90 border border-slate-800 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Daily Allowance</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">{100 - spendingPercent}% Left</span>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
            ${remainingAllowance.toFixed(2)} <span className="text-xs sm:text-sm font-normal text-slate-400">/ ${dailyLimit.toFixed(2)}</span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Spent Today</span>
              <span className="font-mono text-slate-200 font-bold">${spentToday.toFixed(2)} USDC</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${spendingPercent}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block">
              24-Hour window resets daily at 00:00 UTC
            </span>
          </div>
        </div>

        {/* Gauge 3: Interactive Policy Adjustment Panel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0c1524]/90 to-[#080d17]/90 border border-cyan-500/30 space-y-3 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="truncate">POLICY CONTROLS</span>
            </span>
            {policyUpdateSuccess && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </span>
            )}
          </div>

          {/* Slider 1: Max Transfer Amount */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Per-Transfer Cap:</span>
              <span className="font-mono font-bold text-cyan-300">${interactiveCap.toFixed(0)} USDC</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={interactiveCap}
              onChange={(e) => setInteractiveCap(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider 2: Reserve Floor */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Reserve Floor:</span>
              <span className="font-mono font-bold text-cyan-300">${interactiveReserve.toFixed(0)} USDC</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={interactiveReserve}
              onChange={(e) => setInteractiveReserve(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <button
            onClick={handleSavePolicySliders}
            disabled={isUpdatingPolicy}
            className="w-full mt-2 py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
          >
            {isUpdatingPolicy ? (
              <span>Updating Policy...</span>
            ) : (
              <span>Apply Policy Settings</span>
            )}
          </button>
        </div>
      </div>

      {/* 4. DIVERSE APPROVED PAYEES & ENTITIES DIRECTORY (100% Responsive) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#070b13]/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <span>PAYEES DIRECTORY</span>
            </h3>
            <p className="text-xs text-slate-400">
              Only verified entities pass the AI policy filter. Unapproved counterparties trigger automatic blocks.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {['all', 'approved', 'Supply Chain', 'Cloud & Hosting', 'AI Services', 'flagged'].map((cat) => (
              <button
                key={cat}
                onClick={() => setPayeeFilter(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium whitespace-nowrap transition ${
                  payeeFilter === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Entities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPayees.map((entity, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition ${
                entity.is_approved
                  ? 'bg-[#0b1322] border-slate-800 hover:border-cyan-500/40'
                  : 'bg-red-950/15 border-red-500/30'
              } flex flex-col justify-between space-y-2.5 min-w-0`}
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs sm:text-sm text-white truncate flex-1" title={entity.label}>
                    {entity.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold flex-shrink-0 ${
                    entity.is_approved
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {entity.is_approved ? 'APPROVED' : 'BLOCKED'}
                  </span>
                </div>
                <div className="text-[11px] text-cyan-400/80 font-mono mt-0.5 truncate">
                  {entity.category}
                </div>
                <div className="font-mono text-[10px] text-slate-500 mt-1 truncate select-all">
                  {entity.address}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                <span className="text-[10px] text-slate-400 truncate">
                  {entity.is_approved ? 'Allowlist Verified' : 'Security Risk'}
                </span>
                <button
                  onClick={() => {
                    const prompt = `Pay 20 USDC to ${entity.label}`;
                    setInputText(prompt);
                    handleDispatch(prompt);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                    entity.is_approved
                      ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                  }`}
                >
                  Quick Pay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. TRANSACTION ACTIVITY WITH VALID HASHES & RECEIPT INSPECTOR (100% Responsive) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#070b13]/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>VERIFIED TRANSACTION LEDGER</span>
            </h3>
            <p className="text-xs text-slate-400">
              Transactions feature standard 66-character EVM hashes and cryptographic event logs.
            </p>
          </div>
          <button
            onClick={() => onNavigate('activity')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>View Complete Ledger</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">
            No transactions executed yet. Dispatch a command above to see live cryptographic verification.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recentActivity.slice(0, 5).map((tx) => {
              const hash = tx.tx_hash || '0x0000000000000000000000000000000000000000000000000000000000000000';
              const shortHash = `${hash.slice(0, 10)}...${hash.slice(-8)}`;

              return (
                <div key={tx.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-sans">
                  {/* Left: recipient info & hash */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        tx.state === 'CONFIRMED' ? 'bg-emerald-400' : 'bg-red-400'
                      }`}></span>
                      <span className="font-bold text-white truncate max-w-[200px] sm:max-w-none">
                        {tx.recipient_label || tx.recipient_address}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                        {tx.state}
                      </span>
                    </div>

                    {/* Valid Hash Display with Copy Button */}
                    {tx.tx_hash && (
                      <div className="flex items-center space-x-2 font-mono text-[11px] text-cyan-400 flex-wrap">
                        <span>Hash:</span>
                        <span className="text-slate-300 select-all">{shortHash}</span>
                        <button
                          onClick={() => handleCopyHash(tx.tx_hash!)}
                          title="Copy Full 66-Char Hash"
                          className="text-slate-500 hover:text-white transition p-1"
                        >
                          {copiedHash === tx.tx_hash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Amount & Verify Button (Responsive layout on mobile) */}
                  <div className="flex items-center justify-between md:justify-end space-x-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                    <div className="text-left md:text-right">
                      <div className="font-bold text-emerald-400 font-mono text-sm">
                        {tx.amount} {tx.token_symbol}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Receipt Inspector Button */}
                    <button
                      onClick={() => setSelectedTxForReceipt(tx)}
                      className="px-3 py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition flex items-center space-x-1.5 shadow-[0_0_10px_rgba(0,210,255,0.1)] flex-shrink-0"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
