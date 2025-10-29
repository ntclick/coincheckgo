export interface Portfolio {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: number;
  totalItems: number;
}

export interface PortfolioItem {
  coinId: string;
  amount: string;
  purchasePrice: string;
  index: number;
  portfolioId: number;
}

export interface PnLData {
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  pnl: number;
  pnlPercentage: number;
}

export interface PortfolioState {
  portfolios: Portfolio[];
  portfolioCount: number;
  items: PortfolioItem[];
  itemsCount: number;
  isLoading: boolean;
  isPortfolioPublic: boolean;
  isWatchlistPublic: boolean;
  swapRequests: SwapRequest[];
}

export interface SwapRequest {
  id: number;
  fromToken: string;
  toToken: string;
  amount: string;
  timestamp: number;
  isCompleted: boolean;
}

export interface PortfolioActions {
  createPortfolio: (name: string, description: string, isPublic: boolean) => Promise<number>;
  deletePortfolio: (portfolioId: number) => Promise<void>;
  addEntry: (portfolioId: number, coinId: string, amount: number, purchasePrice: number) => Promise<void>;
  removeEntry: (index: number) => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  updatePrivacySettings: (portfolioPublic: boolean, watchlistPublic: boolean) => Promise<void>;
  calculatePnL: (coinId: string, purchasePrice: number, amount: number) => Promise<PnLData | null>;
  initiateTokenSwap: (fromToken: string, toToken: string, amount: number) => Promise<void>;
  getSwapRequests: () => Promise<SwapRequest[]>;
}

export interface PortfolioHook extends PortfolioState, PortfolioActions {}
