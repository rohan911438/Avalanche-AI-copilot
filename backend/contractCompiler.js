const solc = require('solc');

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
 * Transform OpenZeppelin imports to use local contracts
 * @param {string} code - Solidity code with potential OpenZeppelin imports
 * @returns {string} - Code with imports transformed to use local contracts
 */
function transformImports(code) {
  // Check for standard relative imports and make sure they're properly formatted
  code = code.replace(
    /import\s+\"\.\/([A-Za-z0-9]+)\.sol\";/g,
    (match, contractName) => {
      console.log(`Found relative import: ${match}, transforming to direct reference`);
      return `import "${contractName}.sol";`;
    }
  );
  
  // Replace OpenZeppelin imports with local contract imports
  code = code.replace(
    /import\s+\"@openzeppelin\/contracts\/(.*?)\";/g,
    (match, importPath) => {
      // Extract the contract name from the import path
      const parts = importPath.split('/');
      const contractName = parts[parts.length - 1].split('.')[0];
      
      console.log(`Transforming OpenZeppelin import: ${match} to use local contract: ${contractName}`);
      
      // Return a direct import for the contract
      return `import "${contractName}.sol";`;
    }
  );
  
  return code;
}

/**
 * Compiles a Solidity smart contract
 * @param {string} sourceCode - The Solidity source code
 * @returns {Object} - Object containing ABI and bytecode
 */
function compileContract(sourceCode) {
  try {
    // Clean the source code first
    const cleanedCode = cleanSolidityCode(sourceCode);
    
    // Transform OpenZeppelin imports to use GitHub URLs
    const transformedCode = transformImports(cleanedCode);
    
    // Prepare input for the Solidity compiler
    const fs = require('fs');
    const path = require('path');
    
    // Prepare source input
    
    // Helper function to read all Solidity files recursively
    function readSolidityFiles(dir, basePath = '') {
      const result = {};
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const relativePath = path.join(basePath, file).replace(/\\/g, '/');
        
        if (fs.statSync(fullPath).isDirectory()) {
          // Recursively read subdirectories
          const nestedFiles = readSolidityFiles(fullPath, relativePath);
          Object.assign(result, nestedFiles);
        } else if (file.endsWith('.sol')) {
          // Read Solidity files
          result[relativePath] = {
            content: fs.readFileSync(fullPath, 'utf8')
          };
        }
      });
      
      return result;
    }
    
    // Build sources object with the main contract
    const sources = {
      'contract.sol': {
        content: transformedCode
      }
    };
    
    // Add all local contracts from the contracts directory
    const contractsDir = path.join(__dirname, 'contracts');
    if (fs.existsSync(contractsDir)) {
      // Read and add core contracts directly (no subdirectory)
      const coreContracts = ['Ownable.sol', 'ReentrancyGuard.sol', 'Pausable.sol'];
      coreContracts.forEach(contractName => {
        const contractPath = path.join(contractsDir, contractName);
        if (fs.existsSync(contractPath)) {
          console.log(`Adding core contract: ${contractName}`);
          // Add both with path and just the name
          sources[`contracts/${contractName}`] = { 
            content: fs.readFileSync(contractPath, 'utf8')
          };
          sources[contractName] = { 
            content: fs.readFileSync(contractPath, 'utf8')
          };
        }
      });
      
      // Then add all contracts from the directory structure
      const contractSources = readSolidityFiles(contractsDir);
      Object.assign(sources, contractSources);
      
      // Log loaded sources for debugging
      console.log('Loaded sources:');
      Object.keys(sources).forEach(key => console.log(`- ${key}`));
    }
    
    // Create import resolver function
    const findImports = (importPath) => {
      console.log(`Resolving import: ${importPath}`);
      
      // Check if the import is in our sources directly
      if (sources[importPath]) {
        console.log(`Found in sources directly: ${importPath}`);
        return { contents: sources[importPath].content };
      }
      
      // For imports with "./", check if they are in the contracts directory
      if (importPath.startsWith('./')) {
        const contractName = importPath.substring(2);
        const contractPath = `contracts/${contractName}`;
        
        if (sources[contractPath]) {
          console.log(`Found in contracts directory: ${contractPath}`);
          return { contents: sources[contractPath].content };
        }
      }
      
      // Check if the import is for one of our core contracts
      const coreContracts = ['Ownable.sol', 'ReentrancyGuard.sol', 'Pausable.sol'];
      if (coreContracts.includes(importPath)) {
        const contractPath = `contracts/${importPath}`;
        if (sources[contractPath]) {
          console.log(`Found core contract: ${contractPath}`);
          return { contents: sources[contractPath].content };
        }
      }
      
      // Check if the import path is relative to the current directory
      const resolvedPath = path.resolve(__dirname, importPath);
      if (fs.existsSync(resolvedPath)) {
        console.log(`Found at resolved path: ${resolvedPath}`);
        return { contents: fs.readFileSync(resolvedPath, 'utf8') };
      }
      
      // Handle imports with ./ or ../
      for (const [sourcePath, sourceContent] of Object.entries(sources)) {
        const sourceDir = path.dirname(sourcePath);
        const resolvedImportPath = path.join(sourceDir, importPath).replace(/\\/g, '/');
        
        if (sources[resolvedImportPath]) {
          console.log(`Found using source directory resolution: ${resolvedImportPath}`);
          return { contents: sources[resolvedImportPath].content };
        }
      }
      
      // Last resort: try directly in the contracts directory
      try {
        const contractsDir = path.join(__dirname, 'contracts');
        const directPath = path.join(contractsDir, importPath);
        if (fs.existsSync(directPath)) {
          console.log(`Found directly in contracts directory: ${directPath}`);
          return { contents: fs.readFileSync(directPath, 'utf8') };
        }
      } catch (err) {
        console.error(`Error checking direct path: ${err.message}`);
      }
      
      console.error(`Import not found: ${importPath}`);
      return { error: `File not found: ${importPath}` };
    };
    
    // Setup compiler input
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: transformedCode
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    };

    // Compile the contract with import callback
    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

    // Check for errors
    if (output.errors) {
      const errors = output.errors.filter(error => error.severity === 'error');
      if (errors.length > 0) {
        throw new Error(
          `Compilation Error: ${errors.map(e => e.formattedMessage).join('\n')}`
        );
      }
    }

    // Get the contract name - this assumes there's only one contract in the source
    const contractName = Object.keys(output.contracts['contract.sol'])[0];
    const contract = output.contracts['contract.sol'][contractName];

    // Return the ABI and bytecode
    return {
      abi: contract.abi,
      bytecode: '0x' + contract.evm.bytecode.object
    };
  } catch (error) {
    console.error('Contract compilation failed:', error);
    throw error;
  }
}

module.exports = { compileContract, cleanSolidityCode, transformImports };