const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({ 
    message: 'AI Avalanche Copilot Backend is running!',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/generate', '/api/explain']
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Simple test endpoint for Gemini API
app.get('/test', async (req, res) => {
  try {
    console.log('Testing Gemini API...');
    const result = await model.generateContent('Say hello in one word');
    const response = await result.response;
    const text = response.text();
    console.log('Gemini test successful:', text);
    res.json({ success: true, text: text });
  } catch (error) {
    console.error('Gemini test failed:', error);
    res.status(500).json({ error: error.message, details: error.toString() });
  }
});

// Contract Generation endpoint
app.post('/api/generate', async (req, res) => {
  console.log('Generate endpoint hit');
  
  try {
    const { prompt } = req.body;
    console.log('Request body:', req.body);

    if (!prompt) {
      console.log('No prompt provided');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Generating contract for:', prompt);

    const systemPrompt = `You are a Solidity smart contract expert. Generate a secure smart contract for Avalanche blockchain.

Request: ${prompt}

Include:
- SPDX license and pragma
- OpenZeppelin imports when needed  
- Clear comments
- Basic security practices

Generate only Solidity code:`;

    console.log('Calling Gemini API...');
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const contractCode = response.text();

    console.log('Contract generated successfully');
    res.json({
      success: true,
      contractCode: contractCode,
      prompt: prompt
    });

  } catch (error) {
    console.error('Error in generate endpoint:', error.message);
    res.status(500).json({
      error: 'Failed to generate contract',
      message: error.message
    });
  }
});

// Contract Explanation endpoint
app.post('/api/explain', async (req, res) => {
  try {
    const { contractCode } = req.body;

    if (!contractCode) {
      return res.status(400).json({ error: 'Contract code is required' });
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

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const explanation = response.text();

    res.json({
      success: true,
      explanation: explanation,
      contractCode: contractCode
    });

  } catch (error) {
    console.error('Error explaining contract:', error);
    res.status(500).json({
      error: 'Failed to explain contract',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/generate`);
  console.log(`   POST http://localhost:${PORT}/api/explain`);
});
