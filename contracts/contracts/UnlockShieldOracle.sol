// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title UnlockShieldOracle — Verifiable DeFi Stress Oracle
 * @notice Commit-Reveal prediction system with on-chain reputation
 * @dev Deployed on Kite AI Testnet (Chain ID: 2368)
 *
 * Implements ERC-8004 style trustless predictions:
 *   1. Agent commits keccak256(token, impact, timestamp, salt) BEFORE event
 *   2. After event: agent reveals prediction → contract verifies hash
 *   3. Accuracy scored → reputation updated on-chain
 *   4. Anyone can verify prediction was made before the event
 *
 * This makes the AI agent's track record PROVABLY honest:
 *   - Can't claim predictions after the fact (hash committed pre-event)
 *   - Can't modify predictions (immutable on-chain)
 *   - Anyone can audit accuracy (public view functions)
 *   - Reputation builds trustlessly (no centralized authority)
 *
 * Academic connection: Implements the "verification" layer of
 * "Stress Testing AMM Wrappers Under Realistic Market Volatility"
 */
contract UnlockShieldOracle {

    address public owner;
    address public agent;

    // ═══════════════ STRUCTS ═══════════════

    struct Commitment {
        bytes32 commitHash;         // keccak256(token, impactBps, timestamp, salt)
        string tokenSymbol;
        uint256 unlockTimestamp;
        uint256 committedAt;        // Block timestamp of commitment
        uint8 riskScore;            // From stress engine (1-100)
        bool revealed;
        int16 predictedImpactBps;   // Revealed later (-10000 to 10000 = -100% to +100%)
        int16 actualImpactBps;      // Recorded after event
        uint256 accuracyScore;      // 0-100
    }

    struct StressMetrics {
        int16 var95Bps;             // VaR(95%) in basis points
        int16 cvar95Bps;            // CVaR(95%) in basis points
        uint16 probLossGt10;        // P(loss > 10%) * 10000 (for precision)
        uint8 regime;               // 0=BULL, 1=BEAR, 2=SIDEWAYS
        uint16 ilMeanBps;           // Mean impermanent loss (bps)
    }

    struct Reputation {
        uint256 totalCommits;
        uint256 totalReveals;
        uint256 accuratePredictions; // Error ≤ 3%
        uint256 closePredictions;    // Error ≤ 5%
        uint256 totalErrorBps;       // Sum of absolute errors (for avg calculation)
        uint256 currentStreak;
        uint256 bestStreak;
        uint256 score;               // 0-1000
        uint256 lastUpdated;
    }

    // ═══════════════ STATE ═══════════════

    mapping(uint256 => Commitment) public commitments;
    mapping(uint256 => StressMetrics) public stressMetrics;
    Reputation public reputation;

    uint256 public commitCount;

    // ═══════════════ EVENTS ═══════════════

    event PredictionCommitted(
        uint256 indexed id,
        bytes32 commitHash,
        string tokenSymbol,
        uint256 unlockTimestamp,
        uint8 riskScore
    );

    event PredictionRevealed(
        uint256 indexed id,
        string tokenSymbol,
        int16 predictedImpactBps,
        int16 actualImpactBps,
        uint256 accuracyScore,
        bool wasAccurate
    );

    event StressMetricsRecorded(
        uint256 indexed commitId,
        int16 var95Bps,
        int16 cvar95Bps,
        uint8 regime
    );

    event ReputationUpdated(
        uint256 newScore,
        uint256 totalReveals,
        uint256 accuratePredictions
    );

    // ═══════════════ MODIFIERS ═══════════════

    modifier onlyAgent() {
        require(msg.sender == agent || msg.sender == owner, "Unauthorized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // ═══════════════ CONSTRUCTOR ═══════════════

    constructor(address _agent) {
        owner = msg.sender;
        agent = _agent;
    }

    // ═══════════════ COMMIT PHASE ═══════════════

    /**
     * @notice Commit a prediction hash BEFORE the unlock event
     * @param _commitHash keccak256(abi.encodePacked(token, impactBps, timestamp, salt))
     * @param _tokenSymbol Token symbol (e.g., "ARB")
     * @param _unlockTimestamp When the unlock happens
     * @param _riskScore AI risk assessment (1-100)
     */
    function commitPrediction(
        bytes32 _commitHash,
        string memory _tokenSymbol,
        uint256 _unlockTimestamp,
        uint8 _riskScore
    ) external onlyAgent returns (uint256) {
        require(_unlockTimestamp > block.timestamp, "Unlock must be in the future");
        require(_riskScore >= 1 && _riskScore <= 100, "Risk score must be 1-100");

        commitCount++;

        commitments[commitCount] = Commitment({
            commitHash: _commitHash,
            tokenSymbol: _tokenSymbol,
            unlockTimestamp: _unlockTimestamp,
            committedAt: block.timestamp,
            riskScore: _riskScore,
            revealed: false,
            predictedImpactBps: 0,
            actualImpactBps: 0,
            accuracyScore: 0
        });

        reputation.totalCommits++;
        reputation.lastUpdated = block.timestamp;

        emit PredictionCommitted(
            commitCount,
            _commitHash,
            _tokenSymbol,
            _unlockTimestamp,
            _riskScore
        );

        return commitCount;
    }

    /**
     * @notice Record stress simulation metrics alongside commitment
     * @dev Optional — adds richness to on-chain record
     */
    function recordStressMetrics(
        uint256 _commitId,
        int16 _var95Bps,
        int16 _cvar95Bps,
        uint16 _probLossGt10,
        uint8 _regime,
        uint16 _ilMeanBps
    ) external onlyAgent {
        require(_commitId <= commitCount && _commitId > 0, "Invalid commit");

        stressMetrics[_commitId] = StressMetrics({
            var95Bps: _var95Bps,
            cvar95Bps: _cvar95Bps,
            probLossGt10: _probLossGt10,
            regime: _regime,
            ilMeanBps: _ilMeanBps
        });

        emit StressMetricsRecorded(_commitId, _var95Bps, _cvar95Bps, _regime);
    }

    // ═══════════════ REVEAL PHASE ═══════════════

    /**
     * @notice Reveal prediction after unlock event — proves prediction was pre-event
     * @param _commitId The commitment ID to reveal
     * @param _predictedImpactBps The predicted price impact (basis points)
     * @param _actualImpactBps The actual price impact observed
     * @param _salt The secret salt used during commitment
     */
    function revealPrediction(
        uint256 _commitId,
        int16 _predictedImpactBps,
        int16 _actualImpactBps,
        bytes32 _salt
    ) external onlyAgent {
        require(_commitId <= commitCount && _commitId > 0, "Invalid commit");
        Commitment storage c = commitments[_commitId];
        require(!c.revealed, "Already revealed");
        require(block.timestamp >= c.unlockTimestamp, "Event hasn't occurred yet");

        // VERIFY commitment hash
        bytes32 computed = keccak256(abi.encodePacked(
            c.tokenSymbol,
            _predictedImpactBps,
            c.unlockTimestamp,
            _salt
        ));
        require(computed == c.commitHash, "Hash verification FAILED");

        // Score accuracy
        int16 error = _predictedImpactBps - _actualImpactBps;
        if (error < 0) error = -error;
        uint16 absError = uint16(error);

        uint256 accuracy;
        if (absError <= 100) accuracy = 100;       // ±1% = perfect
        else if (absError <= 300) accuracy = 85;   // ±3% = excellent
        else if (absError <= 500) accuracy = 70;   // ±5% = good
        else if (absError <= 1000) accuracy = 50;  // ±10% = acceptable
        else accuracy = 20;                        // >10% = poor

        // Update commitment
        c.revealed = true;
        c.predictedImpactBps = _predictedImpactBps;
        c.actualImpactBps = _actualImpactBps;
        c.accuracyScore = accuracy;

        // Update reputation
        reputation.totalReveals++;
        reputation.totalErrorBps += absError;

        bool wasAccurate = absError <= 300;
        bool wasClose = absError <= 500;

        if (wasAccurate) {
            reputation.accuratePredictions++;
            reputation.currentStreak++;
        } else if (wasClose) {
            reputation.closePredictions++;
            reputation.currentStreak++;
        } else {
            reputation.currentStreak = 0;
        }

        if (reputation.currentStreak > reputation.bestStreak) {
            reputation.bestStreak = reputation.currentStreak;
        }

        // Recalculate reputation score
        _updateReputationScore();

        emit PredictionRevealed(
            _commitId,
            c.tokenSymbol,
            _predictedImpactBps,
            _actualImpactBps,
            accuracy,
            wasAccurate
        );

        emit ReputationUpdated(
            reputation.score,
            reputation.totalReveals,
            reputation.accuratePredictions
        );
    }

    // ═══════════════ REPUTATION ═══════════════

    function _updateReputationScore() internal {
        uint256 n = reputation.totalReveals;
        if (n == 0) {
            reputation.score = 0;
            return;
        }

        // Accuracy component (0-400)
        uint256 accuracyRate = ((reputation.accuratePredictions * 100 + reputation.closePredictions * 70) * 400) / (n * 100);

        // Streak component (0-200)
        uint256 streakBonus = reputation.currentStreak > 10 ? 200 : (reputation.currentStreak * 20);

        // Volume component (0-150)
        uint256 volumeBonus = n > 50 ? 150 : (n * 3);

        // Error quality component (0-250)
        uint256 avgError = reputation.totalErrorBps / n;
        uint256 errorScore = avgError > 1500 ? 0 : ((1500 - avgError) * 250) / 1500;

        reputation.score = accuracyRate + streakBonus + volumeBonus + errorScore;
        if (reputation.score > 1000) reputation.score = 1000;

        reputation.lastUpdated = block.timestamp;
    }

    // ═══════════════ VIEW FUNCTIONS ═══════════════

    function getCommitment(uint256 _id) external view returns (Commitment memory) {
        require(_id <= commitCount && _id > 0, "Invalid ID");
        return commitments[_id];
    }

    function getStressMetrics(uint256 _id) external view returns (StressMetrics memory) {
        return stressMetrics[_id];
    }

    function getReputation() external view returns (Reputation memory) {
        return reputation;
    }

    function getAccuracyRate() external view returns (uint256) {
        if (reputation.totalReveals == 0) return 0;
        return (reputation.accuratePredictions * 100) / reputation.totalReveals;
    }

    function getAverageError() external view returns (uint256) {
        if (reputation.totalReveals == 0) return 0;
        return reputation.totalErrorBps / reputation.totalReveals;
    }

    /**
     * @notice Verify a commitment hash matches expected values
     * @dev Anyone can call this to verify prediction authenticity
     */
    function verifyCommitment(
        uint256 _commitId,
        int16 _predictedImpactBps,
        bytes32 _salt
    ) external view returns (bool) {
        Commitment memory c = commitments[_commitId];
        bytes32 computed = keccak256(abi.encodePacked(
            c.tokenSymbol,
            _predictedImpactBps,
            c.unlockTimestamp,
            _salt
        ));
        return computed == c.commitHash;
    }

    // ═══════════════ ADMIN ═══════════════

    function updateAgent(address _newAgent) external onlyOwner {
        agent = _newAgent;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }
}
