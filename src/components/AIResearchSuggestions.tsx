import React, { useState, useEffect } from 'react';
import { taapiService, Cryptocurrency, MarketData, TechnicalIndicator } from '../utils/taapiService';

interface AIResearchSuggestionsProps {
  selectedCrypto: Cryptocurrency | null;
  onSelectSuggestion: (suggestion: string) => void;
}

const AIResearchSuggestions: React.FC<AIResearchSuggestionsProps> = ({
  selectedCrypto,
  onSelectSuggestion
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load suggestions when crypto is selected
  useEffect(() => {
    if (selectedCrypto) {
      loadResearchSuggestions(selectedCrypto);
    } else {
      setSuggestions([]);
      setMarketData(null);
      setIndicators([]);
    }
  }, [selectedCrypto]);

  const loadResearchSuggestions = async (crypto: Cryptocurrency) => {
    setIsLoading(true);
    try {
      // Get market data
      const marketDataResult = await taapiService.getMarketData(crypto.symbol);
      setMarketData(marketDataResult);

      // Get technical indicators
      const indicatorsResult = await taapiService.getTechnicalIndicators(crypto.symbol);
      setIndicators(indicatorsResult);

      // Generate AI suggestions
      if (marketDataResult) {
        const aiSuggestions = taapiService.generateResearchSuggestions(
          crypto.symbol,
          marketDataResult,
          indicatorsResult
        );
        setSuggestions(aiSuggestions);
      } else {
        // Fallback suggestions if no market data
        setSuggestions([
          `What are the key factors affecting ${crypto.symbol} price movement?`,
          `Technical analysis: ${crypto.symbol} support and resistance levels`,
          `Market sentiment analysis for ${crypto.symbol}`,
          `${crypto.symbol} vs other cryptocurrencies - comparative analysis`,
          `Future outlook and predictions for ${crypto.symbol}`
        ]);
      }
    } catch (error) {
      console.error('Error loading research suggestions:', error);
      // Fallback suggestions
      setSuggestions([
        `What are the key factors affecting ${crypto.symbol} price movement?`,
        `Technical analysis: ${crypto.symbol} support and resistance levels`,
        `Market sentiment analysis for ${crypto.symbol}`,
        `${crypto.symbol} vs other cryptocurrencies - comparative analysis`,
        `Future outlook and predictions for ${crypto.symbol}`
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Popular research topics (when no crypto is selected)
  const popularTopics = [
    "Bitcoin price prediction and market analysis",
    "Ethereum 2.0 impact on crypto market",
    "DeFi tokens performance analysis",
    "NFT market trends and opportunities",
    "Altcoin season analysis and predictions",
    "Crypto market correlation with traditional markets",
    "Staking rewards and yield farming opportunities",
    "Layer 2 solutions comparison and analysis",
    "Central bank digital currencies impact",
    "Crypto regulation effects on market"
  ];

  if (!selectedCrypto) {
    return (
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h3 style={{
          color: 'rgb(0, 212, 255)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '20px'
        }}>
          <span>💡</span>
          Popular Research Topics
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '12px'
        }}>
          {popularTopics.map((topic, index) => (
            <button
              key={index}
              onClick={() => onSelectSuggestion(topic)}
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <span>🔍</span>
              {topic}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <h3 style={{
        color: 'rgb(0, 212, 255)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '20px'
      }}>
        <span>🤖</span>
        AI Research Suggestions for {selectedCrypto.symbol}
        {isLoading && <span style={{ fontSize: '14px' }}>🔄</span>}
      </h3>

      {/* Market Data Summary */}
      {marketData && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'rgba(0, 212, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 212, 255, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            fontSize: '12px'
          }}>
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Current Price</div>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                ${marketData.price.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>24h Change</div>
              <div style={{ 
                color: marketData.change24h >= 0 ? '#00ff88' : '#ff4757',
                fontWeight: '600',
                fontSize: '16px'
              }}>
                {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}%
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Volume 24h</div>
              <div style={{ color: 'white', fontWeight: '600' }}>
                ${(marketData.volume24h / 1e6).toFixed(1)}M
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Market Cap</div>
              <div style={{ color: 'white', fontWeight: '600' }}>
                ${(marketData.marketCap / 1e9).toFixed(1)}B
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technical Indicators */}
      {indicators.length > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'rgba(157, 78, 221, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(157, 78, 221, 0.2)'
        }}>
          <h4 style={{
            color: '#9d4edd',
            marginBottom: '12px',
            fontSize: '16px'
          }}>
            📊 Technical Indicators
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '12px'
          }}>
            {indicators.map((indicator, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '4px'
                }}>
                  {indicator.indicator}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '2px'
                }}>
                  {indicator.value.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: indicator.signal === 'bullish' ? '#00ff88' : 
                        indicator.signal === 'bearish' ? '#ff4757' : '#ffb800',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}>
                  {indicator.signal}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '12px'
      }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(suggestion)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '60px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span>🔍</span>
            {suggestion}
          </button>
        ))}
      </div>

      {/* Data Source */}
      <div style={{
        marginTop: '16px',
        padding: '8px 12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center'
      }}>
        Data powered by Taapi.io & CoinGecko APIs • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AIResearchSuggestions;
