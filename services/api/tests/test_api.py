from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_api_config():
    res = client.get("/api/config")
    assert res.status_code == 200
    data = res.json()
    assert data["chain_id"] == 11155111
    assert "USDC" in data["test_token_symbol"]

def test_wallet_summary():
    res = client.get("/api/wallet/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/summary")
    assert res.status_code == 200
    data = res.json()
    assert "native_balance" in data
    assert "token_balance" in data
    assert data["daily_limit"] == "100.0"

def test_intent_parse_api():
    res = client.post("/api/intent/parse", json={
        "text": "Send 20 USDC to my approved supplier",
        "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent_type"] == "transfer"
    assert data["amount"] == "20"
    assert data["token_symbol"] == "USDC"
    assert "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".lower() == data["recipient_address"].lower()

def test_prepare_and_submit_transaction_flow():
    # 1. Prepare valid transaction
    prep_res = client.post("/api/transaction/prepare", json={
        "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "token_address": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        "token_symbol": "USDC",
        "recipient_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "recipient_label": "Approved Supplier",
        "amount": "20.0",
        "chain_id": 11155111
    })
    assert prep_res.status_code == 200
    prep_data = prep_res.json()
    proposal = prep_data["proposal"]
    evaluation = prep_data["evaluation"]
    assert evaluation["decision"] == "ALLOW"

    # 2. Submit transaction
    sub_res = client.post("/api/transaction/submit", json={
        "proposal": proposal,
        "evaluation": evaluation,
        "user_confirmed": True,
        "is_demo": True
    })
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["status"] == "success"
    assert sub_data["transaction"]["tx_hash"].startswith("0x") and len(sub_data["transaction"]["tx_hash"]) == 66

def test_pause_endpoint():
    res = client.post("/api/pause", json={
        "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "is_paused": True,
        "user_confirmed": True
    })
    assert res.status_code == 200
    assert res.json()["is_paused"] is True

    # Unpause
    res2 = client.post("/api/pause", json={
        "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "is_paused": False,
        "user_confirmed": True
    })
    assert res2.status_code == 200
    assert res2.json()["is_paused"] is False
