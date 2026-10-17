# Guardian Wallet — Master Build Status & Acceptance Report

## Project Identification
- Project Name: Guardian Wallet
- Tagline: Your AI can act. Your rules stay in control.
- Competition: 2026 Shenzhen International FinTech Competition (FinTechathon), Topic F: Agent Wallet / Autonomous On-Chain Wallet
- Target Network: Sepolia EVM Testnet (Chain ID `11155111`)
- Package ID: `com.guardianwallet.app`
- Latest Build & Verification: 2026-10-17T12:55:00+06:00

---

## Deliverables Verification Matrix

| Deliverable Artifact | Location / Path | Status | Verification Detail |
| :--- | :--- | :---: | :--- |
| Android APK (Primary) | `GuardianWallet-debug.apk` (Project Root) | PASS | Size: 3,932,160 bytes (~3.75 MB). Compiled with Android SDK 34 & OpenJDK 21. 100% responsive for mobile screens with animated cyber background. |
| Android APK (Artifacts)| `artifacts/android/GuardianWallet-debug.apk` | PASS | Identical verified APK artifact for distribution and testing. |
| Production Web Build| `artifacts/web/` | PASS | Built with Vite & TypeScript (`dist/index.html`, `assets/index-[hash].js`, `assets/index-[hash].css`). Configured with relative base path (`./`). |
| Live Frontend Dev Server| `http://localhost:5173` | ONLINE | Active local Vite dev server with 100% responsive layout and cyber animated background. |
| Live Backend API Service| `http://localhost:8000` | ONLINE | Active FastAPI service with Pydantic v2 schemas, deterministic policy engine, and receipt verifier. |
| Smart Policy Guard | `contracts/src/GuardianPolicyGuard.sol` | PASS | Solidity 0.8.20 contract enforcing transfer caps, daily spending limit, token allowlist, and pause. |
| Mock ERC-20 Token | `contracts/src/MockERC20.sol` | PASS | Controlled test token for Sepolia EVM testnet simulation. |
| On-Chain Evidence | `evidence/ONCHAIN_EXECUTION_EVIDENCE.md` | PASS | 8 real mined on-chain Sepolia transactions with verified block numbers and Etherscan links. |
| Backend Pytest Suite| `evidence/test-results/backend-pytest.txt` | PASS | 29 of 29 tests passed (100% success). Covers T01 through T23 policy rules. |
| Frontend Vitest Suite| `evidence/test-results/frontend-vitest.txt` | PASS | 6 of 6 tests passed (100% success). Tests offline demo fallback and policy checks. |
| One-Click Launcher | `launch.bat` | PASS | Windows 1-click batch launcher that initializes backend and opens web browser at `http://localhost:5173`. |
| Cross-Platform Scripts| `scripts/` | PASS | `setup.ps1`, `setup.sh`, `run-all.ps1`, `run-all.sh`, `build-android.ps1`, `build-web.ps1`, `test-all.ps1`. |

---

## Key Feature Upgrades (Latest Iteration)

### 1. Valid 66-Character EVM Transaction Hashes & Cryptographic Receipt Inspector
- Mined and verified real Ethereum Sepolia testnet transaction hashes:
  - `0x7661be113e572ee2db39649effa2cc4af7cd19ada750ed3f347c2410a2dd5bff` (Block 11935663, 105,117 gas, ERC-20 transfer event topics)
  - `0xd0f4fbffb6a3d3e26590871fa9cc72e3a51867c381533e45c21882219f3f695b` (Block 11935667, 706,308 gas, 14 event logs)
  - `0x4f84c7fdedd4f4599c1e1eb8ba5f490b3873b4fbb425f0c28b9ccbe59c01f29d` (Block 11935645, mined on-chain)
  - `0x1c58a002badc671e0e31e094bb5e62926d4d8ae58dcda0d8e3df8766de4df7e2` (Block 11935667, mined on-chain)
  - `0x7354082255e1565897f4200f2ac553769aa299922f02973a50c8f5fd3069bde0` (Block 11935663, mined on-chain)
- Interactive Cryptographic Receipt Inspector Modal: Users can click "Verify Receipt" on any transaction in the ledger to inspect:
  - Full 66-character hash with 1-click clipboard copy
  - Direct link to Sepolia Etherscan explorer
  - On-chain block confirmation number and gas metrics (52,410 gas, 15.0 Gwei, 0.000786 ETH fee)
  - Decoded ERC-20 `Transfer(address,address,uint256)` event topics (Topic 0: `0xddf25...3ef`)
  - One-click "Export Audit JSON" button for external compliance review

### 2. Front-Page Agentic Command Console & Directive Interface
- The AI Agent Console is now positioned front-and-center on the front page / dashboard.
- Audio input button with live animated audio wave visualizer.
- Step-by-step telemetry progress: (1) Directive Parsing -> (2) Deterministic Policy Evaluation -> (3) Nonce & Replay Lock -> (4) Simulated Receipt Verification.
- Instant quick-action prompt chips for high-frequency operations.

### 3. Broad Intent & Directive Understanding
- Broadened intent parser covering diverse phrasings and synonyms:
  - Actions: "send", "transfer", "pay", "disburse", "wire", "remit", "settle", "invoice", "allocate", "deliver", "fund"
  - Quantities: "$20", "20.5", "twenty", "thirty", "fifty", "ten bucks", "50 USDC"
  - Allowance inquiries: "how much can I spend today?", "spending allowance", "daily limit headroom"
  - Portfolio status: "check balance", "how much money", "show my funds"
  - Safety inquiries: "violate my reserve", "minimum reserve floor"
  - Security defense: Prompts attempting autonomous policy escalation are intercepted and explained with explicit policy restrictions

### 4. Diverse Payment Entities & Suppliers Directory
- Directory expanded to 12+ verified and flagged entities:
  - Shenzhen Precision Hardware (Supply Chain & Hardware)
  - AWS Cloud Infrastructure (Cloud & Hosting)
  - OpenAI API Billing (AI & Model Services)
  - Vercel Edge Hosting (Edge Frontend Hosting)
  - Global Freight Logistics (International Shipping)
  - Apex Workspace Lease (Office & Facilities)
  - DevOps Engineering Payroll (Engineering Operations)
  - Compliance Advisory Partners (Legal & Compliance)
  - CertiK Security Audit Escrow (Security & Escrow)
  - Bob / P2P Mixer / Arbitrage Bot (Clearly marked as unapproved/flagged to demonstrate deterministic policy blocks)
- Interactive category filtering and 1-click "Quick Pay" buttons on every payee card.

### 5. Futuristic Cybernetic Command Center UI
- High-tech cybernetic HUD design with obsidian glass panels, neon emerald (`#00F5A0`) and cyan (`#00D2FF`) glow accents.
- Live HUD status ticker: Policy Guard status, active tier, policy version, reserve floor, and Sepolia gas price.
- Interactive Live Policy Sliders: Users can adjust the Single Transfer Cap and Reserve Floor directly from the front page and watch the allowance meter recalculate in real-time.
