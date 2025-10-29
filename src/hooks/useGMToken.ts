import { useState, useEffect } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { toast } from 'react-hot-toast';
import {
  initializeFHEVM,
  encryptValue,
  decryptValue,
  formatFHEHandle,
  isFHEEncrypted,
} from '../utils/fhevm';

// GMToken Contract Info - Updated with new deployment
const GMToken_ADDRESS = '0xBBac81C2b7359cf15C84d569ef297D329Af84479';

// GMToken ABI
const GMToken_ABI = [
  // Token Info
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function getTokenInfo() view returns (string, string, uint8, uint64)",
  
  // Minting (Owner only)
  "function mint(address to, uint64 amount)",
  "function mintForUser(address to, uint64 amount) external",
  "function confidentialMint(address to, bytes32 encryptedAmount, bytes inputProof) returns (bytes32)",
  "function setMinter(address minter)",
  
  // FHE Encrypted Balances
  "function confidentialBalanceOf(address account) view returns (bytes32)",
  "function confidentialTotalSupply() view returns (bytes32)",
  
  // Transfers
  "function confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof)",
  
  // Events
  "event GMTokenMinted(address indexed to, uint64 amount)",
  "event GMTokenTransferred(address indexed from, address indexed to, uint64 amount)"
];

export const useGMToken = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fhevmInitialized, setFhevmInitialized] = useState(false);
  const [aclPermissionsGranted, setAclPermissionsGranted] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!');
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const contract = new Contract(GMToken_ADDRESS, GMToken_ABI, signer);
        
        setAddress(accounts[0]);
        setContract(contract);
        setIsConnected(true);
        
        // Initialize FHEVM
        const fhevmReady = await initializeFHEVM(provider);
        if (fhevmReady) {
          setFhevmInitialized(true);
          // Check ACL permissions
          const hasPermissions = await checkACLPermissions(accounts[0]);
          setAclPermissionsGranted(hasPermissions);
        }
        
        toast.success('Wallet connected successfully!');
        loadTokenInfo();
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      toast.error(`Connection failed: ${error.message}`);
    }
  };

  // Check ACL permissions
  const checkACLPermissions = async (userAddress: string): Promise<boolean> => {
    try {
      // This would check if user has FHE permissions for the contract
      // For now, return true as a placeholder
      return true;
    } catch (error) {
      console.error('ACL permission check failed:', error);
      return false;
    }
  };

  // Load token info
  const loadTokenInfo = async () => {
    if (!contract) return;

    try {
      const [name, symbol, decimals, totalSupply] = await contract.getTokenInfo();
      console.log('📋 Token Info:', { name, symbol, decimals, totalSupply });
    } catch (error) {
      console.error('Failed to load token info:', error);
    }
  };

  // Get encrypted balance
  const getEncryptedBalance = async (userAddress: string) => {
    if (!contract || !fhevmInitialized) return null;

    try {
      const encryptedBalance = await contract.confidentialBalanceOf(userAddress);
      return formatFHEHandle(encryptedBalance);
    } catch (error) {
      console.error('Failed to get encrypted balance:', error);
      return null;
    }
  };

  // Mint tokens (owner only)
  const mintTokens = async (to: string, amount: number) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.mint(to, amount);
      toast.loading('Minting tokens...');
      await tx.wait();
      toast.dismiss();
      toast.success(`✅ Minted ${amount} GM tokens to ${to}`);
    } catch (error: any) {
      toast.dismiss();
      console.error('Mint failed:', error);
      toast.error(`Mint failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Mint tokens for user (public function)
  const mintForUser = async (to: string, amount: number) => {
    if (!contract || !isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.mintForUser(to, amount);
      toast.loading('Minting tokens for user...');
      await tx.wait();
      toast.dismiss();
      toast.success(`✅ Minted ${amount} GM tokens for ${to}`);
    } catch (error: any) {
      toast.dismiss();
      console.error('Mint for user failed:', error);
      toast.error(`Mint for user failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Confidential mint (FHE encrypted)
  const confidentialMint = async (to: string, amount: number) => {
    if (!contract || !isConnected || !fhevmInitialized || !aclPermissionsGranted) {
      toast.error('🔐 FHEVM not ready. Please reconnect wallet.');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`🔐 Confidential minting ${amount} GM tokens to ${to}...`);
      
      // Encrypt the amount
      const encryptedAmount = await encryptValue(amount, GMToken_ADDRESS, address);
      
      // Call confidential mint
      const tx = await contract.confidentialMint(to, encryptedAmount, "0x");
      toast.loading(`🔐 Confidential minting ${amount} GM tokens...`);
      await tx.wait();
      toast.dismiss();
      toast.success(`✅ Confidential minted ${amount} GM tokens! 🔐`);
    } catch (error: any) {
      toast.dismiss();
      console.error('❌ Confidential mint failed:', error);
      toast.error(`Confidential mint failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isConnected,
    address,
    contract,
    isLoading,
    fhevmInitialized,
    aclPermissionsGranted,
    
    // Functions
    connectWallet,
    loadTokenInfo,
    getEncryptedBalance,
    mintTokens,
    mintForUser,
    confidentialMint,
  };
};
