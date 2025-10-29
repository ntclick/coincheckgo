import { useState, useEffect } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { toast } from 'react-hot-toast';
import { CheckInState, CheckInHook } from './types';

// Contract configuration
const CONTRACT_ADDRESS = '0xBBac81C2b7359cf15C84d569ef297D329Af84479'; // GMToken address
const CONTRACT_ABI = [
  "function dailyCheckIn()",
  "function getCurrentDay() view returns (uint256)",
  "function getCheckInStreak(address user) view returns (uint256)",
  "function getTotalCheckIns(address user) view returns (uint256)",
  "function getUserDataInfo(address user) view returns (uint256, bool, bool, bool)"
];

export function useCheckIn(userAddress: string, isConnected: boolean): CheckInHook {
  const [lastCheckInDay, setLastCheckInDay] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [streakHandle, setStreakHandle] = useState<string>('0x0');
  const [totalCheckInsHandle, setTotalCheckInsHandle] = useState<string>('0x0');
  const [isLoading, setIsLoading] = useState(false);

  // Load check-in data when connected
  useEffect(() => {
    if (isConnected && userAddress) {
      refreshCheckInData();
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

  const refreshCheckInData = async () => {
    if (!isConnected || !userAddress) return;

    try {
      const contract = await getContract();
      if (!contract) return;

      const [
        currentDayResult,
        streakResult,
        totalCheckInsResult,
        userDataInfo
      ] = await Promise.all([
        contract.getCurrentDay(),
        contract.getCheckInStreak(userAddress),
        contract.getTotalCheckIns(userAddress),
        contract.getUserDataInfo(userAddress)
      ]);

      setCurrentDay(Number(currentDayResult));
      setStreakHandle(streakResult.toString());
      setTotalCheckInsHandle(totalCheckInsResult.toString());

      // Parse user data info: (lastCheckInDay, hasCheckedInToday, isPortfolioPublic, isWatchlistPublic)
      const [lastCheckInDayResult, checkedToday] = userDataInfo;
      setLastCheckInDay(Number(lastCheckInDayResult));
      setHasCheckedInToday(checkedToday);

    } catch (error) {
      console.error('Failed to refresh check-in data:', error);
    }
  };

  const dailyCheckIn = async () => {
    if (!isConnected || !userAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (hasCheckedInToday) {
      toast.error('Already checked in today! Reset at 0h UTC.');
      return;
    }

    try {
      setIsLoading(true);
      const contract = await getContract();
      if (!contract) {
        toast.error('Contract not available');
        return;
      }

      const tx = await contract.dailyCheckIn();
      toast.loading('Checking in...');
      await tx.wait();
      toast.dismiss();

      toast.success('✅ Daily check-in successful! Earned: 10 GM + 1 Spin + 5 Research tokens! 🎉');

      // Refresh data after successful check-in
      await refreshCheckInData();

    } catch (error: any) {
      toast.dismiss();
      console.error('Check-in failed:', error);

      if (error.message?.includes('Already checked in today')) {
        toast.error('Already checked in today! Reset at 0h UTC.');
        setHasCheckedInToday(true);
      } else if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled by user.');
      } else {
        toast.error(`Check-in failed: ${error.shortMessage || error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    lastCheckInDay,
    currentDay,
    hasCheckedInToday,
    streakHandle,
    totalCheckInsHandle,
    isLoading,

    // Actions
    dailyCheckIn,
    refreshCheckInData,
  };
}
