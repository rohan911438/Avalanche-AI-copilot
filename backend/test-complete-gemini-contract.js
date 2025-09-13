// test-complete-gemini-contract.js
// Test with a complete contract that should compile successfully

const fs = require('fs');
const path = require('path');
const { fixGeminiContract } = require('./gemini-contract-fixer');
const { compileContractWithHardhat } = require('./hardhatCompiler');

// Sample complete contract with common Gemini issues
const testContract = `
\`\`\`solidity
// NFT contract that uses OpenZeppelin standards

contract NFTMarketplace is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;
    
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;
    
    uint256 listingPrice = 0.01 ether;
    
    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }
    
    mapping(uint256 => MarketItem) private idToMarketItem;
    
    event MarketItemCreated (
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );
    
    constructor() ERC721("NFT Marketplace", "NFTM") {}
    
    function setListingPrice(uint256 _price) public onlyOwner {
        listingPrice = _price;
    }
    
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }
    
    function createMarketItem(
        address nftContract, 
        uint256 tokenId, 
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");
        
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );
        
        // Transfer the NFT to the marketplace contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }
    
    function createMarketSale(
        address nftContract,
        uint256 itemId
    ) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        
        require(msg.value == price, "Please submit the asking price");
        
        // Transfer payment to seller
        idToMarketItem[itemId].seller.transfer(msg.value);
        
        // Transfer NFT from marketplace to buyer
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        
        // Update the item owner
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        
        _itemsSold.increment();
        
        // Transfer listing fee to contract owner
        payable(owner()).transfer(listingPrice);
    }
    
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;
        
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        
        for (uint256 i = 1; i <= itemCount; i++) {
            if (idToMarketItem[i].owner == address(0)) {
                MarketItem storage currentItem = idToMarketItem[i];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        
        return items;
    }
}
\`\`\`
`;

// Create the test output directory if it doesn't exist
const testOutputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(testOutputDir)) {
  fs.mkdirSync(testOutputDir);
}

// Process and test the contract
async function runTest() {
  try {
    console.log('Starting comprehensive Gemini contract test...');
    
    // Write the test contract to a file
    const testContractPath = path.join(testOutputDir, 'test-complete-contract.sol');
    fs.writeFileSync(testContractPath, testContract);
    console.log('Test contract written to:', testContractPath);
    
    // Process the contract
    console.log('\nProcessing contract with Gemini fixer...');
    const fixedCode = fixGeminiContract(testContract);
    
    // Write the processed contract to a file
    const fixedContractPath = path.join(testOutputDir, 'fixed-complete-contract.sol');
    fs.writeFileSync(fixedContractPath, fixedCode);
    console.log('Fixed contract written to:', fixedContractPath);
    
    // Try to compile the processed contract
    console.log('\nAttempting to compile the fixed contract...');
    const compilationResult = await compileContractWithHardhat(fixedCode);
    
    if (compilationResult.success) {
      console.log('✅ Contract compilation succeeded!');
      
      // Write the ABI to a file
      const abiPath = path.join(testOutputDir, 'contract-abi.json');
      fs.writeFileSync(abiPath, JSON.stringify(compilationResult.abi, null, 2));
      console.log('ABI written to:', abiPath);
      
      // Write bytecode to a file (truncated in console output)
      console.log('Bytecode generated successfully.');
    } else {
      console.log('❌ Contract compilation failed with errors:');
      console.log(compilationResult.error);
    }
    
    console.log('\nTest completed.');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

runTest();