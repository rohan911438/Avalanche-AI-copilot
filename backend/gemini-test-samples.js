// gemini-test-samples.js
// This file contains sample contracts for testing the Gemini contract processor

/**
 * Sample valid contract that should compile without issues
 * Tests: Basic ERC721 functionality
 */
const validNFTContract = `
\`\`\`solidity
contract SimpleNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    constructor() ERC721("SimpleNFT", "SNFT") {}
    
    function mint(address to) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(to, newTokenId);
        return newTokenId;
    }
}
\`\`\`
`;

/**
 * Sample contract with missing imports
 * Tests: Import resolution
 */
const contractWithMissingImports = `
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AdvancedNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;
    
    Counters.Counter private _tokenIds;
    string private _baseTokenURI;
    
    constructor() ERC721("AdvancedNFT", "ANFT") {}
    
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function mint(address to) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(to, newTokenId);
        return newTokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseURI(), tokenId.toString()));
    }
}
\`\`\`
`;

/**
 * Sample contract with no license or pragma
 * Tests: License and pragma addition
 */
const contractWithoutLicenseOrPragma = `
\`\`\`solidity
contract BasicToken {
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    
    constructor(string memory name_, string memory symbol_, uint256 initialSupply_) {
        _name = name_;
        _symbol = symbol_;
        _mint(msg.sender, initialSupply_);
    }
    
    function name() public view returns (string memory) {
        return _name;
    }
    
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "Transfer from the zero address");
        require(to != address(0), "Transfer to the zero address");
        
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "Transfer amount exceeds balance");
        
        _balances[from] = fromBalance - amount;
        _balances[to] += amount;
    }
    
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "Mint to the zero address");
        
        _totalSupply += amount;
        _balances[account] += amount;
    }
}
\`\`\`
`;

/**
 * Sample contract with complex inheritance and imports
 * Tests: Multiple import resolution and complex inheritance
 */
const complexMarketplaceContract = `
\`\`\`solidity
// NFT marketplace contract

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

// Export the sample contracts
module.exports = {
  validNFTContract,
  contractWithMissingImports,
  contractWithoutLicenseOrPragma,
  complexMarketplaceContract
};