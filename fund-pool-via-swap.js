const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// Contract addresses
const SwapETHToGM_ADDRESS = '0xB39Cb09d1B97f4c310f1223bBb21d6Aba02f0f16';

// ABI for Swap Contract
const SwapETHToGM_ABI = [
  "function addLiquidity(uint256 gmAmount) external payable",
  "function fundGMTokenPool(uint256 amount) external",
  "function getPoolBalances() view returns (uint256, uint256)",
  "function ethPool() view returns (uint256)",
  "function gmTokenPool() view returns (uint256)"
];

// Sepolia RPC
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/oppYpzscO7hdTG6hopypG6Opn3Xp7lR_';

async function fundPoolViaSwap() {
  try {
    console.log('🚀 Funding Pool via Swap Contract...');
    
    // Connect to Sepolia
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Connected to Sepolia network');
    
    // Use hardcoded private key (owner wallet)
    const privateKey = '0x859b25f164df967d1b6b04b81693a9f53785a6f2b03bf3c6b20796f60ca8d814';
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('✅ Wallet connected:', wallet.address);
    
    // Check ETH balance
    const ethBalance = await provider.getBalance(wallet.address);
    console.log('💰 ETH Balance:', ethers.formatEther(ethBalance), 'ETH');
    
    // Create contract instance
    const swapContract = new ethers.Contract(SwapETHToGM_ADDRESS, SwapETHToGM_ABI, wallet);
    
    // Check current pool balances
    console.log('📊 Checking current pool balances...');
    const gmPoolBalance = await swapContract.gmTokenPool();
    const ethPoolBalance = await swapContract.ethPool();
    
    console.log('📊 Current Pool Balances:');
    console.log('  GM Token Pool:', ethers.formatEther(gmPoolBalance), 'GM');
    console.log('  ETH Pool:', ethers.formatEther(ethPoolBalance), 'ETH');
    
    if (gmPoolBalance > 0) {
      console.log('✅ GM Token Pool already has tokens!');
      return;
    }
    
    // Try different approaches to fund the pool
    console.log('🔄 Attempting to fund GM Token Pool...');
    
    // Method 1: Try addLiquidity with 1000 GM tokens
    try {
      console.log('📝 Method 1: addLiquidity with 1000 GM tokens...');
      const gmAmount = ethers.parseEther('1000');
      
      const addLiquidityTx = await swapContract.addLiquidity(gmAmount, { value: 0 });
      console.log('📤 AddLiquidity transaction sent:', addLiquidityTx.hash);
      
      const addLiquidityReceipt = await addLiquidityTx.wait();
      console.log('✅ AddLiquidity transaction confirmed in block:', addLiquidityReceipt.blockNumber);
      
    } catch (addLiquidityError) {
      console.log('❌ AddLiquidity failed:', addLiquidityError.message);
    }
    
    // Method 2: Try fundGMTokenPool with 1000 GM tokens
    try {
      console.log('📝 Method 2: fundGMTokenPool with 1000 GM tokens...');
      const fundAmount = ethers.parseEther('1000');
      
      const fundTx = await swapContract.fundGMTokenPool(fundAmount);
      console.log('📤 FundGMTokenPool transaction sent:', fundTx.hash);
      
      const fundReceipt = await fundTx.wait();
      console.log('✅ FundGMTokenPool transaction confirmed in block:', fundReceipt.blockNumber);
      
    } catch (fundError) {
      console.log('❌ FundGMTokenPool failed:', fundError.message);
    }
    
    // Check final pool balances
    const finalGMPoolBalance = await swapContract.gmTokenPool();
    const finalETHPoolBalance = await swapContract.ethPool();
    
    console.log('🎉 Funding Attempt Complete!');
    console.log('📊 Final Pool Balances:');
    console.log('  GM Token Pool:', ethers.formatEther(finalGMPoolBalance), 'GM');
    console.log('  ETH Pool:', ethers.formatEther(finalETHPoolBalance), 'ETH');
    
    if (finalGMPoolBalance > 0) {
      console.log('✅ GM Token Pool successfully funded!');
      console.log('🚀 Users can now swap GM tokens!');
    } else {
      console.log('⚠️ GM Token Pool still empty - may need different approach');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

// Run the script
if (require.main === module) {
  fundPoolViaSwap()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fundPoolViaSwap };
