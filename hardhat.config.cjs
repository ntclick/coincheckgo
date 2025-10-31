require('dotenv').config();
require('@nomicfoundation/hardhat-ethers');

module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.27',
        settings: { optimizer: { enabled: true, runs: 200 } }
      },
      {
        version: '0.8.24',
        settings: { optimizer: { enabled: true, runs: 200 } }
      }
    ]
  },
  networks: {
    hardhat: { chainId: 11155111 },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },
  paths: {
    sources: './contracts_deploy',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  }
};


