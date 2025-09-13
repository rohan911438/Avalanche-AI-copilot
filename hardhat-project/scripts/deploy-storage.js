// scripts/deploy-storage.js - Script to deploy SimpleStorageWithOZ contract
const hre = require("hardhat");

async function main() {
  console.log("Deploying SimpleStorageWithOZ contract...");
  
  // Get the contract factory
  const SimpleStorageWithOZ = await hre.ethers.getContractFactory("SimpleStorageWithOZ");
  
  // Deploy the contract
  const simpleStorage = await SimpleStorageWithOZ.deploy();
  
  // Wait for deployment to be confirmed (5 confirmations)
  await simpleStorage.deployTransaction.wait(5);
  
  console.log("SimpleStorageWithOZ deployed to:", simpleStorage.address);
  console.log("Transaction hash:", simpleStorage.deployTransaction.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });