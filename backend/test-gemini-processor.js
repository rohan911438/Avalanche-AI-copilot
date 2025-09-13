// test-gemini-processor.js
// Simple test script to verify the Gemini contract processor functionality

const fs = require('fs');
const path = require('path');
const { fixGeminiContract } = require('./gemini-contract-fixer');

// Sample contract with common Gemini issues
const testContract = `
\`\`\`solidity
contract SimpleNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    constructor() ERC721("SimpleNFT", "SNFT") {
    }
    
    function mint(address to, string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        return newTokenId;
    }
}
\`\`\`
`;

// Create the test output directory if it doesn't exist
const testOutputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(testOutputDir)) {
  fs.mkdirSync(testOutputDir);
}

// Write the test contract to a file
const testContractPath = path.join(testOutputDir, 'test-gemini-contract.sol');
fs.writeFileSync(testContractPath, testContract);

console.log('Test contract written to:', testContractPath);

// Process the contract
console.log('Processing contract with Gemini fixer...');
const fixedCode = fixGeminiContract(testContract);

// Write the processed contract to a file
const fixedContractPath = path.join(testOutputDir, 'fixed-gemini-contract.sol');
fs.writeFileSync(fixedContractPath, fixedCode);

console.log('Fixed contract written to:', fixedContractPath);
console.log('\nOriginal contract:');
console.log('='.repeat(80));
console.log(testContract);
console.log('='.repeat(80));

console.log('\nFixed contract:');
console.log('='.repeat(80));
console.log(fixedCode);
console.log('='.repeat(80));

console.log('\nSummary of fixes:');
console.log('- Added SPDX license:', fixedCode.includes('SPDX-License-Identifier'));
console.log('- Added pragma solidity:', fixedCode.includes('pragma solidity'));
console.log('- Added ERC721 import:', fixedCode.includes('import "@openzeppelin/contracts/token/ERC721/ERC721.sol"'));
console.log('- Added Counters import:', fixedCode.includes('import "@openzeppelin/contracts/utils/Counters.sol"'));
console.log('- Removed code block markers:', !fixedCode.includes('```'));

console.log('\nTest completed. Check the output files in the test-output directory.');