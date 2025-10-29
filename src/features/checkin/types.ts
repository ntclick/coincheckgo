export interface CheckInState {
  lastCheckInDay: number;
  currentDay: number;
  hasCheckedInToday: boolean;
  streakHandle: string;
  totalCheckInsHandle: string;
  isLoading: boolean;
}

export interface CheckInActions {
  dailyCheckIn: () => Promise<void>;
  refreshCheckInData: () => Promise<void>;
}

export interface CheckInHook extends CheckInState, CheckInActions {}
