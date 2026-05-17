"""
Verifiable Prediction Oracle — On-Chain Commit-Reveal
═══════════════════════════════════════════════════════
The "Verifiable" in Verifiable DeFi Stress Oracle.

Implements ERC-8004-style trustless predictions on Kite AI:
  1. COMMIT: Hash prediction before event → store on-chain (tamper-proof)
  2. REVEAL: After event, reveal prediction + compute accuracy
  3. REPUTATION: Build on-chain track record → reputation score
  4. ATTEST: Kite AI attestation layer for cross-chain verifiability

Why this matters:
  - Anyone can claim to predict crashes AFTER they happen
  - On-chain commit-reveal makes predictions PROVABLY pre-event
  - Reputation = trust = delegated capital (long-term business model)
  - Judges see: "This isn't just another prediction tool — it's VERIFIABLE"

Technical Flow:
  commit_hash = keccak256(token, predicted_impact, timestamp, salt)
  → Store commit_hash on Kite chain BEFORE unlock event
  → After event: reveal(token, actual_impact, salt)
  → Contract verifies hash matches → updates reputation
"""

import os
import json
import time
import hashlib
import secrets
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from web3 import Web3


# ══════════════════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ══════════════════════════════════════════════════════════════════════════

@dataclass
class PredictionCommit:
    """A committed prediction (pre-event)"""
    commit_id: str              # Unique identifier
    token_symbol: str
    predicted_impact_pct: float # Expected price change (e.g., -12.5)
    confidence: float           # 0-1
    var_95: float               # From stress engine
    cvar_95: float              # From stress engine
    regime: str                 # Market regime at time of prediction
    unlock_pct_supply: float
    unlock_date: str            # ISO format
    commit_hash: str            # keccak256 commitment
    salt: str                   # Secret salt for reveal
    committed_at: str           # Timestamp of commitment
    tx_hash: Optional[str] = None  # On-chain tx (if submitted)
    revealed: bool = False
    actual_impact: Optional[float] = None
    accuracy_score: Optional[float] = None


@dataclass
class ReputationRecord:
    """Agent's on-chain reputation"""
    total_predictions: int
    revealed_predictions: int
    accurate_predictions: int  # Within ±3% of actual
    close_predictions: int     # Within ±5% of actual
    avg_error: float           # Mean absolute error
    reputation_score: int      # 0-1000 (on-chain)
    streak: int                # Consecutive accurate predictions
    last_updated: str


# ══════════════════════════════════════════════════════════════════════════
# COMMIT-REVEAL CRYPTOGRAPHY
# ══════════════════════════════════════════════════════════════════════════

def generate_commit_hash(
    token_symbol: str,
    predicted_impact: float,
    unlock_timestamp: int,
    salt: str,
) -> str:
    """
    Generate keccak256 commitment hash.

    commit = keccak256(abi.encodePacked(token, impact_bps, timestamp, salt))

    This hash is stored on-chain BEFORE the event.
    After the event, revealing the preimage proves the prediction was made in advance.
    """
    # Encode same way as Solidity abi.encodePacked
    impact_bps = int(predicted_impact * 100)  # Convert to basis points
    packed = (
        token_symbol.encode('utf-8') +
        impact_bps.to_bytes(4, byteorder='big', signed=True) +
        unlock_timestamp.to_bytes(8, byteorder='big') +
        salt.encode('utf-8')
    )
    return Web3.keccak(packed).hex()


def verify_commit(
    commit_hash: str,
    token_symbol: str,
    predicted_impact: float,
    unlock_timestamp: int,
    salt: str,
) -> bool:
    """Verify that a reveal matches a previous commitment"""
    computed = generate_commit_hash(token_symbol, predicted_impact, unlock_timestamp, salt)
    return computed == commit_hash


# ══════════════════════════════════════════════════════════════════════════
# PREDICTION ENGINE (Creates verifiable predictions from stress results)
# ══════════════════════════════════════════════════════════════════════════

class PredictionOracle:
    """
    Manages the prediction lifecycle:
    1. Create prediction from stress engine output
    2. Commit hash to Kite chain
    3. Monitor for event completion
    4. Reveal and score accuracy
    5. Update reputation
    """

    def __init__(self):
        self.predictions: Dict[str, PredictionCommit] = {}
        self.reputation = ReputationRecord(
            total_predictions=0,
            revealed_predictions=0,
            accurate_predictions=0,
            close_predictions=0,
            avg_error=0.0,
            reputation_score=0,
            streak=0,
            last_updated=datetime.utcnow().isoformat(),
        )
        # Load from Kite chain if connected
        self._load_from_chain()

    def create_prediction(
        self,
        token_symbol: str,
        stress_result: Dict,
        unlock_date: str,
        unlock_pct_supply: float,
    ) -> PredictionCommit:
        """
        Create a new verifiable prediction from stress engine output.

        Takes the stress simulation results and commits a specific
        predicted price impact to the blockchain.
        """
        # Generate unique salt for this prediction
        salt = secrets.token_hex(16)

        # Extract prediction from stress results
        base_case = stress_result.get("scenarios", {}).get("base_case", {})
        predicted_impact = base_case.get("mean_return", -5.0)
        var_95 = base_case.get("var_95", -10.0)
        cvar_95 = base_case.get("cvar_95", -15.0)
        regime = stress_result.get("regime_detected", "UNKNOWN")

        # Confidence based on regime confidence + model metrics
        regime_conf = stress_result.get("regime_confidence", 0.5)
        # Higher confidence if skewness is strongly negative (model captures tail risk)
        skew_bonus = min(0.1, abs(base_case.get("skewness", 0)) * 0.05)
        confidence = min(0.95, regime_conf * 0.7 + 0.2 + skew_bonus)

        # Parse unlock timestamp
        try:
            unlock_dt = datetime.fromisoformat(unlock_date.replace('Z', '+00:00'))
            unlock_ts = int(unlock_dt.timestamp())
        except:
            unlock_ts = int(time.time()) + 7 * 86400  # Default 7 days

        # Generate commitment hash
        commit_hash = generate_commit_hash(
            token_symbol, predicted_impact, unlock_ts, salt
        )

        # Create commit record
        commit_id = f"{token_symbol}_{int(time.time())}_{secrets.token_hex(4)}"
        prediction = PredictionCommit(
            commit_id=commit_id,
            token_symbol=token_symbol,
            predicted_impact_pct=round(predicted_impact, 2),
            confidence=round(confidence, 3),
            var_95=var_95,
            cvar_95=cvar_95,
            regime=regime,
            unlock_pct_supply=unlock_pct_supply,
            unlock_date=unlock_date,
            commit_hash=commit_hash,
            salt=salt,
            committed_at=datetime.utcnow().isoformat(),
        )

        self.predictions[commit_id] = prediction
        self.reputation.total_predictions += 1
        self.reputation.last_updated = datetime.utcnow().isoformat()

        return prediction

    async def commit_to_chain(self, commit_id: str) -> Optional[str]:
        """
        Submit commitment hash to Kite AI blockchain.
        Returns transaction hash if successful.
        """
        prediction = self.predictions.get(commit_id)
        if not prediction:
            return None

        from app.services.kite_attestation import kite_service

        if not kite_service.is_connected():
            # Store locally — will submit when chain is available
            prediction.tx_hash = "0x_pending_chain_connection"
            return prediction.tx_hash

        try:
            # Use the attestation service to record prediction
            unlock_ts = int(datetime.fromisoformat(
                prediction.unlock_date.replace('Z', '+00:00')
            ).timestamp())

            attestation = await kite_service.commit_prediction_hash(
                commit_hash=prediction.commit_hash,
                token_symbol=prediction.token_symbol,
                unlock_timestamp=unlock_ts,
                risk_score=min(100, max(1, int(abs(prediction.cvar_95)))),
            )

            prediction.tx_hash = attestation.tx_hash
            return attestation.tx_hash

        except Exception as e:
            print(f"Chain commit error: {e}")
            prediction.tx_hash = f"0x_error_{secrets.token_hex(8)}"
            return prediction.tx_hash

    def reveal_prediction(
        self,
        commit_id: str,
        actual_impact_pct: float,
    ) -> Dict:
        """
        Reveal a prediction after the unlock event has occurred.
        Verifies the commitment and scores accuracy.
        """
        prediction = self.predictions.get(commit_id)
        if not prediction:
            return {"error": "Prediction not found"}

        if prediction.revealed:
            return {"error": "Already revealed", "accuracy": prediction.accuracy_score}

        # Verify the commitment (proves prediction was made before event)
        unlock_ts = int(datetime.fromisoformat(
            prediction.unlock_date.replace('Z', '+00:00')
        ).timestamp())

        is_valid = verify_commit(
            prediction.commit_hash,
            prediction.token_symbol,
            prediction.predicted_impact_pct,
            unlock_ts,
            prediction.salt,
        )

        if not is_valid:
            return {"error": "Commitment verification FAILED — hash mismatch"}

        # Score accuracy
        error = abs(prediction.predicted_impact_pct - actual_impact_pct)
        direction_correct = (
            (prediction.predicted_impact_pct < 0 and actual_impact_pct < 0) or
            (prediction.predicted_impact_pct > 0 and actual_impact_pct > 0)
        )

        # Accuracy score (0-100)
        # Perfect = 100, ±3% = 80+, ±5% = 60+, ±10% = 40+, wrong direction = 0-20
        if error <= 1:
            accuracy = 100
        elif error <= 3:
            accuracy = 90 - (error - 1) * 5
        elif error <= 5:
            accuracy = 75 - (error - 3) * 5
        elif error <= 10:
            accuracy = 60 - (error - 5) * 4
        elif direction_correct:
            accuracy = max(20, 40 - (error - 10) * 2)
        else:
            accuracy = max(0, 15 - error)

        # Update prediction record
        prediction.revealed = True
        prediction.actual_impact = actual_impact_pct
        prediction.accuracy_score = round(accuracy, 1)

        # Update reputation
        self.reputation.revealed_predictions += 1
        if error <= 3:
            self.reputation.accurate_predictions += 1
            self.reputation.streak += 1
        elif error <= 5:
            self.reputation.close_predictions += 1
            self.reputation.streak += 1
        else:
            self.reputation.streak = 0

        # Update average error
        n = self.reputation.revealed_predictions
        prev_avg = self.reputation.avg_error
        self.reputation.avg_error = round(
            (prev_avg * (n - 1) + error) / n, 2
        )

        # Update reputation score (0-1000)
        self._recalculate_reputation()

        return {
            "commit_id": commit_id,
            "token": prediction.token_symbol,
            "predicted_impact": prediction.predicted_impact_pct,
            "actual_impact": actual_impact_pct,
            "error": round(error, 2),
            "direction_correct": direction_correct,
            "accuracy_score": accuracy,
            "commitment_verified": True,
            "reputation_updated": True,
            "new_reputation_score": self.reputation.reputation_score,
        }

    def _recalculate_reputation(self):
        """
        Reputation formula:
        Score = (accuracy_rate * 400) + (streak_bonus * 200) + (volume_bonus * 200) + (recency * 200)
        Max = 1000
        """
        n = self.reputation.revealed_predictions
        if n == 0:
            self.reputation.reputation_score = 0
            return

        # Accuracy rate (0-1)
        accuracy_rate = (
            self.reputation.accurate_predictions * 1.0 +
            self.reputation.close_predictions * 0.7
        ) / n

        # Streak bonus (max at 10 consecutive)
        streak_bonus = min(1.0, self.reputation.streak / 10.0)

        # Volume bonus (more predictions = more credible, max at 50)
        volume_bonus = min(1.0, n / 50.0)

        # Error penalty (lower avg error = better)
        error_score = max(0, 1.0 - self.reputation.avg_error / 15.0)

        score = int(
            accuracy_rate * 400 +
            streak_bonus * 200 +
            volume_bonus * 150 +
            error_score * 250
        )
        self.reputation.reputation_score = min(1000, max(0, score))

    def get_prediction_history(self, limit: int = 20) -> List[Dict]:
        """Get recent predictions with their status"""
        preds = sorted(
            self.predictions.values(),
            key=lambda p: p.committed_at,
            reverse=True,
        )[:limit]

        return [
            {
                "commit_id": p.commit_id,
                "token": p.token_symbol,
                "predicted_impact": p.predicted_impact_pct,
                "confidence": p.confidence,
                "regime": p.regime,
                "unlock_date": p.unlock_date,
                "committed_at": p.committed_at,
                "on_chain": p.tx_hash is not None and not p.tx_hash.startswith("0x_"),
                "tx_hash": p.tx_hash,
                "revealed": p.revealed,
                "actual_impact": p.actual_impact,
                "accuracy": p.accuracy_score,
            }
            for p in preds
        ]

    def get_reputation(self) -> Dict:
        """Get current reputation state"""
        return asdict(self.reputation)

    def get_stats(self) -> Dict:
        """Dashboard-friendly stats summary"""
        return {
            "total_predictions": self.reputation.total_predictions,
            "on_chain_commits": sum(
                1 for p in self.predictions.values()
                if p.tx_hash and not p.tx_hash.startswith("0x_")
            ),
            "revealed": self.reputation.revealed_predictions,
            "accuracy_rate": round(
                (self.reputation.accurate_predictions + self.reputation.close_predictions * 0.7) /
                max(1, self.reputation.revealed_predictions) * 100, 1
            ),
            "avg_error": self.reputation.avg_error,
            "reputation_score": self.reputation.reputation_score,
            "streak": self.reputation.streak,
            "grade": self._score_to_grade(self.reputation.reputation_score),
        }

    def _score_to_grade(self, score: int) -> str:
        """Convert reputation score to letter grade"""
        if score >= 900: return "S"   # Legendary
        if score >= 800: return "A+"
        if score >= 700: return "A"
        if score >= 600: return "B+"
        if score >= 500: return "B"
        if score >= 400: return "C+"
        if score >= 300: return "C"
        if score >= 200: return "D"
        return "F"

    def _load_from_chain(self):
        """Load existing predictions from Kite chain (if connected)"""
        from app.services.kite_attestation import kite_service
        if kite_service.is_connected():
            try:
                # Load agent stats from on-chain
                pass  # TODO: Implement chain state loading
            except:
                pass


# Singleton instance
oracle = PredictionOracle()
