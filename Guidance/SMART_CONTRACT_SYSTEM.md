# Avalanche Smart Contract Compilation System

This system allows users to compile and deploy smart contracts with automatic dependency resolution.

## Key Features

### Automatic Import Resolution

The system automatically detects import statements in contracts and replaces them with the full implementation of dependencies:

```solidity
// User pastes this code with imports
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MyContract is ReentrancyGuard {
    // Contract implementation
}
```

The system transforms it to:

```solidity
// AUTO-INLINED DEPENDENCIES
contract ReentrancyGuard {
    // Full implementation...
}

// MAIN CONTRACT
contract MyContract is ReentrancyGuard {
    // Contract implementation
}
```

### Benefits

- **No Special Instructions Needed**: Users can paste standard contract code without modification
- **Seamless Experience**: Import resolution happens automatically in the backend
- **Compatible with Common Libraries**: Works with OpenZeppelin contracts and other popular libraries
- **Reliable Compilation**: Eliminates errors related to missing imports

## How It Works

1. **Frontend**: User pastes or writes contract code in the editor
2. **API**: Code is sent to the `/api/compile-contract` endpoint
3. **Transformation**: `contractTransformer.js` processes the code and inlines all dependencies
4. **Compilation**: The transformed code is compiled using `contractCompiler.js`
5. **Result**: The ABI and bytecode are returned to the frontend
6. **Deployment**: The compiled contract can be deployed using `deployContract.js`

## Components

- **`contractTransformer.js`**: Transforms contracts by inlining dependencies
- **`contractCompiler.js`**: Compiles Solidity code to ABI and bytecode
- **`ContractCompiler.jsx`**: React component for the contract editor and compilation UI
- **`contractUtils.js`**: Utility functions for the frontend
- **`deployContract.js`**: Functions for deploying compiled contracts

## Supported Libraries

The system currently inlines the following common dependencies:

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Provides basic access control
- **Pausable**: Allows pausing contract functionality

## Adding New Dependencies

To add support for more libraries, update the `getInlinedDependency` function in `contractTransformer.js`:

```javascript
function getInlinedDependency(importPath) {
  // Add new dependencies here
  const standardLibrary = {
    // Existing dependencies...
    
    // New dependency example:
    '@openzeppelin/contracts/token/ERC20/ERC20.sol': getERC20Code(),
    'ERC20.sol': getERC20Code(),
  };
  
  // Rest of the function...
}

// Add the implementation
function getERC20Code() {
  return `
  contract ERC20 {
    // Full implementation...
  }`;
}
```

## Testing

To test the transformation process:

```
cd backend
node test-transformer.js
```

This will generate:
- `transformed-contract.sol`: The contract with inlined dependencies
- `compilation-result.json`: The ABI and bytecode

## Future Enhancements

- Support for more complex dependencies and inheritance chains
- Custom dependency resolution for project-specific libraries
- Optimization options for compiled contracts
- Testing framework integration