// API route for contract compilation using App Router format
// This route sends the contract code to the backend service for compilation

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the request body
    const { contractCode } = await request.json();
    
    if (!contractCode) {
      return NextResponse.json(
        { error: 'Contract code is required' },
        { status: 400 }
      );
    }
    
    // Define the backend service URL
    // Get the URL from environment variables
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    console.log(`Using backend URL: ${backendUrl}`);
    
    // Send the contract to the backend for compilation
    const response = await fetch(`${backendUrl}/api/deploy/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contractCode }),
    });
    
    // Parse the response
    const compilationResult = await response.json();
    
    // Check if compilation was successful
    if (!response.ok || !compilationResult.success) {
      const errorMessage = compilationResult.error || 
        compilationResult.message || 
        'Unknown compilation error';
      
      // Format Solidity error messages for better readability
      let formattedError = errorMessage;
      if (errorMessage.includes('SolcError') || errorMessage.includes('DeclarationError')) {
        // Try to extract the specific error lines from complex Solidity errors
        const errorLines = errorMessage.split('\n').filter(line => 
          line.includes('Error:') || 
          line.includes('DeclarationError:') ||
          line.includes('TypeError:')
        );
        
        if (errorLines.length > 0) {
          formattedError = errorLines.join('\n');
        }
      }
        
      return NextResponse.json(
        { 
          success: false,
          error: formattedError,
          details: errorMessage // Include full error details for debugging
        },
        { status: 400 }
      );
    }
    
    // Return the successful result
    return NextResponse.json({
      success: true,
      abi: compilationResult.abi,
      bytecode: compilationResult.bytecode
    });
    
  } catch (error) {
    console.error('Contract compilation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}