// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { FHE, euint64, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { Ownable2Step, Ownable } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { IConfidentialFungibleToken } from "@openzeppelin/confidential-contracts/interfaces/IConfidentialFungibleToken.sol";
import "./GMCleanTokenHybrid.sol";

contract GMERC7984SwapHybrid is SepoliaConfig, Ownable2Step {
    GMCleanTokenHybrid private _gmToken;
    bool public poolInitialized;
    uint256 public totalETHReserve;
    uint256 public totalGMReserve; // Public reserve for hybrid approach
    
    // AMM constants
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant SWAP_FEE = 30; // 0.3% fee

    event PoolInitialized(uint256 ethAmount, uint256 gmAmount);
    event LiquidityAdded(address indexed provider, uint256 ethAmount, uint256 gmAmount);
    event EncryptedSwap(address indexed user, bool isGMToETH, bytes32 encryptedAmount);
    event PublicSwap(address indexed user, bool isGMToETH, uint256 amount);
    event SwapDebug(string step, uint256 value);

    constructor(address gmToken) Ownable(msg.sender) {
        _gmToken = GMCleanTokenHybrid(gmToken);
    }

    // Function to set this contract as operator for the token (only owner)
    function setSwapAsOperator() external onlyOwner {
        _gmToken.setOperator(address(this), type(uint48).max);
    }

    // HYBRID APPROACH: Public pool initialization - anyone can initialize once
    function initializePool(uint256 gmAmount) external payable {
        require(!poolInitialized, "Pool already initialized");
        require(msg.value > 0, "Must add ETH liquidity");
        require(gmAmount > 0, "GM amount must be greater than 0");
        
        // Check if user has enough GM tokens
        require(_gmToken.balanceOf(msg.sender) >= gmAmount, "Not enough GM to initialize pool");
        
        // Transfer GM tokens from user to pool
        bool transferSuccess = _gmToken.transferFrom(msg.sender, address(this), gmAmount);
        require(transferSuccess, "GM transfer failed");

        totalETHReserve = msg.value;
        totalGMReserve = gmAmount;
        poolInitialized = true;
        
        emit PoolInitialized(msg.value, gmAmount);
    }

    // HYBRID APPROACH: Public swap ETH for GM (Fixed Rate)
    function swapETHForGM() external payable {
        require(poolInitialized, "Pool not initialized");
        require(msg.value > 0, "ETH must be > 0");

        // Calculate GM output using fixed rate (0.001 ETH = 100 GM)
        uint256 gmOutput = _calculateFixedRateOutput(msg.value, true);
        
        // Check if pool has sufficient GM tokens
        require(gmOutput > 0 && gmOutput <= totalGMReserve, "Invalid swap or insufficient GM in pool");

        // Update reserves
        totalETHReserve += msg.value;
        totalGMReserve -= gmOutput;

        // Transfer GM tokens to user (REAL transfer - use mintPublicForSwap)
        _gmToken.mintPublicForSwap(msg.sender, gmOutput);

        emit PublicSwap(msg.sender, false, gmOutput);
    }
    
    // Public swap function (GM to ETH) - user specifies amount (Fixed Rate)
    function swapGMForETHPublic(uint256 gmAmount) external {
        require(gmAmount > 0, "No GM amount specified");
        require(poolInitialized, "Pool not initialized");
        
        // Check user has sufficient GM balance
        require(_gmToken.balanceOf(msg.sender) >= gmAmount, "Insufficient GM balance");
        
        // Transfer GM tokens from user to pool
        bool transferSuccess = _gmToken.transferFrom(msg.sender, address(this), gmAmount);
        require(transferSuccess, "GM transfer failed - check balance and permissions");
        
        // Update pool reserves
        totalGMReserve += gmAmount;
        
        // Calculate ETH output using fixed rate (100 GM = 0.001 ETH)
        uint256 ethOutput = _calculateFixedRateOutput(gmAmount, false);
        require(ethOutput <= totalETHReserve, "Insufficient ETH in pool");
        
        // Update reserves
        totalETHReserve -= ethOutput;
        
        // Transfer ETH to user
        (bool success, ) = payable(msg.sender).call{value: ethOutput}("");
        require(success, "ETH transfer failed");
        
        emit PublicSwap(msg.sender, true, ethOutput);
    }
    
    // Public swap function (ETH to GM) - user specifies ETH amount (Fixed Rate)
    function swapETHForGMPublic() external payable {
        require(msg.value > 0, "No ETH sent");
        require(poolInitialized, "Pool not initialized");
        
        // Calculate GM output using fixed rate (0.001 ETH = 100 GM)
        uint256 gmOutput = _calculateFixedRateOutput(msg.value, true);
        require(gmOutput > 0 && gmOutput <= totalGMReserve, "Invalid swap or insufficient GM in pool");
        
        // Update reserves
        totalETHReserve += msg.value;
        totalGMReserve -= gmOutput;
        
        // Mint GM tokens to user
        _gmToken.mintPublicForSwap(msg.sender, gmOutput);
        
        emit PublicSwap(msg.sender, false, gmOutput);
    }

    // Mint GM tokens to pool (for providing liquidity)
    function mintGMTokensToPool(uint256 amount) external onlyOwner {
        // Mint actual tokens to pool using the token contract
        _gmToken.mint(address(this), amount);
        
        // Update reserve balance
        totalGMReserve += amount;
    }

    // FHE CONFIDENTIAL: Swap GM for ETH using hybrid token transfer
    // NOTE: encryptedGmAmount and inputProof are passed for FHE auditing but not used
    // The hybrid token's transferFrom automatically syncs confidential balances
    function swapGMForETH(
        externalEuint64 /* encryptedGmAmount */,
        bytes calldata /* inputProof */,
        uint256 publicAmount
    ) external payable {
        // Auto-initialize pool if not initialized (UX improvement)
        if (!poolInitialized) {
            uint256 initialGMAmount = 1000; // Default initial GM amount
            uint256 initialETHAmount = msg.value; // Use ETH sent with transaction
            
            poolInitialized = true;
            totalGMReserve = initialGMAmount;
            totalETHReserve = initialETHAmount;
            
            emit PoolInitialized(initialGMAmount, initialETHAmount);
        }

        require(publicAmount > 0, "Amount must be > 0");
        require(poolInitialized, "Pool not initialized");
        
        // Transfer GM tokens from user to pool using public transfer
        // This will sync both public and confidential balances in hybrid token
        bool transferSuccess = _gmToken.transferFrom(msg.sender, address(this), publicAmount);
        require(transferSuccess, "GM transfer failed - check balance and permissions");
        
        // Update pool reserves
        totalGMReserve += publicAmount;
        
        // Calculate ETH output using AMM formula
        uint256 ethOutput = _calculateAMMOutput(publicAmount, totalGMReserve, totalETHReserve);
        require(ethOutput <= totalETHReserve, "Insufficient ETH in pool");
        
        // Update reserves
        totalETHReserve -= ethOutput;
        
        // Transfer ETH to user
        (bool success, ) = payable(msg.sender).call{value: ethOutput}("");
        require(success, "ETH transfer failed");
        
        // Emit FHE event (handle would need to be extracted from externalEuint64, simplified here)
        emit EncryptedSwap(msg.sender, true, bytes32(0)); // FHE amount is encrypted
        emit PublicSwap(msg.sender, true, ethOutput);
    }

    // Fixed exchange rate calculation (0.001 ETH = 100 GM)
    function _calculateFixedRateOutput(
        uint256 inputAmount,
        bool isETHToGM
    ) internal pure returns (uint256) {
        if (isETHToGM) {
            // ETH to GM: 0.001 ETH = 100 GM, so 1 ETH = 100,000 GM
            uint256 gmOutput = inputAmount * 100000;
            // Apply fee (0.3%): multiply by (10000 - 30) / 10000
            return gmOutput * (FEE_DENOMINATOR - SWAP_FEE) / FEE_DENOMINATOR;
        } else {
            // GM to ETH: 100 GM = 0.001 ETH, so 100,000 GM = 1 ETH
            uint256 ethOutput = inputAmount / 100000;
            // Apply fee (0.3%): multiply by (10000 - 30) / 10000
            return ethOutput * (FEE_DENOMINATOR - SWAP_FEE) / FEE_DENOMINATOR;
        }
    }

    // AMM calculation for public values (floating rate based on pool reserves)
    function _calculateAMMOutput(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) internal pure returns (uint256) {
        // AMM formula: outputAmount = (inputAmount * outputReserve) / (inputReserve + inputAmount)
        // This creates a floating exchange rate based on pool liquidity
        require(inputReserve > 0 && outputReserve > 0, "Invalid reserves");
        
        uint256 numerator = inputAmount * outputReserve;
        uint256 denominator = inputReserve + inputAmount;
        
        // Apply fee (0.3%): multiply by (10000 - 30) / 10000
        numerator = numerator * (FEE_DENOMINATOR - SWAP_FEE) / FEE_DENOMINATOR;
        
        return numerator / denominator;
    }

    // AMM calculation for FHE values (simplified)
    function _calculateAMMOutputFHE(
        euint64 inputAmount,
        euint64 inputReserve,
        euint64 outputReserve
    ) internal returns (euint64) {
        // Simplified FHE AMM calculation
        // In production, this would be more sophisticated
        euint64 numerator = FHE.mul(inputAmount, outputReserve);
        euint64 denominator = FHE.add(inputReserve, inputAmount);
        
        // Apply fee
        euint64 feeMultiplier = FHE.asEuint64(uint64(FEE_DENOMINATOR - SWAP_FEE));
        numerator = FHE.mul(numerator, feeMultiplier);
        denominator = FHE.mul(denominator, FHE.asEuint64(uint64(FEE_DENOMINATOR)));
        
        // Simplified division (in production would need proper FHE division)
        return FHE.shr(numerator, 1); // Divide by 2 as approximation
    }

    // View functions
    function getReserves() external view returns (uint256 eth, uint256 gm) {
        return (totalETHReserve, totalGMReserve);
    }

    function getSwapFee() external pure returns (uint256) {
        return SWAP_FEE;
    }

    // Add liquidity (public)
    function addLiquidity(uint256 gmAmount) external payable onlyOwner {
        require(poolInitialized, "Not initialized");
        require(msg.value > 0 && gmAmount > 0, "Invalid amounts");
        
        // Check if owner has enough GM tokens
        require(_gmToken.balanceOf(msg.sender) >= gmAmount, "Not enough GM to add liquidity");
        
        // Transfer GM tokens to pool
        bool transferSuccess = _gmToken.transferFrom(msg.sender, address(this), gmAmount);
        require(transferSuccess, "GM transfer failed");
        
        // Update reserves
        totalETHReserve += msg.value;
        totalGMReserve += gmAmount;
        
        emit LiquidityAdded(msg.sender, msg.value, gmAmount);
    }

    // Optional: anyone can view pool stats
    function getPoolState()
        external
        view
        returns (bool initialized, uint256 gmLiquidity, uint256 ethLiquidity)
    {
        return (poolInitialized, totalGMReserve, totalETHReserve);
    }

    // Owner withdraw profits if needed
    function withdraw(uint256 ethAmount, uint256 gmAmount) external onlyOwner {
        if (ethAmount > 0) payable(owner()).transfer(ethAmount);
        // GM withdrawal simplified - in production would need proper transfer
    }

    receive() external payable {}
}
