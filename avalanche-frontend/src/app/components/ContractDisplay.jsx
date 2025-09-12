// Implementation for your existing contract display component to include the clean copy functionality
import { useState } from 'react';
import CopyButton from './CopyButton';
import { cleanSolidityCode } from '../utils/codeUtils';

export default function ContractDisplay({ contractCode }) {
  const [showTransformed, setShowTransformed] = useState(false);
  const [transformedCode, setTransformedCode] = useState('');
  const [transforming, setTransforming] = useState(false);
  const [error, setError] = useState(null);

  // Function to transform the code on demand
  const handleTransform = async () => {
    if (transformedCode) {
      setShowTransformed(true);
      return;
    }

    setTransforming(true);
    setError(null);

    try {
      // Clean the code first
      const cleanCode = cleanSolidityCode(contractCode);
      
      // Call the API to transform the code
      const response = await fetch('/api/clean-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transform contract');
      }

      setTransformedCode(data.transformedCode);
      setShowTransformed(true);
    } catch (err) {
      console.error('Transformation error:', err);
      setError(err.message || 'Failed to transform contract');
    } finally {
      setTransforming(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">
          {showTransformed ? 'Transformed Contract' : 'Contract Code'}
        </h2>
        <div className="space-x-2">
          {showTransformed ? (
            <button
              onClick={() => setShowTransformed(false)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded transition-colors"
            >
              Show Original
            </button>
          ) : (
            <button
              onClick={handleTransform}
              disabled={transforming}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
            >
              {transforming ? 'Processing...' : 'Show With Inlined Dependencies'}
            </button>
          )}
          <CopyButton 
            code={showTransformed ? transformedCode : contractCode} 
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-md overflow-hidden">
        <pre className="p-4 overflow-x-auto text-gray-100">
          <code className="language-solidity">
            {showTransformed ? transformedCode : contractCode}
          </code>
        </pre>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-1">Pro Tip</h3>
        <p className="text-sm">
          Always use the "Copy Clean Code" button when copying contracts. It automatically removes 
          markdown formatting and ensures your code is ready for compilation.
        </p>
      </div>
    </div>
  );
}