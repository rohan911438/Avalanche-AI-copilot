# For Gemini: Avalanche Contract Generation Template

When generating Solidity contracts for the Avalanche project, please use this template approach:

1. Identify all contract dependencies
2. Include all dependencies inline in the same file (no imports)
3. Use proper inheritance patterns

## Example Template:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// [DEPENDENCY 1 NAME]
abstract contract [Dependency1] {
    // Full implementation here
    // ...
}

// [DEPENDENCY 2 NAME]
abstract contract [Dependency2] {
    // Full implementation here
    // ...
}

// Main Contract
contract [MainContractName] is [Dependency1], [Dependency2] {
    // Main contract implementation
    // ...
}
```

IMPORTANT: DO NOT use import statements (e.g., `import "./Contract.sol";`). The compiler doesn't support file imports.

Thank you for generating self-contained, import-free contracts!