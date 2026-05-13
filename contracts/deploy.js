// Deploy script for UnlockShieldAttestation on Kite Testnet
// Usage: npx hardhat run deploy.js --network kiteTestnet

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy with the deployer as the initial agent
  const Contract = await ethers.getContractFactory("UnlockShieldAttestation");
  const contract = await Contract.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("UnlockShieldAttestation deployed to:", address);
  console.log("View on KiteScan:", `https://testnet.kitescan.ai/address/${address}`);
  console.log("\nAdd this to your backend/.env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
