const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// Contract addresses
const SwapETHToGM_ADDRESS = '0xd0e183F11948CbA9DAF6AC46861DC805231aFA7A';

// ABI for Swap Contract
const SwapETHToGM_ABI = [
  "function addLiquidity(uint256 gmAmount) external payable",
  "function getPoolBalances() view returns (uint256, uint256)",
  "function ethPool() view returns (uint256)",
  "function gmTokenPool() view returns (uint256)"
];

// Sepolia RPC
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/oppYpzscO7hdTG6hopypG6Opn3Xp7lR_';

async function addLiquidity() {
  try {
    console.log('🚀 Adding Liquidity to GM Token Pool...');
    
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
    
    // Try to add liquidity with 1000 GM tokens
    const gmAmount = ethers.parseEther('1000'); // 1000 GM tokens
    console.log('🏦 Adding liquidity with', ethers.formatEther(gmAmount), 'GM tokens...');
    
    try {
      const addLiquidityTx = await swapContract.addLiquidity(gmAmount, { value: 0 });
      console.log('📤 AddLiquidity transaction sent:', addLiquidityTx.hash);
      
      const addLiquidityReceipt = await addLiquidityTx.wait();
      console.log('✅ AddLiquidity transaction confirmed in block:', addLiquidityReceipt.blockNumber);
      
      // Check final pool balances
      const finalGMPoolBalance = await swapContract.gmTokenPool();
      const finalETHPoolBalance = await swapContract.ethPool();
      
      console.log('🎉 Liquidity Added Successfully!');
      console.log('📊 Final Pool Balances:');
      console.log('  GM Token Pool:', ethers.formatEther(finalGMPoolBalance), 'GM');
      console.log('  ETH Pool:', ethers.formatEther(finalETHPoolBalance), 'ETH');
      
    } catch (addLiquidityError) {
      console.error('❌ AddLiquidity transaction failed:', addLiquidityError.message);
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
  addLiquidity()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addLiquidity };
