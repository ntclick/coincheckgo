// Use CommonJS for Hardhat runtime compatibility
/* eslint-disable @typescript-eslint/no-var-requires */
const hre = require('hardhat');
const { ethers } = hre;
require('dotenv').config();

async function main() {
  console.log('🚀 Deploying GMERC7984SwapHybrid contract with FHE support...');

  const [deployer] = await ethers.getSigners();
  console.log('👤 Deploying contracts with account:', deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'ETH');

  // Get GM Token address from environment
  const GM_TOKEN_ADDRESS = process.env.REACT_APP_GM_TOKEN_ADDRESS;
  if (!GM_TOKEN_ADDRESS) {
    throw new Error('REACT_APP_GM_TOKEN_ADDRESS not set in .env');
  }
  console.log('🪙 GM Token Address:', GM_TOKEN_ADDRESS);

  // Load from contracts folder
  const swapFactory = await ethers.getContractFactory('GMERC7984SwapHybrid');
  console.log('📦 Using GMERC7984SwapHybrid from contracts folder');

  // Deploy swap contract
  const swapContract = await swapFactory.deploy(GM_TOKEN_ADDRESS);
  await swapContract.waitForDeployment();

  const swapAddress = await swapContract.getAddress();
  console.log('✅ GMERC7984SwapHybrid deployed to:', swapAddress);

  // Set swap contract as operator for token (required for FHE confidential transfers)
  console.log('🔐 Setting swap contract as operator for FHE transfers...');
  const gmToken = await ethers.getContractAt('GMCleanTokenHybrid', GM_TOKEN_ADDRESS);
  
  try {
    const maxDuration = ethers.parseUnits('18446744073709551615', 0); // uint48.max in decimal
    const setOperatorTx = await gmToken.setOperator(swapAddress, maxDuration);
    await setOperatorTx.wait();
    console.log('✅ Swap contract set as operator');
  } catch (error) {
    console.log('⚠️ Could not set operator automatically:', error.message);
    console.log('💡 You may need to set operator manually or it may be set later');
  }

  // Fund swap contract with initial liquidity (optional)
  console.log('💰 Initializing pool with 10,000 GM tokens and 0.1 ETH...');
  
  try {
    const ownerGMBalance = await gmToken.balanceOf(deployer.address);
    const fundAmount = ethers.parseEther('10000');
    console.log('💰 Owner GM Balance:', ethers.formatEther(ownerGMBalance), 'GM');
    
    if (ownerGMBalance >= fundAmount) {
      // Approve swap contract to spend GM
      const approveTx = await gmToken.approve(swapAddress, fundAmount);
      await approveTx.wait();
      console.log('✅ Approval successful');
      
      // Add liquidity
      const addLiquidityTx = await swapContract.addLiquidity(fundAmount, { 
        value: ethers.parseEther('0.1') 
      });
      await addLiquidityTx.wait();
      console.log('✅ Initial liquidity added');
      
      // Check pool balances
      const [ethReserve, gmReserve] = await swapContract.getReserves();
      console.log('📊 Pool Balances:');
      console.log('   ETH Reserve:', ethers.formatEther(ethReserve), 'ETH');
      console.log('   GM Reserve:', ethers.formatEther(gmReserve), 'GM');
    } else {
      console.log('⚠️ Insufficient GM balance to fund contract');
      console.log('💡 Pool will be auto-initialized on first swap');
    }
  } catch (error) {
    console.log('⚠️ Could not add liquidity automatically:', error.message);
    console.log('💡 Pool will be auto-initialized on first swap');
  }

  console.log('\n🎉 Deployment Complete!');
  console.log('📝 Update your .env file:');
  console.log(`REACT_APP_SWAP_CONTRACT_ADDRESS=${swapAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });

