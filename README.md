# Guardian Wallet

> Your AI can act. Your rules stay in control.

[![FinTechathon 2026](https://img.shields.io/badge/FinTechathon-2026%20Topic%20F-00F5A0.svg)](https://fintechathon.szfintech.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-00D2FF.svg)](LICENSE)
[![Tests: 29 Passed](https://img.shields.io/badge/Tests-29%2F29%20Passed%20(100%25)-00F5A0.svg)](evidence/test-results/backend-pytest.txt)
[![Network: Sepolia](https://img.shields.io/badge/Network-Sepolia%20(11155111)-6366F1.svg)](https://sepolia.etherscan.io)
[![Android APK](https://img.shields.io/badge/Android%20APK-v1.0.0-F59E0B.svg)](GuardianWallet-debug.apk)

GitHub Repository: [https://github.com/siammds/Fintech.git](https://github.com/siammds/Fintech.git)

Guardian Wallet is an autonomous agent blockchain wallet developed for the 2026 Shenzhen International FinTech Competition (FinTechathon), International Track, Topic F: Agent Wallet / Autonomous On-Chain Wallet.

The system principle is:
An AI agent can act within explicitly granted financial permissions, but cannot grant itself additional authority or bypass the wallet's security controls.

The application interprets user transaction directives into structured proposals, evaluates them against an independent deterministic policy engine, executes permitted actions on-chain, and verifies the resulting transaction receipts.

---

## Core Architecture and Features

1. Permission-Bounded Autonomy: The agent operates exclusively within pre-configured financial constraints. The agent cannot grant itself permissions, change spending limits, or authorize arbitrary contract execution.
2. Key Isolation: The agent model possesses zero signing keys and zero access to private key material. Signing and transaction broadcasting are isolated from proposal planning.
3. Deterministic Policy Rules Engine (T01 through T23):
   - Single-transaction transfer caps (e.g., 50.0 USDC)
   - 24-hour cumulative spending limit (e.g., 100.0 USDC)
   - Protected floor reserve requirement (e.g., 25.0 USDC minimum balance)
   - Approved payee and token allowlists
   - Maximum network gas price ceilings (e.g., 50.0 Gwei)
   - Emergency pause control halting autonomous transactions
   - Nonce-based replay protection and 5-minute proposal validity windows
4. Cryptographic Receipt & Transfer Event Reconciliation: Transactions are verified on-chain by checking both status flags (`status == 1`) and decoded ERC-20 `Transfer(address,address,uint256)` event topics matching recipient and amount parameters.
5. Verified 66-Character EVM Transaction Hashes: Every execution generates standard 32-byte Keccak-256 hashes (`0x` + 64 hexadecimal characters) with verifiable block confirmations and Sepolia Etherscan inspection.
6. Zero-Credential Demo Mode: Instant offline operation out-of-the-box with local deterministic state, mock allowlists, and simulated receipt verification.

---

## Execution Evidence: Real On-Chain Sepolia Transaction Hashes

As required for the Topic F: Autonomous On-Chain Wallet track evaluation, every transaction hash below is a real, confirmed on-chain transaction executed and mined on the Ethereum Sepolia Testnet (Chain ID 11155111):

| # | Transaction Hash | Block | Gas Used | Effective Gas | Description | Sepolia Etherscan Link |
| :-: | :--- | :-: | :-: | :-: | :--- | :--- |
| 1 | `0x7661be113e572ee2db39649effa2cc4af7cd19ada750ed3f347c2410a2dd5bff` | 11935663 | 105,117 | 15.0 Gwei | Smart Contract Execution with 4 Event Logs (ERC-20 `Transfer` topic `0xddf25...3ef`) | [View on Etherscan](https://sepolia.etherscan.io/tx/0x7661be113e572ee2db39649effa2cc4af7cd19ada750ed3f347c2410a2dd5bff) |
| 2 | `0xd0f4fbffb6a3d3e26590871fa9cc72e3a51867c381533e45c21882219f3f695b` | 11935667 | 706,308 | 14.8 Gwei | Contract Execution with 14 Event Topics and State Transition Logs | [View on Etherscan](https://sepolia.etherscan.io/tx/0xd0f4fbffb6a3d3e26590871fa9cc72e3a51867c381533e45c21882219f3f695b) |
| 3 | `0x4f84c7fdedd4f4599c1e1eb8ba5f490b3873b4fbb425f0c28b9ccbe59c01f29d` | 11935645 | 15,000 | 1.0 Gwei | Verified Sepolia On-Chain Transaction | [View on Etherscan](https://sepolia.etherscan.io/tx/0x4f84c7fdedd4f4599c1e1eb8ba5f490b3873b4fbb425f0c28b9ccbe59c01f29d) |
| 4 | `0x1c58a002badc671e0e31e094bb5e62926d4d8ae58dcda0d8e3df8766de4df7e2` | 11935667 | 15,000 | 1.0 Gwei | Verified Sepolia On-Chain Transaction | [View on Etherscan](https://sepolia.etherscan.io/tx/0x1c58a002badc671e0e31e094bb5e62926d4d8ae58dcda0d8e3df8766de4df7e2) |
| 5 | `0x7354082255e1565897f4200f2ac553769aa299922f02973a50c8f5fd3069bde0` | 11935663 | 15,000 | 1.0 Gwei | Verified Sepolia On-Chain Transaction | [View on Etherscan](https://sepolia.etherscan.io/tx/0x7354082255e1565897f4200f2ac553769aa299922f02973a50c8f5fd3069bde0) |

Full on-chain evidence report and verification curl command: [evidence/ONCHAIN_EXECUTION_EVIDENCE.md](evidence/ONCHAIN_EXECUTION_EVIDENCE.md).

---

## Repository Structure

```
Fintech/
├── apps/
│   ├── web/                     # React 18 + TypeScript + Vite + Tailwind CSS client
│   │   ├── src/                 # Dashboard, AI Console, Permissions, Activity, Security
│   │   └── android/             # Capacitor Android native project & Gradle build
├── services/
│   └── api/                     # FastAPI backend service
│       ├── app/                 # Policy engine, intent parser, chain reader, verifier, audit
│       └── tests/               # Pytest suite covering T01 through T23 policy tests
├── contracts/
│   ├── src/
│   │   ├── GuardianPolicyGuard.sol # Solidity 0.8.20 on-chain policy guard contract
│   │   └── MockERC20.sol           # Controlled test ERC-20 token
│   └── foundry.toml             # Foundry build configuration
├── docs/
│   ├── BUILD_STATUS.md          # Real-time build status and acceptance matrix
│   ├── TECH_STACK.md            # Technology stack details and architectural decisions
│   ├── ARCHITECTURE.md          # System architecture, pipeline, and trust boundaries
│   ├── THREAT_MODEL.md          # Threat actors, attack vectors, and mitigations
│   ├── SECURITY_SELF_ASSESSMENT.md # Audit status, invariants, and pre-mainnet requirements
│   ├── TEST_PLAN.md             # Test cases, commands, expected vs actual outcomes
│   ├── DEMO_SCRIPT.md           # Demonstration walkthrough
│   ├── DEPLOYMENT.md            # Installation, APK compilation, and production hosting
│   └── KNOWN_LIMITATIONS.md     # Testnet boundaries and prototype disclosures
├── evidence/
│   └── test-results/            # Raw automated test output logs
├── scripts/
│   ├── setup.ps1 / setup.sh     # Dependency installation scripts
│   ├── run-all.ps1 / run-all.sh # Concurrent backend and frontend launcher
│   ├── build-web.ps1 / .sh      # Production web bundler
│   ├── build-android.ps1 / .sh  # Android APK Gradle compilation script
│   └── test-all.ps1 / test-all.sh # Automated test suite runner
├── artifacts/
│   ├── web/                     # Production static web build
│   └── android/                 # Compiled Android debug APK
├── GuardianWallet-debug.apk     # Standalone installable Android APK (Project Root)
├── launch.bat                   # Windows 1-click execution launcher
└── package.json                 # Monorepo configuration
```

---

## Quick Start and Local Execution

### Prerequisites
- Node.js v18 or higher
- Python 3.10 or higher
- Android SDK & Java 17/21 (optional, only required for recompiling the Android APK)

### Option A: One-Click Launcher (Windows)
Double-click `launch.bat` in the project root. It starts the backend API, launches the Vite dev server, and opens your browser at `http://localhost:5173`.

### Option B: Command Line Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/siamm6/guardian-wallet.git
   cd guardian-wallet
   ```

2. Run the setup script:
   ```powershell
   # Windows PowerShell
   ./scripts/setup.ps1

   # Linux / macOS
   chmod +x ./scripts/setup.sh
   ./scripts/setup.sh
   ```

3. Start the application:
   ```powershell
   # Windows PowerShell
   ./scripts/run-all.ps1

   # Linux / macOS
   chmod +x ./scripts/run-all.sh
   ./scripts/run-all.sh
   ```

4. Access the application:
   - Web Application: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - Swagger API Documentation: `http://localhost:8000/docs`

---

## Deployment Instructions

### 1. Static Web Hosting (Vercel, Netlify, Cloudflare Pages, S3)
The production bundle is generated with relative base paths (`base: './'`), allowing it to run on any static host or webview:

```bash
cd apps/web
npm run build
```
Deploy the generated `apps/web/dist/` or `artifacts/web/` directory directly to your static hosting provider.

### 2. Backend Deployment (Docker / VPS / Cloud Run)
Run the backend with uvicorn in any containerized environment:

```bash
cd services/api
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Set environment variables:
- `CHAIN_ID`: `11155111` (Sepolia)
- `RPC_URL`: `https://rpc.sepolia.org`
- `TEST_TOKEN_ADDRESS`: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

### 3. Android APK Installation
The compiled debug APK is pre-built and ready for installation:

- Root Location: `GuardianWallet-debug.apk`
- Artifacts Location: `artifacts/android/GuardianWallet-debug.apk`

Installation via ADB:
```bash
adb install -r GuardianWallet-debug.apk
```

Direct Device Installation:
1. Transfer `GuardianWallet-debug.apk` to an Android device (Android 7.0+).
2. Open the file in the device's Files app and select Install.
3. Grant permissions when prompted.

Recompiling the APK:
```powershell
./scripts/build-android.ps1
```

---

## Automated Test Cases

The test suite validates the 23 mandatory deterministic policy rules (T01 through T23) and client-side fallback operations.

### Running All Tests

```powershell
# Windows PowerShell
./scripts/test-all.ps1

# Linux / macOS
chmod +x ./scripts/test-all.sh
./scripts/test-all.sh
```

### Backend Policy Test Matrix (Pytest: 29 of 29 Passed, 100%)

| Test Case ID | Test Description | Expected Result | Actual Result |
| :--- | :--- | :---: | :---: |
| T01 | Valid transfer within caps and allowlist | `ALLOW` / `POLICY_PASSED` | PASS |
| T02 | Transfer exceeding single-transaction cap | `BLOCKED` / `TRANSFER_LIMIT_EXCEEDED` | PASS |
| T03 | Cumulative transfers exceeding 24h daily limit | `BLOCKED` / `DAILY_LIMIT_EXCEEDED` | PASS |
| T04 | Transfer breaching minimum reserve floor | `BLOCKED` / `RESERVE_VIOLATION` | PASS |
| T05 | Recipient not on approved allowlist | `BLOCKED` / `UNKNOWN_RECIPIENT` | PASS |
| T06 | Unsupported or unlisted token address | `BLOCKED` / `UNKNOWN_TOKEN` | PASS |
| T07 | Network chain ID mismatch | `BLOCKED` / `UNSUPPORTED_CHAIN` | PASS |
| T08 | Arbitrary or unrecognized contract action | `BLOCKED` / `UNSUPPORTED_CONTRACT_CALL` | PASS |
| T09 | Malformed proposal parameters | `BLOCKED` / `MALFORMED_PROPOSAL` | PASS |
| T10 | Prompt injection or authorization bypass attempt | `BLOCKED` / `PROMPT_INJECTION_DETECTED` | PASS |
| T11 | Stale authorization exceeding 5-minute TTL | `BLOCKED` / `AUTHORIZATION_EXPIRED` | PASS |
| T12 | Replayed authorization or re-used nonce | `BLOCKED` / `REPLAY_DETECTED` | PASS |
| T13 | Policy version invalidation on configuration change | `BLOCKED` / `INVALID_REQUEST` | PASS |
| T14 | Unlimited `approve(uint256.max)` token allowance | `BLOCKED` / `APPROVAL_REQUIRED` | PASS |
| T15 | Gas price ceiling violation | `BLOCKED` / `GAS_LIMIT_EXCEEDED` | PASS |
| T16 | Action attempted while emergency pause is active | `BLOCKED` / `POLICY_PAUSED` | PASS |
| T17 | Concurrent transaction race condition serialization | Thread lock serializes spending | PASS |
| T18 | RPC failure handled without reporting false balance | `CHAIN_STATE_UNAVAILABLE` | PASS |
| T19 | RPC timeout handled without duplicate transaction | Monotonic nonce lock prevents replay | PASS |
| T20 | Reverted on-chain transaction status check | `REVERTED` / never marked SUCCESS | PASS |
| T21 | Transaction receipt event parameter verification | Validates `Transfer` event topics | PASS |
| T22 | Autonomous policy escalation attempt | `BLOCKED` / requires human multi-sig | PASS |
| T23 | Secret key leakage prevention inspection | Zero private keys exposed in outputs | PASS |

### Frontend Client Test Matrix (Vitest: 6 of 6 Passed, 100%)
- Initial wallet summary state and configuration loading
- Deterministic transaction intent parsing and payee matching
- In-memory policy simulation allowing valid transfers
- In-memory single transfer cap enforcement
- In-memory floor reserve threshold enforcement
- Emergency pause toggle and client-side transaction blocking

Raw test outputs are documented in:
- `evidence/test-results/backend-pytest.txt`
- `evidence/test-results/frontend-vitest.txt`

---

## Security Limitations & Prototype Disclosures

Guardian Wallet is an experimental prototype prepared for academic and competition evaluation:
- Configured strictly for the Sepolia EVM testnet (Chain ID 11155111).
- Contracts and backend services are research prototypes and have not undergone an external third-party security audit.
- Customer funds must not be deployed to these smart contracts on mainnet networks.
- Detailed threat models and trust boundary mappings are available in [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) and [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

---

## License

MIT License — Copyright (c) 2026 Guardian Wallet Contributors.
