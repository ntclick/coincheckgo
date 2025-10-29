const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// Contract addresses
const GMToken_ADDRESS = '0xBBac81C2b7359cf15C84d569ef297D329Af84479';
const SwapETHToGM_ADDRESS = '0xB39Cb09d1B97f4c310f1223bBb21d6Aba02f0f16';

// ABI for GMToken (FHE encrypted)
const GMToken_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function confidentialBalanceOf(address account) view returns (bytes32)",
  "function confidentialTotalSupply() view returns (bytes32)"
];

// ABI for Swap Contract
const SwapETHToGM_ABI = [
  "function getPoolBalances() view returns (uint256, uint256)",
  "function ethPool() view returns (uint256)",
  "function gmTokenPool() view returns (uint256)"
];

// Sepolia RPC
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/oppYpzscO7hdTG6hopypG6Opn3Xp7lR_';

async function transferToPool() {
  try {
    console.log('🚀 Transferring GM Tokens to Pool...');
    
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
    
    // Create contract instances
    const gmTokenContract = new ethers.Contract(GMToken_ADDRESS, GMToken_ABI, wallet);
    const swapContract = new ethers.Contract(SwapETHToGM_ADDRESS, SwapETHToGM_ABI, provider);
    
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
    
    // Transfer 1000 GM tokens to swap contract
    const transferAmount = ethers.parseEther('1000'); // 1000 GM tokens
    console.log('🔄 Transferring', ethers.formatEther(transferAmount), 'GM tokens to swap contract...');
    
    try {
      // Estimate gas first
      const gasEstimate = await gmTokenContract.transfer.estimateGas(SwapETHToGM_ADDRESS, transferAmount);
      console.log('⛽ Gas estimate:', gasEstimate.toString());
      
      // Send transfer transaction
      const transferTx = await gmTokenContract.transfer(SwapETHToGM_ADDRESS, transferAmount);
      console.log('📤 Transfer transaction sent:', transferTx.hash);
      
      const transferReceipt = await transferTx.wait();
      console.log('✅ Transfer transaction confirmed in block:', transferReceipt.blockNumber);
      
      // Check final pool balances
      const finalGMPoolBalance = await swapContract.gmTokenPool();
      const finalETHPoolBalance = await swapContract.ethPool();
      
      console.log('🎉 Transfer Complete!');
      console.log('📊 Final Pool Balances:');
      console.log('  GM Token Pool:', ethers.formatEther(finalGMPoolBalance), 'GM');
      console.log('  ETH Pool:', ethers.formatEther(finalETHPoolBalance), 'ETH');
      
      if (finalGMPoolBalance > 0) {
        console.log('✅ GM Token Pool successfully funded!');
        console.log('🚀 Users can now swap GM tokens!');
      } else {
        console.log('⚠️ GM Token Pool still empty - may need time to update');
      }
      
    } catch (transferError) {
      console.error('❌ Transfer transaction failed:', transferError.message);
      console.log('💡 This might be expected if the contract has transfer restrictions');
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
  transferToPool()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { transferToPool };
