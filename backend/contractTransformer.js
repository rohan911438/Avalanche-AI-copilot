// contractTransformer.js - Automatically inlines dependencies for contract compilation

const fs = require('fs');
const path = require('path');

/**
 * Transforms a contract with imports into a fully inlined version
 * @param {string} contractCode - The original contract code with imports
 * @returns {string} - Contract code with all dependencies inlined
 */
function transformContractCode(contractCode) {
  // Extract the pragma and license from the original contract
  const licenseMatch = contractCode.match(/\/\/ SPDX-License-Identifier: ([^\n]+)/);
  const pragmaMatch = contractCode.match(/pragma solidity ([^;]+);/);
  
  const license = licenseMatch ? licenseMatch[0] : '// SPDX-License-Identifier: MIT';
  const pragma = pragmaMatch ? pragmaMatch[0] : 'pragma solidity ^0.8.0;';
  
  // Find all import statements
  const importRegex = /import\s+["']([^"']+)["'];/g;
  let match;
  const imports = [];
  
  while ((match = importRegex.exec(contractCode)) !== null) {
    imports.push(match[1]);
  }
  
  // If no imports, return the original code
  if (imports.length === 0) {
    return contractCode;
  }
  
  console.log(`Found ${imports.length} imports to process`);
  
  // Get the inlined code for each dependency
  const inlinedDependencies = [];
  for (const importPath of imports) {
    console.log(`Processing import: ${importPath}`);
    const dependency = getInlinedDependency(importPath);
    if (dependency) {
      inlinedDependencies.push(`// Inlined from ${importPath}\n${dependency}`);
    } else {
      console.warn(`Could not resolve import: ${importPath}`);
    }
  }
  
  // Remove all import statements
  let processedCode = contractCode.replace(importRegex, '');
  
  // Remove license and pragma from inlined dependencies to avoid duplicates
  const cleanedDependencies = inlinedDependencies
    .map(dep => dep.replace(/\/\/ SPDX-License-Identifier: [^\n]+\n/, ''))
    .map(dep => dep.replace(/pragma solidity [^;]+;/, ''));
  
  // Construct the new contract with dependencies inlined
  const result = `${license}\n${pragma}\n\n// AUTO-INLINED DEPENDENCIES\n\n${cleanedDependencies.join('\n\n')}\n\n// MAIN CONTRACT\n\n${processedCode.replace(license, '').replace(pragma, '').trim()}`;
  
  return result;
}

/**
 * Get the inlined code for a specific dependency
 * @param {string} importPath - The import path
 * @returns {string|null} - The dependency code or null if not found
 */
function getInlinedDependency(importPath) {
  // Standard library dependencies
  const standardLibrary = {
    // OpenZeppelin Security
    '@openzeppelin/contracts/security/ReentrancyGuard.sol': getReentrancyGuardCode(),
    'ReentrancyGuard.sol': getReentrancyGuardCode(),
    './ReentrancyGuard.sol': getReentrancyGuardCode(),
    
    // OpenZeppelin Access
    '@openzeppelin/contracts/access/Ownable.sol': getOwnableCode(),
    'Ownable.sol': getOwnableCode(),
    './Ownable.sol': getOwnableCode(),
    
    // OpenZeppelin Security
    '@openzeppelin/contracts/security/Pausable.sol': getPausableCode(),
    'Pausable.sol': getPausableCode(),
    './Pausable.sol': getPausableCode(),
    
    // OpenZeppelin ERC20
    '@openzeppelin/contracts/token/ERC20/ERC20.sol': getERC20Code(),
    'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol': getERC20Code(),
    'contracts/token/ERC20/ERC20.sol': getERC20Code(),
    'token/ERC20/ERC20.sol': getERC20Code(),
    'ERC20.sol': getERC20Code(),
    './ERC20.sol': getERC20Code(),
  };
  
  // Try to find a match in the standard library
  for (const [key, value] of Object.entries(standardLibrary)) {
    if (importPath.includes(key)) {
      return value;
    }
  }
  
  // Check if it's a local file in the contracts directory
  try {
    const contractsDir = path.join(__dirname, 'contracts');
    const localPath = path.join(contractsDir, importPath.replace(/^\.\//, ''));
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath, 'utf8');
    }
  } catch (error) {
    console.error(`Error reading local file: ${error.message}`);
  }
  
  return null;
}

// Library of inlined contract implementations
function getReentrancyGuardCode() {
  return `
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
}

function getOwnableCode() {
  return `
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
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
}

function getPausableCode() {
  return `
contract Pausable {
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
        emit Paused(msg.sender);
    }

    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }
}`;
}

function getERC20Code() {
  return `
contract ERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    
    address private _owner;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
        _decimals = 18;
        _owner = msg.sender;
    }
    
    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    function transfer(address recipient, uint256 amount) public returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public returns (bool) {
        _transfer(sender, recipient, amount);

        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, msg.sender, currentAllowance - amount);
        }

        return true;
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[sender] = senderBalance - amount;
        }
        _balances[recipient] += amount;
        
        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}`;
}

module.exports = { transformContractCode };