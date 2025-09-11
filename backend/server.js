const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'AI Avalanche Copilot Backend is running!' });
});

// Contract Generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert Solidity smart contract developer for Avalanche blockchain. 
          Generate secure, gas-efficient Solidity contracts using OpenZeppelin standards when applicable.
          Always include proper comments and follow best practices.
          For ERC-20 tokens, use OpenZeppelin's ERC20 implementation.
          For NFTs, use ERC721 or ERC1155 standards.
          Include necessary imports and pragma statements.
          Make contracts deployment-ready for Avalanche C-Chain.`
        },
        {
          role: "user",
          content: `Generate a Solidity smart contract for: ${prompt}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const contractCode = completion.choices[0].message.content;

    res.json({
      success: true,
      contractCode: contractCode,
      prompt: prompt
    });

  } catch (error) {
    console.error('Error generating contract:', error);
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert Solidity code analyst. 
          Explain smart contracts in clear, simple English.
          Focus on:
          1. What the contract does (main purpose)
          2. Key functions and their purposes
          3. Security features and potential risks
          4. Gas optimization considerations
          5. Integration possibilities
          Keep explanations beginner-friendly but technically accurate.`
        },
        {
          role: "user",
          content: `Please explain this Solidity smart contract:\n\n${contractCode}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.2
    });

    const explanation = completion.choices[0].message.content;

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
