// api/deploy/compile/route.js
// API endpoint for compiling contracts before deployment using Hardhat

import { NextResponse } from 'next/server';

// Configure the runtime to use Node.js instead of Edge
export const runtime = 'nodejs';

// We need to create a wrapper function for compileContractWithHardhat
// since we can't directly import Node.js modules that are not compatible with Edge runtime
export async function POST(request) {
  try {
    console.log('Contract compilation request received');
    const { contractCode, contractName = 'TempContract.sol' } = await request.json();

    if (!contractCode) {
      console.log('No contract code provided in request');
      return NextResponse.json({ error: 'Contract code is required' }, { status: 400 });
    }

    console.log('Contract code received, length:', contractCode.length);
    console.log('First 100 chars of contract:', contractCode.substring(0, 100));
    
    // Since we can't directly use the Hardhat compiler in Edge runtime,
    // we'll proxy this request to a backend service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    let response;
    try {
      response = await fetch(`${backendUrl}/api/deploy/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractCode, contractName }),
        timeout: 60000, // 60 second timeout for compilation operations
      });
    } catch (fetchError) {
      console.error('Network error when connecting to backend:', fetchError);
      return NextResponse.json({
        success: false,
        error: `Backend service connection failed: ${fetchError.message}`
      }, { status: 503 }); // Service Unavailable
    }

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        success: false,
        error: errorData.error || 'Compilation failed'
      }, { status: response.status });
    }
    
    const compilationResult = await response.json();
    
    return NextResponse.json({
      success: true,
      abi: compilationResult.abi,
      bytecode: compilationResult.bytecode
    });

  } catch (error) {
    console.error('Error in contract compilation:', error.message);
    return NextResponse.json({
      error: 'Failed to compile contract',
      message: error.message
    }, { status: 500 });
  }
}