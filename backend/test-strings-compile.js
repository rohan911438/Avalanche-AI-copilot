// test-strings-compile.js
// Test script to verify Strings library compilation

const { compileContract } = require('./contractCompiler');
const { prepareContractForCompilation } = require('./importResolver');
const fs = require('fs');
const path = require('path');

// Define a simple contract that uses the Strings library
const contractCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";

contract TokenWithStrings {
    using Strings for uint256;
    
    function getTokenURI(uint256 tokenId) public pure returns (string memory) {
        return string(abi.encodePacked("https://example.com/token/", tokenId.toString()));
    }
}
`;

try {
    console.log('Preparing contract with Strings library...');
    const resolvedCode = prepareContractForCompilation(contractCode);
    
    console.log('Compiling contract with Strings library...');
    const compilationResult = compileContract(resolvedCode);
    
    console.log('\n--- Compilation Result ---\n');
    console.log('ABI:', JSON.stringify(compilationResult.abi).substring(0, 100) + '...');
    console.log('Bytecode (first 50 chars):', compilationResult.bytecode.substring(0, 50) + '...');
    
    // Save the compilation result to a file for verification
    fs.writeFileSync(
        path.join(__dirname, 'strings-compilation-result.json'),
        JSON.stringify(compilationResult, null, 2)
    );
    
    console.log('\nCompilation successful! Result saved to strings-compilation-result.json');
} catch (error) {
    console.error('Compilation Error:', error);
}