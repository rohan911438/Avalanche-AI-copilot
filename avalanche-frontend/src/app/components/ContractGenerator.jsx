// Components/ContractGenerator.jsx
// This component handles AI-generated contract code with proper formatting and clean copying

import { useState } from 'react';
import CleanCodeBlock from './CleanCodeBlock';
import { transformContractCode } from '../../../backend/contractTransformer';

export default function ContractGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [transformedCode, setTransformedCode] = useState('');
  const [error, setError] = useState(null);

  // Handle generate button click
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      // Call your AI generation API
      const response = await fetch('/api/generate-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate contract');
      }
      
      // Process the generated code to remove markdown artifacts
      let rawCode = data.generatedCode;
      setGeneratedCode(rawCode);
      
      // Also prepare a transformed version with inlined dependencies
      try {
        // This would be handled by your backend in production
        // For the frontend example, we're using a placeholder
        setTransformedCode(
          `// This is where the auto-transformed code would appear\n// In production, we would call the transformContractCode function`
        );
      } catch (err) {
        console.warn('Code transformation warning:', err);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate contract');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Smart Contract Generator</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Describe the contract you need
        </label>
        <textarea
          className="w-full h-32 p-2 border rounded"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., Create a simple ERC20 token with restricted transfers"
        />
      </div>
      
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        onClick={handleGenerate}
        disabled={generating || !prompt.trim()}
      >
        {generating ? 'Generating...' : 'Generate Contract'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {generatedCode && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Generated Contract</h2>
          <p className="mb-4 text-sm text-gray-600">
            Click "Copy Clean Code" to get compilable code without markdown formatting.
          </p>
          
          <CleanCodeBlock code={generatedCode} language="solidity" />
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold mb-2">Important Note</h3>
            <p>
              If the contract uses external imports, our system will automatically inline the dependencies
              during compilation. You don't need to modify the code.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}