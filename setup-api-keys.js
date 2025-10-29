#!/usr/bin/env node

/**
 * API Keys Setup Script for AI Research Tool
 * 
 * This script helps you set up API keys for the AI Research Tool.
 * You can get free API keys from the following services:
 * 
 * 1. Taapi.io (Technical Analysis) - https://taapi.io/
 * 2. CryptoCompare (Social Sentiment) - https://min-api.cryptocompare.com/
 * 3. OpenAI (AI Reports) - https://platform.openai.com/
 * 4. CoinGecko (Market Data) - https://www.coingecko.com/en/api
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created from env.example');
  } else {
    // Create a basic .env file
    const basicEnv = `# API Keys for AI Research Tool
# Get your free API keys from the following services:

# Taapi.io API Key - Technical Analysis
# Get free key at: https://taapi.io/
REACT_APP_TAAPI_API_KEY=your_taapi_api_key_here

# CryptoCompare API Key - Social Sentiment
# Get free key at: https://min-api.cryptocompare.com/
REACT_APP_CRYPTOCOMPARE_API_KEY=your_cryptocompare_api_key_here

# OpenAI API Key - AI Reports
# Get key at: https://platform.openai.com/
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_OPENAI_API_URL=https://api.openai.com/v1
REACT_APP_OPENAI_MODEL=gpt-4o-mini

# CoinGecko API Key (optional - free tier available)
# Get key at: https://www.coingecko.com/en/api
REACT_APP_COINCHECKGO_API_KEY=your_coingecko_api_key_here

# Allow mock data when APIs are not available
REACT_APP_ALLOW_MOCK=true

# Contract Addresses
REACT_APP_GMToken_ADDRESS=0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08
REACT_APP_SwapETHToGM_ADDRESS=0x438A2ce1B563E71b68F2f0EE0575736CccF3231e
REACT_APP_Research_ADDRESS=0x0f45E8Fd3BB3ef64D93741bC1F9cf9cB53675aB8

# Network Configuration
REACT_APP_NETWORK=sepolia
REACT_APP_CHAIN_ID=11155111
REACT_APP_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/oppYpzscO7hdTG6hopypG6Opn3Xp7lR_

# FHEVM Configuration
REACT_APP_RELAYER_URL=https://relayer.testnet.zama.cloud
REACT_APP_ACL_CONTRACT=0x687820221192C5B662b25367F70076A37bc79b6c
REACT_APP_FHEVM_ACL_CONTRACT=0x687820221192C5B662b25367F70076A37bc79b6c
REACT_APP_KMS_VERIFIER_CONTRACT=0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
REACT_APP_FHEVM_KMS_VERIFIER_CONTRACT=0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
REACT_APP_INPUT_VERIFIER_CONTRACT=0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4
REACT_APP_FHEVM_INPUT_VERIFIER_CONTRACT=0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4
REACT_APP_DECRYPTION_ADDRESS=0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1
REACT_APP_FHEVM_DECRYPTION_ADDRESS=0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1
REACT_APP_INPUT_VERIFICATION_ADDRESS=0x7048C39f048125eDa9d678AEbaDfB22F7900a29F

# Etherscan API Key
REACT_APP_ETHERSCAN_API_KEY=SMYU9ZMV9DB55ZAFPW5JKN56S52RVBIWX6
PRIVATE_KEY=859b25f164df967d1b6b04b81693a9f53785a6f2b03bf3c6b20796f60ca8d814
`;
    
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Basic .env file created');
  }
}

console.log(`
🔑 API Keys Setup for AI Research Tool
=====================================

To get the full AI Research Tool experience with real data, you need to set up API keys.

📋 Required API Keys:
1. Taapi.io (Technical Analysis) - FREE
   URL: https://taapi.io/
   Purpose: RSI, MACD, EMA, Bollinger Bands, ADX indicators
   Features: Bulk queries, real-time data, 20+ indicators

2. CryptoCompare (Social Sentiment) - FREE
   URL: https://min-api.cryptocompare.com/
   Purpose: Social sentiment, buzz scores, community data

3. OpenAI (AI Reports) - PAID
   URL: https://platform.openai.com/
   Purpose: AI-powered research reports and analysis

4. CoinGecko (Market Data) - FREE
   URL: https://www.coingecko.com/en/api
   Purpose: Enhanced rate limits for cryptocurrency data

📝 Setup Instructions:
1. Edit the .env file in this directory
2. Replace the placeholder values with your actual API keys
3. Restart the React app: npm start

💡 Note: The app will work with mock data if API keys are not provided,
but real data provides much better analysis results.

🔧 Current Status:
- .env file: ${fs.existsSync(envPath) ? '✅ Found' : '❌ Missing'}
- Mock data fallback: ✅ Enabled (REACT_APP_ALLOW_MOCK=true)
`);

// Check current API key status
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  console.log('\n📊 Current API Key Status:');
  console.log('========================');
  
  const apiKeys = [
    'REACT_APP_TAAPI_API_KEY',
    'REACT_APP_CRYPTOCOMPARE_API_KEY', 
    'REACT_APP_OPENAI_API_KEY',
    'REACT_APP_COINCHECKGO_API_KEY'
  ];
  
  apiKeys.forEach(key => {
    const line = lines.find(l => l.startsWith(key));
    if (line) {
      const value = line.split('=')[1];
      const status = value && !value.includes('your_') && !value.includes('placeholder') ? '✅ Set' : '❌ Not Set';
      console.log(`${key}: ${status}`);
    } else {
      console.log(`${key}: ❌ Missing`);
    }
  });
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Get your free API keys from the URLs above');
  console.log('2. Edit .env file and replace placeholder values');
  console.log('3. Restart the app: npm start');
  console.log('4. Test the AI Research Tool with real data!');
}
