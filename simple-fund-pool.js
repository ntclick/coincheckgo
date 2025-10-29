const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// Contract addresses (working contracts)
const GMToken_ADDRESS = '0xBBac81C2b7359cf15C84d569ef297D329Af84479';
const SwapETHToGM_ADDRESS = '0xB39Cb09d1B97f4c310f1223bBb21d6Aba02f0f16';

// ABI for Swap Contract
const SwapETHToGM_ABI = [
  "function fundGMTokenPool(uint256 amount) external",
  "function getPoolBalances() view returns (uint256, uint256)",
  "function ethPool() view returns (uint256)",
  "function gmTokenPool() view returns (uint256)"
];

// Sepolia RPC
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/oppYpzscO7hdTG6hopypG6Opn3Xp7lR_';

async function simpleFundPool() {
  try {
    console.log('🚀 Simple Pool Funding Script...');
    
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
    
    // Try to fund with a small amount
    const fundAmount = ethers.parseEther('100'); // 100 GM tokens
    console.log('🏦 Attempting to fund pool with', ethers.formatEther(fundAmount), 'GM tokens...');
    
    try {
      const fundTx = await swapContract.fundGMTokenPool(fundAmount);
      console.log('📤 Fund transaction sent:', fundTx.hash);
      
      const fundReceipt = await fundTx.wait();
      console.log('✅ Fund transaction confirmed in block:', fundReceipt.blockNumber);
      
      // Check final pool balances
      const finalGMPoolBalance = await swapContract.gmTokenPool();
      const finalETHPoolBalance = await swapContract.ethPool();
      
      console.log('🎉 Pool Funding Complete!');
      console.log('📊 Final Pool Balances:');
      console.log('  GM Token Pool:', ethers.formatEther(finalGMPoolBalance), 'GM');
      console.log('  ETH Pool:', ethers.formatEther(finalETHPoolBalance), 'ETH');
      
    } catch (fundError) {
      console.error('❌ Fund transaction failed:', fundError.message);
      console.log('💡 This might be expected if the contract requires tokens to be minted first');
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
  simpleFundPool()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { simpleFundPool };
