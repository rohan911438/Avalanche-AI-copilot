/**
 * Advanced import resolver that handles nested dependencies and avoids circular imports
 * Enhanced version with dependency tree tracking and caching
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  prepareContractForCompilation,
  resolveImports, // Export for testing purposes
  getDependencyTree // Export for testing purposes
};

/**
 * Main function to prepare contract for compilation by resolving all imports
 * @param {string} contractCode - The contract code with imports
 * @returns {string} - Self-contained contract with all dependencies inlined
 */
function prepareContractForCompilation(contractCode) {
  // Extract license and pragma
  const licenseMatch = contractCode.match(/\/\/ SPDX-License-Identifier: ([^\n]+)/);
  const pragmaMatch = contractCode.match(/pragma solidity ([^;]+);/);
  
  const license = licenseMatch ? licenseMatch[0] : '// SPDX-License-Identifier: MIT';
  const pragma = pragmaMatch ? pragmaMatch[0] : 'pragma solidity ^0.8.0;';
  
  // Track already resolved dependencies to avoid circular imports
  const dependencyTree = new Set();
  
  // Cache resolved imports to avoid duplicated work
  const resolvedImportsCache = new Map();
  
  // Resolve all imports recursively
  const { resolvedCode, dependencies } = resolveImports(contractCode, dependencyTree, resolvedImportsCache);
  
  // If no imports were found, return the original code
  if (dependencies.size === 0) {
    return contractCode;
  }
  
  // Build the final contract with all dependencies properly inlined
  return buildFinalContract(resolvedCode, dependencies, license, pragma);
}

/**
 * Resolves all imports in a contract recursively
 * @param {string} contractCode - The contract code with imports
 * @param {Set} dependencyTree - Set of already resolved dependencies to avoid circular imports
 * @param {Map} resolvedImportsCache - Cache of already resolved imports
 * @returns {Object} - The resolved code and set of dependencies
 */
function resolveImports(contractCode, dependencyTree = new Set(), resolvedImportsCache = new Map()) {
  // Extract all import statements
  const importRegex = /import\s+["']([^"']+)["'];/g;
  let match;
  const imports = [];
  
  while ((match = importRegex.exec(contractCode)) !== null) {
    imports.push(match[1]);
  }
  
  // If no imports, return the original code
  if (imports.length === 0) {
    return { resolvedCode: contractCode, dependencies: new Set() };
  }
  
  // Process each import
  const dependencies = new Set();
  let processedCode = contractCode;
  
  for (const importPath of imports) {
    // Skip if already in dependency tree (avoid circular imports)
    if (dependencyTree.has(importPath)) {
      console.log(`Skipping circular import: ${importPath}`);
      continue;
    }
    
    // Get the dependency code
    let dependencyCode;
    
    // Check if we've already resolved this import
    if (resolvedImportsCache.has(importPath)) {
      dependencyCode = resolvedImportsCache.get(importPath);
    } else {
      dependencyCode = getDependencyCode(importPath);
      
      // If found, process its own imports recursively
      if (dependencyCode) {
        // Add to dependency tree to avoid circular imports
        dependencyTree.add(importPath);
        
        // Recursively resolve imports in the dependency
        const { resolvedCode, dependencies: nestedDeps } = resolveImports(
          dependencyCode, 
          new Set([...dependencyTree]), // Create a new copy of the dependency tree
          resolvedImportsCache
        );
        
        // Add nested dependencies to our dependencies set
        nestedDeps.forEach(dep => dependencies.add(dep));
        
        // Update dependency code with resolved version
        dependencyCode = resolvedCode;
        
        // Cache the resolved import
        resolvedImportsCache.set(importPath, dependencyCode);
      }
    }
    
    // Add to dependencies if found
    if (dependencyCode) {
      dependencies.add({
        path: importPath,
        code: dependencyCode
      });
    } else {
      console.warn(`Could not resolve import: ${importPath}`);
    }
  }
  
  // Remove all import statements
  processedCode = processedCode.replace(importRegex, '');
  
  return { resolvedCode: processedCode, dependencies };
}

/**
 * Get the dependency tree for visualization and debugging
 * @param {string} contractCode - The contract code with imports
 * @returns {Object} - The dependency tree
 */
function getDependencyTree(contractCode) {
  const tree = {};
  const processedImports = new Set();
  
  function buildTree(code, currentPath = 'root') {
    if (processedImports.has(currentPath)) {
      return { [currentPath]: '[Circular Reference]' };
    }
    
    processedImports.add(currentPath);
    
    const importRegex = /import\s+["']([^"']+)["'];/g;
    let match;
    const imports = [];
    
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }
    
    const result = { imports: [] };
    
    for (const importPath of imports) {
      const dependencyCode = getDependencyCode(importPath);
      if (dependencyCode) {
        result.imports.push({
          path: importPath,
          ...buildTree(dependencyCode, importPath)
        });
      } else {
        result.imports.push({
          path: importPath,
          error: 'Not found'
        });
      }
    }
    
    return result;
  }
  
  tree.root = buildTree(contractCode);
  return tree;
}

/**
 * Builds the final contract with all dependencies properly inlined
 * @param {string} mainCode - The main contract code
 * @param {Set} dependencies - Set of dependencies
 * @param {string} license - License statement
 * @param {string} pragma - Pragma statement
 * @returns {string} - The final contract with all dependencies inlined
 */
function buildFinalContract(mainCode, dependencies, license, pragma) {
  // Process dependencies to remove duplicate license and pragma statements
  const processedDeps = Array.from(dependencies).map(dep => {
    let code = dep.code;
    // Remove license and pragma
    code = code.replace(/\/\/ SPDX-License-Identifier: [^\n]+\n/, '');
    code = code.replace(/pragma solidity [^;]+;/, '');
    return `// Inlined from ${dep.path}\n${code.trim()}`;
  });
  
  // Clean main code - remove license and pragma since we'll add them at the top
  let cleanMainCode = mainCode;
  cleanMainCode = cleanMainCode.replace(/\/\/ SPDX-License-Identifier: [^\n]+\n/, '');
  cleanMainCode = cleanMainCode.replace(/pragma solidity [^;]+;/, '');
  
  // Build the final contract
  return `${license}\n${pragma}\n\n// AUTO-INLINED DEPENDENCIES\n\n${processedDeps.join('\n\n')}\n\n// MAIN CONTRACT\n\n${cleanMainCode.trim()}`;
}

/**
 * Get the source code for a dependency
 * @param {string} importPath - The import path
 * @returns {string|null} - The dependency code or null if not found
 */
function getDependencyCode(importPath) {
  // Standard library of inlined dependencies
  const standardLibrary = getStandardLibrary();
  
  // Check standard library first
  for (const [key, value] of Object.entries(standardLibrary)) {
    if (importPath.includes(key) || key.includes(importPath)) {
      return value;
    }
  }
  
  // Try to resolve local file paths
  try {
    // Check in the contracts directory
    const contractsDir = path.join(__dirname, 'contracts');
    
    // Handle different path formats
    let localPath;
    if (importPath.startsWith('./')) {
      // Relative import like ./Context.sol
      localPath = path.join(contractsDir, importPath.substring(2));
    } else if (importPath.startsWith('../')) {
      // Parent directory import like ../utils/Context.sol
      localPath = path.join(contractsDir, '..', importPath.substring(3));
    } else if (importPath.includes('/')) {
      // Path with directories like utils/Context.sol
      localPath = path.join(contractsDir, importPath);
    } else {
      // Just the filename like Context.sol
      localPath = path.join(contractsDir, importPath);
      
      // If not found, also check in subdirectories
      if (!fs.existsSync(localPath)) {
        // Check in utils directory
        const utilsPath = path.join(contractsDir, 'utils', importPath);
        if (fs.existsSync(utilsPath)) {
          localPath = utilsPath;
        }
      }
    }
    
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath, 'utf8');
    }
  } catch (error) {
    console.error(`Error resolving local file: ${error.message}`);
  }
  
  return null;
}

/**
 * Library of common contract dependencies that can be inlined
 * @returns {Object} - Object with import paths as keys and contract code as values
 */
function getStandardLibrary() {
  const dependencies = {};
  
  // Common OpenZeppelin contracts
  dependencies['@openzeppelin/contracts/security/ReentrancyGuard.sol'] = 
  dependencies['ReentrancyGuard.sol'] = 
  dependencies['./ReentrancyGuard.sol'] = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Inlined ReentrancyGuard
contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}`;

  dependencies['@openzeppelin/contracts/access/Ownable.sol'] = 
  dependencies['Ownable.sol'] = 
  dependencies['./Ownable.sol'] = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../utils/Context.sol";

// Inlined Ownable
contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _owner = _msgSender();
        emit OwnershipTransferred(address(0), _owner);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}`;

  dependencies['@openzeppelin/contracts/security/Pausable.sol'] = 
  dependencies['Pausable.sol'] = 
  dependencies['./Pausable.sol'] = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../utils/Context.sol";

// Inlined Pausable
contract Pausable is Context {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    constructor() {
        _paused = false;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
    }

    modifier whenNotPaused() {
        require(!paused(), "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(paused(), "Pausable: not paused");
        _;
    }

    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}`;

  // Add Context dependency - commonly used by OpenZeppelin contracts
  dependencies['@openzeppelin/contracts/utils/Context.sol'] = 
  dependencies['utils/Context.sol'] = 
  dependencies['Context.sol'] = 
  dependencies['./Context.sol'] = 
  dependencies['../utils/Context.sol'] = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Inlined Context
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}`;

  // Add more dependencies as needed
  
  return dependencies;
}