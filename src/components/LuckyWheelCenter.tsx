import React, { useState, useEffect } from 'react';
import { useCoinCheckGoFHE } from '../hooks/useCoinCheckGoFHE';
import './LuckyWheelCenter.css';

const LuckyWheelCenter: React.FC = () => {
  const {
    isConnected,
    address: userAddress,
    gmTokensHandle,
    spinTokensHandle,
    isLoading,
    connectWallet,
    spinLuckyWheel,
    loadData
  } = useCoinCheckGoFHE();

  // Wheel states
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentReward, setCurrentReward] = useState<string | null>(null);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  // Wheel configuration
  const wheelSlots = [
    { id: 1, reward: '5 GM Tokens', icon: '💎', probability: 20, value: 5 },
    { id: 2, reward: '10 GM Tokens', icon: '⭐', probability: 15, value: 10 },
    { id: 3, reward: '30 GM Tokens', icon: '🔥', probability: 10, value: 30 },
    { id: 4, reward: '0.01 ETH', icon: 'Ξ', probability: 8, value: 0.01 },
    { id: 5, reward: '0.1 ETH', icon: '🚀', probability: 2, value: 0.1 },
    { id: 6, reward: 'Miss', icon: '❌', probability: 20, value: 0 },
    { id: 7, reward: '15 Research Tokens', icon: '🔬', probability: 15, value: 15 },
    { id: 8, reward: 'Bonus Spin', icon: '🎁', probability: 10, value: 'bonus' }
  ];

  // Calculate wheel slot angle
  const slotAngle = 360 / wheelSlots.length;
  
  // Spin the wheel
  const handleSpin = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (isSpinning) return;

    try {
      setIsSpinning(true);
      setSpinResult(null);
      setCurrentReward(null);

      // Calculate random rotation (multiple spins + random slot)
      const spins = 5 + Math.random() * 5; // 5-10 spins
      const randomSlot = Math.floor(Math.random() * wheelSlots.length);
      const finalAngle = spins * 360 + (randomSlot * slotAngle);
      
      setWheelRotation(prev => prev + finalAngle);

      // Simulate spinning animation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Determine reward based on probability
      const selectedSlot = determineReward();
      setCurrentReward(selectedSlot.reward);
      setSpinResult(selectedSlot.reward);

      // Call contract if not "Miss"
      if (selectedSlot.value !== 0 && selectedSlot.value !== 'bonus') {
        try {
          await spinLuckyWheel();
          await loadData();
          
          // Show success message
          setTimeout(() => {
            alert(`🎰 Wheel Result: ${selectedSlot.reward}!\n\nYour reward has been added to your account.`);
          }, 500);
        } catch (error: any) {
          console.error('❌ Contract call failed:', error);
          alert(`🎰 Wheel Result: ${selectedSlot.reward}!\n\n⚠️ Contract call failed: ${error.message}`);
        }
      } else if (selectedSlot.value === 'bonus') {
        setTimeout(() => {
          alert(`🎰 Wheel Result: ${selectedSlot.reward}!\n\n🎉 You get a free spin! Click spin again.`);
        }, 500);
      } else {
        setTimeout(() => {
          alert(`😢 Better luck next time!\n\nYou didn't win anything this time, but your spin token was not consumed.`);
        }, 500);
      }

    } catch (error: any) {
      alert('❌ Spin failed: ' + error.message);
    } finally {
      setIsSpinning(false);
    }
  };

  // Determine reward based on probability
  const determineReward = () => {
    const random = Math.random() * 100;
    let cumulativeProbability = 0;

    for (const slot of wheelSlots) {
      cumulativeProbability += slot.probability;
      if (random <= cumulativeProbability) {
        return slot;
      }
    }

    // Fallback to first slot
    return wheelSlots[0];
  };

  // Calculate current slot based on rotation
  const getCurrentSlot = () => {
    const normalizedRotation = wheelRotation % 360;
    const slotIndex = Math.floor((360 - normalizedRotation) / slotAngle);
    return wheelSlots[slotIndex] || wheelSlots[0];
  };

  return (
    <div className="lucky-wheel-center-container">
      {/* Header */}
      <header className="wheel-header">
        <div className="header-left">
          <div className="logo">🎰 CoinCheckGo Lucky Wheel</div>
          <div className="tagline">Spin to Win Amazing Rewards</div>
        </div>
        <div className="header-right">
          <div className="tokens-display">
            <div className="token-item">
              <span className="token-icon">🎰</span>
              <span className="token-balance">
                {isConnected && spinTokensHandle ? 
                  `🔐 ${spinTokensHandle.substring(0, 8)}...` : 
                  'Loading...'
                }
              </span>
              <span>Spin Tokens</span>
            </div>
          </div>
          <div className="wallet-section">
            <div className="wallet-status">
              <div className="status-dot"></div>
              <span>
                {isConnected ? `${userAddress?.substring(0, 6)}...${userAddress?.substring(38)}` : 'Not Connected'}
              </span>
            </div>
            <button 
              className="connect-wallet-btn" 
              onClick={connectWallet}
              disabled={isConnected}
            >
              {isConnected ? 'Connected ✅' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="wheel-main-content">
        {/* Wheel Section */}
        <div className="wheel-section">
          <div className="wheel-container">
            {/* Wheel Visual */}
            <div 
              className={`wheel ${isSpinning ? 'spinning' : ''}`}
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              {wheelSlots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="wheel-slot"
                  style={{
                    transform: `rotate(${index * slotAngle}deg)`,
                    background: index % 2 === 0 ? 
                      'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(157, 78, 221, 0.2))' : 
                      'linear-gradient(135deg, rgba(157, 78, 221, 0.2), rgba(0, 212, 255, 0.2))'
                  }}
                >
                  <div className="slot-content">
                    <div className="slot-icon">{slot.icon}</div>
                    <div className="slot-reward">{slot.reward}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Wheel Pointer */}
            <div className="wheel-pointer">
              <div className="pointer-arrow">▲</div>
            </div>

            {/* Spin Button */}
            <div className="spin-button-container">
              <button 
                className={`spin-button ${isSpinning ? 'spinning' : ''}`}
                onClick={handleSpin}
                disabled={isSpinning || !isConnected}
              >
                {isSpinning ? (
                  <>
                    <div className="spinning-icon">🎰</div>
                    <span>Spinning...</span>
                  </>
                ) : (
                  <>
                    <div className="spin-icon">🎯</div>
                    <span>SPIN WHEEL</span>
                    <div className="spin-cost">Cost: 1 Spin Token</div>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Result */}
          {currentReward && (
            <div className="result-display fade-in">
              <div className="result-icon">🎉</div>
              <div className="result-title">Congratulations!</div>
              <div className="result-reward">{currentReward}</div>
              <div className="result-message">
                {currentReward.includes('Miss') ? 
                  'Better luck next time!' : 
                  'Your reward has been added to your account!'
                }
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="wheel-sidebar">
          {/* Rewards Info */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <span>🎁</span>
              Possible Rewards
            </h3>
            <div className="rewards-list">
              {wheelSlots.map((slot) => (
                <div key={slot.id} className="reward-item">
                  <div className="reward-icon">{slot.icon}</div>
                  <div className="reward-info">
                    <div className="reward-name">{slot.reward}</div>
                    <div className="reward-probability">{slot.probability}% chance</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to Play */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <span>📋</span>
              How to Play
            </h3>
            <div className="instructions">
              <div className="instruction-item">
                <span className="step-number">1</span>
                <span>Connect your wallet</span>
              </div>
              <div className="instruction-item">
                <span className="step-number">2</span>
                <span>Make sure you have spin tokens</span>
              </div>
              <div className="instruction-item">
                <span className="step-number">3</span>
                <span>Click the spin button</span>
              </div>
              <div className="instruction-item">
                <span className="step-number">4</span>
                <span>Watch the wheel and collect your reward!</span>
              </div>
            </div>
          </div>

          {/* Token Management */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <span>💰</span>
              Token Management
            </h3>
            <div className="token-grid">
              <div className="token-item">
                <div className="token-info">
                  <span className="token-icon">🎰</span>
                  <div>
                    <div className="token-name">Spin Tokens</div>
                    <div className="token-handle">
                      {isConnected && spinTokensHandle ? 
                        `🔐 ${spinTokensHandle.substring(0, 16)}...` : 
                        'Connect wallet to view'
                      }
                    </div>
                  </div>
                </div>
              </div>
              <div className="token-item">
                <div className="token-info">
                  <span className="token-icon">🪙</span>
                  <div>
                    <div className="token-name">GM Tokens</div>
                    <div className="token-handle">
                      {isConnected && gmTokensHandle ? 
                        `🔐 ${gmTokensHandle.substring(0, 16)}...` : 
                        'Connect wallet to view'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button 
              className="earn-tokens-btn" 
              onClick={() => alert('💎 Ways to Earn Spin Tokens:\n\n📅 Daily Check-In: 1 Spin Token\n🎰 Bonus Spins: Win from wheel\n🔄 Token Swaps: Convert GM tokens\n💰 Special Events: Limited time offers')}
              style={{ width: '100%', marginTop: '15px' }}
            >
              💎 Earn More Tokens
            </button>
          </div>

          {/* Statistics */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <span>📊</span>
              Wheel Statistics
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Spins</div>
                <div className="stat-value">0</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Winnings</div>
                <div className="stat-value">0 GM</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Win Rate</div>
                <div className="stat-value">80%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Best Win</div>
                <div className="stat-value">0.1 ETH</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuckyWheelCenter;
