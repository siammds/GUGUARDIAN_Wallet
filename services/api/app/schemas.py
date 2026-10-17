from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AgentTier(str, Enum):
    OBSERVE = "OBSERVE"                     # Tier 1
    LIMITED_AUTONOMY = "LIMITED_AUTONOMY"   # Tier 2
    HUMAN_APPROVAL = "HUMAN_APPROVAL"       # Tier 3

class IntentType(str, Enum):
    TRANSFER = "transfer"
    READ_BALANCE = "read_balance"
    QUERY_SPENDING_ALLOWANCE = "query_spending_allowance"
    QUERY_HISTORY = "query_history"
    ESTIMATE_FEE = "estimate_fee"
    POLICY_INFO = "policy_info"
    EMERGENCY_PAUSE = "emergency_pause"
    REQUEST_POLICY_CHANGE = "request_policy_change"
    UNSUPPORTED = "unsupported"

class DecisionCode(str, Enum):
    POLICY_PASSED = "POLICY_PASSED"
    INVALID_REQUEST = "INVALID_REQUEST"
    UNSUPPORTED_CHAIN = "UNSUPPORTED_CHAIN"
    UNKNOWN_TOKEN = "UNKNOWN_TOKEN"
    UNKNOWN_RECIPIENT = "UNKNOWN_RECIPIENT"
    TRANSFER_LIMIT_EXCEEDED = "TRANSFER_LIMIT_EXCEEDED"
    DAILY_LIMIT_EXCEEDED = "DAILY_LIMIT_EXCEEDED"
    RESERVE_VIOLATION = "RESERVE_VIOLATION"
    GAS_LIMIT_EXCEEDED = "GAS_LIMIT_EXCEEDED"
    POLICY_PAUSED = "POLICY_PAUSED"
    AUTHORIZATION_EXPIRED = "AUTHORIZATION_EXPIRED"
    REPLAY_DETECTED = "REPLAY_DETECTED"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    CHAIN_STATE_UNAVAILABLE = "CHAIN_STATE_UNAVAILABLE"
    UNSUPPORTED_CONTRACT_CALL = "UNSUPPORTED_CONTRACT_CALL"
    PROMPT_INJECTION_DETECTED = "PROMPT_INJECTION_DETECTED"
    MALFORMED_PROPOSAL = "MALFORMED_PROPOSAL"
    UNAUTHORIZED_POLICY_CHANGE = "UNAUTHORIZED_POLICY_CHANGE"

class TransactionState(str, Enum):
    DRAFT = "DRAFT"
    VALIDATING = "VALIDATING"
    POLICY_CHECK = "POLICY_CHECK"
    READY = "READY"
    BLOCKED = "BLOCKED"
    SUBMITTED = "SUBMITTED"
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REVERTED = "REVERTED"
    UNKNOWN = "UNKNOWN"

class RecipientEntry(BaseModel):
    address: str
    label: str
    is_approved: bool = True

class PolicyConfig(BaseModel):
    wallet_address: str
    policy_version: int = 1
    agent_tier: AgentTier = AgentTier.LIMITED_AUTONOMY
    chain_id: int = 11155111
    allowed_tokens: List[str] = Field(default_factory=list)
    approved_recipients: List[RecipientEntry] = Field(default_factory=list)
    max_transfer_amount: str = "50.0"       # In token decimal string
    daily_spending_limit: str = "100.0"      # In token decimal string
    min_reserve_amount: str = "25.0"         # Must keep at least this balance
    max_gas_gwei: str = "50.0"               # Max acceptable gas price in Gwei
    is_paused: bool = False
    pause_scope: str = "application_autonomous_actions"
    require_approval_for_policy_change: bool = True

class IntentParseRequest(BaseModel):
    text: str
    wallet_address: str
    chain_id: Optional[int] = 11155111

class IntentParseResponse(BaseModel):
    intent_type: IntentType
    chain_id: int
    token_address: Optional[str] = None
    token_symbol: Optional[str] = None
    recipient_address: Optional[str] = None
    recipient_label: Optional[str] = None
    amount: Optional[str] = None
    requires_clarification: bool = False
    clarification_question: Optional[str] = None
    confidence_score: float = 1.0
    is_demo_mode: bool = True
    raw_prompt: str
    security_flag: Optional[str] = None

class TransactionProposal(BaseModel):
    proposal_id: str
    wallet_address: str
    chain_id: int
    intent_type: IntentType = IntentType.TRANSFER
    token_address: str
    token_symbol: str
    recipient_address: str
    recipient_label: Optional[str] = None
    amount: str
    decimals: int = 6
    nonce: int = 0
    created_at_timestamp: int
    expires_at_timestamp: int
    policy_version: int = 1
    action_type: str = "erc20_transfer"
    calldata: Optional[str] = None

class PolicyEvaluationRequest(BaseModel):
    proposal: TransactionProposal
    current_token_balance: str
    spent_today: str
    estimated_gas_gwei: str = "15.0"

class RiskFinding(BaseModel):
    severity: str    # INFO, LOW, MEDIUM, HIGH, CRITICAL
    category: str
    description: str

class PolicyEvaluationResponse(BaseModel):
    decision: str    # ALLOW, BLOCKED, APPROVAL_REQUIRED
    reason_code: DecisionCode
    message: str
    requires_user_approval: bool
    policy_version: int
    risk_score: int  # 0-100
    risk_findings: List[RiskFinding] = Field(default_factory=list)
    enforcement_layer: str  # backend_policy_engine, smart_account_guard, or frontend_advisory

class TransactionSubmitRequest(BaseModel):
    proposal: TransactionProposal
    evaluation: PolicyEvaluationResponse
    tx_hash: Optional[str] = None
    is_demo: bool = True
    user_confirmed: bool = False

class ReceiptVerificationResult(BaseModel):
    is_verified: bool
    tx_hash: str
    status: str      # SUCCESS, REVERTED, PENDING, UNKNOWN
    block_number: Optional[int] = None
    gas_used: Optional[int] = None
    effective_gas_price_gwei: Optional[str] = None
    fee_native: Optional[str] = None
    verified_token: Optional[str] = None
    verified_sender: Optional[str] = None
    verified_recipient: Optional[str] = None
    verified_amount: Optional[str] = None
    transfer_event_matched: bool = False
    verification_notes: str

class TransactionRecord(BaseModel):
    id: str
    proposal_id: str
    wallet_address: str
    chain_id: int
    state: TransactionState
    token_symbol: str
    token_address: str
    recipient_address: str
    recipient_label: Optional[str] = None
    amount: str
    tx_hash: Optional[str] = None
    decision: str
    reason_code: DecisionCode
    is_demo: bool = True
    created_at: str
    completed_at: Optional[str] = None
    receipt_verification: Optional[ReceiptVerificationResult] = None
    rejection_reason: Optional[str] = None

class AuditEvent(BaseModel):
    event_id: str
    timestamp: str
    event_type: str
    wallet_address: str
    chain_id: int
    policy_version: int
    request_identifier: str
    decision: str
    reason_code: str
    transaction_hash: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
