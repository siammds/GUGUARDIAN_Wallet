# Guardian Wallet — Known Limitations & Risk Disclosures

## 1. Prototype & Evaluation Status
Guardian Wallet is a research prototype built specifically for the 2026 Shenzhen International FinTech Competition (FinTechathon), International Track, Topic F.
- Not Formally Audited: Neither the smart contracts (`GuardianPolicyGuard.sol`) nor the backend service has been audited by a third-party security firm.
- Testnet Scope: Configured exclusively for the Sepolia EVM testnet (Chain ID 11155111). It must not be used to secure real financial assets or mainnet funds.

---

## 2. On-Chain vs. Backend Policy Enforcement Boundaries
A critical architectural honesty requirement is distinguishing between controls enforced directly by Ethereum smart contracts versus those enforced by the off-chain application backend:

| Policy Control | Off-Chain (Backend) | On-Chain (`GuardianPolicyGuard.sol`) | Limitations |
| :--- | :---: | :---: | :--- |
| Single Transfer Cap | Verified | Enforced | Reverts on-chain if `amount > maxTransferCap` |
| Daily Spending Limit| Verified | Enforced | Tracks daily cumulative transfers on-chain |
| Emergency Pause | Verified | Enforced | Stops autonomous transactions; cannot reverse mined blocks |
| Recipient Allowlist | Verified | Enforced | Reverts if destination not in approved mapping |
| Protected Floor Reserve | Enforced | Monitored | Requires account abstraction module for strict on-chain revert |
| Authorization Nonce & TTL | Enforced | Planned | Off-chain replay cache; on-chain replay protected by tx nonce |
| Prompt Injection Filter | Enforced | N/A | Language processing occurs prior to chain interaction |

---

## 3. Speech Recognition & Voice Input Limitations
- Platform Availability: Web speech recognition relies on browser support (`window.SpeechRecognition` or `window.webkitSpeechRecognition`). Supported in Chrome, Edge, and Safari; Firefox does not natively support the Web Speech API without experimental flags.
- Third-Party Processing Disclosure: Standard browser Web Speech API implementations (such as Google Chrome) may transmit compressed voice audio to provider cloud servers for transcription. Audio is not guaranteed to remain local unless using offline native device speech recognizers.
- Ambiguity & Noise: Ambient acoustic noise can cause transcription errors. Guardian Wallet mitigates this by requiring visual confirmation of the transcribed text before proposal evaluation.

---

## 4. Blockchain & Network Constraints
- Fee Volatility: Gas price estimates are snapshots based on the latest block's base fee. Rapid network congestion spikes between proposal generation and block inclusion may cause transactions to encounter higher gas costs.
- Public Ledger Visibility: Ethereum testnets are publicly viewable. All transaction amounts, destination addresses, and timestamps are visible on Etherscan.
- RPC Availability: If the public Sepolia RPC endpoint experiences rate-limiting or downtime, live balance queries may fail. Guardian Wallet's Demo Mode provides fully functional local state to guarantee offline demonstrability.
