import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_mode: str = os.getenv("APP_MODE", "demo")
    demo_mode: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./guardian_wallet.db")
    cors_allowed_origins: list[str] = [
        origin.strip() 
        for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS", 
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,capacitor://localhost,http://localhost"
        ).split(",")
    ]
    
    # Optional LLM
    llm_provider: str = os.getenv("LLM_PROVIDER", "none")
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    
    # Blockchain Settings (Sepolia EVM Testnet default)
    chain_id: int = int(os.getenv("CHAIN_ID", "11155111"))
    chain_name: str = "Sepolia Testnet"
    rpc_url: str = os.getenv("RPC_URL", "https://ethereum-sepolia-rpc.publicnode.com")
    explorer_base_url: str = os.getenv("EXPLORER_BASE_URL", "https://sepolia.etherscan.io")
    
    # Well-known test tokens & contracts
    test_token_symbol: str = "USDC"
    test_token_address: str = os.getenv(
        "TEST_TOKEN_ADDRESS", "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    )
    test_token_decimals: int = 6

settings = Settings()
