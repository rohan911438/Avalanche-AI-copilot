// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// AUTO-INLINED DEPENDENCIES

// Inlined from @openzeppelin/contracts/security/ReentrancyGuard.sol

contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

// MAIN CONTRACT

contract StonePaperScissor is ReentrancyGuard {
    // Enum for the choices
    enum Choice {Stone, Paper, Scissor}

    // Struct to store game data
    struct Game {
        address player1;
        address player2;
        Choice player1Choice;
        Choice player2Choice;
        uint256 betAmount;
        bool gameEnded;
    }

    // Simple function with nonReentrant modifier
    function createGame(uint256 _betAmount) public payable nonReentrant returns (uint256) {
        return 1;
    }
}