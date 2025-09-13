// Enhanced API route for contract compilation that handles OpenZeppelin imports
// This route preprocesses OpenZeppelin imports before sending them to the backend

import { NextResponse } from 'next/server';

// Configure the runtime to use Node.js instead of Edge
export const runtime = 'nodejs';

// OpenZeppelin base contracts used in the project
const CONTEXT_CONTRACT = `
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}`;

const OWNABLE_CONTRACT = `
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}`;

const REENTRANCY_GUARD_CONTRACT = `
abstract contract ReentrancyGuard {
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

const PAUSABLE_CONTRACT = `
abstract contract Pausable is Context {
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

/**
 * Process imports and inline required dependencies
 */
function processImports(code) {
  if (!code) return code;

  // Define regex patterns for imports
  const ownablePattern = /import\s+["']\.\/Ownable\.sol["'];/;
  const reentrancyGuardPattern = /import\s+["']\.\/ReentrancyGuard\.sol["'];/;
  const pausablePattern = /import\s+["']\.\/Pausable\.sol["'];/;

  // Check if there are any imports to resolve
  const hasOwnable = ownablePattern.test(code);
  const hasReentrancyGuard = reentrancyGuardPattern.test(code);
  const hasPausable = pausablePattern.test(code);
  
  // If no OpenZeppelin imports, return original code
  if (!hasOwnable && !hasReentrancyGuard && !hasPausable) {
    return code;
  }

  // Remove all imports and replace them with comments
  let processedCode = code
    .replace(ownablePattern, '// Ownable implementation inlined')
    .replace(reentrancyGuardPattern, '// ReentrancyGuard implementation inlined')
    .replace(pausablePattern, '// Pausable implementation inlined');

  // Extract the pragma statement
  const pragmaMatch = processedCode.match(/pragma solidity [^;]+;/);
  const pragmaStatement = pragmaMatch ? pragmaMatch[0] : 'pragma solidity ^0.8.0;';
  const pragmaPos = processedCode.indexOf(pragmaStatement);
  
  // Position to insert after pragma
  const insertPos = pragmaPos + pragmaStatement.length;
  
  // Build the inlined code to insert
  let inlinedCode = '\n\n// AUTOMATICALLY INLINED DEPENDENCIES\n';
  
  // Only add Context once if needed by multiple imports
  if (hasOwnable || hasPausable) {
    inlinedCode += CONTEXT_CONTRACT + '\n\n';
  }
  
  if (hasOwnable) {
    inlinedCode += OWNABLE_CONTRACT + '\n\n';
  }
  
  if (hasReentrancyGuard) {
    inlinedCode += REENTRANCY_GUARD_CONTRACT + '\n\n';
  }
  
  if (hasPausable) {
    inlinedCode += PAUSABLE_CONTRACT + '\n\n';
  }
  
  inlinedCode += '// END OF INLINED DEPENDENCIES\n\n';
  
  // Create the final code with inlined dependencies
  const finalCode = 
    processedCode.substring(0, insertPos) + 
    inlinedCode + 
    processedCode.substring(insertPos);
    
  return finalCode;
}

export async function POST(request) {
  try {
    // Parse the request body
    const { contractCode } = await request.json();
    
    if (!contractCode) {
      return NextResponse.json(
        { error: 'Contract code is required' },
        { status: 400 }
      );
    }
    
    // Log the incoming contract for debugging
    console.log('Original contract code length:', contractCode.length);
    
    // Check for OpenZeppelin imports with various possible import syntaxes
    const hasOwnable = contractCode.includes('import "./Ownable.sol"') || 
                       contractCode.includes("import './Ownable.sol'") ||
                       contractCode.includes('import "@openzeppelin/contracts/access/Ownable.sol"');
                       
    const hasReentrancyGuard = contractCode.includes('import "./ReentrancyGuard.sol"') || 
                              contractCode.includes("import './ReentrancyGuard.sol'") ||
                              contractCode.includes('import "@openzeppelin/contracts/security/ReentrancyGuard.sol"');
                              
    const hasPausable = contractCode.includes('import "./Pausable.sol"') || 
                       contractCode.includes("import './Pausable.sol'") ||
                       contractCode.includes('import "@openzeppelin/contracts/security/Pausable.sol"');
    
    // Store these in the outer scope to access later in the response
    const detectedImports = {
      hasOwnable,
      hasReentrancyGuard, 
      hasPausable
    };
    
    console.log('Detected imports:', detectedImports);
    
    // Process the imports and inline dependencies
    const processedCode = processImports(contractCode);
    console.log('Contract processed to include OpenZeppelin dependencies');
    console.log('Processed contract code length:', processedCode.length);
    
    // Define the backend service URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    try {
      // Now send the processed code to the backend for compilation
      const response = await fetch(`${backendUrl}/api/deploy/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contractCode: processedCode,
          contractName: 'ProcessedContract.sol' 
        }),
        timeout: 30000 // 30 second timeout
      });
      
      // Parse the response
      const compilationResult = await response.json();
      
      console.log('Backend compilation response status:', response.status);
      console.log('Backend compilation result keys:', Object.keys(compilationResult));
      
      // Check if compilation was successful
      if (!response.ok || !compilationResult.success) {
        const errorMessage = compilationResult.error || 
          compilationResult.message || 
          'Unknown compilation error';
          
        console.error('Compilation error:', errorMessage);
        
        // Add debug info to help troubleshoot
        const debugInfo = {
          status: response.status,
          originalContractLength: contractCode.length,
          processedContractLength: processedCode.length,
          errorDetails: compilationResult.errors || []
        };
        
        return NextResponse.json(
          { 
            success: false,
            error: errorMessage,
            details: "Compilation failed with inlined dependencies",
            debug: debugInfo
          },
          { status: 400 }
        );
      }
      
      console.log('Compilation successful!');
      
      // Return successful compilation result with more detailed information
      return NextResponse.json({
        success: true,
        abi: compilationResult.abi,
        bytecode: compilationResult.bytecode,
        gasEstimates: compilationResult.gasEstimates || null,
        contractName: compilationResult.contractName || 'ProcessedContract',
        processed: true,
        importsResolved: detectedImports
      });
      
    } catch (fetchError) {
      console.error('Error connecting to backend service:', fetchError);
      return NextResponse.json({
        success: false,
        error: `Could not connect to compilation service: ${fetchError.message}`,
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('Error processing contract:', error);
    return NextResponse.json({
      success: false,
      error: `Error processing contract: ${error.message}`
    }, { status: 500 });
  }
}