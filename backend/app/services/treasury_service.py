"""
AgentTreasury Service — bounded-autonomy capital execution on Kite AI.

Bridges the autonomous risk agent (Python) to the on-chain AgentTreasury
contract that holds USDC, enforces spending policy, and records every
hedge as a verifiable event. Implements Track 2's stablecoin-first
settlement and reputation-aware capital delegation.
"""

import os
import json
from dataclasses import dataclass
from typing import Optional, List, Dict
from web3 import Web3


TREASURY_ABI = json.loads("""[
  {"inputs":[
    {"name":"token","type":"string"},{"name":"action","type":"string"},
    {"name":"riskScore","type":"uint8"},{"name":"amountUsd","type":"uint256"},
    {"name":"recipient","type":"address"},{"name":"predictionRef","type":"bytes32"}
  ],"name":"executeHedge","outputs":[{"name":"id","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"balanceUsd","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"remainingTodayUsd","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"historyCount","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"maxSingleTradeUsd","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"dailyCapUsd","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"minRiskScore","outputs":[{"type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalTrades","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalUsdDeployed","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalHedgesBlocked","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"agentPassport","outputs":[
    {"name":"agentAddress","type":"address"},{"name":"trades","type":"uint256"},
    {"name":"deployed","type":"uint256"},{"name":"blocked","type":"uint256"},
    {"name":"currentBalance","type":"uint256"},{"name":"headroom","type":"uint256"}
  ],"stateMutability":"view","type":"function"},
  {"inputs":[{"name":"i","type":"uint256"}],"name":"history","outputs":[
    {"name":"id","type":"uint256"},{"name":"token","type":"string"},{"name":"action","type":"string"},
    {"name":"riskScore","type":"uint8"},{"name":"amountUsd","type":"uint256"},
    {"name":"recipient","type":"address"},{"name":"timestamp","type":"uint256"},
    {"name":"predictionRef","type":"bytes32"}
  ],"stateMutability":"view","type":"function"}
]""")


def _hex_with_prefix(value) -> str:
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
    return s if s.startswith("0x") else ("0x" + s)


@dataclass
class HedgeReceipt:
    success: bool
    reason: str
    amount_usd: float
    tx_hash: Optional[str] = None
    explorer_url: Optional[str] = None
    hedge_id: Optional[int] = None


class TreasuryService:
    """Sends hedge transactions to the deployed AgentTreasury contract."""

    def __init__(self):
        self.rpc_url = os.getenv("KITE_RPC_URL", "https://rpc-testnet.gokite.ai/")
        self.chain_id = int(os.getenv("KITE_CHAIN_ID", "2368"))
        self.treasury_address = os.getenv("TREASURY_ADDRESS", "").strip()
        self.usdc_address = os.getenv("USDC_ADDRESS", "").strip()
        self.simulated_recipient = os.getenv(
            "HEDGE_RECIPIENT",
            "0x000000000000000000000000000000000000dEaD",
        )

        # In-memory cache: hedge_id → real executeHedge tx hash.
        # The on-chain HedgeAction struct doesn't store the tx hash itself
        # so we cache it here when we submit the tx.
        self._tx_hash_cache: Dict[int, str] = {}

        self.w3 = None
        self.account = None
        self.treasury = None
        self._connect()

    def _connect(self):
        agent_key = os.getenv("AGENT_PRIVATE_KEY", "").strip()
        if not agent_key or not self.treasury_address:
            return
        try:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            if not self.w3.is_connected():
                self.w3 = None
                return
            self.account = self.w3.eth.account.from_key(agent_key)
            self.treasury = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.treasury_address),
                abi=TREASURY_ABI,
            )
        except Exception as e:
            print(f"TreasuryService: connect failed — {e}")
            self.w3 = None
            self.treasury = None

    def is_configured(self) -> bool:
        return self.w3 is not None and self.treasury is not None and self.account is not None

    def execute_hedge(
        self,
        token: str,
        action: str,
        risk_score: int,
        amount_usd: float,
        prediction_ref: str,
    ) -> HedgeReceipt:
        """Send a hedge transaction. Returns receipt with success/blocked reason."""
        if not self.is_configured():
            return HedgeReceipt(
                success=False,
                reason="treasury_not_configured",
                amount_usd=amount_usd,
            )
        try:
            amount_usdc = int(round(max(0.0, float(amount_usd)) * 1_000_000))
            # Defensive: normalize prediction_ref to a valid bytes32.
            # If the input is not pure hex, fall back to zero ref.
            import re
            raw = str(prediction_ref or "")
            stripped = raw[2:] if raw.lower().startswith("0x") else raw
            if not re.fullmatch(r"[0-9a-fA-F]+", stripped or ""):
                stripped = "0" * 64  # invalid → zero ref
            stripped = stripped.lower()[:64].rjust(64, "0")
            ref_bytes = Web3.to_bytes(hexstr="0x" + stripped)

            tx = self.treasury.functions.executeHedge(
                token,
                action,
                min(100, max(0, int(risk_score))),
                amount_usdc,
                Web3.to_checksum_address(self.simulated_recipient),
                ref_bytes,
            ).build_transaction({
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gas": 350000,
                "gasPrice": self.w3.eth.gas_price,
                "chainId": self.chain_id,
            })
            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=90)
            tx_hex = _hex_with_prefix(receipt.transactionHash)

            # Inspect logs to determine whether HedgeExecuted or HedgeBlocked fired
            blocked_topic = self.w3.keccak(text="HedgeBlocked(string,string,uint256,uint8)").hex()
            executed_topic = self.w3.keccak(text="HedgeExecuted(uint256,string,string,uint8,uint256,address,bytes32)").hex()
            blocked = any(_hex_with_prefix(l.topics[0]) == _hex_with_prefix(blocked_topic) for l in receipt.logs)
            executed = any(_hex_with_prefix(l.topics[0]) == _hex_with_prefix(executed_topic) for l in receipt.logs)

            if executed:
                hist_count = self.treasury.functions.historyCount().call()
                hedge_id = hist_count - 1
                # Cache the real tx hash so the UI can show it per row
                self._tx_hash_cache[hedge_id] = tx_hex
                return HedgeReceipt(
                    success=True,
                    reason="executed",
                    amount_usd=amount_usd,
                    tx_hash=tx_hex,
                    explorer_url=f"https://testnet.kitescan.ai/tx/{tx_hex}",
                    hedge_id=hedge_id,
                )
            if blocked:
                return HedgeReceipt(
                    success=False,
                    reason="policy_blocked",
                    amount_usd=amount_usd,
                    tx_hash=tx_hex,
                    explorer_url=f"https://testnet.kitescan.ai/tx/{tx_hex}",
                )
            return HedgeReceipt(
                success=False,
                reason="unknown_state",
                amount_usd=amount_usd,
                tx_hash=tx_hex,
                explorer_url=f"https://testnet.kitescan.ai/tx/{tx_hex}",
            )
        except Exception as e:
            return HedgeReceipt(
                success=False,
                reason=f"error:{str(e)[:80]}",
                amount_usd=amount_usd,
            )

    def passport(self) -> Optional[Dict]:
        """Return on-chain agent passport (identity + stats)."""
        if not self.is_configured():
            return None
        try:
            p = self.treasury.functions.agentPassport().call()
            policy = {
                "max_single_trade_usd": self.treasury.functions.maxSingleTradeUsd().call() / 1_000_000,
                "daily_cap_usd": self.treasury.functions.dailyCapUsd().call() / 1_000_000,
                "min_risk_score": self.treasury.functions.minRiskScore().call(),
            }
            return {
                "agent_address": p[0],
                "agent_explorer": f"https://testnet.kitescan.ai/address/{p[0]}",
                "treasury_address": self.treasury_address,
                "treasury_explorer": f"https://testnet.kitescan.ai/address/{self.treasury_address}",
                "usdc_address": self.usdc_address,
                "trades": int(p[1]),
                "deployed_usd": float(p[2]) / 1_000_000,
                "blocked": int(p[3]),
                "balance_usd": float(p[4]) / 1_000_000,
                "headroom_usd": float(p[5]) / 1_000_000,
                "policy": policy,
                "chain": "Kite AI Testnet (Chain ID 2368)",
            }
        except Exception as e:
            return {"error": str(e)[:200]}

    def recent_hedges(self, limit: int = 20) -> List[Dict]:
        """Read recent HedgeAction structs directly from contract storage."""
        if not self.is_configured():
            return []
        try:
            count = self.treasury.functions.historyCount().call()
            start = max(0, count - limit)
            out: List[Dict] = []
            for i in range(count - 1, start - 1, -1):
                h = self.treasury.functions.history(i).call()
                ref_hex = "0x" + h[7].hex() if isinstance(h[7], bytes) else _hex_with_prefix(h[7])
                hedge_id = int(h[0])
                tx_hash = self._tx_hash_cache.get(hedge_id)
                out.append({
                    "id": hedge_id,
                    "token": h[1],
                    "action": h[2],
                    "risk_score": int(h[3]),
                    "amount_usd": float(h[4]) / 1_000_000,
                    "recipient": h[5],
                    "timestamp": int(h[6]),
                    "prediction_ref": ref_hex,
                    "tx_hash": tx_hash,
                    "explorer_url": f"https://testnet.kitescan.ai/tx/{tx_hash}" if tx_hash else None,
                })
            return out
        except Exception as e:
            print(f"recent_hedges error: {e}")
            return []


treasury_service = TreasuryService()
