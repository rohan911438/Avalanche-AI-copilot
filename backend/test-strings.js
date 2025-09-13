// test-strings.js
// Test script to verify Strings library implementation

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
    console.log('Resolving imports for contract with Strings library...');
    const resolvedCode = prepareContractForCompilation(contractCode);
    
    console.log('\n--- Resolved Contract Code ---\n');
    console.log(resolvedCode);
    
    // Save the resolved code to a file for verification
    fs.writeFileSync(
        path.join(__dirname, 'resolved-strings-contract.sol'),
        resolvedCode
    );
    
    console.log('\nResolved code saved to resolved-strings-contract.sol');
} catch (error) {
    console.error('Error:', error);
}