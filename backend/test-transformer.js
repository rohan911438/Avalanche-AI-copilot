// test-transformer.js
// Simple test script to verify the contract transformation

const { transformContractCode } = require('./contractTransformer');
const { compileContract } = require('./contractCompiler');
const fs = require('fs');
const path = require('path');

// Example contract with imports
const contractCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StonePaperScissor is ReentrancyGuard {
    // Enum for the choices
    enum Choice {Stone, Paper, Scissor}

    // Struct to store game data
    struct Game {
        address player1;
        address player2;
        Choice player1Choice;
        Choice player2Choice;
        uint256 betAmount;
        bool gameEnded;
    }

    // Simple function with nonReentrant modifier
    function createGame(uint256 _betAmount) public payable nonReentrant returns (uint256) {
        return 1;
    }
}
`;

try {
    console.log('Transforming contract code...');
    const transformedCode = transformContractCode(contractCode);
    
    console.log('\n--- Transformed Code ---\n');
    console.log(transformedCode);
    
    console.log('\nCompiling transformed code...');
    const result = compileContract(transformedCode);
    console.log('Compilation successful!');
    console.log('Contract ABI:', JSON.stringify(result.abi).substring(0, 100) + '...');
    console.log('Bytecode (first 50 chars):', result.bytecode.substring(0, 50) + '...');
    
    // Save the results to files
    fs.writeFileSync(
        path.join(__dirname, 'transformed-contract.sol'),
        transformedCode
    );
    fs.writeFileSync(
        path.join(__dirname, 'compilation-result.json'),
        JSON.stringify(result, null, 2)
    );
    
    console.log('\nOutput saved to transformed-contract.sol and compilation-result.json');
} catch (error) {
    console.error('Error:', error);
}