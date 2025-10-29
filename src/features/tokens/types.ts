export interface TokenBalances {
  gmTokensHandle: string;
  spinTokensHandle: string;
  researchTokensHandle: string;
}

export interface TokenActions {
  mintGmTokens: (amount: number) => Promise<void>;
  mintSpinTokens: (amount: number) => Promise<void>;
  mintResearchTokens: (amount: number) => Promise<void>;
  refreshTokenBalances: () => Promise<void>;
}

export interface TokensHook extends TokenBalances, TokenActions {
  isLoading: boolean;
}
