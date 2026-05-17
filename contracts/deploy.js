// Deploy script for UnlockShieldOracle on Kite Testnet
// Usage:
//   1. cd contracts && npm install
//   2. Create contracts/.env with: AGENT_PRIVATE_KEY=0xYourPrivateKey
//   3. Fund the wallet from https://faucet.gokite.ai
//   4. npx hardhat run deploy.js --network kiteTestnet

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);

  console.log("═══════════════════════════════════════════════════════");
  console.log("UnlockShield Oracle — Kite Testnet Deployment");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "KITE");

  if (balance === 0n) {
    console.error("\nWallet has 0 KITE. Get testnet tokens from https://faucet.gokite.ai first.");
    process.exit(1);
  }

  console.log("\nDeploying UnlockShieldOracle...");
  const Contract = await ethers.getContractFactory("UnlockShieldOracle");
  const contract = await Contract.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction().hash;

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("DEPLOYED");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Contract address:", address);
  console.log("Tx hash:        ", txHash);
  console.log("KiteScan:       ", `https://testnet.kitescan.ai/address/${address}`);
  console.log("Tx on KiteScan: ", `https://testnet.kitescan.ai/tx/${txHash}`);
  console.log("\nNext steps:");
  console.log("  1. Copy this contract address");
  console.log("  2. Add to backend env on Render:");
  console.log(`     CONTRACT_ADDRESS=${address}`);
  console.log("  3. Add to frontend env on Vercel:");
  console.log(`     VITE_CONTRACT_ADDRESS=${address}`);
  console.log("  4. Add the address to your README and hackathon submission");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
