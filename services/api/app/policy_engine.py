import time
from decimal import Decimal, InvalidOperation
from typing import Set, Dict, Optional, List
from app.schemas import (
    PolicyConfig,
    TransactionProposal,
    PolicyEvaluationResponse,
    DecisionCode,
    AgentTier,
    RiskFinding
)

class PolicyEngine:
    """
    Deterministic Financial Policy Engine for Guardian Wallet.
    Evaluates proposed transactions against strict spending limits, recipient allowlists,
    reserve thresholds, authorization expiry, and replay-protection nonces.
    """

    def __init__(self, config: PolicyConfig):
        self.config = config
        self._used_nonces: Set[int] = set()
        self._processed_proposals: Set[str] = set()

    def update_config(self, new_config: PolicyConfig, user_confirmed: bool = False) -> tuple[bool, str]:
        if self.config.require_approval_for_policy_change and not user_confirmed:
            return False, "Policy configuration update requires explicit user signature / approval."
        
        # Increment policy version on change to invalidate stale authorizations
        new_config.policy_version = self.config.policy_version + 1
        self.config = new_config
        return True, f"Policy successfully updated to version {self.config.policy_version}."

    def set_pause(self, paused: bool) -> None:
        self.config.is_paused = paused

    def evaluate(
        self,
        proposal: TransactionProposal,
        current_token_balance: str,
        spent_today: str,
        estimated_gas_gwei: str = "15.0",
        current_time_timestamp: Optional[int] = None
    ) -> PolicyEvaluationResponse:
        now = current_time_timestamp or int(time.time())
        risk_findings: List[RiskFinding] = []
        risk_score = 0

        # Rule 1: Emergency Pause Check (T16)
        if self.config.is_paused:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.POLICY_PAUSED,
                message="Autonomous actions are paused by emergency control.",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=100,
                risk_findings=[RiskFinding(severity="CRITICAL", category="POLICY_PAUSE", description="Wallet emergency pause is active")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 2: Agent Permission Tier (Screen E, Section 9)
        if self.config.agent_tier == AgentTier.OBSERVE:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.APPROVAL_REQUIRED,
                message="Wallet is in Tier 1 (Observe Mode). Transfers and state changes are strictly prohibited.",
                requires_user_approval=True,
                policy_version=self.config.policy_version,
                risk_score=60,
                risk_findings=[RiskFinding(severity="HIGH", category="AGENT_TIER", description="Tier 1 Observe mode cannot initiate transfers")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 3: Supported Chain Check (T07)
        if proposal.chain_id != self.config.chain_id:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.UNSUPPORTED_CHAIN,
                message=f"Chain ID {proposal.chain_id} is not supported. Configured chain is {self.config.chain_id}.",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=90,
                risk_findings=[RiskFinding(severity="CRITICAL", category="CHAIN", description="Target chain does not match wallet configuration")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 4: Action Type & Contract Call Restrictions (T08, T14)
        if proposal.action_type != "erc20_transfer":
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.UNSUPPORTED_CONTRACT_CALL,
                message=f"Action type '{proposal.action_type}' is forbidden. Guardian Wallet MVP only permits validated ERC-20 transfers.",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=95,
                risk_findings=[RiskFinding(severity="CRITICAL", category="SECURITY", description="Arbitrary contract calls and calldata are prohibited")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 5: Allowed Token Address (T06)
        normalized_token = proposal.token_address.lower()
        allowed_normalized = [t.lower() for t in self.config.allowed_tokens]
        if allowed_normalized and normalized_token not in allowed_normalized:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.UNKNOWN_TOKEN,
                message=f"Token address {proposal.token_address} ({proposal.token_symbol}) is not in the allowed token list.",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=85,
                risk_findings=[RiskFinding(severity="HIGH", category="TOKEN", description="Unrecognized or unapproved token address")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 6: Recipient Address & Allowlist (T01, T05)
        if not proposal.recipient_address.startswith("0x") or len(proposal.recipient_address) != 42:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.INVALID_REQUEST,
                message=f"Malformed recipient address '{proposal.recipient_address}'. Must be a valid 42-character 0x hex address.",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=90,
                risk_findings=[RiskFinding(severity="HIGH", category="ADDRESS", description="Invalid Ethereum address format")],
                enforcement_layer="backend_policy_engine"
            )

        is_approved_recipient = False
        for rec in self.config.approved_recipients:
            if rec.address.lower() == proposal.recipient_address.lower() and rec.is_approved:
                is_approved_recipient = True
                break

        if not is_approved_recipient:
            if self.config.agent_tier == AgentTier.LIMITED_AUTONOMY:
                return PolicyEvaluationResponse(
                    decision="BLOCKED",
                    reason_code=DecisionCode.UNKNOWN_RECIPIENT,
                    message=f"Recipient {proposal.recipient_address} is not on your approved recipient allowlist.",
                    requires_user_approval=False,
                    policy_version=self.config.policy_version,
                    risk_score=80,
                    risk_findings=[RiskFinding(severity="HIGH", category="ALLOWLIST", description="Autonomous mode requires pre-approved recipients")],
                    enforcement_layer="backend_policy_engine"
                )
            else: # Human approval tier
                risk_findings.append(RiskFinding(severity="MEDIUM", category="ALLOWLIST", description="Recipient not in allowlist; requires manual confirmation"))
                risk_score += 30

        # Rule 7: Policy Version Binding (T13)
        if proposal.policy_version != self.config.policy_version:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.INVALID_REQUEST,
                message=f"Stale proposal policy version {proposal.policy_version}. Active policy version is {self.config.policy_version}.",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=70,
                risk_findings=[RiskFinding(severity="MEDIUM", category="POLICY_VERSION", description="Proposal was created under an outdated policy snapshot")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 8: Authorization Expiry (T11)
        if now > proposal.expires_at_timestamp:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.AUTHORIZATION_EXPIRED,
                message="Proposal authorization has expired (TTL exceeded).",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=75,
                risk_findings=[RiskFinding(severity="HIGH", category="TTL", description="Authorization timestamp expired")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 9: Replay Protection & Nonce Check (T12)
        if proposal.nonce in self._used_nonces or proposal.proposal_id in self._processed_proposals:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.REPLAY_DETECTED,
                message="Replay detected: Nonce or proposal ID has already been executed.",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=100,
                risk_findings=[RiskFinding(severity="CRITICAL", category="REPLAY", description="Replay attack or repeated submission detected")],
                enforcement_layer="backend_policy_engine"
            )

        # Numeric Validations using Decimal
        try:
            amount = Decimal(proposal.amount)
            balance = Decimal(current_token_balance)
            spent = Decimal(spent_today)
            max_cap = Decimal(self.config.max_transfer_amount)
            daily_limit = Decimal(self.config.daily_spending_limit)
            min_reserve = Decimal(self.config.min_reserve_amount)
            gas_price = Decimal(estimated_gas_gwei)
            max_gas = Decimal(self.config.max_gas_gwei)
        except (InvalidOperation, TypeError):
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.INVALID_REQUEST,
                message="Invalid decimal format in amounts or balance state.",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=85,
                risk_findings=[RiskFinding(severity="HIGH", category="MATH", description="Malformed financial numbers")],
                enforcement_layer="backend_policy_engine"
            )

        if amount <= Decimal("0"):
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.INVALID_REQUEST,
                message="Transfer amount must be strictly greater than 0.",
                requires_user_approval=False,
                policy_version=self.config.policy_version,
                risk_score=70,
                risk_findings=[RiskFinding(severity="MEDIUM", category="AMOUNT", description="Non-positive transfer amount")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 10: Per-transaction Limit (T02)
        if amount > max_cap:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.TRANSFER_LIMIT_EXCEEDED,
                message=f"Amount {amount} {proposal.token_symbol} exceeds maximum single-transfer cap of {max_cap} {proposal.token_symbol}.",
                requires_user_approval=True,
                policy_version=self.config.policy_version,
                risk_score=65,
                risk_findings=[RiskFinding(severity="MEDIUM", category="LIMIT", description="Single transfer ceiling exceeded")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 11: Daily Spending Limit (T03, T17)
        if (spent + amount) > daily_limit:
            remaining = max(Decimal("0"), daily_limit - spent)
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.DAILY_LIMIT_EXCEEDED,
                message=f"Transfer of {amount} would exceed daily limit ({daily_limit} {proposal.token_symbol}). Remaining today: {remaining} {proposal.token_symbol}.",
                requires_user_approval=True,
                policy_version=self.config.policy_version,
                risk_score=70,
                risk_findings=[RiskFinding(severity="HIGH", category="DAILY_LIMIT", description="Daily spending threshold exceeded")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 12: Minimum Reserve Protection (T04)
        balance_after = balance - amount
        if balance_after < min_reserve:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.RESERVE_VIOLATION,
                message=f"Transfer would leave {balance_after} {proposal.token_symbol}, violating the protected reserve minimum of {min_reserve} {proposal.token_symbol}.",
                requires_user_approval=True,
                policy_version=self.config.policy_version,
                risk_score=75,
                risk_findings=[RiskFinding(severity="HIGH", category="RESERVE", description="Post-transaction balance breaches protected floor")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 13: Gas Ceiling Check (T15)
        if gas_price > max_gas:
            return PolicyEvaluationResponse(
                decision="BLOCKED",
                reason_code=DecisionCode.GAS_LIMIT_EXCEEDED,
                message=f"Estimated gas price ({gas_price} Gwei) exceeds configured maximum ({max_gas} Gwei).",
                requires_user_approval=True,
                policy_version=self.config.policy_version,
                risk_score=50,
                risk_findings=[RiskFinding(severity="MEDIUM", category="GAS", description="Network congestion gas price exceeds ceiling")],
                enforcement_layer="backend_policy_engine"
            )

        # Rule 14: Tier 3 Human Approval Check
        if self.config.agent_tier == AgentTier.HUMAN_APPROVAL:
            return PolicyEvaluationResponse(
                decision="APPROVAL_REQUIRED",
                reason_code=DecisionCode.APPROVAL_REQUIRED,
                message="Proposal conforms to financial limits, but wallet is set to Tier 3 (Human Approval). Explicit approval needed.",
                requires_user_approval=True,
                policy_version=self.config.policy_version,
                risk_score=20,
                risk_findings=[RiskFinding(severity="INFO", category="TIER", description="Manual authorization configured for all outgoing transfers")],
                enforcement_layer="backend_policy_engine"
            )

        # All rules passed successfully (T01)
        return PolicyEvaluationResponse(
            decision="ALLOW",
            reason_code=DecisionCode.POLICY_PASSED,
            message="The transfer satisfies every configured security and spending policy.",
            requires_user_approval=False,
            policy_version=self.config.policy_version,
            risk_score=5,
            risk_findings=[RiskFinding(severity="INFO", category="POLICY", description="All deterministic policy checks passed")],
            enforcement_layer="backend_policy_engine"
        )

    def mark_executed(self, proposal_id: str, nonce: int) -> None:
        self._used_nonces.add(nonce)
        self._processed_proposals.add(proposal_id)
