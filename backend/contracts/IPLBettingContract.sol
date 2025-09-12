// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./ReentrancyGuard.sol";
import "./Pausable.sol";

/**
 * @title IPL Betting Contract
 * @dev A simple betting contract for IPL matches
 */
contract IPLBettingContract is Ownable, ReentrancyGuard, Pausable {
    // Define team IDs
    uint8 public constant CSK = 1;
    uint8 public constant MI = 2;
    uint8 public constant RCB = 3;
    uint8 public constant DC = 4;
    uint8 public constant KKR = 5;
    uint8 public constant SRH = 6;
    uint8 public constant PBKS = 7;
    uint8 public constant RR = 8;
    uint8 public constant GT = 9;
    uint8 public constant LSG = 10;

    // Define match states
    enum MatchState { Created, Open, Closed, Settled }

    // Define a struct for matches
    struct Match {
        uint256 matchId;
        uint8 teamA;
        uint8 teamB;
        uint256 startTime;
        uint8 winningTeam;
        MatchState state;
        uint256 totalBetsTeamA;
        uint256 totalBetsTeamB;
    }

    // Define a struct for bets
    struct Bet {
        address bettor;
        uint256 matchId;
        uint8 teamId;
        uint256 amount;
        bool claimed;
    }

    // Storage variables
    mapping(uint256 => Match) public matches;
    mapping(uint256 => mapping(address => Bet)) public bets;
    mapping(address => uint256[]) public userBets;
    
    uint256 public matchCount = 0;
    uint256 public platformFeePercent = 3; // 3% fee

    // Events
    event MatchCreated(uint256 matchId, uint8 teamA, uint8 teamB, uint256 startTime);
    event MatchStateChanged(uint256 matchId, MatchState state);
    event BetPlaced(address indexed bettor, uint256 matchId, uint8 teamId, uint256 amount);
    event WinningsClaimed(address indexed bettor, uint256 matchId, uint256 amount);
    event FeeWithdrawn(address indexed owner, uint256 amount);

    // Constructor
    constructor() {
        // Initialize contract
    }

    /**
     * @dev Create a new match
     */
    function createMatch(uint8 _teamA, uint8 _teamB, uint256 _startTime) external onlyOwner {
        require(_teamA != _teamB, "Teams must be different");
        require(_startTime > block.timestamp, "Match start time must be in the future");
        
        matchCount++;
        
        matches[matchCount] = Match({
            matchId: matchCount,
            teamA: _teamA,
            teamB: _teamB,
            startTime: _startTime,
            winningTeam: 0,
            state: MatchState.Created,
            totalBetsTeamA: 0,
            totalBetsTeamB: 0
        });
        
        emit MatchCreated(matchCount, _teamA, _teamB, _startTime);
    }
    
    /**
     * @dev Open betting for a match
     */
    function openMatch(uint256 _matchId) external onlyOwner {
        require(matches[_matchId].state == MatchState.Created, "Match not in Created state");
        
        matches[_matchId].state = MatchState.Open;
        emit MatchStateChanged(_matchId, MatchState.Open);
    }
    
    /**
     * @dev Close betting for a match
     */
    function closeMatch(uint256 _matchId) external onlyOwner {
        require(matches[_matchId].state == MatchState.Open, "Match not in Open state");
        
        matches[_matchId].state = MatchState.Closed;
        emit MatchStateChanged(_matchId, MatchState.Closed);
    }
    
    /**
     * @dev Place a bet on a team
     */
    function placeBet(uint256 _matchId, uint8 _teamId) external payable nonReentrant whenNotPaused {
        Match storage match_ = matches[_matchId];
        
        require(match_.state == MatchState.Open, "Match not open for betting");
        require(block.timestamp < match_.startTime, "Match has already started");
        require(_teamId == match_.teamA || _teamId == match_.teamB, "Invalid team selection");
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(bets[_matchId][msg.sender].amount == 0, "Already bet on this match");
        
        // Record the bet
        bets[_matchId][msg.sender] = Bet({
            bettor: msg.sender,
            matchId: _matchId,
            teamId: _teamId,
            amount: msg.value,
            claimed: false
        });
        
        userBets[msg.sender].push(_matchId);
        
        // Update totals
        if (_teamId == match_.teamA) {
            match_.totalBetsTeamA += msg.value;
        } else {
            match_.totalBetsTeamB += msg.value;
        }
        
        emit BetPlaced(msg.sender, _matchId, _teamId, msg.value);
    }
    
    /**
     * @dev Set the winning team and settle the match
     */
    function settleMatch(uint256 _matchId, uint8 _winningTeam) external onlyOwner {
        Match storage match_ = matches[_matchId];
        
        require(match_.state == MatchState.Closed, "Match not closed yet");
        require(_winningTeam == match_.teamA || _winningTeam == match_.teamB, "Invalid winning team");
        
        match_.winningTeam = _winningTeam;
        match_.state = MatchState.Settled;
        
        emit MatchStateChanged(_matchId, MatchState.Settled);
    }
    
    /**
     * @dev Claim winnings for a settled match
     */
    function claimWinnings(uint256 _matchId) external nonReentrant {
        Match storage match_ = matches[_matchId];
        Bet storage bet = bets[_matchId][msg.sender];
        
        require(match_.state == MatchState.Settled, "Match not settled yet");
        require(bet.amount > 0, "No bet placed on this match");
        require(!bet.claimed, "Winnings already claimed");
        require(bet.teamId == match_.winningTeam, "You did not bet on the winning team");
        
        // Mark as claimed
        bet.claimed = true;
        
        // Calculate winnings
        uint256 totalPool = match_.totalBetsTeamA + match_.totalBetsTeamB;
        uint256 winningPool = match_.winningTeam == match_.teamA ? match_.totalBetsTeamA : match_.totalBetsTeamB;
        
        // Calculate fee amount
        uint256 feeAmount = (totalPool * platformFeePercent) / 100;
        uint256 winningAmount = ((totalPool - feeAmount) * bet.amount) / winningPool;
        
        // Transfer winnings to the bettor
        payable(msg.sender).transfer(winningAmount);
        
        emit WinningsClaimed(msg.sender, _matchId, winningAmount);
    }
    
    /**
     * @dev Withdraw platform fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
        
        emit FeeWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get user's bet history
     */
    function getUserBets() external view returns (uint256[] memory) {
        return userBets[msg.sender];
    }
    
    /**
     * @dev Get match details
     */
    function getMatchDetails(uint256 _matchId) external view returns (
        uint8 teamA,
        uint8 teamB,
        uint256 startTime,
        uint8 winningTeam,
        MatchState state,
        uint256 totalBetsTeamA,
        uint256 totalBetsTeamB
    ) {
        Match storage match_ = matches[_matchId];
        return (
            match_.teamA,
            match_.teamB,
            match_.startTime,
            match_.winningTeam,
            match_.state,
            match_.totalBetsTeamA,
            match_.totalBetsTeamB
        );
    }
    
    /**
     * @dev Get bet details
     */
    function getBetDetails(uint256 _matchId, address _bettor) external view returns (
        address bettor,
        uint8 teamId,
        uint256 amount,
        bool claimed
    ) {
        Bet storage bet = bets[_matchId][_bettor];
        return (
            bet.bettor,
            bet.teamId,
            bet.amount,
            bet.claimed
        );
    }
}