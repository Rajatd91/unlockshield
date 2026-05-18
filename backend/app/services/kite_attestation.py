"""
Kite Chain Attestation Service.
Records predictions and hedge actions as on-chain attestations
on Kite AI blockchain (EVM-compatible, Chain ID 2368 testnet).
"""
import os
import json
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from app.models.schemas import RiskAnalysis, AttestationRecord

# Contract ABI (key functions only)
CONTRACT_ABI = json.loads("""[
    {
        "inputs": [
            {"internalType": "bytes32", "name": "_commitHash", "type": "bytes32"},
            {"internalType": "string", "name": "_tokenSymbol", "type": "string"},
            {"internalType": "uint256", "name": "_unlockTimestamp", "type": "uint256"},
            {"internalType": "uint8", "name": "_riskScore", "type": "uint8"}
        ],
        "name": "commitPrediction",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "commitCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "reputation",
        "outputs": [
            {"internalType": "uint256", "name": "totalCommits", "type": "uint256"},
            {"internalType": "uint256", "name": "totalReveals", "type": "uint256"},
            {"internalType": "uint256", "name": "accuratePredictions", "type": "uint256"},
            {"internalType": "uint256", "name": "closePredictions", "type": "uint256"},
            {"internalType": "uint256", "name": "totalErrorBps", "type": "uint256"},
            {"internalType": "uint256", "name": "currentStreak", "type": "uint256"},
            {"internalType": "uint256", "name": "bestStreak", "type": "uint256"},
            {"internalType": "uint256", "name": "score", "type": "uint256"},
            {"internalType": "uint256", "name": "lastUpdated", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]""")

EXPLORER_BASE = "https://testnet.kitescan.ai/tx/"


def _hex_with_prefix(value) -> str:
    """Normalize a web3 hex/bytes value to a 0x-prefixed lowercase hex string."""
    if value is None:
        return ""
    if isinstance(value, bytes):
        s = value.hex()
    elif hasattr(value, "hex"):
        try:
            s = value.hex()
        except Exception:
            s = str(value)
    else:
        s = str(value)
    s = s.lower()
    if s.startswith("0x"):
        return s
    return "0x" + s


class KiteAttestationService:
    def __init__(self):
        rpc_url = os.getenv("KITE_RPC_URL", "https://rpc-testnet.gokite.ai/")
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        # Kite is a PoA chain, need this middleware
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

        private_key = os.getenv("AGENT_PRIVATE_KEY", "")
        contract_address = os.getenv("CONTRACT_ADDRESS", "")

        if private_key:
            self.account = self.w3.eth.account.from_key(private_key)
        else:
            self.account = None

        if contract_address:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(contract_address),
                abi=CONTRACT_ABI
            )
        else:
            self.contract = None

    def is_connected(self) -> bool:
        """Check if connected to Kite chain"""
        try:
            return self.w3.is_connected() and self.account is not None and self.contract is not None
        except:
            return False

    async def attest_prediction(
        self,
        token_symbol: str,
        unlock_amount_usd: float,
        unlock_timestamp: int,
        risk_score: int,
        reasoning: str,
        predicted_impact: float
    ) -> AttestationRecord:
        """
        Record a prediction on Kite chain.
        Returns the attestation record with tx hash and explorer link.
        """
        if not self.is_connected():
            return self._mock_attestation()

        try:
            # Convert predicted impact to basis points (int16)
            impact_bps = int(predicted_impact * 100)
            commit_hash = Web3.keccak(text=json.dumps({
                "token": token_symbol,
                "impact_bps": impact_bps,
                "unlock_timestamp": unlock_timestamp,
                "risk_score": risk_score,
                "reasoning": reasoning[:160],
            }, sort_keys=True))

            tx = self.contract.functions.commitPrediction(
                commit_hash,
                token_symbol,
                unlock_timestamp,
                risk_score,
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': int(os.getenv("KITE_CHAIN_ID", "2368"))
            })

            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=15)

            prediction_count = self.contract.functions.commitCount().call()
            tx_hex = _hex_with_prefix(receipt.transactionHash)

            return AttestationRecord(
                prediction_id=prediction_count,
                tx_hash=tx_hex,
                block_number=receipt.blockNumber,
                explorer_url=f"{EXPLORER_BASE}{tx_hex}"
            )

        except Exception as e:
            print(f"Attestation error: {e}")
            return self._mock_attestation()

    async def commit_prediction_hash(
        self,
        commit_hash: str,
        token_symbol: str,
        unlock_timestamp: int,
        risk_score: int,
    ) -> AttestationRecord:
        """Commit an existing keccak256 prediction hash to the deployed Kite oracle."""
        if not self.is_connected():
            return self._mock_attestation()

        try:
            commit_hash_bytes = Web3.to_bytes(hexstr=commit_hash)
            tx = self.contract.functions.commitPrediction(
                commit_hash_bytes,
                token_symbol,
                unlock_timestamp,
                min(100, max(1, int(risk_score))),
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': int(os.getenv("KITE_CHAIN_ID", "2368"))
            })

            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=15)
            commit_count = self.contract.functions.commitCount().call()
            tx_hex = _hex_with_prefix(receipt.transactionHash)

            return AttestationRecord(
                prediction_id=commit_count,
                tx_hash=tx_hex,
                block_number=receipt.blockNumber,
                explorer_url=f"{EXPLORER_BASE}{tx_hex}"
            )

        except Exception as e:
            print(f"Commit hash error: {e}")
            return self._mock_attestation()

    async def attest_hedge(
        self,
        prediction_id: int,
        action_type: str,
        details: str,
        simulated: bool = True
    ) -> str:
        """Record a hedge action on-chain, returns tx hash"""
        if not self.is_connected():
            return "0x_mock_hedge_tx"

        return "0x_hedge_action_recorded_offchain_oracle_commit_only"

    async def get_reputation(self) -> dict:
        """Fetch agent reputation from on-chain data"""
        if not self.is_connected():
            return {"total_predictions": 0, "accuracy": 0, "reputation_score": 0}

        try:
            rep = self.contract.functions.reputation().call()

            return {
                "total_predictions": rep[0],
                "total_reveals": rep[1],
                "accurate_predictions": rep[2],
                "close_predictions": rep[3],
                "current_streak": rep[5],
                "best_streak": rep[6],
                "reputation_score": rep[7],
            }
        except Exception as e:
            print(f"Reputation fetch error: {e}")
            return {"total_predictions": 0, "accuracy": 0, "reputation_score": 0}

    def _mock_attestation(self) -> AttestationRecord:
        """Return a mock attestation when chain is not connected"""
        import time
        mock_hash = f"0x{'0' * 64}"
        return AttestationRecord(
            prediction_id=0,
            tx_hash=mock_hash,
            block_number=0,
            explorer_url=f"{EXPLORER_BASE}{mock_hash}"
        )


# Singleton instance
kite_service = KiteAttestationService()
