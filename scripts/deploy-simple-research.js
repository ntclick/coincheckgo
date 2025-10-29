const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Deploying SimpleResearch contract...');

  const [deployer] = await ethers.getSigners();
  console.log('👤 Deploying with account:', deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'ETH');

  // Get the GM Token address
  const GM_TOKEN_ADDRESS = '0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08';
  console.log('🪙 GM Token address:', GM_TOKEN_ADDRESS);

  // Deploy the contract
  const SimpleResearch = await ethers.getContractFactory('SimpleResearch');
  const simpleResearch = await SimpleResearch.deploy(GM_TOKEN_ADDRESS);
  await simpleResearch.waitForDeployment();

  const contractAddress = await simpleResearch.getAddress();
  console.log('✅ SimpleResearch deployed to:', contractAddress);

  // Fund the contract with 10,000 GM
  console.log('💰 Funding contract with 10,000 GM...');
  const gmTokenAbi = [
    "function transfer(address recipient, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
  ];
  const gmTokenContract = new ethers.Contract(GM_TOKEN_ADDRESS, gmTokenAbi, deployer);
  
  const fundAmount = ethers.parseEther("10000");
  const ownerGMBalance = await gmTokenContract.balanceOf(deployer.address);
  console.log('💰 Owner GM Balance:', ethers.formatEther(ownerGMBalance), 'GM');
  
  if (ownerGMBalance >= fundAmount) {
    const transferTx = await gmTokenContract.transfer(contractAddress, fundAmount);
    await transferTx.wait();
    console.log('✅ Contract funded with 10,000 GM');
    
    const poolBalance = await simpleResearch.getPoolBalance();
    console.log('🏦 Pool Balance:', ethers.formatEther(poolBalance), 'GM');
  } else {
    console.log('⚠️ Insufficient GM balance to fund contract');
  }

  console.log('\n🎉 Deployment Complete!');
  console.log('📝 Update your .env file:');
  console.log(`REACT_APP_RESEARCH_AI_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
