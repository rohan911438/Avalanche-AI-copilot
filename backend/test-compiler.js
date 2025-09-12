// test-compiler.js
// Test script to verify contract compilation with local OpenZeppelin imports

const fs = require('fs');
const path = require('path');
const { compileContract, cleanSolidityCode } = require('./contractCompiler');

// Read the example contract
const contractPath = path.join(__dirname, 'contracts', 'SimpleStorageWithOZ.sol');
const contractCode = fs.readFileSync(contractPath, 'utf8');

// Clean and compile the contract
console.log('Compiling contract...');
try {
  const cleanedCode = cleanSolidityCode(contractCode);
  const compiledContract = compileContract(cleanedCode);
  
  console.log('✅ Contract compilation successful!');
  console.log('Contract ABI:', JSON.stringify(compiledContract.abi).substring(0, 100) + '...');
  console.log('Bytecode (first 50 chars):', compiledContract.bytecode.substring(0, 50) + '...');
  
  // Save the compiled output for verification
  fs.writeFileSync(
    path.join(__dirname, 'compiled-output.json'), 
    JSON.stringify(compiledContract, null, 2)
  );
  console.log('Compiled output saved to compiled-output.json');
  
} catch (error) {
  console.error('❌ Contract compilation failed:');
  console.error(error);
}