# AI Avalanche Copilot 🏔️

An intelligent web-based developer assistant that simplifies Avalanche blockchain development by providing AI-powered smart contract explanation, generation, and deployment capabilities.

## 🚀 Overview

The AI Avalanche Copilot addresses the steep learning curve faced by developers entering the Avalanche ecosystem. It provides three core functionalities:

- **📖 Contract Explainer**: Understand existing smart contracts through AI-powered plain English explanations
- **⚡ Contract Generator**: Generate secure Solidity contracts from natural language descriptions
- **🚀 Contract Deployment**: Seamlessly deploy contracts to Avalanche Fuji Testnet with one click

## 🎯 Problem Statement

New Avalanche developers often struggle with:
- Understanding complex Solidity code in existing contracts
- Creating secure smart contracts without extensive boilerplate knowledge
- Setting up and configuring deployment tools (Hardhat, AvalancheJS, RPC endpoints)
- Manual deployment processes that are error-prone

## 💡 Solution

Our AI-powered copilot streamlines the entire development workflow:

### 1. Contract Explainer
- **Input**: Solidity code or Avalanche contract address
- **Process**: AI analyzes the code using Gemini AI
- **Output**: Plain English explanation highlighting functions, permissions, and risks

### 2. Contract Generator
- **Input**: Natural language request (e.g., "Create an ERC-20 token with 1M supply")
- **Process**: AI generates secure Solidity using Gemini AI with OpenZeppelin standards
- **Output**: Clean, editable contract code in web editor

### 3. Contract Deployment
- **Input**: Generated or modified contract code
- **Process**: Compiles with solc.js, deploys via ethers.js and MetaMask
- **Output**: Contract address and Snowtrace explorer link

## ✨ Features Added

- **Contract Generation**: Create Solidity contracts from natural language prompts
- **Contract Explanation**: Get detailed explanations of complex Solidity code
- **Contract Deployment**: Deploy contracts directly to Avalanche networks
- **MetaMask Integration**: Connect your wallet to sign and pay for deployment transactions
- **Network Selection**: Choose between Fuji Testnet and Mainnet for deployment
- **Snowtrace Explorer Integration**: View deployed contracts on the blockchain explorer
- **OpenZeppelin Integration**: Use of vendored OpenZeppelin contracts for security and standardization

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Blockchain     │
│ (React/Next.js) │◄──►│   (Node.js)     │◄──►│   Avalanche     │
│   + Tailwind    │    │   + Gemini AI   │    │  Fuji Testnet   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Stack
- **Framework**: React/Next.js
- **Styling**: Tailwind CSS
- **Blockchain Integration**: ethers.js, MetaMask
- **Features**: Chat interface, code editor, deployment dashboard

### Backend Stack
- **API**: Node.js/Express
- **AI Integration**: Google Gemini AI
- **Compilation**: solc.js
- **Code Highlighting**: react-syntax-highlighter

### Blockchain Integration
- **Network**: Avalanche Fuji Testnet and C-Chain Mainnet
- **Explorer**: Snowtrace for transaction verification
- **Standards**: OpenZeppelin for secure contract templates

## 🛠️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/explain` | POST | Analyze and explain smart contract code |
| `/api/generate` | POST | Generate Solidity contract from description |
| `/api/deploy/compile` | POST | Compile contract and return ABI and bytecode |

## 📱 Example Workflow

1. **Generate Contract**
   ```
   User: "Create an ERC-20 token named HackathonCoin with 1M supply"
   System: AI generates → Displays Solidity in editor
   ```

2. **Explain Contract**
   ```
   User: Pastes complex Solidity code
   System: AI analyzes → "This is an ERC-20 contract with mint/burn functions..."
   ```

3. **Deploy Contract**
   ```
   User: Connects MetaMask → Clicks "Deploy" button
   System: Compiles → User signs transaction → "Contract deployed at 0xXYZ456. View on Snowtrace"
   ```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Google Gemini API key
- MetaMask browser extension for deployment
- AVAX tokens for deployment (use the [Avalanche Faucet](https://faucet.avax.network/) for Fuji Testnet)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rohan911438/Avalanche-AI-copilot.git
   cd Avalanche-AI-copilot
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure backend environment variables**
   ```bash
   # Create/edit .env file in the backend directory
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3001
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../avalanche-frontend
   npm install
   ```

### Starting the Application

1. **Start the backend server**
   ```bash
   # From the backend directory
   node server.js
   ```
   The server will start on port 3001 (or the port specified in your .env file).
   You should see: "🚀 Server running on port 3001"

2. **Start the frontend development server**
   ```bash
   # From the avalanche-frontend directory
   npm run dev
   ```
   The frontend will be available at [http://localhost:3000](http://localhost:3000)

### Using the Application

1. **Generate a Contract**:
   - Navigate to the "Generate" tab
   - Enter a description of the contract you want to create
   - Click "Generate Contract"

2. **Explain a Contract**:
   - Navigate to the "Explain" tab
   - Paste the Solidity code you want to analyze
   - Click "Explain Contract"

3. **Deploy a Contract**:
   - Navigate to the "Deploy" tab
   - Ensure you have a contract ready (either generated or pasted)
   - Connect your MetaMask wallet
   - Select the network (Fuji Testnet recommended for testing)
   - Click "Compile Contract" and then "Deploy to Avalanche"
   - Confirm the transaction in MetaMask
   - View your deployed contract on Snowtrace

### Troubleshooting

**Backend won't start**:
- Ensure you have installed all dependencies: `npm install`
- Verify your .env file contains the required GEMINI_API_KEY
- Check if the port is already in use

**MetaMask Connection Issues**:
- Ensure MetaMask is installed and unlocked
- Add Avalanche networks to MetaMask if they aren't already configured

**Deployment Errors**:
- For Fuji Testnet: Make sure you have testnet AVAX from the faucet
- Check compilation errors in the console
- Verify you're on the correct network in MetaMask

## 🔗 Links

- [Avalanche Documentation](https://docs.avax.network/)
- [Snowtrace Explorer](https://snowtrace.io/)
- [Fuji Testnet Explorer](https://testnet.snowtrace.io/)
- [Avalanche Faucet](https://faucet.avax.network/)
- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/)

## 🏆 Project Status

This project has successfully implemented all core features including:
- AI-powered contract generation
- Detailed contract explanation
- Direct deployment to Avalanche networks

Future enhancements could include:
- Contract verification on Snowtrace
- Contract interaction interface
- Template library for common contract types

---

**Built with ❤️ for the Avalanche community**

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Google Gemini API key
- MetaMask browser extension for deployment
- AVAX tokens for deployment (use the [Avalanche Faucet](https://faucet.avax.network/) for Fuji Testnet)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rohan911438/Avalanche-AI-copilot.git
   cd Avalanche-AI-copilot
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure backend environment variables**
   ```bash
   # Create/edit .env file in the backend directory
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3001
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../avalanche-frontend
   npm install
   ```

### Starting the Application

1. **Start the backend server**
   ```bash
   # From the backend directory
   node server.js
   ```
   The server will start on port 3001 (or the port specified in your .env file).
   You should see: "🚀 Server running on port 3001"

   **If using PowerShell with Execution Policy restrictions:**
   ```powershell
   # Run PowerShell as Administrator first and execute:
   Set-ExecutionPolicy RemoteSigned
   ```
   Or use Command Prompt instead and run:
   ```cmd
   node "full\path\to\server.js"
   ```

2. **Start the frontend development server**
   ```bash
   # From the avalanche-frontend directory
   npm run dev
   ```
   The frontend will be available at [http://localhost:3000](http://localhost:3000)

   **If using PowerShell with Execution Policy restrictions:**
   Use Command Prompt instead and run the same command.

### Using the Application

1. **Generate a Contract**:
   - Navigate to the "Generate" tab
   - Enter a description of the contract you want to create
   - Click "Generate Contract"

2. **Explain a Contract**:
   - Navigate to the "Explain" tab
   - Paste the Solidity code you want to analyze
   - Click "Explain Contract"

3. **Deploy a Contract**:
   - Navigate to the "Deploy" tab
   - Ensure you have a contract ready (either generated or pasted)
   - Connect your MetaMask wallet
   - Select the network (Fuji Testnet recommended for testing)
   - Click "Compile Contract" and then "Deploy to Avalanche"
   - Confirm the transaction in MetaMask
   - View your deployed contract on Snowtrace

### Troubleshooting

**Backend won't start**:
- Ensure you have installed all dependencies: `npm install`
- Verify your .env file contains the required GEMINI_API_KEY
- Check if the port is already in use

**Frontend npm commands fail**:
- If using PowerShell with Execution Policy restrictions, try using Command Prompt instead
- Or run PowerShell as Administrator and execute: `Set-ExecutionPolicy RemoteSigned`

**MetaMask Connection Issues**:
- Ensure MetaMask is installed and unlocked
- Add Avalanche networks to MetaMask if they aren't already configured

**Deployment Errors**:
- For Fuji Testnet: Make sure you have testnet AVAX from the faucet
- Check compilation errors in the console
- Verify you're on the correct network in MetaMask

## 🔧 Configuration for MetaMask

To configure MetaMask for Avalanche networks:

**Fuji Testnet**:
```
Network Name: Avalanche Fuji Testnet
New RPC URL: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113 (0xA869 in hex)
Currency Symbol: AVAX
Block Explorer URL: https://testnet.snowtrace.io/
```

**Avalanche Mainnet**:
```
Network Name: Avalanche C-Chain
New RPC URL: https://api.avax.network/ext/bc/C/rpc
Chain ID: 43114 (0xA86A in hex)
Currency Symbol: AVAX
Block Explorer URL: https://snowtrace.io/
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Avalanche Documentation](https://docs.avax.network/)
- [Snowtrace Explorer](https://snowtrace.io/)
- [Fuji Testnet Explorer](https://testnet.snowtrace.io/)
- [Avalanche Faucet](https://faucet.avax.network/)
- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/)
- [Google Gemini AI](https://ai.google.dev/docs)
- [OpenZeppelin in Avalanche Copilot](OPENZEPPELIN_CONTRACTS.md)

---

**Built with ❤️ for the Avalanche community**
