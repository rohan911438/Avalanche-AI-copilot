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
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
    
    checkWalletConnection()
  }, [])

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
      
      // Estimate the gas limit for deployment
      const deploymentData = factory.getDeployTransaction()
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
        
        // Add confirmation step here if needed
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
      
      // Deploy the contract
      const contract = await factory.deploy()
      
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
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="font-medium text-gray-700">Connected:</span>
          <span className="text-gray-500 truncate">
            {currentAccount.substring(0, 6)}...{currentAccount.substring(38)}
          </span>
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
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Estimated Deployment Cost</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-700">Gas Limit:</div>
            <div className="font-mono text-gray-900">{parseInt(gasEstimate.gas).toLocaleString()} units</div>
            
            <div className="text-gray-700">Gas Price:</div>
            <div className="font-mono text-gray-900">{parseFloat(gasEstimate.gasPrice).toFixed(2)} Gwei</div>
            
            <div className="text-gray-700 font-medium">Total Cost:</div>
            <div className="font-mono text-gray-900 font-medium">{parseFloat(gasEstimate.totalCost).toFixed(6)} AVAX</div>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Note: Actual gas usage may vary slightly during deployment.
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
          <li>Estimate the gas cost to preview deployment expenses</li>
          <li>Deploy to the selected Avalanche network</li>
          <li>View and interact with your contract on Snowtrace</li>
        </ol>
      </div>
    </div>
  )
}