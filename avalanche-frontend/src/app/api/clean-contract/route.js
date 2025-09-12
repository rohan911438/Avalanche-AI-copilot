// api/clean-contract/route.js
// API endpoint to clean contract code and prepare it for compilation

import { cleanSolidityCode } from '../../../utils/codeUtils';
import { transformContractCode } from '../../../../backend/contractTransformer';

export async function POST(req) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: 'No code provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Clean the code to remove markdown artifacts
    const cleanedCode = cleanSolidityCode(code);
    
    // Transform the code to inline dependencies (optional step)
    let transformedCode = cleanedCode;
    try {
      transformedCode = transformContractCode(cleanedCode);
    } catch (err) {
      console.warn('Code transformation warning:', err);
      // Continue with the cleaned code if transformation fails
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        cleanedCode,
        transformedCode,
        hasImports: cleanedCode.includes('import ') 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error cleaning contract code:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to process contract code' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}