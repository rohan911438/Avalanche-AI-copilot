# Avalanche Smart Contract Auto-Inlining System

This feature automatically transforms any contract with import statements into a self-contained contract with all dependencies inlined.

## How It Works

When a contract is submitted for compilation through the frontend:

1. The system detects all import statements
2. It replaces each import with the full implementation of the dependency
3. The resulting contract is self-contained with no external dependencies
4. The transformed contract is compiled and deployed

## Benefits

- Users can paste contract code with standard imports - the system handles the rest
- No need to instruct users to inline dependencies manually
- Supports OpenZeppelin contracts and other common libraries
- Eliminates compilation errors due to missing imports

## Supported Libraries

The system currently supports automatic inlining for:

- ReentrancyGuard
- Ownable
- Pausable
- And many more...

## Implementation Details

The transformation happens in `contractTransformer.js` which:

1. Parses the original contract to extract imports
2. Maintains a library of common contract implementations
3. Assembles a new contract with all dependencies inlined
4. Preserves the original license and pragma directives

## API Usage

The compile-contract API endpoint automatically transforms any contract code before compilation:

```javascript
// Example API call
fetch('/api/compile-contract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contractCode: contractWithImports
  }),
})
.then(response => response.json())
.then(data => {
  // data.abi - The contract ABI
  // data.bytecode - The contract bytecode
  // data.transformedCode - The inlined version of the contract
});
```

## Testing

Use `test-transformer.js` to verify the transformation process works correctly.