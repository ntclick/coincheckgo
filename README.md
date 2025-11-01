# 🔮 CoinCheckGo - AI Crypto Research Platform

An AI-powered crypto research platform aggregating trusted market, technical, and fundamentals data — with privacy by default using **Fully Homomorphic Encryption (FHE)**.

🌐 **Website**: [coincheckgo.com](http://coincheckgo.com/) | 🚀 **Demo**: [coincheckgo.vercel.app](https://coincheckgo.vercel.app/) | 👤 **Author**: [@trungkts29](https://x.com/trungkts29)

---

## ✨ Core Features

### 🤖 AI Research Tool
**Type a token name → Get a complete investment-grade report**

- ✅ Market Data (CoinGecko): Price, volume, market cap, 24h high/low, circulating supply
- ✅ Technical Analysis (Taapi.io): RSI, MACD, EMA, Bollinger Bands, ADX
- ✅ Fundamentals (CryptoRank): Tokenomics, investment funds
- ✅ AI Report (OpenAI): Expert-style, human-readable insights with GPT-4
- ✅ Live Charts (Dexscreener): Real-time DEX price charts embedded

**Cost**: 10 GM tokens per research

### 💰 Token System
- **GM Token**: The platform's native utility token (ERC20 + FHE hybrid)
- **ETH ↔ GM Swap**: 
  - ETH → GM: Hybrid swap (public + confidential)
  - GM → ETH: FHE confidential swap
- **FHE Encryption**: Balances are fully encrypted at rest and on-chain
- **Liquidity Pool**: AMM-based swap with pool management
- **Smart Approval**: One-time approval for FHE transfers

### 📊 Market Dashboard
- Top 300 cryptocurrencies
- Market capitalization with pagination (20 items/page)
- Top gainers/losers (10 items each)
- News feed from CoinDesk, Decrypt, CoinTelegraph with pagination (12 items/page)
- Real-time crypto market data and price tracking

---

## 🚀 Roadmap

### 🎯 Vision: One‑Click Comprehensive Research
Enter a token/project name → receive a complete institutional-grade profile.

#### Upcoming Data Integrations
- **DeFiLlama**: TVL, protocol metrics, DeFi rankings
- **Messari**: Research reports, analytics, metrics
- **Token Unlocks**: Schedules, vesting, distributions
- **Social Signals**: Twitter/Reddit/Discord sentiment, GitHub activity

#### What You’ll See
- 📈 **Investment Intelligence**: Top funds invested, rounds, valuations
- 📅 **Unlock Schedule**: Precise timelines, vesting, distributions
- 💎 **Tokenomics**: Supply breakdown, allocations, staking rewards
- 📰 **News & Sentiment**: Multi-source feeds with sentiment blending
- 📊 **AI Reports**: TA + fundamentals + market context, readable tone
- 💹 **Live Market Data**: Price, volume, market cap in real time

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Craco
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Privacy**: FHEVM SDK v0.2 (@zama-fhe/relayer-sdk)
- **Smart Contracts**: Solidity (Hardhat + OpenZeppelin Confidential)
- **Wallet Integration**: MetaMask (Ethers.js v6)
- **APIs**: CoinGecko, Taapi.io, CryptoRank, OpenAI (GPT-4), Dexscreener
- **Build Tools**: Webpack + Node polyfills
- **Notifications**: React Hot Toast
- **Hosting**: Vercel

---

## 📦 Quick Start

### 1) Install
```bash
npm install
```

### 2) Configure `.env`
```env
REACT_APP_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

REACT_APP_GM_TOKEN_ADDRESS=0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08
REACT_APP_SWAP_ADDRESS=0xd0e183F11948CbA9DAF6AC46861DC805231aFA7A
REACT_APP_RESEARCH_AI_ADDRESS=0xBD341699753FEa3305bf16Eaf8228A1F96E945fF

REACT_APP_FHEVM_RELAYER_URL=https://relayer.sepolia.fhevm.xyz
REACT_APP_FHEVM_CHAIN_ID=11155111

REACT_APP_OPENAI_API_KEY=your_key
REACT_APP_OPENAI_MODEL=gpt-4
REACT_APP_CRYPTORANK_API_KEY=your_key
REACT_APP_TAAPI_API_KEY=your_key

# Optional: For local development
REACT_APP_COINCHECKGO_API_KEY=your_coingecko_key
```

### 3) Run Development Server
```bash
# Start React app
npm start

# In another terminal, start backend proxy server
npm run server
```

The app runs on `http://localhost:4000`

---

## 📋 Smart Contracts (Sepolia Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| GM Token | `0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08` | ERC20 + FHE hybrid token with confidential balances |
| Swap | `0xd0e183F11948CbA9DAF6AC46861DC805231aFA7A` | ETH ↔ GM AMM swap with liquidity pool |
| Research AI | `0xBD341699753FEa3305bf16Eaf8228A1F96E945fF` | AI research payment (FHE-ready) |

**Swap Rate**: 1 ETH = 100,000 GM (0.001 ETH = 100 GM)
**Swap Fee**: 0.3%

---

## 🔐 Privacy Features

- **FHE Encryption**: Token balances encrypted end‑to‑end
- **EIP‑712 Signatures**: Secure user-side decryption setup
- **On‑chain Validation**: Business rules enforced on-chain
- **No Sensitive Storage**: No server‑side storage of private data

---

## 🔎 Where FHE Is Used (Exactly)

- **Confidential GM Balances (YES, FHE)**
  - GM token balances are stored on-chain in encrypted form.
  - The app performs a one-time EIP‑712 signature to establish a local decryption session.
  - Until decrypted, the UI shows the public GM balance; after decryption, it prefers the confidential balance.

- **AI Research Payment (FHE‑ready on-chain deduction)**
  - Research costs 10 GM. The contract supports confidential (FHE) balance accounting for deductions when available on the target network/tooling.
  - ERC‑20 approval and spending cap prompts are standard (public) allowance mechanics.

- **Swaps**
  - ETH → GM: Public mint/swap path (non‑FHE), suitable for onboarding.
  - GM → ETH: FHE spend path is supported (confidential GM to public ETH).

- **Not FHE (by design)**
  - Market/price/news data (CoinGecko, CryptoRank, feeds)
  - TA indicators (Taapi.io) and AI text output
  - Wallet address, tx hashes, and on-chain metadata

Notes:
- FHE decryption happens locally and keys never leave the browser.
- If FHE SDK is not initialized yet, the app gracefully falls back to public balances for display, without exposing confidential values.

---

## 📂 Project Structure

```
src/
├── components/
│   ├── CompleteDashboard.tsx    # Main dashboard
│   └── AIResearchTool.tsx       # AI research tool
├── hooks/
│   └── useCoinCheckGoFHE_Simple.ts  # Wallet & contracts
├── services/
│   ├── cryptoApiService.ts      # CoinGecko API
│   ├── taapiService.ts          # Technical analysis
│   ├── cryptoRankService.ts     # Fundamentals
│   └── aiReportService.ts       # OpenAI reports
└── utils/
    └── fhevm.ts                 # FHEVM initialization
```

---

## 🌐 Links

- **Production**: [coincheckgo.com](http://coincheckgo.com/) *(coming soon)*
- **Demo**: [coincheckgo.vercel.app](https://coincheckgo.vercel.app/)
- **Author**: [@trungkts29](https://x.com/trungkts29)
- **Demo Video**: [YouTube Demo](https://www.youtube.com/watch?v=zbNFWXedU0o)

---

## 📄 License

MIT License

---

**Note**: Runs on Sepolia Testnet. You’ll need Sepolia ETH and MetaMask to use the app.
