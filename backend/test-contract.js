// test-contract.js
// Simple test script to compile a basic contract with local OpenZeppelin imports

const { compileContract } = require('./contractCompiler');
const { prepareContractForCompilation } = require('./importResolver');
const fs = require('fs');
const path = require('path');

// Define a simple contract with imports
const contractCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./Pausable.sol";
import "./ReentrancyGuard.sol";

contract SimpleTest is Ownable, Pausable, ReentrancyGuard {
    uint256 private value;
    
    event ValueChanged(uint256 newValue);
    
    function setValue(uint256 newValue) external onlyOwner {
        value = newValue;
        emit ValueChanged(newValue);
    }
    
    function getValue() external view returns (uint256) {
        return value;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
`;

try {
    console.log('Compiling test contract...');
    // Process the contract to replace imports with inlined dependencies
    const processedCode = prepareContractForCompilation(contractCode);
    const result = compileContract(processedCode);
    console.log('Compilation successful!');
    console.log('Contract ABI:', JSON.stringify(result.abi).substring(0, 100) + '...');
    console.log('Bytecode (first 50 chars):', result.bytecode.substring(0, 50) + '...');
    
    // Save the result to a file
    fs.writeFileSync(
        path.join(__dirname, 'test-output.json'), 
        JSON.stringify(result, null, 2)
    );
    console.log('Output saved to test-output.json');
} catch (error) {
    console.error('Compilation failed:', error);
}