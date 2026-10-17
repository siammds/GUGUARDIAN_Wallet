import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.database import DB_FILE
from app.schemas import AuditEvent, TransactionRecord, TransactionState, DecisionCode

class AuditService:
    """
    Application Audit and Transaction Ledger for Guardian Wallet.
    Maintains a deterministic record of all decisions, rejected actions,
    and verified on-chain results.
    """

    @staticmethod
    def _get_connection():
        return sqlite3.connect(DB_FILE)

    @classmethod
    def log_event(
        cls,
        event_type: str,
        wallet_address: str,
        chain_id: int,
        policy_version: int,
        request_identifier: str,
        decision: str,
        reason_code: str,
        transaction_hash: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditEvent:
        event_id = f"aud_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        details_str = json.dumps(details or {})

        conn = cls._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO audit_logs 
            (event_id, timestamp, event_type, wallet_address, chain_id, policy_version, request_identifier, decision, reason_code, transaction_hash, details_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id, now_iso, event_type, wallet_address.lower(), chain_id,
                policy_version, request_identifier, decision, reason_code,
                transaction_hash, details_str
            )
        )
        conn.commit()
        conn.close()

        return AuditEvent(
            event_id=event_id,
            timestamp=now_iso,
            event_type=event_type,
            wallet_address=wallet_address,
            chain_id=chain_id,
            policy_version=policy_version,
            request_identifier=request_identifier,
            decision=decision,
            reason_code=reason_code,
            transaction_hash=transaction_hash,
            details=details or {}
        )

    @classmethod
    def get_audit_trail(cls, wallet_address: str, limit: int = 50) -> List[AuditEvent]:
        conn = cls._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT event_id, timestamp, event_type, wallet_address, chain_id, policy_version, request_identifier, decision, reason_code, transaction_hash, details_json
            FROM audit_logs
            WHERE wallet_address = ?
            ORDER BY id DESC LIMIT ?
            """,
            (wallet_address.lower(), limit)
        )
        rows = cursor.fetchall()
        conn.close()

        results = []
        for r in rows:
            results.append(AuditEvent(
                event_id=r[0],
                timestamp=r[1],
                event_type=r[2],
                wallet_address=r[3],
                chain_id=r[4],
                policy_version=r[5],
                request_identifier=r[6],
                decision=r[7],
                reason_code=r[8],
                transaction_hash=r[9],
                details=json.loads(r[10]) if r[10] else {}
            ))
        return results

    @classmethod
    def save_transaction(cls, record: TransactionRecord):
        conn = cls._get_connection()
        cursor = conn.cursor()
        receipt_str = json.dumps(record.receipt_verification.model_dump()) if record.receipt_verification else None
        cursor.execute(
            """
            INSERT OR REPLACE INTO transactions
            (id, proposal_id, wallet_address, chain_id, state, token_symbol, token_address, recipient_address, recipient_label, amount, tx_hash, decision, reason_code, is_demo, created_at, completed_at, rejection_reason, receipt_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record.id, record.proposal_id, record.wallet_address.lower(),
                record.chain_id, record.state.value, record.token_symbol,
                record.token_address, record.recipient_address, record.recipient_label,
                record.amount, record.tx_hash, record.decision, record.reason_code.value,
                1 if record.is_demo else 0, record.created_at, record.completed_at,
                record.rejection_reason, receipt_str
            )
        )
        conn.commit()
        conn.close()

    @classmethod
    def get_transactions(cls, wallet_address: str, limit: int = 50) -> List[Dict[str, Any]]:
        conn = cls._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, proposal_id, wallet_address, chain_id, state, token_symbol, token_address, recipient_address, recipient_label, amount, tx_hash, decision, reason_code, is_demo, created_at, completed_at, rejection_reason, receipt_json
            FROM transactions
            WHERE wallet_address = ?
            ORDER BY created_at DESC LIMIT ?
            """,
            (wallet_address.lower(), limit)
        )
        rows = cursor.fetchall()
        conn.close()

        records = []
        for r in rows:
            records.append({
                "id": r[0],
                "proposal_id": r[1],
                "wallet_address": r[2],
                "chain_id": r[3],
                "state": r[4],
                "token_symbol": r[5],
                "token_address": r[6],
                "recipient_address": r[7],
                "recipient_label": r[8],
                "amount": r[9],
                "tx_hash": r[10],
                "decision": r[11],
                "reason_code": r[12],
                "is_demo": bool(r[13]),
                "created_at": r[14],
                "completed_at": r[15],
                "rejection_reason": r[16],
                "receipt": json.loads(r[17]) if r[17] else None
            })
        return records

    @classmethod
    def reset_demo_data(cls, wallet_address: str):
        conn = cls._get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE wallet_address = ?", (wallet_address.lower(),))
        cursor.execute("DELETE FROM audit_logs WHERE wallet_address = ?", (wallet_address.lower(),))
        conn.commit()
        conn.close()

audit_service = AuditService()
