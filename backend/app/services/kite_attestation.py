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
            {"internalType": "string", "name": "_tokenSymbol", "type": "string"},
            {"internalType": "uint256", "name": "_unlockAmount", "type": "uint256"},
            {"internalType": "uint256", "name": "_unlockTimestamp", "type": "uint256"},
            {"internalType": "uint8", "name": "_riskScore", "type": "uint8"},
            {"internalType": "string", "name": "_reasoning", "type": "string"},
            {"internalType": "int16", "name": "_predictedPriceImpact", "type": "int16"}
        ],
        "name": "createPrediction",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_predictionId", "type": "uint256"},
            {"internalType": "string", "name": "_actionType", "type": "string"},
            {"internalType": "string", "name": "_details", "type": "string"},
            {"internalType": "bool", "name": "_simulated", "type": "bool"}
        ],
        "name": "recordHedgeAction",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_predictionId", "type": "uint256"},
            {"internalType": "int16", "name": "_actualPriceImpact", "type": "int16"},
            {"internalType": "uint256", "name": "_valueProtected", "type": "uint256"}
        ],
        "name": "recordOutcome",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "predictionCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_id", "type": "uint256"}],
        "name": "getPrediction",
        "outputs": [
            {
                "components": [
                    {"internalType": "uint256", "name": "id", "type": "uint256"},
                    {"internalType": "string", "name": "tokenSymbol", "type": "string"},
                    {"internalType": "uint256", "name": "unlockAmount", "type": "uint256"},
                    {"internalType": "uint256", "name": "unlockTimestamp", "type": "uint256"},
                    {"internalType": "uint8", "name": "riskScore", "type": "uint8"},
                    {"internalType": "string", "name": "reasoning", "type": "string"},
                    {"internalType": "int16", "name": "predictedPriceImpact", "type": "int16"},
                    {"internalType": "int16", "name": "actualPriceImpact", "type": "int16"},
                    {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
                    {"internalType": "bool", "name": "outcomeRecorded", "type": "bool"}
                ],
                "internalType": "struct UnlockShieldAttestation.Prediction",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getReputationScore",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "agentStats",
        "outputs": [
            {"internalType": "uint256", "name": "totalPredictions", "type": "uint256"},
            {"internalType": "uint256", "name": "accuratePredictions", "type": "uint256"},
            {"internalType": "uint256", "name": "totalHedges", "type": "uint256"},
            {"internalType": "uint256", "name": "totalValueProtected", "type": "uint256"},
            {"internalType": "uint256", "name": "lastUpdated", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]""")

EXPLORER_BASE = "https://testnet.kitescan.ai/tx/"


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

            tx = self.contract.functions.createPrediction(
                token_symbol,
                int(unlock_amount_usd),
                unlock_timestamp,
                risk_score,
                reasoning[:500],  # Limit string length for gas
                impact_bps
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 500000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': int(os.getenv("KITE_CHAIN_ID", "2368"))
            })

            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

            prediction_count = self.contract.functions.predictionCount().call()

            return AttestationRecord(
                prediction_id=prediction_count,
                tx_hash=receipt.transactionHash.hex(),
                block_number=receipt.blockNumber,
                explorer_url=f"{EXPLORER_BASE}{receipt.transactionHash.hex()}"
            )

        except Exception as e:
            print(f"Attestation error: {e}")
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

        try:
            tx = self.contract.functions.recordHedgeAction(
                prediction_id,
                action_type,
                details[:500],
                simulated
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': int(os.getenv("KITE_CHAIN_ID", "2368"))
            })

            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            return receipt.transactionHash.hex()

        except Exception as e:
            print(f"Hedge attestation error: {e}")
            return "0x_error"

    async def get_reputation(self) -> dict:
        """Fetch agent reputation from on-chain data"""
        if not self.is_connected():
            return {"total_predictions": 0, "accuracy": 0, "reputation_score": 0}

        try:
            stats = self.contract.functions.agentStats().call()
            rep_score = self.contract.functions.getReputationScore().call()

            return {
                "total_predictions": stats[0],
                "accurate_predictions": stats[1],
                "total_hedges": stats[2],
                "total_value_protected": stats[3],
                "reputation_score": rep_score
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
