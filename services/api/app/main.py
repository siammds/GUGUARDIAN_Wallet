import os
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.schemas import (
    IntentParseRequest,
    IntentParseResponse,
    TransactionProposal,
    PolicyEvaluationRequest,
    PolicyEvaluationResponse,
    TransactionSubmitRequest,
    TransactionRecord,
    PolicyConfig,
    AuditEvent
)
from app.intent_parser import IntentParser
from app.ai_provider import ai_adapter
from app.policy_engine import PolicyEngine
from app.chain_reader import chain_reader
from app.transaction_service import transaction_service
from app.receipt_verifier import receipt_verifier
from app.audit_service import audit_service

app = FastAPI(
    title="Guardian Wallet API",
    description="Backend API for Guardian Wallet: AI-assisted Autonomous Blockchain Wallet with Deterministic Policy Controls",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PauseRequest(BaseModel):
    wallet_address: str
    is_paused: bool
    user_confirmed: bool = True

class PolicyUpdateRequest(BaseModel):
    wallet_address: str
    config: PolicyConfig
    user_confirmed: bool = False

class PrepareRequest(BaseModel):
    wallet_address: str
    token_address: str
    token_symbol: str
    recipient_address: str
    recipient_label: Optional[str] = None
    amount: str
    chain_id: int = 11155111

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_mode": settings.app_mode,
        "demo_mode": settings.demo_mode,
        "chain_id": settings.chain_id,
        "chain_connected": chain_reader.is_connected
    }

@app.get("/api/config")
def get_config():
    return {
        "app_mode": settings.app_mode,
        "demo_mode": settings.demo_mode,
        "chain_id": settings.chain_id,
        "chain_name": settings.chain_name,
        "rpc_url": settings.rpc_url,
        "explorer_base_url": settings.explorer_base_url,
        "test_token_symbol": settings.test_token_symbol,
        "test_token_address": settings.test_token_address,
        "llm_provider": settings.llm_provider,
        "live_ai_available": bool(settings.llm_api_key and settings.llm_provider != "none")
    }

@app.get("/api/wallet/{address}/summary")
def get_wallet_summary(address: str):
    engine = transaction_service.get_policy_engine(address)
    native_bal = chain_reader.get_native_balance(address)
    token_bal = chain_reader.get_erc20_balance(settings.test_token_address, address, settings.test_token_decimals)
    spent_today = transaction_service.get_spent_today(address)
    gas_gwei = chain_reader.get_gas_price_gwei()

    return {
        "wallet_address": address,
        "chain_id": settings.chain_id,
        "chain_name": settings.chain_name,
        "native_balance": native_bal,
        "native_symbol": "ETH",
        "token_balance": token_bal,
        "token_symbol": settings.test_token_symbol,
        "token_address": settings.test_token_address,
        "spent_today": spent_today,
        "daily_limit": engine.config.daily_spending_limit,
        "max_transfer_amount": engine.config.max_transfer_amount,
        "min_reserve": engine.config.min_reserve_amount,
        "agent_tier": engine.config.agent_tier.value,
        "is_paused": engine.config.is_paused,
        "policy_version": engine.config.policy_version,
        "gas_price_gwei": gas_gwei,
        "approved_recipients": engine.config.approved_recipients
    }

@app.get("/api/wallet/{address}/activity")
def get_wallet_activity(address: str, limit: int = 50):
    txs = audit_service.get_transactions(address, limit=limit)
    return {"transactions": txs}

@app.post("/api/intent/parse", response_model=IntentParseResponse)
async def parse_intent(req: IntentParseRequest):
    return await ai_adapter.parse_intent(req.text, req.wallet_address, req.chain_id or settings.chain_id)

@app.post("/api/policy/evaluate", response_model=PolicyEvaluationResponse)
def evaluate_policy(req: PolicyEvaluationRequest):
    engine = transaction_service.get_policy_engine(req.proposal.wallet_address)
    return engine.evaluate(
        proposal=req.proposal,
        current_token_balance=req.current_token_balance,
        spent_today=req.spent_today,
        estimated_gas_gwei=req.estimated_gas_gwei
    )

@app.post("/api/transaction/prepare")
def prepare_transaction(req: PrepareRequest):
    proposal, evaluation = transaction_service.prepare_proposal(
        wallet_address=req.wallet_address,
        token_address=req.token_address,
        token_symbol=req.token_symbol,
        recipient_address=req.recipient_address,
        recipient_label=req.recipient_label,
        amount=req.amount,
        chain_id=req.chain_id
    )
    return {
        "proposal": proposal,
        "evaluation": evaluation
    }

@app.post("/api/transaction/submit")
def submit_transaction(req: TransactionSubmitRequest):
    try:
        record = transaction_service.submit_transaction(
            proposal=req.proposal,
            evaluation=req.evaluation,
            user_confirmed=req.user_confirmed,
            is_demo=req.is_demo
        )
        return {"status": "success", "transaction": record}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction submission error: {str(e)}")

@app.get("/api/transaction/{tx_hash}/status")
def get_transaction_status(tx_hash: str):
    # Query receipt verifier
    result = receipt_verifier.verify_receipt(
        tx_hash=tx_hash,
        expected_token=settings.test_token_address,
        expected_sender="",
        expected_recipient="",
        expected_amount="0",
        decimals=settings.test_token_decimals,
        is_demo=tx_hash.startswith("0xdemo_")
    )
    return result

@app.get("/api/audit/{wallet_address}")
def get_audit_trail(wallet_address: str, limit: int = 50):
    events = audit_service.get_audit_trail(wallet_address, limit=limit)
    return {"events": events}

@app.post("/api/policy")
def update_policy(req: PolicyUpdateRequest):
    engine = transaction_service.get_policy_engine(req.wallet_address)
    success, msg = engine.update_config(req.config, user_confirmed=req.user_confirmed)
    if not success:
        raise HTTPException(status_code=403, detail=msg)
    
    audit_service.log_event(
        event_type="POLICY_UPDATED",
        wallet_address=req.wallet_address,
        chain_id=req.config.chain_id,
        policy_version=engine.config.policy_version,
        request_identifier=f"pol_upd_{engine.config.policy_version}",
        decision="ALLOW",
        reason_code="POLICY_UPDATED",
        details={"new_version": engine.config.policy_version, "agent_tier": req.config.agent_tier.value}
    )
    return {"status": "success", "message": msg, "policy_version": engine.config.policy_version}

@app.post("/api/pause")
def set_emergency_pause(req: PauseRequest):
    engine = transaction_service.get_policy_engine(req.wallet_address)
    engine.set_pause(req.is_paused)
    
    audit_service.log_event(
        event_type="EMERGENCY_PAUSE_TOGGLED",
        wallet_address=req.wallet_address,
        chain_id=engine.config.chain_id,
        policy_version=engine.config.policy_version,
        request_identifier="pause_toggle",
        decision="PAUSED" if req.is_paused else "UNPAUSED",
        reason_code="POLICY_PAUSED" if req.is_paused else "POLICY_RESUMED",
        details={"is_paused": req.is_paused}
    )
    return {
        "status": "success",
        "is_paused": engine.config.is_paused,
        "message": "Emergency pause toggled."
    }

@app.post("/api/demo/reset")
def reset_demo(req: Dict[str, str]):
    addr = req.get("wallet_address", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    audit_service.reset_demo_data(addr)
    return {"status": "success", "message": "Demo data reset successfully."}
