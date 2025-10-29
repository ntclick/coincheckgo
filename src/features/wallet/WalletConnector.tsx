import React from 'react';
import { useWallet } from './useWallet';

export function WalletConnector() {
  const { address, isConnected, isConnecting, error, connectWallet, disconnectWallet, clearError } = useWallet();

  if (isConnected) {
    return (
      <div className="wallet-status">
        <div className="status-dot"></div>
        <span>{address.substring(0, 6)}...{address.substring(38)}</span>
        <button
          onClick={disconnectWallet}
          style={{
            marginLeft: '10px',
            background: 'rgba(255,71,87,0.1)',
            border: '1px solid rgba(255,71,87,0.3)',
            borderRadius: '6px',
            padding: '4px 8px',
            color: '#ff4757',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-section">
      {error && (
        <div style={{
          background: 'rgba(255,71,87,0.1)',
          border: '1px solid rgba(255,71,87,0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '10px',
          color: '#ff4757',
          fontSize: '14px'
        }}>
          {error}
          <button
            onClick={clearError}
            style={{
              marginLeft: '10px',
              background: 'none',
              border: 'none',
              color: '#ff4757',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      )}

      <button
        className="connect-wallet-btn"
        onClick={connectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}
