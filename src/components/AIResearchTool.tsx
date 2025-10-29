import React, { useState, useEffect } from 'react';
import useCoinCheckGoFHESimple from '../hooks/useCoinCheckGoFHE_Simple';
import { cryptoApiService, CryptoData } from '../services/cryptoApiService';
import { taapiService, TechnicalAnalysis } from '../services/taapiService';
import { cryptoCompareService, CcSocialSentiment as SocialSentiment } from '../services/cryptoCompareService';
import { aiReportService, AIReport } from '../services/aiReportService';
import TechnicalChart from './TechnicalChart';
import CryptoSearchSimple from './CryptoSearchSimple';
import TradingViewChart from './TradingViewChart';
import './OriginalDesign.css';

interface AIResearchToolProps {
  setCurrentPage: (page: string) => void;
  currentPage?: string;
}

interface ResearchData {
  coin: string;
  score: number;
  recommendation: string;
  entry_zone: string;
  stoploss: string;
  tp1: string;
  tp2: string;
  technical: {
    rsi: number;
    ema_trend: string;
    funding_rate: number;
  };
  fundamental: {
    tvl: string;
    tvl_change_7d: string;
    unlock_next: string;
  };
  sentiment: {
    fear_greed: number;
    social_trend: string;
  };
}

const AIResearchTool: React.FC<AIResearchToolProps> = ({ setCurrentPage, currentPage = 'ai-research' }) => {
  const {
    isConnected,
    address: userAddress,
    isLoading,
    connectWallet,
    performResearch,
    fundResearchPool,
    userPublicBalance
  } = useCoinCheckGoFHESimple();

  // Debug: Check if hook is working
  // Debug logs removed for cleaner console

  // Get wallet connection status from global state
  const isWalletConnected = () => {
    const globalConnected = (window as any).globalHookState?.isConnected;
    const globalAddress = (window as any).globalHookState?.address;
    return globalConnected && globalAddress;
  };

  // Form states
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [coinSymbol, setCoinSymbol] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState('');
  const [researchData, setResearchData] = useState<AIReport | null>(null);
  const [researchError, setResearchError] = useState<string>('');
  
  // API data states
  const [topCryptos, setTopCryptos] = useState<CryptoData[]>([]);
  const [technicalData, setTechnicalData] = useState<TechnicalAnalysis | null>(null);
  const [sentimentData, setSentimentData] = useState<SocialSentiment | null>(null);
  const [isLoadingCryptos, setIsLoadingCryptos] = useState(false);

  // Load top 300 cryptocurrencies on component mount
  useEffect(() => {
    const loadTopCryptos = async () => {
      setIsLoadingCryptos(true);
      try {
        // 1) Load local JSON first for instant suggestions
        try {
          const localData = await import('../data/top_coins.json');
          const coins = (localData.coins || localData.default?.coins || []) as CryptoData[];
          if (Array.isArray(coins) && coins.length > 0) {
            setTopCryptos(prev => (prev && prev.length > 0 ? prev : (coins as any)));
            console.log(`✅ Loaded ${coins.length} cryptocurrencies from local JSON`);
          }
        } catch {}

        // 2) Fetch from API and merge/dedupe when available
        const cryptos = await cryptoApiService.getTopCryptocurrencies();
        setTopCryptos(prev => {
          const byId = new Map<string, CryptoData>();
          for (const c of (prev || [])) if ((c as any)?.id) byId.set((c as any).id, c);
          for (const c of cryptos) if ((c as any)?.id) byId.set((c as any).id, c);
          return Array.from(byId.values()).slice(0, 300);
        });
        console.log(`✅ Loaded ${cryptos.length} cryptocurrencies from CoinGecko`);
        console.log('📊 Top 10 cryptos:', cryptos.slice(0, 10).map(c => `${c.symbol.toUpperCase()} - ${c.name}`));
      } catch (error) {
        console.error('Error loading cryptocurrencies:', error);
        try {
          const localData = await import('../data/top_coins.json');
          const coins = (localData.coins || localData.default?.coins || []) as CryptoData[];
          if (coins.length > 0) {
            setTopCryptos(coins as any);
            console.log(`✅ Loaded ${coins.length} cryptocurrencies from local JSON`);
          } else {
            setResearchError('Failed to load cryptocurrency data');
          }
        } catch (e) {
          setResearchError('Failed to load cryptocurrency data');
        }
      } finally {
        setIsLoadingCryptos(false);
      }
    };

    loadTopCryptos();
  }, []);

  // Token costs
  const getTokenCost = () => {
    return 10; // 10 GM tokens for research
  };

  // Check if user has enough GM tokens
  const hasEnoughTokens = () => {
    // Use global state directly since hook state is not syncing
    const globalBalance = (window as any).globalHookState?.userPublicBalance;
    const windowBalance = (window as any).userPublicBalance;
    const balance = globalBalance || windowBalance || userPublicBalance;
    
    if (!balance) {
      console.log('🔍 hasEnoughTokens: No balance available');
      return false;
    }
    
    const requiredTokens = getTokenCost();
    const currentBalance = typeof balance === 'string' 
      ? parseFloat(balance) 
      : balance;
    const hasEnough = currentBalance >= requiredTokens;
    
    // Debug log removed
    
    return hasEnough;
  };

  // Get current balance for display - use global state directly
  const getCurrentBalance = () => {
    const globalBalance = (window as any).globalHookState?.userPublicBalance;
    const windowBalance = (window as any).userPublicBalance;
    return globalBalance || windowBalance || userPublicBalance || 0;
  };

  // Handle crypto selection
  const handleCryptoSelect = (crypto: CryptoData) => {
    setSelectedCrypto(crypto);
    setCoinSymbol(crypto.symbol);
    console.log('🔍 Crypto selected:', crypto.symbol);
  };

  // Use global state for wallet connection check
  const buttonDisabled = !isWalletConnected() || isResearching || !coinSymbol;

  // AI Research function - REAL ON-CHAIN TRANSACTION
  const handleResearch = async () => {
    // Check if coin is selected
    if (!coinSymbol) {
      alert('Please select a coin first');
      return;
    }

    // Wallet is connected (from logs), proceed with transaction
    console.log('🚀 Starting research - Wallet connected, proceeding with transaction');

    setIsResearching(true);
    setResearchError('');
    setResearchData(null);
    setResearchProgress('Connecting to blockchain...');

    try {
      // Step 1: Call on-chain research function
      setResearchProgress('Sending transaction to blockchain...');
      
      if (performResearch) {
        const researchTopic = `AI Research - ${coinSymbol.toUpperCase()} - ${new Date().toISOString()}`;
        console.log('🔮 Starting AI Research:', researchTopic);
        
        // Call performResearch with number parameter (1 = quick analysis)
        const tx = await performResearch(1);
        console.log('📤 Research transaction sent:', tx?.hash);
        
        setResearchProgress('Waiting for transaction confirmation...');
        const receipt = await tx?.wait();
        console.log('✅ Research transaction confirmed:', receipt?.transactionHash);
        
        // Step 2: Only run research logic AFTER on-chain success
        setResearchProgress('Transaction confirmed! Fetching real-time data...');
        
        // Fetch real API data
        setResearchProgress('Fetching market data from CoinGecko...');
        const marketData = await cryptoApiService.getCryptoDetails(selectedCrypto!.id);
        
        // Set the real market data to selectedCrypto for display
        setSelectedCrypto(marketData);
        
        setResearchProgress('Analyzing technical indicators with Taapi.io...');
        const technical = await taapiService.getTechnicalAnalysis(coinSymbol.toLowerCase());
        setTechnicalData(technical);
        
        setResearchProgress('Processing social sentiment with CryptoCompare...');
        const sentiment = await cryptoCompareService.getSocialSentiment(coinSymbol.toLowerCase());
        setSentimentData(sentiment);
        
        setResearchProgress('Generating AI report with OpenAI...');
        console.log('🔍 Generating AI report with data:', {
          coinSymbol,
          marketData: marketData ? 'Available' : 'Missing',
          technical: technical ? 'Available' : 'Missing',
          sentiment: sentiment ? 'Available' : 'Missing'
        });
        const aiReport = await aiReportService.generateReport(
          coinSymbol,
          marketData,
          technical,
          sentiment
        );
        console.log('✅ AI report generated successfully:', aiReport);
        
        setResearchData(aiReport);
        setResearchProgress('✅ Research completed! 10 GM tokens deducted from wallet.');
        
        // Refresh balance after successful research
        // Note: Balance will be refreshed automatically by the hook
        console.log('🔄 Balance will be refreshed automatically by the hook');
        
      } else {
        throw new Error('Research function not available');
      }
    } catch (error: any) {
      console.error('Research failed:', error);
      setResearchError(`Research failed: ${error.message || error}`);
    } finally {
      setIsResearching(false);
      setResearchProgress('');
    }
  };

  const handleExport = (format: 'pdf' | 'json' | 'markdown') => {
    if (!researchData) return;
    
    const dataStr = JSON.stringify(researchData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research-report-${coinSymbol}-${Date.now()}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#00ff88';
    if (score >= 40) return '#ffb800';
    return '#ff4444';
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes('Buy')) return '#00ff88';
    if (recommendation.includes('Hold')) return '#ffb800';
    return '#ff4444';
  };

  // Helper to map symbol to TradingView format
  const getTVSymbol = (symbol?: string) => {
    if (!symbol) return 'BINANCE:BTCUSDT';
    const s = symbol.toUpperCase();
    // Default to USDT pair on Binance
    return `BINANCE:${s}USDT`;
  };

  return (
    <>
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 8px 0'
        }}>
          🔮 AI Crypto Research Tool
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
          Professional-grade cryptocurrency analysis with AI-powered insights
        </p>
      </div>

      {/* Main Input Bar */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '20px', height: '300px' }}>
        <h2 style={{
          color: 'rgb(0, 212, 255)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
                fontSize: '18px'
        }}>
          <span>🪙</span>
          Research Cryptocurrency
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr auto',
          gap: '20px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '6px'
            }}>
              Enter coin symbol (BTC, SOL, TIA...)
            </label>
            <CryptoSearchSimple
              onSelect={handleCryptoSelect}
              placeholder="Search top 300 cryptocurrencies..."
              cryptos={topCryptos}
              isLoading={isLoadingCryptos}
            />
          </div>
          <button
            onClick={() => {
              console.log('🔍 Button clicked!', {
                isResearching,
                isConnected: isWalletConnected(),
                coinSymbol,
                hasEnoughTokens: hasEnoughTokens(),
                userPublicBalance
              });
              handleResearch();
            }}
            disabled={buttonDisabled}
            style={{
              background: buttonDisabled
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: buttonDisabled ? 'not-allowed' : 'pointer',
              opacity: buttonDisabled ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
{isResearching ? '⏳ Processing...' : 
 isWalletConnected() ? `🔮 Research (${getTokenCost()} GM)` : '🔒 Connect Wallet'}
          </button>
        </div>
        
        {/* Simple Status */}
        {isWalletConnected() && (
          <div style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(0, 255, 0, 0.1)',
            borderRadius: '4px',
            fontSize: '10px',
            color: 'rgba(0, 255, 0, 0.8)',
            border: '1px solid rgba(0, 255, 0, 0.3)',
            textAlign: 'center'
          }}>
            ✅ Wallet Connected
          </div>
        )}

        {/* Token Balance Info */}
        {isWalletConnected() && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '6px',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            fontSize: '12px',
            color: hasEnoughTokens() ? 'rgba(0, 255, 136, 0.8)' : 'rgba(255, 184, 0, 0.8)'
          }}>
            {hasEnoughTokens() ? (
              `✅ You have ${getCurrentBalance()} GM tokens (${getTokenCost()} GM required)`
            ) : (
              `⚠️ You need ${getTokenCost()} GM tokens (Current: ${getCurrentBalance()} GM)`
            )}
          </div>
        )}
      </div>

      {/* Loading Screen */}
      {isResearching && (
        <div className="glass-card" style={{ marginBottom: '24px', padding: '20px' }}>
          {String(process.env.REACT_APP_ALLOW_MOCK ?? 'true').toLowerCase() !== 'false' ? (
            <div style={{
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 184, 0, 0.1)',
              border: '1px solid rgba(255, 184, 0, 0.3)',
              color: 'rgba(255, 184, 0, 0.9)',
              fontSize: '12px'
            }}>
              ⚠️ Mock fallback enabled. Set REACT_APP_ALLOW_MOCK=false and configure API keys to force live data.
            </div>
          ) : null}
          <h3 style={{ color: 'rgb(0, 212, 255)', marginBottom: '12px', fontSize: '16px' }}>
            🔄 Analyzing {coinSymbol.toUpperCase()}...
          </h3>
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(0, 212, 255, 0.3)',
                borderTop: '2px solid #00d4ff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ color: 'white', fontSize: '14px' }}>
                {researchProgress}
              </span>
            </div>
            <div style={{
              background: 'rgba(0, 212, 255, 0.1)',
              borderRadius: '4px',
              height: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #00d4ff, #9d4edd)',
                height: '100%',
                width: '60%',
                animation: 'progress 2s ease-in-out infinite'
              }} />
            </div>
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

      {/* Dashboard Layout */}
      {researchData && (
        <div>
          {/* Market Overview */}
          <div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>📊</div>
              <h3 style={{ color: 'rgb(0, 212, 255)', margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                Market Overview - {selectedCrypto?.name || coinSymbol.toUpperCase()}
              </h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Price Card */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05))', 
                borderRadius: '12px', 
                padding: '20px', 
                border: '1px solid rgba(0, 212, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(0, 212, 255, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Current Price
                </div>
                <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {selectedCrypto?.current_price ? `$${selectedCrypto.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'N/A'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                  USD
                </div>
              </div>

              {/* 24h Change Card */}
              <div style={{ 
                background: (selectedCrypto?.price_change_percentage_24h || 0) >= 0 
                  ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))' 
                  : 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))', 
                borderRadius: '12px', 
                padding: '20px', 
                border: `1px solid ${(selectedCrypto?.price_change_percentage_24h || 0) >= 0 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: (selectedCrypto?.price_change_percentage_24h || 0) >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  24h Change
                </div>
                <div style={{ 
                  color: (selectedCrypto?.price_change_percentage_24h || 0) >= 0 ? '#00ff88' : '#ff4444', 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {(selectedCrypto?.price_change_percentage_24h || 0) >= 0 ? '↗️' : '↘️'}
                  {selectedCrypto?.price_change_percentage_24h !== undefined ? `${selectedCrypto.price_change_percentage_24h.toFixed(2)}%` : 'N/A'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                  Last 24 hours
                </div>
              </div>

              {/* Volume Card */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1), rgba(157, 78, 221, 0.05))', 
                borderRadius: '12px', 
                padding: '20px', 
                border: '1px solid rgba(157, 78, 221, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(157, 78, 221, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Trading Volume
                </div>
                <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {selectedCrypto?.total_volume ? 
                    (selectedCrypto.total_volume >= 1e9 ? 
                      `$${(selectedCrypto.total_volume / 1e9).toFixed(1)}B` : 
                      `$${(selectedCrypto.total_volume / 1e6).toFixed(0)}M`) : 
                    'N/A'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                  24h volume
                </div>
              </div>

              {/* Market Cap Card */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 184, 0, 0.05))', 
                borderRadius: '12px', 
                padding: '20px', 
                border: '1px solid rgba(255, 184, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(255, 184, 0, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Market Cap
                </div>
                <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {selectedCrypto?.market_cap ? `$${(selectedCrypto.market_cap / 1e9).toFixed(1)}B` : 'N/A'}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                  Rank #{selectedCrypto?.market_cap_rank || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Live Price Chart */}
          <div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '24px', marginRight: '12px' }}>📈</div>
                <h3 style={{ color: 'rgb(0, 212, 255)', margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                  Live Price Chart
                </h3>
              </div>
              <div style={{ 
                background: 'rgba(0, 212, 255, 0.1)', 
                padding: '8px 16px', 
                borderRadius: '20px', 
                border: '1px solid rgba(0, 212, 255, 0.3)',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                {getTVSymbol(selectedCrypto?.symbol)}
              </div>
            </div>
            
            <div style={{ 
              width: '100%', 
              height: '500px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <TradingViewChart 
                symbol={getTVSymbol(selectedCrypto?.symbol)} 
                height={500} 
                theme={'dark'}
              />
              
              {/* Chart Info Overlay */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                Real-time data from TradingView
              </div>
            </div>
            
            <div style={{ 
              marginTop: '16px', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '12px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', background: '#00ff88', borderRadius: '50%' }}></div>
                <span>Live Price</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', background: '#00d4ff', borderRadius: '50%' }}></div>
                <span>Volume</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', background: '#9d4edd', borderRadius: '50%' }}></div>
                <span>Technical Indicators</span>
              </div>
            </div>
          </div>

          {/* Technical Analysis */}
          <div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>📊</div>
              <h3 style={{ color: 'rgb(0, 212, 255)', margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                Technical Analysis
              </h3>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {/* RSI Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(0, 212, 255, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  RSI (14)
                </div>
                <div style={{ 
                  color: (technicalData?.rsi?.value ?? 0) > 70 ? '#ff4444' : (technicalData?.rsi?.value ?? 0) < 30 ? '#00ff88' : 'white',
                  fontSize: '28px', 
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  {technicalData?.rsi?.value?.toFixed(1) || 'N/A'}
                </div>
                <div style={{ 
                  color: (technicalData?.rsi?.value ?? 0) > 70 ? '#ff4444' : (technicalData?.rsi?.value ?? 0) < 30 ? '#00ff88' : 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {technicalData?.rsi?.signal || 'N/A'}
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {technicalData?.rsi?.value ? 
                    (technicalData.rsi.value > 70 ? 'Overbought' : 
                     technicalData.rsi.value < 30 ? 'Oversold' : 'Neutral') : 'N/A'}
                </div>
              </div>

              {/* MACD Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1), rgba(157, 78, 221, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(157, 78, 221, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(157, 78, 221, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  MACD
                </div>
                <div style={{ 
                  color: technicalData?.macd?.signal_type === 'BUY' ? '#00ff88' : technicalData?.macd?.signal_type === 'SELL' ? '#ff4444' : 'white',
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  {technicalData?.macd?.macd?.toFixed(3) || 'N/A'}
                </div>
                <div style={{ 
                  color: technicalData?.macd?.signal_type === 'BUY' ? '#00ff88' : technicalData?.macd?.signal_type === 'SELL' ? '#ff4444' : 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {technicalData?.macd?.signal_type || 'N/A'}
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Signal: {technicalData?.macd?.signal?.toFixed(3) || 'N/A'}
                </div>
              </div>

              {/* EMA Trend Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 184, 0, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 184, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(255, 184, 0, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  EMA Trend
                </div>
                <div style={{ 
                  color: technicalData?.ema?.trend === 'BULLISH' ? '#00ff88' : technicalData?.ema?.trend === 'BEARISH' ? '#ff4444' : 'white',
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {technicalData?.ema?.trend === 'BULLISH' ? '📈' : technicalData?.ema?.trend === 'BEARISH' ? '📉' : '➡️'}
                  {technicalData?.ema?.trend || 'N/A'}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  EMA 50: ${technicalData?.ema?.ema_50?.toFixed(2) || 'N/A'}
                </div>
                <div style={{ 
                  marginTop: '4px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  EMA 200: ${technicalData?.ema?.ema_200?.toFixed(2) || 'N/A'}
                </div>
              </div>

              {/* Bollinger Bands Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(0, 255, 136, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Bollinger Bands
                </div>
                <div style={{ 
                  color: technicalData?.bollinger_bands?.position === 'OVERBOUGHT' ? '#ff4444' : technicalData?.bollinger_bands?.position === 'OVERSOLD' ? '#00ff88' : 'white',
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  {technicalData?.bollinger_bands?.position || 'N/A'}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Upper: ${technicalData?.bollinger_bands?.upper?.toFixed(2) || 'N/A'}
                </div>
                <div style={{ 
                  marginTop: '4px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Lower: ${technicalData?.bollinger_bands?.lower?.toFixed(2) || 'N/A'}
                </div>
              </div>

              {/* ADX Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(255, 68, 68, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  ADX (Trend Strength)
                </div>
                <div style={{ 
                  color: technicalData?.adx?.trend_strength === 'STRONG' ? '#00ff88' : technicalData?.adx?.trend_strength === 'WEAK' ? '#ff4444' : 'white',
                  fontSize: '28px', 
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  {technicalData?.adx?.value?.toFixed(1) || 'N/A'}
                </div>
                <div style={{ 
                  color: technicalData?.adx?.trend_strength === 'STRONG' ? '#00ff88' : technicalData?.adx?.trend_strength === 'WEAK' ? '#ff4444' : 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {technicalData?.adx?.trend_strength || 'N/A'}
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {technicalData?.adx?.value ? 
                    (technicalData.adx.value > 50 ? 'Strong Trend' : 
                     technicalData.adx.value > 25 ? 'Moderate Trend' : 'Weak Trend') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Fundamentals */}
          <div className="glass-card" style={{ marginBottom: '24px', padding: '20px' }}>
            <h3 style={{ color: 'rgb(0, 212, 255)', marginBottom: '16px', fontSize: '18px' }}>🏗️ Fundamentals</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                minHeight: '60px'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>TVL</div>
                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                  ${selectedCrypto?.market_cap ? (selectedCrypto.market_cap / 1e9).toFixed(1) + 'B' : 'N/A'}
                </div>
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                minHeight: '60px'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>TVL 7d Change</div>
                <div style={{ 
                  color: (selectedCrypto?.price_change_percentage_7d || 0) >= 0 ? '#00ff88' : '#ff4444', 
                  fontSize: '16px', 
                  fontWeight: 'bold' 
                }}>
                  {(selectedCrypto?.price_change_percentage_7d || 0).toFixed(1)}%
                </div>
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                minHeight: '60px'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Next Unlock</div>
                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                  N/A
                </div>
              </div>
            </div>
          </div>

          {/* Social Sentiment Analysis */}
          <div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>😊</div>
              <h3 style={{ color: 'rgb(0, 212, 255)', margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                Social Sentiment Analysis
              </h3>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {/* Sentiment Score Card */}
              <div style={{
                background: (sentimentData?.sentiment_score || 0) > 0 
                  ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))' 
                  : (sentimentData?.sentiment_score || 0) < 0 
                    ? 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))'
                    : 'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 184, 0, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${(sentimentData?.sentiment_score || 0) > 0 ? 'rgba(0, 255, 136, 0.3)' : (sentimentData?.sentiment_score || 0) < 0 ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 184, 0, 0.3)'}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: (sentimentData?.sentiment_score || 0) > 0 ? 'rgba(0, 255, 136, 0.1)' : (sentimentData?.sentiment_score || 0) < 0 ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 184, 0, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Sentiment Score
                </div>
                <div style={{ 
                  color: (sentimentData?.sentiment_score || 0) > 0 ? '#00ff88' : (sentimentData?.sentiment_score || 0) < 0 ? '#ff4444' : '#ffb800',
                  fontSize: '32px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {(sentimentData?.sentiment_score || 0) > 0 ? '😊' : (sentimentData?.sentiment_score || 0) < 0 ? '😞' : '😐'}
                  {sentimentData?.sentiment_score?.toFixed(1) || 'N/A'}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Range: -100 to +100
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {sentimentData?.sentiment_score ? 
                    (sentimentData.sentiment_score > 20 ? 'Very Bullish' : 
                     sentimentData.sentiment_score > 5 ? 'Bullish' :
                     sentimentData.sentiment_score > -5 ? 'Neutral' :
                     sentimentData.sentiment_score > -20 ? 'Bearish' : 'Very Bearish') : 'N/A'}
                </div>
              </div>

              {/* Social Volume Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(0, 212, 255, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Social Volume
                </div>
                <div style={{ 
                  color: 'white', 
                  fontSize: '28px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📢 {sentimentData?.social_volume ? (sentimentData.social_volume / 1000).toFixed(0) + 'K' : 'N/A'}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Mentions (24h)
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {sentimentData?.social_volume ? 
                    (sentimentData.social_volume > 50000 ? 'High Activity' : 
                     sentimentData.social_volume > 10000 ? 'Moderate Activity' : 'Low Activity') : 'N/A'}
                </div>
              </div>

              {/* Social Sentiment Card */}
              <div style={{
                background: sentimentData?.social_sentiment === 'BULLISH' 
                  ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))' 
                  : sentimentData?.social_sentiment === 'BEARISH' 
                    ? 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))'
                    : 'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 184, 0, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${sentimentData?.social_sentiment === 'BULLISH' ? 'rgba(0, 255, 136, 0.3)' : sentimentData?.social_sentiment === 'BEARISH' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 184, 0, 0.3)'}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: sentimentData?.social_sentiment === 'BULLISH' ? 'rgba(0, 255, 136, 0.1)' : sentimentData?.social_sentiment === 'BEARISH' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 184, 0, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Social Sentiment
                </div>
                <div style={{ 
                  color: sentimentData?.social_sentiment === 'BULLISH' ? '#00ff88' : sentimentData?.social_sentiment === 'BEARISH' ? '#ff4444' : '#ffb800', 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {sentimentData?.social_sentiment === 'BULLISH' ? '🚀' : sentimentData?.social_sentiment === 'BEARISH' ? '📉' : '➡️'}
                  {sentimentData?.social_sentiment || 'N/A'}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Buzz Score: {sentimentData?.buzz_score?.toFixed(1) || 'N/A'}
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Community Mood
                </div>
              </div>

              {/* Alt Rank Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1), rgba(157, 78, 221, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(157, 78, 221, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(157, 78, 221, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Alt Rank
                </div>
                <div style={{ 
                  color: 'white', 
                  fontSize: '28px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🏆 #{sentimentData?.alt_rank || 'N/A'}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Social Ranking
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {sentimentData?.alt_rank ? 
                    (sentimentData.alt_rank <= 10 ? 'Top 10' : 
                     sentimentData.alt_rank <= 50 ? 'Top 50' : 
                     sentimentData.alt_rank <= 100 ? 'Top 100' : 'Lower Rank') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Research Report */}
          <div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>🧠</div>
              <h3 style={{ color: 'rgb(0, 212, 255)', margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                AI Research Report
              </h3>
            </div>

            {/* AI Summary */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                marginBottom: '16px'
              }}>
                <h4 style={{ color: 'rgb(0, 212, 255)', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  📋 Executive Summary
                </h4>
                <p style={{ color: 'white', lineHeight: '1.6', margin: '0', fontSize: '14px' }}>
                  {researchData.summary}
                </p>
              </div>
            </div>

            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* AI Confidence Score */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(0, 255, 136, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  AI Confidence Score
                </div>
                <div style={{ 
                  color: getScoreColor(researchData.confidence_score), 
                  fontSize: '36px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎯 {researchData.confidence_score}/100
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {researchData.confidence_score >= 80 ? 'Very High Confidence' :
                   researchData.confidence_score >= 60 ? 'High Confidence' :
                   researchData.confidence_score >= 40 ? 'Moderate Confidence' : 'Low Confidence'}
                </div>
              </div>

              {/* Trading Recommendation */}
              <div style={{
                background: getRecommendationColor(researchData.recommendation) === '#00ff88' 
                  ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))' 
                  : getRecommendationColor(researchData.recommendation) === '#ff4444'
                    ? 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))'
                    : 'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 184, 0, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${getRecommendationColor(researchData.recommendation) === '#00ff88' ? 'rgba(0, 255, 136, 0.3)' : getRecommendationColor(researchData.recommendation) === '#ff4444' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 184, 0, 0.3)'}`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: getRecommendationColor(researchData.recommendation) === '#00ff88' ? 'rgba(0, 255, 136, 0.1)' : getRecommendationColor(researchData.recommendation) === '#ff4444' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 184, 0, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Trading Recommendation
                </div>
                <div style={{ 
                  color: getRecommendationColor(researchData.recommendation), 
                  fontSize: '32px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {researchData.recommendation === 'BUY' ? '🚀' : researchData.recommendation === 'SELL' ? '📉' : '⏸️'}
                  {researchData.recommendation}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {researchData.recommendation === 'BUY' ? 'Bullish Outlook' : 
                   researchData.recommendation === 'SELL' ? 'Bearish Outlook' : 'Neutral Position'}
                </div>
              </div>

              {/* Price Targets */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1), rgba(157, 78, 221, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(157, 78, 221, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  width: '40px', 
                  height: '40px', 
                  background: 'rgba(157, 78, 221, 0.1)', 
                  borderRadius: '50%' 
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                  Price Targets
                </div>
                <div style={{ 
                  color: 'white', 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎯 ${researchData.price_targets?.short_term?.toFixed(2) || 'N/A'}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Short-term target
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Medium: ${researchData.price_targets?.medium_term?.toFixed(2) || 'N/A'} | 
                  Long: ${researchData.price_targets?.long_term?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Technical Analysis */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(0, 212, 255, 0.2)'
              }}>
                <h4 style={{ color: 'rgb(0, 212, 255)', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  📊 Technical Analysis
                </h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6', margin: '0', fontSize: '14px' }}>
                  {researchData.technical_analysis}
                </p>
              </div>

              {/* Sentiment Analysis */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(0, 212, 255, 0.2)'
              }}>
                <h4 style={{ color: 'rgb(0, 212, 255)', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  😊 Sentiment Analysis
                </h4>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6', margin: '0', fontSize: '14px' }}>
                  {researchData.sentiment_analysis}
                </p>
              </div>
            </div>

            {/* Risk Assessment & Opportunities */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Key Risks */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 68, 68, 0.3)'
              }}>
                <h4 style={{ color: '#ff4444', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  ⚠️ Key Risks
                </h4>
                <ul style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                  {researchData.key_risks.map((risk, index) => (
                    <li key={index} style={{ marginBottom: '6px' }}>{risk}</li>
                  ))}
                </ul>
              </div>

              {/* Key Opportunities */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(0, 255, 136, 0.3)'
              }}>
                <h4 style={{ color: '#00ff88', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  🚀 Key Opportunities
                </h4>
                <ul style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                  {researchData.key_opportunities.map((opportunity, index) => (
                    <li key={index} style={{ marginBottom: '6px' }}>{opportunity}</li>
                  ))}
                </ul>
              </div>
            </div>
              
              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => handleExport('pdf')}
                  style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📄 Export PDF
                </button>
                <button
                  onClick={() => handleExport('json')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📊 Export JSON
                </button>
                <button
                  onClick={() => setCoinSymbol('')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  🔄 Compare Another Coin
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
    </>
  );
};

export default AIResearchTool;
