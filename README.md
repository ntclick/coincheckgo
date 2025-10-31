# 🔮 CoinCheckGo - AI Crypto Research Platform

Nền tảng nghiên cứu cryptocurrency với AI, tích hợp dữ liệu từ nhiều nguồn uy tín. Sử dụng **Fully Homomorphic Encryption (FHE)** để bảo vệ quyền riêng tư.

🌐 **Website**: [coincheckgo.com](http://coincheckgo.com/) | 🚀 **Demo**: [coincheckgofhe.vercel.app](https://coincheckgofhe.vercel.app/) | 👤 **Author**: [@trungkts29](https://x.com/trungkts29)

---

## ✨ Chức năng chính

### 🤖 AI Research Tool
**Chỉ cần nhập tên token → Nhận báo cáo đầy đủ**

- ✅ Market data (CoinGecko): Giá, volume, market cap, 24h high/low
- ✅ Technical Analysis (Taapi.io): RSI, MACD, EMA, Bollinger Bands, ADX
- ✅ Fundamentals (CryptoRank): Tokenomics, investment funds
- ✅ AI Report (OpenAI): Báo cáo phân tích chuyên sâu với insights
- ✅ Live Charts (TradingView): Biểu đồ giá real-time

**Cost**: 10 GM tokens per research

### 💰 Token System
- **GM Token**: Native token của nền tảng
- **ETH ↔ GM Swap**: Swap ETH sang GM và ngược lại
- **FHE Encryption**: Số dư token được mã hóa hoàn toàn
- **Auto Approval**: Approve 100 GM một lần, dùng cho 10 research

### 📊 Market Dashboard
- Top 300 cryptocurrencies
- Market capitalization (20 items/page)
- Top gainers/losers (5 items each)
- News feed từ CoinDesk, Decrypt, CoinTelegraph

---

## 🚀 Roadmap - Phát triển tương lai

### 🎯 Vision: One-Click Comprehensive Research

Chỉ cần nhập tên token/dự án → Nhận đầy đủ thông tin đầu tư:

#### Dữ liệu sẽ tích hợp:
- **DeFiLlama**: TVL, protocol metrics, DeFi rankings
- **Messari**: Research reports, analytics, metrics
- **Token Unlock**: Unlock schedules, vesting info, distribution timeline
- **Social Signals**: Twitter sentiment, Reddit activity, Discord metrics, GitHub activity

#### Thông tin sẽ hiển thị:
- 📈 **Investment Info**: Top funds đã đầu tư, funding rounds, valuations
- 📅 **Unlock Schedule**: Lịch unlock chi tiết, vesting, token distribution
- 💎 **Tokenomics**: Supply breakdown, distribution, staking rewards
- 📰 **News & Updates**: Tin tức từ nhiều nguồn, social sentiment
- 📊 **Research Reports**: AI-generated reports với technical & fundamental analysis
- 💹 **Market Data**: Real-time price, volume, market cap tracking

---

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Privacy**: FHEVM SDK (Fully Homomorphic Encryption)
- **Smart Contracts**: Solidity (Hardhat)
- **APIs**: CoinGecko, Taapi.io, CryptoRank, OpenAI, TradingView
- **Deploy**: Vercel

---

## 📦 Quick Start

### 1. Install
```bash
npm install
```

### 2. Setup `.env`
```env
REACT_APP_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

REACT_APP_GM_TOKEN_ADDRESS=0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08
REACT_APP_SWAP_ADDRESS=0x438A2ce1B563E71b68F2f0EE0575736CccF3231e
REACT_APP_RESEARCH_AI_ADDRESS=0xBD341699753FEa3305bf16Eaf8228A1F96E945fF

REACT_APP_FHEVM_RELAYER_URL=https://relayer.sepolia.fhevm.xyz
REACT_APP_FHEVM_CHAIN_ID=11155111

REACT_APP_OPENAI_API_KEY=your_key
REACT_APP_OPENAI_MODEL=gpt-4
REACT_APP_CRYPTORANK_API_KEY=your_key
REACT_APP_TAAPI_API_KEY=your_key
```

### 3. Run
```bash
npm start
```

---

## 📋 Smart Contracts

| Contract | Address | Function |
|----------|---------|----------|
| GM Token | `0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08` | ERC20 + FHE encryption |
| Swap | `0x438A2ce1B563E71b68F2f0EE0575736CccF3231e` | ETH ↔ GM swap |
| Research AI | `0xBD341699753FEa3305bf16Eaf8228A1F96E945fF` | AI research với FHE |

---

## 🔐 Privacy Features

- **FHE Encryption**: Token balances được mã hóa hoàn toàn
- **EIP-712 Signatures**: Xác thực an toàn cho giải mã
- **On-chain Validation**: Tất cả validation trên blockchain
- **No Data Storage**: Không lưu dữ liệu nhạy cảm trên server

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

- **Production**: [coincheckgo.com](http://coincheckgo.com/) *(Coming soon)*
- **Demo**: [coincheckgofhe.vercel.app](https://coincheckgofhe.vercel.app/)
- **Author**: [@trungkts29](https://x.com/trungkts29)

---

## 📄 License

MIT License

---

**Note**: Hiện tại chạy trên Sepolia Testnet. Cần Sepolia ETH và MetaMask để sử dụng.
