import React, { useState, useEffect } from 'react';
import { useCoinCheckGoFHE } from '../hooks/useCoinCheckGoFHE';
import './OriginalDesign.css';
/* import './AIResearchCenter.css'; */

interface AIResearchCenterProps {
  setCurrentPage: (page: string) => void;
  currentPage?: string;
}

const AIResearchCenter: React.FC<AIResearchCenterProps> = ({ setCurrentPage, currentPage = 'ai-research' }) => {
  const {
    isConnected,
    address: userAddress,
    researchTokensHandle,
    spinTokensHandle,
    gmTokensHandle,
    streakHandle,
    totalCheckInsHandle,
    isLoading,
    connectWallet,
    requestAIResearch,
    getUserAIResearch,
    loadData
  } = useCoinCheckGoFHE();

  // AI Research data - Standalone
  const [aiResearchList, setAiResearchList] = useState<any[]>([]);

  // Form states
  const [researchForm, setResearchForm] = useState({
    coinId: '',
    prompt: '',
    analysisType: 'quick'
  });

  // UI states
  const [analysisFilter, setAnalysisFilter] = useState('all');
  const [marketData, setMarketData] = useState<any[]>([]);

  // Token costs
  const getTokenCost = () => {
    const costs: { [key: string]: number } = {
      'quick': 5,
      'technical': 15,
      'sentiment': 10,
      'prediction': 25,
      'comprehensive': 35
    };
    return costs[researchForm.analysisType] || 5;
  };

  // Navigation menu items
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'portfolio', icon: '📊', label: 'Portfolio' },
    { id: 'ai-research', icon: '🤖', label: 'AI Research' },
    { id: 'lucky-wheel', icon: '🎰', label: 'Lucky Wheel' },
    { id: 'watchlist', icon: '👀', label: 'Watchlist' },
    { id: 'research-projects', icon: '🔬', label: 'Research Projects' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  // AI Research focused user stats for sidebar
  const userStats = [
    { label: '🔬 Research Tokens', value: researchTokensHandle ? `${researchTokensHandle.substring(0, 8)}...` : 'Not init', color: '#00ff88' },
    { label: '🎰 Spin Tokens', value: spinTokensHandle ? `${spinTokensHandle.substring(0, 8)}...` : 'Not init', color: '#9d4edd' },
    { label: '🪙 GM Tokens', value: gmTokensHandle ? `${gmTokensHandle.substring(0, 8)}...` : 'Not init', color: '#00d4ff' },
    { label: '📊 Total Check-Ins', value: totalCheckInsHandle ? `${totalCheckInsHandle.substring(0, 8)}...` : '0', color: '#ffb800' },
    { label: '🔥 Check-In Streak', value: streakHandle ? `${streakHandle.substring(0, 8)}...` : '0', color: '#ff5459' },
  ];

  // Filter analyses
  const filteredAnalyses = aiResearchList.filter(analysis => {
    if (analysisFilter === 'all') return true;
    if (analysisFilter === 'completed') return analysis.isCompleted;
    if (analysisFilter === 'processing') return !analysis.isCompleted;
    if (analysisFilter === 'failed') return false; // Add failed logic if needed
    return true;
  });

  // Get analysis type name
  const getAnalysisTypeName = (tokens: number) => {
    const types: { [key: number]: string } = {
      5: 'Quick',
      10: 'Sentiment',
      15: 'Technical',
      25: 'Prediction',
      35: 'Comprehensive'
    };
    return types[tokens] || 'Custom';
  };

  // Handle research submit
  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Wallet connection check removed per UX: allow click and attempt

    try {
      await requestAIResearch(researchForm.coinId, researchForm.prompt, getTokenCost());
      
      // Clear form
      setResearchForm({
        coinId: '',
        prompt: '',
        analysisType: 'quick'
      });

      alert(`✅ AI Research Request Submitted!\n\nCoin: ${researchForm.coinId.toUpperCase()}\nType: ${researchForm.analysisType}\nTokens Used: ${getTokenCost()}\n\nNote: This is a standalone AI Research demo. Full contract integration available in main app.`);
      
      await loadAIResearchData();
    } catch (error: any) {
      alert('❌ Request failed: ' + error.message);
    }
  };

  // View analysis results
  const viewAnalysisResults = async (analysisId: number) => {
    try {
      // This would call the contract to get results
      alert(`🔐 Analysis #${analysisId} Results\n\nResults are FHE encrypted. Use Zama SDK to decrypt with your private key.`);
    } catch (error: any) {
      alert('❌ Failed to load results: ' + error.message);
    }
  };

  // Copy analysis info
  const copyAnalysisInfo = (id: number, coin: string, prompt: string) => {
    const info = `Analysis #${id}\nCoin: ${coin}\nQuestion: ${prompt}`;
    navigator.clipboard.writeText(info).then(() => {
      alert('📋 Copied to clipboard!');
    });
  };

  // Standalone actions - With navigation options
  const performDailyCheckIn = async () => {
    // Wallet connection check removed per UX

    // Mock daily check-in for standalone AI Research
    alert('✅ Daily check-in completed!\n\nYou earned:\n• 5 Research Tokens\n\nNote: This is a standalone AI Research demo. For full daily check-in functionality with real tokens, please use the main application home page.');
    await loadAIResearchData();
  };

  const openEarnTokensModal = () => {
    alert('💎 Ways to Earn Research Tokens:\n\n📅 Daily Check-In: Earn 5 Research Tokens\n🎰 Lucky Wheel: Win bonus tokens\n🔄 Token Swaps: Convert GM tokens\n💰 Portfolio Management: Earn through activities\n\nClick the actions below to access these features!');
  };

  const openSwapModal = () => {
    setCurrentPage('portfolio'); // Navigate to portfolio for token management
  };

  const openLuckyWheelModal = () => {
    setCurrentPage('lucky-wheel'); // Navigate to lucky wheel
  };

  // Mock AI research data for standalone operation
  const loadAIResearchData = async () => {
    if (!isConnected || !userAddress) return;
    
    // Mock data for standalone AI Research
    const mockResearchData = [
      {
        id: 1,
        coinId: 'bitcoin',
        prompt: 'What is the price outlook for Bitcoin?',
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        isCompleted: true,
        tokensUsed: 5
      },
      {
        id: 2,
        coinId: 'ethereum',
        prompt: 'Technical analysis for Ethereum',
        timestamp: Math.floor(Date.now() / 1000) - 7200,
        isCompleted: true,
        tokensUsed: 15
      }
    ];
    
    setAiResearchList(mockResearchData);
  };

  // Load market data
  const loadMarketData = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano&vs_currencies=usd&include_24hr_change=true');
      const data = await response.json();
      
      const coins = {
        'bitcoin': { icon: '₿', name: 'Bitcoin' },
        'ethereum': { icon: 'Ξ', name: 'Ethereum' },
        'solana': { icon: '◎', name: 'Solana' },
        'cardano': { icon: '₳', name: 'Cardano' }
      };

      const marketArray = Object.entries(data).map(([coinId, info]: [string, any]) => ({
        id: coinId,
        icon: coins[coinId as keyof typeof coins].icon,
        name: coins[coinId as keyof typeof coins].name,
        price: info.usd,
        change: info.usd_24h_change
      }));

      setMarketData(marketArray);
    } catch (error) {
      console.error('❌ Failed to load market data:', error);
    }
  };

  useEffect(() => {
    loadMarketData();
    loadAIResearchData();
    const interval = setInterval(loadMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [isConnected, userAddress]);

  useEffect(() => {
    if (isConnected && userAddress) {
      loadAIResearchData();
    }
  }, [isConnected, userAddress]);

  return (
    <div className="modern-dashboard">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">🪙 CoinCheckGo FHE</div>

        {/* Navigation Menu */}
        <ul className="nav-menu">
          {navItems.map(page => (
            <li key={page.id} className="nav-item">
              <a href="#" className={`nav-link ${currentPage === page.id ? 'active' : ''}`} onClick={() => setCurrentPage(page.id)}>
                <span className="nav-icon">{page.icon}</span>
                <span>{page.label}</span>
              </a>
            </li>
          ))}
        </ul>

        {/* AI Research User Stats */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            color: '#00d4ff',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🤖</span>
            Your Research Stats
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {userStats.map((stat, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {stat.label}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: stat.color,
                  wordBreak: 'break-all',
                  textAlign: 'right'
                }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '16px',
            padding: '8px',
            background: 'rgba(0, 212, 255, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center'
          }}>
            🔐 All data is FHE encrypted
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {/* Page Content */}
        <div className="page">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, rgb(0, 212, 255), rgb(157, 78, 221))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              🤖 AI Research Analysis
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Leverage advanced AI to analyze cryptocurrency markets with professional-grade insights
            </p>
          </div>

          <div className="glass-card" style={{ marginBottom: '24px', maxWidth: '1200px', margin: '0 auto 24px auto' }}>
            <h2 style={{
              color: 'rgb(0, 212, 255)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '24px'
            }}>
              <span>⚡</span>
              Quick Analysis Request
            </h2>

            <form onSubmit={handleResearchSubmit} style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'rgb(0, 212, 255)',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Cryptocurrency
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={researchForm.coinId}
                    onChange={(e) => setResearchForm({...researchForm, coinId: e.target.value})}
                    placeholder="bitcoin, ethereum, solana..."
                    required
                    style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'rgb(0, 212, 255)',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Analysis Type
                  </label>
                  <select
                    className="form-input"
                    value={researchForm.analysisType}
                    onChange={(e) => setResearchForm({...researchForm, analysisType: e.target.value})}
                    style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                  >
                    <option value="quick">Quick Analysis (5 tokens)</option>
                    <option value="technical">Technical Analysis (15 tokens)</option>
                    <option value="sentiment">Sentiment Analysis (10 tokens)</option>
                    <option value="prediction">Price Prediction (25 tokens)</option>
                    <option value="comprehensive">Comprehensive (35 tokens)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: 'rgb(0, 212, 255)',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Your Research Question
                </label>
                <textarea
                  className="form-input"
                  value={researchForm.prompt}
                  onChange={(e) => setResearchForm({...researchForm, prompt: e.target.value})}
                  placeholder="What specific insights are you looking for? Be as detailed as possible..."
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                className="modern-btn"
                disabled={isLoading || !isConnected}
                style={{
                  background: 'linear-gradient(135deg, rgb(0, 212, 255), rgb(157, 78, 221))',
                  fontSize: '18px',
                  padding: '16px 32px'
                }}
              >
                🚀 Request AI Analysis ({getTokenCost()} Tokens)
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: 'rgb(0, 212, 255)', fontSize: '24px' }}>📊 Your Research History</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['all', 'completed', 'processing', 'failed'].map(filter => (
                  <button
                    key={filter}
                    className={`filter-btn ${analysisFilter === filter ? 'active' : ''}`}
                    onClick={() => setAnalysisFilter(filter)}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      background: analysisFilter === filter ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: analysisFilter === filter ? 'rgb(0, 212, 255)' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredAnalyses.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px', opacity: '0.5' }}>🤖</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>No Research Yet</div>
                  <div style={{ fontSize: '14px' }}>Start by requesting your first AI analysis above</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {filteredAnalyses.map((research) => (
                    <div key={research.id} style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '20px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '15px'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#ffffff',
                            marginBottom: '5px'
                          }}>
                            {research.coinId.toUpperCase()} Analysis
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: 'rgba(255,255,255,0.6)'
                          }}>
                            {new Date(research.timestamp * 1000).toLocaleString()}
                          </div>
                        </div>
                        <span style={{
                          background: research.isCompleted ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 184, 0, 0.2)',
                          color: research.isCompleted ? '#00ff88' : '#ffb800',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {research.isCompleted ? '✅ Completed' : '⏳ Processing'}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '16px',
                        color: 'rgba(255,255,255,0.8)',
                        fontStyle: 'italic',
                        marginBottom: '15px',
                        lineHeight: '1.4'
                      }}>
                        "{research.prompt}"
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '20px',
                          fontSize: '14px',
                          color: 'rgba(255,255,255,0.6)'
                        }}>
                          <span>💰 {research.tokensUsed} tokens</span>
                          <span>📊 {getAnalysisTypeName(research.tokensUsed)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {research.isCompleted ? (
                            <button
                              onClick={() => viewAnalysisResults(research.id)}
                              className="modern-btn"
                              style={{
                                fontSize: '12px',
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #00d4ff, #9d4edd)'
                              }}
                            >
                              🔓 View Results
                            </button>
                          ) : (
                            <button
                              disabled
                              style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '12px'
                              }}
                            >
                              ⏳ Processing...
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={loadAIResearchData}>
                🔄 Refresh History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIResearchCenter;
