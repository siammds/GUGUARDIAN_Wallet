# Guardian Wallet — Security Self-Assessment & Risk Disclosure

## 1. Executive Summary

This Security Self-Assessment provides an honest evaluation of Guardian Wallet's security architecture, implemented controls, test outcomes, and operational boundaries.

Formal Notice: Guardian Wallet is a prototype developed for the 2026 Shenzhen International FinTech Competition (FinTechathon), Topic F. It has NOT undergone a formal external cryptographic or smart-contract audit. It is strictly configured for testnet operation (Sepolia) and must NOT be deployed with real customer mainnet funds.

---

## 2. Policy Enforcement Layers

Guardian Wallet implements defense-in-depth across three architectural layers:

```
[ Layer 1: Client Advisory & UI Validation ]
   └── Web & Android input validation, speech review dialog, parameter formatting

[ Layer 2: Deterministic Backend Policy Engine ]
   └── Strict limits (T01-T19), allowlists, reserve checks, replay prevention, concurrency locks

[ Layer 3: On-Chain Smart Policy Guard ]
   └── GuardianPolicyGuard.sol on Sepolia EVM testnet enforcing on-chain caps and pause
```

### Distinction of Enforcement Responsibilities:
- On-Chain Enforced: Single transfer ceiling, daily spending limit, token allowlist, emergency pause state in `GuardianPolicyGuard.sol`.
- Backend Enforced: Authorization expiry timestamps (TTL), authorization nonces, concurrency thread serialization, prompt-injection detection, receipt Transfer event verification.
- Client Advisory: Visual risk indicators, speech transcription confirmation dialogs, gas price estimation alerts.

---

## 3. Supported vs. Blocked Operations

### Supported Autonomous Operations (Tier 2):
- ERC-20 transfers of approved tokens (`USDC`) to pre-approved recipient addresses.
- Transfers within the configured single-transaction cap (default: 50 USDC).
- Transfers within the remaining daily spending allowance (default: 100 USDC).
- Transfers that maintain the protected floor reserve (default: 25 USDC).
- Read-only balance, allowance, and transaction history queries.

### Blocked Operations:
- Any transfer to an unapproved or unknown recipient address in Tier 2.
- Any transaction attempting unlimited token approvals (`approve(spender, 2^256-1)`).
- Any arbitrary contract calldata or contract creation.
- Any transfer exceeding the single-transfer cap or remaining daily limit.
- Any transfer that breaches the protected reserve floor.
- Any transaction attempted while the emergency pause is enabled.
- Any authorization whose 5-minute TTL has expired or whose nonce has been seen.
- Any prompt attempting to override wallet rules or modify policy configurations.

---

## 4. Key Management & Secret Protection

- No Seed Phrase Ingestion: Guardian Wallet never prompts users for seed phrases, mnemonic words, or master keys.
- No Private Keys in LLM Prompts: Prompts contain only sanitized human intent descriptions. Private keys are never passed into model context windows.
- No Embedded Secrets in APK: The Android APK contains only compiled web assets, Capacitor plugins, and standard Android XML manifests. No private keys, RPC passwords, or API keys are bundled into the APK binary.
- Log Redaction: All diagnostic and audit logging filters out sensitive key patterns (verified via automated test T23).

---

## 5. Automated Test Coverage & Verification

All 23 security and policy test cases (T01 through T23) were executed against the deterministic policy engine:

| Test ID | Security Requirement | Status | Evidence Path |
| :--- | :--- | :--- | :--- |
| T01 | Valid transfer to approved recipient is allowed | PASS | `evidence/test-results/backend-pytest.txt` |
| T02 | Transfer above single cap is blocked | PASS | `evidence/test-results/backend-pytest.txt` |
| T03 | Transfer exceeding daily allowance is blocked | PASS | `evidence/test-results/backend-pytest.txt` |
| T04 | Transfer breaching reserve floor is blocked | PASS | `evidence/test-results/backend-pytest.txt` |
| T05 | Unknown recipient blocked in Tier 2 | PASS | `evidence/test-results/backend-pytest.txt` |
| T06 | Unsupported token contract is blocked | PASS | `evidence/test-results/backend-pytest.txt` |
| T07 | Unsupported chain ID is blocked | PASS | `evidence/test-results/backend-pytest.txt` |
| T08 | Unknown / arbitrary action type rejected | PASS | `evidence/test-results/backend-pytest.txt` |
| T09 | Malformed LLM output format rejected | PASS | `evidence/test-results/backend-pytest.txt` |
| T10 | Prompt injection cannot override policy | PASS | `evidence/test-results/backend-pytest.txt` |
| T11 | Expired authorization TTL rejected | PASS | `evidence/test-results/backend-pytest.txt` |
| T12 | Replayed authorization nonce rejected | PASS | `evidence/test-results/backend-pytest.txt` |
| T13 | Policy version change invalidates stale auth | PASS | `evidence/test-results/backend-pytest.txt` |
| T14 | Unlimited token approval is rejected | PASS | `evidence/test-results/backend-pytest.txt` |
| T15 | Gas ceiling violation follows configured policy | PASS | `evidence/test-results/backend-pytest.txt` |
| T16 | Emergency pause blocks autonomous actions | PASS | `evidence/test-results/backend-pytest.txt` |
| T17 | Concurrent requests cannot bypass spending limit | PASS | `evidence/test-results/backend-pytest.txt` |
| T18 | Stale / disconnected RPC state does not produce false zero | PASS | `evidence/test-results/backend-pytest.txt` |
| T19 | RPC timeout does not trigger duplicate payment | PASS | `evidence/test-results/backend-pytest.txt` |
| T20 | Reverted transaction is not reported as successful | PASS | `evidence/test-results/backend-pytest.txt` |
| T21 | Mismatched receipt or event rejected as verified success | PASS | `evidence/test-results/backend-pytest.txt` |
| T22 | Unauthorized users cannot alter policy | PASS | `evidence/test-results/backend-pytest.txt` |
| T23 | Secrets are not exposed in logs or API responses | PASS | `evidence/test-results/backend-pytest.txt` |

---

## 6. What Would Be Needed Before Mainnet Real-Money Deployment

1. Formal Smart Contract Audit: Professional verification of `GuardianPolicyGuard.sol` and ERC-4337 smart-account account validation logic.
2. ERC-4337 Account Abstraction Integration: Migration from standard EOA key execution to native smart-account modular validation (e.g. Biconomy or Safe module).
3. Hardware Security Module (HSM) / Secure Enclave: Key signing delegating to Android Keystore / iOS Secure Enclave with biometric authentication.
4. Decentralized Oracles for Token Pricing: Dynamic USD-denominated spending limits using Chainlink feeds rather than static token amounts.
5. Formal Verification: Mathematical proof of policy invariants using Certora or similar formal verification engines.
