// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleTest
 * @dev A simple test contract to verify compilation works
 */
contract SimpleTest {
    string private message;
    
    event MessageSet(string newMessage, address sender);
    
    constructor(string memory initialMessage) {
        message = initialMessage;
    }
    
    function setMessage(string memory newMessage) public {
        message = newMessage;
        emit MessageSet(newMessage, msg.sender);
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
}