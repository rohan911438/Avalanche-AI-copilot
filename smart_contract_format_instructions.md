# Smart Contract Format Instructions for AI Assistants

When generating Solidity smart contracts for the Avalanche project, please follow these guidelines to ensure proper compilation in our web application:

## ✅ DO: Generate Inline Contracts

Always provide complete, self-contained smart contracts with all dependencies inlined directly in the same file. Do not use external imports.

### Example of CORRECT format:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Inlined Dependency Contract A
abstract contract DependencyA {
    // Implementation of DependencyA
    function dependencyAFunction() internal pure returns (uint256) {
        return 100;
    }
}

// Inlined Dependency Contract B
abstract contract DependencyB {
    // Implementation of DependencyB
    function dependencyBFunction() internal pure returns (uint256) {
        return 200;
    }
}

// Main Contract
contract MainContract is DependencyA, DependencyB {
    uint256 private value;
    
    function setValue(uint256 newValue) external {
        value = newValue;
    }
    
    function getValue() external view returns (uint256) {
        return value;
    }
    
    function getDependencyValues() external pure returns (uint256, uint256) {
        return (dependencyAFunction(), dependencyBFunction());
    }
}
```

## ❌ DON'T: Use Import Statements

Our web compiler does not support file import callbacks. Avoid using import statements.

### Example of INCORRECT format:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DependencyA.sol";
import "./DependencyB.sol";

contract MainContract is DependencyA, DependencyB {
    // Implementation
}
```

## Important Notes

1. Always include ALL necessary contract dependencies directly in the same file
2. Use appropriate inheritance patterns with the inlined dependencies
3. Make sure constructor calls are properly chained if needed
4. When modifying existing contracts, convert any import statements to inline dependencies
5. For complex contracts with many dependencies, you may need to simplify or modularize the design

By following these guidelines, your generated contracts will compile successfully in our web application without any import-related errors.