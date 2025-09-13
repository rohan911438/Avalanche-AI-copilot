// api/clean-contract/route.js
// API endpoint to clean contract code and prepare it for compilation

import { NextResponse } from 'next/server';
import { cleanSolidityCode } from '../../../utils/codeUtils';

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'No code provided' },
        { status: 400 }
      );
    }
    
    // Clean the code to remove markdown artifacts
    const cleanedCode = cleanSolidityCode(code);
    
    // We'll skip the transformation step since it requires backend access
    // Instead, we'll rely on the backend to do any transformations
    
    return NextResponse.json({
      success: true, 
      cleanedCode,
      hasImports: cleanedCode.includes('import ')
    });
  } catch (error) {
    console.error('Error cleaning contract code:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process contract code' },
      { status: 500 }
    );
  }
}