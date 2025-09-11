# 🚀 Quick Start Guide - AI Avalanche Copilot MVP

## What You Have Now ✅

✅ **Backend API** (Node.js + Express + OpenAI)
✅ **Frontend Interface** (Next.js + React + Tailwind)
✅ **Core Features**: Contract Generation & Explanation
✅ **Professional UI** with syntax highlighting

## 🏃‍♂️ Getting Started (5 minutes)

### Step 1: Setup OpenAI API Key
1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Edit `backend/.env` file:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 2: Start Backend Server
```bash
cd backend
npm run dev
```
✅ Should show: "🚀 Server running on port 3001"

### Step 3: Start Frontend (New Terminal)
```bash
cd avalanche-frontend  
npm run dev
```
✅ Should show: "Ready - started server on 0.0.0.0:3000"

### Step 4: Test Your MVP
1. Open http://localhost:3000
2. Try generating a contract: "Create an ERC-20 token with name 'TestCoin'"
3. Try explaining a contract by pasting Solidity code

## 🎯 Demo Scenarios (For Presentation)

### Scenario 1: ERC-20 Token Generation
- **Input**: "Create an ERC-20 token with name 'HackathonCoin' and symbol 'HACK' with 1,000,000 total supply"
- **Expected**: Complete Solidity contract with OpenZeppelin imports

### Scenario 2: NFT Contract Generation  
- **Input**: "Create a simple NFT contract for digital art collectibles"
- **Expected**: ERC-721 contract with minting functionality

### Scenario 3: Contract Explanation
- **Input**: Paste any ERC-20 or NFT contract code
- **Expected**: Plain English explanation of functions and purpose

## 🛠️ Troubleshooting

**Frontend won't connect to backend?**
- Check backend is running on port 3001
- Check CORS is enabled in backend/server.js

**OpenAI API errors?**
- Verify your API key is correct in backend/.env
- Check you have sufficient OpenAI credits

**Dependency issues?**
- Run `npm install` in both frontend and backend directories

## 🚀 Next Steps for Full Product

After your MVP demo, you can expand with:
1. **Contract Deployment** to Avalanche Fuji Testnet
2. **User Authentication** and saved contracts
3. **More Contract Templates** (DeFi, GameFi, etc.)
4. **Integration** with MetaMask wallet
5. **Production Deployment** to Vercel/Railway

## 📁 Project Structure
```
Avalanche/
├── avalanche-frontend/     # React/Next.js app
├── backend/               # Node.js API server  
├── MVP_PLAN.md           # Development roadmap
├── README.md             # Project documentation
└── QUICKSTART.md         # This guide
```

## 🎉 You're Ready!

Your 24-hour MVP is complete and demo-ready! 

**Time to completion**: ~4-6 hours of focused work
**Demo duration**: 5-10 minutes showcasing both features
**Wow factor**: AI-generated Solidity contracts in seconds

Good luck with your presentation! 🏆
