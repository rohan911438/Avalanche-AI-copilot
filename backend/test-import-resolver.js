// test-import-resolver.js - Test the enhanced import resolver

const fs = require('fs');
const path = require('path');
const { prepareContractForCompilation, getDependencyTree } = require('./importResolver');

// Test with a simple contract
const testSimpleContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleContract is Ownable {
    uint256 private _value;
    
    function setValue(uint256 newValue) public onlyOwner {
        _value = newValue;
    }
    
    function getValue() public view returns (uint256) {
        return _value;
    }
}
`;

// Test with a contract that has nested imports
const testNestedContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NestedContract is Ownable, Pausable {
    uint256 private _value;
    
    function setValue(uint256 newValue) public onlyOwner whenNotPaused {
        _value = newValue;
    }
    
    function getValue() public view returns (uint256) {
        return _value;
    }
    
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
}
`;

// Run tests
console.log('Testing enhanced import resolver...\n');

// Test 1: Simple Contract
console.log('===== TEST 1: Simple Contract =====');
const resolvedSimpleContract = prepareContractForCompilation(testSimpleContract);
console.log('Resolved simple contract length:', resolvedSimpleContract.length);
console.log('Has Context reference:', resolvedSimpleContract.includes('_msgSender()'));
console.log('Has Ownable reference:', resolvedSimpleContract.includes('function owner() public view returns'));
console.log('\n');

// Test 2: Nested Contract
console.log('===== TEST 2: Nested Contract with Transitive Dependencies =====');
const resolvedNestedContract = prepareContractForCompilation(testNestedContract);
console.log('Resolved nested contract length:', resolvedNestedContract.length);
console.log('Has Context reference:', resolvedNestedContract.includes('_msgSender()'));
console.log('Has Ownable reference:', resolvedNestedContract.includes('function owner() public view returns'));
console.log('Has Pausable reference:', resolvedNestedContract.includes('function paused() public view virtual returns'));
console.log('\n');

// Test 3: Get Dependency Tree (for debugging)
console.log('===== TEST 3: Dependency Tree =====');
const dependencyTree = getDependencyTree(testNestedContract);
console.log(JSON.stringify(dependencyTree, null, 2));

// Save the resolved contracts to files for inspection
fs.writeFileSync(
  path.join(__dirname, 'resolved-simple-contract.sol'),
  resolvedSimpleContract,
  'utf8'
);

fs.writeFileSync(
  path.join(__dirname, 'resolved-nested-contract.sol'),
  resolvedNestedContract,
  'utf8'
);

console.log('\nTest completed. Check resolved-*.sol files for results.');