// test-gemini-fixer.js
// Tests the automatic fixing and compilation of Gemini-generated contracts

const { processGeminiContractFile } = require('./gemini-contract-fixer');
const { compileContract } = require('./contractCompiler');
const fs = require('fs');
const path = require('path');

// Path to the sample Gemini contract
const sampleContractPath = path.join(__dirname, 'gemini-sample.sol');
const outputPath = path.join(__dirname, 'gemini-sample.fixed.sol');

try {
  console.log('📝 Starting Gemini contract processing test...');
  
  // Step 1: Process the Gemini contract
  const fixedCode = processGeminiContractFile(sampleContractPath, outputPath);
  
  if (!fixedCode) {
    throw new Error('Failed to process the contract');
  }
  
  console.log('\n--- Fixed Contract Code (Preview) ---\n');
  console.log(fixedCode.substring(0, 500) + '...\n');
  
  // Step 2: Try to compile the fixed contract
  console.log('🔨 Attempting to compile the fixed contract...');
  const compiledContract = compileContract(fixedCode);
  
  // Step 3: Check compilation results
  if (compiledContract && compiledContract.bytecode) {
    console.log('\n✅ SUCCESS! Contract compiled successfully.');
    console.log('ABI:', JSON.stringify(compiledContract.abi).substring(0, 100) + '...');
    console.log('Bytecode (first 50 chars):', compiledContract.bytecode.substring(0, 50) + '...');
    
    // Save compilation result
    fs.writeFileSync(
      path.join(__dirname, 'gemini-compilation-result.json'),
      JSON.stringify(compiledContract, null, 2)
    );
    
    console.log('\nCompilation result saved to gemini-compilation-result.json');
  } else {
    console.log('\n❌ ERROR: Compilation failed or returned empty results.');
  }
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error);
}