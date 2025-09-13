// scripts/deploy-betting.js - Script to deploy IPLBettingContract
const hre = require("hardhat");

async function main() {
  console.log("Deploying IPLBettingContract...");
  
  // Get the contract factory
  const IPLBettingContract = await hre.ethers.getContractFactory("IPLBettingContract");
  
  // Deploy the contract
  const bettingContract = await IPLBettingContract.deploy();
  
  // Wait for deployment to be confirmed (5 confirmations)
  await bettingContract.deployTransaction.wait(5);
  
  console.log("IPLBettingContract deployed to:", bettingContract.address);
  console.log("Transaction hash:", bettingContract.deployTransaction.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });