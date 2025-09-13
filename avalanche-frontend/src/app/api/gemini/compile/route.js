// api/gemini/compile/route.js
// API endpoint to process and compile Gemini-generated contracts

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { contractCode } = await request.json();
    
    if (!contractCode || typeof contractCode !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Contract code is required and must be a string'
      }, { status: 400 });
    }
    
    console.log('Received contract code from Gemini. Processing...');
    
    // Since we can't directly use the Gemini processor in Edge runtime,
    // we'll proxy this request to a backend service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/gemini/compile`, {
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
        error: errorData.error || 'Processing failed',
        fixedCode: errorData.fixedCode
      }, { status: response.status });
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      result: {
        abi: result.result.abi,
        bytecode: result.result.bytecode,
        fixedCode: result.result.fixedCode
      }
    });
    
  } catch (error) {
    console.error('Error processing Gemini contract:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process contract'
    }, { status: 500 });
  }
}