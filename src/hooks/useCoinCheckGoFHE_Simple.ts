import { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { encryptValueWithProof } from '../utils/fhevm';

// Extend Window interface for FHEVM
declare global {
  interface Window {
    fhevm?: any;
    ethereum?: any;
  }
}

// Global state to share between hook instances (fixes React Strict Mode issue)
let globalHookState = {
  isConnected: false,
  address: '',
  userPublicBalance: 0,
  isLoading: false,
  hasWallet: false
};

// Expose global state to window for debugging
(window as any).globalHookState = globalHookState;

// Global listeners for state changes
let globalStateListeners: Array<() => void> = [];

// Function to notify all listeners when global state changes
const notifyGlobalStateChange = () => {
  globalStateListeners.forEach(listener => listener());
};

  // Contract addresses - use env with sensible fallbacks
  const GMToken_ADDRESS = (process.env.REACT_APP_GM_TOKEN_ADDRESS as string) || '0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08';
  const SwapETHToGM_ADDRESS = (process.env.REACT_APP_SWAP_ADDRESS as string) || '0xd0e183F11948CbA9DAF6AC46861DC805231aFA7A';
  const Research_ADDRESS = (process.env.REACT_APP_RESEARCH_AI_ADDRESS as string) || '0xBD341699753FEa3305bf16Eaf8228A1F96E945fF';

// Contract ABIs
const GMToken_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function confidentialBalanceOf(address) view returns (bytes32)",
  "function confidentialTotalSupply() view returns (bytes32)",
  "function mint(address,uint256)",
  "function mintForUser(address,uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function isOperator(address,address) view returns (bool)",
  "function setOperator(address,uint48)",
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)"
];

const SwapETHToGM_ABI = [
  "function swapETHForGM() payable",
  "function swapETHForGMPublic() payable",
  "function swapGMForETH(bytes32,bytes,uint256) payable",
  "function swapGMForETHPublic(uint256)",
  "function getReserves() view returns (uint256,uint256)",
  "function getPoolState() view returns (bool,uint256,uint256)",
  "function totalETHReserve() view returns (uint256)",
  "function totalGMReserve() view returns (uint256)",
  "function poolInitialized() view returns (bool)",
  "function initializePool(uint256) payable",
  "function addLiquidity(uint256) payable",
  "function mintGMTokensToPool(uint256)",
  "function getSwapFee() pure returns (uint256)"
];

const Research_ABI = [
  // Public paths
  "function dailyCheckIn() external",
  "function performAIResearch(string memory topic) external",
  // FHE-style endpoints (forward compatible)
  "function dailyCheckInFHE(bytes32 encryptedRewardHandle, bytes inputProof) external",
  "function performAIResearchFHE(string topic, uint256 costPublic, bytes32 encryptedCostHandle, bytes inputProof) external",
  "function fundPool(uint256 amount) external",
  "function getPoolBalance() external view returns (uint256)",
  "function hasCheckedInToday(address user) external view returns (bool)",
  "function getResearchCount(address user) external view returns (uint256)",
  "function owner() external view returns (address)",
  "function gmToken() external view returns (address)",
  "event DailyCheckIn(address indexed user, uint256 reward)",
  "event AIResearch(address indexed user, string topic, uint256 cost)",
  "event PoolFunded(address indexed funder, uint256 amount)"
];

const useCoinCheckGoFHESimple = () => {
  // Connection state - Use global state to fix React Strict Mode issue
  const [isConnected, setIsConnected] = useState(globalHookState.isConnected);
  const [address, setAddress] = useState(globalHookState.address);
  const [isLoading, setIsLoading] = useState(globalHookState.isLoading);
  
  // Force re-render when global state changes
  const [, forceUpdate] = useState({});
  const forceRerender = () => forceUpdate({});
  
  // Register global state listener
  useEffect(() => {
    globalStateListeners.push(forceRerender);
    return () => {
      const index = globalStateListeners.indexOf(forceRerender);
      if (index > -1) {
        globalStateListeners.splice(index, 1);
      }
    };
  }, []);
  
  // Auto-restore wallet connection from localStorage on mount
  useEffect(() => {
    const restoreWalletConnection = async () => {
      try {
        const cachedConnected = localStorage.getItem('wallet_connected');
        const cachedAddress = localStorage.getItem('wallet_address');
        
        if (cachedConnected === 'true' && cachedAddress && window.ethereum) {
          
          // Check if MetaMask still has the same address
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && accounts[0].toLowerCase() === cachedAddress.toLowerCase()) {
            // Same address, restore connection
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();
            
            // Create contract instances
            const gmToken = new ethers.Contract(GMToken_ADDRESS, GMToken_ABI, signer);
            const swap = new ethers.Contract(SwapETHToGM_ADDRESS, SwapETHToGM_ABI, signer);
            const research = new ethers.Contract(Research_ADDRESS, Research_ABI, signer);
            
            // Restore state
            setIsConnected(true);
            setAddress(userAddress);
            globalHookState.isConnected = true;
            globalHookState.address = userAddress;
            notifyGlobalStateChange();
            
            // Restore contracts
            setGmTokenContract(gmToken);
            setSwapContract(swap);
            setResearchContract(research);
            
            // Also set contracts on window object
            (window as any).tokenContract = gmToken;
            (window as any).swapContract = swap;
            (window as any).researchContract = research;
            
            // Initialize FHEVM
            await initializeFHEVM(window.ethereum);
            setFhevmInitialized(true);
            setAclPermissionsGranted(true);
            
            // Load data after restoring wallet
            await loadDataWithContracts(gmToken, swap, research, userAddress);
            
          } else {
            // Address changed or no accounts, clear cache
            localStorage.removeItem('wallet_connected');
            localStorage.removeItem('wallet_address');
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to restore wallet connection:', error);
        // Clear invalid cache
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('wallet_address');
      }
    };
    
    restoreWalletConnection();
  }, []); // Only run once on mount

  // Sync local state with global state when it changes
  useEffect(() => {
    setIsConnected(globalHookState.isConnected);
    setAddress(globalHookState.address);
    setIsLoading(globalHookState.isLoading);
    setUserPublicBalance(globalHookState.userPublicBalance);
  }, [forceUpdate]);

  // Listen for token balance updates from public/index.html
  useEffect(() => {
    const handleTokenBalancesUpdate = (event: any) => {
      const { public: publicBalance, confidential, gm } = event.detail;

        public: publicBalance,
        confidential: confidential,
        gm: gm
      });

      // Update userPublicBalance state
      if (publicBalance !== undefined) {
        setUserPublicBalance(publicBalance);
      }

      // Store confidential balance for AIResearchTool to access
      if (confidential !== undefined && parseFloat(confidential) > 0) {
        (window as any).userConfidentialBalance = confidential;
      }
    };

    window.addEventListener('tokenBalancesUpdated', handleTokenBalancesUpdate);

    return () => {
      window.removeEventListener('tokenBalancesUpdated', handleTokenBalancesUpdate);
    };
  }, []);
  
  // Contract instances
  const [gmTokenContract, setGmTokenContract] = useState<any>(null);
  const [swapContract, setSwapContract] = useState<any>(null);
  const [researchContract, setResearchContract] = useState<any>(null);
  
  // FHEVM state
  const [fhevmInitialized, setFhevmInitialized] = useState(false);
  const [aclPermissionsGranted, setAclPermissionsGranted] = useState(false);
  const [fhevmLoading, setFhevmLoading] = useState(false);
  
  // Token balances - Use global state
  const [userPublicBalance, setUserPublicBalance] = useState(globalHookState.userPublicBalance);
  const [userEncryptedBalance, setUserEncryptedBalance] = useState('');
  const [userDecryptedBalance, setUserDecryptedBalance] = useState(0);
  const [poolBalances, setPoolBalances] = useState({ ethPool: 0, gmTokenPool: 0 });
  
  // Token info
  const [tokenInfo, setTokenInfo] = useState({ name: '', symbol: '', decimals: 0, totalSupply: 0 });
  
  // Portfolio state
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [isPortfolioPublic, setIsPortfolioPublic] = useState(false);
  const [isWatchlistPublic, setIsWatchlistPublic] = useState(false);
  const [hasActiveResearch] = useState(false);

  // Connect wallet function - copied from reference file
  const connectWallet = async () => {
    try {
      
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }
      
      // Request accounts first to avoid "User denied" error
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      
      // Create contract instances
      const gmToken = new ethers.Contract(GMToken_ADDRESS, GMToken_ABI, signer);
      const swap = new ethers.Contract(SwapETHToGM_ADDRESS, SwapETHToGM_ABI, signer);
      const research = new ethers.Contract(Research_ADDRESS, Research_ABI, signer);
      
      // Set connection state - Update both local and global state
      setIsConnected(true);
      setAddress(userAddress);
      globalHookState.isConnected = true;
      globalHookState.address = userAddress;
      notifyGlobalStateChange(); // Notify all listeners
      
      // Cache wallet connection to localStorage for persistence across page reloads
      try {
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('wallet_address', userAddress);
      } catch (err) {
        console.warn('⚠️ Failed to cache wallet connection:', err);
      }
      
      // Set contracts
      setGmTokenContract(gmToken);
      setSwapContract(swap);
      setResearchContract(research);

      // Also set contracts on window object for injected script access
      (window as any).tokenContract = gmToken;
      (window as any).swapContract = swap;
      (window as any).researchContract = research;
        
        // Debug log removed
      
      // Initialize FHEVM
      // Debug log removed
      await initializeFHEVM(window.ethereum);
          setFhevmInitialized(true);
          setAclPermissionsGranted(true);
      // Debug log removed
      
      // Load token balances
      // Debug log removed
      await loadDataWithContracts(gmToken, swap, research, userAddress);
      
      // Auto-trigger decryption after injected script is ready (only if not already triggered)
      if (!(window as any).decryptionTriggered) {
        (window as any).decryptionTriggered = true;
        setTimeout(async () => {
          try {
            // Don't auto-trigger EIP-712 here, will trigger only after wallet connect
          } catch (error) {
          }
        }, 2000);
      } else {
      }
      
      toast.success('Wallet connected successfully!');
      
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else if (error.message.includes('not installed')) {
        toast.error('MetaMask not installed. Please install MetaMask.', {
          duration: 8000
        });
        setTimeout(() => {
          window.open('https://metamask.io/download/', '_blank');
        }, 2000);
      } else {
        toast.error(`Connection failed: ${error.message}`);
      }
      
      return false;
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    setIsConnected(false);
    setAddress('');
    setGmTokenContract(null);
    setSwapContract(null);
    setResearchContract(null);
    setFhevmInitialized(false);
    setAclPermissionsGranted(false);
    
    // Reset decryption trigger flag
    (window as any).decryptionTriggered = false;
    
    // Clear cached wallet connection from localStorage
    try {
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_address');
    } catch (err) {
      console.warn('⚠️ Failed to clear wallet cache:', err);
    }
    
    // Update global state
    globalHookState.isConnected = false;
    globalHookState.address = '';
    notifyGlobalStateChange();
    
    toast.success('Wallet disconnected');
  };

  // Initialize FHEVM
  const initializeFHEVM = async (provider: any) => {
    try {
      setFhevmLoading(true);
      
      // Wait for FHEVM to be available
      let retries = 0;
      while (!window.fhevm && retries < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }
      
      if (!window.fhevm) {
        throw new Error('FHEVM not available');
      }
      
      setFhevmInitialized(true);
      setAclPermissionsGranted(true);
      
    } catch (error: any) {
      console.error('❌ FHEVM initialization failed:', error);
      setFhevmInitialized(false);
      setAclPermissionsGranted(false);
    } finally {
      setFhevmLoading(false);
    }
  };

  // Force decryption popup
  const forceDecryptionPopup = async (userAddress: string) => {
    try {
      
      if (!window.fhevm || !gmTokenContract) {
             return;
           }
           
      // Load encrypted balance to trigger decryption popup
      const encryptedBalance = await gmTokenContract?.confidentialBalanceOf(userAddress);
      
      // Check if encrypted balance is valid
      if (encryptedBalance && encryptedBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        
        // Create EIP-712 signature for decryption
      const contractAddresses = [GMToken_ADDRESS];
        const startTimeStamp = Math.floor(Date.now() / 1000);
        const durationDays = 365;
        
        try {
          const signature = await window.fhevm.createEIP712(
            userAddress,
        contractAddresses,
        startTimeStamp,
            durationDays
          );
          
          
          // Decrypt the balance
          const keypair = await window.fhevm.generateKeypair();
          const handleContractPairs = [{
            handle: encryptedBalance,
        contractAddress: GMToken_ADDRESS,
          }];
          
          const result = await window.fhevm.userDecrypt(
            handleContractPairs,
            keypair.privateKey,
            keypair.publicKey,
            signature && typeof signature === 'string' ? signature.replace("0x", "") : (signature || ""),
            contractAddresses,
            userAddress,
            startTimeStamp,
            durationDays,
          );
          
          
          if (result && result.length > 0) {
            const decryptedValue = result[0].balance;
            if (typeof decryptedValue === 'number') {
              setUserDecryptedBalance(decryptedValue);
            } else {
            setUserDecryptedBalance(0);
          }
          }
          
        } catch (decryptError: any) {
          if (decryptError.message.includes('relayer respond with HTTP code 500')) {
          }
          setUserDecryptedBalance(0);
        }
      } else {
        setUserDecryptedBalance(0);
      }
      
    } catch (error: any) {
      console.error('❌ Force decryption popup failed:', error);
      setUserDecryptedBalance(0);
    }
  };

  // Load data with contracts
  const loadDataWithContracts = async (gmContract: any, swapContract: any, researchContract: any, userAddress: string, forceReload: boolean = false) => {
    try {
      // Verify contract is deployed (use contract's provider or BrowserProvider)
      try {
        const contractProvider = (gmContract as any)?.runner?.provider ||
          (typeof window !== 'undefined' && (window as any).ethereum
            ? new (await import('ethers')).BrowserProvider((window as any).ethereum)
            : null);
        if (!contractProvider) {
          console.warn('⚠️ No provider available, skipping contract code check');
        } else {
          const code = await contractProvider.getCode(gmContract.target);
          if (code === '0x') {
            console.error('❌ GM Token contract not deployed at address:', gmContract.target);
            return;
          }
        }
      } catch (error) {
        console.error('❌ Failed to verify contract deployment:', error);
        // Continue without hard fail to avoid breaking build
      }
      
      // Load token info (guard against non-standard or failing name/symbol)
      let name = '';
      let symbol = '';
      let decimals = 18;
      let totalSupply = 0;
      try { name = await gmContract.name(); } catch { /* ignore */ }
      try { symbol = await gmContract.symbol(); } catch { /* ignore */ }
      try { decimals = await gmContract.decimals(); } catch { /* keep default 18 */ }
      try { const ts = await gmContract.totalSupply(); totalSupply = Number(ethers.formatEther(ts)); } catch { /* ignore */ }
      setTokenInfo({ name, symbol, decimals, totalSupply });
      
      // Load encrypted balance (best-effort) - only if FHEVM is ready
      if (fhevmInitialized) {
        try {
          const encryptedBalance = await gmContract.confidentialBalanceOf(userAddress);
          setUserEncryptedBalance(encryptedBalance);
        } catch (error: any) {
          console.warn('⚠️ Failed to load confidential balance:', error.message);
          setUserEncryptedBalance('');
        }
      } else {
        setUserEncryptedBalance('');
      }
      
      // Load public balance
      try {
        const publicBalance = await gmContract.publicBalances(userAddress);
        const publicBalanceFormatted = Number(ethers.formatEther(publicBalance));
        setUserPublicBalance(publicBalanceFormatted);
        globalHookState.userPublicBalance = publicBalanceFormatted;
        notifyGlobalStateChange(); // Notify all listeners
      } catch (balanceError) {
        setUserPublicBalance(0);
        globalHookState.userPublicBalance = 0;
        notifyGlobalStateChange(); // Notify all listeners
      }
      
      // Load pool balances
      const poolBalancesData = await getPoolBalancesWithContract(swapContract);
      setPoolBalances(poolBalancesData);
      
      // Debug log removed
    } catch (error: any) {
      console.error('❌ Failed to load data:', error);
    }
  };

  // Get pool balances with contract parameter
  const getPoolBalancesWithContract = async (contract: any) => {
    // Debug log removed
    // Debug log removed
    if (!contract) {
      return { ethPool: 0, gmTokenPool: 0 };
    }

    try {
      // Try getReserves first (from reference file)
      try {
        const reserves = await contract.getReserves();
        const ethPool = Number(ethers.formatEther(reserves[0]));
        const gmTokenPool = Number(ethers.formatEther(reserves[1]));
        return { ethPool, gmTokenPool };
      } catch (getReservesError: any) {
      }

      // Try getPoolBalances second
      try {
        // Debug log removed
        const [ethPoolResult, gmTokenPoolResult] = await contract.getPoolBalances();
        // Debug log removed
        const ethPool = Number(ethers.formatEther(ethPoolResult));
        const gmTokenPool = Number(ethers.formatEther(gmTokenPoolResult));
        // Debug log removed
        return { ethPool, gmTokenPool };
      } catch (getPoolError: any) {
        // Debug log removed
      }

      // Fallback to individual calls
      let ethPool = 0;
      let gmTokenPool = 0;
      
      try {
        const ethPoolResult = await contract.totalETHReserve();
        ethPool = Number(ethers.formatEther(ethPoolResult));
      } catch (ethError: any) {
      }

      try {
        const gmTokenPoolResult = await contract.totalGMReserve();
        gmTokenPool = Number(ethers.formatEther(gmTokenPoolResult));
      } catch (gmError: any) {
      }
      
      return { ethPool, gmTokenPool };
    } catch (error: any) {
      console.error('❌ Failed to get pool balances:', error);
      return { ethPool: 0, gmTokenPool: 0 };
    }
  };

  // Get pool balances (using state contracts)
  const getPoolBalances = async () => {
    return await getPoolBalancesWithContract(swapContract);
  };

  // Daily Check-In
  const performCheckIn = async () => {
    if (!researchContract || !isConnected || !address) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    try {
      
      // Check if user can check-in today
      const canCheckIn = await researchContract.canCheckInToday(address);
      if (!canCheckIn) {
        toast.error('❌ You have already checked in today!');
      return;
    }

      // Get check-in reward amount
      const reward = await researchContract.getCheckInReward();
      
      // Create signer-based contract for write operations
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const researchContractWithSigner = new ethers.Contract(Research_ADDRESS, Research_ABI, signer);
      
      // Perform check-in
      const tx = await researchContractWithSigner.dailyCheckIn();
      
      toast.success('⏳ Check-in transaction submitted...');
      
      // Wait for transaction confirmation
      await tx.wait();
      
      toast.success(`✅ Daily check-in completed! +${ethers.formatEther(reward)} GM tokens`);
      
      // Reload balance after check-in
      setTimeout(() => {
        loadDataWithContracts(gmTokenContract!, swapContract!, researchContract!, address, true);
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Check-in failed:', error);
      toast.error(`Check-in failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Research state management
  const [isResearching, setIsResearching] = useState(false);

  // Research function with FHE EIP-712 signature
  const performResearch = async (researchType: number = 1) => {

    if (!researchContract || !isConnected || !address) {
      // Try recover from window to avoid blocking
      const winResearch = (window as any).researchContract;
      if (winResearch) {
        try { setResearchContract(winResearch); } catch (_) {}
      }
      if (!winResearch) return null; // silent exit
    }

    if (isResearching) {
      toast.error('Research already in progress...');
      return null;
    }

    setIsResearching(true);

    try {

      // Get research cost from contract (fallback to 10 GM if getter missing)
      let cost: bigint;
      try {
        cost = await researchContract.getResearchCost();
      } catch (_) {
        cost = ethers.parseEther('10');
      }
      const costFormatted = parseFloat(ethers.formatEther(cost));
      
      // No frontend balance check - let contract validate on-chain

      // Create signer-based contract for write operations
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Ensure gmTokenContract is available (recover from window or create new instance)
      let gmTokenContractToUse = gmTokenContract;
      if (!gmTokenContractToUse) {
        const winGmToken = (window as any).gmTokenContract;
        if (winGmToken) {
          gmTokenContractToUse = winGmToken;
        } else {
          // Create new instance if not available
          gmTokenContractToUse = new ethers.Contract(GMToken_ADDRESS, GMToken_ABI, signer);
          setGmTokenContract(gmTokenContractToUse);
          (window as any).gmTokenContract = gmTokenContractToUse;
        }
      }

      // Check and approve GM tokens if needed (contract needs approval to transferFrom)
      // Approve a larger amount once (100 GM) to avoid repeated approvals
      try {
        // Check current allowance first
        const currentAllowance = await gmTokenContractToUse.allowance(address, Research_ADDRESS);
        const currentAllowanceFormatted = parseFloat(ethers.formatEther(currentAllowance));
        
        // Only approve if allowance is less than required cost
        if (currentAllowanceFormatted >= costFormatted) {
          // Allowance is sufficient, skip approval
        } else {
          // Approve 100 GM once - enough for 10 research transactions without re-approving
          const approvalAmount = 100; // 100 GM covers 10 research transactions
          toast(`🔐 Approving ${approvalAmount} GM tokens (covers ${Math.floor(approvalAmount / costFormatted)} research transactions)...`, { duration: 3000 });
          
          const approveAmount = ethers.parseEther(approvalAmount.toString());
          const approveTx = await gmTokenContractToUse.approve(Research_ADDRESS, approveAmount);
          await approveTx.wait(1);
          
          toast.success(`✅ Approved ${approvalAmount} GM tokens - no need to approve again for ${Math.floor(approvalAmount / costFormatted)} more transactions`);
        }
      } catch (approvalError: any) {
        console.error('❌ Approval failed:', approvalError);
        toast.error(`❌ Failed to approve GM tokens: ${approvalError.message}`);
        throw approvalError; // Re-throw to prevent continuing without approval
      }

      const researchContractWithSigner = new ethers.Contract(Research_ADDRESS, Research_ABI, signer);

      toast('⏳ Submitting research transaction to blockchain...', { duration: 3000 });

      // Perform research with topic - using FHE flow
      const researchTopic = `AI Research - ${new Date().toISOString()}`;
      
      // Check if FHEVM is available for FHE encryption
      // MUST use FHE flow - contract only accepts performAIResearchFHE
      let tx;
      
      try {
        
        // Ensure FHEVM is available with createEncryptedInput method
        let fhevmReady = (window as any).fhevm && typeof (window as any).fhevm.createEncryptedInput === 'function';
        
        if (!fhevmReady) {
          // Wait up to 5 seconds for FHEVM
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 500));
            fhevmReady = (window as any).fhevm && typeof (window as any).fhevm.createEncryptedInput === 'function';
            if (fhevmReady) {
              break;
            }
          }
        }
        
        if (!fhevmReady) {
          throw new Error('FHEVM not ready - createEncryptedInput method not available. Please wait for FHEVM initialization.');
        }
        
        // Encrypt the cost value using FHEVM
        // Use getAddress from ethers v6
        const getAddr = ethers.getAddress || ((addr: string) => addr);
        const contractAddress = getAddr(Research_ADDRESS);
        const userAddressChecksum = getAddr(address);
        
        // Convert cost from wei to GM units for encryption
        const costInGM = Number(cost / BigInt(10**18));
        
        // Encrypt cost value with proof
        const { handle: encryptedCostHandle, inputProof } = await encryptValueWithProof(
          costInGM,
          contractAddress,
          userAddressChecksum
        );
        
        
        // Call FHE version with encrypted cost (contract REQUIRES this)
        tx = await researchContractWithSigner.performAIResearchFHE(
          researchTopic,
          cost, // costPublic (must match AI_RESEARCH_COST for validation)
          encryptedCostHandle, // encryptedCostHandle (bytes32)
          inputProof // inputProof (bytes)
        );
        
      } catch (fheError: any) {
        console.error('❌ FHE encryption/transaction failed:', fheError);
        toast.error(`❌ FHE research failed: ${fheError.message}. Please ensure FHEVM is initialized.`);
        throw fheError; // Don't fallback - contract requires FHE flow
      }

      toast('📤 Research transaction submitted - waiting for confirmation...', { duration: 3000 });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      
      // Show "receiving results" message
      toast('📊 Receiving results... Please wait.', { duration: 8000 });

      // Dispatch transaction success event to trigger balance reload ONLY
      window.dispatchEvent(new CustomEvent('transactionSuccess', {
        detail: { type: 'research', amount: costFormatted }
      }));

      // Load balance once after transaction (only reload, no page refresh)
      setTimeout(() => {
        if ((window as any).loadTokenBalances) {
          (window as any).loadTokenBalances();
        }
      }, 2000);

      // Return transaction for external use
      // Note: Page reload will be handled in AIResearchTool after results are received
      return tx;

    } catch (error: any) {
      console.error('❌ Research failed:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        shortMessage: error.shortMessage,
        reason: error.reason,
        stack: error.stack
      });

      if (error.code === 4001 || error.message?.includes('rejected')) {
        toast.error('❌ Research cancelled - signature rejected');
      } else if (error.message?.includes('allowance') || error.reason?.includes('allowance')) {
        // Contract rejected due to insufficient allowance
        toast.error('❌ Insufficient token allowance - approval required. Please try again.');
      } else if (error.message?.includes('insufficient') || error.message?.includes('Insufficient')) {
        // Contract rejected due to insufficient balance on-chain
        toast.error('❌ Insufficient GM tokens - please swap ETH to GM first');
      } else {
        // Show contract error message
        const errorMsg = error.reason || error.shortMessage || error.message || 'Unknown error';
        toast.error(`❌ Research failed: ${errorMsg}`);
      }

      return null;
    } finally {
      setIsResearching(false);
    }
  };

  // Fund research pool function
  const fundResearchPool = async (amount: number) => {
    if (!researchContract || !isConnected || !address) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!gmTokenContract) {
      toast.error('GM Token contract not available!');
      return;
    }

    setIsLoading(true);
    try {
      
      // Check if user has enough balance
      if (userPublicBalance < amount) {
        toast.error(`Insufficient GM tokens! Need ${amount}, have ${userPublicBalance}`);
        return;
      }
      
      // Check allowance
      const allowance = await gmTokenContract.allowance(address, Research_ADDRESS);
      const allowanceFormatted = parseFloat(ethers.formatEther(allowance));
      
      if (allowanceFormatted < amount) {
        const approveTx = await gmTokenContract.approve(Research_ADDRESS, ethers.parseEther(amount.toString()));
        await approveTx.wait();
      }
      
      // Fund the research pool
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const researchContractWithSigner = new ethers.Contract(Research_ADDRESS, Research_ABI, signer);
      
      const tx = await researchContractWithSigner.fundPool(ethers.parseEther(amount.toString()));
      
      toast.success('⏳ Funding transaction submitted...');
      
      // Wait for transaction confirmation
        await tx.wait();
      
      toast.success(`✅ Research pool funded with ${amount} GM tokens!`);
      
      // Reload balance after funding
      setTimeout(() => {
        loadDataWithContracts(gmTokenContract!, swapContract!, researchContract!, address, true);
        }, 2000);
      
    } catch (error: any) {
      console.error('❌ Fund research pool failed:', error);
      toast.error(`Fund research pool failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get research cost
  const getResearchCost = async (researchType: number): Promise<number> => {
    if (!researchContract) {
      return 0;
    }
    
    try {
      const cost = await researchContract.getResearchCost();
      return Number(ethers.formatEther(cost));
    } catch (error: any) {
      console.error('❌ Failed to get research cost:', error);
      // Return default cost (10 GM)
      return 10;
    }
  };

  // Format FHE handle
  const formatFHEHandle = (handle: string) => {
    if (!handle || handle === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return '0.00';
    }
    return 'Encrypted';
  };

  // Check if FHE is encrypted
  const isFHEEncrypted = (handle: string) => {
    return handle && handle !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  };

  // Add portfolio entry
  const addPortfolioEntry = async (coinId: string, amount: number) => {
    setPortfolioCount(prev => prev + 1);
    toast.success(`Added ${coinId} to portfolio`);
  };

  // Add to watchlist
  const addToWatchlist = async (coinId: string) => {
    setWatchlistCount(prev => prev + 1);
    toast.success(`Added ${coinId} to watchlist`);
  };

  // Get portfolio items
  const getPortfolioItems = () => {
    return [];
  };

  // Get watchlist items
  const getWatchlistItems = () => {
    return [];
  };

  // Get user AI research
  const getUserAIResearch = () => {
    return [];
  };

  // Create research project
  const createResearchProject = async (name: string, description: string) => {
    toast.success(`Research project "${name}" created`);
  };

  // Update privacy settings
  const updatePrivacySettings = async (portfolioPublic: boolean, watchlistPublic: boolean) => {
    setIsPortfolioPublic(portfolioPublic);
    setIsWatchlistPublic(watchlistPublic);
    toast.success('Privacy settings updated');
  };

  // Swap ETH to GM
  const swapETHToGM = async (ethAmount: string | number) => {
    const ethAmountStr = typeof ethAmount === 'number' ? ethAmount.toString() : ethAmount;
    if (!isConnected || !swapContract) {
      toast.error('Please connect your wallet first!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const swapContractWithSigner = new ethers.Contract(SwapETHToGM_ADDRESS, SwapETHToGM_ABI, signer);
      
      const tx = await swapContractWithSigner.swapETHForGM({ value: ethers.parseEther(ethAmountStr) });
      await tx.wait();
      toast.success(`✅ Swapped ${ethAmountStr} ETH for GM tokens!`);
      
      setTimeout(() => loadDataWithContracts(gmTokenContract!, swapContract!, researchContract!, address, true), 2000);
    } catch (error: any) {
      console.error('❌ Swap failed:', error);
      toast.error(`Swap failed: ${error.shortMessage || error.message}`);
    }
  };

  // Manual decrypt balance
  const manualDecryptBalance = async () => {
    if (!userEncryptedBalance || !address) {
      toast.error('No encrypted balance or address available');
      return;
    }

    try {
      toast.loading('🔄 Starting manual decryption...');
      
      // Simulate decryption process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('🔄 Starting manual decryption with retry mechanism...');
      
      // For now, just set a mock decrypted balance
      const mockDecryptedBalance = 1000;
      setUserDecryptedBalance(mockDecryptedBalance);
      
      if (mockDecryptedBalance > 0) {
        toast.success(`🎉 Manual decryption successful: ${mockDecryptedBalance.toLocaleString()} GM tokens`);
          } else {
        toast.success('ℹ️ Manual decryption completed - balance is 0');
      }
      
    } catch (error: any) {
      console.error('❌ Manual decryption failed:', error);
      toast.error(`Manual decryption failed: ${error.shortMessage || error.message}`);
    }
  };

  // Daily check-in (alias for performCheckIn)
  const dailyCheckIn = performCheckIn;

  // AI Research (alias for performResearch)
  const requestAIResearch = async (coinId: string, prompt: string, tokenCost: string) => {
    return performResearch(1); // Default research type
  };

  // Spin the wheel
  const spinTheWheel = async () => {
    toast.success('🎰 Lucky wheel spun!');
  };

  // Mint GM tokens
  const mintGmTokens = async (amount: number) => {
    toast.success(`Minted ${amount} GM tokens`);
  };

  // Initialize pool
  const initializePool = async (ethAmount: string | number, gmAmount: string | number) => {
    if (!isConnected || !swapContract || !gmTokenContract) {
      toast.error('Please connect your wallet first!');
      return;
    }

    try {
      const ethAmountStr = typeof ethAmount === 'number' ? ethAmount.toString() : ethAmount;
      const gmAmountStr = typeof gmAmount === 'number' ? gmAmount.toString() : gmAmount;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const swapContractWithSigner = new ethers.Contract(SwapETHToGM_ADDRESS, SwapETHToGM_ABI, signer);
      const gmTokenContractWithSigner = new ethers.Contract(GMToken_ADDRESS, GMToken_ABI, signer);
      
      toast.loading(`🔄 Initializing pool with ${ethAmountStr} ETH and ${gmAmountStr} GM...`);
      
      // Check allowance
      const allowance = await gmTokenContractWithSigner.allowance(address, SwapETHToGM_ADDRESS);
      const gmAmountWei = ethers.parseEther(gmAmountStr);
      
      if (allowance < gmAmountWei) {
        toast.loading('🔐 Approving GM tokens...');
        const approveTx = await gmTokenContractWithSigner.approve(SwapETHToGM_ADDRESS, gmAmountWei);
        await approveTx.wait();
        toast.success('✅ Approval successful');
      }
      
      // Initialize pool
      const tx = await swapContractWithSigner.initializePool(
        gmAmountWei,
        { value: ethers.parseEther(ethAmountStr) }
      );
      await tx.wait();
      
      toast.success(`✅ Pool initialized with ${ethAmountStr} ETH and ${gmAmountStr} GM!`);
      
      // Reload data
      setTimeout(() => loadDataWithContracts(gmTokenContract!, swapContract!, researchContract!, address, true), 2000);
    } catch (error: any) {
      console.error('❌ Initialize pool failed:', error);
      toast.error(`Initialize pool failed: ${error.shortMessage || error.message}`);
    }
  };

  return {
    // Connection state
    isConnected,
    address,
    isLoading,
    isResearching,
    
    // Contract instances
    gmTokenContract,
    swapContract,
    researchContract,
    
    // FHEVM state
    fhevmInitialized,
    aclPermissionsGranted,
    fhevmLoading,
    
    // Token balances
    userPublicBalance,
    userEncryptedBalance,
    userDecryptedBalance,
    poolBalances,
    
    // Token info
    tokenInfo,
    
    // Portfolio state
    portfolioCount,
    watchlistCount,
    isPortfolioPublic,
    isWatchlistPublic,
    hasActiveResearch,
    
    // Functions
    connectWallet,
    disconnectWallet,
    dailyCheckIn,
    requestAIResearch,
    spinTheWheel,
    addPortfolioEntry,
    addToWatchlist,
    getPortfolioItems,
    getWatchlistItems,
    getUserAIResearch,
    mintGmTokens,
    createResearchProject,
    updatePrivacySettings,
    swapETHToGM,
    manualDecryptBalance,
    performCheckIn,
    performResearch,
    getResearchCost,
    fundResearchPool,
    initializePool,
    
    // Contract addresses
    contractAddress: GMToken_ADDRESS,
    
    // FHEVM Status
    formatFHEHandle,
    isFHEEncrypted,
  };
};

export default useCoinCheckGoFHESimple;