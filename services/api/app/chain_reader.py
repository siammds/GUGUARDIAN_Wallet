from decimal import Decimal
from typing import Optional, Dict
from web3 import Web3
from web3.exceptions import Web3Exception
from app.config import settings

ERC20_BALANCE_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
]

class ChainReader:
    """
    EVM Chain Reader for Guardian Wallet.
    Connects to the configured JSON-RPC node.
    Strictly prevents silent false-zero balances on RPC disconnects.
    """

    def __init__(self, rpc_url: Optional[str] = None):
        self.rpc_url = rpc_url or settings.rpc_url
        self._w3: Optional[Web3] = None
        self._is_connected = False
        self._initialize()

    def _initialize(self):
        if settings.demo_mode:
            self._is_connected = False
            return
        try:
            self._w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 2.0}))
            self._is_connected = self._w3.is_connected()
        except Exception:
            self._is_connected = False

    @property
    def is_connected(self) -> bool:
        if settings.demo_mode:
            return False
        if not self._w3:
            return False
        try:
            return self._w3.is_connected()
        except Exception:
            return False

    def get_chain_id(self) -> int:
        if settings.demo_mode or not self.is_connected:
            return settings.chain_id
        try:
            return self._w3.eth.chain_id
        except Exception:
            return settings.chain_id

    def get_gas_price_gwei(self) -> str:
        if settings.demo_mode or not self.is_connected:
            return "15.0"
        try:
            wei = self._w3.eth.gas_price
            gwei = Decimal(wei) / Decimal(10**9)
            return f"{gwei:.2f}"
        except Exception:
            return "15.0"

    def get_native_balance(self, address: str) -> str:
        """
        Returns native balance in ETH.
        Raises RuntimeError if chain state is unavailable and live mode is active (T18).
        """
        if settings.demo_mode:
            return "1.2500"  # Deterministic demo balance

        if not self.is_connected:
            raise RuntimeError("CHAIN_STATE_UNAVAILABLE: Unable to query live RPC endpoint.")

        try:
            checksum_addr = Web3.to_checksum_address(address)
            balance_wei = self._w3.eth.get_balance(checksum_addr)
            balance_eth = Decimal(balance_wei) / Decimal(10**18)
            return f"{balance_eth:.4f}"
        except Exception as e:
            raise RuntimeError(f"CHAIN_STATE_UNAVAILABLE: {str(e)}")

    def get_erc20_balance(self, token_address: str, owner_address: str, decimals: int = 6) -> str:
        """
        Returns token balance formatted with decimals.
        Raises RuntimeError if chain state is unavailable and live mode is active (T18).
        """
        if settings.demo_mode:
            return "100.000000"  # Deterministic demo balance for USDC

        if not self.is_connected:
            raise RuntimeError("CHAIN_STATE_UNAVAILABLE: Unable to query live RPC endpoint for ERC20 balance.")

        try:
            checksum_token = Web3.to_checksum_address(token_address)
            checksum_owner = Web3.to_checksum_address(owner_address)
            contract = self._w3.eth.contract(address=checksum_token, abi=ERC20_BALANCE_ABI)
            raw_balance = contract.functions.balanceOf(checksum_owner).call()
            dec_balance = Decimal(raw_balance) / Decimal(10**decimals)
            return f"{dec_balance:.6f}"
        except Exception as e:
            raise RuntimeError(f"CHAIN_STATE_UNAVAILABLE: Failed to query ERC20 balance: {str(e)}")

chain_reader = ChainReader()
