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
  const includedLibraries = new Set(); // Track libraries to avoid duplicates
  
  const processedDeps = [];
  
  for (const dep of Array.from(dependencies)) {
    let code = dep.code;
    // Remove license and pragma
    code = code.replace(/\/\/ SPDX-License-Identifier: [^\n]+\n/, '');
    code = code.replace(/pragma solidity [^;]+;/, '');
    
    // Check if this is a library/contract definition we've already included
    let shouldInclude = true;
    
    // Extract library/contract name
    const libraryMatch = code.match(/\s*(library|contract|abstract contract|interface)\s+([a-zA-Z0-9_]+)/);
    if (libraryMatch) {
      const entityName = libraryMatch[2];
      if (includedLibraries.has(entityName)) {
        console.log(`Skipping duplicate definition of ${entityName}`);
        shouldInclude = false;
      } else {
        includedLibraries.add(entityName);
      }
    }
    
    if (shouldInclude) {
      processedDeps.push(`// Inlined from ${dep.path}\n${code.trim()}`);
    }
  }
  
  // Clean main code - remove license and pragma since we'll add them at the top
  let cleanMainCode = mainCode;
  cleanMainCode = cleanMainCode.replace(/\/\/ SPDX-License-Identifier: [^\n]+\n/, '');
  cleanMainCode = cleanMainCode.replace(/pragma solidity [^;]+;/, '');
  cleanMainCode = cleanMainCode.replace(/import\s+[^;]+;/g, '// Import removed');
  
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

  // Add Strings library - used for uint256 to string conversion
  dependencies['@openzeppelin/contracts/utils/Strings.sol'] = 
  dependencies['utils/Strings.sol'] = 
  dependencies['Strings.sol'] = 
  dependencies['./Strings.sol'] = 
  dependencies['../utils/Strings.sol'] = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Inlined Strings
library Strings {
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";
    uint8 private constant _ADDRESS_LENGTH = 20;

    /**
     * @dev Converts a \`uint256\` to its ASCII \`string\` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Converts a \`uint256\` to its ASCII \`string\` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0x00";
        }
        uint256 temp = value;
        uint256 length = 0;
        while (temp != 0) {
            length++;
            temp >>= 8;
        }
        return toHexString(value, length);
    }

    /**
     * @dev Converts a \`uint256\` to its ASCII \`string\` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

    /**
     * @dev Converts an \`address\` with fixed length of 20 bytes to its not checksummed ASCII \`string\` hexadecimal representation.
     */
    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), _ADDRESS_LENGTH);
    }
}`;

  // Add ERC721 implementation
  dependencies['@openzeppelin/contracts/token/ERC721/ERC721.sol'] = 
  dependencies['ERC721.sol'] = 
  dependencies['./ERC721.sol'] = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../utils/Context.sol";
import "../utils/Strings.sol";

// Simplified ERC721 implementation (inlined)
abstract contract ERC721 is Context {
    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;

    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function balanceOf(address owner) public view virtual returns (uint256) {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }

    function approve(address to, uint256 tokenId) public virtual {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(_msgSender() == owner || isApprovedForAll(owner, _msgSender()),
            "ERC721: approve caller is not token owner or approved for all"
        );
        _approve(to, tokenId);
    }

    function getApproved(uint256 tokenId) public view virtual returns (address) {
        _requireMinted(tokenId);
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public virtual {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view virtual returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        _safeTransfer(from, to, tokenId, data);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal virtual {
        _transfer(from, to, tokenId);
        // Simplified: Removed onERC721Received check for brevity
    }

    function _ownerOf(uint256 tokenId) internal view virtual returns (address) {
        return _owners[tokenId];
    }

    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual {
        _mint(to, tokenId);
        // Simplified: Removed onERC721Received check for brevity
    }

    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        _beforeTokenTransfer(address(0), to, tokenId);

        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId);
    }

    function _burn(uint256 tokenId) internal virtual {
        address owner = ownerOf(tokenId);

        _beforeTokenTransfer(owner, address(0), tokenId);

        // Clear approvals
        delete _tokenApprovals[tokenId];

        _balances[owner] -= 1;
        delete _owners[tokenId];

        emit Transfer(owner, address(0), tokenId);

        _afterTokenTransfer(owner, address(0), tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        _beforeTokenTransfer(from, to, tokenId);

        // Clear approvals from the previous owner
        delete _tokenApprovals[tokenId];

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        _afterTokenTransfer(from, to, tokenId);
    }

    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    function _setApprovalForAll(address owner, address operator, bool approved) internal virtual {
        require(owner != operator, "ERC721: approve to caller");
        _operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function _requireMinted(uint256 tokenId) internal view virtual {
        require(_exists(tokenId), "ERC721: invalid token ID");
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual {}

    function _afterTokenTransfer(address from, address to, uint256 tokenId) internal virtual {}

    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        _requireMinted(tokenId);
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, Strings.toString(tokenId))) : "";
    }

    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }
}`;

  // Add more dependencies as needed
  
  return dependencies;
}