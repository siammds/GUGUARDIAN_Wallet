from web3 import Web3
from app.config import settings

w3 = Web3(Web3.HTTPProvider(settings.rpc_url))
print("Web3 connected to Sepolia:", w3.is_connected())
tx_hash = "0x7661be113e572ee2db39649effa2cc4af7cd19ada750ed3f347c2410a2dd5bff"
receipt = w3.eth.get_transaction_receipt(tx_hash)
print(f"Verified Real On-Chain Tx: {tx_hash}")
print(f"Status: {receipt.status}")
print(f"Block: {receipt.blockNumber}")
print(f"Gas Used: {receipt.gasUsed}")
print(f"Logs: {len(receipt.logs)}")
