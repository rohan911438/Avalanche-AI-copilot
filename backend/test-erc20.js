// Test script to verify contract import handling
const { transformContractCode } = require('./contractTransformer');

const testContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Import OpenZeppelin's ERC20 contract (replace with actual version if needed)
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MYT") {
        // Mint initial supply (adjust as needed, consider security implications of minting large amounts directly)
        _mint(msg.sender, 1000 * 10**18); // 1000 tokens with 18 decimals
    }

    //Example of a function with access control - prevents accidental minting from external calls.
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    //Example of a function that prevents reentrancy
    uint256 private _unlocked = 1;
    modifier noReentrant() {
        require(_unlocked == 1, "Reentrant call");
        _unlocked = 0;
        _;
        _unlocked = 1;
    }
    
    function transferWithRestriction(address recipient, uint256 amount) public noReentrant returns (bool){
        require(amount <= balanceOf(msg.sender), "Insufficient balance");
        return transfer(recipient, amount);
    }
}
`;

console.log('Testing contract transformer with ERC20 import...');
try {
    const transformedCode = transformContractCode(testContract);
    console.log('Transformation successful!');
    console.log('\nTransformed code:');
    console.log(transformedCode);
    
    if (transformedCode.includes('contract ERC20')) {
        console.log('\n✅ ERC20 contract was successfully inlined');
    } else {
        console.log('\n❌ Failed to inline ERC20 contract');
    }
} catch (error) {
    console.error('Error during transformation:', error);
}