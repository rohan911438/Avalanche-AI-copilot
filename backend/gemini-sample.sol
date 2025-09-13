// EXAMPLE CONTRACT FROM GEMINI WITH COMMON ISSUES
// This contract has imports and other issues that would normally cause compilation problems

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract DigitalArtNFT is ERC721 {
    using Strings for uint256;
    
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenURIs;
    
    constructor() ERC721("DigitalArt", "DART") {}
    
    function mint(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        return _tokenURIs[tokenId];
    }
}