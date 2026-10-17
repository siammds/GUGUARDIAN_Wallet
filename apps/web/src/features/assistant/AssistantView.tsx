import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Info
} from 'lucide-react';
import { useSpeechRecognition } from '../voice/useSpeechRecognition';
import { apiClient } from '../../services/apiClient';
import { TransactionProposal, PolicyEvaluation, WalletSummary } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  proposal?: TransactionProposal;
  evaluation?: PolicyEvaluation;
  securityFlag?: string;
  isClarification?: boolean;
}

interface AssistantViewProps {
  summary: WalletSummary | null;
  onOpenReview: (proposal: TransactionProposal, evaluation: PolicyEvaluation) => void;
  prefillCommand?: string;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  summary,
  onOpenReview,
  prefillCommand
}) => {
  const [input, setInput] = useState(prefillCommand || '');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: "Hello! I am your Guardian Wallet AI Assistant. You can speak or type your transaction instructions. Every action is evaluated against your strict financial rules before execution.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  } = useSpeechRecognition();

  // If live speech recognition is active, update input state so user can edit it
  React.useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Support prefilled command from dashboard
  React.useEffect(() => {
    if (prefillCommand) {
      setInput(prefillCommand);
    }
  }, [prefillCommand]);

  const handleSend = async () => {
    const textToSend = input.trim();
    if (!textToSend || !summary) return;

    if (isListening) {
      stopListening();
    }

    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    resetTranscript();
    setIsLoading(true);

    try {
      // 1. Parse intent
      const parseResult = await apiClient.parseIntent(textToSend, summary.wallet_address);

      if (parseResult.security_flag) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_a_${Date.now()}`,
            sender: 'assistant',
            text: parseResult.clarification_question || "Request blocked: Policy override pattern detected.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            securityFlag: parseResult.security_flag
          }
        ]);
        setIsLoading(false);
        return;
      }

      if (parseResult.requires_clarification) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_a_${Date.now()}`,
            sender: 'assistant',
            text: parseResult.clarification_question || "Could you please clarify your request?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isClarification: true
          }
        ]);
        setIsLoading(false);
        return;
      }

      // Handle non-transfer intents (read-only queries)
      if (parseResult.intent_type === 'read_balance') {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_a_${Date.now()}`,
            sender: 'assistant',
            text: `Your current token balance is ${summary.token_balance} ${summary.token_symbol} (${summary.native_balance} ${summary.native_symbol} for network gas).`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsLoading(false);
        return;
      }

      if (parseResult.intent_type === 'query_spending_allowance') {
        const spent = parseFloat(summary.spent_today || '0');
        const limit = parseFloat(summary.daily_limit || '100');
        const remaining = Math.max(0, limit - spent);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_a_${Date.now()}`,
            sender: 'assistant',
            text: `You have spent $${spent.toFixed(2)} of your $${limit.toFixed(2)} daily limit today. You can still spend $${remaining.toFixed(2)} ${summary.token_symbol}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsLoading(false);
        return;
      }

      if (parseResult.intent_type === 'query_history') {
        const txs = await apiClient.getActivity(summary.wallet_address);
        const latest = txs[0];
        let reply = "You have no past transactions recorded.";
        if (latest) {
          reply = `Your latest transaction was ${latest.amount} ${latest.token_symbol} to ${latest.recipient_label || latest.recipient_address.slice(0, 8)}. Status: ${latest.state} (${latest.reason_code}).`;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_a_${Date.now()}`,
            sender: 'assistant',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsLoading(false);
        return;
      }

      if (parseResult.intent_type === 'emergency_pause') {
        await apiClient.togglePause(summary.wallet_address, true);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_a_${Date.now()}`,
            sender: 'assistant',
            text: "Emergency pause activated. All autonomous actions have been suspended across the wallet application.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsLoading(false);
        return;
      }

      if (parseResult.intent_type === 'policy_info') {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_a_${Date.now()}`,
            sender: 'assistant',
            text: parseResult.clarification_question || `Under your active policy, single transfers are capped at ${summary.max_transfer_amount} ${summary.token_symbol}, and your reserve floor is ${summary.min_reserve} ${summary.token_symbol}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsLoading(false);
        return;
      }

      // If transfer intent: prepare proposal and evaluate
      if (parseResult.intent_type === 'transfer' && parseResult.amount && parseResult.recipient_address) {
        const { proposal, evaluation } = await apiClient.prepareTransaction({
          wallet_address: summary.wallet_address,
          token_address: parseResult.token_address || summary.token_address,
          token_symbol: parseResult.token_symbol || summary.token_symbol,
          recipient_address: parseResult.recipient_address,
          recipient_label: parseResult.recipient_label,
          amount: parseResult.amount,
          chain_id: summary.chain_id
        });

        let assistantText = `I have prepared a proposed transfer of ${proposal.amount} ${proposal.token_symbol} to ${proposal.recipient_label || proposal.recipient_address}.`;
        if (evaluation.decision === 'BLOCKED') {
          assistantText = `Transaction proposal rejected by policy engine: ${evaluation.message}`;
        } else if (evaluation.decision === 'APPROVAL_REQUIRED') {
          assistantText = `Transaction proposal ready, but requires explicit human approval: ${evaluation.message}`;
        } else {
          assistantText = `Transaction proposal satisfies all rules. Policy status: ALLOW (${evaluation.reason_code}).`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `msg_a_${Date.now()}`,
            sender: 'assistant',
            text: assistantText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            proposal,
            evaluation
          }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_a_${Date.now()}`,
          sender: 'assistant',
          text: `Error processing request: ${err.message || 'Unknown network error.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Speech error indicator */}
      {speechError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>{speechError}</span>
          </div>
          <button 
            onClick={resetTranscript} 
            className="text-xs text-amber-400 underline ml-2 hover:text-amber-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="p-4 rounded-2xl bg-guardian-surface border border-guardian-border min-h-[380px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`p-2 rounded-xl flex-shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : msg.securityFlag
                    ? 'bg-red-950/60 border border-red-500/50 text-red-200 rounded-tl-none'
                    : 'bg-slate-900 border border-guardian-border text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}

                {msg.securityFlag && (
                  <div className="mt-2 pt-2 border-t border-red-500/30 text-[11px] text-red-300 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{msg.securityFlag}</span>
                  </div>
                )}
              </div>

              {/* Proposed Action Card */}
              {msg.proposal && msg.evaluation && (
                <div className="p-4 rounded-xl bg-slate-950 border border-guardian-border text-left space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-semibold text-white flex items-center space-x-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Proposed On-Chain Action</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                        msg.evaluation.decision === 'ALLOW'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : msg.evaluation.decision === 'BLOCKED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {msg.evaluation.decision}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-guardian-textMuted block text-[10px]">Recipient:</span>
                      <span className="font-medium text-white">{msg.proposal.recipient_label || `${msg.proposal.recipient_address.slice(0, 8)}...`}</span>
                    </div>
                    <div>
                      <span className="text-guardian-textMuted block text-[10px]">Amount:</span>
                      <span className="font-bold text-white">{msg.proposal.amount} {msg.proposal.token_symbol}</span>
                    </div>
                    <div>
                      <span className="text-guardian-textMuted block text-[10px]">Risk Score:</span>
                      <span className={`font-semibold ${msg.evaluation.risk_score > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {msg.evaluation.risk_score} / 100
                      </span>
                    </div>
                    <div>
                      <span className="text-guardian-textMuted block text-[10px]">Enforcement:</span>
                      <span className="text-slate-300">Deterministic Engine</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onOpenReview(msg.proposal!, msg.evaluation!)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs hover:bg-emerald-400 transition flex items-center space-x-1"
                    >
                      <span>Review Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-guardian-textMuted px-1">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-guardian-textSecondary">
            <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>Evaluating intent and financial policies...</span>
          </div>
        )}
      </div>

      {/* Input & Voice Controls */}
      <div className="p-3 rounded-2xl bg-guardian-surface border border-guardian-border space-y-2">
        <div className="flex items-center space-x-2">
          {/* Microphone button */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            title={isListening ? 'Click to stop listening' : 'Click to speak transaction instruction'}
            className={`p-3 rounded-xl transition-all flex items-center justify-center flex-shrink-0 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isListening
                ? 'Listening... Speak your command clearly...'
                : "Type or speak command (e.g., 'Send 20 USDC to my approved supplier')"
            }
            className="flex-1 bg-slate-900 border border-guardian-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-guardian-textMuted px-2 gap-1">
          <span className="truncate">
            {isListening ? (
              <span className="text-red-400 animate-pulse font-medium">Recording audio input...</span>
            ) : (
              <span>Transaction directives are evaluated deterministically and never executed without policy verification.</span>
            )}
          </span>
          <span className="self-end sm:self-auto flex-shrink-0 text-cyan-400">
            Guardian Agent Protocol v1
          </span>
        </div>
      </div>
    </div>
  );
};
