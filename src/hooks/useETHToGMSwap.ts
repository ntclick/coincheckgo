import { useState, useEffect } from 'react';
import { Contract, BrowserProvider, parseEther, formatEther } from 'ethers';
import { toast } from 'react-hot-toast';

// Contract configuration
const SWAP_CONTRACT_ADDRESS = '0xd0e183F11948CbA9DAF6AC46861DC805231aFA7A';
const GM_TOKEN_ADDRESS = '0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08';
const SWAP_ABI = [
  "function swapETHToGM(tuple(bytes32 handle, bytes signature) encryptedGmAmount, bytes inputProof) payable",
  "function getSwapRate() view returns (uint256)",
  "function calculateGmAmount(uint256 ethAmount) view returns (uint256)",
  "function calculateEthAmount(uint256 gmAmount) view returns (uint256)",
  "function getContractBalance() view returns (uint256)",
  "function fundGMTokenPool(uint64 amount) external",
  "function fundETHPool() payable",
  "function getPoolBalances() view returns (uint256, uint256)",
  "event ETHToGMSwapInitiated(address indexed user, uint256 ethAmount, uint256 requestId, uint256 timestamp)",
  "event ETHToGMSwapCompleted(address indexed user, uint256 ethAmount, uint256 gmAmount, uint256 requestId, uint256 timestamp)"
];

const GM_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function getTokenInfo() view returns (string, string, uint8, uint64)",
  "function confidentialBalanceOf(address account) view returns (bytes32)",
  "function confidentialTotalSupply() view returns (bytes32)",
  "function mint(address to, uint64 amount) external",
  "function confidentialMint(address to, bytes32 encryptedAmount, bytes inputProof) external returns (bytes32)",
  "function confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof) external",
  "function setMinter(address _minter) external",
  "function minter() view returns (address)",
  "function grantDecryptionPermission(address user) external",
  "function mintForUser(address to, uint64 amount) external",
  "function useAIResearch(address user) external returns (bool)",
  "function spinLuckyWheel(address user) external returns (uint8, uint64)",
  "event GMTokenMinted(address indexed to, uint64 amount)",
  "event GMTokenTransferred(address indexed from, address indexed to, uint64 amount)",
  "event LuckyWheelSpun(address indexed user, uint8 rewardType, uint64 rewardAmount)"
];

interface SwapState {
  swapRate: number;
  contractBalance: string;
  gmTokenInfo: {
    name: string;
    symbol: string;
    decimals: number;
  } | null;
  isLoading: boolean;
  isConnected: boolean;
}

interface SwapActions {
  swapETHToGM: (ethAmount: string) => Promise<boolean>;
  calculateGmAmount: (ethAmount: string) => string;
  calculateEthAmount: (gmAmount: string) => string;
  refreshData: () => Promise<void>;
}

export function useETHToGMSwap(userAddress: string, isConnected: boolean): SwapState & SwapActions {
  const [swapRate, setSwapRate] = useState<number>(0);
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [gmTokenInfo, setGmTokenInfo] = useState<SwapState['gmTokenInfo']>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getContract = async (): Promise<Contract | null> => {
    if (!window.ethereum) return null;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new Contract(SWAP_CONTRACT_ADDRESS, SWAP_ABI, signer);
    } catch (error) {
      console.error('Failed to get swap contract:', error);
      return null;
    }
  };

  const getGMTokenContract = async (): Promise<Contract | null> => {
    if (!window.ethereum) return null;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new Contract(GM_TOKEN_ADDRESS, GM_TOKEN_ABI, signer);
    } catch (error) {
      console.error('Failed to get GM token contract:', error);
      return null;
    }
  };

  const refreshData = async () => {
    if (!isConnected || !userAddress) return;

    try {
      
      const swapContract = await getContract();
      const gmTokenContract = await getGMTokenContract();
      
      if (!swapContract || !gmTokenContract) return;

      // Load swap rate
      const rate = await swapContract.getSwapRate();
      setSwapRate(Number(rate));

      // Load contract balance
      const balance = await swapContract.getContractBalance();
      setContractBalance(formatEther(balance));

      // Load GM token info
      const [name, symbol, decimals] = await Promise.all([
        gmTokenContract.name(),
        gmTokenContract.symbol(),
        gmTokenContract.decimals()
      ]);
      
      setGmTokenInfo({ name, symbol, decimals });


    } catch (error) {
      console.error('❌ Failed to load swap data:', error);
    }
  };

  const calculateGmAmount = (ethAmount: string): string => {
    if (!ethAmount || ethAmount === '0') return '0';
    
    try {
      const ethWei = parseEther(ethAmount);
      const gmWei = ethWei * BigInt(swapRate);
      return formatEther(gmWei);
    } catch (error) {
      console.error('Error calculating GM amount:', error);
      return '0';
    }
  };

  const calculateEthAmount = (gmAmount: string): string => {
    if (!gmAmount || gmAmount === '0' || swapRate === 0) return '0';
    
    try {
      const gmWei = parseEther(gmAmount);
      const ethWei = gmWei / BigInt(swapRate);
      return formatEther(ethWei);
    } catch (error) {
      console.error('Error calculating ETH amount:', error);
      return '0';
    }
  };

  const swapETHToGM = async (ethAmount: string): Promise<boolean> => {
    if (!isConnected || !userAddress) {
      toast.error('Please connect your wallet first');
      return false;
    }

    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      toast.error('Please enter a valid ETH amount');
      return false;
    }

    try {
      setIsLoading(true);
      const contract = await getContract();
      if (!contract) {
        toast.error('Swap contract not available');
        return false;
      }

      // Calculate expected GM amount
      const expectedGmAmount = calculateGmAmount(ethAmount);

      // Note: In a real implementation, you would:
      // 1. Use FHEVM SDK to encrypt the GM amount
      // 2. Generate input proof
      // 3. Call swapETHToGM with encrypted data
      
      // For now, we'll use mock encrypted data
      const mockEncryptedAmount = '0x' + '0'.repeat(64);
      const mockInputProof = '0x';

      const tx = await contract.swapETHToGM(
        mockEncryptedAmount,
        mockInputProof,
        { 
          value: parseEther(ethAmount),
          gasLimit: 500000 // Increase gas limit for FHE operations
        }
      );

      toast.loading('Swapping ETH to GM tokens...');
      await tx.wait();
      toast.dismiss();

      toast.success(`✅ Successfully swapped ${ethAmount} ETH to ${expectedGmAmount} GM tokens!`);
      
      // Refresh data after successful swap
      await refreshData();
      
      return true;

    } catch (error: any) {
      toast.dismiss();
      console.error('ETH to GM swap failed:', error);
      
      let errorMessage = 'Swap failed';
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('gas')) {
        errorMessage = 'Transaction failed - try increasing gas limit';
      }
      
      toast.error(`${errorMessage}: ${error.shortMessage || error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when connected
  useEffect(() => {
    if (isConnected && userAddress) {
      refreshData();
    }
  }, [isConnected, userAddress]);

  return {
    // State
    swapRate,
    contractBalance,
    gmTokenInfo,
    isLoading,
    isConnected,
    
    // Actions
    swapETHToGM,
    calculateGmAmount,
    calculateEthAmount,
    refreshData
  };
}
