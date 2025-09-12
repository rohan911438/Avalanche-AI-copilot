import { useState } from 'react';

/**
 * Utility function to clean Solidity code from markdown artifacts
 * @param {string} code - The code that might contain markdown artifacts
 * @returns {string} - Clean Solidity code
 */
export function cleanSolidityCode(code) {
  if (!code) return '';
  
  // Remove markdown code block markers
  let cleanedCode = code.replace(/```solidity|```/g, '');
  
  // Trim whitespace
  cleanedCode = cleanedCode.trim();
  
  return cleanedCode;
}

/**
 * Component that renders a clean copy button for Solidity code
 */
export default function CleanCodeButton({ code, buttonText = "Copy Clean Code" }) {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    const cleanCode = cleanSolidityCode(code);
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopyClick}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      {copied ? "Copied!" : buttonText}
    </button>
  );
}