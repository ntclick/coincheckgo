const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Deploying GMResearchAI_V2 contract...');
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying with account:', deployer.address);
  console.log('💰 Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH');
  
  // GM Token address (update this with your deployed token address)
  const GM_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual address
  
  // Deploy the contract
  const GMResearchAI_V2 = await ethers.getContractFactory('GMResearchAI_V2');
  const researchContract = await GMResearchAI_V2.deploy(GM_TOKEN_ADDRESS);
  
  console.log('⏳ Waiting for deployment...');
  await researchContract.deployed();
  
  console.log('✅ GMResearchAI_V2 deployed to:', researchContract.address);
  console.log('🔗 GM Token address:', GM_TOKEN_ADDRESS);
  
  // Verify deployment
  console.log('\n📊 Contract Info:');
  console.log('- Research Cost:', ethers.utils.formatEther(await researchContract.getResearchCost()), 'GM');
  console.log('- Check-in Reward:', ethers.utils.formatEther(await researchContract.getCheckInReward()), 'GM');
  console.log('- Contract Balance:', ethers.utils.formatEther(await researchContract.getContractBalance()), 'GM');
  
  // Get time info
  const [timestamp, utcDay, nextReset] = await researchContract.getTimeInfo();
  console.log('\n⏰ Time Info:');
  console.log('- Current Timestamp:', timestamp.toString());
  console.log('- Current UTC Day:', utcDay.toString());
  console.log('- Next Reset Time:', nextReset.toString());
  console.log('- Time Until Next Reset:', ethers.utils.formatUnits(await researchContract.getTimeUntilNextReset(), 0), 'seconds');
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: researchContract.address,
    gmTokenAddress: GM_TOKEN_ADDRESS,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    network: 'sepolia',
    version: 'V2',
    features: [
      'Daily check-in with UTC+7 timezone (resets at 7:00 AM UTC+7)',
      'Research types: Basic, Advanced, Premium (all cost 10 GM)',
      'Check-in reward: 100 GM tokens',
      'FHE confidential research support',
      'Enhanced time tracking and statistics'
    ]
  };
  
  console.log('\n📄 Deployment Summary:');
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Instructions for next steps
  console.log('\n🔧 Next Steps:');
  console.log('1. Update frontend contract address to:', researchContract.address);
  console.log('2. Fund the contract with GM tokens for check-in rewards');
  console.log('3. Test daily check-in functionality');
  console.log('4. Test research functionality');
  
  return researchContract.address;
}

main()
  .then((address) => {
    console.log('\n🎉 Deployment completed successfully!');
    console.log('📋 Contract Address:', address);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
