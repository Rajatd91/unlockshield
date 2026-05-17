// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title MockUSDC for UnlockShield Agent Treasury demo on Kite Testnet
/// @notice 6-decimal ERC20 mock that anyone can mint, used for autonomous agent
///         hedge settlement during the Kite AI hackathon demo.
contract MockUSDC {
    string public constant name = "Mock USDC";
    string public constant symbol = "USDC";
    uint8  public constant decimals = 6;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);

    /// @notice Open mint for the demo — anyone can fund a test address.
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
        emit Mint(to, amount);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "USDC: insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "USDC: insufficient balance");
        require(allowance[from][msg.sender] >= value, "USDC: insufficient allowance");
        balanceOf[from] -= value;
        allowance[from][msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}
