// api/explain/route.js
// API endpoint to explain smart contracts using Google's Gemini AI

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
  try {
    const { contractCode } = await request.json();

    if (!contractCode) {
      return NextResponse.json({ error: 'Contract code is required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert Solidity smart contract analyst who explains code to developers of all skill levels.

ANALYZE AND EXPLAIN this smart contract in a clear, structured format:

## 📋 CONTRACT OVERVIEW
- **Purpose**: What does this contract do in simple terms?
- **Type**: What kind of contract is this (ERC-20, NFT, DeFi, etc.)?
- **Network**: Avalanche C-Chain compatibility

## 🔧 KEY FUNCTIONS
For each major function, explain:
- **Function Name**: What it does in plain English
- **Who can call it**: Public, only owner, etc.
- **Parameters**: What inputs it needs
- **What happens**: Step-by-step process

## 🛡️ SECURITY FEATURES
- **Access Controls**: Who can do what?
- **Safety Mechanisms**: Built-in protections
- **Potential Risks**: What could go wrong?

## ⚡ GAS & EFFICIENCY
- **Cost Estimates**: Approximate gas usage for main functions
- **Optimization Notes**: How efficient is the code?
- **Performance Tips**: Ways to reduce gas costs

## 🔗 INTEGRATION GUIDE
- **How to interact**: From other contracts or dApps
- **Events emitted**: What events to listen for
- **Common use cases**: Real-world applications
- **Frontend Integration**: How web3 apps would connect

## 💡 BEGINNER TIPS
- **Key concepts**: Important Solidity/blockchain concepts used
- **Learning resources**: What to study to understand this better
- **Next steps**: How a developer might use or modify this

## 🚨 IMPORTANT WARNINGS
- **Potential vulnerabilities**: Security concerns to watch for
- **Testing recommendations**: How to verify this contract works
- **Deployment considerations**: What to check before going live

Use simple language, avoid jargon, provide practical examples, and make it educational for developers learning Avalanche/Solidity.

CONTRACT CODE TO ANALYZE:

${contractCode}`;

    try {
      // Try with the primary model
      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const explanation = response.text();
      
      return NextResponse.json({
        success: true,
        explanation: explanation,
        contractCode: contractCode
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
          const fallbackExplanation = fallbackResponse.text();
          
          console.log('Contract explained successfully with fallback model');
          return NextResponse.json({
            success: true,
            explanation: fallbackExplanation,
            contractCode: contractCode,
            note: "Explained using fallback model due to high demand"
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
    console.error('Error explaining contract:', error);
    
    // Provide a more user-friendly error message based on the error type
    let statusCode = 500;
    let errorMessage = 'Failed to explain contract';
    
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