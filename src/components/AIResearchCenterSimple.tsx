import React, { useState, useEffect } from 'react';
import useCoinCheckGoFHESimple from '../hooks/useCoinCheckGoFHE_Simple';
import CryptoSearchSuggestions from './CryptoSearchSuggestions';
import { CoinData } from '../services/coinGeckoService';
import './OriginalDesign.css';

interface AIResearchCenterSimpleProps {
  setCurrentPage: (page: string) => void;
  currentPage?: string;
}

const AIResearchCenterSimple: React.FC<AIResearchCenterSimpleProps> = ({ setCurrentPage, currentPage = 'ai-research' }) => {
  const {
    isConnected,
    address: userAddress,
    isLoading,
    connectWallet,
    performResearch,
    fundResearchPool,
    userPublicBalance
  } = useCoinCheckGoFHESimple();

  // Form states
  const [researchForm, setResearchForm] = useState({
    coinId: '',
    prompt: '',
    analysisType: 'quick'
  });

  // Crypto selection state
  const [selectedCrypto, setSelectedCrypto] = useState<CoinData | null>(null);

  // UI states
  const [analysisFilter, setAnalysisFilter] = useState('all');
  const [researchData, setResearchData] = useState<any>(null);
  const [researchError, setResearchError] = useState<string>('');
  const [researchHistory, setResearchHistory] = useState<any[]>([
    {
      id: 1,
      coinId: 'bitcoin',
      prompt: 'What is the current market sentiment for Bitcoin?',
      analysisType: 'sentiment',
      tokens: 10,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isCompleted: true
    },
    {
      id: 2,
      coinId: 'ethereum',
      prompt: 'Technical analysis of Ethereum price movement',
      analysisType: 'technical',
      tokens: 10,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isCompleted: true
    },
    {
      id: 3,
      coinId: 'solana',
      prompt: 'Comprehensive analysis of Solana ecosystem',
      analysisType: 'comprehensive',
      tokens: 10,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      isCompleted: false
    }
  ]);

  // Token costs
  const getTokenCost = () => {
    const costs: { [key: string]: number } = {
      'quick': 10,
      'technical': 10,
      'sentiment': 10,
      'prediction': 10,
      'comprehensive': 10
    };
    return costs[researchForm.analysisType] || 10;
  };

  // Handle crypto selection
  const handleCryptoSelect = (crypto: CoinData) => {
    setSelectedCrypto(crypto);
    setResearchForm(prev => ({
      ...prev,
      coinId: crypto.symbol
    }));
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setResearchForm(prev => ({
      ...prev,
      prompt: suggestion
    }));
  };

  // Handle research submit
  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Wallet connection check removed per UX: research button stays enabled and will attempt on click

    if (!researchForm.prompt.trim()) {
      alert('Please enter a research question or select a suggestion');
      return;
    }

    try {
      const researchType = researchForm.analysisType === 'quick' ? 1 : 
                          researchForm.analysisType === 'technical' ? 2 : 3;
      
      await performResearch(researchType);
      
      // Add to history
      const newResearch = {
        id: Date.now(),
        coinId: selectedCrypto?.symbol || researchForm.coinId,
        coinName: selectedCrypto?.name || researchForm.coinId,
        prompt: researchForm.prompt,
        analysisType: researchForm.analysisType,
        tokens: getTokenCost(),
        timestamp: new Date().toISOString(),
        isCompleted: true
      };
      
      setResearchHistory(prev => [newResearch, ...prev]);
      
      // Reset form
      setResearchForm({
        coinId: '',
        prompt: '',
        analysisType: 'quick'
      });
      setSelectedCrypto(null);
      
    } catch (error: any) {
      console.error('Research failed:', error);
      alert(`Research failed: ${error.message || error}`);
    }
  };

  const handleResearchComplete = (data: any) => {
    setResearchData(data);
    setResearchError('');
  };

  const handleResearchError = (error: string) => {
    setResearchError(error);
    setResearchData(null);
  };

  const handleExport = (format: 'pdf' | 'json' | 'markdown') => {
    if (!researchData) return;
    
    const dataStr = JSON.stringify(researchData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research-report-${researchData.symbol}-${Date.now()}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefine = (query: string) => {
    // TODO: Implement refinement logic
  };

  // Filter analyses
  const filteredAnalyses = researchHistory.filter(analysis => {
    if (analysisFilter === 'all') return true;
    if (analysisFilter === 'completed') return analysis.isCompleted;
    if (analysisFilter === 'processing') return !analysis.isCompleted;
    return true;
  });

  // Get analysis type name
  const getAnalysisTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      'quick': 'Quick Analysis',
      'technical': 'Technical Analysis',
      'sentiment': 'Sentiment Analysis',
      'prediction': 'Prediction Analysis',
      'comprehensive': 'Comprehensive Analysis'
    };
    return types[type] || 'Custom Analysis';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 16px 0'
        }}>
          🤖 AI Research Analysis
        </h1>
        <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
          Leverage advanced AI to analyze cryptocurrency markets with professional-grade insights
        </p>
      </div>

      {/* AI Research Status */}
      {researchData && (
        <div className="glass-card" style={{ marginTop: '20px' }}>
          <h3 style={{ color: 'rgb(0, 212, 255)', marginBottom: '15px' }}>📊 Research Results</h3>
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            borderRadius: '8px', 
            padding: '16px',
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }}>
            <pre style={{ 
              color: 'white', 
              fontSize: '12px', 
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(researchData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Error Display */}
      {researchError && (
        <div style={{
          background: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          margin: '20px 0',
          color: '#f44336'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>❌ Research Error</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>{researchError}</p>
        </div>
      )}

      {/* AI Research Suggestions */}
      <div className="glass-card" style={{ marginTop: '20px' }}>
        <h3 style={{ color: 'rgb(0, 212, 255)', marginBottom: '15px' }}>💡 Research Suggestions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            'What is the current market sentiment?',
            'Technical analysis overview',
            'Fundamental analysis',
            'Price prediction for next 30 days',
            'Risk assessment',
            'Competitor analysis'
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionSelect(suggestion)}
              style={{
                padding: '8px 12px',
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '6px',
                color: 'rgb(0, 212, 255)',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Analysis Request */}
      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h2 style={{
          color: 'rgb(0, 212, 255)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '28px'
        }}>
          <span>⚡</span>
          Quick Analysis Request
        </h2>

        <form onSubmit={handleResearchSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '8px'
              }}>
                Cryptocurrency
              </label>
              <CryptoSearchSuggestions
                onSelect={(crypto) => handleCryptoSelect(crypto as any)}
                placeholder="Search top 500 cryptocurrencies..."
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '8px'
              }}>
                Analysis Type
              </label>
              <select
                value={researchForm.analysisType}
                onChange={(e) => setResearchForm(prev => ({ ...prev, analysisType: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px'
                }}
              >
                <option value="quick">Quick Analysis (10 GM)</option>
                <option value="technical">Technical Analysis (10 GM)</option>
                <option value="sentiment">Sentiment Analysis (10 GM)</option>
                <option value="prediction">Prediction Analysis (10 GM)</option>
                <option value="comprehensive">Comprehensive Analysis (10 GM)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              Your Research Question
            </label>
            <textarea
              value={researchForm.prompt}
              onChange={(e) => setResearchForm(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="What specific insights are you looking for? Be as detailed as possible..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                resize: 'vertical'
              }}
              required
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="submit"
              disabled={isLoading || !isConnected}
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                cursor: isLoading || !isConnected ? 'not-allowed' : 'pointer',
                opacity: isLoading || !isConnected ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '0 auto'
              }}
            >
              <span>📎</span>
              Request AI Analysis ({getTokenCost()} GM Tokens)
            </button>
          </div>
        </form>
      </div>

      {/* Research History */}
      <div className="glass-card" style={{ marginBottom: '40px' }}>
        <h2 style={{
          color: 'rgb(0, 212, 255)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '28px'
        }}>
          <span>📊</span>
          Your Research History
        </h2>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {['all', 'completed', 'processing'].map(filter => (
            <button
              key={filter}
              onClick={() => setAnalysisFilter(filter)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: analysisFilter === filter 
                  ? 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Research List */}
        <div style={{ paddingBottom: '20px' }}>
          {filteredAnalyses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                No Research Yet
              </div>
              <div style={{ fontSize: '14px' }}>
                Start by requesting your first AI analysis above.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredAnalyses.map(analysis => (
                <div
                  key={analysis.id}
                  style={{
                    padding: '20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <h3 style={{
                        color: '#00d4ff',
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 4px 0'
                      }}>
                        {getAnalysisTypeName(analysis.analysisType)}
                      </h3>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '14px',
                        margin: '0 0 8px 0'
                      }}>
                        {analysis.coinName || analysis.coinId}
                      </p>
                    </div>
                    <div style={{
                      background: analysis.isCompleted ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 184, 0, 0.2)',
                      color: analysis.isCompleted ? '#00ff88' : '#ffb800',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {analysis.isCompleted ? 'Completed' : 'Processing'}
                    </div>
                  </div>
                  
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    margin: '0 0 12px 0'
                  }}>
                    {analysis.prompt}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    <span>Cost: {analysis.tokens} GM Tokens</span>
                    <span>{new Date(analysis.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResearchCenterSimple;
