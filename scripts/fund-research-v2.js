const { ethers } = require('hardhat');

async function main() {
  console.log('💰 Funding GMResearchAI_V2 contract...');
  
  // Contract addresses (update these with your deployed addresses)
  const RESEARCH_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual address
  const GM_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual address
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Using account:', deployer.address);
  console.log('💰 Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH');
  
  // Connect to contracts
  const gmToken = await ethers.getContractAt('GMCleanTokenHybrid', GM_TOKEN_ADDRESS);
  const researchContract = await ethers.getContractAt('GMResearchAI_V2', RESEARCH_CONTRACT_ADDRESS);
  
  // Check current balances
  const deployerGMBalance = await gmToken.balanceOf(deployer.address);
  const contractGMBalance = await gmToken.balanceOf(RESEARCH_CONTRACT_ADDRESS);
  
  console.log('\n📊 Current Balances:');
  console.log('- Deployer GM Balance:', ethers.utils.formatEther(deployerGMBalance), 'GM');
  console.log('- Contract GM Balance:', ethers.utils.formatEther(contractGMBalance), 'GM');
  
  // Amount to fund (10,000 GM tokens)
  const fundAmount = ethers.utils.parseEther('10000');
  console.log('\n💸 Funding Amount:', ethers.utils.formatEther(fundAmount), 'GM');
  
  // Check if deployer has enough GM tokens
  if (deployerGMBalance.lt(fundAmount)) {
    console.error('❌ Insufficient GM balance. Need:', ethers.utils.formatEther(fundAmount), 'GM');
    console.error('   Current balance:', ethers.utils.formatEther(deployerGMBalance), 'GM');
    process.exit(1);
  }
  
  // Check current allowance
  const currentAllowance = await gmToken.allowance(deployer.address, RESEARCH_CONTRACT_ADDRESS);
  console.log('- Current Allowance:', ethers.utils.formatEther(currentAllowance), 'GM');
  
  // Approve if needed
  if (currentAllowance.lt(fundAmount)) {
    console.log('\n🔐 Approving GM tokens...');
    const approveTx = await gmToken.approve(RESEARCH_CONTRACT_ADDRESS, fundAmount);
    console.log('⏳ Waiting for approval transaction...');
    await approveTx.wait();
    console.log('✅ Approval confirmed');
  }
  
  // Fund the contract
  console.log('\n💸 Funding research contract...');
  const fundTx = await researchContract.fundPool(fundAmount);
  console.log('⏳ Waiting for funding transaction...');
  await fundTx.wait();
  console.log('✅ Funding confirmed');
  
  // Check final balances
  const finalDeployerBalance = await gmToken.balanceOf(deployer.address);
  const finalContractBalance = await gmToken.balanceOf(RESEARCH_CONTRACT_ADDRESS);
  
  console.log('\n📊 Final Balances:');
  console.log('- Deployer GM Balance:', ethers.utils.formatEther(finalDeployerBalance), 'GM');
  console.log('- Contract GM Balance:', ethers.utils.formatEther(finalContractBalance), 'GM');
  
  // Get contract statistics
  const [totalResearch, totalGMCollected] = await researchContract.getStatistics();
  const totalCheckIns = await researchContract.totalCheckIns();
  
  console.log('\n📈 Contract Statistics:');
  console.log('- Total Research Count:', totalResearch.toString());
  console.log('- Total GM Collected:', ethers.utils.formatEther(totalGMCollected), 'GM');
  console.log('- Total Check-ins:', totalCheckIns.toString());
  
  // Get time info
  const [timestamp, utcDay, nextReset] = await researchContract.getTimeInfo();
  const timeUntilReset = await researchContract.getTimeUntilNextReset();
  
  console.log('\n⏰ Time Info:');
  console.log('- Current UTC Day:', utcDay.toString());
  console.log('- Time Until Next Reset:', ethers.utils.formatUnits(timeUntilReset, 0), 'seconds');
  console.log('- Next Reset (7:00 AM UTC+7):', new Date(parseInt(nextReset) * 1000).toLocaleString());
  
  console.log('\n🎉 Contract funding completed successfully!');
  console.log('✅ Research contract is ready for use');
  console.log('📋 Contract Address:', RESEARCH_CONTRACT_ADDRESS);
  console.log('💰 Funded Amount:', ethers.utils.formatEther(fundAmount), 'GM');
  
  return {
    contractAddress: RESEARCH_CONTRACT_ADDRESS,
    fundedAmount: ethers.utils.formatEther(fundAmount),
    finalBalance: ethers.utils.formatEther(finalContractBalance)
  };
}

main()
  .then((result) => {
    console.log('\n📄 Funding Summary:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Funding failed:', error);
    process.exit(1);
  });
