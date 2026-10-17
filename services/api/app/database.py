import os
import json
import sqlite3
from typing import List, Optional, Dict, Any
from app.config import settings

DB_FILE = "guardian_wallet.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. Audit Log Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE,
        timestamp TEXT,
        event_type TEXT,
        wallet_address TEXT,
        chain_id INTEGER,
        policy_version INTEGER,
        request_identifier TEXT,
        decision TEXT,
        reason_code TEXT,
        transaction_hash TEXT,
        details_json TEXT
    )
    """)

    # 2. Transactions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        proposal_id TEXT,
        wallet_address TEXT,
        chain_id INTEGER,
        state TEXT,
        token_symbol TEXT,
        token_address TEXT,
        recipient_address TEXT,
        recipient_label TEXT,
        amount TEXT,
        tx_hash TEXT,
        decision TEXT,
        reason_code TEXT,
        is_demo INTEGER,
        created_at TEXT,
        completed_at TEXT,
        rejection_reason TEXT,
        receipt_json TEXT
    )
    """)

    # 3. Policy Snapshot Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS policy_snapshots (
        wallet_address TEXT PRIMARY KEY,
        policy_version INTEGER,
        policy_json TEXT,
        updated_at TEXT
    )
    """)

    conn.commit()
    conn.close()

# Initialize upon import
init_db()
