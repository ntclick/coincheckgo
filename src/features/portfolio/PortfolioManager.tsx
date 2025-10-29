import React, { useState, useEffect } from 'react';
import { usePortfolio } from './usePortfolio';
import { formatFHEHandle, isFHEEncrypted } from '../../utils/fhevm';

interface PortfolioManagerProps {
  userAddress: string;
  isConnected: boolean;
}

export function PortfolioManager({ userAddress, isConnected }: PortfolioManagerProps) {
  const {
    portfolios,
    portfolioCount,
    items,
    itemsCount,
    isLoading,
    isPortfolioPublic,
    isWatchlistPublic,
    createPortfolio,
    deletePortfolio,
    addEntry,
    removeEntry,
    updatePrivacySettings,
    calculatePnL
  } = usePortfolio(userAddress, isConnected);

  const [formData, setFormData] = useState({
    portfolioId: 0,
    coinId: 'bitcoin',
    amount: '1',
    price: '50000'
  });

  const [portfolioFormData, setPortfolioFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  });


  const [pnlData, setPnlData] = useState<{[key: number]: any}>({});

  // Auto-load P&L data for all items when items change
  useEffect(() => {
    if (items.length > 0) {
      const loadPnLData = async () => {
        for (let index = 0; index < items.length; index++) {
          if (!pnlData[index]) {
            await loadPnLForItem(items[index], index);
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      };
      loadPnLData();
    }
  }, [items.length]); // Only trigger when item count changes

  const handleCreatePortfolio = async () => {
    if (!portfolioFormData.name.trim()) {
      // eslint-disable-next-line no-alert
      alert('Please enter portfolio name');
      return;
    }

    await createPortfolio(portfolioFormData.name, portfolioFormData.description, portfolioFormData.isPublic);
    setPortfolioFormData({ name: '', description: '', isPublic: false });
  };

  const handleAddEntry = async () => {
    if (!formData.coinId || !formData.amount || !formData.price) {
      // eslint-disable-next-line no-alert
      alert('Please fill all fields');
      return;
    }

    if (portfolios.length === 0) {
      // eslint-disable-next-line no-alert
      alert('Please create a portfolio first');
      return;
    }

    await addEntry(formData.portfolioId, formData.coinId, Number(formData.amount), Number(formData.price));
    setFormData({ portfolioId: 0, coinId: 'bitcoin', amount: '1', price: '50000' });
  };

  const handleRemoveEntry = async (index: number) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to remove this portfolio entry?')) {
      await removeEntry(index);
    }
  };

  const handleDeletePortfolio = async (portfolioId: number) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to delete this portfolio and all its items?')) {
      await deletePortfolio(portfolioId);
    }
  };


  const handlePrivacyToggle = async (isPortfolioPublic: boolean) => {
    await updatePrivacySettings(isPortfolioPublic, isWatchlistPublic);
  };

  const loadPnLForItem = async (item: any, index: number) => {
    if (pnlData[index]) return; // Already loaded

    const pnl = await calculatePnL(item.coinId, parseFloat(item.purchasePrice), parseFloat(item.amount));
    if (pnl) {
      setPnlData(prev => ({ ...prev, [index]: pnl }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(157,78,221,0.1) 100%)',
        border: '1px solid rgba(0,212,255,0.3)'
      }}>
        <h2 style={{ 
          color: '#00d4ff',
          background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: '800'
        }}>
          📊 Portfolio Management
        </h2>
      </div>

      {/* Create Portfolio Section */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(157,78,221,0.1) 0%, rgba(255,184,0,0.05) 100%)',
        border: '1px solid rgba(157,78,221,0.3)',
        position: 'relative'
      }}>
        <h3 style={{ 
          color: '#9d4edd',
          marginBottom: '20px',
          fontSize: '18px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📁 Create New Portfolio
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: '600' }}>
              Portfolio Name
            </label>
            <input
              type="text"
              value={portfolioFormData.name}
              onChange={(e) => setPortfolioFormData({...portfolioFormData, name: e.target.value})}
              placeholder="Main Portfolio, DeFi Holdings..."
              className="form-input"
              style={{ fontSize: '14px', padding: '12px', borderRadius: '8px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: '600' }}>
              Description
            </label>
            <input
              type="text"
              value={portfolioFormData.description}
              onChange={(e) => setPortfolioFormData({...portfolioFormData, description: e.target.value})}
              placeholder="Portfolio description..."
              className="form-input"
              style={{ fontSize: '14px', padding: '12px', borderRadius: '8px' }}
            />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={portfolioFormData.isPublic}
                onChange={(e) => setPortfolioFormData({...portfolioFormData, isPublic: e.target.checked})}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Public</span>
            </label>
          </div>
          <button
            onClick={handleCreatePortfolio}
            disabled={isLoading || !isConnected || !portfolioFormData.name.trim()}
            className="modern-btn"
            style={{ 
              padding: '12px 20px', 
              fontSize: '14px',
              fontWeight: '700',
              background: !isConnected || !portfolioFormData.name.trim() ? '#666' : 'linear-gradient(135deg, #9d4edd 0%, #ffb800 100%)',
              borderRadius: '8px'
            }}
          >
            {isLoading ? '⏳ Creating...' : !isConnected ? '🔒 Connect' : '🚀 Create'}
          </button>
        </div>
      </div>

      {/* Add Coin Section - Only show if portfolios exist */}
      {portfolios.length > 0 && (
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(255,184,0,0.1) 0%, rgba(0,212,255,0.05) 100%)',
          border: '1px solid rgba(255,184,0,0.3)',
          position: 'relative'
        }}>
          <h3 style={{ 
            color: '#ffb800',
            marginBottom: '20px',
            fontSize: '18px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ➕ Add Coin to Portfolio
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: '600' }}>
                Portfolio
              </label>
              <select
                value={formData.portfolioId}
                onChange={(e) => setFormData({...formData, portfolioId: Number(e.target.value)})}
                className="form-input"
                style={{ fontSize: '14px', padding: '12px', borderRadius: '8px' }}
              >
                {portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: '600' }}>
                Coin ID
              </label>
              <input
                type="text"
                value={formData.coinId}
                onChange={(e) => setFormData({...formData, coinId: e.target.value})}
                placeholder="bitcoin, ethereum, solana..."
                className="form-input"
                style={{ fontSize: '14px', padding: '12px', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: '600' }}>
                Amount (FHE Encrypted)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="1"
                className="form-input"
                style={{ fontSize: '14px', padding: '12px', borderRadius: '8px' }}
              />
              <div style={{ fontSize: '9px', color: '#9d4edd', marginTop: '2px' }}>
                🔐 Will be FHE encrypted
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: '600' }}>
                Price ($) (FHE Encrypted)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="50000"
                className="form-input"
                style={{ fontSize: '14px', padding: '12px', borderRadius: '8px' }}
              />
              <div style={{ fontSize: '9px', color: '#9d4edd', marginTop: '2px' }}>
                🔐 Will be FHE encrypted
              </div>
            </div>
            <button
              onClick={handleAddEntry}
              disabled={isLoading || !isConnected}
              className="modern-btn"
              style={{ 
                padding: '12px 20px', 
                fontSize: '14px',
                fontWeight: '700',
                background: !isConnected ? '#666' : 'linear-gradient(135deg, #ffb800 0%, #00d4ff 100%)',
                borderRadius: '8px'
              }}
            >
              {isLoading ? '⏳ Adding...' : !isConnected ? '🔒 Connect' : '➕ Add Coin'}
            </button>
          </div>
        </div>
      )}

      {/* No Portfolio Message */}
      {portfolios.length === 0 && (
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(255,71,87,0.1) 0%, rgba(255,107,107,0.05) 100%)',
          border: '1px solid rgba(255,71,87,0.3)',
          textAlign: 'center',
          padding: '40px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
          <h3 style={{ color: '#ff4757', marginBottom: '12px', fontSize: '18px', fontWeight: '700' }}>
            No Portfolios Yet
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '20px' }}>
            Create your first portfolio above to start managing your crypto holdings
          </p>
          <div style={{ 
            background: 'rgba(255,71,87,0.1)', 
            padding: '12px', 
            borderRadius: '8px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)'
          }}>
            💡 Each portfolio can contain multiple coins with FHE encrypted data
          </div>
        </div>
      )}

      {/* Your Portfolios */}
      {portfolios.length > 0 && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ 
              color: '#00d4ff',
              fontSize: '18px',
              fontWeight: '700'
            }}>
              📂 Your Portfolios ({portfolioCount})
            </h3>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              {itemsCount} total items
            </div>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {portfolios.map((portfolio) => (
              <div key={portfolio.id} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: '#ffffff',
                      marginBottom: '4px'
                    }}>
                      {portfolio.name}
                    </h4>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: '8px'
                    }}>
                      {portfolio.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '10px',
                        background: portfolio.isPublic ? 'rgba(0,255,136,0.1)' : 'rgba(255,71,87,0.1)',
                        color: portfolio.isPublic ? '#00ff88' : '#ff4757',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        border: `1px solid ${portfolio.isPublic ? '#00ff88' : '#ff4757'}`,
                        fontWeight: '600'
                      }}>
                        {portfolio.isPublic ? '🌐 Public' : '🔒 Private'}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        background: 'rgba(0,212,255,0.1)',
                        color: '#00d4ff',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        border: '1px solid rgba(0,212,255,0.3)',
                        fontWeight: '600'
                      }}>
                        ID: {portfolio.id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePortfolio(portfolio.id)}
                    disabled={isLoading || !isConnected}
                    style={{
                      background: 'rgba(255,71,87,0.1)',
                      border: '1px solid rgba(255,71,87,0.3)',
                      color: '#ff4757',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
                
                {/* Portfolio Items */}
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: '600' }}>
                    Portfolio Items (FHE Encrypted):
                  </div>
                  {items.filter(item => item.portfolioId === portfolio.id).length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {items.filter(item => item.portfolioId === portfolio.id).map((item, index) => (
                        <div key={index} style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                              {item.coinId}
                            </span>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                              Amount: {formatFHEHandle(item.amount)}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                              Price: {formatFHEHandle(item.purchasePrice)}
                            </div>
                            <div style={{ fontSize: '9px', color: '#9d4edd', marginTop: '2px' }}>
                              🔐 FHE Encrypted Data
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveEntry(index)}
                            style={{
                              background: 'rgba(255,71,87,0.1)',
                              border: '1px solid rgba(255,71,87,0.3)',
                              color: '#ff4757',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '16px',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '12px'
                    }}>
                      No items in this portfolio yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
