# Gemini Smart Contract Prompt Engineering Guide

This guide provides best practices for crafting effective prompts when asking Gemini to generate smart contracts for Avalanche.

## Why Prompt Engineering Matters

The quality of Gemini's smart contract output depends heavily on how you frame your request. Well-crafted prompts lead to contracts that:

- Have fewer bugs and security issues
- Include necessary imports and inheritance
- Provide better documentation
- Match your specific requirements
- Are more likely to compile without errors

## Prompt Structure Template

Use this template structure for consistent results:

```
Generate a smart contract for [specific purpose] on Avalanche.

Technical requirements:
- Use Solidity ^0.8.0
- [List specific OpenZeppelin contracts needed]
- IMPORTANT: Inline all dependencies directly (do not use import statements)
- [Any specific patterns or standards to follow]

Functional requirements:
- [First key functionality]
- [Second key functionality]
- [Additional requirements]

Security requirements:
- [Security features needed]
- [Access control requirements]
- [Other security considerations]

Documentation requirements:
- Add detailed NatSpec comments
- Document function parameters and return values
- Include usage examples in comments
```

> **CRITICAL**: Always include the "Inline all dependencies directly" requirement to avoid import errors.

## Effective Prompt Strategies

### 1. Be Specific About Contract Type

❌ **Bad**: "Generate an NFT contract"
✅ **Good**: "Generate an ERC721 NFT contract with metadata support and minting functionality"

### 2. Specify Needed OpenZeppelin Contracts AND Request Inlining

❌ **Bad**: "Use OpenZeppelin contracts"
❌ **Bad**: "Import OpenZeppelin's ERC721URIStorage"
✅ **Good**: "Include inline implementations of OpenZeppelin's ERC721URIStorage, Counters utility, Ownable, and ReentrancyGuard contracts"

### 3. Detail Access Control Requirements

❌ **Bad**: "Add access control"
✅ **Good**: "Implement role-based access control with separate roles for admins and minters"

### 4. Request Security Features

❌ **Bad**: "Make it secure"
✅ **Good**: "Include reentrancy protection for all external calls, input validation for all parameters, and events for all state changes"

### 5. Ask for Detailed Comments

❌ **Bad**: "Add comments"
✅ **Good**: "Include NatSpec documentation for all functions, explaining parameters, return values, and potential error conditions"

## Sample Prompts

### Basic ERC20 Token

```
Generate a smart contract for a basic ERC20 token on Avalanche.

Technical requirements:
- Use Solidity ^0.8.0
- CRITICAL: DO NOT use any import statements
- Include simplified inline versions of OpenZeppelin's ERC20, Ownable, and Pausable contracts
- All code must be in a single file with dependencies inlined
- Make it compatible with Avalanche C-Chain

Functional requirements:
- Allow the owner to mint new tokens
- Allow the owner to pause transfers in emergency situations
- Include a mechanism to recover tokens accidentally sent to the contract

Security requirements:
- Use safe math operations
- Implement access control for admin functions
- Add events for all state changes

Documentation requirements:
- Add detailed NatSpec comments
- Document all functions, parameters, and return values
- Include usage examples in comments
```

### NFT Marketplace

```
Generate a smart contract for an NFT marketplace on Avalanche.

Technical requirements:
- Use Solidity ^0.8.0
- CRITICAL: DO NOT use any import statements
- Include simplified inline versions of ReentrancyGuard, Ownable, and ERC721 interface
- All code must be in a single file with dependencies inlined
- Make it compatible with any standard ERC721 NFT

Functional requirements:
- Allow users to list their NFTs for sale with a specified price
- Enable buyers to purchase listed NFTs
- Allow sellers to cancel listings
- Include a marketplace fee mechanism (2.5% fee)
- Support updating listing prices

Security requirements:
- Implement reentrancy protection for all external calls
- Use pull-over-push pattern for payments
- Validate all inputs and ownership before operations
- Add circuit breaker pattern (pause functionality)

Documentation requirements:
- Add detailed NatSpec comments for all functions
- Include error scenarios and how they're handled
- Document events and their parameters
```

### Staking Contract

```
Generate a smart contract for a token staking system on Avalanche.

Technical requirements:
- Use Solidity ^0.8.0
- CRITICAL: DO NOT use any import statements
- Include simplified inline versions of ERC20, ReentrancyGuard, and Pausable contracts
- All code must be in a single file with dependencies inlined
- Make it compatible with Avalanche C-Chain

Functional requirements:
- Allow users to stake ERC20 tokens
- Distribute rewards based on time staked and amount
- Support flexible staking periods (30, 60, 90 days)
- Higher rewards for longer staking periods
- Allow emergency withdrawal with penalty

Security requirements:
- Implement reentrancy protection
- Add timelock for admin functions
- Include comprehensive input validation
- Emit events for all state changes and user actions

Documentation requirements:
- Document reward calculation formula
- Include detailed NatSpec comments
- Add usage examples for different staking scenarios
```

## Troubleshooting Common Issues

If Gemini generates contracts with issues, try these refinements:

1. **Import Errors**: Explicitly instruct Gemini to "DO NOT use import statements" and "INLINE all dependencies directly"
2. **Missing Implementations**: Explicitly request "Include simplified inline versions of any OpenZeppelin contracts needed"
3. **Incomplete Features**: Break down complex features into specific requirements
4. **Poor Documentation**: Specifically request NatSpec comments and examples
5. **Security Issues**: Explicitly mention security patterns to implement
6. **Complex Logic**: Break down complex logic into steps or provide pseudocode

## Gemini Limitations

Be aware of these limitations when working with Gemini-generated contracts:

1. **Complex Inheritance**: Gemini may struggle with deep inheritance hierarchies
2. **Gas Optimization**: Generated contracts may not be fully gas-optimized
3. **Assembly Code**: Gemini avoids generating inline assembly unless specifically requested
4. **Latest Features**: May not use the very latest Solidity features
5. **Contract Size**: May generate contracts that exceed size limits

## Conclusion

By using these prompt engineering techniques, you can significantly improve the quality of smart contracts generated by Gemini. Remember to always review, test, and audit any generated code before deploying it to the Avalanche network.