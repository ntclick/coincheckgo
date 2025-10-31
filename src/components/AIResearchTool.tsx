import React, { useState, useEffect } from 'react';
import useCoinCheckGoFHESimple from '../hooks/useCoinCheckGoFHE_Simple';
import { cryptoApiService, CryptoData } from '../services/cryptoApiService';
import { taapiService, TechnicalAnalysis } from '../services/taapiService';
import { cryptoRankService, CryptoRankFundamentals, getTopFunds } from '../services/cryptoRankService';
import { aiReportService, AIReport } from '../services/aiReportService';
import CryptoSearchSimple from './CryptoSearchSimple';
import CoinChart from './CoinChart';
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
    isResearching,
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
  const [researchProgress, setResearchProgress] = useState('');
  const [researchData, setResearchData] = useState<AIReport | null>(null);
  const [researchError, setResearchError] = useState<string>('');
  
  // API data states
  const [topCryptos, setTopCryptos] = useState<CryptoData[]>([]);
  const [technicalData, setTechnicalData] = useState<TechnicalAnalysis | null>(null);
  const [fundamentalsData, setFundamentalsData] = useState<CryptoRankFundamentals | null>(null);
  const [isLoadingCryptos, setIsLoadingCryptos] = useState(false);
  const [showFunds, setShowFunds] = useState(false);
  const [fundsList, setFundsList] = useState<any[]>([]);
  const [showGeneratingPopup, setShowGeneratingPopup] = useState(false);

  // Safe number formatter
  const fmt = (value: any, decimals: number = 2) => {
    const num = typeof value === 'bigint' ? Number(value) : Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : 'N/A';
  };

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
            // console.log(`✅ Loaded ${coins.length} cryptocurrencies from local JSON`);
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
        // console.log(`✅ Loaded ${cryptos.length} cryptocurrencies from CoinGecko`);
      } catch (error) {
        console.error('Error loading cryptocurrencies:', error);
        try {
          const localData = await import('../data/top_coins.json');
          const coins = (localData.coins || localData.default?.coins || []) as CryptoData[];
          if (coins.length > 0) {
            setTopCryptos(coins as any);
            // console.log(`✅ Loaded ${coins.length} cryptocurrencies from local JSON`);
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


  // Handle crypto selection
  const handleCryptoSelect = (crypto: CryptoData) => {
    setSelectedCrypto(crypto);
    setCoinSymbol(crypto.symbol);
    // console.log('🔍 Crypto selected:', crypto.symbol);
  };

  // Disable button when: no coin selected, not connected, or researching/processing
  // Also disable when researchProgress is active (includes "generating content" phase)
  const buttonDisabled = !isConnected || !coinSymbol || isResearching || !!researchProgress;

  // AI Research function - NORMAL TRANSACTION WITH ONCHAIN CHECK
  const handleResearch = async () => {
    // Validate prerequisites
    if (!coinSymbol) {
      alert('Please select a coin first');
      return;
    }

    if (!isConnected) {
      return;
    }

    console.log('🚀 Starting research for:', coinSymbol);

    setResearchError('');
    setResearchData(null);
    setResearchProgress('Preparing transaction...');

    try {
      // Execute on-chain research transaction with FHE signature
      // This will handle EIP-712 signing, balance check, and on-chain confirmation
      const tx = await performResearch(1);

      // If transaction failed or was cancelled, stop here
      if (!tx) {
        console.log('❌ Research transaction failed or was cancelled');
        setResearchProgress('');
        return;
      }

      console.log('✅ Research transaction confirmed on-chain:', tx.hash);
      setResearchProgress('✅ Transaction confirmed - Processing...');

      // Now proceed with API data fetching (only after successful on-chain transaction)
      // This is the main processing phase - DO NOT reload page here
      try {
        setResearchProgress('📊 Fetching market data from CoinGecko...');
        const marketData = await cryptoApiService.getCryptoDetails(selectedCrypto!.id);
        await new Promise(r => setTimeout(r, 400));
        setSelectedCrypto(marketData);
        console.log('✅ Market data fetched');

        setResearchProgress('📈 Analyzing technical indicators with Taapi.io...');
        // Pass current price from CoinGecko to validate and calculate technical indicators correctly
        const currentPrice = marketData?.current_price || selectedCrypto?.current_price;
        const technical = await taapiService.getTechnicalAnalysis(coinSymbol.toLowerCase(), '1h', currentPrice);
        await new Promise(r => setTimeout(r, 400));
        setTechnicalData(technical);
        console.log('✅ Technical analysis completed', { currentPrice, technical });

        setResearchProgress('📊 Fetching fundamentals from CryptoRank...');
        const fundamentals = await cryptoRankService.getFundamentals(coinSymbol.toLowerCase());
        await new Promise(r => setTimeout(r, 400));
        setFundamentalsData(fundamentals);
        console.log('✅ Fundamentals data fetched');

        // Always fetch funds data (no checkbox needed)
        setResearchProgress('💰 Fetching investment funds data...');
        let funds = [];
        try {
          funds = await getTopFunds(coinSymbol.toLowerCase());
          setFundsList(funds);
          console.log('✅ Funds data fetched:', funds.length);
        } catch (fundError) {
          console.warn('⚠️ Failed to fetch funds:', fundError);
          setFundsList([]); // Set empty if fails
        }

        setResearchProgress('🤖 Generating AI report with OpenAI...');
        setShowGeneratingPopup(true); // Show popup when generating
        const aiReport = await aiReportService.generateReport(
          coinSymbol,
          marketData,
          technical,
          fundamentals
        );
        setResearchData(aiReport);
        setShowGeneratingPopup(false); // Close popup when done
        setResearchProgress('✅ Research completed successfully!');
        console.log('✅ AI Report generated');
        
        // All processing completed - results are now displayed on the page
        // No page reload needed - user can see results immediately
        console.log('✅ All processing completed - results displayed on page');
        
        // Refresh balance silently (no page reload)
        setTimeout(() => {
          if ((window as any).loadTokenBalances) {
            (window as any).loadTokenBalances();
          }
        }, 2000);
      } catch (apiError: any) {
        // If API processing fails, show error on page (no reload)
        console.error('❌ API processing failed:', apiError);
        setResearchError(`API processing failed: ${apiError.message || apiError}`);
        setResearchProgress('');
        // Don't reload - let user see the error and try again if needed
      }
    } catch (error: any) {
      console.error('Research failed:', error);
      
      // Check if error is from transaction (before API processing)
      if (error.message?.includes('transaction') || error.message?.includes('Transaction') || error.message?.includes('User rejected')) {
        setResearchError(`Transaction failed: ${error.message || error}`);
        setResearchProgress('');
        // Don't reload on transaction failure - let user see the error
        return;
      }
      
      // For other errors (shouldn't happen if transaction succeeded)
      setResearchError(`Research failed: ${error.message || error}`);
      setResearchProgress('');
      // Don't reload - let user see the error and try again if needed
    }
    // Note: Don't set setIsResearching(false) here - it's handled in the hook
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
      {/* Generating AI Report Popup Modal */}
      {showGeneratingPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(157, 78, 221, 0.15) 100%)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              animation: 'spin 2s linear infinite'
            }}>🤖</div>
            <h3 style={{
              color: 'rgb(0, 212, 255)',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '12px',
              margin: '0 0 12px 0'
            }}>Generating AI Report...</h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              margin: '0'
            }}>Generating detailed analysis report...</p>
          </div>
        </div>
      )}
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
      <div className="glass-card" style={{ marginBottom: '24px', padding: '20px', minHeight: '450px' }}>
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
          gridTemplateColumns: '1fr auto',
          gap: '16px',
          alignItems: 'center'
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
            onClick={handleResearch}
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
             researchProgress ? `⏳ ${researchProgress}` :
             `🔮 Research (${getTokenCost()} GM)`}
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
              {selectedCrypto?.current_price != null ? (
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
                    ${selectedCrypto.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              ) : null}

              {/* 24h Change Card */}
              {selectedCrypto?.price_change_percentage_24h !== undefined ? (
                <div style={{ 
                  background: (selectedCrypto.price_change_percentage_24h || 0) >= 0 
                    ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))' 
                    : 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  border: `1px solid ${(selectedCrypto.price_change_percentage_24h || 0) >= 0 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    right: '-10px', 
                    width: '40px', 
                    height: '40px', 
                    background: (selectedCrypto.price_change_percentage_24h || 0) >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)', 
                    borderRadius: '50%' 
                  }} />
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                    24h Change
                  </div>
                  <div style={{ 
                    color: (selectedCrypto.price_change_percentage_24h || 0) >= 0 ? '#00ff88' : '#ff4444', 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {(selectedCrypto.price_change_percentage_24h || 0) >= 0 ? '↗️' : '↘️'}
                    {selectedCrypto.price_change_percentage_24h !== undefined ? `${fmt(selectedCrypto.price_change_percentage_24h,2)}%` : 'N/A'}
                  </div>
                </div>
              ) : null}

              {/* Volume Card */}
              {selectedCrypto?.total_volume ? (
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
                    {selectedCrypto.total_volume >= 1e9 ? 
                      `$${fmt(selectedCrypto.total_volume / 1e9,1)}B` : 
                      `$${fmt(selectedCrypto.total_volume / 1e6,0)}M`}
                  </div>
                </div>
              ) : null}

              {/* Market Cap Card */}
              {selectedCrypto?.market_cap ? (
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
                    ${selectedCrypto.market_cap >= 1e9 ? fmt(selectedCrypto.market_cap / 1e9, 2) + 'B' : fmt(selectedCrypto.market_cap / 1e6, 2) + 'M'}
                  </div>
                  {selectedCrypto.market_cap_rank && (
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                      Rank #{selectedCrypto.market_cap_rank}
                    </div>
                  )}
                </div>
              ) : null}

              {/* 24h High Card */}
              {selectedCrypto?.high_24h ? (
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
                    24h High
                  </div>
                  <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                    ${fmt(selectedCrypto.high_24h, 2)}
                  </div>
                </div>
              ) : null}

              {/* 24h Low Card */}
              {selectedCrypto?.low_24h ? (
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
                    24h Low
                  </div>
                  <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                    ${fmt(selectedCrypto.low_24h, 2)}
                  </div>
                </div>
              ) : null}

              {/* Circulating Supply Card */}
              {selectedCrypto?.circulating_supply ? (
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
                    Circulating Supply
                  </div>
                  <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {selectedCrypto.circulating_supply >= 1e9 ? fmt(selectedCrypto.circulating_supply / 1e9, 2) + 'B' :
                     selectedCrypto.circulating_supply >= 1e6 ? fmt(selectedCrypto.circulating_supply / 1e6, 2) + 'M' :
                     selectedCrypto.circulating_supply >= 1e3 ? fmt(selectedCrypto.circulating_supply / 1e3, 2) + 'K' :
                     fmt(selectedCrypto.circulating_supply, 0)}
                  </div>
                  {selectedCrypto.total_supply && selectedCrypto.circulating_supply && (
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                      {fmt((selectedCrypto.circulating_supply / selectedCrypto.total_supply) * 100, 1)}% of total
                    </div>
                  )}
                </div>
              ) : null}

              {/* Market Cap Change 24h Card */}
              {selectedCrypto?.market_cap_change_percentage_24h !== undefined ? (
                <div style={{ 
                  background: (selectedCrypto.market_cap_change_percentage_24h || 0) >= 0 
                    ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))' 
                    : 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  border: `1px solid ${(selectedCrypto.market_cap_change_percentage_24h || 0) >= 0 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    right: '-10px', 
                    width: '40px', 
                    height: '40px', 
                    background: (selectedCrypto.market_cap_change_percentage_24h || 0) >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)', 
                    borderRadius: '50%' 
                  }} />
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                    Market Cap Change (24h)
                  </div>
                  <div style={{ 
                    color: (selectedCrypto.market_cap_change_percentage_24h || 0) >= 0 ? '#00ff88' : '#ff4444', 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {(selectedCrypto.market_cap_change_percentage_24h || 0) >= 0 ? '↗️' : '↘️'}
                    {fmt(selectedCrypto.market_cap_change_percentage_24h, 2)}%
                  </div>
                </div>
              ) : null}
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
              <CoinChart 
                symbol={(getTVSymbol(selectedCrypto?.symbol) || 'BINANCE:BTCUSDT').split(':').pop()?.replace('/', '') || 'BTCUSDT'}
                height={500}
                dark={true}
                enableRealtime={true}
                interval={'1h'}
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
                Real-time data (Binance public API)
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
              {technicalData?.rsi?.value !== undefined ? (
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
                    color: (technicalData.rsi.value > 70 ? '#ff4444' : technicalData.rsi.value < 30 ? '#00ff88' : 'white'),
                    fontSize: '28px', 
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    {fmt(technicalData.rsi.value,1) || 'N/A'}
                  </div>
                  <div style={{ 
                    color: (technicalData.rsi.value > 70 ? '#ff4444' : technicalData.rsi.value < 30 ? '#00ff88' : 'rgba(255, 255, 255, 0.6)'),
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {technicalData.rsi.signal || 'N/A'}
                  </div>
                  <div style={{ 
                    marginTop: '8px',
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {technicalData.rsi.value ? 
                      (technicalData.rsi.value > 70 ? 'Overbought' : 
                       technicalData.rsi.value < 30 ? 'Oversold' : 'Neutral') : 'N/A'}
                  </div>
                </div>
              ) : null}

              {/* MACD Card */}
              {technicalData?.macd?.signal_type !== undefined ? (
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
                    color: technicalData.macd.signal_type === 'BUY' ? '#00ff88' : technicalData.macd.signal_type === 'SELL' ? '#ff4444' : 'white',
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    {fmt(technicalData.macd.macd,3) || 'N/A'}
                  </div>
                  <div style={{ 
                    color: technicalData.macd.signal_type === 'BUY' ? '#00ff88' : technicalData.macd.signal_type === 'SELL' ? '#ff4444' : 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {technicalData.macd.signal_type || 'N/A'}
                  </div>
                  <div style={{ 
                    marginTop: '8px',
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    Signal: {fmt(technicalData.macd.signal,3) || 'N/A'}
                  </div>
                </div>
              ) : null}

              {/* EMA Trend Card */}
              {technicalData?.ema?.trend !== undefined ? (
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
                    color: technicalData.ema.trend === 'BULLISH' ? '#00ff88' : technicalData.ema.trend === 'BEARISH' ? '#ff4444' : 'white',
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {technicalData.ema.trend === 'BULLISH' ? '📈' : technicalData.ema.trend === 'BEARISH' ? '📉' : '➡️'}
                    {technicalData.ema.trend || 'N/A'}
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    EMA 50: {technicalData.ema.ema_50 > 0 ? `$${fmt(technicalData.ema.ema_50,2)}` : 'N/A'}
                  </div>
                  <div style={{ 
                    marginTop: '4px',
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    EMA 200: {technicalData.ema.ema_200 > 0 ? `$${fmt(technicalData.ema.ema_200,2)}` : 'N/A'}
                  </div>
                </div>
              ) : null}

              {/* Bollinger Bands Card */}
              {technicalData?.bollinger_bands?.position !== undefined ? (
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
                    color: technicalData.bollinger_bands.position === 'OVERBOUGHT' ? '#ff4444' : technicalData.bollinger_bands.position === 'OVERSOLD' ? '#00ff88' : 'white',
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    {technicalData.bollinger_bands.position || 'N/A'}
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Upper: {technicalData.bollinger_bands.upper > 0 ? `$${fmt(technicalData.bollinger_bands.upper,2)}` : 'N/A'}
                  </div>
                  <div style={{ 
                    marginTop: '4px',
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    Lower: {technicalData.bollinger_bands.lower > 0 ? `$${fmt(technicalData.bollinger_bands.lower,2)}` : 'N/A'}
                  </div>
                </div>
              ) : null}

              {/* ADX Card */}
              {technicalData?.adx?.trend_strength !== undefined ? (
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
                    color: technicalData.adx.trend_strength === 'STRONG' ? '#00ff88' : technicalData.adx.trend_strength === 'WEAK' ? '#ff4444' : 'white',
                    fontSize: '28px', 
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    {fmt(technicalData.adx.value,1) || 'N/A'}
                  </div>
                  <div style={{ 
                    color: technicalData.adx.trend_strength === 'STRONG' ? '#00ff88' : technicalData.adx.trend_strength === 'WEAK' ? '#ff4444' : 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {technicalData.adx.trend_strength || 'N/A'}
                  </div>
                  <div style={{ 
                    marginTop: '8px',
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {technicalData.adx.value ? 
                      (technicalData.adx.value > 50 ? 'Strong Trend' : 
                       technicalData.adx.value > 25 ? 'Moderate Trend' : 'Weak Trend') : 'N/A'}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Fundamentals Analysis - Merged into single section */}
          {(fundamentalsData || selectedCrypto?.market_cap || selectedCrypto?.circulating_supply || fundsList.length > 0) && (
            <div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '24px', marginRight: '12px' }}>🏗️</div>
                <h3 style={{ color: 'rgb(0, 212, 255)', margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                  Fundamentals Analysis
                </h3>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
              }}>
              {/* Circulating Supply Card */}
              {fundamentalsData?.circulating_supply ? (
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
                    Circulating Supply
                  </div>
                  <div style={{ 
                    color: 'white', 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    {fmt(fundamentalsData.circulating_supply / 1e6,1) + 'M'}
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '12px'
                  }}>
                    Tokens in circulation
                  </div>
                </div>
              ) : null}

              {/* Market Dominance Card */}
              {fundamentalsData?.market_cap_dominance !== undefined ? (
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
                    Market Dominance
                  </div>
                  <div style={{ 
                    color: 'white', 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    {fmt(fundamentalsData.market_cap_dominance,2) || '0.00'}%
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '12px'
                  }}>
                    Of total crypto market
                  </div>
                </div>
              ) : null}

              {/* All-Time High Card */}
              {fundamentalsData?.ath ? (
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
                    All-Time High
                  </div>
                  <div style={{ 
                    color: 'white', 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    ${fmt(fundamentalsData.ath,2) || 'N/A'}
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '12px'
                  }}>
                    {fundamentalsData.ath_change_percentage ? `${fmt(fundamentalsData.ath_change_percentage,2)}% from ATH` : 'N/A'}
                  </div>
                </div>
              ) : null}

              {/* All-Time Low Card */}
              {fundamentalsData?.atl ? (
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
                    All-Time Low
                  </div>
                  <div style={{ 
                    color: 'white', 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    ${fmt(fundamentalsData.atl,2) || 'N/A'}
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '12px'
                  }}>
                    {fundamentalsData.atl_change_percentage ? `${fmt(fundamentalsData.atl_change_percentage,2)}% from ATL` : 'N/A'}
                  </div>
                </div>
              ) : null}

              {/* Top Investment Funds - Only show if funds data exists */}
              {fundsList.length > 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 184, 0, 0.05))',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255, 184, 0, 0.3)',
                  marginTop: '10px'
                }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '12px', fontWeight: '500' }}>
                    💰 Top Investment Funds (CryptoRank)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {fundsList.map((f: any, idx: number) => (
                      <span key={idx} style={{
                        background: 'rgba(0,212,255,0.1)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        color: '#eee',
                        display: 'inline-block',
                        fontSize: '12px'
                      }}>
                        <b>{f.name}</b> 
                        {f.investment_stage && <span style={{opacity: 0.7, marginLeft: '6px'}}>{f.investment_stage}</span>}
                        {f.project_count && <span style={{color: '#fffd6e', marginLeft: '6px'}}>{f.project_count} projects</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

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
                  {typeof researchData.summary === 'object' ? JSON.stringify(researchData.summary) : String(researchData.summary || 'N/A')}
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
              {researchData.confidence_score !== undefined ? (
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
              ) : null}

              {/* Trading Recommendation */}
              {researchData.recommendation !== undefined ? (
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
              ) : null}

              {/* Price Targets */}
              {researchData.price_targets ? (
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
                    🎯 ${fmt(researchData.price_targets.short_term, 2)}
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
                    Medium: ${fmt(researchData.price_targets.medium_term, 2)} | 
                    Long: ${fmt(researchData.price_targets.long_term, 2)}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Detailed Analysis */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Technical Analysis - Improved display with parsed JSON */}
              {researchData.technical_analysis ? (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05))',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(0, 212, 255, 0.3)'
                }}>
                  <h4 style={{ color: 'rgb(0, 212, 255)', margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    📊 Technical Analysis
                  </h4>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    lineHeight: '1.8'
                  }}>
                    {typeof researchData.technical_analysis === 'string' ? (
                      // If it's a string, try to parse as JSON
                      (() => {
                        try {
                          const parsed = JSON.parse(researchData.technical_analysis);
                          return Object.entries(parsed).map(([key, value]: [string, any]) => (
                            <div key={key} style={{
                              padding: '12px',
                              background: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 212, 255, 0.2)'
                            }}>
                              <div style={{ fontWeight: 'bold', color: 'rgb(0, 212, 255)', marginBottom: '6px', textTransform: 'capitalize' }}>
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>
                                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                              </div>
                            </div>
                          ));
                        } catch {
                          // If not JSON, display as is
                          return <div style={{ whiteSpace: 'pre-wrap' }}>{researchData.technical_analysis}</div>;
                        }
                      })()
                    ) : typeof researchData.technical_analysis === 'object' ? (
                      // If it's already an object, display formatted
                      Object.entries(researchData.technical_analysis).map(([key, value]: [string, any]) => (
                        <div key={key} style={{
                          padding: '12px',
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '8px',
                          border: '1px solid rgba(0, 212, 255, 0.2)'
                        }}>
                          <div style={{ fontWeight: 'bold', color: 'rgb(0, 212, 255)', marginBottom: '6px', textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>
                            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{String(researchData.technical_analysis)}</div>
                    )}
                  </div>
                </div>
              ) : null}

            </div>

            {/* Risk Assessment & Opportunities */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Key Risks */}
              {researchData.key_risks && researchData.key_risks.length > 0 ? (
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
              ) : null}

              {/* Key Opportunities */}
              {researchData.key_opportunities && researchData.key_opportunities.length > 0 ? (
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
              ) : null}
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
