# Avalanche AI Copilot - Frontend

This Next.js application serves as the frontend for the Avalanche AI Copilot platform, allowing users to generate, explain, and deploy smart contracts using AI assistance.

## Features

- Smart contract generation using Google Gemini AI
- Contract explanation and analysis
- Contract compilation with OpenZeppelin dependency resolution
- Deployment to the Avalanche Fuji testnet
- Integration with MetaMask for transaction signing

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## OpenZeppelin Contract Support

The application includes built-in support for common OpenZeppelin contracts:

- Ownable
- ReentrancyGuard
- Pausable

When a contract includes imports like `import "./Ownable.sol";`, the system automatically inlines the required OpenZeppelin code during compilation. This eliminates the need for manual dependency management.

### How it works

1. The application detects OpenZeppelin imports in your contract
2. It automatically inlines the necessary dependencies
3. The combined code is sent for compilation
4. If there's any issue with the frontend compilation, it falls back to the backend compiler

## Environment Setup

Create a `.env.local` file with the following variables:

```
GEMINI_API_KEY=your_gemini_api_key
BACKEND_URL=http://localhost:3001 (or your backend URL)
```

## Deploying to Vercel

This application is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure the environment variables in the Vercel dashboard
3. Deploy!

All API routes are compatible with Vercel's serverless functions architecture.
