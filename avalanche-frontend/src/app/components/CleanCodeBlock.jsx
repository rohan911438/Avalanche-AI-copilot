// Components/CleanCodeBlock.jsx
// This component displays code with a "Copy Clean Code" button that copies only the actual code without markdown

import { useState } from 'react';

export default function CleanCodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  // Function to clean the code before copying
  const cleanCode = (rawCode) => {
    // Remove markdown code block backticks
    let cleaned = rawCode.replace(/```[a-z]*\n|```$/g, '');
    
    // Remove any trailing or leading whitespace
    cleaned = cleaned.trim();
    
    // If the code doesn't start with expected content for Solidity
    if (language === 'solidity' && !cleaned.startsWith('//') && !cleaned.startsWith('pragma')) {
      // Try to find the pragma or SPDX line and start from there
      const pragmaIndex = cleaned.indexOf('pragma');
      const spdxIndex = cleaned.indexOf('// SPDX');
      
      const startIndex = Math.min(
        pragmaIndex >= 0 ? pragmaIndex : Infinity,
        spdxIndex >= 0 ? spdxIndex : Infinity
      );
      
      if (startIndex !== Infinity) {
        cleaned = cleaned.substring(startIndex);
      }
    }
    
    return cleaned;
  };

  // Handle copy button click
  const handleCopy = () => {
    const cleanedCode = cleanCode(code);
    
    navigator.clipboard.writeText(cleanedCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  return (
    <div className="relative">
      <pre className="bg-gray-800 text-gray-100 rounded-md p-4 overflow-x-auto">
        <code className={language ? `language-${language}` : ''}>
          {code}
        </code>
      </pre>
      
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm transition-colors"
      >
        {copied ? 'Copied!' : 'Copy Clean Code'}
      </button>
    </div>
  );
}