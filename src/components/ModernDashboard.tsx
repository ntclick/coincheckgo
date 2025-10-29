import React, { useState, useEffect } from 'react';
import { useCoinCheckGoFHE } from '../hooks/useCoinCheckGoFHE';
import './ModernDashboard.css';

export function ModernDashboard() {
  const {
    address,
    isConnected,
    connectWallet,
    disconnectWallet,
    gmTokensHandle,
    spinTokensHandle,
    researchTokensHandle,
    streakHandle,
    totalCheckInsHandle,
    lastCheckInDay,
    currentDay,
    hasCheckedInToday,
    dailyCheckIn,
    portfolioCount,
    watchlistCount,
    addPortfolioEntry,
    addToWatchlist,
    requestAIResearch,
    getUserAIResearch,
    getPortfolioItems,
    getWatchlistItems,
    mintGmTokens,
    spinTheWheel,
    isLoading,
    contractAddress,
  } = useCoinCheckGoFHE();

  const [currentPage, setCurrentPage] = useState('home');
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [aiResearchList, setAiResearchList] = useState<any[]>([]);
  
  // Form states
  const [portfolioForm, setPortfolioForm] = useState({ coinId: 'bitcoin', amount: '1', price: '50000' });
  const [watchlistForm, setWatchlistForm] = useState({ coinId: 'ethereum' });
  const [aiForm, setAiForm] = useState({ coinId: 'bitcoin', prompt: '', tokenCost: '10' });

  // Load portfolio items
  const loadPortfolio = async () => {
    const items = await getPortfolioItems();
    setPortfolioItems(items || []);
  };

  // Load watchlist items
  const loadWatchlist = async () => {
    const items = await getWatchlistItems();
    setWatchlistItems(items || []);
  };

  // Load AI research
  const loadAIResearch = async () => {
    const items = await getUserAIResearch();
    setAiResearchList(items || []);
  };

  // Load all data when connected
  useEffect(() => {
    if (isConnected) {
      loadPortfolio();
      loadWatchlist();
      loadAIResearch();
    }
  }, [isConnected]);

  return (
    <div className="modern-dashboard">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-logo">🪙 CoinCheckGo</div>
        <ul className="nav-menu">
          <li className="nav-item">
            <a href="#" className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
              <span className="nav-icon">🏠</span>
              <span>Home</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className={`nav-link ${currentPage === 'portfolio' ? 'active' : ''}`} onClick={() => setCurrentPage('portfolio')}>
              <span className="nav-icon">📊</span>
              <span>Portfolio</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className={`nav-link ${currentPage === 'ai-research' ? 'active' : ''}`} onClick={() => setCurrentPage('ai-research')}>
              <span className="nav-icon">🤖</span>
              <span>AI Research</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className={`nav-link ${currentPage === 'lucky-wheel' ? 'active' : ''}`} onClick={() => setCurrentPage('lucky-wheel')}>
              <span className="nav-icon">🎰</span>
              <span>Lucky Wheel</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className={`nav-link ${currentPage === 'watchlist' ? 'active' : ''}`} onClick={() => setCurrentPage('watchlist')}>
              <span className="nav-icon">👀</span>
              <span>Watchlist</span>
            </a>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <h1 className="page-title">{currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace('-', ' ')}</h1>
          <div className="header-actions">
            <div className="network-badge">Sepolia Testnet</div>
            {!isConnected ? (
              <button className="wallet-btn" onClick={connectWallet} disabled={isLoading}>
                {isLoading ? '⏳ Connecting...' : '🔗 Connect Wallet'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ background: 'rgba(0,212,255,0.2)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', color: '#00d4ff' }}>
                  {address.substring(0, 6)}...{address.substring(38)}
                </span>
                <button className="wallet-btn-disconnect" onClick={disconnectWallet}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </header>

        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <div className="page">
            <div className="dashboard-grid">
              {/* Welcome Card with FHE Tokens */}
              <div className="glass-card">
                <h2 style={{ color: '#00d4ff', marginBottom: '16px' }}>🏠 Welcome to CoinCheckGo</h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '20px' }}>
                  Privacy-first crypto research platform powered by Zama FHEVM v0.8
                </p>
                <div className="stats-grid">
                  <div className="stat-card" style={{ background: 'rgba(0, 212, 255, 0.1)' }}>
                    <div className="stat-value" style={{ color: '#00d4ff', fontSize: '14px', wordBreak: 'break-all', cursor: 'pointer' }} title={gmTokensHandle}>
                      {gmTokensHandle === '0x0' || gmTokensHandle === '0' ? 'Not init' : `${gmTokensHandle.substring(0, 10)}...`}
                    </div>
                    <div className="stat-label">🪙 GM Tokens</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>🔐 Encrypted</div>
                  </div>
                  <div className="stat-card" style={{ background: 'rgba(157, 78, 221, 0.1)' }}>
                    <div className="stat-value" style={{ color: '#9d4edd', fontSize: '14px', wordBreak: 'break-all', cursor: 'pointer' }} title={researchTokensHandle}>
                      {researchTokensHandle === '0x0' || researchTokensHandle === '0' ? 'Not init' : `${researchTokensHandle.substring(0, 10)}...`}
                    </div>
                    <div className="stat-label">🔬 Research</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>🔐 Encrypted</div>
                  </div>
                  <div className="stat-card" style={{ background: 'rgba(0, 255, 136, 0.1)' }}>
                    <div className="stat-value" style={{ color: '#00ff88', fontSize: '14px', wordBreak: 'break-all', cursor: 'pointer' }} title={spinTokensHandle}>
                      {spinTokensHandle === '0x0' || spinTokensHandle === '0' ? 'Not init' : `${spinTokensHandle.substring(0, 10)}...`}
                    </div>
                    <div className="stat-label">🎰 Spin</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>🔐 Encrypted</div>
                  </div>
                </div>
              </div>

              {/* Daily Check-In */}
              <div className="glass-card">
                <h3 style={{ color: '#00d4ff', marginBottom: '16px' }}>📅 Daily Check-In</h3>
                
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    <div><span style={{ color: 'rgba(255,255,255,0.6)' }}>Current Day:</span> <strong style={{ color: '#00d4ff' }}>{currentDay}</strong></div>
                    <div><span style={{ color: 'rgba(255,255,255,0.6)' }}>Last Check:</span> <strong>{lastCheckInDay || 'Never'}</strong></div>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(0,212,255,0.1)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Daily Rewards:</p>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>🪙 10 GM + 🎰 1 Spin + 🔬 5 Research</div>
                </div>
                
                <button 
                  onClick={dailyCheckIn}
                  disabled={hasCheckedInToday || isLoading}
                  className="modern-btn"
                  style={{ 
                    width: '100%', 
                    background: hasCheckedInToday ? '#666' : 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
                    cursor: hasCheckedInToday ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? '⏳ Processing...' : hasCheckedInToday ? '✅ Checked In Today' : '📅 Daily Check-In'}
                </button>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '8px' }}>
                  ⏰ Resets at 0:00 UTC
                </p>
              </div>

              {/* Quick Actions */}
              <div className="glass-card">
                <h3 style={{ color: '#00d4ff', marginBottom: '16px' }}>⚡ Quick Actions</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <button className="modern-btn" onClick={() => setCurrentPage('ai-research')}>🤖 AI Analysis</button>
                  <button className="modern-btn" onClick={spinTheWheel} disabled={isLoading}>
                    {isLoading ? '⏳ Spinning...' : '🎰 Spin Wheel'}
                  </button>
                  <button className="modern-btn" onClick={() => setCurrentPage('portfolio')}>📊 Portfolio</button>
                </div>
              </div>

              {/* AI Research Preview */}
              <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #9d4edd 0%, #00d4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  🤖 AI Research Analysis
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                  {/* Request Form */}
                  <div style={{ background: 'rgba(157,78,221,0.1)', borderRadius: '8px', padding: '16px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Request Analysis</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Coin ID (e.g., bitcoin)" 
                        value={aiForm.coinId}
                        onChange={(e) => setAiForm({...aiForm, coinId: e.target.value})}
                        className="form-input"
                      />
                      <textarea 
                        placeholder="Your question..." 
                        rows={3}
                        value={aiForm.prompt}
                        onChange={(e) => setAiForm({...aiForm, prompt: e.target.value})}
                        className="form-input"
                      />
                      <input 
                        type="number" 
                        placeholder="Tokens" 
                        value={aiForm.tokenCost}
                        onChange={(e) => setAiForm({...aiForm, tokenCost: e.target.value})}
                        className="form-input"
                      />
                      <button 
                        onClick={async () => {
                          await requestAIResearch(aiForm.coinId, aiForm.prompt, Number(aiForm.tokenCost));
                          setAiForm({ coinId: '', prompt: '', tokenCost: '10' });
                          await loadAIResearch();
                        }}
                        className="modern-btn"
                        style={{ background: 'linear-gradient(135deg, #9d4edd 0%, #00d4ff 100%)' }}
                        disabled={isLoading}
                      >
                        {isLoading ? '⏳ Requesting...' : '🤖 Request AI'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Research History */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px' }}>📜 Research History ({aiResearchList.length})</h4>
                      <button onClick={loadAIResearch} className="btn-refresh">🔄</button>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {aiResearchList.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                          {isConnected ? 'No research yet. Request your first analysis!' : 'Connect wallet to view history'}
                        </p>
                      ) : (
                        aiResearchList.map((item) => (
                          <div key={item.id} className="research-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span className="coin-badge">{item.coinId}</span>
                              <span className={`status-badge ${item.isCompleted ? 'completed' : 'pending'}`}>
                                {item.isCompleted ? '✅ Completed' : '⏳ Processing...'}
                              </span>
                            </div>
                            <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Q:</strong> {item.prompt}</p>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                              {new Date(item.timestamp * 1000).toLocaleString()} • {item.tokensUsed} tokens
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Management */}
              <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ color: '#00d4ff', marginBottom: '16px' }}>📊 My Portfolio (FHE Encrypted)</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                  {/* Add Form */}
                  <div style={{ background: 'rgba(0,212,255,0.1)', borderRadius: '8px', padding: '16px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>➕ Add Coin</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Coin ID" 
                        value={portfolioForm.coinId}
                        onChange={(e) => setPortfolioForm({...portfolioForm, coinId: e.target.value})}
                        className="form-input"
                      />
                      <input 
                        type="number" 
                        placeholder="Amount (encrypted)" 
                        value={portfolioForm.amount}
                        onChange={(e) => setPortfolioForm({...portfolioForm, amount: e.target.value})}
                        className="form-input"
                      />
                      <input 
                        type="number" 
                        placeholder="Price (encrypted)" 
                        value={portfolioForm.price}
                        onChange={(e) => setPortfolioForm({...portfolioForm, price: e.target.value})}
                        className="form-input"
                      />
                      <button 
                        onClick={async () => {
                          await addPortfolioEntry(portfolioForm.coinId, Number(portfolioForm.amount), Number(portfolioForm.price));
                          setPortfolioForm({ coinId: 'bitcoin', amount: '1', price: '50000' });
                          await loadPortfolio();
                        }}
                        className="modern-btn"
                        disabled={isLoading}
                      >
                        {isLoading ? '⏳ Adding...' : 'Add to Portfolio'}
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
                      💡 Amount & price are FHE encrypted
                    </p>
                  </div>
                  
                  {/* Portfolio List */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px' }}>Your Holdings ({portfolioCount})</h4>
                      <button onClick={loadPortfolio} className="btn-refresh">🔄</button>
                    </div>
                    <div>
                      {portfolioItems.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                          {isConnected ? 'No portfolio items yet. Add your first coin!' : 'Connect wallet to view portfolio'}
                        </p>
                      ) : (
                        portfolioItems.map((item, index) => (
                          <div key={index} className="portfolio-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>{item.coinId}</h4>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                  Added: {new Date(item.addedAt * 1000).toLocaleDateString()}
                                </p>
                                <p style={{ fontSize: '12px' }}>Amount: 🔐 Encrypted</p>
                                <p style={{ fontSize: '12px' }}>Price: 🔐 Encrypted</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Watchlist */}
              <div className="glass-card">
                <h3 style={{ color: '#00d4ff', marginBottom: '16px' }}>👀 Watchlist</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Coin ID" 
                    value={watchlistForm.coinId}
                    onChange={(e) => setWatchlistForm({ coinId: e.target.value })}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button 
                    onClick={async () => {
                      await addToWatchlist(watchlistForm.coinId);
                      setWatchlistForm({ coinId: '' });
                      await loadWatchlist();
                    }}
                    className="modern-btn"
                    disabled={isLoading}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isLoading ? '⏳' : '➕ Add'}
                  </button>
                </div>
                <div>
                  {watchlistItems.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                      {isConnected ? 'No items in watchlist' : 'Connect wallet'}
                    </p>
                  ) : (
                    watchlistItems.map((item, index) => (
                      <div key={index} className="watchlist-item">
                        <span className="coin-badge">{item.coinId}</span>
                        <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                          {item.isActive ? '✅ Active' : '⏸️ Inactive'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PORTFOLIO PAGE */}
        {currentPage === 'portfolio' && (
          <div className="page">
            <div className="glass-card">
              <h2 style={{ color: '#00d4ff', marginBottom: '16px' }}>📊 Portfolio Details</h2>
              <p>Full portfolio management coming soon...</p>
            </div>
          </div>
        )}

        {/* AI RESEARCH PAGE */}
        {currentPage === 'ai-research' && (
          <div className="page">
            <div className="glass-card">
              <h2 style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #9d4edd 0%, #00d4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                🤖 AI Research Analysis
              </h2>
              <p>Full AI research page coming soon...</p>
            </div>
          </div>
        )}

        {/* LUCKY WHEEL PAGE */}
        {currentPage === 'lucky-wheel' && (
          <div className="page">
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#00d4ff', marginBottom: '24px' }}>🎰 Lucky Wheel</h2>
              <div style={{ fontSize: '80px', margin: '20px 0' }}>🎯</div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                Cost: 1 Spin Token
              </p>
              <button 
                onClick={spinTheWheel}
                disabled={isLoading}
                className="modern-btn"
                style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)' }}
              >
                {isLoading ? '⏳ Spinning...' : '🎰 Spin the Wheel!'}
              </button>
            </div>
          </div>
        )}

        {/* WATCHLIST PAGE */}
        {currentPage === 'watchlist' && (
          <div className="page">
            <div className="glass-card">
              <h2 style={{ color: '#00d4ff', marginBottom: '16px' }}>👀 Watchlist Details</h2>
              <p>Full watchlist page coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

