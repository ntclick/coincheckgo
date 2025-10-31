// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GMResearchAI_V2_Final is Ownable {
    IERC20 public gmToken;
    
    uint256 public constant DAILY_CHECKIN_REWARD = 100 * 10**18; // 100 GM
    uint256 public constant AI_RESEARCH_COST = 10 * 10**18; // 10 GM
    
    mapping(address => uint256) public lastCheckInDay;
    mapping(address => uint256) public researchCount;
    
    event DailyCheckIn(address indexed user, uint256 reward);
    event AIResearch(address indexed user, string topic, uint256 cost);
    event PoolFunded(address indexed funder, uint256 amount);
    event DailyCheckInFHE(address indexed user, bytes32 handle, bytes proof);
    event AIResearchFHE(address indexed user, string topic, uint256 cost, bytes32 handle, bytes proof);
    
    constructor(address _gmToken) Ownable(msg.sender) {
        gmToken = IERC20(_gmToken);
    }
    
    function dailyCheckIn() external {
        address user = msg.sender;
        uint256 currentDay = block.timestamp / 86400; // UTC day
        require(lastCheckInDay[user] < currentDay, "Already checked in today");
        require(gmToken.balanceOf(address(this)) >= DAILY_CHECKIN_REWARD, "Insufficient pool balance");
        lastCheckInDay[user] = currentDay;
        require(gmToken.transfer(user, DAILY_CHECKIN_REWARD), "Transfer failed");
        emit DailyCheckIn(user, DAILY_CHECKIN_REWARD);
    }
    
    function performAIResearch(string memory topic) external {
        address user = msg.sender;
        require(gmToken.balanceOf(user) >= AI_RESEARCH_COST, "Insufficient GM balance");
        require(gmToken.transferFrom(user, address(this), AI_RESEARCH_COST), "Transfer failed");
        researchCount[user]++;
        emit AIResearch(user, topic, AI_RESEARCH_COST);
    }

    function dailyCheckInFHE(bytes32 encryptedRewardHandle, bytes calldata inputProof) external {
        this.dailyCheckIn();
        emit DailyCheckInFHE(msg.sender, encryptedRewardHandle, inputProof);
    }

    function performAIResearchFHE(string memory topic, uint256 costPublic, bytes32 encryptedCostHandle, bytes calldata inputProof) external {
        require(costPublic == AI_RESEARCH_COST, "Invalid research cost");
        address user = msg.sender;
        require(gmToken.balanceOf(user) >= AI_RESEARCH_COST, "Insufficient GM balance");
        require(gmToken.transferFrom(user, address(this), AI_RESEARCH_COST), "Transfer failed");
        researchCount[user]++;
        emit AIResearch(user, topic, AI_RESEARCH_COST);
        emit AIResearchFHE(user, topic, AI_RESEARCH_COST, encryptedCostHandle, inputProof);
    }
    
    function fundPool(uint256 amount) external {
        require(gmToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit PoolFunded(msg.sender, amount);
    }
    
    function getPoolBalance() external view returns (uint256) {
        return gmToken.balanceOf(address(this));
    }
    
    function hasCheckedInToday(address user) external view returns (bool) {
        uint256 currentDay = block.timestamp / 86400;
        return lastCheckInDay[user] == currentDay;
    }
    
    function getResearchCount(address user) external view returns (uint256) {
        return researchCount[user];
    }
}


