// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title UnlockShieldAttestation
 * @notice Records AI agent predictions and hedge actions on Kite chain
 * @dev Deployed on Kite AI Testnet (Chain ID: 2368)
 *
 * Every prediction the agent makes and every hedge it executes
 * gets permanently recorded here — creating a verifiable,
 * auditable track record that users can trust.
 */
contract UnlockShieldAttestation {

    address public owner;
    address public agent; // The AI agent's wallet address

    // ============ Structs ============

    struct Prediction {
        uint256 id;
        string tokenSymbol;        // e.g., "ARB", "OP", "APT"
        uint256 unlockAmount;      // USD value of tokens being unlocked
        uint256 unlockTimestamp;    // When the unlock happens
        uint8 riskScore;           // 1-100, AI's predicted impact severity
        string reasoning;          // Human-readable AI reasoning
        int16 predictedPriceImpact; // Predicted % change (negative = dump), basis points
        int16 actualPriceImpact;   // Actual % change after unlock (filled later)
        uint256 createdAt;
        bool outcomeRecorded;
    }

    struct HedgeAction {
        uint256 id;
        uint256 predictionId;      // Links to which prediction triggered this
        string actionType;         // "REDUCE_POSITION", "SHORT_HEDGE", "MOVE_TO_STABLE", "HOLD"
        string details;            // JSON: amounts, pairs, reasoning
        uint256 executedAt;
        bool simulated;            // true for hackathon (simulated trades)
    }

    struct AgentStats {
        uint256 totalPredictions;
        uint256 accuratePredictions; // Within 5% of actual impact
        uint256 totalHedges;
        uint256 totalValueProtected; // USD value of portfolio protected
        uint256 lastUpdated;
    }

    // ============ State ============

    mapping(uint256 => Prediction) public predictions;
    mapping(uint256 => HedgeAction) public hedgeActions;
    AgentStats public agentStats;

    uint256 public predictionCount;
    uint256 public hedgeActionCount;

    // ============ Events ============

    event PredictionCreated(
        uint256 indexed id,
        string tokenSymbol,
        uint8 riskScore,
        int16 predictedPriceImpact,
        uint256 unlockTimestamp
    );

    event HedgeExecuted(
        uint256 indexed id,
        uint256 indexed predictionId,
        string actionType,
        uint256 executedAt
    );

    event OutcomeRecorded(
        uint256 indexed predictionId,
        int16 actualPriceImpact,
        bool wasAccurate
    );

    // ============ Modifiers ============

    modifier onlyAgent() {
        require(msg.sender == agent || msg.sender == owner, "Only agent or owner");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // ============ Constructor ============

    constructor(address _agent) {
        owner = msg.sender;
        agent = _agent;
    }

    // ============ Core Functions ============

    /**
     * @notice Record a new unlock prediction on-chain
     * @dev Called by the AI agent when it detects an upcoming token unlock
     */
    function createPrediction(
        string memory _tokenSymbol,
        uint256 _unlockAmount,
        uint256 _unlockTimestamp,
        uint8 _riskScore,
        string memory _reasoning,
        int16 _predictedPriceImpact
    ) external onlyAgent returns (uint256) {
        predictionCount++;

        predictions[predictionCount] = Prediction({
            id: predictionCount,
            tokenSymbol: _tokenSymbol,
            unlockAmount: _unlockAmount,
            unlockTimestamp: _unlockTimestamp,
            riskScore: _riskScore,
            reasoning: _reasoning,
            predictedPriceImpact: _predictedPriceImpact,
            actualPriceImpact: 0,
            createdAt: block.timestamp,
            outcomeRecorded: false
        });

        agentStats.totalPredictions++;
        agentStats.lastUpdated = block.timestamp;

        emit PredictionCreated(
            predictionCount,
            _tokenSymbol,
            _riskScore,
            _predictedPriceImpact,
            _unlockTimestamp
        );

        return predictionCount;
    }

    /**
     * @notice Record a hedge action taken by the agent
     * @dev Links back to the prediction that triggered it
     */
    function recordHedgeAction(
        uint256 _predictionId,
        string memory _actionType,
        string memory _details,
        bool _simulated
    ) external onlyAgent returns (uint256) {
        require(_predictionId <= predictionCount && _predictionId > 0, "Invalid prediction");

        hedgeActionCount++;

        hedgeActions[hedgeActionCount] = HedgeAction({
            id: hedgeActionCount,
            predictionId: _predictionId,
            actionType: _actionType,
            details: _details,
            executedAt: block.timestamp,
            simulated: _simulated
        });

        agentStats.totalHedges++;
        agentStats.lastUpdated = block.timestamp;

        emit HedgeExecuted(
            hedgeActionCount,
            _predictionId,
            _actionType,
            block.timestamp
        );

        return hedgeActionCount;
    }

    /**
     * @notice Record the actual outcome after a token unlock event
     * @dev Compares prediction vs reality to build reputation
     */
    function recordOutcome(
        uint256 _predictionId,
        int16 _actualPriceImpact,
        uint256 _valueProtected
    ) external onlyAgent {
        require(_predictionId <= predictionCount && _predictionId > 0, "Invalid prediction");
        Prediction storage pred = predictions[_predictionId];
        require(!pred.outcomeRecorded, "Outcome already recorded");

        pred.actualPriceImpact = _actualPriceImpact;
        pred.outcomeRecorded = true;

        // Check if prediction was accurate (within 500 basis points = 5%)
        int16 diff = pred.predictedPriceImpact - _actualPriceImpact;
        if (diff < 0) diff = -diff;

        bool wasAccurate = diff <= 500;
        if (wasAccurate) {
            agentStats.accuratePredictions++;
        }

        agentStats.totalValueProtected += _valueProtected;
        agentStats.lastUpdated = block.timestamp;

        emit OutcomeRecorded(_predictionId, _actualPriceImpact, wasAccurate);
    }

    // ============ View Functions ============

    function getPrediction(uint256 _id) external view returns (Prediction memory) {
        require(_id <= predictionCount && _id > 0, "Invalid prediction");
        return predictions[_id];
    }

    function getHedgeAction(uint256 _id) external view returns (HedgeAction memory) {
        require(_id <= hedgeActionCount && _id > 0, "Invalid hedge action");
        return hedgeActions[_id];
    }

    function getAgentAccuracy() external view returns (uint256 accurate, uint256 total) {
        return (agentStats.accuratePredictions, agentStats.totalPredictions);
    }

    function getReputationScore() external view returns (uint256) {
        if (agentStats.totalPredictions == 0) return 0;
        return (agentStats.accuratePredictions * 100) / agentStats.totalPredictions;
    }

    // ============ Admin ============

    function updateAgent(address _newAgent) external onlyOwner {
        agent = _newAgent;
    }
}
