import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('🚀 Deploying GMResearchAI_V2_Final contract...');

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

  // Deploy GMResearchAI_V2_Final
  const GMResearchAI_V2_Final = await ethers.getContractFactory('GMResearchAI_V2_Final');
  const researchContract = await GMResearchAI_V2_Final.deploy(GM_TOKEN_ADDRESS);
  await researchContract.waitForDeployment();

  const researchAddress = await researchContract.getAddress();
  console.log('✅ GMResearchAI_V2_Final deployed to:', researchAddress);

  // Fund the contract with 10,000 GM
  console.log('💰 Funding contract with 10,000 GM...');
  const gmToken = await ethers.getContractAt('IERC20', GM_TOKEN_ADDRESS);
  
  const fundAmount = ethers.parseEther('10000');
  const ownerGMBalance = await gmToken.balanceOf(deployer.address);
  console.log('💰 Owner GM Balance:', ethers.formatEther(ownerGMBalance), 'GM');

  if (ownerGMBalance >= fundAmount) {
    const transferTx = await gmToken.transfer(researchAddress, fundAmount);
    await transferTx.wait();
    console.log('✅ Contract funded with 10,000 GM');
    
    const poolBalance = await researchContract.getPoolBalance();
    console.log('🏦 Pool Balance:', ethers.formatEther(poolBalance), 'GM');
  } else {
    console.log('⚠️ Insufficient GM balance to fund contract');
  }

  console.log('\n🎉 Deployment Complete!');
  console.log('📝 Update your .env file:');
  console.log(`REACT_APP_RESEARCH_AI_ADDRESS=${researchAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
