'use client';
import { useState } from 'react';
import ContractDisplay from '../components/ContractDisplay';
import Navigation from '../components/Navigation';

export default function ContractTesterPage() {
  const [contractCode, setContractCode] = useState(`// SPDX-License-Identifier: MIT
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
}`);

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Contract Tester</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Paste Your Contract Code</h2>
        <textarea
          value={contractCode}
          onChange={(e) => setContractCode(e.target.value)}
          className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm"
          placeholder="Paste your Solidity contract code here..."
        ></textarea>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <ContractDisplay contractCode={contractCode} />
      </div>
    </div>
    </>
  );
}