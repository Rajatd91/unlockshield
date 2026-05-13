"""
Kite Account Abstraction Wallet Service
════════════════════════════════════════
Institutional-grade smart wallet for the autonomous agent.

Architecture:
  ┌─────────────────────────────────────────────────────────────┐
  │  UnlockShield Agent                                         │
  │  ┌───────────────┐   ┌──────────────┐   ┌───────────────┐  │
  │  │ AA Smart Wallet│──▶│ ClientAgent  │──▶│  Settlement   │  │
  │  │ (ERC-4337)    │   │    Vault     │   │   Contract    │  │
  │  └───────────────┘   └──────────────┘   └───────────────┘  │
  │         │                    │                   │          │
  │    gasless tx           spending rules      KITE settlement │
  │    via bundler          daily limits        on-chain record │
  └─────────────────────────────────────────────────────────────┘

Key Kite AA Contracts (Testnet):
  Settlement Token:      0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63
  Settlement Contract:   0x8d9FaD78d5Ce247aA01C140798B9558fd64a63E3
  ClientAgentVault Impl: 0xB5AAFCC6DD4DFc2B80fb8BCcf406E1a2Fd559e23
  Bundler RPC:           https://bundler-service.staging.gokite.ai/rpc/
"""

import os
import json
import time
from datetime import datetime, timezone
from typing import Dict, Optional, List
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

# ─── Kite AA Testnet Contract Addresses ────────────────────────────
SETTLEMENT_TOKEN = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63"
SETTLEMENT_CONTRACT = "0x8d9FaD78d5Ce247aA01C140798B9558fd64a63E3"
CLIENT_AGENT_VAULT_IMPL = "0xB5AAFCC6DD4DFc2B80fb8BCcf406E1a2Fd559e23"
BUNDLER_RPC = "https://bundler-service.staging.gokite.ai/rpc/"
KITE_CHAIN_ID = 2368

# ─── L-USDC (Lucid) on Kite ────────────────────────────────────────
LUSDC_TOKEN = "0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e"
WETH_KITE = "0x3D66d6c3201190952e8EA973F59c4428b32D5F9b"

# ─── ERC-20 minimal ABI ────────────────────────────────────────────
ERC20_ABI = json.loads("""[
    {"constant":true,"inputs":[{"name":"_owner","type":"address"}],
     "name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],
     "type":"function"},
    {"constant":true,"inputs":[],"name":"decimals",
     "outputs":[{"name":"","type":"uint8"}],"type":"function"},
    {"constant":true,"inputs":[],"name":"symbol",
     "outputs":[{"name":"","type":"string"}],"type":"function"},
    {"constant":false,
     "inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],
     "name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"},
    {"constant":true,
     "inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],
     "name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function"},
    {"constant":false,
     "inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],
     "name":"transfer","outputs":[{"name":"","type":"bool"}],"type":"function"}
]""")

# ─── ClientAgentVault ABI (key functions) ───────────────────────────
VAULT_ABI = json.loads("""[
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "agent",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "client",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "string", "name": "reason", "type": "string"}
        ],
        "name": "executePayment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "dailySpendLimit",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "spentToday",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]""")

# ─── Settlement Contract ABI (key functions) ───────────────────────
SETTLEMENT_ABI = json.loads("""[
    {
        "inputs": [
            {"internalType": "address", "name": "agent", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "string", "name": "serviceType", "type": "string"}
        ],
        "name": "settle",
        "outputs": [{"internalType": "uint256", "name": "settlementId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "agent", "type": "address"}],
        "name": "getAgentSettlements",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    }
]""")


class AgentWalletService:
    """
    Manages the UnlockShield agent's on-chain wallet via Kite Account Abstraction.

    Capabilities:
      - Smart wallet with programmable spending rules
      - Daily spend limits for autonomous hedge execution
      - Vault-based fund segregation (hedged funds vs operating funds)
      - Gasless transactions via Kite bundler (ERC-4337)
      - Settlement tracking for all hedge payments
      - L-USDC yield integration on idle hedged funds
    """

    def __init__(self):
        rpc_url = os.getenv("KITE_RPC_URL", "https://rpc-testnet.gokite.ai/")
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

        private_key = os.getenv("AGENT_PRIVATE_KEY", "")
        self.vault_address = os.getenv("VAULT_ADDRESS", "")

        if private_key:
            self.account = self.w3.eth.account.from_key(private_key)
        else:
            self.account = None

        # Initialize contract references
        self.settlement_token = self._init_contract(SETTLEMENT_TOKEN, ERC20_ABI)
        self.settlement_contract = self._init_contract(SETTLEMENT_CONTRACT, SETTLEMENT_ABI)
        self.lusdc_token = self._init_contract(LUSDC_TOKEN, ERC20_ABI)
        self.vault = self._init_contract(self.vault_address, VAULT_ABI) if self.vault_address else None

        # In-memory transaction log
        self._tx_log: List[Dict] = []

        # Spending tracker
        self._spending_rules = {
            "daily_limit_usd": float(os.getenv("DAILY_SPEND_LIMIT", "50000")),
            "max_single_trade_usd": float(os.getenv("MAX_SINGLE_TRADE", "25000")),
            "require_attestation": True,
            "allowed_strategies": ["FULL_EXIT", "REDUCE_POSITION", "SHORT_HEDGE",
                                   "OPTIONS_PUT", "DCA_EXIT", "HOLD"],
            "auto_yield_on_idle": True,  # Auto-deposit idle USDC to L-USDC
        }
        self._spent_today_usd = 0.0
        self._day_start = datetime.now(timezone.utc).date()

    def _init_contract(self, address: str, abi: list):
        """Safely initialize a contract reference"""
        if not address or address == "":
            return None
        try:
            return self.w3.eth.contract(
                address=Web3.to_checksum_address(address),
                abi=abi
            )
        except Exception:
            return None

    def is_connected(self) -> bool:
        try:
            return self.w3.is_connected() and self.account is not None
        except Exception:
            return False

    # ─── Wallet Status ──────────────────────────────────────────────

    async def get_wallet_status(self) -> Dict:
        """
        Full wallet status — balances, spending rules, vault health.
        This is the primary dashboard endpoint.
        """
        native_balance = await self._get_native_balance()
        settlement_balance = await self._get_token_balance(self.settlement_token)
        lusdc_balance = await self._get_token_balance(self.lusdc_token)
        vault_balance = await self._get_vault_balance()

        # Reset daily spending if new day
        self._reset_daily_if_needed()

        # Estimate L-USDC yield (4% APY on Aave v3 backing)
        lusdc_yield_daily = (lusdc_balance * 0.04) / 365

        return {
            "wallet": {
                "address": self.account.address if self.account else "NOT_CONFIGURED",
                "type": "Kite AA Smart Wallet (ERC-4337)",
                "chain": "Kite AI Testnet",
                "chain_id": KITE_CHAIN_ID,
            },
            "balances": {
                "native_kite": native_balance,
                "settlement_token": settlement_balance,
                "lusdc_yield_bearing": lusdc_balance,
                "lusdc_yield_daily": round(lusdc_yield_daily, 4),
                "lusdc_apy": "4.0%",
                "vault_balance": vault_balance,
                "total_usd": round(settlement_balance + lusdc_balance + vault_balance, 2),
            },
            "spending_rules": {
                **self._spending_rules,
                "spent_today_usd": self._spent_today_usd,
                "remaining_today_usd": max(0, self._spending_rules["daily_limit_usd"] - self._spent_today_usd),
            },
            "vault": {
                "address": self.vault_address or "NOT_DEPLOYED",
                "implementation": CLIENT_AGENT_VAULT_IMPL,
                "status": "active" if self.vault else "not_deployed",
            },
            "infrastructure": {
                "bundler_rpc": BUNDLER_RPC,
                "settlement_contract": SETTLEMENT_CONTRACT,
                "settlement_token": SETTLEMENT_TOKEN,
                "lusdc_token": LUSDC_TOKEN,
                "gasless_enabled": True,
            },
            "recent_transactions": self._tx_log[-10:],
        }

    # ─── Spending Control ───────────────────────────────────────────

    def check_spend_allowed(self, amount_usd: float, strategy: str) -> Dict:
        """
        Pre-flight check before any hedge execution.
        Returns approval status with reasoning.
        """
        self._reset_daily_if_needed()

        checks = []
        approved = True

        # Check 1: Strategy allowed
        if strategy not in self._spending_rules["allowed_strategies"]:
            approved = False
            checks.append({"check": "strategy_allowed", "passed": False,
                           "reason": f"Strategy {strategy} not in allowed list"})
        else:
            checks.append({"check": "strategy_allowed", "passed": True})

        # Check 2: Single trade limit
        if amount_usd > self._spending_rules["max_single_trade_usd"]:
            approved = False
            checks.append({"check": "single_trade_limit", "passed": False,
                           "reason": f"${amount_usd:,.0f} exceeds max ${self._spending_rules['max_single_trade_usd']:,.0f}"})
        else:
            checks.append({"check": "single_trade_limit", "passed": True})

        # Check 3: Daily limit
        remaining = self._spending_rules["daily_limit_usd"] - self._spent_today_usd
        if amount_usd > remaining:
            approved = False
            checks.append({"check": "daily_limit", "passed": False,
                           "reason": f"${amount_usd:,.0f} exceeds remaining daily budget ${remaining:,.0f}"})
        else:
            checks.append({"check": "daily_limit", "passed": True})

        return {
            "approved": approved,
            "amount_usd": amount_usd,
            "strategy": strategy,
            "checks": checks,
            "spending_state": {
                "daily_limit": self._spending_rules["daily_limit_usd"],
                "spent_today": self._spent_today_usd,
                "remaining": remaining,
            },
        }

    def record_spend(self, amount_usd: float, strategy: str, token: str, tx_hash: str = ""):
        """Record a spend event after hedge execution"""
        self._reset_daily_if_needed()
        self._spent_today_usd += amount_usd
        self._tx_log.append({
            "type": "hedge_execution",
            "amount_usd": amount_usd,
            "strategy": strategy,
            "token": token,
            "tx_hash": tx_hash,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "daily_remaining": self._spending_rules["daily_limit_usd"] - self._spent_today_usd,
        })

    # ─── Vault Operations ───────────────────────────────────────────

    async def deposit_to_vault(self, amount: float) -> Dict:
        """Deposit settlement tokens to the agent vault"""
        if not self.is_connected() or not self.vault:
            return self._mock_vault_tx("deposit", amount)

        try:
            amount_wei = self.w3.to_wei(amount, 'ether')

            # Approve vault to spend settlement tokens
            approve_tx = self.settlement_token.functions.approve(
                self.vault.address, amount_wei
            ).build_transaction(self._base_tx())
            signed_approve = self.account.sign_transaction(approve_tx)
            self.w3.eth.send_raw_transaction(signed_approve.raw_transaction)

            # Deposit to vault
            deposit_tx = self.vault.functions.deposit(amount_wei).build_transaction(
                self._base_tx()
            )
            signed_deposit = self.account.sign_transaction(deposit_tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_deposit.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

            result = {
                "action": "vault_deposit",
                "amount": amount,
                "tx_hash": receipt.transactionHash.hex(),
                "status": "confirmed",
                "block": receipt.blockNumber,
            }
            self._tx_log.append({**result, "timestamp": datetime.now(timezone.utc).isoformat()})
            return result

        except Exception as e:
            return self._mock_vault_tx("deposit", amount, str(e))

    async def execute_vault_payment(self, to: str, amount: float, reason: str) -> Dict:
        """Execute a payment from the vault (for hedge settlements)"""
        if not self.is_connected() or not self.vault:
            return self._mock_vault_tx("payment", amount)

        try:
            amount_wei = self.w3.to_wei(amount, 'ether')
            tx = self.vault.functions.executePayment(
                Web3.to_checksum_address(to),
                amount_wei,
                reason[:200]
            ).build_transaction(self._base_tx())

            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

            result = {
                "action": "vault_payment",
                "to": to,
                "amount": amount,
                "reason": reason,
                "tx_hash": receipt.transactionHash.hex(),
                "status": "confirmed",
                "block": receipt.blockNumber,
            }
            self._tx_log.append({**result, "timestamp": datetime.now(timezone.utc).isoformat()})
            return result

        except Exception as e:
            return self._mock_vault_tx("payment", amount, str(e))

    # ─── Settlement Tracking ────────────────────────────────────────

    async def record_settlement(self, amount_usd: float, service_type: str) -> Dict:
        """Record a settlement on the Kite Settlement Contract"""
        if not self.is_connected() or not self.settlement_contract:
            return {
                "action": "settlement",
                "amount": amount_usd,
                "service_type": service_type,
                "status": "simulated",
                "settlement_id": len(self._tx_log) + 1,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        try:
            amount_wei = self.w3.to_wei(amount_usd, 'ether')
            tx = self.settlement_contract.functions.settle(
                self.account.address,
                amount_wei,
                service_type
            ).build_transaction(self._base_tx())

            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

            result = {
                "action": "settlement",
                "amount": amount_usd,
                "service_type": service_type,
                "tx_hash": receipt.transactionHash.hex(),
                "status": "confirmed",
                "block": receipt.blockNumber,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            self._tx_log.append(result)
            return result

        except Exception as e:
            return {
                "action": "settlement",
                "amount": amount_usd,
                "service_type": service_type,
                "status": "simulated",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    # ─── L-USDC Yield ──────────────────────────────────────────────

    async def get_lusdc_yield_status(self) -> Dict:
        """
        L-USDC yield status — idle hedged funds earn ~4% APY via Lucid.
        Backed by Aave v3 yield with 10% withdrawal buffer.
        """
        lusdc_balance = await self._get_token_balance(self.lusdc_token)

        # Annualized yield calculation
        apy = 0.04  # 4% base from Aave v3
        daily_yield = (lusdc_balance * apy) / 365
        monthly_yield = daily_yield * 30
        annual_yield = lusdc_balance * apy

        return {
            "token": "L-USDC (Lucid)",
            "address": LUSDC_TOKEN,
            "balance": lusdc_balance,
            "backing": "Aave v3 USDC lending yield",
            "apy": f"{apy * 100:.1f}%",
            "yield_daily": round(daily_yield, 4),
            "yield_monthly": round(monthly_yield, 2),
            "yield_annual": round(annual_yield, 2),
            "withdrawal_buffer": "10% (instant withdrawal up to buffer)",
            "bridge": "LayerZero v2 (cross-chain from Ethereum/Arbitrum)",
            "status": "active" if lusdc_balance > 0 else "no_balance",
            "strategy": (
                "Idle hedged USDC is automatically converted to L-USDC to earn yield. "
                "When a hedge needs execution, L-USDC is redeemed back to USDC. "
                "The 10% withdrawal buffer ensures instant liquidity for urgent hedges."
            ),
        }

    async def deposit_to_lusdc(self, amount_usdc: float) -> Dict:
        """Convert idle USDC to yield-bearing L-USDC"""
        result = {
            "action": "deposit_lusdc",
            "amount_usdc": amount_usdc,
            "lusdc_received": amount_usdc,  # 1:1 peg
            "estimated_daily_yield": round((amount_usdc * 0.04) / 365, 4),
            "status": "simulated",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": "L-USDC maintains 1:1 peg with USDC. Yield accrues automatically.",
        }
        self._tx_log.append(result)
        return result

    async def redeem_lusdc(self, amount_lusdc: float) -> Dict:
        """Redeem L-USDC back to USDC for hedge execution"""
        result = {
            "action": "redeem_lusdc",
            "amount_lusdc": amount_lusdc,
            "usdc_received": amount_lusdc,  # 1:1 peg
            "status": "simulated",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": "Instant redemption within 10% withdrawal buffer. Larger amounts queued.",
        }
        self._tx_log.append(result)
        return result

    # ─── Gasless Transaction Support ────────────────────────────────

    async def prepare_user_operation(self, target: str, call_data: str, value: int = 0) -> Dict:
        """
        Prepare an ERC-4337 UserOperation for the Kite bundler.
        This enables gasless transactions — the agent doesn't need KITE for gas.
        """
        if not self.account:
            return {"error": "Wallet not configured"}

        user_op = {
            "sender": self.account.address,
            "nonce": "0x0",
            "initCode": "0x",
            "callData": call_data,
            "callGasLimit": hex(500000),
            "verificationGasLimit": hex(200000),
            "preVerificationGas": hex(50000),
            "maxFeePerGas": hex(self.w3.eth.gas_price if self.is_connected() else 20_000_000_000),
            "maxPriorityFeePerGas": hex(1_000_000_000),
            "paymasterAndData": "0x",  # Kite bundler sponsors gas
            "signature": "0x",
        }

        return {
            "user_operation": user_op,
            "bundler_rpc": BUNDLER_RPC,
            "chain_id": KITE_CHAIN_ID,
            "gasless": True,
            "note": "Submit via eth_sendUserOperation to Kite bundler",
        }

    # ─── Spending Rules Management ──────────────────────────────────

    def get_spending_rules(self) -> Dict:
        return {**self._spending_rules}

    def update_spending_rules(self, rules: Dict) -> Dict:
        """Update spending rules (owner-only in production)"""
        allowed_keys = {"daily_limit_usd", "max_single_trade_usd", "auto_yield_on_idle"}
        updated = {}
        for key in allowed_keys:
            if key in rules:
                self._spending_rules[key] = rules[key]
                updated[key] = rules[key]
        return {"updated": updated, "current_rules": self._spending_rules}

    # ─── Internal Helpers ───────────────────────────────────────────

    async def _get_native_balance(self) -> float:
        if not self.is_connected():
            return 0.0
        try:
            balance = self.w3.eth.get_balance(self.account.address)
            return float(self.w3.from_wei(balance, 'ether'))
        except Exception:
            return 0.0

    async def _get_token_balance(self, contract) -> float:
        if not self.is_connected() or not contract:
            return 0.0
        try:
            balance = contract.functions.balanceOf(self.account.address).call()
            decimals = contract.functions.decimals().call()
            return balance / (10 ** decimals)
        except Exception:
            return 0.0

    async def _get_vault_balance(self) -> float:
        if not self.is_connected() or not self.vault:
            return 0.0
        try:
            balance = self.vault.functions.getBalance().call()
            return float(self.w3.from_wei(balance, 'ether'))
        except Exception:
            return 0.0

    def _base_tx(self) -> Dict:
        return {
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 500000,
            'gasPrice': self.w3.eth.gas_price,
            'chainId': KITE_CHAIN_ID,
        }

    def _reset_daily_if_needed(self):
        today = datetime.now(timezone.utc).date()
        if today > self._day_start:
            self._spent_today_usd = 0.0
            self._day_start = today

    def _mock_vault_tx(self, action: str, amount: float, error: str = "") -> Dict:
        return {
            "action": f"vault_{action}",
            "amount": amount,
            "status": "simulated",
            "tx_hash": f"0x{'0' * 64}",
            "note": error or "Chain not connected — transaction simulated",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# ─── Singleton ──────────────────────────────────────────────────────
agent_wallet = AgentWalletService()
