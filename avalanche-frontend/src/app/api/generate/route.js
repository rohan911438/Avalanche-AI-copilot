// api/generate/route.js
// API endpoint to generate smart contracts using Google's Gemini AI

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configure the runtime to use Node.js instead of Edge
export const runtime = 'nodejs';

// Initialize Gemini AI with the API key
const GEMINI_API_KEY = 'AIzaSyDo4hQFNGIeuY3B8qiBoKxi_DoegvJJbCU';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 8192,
  }
});

export async function POST(request) {
  console.log('Generate endpoint hit');
  
  try {
    const { prompt } = await request.json();
    console.log('Request body received:', { prompt: prompt ? `${prompt.substring(0, 50)}...` : 'undefined' });

    if (!prompt) {
      console.log('No prompt provided');
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('Generating contract for:', prompt.substring(0, 50) + '...');

    const systemPrompt = `You are a Solidity smart contract expert. Generate a secure smart contract for Avalanche blockchain.

Request: ${prompt}

Include:
- SPDX license and pragma solidity ^0.8.0;
- When using OpenZeppelin contracts, use these local imports:
  import "./Ownable.sol"; 
  import "./ReentrancyGuard.sol";
  import "./Pausable.sol";
- Available OpenZeppelin contracts: Ownable, ReentrancyGuard, Pausable
- Clear comments and documentation
- Basic security practices
- Use payable(address) when transferring ETH to addresses

Generate only Solidity code:`;

    console.log('Calling Gemini API...');
    
    try {
      // Try with the primary model
      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const contractCode = response.text();
      
      console.log('Contract generated successfully');
      return NextResponse.json({
        success: true,
        contractCode: contractCode,
        prompt: prompt
      });
    } catch (modelError) {
      console.error('Primary model error:', modelError.message);
      
      // If the model is overloaded, try with a fallback model
      if (modelError.message.includes('overloaded')) {
        console.log('Model overloaded, trying with fallback model gemini-1.5-pro...');
        try {
          const fallbackModel = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-pro',
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 8192,
            }
          });
          
          const fallbackResult = await fallbackModel.generateContent(systemPrompt);
          const fallbackResponse = await fallbackResult.response;
          const fallbackContractCode = fallbackResponse.text();
          
          console.log('Contract generated successfully with fallback model');
          return NextResponse.json({
            success: true,
            contractCode: fallbackContractCode,
            prompt: prompt,
            note: "Generated using fallback model due to high demand"
          });
        } catch (fallbackError) {
          console.error('Fallback model error:', fallbackError.message);
          return NextResponse.json({
            error: 'Models currently unavailable due to high demand',
            message: 'Both primary and fallback models are overloaded. Please try again in a few minutes.',
            technicalDetails: fallbackError.message
          }, { status: 503 });
        }
      }
      
      throw modelError; // Re-throw if not an overload issue
    }
  } catch (error) {
    console.error('Error in generate endpoint:', error.message);
    
    // Provide a more user-friendly error message based on the error type
    let statusCode = 500;
    let errorMessage = 'Failed to generate contract';
    
    if (error.message.includes('API key')) {
      statusCode = 401;
      errorMessage = 'API key issue. Please check your Gemini API key.';
    } else if (error.message.includes('overloaded') || error.message.includes('unavailable')) {
      statusCode = 503;
      errorMessage = 'AI service temporarily unavailable due to high demand. Please try again later.';
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      statusCode = 504;
      errorMessage = 'Request timed out. The AI service took too long to respond.';
    }
    
    return NextResponse.json({
      error: errorMessage,
      message: error.message
    }, { status: statusCode });
  }
}