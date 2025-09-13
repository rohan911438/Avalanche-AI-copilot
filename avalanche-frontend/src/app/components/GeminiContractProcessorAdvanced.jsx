'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for ethers to avoid server-side rendering issues
const ethers = dynamic(() => import('ethers'), { ssr: false });

const GeminiContractProcessorAdvanced = () => {
  const [contractCode, setContractCode] = useState('');
  const [fixedCode, setFixedCode] = useState('');
  const [abi, setAbi] = useState(null);
  const [bytecode, setBytecode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Sample contract templates
  const contractTemplates = {
    empty: '',
    nft: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    constructor() ERC721("MyNFT", "MNFT") {}
    
    function mintNFT(address recipient, string memory tokenURI)
        public onlyOwner
        returns (uint256)
    {
        _tokenIds.increment();
        
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        
        return newItemId;
    }
}`,
    token: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`,
    marketplace: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }
    
    // Listing ID => Listing data
    mapping(uint256 => Listing) public listings;
    uint256 private _nextListingId = 1;
    uint256 public listingFee = 0.01 ether;
    
    event ItemListed(uint256 listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price);
    event ItemSold(uint256 listingId, address indexed buyer, address indexed nftContract, uint256 tokenId, uint256 price);
    event ListingCancelled(uint256 listingId);
    
    function setListingFee(uint256 fee) external onlyOwner {
        listingFee = fee;
    }
    
    function createListing(address nftContract, uint256 tokenId, uint256 price) external payable nonReentrant returns (uint256) {
        require(msg.value == listingFee, "Must pay listing fee");
        require(price > 0, "Price must be greater than zero");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the NFT owner");
        require(nft.getApproved(tokenId) == address(this), "Marketplace not approved");
        
        uint256 listingId = _nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });
        
        emit ItemListed(listingId, msg.sender, nftContract, tokenId, price);
        
        return listingId;
    }
    
    function buyItem(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value == listing.price, "Incorrect price");
        
        listing.active = false;
        
        IERC721(listing.nftContract).transferFrom(listing.seller, msg.sender, listing.tokenId);
        
        (bool sent, ) = payable(listing.seller).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        
        emit ItemSold(listingId, msg.sender, listing.nftContract, listing.tokenId, listing.price);
    }
    
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender || msg.sender == owner(), "Not seller or owner");
        
        listing.active = false;
        
        emit ListingCancelled(listingId);
    }
    
    function withdrawFees() external onlyOwner {
        (bool sent, ) = payable(owner()).call{value: address(this).balance}("");
        require(sent, "Failed to withdraw fees");
    }
}`,
  };
  
  // Handle template selection
  const handleTemplateChange = (e) => {
    const template = e.target.value;
    setSelectedTemplate(template);
    setContractCode(contractTemplates[template]);
  };
  
  // Function to just fix the contract without compiling
  const handleFix = async () => {
    if (!contractCode.trim()) {
      setError('Please enter contract code first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setStatus('Fixing contract...');
    
    try {
      const response = await fetch('/api/gemini/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix contract');
      }
      
      setFixedCode(data.fixedCode);
      setStatus('Contract fixed successfully! You can now compile it.');
      
    } catch (err) {
      console.error('Error fixing contract:', err);
      setError(err.message || 'Failed to fix contract');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fix and compile the contract
  const handleCompile = async () => {
    if (!contractCode.trim()) {
      setError('Please enter contract code first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setStatus('Processing and compiling contract...');
    setAbi(null);
    setBytecode(null);
    
    try {
      const response = await fetch('/api/gemini/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to compile contract');
      }
      
      // Set the fixed code
      if (data.result && data.result.fixedCode) {
        setFixedCode(data.result.fixedCode);
      }
      
      // Set the compilation results
      if (data.result) {
        setAbi(data.result.abi);
        setBytecode(data.result.bytecode);
        setStatus('Contract compiled successfully!');
      }
      
    } catch (err) {
      console.error('Error compiling contract:', err);
      setError(err.message || 'Failed to compile contract');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to copy to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setStatus(`${label} copied to clipboard!`);
        setTimeout(() => setStatus(''), 3000);
      },
      () => {
        setError(`Could not copy ${label.toLowerCase()}`);
      }
    );
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Advanced Gemini Contract Processor</h1>
      <p className="mb-4 text-gray-700">
        This tool helps you process contracts from Gemini to fix common issues and compile them automatically.
      </p>
      
      {/* Template selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start with a template (optional):
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={selectedTemplate}
          onChange={handleTemplateChange}
        >
          <option value="">Select a template...</option>
          <option value="empty">Empty (No template)</option>
          <option value="nft">NFT (ERC721)</option>
          <option value="token">Token (ERC20)</option>
          <option value="marketplace">NFT Marketplace</option>
        </select>
      </div>
      
      {/* Input area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contract code:
        </label>
        <textarea
          className="w-full h-60 p-2 border border-gray-300 rounded-md font-mono text-sm"
          value={contractCode}
          onChange={(e) => setContractCode(e.target.value)}
          placeholder="// Paste your Gemini-generated contract here..."
        />
      </div>
      
      {/* Button row */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleFix}
          disabled={isLoading || !contractCode.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Fix Contract Only'}
        </button>
        
        <button
          onClick={handleCompile}
          disabled={isLoading || !contractCode.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Fix & Compile Contract'}
        </button>
      </div>
      
      {/* Status and error messages */}
      {status && <p className="mb-4 text-green-600">{status}</p>}
      {error && <p className="mb-4 text-red-600">Error: {error}</p>}
      
      {/* Fixed code output */}
      {fixedCode && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Fixed Contract Code:</h2>
            <button
              onClick={() => copyToClipboard(fixedCode, 'Fixed contract code')}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              Copy Code
            </button>
          </div>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm font-mono">
            {fixedCode}
          </pre>
        </div>
      )}
      
      {/* Compilation results */}
      {abi && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Compilation Successful!</h2>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-medium">ABI:</h3>
              <button
                onClick={() => copyToClipboard(JSON.stringify(abi, null, 2), 'ABI')}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Copy ABI
              </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm font-mono">
              {JSON.stringify(abi, null, 2)}
            </pre>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-medium">Bytecode:</h3>
              <button
                onClick={() => copyToClipboard(bytecode, 'Bytecode')}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Copy Bytecode
              </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-40 text-sm font-mono">
              {bytecode?.substring(0, 100)}...
              <span className="text-gray-500">(truncated)</span>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiContractProcessorAdvanced;