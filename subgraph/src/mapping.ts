/**
 * UnlockShield Subgraph Mapping — Goldsky on Kite AI
 * ═══════════════════════════════════════════════════
 * Indexes PredictionCreated, HedgeActionRecorded, and OutcomeRecorded
 * events from the UnlockShieldAttestation smart contract.
 *
 * Deploy: goldsky subgraph deploy unlockshield/v1 --from-abi
 *         --chain kite-ai-testnet
 *         --address CONTRACT_ADDRESS
 */

import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  PredictionCreated,
  HedgeActionRecorded,
  OutcomeRecorded,
} from "../generated/UnlockShieldAttestation/UnlockShieldAttestation";
import {
  Prediction,
  HedgeAction,
  Outcome,
  AgentStats,
  DailySnapshot,
} from "../generated/schema";

// ─── Helpers ────────────────────────────────────────────────────────

function getOrCreateStats(): AgentStats {
  let stats = AgentStats.load("1");
  if (!stats) {
    stats = new AgentStats("1");
    stats.totalPredictions = BigInt.zero();
    stats.accuratePredictions = BigInt.zero();
    stats.totalHedges = BigInt.zero();
    stats.totalValueProtected = BigInt.zero();
    stats.accuracyRate = BigDecimal.zero();
    stats.lastUpdated = BigInt.zero();
  }
  return stats;
}

function getDailySnapshot(timestamp: BigInt): DailySnapshot {
  let daySeconds = BigInt.fromI32(86400);
  let dayId = timestamp.div(daySeconds).times(daySeconds);
  let id = dayId.toString();

  let snapshot = DailySnapshot.load(id);
  if (!snapshot) {
    snapshot = new DailySnapshot(id);
    snapshot.date = id;
    snapshot.predictionsCreated = 0;
    snapshot.hedgesExecuted = 0;
    snapshot.outcomesRecorded = 0;
    snapshot.avgRiskScore = BigDecimal.zero();
    snapshot.totalValueProtected = BigInt.zero();
  }
  return snapshot;
}

// ─── Event Handlers ─────────────────────────────────────────────────

export function handlePredictionCreated(event: PredictionCreated): void {
  let id = event.params.param0.toString();
  let prediction = new Prediction(id);

  prediction.predictionId = event.params.param0;
  prediction.tokenSymbol = event.params.param1;
  prediction.unlockAmount = event.params.param2;
  prediction.unlockTimestamp = event.params.param3;
  prediction.riskScore = event.params.param4;
  prediction.reasoning = event.params.param5;
  prediction.predictedPriceImpact = event.params.param6;
  prediction.outcomeRecorded = false;
  prediction.createdAt = event.block.timestamp;
  prediction.blockNumber = event.block.number;
  prediction.txHash = event.transaction.hash;
  prediction.save();

  // Update global stats
  let stats = getOrCreateStats();
  stats.totalPredictions = stats.totalPredictions.plus(BigInt.fromI32(1));
  stats.lastUpdated = event.block.timestamp;
  stats.save();

  // Update daily snapshot
  let daily = getDailySnapshot(event.block.timestamp);
  daily.predictionsCreated = daily.predictionsCreated + 1;
  daily.save();
}

export function handleHedgeActionRecorded(event: HedgeActionRecorded): void {
  let id = event.params.param1.toString();
  let hedge = new HedgeAction(id);

  hedge.actionId = event.params.param1;
  hedge.prediction = event.params.param0.toString();
  hedge.actionType = event.params.param2;
  hedge.details = event.params.param3;
  hedge.simulated = event.params.param4;
  hedge.executedAt = event.block.timestamp;
  hedge.blockNumber = event.block.number;
  hedge.txHash = event.transaction.hash;
  hedge.save();

  // Update global stats
  let stats = getOrCreateStats();
  stats.totalHedges = stats.totalHedges.plus(BigInt.fromI32(1));
  stats.lastUpdated = event.block.timestamp;
  stats.save();

  // Update daily snapshot
  let daily = getDailySnapshot(event.block.timestamp);
  daily.hedgesExecuted = daily.hedgesExecuted + 1;
  daily.save();
}

export function handleOutcomeRecorded(event: OutcomeRecorded): void {
  let predId = event.params.param0.toString();
  let outcome = new Outcome(predId + "-outcome");

  outcome.prediction = predId;
  outcome.actualPriceImpact = event.params.param1;
  outcome.valueProtected = event.params.param2;
  outcome.recordedAt = event.block.timestamp;
  outcome.blockNumber = event.block.number;
  outcome.txHash = event.transaction.hash;

  // Check prediction accuracy (within 5% tolerance)
  let prediction = Prediction.load(predId);
  if (prediction) {
    prediction.actualPriceImpact = event.params.param1;
    prediction.outcomeRecorded = true;
    prediction.save();

    let predicted = prediction.predictedPriceImpact;
    let actual = event.params.param1;
    let diff = predicted > actual ? predicted - actual : actual - predicted;
    outcome.predictionAccurate = diff <= 500; // 5% tolerance (in basis points)
  } else {
    outcome.predictionAccurate = false;
  }
  outcome.save();

  // Update global stats
  let stats = getOrCreateStats();
  stats.totalValueProtected = stats.totalValueProtected.plus(
    event.params.param2
  );
  if (outcome.predictionAccurate) {
    stats.accuratePredictions = stats.accuratePredictions.plus(
      BigInt.fromI32(1)
    );
  }
  if (stats.totalPredictions.gt(BigInt.zero())) {
    stats.accuracyRate = stats.accuratePredictions
      .toBigDecimal()
      .div(stats.totalPredictions.toBigDecimal())
      .times(BigDecimal.fromString("100"));
  }
  stats.lastUpdated = event.block.timestamp;
  stats.save();

  // Update daily snapshot
  let daily = getDailySnapshot(event.block.timestamp);
  daily.outcomesRecorded = daily.outcomesRecorded + 1;
  daily.totalValueProtected = daily.totalValueProtected.plus(
    event.params.param2
  );
  daily.save();
}
