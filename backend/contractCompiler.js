const solc = require('solc');

/**
 * Compiles a Solidity smart contract
 * @param {string} sourceCode - The Solidity source code
 * @returns {Object} - Object containing ABI and bytecode
 */
function compileContract(sourceCode) {
  try {
    // Prepare input for the Solidity compiler
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: sourceCode
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    };

    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for errors
    if (output.errors) {
      const errors = output.errors.filter(error => error.severity === 'error');
      if (errors.length > 0) {
        throw new Error(
          `Compilation Error: ${errors.map(e => e.formattedMessage).join('\n')}`
        );
      }
    }

    // Get the contract name - this assumes there's only one contract in the source
    const contractName = Object.keys(output.contracts['contract.sol'])[0];
    const contract = output.contracts['contract.sol'][contractName];

    // Return the ABI and bytecode
    return {
      abi: contract.abi,
      bytecode: '0x' + contract.evm.bytecode.object
    };
  } catch (error) {
    console.error('Contract compilation failed:', error);
    throw error;
  }
}

module.exports = { compileContract };