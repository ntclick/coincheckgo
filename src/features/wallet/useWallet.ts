import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { toast } from 'react-hot-toast';
import { WalletState, WalletHook } from './types';

export function useWallet(): WalletHook {
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already connected on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkExistingConnection = async () => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAddress(userAddress);
        setIsConnected(true);
      } catch (error) {
        console.error('Error checking existing connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      disconnectWallet();
    } else {
      // Account changed
      setAddress(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    // Reload the page when chain changes
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      const error = 'MetaMask not detected. Please install MetaMask to continue.';
      setError(error);
      toast.error(error);
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Check network (should be Sepolia for this demo)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') { // Sepolia testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/']
              }],
            });
          }
        }
      }

      // Get signer and address
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      setAddress(userAddress);
      setIsConnected(true);

      toast.success(`Connected to ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`);

    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      const errorMessage = error.message || 'Failed to connect wallet';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress('');
    setIsConnected(false);
    setError(null);
    toast.success('Wallet disconnected');
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // State
    address,
    isConnected,
    isConnecting,
    error,

    // Actions
    connectWallet,
    disconnectWallet,
    clearError,
  };
}
