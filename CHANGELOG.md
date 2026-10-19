# Changelog

All notable changes to the Guardian Wallet project are documented in this file.

---

## Update 2: Live Sepolia On-Chain Reconciliation and Allowlist Enhancements

### Added
- Real On-Chain Sepolia Testnet Hashes: Mined and confirmed 8 verifiable transactions on Ethereum Sepolia (Chain ID 11155111) for competition evaluation.
- Live Public RPC Integration: Configured reliable fallback to public Sepolia node (ethereum-sepolia-rpc.publicnode.com).
- Interactive Counterparty Search: Added real-time allowlist filtering and search bar in the Financial Permission Centre.
- Cryptographic Ledger Export: Enabled one-click JSON export of audit records in the Activity Ledger for compliance review.
- Dynamic Receipt Event Verification: Enhanced receipt inspector to parse ERC-20 Transfer topic logs (0xddf25...3ef) directly from on-chain block confirmations.

### Changed
- Standardized all transaction hashes to 66-character EVM format with direct Sepolia Etherscan inspection links.
- Updated repository remote configuration and documentation targets to github.com/siammds/Fintech.
- Removed version references in UI badges and protocol status indicators for cleaner presentation.

---

## Update 1: Core Architecture and Policy Engine Baseline

### Added
- Deterministic Policy Rules Engine: Implemented complete suite of 23 security rules (T01 through T23) covering spending caps, reserve floors, allowlists, and replay locks.
- Frontend Client Application: Built responsive React 18, TypeScript, Tailwind CSS interface with animated background visualizer.
- Android Mobile Package: Configured Capacitor Android build with standalone debug APK generation.
- FastAPI Backend Service: Implemented REST API with Pydantic schemas, SQLite audit logging, and deterministic fallback mode.
- Solidity Policy Contracts: Authored GuardianPolicyGuard.sol and MockERC20.sol testnet contracts.
- Automated Test Suite: Created comprehensive Pytest (29 tests) and Vitest (6 tests) suites with 100% pass rates.
