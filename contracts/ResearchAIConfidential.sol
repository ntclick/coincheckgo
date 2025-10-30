// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal interface of the GM Hybrid token exposing confidential mint/burn
interface IGMHybridConfidential {
  // Public-side mint used by swap/hybrid token
  function mintPublicForSwap(address to, uint256 amount) external;
  // Confidential burn (FHE spend)
  function confidentialBurn(address from, bytes32 encryptedAmount, bytes calldata inputProof) external returns (bytes32);
}

/// @title ResearchAIConfidential
/// @notice Basic FHE-compliant research/check-in contract
/// - dailyCheckIn: once per UTC day, mints encrypted 10 GM to caller (amount provided encrypted by user)
/// - researchSpend: burns encrypted 10 GM from caller (amount provided encrypted by user)
/// The encrypted amounts are provided by the frontend using FHEVM createEncryptedInput + EIP-712.
contract ResearchAIConfidential {
  IGMHybridConfidential public immutable gmToken;
  uint256 public constant DAILY_REWARD = 10e18; // 10 GM (18 decimals)

  // Track last check-in day per user (UTC day = floor(timestamp / 86400))
  mapping(address => uint256) public lastCheckInDay;

  event DailyCheckIn(address indexed user, uint256 dayIndex, bytes32 encryptedAmount);
  event ResearchSpent(address indexed user, bytes32 encryptedAmount);

  constructor(address _gmToken) {
    require(_gmToken != address(0), "invalid token");
    gmToken = IGMHybridConfidential(_gmToken);
  }

  /// @notice Public mint 10 GM once per day per user (hybrid/public side, like swap)
  function dailyCheckIn() external {
    uint256 dayIndex = block.timestamp / 1 days;
    require(lastCheckInDay[msg.sender] != dayIndex, "already checked in today");

    // Mint public GM on the hybrid token
    gmToken.mintPublicForSwap(msg.sender, DAILY_REWARD);
    lastCheckInDay[msg.sender] = dayIndex;
    emit DailyCheckIn(msg.sender, dayIndex, bytes32(0));
  }

  /// @notice Burn encrypted amount (e.g., 10 GM) from user for research
  /// @param encryptedTen Encrypted handle for value 10 (frontend encrypts)
  /// @param inputProof EIP-712 signature proof bytes
  function researchSpend(bytes32 encryptedTen, bytes calldata inputProof) external {
    // Burn confidential tokens from user
    gmToken.confidentialBurn(msg.sender, encryptedTen, inputProof);
    emit ResearchSpent(msg.sender, encryptedTen);
  }
}


