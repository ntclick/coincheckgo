import React from 'react';
import { useUnlimitedCheckIn } from '../hooks/useUnlimitedCheckIn';

export function UnlimitedCheckIn() {
  const {
    address,
    isConnected,
    connectWallet,
    disconnectWallet,
    myCount,
    totalCheckIns,
    isReady,
    blocksRemaining,
    hasCheckedInToday,
    checkIn,
    isLoading,
    contractAddress,
  } = useUnlimitedCheckIn();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔐 FHE Unlimited Check-In</h1>
      <p style={{ textAlign: 'center', color: '#666', marginTop: '-10px', marginBottom: '20px' }}>
        Zama FHEVM v0.8 - Privacy-Preserving Smart Contract (NO REORG WAIT!)
      </p>
      
      {/* Contract Info */}
      <div style={styles.infoBox}>
        <strong>Contract:</strong> {contractAddress}
        <br />
        <strong>Network:</strong> Sepolia Testnet
        <br />
        <strong>Etherscan:</strong>{' '}
        <a
          href={`https://sepolia.etherscan.io/address/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          View Contract
        </a>
      </div>

      {/* Wallet Connection */}
      {!isConnected ? (
        <div style={styles.connectSection}>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>
            Connect your wallet to start checking in!
          </p>
          <button onClick={connectWallet} style={styles.connectButton}>
            🔌 Connect MetaMask
          </button>
        </div>
      ) : (
        <div style={styles.walletInfo}>
          <p>
            <strong>Connected:</strong> {address.slice(0, 6)}...{address.slice(-4)}
          </p>
          <button onClick={disconnectWallet} style={styles.disconnectButton}>
            Disconnect
          </button>
        </div>
      )}

      {/* Initialization Warning */}
      {isConnected && !isReady && (
        <div style={styles.warningBox}>
          <strong>⏳ Contract Initializing...</strong>
          <p>
            {blocksRemaining} blocks remaining (~{Math.ceil(blocksRemaining * 12 / 60)} minutes)
          </p>
          <small>Contract needs 95 blocks for reorg protection before it's ready to use.</small>
        </div>
      )}

      {/* Stats */}
      {isConnected && (
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Your Check-ins</h3>
            <div style={styles.statValue}>{myCount}</div>
            <small style={styles.statDesc}>No limits!</small>
          </div>
          
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Total Check-ins</h3>
            <div style={{...styles.statValue, color: '#FF6B6B'}}>{totalCheckIns}</div>
            <small style={styles.statDesc}>All users</small>
          </div>

          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Status</h3>
            <div style={{...styles.statValue, fontSize: '1.5rem'}}>
              {isReady ? '✅ Ready' : '⏳ Init'}
            </div>
            <small style={styles.statDesc}>
              {isReady ? 'Ready to use' : `${blocksRemaining} blocks`}
            </small>
          </div>
        </div>
      )}

      {/* Check-in Button */}
      {isConnected && (
        <button
          onClick={checkIn}
          disabled={isLoading}
          style={{
            ...styles.checkInButton,
            opacity: isLoading ? 0.5 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? '⏳ Checking in...' : '✅ Check In (Unlimited!)'}
        </button>
      )}

      {/* Features */}
      <div style={styles.featuresBox}>
        <h3 style={{ marginTop: 0 }}>✨ Features</h3>
        <ul style={styles.featuresList}>
          <li>🔐 <strong>FHE Encryption</strong> - Counter encrypted with euint64</li>
          <li>✅ <strong>Unlimited Check-ins</strong> - No 24h limit!</li>
          <li>🚀 <strong>Works Immediately</strong> - No reorg wait!</li>
          <li>🔒 <strong>Privacy-Preserving</strong> - Homomorphic operations</li>
          <li>🛡️ <strong>ACL Protected</strong> - Only you can access your data</li>
          <li>📊 <strong>Event Tracking</strong> - All check-ins logged</li>
        </ul>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Built with <a href="https://docs.zama.ai/protocol/solidity-guides/v0.8" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3' }}>Zama FHEVM v0.8</a>
        </p>
      </div>
    </div>
  );
}

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    textAlign: 'center',
    fontSize: '2.5rem',
    marginBottom: '20px',
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  connectSection: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  connectButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  walletInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '2px solid #ffc107',
  },
  successBox: {
    backgroundColor: '#d4edda',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '2px solid #28a745',
    color: '#155724',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#666',
  },
  statValue: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#2196F3',
    margin: '10px 0',
  },
  statDesc: {
    color: '#999',
    fontSize: '12px',
  },
  checkInButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '20px',
    borderRadius: '8px',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  testButton: {
    width: '100%',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  featuresBox: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    lineHeight: '2',
  },
  link: {
    color: '#2196F3',
    textDecoration: 'none',
  },
};
