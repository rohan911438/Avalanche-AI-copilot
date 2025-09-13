# ERC721 NFT Contract With Inline Dependencies

This document provides a specific example of properly prompting Gemini to generate an NFT contract with all dependencies properly inlined.

## Correct Prompt Example

```
Generate an ERC721 NFT contract with metadata support and minting functionality for Avalanche.

Technical requirements:
- Use Solidity ^0.8.0
- CRITICAL: DO NOT use any import statements
- Include simplified inline implementations of all necessary contracts (Context, Strings, ERC721 base, etc.)
- All dependencies must be directly inlined in the same file
- Support storing and retrieving metadata URIs for each token
- Include pausable functionality to stop minting in emergencies
- Add reentrancy protection for any external calls

Functional requirements:
- Allow owner to mint new NFTs with specific metadata URIs
- Provide a way to set and update the base URI
- Support standard ERC721 transfer and approval functions
- Include a function to withdraw any ETH sent to the contract

Security requirements:
- Only owner can mint new tokens
- Implement proper access control for admin functions
- Include checks for zero address in critical functions
- Add reentrancy protection for any functions that transfer tokens or ETH
- Add circuit breaker pattern (pause/unpause)

Documentation requirements:
- Add NatSpec comments for all public and external functions
- Include usage examples in comments
- Document all parameters, return values, and events
```

## Sample Response Structure

When Gemini responds correctly to this prompt, it should:

1. Include simplified implementations of base contracts:
   - Context (for msg.sender access)
   - Strings (for uint256 to string conversion)
   - Various interfaces and base implementations

2. Define the contracts in hierarchical order:
   - Base utility contracts first
   - Main NFT contract last, inheriting from the necessary contracts

3. NOT use any import statements

4. Include all the requested functionality and security features

## Troubleshooting

If the contract still has issues:

1. If Gemini still uses imports, include an even more explicit statement: "ABSOLUTELY NO IMPORTS. The compiler does not support import resolution."

2. If dependencies are missing, try: "Include ALL dependencies directly in the file, including Context, Strings, and full ERC721 implementation."

3. If the contract is too large, try: "Create a simplified version with minimal but functional implementation of ERC721 standards."