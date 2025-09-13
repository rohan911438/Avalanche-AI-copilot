'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for ethers to avoid server-side rendering issues
const ethers = dynamic(() => import('ethers'), { ssr: false });

const GeminiContractProcessor = () => {
  const [contractCode, setContractCode] = useState('');
  const [fixedCode, setFixedCode] = useState('');
  const [abi, setAbi] = useState(null);
  const [bytecode, setBytecode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  
  // Function to just fix the contract without compiling
  const handleFix = async () => {
    if (!contractCode.trim()) {
      setError('Please enter contract code first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setStatus('Fixing contract...');
    
    try {
      const response = await fetch('/api/gemini/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix contract');
      }
      
      setFixedCode(data.fixedCode);
      setStatus('Contract fixed successfully! You can now compile it.');
      
    } catch (err) {
      console.error('Error fixing contract:', err);
      setError(err.message || 'Failed to fix contract');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fix and compile the contract
  const handleCompile = async () => {
    if (!contractCode.trim()) {
      setError('Please enter contract code first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setStatus('Processing and compiling contract...');
    setAbi(null);
    setBytecode(null);
    
    try {
      const response = await fetch('/api/gemini/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to compile contract');
      }
      
      // Set the fixed code
      if (data.result && data.result.fixedCode) {
        setFixedCode(data.result.fixedCode);
      }
      
      // Set the compilation results
      if (data.result) {
        setAbi(data.result.abi);
        setBytecode(data.result.bytecode);
        setStatus('Contract compiled successfully!');
      }
      
    } catch (err) {
      console.error('Error compiling contract:', err);
      setError(err.message || 'Failed to compile contract');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Gemini Contract Processor</h1>
      <p className="mb-4 text-gray-700">
        Paste a smart contract from Gemini to fix common issues and compile it automatically.
      </p>
      
      {/* Input area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paste contract code from Gemini:
        </label>
        <textarea
          className="w-full h-60 p-2 border border-gray-300 rounded-md font-mono text-sm"
          value={contractCode}
          onChange={(e) => setContractCode(e.target.value)}
          placeholder="// Paste your Gemini-generated contract here..."
        />
      </div>
      
      {/* Button row */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleFix}
          disabled={isLoading || !contractCode.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Fix Contract Only'}
        </button>
        
        <button
          onClick={handleCompile}
          disabled={isLoading || !contractCode.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Fix & Compile Contract'}
        </button>
      </div>
      
      {/* Status and error messages */}
      {status && <p className="mb-4 text-green-600">{status}</p>}
      {error && <p className="mb-4 text-red-600">Error: {error}</p>}
      
      {/* Fixed code output */}
      {fixedCode && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Fixed Contract Code:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm font-mono">
            {fixedCode}
          </pre>
        </div>
      )}
      
      {/* Compilation results */}
      {abi && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Compilation Successful!</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-1">ABI:</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm font-mono">
              {JSON.stringify(abi, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-1">Bytecode:</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-40 text-sm font-mono">
              {bytecode?.substring(0, 100)}...
              <span className="text-gray-500">(truncated)</span>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiContractProcessor;