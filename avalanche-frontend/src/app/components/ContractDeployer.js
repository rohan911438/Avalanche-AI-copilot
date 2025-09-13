'use client'

import { useState, useEffect } from 'react'
import { Loader, AlertCircle, Check, ExternalLink } from 'lucide-react'
import { ethers } from 'ethers'

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

  // Check if MetaMask is installed and wallet is connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          })
          if (accounts.length > 0) {
            setCurrentAccount(accounts[0])
            setWalletConnected(true)
            
            // Check the user's AVAX balance
            await checkAvaxBalance(accounts[0])
          }
          
          // Set up event listeners for account and chain changes
          window.ethereum.on('accountsChanged', handleAccountsChanged)
          window.ethereum.on('chainChanged', handleChainChanged)
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
    
    checkWalletConnection()
    
    // Clean up event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])
  
  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setWalletConnected(false)
      setCurrentAccount('')
      setAvaxBalance(null)
    } else if (accounts[0] !== currentAccount) {
      // Account changed
      setCurrentAccount(accounts[0])
      await checkAvaxBalance(accounts[0])
    }
  }
  
  // Handle chain changes
  const handleChainChanged = async () => {
    // When chain changes, refresh page to ensure consistent state
    // This is recommended by MetaMask
    window.location.reload()
  }
  
  // Fetch and check the user's AVAX balance
  const checkAvaxBalance = async (account) => {
    if (!account) return
    
    try {
      setBalanceCheckStatus('checking')
      
      // Initialize provider
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      
      // Get balance in wei
      const balanceWei = await provider.getBalance(account)
      
      // Convert wei to AVAX
      const balanceAvax = ethers.utils.formatEther(balanceWei)
      
      setAvaxBalance({
        wei: balanceWei.toString(),
        avax: balanceAvax
      })
      
      setBalanceCheckStatus('idle')
      
      // Return the balance for use in other functions
      return {
        wei: balanceWei,
        avax: balanceAvax
      }
    } catch (error) {
      console.error('Error checking AVAX balance:', error)
      setBalanceCheckStatus('idle')
      return null
    }
  }

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask to deploy contracts.')
        return
      }

      setError('')
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      setCurrentAccount(accounts[0])
      setWalletConnected(true)
      
      // Check AVAX balance
      await checkAvaxBalance(accounts[0])
      
      // Check if we're on the right network
      await checkAndSwitchNetwork()
    } catch (error) {
      console.error('Error connecting to wallet:', error)
      setError(`Failed to connect wallet: ${error.message}`)
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

  // Compile the contract using our backend
  const compileContract = async () => {
    try {
      setDeploymentStatus('compiling')
      setError('')
      
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
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      
      // Create a contract factory for estimation
      const factory = new ethers.ContractFactory(
        compiledData.abi, 
        compiledData.bytecode,
        signer
      )
      
      // Get current gas price
      const gasPrice = await provider.getGasPrice()
      
      // Parse constructor arguments if any
      let args = []
      if (constructorArgs.length > 0) {
        args = parseConstructorArgValues()
      }
      
      // Estimate the gas limit for deployment with constructor args if needed
      const deploymentData = constructorArgs.length > 0 
        ? factory.getDeployTransaction(...args)
        : factory.getDeployTransaction()
      
      const estimatedGas = await provider.estimateGas(deploymentData)
      
      // Calculate total cost in AVAX
      const totalWei = gasPrice.mul(estimatedGas)
      const totalAvax = ethers.utils.formatEther(totalWei)
      
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
      
      // Estimate gas if not already estimated
      if (!gasEstimate) {
        const estimateData = await estimateGas()
        if (!estimateData) return // Gas estimation failed
      }
      
      // Check if user has sufficient balance
      const isBalanceSufficient = await checkBalanceSufficiency()
      
      // If balance is insufficient, show warning but allow user to proceed
      if (!isBalanceSufficient) {
        const shouldProceed = window.confirm(
          `Warning: Your AVAX balance (${Number(avaxBalance.avax).toFixed(6)} AVAX) may not be sufficient for this deployment. The estimated cost is ${Number(gasEstimate.totalCost).toFixed(6)} AVAX. Do you want to proceed anyway?`
        )
        
        if (!shouldProceed) {
          return // User chose not to proceed
        }
      }
      
      setDeploymentStatus('deploying')
      
      // Initialize ethers.js provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      
      // Create a contract factory for deployment
      const factory = new ethers.ContractFactory(
        compiledData.abi, 
        compiledData.bytecode,
        signer
      )
      
      // Parse constructor arguments if any
      let args = []
      if (constructorArgs.length > 0) {
        args = parseConstructorArgValues()
      }
      
      // Deploy the contract with constructor arguments if needed
      console.log(`Deploying contract with args:`, args.length > 0 ? args : 'No constructor args')
      
      const contract = constructorArgs.length > 0 
        ? await factory.deploy(...args)
        : await factory.deploy()
      
      // Wait for deployment to finish
      console.log(`Deploying contract...`)
      await contract.deployed()
      
      // Success! Update the state with deployed address
      setDeployedAddress(contract.address)
      setDeploymentStatus('success')
      console.log(`Contract deployed at: ${contract.address}`)
      
    } catch (error) {
      console.error('Error deploying contract:', error)
      setError(`Deployment failed: ${error.message}`)
      setDeploymentStatus('error')
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
    return constructorArgs.map(arg => {
      // Handle different types of arguments
      if (arg.type.includes('int')) {
        // For integer types
        return arg.value // ethers.js will handle the conversion
      } else if (arg.type === 'bool') {
        // For boolean types
        return arg.value === 'true'
      } else if (arg.type === 'address') {
        // For address types
        return arg.value
      } else if (arg.type.includes('[]')) {
        // For array types, parse the JSON
        try {
          return JSON.parse(arg.value)
        } catch (e) {
          console.error(`Failed to parse array value for ${arg.name}:`, e)
          return []
        }
      } else {
        // For string and other types
        return arg.value
      }
    })
  }
  
  // Check if user has sufficient balance for deployment
  const checkBalanceSufficiency = async () => {
    if (!gasEstimate || !avaxBalance) {
      // If we don't have both gas estimate and balance, refresh balance
      if (currentAccount) {
        await checkAvaxBalance(currentAccount)
      }
      
      // If we have gas estimate but no balance, we can't check
      if (!avaxBalance) {
        return false
      }
    }
    
    // Convert both values to BigNumber for safe comparison
    const estimatedCostWei = ethers.BigNumber.from(gasEstimate.totalWei)
    const balanceWei = ethers.BigNumber.from(avaxBalance.wei)
    
    // Add 10% buffer to estimated cost for safety
    const estimatedWithBuffer = estimatedCostWei.mul(110).div(100)
    
    // Compare and set status
    const isBalanceSufficient = balanceWei.gt(estimatedWithBuffer)
    
    setBalanceCheckStatus(isBalanceSufficient ? 'sufficient' : 'insufficient')
    
    return isBalanceSufficient
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
        <button
          onClick={connectWallet}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Connect MetaMask
        </button>
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
            <div className="font-mono text-gray-900">{parseFloat(gasEstimate.gasPrice).toFixed(2)} Gwei</div>
            
            <div className="text-gray-700 font-medium">Total Cost:</div>
            <div className="font-mono text-gray-900 font-medium">{parseFloat(gasEstimate.totalCost).toFixed(6)} AVAX</div>
            
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
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