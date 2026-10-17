export type AgentTier = 'OBSERVE' | 'LIMITED_AUTONOMY' | 'HUMAN_APPROVAL';

export type DecisionCode =
  | 'POLICY_PASSED'
  | 'INVALID_REQUEST'
  | 'UNSUPPORTED_CHAIN'
  | 'UNKNOWN_TOKEN'
  | 'UNKNOWN_RECIPIENT'
  | 'TRANSFER_LIMIT_EXCEEDED'
  | 'DAILY_LIMIT_EXCEEDED'
  | 'RESERVE_VIOLATION'
  | 'GAS_LIMIT_EXCEEDED'
  | 'POLICY_PAUSED'
  | 'AUTHORIZATION_EXPIRED'
  | 'REPLAY_DETECTED'
  | 'APPROVAL_REQUIRED'
  | 'CHAIN_STATE_UNAVAILABLE'
  | 'UNSUPPORTED_CONTRACT_CALL'
  | 'PROMPT_INJECTION_DETECTED'
  | 'MALFORMED_PROPOSAL'
  | 'UNAUTHORIZED_POLICY_CHANGE';

export type TransactionState =
  | 'DRAFT'
  | 'VALIDATING'
  | 'POLICY_CHECK'
  | 'READY'
  | 'BLOCKED'
  | 'SUBMITTED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'REVERTED'
  | 'UNKNOWN';

export interface RecipientEntry {
  address: string;
  label: string;
  is_approved: boolean;
  category?: string;
  riskLevel?: 'SAFE' | 'BLOCKED' | 'FLAGGED';
}

export interface PolicyConfig {
  wallet_address: string;
  policy_version: number;
  agent_tier: AgentTier;
  chain_id: number;
  allowed_tokens: string[];
  approved_recipients: RecipientEntry[];
  max_transfer_amount: string;
  daily_spending_limit: string;
  min_reserve_amount: string;
  max_gas_gwei: string;
  is_paused: boolean;
  pause_scope?: string;
  require_approval_for_policy_change?: boolean;
}

export interface RiskFinding {
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
}

export interface PolicyEvaluation {
  decision: 'ALLOW' | 'BLOCKED' | 'APPROVAL_REQUIRED';
  reason_code: DecisionCode;
  message: string;
  requires_user_approval: boolean;
  policy_version: number;
  risk_score: number;
  risk_findings: RiskFinding[];
  enforcement_layer: string;
}

export interface TransactionProposal {
  proposal_id: string;
  wallet_address: string;
  chain_id: number;
  intent_type: string;
  token_address: string;
  token_symbol: string;
  recipient_address: string;
  recipient_label?: string;
  amount: string;
  decimals: number;
  nonce: number;
  created_at_timestamp: number;
  expires_at_timestamp: number;
  policy_version: number;
  action_type: string;
  calldata?: string;
}

export interface ReceiptVerification {
  is_verified: boolean;
  tx_hash: string;
  status: string;
  block_number?: number;
  gas_used?: number;
  effective_gas_price_gwei?: string;
  fee_native?: string;
  verified_token?: string;
  verified_sender?: string;
  verified_recipient?: string;
  verified_amount?: string;
  transfer_event_matched: boolean;
  verification_notes: string;
}

export interface TransactionRecord {
  id: string;
  proposal_id: string;
  wallet_address: string;
  chain_id: number;
  state: TransactionState;
  token_symbol: string;
  token_address: string;
  recipient_address: string;
  recipient_label?: string;
  amount: string;
  tx_hash?: string;
  decision: string;
  reason_code: DecisionCode;
  is_demo: boolean;
  created_at: string;
  completed_at?: string;
  rejection_reason?: string;
  receipt?: ReceiptVerification;
}

export interface WalletSummary {
  wallet_address: string;
  chain_id: number;
  chain_name: string;
  native_balance: string;
  native_symbol: string;
  token_balance: string;
  token_symbol: string;
  token_address: string;
  spent_today: string;
  daily_limit: string;
  max_transfer_amount: string;
  min_reserve: string;
  agent_tier: AgentTier;
  is_paused: boolean;
  policy_version: number;
  gas_price_gwei: string;
  approved_recipients: RecipientEntry[];
}

export interface AuditEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  wallet_address: string;
  chain_id: number;
  policy_version: number;
  request_identifier: string;
  decision: string;
  reason_code: string;
  transaction_hash?: string;
  details: Record<string, any>;
}
