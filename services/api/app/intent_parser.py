import re
import hashlib
from typing import Optional, Dict, Any, List
from decimal import Decimal, InvalidOperation
from app.schemas import (
    IntentType, 
    IntentParseResponse, 
    DecisionCode
)
from app.config import settings

# Rich, diverse directory of verified and unapproved payment entities
KNOWN_ADDRESS_BOOK: Dict[str, Dict[str, Any]] = {
    # Supply Chain & Hardware
    "approved supplier": {
        "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "label": "Shenzhen Precision Hardware",
        "category": "Supply Chain",
        "is_approved": True
    },
    "supplier": {
        "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "label": "Shenzhen Precision Hardware",
        "category": "Supply Chain",
        "is_approved": True
    },
    "hardware": {
        "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "label": "Shenzhen Precision Hardware",
        "category": "Supply Chain",
        "is_approved": True
    },
    "precision hardware": {
        "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "label": "Shenzhen Precision Hardware",
        "category": "Supply Chain",
        "is_approved": True
    },

    # Cloud & AI Infrastructure
    "aws": {
        "address": "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97",
        "label": "AWS Cloud Infrastructure",
        "category": "Cloud & Hosting",
        "is_approved": True
    },
    "cloud": {
        "address": "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97",
        "label": "AWS Cloud Infrastructure",
        "category": "Cloud & Hosting",
        "is_approved": True
    },
    "cloud server": {
        "address": "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97",
        "label": "AWS Cloud Infrastructure",
        "category": "Cloud & Hosting",
        "is_approved": True
    },
    "openai": {
        "address": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        "label": "OpenAI API Billing",
        "category": "AI Services",
        "is_approved": True
    },
    "openai api": {
        "address": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        "label": "OpenAI API Billing",
        "category": "AI Services",
        "is_approved": True
    },
    "vercel": {
        "address": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
        "label": "Vercel Edge Hosting",
        "category": "Cloud & Hosting",
        "is_approved": True
    },

    # Logistics & Freight
    "logistics": {
        "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "label": "Global Freight & Logistics",
        "category": "Logistics",
        "is_approved": True
    },
    "freight": {
        "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "label": "Global Freight & Logistics",
        "category": "Logistics",
        "is_approved": True
    },
    "alice": {
        "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "label": "Alice (Operations Lead)",
        "category": "Internal Operations",
        "is_approved": True
    },

    # Operations & Facilities
    "workspace": {
        "address": "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
        "label": "Apex Office & Facilities",
        "category": "Facilities",
        "is_approved": True
    },
    "office": {
        "address": "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
        "label": "Apex Office & Facilities",
        "category": "Facilities",
        "is_approved": True
    },
    "devops": {
        "address": "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
        "label": "DevOps Engineering Pool",
        "category": "Payroll",
        "is_approved": True
    },
    "payroll": {
        "address": "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
        "label": "DevOps Engineering Pool",
        "category": "Payroll",
        "is_approved": True
    },
    "legal": {
        "address": "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
        "label": "FinTech Compliance Advisory",
        "category": "Legal",
        "is_approved": True
    },
    "compliance": {
        "address": "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
        "label": "FinTech Compliance Advisory",
        "category": "Legal",
        "is_approved": True
    },
    "audit escrow": {
        "address": "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
        "label": "CertiK Security Escrow",
        "category": "Security",
        "is_approved": True
    },
    "certik": {
        "address": "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
        "label": "CertiK Security Escrow",
        "category": "Security",
        "is_approved": True
    },
    "treasury": {
        "address": "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
        "label": "Treasury Cold Vault",
        "category": "Treasury",
        "is_approved": True
    },

    # Unapproved & Flagged Entities (for security demo)
    "bob": {
        "address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "label": "Bob (Pending KYC)",
        "category": "Contractor",
        "is_approved": False
    },
    "mixer": {
        "address": "0x000000000000000000000000000000000000dEaD",
        "label": "Flagged P2P Mixer",
        "category": "High Risk / Sanctioned",
        "is_approved": False
    },
    "tornado": {
        "address": "0x000000000000000000000000000000000000dEaD",
        "label": "Flagged P2P Mixer",
        "category": "High Risk / Sanctioned",
        "is_approved": False
    },
    "arbitrage bot": {
        "address": "0x8888888888888888888888888888888888888888",
        "label": "Unknown Arbitrage Bot",
        "category": "High Risk",
        "is_approved": False
    }
}

KNOWN_TOKENS: Dict[str, Dict[str, Any]] = {
    "USDC": {
        "address": settings.test_token_address,
        "symbol": "USDC",
        "decimals": 6
    },
    "USD": {
        "address": settings.test_token_address,
        "symbol": "USDC",
        "decimals": 6
    },
    "ETH": {
        "address": "0x0000000000000000000000000000000000000000",
        "symbol": "ETH",
        "decimals": 18
    }
}

PROMPT_INJECTION_PATTERNS = [
    r"ignore (all )?previous instructions",
    r"override (wallet |security |spending )?policies",
    r"bypass (the )?(policy|guard|limit|check)",
    r"grant (me |yourself )?(unlimited|admin|root|owner)",
    r"transfer (all|everything|all funds)",
    r"disable (security|checks|limits)",
    r"disregard (rules|instructions)"
]

WORD_NUMBERS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "fifteen": "15", "twenty": "20", "twenty-five": "25",
    "thirty": "30", "forty": "40", "fifty": "50", "sixty": "60",
    "seventy": "70", "eighty": "80", "ninety": "90", "hundred": "100"
}

class IntentParser:
    """
    Vast Natural Language Intent Parser for Guardian Wallet.
    Supports broad conversational phrasings, flexible currency formats,
    multi-word number extraction, entity resolution, and prompt injection defense.
    """
    
    @staticmethod
    def check_prompt_injection(text: str) -> Optional[str]:
        lower = text.lower()
        for pattern in PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, lower):
                return "Potential prompt injection or policy override attempt detected in input."
        return None

    @classmethod
    def _extract_amount(cls, text: str) -> Optional[str]:
        # $20, 20$, 20.50, 20 usdc, 20 dollars, 20 bucks
        m = re.search(r"\$?\s*(\d+(?:\.\d+)?)\s*(?:\$|usdc|usd|dollars?|bucks?|eth)?", text, re.IGNORECASE)
        if m and m.group(1):
            return m.group(1)

        # Word numbers: "twenty", "fifty", etc.
        for word, val in WORD_NUMBERS.items():
            if re.search(rf"\b{word}\b", text, re.IGNORECASE):
                return val
        return None

    @classmethod
    def _find_entity_match(cls, text: str) -> Optional[Dict[str, Any]]:
        lower = text.lower()
        # Direct key search
        for key, entity in KNOWN_ADDRESS_BOOK.items():
            if re.search(rf"\b{re.escape(key)}\b", lower):
                return entity
        # Label search
        for entity in KNOWN_ADDRESS_BOOK.values():
            if entity["label"].lower() in lower:
                return entity
        return None

    @classmethod
    def parse(cls, text: str, wallet_address: str, chain_id: int = 11155111) -> IntentParseResponse:
        trimmed = text.strip()
        lower = trimmed.lower()
        
        # 1. Prompt Injection & Adversarial Pre-Filter
        injection_flag = cls.check_prompt_injection(trimmed)
        if injection_flag:
            return IntentParseResponse(
                intent_type=IntentType.UNSUPPORTED,
                chain_id=chain_id,
                requires_clarification=False,
                clarification_question="Action blocked: Natural language prompt contains forbidden policy-override phrases.",
                confidence_score=1.0,
                is_demo_mode=True,
                raw_prompt=trimmed,
                security_flag=injection_flag
            )

        # 2. Emergency Pause & Resume Commands
        if any(p in lower for p in [
            "stop all autonomous transactions", "emergency pause", "pause wallet",
            "freeze agent", "pause all transactions", "freeze everything", "emergency stop",
            "halt transactions", "halt autonomous actions", "lock wallet", "kill switch"
        ]):
            return IntentParseResponse(
                intent_type=IntentType.EMERGENCY_PAUSE,
                chain_id=chain_id,
                confidence_score=1.0,
                is_demo_mode=True,
                raw_prompt=trimmed
            )

        # 3. Read Balance & Financial Overview
        if any(p in lower for p in [
            "what is my balance", "check balance", "read balance", "show my balance",
            "how much money do i have", "my balance", "funds overview", "portfolio status",
            "current funds", "how much usdc do i have", "show funds", "financial overview"
        ]):
            return IntentParseResponse(
                intent_type=IntentType.READ_BALANCE,
                chain_id=chain_id,
                token_symbol="USDC",
                token_address=settings.test_token_address,
                confidence_score=1.0,
                is_demo_mode=True,
                raw_prompt=trimmed
            )

        # 4. Query Spending Allowance & Daily Budget
        if any(p in lower for p in [
            "how much can i spend today", "daily limit", "spending allowance", "remaining limit",
            "spending allowance today", "how much can i spend", "what is my allowance",
            "daily budget", "remaining budget", "how much limit is left", "budget status"
        ]):
            return IntentParseResponse(
                intent_type=IntentType.QUERY_SPENDING_ALLOWANCE,
                chain_id=chain_id,
                confidence_score=1.0,
                is_demo_mode=True,
                raw_prompt=trimmed
            )

        # 5. Query Transaction History & Recent Activity
        if any(p in lower for p in [
            "show my latest transaction", "latest transaction", "recent activity",
            "transaction history", "show transactions", "what was my last transfer",
            "past payments", "recent transfers", "show recent payments", "transaction log"
        ]):
            return IntentParseResponse(
                intent_type=IntentType.QUERY_HISTORY,
                chain_id=chain_id,
                confidence_score=1.0,
                is_demo_mode=True,
                raw_prompt=trimmed
            )

        # 6. Rejection Reason Query
        if any(p in lower for p in [
            "why was my previous transaction rejected", "why was it rejected", "why rejected",
            "rejection reason", "why did my last transfer fail", "why was it blocked",
            "what got blocked", "explain rejection"
        ]):
            return IntentParseResponse(
                intent_type=IntentType.QUERY_HISTORY,
                chain_id=chain_id,
                clarification_question="Querying latest blocked transaction log from policy audit trail...",
                confidence_score=1.0,
                is_demo_mode=True,
                raw_prompt=trimmed
            )

        # 7. Fee Estimation
        if any(p in lower for p in ["estimate fee", "estimate network fee", "gas fee", "gas estimate", "how much is gas", "current network fee"]):
            amt = cls._extract_amount(lower) or "20"
            return IntentParseResponse(
                intent_type=IntentType.ESTIMATE_FEE,
                chain_id=chain_id,
                token_symbol="USDC",
                token_address=settings.test_token_address,
                amount=amt,
                confidence_score=1.0,
                is_demo_mode=True,
                raw_prompt=trimmed
            )

        # 8. Hypothetical Reserve / Policy Simulation
        if any(p in lower for p in ["violate my reserve", "reserve check", "breach my reserve", "simulate spending", "can i afford"]):
            amt = cls._extract_amount(lower) or "70"
            return IntentParseResponse(
                intent_type=IntentType.POLICY_INFO,
                chain_id=chain_id,
                token_symbol="USDC",
                token_address=settings.test_token_address,
                amount=amt,
                clarification_question=f"Simulating reserve impact for {amt} USDC transfer...",
                confidence_score=1.0,
                is_demo_mode=True,
                raw_prompt=trimmed
            )

        # 9. List Approved Entities / Vendors
        if any(p in lower for p in [
            "who can i send to", "list approved", "show suppliers", "show vendors",
            "approved entities", "who is approved", "list entities", "address book", "trusted contacts"
        ]):
            return IntentParseResponse(
                intent_type=IntentType.POLICY_INFO,
                chain_id=chain_id,
                clarification_question="Your approved entities include: Shenzhen Precision Hardware, AWS Cloud, OpenAI Billing, Vercel Hosting, Global Freight, Apex Workspace, DevOps Payroll, and CertiK Escrow.",
                confidence_score=1.0,
                is_demo_mode=True,
                raw_prompt=trimmed
            )

        # 10. Transfer Action Intent (Broad Natural Language Matching)
        transfer_keywords = ["send", "transfer", "pay", "wire", "disburse", "settle", "fund", "remit", "dispense", "allocate", "release"]
        is_transfer_phrase = any(re.search(rf"\b{kw}\b", lower) for kw in transfer_keywords)

        if is_transfer_phrase:
            extracted_amount = cls._extract_amount(lower)
            matched_entity = cls._find_entity_match(lower)

            # Direct 0x Ethereum address check
            direct_addr_match = re.search(r"0x[a-fA-F0-9]{40}", lower)
            direct_address = direct_addr_match.group(0) if direct_addr_match else None

            # Token resolution (USDC default)
            token_symbol = "ETH" if ("eth" in lower or "ethereum" in lower) else "USDC"
            token_info = KNOWN_TOKENS.get(token_symbol, KNOWN_TOKENS["USDC"])

            if extracted_amount and (matched_entity or direct_address):
                # Validate amount is strict positive decimal
                try:
                    amt_dec = Decimal(extracted_amount)
                    if amt_dec <= 0:
                        return IntentParseResponse(
                            intent_type=IntentType.UNSUPPORTED,
                            chain_id=chain_id,
                            requires_clarification=True,
                            clarification_question="Transfer amount must be greater than zero.",
                            confidence_score=0.9,
                            raw_prompt=trimmed
                        )
                except InvalidOperation:
                    return IntentParseResponse(
                        intent_type=IntentType.UNSUPPORTED,
                        chain_id=chain_id,
                        requires_clarification=True,
                        clarification_question="Invalid numeric amount provided.",
                        confidence_score=0.9,
                        raw_prompt=trimmed
                    )

                recipient_address = direct_address or matched_entity["address"]
                recipient_label = "Direct Address" if direct_address and not matched_entity else matched_entity["label"]

                return IntentParseResponse(
                    intent_type=IntentType.TRANSFER,
                    chain_id=chain_id,
                    token_address=token_info["address"],
                    token_symbol=token_info["symbol"],
                    recipient_address=recipient_address,
                    recipient_label=recipient_label,
                    amount=extracted_amount,
                    requires_clarification=False,
                    confidence_score=0.99,
                    is_demo_mode=True,
                    raw_prompt=trimmed
                )

            # Missing amount or recipient
            if not extracted_amount:
                return IntentParseResponse(
                    intent_type=IntentType.TRANSFER,
                    chain_id=chain_id,
                    requires_clarification=True,
                    clarification_question="Please specify the amount you wish to transfer (e.g., 'Pay 25 USDC to AWS Cloud').",
                    confidence_score=0.6,
                    raw_prompt=trimmed
                )

            if not matched_entity and not direct_address:
                return IntentParseResponse(
                    intent_type=IntentType.TRANSFER,
                    chain_id=chain_id,
                    requires_clarification=True,
                    clarification_question="Please specify a known entity or 0x address (e.g., 'Shenzhen Hardware', 'AWS', 'OpenAI', 'Global Logistics').",
                    confidence_score=0.6,
                    raw_prompt=trimmed
                )

        # Fallback for general conversational queries
        return IntentParseResponse(
            intent_type=IntentType.UNSUPPORTED,
            chain_id=chain_id,
            requires_clarification=True,
            clarification_question="I did not understand that command. Try: 'Pay 15 USDC to AWS Cloud', 'Wire 20 USDC to hardware supplier', or 'How much can I spend today?'.",
            confidence_score=0.2,
            is_demo_mode=True,
            raw_prompt=trimmed
        )
