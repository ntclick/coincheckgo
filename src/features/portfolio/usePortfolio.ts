import { useState, useEffect } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { toast } from 'react-hot-toast';
import { Portfolio, PortfolioItem, SwapRequest, PortfolioHook } from './types';
import { encryptValue } from '../../utils/fhevm';

// Contract configuration
const CONTRACT_ADDRESS = '0xBBac81C2b7359cf15C84d569ef297D329Af84479'; // GMToken address
const CONTRACT_ABI = [
  // Portfolio management
  "function createPortfolio(string name, string description, bool isPublic) returns (uint256)",
  "function deletePortfolio(uint256 portfolioId)",
  "function addPortfolioEntry(uint256 portfolioId, string coinId, bytes encryptedAmount, bytes encryptedPrice)",
  "function removeFromPortfolioByIndex(uint256 index)",
  "function getPortfolioCount(address user) view returns (uint256)",
  "function getPortfolioItemInfo(address user, uint256 index) view returns (string, uint256)",
  "function getPortfolioItems(address user) view returns (string[], uint256[])",
  "function getPortfolioItemsCount(address user) view returns (uint256)",

  // Privacy settings
  "function updatePrivacySettings(bool isPortfolioPublic, bool isWatchlistPublic)",
  "function getUserDataInfo(address user) view returns (uint256, bool, bool, bool)",
  
  // Token swap functions
  "function initiateTokenSwap(string fromToken, string toToken, bytes encryptedAmount, bytes inputProof)",
  "function completeTokenSwap(uint256 requestId, uint64 decryptedAmount, bytes[] signatures)",
  "function getUserSwapRequests(address user) view returns (uint256[])",
  "function getSwapRequest(uint256 requestId) view returns (string, string, address, uint256, bool)",
  "function swapRates(string, string) view returns (uint256)"
];

export function usePortfolio(userAddress: string, isConnected: boolean): PortfolioHook {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [itemsCount, setItemsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPortfolioPublic, setIsPortfolioPublic] = useState(false);
  const [isWatchlistPublic, setIsWatchlistPublic] = useState(false);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);

  // Load portfolio and privacy settings when connected
  useEffect(() => {
    if (isConnected && userAddress) {
      refreshPortfolio();
      loadPrivacySettings();
    }
  }, [isConnected, userAddress]);

  // Auto-refresh portfolio after any transaction
  const refreshAfterTransaction = async () => {
    setTimeout(async () => {
      await refreshPortfolio();
    }, 2000); // Wait 2 seconds for transaction to be mined
  };

  const getContract = async (): Promise<Contract | null> => {
    if (!window.ethereum) return null;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    } catch (error) {
      console.error('Failed to get contract:', error);
      return null;
    }
  };

  const refreshPortfolio = async () => {
    if (!isConnected || !userAddress) {
      console.log('❌ Portfolio: Not connected or no user address');
      return;
    }

    try {
      console.log('📊 Portfolio: Loading from contract...', { userAddress, contractAddress: CONTRACT_ADDRESS });
      const contract = await getContract();
      if (!contract) {
        console.log('❌ Portfolio: Contract not available');
        return;
      }

      // Load portfolios
      console.log('📊 Portfolio: Getting portfolio count...');
      const portfolioCountResult = await contract.getPortfolioCount(userAddress);
      const portfolioCountNumber = Number(portfolioCountResult);
      console.log('📊 Portfolio: Portfolio count:', portfolioCountNumber);
      setPortfolioCount(portfolioCountNumber);

      // Note: Contract doesn't have getPortfolioInfo function yet
      // For now, create mock portfolios based on count
      const portfolioList: Portfolio[] = [];
      for (let i = 0; i < portfolioCountNumber; i++) {
        portfolioList.push({
          id: i,
          name: `Portfolio ${i + 1}`,
          description: `Portfolio created by user`,
          isPublic: false,
          createdAt: Date.now(),
          totalItems: 0
        });
      }
      console.log('📊 Portfolio: Loaded portfolios (mock data):', portfolioList);
      setPortfolios(portfolioList);

      // Load portfolio items (FHE encrypted)
      console.log('📊 Portfolio: Getting portfolio items count...');
      const itemsCountResult = await contract.getPortfolioItemsCount(userAddress);
      const itemsCountNumber = Number(itemsCountResult);
      console.log('📊 Portfolio: Portfolio items count:', itemsCountNumber);
      setItemsCount(itemsCountNumber);

      if (itemsCountNumber > 0) {
        const portfolioItems: PortfolioItem[] = [];
        for (let i = 0; i < itemsCountNumber; i++) {
          const [coinId, addedAt] = await contract.getPortfolioItemInfo(userAddress, i);
          // Note: Contract only returns coinId and addedAt, not encrypted data
          // For now, use mock encrypted data
          portfolioItems.push({
            coinId,
            amount: `0x${Math.random().toString(16).substr(2, 40)}`, // Mock FHE encrypted handle
            purchasePrice: `0x${Math.random().toString(16).substr(2, 40)}`, // Mock FHE encrypted handle
            index: i,
            portfolioId: 0 // Default to portfolio 0
          });
        }
        console.log('📊 Portfolio: Loaded portfolio items (with mock FHE data):', portfolioItems);
        setItems(portfolioItems);
      } else {
        console.log('📊 Portfolio: No portfolio items found');
        setItems([]);
      }

      console.log('✅ Portfolio: Successfully loaded from onchain');

    } catch (error) {
      console.error('❌ Portfolio: Failed to refresh portfolio:', error);
      setPortfolios([]);
      setPortfolioCount(0);
      setItems([]);
      setItemsCount(0);
    }
  };

  const createPortfolio = async (name: string, description: string, isPublic: boolean) => {
    if (!isConnected || !userAddress) {
      toast.error('Please connect your wallet first');
      return -1;
    }

    try {
      setIsLoading(true);
      const contract = await getContract();
      if (!contract) {
        toast.error('Contract not available');
        return -1;
      }

      const tx = await contract.createPortfolio(name, description, isPublic);
      toast.loading('Creating portfolio...');
      await tx.wait();
      toast.dismiss();

      const portfolioId = portfolios.length; // New portfolio ID
      toast.success(`✅ Created portfolio "${name}"!`);

      // Auto-refresh portfolio after transaction
      await refreshAfterTransaction();

      return portfolioId;

    } catch (error: any) {
      toast.dismiss();
      console.error('Create portfolio failed:', error);
      toast.error(`Failed to create: ${error.shortMessage || error.message}`);
      return -1;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePortfolio = async (portfolioId: number) => {
    if (!isConnected || !userAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const contract = await getContract();
      if (!contract) {
        toast.error('Contract not available');
        return;
      }

      const tx = await contract.deletePortfolio(portfolioId);
      toast.loading('Deleting portfolio...');
      await tx.wait();
      toast.dismiss();

      toast.success('✅ Portfolio deleted!');

      // Auto-refresh portfolio after transaction
      await refreshAfterTransaction();

    } catch (error: any) {
      toast.dismiss();
      console.error('Delete portfolio failed:', error);
      toast.error(`Failed to delete: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (portfolioId: number, coinId: string, amount: number, purchasePrice: number) => {
    if (!isConnected || !userAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const contract = await getContract();
      if (!contract) {
        toast.error('Contract not available');
        return;
      }

      const tx = await contract.addPortfolioEntry(portfolioId, coinId, amount, purchasePrice);
      toast.loading('Adding to portfolio...');
      await tx.wait();
      toast.dismiss();

      toast.success(`✅ Added ${coinId} to portfolio!`);

      // Auto-refresh portfolio after transaction
      await refreshAfterTransaction();

    } catch (error: any) {
      toast.dismiss();
      console.error('Add portfolio entry failed:', error);
      toast.error(`Failed to add: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeEntry = async (index: number) => {
    if (!isConnected || !userAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const contract = await getContract();
      if (!contract) {
        toast.error('Contract not available');
        return;
      }

      const tx = await contract.removeFromPortfolioByIndex(index);
      toast.loading('Removing from portfolio...');
      await tx.wait();
      toast.dismiss();

      toast.success('✅ Removed from portfolio!');

      // Auto-refresh portfolio after transaction
      await refreshAfterTransaction();

    } catch (error: any) {
      toast.dismiss();
      console.error('Remove portfolio entry failed:', error);
      toast.error(`Failed to remove: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrivacySettings = async () => {
    if (!isConnected || !userAddress) return;

    try {
      const contract = await getContract();
      if (!contract) return;

      const userDataInfo = await contract.getUserDataInfo(userAddress);
      const [lastCheckInDay, hasActiveResearch, portfolioPublic, watchlistPublic] = userDataInfo;

      setIsPortfolioPublic(portfolioPublic);
      setIsWatchlistPublic(watchlistPublic);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const updatePrivacySettings = async (portfolioPublic: boolean, watchlistPublic: boolean) => {
    if (!isConnected || !userAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const contract = await getContract();
      if (!contract) {
        toast.error('Contract not available');
        return;
      }

      const tx = await contract.updatePrivacySettings(portfolioPublic, watchlistPublic);
      toast.loading('Updating privacy settings...');
      await tx.wait();
      toast.dismiss();

      setIsPortfolioPublic(portfolioPublic);
      setIsWatchlistPublic(watchlistPublic);

      toast.success('✅ Privacy settings updated!');

    } catch (error: any) {
      toast.dismiss();
      console.error('Update privacy settings failed:', error);
      toast.error(`Failed to update: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate profit/loss for a portfolio item
  const calculatePnL = async (coinId: string, purchasePrice: number, amount: number) => {
    try {
      // Get current price from CoinGecko API
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      const data = await response.json();

      if (data[coinId] && data[coinId].usd) {
        const currentPrice = data[coinId].usd;
        const totalValue = currentPrice * amount;
        const totalCost = purchasePrice * amount;
        const pnl = totalValue - totalCost;
        const pnlPercentage = ((currentPrice - purchasePrice) / purchasePrice) * 100;

        return {
          currentPrice,
          totalValue,
          totalCost,
          pnl,
          pnlPercentage
        };
      }
    } catch (error) {
      console.error('Failed to calculate PnL:', error);
    }

    return null;
  };

  const initiateTokenSwap = async (fromToken: string, toToken: string, amount: number) => {
    if (!isConnected || !userAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const contract = await getContract();
      if (!contract) {
        toast.error('Contract not available');
        return;
      }

      // For now, we'll use a simplified approach without FHE encryption
      // In a real implementation, you would use the FHEVM SDK to encrypt the amount
      const tx = await contract.initiateTokenSwap(
        fromToken,
        toToken,
        '0x', // encryptedAmount placeholder
        '0x'  // inputProof placeholder
      );
      
      toast.loading('Initiating token swap...');
      await tx.wait();
      toast.dismiss();

      toast.success(`✅ Swap initiated: ${fromToken} → ${toToken}`);

      // Auto-refresh portfolio after transaction
      await refreshAfterTransaction();

    } catch (error: any) {
      toast.dismiss();
      console.error('Token swap failed:', error);
      toast.error(`Swap failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getSwapRequests = async (): Promise<SwapRequest[]> => {
    if (!isConnected || !userAddress) return [];

    try {
      const contract = await getContract();
      if (!contract) return [];

      const requestIds = await contract.getUserSwapRequests(userAddress);
      const requests: SwapRequest[] = [];

      for (const id of requestIds) {
        const [fromToken, toToken, user, timestamp, isCompleted] = await contract.getSwapRequest(id);
        requests.push({
          id: Number(id),
          fromToken,
          toToken,
          amount: '0', // Would need separate function to get amount
          timestamp: Number(timestamp),
          isCompleted
        });
      }

      setSwapRequests(requests);
      return requests;

    } catch (error) {
      console.error('Failed to load swap requests:', error);
      return [];
    }
  };

  return {
    // State
    portfolios,
    portfolioCount,
    items,
    itemsCount,
    isLoading,
    isPortfolioPublic,
    isWatchlistPublic,
    swapRequests,

    // Actions
    createPortfolio,
    deletePortfolio,
    addEntry,
    removeEntry,
    refreshPortfolio,
    updatePrivacySettings,
    calculatePnL,
    initiateTokenSwap,
    getSwapRequests,
  };
}
