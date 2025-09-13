// metamask-wrapper.js
// Direct wrapper for MetaMask that avoids using problematic event methods

/**
 * A safe wrapper for MetaMask that avoids using problematic event methods
 * and provides polling-based state detection instead.
 */
class MetaMaskWrapper {
  constructor() {
    this.connected = false;
    this.accounts = [];
    this.chainId = null;
    this.listeners = {
      accountsChanged: [],
      chainChanged: [],
      connect: [],
      disconnect: []
    };
    
    // Start polling for state changes if MetaMask is available
    if (this.isAvailable()) {
      this.startPolling();
    }
  }
  
  /**
   * Check if MetaMask is available in the browser
   */
  isAvailable() {
    return typeof window !== 'undefined' && !!window.ethereum;
  }
  
  /**
   * Start polling for state changes
   * This replaces the event-based approach with a time-based check
   */
  startPolling() {
    // Store initial state
    this.updateState();
    
    // Check for changes every 1000ms
    this.pollingInterval = setInterval(() => this.checkForChanges(), 1000);
  }
  
  /**
   * Stop polling for state changes
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
  
  /**
   * Update the current state from MetaMask
   */
  async updateState() {
    if (!this.isAvailable()) return;
    
    try {
      // Get accounts without prompting
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      this.accounts = accounts || [];
      this.connected = this.accounts.length > 0;
      
      // Get chain ID
      try {
        this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
      } catch (e) {
        console.warn('Failed to get chainId:', e);
      }
    } catch (e) {
      console.warn('Failed to update MetaMask state:', e);
    }
  }
  
  /**
   * Check for changes in MetaMask state
   */
  async checkForChanges() {
    if (!this.isAvailable()) return;
    
    try {
      const previousAccounts = [...this.accounts];
      const previousChainId = this.chainId;
      const previousConnected = this.connected;
      
      await this.updateState();
      
      // Check for account changes
      if (JSON.stringify(previousAccounts) !== JSON.stringify(this.accounts)) {
        this.notifyListeners('accountsChanged', this.accounts);
      }
      
      // Check for chain changes
      if (previousChainId !== this.chainId && this.chainId) {
        this.notifyListeners('chainChanged', this.chainId);
      }
      
      // Check for connection changes
      if (previousConnected !== this.connected) {
        if (this.connected) {
          this.notifyListeners('connect', { chainId: this.chainId });
        } else {
          this.notifyListeners('disconnect', { 
            code: 1000, 
            message: 'MetaMask disconnected' 
          });
        }
      }
    } catch (e) {
      console.warn('Error checking for MetaMask changes:', e);
    }
  }
  
  /**
   * Request accounts from MetaMask
   * This is the only function that prompts the user
   */
  async requestAccounts() {
    if (!this.isAvailable()) {
      return { 
        success: false, 
        accounts: [],
        error: 'MetaMask is not installed or not available' 
      };
    }
    
    try {
      // Use a simple promise wrapper to avoid any potential event-related issues
      const requestPromise = () => {
        return new Promise((resolve, reject) => {
          // Direct call with minimal wrapping
          window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          }).then(resolve).catch(reject);
        });
      };
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 30000)
      );
      
      // Use race to handle potential hanging
      const accounts = await Promise.race([requestPromise(), timeoutPromise]);
      
      // Update our state immediately
      this.accounts = accounts || [];
      this.connected = this.accounts.length > 0;
      
      if (this.accounts.length > 0) {
        return { 
          success: true, 
          accounts: this.accounts,
          error: null
        };
      } else {
        return {
          success: false,
          accounts: [],
          error: 'No accounts returned by MetaMask'
        };
      }
    } catch (error) {
      console.error('Error requesting accounts:', error);
      
      // Format error message
      let errorMessage;
      if (error.code === 4001) {
        errorMessage = 'You rejected the connection request in MetaMask.';
      } else if (error.code === -32002) {
        errorMessage = 'MetaMask is already processing a request.';
      } else {
        errorMessage = error.message || 'Unknown error connecting to MetaMask';
      }
      
      return {
        success: false,
        accounts: [],
        error: errorMessage
      };
    }
  }
  
  /**
   * Add an event listener that uses our polling system
   */
  on(eventName, listener) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(listener);
    }
    return this; // for chaining
  }
  
  /**
   * Remove an event listener
   */
  removeListener(eventName, listener) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(l => l !== listener);
    }
    return this; // for chaining
  }
  
  /**
   * Notify all listeners of an event
   */
  notifyListeners(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in MetaMask event listener for ${eventName}:`, error);
        }
      });
    }
  }
  
  /**
   * Get Ethereum provider
   */
  getProvider() {
    return this.isAvailable() ? window.ethereum : null;
  }
  
  /**
   * Execute a request against the Ethereum provider
   */
  async request(args) {
    if (!this.isAvailable()) {
      throw new Error('MetaMask is not available');
    }
    
    try {
      return await window.ethereum.request(args);
    } catch (error) {
      console.error('MetaMask request failed:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const metamask = new MetaMaskWrapper();

// Export the instance
export default metamask;