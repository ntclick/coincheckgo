import React, { useState } from 'react';
import { useCoinCheckGoFHE } from '../hooks/useCoinCheckGoFHE';

export function CoinCheckGoFHE() {
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
    hasActiveResearch,
    createResearchProject,
    isPortfolioPublic,
    isWatchlistPublic,
    updatePrivacySettings,
    mintGmTokens,
    spinTheWheel,
    isLoading,
    isReady,
    contractAddress,
  } = useCoinCheckGoFHE();

  // Form states
  const [gmAmount, setGmAmount] = useState('100');
  const [coinId, setCoinId] = useState('bitcoin');
  const [amount, setAmount] = useState('1');
  const [price, setPrice] = useState('50000');
  const [watchCoin, setWatchCoin] = useState('ethereum');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectBudget, setProjectBudget] = useState('1000');

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔐 CoinCheckGo FHE Platform</h1>
      <p style={{ textAlign: 'center', color: '#666', marginTop: '-10px', marginBottom: '20px' }}>
        Privacy-First Crypto Research Platform - Zama FHEVM v0.8
      </p>
      
      {/* Contract Info */}
      <div style={styles.infoBox}>
        <strong>Contract:</strong> {contractAddress}
        <br />
        <strong>Status:</strong> {isReady ? '✅ Ready' : '⏳ Initializing...'}
      </div>

      {/* Wallet Connection */}
      {!isConnected ? (
        <button
          onClick={connectWallet}
          style={styles.connectButton}
          disabled={isLoading}
        >
          {isLoading ? '⏳ Connecting...' : '🔗 Connect Wallet'}
        </button>
      ) : (
        <div>
          <div style={styles.addressBox}>
            <strong>Connected:</strong> {address.substring(0, 6)}...{address.substring(38)}
            <button onClick={disconnectWallet} style={styles.disconnectButton}>
              Disconnect
            </button>
          </div>

          {/* FHE Token Balances (Encrypted Handles) */}
          <div style={styles.section}>
            <h3>🔐 FHE Encrypted Tokens (Ciphertext Handles)</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>GM Tokens</div>
                <div style={styles.statValue} title={gmTokensHandle}>
                  {gmTokensHandle === '0x0' ? 'Not initialized' : `${gmTokensHandle.substring(0, 10)}...`}
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Spin Tokens</div>
                <div style={styles.statValue} title={spinTokensHandle}>
                  {spinTokensHandle === '0x0' ? 'Not initialized' : `${spinTokensHandle.substring(0, 10)}...`}
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Research Tokens</div>
                <div style={styles.statValue} title={researchTokensHandle}>
                  {researchTokensHandle === '0x0' ? 'Not initialized' : `${researchTokensHandle.substring(0, 10)}...`}
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Check-In Streak</div>
                <div style={styles.statValue} title={streakHandle}>
                  {streakHandle === '0x0' ? 'Not initialized' : `${streakHandle.substring(0, 10)}...`}
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Check-Ins</div>
                <div style={styles.statValue} title={totalCheckInsHandle}>
                  {totalCheckInsHandle === '0x0' ? 'Not initialized' : `${totalCheckInsHandle.substring(0, 10)}...`}
                </div>
              </div>
            </div>
            <p style={styles.note}>
              ℹ️ <strong>Privacy Note:</strong> These are encrypted ciphertext handles. Only you can decrypt them with your private key using Zama's FHE SDK.
            </p>
          </div>

          {/* Daily Check-In */}
          <div style={styles.section}>
            <h3>📅 Daily Check-In (0h UTC Reset)</h3>
            <div style={styles.checkInInfo}>
              <div><strong>Current Day:</strong> {currentDay}</div>
              <div><strong>Last Check-In Day:</strong> {lastCheckInDay || 'Never'}</div>
              <div><strong>Status:</strong> {hasCheckedInToday ? '✅ Checked in today' : '⏰ Available to check in'}</div>
            </div>
            <button
              onClick={dailyCheckIn}
              style={hasCheckedInToday ? styles.buttonDisabled : styles.button}
              disabled={isLoading || hasCheckedInToday}
            >
              {isLoading ? '⏳ Processing...' : hasCheckedInToday ? '✅ Checked in today' : '📅 Daily Check-In'}
            </button>
            <p style={styles.note}>
              Rewards: <strong>10 GM + 1 Spin + 5 Research tokens</strong> (FHE encrypted)
            </p>
          </div>

          {/* Mint Tokens */}
          <div style={styles.section}>
            <h3>💰 Mint GM Tokens (FHE)</h3>
            <div style={styles.inputGroup}>
              <input
                type="number"
                value={gmAmount}
                onChange={(e) => setGmAmount(e.target.value)}
                placeholder="Amount"
                style={styles.input}
              />
              <button
                onClick={() => mintGmTokens(Number(gmAmount))}
                style={styles.button}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Minting...' : '💰 Mint GM Tokens'}
              </button>
            </div>
          </div>

          {/* Lucky Spin */}
          <div style={styles.section}>
            <h3>🎰 Lucky Wheel Spin</h3>
            <p style={styles.note}>Cost: 1 Spin Token</p>
            <button
              onClick={spinTheWheel}
              style={styles.button}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Spinning...' : '🎰 Spin The Wheel!'}
            </button>
          </div>

          {/* Portfolio Management */}
          <div style={styles.section}>
            <h3>📊 Portfolio Management (FHE Encrypted)</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Portfolio Items</div>
                <div style={styles.statValue}>{portfolioCount}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Watchlist Items</div>
                <div style={styles.statValue}>{watchlistCount}</div>
              </div>
            </div>
            <div style={styles.inputGroup}>
              <input
                type="text"
                value={coinId}
                onChange={(e) => setCoinId(e.target.value)}
                placeholder="Coin ID (e.g., bitcoin)"
                style={styles.input}
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                style={styles.input}
              />
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Purchase Price"
                style={styles.input}
              />
              <button
                onClick={() => addPortfolioEntry(coinId, Number(amount), Number(price))}
                style={styles.button}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Adding...' : '➕ Add to Portfolio'}
              </button>
            </div>
          </div>

          {/* Watchlist */}
          <div style={styles.section}>
            <h3>👀 Watchlist</h3>
            <div style={styles.inputGroup}>
              <input
                type="text"
                value={watchCoin}
                onChange={(e) => setWatchCoin(e.target.value)}
                placeholder="Coin ID (e.g., ethereum)"
                style={styles.input}
              />
              <button
                onClick={() => addToWatchlist(watchCoin)}
                style={styles.button}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Adding...' : '➕ Add to Watchlist'}
              </button>
            </div>
          </div>

          {/* Research Projects */}
          <div style={styles.section}>
            <h3>🔬 Research Projects (FHE Encrypted Budget)</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Active Research</div>
                <div style={styles.statValue}>{hasActiveResearch ? 'Yes' : 'No'}</div>
              </div>
            </div>
            {!hasActiveResearch && (
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Project Title"
                  style={styles.input}
                />
                <input
                  type="text"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Project Description"
                  style={styles.input}
                />
                <input
                  type="number"
                  value={projectBudget}
                  onChange={(e) => setProjectBudget(e.target.value)}
                  placeholder="Budget (tokens)"
                  style={styles.input}
                />
                <button
                  onClick={() => createResearchProject(projectTitle, projectDesc, Number(projectBudget))}
                  style={styles.button}
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Creating...' : '🔬 Create Research Project'}
                </button>
              </div>
            )}
          </div>

          {/* Privacy Settings */}
          <div style={styles.section}>
            <h3>🔒 Privacy Settings</h3>
            <div style={styles.privacyControls}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={isPortfolioPublic}
                  onChange={(e) => updatePrivacySettings(e.target.checked, isWatchlistPublic)}
                />
                <span style={{ marginLeft: '8px' }}>Make Portfolio Public</span>
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={isWatchlistPublic}
                  onChange={(e) => updatePrivacySettings(isPortfolioPublic, e.target.checked)}
                />
                <span style={{ marginLeft: '8px' }}>Make Watchlist Public</span>
              </label>
            </div>
          </div>

          {/* Features */}
          <div style={styles.featuresBox}>
            <h3 style={{ marginTop: 0 }}>✨ FHE Features</h3>
            <ul style={styles.featuresList}>
              <li>🔐 <strong>FHE Encryption</strong> - All tokens & balances encrypted with euint64/euint32</li>
              <li>📅 <strong>Daily Check-In</strong> - Resets at 0h UTC (not 24h from last check-in)</li>
              <li>💰 <strong>Token System</strong> - GM, Spin, Research tokens with FHE encryption</li>
              <li>📊 <strong>Private Portfolio</strong> - Encrypted amounts & purchase prices</li>
              <li>🎰 <strong>Lucky Wheel</strong> - Spin with FHE token deduction</li>
              <li>🔬 <strong>Research Projects</strong> - Encrypted budgets & data</li>
              <li>🔒 <strong>Privacy Control</strong> - Choose what data to make public</li>
              <li>🛡️ <strong>ACL Protected</strong> - Only you can decrypt your data</li>
            </ul>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Built with <a href="https://docs.zama.ai/protocol/examples" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>Zama FHEVM v0.8</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '10px',
  },
  infoBox: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    wordBreak: 'break-all',
  },
  connectButton: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  addressBox: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disconnectButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  section: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '15px',
  },
  statCard: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  checkInInfo: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  buttonDisabled: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed',
    marginTop: '10px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  privacyControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    cursor: 'pointer',
  },
  note: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px',
    fontStyle: 'italic',
  },
  featuresBox: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '30px',
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: '10px 0',
  },
};

