// deployContract.js - Example of deploying a contract that was auto-transformed

import { ethers } from 'ethers';
import { getProvider, requestAccounts } from './web3Utils';

/**
 * Deploys a compiled smart contract
 * @param {Object} compiledContract - The contract ABI and bytecode
 * @param {Array} constructorArgs - Arguments for the contract constructor
 * @param {Object} signer - Ethers.js signer with an active provider
 * @returns {Promise<Object>} - The deployed contract instance
 */
export async function deployContract(compiledContract, constructorArgs, signer) {
  try {
    // Create a contract factory
    const factory = new ethers.ContractFactory(
      compiledContract.abi,
      compiledContract.bytecode,
      signer
    );
    
    // Deploy the contract with constructor arguments (if any)
    const contract = await factory.deploy(...constructorArgs);
    
    // Wait for deployment to complete
    await contract.deployed();
    
    return {
      success: true,
      contract,
      address: contract.address,
      transactionHash: contract.deployTransaction.hash
    };
  } catch (error) {
    console.error('Deployment error:', error);
    return {
      success: false,
      error: error.message || 'Unknown deployment error'
    };
  }
}

/**
 * Example usage of the deployContract function
 */
export async function deployExample(compiledContract) {
  // This is just an example - in a real app you would:
  // 1. Connect to the user's wallet (e.g. MetaMask)
  // 2. Get the signer from the connected provider
  // 3. Deploy using that signer
  
  // Example with MetaMask
  if (window.ethereum) {
    try {
      // Request account access using our enhanced safe utility
      const accountsResult = await requestAccounts();
      if (!accountsResult.success) {
        throw new Error(accountsResult.error || 'Failed to connect to MetaMask');
      }
      
      // Create a provider and signer using our safe utility
      const provider = getProvider();
      if (!provider) {
        throw new Error('Failed to create web3 provider');
      }
      const signer = provider.getSigner();
      
      // Deploy the contract
      const deployResult = await deployContract(compiledContract, [], signer);
      
      if (deployResult.success) {
        console.log(`Contract deployed at: ${deployResult.address}`);
        console.log(`Transaction hash: ${deployResult.transactionHash}`);
        return deployResult;
      } else {
        console.error('Deployment failed:', deployResult.error);
        throw new Error(deployResult.error);
      }
    } catch (error) {
      console.error('Deployment error:', error);
      throw error;
    }
  } else {
    throw new Error('MetaMask not found - please install it to deploy contracts');
  }
}