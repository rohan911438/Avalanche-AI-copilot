// api-gemini-processor.js
// API endpoint that preprocesses and compiles Gemini-generated contracts

const express = require('express');
const router = express.Router();
const { fixGeminiContract } = require('../gemini-contract-fixer');
// Import both compilers for flexibility
const { compileContract } = require('../contractCompiler');
const { compileContractWithHardhat } = require('../hardhatCompiler');

/**
 * API endpoint to process and compile Gemini-generated contracts
 * POST /api/gemini/compile
 * Body: { contractCode: "..." }
 * Returns: { success: true/false, result: { abi, bytecode } }
 */
router.post('/compile', async (req, res) => {
  try {
    const { contractCode } = req.body;
    
    if (!contractCode || typeof contractCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Contract code is required and must be a string'
      });
    }
    
    console.log('Received contract code from Gemini. Processing...');
    
    // Step 1: Fix common issues in Gemini-generated contracts
    const fixedCode = fixGeminiContract(contractCode);
    
    // Step 2: Compile the fixed contract using hardhat for better error messages
    console.log('Compiling fixed contract with Hardhat...');
    const compilationResult = await compileContractWithHardhat(fixedCode);
    
    if (!compilationResult.success) {
      return res.status(400).json({ 
        success: false,
        error: compilationResult.error || 'Compilation failed',
        fixedCode: fixedCode // Include the fixed code so user can see what was attempted
      });
    }
    
    // Step 3: Return the compilation result
    return res.json({
      success: true,
      result: {
        abi: compilationResult.abi,
        bytecode: compilationResult.bytecode,
        fixedCode: fixedCode  // Include the fixed code for reference
      }
    });
    
  } catch (error) {
    console.error('Error processing Gemini contract:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process contract'
    });
  }
});

/**
 * API endpoint to just fix Gemini-generated contracts without compiling
 * POST /api/gemini/fix
 * Body: { contractCode: "..." }
 * Returns: { success: true, fixedCode: "..." }
 */
router.post('/fix', (req, res) => {
  try {
    const { contractCode } = req.body;
    
    if (!contractCode || typeof contractCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Contract code is required and must be a string'
      });
    }
    
    console.log('Processing Gemini contract without compilation...');
    const fixedCode = fixGeminiContract(contractCode);
    
    return res.json({
      success: true,
      fixedCode: fixedCode
    });
    
  } catch (error) {
    console.error('Error fixing Gemini contract:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process contract'
    });
  }
});

// Keep the old endpoint for backward compatibility
router.post('/compile-gemini-contract', async (req, res) => {
  try {
    const { contractCode } = req.body;
    
    if (!contractCode || typeof contractCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Contract code is required and must be a string'
      });
    }
    
    console.log('Received contract code from Gemini (legacy endpoint). Processing...');
    
    // Step 1: Fix common issues in Gemini-generated contracts
    const fixedCode = fixGeminiContract(contractCode);
    
    // Step 2: Compile the fixed contract
    console.log('Compiling fixed contract...');
    const compilationResult = compileContract(fixedCode);
    
    // Step 3: Return the compilation result
    return res.json({
      success: true,
      result: {
        abi: compilationResult.abi,
        bytecode: compilationResult.bytecode,
        fixedCode: fixedCode  // Include the fixed code for reference
      }
    });
    
  } catch (error) {
    console.error('Error processing Gemini contract:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process contract'
    });
  }
});

module.exports = router;