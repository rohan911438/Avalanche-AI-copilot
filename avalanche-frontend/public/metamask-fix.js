// Fix for MetaMask ethereum provider in Next.js
// This script patches the MetaMask provider to fix compatibility issues
(function() {
  if (typeof window !== 'undefined' && window.ethereum) {
    // Create a backup of the original methods
    const originalOn = window.ethereum.on;
    const originalRemoveListener = window.ethereum.removeListener;
    const originalRequest = window.ethereum.request;
    
    // Create fallback event handlers
    if (!window.ethereum._events) {
      window.ethereum._events = {};
    }
    
    // Store MetaMask addListener function reference safely if it exists
    let safeAddListener = null;
    try {
      // Try to safely extract the addListener function using Object.getOwnPropertyNames
      // to find the actual method regardless of its internal name
      const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(window.ethereum));
      for (let i = 0; i < protoMethods.length; i++) {
        const methodName = protoMethods[i];
        if (methodName.includes('addListener') || methodName.includes('addEventListener')) {
          const method = window.ethereum[methodName];
          if (typeof method === 'function') {
            safeAddListener = method.bind(window.ethereum);
            console.log('Found safe MetaMask addListener method:', methodName);
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to find MetaMask addListener method:', e);
    }

    // Safely patch the 'on' method
    if (typeof originalOn === 'function') {
      window.ethereum.on = function(eventName, listener) {
        try {
          // First try the original method
          return originalOn.call(window.ethereum, eventName, listener);
        } catch (error) {
          console.warn(`MetaMask event registration error for ${eventName}:`, error);
          
          // Try our safe extracted addListener if we found one
          if (safeAddListener) {
            try {
              safeAddListener(eventName, listener);
              return window.ethereum; // for chaining
            } catch (innerError) {
              console.warn(`Safe addListener also failed for ${eventName}:`, innerError);
            }
          }
          
          // If all else fails, use our own event system
          if (!window.ethereum._events[eventName]) {
            window.ethereum._events[eventName] = [];
          }
          window.ethereum._events[eventName].push(listener);
          return window.ethereum; // for chaining
        }
      };
    } else {
      // If 'on' doesn't exist, create it
      window.ethereum.on = function(eventName, listener) {
        if (!window.ethereum._events[eventName]) {
          window.ethereum._events[eventName] = [];
        }
        window.ethereum._events[eventName].push(listener);
        return window.ethereum; // for chaining
      };
    }

    // Safely patch the 'removeListener' method
    if (typeof originalRemoveListener === 'function') {
      window.ethereum.removeListener = function(eventName, listener) {
        try {
          return originalRemoveListener.call(window.ethereum, eventName, listener);
        } catch (error) {
          console.warn(`MetaMask event removal error for ${eventName}:`, error);
          
          // Fallback to our own event system
          if (window.ethereum._events && window.ethereum._events[eventName]) {
            window.ethereum._events[eventName] = window.ethereum._events[eventName].filter(l => l !== listener);
          }
          return window.ethereum; // for chaining
        }
      };
    } else {
      // If 'removeListener' doesn't exist, create it
      window.ethereum.removeListener = function(eventName, listener) {
        if (window.ethereum._events && window.ethereum._events[eventName]) {
          window.ethereum._events[eventName] = window.ethereum._events[eventName].filter(l => l !== listener);
        }
        return window.ethereum; // for chaining
      };
    }

    // Create a custom emit function to trigger our stored events
    window.ethereum._emit = function(eventName, ...args) {
      if (window.ethereum._events && window.ethereum._events[eventName]) {
        window.ethereum._events[eventName].forEach(listener => {
          try {
            listener(...args);
          } catch (error) {
            console.error(`Error in MetaMask event listener for ${eventName}:`, error);
          }
        });
      }
    };

    // Patch the request method to handle common errors and emit events properly
    if (originalRequest) {
      window.ethereum.request = async function(args) {
        try {
          const result = await originalRequest.call(window.ethereum, args);
          
          // Handle account changes automatically
          if (args.method === 'eth_requestAccounts' && Array.isArray(result)) {
            window.ethereum._emit('accountsChanged', result);
          }
          
          return result;
        } catch (error) {
          // Emit appropriate events for errors
          if (args.method === 'eth_requestAccounts') {
            window.ethereum._emit('accountsChanged', []);
          }
          throw error; // Re-throw to let the application handle it
        }
      };
    }
    
    console.log('Enhanced MetaMask provider patch applied for Next.js compatibility');
  }
})();