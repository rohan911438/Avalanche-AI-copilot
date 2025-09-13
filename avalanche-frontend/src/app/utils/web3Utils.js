// Web3 utilities for safe MetaMask interactions
// Now using our custom wrapper to avoid problematic MetaMask APIs
import { ethers } from 'ethers';
import metamaskWrapper from './metamask-wrapper';

/**
 * Safely check if MetaMask is available
 * @returns {boolean} True if MetaMask is available
 */
export const isMetaMaskAvailable = () => {
  return metamaskWrapper.isAvailable();
};

/**
 * Safely request MetaMask accounts using our custom wrapper
 * @returns {Promise<{success: boolean, accounts: string[], error: string|null}>} Result object with accounts array and error information
 */
export const requestAccounts = async () => {
  return await metamaskWrapper.requestAccounts();
};

/**
 * Get a Web3Provider from ethers.js using our wrapper to get the provider
 * @returns {ethers.providers.Web3Provider|null} Provider or null if not available
 */
export const getProvider = () => {
  if (!isMetaMaskAvailable()) {
    console.error('MetaMask is not available');
    return null;
  }
  
  try {
    const provider = metamaskWrapper.getProvider();
    if (!provider) {
      throw new Error('No provider returned from wrapper');
    }
    return new ethers.providers.Web3Provider(provider);
  } catch (error) {
    console.error('Error creating Web3Provider:', error);
    return null;
  }
};

/**
 * Safely add event listeners using our custom wrapper (which uses polling)
 * @param {string} event Event name
 * @param {Function} handler Event handler
 */
export const addMetaMaskListener = (event, handler) => {
  metamaskWrapper.on(event, handler);
};

/**
 * Safely remove event listeners using our custom wrapper
 * @param {string} event Event name
 * @param {Function} handler Event handler
 */
export const removeMetaMaskListener = (event, handler) => {
  metamaskWrapper.removeListener(event, handler);
};

/**
 * Check user's AVAX balance using our safer provider
 * @param {string} account Address to check
 * @returns {Promise<{wei: string, avax: string}>} Balance in wei and AVAX
 */
export const getAvaxBalance = async (account) => {
  if (!account || !isMetaMaskAvailable()) {
    return null;
  }
  
  try {
    const provider = getProvider();
    if (!provider) return null;
    
    // Use a direct call to avoid potential issues
    const balanceWei = await provider.getBalance(account);
    const balanceAvax = ethers.utils.formatEther(balanceWei);
    
    return {
      wei: balanceWei.toString(),
      avax: balanceAvax
    };
  } catch (error) {
    console.error('Error getting AVAX balance:', error);
    return null;
  }
};