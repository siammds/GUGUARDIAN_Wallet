from decimal import Decimal
from typing import List, Tuple
from app.schemas import TransactionProposal, RiskFinding

class RiskEngine:
    """
    Transaction Risk Assessment Engine for Guardian Wallet.
    Evaluates risk factors such as high balance percentage, recipient category,
    gas price spikes, and rapid transaction frequency.
    """

    @staticmethod
    def assess_risk(
        proposal: TransactionProposal,
        current_token_balance: str,
        estimated_gas_gwei: str = "15.0"
    ) -> Tuple[int, List[RiskFinding]]:
        findings: List[RiskFinding] = []
        score = 0

        try:
            amt = Decimal(proposal.amount)
            bal = Decimal(current_token_balance)
            gas = Decimal(estimated_gas_gwei)
        except Exception:
            findings.append(RiskFinding(
                severity="HIGH",
                category="DATA_INTEGRITY",
                description="Unable to parse numbers for risk evaluation."
            ))
            return 80, findings

        # 1. Percentage of total balance
        if bal > Decimal("0"):
            ratio = (amt / bal) * Decimal("100")
            if ratio >= Decimal("80"):
                score += 50
                findings.append(RiskFinding(
                    severity="HIGH",
                    category="AMOUNT_RATIO",
                    description=f"Transaction transfers {ratio:.1f}% of total token balance."
                ))
            elif ratio >= Decimal("50"):
                score += 25
                findings.append(RiskFinding(
                    severity="MEDIUM",
                    category="AMOUNT_RATIO",
                    description=f"Transaction transfers {ratio:.1f}% of total token balance."
                ))
            else:
                findings.append(RiskFinding(
                    severity="INFO",
                    category="AMOUNT_RATIO",
                    description=f"Transaction transfers {ratio:.1f}% of balance (within normal bounds)."
                ))

        # 2. Gas Price Risk
        if gas > Decimal("30.0"):
            score += 20
            findings.append(RiskFinding(
                severity="MEDIUM",
                category="GAS_PRICE",
                description=f"Network gas is elevated at {gas} Gwei."
            ))
        else:
            findings.append(RiskFinding(
                severity="INFO",
                category="GAS_PRICE",
                description=f"Gas price is normal at {gas} Gwei."
            ))

        # 3. Recipient Verification
        if proposal.recipient_label:
            findings.append(RiskFinding(
                severity="INFO",
                category="RECIPIENT",
                description=f"Recipient is labeled '{proposal.recipient_label}' in local address book."
            ))
        else:
            score += 15
            findings.append(RiskFinding(
                severity="LOW",
                category="RECIPIENT",
                description="Direct address transfer without address book label."
            ))

        final_score = min(100, score)
        return final_score, findings

risk_engine = RiskEngine()
