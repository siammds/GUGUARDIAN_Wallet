# Guardian Wallet — Comprehensive Test Plan & Verification Outcomes

## 1. Test Suite Architecture

Guardian Wallet uses a multi-layered testing strategy combining:
1. Backend Policy Engine Tests (`pytest`): Verifies the 23 mandatory deterministic rules (T01–T23).
2. FastAPI Endpoint Integration Tests (`httpx` / `TestClient`): Validates HTTP schemas, status codes, and error payloads.
3. Frontend Component & Store Tests (`vitest`): Validates UI state, offline demo execution, and voice hook safety.
4. Native Android APK Build & Packaging Verification: Verifies APK compilation, package ID, and asset integrity.

---

## 2. Policy Engine Automated Test Matrix (T01 – T23)

| ID | Test Name | Target Invariant | Command | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T01 | `test_t01_valid_transfer_allowed` | Permitted transfer to approved contact | `pytest services/api/tests/test_policy.py -k t01` | Decision: `ALLOW` | PASS |
| T02 | `test_t02_transfer_cap_exceeded` | Single transfer cap enforcement | `pytest services/api/tests/test_policy.py -k t02` | Decision: `BLOCKED` (`TRANSFER_LIMIT_EXCEEDED`) | PASS |
| T03 | `test_t03_daily_limit_exceeded` | Daily cumulative allowance cap | `pytest services/api/tests/test_policy.py -k t03` | Decision: `BLOCKED` (`DAILY_LIMIT_EXCEEDED`) | PASS |
| T04 | `test_t04_reserve_violation` | Minimum reserve protection floor | `pytest services/api/tests/test_policy.py -k t04` | Decision: `BLOCKED` (`RESERVE_VIOLATION`) | PASS |
| T05 | `test_t05_unknown_recipient_blocked` | Autonomous allowlist restriction | `pytest services/api/tests/test_policy.py -k t05` | Decision: `BLOCKED` (`UNKNOWN_RECIPIENT`) | PASS |
| T06 | `test_t06_unsupported_token_blocked` | Token contract address validation | `pytest services/api/tests/test_policy.py -k t06` | Decision: `BLOCKED` (`UNKNOWN_TOKEN`) | PASS |
| T07 | `test_t07_unsupported_chain_blocked` | Target chain ID boundary | `pytest services/api/tests/test_policy.py -k t07` | Decision: `BLOCKED` (`UNSUPPORTED_CHAIN`) | PASS |
| T08 | `test_t08_unknown_action_type_rejected` | Calldata restriction (ERC-20 only) | `pytest services/api/tests/test_policy.py -k t08` | Decision: `BLOCKED` (`UNSUPPORTED_CONTRACT_CALL`) | PASS |
| T09 | `test_t09_malformed_llm_output_rejected`| Schema validation of AI outputs | `pytest services/api/tests/test_policy.py -k t09` | Output flagged as invalid / unsupported | PASS |
| T10 | `test_t10_prompt_injection_prevented` | Resistance to adversarial jailbreaks | `pytest services/api/tests/test_policy.py -k t10` | Pre-filter flags injection attempt | PASS |
| T11 | `test_t11_expired_authorization_rejected`| 5-minute authorization TTL | `pytest services/api/tests/test_policy.py -k t11` | Decision: `BLOCKED` (`AUTHORIZATION_EXPIRED`) | PASS |
| T12 | `test_t12_replayed_authorization_rejected`| Nonce reuse prevention | `pytest services/api/tests/test_policy.py -k t12` | Decision: `BLOCKED` (`REPLAY_DETECTED`) | PASS |
| T13 | `test_t13_policy_version_invalidation` | Policy version binding | `pytest services/api/tests/test_policy.py -k t13` | Stale proposal rejected (`INVALID_REQUEST`) | PASS |
| T14 | `test_t14_unlimited_token_approval_rejected`| No unlimited approvals | `pytest services/api/tests/test_policy.py -k t14` | Decision: `BLOCKED` (`UNSUPPORTED_CONTRACT_CALL`) | PASS |
| T15 | `test_t15_gas_ceiling_violation` | Network congestion gas ceiling | `pytest services/api/tests/test_policy.py -k t15` | Decision: `BLOCKED` (`GAS_LIMIT_EXCEEDED`) | PASS |
| T16 | `test_t16_emergency_pause_blocks_action`| Emergency pause control | `pytest services/api/tests/test_policy.py -k t16` | Decision: `BLOCKED` (`POLICY_PAUSED`) | PASS |
| T17 | `test_t17_concurrent_spending_serialized`| Concurrent request serialization | `pytest services/api/tests/test_policy.py -k t17` | Exceeding transaction blocked | PASS |
| T18 | `test_t18_chain_state_error_not_false_zero`| RPC error handling | `pytest services/api/tests/test_policy.py -k t18` | Raises `CHAIN_STATE_UNAVAILABLE` | PASS |
| T19 | `test_t19_rpc_timeout_no_duplicate` | Idempotent submission / no duplicates | `pytest services/api/tests/test_policy.py -k t19` | Replay blocked | PASS |
| T20 | `test_t20_reverted_tx_not_reported_successful`| Receipt status inspection | `pytest services/api/tests/test_policy.py -k t20` | `is_verified == False`, Status `REVERTED` | PASS |
| T21 | `test_t21_mismatched_receipt_rejected`| Transfer event log verification | `pytest services/api/tests/test_policy.py -k t21` | `is_verified == False`, Event mismatch | PASS |
| T22 | `test_t22_unauthorized_policy_change` | User confirmation for policy change | `pytest services/api/tests/test_policy.py -k t22` | Rejected without explicit confirmation | PASS |
| T23 | `test_t23_secrets_not_exposed` | Redaction of secrets in audit trail | `pytest services/api/tests/test_policy.py -k t23` | Zero private key / seed phrase leaks | PASS |

---

## 3. Frontend Vitest Matrix

| Test Name | File | Expected | Actual |
| :--- | :--- | :--- | :--- |
| Default wallet summary in demo mode | `apps/web/src/tests/app.test.ts` | 100 USDC balance, Sepolia chain | PASS |
| Intent parsing determinism | `apps/web/src/tests/app.test.ts` | Resolves Approved Supplier address | PASS |
| Valid proposal evaluation | `apps/web/src/tests/app.test.ts` | Decision `ALLOW`, code `POLICY_PASSED` | PASS |
| Single cap check failure | `apps/web/src/tests/app.test.ts` | Decision `BLOCKED`, code `TRANSFER_LIMIT_EXCEEDED` | PASS |
| Reserve floor check failure | `apps/web/src/tests/app.test.ts` | Decision `BLOCKED`, reserve violation | PASS |
| Emergency pause toggle | `apps/web/src/tests/app.test.ts` | Blocks all subsequent transfers | PASS |

---

## 4. Test Execution Commands & Reproducibility

To re-run the entire test suite on any platform:

### Windows PowerShell:
```powershell
./scripts/test-all.ps1
```

### Linux / macOS:
```bash
chmod +x ./scripts/test-all.sh
./scripts/test-all.sh
```

All raw test execution logs are preserved in:
- `evidence/test-results/backend-pytest.txt`
- `evidence/test-results/frontend-vitest.txt`
