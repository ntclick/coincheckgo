// Wallet Management
export { useWallet, WalletConnector } from './wallet';
export type { WalletState, WalletActions, WalletHook } from './wallet';

// Check-in System
export { useCheckIn, CheckInCard } from './checkin';
export type { CheckInState, CheckInActions, CheckInHook } from './checkin';

// Token Management
export { useTokens, TokenManager } from './tokens';
export type { TokenBalances, TokenActions, TokensHook } from './tokens';

// Portfolio Management
export { usePortfolio, PortfolioManager } from './portfolio';
export type { PortfolioItem, PortfolioState, PortfolioActions, PortfolioHook } from './portfolio';

// Feature Registry - Simple object for feature discovery
export const featureRegistry = {
  wallet: 'wallet',
  checkin: 'checkin',
  tokens: 'tokens',
  portfolio: 'portfolio',
  // Add more features here as they are implemented
} as const;

export type FeatureName = keyof typeof featureRegistry;
