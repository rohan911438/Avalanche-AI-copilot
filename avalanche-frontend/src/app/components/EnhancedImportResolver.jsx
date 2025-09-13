// Enhanced import resolver component with OpenZeppelin contracts support
import { useState, useEffect } from 'react';

// OpenZeppelin base contracts used in the project
const OWNABLE_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * \`onlyOwner\` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (\`newOwner\`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (\`newOwner\`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}`;

const REENTRANCY_GUARD_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a \`nonReentrant\` function from another \`nonReentrant\`
     * function is not supported. It is possible to prevent this from happening
     * by making the \`nonReentrant\` function external, and making it call a
     * \`private\` function that does the actual work.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }
}`;

const PAUSABLE_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

abstract contract Pausable is Context {
    /**
     * @dev Emitted when the pause is triggered by \`account\`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by \`account\`.
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        require(!paused(), "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        require(paused(), "Pausable: not paused");
        _;
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}`;

export default function EnhancedImportResolver({ code, onResolvedCode }) {
  const [resolvedCode, setResolvedCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const resolveImports = () => {
      setIsProcessing(true);

      // Start with the original code
      let processedCode = code;

      if (!processedCode) {
        setResolvedCode('');
        setIsProcessing(false);
        return;
      }

      // Define regex patterns for imports
      const ownablePattern = /import\s+["']\.\/Ownable\.sol["'];/;
      const reentrancyGuardPattern = /import\s+["']\.\/ReentrancyGuard\.sol["'];/;
      const pausablePattern = /import\s+["']\.\/Pausable\.sol["'];/;

      // Check if there are any imports to resolve
      const hasImports = 
        ownablePattern.test(processedCode) || 
        reentrancyGuardPattern.test(processedCode) || 
        pausablePattern.test(processedCode);

      if (!hasImports) {
        // No imports to resolve
        setResolvedCode(processedCode);
        setIsProcessing(false);
        return;
      }

      // Extract the pragma statement
      const pragmaMatch = processedCode.match(/pragma solidity [^;]+;/);
      const pragmaStatement = pragmaMatch ? pragmaMatch[0] : 'pragma solidity ^0.8.0;';
      
      // Remove all imports and replace them with comments
      processedCode = processedCode
        .replace(ownablePattern, '// Ownable implementation inlined')
        .replace(reentrancyGuardPattern, '// ReentrancyGuard implementation inlined')
        .replace(pausablePattern, '// Pausable implementation inlined');

      // Generate the inlined content
      let inlinedContent = '// INLINED OPENZEPPELIN CONTRACTS\n\n';
      
      // Add Context only once (it's used by both Ownable and Pausable)
      let contextAdded = false;

      if (ownablePattern.test(code)) {
        // Add Ownable implementation (already contains Context)
        inlinedContent += OWNABLE_CONTRACT + '\n\n';
        contextAdded = true;
      }
      
      if (reentrancyGuardPattern.test(code)) {
        // Add ReentrancyGuard implementation
        inlinedContent += REENTRANCY_GUARD_CONTRACT + '\n\n';
      }
      
      if (pausablePattern.test(code)) {
        if (contextAdded) {
          // If we already added Context via Ownable, remove it from Pausable
          const pausableWithoutContext = PAUSABLE_CONTRACT.replace(/abstract contract Context[\s\S]*?}/, '');
          inlinedContent += pausableWithoutContext + '\n\n';
        } else {
          // If Context hasn't been added yet, include it with Pausable
          inlinedContent += PAUSABLE_CONTRACT + '\n\n';
        }
      }
      
      // Find the position to insert the inlined contracts (after SPDX and pragma)
      const spdxMatch = processedCode.match(/\/\/ SPDX-License-Identifier:[^\n]+\n/);
      const spdxPos = spdxMatch ? processedCode.indexOf(spdxMatch[0]) + spdxMatch[0].length : 0;
      
      const pragmaPos = processedCode.indexOf(pragmaStatement);
      const insertPos = pragmaPos + pragmaStatement.length;
      
      // Insert the inlined contracts after the pragma
      const finalCode = 
        processedCode.substring(0, insertPos) + 
        '\n\n' + 
        inlinedContent + 
        '// YOUR CONTRACT\n' + 
        processedCode.substring(insertPos);
      
      setResolvedCode(finalCode);
      setIsProcessing(false);
      
      // Call the callback with the resolved code
      if (onResolvedCode) {
        onResolvedCode(finalCode);
      }
    };

    resolveImports();
  }, [code, onResolvedCode]);

  return (
    <div>
      {isProcessing ? (
        <div className="flex justify-center p-4">
          <span className="animate-pulse">Resolving OpenZeppelin imports...</span>
        </div>
      ) : resolvedCode ? (
        <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto border border-gray-200">
          <code>{resolvedCode}</code>
        </pre>
      ) : (
        <div className="flex justify-center p-4">
          <span>No code to resolve</span>
        </div>
      )}
    </div>
  );
}