'use client'

import { useState, useEffect } from 'react'
import { Loader, AlertCircle, Check, ExternalLink } from 'lucide-react'
import { ethers } from 'ethers'
import { 
  isMetaMaskAvailable, 
  requestAccounts, 
  getProvider, 
  addMetaMaskListener, 
  removeMetaMaskListener,
  getAvaxBalance
} from '../utils/web3Utils'
import metamaskWrapper from '../utils/metamask-wrapper'

export default function ContractDeployer({ contractCode, API_BASE_URL }) {
  const [network, setNetwork] = useState('fuji')
  const [deploymentStatus, setDeploymentStatus] = useState('idle') // idle, compiling, estimating, deploying, success, error
  const [error, setError] = useState('')
  const [deployedAddress, setDeployedAddress] = useState('')
  const [walletConnected, setWalletConnected] = useState(false)
  const [currentAccount, setCurrentAccount] = useState('')
  const [compiledContract, setCompiledContract] = useState(null)
  const [gasEstimate, setGasEstimate] = useState(null) // { gas, gasPrice, totalCost }
  const [constructorArgs, setConstructorArgs] = useState([]) // Array of constructor argument objects
  const [constructorInputs, setConstructorInputs] = useState([]) // Array of ABI constructor input definitions
  const [avaxBalance, setAvaxBalance] = useState(null) // User's AVAX balance
  const [balanceCheckStatus, setBalanceCheckStatus] = useState('idle') // idle, checking, sufficient, insufficient

  // Check if MetaMask is installed and wallet is connected using our new approach
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        if (isMetaMaskAvailable()) {
          // Our wrapper will automatically check accounts without prompting
          if (metamaskWrapper) {
            // Force an immediate state update
            await metamaskWrapper.updateState();
            
            // Get the current state
            const currentAccounts = metamaskWrapper.accounts;
            
            if (currentAccounts && currentAccounts.length > 0) {
              setCurrentAccount(currentAccounts[0]);
              setWalletConnected(true);
              
              // Check the user's AVAX balance
              try {
                const balance = await getAvaxBalance(currentAccounts[0]);
                if (balance) {
                  setAvaxBalance(balance);
                }
              } catch (balanceError) {
                console.warn('Non-critical error checking balance:', balanceError);
              }
            }
          }
          
          // Use our completely reworked event handling system
          addMetaMaskListener('accountsChanged', handleAccountsChanged);
          addMetaMaskListener('chainChanged', handleChainChanged);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };
    
    // Delay the check to ensure everything is loaded
    setTimeout(checkWalletConnection, 1000);
    
    // Clean up listeners when component unmounts
    return () => {
      removeMetaMaskListener('accountsChanged', handleAccountsChanged);
      removeMetaMaskListener('chainChanged', handleChainChanged);
    };
  }, [])
  
  // Handle account changes using our new wrapper approach
  const handleAccountsChanged = async (accounts) => {
    try {
      console.log('Accounts changed:', accounts);
      
      if (!accounts || accounts.length === 0) {
        // User disconnected wallet
        setWalletConnected(false)
        setCurrentAccount('')
        setAvaxBalance(null)
        setError('Wallet disconnected. Please reconnect to deploy contracts.')
      } else if (accounts[0] !== currentAccount) {
        // Account changed
        setCurrentAccount(accounts[0])
        try {
          const balance = await getAvaxBalance(accounts[0])
          if (balance) {
            setAvaxBalance(balance)
          }
        } catch (error) {
          console.warn('Error fetching balance after account change:', error)
        }
      }
    } catch (error) {
      console.error('Error handling account change:', error)
    }
  }
  
  // Handle chain changes with more error handling
  const handleChainChanged = async (chainId) => {
    try {
      console.log('Chain changed:', chainId);
      
      // Show a message before reloading
      setError('Network changed. Refreshing page...')
      
      // Small delay before reload to show the message
      setTimeout(() => {
        // When chain changes, refresh page to ensure consistent state
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Error handling chain change:', error)
    }
  }
  
  // Fetch and check the user's AVAX balance
  const checkAvaxBalance = async (account) => {
    if (!account) {
      console.warn('Cannot check balance: No account provided')
      return null
    }
    
    try {
      setBalanceCheckStatus('checking')
      console.log('Checking AVAX balance for account:', account)
      
      // Use our utility function to get balance
      const balance = await getAvaxBalance(account)
      
      if (balance) {
        console.log('AVAX balance fetched successfully:', balance)
        setAvaxBalance(balance)
      } else {
        console.warn('Failed to get AVAX balance, using direct provider approach')
        
        // Direct approach as fallback
        const provider = getProvider()
        if (provider) {
          const balanceWei = await provider.getBalance(account)
          const balanceAvax = ethers.utils.formatEther(balanceWei)
          
          const directBalance = {
            wei: balanceWei.toString(),
            avax: balanceAvax
          }
          
          console.log('Balance from direct call:', directBalance)
          setAvaxBalance(directBalance)
          setBalanceCheckStatus('idle')
          return directBalance
        }
      }
      
      setBalanceCheckStatus('idle')
      
      // Return the balance for use in other functions
      return balance
    } catch (error) {
      console.error('Error checking AVAX balance:', error)
      setBalanceCheckStatus('idle')
      return null
    }
  }

  // Connect to MetaMask wallet using our completely new approach
  const connectWallet = async () => {
    try {
      if (!isMetaMaskAvailable()) {
        setError('MetaMask is not installed. Please install MetaMask to deploy contracts.')
        return
      }

      setError('')
      setDeploymentStatus('idle')
      
      // Show connecting status to the user
      const connectingStatus = document.getElementById('connecting-status')
      if (connectingStatus) {
        connectingStatus.textContent = 'Connecting to MetaMask...'
      }
      
      // Use our completely redesigned approach for requesting accounts
      const result = await requestAccounts()
      
      if (!result.success) {
        setError(result.error || 'Failed to connect to MetaMask')
        if (connectingStatus) {
          connectingStatus.textContent = 'Connection failed'
        }
        return
      }
      
      const accounts = result.accounts
      if (accounts.length === 0) {
        setError('No accounts found in MetaMask. Please create an account or unlock your wallet.')
        return
      }
      
      setCurrentAccount(accounts[0])
      setWalletConnected(true)
      
      // Show success message
      if (connectingStatus) {
        connectingStatus.textContent = 'Connected!'
      }
      
      // Get AVAX balance using our utility
      try {
        const balance = await getAvaxBalance(accounts[0])
        if (balance) {
          setAvaxBalance(balance)
        }
      } catch (balanceError) {
        console.warn('Non-critical error getting balance:', balanceError)
        // Continue anyway - balance is not critical
      }
      
      // Check if we're on the right network
      try {
        await checkAndSwitchNetwork()
      } catch (networkError) {
        console.warn('Error switching network:', networkError)
        // Continue anyway - we'll handle network issues later
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error)
      setError(`Failed to connect wallet: ${error.message || 'Unknown error'}`)
    }
  }

  // Check and switch to the correct Avalanche network
  const checkAndSwitchNetwork = async () => {
    try {
      const chainId = network === 'fuji' ? '0xA869' : '0xA86A' // Fuji: 43113, Mainnet: 43114
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
      
      if (currentChainId !== chainId) {
        try {
          // Try to switch to the network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }]
          })
        } catch (switchError) {
          // Network doesn't exist in MetaMask, so we need to add it
          if (switchError.code === 4902) {
            await addAvalancheNetwork()
          } else {
            throw switchError
          }
        }
      }
      
      return true
    } catch (error) {
      console.error('Error switching network:', error)
      setError(`Failed to switch network: ${error.message}`)
      return false
    }
  }

  // Add Avalanche network to MetaMask if it doesn't exist
  const addAvalancheNetwork = async () => {
    const networkParams = network === 'fuji' 
      ? {
          chainId: '0xA869', // 43113 in hex
          chainName: 'Avalanche Fuji Testnet',
          nativeCurrency: {
            name: 'AVAX',
            symbol: 'AVAX',
            decimals: 18
          },
          rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
          blockExplorerUrls: ['https://testnet.snowtrace.io/']
        }
      : {
          chainId: '0xA86A', // 43114 in hex
          chainName: 'Avalanche C-Chain',
          nativeCurrency: {
            name: 'AVAX',
            symbol: 'AVAX',
            decimals: 18
          },
          rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
          blockExplorerUrls: ['https://snowtrace.io/']
        }
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkParams]
    })
  }

  // Parse constructor inputs from ABI
  const parseConstructorInputs = (abi) => {
    if (!abi || !Array.isArray(abi)) return []

    // Find the constructor ABI entry
    const constructorAbi = abi.find(item => item.type === 'constructor')
    
    // If no constructor or no inputs, return empty array
    if (!constructorAbi || !constructorAbi.inputs || constructorAbi.inputs.length === 0) {
      return []
    }
    
    return constructorAbi.inputs
  }
  
  // Initialize constructor arguments based on inputs
  const initializeConstructorArgs = (inputs) => {
    return inputs.map(input => {
      let defaultValue = ''
      
      // Set appropriate default values based on type
      if (input.type.includes('int')) {
        defaultValue = '0'
      } else if (input.type === 'bool') {
        defaultValue = 'false'
      } else if (input.type === 'address') {
        defaultValue = '0x0000000000000000000000000000000000000000'
      } else if (input.type.includes('[]')) {
        defaultValue = '[]'
      }
      
      return {
        name: input.name,
        type: input.type,
        value: defaultValue
      }
    })
  }

  // Compile the contract using our enhanced frontend API endpoint with import resolution
  const compileContract = async () => {
    try {
      setDeploymentStatus('compiling')
      setError('')
      
      // First try the new API endpoint with import resolution
      try {
        const response = await fetch('/api/compile-with-imports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ contractCode })
        })
        
        if (!response.ok) {
          // If the new endpoint fails, we'll fall back to the old one
          throw new Error('New compilation endpoint failed')
        }
        
        const data = await response.json()
        
        // Parse constructor inputs from ABI
        const inputs = parseConstructorInputs(data.abi)
        setConstructorInputs(inputs)
        
        // Initialize constructor arguments
        setConstructorArgs(initializeConstructorArgs(inputs))
        
        setCompiledContract(data)
        setDeploymentStatus('ready')
        return data
      } catch (frontendError) {
        console.log("Frontend compilation failed, falling back to backend:", frontendError)
        
        // Fallback to the original backend endpoint
        const response = await fetch(`${API_BASE_URL}/api/deploy/compile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ contractCode })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to compile contract')
        }
        
        const data = await response.json()
        
        // Parse constructor inputs from ABI
        const inputs = parseConstructorInputs(data.abi)
        setConstructorInputs(inputs)
        
        // Initialize constructor arguments
        setConstructorArgs(initializeConstructorArgs(inputs))
        
        setCompiledContract(data)
        setDeploymentStatus('ready')
        return data
      }
    } catch (error) {
      console.error('Error compiling contract:', error)
      setError(`Compilation error: ${error.message}`)
      setDeploymentStatus('error')
      return null
    }
  }

  // Estimate the gas needed for deployment
  const estimateGas = async () => {
    try {
      if (!walletConnected) {
        await connectWallet()
      }
      
      // Check if we have the compiled contract or need to compile it
      let compiledData = compiledContract
      if (!compiledData) {
        compiledData = await compileContract()
        if (!compiledData) return null // Compilation failed
      }
      
      // Make sure we're on the right network
      const networkOk = await checkAndSwitchNetwork()
      if (!networkOk) return null
      
      setDeploymentStatus('estimating')
      setError('')
      
      // Initialize ethers.js provider and signer
      const provider = getProvider()
      if (!provider) {
        setError('Failed to create provider. Please refresh the page and try again.')
        setDeploymentStatus('error')
        return null
      }
      
      // Get current account to make sure we're using the correct one
      const accounts = await provider.listAccounts()
      if (!accounts || accounts.length === 0) {
        setError('No accounts found in MetaMask. Please unlock your wallet.')
        setDeploymentStatus('error')
        return null
      }
      
      const signer = provider.getSigner()
      
      // Log for debugging
      console.log('Using signer address:', await signer.getAddress())
      
      // Create a contract factory for estimation
      const factory = new ethers.ContractFactory(
        compiledData.abi, 
        compiledData.bytecode,
        signer
      )
      
      // Get current gas price with fallback
      let gasPrice
      try {
        gasPrice = await provider.getGasPrice()
        console.log('Raw gas price from provider:', gasPrice.toString())
        
        // Ensure minimum gas price (Avalanche typically requires at least 25 Gwei)
        const minGasPrice = ethers.utils.parseUnits('25', 'gwei')
        if (gasPrice.lt(minGasPrice) || gasPrice.isZero()) {
          console.log('Gas price too low, using minimum 25 Gwei instead')
          gasPrice = minGasPrice
        }
      } catch (gasPriceError) {
        console.error('Error getting gas price:', gasPriceError)
        // Use a default gas price for Avalanche Fuji if fetching fails
        gasPrice = ethers.utils.parseUnits('25', 'gwei')
      }
      
      console.log('Gas price (adjusted if needed):', ethers.utils.formatUnits(gasPrice, 'gwei'), 'Gwei')
      
      // Parse constructor arguments if any
      let args = []
      if (constructorArgs.length > 0) {
        args = parseConstructorArgValues()
        console.log('Constructor args:', args)
      }
      
      // Estimate the gas limit for deployment with constructor args if needed
      let deploymentData
      let estimatedGas
      
      try {
        // First try with getDeployTransaction
        deploymentData = constructorArgs.length > 0 
          ? factory.getDeployTransaction(...args)
          : factory.getDeployTransaction()
        
        console.log('Deployment data created successfully')
        estimatedGas = await provider.estimateGas(deploymentData)
      } catch (estimateError) {
        console.error('Error in first estimation attempt:', estimateError)
        
        // Try alternative approach with direct estimateGas on factory
        try {
          estimatedGas = constructorArgs.length > 0
            ? await factory.estimateGas.deploy(...args)
            : await factory.estimateGas.deploy()
            
          console.log('Estimated gas using factory.estimateGas:', estimatedGas.toString())
        } catch (fallbackError) {
          console.error('Error in fallback estimation:', fallbackError)
          setError(`Gas estimation failed: ${fallbackError.message}. Check your contract and constructor arguments.`)
          setDeploymentStatus('error')
          return null
        }
      }
      
      console.log('Estimated gas units:', estimatedGas.toString())
      
      // Calculate total cost in AVAX
      const totalWei = gasPrice.mul(estimatedGas)
      const totalAvax = ethers.utils.formatEther(totalWei)
      
      console.log('Gas price in wei:', gasPrice.toString())
      console.log('Gas limit:', estimatedGas.toString())
      console.log('Total wei:', totalWei.toString())
      console.log('Estimated cost in AVAX:', totalAvax)
      
      // Double-check calculation to ensure non-zero values
      if (totalWei.isZero() || Number(totalAvax) === 0) {
        console.warn('Total cost calculation resulted in zero - using fallback calculation')
        
        // Fallback calculation using minimum gas price (25 Gwei)
        const minGasPrice = ethers.utils.parseUnits('25', 'gwei')
        const fallbackTotalWei = minGasPrice.mul(estimatedGas)
        const fallbackTotalAvax = ethers.utils.formatEther(fallbackTotalWei)
        
        console.log('Fallback calculation:')
        console.log('- Min gas price: 25 Gwei')
        console.log('- Gas limit:', estimatedGas.toString())
        console.log('- Fallback total wei:', fallbackTotalWei.toString())
        console.log('- Fallback total AVAX:', fallbackTotalAvax)
        
        const estimateData = {
          gas: estimatedGas.toString(),
          gasPrice: '25',  // Fixed at 25 Gwei minimum
          totalCost: fallbackTotalAvax,
          totalWei: fallbackTotalWei.toString()
        }
        
        setGasEstimate(estimateData)
        return estimateData
      }
      
      const estimateData = {
        gas: estimatedGas.toString(),
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
        totalCost: totalAvax,
        totalWei: totalWei.toString()
      }
      
      setGasEstimate(estimateData)
      setDeploymentStatus('ready')
      
      // Check if the user has sufficient balance
      await checkBalanceSufficiency()
      
      return estimateData
    } catch (error) {
      console.error('Error estimating gas:', error)
      setError(`Gas estimation failed: ${error.message}`)
      setDeploymentStatus('error')
      return null
    }
  }

  // Deploy the contract to the Avalanche network
  const deployContract = async () => {
    try {
      if (!walletConnected) {
        await connectWallet()
      }
      
      // Check if we have the compiled contract or need to compile it
      let compiledData = compiledContract
      if (!compiledData) {
        compiledData = await compileContract()
        if (!compiledData) return // Compilation failed
      }
      
      // Make sure we're on the right network
      const networkOk = await checkAndSwitchNetwork()
      if (!networkOk) return
      
      // Always re-estimate gas for latest data
      console.log('Estimating gas for deployment...')
      const estimateData = await estimateGas()
      if (!estimateData) {
        console.error('Gas estimation failed before deployment')
        return // Gas estimation failed
      }
      
      console.log('Updated gas estimate:', estimateData)
      
      // Check if user has sufficient balance
      console.log('Checking balance sufficiency before deployment...')
      const isBalanceSufficient = await checkBalanceSufficiency()
      console.log('Balance sufficient?', isBalanceSufficient)
      
      // If balance is insufficient, show warning but allow user to proceed
      if (!isBalanceSufficient && avaxBalance) {
        const shouldProceed = window.confirm(
          `Warning: Your AVAX balance (${Number(avaxBalance.avax).toFixed(6)} AVAX) may not be sufficient for this deployment. The estimated cost is ${Number(gasEstimate.totalCost).toFixed(6)} AVAX. Do you want to proceed anyway?`
        )
        
        if (!shouldProceed) {
          console.log('User chose not to proceed with deployment due to insufficient balance')
          return // User chose not to proceed
        }
      }
      
      console.log('Starting deployment...')
      setDeploymentStatus('deploying')
      
      // Initialize ethers.js provider and signer
      const provider = getProvider()
      if (!provider) {
        setError('Failed to create provider. Please refresh the page and try again.')
        setDeploymentStatus('error')
        return
      }
      
      // Validate provider connection
      try {
        const network = await provider.getNetwork()
        console.log('Connected to network:', network.name, `(chainId: ${network.chainId})`)
      } catch (networkError) {
        console.error('Network connection error:', networkError)
        setError('Failed to connect to network. Please check your internet connection and try again.')
        setDeploymentStatus('error')
        return
      }
      
      // Get signer and verify account access
      let signer
      try {
        signer = provider.getSigner()
        const signerAddress = await signer.getAddress()
        console.log('Using signer with address:', signerAddress)
        
        // Check if signer has funds
        const balance = await provider.getBalance(signerAddress)
        console.log('Signer balance:', ethers.utils.formatEther(balance), 'AVAX')
        
        if (balance.isZero()) {
          console.warn('Warning: Signer has zero balance')
        }
      } catch (signerError) {
        console.error('Signer error:', signerError)
        setError('Failed to access your wallet. Please make sure MetaMask is unlocked and you have granted permission.')
        setDeploymentStatus('error')
        return
      }
      
      // Create a contract factory for deployment
      // First ensure the ABI is properly formatted
      let abi = compiledData.abi;
      if (typeof abi === 'string') {
        try {
          abi = JSON.parse(abi);
        } catch (parseError) {
          console.error('Error parsing ABI string:', parseError);
          throw new Error('Invalid ABI format. Could not parse ABI JSON.');
        }
      }
      
      // Ensure bytecode format is correct (should start with 0x)
      let bytecode = compiledData.bytecode;
      if (bytecode && !bytecode.startsWith('0x')) {
        bytecode = '0x' + bytecode;
      }
      
      // Log the factory inputs for debugging
      console.log('Contract factory setup:');
      console.log('- ABI type:', typeof abi);
      console.log('- ABI is array:', Array.isArray(abi));
      console.log('- ABI length:', Array.isArray(abi) ? abi.length : 'N/A');
      console.log('- Bytecode length:', bytecode.length);
      
      const factory = new ethers.ContractFactory(
        abi,
        bytecode,
        signer
      )
      
      // Parse constructor arguments if any
      let args = []
      if (constructorArgs.length > 0) {
        args = parseConstructorArgValues()
      }
      
      // Deploy the contract with constructor arguments if needed
      console.log(`Deploying contract with args:`, args.length > 0 ? args : 'No constructor args')
      
      // Add more detailed logging
      console.log('ABI:', JSON.stringify(compiledData.abi).substring(0, 200) + '...');
      console.log('Bytecode length:', compiledData.bytecode.length);
      
      try {
        // Create deployment transaction
        const deployTransaction = constructorArgs.length > 0 
          ? await factory.getDeployTransaction(...args)
          : await factory.getDeployTransaction();
        
        // Make sure we have an appropriate gas limit
        // If not provided by ethers, estimate it or set a safe default
        if (!deployTransaction.gasLimit) {
          try {
            // Try to estimate gas
            const estimatedGas = await provider.estimateGas({
              from: await signer.getAddress(),
              data: deployTransaction.data
            });
            
            // Add 20% buffer to estimated gas
            const gasWithBuffer = estimatedGas.mul(120).div(100);
            deployTransaction.gasLimit = gasWithBuffer;
            console.log('Estimated gas with 20% buffer:', gasWithBuffer.toString());
          } catch (gasEstError) {
            console.error('Gas estimation error:', gasEstError);
            
            // Set a reasonable default gas limit if estimation fails
            deployTransaction.gasLimit = ethers.BigNumber.from('5000000'); // 5 million gas
            console.log('Using default gas limit:', deployTransaction.gasLimit.toString());
          }
        }
        
        console.log('Gas limit for deployment:', deployTransaction.gasLimit.toString());
        
        // Explicitly set gas price (important for some test networks)
        if (!deployTransaction.gasPrice) {
          try {
            const currentGasPrice = await provider.getGasPrice();
            // Use slightly higher gas price (10% more) to ensure faster confirmation
            deployTransaction.gasPrice = currentGasPrice.mul(110).div(100);
            console.log('Using gas price:', ethers.utils.formatUnits(deployTransaction.gasPrice, 'gwei'), 'gwei');
          } catch (gasPriceError) {
            console.error('Error getting gas price:', gasPriceError);
          }
        }
        
        // Send the transaction
        console.log('Sending deployment transaction...');
        const tx = await signer.sendTransaction(deployTransaction);
        console.log('Transaction sent:', tx.hash);
        
        // Wait for transaction confirmation
        console.log('Waiting for transaction confirmation...');
        const receipt = await tx.wait(1); // Wait for 1 confirmation
        
        if (!receipt.contractAddress) {
          throw new Error('No contract address in transaction receipt');
        }
        
        // Success! Update the state with deployed address
        setDeployedAddress(receipt.contractAddress);
        setDeploymentStatus('success');
        console.log(`Contract deployed at: ${receipt.contractAddress}`);
      } catch (txError) {
        console.error('Transaction error:', txError);
        throw txError; // Re-throw to be caught by the outer try/catch
      }
      
    } catch (error) {
      console.error('Error deploying contract:', error)
      
      // Enhanced error handling with more details
      let errorMessage = 'Deployment failed';
      
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      if (error.code) {
        errorMessage += ` (Code: ${error.code})`;
      }
      
      // Handle specific MetaMask errors
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.code === -32603) {
        errorMessage = 'Internal JSON-RPC error. Check if you have enough AVAX for gas';
      }
      
      // Log the full error object for debugging
      console.log('Detailed error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      setError(errorMessage);
      setDeploymentStatus('error');
    }
  }

  // Handle constructor argument changes
  const handleConstructorArgChange = (index, value) => {
    const updatedArgs = [...constructorArgs]
    updatedArgs[index].value = value
    setConstructorArgs(updatedArgs)
  }
  
  // Parse constructor arguments to appropriate types for contract deployment
  const parseConstructorArgValues = () => {
    const parsedArgs = [];
    
    for (let i = 0; i < constructorArgs.length; i++) {
      const arg = constructorArgs[i];
      console.log(`Parsing arg ${i} (${arg.name}): type=${arg.type}, value=${arg.value}`);
      
      try {
        // Handle different types of arguments
        if (arg.type.includes('int')) {
          // For integer types, ensure they're valid numbers
          if (arg.value === '' || isNaN(arg.value)) {
            throw new Error(`Invalid integer value for ${arg.name}`);
          }
          
          // For uint types, ensure they're non-negative
          if (arg.type.startsWith('uint') && parseInt(arg.value) < 0) {
            throw new Error(`Value for ${arg.name} must be non-negative`);
          }
          
          // Use ethers.js BigNumber for safer handling of large integers
          parsedArgs.push(ethers.BigNumber.from(arg.value.toString()));
        } 
        else if (arg.type === 'bool') {
          // For boolean types
          parsedArgs.push(arg.value === 'true');
        } 
        else if (arg.type === 'address') {
          // For address types, validate the address format
          if (!ethers.utils.isAddress(arg.value)) {
            throw new Error(`Invalid Ethereum address for ${arg.name}`);
          }
          parsedArgs.push(arg.value);
        } 
        else if (arg.type.includes('[]')) {
          // For array types, parse the JSON and validate
          try {
            const arrayValue = JSON.parse(arg.value);
            if (!Array.isArray(arrayValue)) {
              throw new Error(`Value for ${arg.name} must be an array`);
            }
            parsedArgs.push(arrayValue);
          } catch (e) {
            throw new Error(`Failed to parse array value for ${arg.name}: ${e.message}`);
          }
        } 
        else {
          // For string and other types
          parsedArgs.push(arg.value);
        }
        
        console.log(`Successfully parsed ${arg.name} to:`, parsedArgs[parsedArgs.length - 1]);
      } catch (error) {
        console.error(`Error parsing constructor argument ${arg.name}:`, error);
        throw new Error(`Invalid value for constructor argument ${arg.name}: ${error.message}`);
      }
    }
    
    return parsedArgs;
  }
  
  // Check if user has sufficient balance for deployment
  const checkBalanceSufficiency = async () => {
    // Ensure we have fresh balance data
    if (currentAccount) {
      await checkAvaxBalance(currentAccount)
    }
    
    if (!gasEstimate || !avaxBalance) {
      console.warn('Cannot check balance sufficiency - missing data', { 
        hasGasEstimate: !!gasEstimate, 
        hasAvaxBalance: !!avaxBalance 
      })
      return false
    }
    
    try {
      console.log('Checking balance sufficiency:')
      console.log('- Gas estimate:', gasEstimate)
      console.log('- AVAX balance:', avaxBalance)
      
      // Convert both values to BigNumber for safe comparison
      const estimatedCostWei = ethers.BigNumber.from(gasEstimate.totalWei)
      const balanceWei = ethers.BigNumber.from(avaxBalance.wei)
      
      console.log('- Estimated cost (wei):', estimatedCostWei.toString())
      console.log('- Balance (wei):', balanceWei.toString())
      
      // Add 10% buffer to estimated cost for safety
      const estimatedWithBuffer = estimatedCostWei.mul(110).div(100)
      console.log('- Estimated with 10% buffer (wei):', estimatedWithBuffer.toString())
      
      // Compare and set status
      const isBalanceSufficient = balanceWei.gt(estimatedWithBuffer)
      console.log('- Is balance sufficient?', isBalanceSufficient)
      
      setBalanceCheckStatus(isBalanceSufficient ? 'sufficient' : 'insufficient')
      
      return isBalanceSufficient
    } catch (error) {
      console.error('Error checking balance sufficiency:', error)
      setBalanceCheckStatus('insufficient')
      return false
    }
  }
  
  // Get the appropriate explorer URL based on the network
  const getExplorerUrl = () => {
    const baseUrl = network === 'fuji' 
      ? 'https://testnet.snowtrace.io/address/' 
      : 'https://snowtrace.io/address/'
    return `${baseUrl}${deployedAddress}`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
        <span>Deploy Contract</span>
        {deploymentStatus === 'success' && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Deployed
          </span>
        )}
      </h2>
      
      {/* Network Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Network
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`py-2 px-4 rounded border text-sm font-medium ${
              network === 'fuji'
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setNetwork('fuji')}
          >
            Fuji Testnet
          </button>
          <button
            className={`py-2 px-4 rounded border text-sm font-medium ${
              network === 'mainnet'
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setNetwork('mainnet')}
          >
            Mainnet
          </button>
        </div>
      </div>
      
      {/* Wallet Connection */}
      {!walletConnected ? (
        <div className="space-y-2">
          <button
            onClick={connectWallet}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Connect MetaMask
          </button>
          <div 
            id="connecting-status" 
            className="text-center text-sm text-gray-600 h-5"
          ></div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="font-medium text-gray-700">Connected:</span>
            <span className="text-gray-500 truncate">
              {currentAccount.substring(0, 6)}...{currentAccount.substring(38)}
            </span>
          </div>
          
          {/* AVAX Balance Display */}
          {avaxBalance && (
            <div className="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">AVAX Balance:</span>
                <span className="text-sm font-mono">
                  {Number(avaxBalance.avax).toFixed(6)} AVAX
                </span>
              </div>
              
              {/* Balance Refresh Button */}
              <button 
                onClick={() => checkAvaxBalance(currentAccount)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          )}
          
          {/* Balance Check Status */}
          {balanceCheckStatus === 'insufficient' && gasEstimate && (
            <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1 text-yellow-500" />
              <span>
                Warning: Your balance may be insufficient for deployment (estimated cost: {Number(gasEstimate.totalCost).toFixed(6)} AVAX)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Constructor Arguments */}
      {constructorInputs.length > 0 && compiledContract && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Constructor Arguments</h3>
          
          <div className="space-y-3">
            {constructorArgs.map((arg, index) => (
              <div key={index} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  {arg.name} <span className="text-gray-500">({arg.type})</span>
                </label>
                <input
                  type="text"
                  value={arg.value}
                  onChange={(e) => handleConstructorArgChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                  placeholder={`Enter ${arg.type} value`}
                />
                {arg.type === 'address' && (
                  <p className="text-xs text-gray-500">
                    Example: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                  </p>
                )}
                {arg.type.includes('[]') && (
                  <p className="text-xs text-gray-500">
                    Enter as JSON array: ["item1", "item2"] or [1, 2, 3]
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deployment Actions */}
      <div className="space-y-2">
        <button
          onClick={compileContract}
          disabled={!contractCode || deploymentStatus === 'compiling' || deploymentStatus === 'estimating' || deploymentStatus === 'deploying'}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors mb-2"
        >
          {deploymentStatus === 'compiling' ? (
            <span className="flex items-center justify-center">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Compiling...
            </span>
          ) : (
            'Compile Contract'
          )}
        </button>
        
        <button
          onClick={estimateGas}
          disabled={!walletConnected || !contractCode || deploymentStatus === 'compiling' || deploymentStatus === 'estimating' || deploymentStatus === 'deploying'}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors mb-2"
        >
          {deploymentStatus === 'estimating' ? (
            <span className="flex items-center justify-center">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Estimating Gas...
            </span>
          ) : (
            'Estimate Deployment Cost'
          )}
        </button>
        
        <button
          onClick={deployContract}
          disabled={!walletConnected || !contractCode || deploymentStatus === 'compiling' || deploymentStatus === 'estimating' || deploymentStatus === 'deploying'}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {deploymentStatus === 'deploying' ? (
            <span className="flex items-center justify-center">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Deploying...
            </span>
          ) : (
            'Deploy to Avalanche'
          )}
        </button>
      </div>
      
      {/* Gas Estimate Display */}
      {gasEstimate && (
        <div className={`p-3 ${balanceCheckStatus === 'insufficient' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'} border rounded-lg`}>
          <h3 className="text-sm font-medium text-blue-800 mb-2">Estimated Deployment Cost</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-700">Gas Limit:</div>
            <div className="font-mono text-gray-900">{parseInt(gasEstimate.gas).toLocaleString()} units</div>
            
            <div className="text-gray-700">Gas Price:</div>
            <div className="font-mono text-gray-900">
              {/* Ensure gas price is displayed correctly and never shows as 0 */}
              {Number(gasEstimate.gasPrice) > 0 
                ? Number(gasEstimate.gasPrice).toFixed(2) 
                : '25.00'} Gwei
            </div>
            
            <div className="text-gray-700 font-medium">Total Cost:</div>
            <div className="font-mono text-gray-900 font-medium">
              {/* Ensure cost is displayed correctly and never shows as 0 */}
              {Number(gasEstimate.totalCost) > 0 
                ? Number(gasEstimate.totalCost).toFixed(6) 
                : (Number(gasEstimate.gas) * 25 * 1e-9).toFixed(6)} AVAX
            </div>
            
            {/* Balance Comparison */}
            {avaxBalance && (
              <>
                <div className="text-gray-700">Your Balance:</div>
                <div className={`font-mono ${balanceCheckStatus === 'insufficient' ? 'text-yellow-700' : 'text-green-700'}`}>
                  {parseFloat(avaxBalance.avax).toFixed(6)} AVAX
                </div>
              </>
            )}
          </div>
          
          {balanceCheckStatus === 'insufficient' && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md text-xs text-yellow-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Your current balance appears to be insufficient for this deployment. 
                Consider adding more funds to your wallet or using the Fuji testnet.
              </span>
            </div>
          )}
          
          <p className="mt-2 text-xs text-gray-600">
            Note: Actual gas usage may vary slightly during deployment. A 10% buffer is recommended.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
          
          {/* Common troubleshooting tips */}
          <div className="ml-8 mt-2">
            <p className="text-sm text-red-600 font-medium">Troubleshooting tips:</p>
            <ul className="list-disc list-inside text-xs text-red-600 mt-1 space-y-1">
              <li>Make sure you're connected to the correct network (Avalanche Fuji)</li>
              <li>Verify that your wallet has enough AVAX for gas fees</li>
              <li>Check that all constructor arguments are correctly formatted</li>
              <li>For complex contracts, try increasing gas limit</li>
              <li>If you received a transaction error, check your MetaMask activity for details</li>
            </ul>
          </div>
        </div>
      )}

      {/* Deployment Success */}
      {deploymentStatus === 'success' && deployedAddress && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800 font-medium">Contract deployed successfully!</p>
          </div>
          <p className="text-sm text-gray-700 mb-1">Contract Address:</p>
          <p className="font-mono text-sm bg-white p-2 rounded border border-gray-300 break-all mb-3">
            {deployedAddress}
          </p>
          <a
            href={getExplorerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            View on Snowtrace
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      )}

      {/* Deployment Steps Help */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Deployment Steps:</h3>
        <ol className="text-xs text-gray-600 space-y-1 pl-5 list-decimal">
          <li>Select the Avalanche network (Fuji Testnet recommended for testing)</li>
          <li>Connect your MetaMask wallet</li>
          <li>Compile your contract using our backend service</li>
          {constructorInputs.length > 0 && <li>Fill in the constructor arguments for your contract</li>}
          <li>Estimate the gas cost to preview deployment expenses</li>
          <li>Ensure you have sufficient AVAX balance for deployment</li>
          <li>Deploy to the selected Avalanche network</li>
          <li>View and interact with your contract on Snowtrace</li>
        </ol>
      </div>
    </div>
  )
}