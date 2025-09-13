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
    
    console.log('Writing contract to:', tempContractPath);
    console.log('Contract code (first 100 chars):', cleanedCode.substring(0, 100));
    
    // Write contract to file
    fs.writeFileSync(tempContractPath, cleanedCode);
    
    // Log the content of the written file to verify it was written correctly
    try {
      const writtenContent = fs.readFileSync(tempContractPath, 'utf8');
      console.log('Written file content (first 100 chars):', writtenContent.substring(0, 100));
    } catch (readErr) {
      console.error('Error reading back written file:', readErr);
    }
    
    // Extract contract name without extension
    const contractBaseName = path.basename(contractName, '.sol');
    
    // Extract the actual contract name from the source code
    // Look for 'contract ContractName {' with a more precise regex
    const contractNameMatch = cleanedCode.match(/contract\s+([a-zA-Z0-9_]+)(\s*{|\s+is\s+)/);
    const actualContractName = contractNameMatch ? contractNameMatch[1] : contractBaseName;
    
    console.log('File basename:', contractBaseName);
    console.log('Actual contract name from code:', actualContractName);
    
    // Run hardhat compile with proper output handling
    try {
      console.log('Executing Hardhat compilation...');
      console.log('Hardhat project path:', hardhatProjectPath);
      console.log('Listing files in contracts directory:');
      try {
        const contractsDir = path.join(hardhatProjectPath, 'contracts');
        const files = fs.readdirSync(contractsDir);
        console.log('Contracts found:', files);
      } catch (listError) {
        console.error('Error listing contracts:', listError);
      }
      
      console.log('Running npm compile command...');
      const result = execSync('npm run compile', { 
        cwd: hardhatProjectPath,
        encoding: 'utf8',  // Ensure output is encoded as text
        stdio: 'inherit'   // Show output directly to help with debugging
      });
      console.log('Compilation command executed successfully');
      console.log(result);
    } catch (compileError) {
      console.error('Hardhat compilation process error:');
      if (compileError.stdout) console.error('STDOUT:', compileError.stdout.toString());
      if (compileError.stderr) console.error('STDERR:', compileError.stderr.toString());
      throw new Error(`Compilation failed: ${compileError.message}`);
    }
    
    // Path to the compiled artifact - first try with the file basename (which is more reliable)
    let artifactPath = path.join(
      hardhatProjectPath,
      'artifacts',
      'contracts',
      contractName,
      `${contractBaseName}.json`
    );
    
    console.log('Looking for artifact at:', artifactPath);
    
    // If the artifact doesn't exist with the file basename, try with the detected contract name
    if (!fs.existsSync(artifactPath) && actualContractName !== contractBaseName) {
      console.log('Artifact not found with file basename, trying with detected contract name...');
      artifactPath = path.join(
        hardhatProjectPath,
        'artifacts',
        'contracts',
        contractName,
        `${actualContractName}.json`
      );
      console.log('Alternative artifact path:', artifactPath);
    }
    
    // If we still can't find the artifact, try looking in other paths
    if (!fs.existsSync(artifactPath)) {
      console.log('Searching for artifacts in the artifacts directory...');
      
      // Try to find any .json files in the artifacts directory
      const artifactsDir = path.join(hardhatProjectPath, 'artifacts');
      
      try {
        // Walk through the artifacts directory
        function findArtifacts(dir) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              findArtifacts(fullPath);
            } else if (entry.name.endsWith('.json') && !entry.name.includes('dbg')) {
              console.log('Found artifact:', fullPath);
              return fullPath;
            }
          }
          return null;
        }
        
        const foundArtifact = findArtifacts(artifactsDir);
        if (foundArtifact) {
          artifactPath = foundArtifact;
        }
      } catch (findError) {
        console.error('Error searching for artifacts:', findError);
      }
    }
    
    // Check if artifact exists
    if (!fs.existsSync(artifactPath)) {
      // Look for any compilation errors saved in the project
      const errorFiles = fs.readdirSync(hardhatProjectPath).filter(file => file.endsWith('-error.log'));
      
      if (errorFiles.length > 0) {
        const errorContent = fs.readFileSync(path.join(hardhatProjectPath, errorFiles[0]), 'utf8');
        throw new Error(`Compilation failed: ${errorContent}`);
      }
      
      // Check if there are solidity errors in the artifacts folder
      const solcErrorPath = path.join(hardhatProjectPath, 'artifacts', 'errors.json');
      if (fs.existsSync(solcErrorPath)) {
        const solcErrors = JSON.parse(fs.readFileSync(solcErrorPath, 'utf8'));
        throw new Error(`Solidity errors: ${JSON.stringify(solcErrors)}`);
      }
      
      // Last resort - try to compile manually using hardhat CLI
      try {
        console.log('Attempting direct hardhat compilation...');
        const hardhatBin = path.join(hardhatProjectPath, 'node_modules', '.bin', 'hardhat');
        const result = execSync(`"${hardhatBin}" compile`, { 
          cwd: hardhatProjectPath,
          encoding: 'utf8'
        });
        console.log('Direct compilation result:', result);
        
        // Try to find artifacts again
        const findResult = execSync('dir /s /b *.json', {
          cwd: path.join(hardhatProjectPath, 'artifacts'),
          encoding: 'utf8'
        });
        
        if (findResult) {
          const files = findResult.split('\n').filter(f => f && !f.includes('dbg') && f.endsWith('.json'));
          if (files.length > 0) {
            artifactPath = files[0].trim();
            console.log('Found artifact after direct compilation:', artifactPath);
          }
        }
      } catch (directCompileError) {
        console.error('Direct compilation failed:', directCompileError);
      }
      
      if (!fs.existsSync(artifactPath)) {
        throw new Error(`Compilation failed: No artifact found at ${artifactPath}. Make sure the contract name in the file matches the filename.`);
      }
    }
    
    // Read the artifact
    const artifactContent = fs.readFileSync(artifactPath, 'utf8');
    const artifact = JSON.parse(artifactContent);
    
    console.log('Contract compiled successfully with Hardhat');
    
    // Determine the final contract name (from the artifact file name)
    const artifactFileName = path.basename(artifactPath);
    const finalContractName = artifactFileName.replace('.json', '');
    
    // Return compilation result
    return {
      success: true,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      contractName: finalContractName
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