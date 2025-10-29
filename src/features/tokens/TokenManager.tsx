import React, { useState } from 'react';
import { useTokens } from './useTokens';

interface TokenManagerProps {
  userAddress: string;
  isConnected: boolean;
}

export function TokenManager({ userAddress, isConnected }: TokenManagerProps) {
  const {
    gmTokensHandle,
    spinTokensHandle,
    researchTokensHandle,
    isLoading,
    mintGmTokens,
    mintSpinTokens,
    mintResearchTokens
  } = useTokens(userAddress, isConnected);

  const [mintAmounts, setMintAmounts] = useState({
    gm: 100,
    spin: 10,
    research: 50
  });

  const handleMintGm = async () => {
    await mintGmTokens(mintAmounts.gm);
  };

  const handleMintSpin = async () => {
    await mintSpinTokens(mintAmounts.spin);
  };

  const handleMintResearch = async () => {
    await mintResearchTokens(mintAmounts.research);
  };

  return (
    <div className="glass-card">
      <h2 style={{ color: '#00d4ff', marginBottom: '20px' }}>💰 Token Management</h2>

      {/* Token Balances */}
      <div style={{
        display: 'grid',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🪙</span>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>GM Tokens</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)'
              }}>
                {isConnected && gmTokensHandle ? `🔐 ${gmTokensHandle.substring(0, 16)}...` : 'Connect wallet to view'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="number"
              value={mintAmounts.gm}
              onChange={(e) => setMintAmounts({...mintAmounts, gm: Number(e.target.value)})}
              style={{
                width: '80px',
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px'
              }}
              min="1"
            />
            <button
              onClick={handleMintGm}
              disabled={isLoading || !isConnected}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                border: 'none',
                borderRadius: '4px',
                color: '#000',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Mint
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🎰</span>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>Spin Tokens</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)'
              }}>
                {isConnected && spinTokensHandle ? `🔐 ${spinTokensHandle.substring(0, 16)}...` : 'Connect wallet to view'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="number"
              value={mintAmounts.spin}
              onChange={(e) => setMintAmounts({...mintAmounts, spin: Number(e.target.value)})}
              style={{
                width: '80px',
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px'
              }}
              min="1"
            />
            <button
              onClick={handleMintSpin}
              disabled={isLoading || !isConnected}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Mint
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🔬</span>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>Research Tokens</div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)'
              }}>
                {isConnected && researchTokensHandle ? `🔐 ${researchTokensHandle.substring(0, 16)}...` : 'Connect wallet to view'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="number"
              value={mintAmounts.research}
              onChange={(e) => setMintAmounts({...mintAmounts, research: Number(e.target.value)})}
              style={{
                width: '80px',
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px'
              }}
              min="1"
            />
            <button
              onClick={handleMintResearch}
              disabled={isLoading || !isConnected}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #9d4edd, #00d4ff)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Mint
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{
        fontSize: '12px',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        All token balances are FHE encrypted on-chain.
        Only you can decrypt your tokens with your private key.
      </div>
    </div>
  );
}
