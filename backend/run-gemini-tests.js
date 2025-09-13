// run-gemini-tests.js
// Script to test the Gemini contract processor with various test cases

const fs = require('fs');
const path = require('path');
const chalk = require('chalk'); // For colorful console output
const { 
  validNFTContract,
  contractWithMissingImports,
  contractWithoutLicenseOrPragma,
  complexMarketplaceContract 
} = require('./gemini-test-samples');
const { fixGeminiContract } = require('./gemini-contract-fixer');
const { compileContractWithHardhat } = require('./hardhatCompiler');

// Create test output directory if it doesn't exist
const testOutputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(testOutputDir)) {
  fs.mkdirSync(testOutputDir);
}

// Helper function to save a file
function saveFile(filename, content) {
  const filePath = path.join(testOutputDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Helper function to process a test case
async function processTestCase(testName, rawContract) {
  console.log(chalk.cyan(`\n=== Testing: ${testName} ===`));
  
  // Save the original contract
  const originalPath = saveFile(`${testName}-original.sol`, rawContract);
  console.log(`Original contract saved to: ${originalPath}`);
  
  // Fix the contract
  console.log(chalk.yellow('Fixing contract...'));
  const fixedCode = fixGeminiContract(rawContract);
  
  // Save the fixed contract
  const fixedPath = saveFile(`${testName}-fixed.sol`, fixedCode);
  console.log(`Fixed contract saved to: ${fixedPath}`);
  
  // Compile the fixed contract
  console.log(chalk.yellow('Compiling fixed contract...'));
  try {
    const compilationResult = await compileContractWithHardhat(fixedCode);
    
    if (compilationResult.success) {
      console.log(chalk.green('✅ Compilation successful!'));
      
      // Save the ABI
      const abiPath = saveFile(`${testName}-abi.json`, JSON.stringify(compilationResult.abi, null, 2));
      console.log(`ABI saved to: ${abiPath}`);
      
      return { success: true, fixedCode, abi: compilationResult.abi };
    } else {
      console.log(chalk.red('❌ Compilation failed:'));
      console.log(compilationResult.error);
      
      return { success: false, fixedCode, error: compilationResult.error };
    }
  } catch (error) {
    console.log(chalk.red('❌ Compilation error:'));
    console.log(error.message);
    
    return { success: false, fixedCode, error: error.message };
  }
}

// Main function to run all tests
async function runTests() {
  console.log(chalk.blue('🚀 Starting Gemini Contract Processor Tests'));
  
  const results = {
    total: 4,
    passed: 0,
    failed: 0,
    details: {}
  };
  
  // Test 1: Valid NFT Contract
  results.details.validNFT = await processTestCase('valid-nft', validNFTContract);
  if (results.details.validNFT.success) results.passed++;
  else results.failed++;
  
  // Test 2: Contract with Missing Imports
  results.details.missingImports = await processTestCase('missing-imports', contractWithMissingImports);
  if (results.details.missingImports.success) results.passed++;
  else results.failed++;
  
  // Test 3: Contract without License or Pragma
  results.details.noLicensePragma = await processTestCase('no-license-pragma', contractWithoutLicenseOrPragma);
  if (results.details.noLicensePragma.success) results.passed++;
  else results.failed++;
  
  // Test 4: Complex Marketplace Contract
  results.details.complexMarketplace = await processTestCase('complex-marketplace', complexMarketplaceContract);
  if (results.details.complexMarketplace.success) results.passed++;
  else results.failed++;
  
  // Print summary
  console.log(chalk.blue('\n=== Test Summary ==='));
  console.log(`Total Tests: ${results.total}`);
  console.log(chalk.green(`Passed: ${results.passed}`));
  console.log(chalk.red(`Failed: ${results.failed}`));
  
  // Save the test summary
  const summaryPath = saveFile('test-summary.json', JSON.stringify(results, null, 2));
  console.log(`\nTest summary saved to: ${summaryPath}`);
  
  return results;
}

// Check if this script is being run directly
if (require.main === module) {
  // Install chalk if not already installed
  try {
    require.resolve('chalk');
  } catch (e) {
    console.log('Installing chalk package for colorful output...');
    require('child_process').execSync('npm install chalk', { stdio: 'inherit' });
  }
  
  runTests()
    .then(() => {
      console.log('All tests completed.');
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}

module.exports = { runTests };