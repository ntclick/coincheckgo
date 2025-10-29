import { useState, useEffect } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { toast } from 'react-hot-toast';
import { TokenBalances, TokensHook } from './types';

// Contract configuration
const CONTRACT_ADDRESS = '0xBBac81C2b7359cf15C84d569ef297D329Af84479'; // GMToken address
const CONTRACT_ABI = [
  "function mintGmTokens(uint64 amount)",
  "function mintSpinTokens(uint32 amount)",
  "function mintResearchTokens(uint32 amount)",
  "function getGmTokens(address user) view returns (uint256)",
  "function getSpinTokens(address user) view returns (uint256)",
  "function getResearchTokens(address user) view returns (uint256)"
];

export function useTokens(userAddress: string, isConnected: boolean): TokensHook {
  const [gmTokensHandle, setGmTokensHandle] = useState<string>('0x0');
  const [spinTokensHandle, setSpinTokensHandle] = useState<string>('0x0');
  const [researchTokensHandle, setResearchTokensHandle] = useState<string>('0x0');
  const [isLoading, setIsLoading] = useState(false);

  // Load token balances when connected
  useEffect(() => {
    if (isConnected && userAddress) {
      refreshTokenBalances();
    }
  }, [isConnected, userAddress]);

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

  const refreshTokenBalances = async () => {
    if (!isConnected || !userAddress) return;

    try {
      const contract = await getContract();
      if (!contract) return;

      const [gmTokens, spinTokens, researchTokens] = await Promise.all([
        contract.getGmTokens(userAddress),
        contract.getSpinTokens(userAddress),
        contract.getResearchTokens(userAddress)
      ]);

      setGmTokensHandle(gmTokens.toString());
      setSpinTokensHandle(spinTokens.toString());
      setResearchTokensHandle(researchTokens.toString());

    } catch (error) {
      console.error('Failed to refresh token balances:', error);
    }
  };

  const mintGmTokens = async (amount: number) => {
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

      const tx = await contract.mintGmTokens(amount);
      toast.loading('Minting GM tokens...');
      await tx.wait();
      toast.dismiss();

      toast.success(`✅ Minted ${amount} GM tokens!`);

      // Refresh balances
      await refreshTokenBalances();

    } catch (error: any) {
      toast.dismiss();
      console.error('Mint GM tokens failed:', error);
      toast.error(`Minting failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const mintSpinTokens = async (amount: number) => {
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

      const tx = await contract.mintSpinTokens(amount);
      toast.loading('Minting Spin tokens...');
      await tx.wait();
      toast.dismiss();

      toast.success(`✅ Minted ${amount} Spin tokens!`);

      // Refresh balances
      await refreshTokenBalances();

    } catch (error: any) {
      toast.dismiss();
      console.error('Mint Spin tokens failed:', error);
      toast.error(`Minting failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const mintResearchTokens = async (amount: number) => {
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

      const tx = await contract.mintResearchTokens(amount);
      toast.loading('Minting Research tokens...');
      await tx.wait();
      toast.dismiss();

      toast.success(`✅ Minted ${amount} Research tokens!`);

      // Refresh balances
      await refreshTokenBalances();

    } catch (error: any) {
      toast.dismiss();
      console.error('Mint Research tokens failed:', error);
      toast.error(`Minting failed: ${error.shortMessage || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    gmTokensHandle,
    spinTokensHandle,
    researchTokensHandle,
    isLoading,

    // Actions
    mintGmTokens,
    mintSpinTokens,
    mintResearchTokens,
    refreshTokenBalances,
  };
}
