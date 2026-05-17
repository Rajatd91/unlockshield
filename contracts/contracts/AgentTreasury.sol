// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

/// @title AgentTreasury — bounded-autonomy capital execution for UnlockShield
/// @notice Holds USDC and executes hedge actions on behalf of the autonomous
///         risk agent. Every action is constrained by on-chain spending
///         policy and emits a verifiable event. The agent's wallet is the
///         only authorised executor.
///
/// This implements Track 2's "reputation-aware capital delegation" and
/// "stablecoin-first settlement" requirements for the Kite AI hackathon.
contract AgentTreasury {
    address public immutable agent;
    address public immutable owner;
    IERC20  public immutable usdc;

    // Spending policy (programmable constraints on agent autonomy)
    uint256 public maxSingleTradeUsd;   // 6-decimal USDC, e.g. 1_000e6
    uint256 public dailyCapUsd;         // resets every 24h
    uint8   public minRiskScore;        // 0-100; reject hedges below this

    // Rolling 24h spend accounting
    uint256 public currentDayBucket;
    uint256 public spentToday;

    // Stats
    uint256 public totalTrades;
    uint256 public totalUsdDeployed;
    uint256 public totalHedgesBlocked;

    struct HedgeAction {
        uint256 id;
        string  token;            // e.g. "ARB"
        string  action;           // FULL_EXIT / SHORT_HEDGE / DCA_EXIT / HOLD
        uint8   riskScore;
        uint256 amountUsd;        // 6-decimal USDC
        address recipient;        // sink for hedge (e.g. simulated DEX)
        uint256 timestamp;
        bytes32 predictionRef;    // commit hash that triggered this hedge
    }

    HedgeAction[] public history;

    event PolicyUpdated(uint256 maxSingleTradeUsd, uint256 dailyCapUsd, uint8 minRiskScore);
    event HedgeExecuted(
        uint256 indexed id,
        string  token,
        string  action,
        uint8   riskScore,
        uint256 amountUsd,
        address indexed recipient,
        bytes32 indexed predictionRef
    );
    event HedgeBlocked(
        string  token,
        string  reason,
        uint256 attemptedAmountUsd,
        uint8   riskScore
    );
    event Funded(address indexed from, uint256 amountUsd);

    modifier onlyAgent() {
        require(msg.sender == agent, "AgentTreasury: only agent");
        _;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "AgentTreasury: only owner");
        _;
    }

    constructor(
        address _agent,
        address _usdc,
        uint256 _maxSingleTradeUsd,
        uint256 _dailyCapUsd,
        uint8   _minRiskScore
    ) {
        require(_agent != address(0), "AgentTreasury: zero agent");
        require(_usdc  != address(0), "AgentTreasury: zero usdc");
        agent = _agent;
        owner = msg.sender;
        usdc  = IERC20(_usdc);
        maxSingleTradeUsd = _maxSingleTradeUsd;
        dailyCapUsd       = _dailyCapUsd;
        minRiskScore      = _minRiskScore;
        currentDayBucket  = block.timestamp / 1 days;
    }

    /// @notice Update spending policy. Only owner (the human deployer) can
    ///         change limits — the agent itself cannot widen its own bounds.
    function updatePolicy(
        uint256 _maxSingleTradeUsd,
        uint256 _dailyCapUsd,
        uint8   _minRiskScore
    ) external onlyOwner {
        maxSingleTradeUsd = _maxSingleTradeUsd;
        dailyCapUsd       = _dailyCapUsd;
        minRiskScore      = _minRiskScore;
        emit PolicyUpdated(_maxSingleTradeUsd, _dailyCapUsd, _minRiskScore);
    }

    /// @notice Fund the treasury with USDC. Useful for top-ups by the owner.
    function fund(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "AgentTreasury: transferFrom failed");
        emit Funded(msg.sender, amount);
    }

    /// @notice Execute a hedge action. Called by the autonomous agent.
    /// @dev Enforces all three policy gates before transferring USDC.
    function executeHedge(
        string calldata token,
        string calldata action,
        uint8 riskScore,
        uint256 amountUsd,
        address recipient,
        bytes32 predictionRef
    ) external onlyAgent returns (uint256 id) {
        // Gate 1: risk threshold
        if (riskScore < minRiskScore) {
            totalHedgesBlocked += 1;
            emit HedgeBlocked(token, "risk_below_threshold", amountUsd, riskScore);
            return 0;
        }
        // Gate 2: single trade size
        if (amountUsd > maxSingleTradeUsd) {
            totalHedgesBlocked += 1;
            emit HedgeBlocked(token, "exceeds_max_single_trade", amountUsd, riskScore);
            return 0;
        }
        // Gate 3: daily cap with 24h rolling reset
        uint256 dayNow = block.timestamp / 1 days;
        if (dayNow != currentDayBucket) {
            currentDayBucket = dayNow;
            spentToday = 0;
        }
        if (spentToday + amountUsd > dailyCapUsd) {
            totalHedgesBlocked += 1;
            emit HedgeBlocked(token, "exceeds_daily_cap", amountUsd, riskScore);
            return 0;
        }
        // Gate 4: actual balance
        if (usdc.balanceOf(address(this)) < amountUsd) {
            totalHedgesBlocked += 1;
            emit HedgeBlocked(token, "insufficient_balance", amountUsd, riskScore);
            return 0;
        }

        // Execute
        spentToday        += amountUsd;
        totalTrades       += 1;
        totalUsdDeployed  += amountUsd;
        id = history.length;

        history.push(HedgeAction({
            id:             id,
            token:          token,
            action:         action,
            riskScore:      riskScore,
            amountUsd:      amountUsd,
            recipient:      recipient,
            timestamp:      block.timestamp,
            predictionRef:  predictionRef
        }));

        require(usdc.transfer(recipient, amountUsd), "AgentTreasury: usdc transfer failed");

        emit HedgeExecuted(id, token, action, riskScore, amountUsd, recipient, predictionRef);
    }

    /// @notice Total hedges executed (for stats).
    function historyCount() external view returns (uint256) {
        return history.length;
    }

    /// @notice Remaining USDC balance.
    function balanceUsd() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /// @notice Remaining headroom under today's spending cap.
    function remainingTodayUsd() external view returns (uint256) {
        uint256 dayNow = block.timestamp / 1 days;
        uint256 used = (dayNow == currentDayBucket) ? spentToday : 0;
        return used >= dailyCapUsd ? 0 : (dailyCapUsd - used);
    }

    /// @notice Read the public agent passport (snapshot of identity + stats).
    function agentPassport() external view returns (
        address agentAddress,
        uint256 trades,
        uint256 deployed,
        uint256 blocked,
        uint256 currentBalance,
        uint256 headroom
    ) {
        agentAddress   = agent;
        trades         = totalTrades;
        deployed       = totalUsdDeployed;
        blocked        = totalHedgesBlocked;
        currentBalance = usdc.balanceOf(address(this));
        uint256 dayNow = block.timestamp / 1 days;
        uint256 used   = (dayNow == currentDayBucket) ? spentToday : 0;
        headroom       = used >= dailyCapUsd ? 0 : (dailyCapUsd - used);
    }
}
