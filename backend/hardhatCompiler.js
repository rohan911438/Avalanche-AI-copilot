const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Clean the Solidity code by removing markdown artifacts and formatting
 * @param {string} code - Raw contract code that may contain markdown artifacts
 * @returns {string} - Clean Solidity code
 */
function cleanSolidityCode(code) {
  // Remove markdown code block backticks if present
  code = code.replace(/```solidity/g, '').replace(/```/g, '');
  
  // Remove any trailing or leading whitespace
  code = code.trim();
  
  // If the code doesn't start with pragma or a comment, it might be invalid
  if (!code.startsWith('pragma') && !code.startsWith('//') && !code.startsWith('/*')) {
    // Try to find the pragma line and start from there
    const pragmaIndex = code.indexOf('pragma');
    if (pragmaIndex > 0) {
      code = code.substring(pragmaIndex);
    }
  }
  
  return code;
}

/**
 * Compiles a Solidity contract using Hardhat
 * @param {string} sourceCode - The Solidity source code
 * @param {string} contractName - Optional name for the contract file
 * @returns {Object} - Compilation result with ABI and bytecode
 */
async function compileContractWithHardhat(sourceCode, contractName = 'TempContract.sol') {
  try {
    console.log('Compiling contract with Hardhat...');
    
    // Clean the source code
    const cleanedCode = cleanSolidityCode(sourceCode);
    
    // Path to hardhat project
    const hardhatProjectPath = path.join(__dirname, '..', 'hardhat-project');
    
    // Path for temporary contract file
    const tempContractPath = path.join(hardhatProjectPath, 'contracts', contractName);
    
    // Write contract to file
    fs.writeFileSync(tempContractPath, cleanedCode);
    
    // Extract contract name without extension
    const contractBaseName = path.basename(contractName, '.sol');
    
    // Run hardhat compile
    execSync('npm run compile', { cwd: hardhatProjectPath });
    
    // Path to the compiled artifact
    const artifactPath = path.join(
      hardhatProjectPath,
      'artifacts',
      'contracts',
      contractName,
      `${contractBaseName}.json`
    );
    
    // Check if artifact exists
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Compilation failed: No artifact found at ${artifactPath}`);
    }
    
    // Read the artifact
    const artifactContent = fs.readFileSync(artifactPath, 'utf8');
    const artifact = JSON.parse(artifactContent);
    
    console.log('Contract compiled successfully with Hardhat');
    
    // Return compilation result
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
      error: error.message || 'Unknown compilation error'
    };
  }
}

/**
 * Handle contract compilation request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleCompileRequest(req, res) {
  try {
    const { sourceCode, contractName } = req.body;
    
    if (!sourceCode) {
      return res.status(400).json({
        success: false,
        error: 'No source code provided'
      });
    }
    
    const compilationResult = await compileContractWithHardhat(
      sourceCode,
      contractName || 'TempContract.sol'
    );
    
    if (!compilationResult.success) {
      return res.status(400).json(compilationResult);
    }
    
    res.json(compilationResult);
    
  } catch (error) {
    console.error('Error handling compile request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

module.exports = {
  compileContractWithHardhat,
  cleanSolidityCode,
  handleCompileRequest
};