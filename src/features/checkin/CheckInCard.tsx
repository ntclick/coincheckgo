import React from 'react';
import { useCheckIn } from './useCheckIn';

interface CheckInCardProps {
  userAddress: string;
  isConnected: boolean;
}

export function CheckInCard({ userAddress, isConnected }: CheckInCardProps) {
  const {
    lastCheckInDay,
    currentDay,
    hasCheckedInToday,
    streakHandle,
    totalCheckInsHandle,
    isLoading,
    dailyCheckIn
  } = useCheckIn(userAddress, isConnected);

  const handleCheckIn = async () => {
    await dailyCheckIn();
  };

  return (
    <div className="glass-card">
      <h2 style={{ color: '#00d4ff', marginBottom: '20px' }}>📅 Daily Check-In</h2>

      {/* Check-in Status */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '10px',
          opacity: hasCheckedInToday ? 0.5 : 1
        }}>
          {hasCheckedInToday ? '✅' : '⏰'}
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: hasCheckedInToday ? '#00ff88' : '#ffb800',
          marginBottom: '5px'
        }}>
          {hasCheckedInToday ? 'Checked In Today!' : 'Ready to Check In'}
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
          Day {currentDay} • Reset 07:00 UTC+7 (00:00 UTC)
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>🔥</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Streak</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#ff6b6b',
            fontFamily: 'monospace'
          }}>
            {isConnected && streakHandle ? `🔐 ${streakHandle.substring(0, 8)}...` : '0'}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>🎯</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Total</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#00d4ff',
            fontFamily: 'monospace'
          }}>
            {isConnected && totalCheckInsHandle ? `🔐 ${totalCheckInsHandle.substring(0, 8)}...` : '0'}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>📅</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Last Check-in</div>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.8)'
          }}>
            {lastCheckInDay > 0 ? `Day ${lastCheckInDay}` : 'Never'}
          </div>
        </div>
      </div>

      {/* Check-in Button */}
      <button
        onClick={handleCheckIn}
        disabled={isLoading || hasCheckedInToday || !isConnected}
        className="modern-btn"
        style={{
          width: '100%',
          background: hasCheckedInToday ?
            'linear-gradient(135deg, #00ff88, #00cc6a)' :
            'linear-gradient(135deg, #ff6b6b, #feca57)',
          fontSize: '16px',
          padding: '14px',
          marginBottom: '10px'
        }}
      >
        {isLoading ? '⏳ Checking in...' :
         hasCheckedInToday ? '✅ Already Checked In Today' :
         '🎯 Check In Now'}
      </button>

      {/* Rewards Info */}
      {!hasCheckedInToday && (
        <div style={{
          background: 'rgba(255,107,107,0.1)',
          border: '1px solid rgba(255,107,107,0.3)',
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
            🎁 Daily Rewards:
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
            • 10 GM Tokens • 1 Spin Token • 5 Research Tokens
          </div>
        </div>
      )}

      {/* Note */}
      <div style={{
        fontSize: '12px',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginTop: '15px',
        lineHeight: '1.4'
      }}>
        Check-in resets daily at 07:00 UTC+7 (00:00 UTC). All rewards are FHE encrypted.
      </div>
    </div>
  );
}
