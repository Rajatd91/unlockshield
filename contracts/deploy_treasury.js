// Deploy MockUSDC + AgentTreasury on Kite Testnet
// Run AFTER you've already deployed UnlockShieldOracle via deploy.js.
//
// Usage:
//   cd contracts
//   npx hardhat run deploy_treasury.js --network kiteTestnet
//
// The deployer address becomes both the AgentTreasury owner AND the agent
// executor (so the backend AGENT_PRIVATE_KEY can call executeHedge).

const { ethers } = require("hardhat");

// Spending policy defaults (USDC = 6 decimals)
// max single trade: $1,000  |  daily cap: $5,000  |  min risk threshold: 35
const MAX_SINGLE = 1_000n * 1_000_000n;
const DAILY_CAP  = 5_000n * 1_000_000n;
const MIN_RISK   = 35;

// Initial seed funding for the treasury (10,000 USDC)
const SEED_USDC = 10_000n * 1_000_000n;

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);

  console.log("═══════════════════════════════════════════════════════");
  console.log("UnlockShield AgentTreasury — Kite Testnet Deployment");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Deployer / Agent:", deployer.address);
  console.log("KITE balance:    ", ethers.formatEther(balance));

  if (balance === 0n) {
    console.error("\nWallet has 0 KITE. Get testnet tokens from https://faucet.gokite.ai first.");
    process.exit(1);
  }

  // 1. Deploy MockUSDC
  console.log("\n[1/3] Deploying MockUSDC...");
  const USDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await USDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("       MockUSDC:", usdcAddress);

  // 2. Deploy AgentTreasury (deployer is both owner and agent for the demo)
  console.log("\n[2/3] Deploying AgentTreasury...");
  const Treasury = await ethers.getContractFactory("AgentTreasury");
  const treasury = await Treasury.deploy(
    deployer.address,   // agent
    usdcAddress,        // usdc
    MAX_SINGLE,
    DAILY_CAP,
    MIN_RISK
  );
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("       AgentTreasury:", treasuryAddress);

  // 3. Mint seed USDC and fund treasury
  console.log("\n[3/3] Minting seed USDC + funding treasury...");
  const mintTx = await usdc.mint(deployer.address, SEED_USDC);
  await mintTx.wait();
  const approveTx = await usdc.approve(treasuryAddress, SEED_USDC);
  await approveTx.wait();
  const fundTx = await treasury.fund(SEED_USDC);
  await fundTx.wait();
  console.log("       Seeded with:", (SEED_USDC / 1_000_000n).toString(), "USDC");

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("DEPLOYED");
  console.log("═══════════════════════════════════════════════════════");
  console.log("MockUSDC:        ", usdcAddress);
  console.log("AgentTreasury:   ", treasuryAddress);
  console.log("KiteScan (USDC): ", `https://testnet.kitescan.ai/address/${usdcAddress}`);
  console.log("KiteScan (Vault):", `https://testnet.kitescan.ai/address/${treasuryAddress}`);
  console.log("\nSpending Policy:");
  console.log("  Max single trade:", (MAX_SINGLE / 1_000_000n).toString(), "USDC");
  console.log("  Daily cap:       ", (DAILY_CAP  / 1_000_000n).toString(), "USDC");
  console.log("  Min risk score:  ", MIN_RISK);
  console.log("\nNext steps — add to backend env on Render:");
  console.log(`  USDC_ADDRESS=${usdcAddress}`);
  console.log(`  TREASURY_ADDRESS=${treasuryAddress}`);
  console.log(`  AGENT_LOOP_ENABLED=true`);
  console.log("\nAnd to frontend env on Vercel:");
  console.log(`  VITE_USDC_ADDRESS=${usdcAddress}`);
  console.log(`  VITE_TREASURY_ADDRESS=${treasuryAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
