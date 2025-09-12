// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// These are local imports using relative paths
import "./Ownable.sol";
import "./Pausable.sol";
import "./ReentrancyGuard.sol";

/**
 * @title SimpleStorage with OpenZeppelin
 * @dev A simple storage contract that uses OpenZeppelin contracts
 */
contract SimpleStorageWithOZ is Ownable, Pausable, ReentrancyGuard {
    uint256 private value;
    mapping(address => uint256) private userValues;
    
    event ValueChanged(address indexed user, uint256 newValue);
    
    constructor() {
        value = 0;
    }
    
    function setValue(uint256 _value) external nonReentrant whenNotPaused {
        value = _value;
        userValues[msg.sender] = _value;
        emit ValueChanged(msg.sender, _value);
    }
    
    function getValue() external view returns (uint256) {
        return value;
    }
    
    function getUserValue(address user) external view returns (uint256) {
        return userValues[user];
    }
    
    function pauseContract() external onlyOwner {
        _pause();
    }
    
    function unpauseContract() external onlyOwner {
        _unpause();
    }
    
    function getOwner() external view returns (address) {
        return owner();
    }
}