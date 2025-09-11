'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Zap, FileText, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'generate' | 'explain'>('generate')
  const [prompt, setPrompt] = useState('')
  const [contractCode, setContractCode] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const API_BASE_URL = 'http://localhost:3001'

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your contract')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate contract')
      }

      const data = await response.json()
      setResult(data.contractCode)
    } catch (err) {
      setError('Failed to generate contract. Make sure the backend is running.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExplain = async () => {
    if (!contractCode.trim()) {
      setError('Please paste a Solidity contract to explain')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractCode }),
      })

      if (!response.ok) {
        throw new Error('Failed to explain contract')
      }

      const data = await response.json()
      setResult(data.explanation)
    } catch (err) {
      setError('Failed to explain contract. Make sure the backend is running.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const examplePrompts = [
    "Create an ERC-20 token with name 'HackathonCoin' and symbol 'HACK' with 1,000,000 total supply",
    "Create a simple NFT contract for digital art collectibles",
    "Create a basic voting contract where people can vote for candidates",
    "Create a simple escrow contract for secure transactions"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏔️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AI Avalanche Copilot</h1>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
              MVP Demo • Powered by Gemini
            </span>
          </div>
          <p className="mt-2 text-gray-600">Generate and explain Avalanche smart contracts with AI</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 max-w-md">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'generate'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Generate
          </button>
          <button
            onClick={() => setActiveTab('explain')}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'explain'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Explain
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {activeTab === 'generate' ? 'Describe Your Contract' : 'Paste Contract Code'}
              </h2>

              {activeTab === 'generate' ? (
                <>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Create an ERC-20 token with name 'MyToken' and symbol 'MTK'"
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Generating...' : 'Generate Contract'}
                  </button>
                </>
              ) : (
                <>
                  <textarea
                    value={contractCode}
                    onChange={(e) => setContractCode(e.target.value)}
                    placeholder={`Paste your Solidity contract code here...

Example:
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}`}
                    className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                  <button
                    onClick={handleExplain}
                    disabled={loading || !contractCode.trim()}
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Explaining...' : 'Explain Contract'}
                  </button>
                </>
              )}
            </div>

            {/* Example Prompts */}
            {activeTab === 'generate' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Example Prompts</h3>
                <div className="space-y-2">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeTab === 'generate' ? 'Generated Contract' : 'Contract Explanation'}
                </h2>
                {result && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {result ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {activeTab === 'generate' ? (
                    <SyntaxHighlighter
                      language="solidity"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        fontSize: '14px',
                        maxHeight: '500px',
                      }}
                    >
                      {result}
                    </SyntaxHighlighter>
                  ) : (
                    <div className="p-6 max-h-[600px] overflow-y-auto">
                      <div 
                        className="prose prose-sm max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{
                          __html: result
                            .replace(/\n/g, '<br>')
                            .replace(/## (.*?)<br>/g, '<h3 class="text-lg font-semibold text-blue-900 mt-6 mb-3 flex items-center"><span class="mr-2">$1</span></h3>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                            .replace(/- \*\*(.*?)\*\*:/g, '<div class="ml-4 mb-2"><strong class="font-medium text-blue-700">$1:</strong>')
                            .replace(/- (.*?)<br>/g, '<div class="ml-4 mb-1 text-gray-700">• $1</div>')
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    {activeTab === 'generate' ? (
                      <Zap className="w-6 h-6 text-gray-400" />
                    ) : (
                      <FileText className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-500">
                    {activeTab === 'generate'
                      ? 'Generated contract will appear here'
                      : 'Contract explanation will appear here'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
