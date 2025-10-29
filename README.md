## CoinCheckGo dApp (FHE Hybrid) – Architecture, Logic, and Roadmap

### 1) Overview
- **Goal**: Hybrid decentralized app for ETH ↔ GM swaps, Daily Check-in rewards, and AI-powered crypto research.
- **Networks**: Sepolia.
- **Privacy**: Hybrid model — public ETH→GM; confidential GM→ETH (FHEVM-compatible path), with pragmatic public fallbacks.

### 2) Core Architecture
- **Frontend**: React (TypeScript) under `src/` with a thin injected script in `public/index.html` for wallet + FHEVM bootstrap.
- **Contracts** (addresses are configured in code):
  - `GMCleanTokenHybrid` (GM token; hybrid public+confidential balance helpers)
  - `GMERC7984SwapHybrid` (swap / pool management with fixed-rate paths and AMM helpers)
  - `GMResearchAI_V2_Final` (Daily Check‑in + AI Research costing)
- **Services**:
  - `cryptoApiService` (CoinGecko markets, search)
  - `taapiService` (technical indicators, bulk API)
  - `cryptoCompareService` (social sentiment)
  - `aiReportService` (OpenAI orchestration; recommend server proxy)
- **State Sharing**: `useCoinCheckGoFHE_Simple` exposes a minimal global state bridge to avoid React Strict Mode multi‑instance drift.

### 3) Wallet, Network, and FHEVM
- **Wallet Connect**: MetaMask via `ethers` in `public/index.html` and `useCoinCheckGoFHE_Simple`.
- **Network**: Auto‑prompt switch to Sepolia on connect.
- **EIP‑712 Decryption**:
  - Triggered once post‑connect; debounced to avoid spam.
  - Confidential balance parsed safely (BigInt, nested object handling) and displayed.
- **COOP/COEP Headers**: `server.js` and `vercel.json` ensure threads/WebAssembly are available for FHEVM SDK.

### 4) Token Balances and Pool
- Token balances loaded from wallet; confidential balance decrypted after EIP‑712.
- Pool status shown via swap contract (public reserves). Regular users can view pool.
- Initialize pool with ETH + GM. Owner can add liquidity; APR logic is planned on‑chain.

### 5) Swaps
- **ETH → GM (Public)**:
  - Fixed rate baseline: 0.001 ETH = 100 GM (1 ETH = 100,000 GM) minus fee.
  - UI shows rate with fee and direction toggle.
- **GM → ETH (Confidential target)**:
  - UX path exists; on‑chain FHE path is stubbed with hybrid/public fallback to ensure execution reliability.
  - Approval flow fixed to use user input (not unlimited cap).

### 6) Daily Check‑in
- Contract: `GMResearchAI_V2_Final.dailyCheckIn()` rewards 100 GM/day.
- Reset: 00:00 UTC (07:00 UTC+7). Countdown and availability handled in UI.
- After tx mined, one decryption trigger updates confidential balance; debounce prevents multiple prompts.

### 7) AI Crypto Research Tool
- Flow: On‑chain cost (10 GM) → wait for confirmation → pull real data → generate AI report.
- Data sources:
  - Market: CoinGecko (`cryptoApiService` with multi‑page + API key fallback)
  - Technicals: Taapi.io (`taapiService` with bulk indicators; mock fallback behind `REACT_APP_ALLOW_MOCK`)
  - Sentiment: CryptoCompare (`cryptoCompareService`)
  - AI Report: OpenAI via `aiReportService` (recommend backend proxy for key security)
- UI: Wider layout, TradingView chart, market/TA/sentiment cards, AI summary and verdict.
- Suggestions: Top 300 coins (local JSON fallback `src/data/top_coins.json` + remote search merge).

### 8) Files You’ll Touch Most
- `public/index.html` – Wallet + FHEVM bootstrap, contract ABIs/addresses, balance decrypt, check‑in availability bridge.
- `src/hooks/useCoinCheckGoFHE_Simple.ts` – Wallet state, contracts, check‑in/research calls, global state bridge.
- `src/components/CompleteDashboard.tsx` – Main dashboard, countdown timer, page routing.
- `src/components/AIResearchTool.tsx` – Research workflow, data fetch, AI report rendering.
- `src/services/*` – API integrations and caching.

### 9) Deployment
- **Local**: `node server.js` (serves React dev with headers) + `npm start` inside the React app if needed.
- **Vercel**: Root set to `fhevm-react-template/coincheckgogithub`. `vercel.json` applies COOP/COEP headers.

### 10) Environment
- Frontend reads `REACT_APP_*` variables. Keys needed:
  - `REACT_APP_TAAPI_API_KEY`
  - `REACT_APP_CRYPTOCOMPARE_API_KEY`
  - `REACT_APP_COINCHECKGO_API_KEY` (CoinGecko demo key optional)
  - `REACT_APP_ALLOW_MOCK=true|false` (fallbacks for missing keys)
- OpenAI key should NOT be exposed in frontend. Use a backend proxy route.

### 11) Known Safeguards and Fixes
- Prevent EIP‑712 spamming; single decrypt trigger after important tx (check‑in/research).
- Balance parsing tolerates BigInt and various gateway result shapes.
- Approval amounts match user input (avoid huge spending caps).
- Strict Mode multi‑instance fixed via global shared state and listeners.

### 12) Roadmap – Next Upgrades for Deeper Research
- **Privacy & Swap**
  - Full confidential GM→ETH with on‑chain FHE arithmetic (remove public fallback)
  - Pool reward logic (10% APR) with claim/withdraw; per‑provider accounting
  - Robust operator permissions and ACL checks for FHE handles
- **Research Depth**
  - Multi‑timeframe TA (15m/1h/4h/1d) with consensus signals
  - On‑chain analytics: DEX volume, holders, whale flows (Etherscan/Chain APIs)
  - News intelligence: CoinDesk/Decrypt/CoinTelegraph RSS merged, dedup, entity extraction
  - Social sentiment enrichment (Twitter/Reddit via CryptoCompare extensions)
  - Smart prompts with retrieval‑augmented generation (RAG) over fetched data
  - Risk scoring model blending TA/FA/sentiment/liquidity/volatility
- **Performance & UX**
  - Caching layer (Redis/Edge KV) for API responses and AI summaries
  - Pre‑fetching and background refresh for top coins
  - Accessible, responsive cards with skeleton loaders and error boundaries
- **Reliability & Ops**
  - Backend proxy services for OpenAI/Crypto APIs with rate‑limit handling
  - Observability: structured logs for swaps, check‑ins, research sessions
  - Test coverage for hooks/services; CI checks

### 13) Maintenance Checklist
- Verify contract addresses in `public/index.html` and `useCoinCheckGoFHE_Simple.ts` match deployments.
- Ensure COOP/COEP headers active in hosting environment.
- Keep API keys fresh; set `REACT_APP_ALLOW_MOCK=false` for production.
- Monitor MetaMask network auto‑switch and EIP‑712 prompts on first load.

—
For deployment steps and environment setup, see package scripts and `server.js`. For questions, check `src/services/*` and hook files first.


