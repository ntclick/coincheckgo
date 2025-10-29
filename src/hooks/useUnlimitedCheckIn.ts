import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { toast } from 'react-hot-toast';

// Contract Info - CoinCheckGoFHE (CHUẨN ZAMA FHEVM v0.8)
const CONTRACT_ADDRESS = '0xBBac81C2b7359cf15C84d569ef297D329Af84479';

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
  
  // Research Projects
  "function createResearchProject(string title, string description, uint32 budget)",
  "function completeResearchProject(uint256 projectId)",
  "function saveEncryptedResearch(bytes encryptedData, bytes signature, uint256 timestamp) returns (uint256)",
  "function publishPublicResearch(bytes encryptedData, bytes signature, uint256 timestamp) returns (uint256)",
  "function loadResearch(uint256 researchId) view returns (bytes)",
  "function getUserResearchProjects(address user) view returns (uint256[])",
  
  // Privacy Settings
  "function updatePrivacySettings(bool isPortfolioPublic, bool isWatchlistPublic)",
  
  // User Data
  "function getUserDataInfo(address user) view returns (uint256, bool, bool, bool)",
  
  // Status
  "function isReady() view returns (bool)",
  "function blocksUntilReady() view returns (uint256)",
  
  // Events
  "event DailyCheckIn(address indexed user, uint256 indexed dayNumber, uint256 indexed timestamp)",
  "event GmTokensMinted(address indexed to, uint256 indexed timestamp)",
  "event SpinTokensMinted(address indexed to, uint256 indexed timestamp)",
  "event ResearchTokensMinted(address indexed to, uint256 indexed timestamp)",
  "event PortfolioItemAdded(address indexed user, string coinId, uint256 indexed timestamp)",
  "event WatchlistItemAdded(address indexed user, string coinId, uint256 indexed timestamp)",
  "event SpinPerformed(address indexed user, uint256 indexed timestamp)",
  "event ResearchProjectCreated(address indexed researcher, uint256 projectId, string title, uint256 indexed timestamp)",
  "event ACLPermissionGranted(address indexed user, uint256 indexed timestamp)"
];

export function useUnlimitedCheckIn() {
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [myCount, setMyCount] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [blocksRemaining, setBlocksRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('Please install MetaMask!');
      return;
    }

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const signer = await browserProvider.getSigner();
      const userAddress = await signer.getAddress();

      setProvider(browserProvider);
      setAddress(userAddress);
      setIsConnected(true);

      // Create contract instance
      const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);

      toast.success('Wallet connected!');
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
      console.log('📊 Loading contract data for:', address);
      
      // Simple contract - always ready!
      setIsReady(true);
      setBlocksRemaining(0);
      setHasCheckedInToday(false); // No 24h limit!

      // Load user check-in count
      try {
        const count = await contract.getMyCount();
        setMyCount(Number(count));
        console.log('✅ My check-in count:', Number(count));
      } catch (e) {
        console.log('No count yet:', e);
        setMyCount(0);
      }

      // Load total check-ins
      try {
        const total = await contract.totalCheckIns();
        setTotalCheckIns(Number(total));
        console.log('✅ Total check-ins:', Number(total));
      } catch (e) {
        console.log('No total yet:', e);
        setTotalCheckIns(0);
      }
    } catch (error) {
      console.error('Failed to load contract data:', error);
    }
  };

  // Check in - Unlimited!
  const checkIn = async () => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Calling checkIn()...');
      const tx = await contract.checkIn();
      toast.loading('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      toast.dismiss();
      
      if (receipt.status === 0) {
        throw new Error('Transaction reverted on-chain');
      }
      
      toast.success('Check-in successful! 🎉');
      
      // Reload data
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.dismiss();
      console.error('Check-in failed:', error);
      
      if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled by user.');
      } else {
        toast.error(`Check-in failed: ${error.shortMessage || error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };


  // Load data when contract changes
  useEffect(() => {
    if (contract && address) {
      loadData();
      const interval = setInterval(loadData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [contract, address]);

  return {
    // Wallet
    address,
    isConnected,
    connectWallet,
    disconnectWallet,
    
    // Contract info
    contractAddress: CONTRACT_ADDRESS,
    
    // Data
    myCount,
    totalCheckIns,
    isReady,
    blocksRemaining,
    hasCheckedInToday,
    
    // Actions
    checkIn,
    loadData,
    
    // Status
    isLoading,
  };
}
