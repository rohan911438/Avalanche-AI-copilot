# Hardhat Integration for Avalanche Smart Contracts

This directory contains a Hardhat project for compiling and deploying smart contracts to the Avalanche network.

## Features

- Solidity compilation using Hardhat
- Testing framework for smart contracts
- Deployment scripts for Avalanche Mainnet and Fuji Testnet
- Integration with frontend contract deployment

## Directory Structure

- **contracts/** - Smart contract source files
- **scripts/** - Deployment and other scripts
- **test/** - Contract test files
- **artifacts/** - Compiled contract artifacts (generated)
- **cache/** - Hardhat cache (generated)

## Commands

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Fuji Testnet
npm run deploy:fuji

# Deploy IPL Betting Contract to Fuji Testnet
npm run deploy-betting:fuji

# Deploy to Avalanche Mainnet (use with caution)
npm run deploy:mainnet

# Clean artifacts and cache
npm run clean
```

## Environment Variables

Create a `.env` file in this directory with the following variables:

```
PRIVATE_KEY=your_private_key_here
```

## Integration with Backend

The Hardhat compiler is integrated with the backend through `hardhatCompiler.js`, which provides a bridge between the Express.js API and Hardhat's compilation functionality.

## Benefits Over Direct Solc.js

- Better dependency management with npm
- Advanced compilation optimizations
- Built-in testing framework
- Easier debugging of contracts
- Support for complex import structures
- TypeScript support for scripts
- Deployment workflow management