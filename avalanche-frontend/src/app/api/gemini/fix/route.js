// api/gemini/fix/route.js
// API endpoint to fix Gemini-generated contracts without compiling

import { NextResponse } from 'next/server';

// Configure the runtime to use Node.js instead of Edge
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { contractCode } = await request.json();
    
    if (!contractCode || typeof contractCode !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Contract code is required and must be a string'
      }, { status: 400 });
    }
    
    console.log('Processing Gemini contract without compilation...');
    
    // Since we can't directly use the Gemini processor in Edge runtime,
    // we'll proxy this request to a backend service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/gemini/fix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contractCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        success: false,
        error: errorData.error || 'Processing failed'
      }, { status: response.status });
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      fixedCode: result.fixedCode
    });
    
  } catch (error) {
    console.error('Error fixing Gemini contract:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process contract'
    }, { status: 500 });
  }
}