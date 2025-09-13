// Direct test script for Hardhat compilation
// Bypasses the API and directly calls the hardhat compiler

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the test contract
const contractPath = path.join(__dirname, '..', 'hardhat-project', 'contracts', 'SimpleTest.sol');
const contractCode = fs.readFileSync(contractPath, 'utf8');

console.log('Testing direct Hardhat compilation...');
console.log('Contract path:', contractPath);
console.log('Contract length:', contractCode.length);

// Use the hardhatCompiler module directly
const hardhatCompiler = require('./hardhatCompiler');

// Call the compiler function directly
async function testDirectCompilation() {
  try {
    console.log('Compiling SimpleTest.sol directly with Hardhat...');
    
    // Call the hardhat compiler function directly
    const compilationResult = await hardhatCompiler.compileContractWithHardhat(
      contractCode,
      'SimpleTest.sol'
    );
    
    if (compilationResult.success) {
      console.log('Compilation successful!');
      console.log('Contract name:', compilationResult.contractName);
      console.log('ABI length:', compilationResult.abi?.length || 'Not available');
      console.log('Bytecode available:', !!compilationResult.bytecode);
    } else {
      console.error('Compilation failed:', compilationResult.error);
    }
    
  } catch (error) {
    console.error('Test failed with exception:', error.message);
    console.error(error.stack);
  }
}

testDirectCompilation();