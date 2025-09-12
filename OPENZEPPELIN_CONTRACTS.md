# Using OpenZeppelin Contracts in Avalanche Copilot

This document explains how OpenZeppelin contracts are used and imported in the Avalanche Copilot project.

## Overview

The Avalanche Copilot uses a local vendor approach for OpenZeppelin contracts. Instead of resolving npm package imports or GitHub URLs at compilation time, we store the required OpenZeppelin contracts locally in our project and use relative imports.

## Available Contracts

The following OpenZeppelin contracts are available for use:

1. `Ownable.sol` - Basic access control mechanism
2. `ReentrancyGuard.sol` - Prevention of reentrancy attacks
3. `Pausable.sol` - Emergency stop mechanism

## Directory Structure

```
backend/
  ├── contracts/
  │   ├── Ownable.sol
  │   ├── ReentrancyGuard.sol
  │   ├── Pausable.sol
  │   ├── utils/
  │   │   └── Context.sol
  │   └── [Your generated contracts]
  ├── contractCompiler.js
  └── server.js
```

## How to Use

When generating or writing a contract that needs OpenZeppelin functionality, use the following import syntax:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./ReentrancyGuard.sol";
import "./Pausable.sol";

contract MyContract is Ownable, ReentrancyGuard, Pausable {
    // Your contract code here
}
```

## Why This Approach?

The solc.js compiler used in our backend service doesn't natively support npm package imports or GitHub URL imports. By vendoring the contracts locally, we ensure:

1. Reliable compilation without external dependencies
2. Consistent versioning of OpenZeppelin contracts
3. Faster compilation times without network requests
4. Better offline functionality

## Adding More Contracts

If you need additional OpenZeppelin contracts:

1. Download the contract from [OpenZeppelin's GitHub repository](https://github.com/OpenZeppelin/openzeppelin-contracts)
2. Place it in the appropriate directory under `backend/contracts/`
3. Update any imports within the contract to use relative paths
4. Update the contract generation system prompt to include the new contract

## Limitations

Current limitations of this approach:

1. Only a subset of OpenZeppelin contracts are available
2. Manual updates required when new OpenZeppelin versions are released
3. More complex contract hierarchies might require additional imports