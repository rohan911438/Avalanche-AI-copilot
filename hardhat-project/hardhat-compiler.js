// hardhat-compiler.js
// This script serves as a bridge between our backend compiler and Hardhat

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Compiles a contract using Hardhat
 * @param {string} contractSource - The source code of the contract
 * @param {string} contractName - The name of the contract file (e.g., "MyContract.sol")
 * @returns {Promise<Object>} - The compiled contract data (ABI and bytecode)
 */
async function compileWithHardhat(contractSource, contractName) {
  try {
    // Write the contract to a temporary file in the contracts directory
    const tempContractPath = path.join(__dirname, 'contracts', contractName);
    fs.writeFileSync(tempContractPath, contractSource);
    
    // Run Hardhat compile
    await runCommand('npm run compile');
    
    // Get the compiled artifact
    const contractBaseName = path.basename(contractName, '.sol');
    const artifactPath = path.join(__dirname, 'artifacts', 'contracts', contractName, `${contractBaseName}.json`);
    
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Compiled artifact not found at ${artifactPath}`);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Clean up temp file (optional)
    // fs.unlinkSync(tempContractPath);
    
    return {
      success: true,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      contractName: contractBaseName
    };
  } catch (error) {
    console.error('Hardhat compilation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run a command in a shell
 * @param {string} cmd - The command to run
 * @returns {Promise<string>} - The command output
 */
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

module.exports = {
  compileWithHardhat
};