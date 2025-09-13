# Integrating Hardhat with Avalanche Frontend

This document explains how the Hardhat integration works with our Avalanche frontend application.

## Overview

We've replaced the direct `solc.js` compilation with a more robust Hardhat-based compilation process. This provides several benefits:

1. Better dependency management
2. More reliable compilation
3. Testing framework for contracts
4. Deployment script automation
5. Better error reporting

## How It Works

### Backend Changes

1. Added a new `hardhat-project` directory with a complete Hardhat setup
2. Created `hardhatCompiler.js` that interfaces with Hardhat
3. Modified the `/api/deploy/compile` endpoint to use Hardhat instead of direct solc.js
4. Retained backward compatibility with existing code

### Compilation Process

1. Frontend sends contract code to `/api/deploy/compile` endpoint
2. Backend cleans the contract code and prepares it for compilation
3. Contract is saved to the Hardhat project's contracts directory
4. Hardhat compiles the contract and generates artifacts
5. ABI and bytecode are extracted and returned to the frontend
6. Frontend uses the ABI and bytecode for deployment as before

## Using the Hardhat Integration

### For Contract Developers

- Contracts can now use more complex dependency structures
- Full OpenZeppelin integration is supported
- More detailed error messages during compilation
- Tests can be written for contracts

### For Frontend Developers

No changes are required to the frontend code, as the API interface remains the same. The frontend still:

1. Sends contract code to the backend
2. Receives ABI and bytecode
3. Uses ethers.js for deployment

## Testing

To test the Hardhat integration:

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. Start the frontend:
   ```
   cd avalanche-frontend
   npm run dev
   ```

3. Use the Contract Compiler component as before

## Deployment Scripts

For automated deployments, you can use the Hardhat scripts:

```bash
cd hardhat-project
npm run deploy:fuji
```

## Future Improvements

1. Add support for contract verification on block explorers
2. Integrate Hardhat tasks with the frontend
3. Support for contract upgrades
4. Add more comprehensive tests
5. Support for contract libraries