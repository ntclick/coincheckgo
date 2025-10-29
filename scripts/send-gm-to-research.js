const { ethers } = require('hardhat');

async function main() {
  console.log('💰 Sending GM tokens to Research contract...');
  
  // Contract addresses (update these with your actual addresses)
  const RESEARCH_CONTRACT_ADDRESS = '0x0f45E8Fd3BB3ef64D93741bC1F9cf9cB53675aB8'; // Current research contract
  const GM_TOKEN_ADDRESS = '0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08'; // Current GM token
  
  // Amount to send (in GM tokens)
  const AMOUNT_TO_SEND = '10000'; // 10,000 GM tokens
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Using account:', deployer.address);
  console.log('💰 Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH');
  
  // Connect to contracts
  const gmToken = await ethers.getContractAt('GMCleanTokenHybrid', GM_TOKEN_ADDRESS);
  const researchContract = await ethers.getContractAt('GMResearchAI', RESEARCH_CONTRACT_ADDRESS);
  
  // Check current balances
  const deployerGMBalance = await gmToken.balanceOf(deployer.address);
  const contractGMBalance = await gmToken.balanceOf(RESEARCH_CONTRACT_ADDRESS);
  
  console.log('\n📊 Current Balances:');
  console.log('- Deployer GM Balance:', ethers.utils.formatEther(deployerGMBalance), 'GM');
  console.log('- Contract GM Balance:', ethers.utils.formatEther(contractGMBalance), 'GM');
  
  // Amount to send
  const sendAmount = ethers.utils.parseEther(AMOUNT_TO_SEND);
  console.log('\n💸 Amount to send:', ethers.utils.formatEther(sendAmount), 'GM');
  
  // Check if deployer has enough GM tokens
  if (deployerGMBalance.lt(sendAmount)) {
    console.error('❌ Insufficient GM balance. Need:', ethers.utils.formatEther(sendAmount), 'GM');
    console.error('   Current balance:', ethers.utils.formatEther(deployerGMBalance), 'GM');
    console.log('\n💡 Solutions:');
    console.log('1. Mint more GM tokens first');
    console.log('2. Reduce the amount to send');
    console.log('3. Use a different account with more GM tokens');
    process.exit(1);
  }
  
  // Check current allowance
  const currentAllowance = await gmToken.allowance(deployer.address, RESEARCH_CONTRACT_ADDRESS);
  console.log('- Current Allowance:', ethers.utils.formatEther(currentAllowance), 'GM');
  
  // Approve if needed
  if (currentAllowance.lt(sendAmount)) {
    console.log('\n🔐 Approving GM tokens...');
    const approveTx = await gmToken.approve(RESEARCH_CONTRACT_ADDRESS, sendAmount);
    console.log('⏳ Waiting for approval transaction...');
    await approveTx.wait();
    console.log('✅ Approval confirmed');
  }
  
  // Send GM tokens to contract using fundPool function
  console.log('\n💸 Sending GM tokens to research contract...');
  const fundTx = await researchContract.fundPool(sendAmount);
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
  
  console.log('\n🎉 GM tokens sent successfully!');
  console.log('✅ Research contract is now funded and ready for use');
  console.log('📋 Contract Address:', RESEARCH_CONTRACT_ADDRESS);
  console.log('💰 Amount Sent:', ethers.utils.formatEther(sendAmount), 'GM');
  
  return {
    contractAddress: RESEARCH_CONTRACT_ADDRESS,
    amountSent: ethers.utils.formatEther(sendAmount),
    finalBalance: ethers.utils.formatEther(finalContractBalance)
  };
}

main()
  .then((result) => {
    console.log('\n📄 Transaction Summary:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Transaction failed:', error);
    process.exit(1);
  });
