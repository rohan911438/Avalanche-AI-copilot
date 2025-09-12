// API route for contract compilation that automatically transforms imports
// Save this file to your Next.js API routes folder (e.g., /pages/api/compile-contract.js)

import { transformContractCode } from '../../../backend/contractTransformer';
import { compileContract } from '../../../backend/contractCompiler';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { contractCode } = req.body;
    
    if (!contractCode) {
      return res.status(400).json({ error: 'Contract code is required' });
    }
    
    // Transform the contract code to inline all dependencies
    const transformedCode = transformContractCode(contractCode);
    
    // Compile the transformed contract
    const compilationResult = compileContract(transformedCode);
    
    return res.status(200).json({
      success: true,
      abi: compilationResult.abi,
      bytecode: compilationResult.bytecode,
      transformedCode: transformedCode // Optionally include the transformed code
    });
  } catch (error) {
    console.error('Contract compilation error:', error);
    return res.status(500).json({ 
      error: 'Compilation failed', 
      message: error.message
    });
  }
}