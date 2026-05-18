// Update AgentTreasury spending policy on Kite Testnet.
//
// Usage:
//   TREASURY_ADDRESS=0x... npx hardhat run update_treasury_policy.js --network kiteTestnet

const { ethers } = require("hardhat");

const TREASURY_ABI = [
  "function updatePolicy(uint256 maxSingleTradeUsd,uint256 dailyCapUsd,uint8 minRiskScore) external",
  "function maxSingleTradeUsd() view returns (uint256)",
  "function dailyCapUsd() view returns (uint256)",
  "function minRiskScore() view returns (uint8)",
  "function owner() view returns (address)",
];

const treasuryAddress = process.env.TREASURY_ADDRESS;
const maxSingle = BigInt(process.env.MAX_SINGLE_TRADE_USD || "1000") * 1_000_000n;
const dailyCap = BigInt(process.env.DAILY_CAP_USD || "5000") * 1_000_000n;
const minRisk = Number(process.env.MIN_RISK_SCORE || "25");

async function main() {
  if (!treasuryAddress) {
    throw new Error("Set TREASURY_ADDRESS first");
  }

  const [signer] = await ethers.getSigners();
  const treasury = new ethers.Contract(treasuryAddress, TREASURY_ABI, signer);
  const owner = await treasury.owner();

  console.log("AgentTreasury policy update");
  console.log("Treasury:", treasuryAddress);
  console.log("Signer:  ", signer.address);
  console.log("Owner:   ", owner);

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("Signer is not treasury owner");
  }

  console.log("Current policy:");
  console.log("  Max single:", ethers.formatUnits(await treasury.maxSingleTradeUsd(), 6), "USDC");
  console.log("  Daily cap: ", ethers.formatUnits(await treasury.dailyCapUsd(), 6), "USDC");
  console.log("  Min risk:  ", await treasury.minRiskScore());

  const tx = await treasury.updatePolicy(maxSingle, dailyCap, minRisk);
  console.log("Tx:", tx.hash);
  await tx.wait();

  console.log("Updated policy:");
  console.log("  Max single:", ethers.formatUnits(await treasury.maxSingleTradeUsd(), 6), "USDC");
  console.log("  Daily cap: ", ethers.formatUnits(await treasury.dailyCapUsd(), 6), "USDC");
  console.log("  Min risk:  ", await treasury.minRiskScore());
  console.log("KiteScan:", `https://testnet.kitescan.ai/tx/${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
