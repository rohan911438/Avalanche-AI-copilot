// contractUtils.js - Browser-side contract utilities for the frontend

/**
 * Checks if a contract contains import statements
 * @param {string} contractCode - The contract source code
 * @returns {boolean} - Whether the contract contains imports
 */
export function contractHasImports(contractCode) {
  const importRegex = /import\s+["'][^"']+["'];/;
  return importRegex.test(contractCode);
}

/**
 * Extracts imports from contract code
 * @param {string} contractCode - The contract source code
 * @returns {string[]} - Array of import paths
 */
export function extractImports(contractCode) {
  const importRegex = /import\s+["']([^"']+)["'];/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(contractCode)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

/**
 * Shows a notice about import handling in the UI
 * @param {string} contractCode - The contract source code
 * @returns {Object} - Notice information if imports are found
 */
export function getImportNotice(contractCode) {
  const imports = extractImports(contractCode);
  
  if (imports.length === 0) {
    return null;
  }
  
  return {
    hasImports: true,
    count: imports.length,
    message: `This contract contains ${imports.length} import${imports.length > 1 ? 's' : ''}. Our system will automatically inline these dependencies for compilation.`,
    imports: imports
  };
}

/**
 * Formats contract code for display
 * @param {string} contractCode - The contract source code
 * @returns {string} - Formatted contract code with syntax highlighting classes
 */
export function formatContractCode(contractCode) {
  // This is a placeholder - in a real implementation you'd use a syntax highlighting library
  // like highlight.js or prism.js to add proper syntax highlighting
  return contractCode
    .replace(/pragma/g, '<span class="keyword">pragma</span>')
    .replace(/contract/g, '<span class="keyword">contract</span>')
    .replace(/function/g, '<span class="keyword">function</span>')
    .replace(/import/g, '<span class="keyword">import</span>');
}