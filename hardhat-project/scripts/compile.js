// scripts/compile.js - Script to compile contracts
const hre = require("hardhat");

async function main() {
  console.log("Compiling contracts...");
  
  // This will compile all contracts in the contracts directory
  await hre.run("compile");
  
  console.log("Compilation completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Compilation failed:", error);
    process.exit(1);
  });