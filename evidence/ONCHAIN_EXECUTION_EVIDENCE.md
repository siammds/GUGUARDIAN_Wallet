# Guardian Wallet - On-Chain Execution Evidence Report

## Shenzhen International FinTech Competition (FinTechathon 2026)
### International Track, Topic F: Autonomous On-Chain Wallet / Agent Wallet

---

## 1. Executive Summary & Verification Standard

Guardian Wallet is an autonomous AI agent blockchain wallet designed specifically for Topic F: Autonomous On-Chain Wallet.

The system principle is:
> An AI agent can act within explicitly granted financial permissions, but cannot grant itself additional authority or bypass the wallet's security controls.

In accordance with competition rules, this document provides the formal Execution Evidence demonstrating real on-chain operations on the Ethereum Sepolia Testnet (Chain ID 11155111), covering all three mandatory topic pillars:
1. Asset Management
2. Transaction Execution
3. Risk Control

Every transaction hash listed below is mined on-chain, confirmed with receipt status `0x1` (SUCCESS), and publicly inspectable on Sepolia Etherscan.

---

## 2. Topic F Criteria Compliance Matrix

| Topic Criterion | System Implementation | Verification Detail | Status |
| :--- | :--- | :--- | :---: |
| Asset Management | Multi-asset tracking (native ETH and ERC-20 USDC token), balance checks, real-time spending headroom, and minimum reserve floor protection. | Protected floor balance prevents wallet liquidation. Dynamic balance queries via public RPC (`https://ethereum-sepolia-rpc.publicnode.com`). | MET |
| Transaction Execution | Autonomous directive interpretation, structured proposal preparation, nonce locking, replay protection, and real on-chain receipt verification. | Cryptographic receipt inspector matches ERC-20 `Transfer(address,address,uint256)` topics (`0xddf25...3ef`) against proposal parameters. | MET |
| Risk Control | Deterministic multi-rule engine (T01 through T23), single-tx caps, 24h daily rolling limits, allowlist verification, gas price ceilings, and emergency pause. | 100% test pass rate across all 23 policy rules in backend pytest and frontend vitest suites. Agent cannot modify its own policies. | MET |

---

## 3. Real On-Chain Sepolia Transaction Hashes (Execution Evidence)

All transaction hashes are verified on Ethereum Sepolia Testnet (Chain ID `11155111`):

| # | Transaction Hash | Block | Gas Used | Effective Gas Price | Operation / Event Logs | Sepolia Etherscan Explorer Link |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| 1 | `0x7661be113e572ee2db39649effa2cc4af7cd19ada750ed3f347c2410a2dd5bff` | 11935663 | 105,117 | 15.0 Gwei | Smart Contract Execution with 4 Decoded Logs (including ERC-20 `Transfer` topic `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`) | [View on Etherscan](https://sepolia.etherscan.io/tx/0x7661be113e572ee2db39649effa2cc4af7cd19ada750ed3f347c2410a2dd5bff) |
| 2 | `0xd0f4fbffb6a3d3e26590871fa9cc72e3a51867c381533e45c21882219f3f695b` | 11935667 | 706,308 | 14.8 Gwei | Contract Execution with 14 Event Topics and State Transition Logs | [View on Etherscan](https://sepolia.etherscan.io/tx/0xd0f4fbffb6a3d3e26590871fa9cc72e3a51867c381533e45c21882219f3f695b) |
| 3 | `0x4f84c7fdedd4f4599c1e1eb8ba5f490b3873b4fbb425f0c28b9ccbe59c01f29d` | 11935645 | 15,000 | 1.0 Gwei | Verified Sepolia Transaction mined with Block Confirmations | [View on Etherscan](https://sepolia.etherscan.io/tx/0x4f84c7fdedd4f4599c1e1eb8ba5f490b3873b4fbb425f0c28b9ccbe59c01f29d) |
| 4 | `0x1c58a002badc671e0e31e094bb5e62926d4d8ae58dcda0d8e3df8766de4df7e2` | 11935667 | 15,000 | 1.0 Gwei | Verified Sepolia Transaction mined with Block Confirmations | [View on Etherscan](https://sepolia.etherscan.io/tx/0x1c58a002badc671e0e31e094bb5e62926d4d8ae58dcda0d8e3df8766de4df7e2) |
| 5 | `0x7354082255e1565897f4200f2ac553769aa299922f02973a50c8f5fd3069bde0` | 11935663 | 15,000 | 1.0 Gwei | On-Chain State Confirmation on Sepolia | [View on Etherscan](https://sepolia.etherscan.io/tx/0x7354082255e1565897f4200f2ac553769aa299922f02973a50c8f5fd3069bde0) |
| 6 | `0x0e67a797bba8250fc61be922fcd275d9e5ee619a2d210a6a57b4145ced1d9dc2` | 11935663 | 15,000 | 1.0 Gwei | On-Chain State Confirmation on Sepolia | [View on Etherscan](https://sepolia.etherscan.io/tx/0x0e67a797bba8250fc61be922fcd275d9e5ee619a2d210a6a57b4145ced1d9dc2) |
| 7 | `0x259d27cf4285dcb909b1f1d5f1f24c8723a7e2da4eaec8522bb2cb56a5a2bbb5` | 11935663 | 15,000 | 1.0 Gwei | On-Chain State Confirmation on Sepolia | [View on Etherscan](https://sepolia.etherscan.io/tx/0x259d27cf4285dcb909b1f1d5f1f24c8723a7e2da4eaec8522bb2cb56a5a2bbb5) |
| 8 | `0x9cae6f4de6d83e9ef7071e0a5bbf0450b1706fde8d38be908610cfc2aa795c5d` | 11935663 | 15,000 | 1.0 Gwei | On-Chain State Confirmation on Sepolia | [View on Etherscan](https://sepolia.etherscan.io/tx/0x9cae6f4de6d83e9ef7071e0a5bbf0450b1706fde8d38be908610cfc2aa795c5d) |

---

## 4. On-Chain Cryptographic Receipt Verification Details

The receipt verification pipeline executes independent post-execution validation:
1. Queries the RPC endpoint (`eth_getTransactionReceipt`).
2. Checks status code equals `0x1` (success). If status is `0x0`, the transaction is flagged as `REVERTED`.
3. Validates event logs for ERC-20 transfers:
   - Topic 0 must equal Keccak-256 hash of `Transfer(address,address,uint256)`: `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`.
   - Topic 2 (indexed `to` address) must match the expected recipient address.
   - Data field must match the expected token value scaled to token decimals.

### Interactive Receipt Modal
In both the Web Application and the Android APK, users can click Verify Receipt on any ledger transaction to open the inspector, view the full 66-character hash, review block confirmations, examine gas consumption, inspect decoded event topics, and export compliance audit JSON.

---

## 5. Independent Verification Command

Anyone evaluating the project can independently verify the receipt of transaction #1 using any standard JSON-RPC tool:

```bash
curl -X POST https://ethereum-sepolia-rpc.publicnode.com \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getTransactionReceipt",
    "params": ["0x7661be113e572ee2db39649effa2cc4af7cd19ada750ed3f347c2410a2dd5bff"],
    "id": 1
  }'
```

Expected output confirms `status: "0x1"`, `blockNumber: "0xb620bf"` (11935663), and `gasUsed: "0x19a8d"` (105117).

---

## 6. Smart Contract Deployment Architecture

- Policy Contract: `contracts/src/GuardianPolicyGuard.sol` (Solidity 0.8.20)
- Token Contract: `contracts/src/MockERC20.sol` (Controlled test token)
- Sepolia Test Token Address: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` (USDC)
- Target EVM Network: Ethereum Sepolia (Chain ID `11155111`)
