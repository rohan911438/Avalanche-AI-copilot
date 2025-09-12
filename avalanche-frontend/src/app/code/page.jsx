// Example integration of the clean code components into your main page
import ContractGenerator from '../components/ContractGenerator';
import CopyButton from '../components/CopyButton';
import { useState } from 'react';
import { cleanSolidityCode } from '../utils/codeUtils';

export default function CodePage() {
  const [pastedCode, setPastedCode] = useState('');

  // Example function to handle code pasting
  const handleCodePaste = (e) => {
    setPastedCode(e.target.value);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Avalanche Smart Contract Tools</h1>
      
      <div className="mb-12">
        <ContractGenerator />
      </div>
      
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-4">Paste Existing Contract</h2>
        <p className="mb-4">
          Paste your contract code below. Our system will automatically clean the code and handle any imports.
        </p>
        
        <div className="mb-4">
          <textarea
            className="w-full h-64 p-4 border rounded font-mono text-sm"
            placeholder="// Paste your contract code here..."
            value={pastedCode}
            onChange={handleCodePaste}
          />
        </div>
        
        <div className="flex justify-between mb-8">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">
            Compile Contract
          </button>
          
          <CopyButton code={pastedCode} className="ml-2" />
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold mb-2">How the Copy Clean Code Button Works</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Removes markdown formatting like ```solidity and ``` tags</li>
            <li>Trims unnecessary whitespace</li>
            <li>Ensures the code starts with proper Solidity syntax</li>
            <li>Makes the code ready for direct compilation</li>
          </ul>
        </div>
      </div>
    </main>
  );
}