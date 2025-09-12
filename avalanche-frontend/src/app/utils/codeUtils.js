// utils/codeUtils.js
// Utility functions for handling code formatting and cleaning

/**
 * Cleans Solidity code by removing markdown artifacts and formatting
 * @param {string} code - Raw contract code that may contain markdown artifacts
 * @returns {string} - Clean Solidity code
 */
export function cleanSolidityCode(code) {
  // Remove markdown code block backticks and language identifier
  let cleaned = code.replace(/```solidity\n|```\n|```$/g, '');
  
  // Remove any trailing or leading whitespace
  cleaned = cleaned.trim();
  
  // If the code doesn't start with pragma or a comment, it might be invalid
  if (!cleaned.startsWith('pragma') && !cleaned.startsWith('//') && !cleaned.startsWith('/*')) {
    // Try to find the pragma line and start from there
    const pragmaIndex = cleaned.indexOf('pragma');
    if (pragmaIndex > 0) {
      cleaned = cleaned.substring(pragmaIndex);
    }
    
    // If no pragma, try to find SPDX line
    const spdxIndex = cleaned.indexOf('// SPDX');
    if (pragmaIndex < 0 && spdxIndex > 0) {
      cleaned = cleaned.substring(spdxIndex);
    }
  }
  
  return cleaned;
}

/**
 * Extracts code blocks from markdown text
 * @param {string} markdown - Markdown text that may contain code blocks
 * @param {string} language - Language identifier to look for (e.g., 'solidity')
 * @returns {string} - Extracted code or original text if no code blocks found
 */
export function extractCodeFromMarkdown(markdown, language = null) {
  if (!markdown) return '';
  
  // Pattern for code blocks with or without language specifier
  const codeBlockRegex = language 
    ? new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\\n\`\`\``, 'g')
    : /```(?:\w*)\n([\s\S]*?)\n```/g;
  
  let match;
  let extractedCode = '';
  
  // Extract all code blocks and concatenate them
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    extractedCode += match[1] + '\n\n';
  }
  
  // If we found code blocks, return the extracted code
  if (extractedCode) {
    return extractedCode.trim();
  }
  
  // If no code blocks found, return the original text
  // This could happen if the code wasn't properly formatted with markdown
  return markdown;
}

/**
 * Formats code for display with syntax highlighting classes
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @returns {string} - HTML with syntax highlighting classes
 */
export function formatCodeForDisplay(code, language = 'solidity') {
  // This is a very basic implementation
  // In a real app, use a library like highlight.js or Prism
  
  if (language === 'solidity') {
    return code
      .replace(/\b(pragma|contract|function|import|address|uint|string|bool|mapping|struct|enum|event|modifier|public|private|external|internal|pure|view|payable|memory|storage|calldata)\b/g, '<span class="keyword">$1</span>')
      .replace(/\/\/(.*?)$/gm, '<span class="comment">//$1</span>')
      .replace(/\/\*([\s\S]*?)\*\//g, '<span class="comment">/*$1*/</span>');
  }
  
  // Default formatting for other languages
  return code;
}