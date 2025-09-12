/**
 * This function prepares AI-generated contract code for compilation by removing import statements
 * and replacing them with inlined dependencies from a predefined library
 */

module.exports = {
  prepareContractForCompilation
};

function prepareContractForCompilation(contractCode) {
  // First, identify and collect all import statements
  const importRegex = /import\s+["']([^"']+)["'];/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(contractCode)) !== null) {
    imports.push(match[1]);
  }
  
  // If no imports, return the original code
  if (imports.length === 0) {
    return contractCode;
  }
  
  // Get the standard library dependencies that match the imports
  const dependencies = getInlinedDependencies(imports);
  
  // Remove all import statements
  const codeWithoutImports = contractCode.replace(importRegex, '');
  
  // Add the dependencies at the beginning of the file, after the pragma
  const pragmaEnd = codeWithoutImports.indexOf(';') + 1;
  const firstPart = codeWithoutImports.substring(0, pragmaEnd);
  const secondPart = codeWithoutImports.substring(pragmaEnd);
  
  return firstPart + '\n\n' + dependencies + '\n\n' + secondPart;
}

/**
 * Library of common contract dependencies that can be inlined
 */
function getInlinedDependencies(imports) {
  const dependencies = {};
  
  // Common OpenZeppelin contracts
  dependencies['@openzeppelin/contracts/security/ReentrancyGuard.sol'] = 
  dependencies['ReentrancyGuard.sol'] = 
  dependencies['./ReentrancyGuard.sol'] = `
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
// Inlined Ownable
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

  dependencies['@openzeppelin/contracts/security/Pausable.sol'] = 
  dependencies['Pausable.sol'] = 
  dependencies['./Pausable.sol'] = `
// Inlined Pausable
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

  // Add more dependencies as needed
  
  // Find matches for the imports
  let result = '';
  imports.forEach(importPath => {
    for (const [key, value] of Object.entries(dependencies)) {
      if (importPath.includes(key) || key.includes(importPath)) {
        result += value + '\n\n';
        break;
      }
    }
  });
  
  return result;
}