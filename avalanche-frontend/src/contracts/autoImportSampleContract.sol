// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// The autoimport function will remove the imports and inline the code
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title StonePaperScissor
 * @dev A contract for playing Stone Paper Scissor with betting
 */
contract StonePaperScissor is ReentrancyGuard {
    // Enum for the choices
    enum Choice {Stone, Paper, Scissor}

    // Struct to store game data
    struct Game {
        address player1;
        address player2;
        Choice player1Choice;
        Choice player2Choice;
        uint256 betAmount; //Amount bet in Wei
        bool gameEnded;
    }

    // Mapping of game IDs to game data
    mapping(uint256 => Game) public games;
    // Game ID counter
    uint256 public gameIdCounter;

    // Event emitted when a game is created
    event GameCreated(uint256 gameId, address player1, uint256 betAmount);
    // Event emitted when a player makes a choice
    event ChoiceMade(uint256 gameId, address player, Choice choice);
    // Event emitted when a game ends
    event GameEnded(uint256 gameId, address winner, uint256 winnings);

    //Function to create a new game
    function createGame(uint256 _betAmount) public payable nonReentrant returns (uint256) {
        require(msg.value == _betAmount, "Incorrect bet amount sent.");
        require(_betAmount > 0, "Bet amount must be greater than zero.");

        gameIdCounter++;
        games[gameIdCounter] = Game({
            player1: msg.sender,
            player2: address(0), // Player 2 will join later
            player1Choice: Choice.Stone, // Default choice
            player2Choice: Choice.Stone, // Default choice
            betAmount: _betAmount,
            gameEnded: false
        });

        emit GameCreated(gameIdCounter, msg.sender, _betAmount);
        return gameIdCounter;
    }

    // Function for player 2 to join the game and make a choice.
    function joinGame(uint256 _gameId, Choice _choice) public payable nonReentrant {
        Game storage game = games[_gameId];
        require(game.player2 == address(0), "Game already has two players.");
        require(msg.value == game.betAmount, "Incorrect bet amount sent.");
        require(msg.sender != game.player1, "Player 1 cannot join as player 2.");
        require(!game.gameEnded, "Game already ended.");

        game.player2 = msg.sender;
        game.player2Choice = _choice;

        //Determine the winner and transfer the funds
        determineWinner(_gameId);
        emit ChoiceMade(_gameId, msg.sender, _choice);
    }

    // Function to make a choice for player 1 (if player 2 hasn't joined yet).
    function makeChoice(uint256 _gameId, Choice _choice) public nonReentrant {
        Game storage game = games[_gameId];
        require(game.player1 == msg.sender, "Only player 1 can make the choice.");
        require(game.player2 == address(0), "Player 2 has already joined.");
        require(!game.gameEnded, "Game already ended.");
        game.player1Choice = _choice;
        emit ChoiceMade(_gameId, msg.sender, _choice);
    }

    //Internal function to determine the winner
    function determineWinner(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        require(game.player2 != address(0), "Player 2 not joined yet");
        require(!game.gameEnded, "Game already ended.");

        Choice player1Choice = game.player1Choice;
        Choice player2Choice = game.player2Choice;

        // Determine the winner using the rules of Stone Paper Scissor.
        if (player1Choice == player2Choice) {
            // Split the pot if it's a tie.
            (bool success1, ) = game.player1.call{value: game.betAmount}("");
            require(success1, "Transfer to player1 failed");
            (bool success2, ) = game.player2.call{value: game.betAmount}("");
            require(success2, "Transfer to player2 failed");
        } else if (
            (player1Choice == Choice.Stone && player2Choice == Choice.Scissor) ||
            (player1Choice == Choice.Paper && player2Choice == Choice.Stone) ||
            (player1Choice == Choice.Scissor && player2Choice == Choice.Paper)
        ) {
            // Player 1 wins
            (bool success, ) = game.player1.call{value: 2 * game.betAmount}("");
            require(success, "Transfer to player1 failed");
            game.gameEnded = true;
            emit GameEnded(_gameId, game.player1, 2 * game.betAmount);
        } else {
            // Player 2 wins
            (bool success, ) = game.player2.call{value: 2 * game.betAmount}("");
            require(success, "Transfer to player2 failed");
            game.gameEnded = true;
            emit GameEnded(_gameId, game.player2, 2 * game.betAmount);
        }
    }
}