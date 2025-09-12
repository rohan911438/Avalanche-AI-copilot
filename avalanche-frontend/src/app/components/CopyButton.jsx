// Simplified CopyButton component
import React, { useState } from 'react';
import { cleanSolidityCode } from '../utils/codeUtils';

export default function CopyButton({ code, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Clean the code before copying
    const cleanedCode = cleanSolidityCode(code);
    
    // Copy to clipboard
    navigator.clipboard.writeText(cleanedCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy code. Please try again.');
      });
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors ${className}`}
      aria-label="Copy clean code to clipboard"
    >
      {copied ? 'Copied!' : 'Copy Clean Code'}
    </button>
  );
}