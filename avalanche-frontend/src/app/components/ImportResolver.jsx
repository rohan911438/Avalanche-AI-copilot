// Import resolver component for the frontend
import { useState, useEffect } from 'react';

const TOKEN_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 */
contract ERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    
    address private _owner;
    
    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
        _decimals = 18;
        _owner = msg.sender;
    }
    
    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used for user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     */
    function decimals() public view returns (uint8) {
        return _decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - \`recipient\` cannot be the zero address.
     * - the caller must have a balance of at least \`amount\`.
     */
    function transfer(address recipient, uint256 amount) public returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * Requirements:
     *
     * - \`spender\` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * Requirements:
     *
     * - \`sender\` and \`recipient\` cannot be the zero address.
     * - \`sender\` must have a balance of at least \`amount\`.
     * - the caller must have allowance for \`sender\`'s tokens of at least
     * \`amount\`.
     */
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

    /**
     * @dev Moves \`amount\` of tokens from \`sender\` to \`recipient\`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - \`sender\` cannot be the zero address.
     * - \`recipient\` cannot be the zero address.
     * - \`sender\` must have a balance of at least \`amount\`.
     */
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
    }

    /** @dev Creates \`amount\` tokens and assigns them to \`account\`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with \`from\` set to the zero address.
     *
     * Requirements:
     *
     * - \`account\` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += amount;
        _balances[account] += amount;
    }

    /**
     * @dev Sets \`amount\` as the allowance of \`spender\` over the \`owner\` s tokens.
     *
     * This internal function is equivalent to \`approve\`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - \`owner\` cannot be the zero address.
     * - \`spender\` cannot be the zero address.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
    }
}`;

export default function ImportResolver({ code, onResolvedCode }) {
  const [resolvedCode, setResolvedCode] = useState('');

  useEffect(() => {
    // Function to resolve imports in the frontend
    const resolveImports = () => {
      // Check if code contains imports
      if (!code || !code.includes('import ')) {
        setResolvedCode(code);
        return;
      }

      // Process imports and inline the dependencies
      let processedCode = code;

      // Look for common import patterns
      const erc20ImportPattern = /import\s+["'].*ERC20.sol["'];/;
      
      // Replace ERC20 imports with inlined code
      if (erc20ImportPattern.test(processedCode)) {
        // Remove the import line
        processedCode = processedCode.replace(erc20ImportPattern, '// ERC20 implementation inlined');
        
        // Split the code at pragma line
        const pragmaMatch = processedCode.match(/pragma solidity [^;]+;/);
        if (pragmaMatch) {
          const pragmaStatement = pragmaMatch[0];
          const [beforePragma, afterPragma] = processedCode.split(pragmaStatement);
          
          // Insert the ERC20 code after the pragma
          processedCode = beforePragma + pragmaStatement + '\n\n// INLINED ERC20 IMPLEMENTATION\n' + TOKEN_CONTRACT + '\n\n// YOUR CONTRACT\n' + afterPragma;
        }
      }

      setResolvedCode(processedCode);
      
      // Call the callback with the resolved code
      if (onResolvedCode) {
        onResolvedCode(processedCode);
      }
    };

    resolveImports();
  }, [code, onResolvedCode]);

  return (
    <div>
      {resolvedCode ? (
        <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto border border-gray-200">
          <code>{resolvedCode}</code>
        </pre>
      ) : (
        <div className="flex justify-center p-4">
          <span className="animate-pulse">Resolving imports...</span>
        </div>
      )}
    </div>
  );
}