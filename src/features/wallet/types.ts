export interface WalletState {
  address: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface WalletActions {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  clearError: () => void;
}

export interface WalletHook extends WalletState, WalletActions {};
