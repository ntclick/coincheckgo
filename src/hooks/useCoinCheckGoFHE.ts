import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { toast } from 'react-hot-toast';
import {
  initializeFHEVM,
  getFHEVMInstance,
  checkACLPermissions,
  requestACLPermissions,
  encryptValue,
  encryptValueWithProof,
  decryptValue,
  publicDecrypt,
  userDecrypt,
  formatFHEHandle,
  isFHEEncrypted,
} from '../utils/fhevm';

// Contract Info - CoinCheckGoFHE (CHUẨN ZAMA FHEVM v0.8 + AI Research)
const CONTRACT_ADDRESS = '0xBBac81C2b7359cf15C84d569ef297D329Af84479'; // GMToken address

// ABI - CoinCheckGoFHE (Full FHE implementation with all features)
const CONTRACT_ABI = [
  // Daily Check-In (0h UTC reset)
  "function dailyCheckIn()",
  "function getCurrentDay() view returns (uint256)",
  
  // Token Management
  "function mintGmTokens(uint64 amount)",
  "function mintSpinTokens(uint32 amount)",
  "function mintResearchTokens(uint32 amount)",
  
  // Token Getters (FHE encrypted)
  "function getGmTokens(address user) view returns (uint256)",
  "function getSpinTokens(address user) view returns (uint256)",
  "function getResearchTokens(address user) view returns (uint256)",
  "function getCheckInStreak(address user) view returns (uint256)",
  "function getTotalCheckIns(address user) view returns (uint256)",
  
  // Portfolio Management
  "function addPortfolioEntry(string coinId, uint64 amount, uint64 purchasePrice)",
  "function removeFromPortfolioByIndex(uint256 index)",
  "function getPortfolioCount(address user) view returns (uint256)",
  "function getPortfolioItemInfo(address user, uint256 index) view returns (string, uint256)",
  
  // Watchlist Management
  "function addToWatchlist(string coinId)",
  "function removeFromWatchlistByIndex(uint256 index)",
  "function getWatchlistCount(address user) view returns (uint256)",
  "function getWatchlistItemInfo(address user, uint256 index) view returns (string, uint256, bool)",
  
  // Lucky Spin
  "function spinTheWheel()",
  "function spinLuckyWheel()",
  
  // Research Projects
  "function createResearchProject(string title, string description, uint32 budget)",
  "function completeResearchProject(uint256 projectId)",
  "function getUserResearchProjects(address user) view returns (uint256[])",
  
  // AI Research Analysis (Main Feature)
  "function requestAIResearch(string coinId, string prompt, uint32 tokenCost) returns (uint256)",
  "function submitAIResearchResults(uint256 analysisId, bytes encryptedResponse, bytes encryptedSentiment, bytes encryptedConfidence)",
  "function getAIResearchAnalysis(uint256 analysisId) view returns (string, string, uint256, address, bool, uint256)",
  "function getAIResearchResults(uint256 analysisId) view returns (bytes, bytes, bytes)",
  "function getUserAIResearchIds(address user) view returns (uint256[])",
  "function getUserAIResearchCount(address user) view returns (uint256)",
  
  // Portfolio Optimization (Batch Read)
  "function getPortfolioItems(address user) view returns (string[], uint256[])",
  "function getWatchlistItems(address user) view returns (string[], uint256[], bool[])",
  
  // Privacy Settings
  "function updatePrivacySettings(bool isPortfolioPublic, bool isWatchlistPublic)",
  
  // User Data
  "function getUserDataInfo(address user) view returns (uint256, bool, bool, bool)",
  
  // Status
  "function isReady() view returns (bool)",
  "function blocksUntilReady() view returns (uint256)",
  
  // Events
  "event DailyCheckIn(address indexed user, uint256 indexed dayNumber, uint256 indexed timestamp)",
  "event ACLPermissionGranted(address indexed user, uint256 indexed timestamp)"
];

export function useCoinCheckGoFHE() {
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Token balances (FHE encrypted ciphertext handles - displayed as hex)
  const [gmTokensHandle, setGmTokensHandle] = useState<string>('0x0');
  const [spinTokensHandle, setSpinTokensHandle] = useState<string>('0x0');
  const [researchTokensHandle, setResearchTokensHandle] = useState<string>('0x0');
  const [streakHandle, setStreakHandle] = useState<string>('0x0');
  const [totalCheckInsHandle, setTotalCheckInsHandle] = useState<string>('0x0');
  
  // Check-in stats
  const [lastCheckInDay, setLastCheckInDay] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  
  // Portfolio & Watchlist
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);
  
  // User data
  const [hasActiveResearch, setHasActiveResearch] = useState(false);
  const [isPortfolioPublic, setIsPortfolioPublic] = useState(false);
  const [isWatchlistPublic, setIsWatchlistPublic] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [blocksRemaining, setBlocksRemaining] = useState(0);
  
  // FHEVM state
  const [fhevmInitialized, setFhevmInitialized] = useState(false);
  const [aclPermissionsGranted, setAclPermissionsGranted] = useState(false);
  const [fhevmLoading, setFhevmLoading] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const ethersProvider = new BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      const userAddress = await signer.getAddress();
      
      const contractInstance = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      setProvider(ethersProvider);
      setContract(contractInstance);
      setAddress(userAddress);
      setIsConnected(true);
      
      // Initialize FHEVM SDK
      setFhevmLoading(true);
      
      try {
        const fhevmSuccess = await initializeFHEVM(ethersProvider);
        setFhevmInitialized(fhevmSuccess);
        
        if (fhevmSuccess) {
          // Check and request ACL permissions
          const hasPermission = await checkACLPermissions(CONTRACT_ADDRESS);
          if (!hasPermission) {
            const permissionGranted = await requestACLPermissions(CONTRACT_ADDRESS);
            setAclPermissionsGranted(permissionGranted);
          } else {
            setAclPermissionsGranted(true);
          }
          
          toast.success('Wallet connected! 🔐 FHEVM ready!');
        } else {
          toast.success('Wallet connected! ⚠️ FHEVM failed - some features disabled');
        }
      } catch (error) {
        console.error('❌ FHEVM initialization failed:', error);
        setFhevmInitialized(false);
        setAclPermissionsGranted(false);
        toast.success('Wallet connected! ⚠️ FHEVM failed - some features disabled');
      } finally {
        setFhevmLoading(false);
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast.error(`Connection failed: ${error.message}`);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAddress('');
    setIsConnected(false);
    setProvider(null);
    setContract(null);
    toast.success('Wallet disconnected');
  };

  // Load contract data
  const loadData = async () => {
    if (!contract || !provider || !address) return;

    try {
      
      // Always ready (no reorg wait)
      setIsReady(true);
      setBlocksRemaining(0);

      // Get current day
      try {
        const day = await contract.getCurrentDay();
        setCurrentDay(Number(day));
      } catch (e) {
      }

      // Get user data (last check-in day, research status, privacy settings)
      try {
        const userData = await contract.getUserDataInfo(address);
        const lastDay = Number(userData[0]);
        setLastCheckInDay(lastDay);
        setHasActiveResearch(userData[1]);
        setIsPortfolioPublic(userData[2]);
        setIsWatchlistPublic(userData[3]);
        
        // Check if already checked in today
        const day = await contract.getCurrentDay();
        setHasCheckedInToday(lastDay >= Number(day));
        
          lastCheckInDay: lastDay,
          hasActiveResearch: userData[1],
          hasCheckedInToday: lastDay >= Number(day)
        });
      } catch (e) {
        setHasCheckedInToday(false);
      }

      // Get FHE encrypted token handles
      try {
        const gmHandle = await contract.getGmTokens(address);
        const spinHandle = await contract.getSpinTokens(address);
        const researchHandle = await contract.getResearchTokens(address);
        const streakH = await contract.getCheckInStreak(address);
        const totalH = await contract.getTotalCheckIns(address);
        
        setGmTokensHandle(gmHandle.toString());
        setSpinTokensHandle(spinHandle.toString());
        setResearchTokensHandle(researchHandle.toString());
        setStreakHandle(streakH.toString());
        setTotalCheckInsHandle(totalH.toString());
        
      } catch (e) {
      }

      // Get portfolio & watchlist counts
      try {
        const pCount = await contract.getPortfolioCount(address);
        const wCount = await contract.getWatchlistCount(address);
        setPortfolioCount(Number(pCount));
        setWatchlistCount(Number(wCount));
      } catch (e) {
      }
    } catch (error) {
      console.error('Failed to load contract data:', error);
    }
  };

  // Daily Check-In (0h UTC reset)
  const dailyCheckIn = async () => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (hasCheckedInToday) {
      toast.error('Already checked in today! Come back tomorrow at 0h UTC.');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.dailyCheckIn();
      toast.loading('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      toast.dismiss();
      
      if (receipt.status === 0) {
        throw new Error('Transaction reverted on-chain');
      }
      
      toast.success('✅ Daily check-in successful! Earned: 10 GM + 1 Spin + 5 Research tokens! 🎉');
      
      // Reload data
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error('Check-in failed:', error);
      
      if (error.message?.includes('Already checked in today')) {
        toast.error('Already checked in today! Reset at 0h UTC.');
      } else if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled by user.');
      } else {
        toast.error(`Check-in failed: ${error.shortMessage || error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mint GM Tokens (FHE Encrypted)
  const mintGmTokens = async (amount: number) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!fhevmInitialized || !aclPermissionsGranted) {
      toast.error('🔐 FHEVM not ready. Please reconnect wallet.');
      return;
    }

    setIsLoading(true);
    try {
      
      // Encrypt the amount using FHE theo Zama v0.2.0
      const encryptedAmount = await encryptValue(amount, CONTRACT_ADDRESS, address);
      
      // Call contract with encrypted amount
      const tx = await contract.mintGmTokens(encryptedAmount);
      toast.loading('🔐 Minting encrypted GM tokens...');
      await tx.wait();
      toast.dismiss();
      toast.success(`✅ Minted ${amount} GM tokens (FHE encrypted)! 🔐`);
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error('❌ FHE minting failed:', error);
      toast.error(`FHE minting failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ETH to GM Token Swap (FHE Encrypted)
  const swapETHToGM = async (ethAmount: number) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!fhevmInitialized || !aclPermissionsGranted) {
      toast.error('🔐 FHEVM not ready. Please reconnect wallet.');
      return;
    }

    setIsLoading(true);
    try {
      const gmAmount = ethAmount * 1000; // 1 ETH = 1000 GM (demo rate)

      // Use dedicated swap contract (separate from CoinCheckGoFHE) with FHE params
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
           const swapContract = new Contract(
             '0xd0e183F11948CbA9DAF6AC46861DC805231aFA7A', // SWAP_CONTRACT_ADDRESS
        [
          'function swapETHToGM(bytes32 encryptedGmAmount, bytes inputProof) payable'
        ],
        signer
      );

           // CRITICAL: Encrypt with the SAME address that will sign the transaction
           // This ensures FHE permissions match the transaction signer
           const { handle, inputProof } = await encryptValueWithProof(gmAmount, '0xd0e183F11948CbA9DAF6AC46861DC805231aFA7A', address);
        handle, 
        inputProofLength: inputProof.length,
        contractAddress: '0xd0e183F11948CbA9DAF6AC46861DC805231aFA7A',
        userAddress: address
      });

      // Execute swap (send ETH) - ensure same signer as encryption
      const tx = await swapContract.swapETHToGM(
        handle,
        inputProof,
        {
          value: (await import('ethers')).parseEther(String(ethAmount)),
          gasLimit: 700000
        }
      );

      toast.loading(`🔐 Swapping ${ethAmount} ETH → ${gmAmount} GM tokens...`);
      await tx.wait();
      toast.dismiss();
      toast.success(`✅ Swapped ${ethAmount} ETH for ${gmAmount} GM tokens (FHE encrypted)! 🔐`);
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error('❌ FHE swap failed:', error);
      toast.error(`FHE swap failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Spin The Wheel
  const spinTheWheel = async () => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.spinTheWheel();
      toast.loading('Spinning the wheel...');
      await tx.wait();
      toast.dismiss();
      toast.success('🎰 Wheel spun! Good luck!');
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Spin failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add Portfolio Entry (FHE Encrypted)
  const addPortfolioEntry = async (coinId: string, amount: number, purchasePrice: number) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!fhevmInitialized || !aclPermissionsGranted) {
      toast.error('🔐 FHEVM not ready. Please reconnect wallet.');
      return;
    }

    setIsLoading(true);
    try {
      
      // Encrypt amount and price using FHE theo Zama v0.2.0
      const encryptedAmount = await encryptValue(amount, CONTRACT_ADDRESS, address);
      const encryptedPrice = await encryptValue(purchasePrice, CONTRACT_ADDRESS, address);
      
      
      const tx = await contract.addPortfolioEntry(coinId, encryptedAmount, encryptedPrice);
      toast.loading('🔐 Adding encrypted data to portfolio...');
      await tx.wait();
      toast.dismiss();
      toast.success(`✅ Added ${coinId} to portfolio (FHE encrypted)! 🔐`);
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error('❌ FHE portfolio add failed:', error);
      toast.error(`FHE portfolio failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add to Watchlist
  const addToWatchlist = async (coinId: string) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.addToWatchlist(coinId);
      toast.loading('Adding to watchlist...');
      await tx.wait();
      toast.dismiss();
      toast.success(`✅ Added ${coinId} to watchlist!`);
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to add: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Research Project
  const createResearchProject = async (title: string, description: string, budget: number) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.createResearchProject(title, description, budget);
      toast.loading('Creating research project...');
      await tx.wait();
      toast.dismiss();
      toast.success(`✅ Research project "${title}" created!`);
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to create: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Privacy Settings
  const updatePrivacySettings = async (portfolioPublic: boolean, watchlistPublic: boolean) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.updatePrivacySettings(portfolioPublic, watchlistPublic);
      toast.loading('Updating privacy settings...');
      await tx.wait();
      toast.dismiss();
      toast.success('✅ Privacy settings updated!');
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to update: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Request AI Research (Main Feature)
  const requestAIResearch = async (coinId: string, prompt: string, tokenCost: number) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.requestAIResearch(coinId, prompt, tokenCost);
      toast.loading('Requesting AI analysis...');
      const receipt = await tx.wait();
      toast.dismiss();
      toast.success(`✅ AI analysis requested for ${coinId}! Analysis ID in events.`);
      setTimeout(() => loadData(), 2000);
      return receipt;
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to request: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get User's AI Research List
  const getUserAIResearch = async () => {
    if (!contract || !address) return [];

    try {
      const ids = await contract.getUserAIResearchIds(address);
      const analyses = [];
      
      for (const id of ids) {
        const analysis = await contract.getAIResearchAnalysis(id);
        analyses.push({
          id: Number(id),
          coinId: analysis[0],
          prompt: analysis[1],
          timestamp: Number(analysis[2]),
          researcher: analysis[3],
          isCompleted: analysis[4],
          tokensUsed: Number(analysis[5])
        });
      }
      
      return analyses;
    } catch (error) {
      console.error('Failed to get AI research:', error);
      return [];
    }
  };

  // Get Portfolio Items (Batch)
  const getPortfolioItems = async () => {
    if (!contract || !address) return [];

    try {
      const { 0: coinIds, 1: addedAts } = await contract.getPortfolioItems(address);
      return coinIds.map((coinId: string, i: number) => ({
        coinId,
        addedAt: Number(addedAts[i])
      }));
    } catch (error) {
      console.error('Failed to get portfolio items:', error);
      return [];
    }
  };

  // Get Watchlist Items (Batch)
  const getWatchlistItems = async () => {
    if (!contract || !address) return [];

    try {
      const { 0: coinIds, 1: addedAts, 2: isActives } = await contract.getWatchlistItems(address);
      return coinIds.map((coinId: string, i: number) => ({
        coinId,
        addedAt: Number(addedAts[i]),
        isActive: isActives[i]
      }));
    } catch (error) {
      console.error('Failed to get watchlist items:', error);
      return [];
    }
  };

  // Load data when contract changes
  useEffect(() => {
    if (contract && address) {
      loadData();
    }
  }, [contract, address]);

  return {
    // Wallet
    address,
    isConnected,
    connectWallet,
    disconnectWallet,
    
    // Token balances (FHE encrypted handles)
    gmTokensHandle,
    spinTokensHandle,
    researchTokensHandle,
    streakHandle,
    totalCheckInsHandle,
    
    // Check-in
    lastCheckInDay,
    currentDay,
    hasCheckedInToday,
    dailyCheckIn,
    
    // Portfolio & Watchlist
    portfolioCount,
    watchlistCount,
    addPortfolioEntry,
    addToWatchlist,
    getPortfolioItems,
    getWatchlistItems,
    
    // Research
    hasActiveResearch,
    createResearchProject,
    
    // AI Research (Main Feature)
    requestAIResearch,
    getUserAIResearch,
    
    // Privacy
    isPortfolioPublic,
    isWatchlistPublic,
    updatePrivacySettings,
    
    // Tokens
    mintGmTokens,
    spinTheWheel,
    spinLuckyWheel: spinTheWheel,
    
    // FHEVM Status
    fhevmInitialized,
    aclPermissionsGranted,
    fhevmLoading,
    
    // Status
    isLoading,
    isReady,
    blocksRemaining,
    contractAddress: CONTRACT_ADDRESS,
    
    // Data loading
    loadData,
    
    // Swap
    swapETHToGM,
    
    // FHE Utilities
    formatFHEHandle,
    isFHEEncrypted,
    decryptValue,
  };
}

