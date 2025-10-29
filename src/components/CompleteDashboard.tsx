import React, { useState, useEffect } from 'react';
import useCoinCheckGoFHESimple from '../hooks/useCoinCheckGoFHE_Simple';
import AIResearchTool from './AIResearchTool';
import { toast } from 'react-hot-toast';
import { cryptoApiService } from '../services/cryptoApiService';

// Extend Window interface for swap functions and EIP-712
declare global {
  interface Window {
    swapETHForGM?: (ethAmount?: string) => void;
    swapGMForETH?: (gmAmount?: string) => void;
    forceDecryptConfidentialBalance?: () => void;
    forceEIP712Signature?: () => void;
    dailyCheckIn?: () => void;
    checkDailyCheckInStatus?: () => Promise<string>;
    addLiquidity?: () => void;
    addLiquidityWithAmounts?: (ethAmount: string, gmAmount: string) => void;
  }
}

export const CompleteDashboard: React.FC = () => {
  const RATE = 100000; // 1 ETH = 100,000 GM
  // FHE Hook
  const {
    isConnected,
    address,
    performCheckIn,
    performResearch,
    fundResearchPool,
    connectWallet,
    userPublicBalance,
    poolBalances
  } = useCoinCheckGoFHESimple();
  
  // Home page states
  const [ethBalance, setEthBalance] = useState('0');
  const [swapAmount, setSwapAmount] = useState('0.001'); // Default ETH amount
  const [scriptGMBalance, setScriptGMBalance] = useState('0');
  const [swapDirection, setSwapDirection] = useState<'ETH_TO_GM' | 'GM_TO_ETH'>('ETH_TO_GM');
  const [fromAmount, setFromAmount] = useState('0.001');
  const [toAmount, setToAmount] = useState('100');
  const [liquidityETH, setLiquidityETH] = useState('0.25');
  const [liquidityGM, setLiquidityGM] = useState('25000');
  const [newsData, setNewsData] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsFilter, setNewsFilter] = useState('All');
  const [displayedNewsCount, setDisplayedNewsCount] = useState(12); // Show 12 initially
  const [feedStats, setFeedStats] = useState<{[key: string]: number}>({}); // Track feed statistics
  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [topLosers, setTopLosers] = useState<any[]>([]);
  const [countdownTimer, setCountdownTimer] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<'not-checked' | 'ready' | 'completed' | 'loading'>('not-checked');
  
  const [currentPage, setCurrentPage] = useState('home');

  // Navigation items
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'swap', icon: '🔄', label: 'Swap' },
    { id: 'news', icon: '📰', label: 'News' },
    { id: 'research', icon: '🔬', label: 'AI Research' }
  ];

  // Helper function to get time ago
  const getTimeAgo = (pubDate: string) => {
    const now = new Date();
    const pub = new Date(pubDate);
    const diffInMs = now.getTime() - pub.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  // Helper function to extract image from HTML content
  const extractImageFromHTML = (htmlContent: string) => {
    if (!htmlContent) return '';
    
    // Try to find img tags
    const imgMatch = htmlContent.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) return imgMatch[1];
    
    // Try to find src attributes
    const srcMatch = htmlContent.match(/src="([^"]+)"/i);
    if (srcMatch) return srcMatch[1];
    
    // Try to find URLs in the content
    const urlMatch = htmlContent.match(/https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp)/i);
    if (urlMatch) return urlMatch[0];
    
    return '';
  };

  // Static news fallback
  const getStaticNews = () => [
    {
      title: "Bitcoin Surges to New All-Time High",
      description: "Bitcoin has reached a new all-time high, breaking through previous resistance levels and showing strong bullish momentum...",
      source: "CoinDesk",
      timeAgo: "2 hours ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop"
    },
    {
      title: "Ethereum 2.0 Upgrade Shows Promising Results",
      description: "The Ethereum 2.0 upgrade continues to show promising results with improved scalability and reduced energy consumption...",
      source: "Decrypt",
      timeAgo: "4 hours ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1639322537228-f912d5a0b0b8?w=400&h=200&fit=crop"
    },
    {
      title: "DeFi Protocols See Record TVL Growth",
      description: "Decentralized Finance protocols have seen record total value locked growth, indicating increased adoption and trust...",
      source: "CoinTelegraph",
      timeAgo: "6 hours ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop"
    },
    {
      title: "NFT Marketplace Sees Record Trading Volume",
      description: "The leading NFT marketplace has reported record trading volumes this month, driven by celebrity endorsements and new collections...",
      source: "CoinDesk",
      timeAgo: "12 hours ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1639322537228-f912d5a0b0b8?w=400&h=200&fit=crop"
    },
    {
      title: "Bitcoin Mining Difficulty Reaches New All-Time High",
      description: "Bitcoin mining difficulty has reached a new all-time high, reflecting increased network security and competition among miners...",
      source: "CoinTelegraph",
      timeAgo: "14 hours ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop"
    },
    {
      title: "Ethereum 2.0 Staking Rewards Hit Record Levels",
      description: "Ethereum 2.0 staking rewards have reached record levels as more validators join the network and contribute to its security...",
      source: "Decrypt",
      timeAgo: "16 hours ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1639322537228-f912d5a0b0b8?w=400&h=200&fit=crop"
    },
    {
      title: "DeFi Total Value Locked Surpasses $200 Billion",
      description: "The total value locked in DeFi protocols has surpassed $200 billion, marking a significant milestone for decentralized finance...",
      source: "CoinDesk",
      timeAgo: "18 hours ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1639322537228-f912d5a0b0b8?w=400&h=200&fit=crop"
    },
    {
      title: "FHE Privacy Coins Gain Traction in Institutional Markets",
      description: "Fully Homomorphic Encryption privacy coins are gaining traction among institutional investors seeking enhanced privacy...",
      source: "CoinTelegraph",
      timeAgo: "20 hours ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop"
    },
    {
      title: "Bitcoin ETF Sees Record Daily Inflows",
      description: "Bitcoin exchange-traded funds have seen record daily inflows as institutional adoption continues to accelerate...",
      source: "Decrypt",
      timeAgo: "22 hours ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop"
    },
    {
      title: "Ethereum Gas Fees Drop to Lowest Level in Months",
      description: "Ethereum gas fees have dropped to their lowest level in months, making transactions more affordable for users...",
      source: "CoinDesk",
      timeAgo: "1 day ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1639322537228-f912d5a0b0b8?w=400&h=200&fit=crop"
    },
    {
      title: "DeFi Yield Farming Strategies Show 50% Annual Returns",
      description: "Advanced DeFi yield farming strategies are showing annual returns of up to 50%, attracting more sophisticated investors...",
      source: "CoinTelegraph",
      timeAgo: "1 day ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1639322537228-f912d5a0b0b8?w=400&h=200&fit=crop"
    },
    {
      title: "NFT Art Collections Break Sales Records at Auction",
      description: "NFT art collections have broken sales records at major auction houses, signaling mainstream adoption of digital art...",
      source: "Decrypt",
      timeAgo: "1 day ago",
      link: "#",
      imageUrl: "https://images.unsplash.com/photo-1639322537228-f912d5a0b0b8?w=400&h=200&fit=crop"
    }
  ];

  // Fetch RSS news data
  const fetchNewsData = async () => {
    setIsLoadingNews(true);
    try {
      const rssFeeds = [
        'https://www.coindesk.com/arc/outboundfeeds/rss',
        'https://decrypt.co/feed',
        'https://cointelegraph.com/rss'
      ];
      
      const allNews: any[] = [];
      
      for (const feedUrl of rssFeeds) {
        try {
          // Use CORS proxy for RSS feeds
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
          const response = await fetch(proxyUrl);
          const xmlText = await response.text();
          
          // Parse XML to extract news items
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          const items = xmlDoc.querySelectorAll('item');
          const source = feedUrl.includes('coindesk') ? 'CoinDesk' : 
                       feedUrl.includes('decrypt') ? 'Decrypt' : 
                       feedUrl.includes('cointelegraph') ? 'CoinTelegraph' : 'CoinDesk';
          
          console.log(`📰 [${source}] Found ${items.length} articles from RSS feed`);
          
          // Update feed statistics
          setFeedStats(prev => ({
            ...prev,
            [source]: items.length
          }));
          
          items.forEach((item, index) => {
            // Load all items from each feed
            const title = item.querySelector('title')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            
            // Extract image from description or media:content
            let imageUrl = '';
            
            // Try multiple methods to find images
            const mediaContent = item.querySelector('media\\:content, content')?.getAttribute('url');
            const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail')?.getAttribute('url');
            const enclosure = item.querySelector('enclosure')?.getAttribute('url');
            
            // Try different image extraction methods
            if (mediaContent) {
              imageUrl = mediaContent;
            } else if (mediaThumbnail) {
              imageUrl = mediaThumbnail;
            } else if (enclosure && enclosure.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              imageUrl = enclosure;
            } else {
              // Use helper function to extract from description HTML
              imageUrl = extractImageFromHTML(description);
            }
            
            // Clean up image URL
            if (imageUrl) {
              // Remove any HTML entities
              imageUrl = imageUrl.replace(/&amp;/g, '&');
              // Ensure it's a valid URL
              if (!imageUrl.startsWith('http')) {
                imageUrl = '';
              }
            }
            
            // Fallback images for sources without images
            if (!imageUrl) {
              if (source === 'CoinDesk') {
                imageUrl = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop&auto=format';
              } else if (source === 'Decrypt') {
                imageUrl = 'https://images.unsplash.com/photo-1639322537228-f912d5a0b0b8?w=400&h=200&fit=crop&auto=format';
              } else if (source === 'CoinTelegraph') {
                imageUrl = 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop&auto=format';
              } else {
                // Default fallback for any other source
                imageUrl = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop&auto=format';
              }
            }
            
            allNews.push({
              title,
              description: description.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
              link,
              pubDate,
              source,
              timeAgo: getTimeAgo(pubDate),
              imageUrl
            });
          });
        } catch (error) {
          console.error(`Error fetching ${feedUrl}:`, error);
        }
      }
      
      // Sort by date and take latest 12
      allNews.sort((a: any, b: any) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      setNewsData(allNews.slice(0, 12));
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to static news
      setNewsData(getStaticNews());
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Filter news based on selected filter
  const getFilteredNews = () => {
    let filtered = newsData;
    if (newsFilter !== 'All') {
      filtered = newsData.filter((news: any) => {
        const title = news.title.toLowerCase();
        const description = news.description.toLowerCase();
        const searchTerm = newsFilter.toLowerCase();
        
        return title.includes(searchTerm) || description.includes(searchTerm);
      });
    }
    return filtered.slice(0, displayedNewsCount);
  };

  // Get filtered news count
  const getFilteredNewsCount = () => {
    if (newsFilter === 'All') return newsData.length;
    return newsData.filter((news: any) => {
      const title = news.title.toLowerCase();
      const description = news.description.toLowerCase();
      const searchTerm = newsFilter.toLowerCase();
      return title.includes(searchTerm) || description.includes(searchTerm);
    }).length;
  };

  // Load more news
  const loadMoreNews = () => {
    setDisplayedNewsCount((prev: number) => Math.min(prev + 12, getFilteredNewsCount()));
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setNewsFilter(filter);
    setDisplayedNewsCount(12); // Reset to show 12 when filter changes
  };

  // Load all data
  const loadAllData = async () => {
    if (!isConnected) return;
    // Load data when needed
    // Always load news data
    await fetchNewsData();
  };

  const loadHomeData = async () => {
    if (!address) return;
    
    try {
      // Load ETH balance
      const provider = window.ethereum ? new (await import('ethers')).BrowserProvider(window.ethereum) : null;
      if (provider) {
        const balance = await provider.getBalance(address);
        setEthBalance((Number(balance) / 1e18).toFixed(4));
      }
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  const loadPublicData = () => {
    // Load crypto news (mock data for now)
    setNewsData(getStaticNews());
  };

  // Load real top movers (CoinGecko)
  const loadTopMovers = async () => {
    try {
      const coins = await cryptoApiService.getTopCryptocurrencies(300);
      // Sort by 24h percentage change
      const sorted = [...coins].filter(c => typeof c.price_change_percentage_24h === 'number');
      const gainers = [...sorted]
        .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
        .slice(0, 10)
        .map(c => ({
          symbol: (c.symbol || '').toUpperCase(),
          name: c.name,
          price: `$${(c.current_price ?? 0).toLocaleString()}`,
          change: `${(c.price_change_percentage_24h ?? 0).toFixed(2)}%`,
          changeType: (c.price_change_percentage_24h ?? 0) >= 0 ? 'up' : 'down'
        }));
      const losers = [...sorted]
        .sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
        .slice(0, 10)
        .map(c => ({
          symbol: (c.symbol || '').toUpperCase(),
          name: c.name,
          price: `$${(c.current_price ?? 0).toLocaleString()}`,
          change: `${(c.price_change_percentage_24h ?? 0).toFixed(2)}%`,
          changeType: (c.price_change_percentage_24h ?? 0) >= 0 ? 'up' : 'down'
        }));
      setTopGainers(gainers);
      setTopLosers(losers);
    } catch (err) {
      console.error('Failed to load top movers from CoinGecko:', err);
      // Fallback to existing mock if needed
      setTopGainers([
        { symbol: 'BTC', name: 'Bitcoin', price: '$67,890', change: '+12.5%', changeType: 'up' },
        { symbol: 'ETH', name: 'Ethereum', price: '$4,250', change: '+8.3%', changeType: 'up' },
        { symbol: 'SOL', name: 'Solana', price: '$185', change: '+15.2%', changeType: 'up' },
      ]);
      setTopLosers([
        { symbol: 'DOGE', name: 'Dogecoin', price: '$0.089', change: '-5.2%', changeType: 'down' },
        { symbol: 'SHIB', name: 'Shiba Inu', price: '$0.000012', change: '-8.1%', changeType: 'down' },
        { symbol: 'LTC', name: 'Litecoin', price: '$85', change: '-3.4%', changeType: 'down' },
      ]);
    }
  };

  // Check on-chain daily check-in status
  const checkDailyCheckInStatus = async () => {
    if (!isConnected || !address) {
      setCheckInStatus('not-checked');
      return;
    }

    try {
      console.log('🔍 Checking daily check-in status on-chain...');
      
      // Call the on-chain check function from the injected script
      if (window.checkDailyCheckInStatus) {
        const status = await window.checkDailyCheckInStatus();
        console.log('📊 Daily check-in status:', status);
        
        if (status === 'completed') {
          setCheckInStatus('completed');
        } else if (status === 'ready') {
          setCheckInStatus('ready');
        } else {
          setCheckInStatus('not-checked');
        }
      } else {
        console.log('⚠️ checkDailyCheckInStatus function not available');
        setCheckInStatus('ready'); // Default to ready when function not available
      }
    } catch (error) {
      console.error('❌ Failed to check daily check-in status:', error);
      setCheckInStatus('ready'); // Default to ready on error
    }
  };

  useEffect(() => {
    // Load public data
    loadPublicData();
    // Load news data
    fetchNewsData();
    // Load real gainers/losers
    loadTopMovers();
    
    if (isConnected) {
      loadAllData();
      loadHomeData();
      checkDailyCheckInStatus(); // Check on-chain daily check-in status
      
      // Auto-trigger EIP-712 signature after wallet connection
      setTimeout(() => {
        console.log('🔐 Auto-triggering EIP-712 signature after wallet connection...');
        // Set flag to allow auto-decryption
        (window as any).walletJustConnected = true;
        (window as any).userRequestedDecryption = true;
        
        if (window.forceDecryptConfidentialBalance) {
          console.log('🔐 Calling forceDecryptConfidentialBalance...');
          window.forceDecryptConfidentialBalance();
        } else {
          console.log('⚠️ forceDecryptConfidentialBalance not available yet, retrying...');
          // Retry after a short delay
          setTimeout(() => {
            if (window.forceDecryptConfidentialBalance) {
              window.forceDecryptConfidentialBalance();
            }
          }, 2000);
        }
      }, 1000); // Wait 1 second for everything to initialize
    }

    // Listen for token balance updates from the script
    const handleTokenBalancesUpdate = (event: any) => {
      const { publicBalance } = event.detail;
      if (publicBalance) {
        // Force update the UI with script data
        console.log('🔄 Using script balance data:', publicBalance);
        setScriptGMBalance(publicBalance);
      }
      
      // Still call loadAllData for other data
      if (isConnected) {
        loadAllData();
      }
    };

    window.addEventListener('tokenBalancesUpdated', handleTokenBalancesUpdate);
    
    return () => {
      window.removeEventListener('tokenBalancesUpdated', handleTokenBalancesUpdate);
    };
  }, [isConnected]);


  // Countdown timer effect (reset at 07:00 UTC+7 == 00:00 UTC)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Next midnight UTC (which equals 07:00 UTC+7 local reset)
      const nextUtcMidnight = new Date(now);
      nextUtcMidnight.setUTCHours(24, 0, 0, 0);
      const timeLeft = nextUtcMidnight.getTime() - now.getTime();
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      setCountdownTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for check-in availability changes from injected script
  useEffect(() => {
    const handleCheckInAvailabilityChanged = (event: any) => {
      const { available } = event.detail;
      if (!available) {
        setCheckInStatus('completed');
        console.log('🔒 Daily Check-in button hidden until next reset');
      } else {
        setCheckInStatus('ready');
        console.log('🔓 Daily Check-in button available');
      }
    };

    window.addEventListener('checkInAvailabilityChanged', handleCheckInAvailabilityChanged);
    return () => window.removeEventListener('checkInAvailabilityChanged', handleCheckInAvailabilityChanged);
  }, []);

  // Listen for successful check-in completion
  useEffect(() => {
    const handleCheckInSuccess = () => {
      setCheckInStatus('completed');
      console.log('✅ Daily check-in completed successfully');
    };

    window.addEventListener('checkInSuccess', handleCheckInSuccess);
    return () => window.removeEventListener('checkInSuccess', handleCheckInSuccess);
  }, []);

  return (
    <div className="modern-dashboard">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-logo">🪙 CoinCheckGo FHE</div>
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <h1 className="page-title">{navItems.find(item => item.id === currentPage)?.label || 'Home'}</h1>
          <div className="header-actions">
            <div className="network-badge">Sepolia Testnet</div>
          <button 
            className="wallet-btn"
            onClick={async () => {
              console.log('🔗 Connect Wallet button clicked - isConnected:', isConnected);
              console.log('🔗 connectWallet function:', typeof connectWallet);
              if (!isConnected) {
                try {
                  console.log('🔗 Calling connectWallet...');
                  await connectWallet();
                  console.log('🔗 connectWallet completed');
                } catch (error) {
                  console.error('❌ Connect wallet error:', error);
                }
              } else {
                console.log('🔗 Already connected, no action needed');
              }
            }}
          >
            {isConnected ? `🔗 ${address?.slice(0, 6)}...${address?.slice(-4)}` : '🔗 Connect Wallet'}
              </button>
          </div>
        </header>
        {/* ========== HOME PAGE ========== */}
        {currentPage === 'home' && (
          <div className="page">
            <div className="page-header">
              <h1>🏠 Home Dashboard</h1>
              <p>Welcome to CoinCheckGo FHE - Your privacy-first crypto research platform</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              {/* Token Balances */}
              <div className="glass-card" style={{
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 184, 0, 0.1) 100%)', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                position: 'relative'
              }}>
                <h2 style={{ 
                  color: 'rgb(0, 212, 255)', 
                  marginBottom: '20px',
                  background: 'linear-gradient(135deg, rgb(0, 212, 255) 0%, rgb(255, 184, 0) 100%)', 
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>💰 Token Balances</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.2)', 
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(0, 212, 255, 0.2)' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'linear-gradient(135deg, rgb(0, 212, 255), rgb(157, 78, 221))', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>Ξ</div>
                        <div>
                          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Ethereum</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'rgb(0, 212, 255)' }}>{ethBalance} ETH</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Sepolia</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Testnet</div>
                        </div>
                        </div>
                      </div>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.2)', 
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(255, 184, 0, 0.2)' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'linear-gradient(135deg, rgb(255, 184, 0), rgb(255, 107, 0))', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: 'rgb(0, 0, 0)' 
                        }}>G</div>
                        <div>
                          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>GM Tokens</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'rgb(255, 184, 0)' }}>{userPublicBalance} GM</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>📊 Public: {userPublicBalance} GM</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>FHE</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Encrypted</div>
                        </div>
                        </div>
                      </div>
                  <div style={{
                    background: 'rgba(0, 212, 255, 0.1)', 
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid rgba(0, 212, 255, 0.2)', 
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>💡 GM Tokens are FHE encrypted</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Only you can decrypt with your private key</div>
                    </div>
                  
                </div>
              </div>

              {/* ETH → GM Token Swap */}
              <div className="glass-card" style={{ 
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)', 
                border: '1px solid rgba(157, 78, 221, 0.3)', 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(157, 78, 221, 0.05) 0%, transparent 70%)', 
                  animation: 'rotate 20s linear infinite',
                  pointerEvents: 'none'
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h2 style={{ 
                    color: 'rgb(0, 212, 255)', 
                    marginBottom: '20px',
                    background: 'linear-gradient(135deg, rgb(157, 78, 221) 0%, rgb(0, 212, 255) 100%)', 
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '18px',
                    fontWeight: '700'
                  }}>🔄 ETH → GM Token Swap</h2>
                  <div style={{ 
                    fontSize: '11px', 
                    padding: '4px 8px', 
                    borderRadius: '8px',
                    background: 'rgba(255, 84, 89, 0.15)', 
                    color: 'rgb(255, 84, 89)', 
                    border: '1px solid rgb(255, 84, 89)', 
                    display: 'inline-block',
                    marginTop: '8px'
                  }}>⚠️ FHE Required</div>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '12px', 
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)' 
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '8px',
                        fontWeight: '600'
                      }}>From</label>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        background: 'rgba(0, 0, 0, 0.2)', 
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          background: swapDirection === 'ETH_TO_GM' ? 'linear-gradient(135deg, rgb(0, 212, 255), rgb(0, 153, 204))' : 'linear-gradient(135deg, rgb(255, 184, 0), rgb(255, 107, 0))', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold', 
                          marginRight: '8px'
                        }}>{swapDirection === 'ETH_TO_GM' ? 'Ξ' : 'G'}</div>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>{swapDirection === 'ETH_TO_GM' ? 'ETH' : 'GM Tokens'}</span>
                        <input
                          type="number"
                          className="form-input"
                          step={swapDirection === 'ETH_TO_GM' ? '0.001' : '1'} 
                          min={swapDirection === 'ETH_TO_GM' ? '0.001' : '1'} 
                          placeholder={swapDirection === 'ETH_TO_GM' ? '0.001' : '100'} 
                          value={fromAmount}
                          readOnly={false}
                          disabled={false}
                          onChange={(e) => {
                            console.log('🔄 From input changed:', e.target.value);
                            const value = e.target.value;
                            setFromAmount(value);
                            // Auto-calculate to amount based on direction
                            const num = parseFloat(value) || 0;
                            if (swapDirection === 'ETH_TO_GM') {
                              setToAmount((num * RATE).toString());
                            } else {
                              setToAmount((num / RATE).toString());
                            }
                          }}
                          style={{ 
                            flex: '1 1 0%', 
                            background: 'transparent',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            padding: '0px', 
                            marginLeft: '8px',
                            color: swapDirection === 'ETH_TO_GM' ? 'rgb(0, 212, 255)' : 'rgb(255, 184, 0)',
                            cursor: 'text'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', margin: '8px 0px', position: 'relative' }}>
                      <button 
                        onClick={() => {
                          setSwapDirection(prev => {
                            const newDirection = prev === 'ETH_TO_GM' ? 'GM_TO_ETH' : 'ETH_TO_GM';
                            // Reset amounts when switching direction
                            if (newDirection === 'ETH_TO_GM') {
                              setFromAmount('0.001');
                              setToAmount('100');
                            } else {
                              setFromAmount('100');
                              setToAmount('0.001');
                            }
                            return newDirection;
                          });
                        }}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          cursor: 'pointer', 
                          padding: '8px', 
                          borderRadius: '50%', 
                          transition: '0.3s', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          margin: '0px auto', 
                          fontSize: '24px', 
                          color: 'rgb(0, 212, 255)', 
                          transform: 'rotate(0deg)' 
                        }}>↕️</button>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '8px',
                        fontWeight: '600'
                      }}>To</label>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        background: 'rgba(0, 0, 0, 0.2)', 
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          background: swapDirection === 'ETH_TO_GM' ? 'linear-gradient(135deg, rgb(255, 184, 0), rgb(255, 107, 0))' : 'linear-gradient(135deg, rgb(0, 212, 255), rgb(0, 153, 204))', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginRight: '8px'
                        }}>{swapDirection === 'ETH_TO_GM' ? 'G' : 'Ξ'}</div>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>{swapDirection === 'ETH_TO_GM' ? 'GM Tokens' : 'ETH'}</span>
                        <input 
                          type="number"
                          className="form-input"
                          step={swapDirection === 'ETH_TO_GM' ? '1' : '0.001'}
                          min={swapDirection === 'ETH_TO_GM' ? '1' : '0.001'}
                          placeholder={swapDirection === 'ETH_TO_GM' ? '100' : '0.001'}
                          value={toAmount}
                          readOnly={false}
                          disabled={false}
                          onChange={(e) => {
                            console.log('🔄 Home To input changed:', e.target.value);
                            const value = e.target.value;
                            setToAmount(value);
                            // Auto-calculate from amount based on direction
                            const num = parseFloat(value) || 0;
                            if (swapDirection === 'ETH_TO_GM') {
                              // To is GM, From is ETH
                              setFromAmount((num / RATE).toString());
                            } else {
                              // To is ETH, From is GM
                              setFromAmount((num * RATE).toString());
                            }
                          }}
                          style={{ 
                            flex: '1 1 0%', 
                            background: 'transparent',
                            border: 'none',
                          fontSize: '16px',
                          fontWeight: 'bold',
                            textAlign: 'right',
                            padding: '0px',
                            marginLeft: '8px',
                            color: swapDirection === 'ETH_TO_GM' ? 'rgb(255, 184, 0)' : 'rgb(0, 212, 255)',
                            cursor: 'text'
                          }}
                        />
                        </div>
                      </div>
                    <button
                      disabled={!isConnected}
                      className="modern-btn"
                      style={{ 
                        width: '100%',
                        background: isConnected ? 'linear-gradient(135deg, rgb(0, 255, 136), rgb(0, 212, 255))' : 'rgb(102, 102, 102)', 
                        fontSize: '16px',
                        fontWeight: '700',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: isConnected ? 'pointer' : 'not-allowed', 
                        transition: '0.3s' 
                      }}
                      onClick={async () => {
                        if (!isConnected) {
                          try {
                            await connectWallet();
                          } catch (error) {
                            console.error('❌ Connect wallet error:', error);
                          }
                        } else {
                          // Trigger swap based on direction
                        console.log('🔄 Swap button clicked, direction:', swapDirection);
                        if (swapDirection === 'ETH_TO_GM') {
                          if (window.swapETHForGM) {
                            console.log('🔄 Calling swapETHForGM with amount:', fromAmount);
                            window.swapETHForGM(fromAmount);
                          } else {
                            console.log('⚠️ swapETHForGM function not available');
                          }
                        } else {
                          if (window.swapGMForETH) {
                            console.log('🔄 Calling swapGMForETH (FHE Confidential) with amount:', fromAmount);
                            window.swapGMForETH(fromAmount);
                          } else {
                            console.log('⚠️ swapGMForETH function not available');
                          }
                        }
                        }
                      }}
                    >
                        {isConnected ? 
                          (swapDirection === 'ETH_TO_GM' ? '🔄 Swap ETH for GM (Public)' : '🔐 Swap GM for ETH (FHE)') : 
                          '🔒 Connect Wallet'}
                    </button>
                  </div>
                  <div style={{ 
                    marginTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)' 
                  }}>
                    <span>💡 Rate: {swapDirection === 'ETH_TO_GM' ? '0.001 ETH = 100 GM (1 ETH = 100,000 GM) | Public' : '100 GM = 0.001 ETH (1 GM = 0.00001 ETH) | FHE Confidential'} | Fee: 0.3%</span>
                    <span style={{ color: 'rgb(0, 212, 255)' }}>⚡ Instant</span>
                    </div>

                    {/* Pool Management Section */}
                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: '12px', 
                      padding: '16px', 
                    marginTop: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: 'rgb(0, 212, 255)'
                    }}>🏦 Pool Management</h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                        <div style={{ 
                          background: 'rgba(0, 212, 255, 0.1)', 
                          padding: '8px', 
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                        <div style={{ fontSize: '12px', color: 'rgb(0, 212, 255)' }}>ETH Pool</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          {(() => {
                            // Debug log removed
                            return poolBalances.ethPool.toFixed(3);
                          })()} ETH
                        </div>
                        </div>
                        <div style={{ 
                          background: 'rgba(255, 184, 0, 0.1)', 
                          padding: '8px', 
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                        <div style={{ fontSize: '12px', color: 'rgb(255, 184, 0)' }}>GM Pool</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          {(() => {
                            // Debug log removed
                            return poolBalances.gmTokenPool.toFixed(0);
                          })()} GM
                        </div>
                        </div>
                      </div>

                    {/* Add Liquidity Form */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ 
                        display: 'block', 
                            fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '8px', 
                        fontWeight: '600' 
                      }}>Add ETH Amount</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="0.25"
                        value={liquidityETH}
                        onChange={(e) => {
                          const value = e.target.value;
                          setLiquidityETH(value);
                          // Auto-calculate GM amount based on rate (1 ETH = 100,000 GM)
                          const num = parseFloat(value) || 0;
                          setLiquidityGM((num * RATE).toString());
                        }}
                          style={{ 
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(0, 212, 255, 0.3)',
                            borderRadius: '6px',
                          padding: '8px 12px',
                          color: 'rgb(0, 212, 255)',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginBottom: '8px'
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ 
                        display: 'block', 
                            fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '8px', 
                        fontWeight: '600' 
                      }}>Add GM Amount</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="25000"
                        value={liquidityGM}
                        onChange={(e) => {
                          const value = e.target.value;
                          setLiquidityGM(value);
                          // Auto-calculate ETH amount based on rate (1 ETH = 100,000 GM)
                          const num = parseFloat(value) || 0;
                          setLiquidityETH((num / RATE).toString());
                        }}
                          style={{ 
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 184, 0, 0.3)',
                            borderRadius: '6px',
                          padding: '8px 12px',
                          color: 'rgb(255, 184, 0)',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginBottom: '8px'
                        }}
                      />
                    </div>

                    <button
                      className="modern-btn"
                      style={{ 
                        width: '100%',
                        fontSize: '14px',
                        padding: '10px',
                        background: 'linear-gradient(135deg, rgb(0, 255, 136), rgb(0, 212, 255))',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                      onClick={() => {
                        if (window.addLiquidityWithAmounts) {
                          console.log('🏊 Calling addLiquidityWithAmounts with:', liquidityETH, 'ETH,', liquidityGM, 'GM');
                          window.addLiquidityWithAmounts(liquidityETH, liquidityGM);
                        } else if (window.addLiquidity) {
                          console.log('🏊 Calling addLiquidity with default amounts...');
                          window.addLiquidity();
                        } else {
                          console.log('⚠️ addLiquidity function not available');
                        }
                      }}
                    >
                      🏊 Add Liquidity ({liquidityETH} ETH + {liquidityGM} GM)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Check-in */}
            <div className="glass-card" style={{ marginBottom: '30px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '15px' 
              }}>
                <h2 style={{ color: 'rgb(0, 212, 255)', margin: '0px' }}>✅ Daily Check-in</h2>
                <div style={{ 
                  fontSize: '11px', 
                  padding: '4px 8px', 
                  borderRadius: '8px',
                  background: 'rgba(255, 84, 89, 0.15)', 
                  color: 'rgb(255, 84, 89)', 
                  border: '1px solid rgb(255, 84, 89)' 
                }}>⚠️ FHE Required</div>
                </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px', 
                marginBottom: '20px' 
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    marginBottom: '8px' 
                  }}>Status</div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: checkInStatus === 'completed' ? 'rgb(0, 255, 136)' : 
                           checkInStatus === 'ready' ? 'rgb(0, 212, 255)' : 'rgb(255, 71, 87)', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    {checkInStatus === 'completed' ? '✅ Checked in today' : 
                     checkInStatus === 'ready' ? '🔄 Ready to check-in' : '❌ Not checked in'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    marginBottom: '8px' 
                  }}>Next reset in</div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: 'rgb(0, 212, 255)', 
                    fontFamily: 'monospace',
                    background: 'rgba(0, 212, 255, 0.1)', 
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 212, 255, 0.3)' 
                  }}>{countdownTimer}</div>
                </div>
              </div>
              <button 
                id="dailyCheckInBtn"
                disabled={!isConnected || checkInStatus === 'completed' || checkInStatus === 'loading'}
                className="modern-btn"
                style={{ 
                  width: '100%',
                  background: checkInStatus === 'completed' ? 'rgb(102, 102, 102)' :
                             checkInStatus === 'loading' ? 'linear-gradient(135deg, rgb(255, 193, 7), rgb(255, 152, 0))' :
                             isConnected ? 'linear-gradient(135deg, rgb(0, 255, 136), rgb(0, 212, 255))' : 'rgb(102, 102, 102)', 
                  fontSize: '16px',
                  fontWeight: '700',
                  padding: '12px',
                  cursor: (!isConnected || checkInStatus === 'completed' || checkInStatus === 'loading') ? 'not-allowed' : 'pointer',
                  transition: '0.3s',
                  opacity: checkInStatus === 'loading' ? 0.8 : 1
                }}
                onClick={async () => {
                  if (!isConnected) {
                    try {
                      await connectWallet();
                    } catch (error) {
                      console.error('❌ Connect wallet error:', error);
                    }
                  } else if (checkInStatus === 'ready') {
                    // Set loading state
                    setCheckInStatus('loading');
                    
                    // Trigger daily check-in
                    if (window.dailyCheckIn) {
                      try {
                        await window.dailyCheckIn();
                        // Refresh status after check-in
                        setTimeout(() => {
                          checkDailyCheckInStatus();
                        }, 2000);
                      } catch (error) {
                        console.error('❌ Daily check-in failed:', error);
                        // Reset to ready state on error
                        setCheckInStatus('ready');
                      }
                    } else {
                      console.log('🔔 Daily check-in function not available');
                      setCheckInStatus('ready');
                    }
                  }
                }}
              >
                {checkInStatus === 'completed' ? '✅ Checked in today' :
                 checkInStatus === 'loading' ? '⏳ Sending transaction...' :
                 isConnected ? '🔄 Daily Check-in' : '🔒 Connect Wallet'}
              </button>
              <p style={{ 
                  fontSize: '11px', 
                color: 'rgba(255, 255, 255, 0.5)', 
                textAlign: 'center', 
                marginTop: '8px' 
              }}>💡 Daily rewards: 100 GM tokens</p>
              </div>
              
            {/* Latest News */}
            <div className="news-section">
              <h3>📰 Latest News</h3>
              <div className="news-grid">
                {newsData.slice(0, 4).map((news: any, index: number) => (
                  <div key={index} className="news-card" onClick={() => window.open(news.link, '_blank')}>
                    {news.imageUrl && (
                      <div className="news-image-container">
                        <img 
                          src={news.imageUrl} 
                          alt={news.title}
                          className="news-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                          </div>
                        )}
                    <div className="news-content">
                      <div className="news-header">
                        <span className="news-source">{news.source}</span>
                        <span className="news-time">{news.timeAgo}</span>
                        </div>
                      <h4>{news.title}</h4>
                      <p>{news.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            {/* Market Overview */}
            <div className="market-section">
            <div className="market-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Top Gainers */}
                <div className="glass-card">
                  <h3 style={{ color: '#00ff88', marginBottom: '10px', fontSize: '16px' }}>📈 Top Gainers</h3>
                  <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                    {topGainers.map((coin, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>
                            {coin.symbol}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                            {coin.name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', color: '#ffffff' }}>{coin.price}</div>
                          <div style={{ fontSize: '11px', color: '#00ff88' }}>{coin.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Losers */}
                <div className="glass-card">
                  <h3 style={{ color: '#ff4757', marginBottom: '10px', fontSize: '16px' }}>📉 Top Losers</h3>
                  <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                    {topLosers.map((coin, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600' }}>
                            {coin.symbol}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                            {coin.name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', color: '#ffffff' }}>{coin.price}</div>
                          <div style={{ fontSize: '11px', color: '#ff4757' }}>{coin.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== SWAP PAGE ========== */}
        {currentPage === 'swap' && (
          <div className="page">
            <div className="page-header">
              <h1>🔄 Token Swap</h1>
              <p>Exchange ETH and GM tokens with FHE privacy</p>
            </div>

            {/* Token Balances Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              {/* Token Balances */}
              <div className="glass-card" style={{ 
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 184, 0, 0.1) 100%)', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                position: 'relative' 
              }}>
                <h2 style={{ 
                  color: 'rgb(0, 212, 255)', 
                  marginBottom: '20px', 
                  background: 'linear-gradient(135deg, rgb(0, 212, 255) 0%, rgb(255, 184, 0) 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent', 
                  fontSize: '18px', 
                  fontWeight: '700' 
                }}>💰 Token Balances</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    borderRadius: '12px', 
                    padding: '16px', 
                    border: '1px solid rgba(0, 212, 255, 0.2)' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          background: 'linear-gradient(135deg, rgb(0, 212, 255), rgb(157, 78, 221))', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '18px', 
                          fontWeight: 'bold' 
                        }}>Ξ</div>
                        <div>
                          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Ethereum</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'rgb(0, 212, 255)' }}>{ethBalance} ETH</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Sepolia</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Testnet</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    background: 'rgba(0, 0, 0, 0.2)', 
                    borderRadius: '12px', 
                    padding: '16px', 
                    border: '1px solid rgba(255, 184, 0, 0.2)' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          background: 'linear-gradient(135deg, rgb(255, 184, 0), rgb(255, 107, 0))', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '16px', 
                          fontWeight: 'bold', 
                          color: 'rgb(0, 0, 0)' 
                        }}>G</div>
                        <div>
                          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>GM Tokens</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'rgb(255, 184, 0)' }}>{userPublicBalance} GM</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>📊 Public: {userPublicBalance} GM</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>FHE</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Encrypted</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    background: 'rgba(0, 212, 255, 0.1)', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    border: '1px solid rgba(0, 212, 255, 0.2)', 
                    textAlign: 'center' 
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>💡 GM Tokens are FHE encrypted</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Only you can decrypt with your private key</div>
                  </div>
                  
                </div>
              </div>

              {/* ETH → GM Token Swap */}
              <div className="glass-card" style={{ 
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)', 
                border: '1px solid rgba(157, 78, 221, 0.3)', 
                position: 'relative', 
                overflow: 'hidden' 
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-50%', 
                  right: '-50%', 
                  width: '200%', 
                  height: '200%', 
                  background: 'radial-gradient(circle, rgba(157, 78, 221, 0.05) 0%, transparent 70%)', 
                  animation: 'rotate 20s linear infinite', 
                  pointerEvents: 'none' 
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h2 style={{ 
                    color: 'rgb(0, 212, 255)', 
                    marginBottom: '20px', 
                    background: 'linear-gradient(135deg, rgb(157, 78, 221) 0%, rgb(0, 212, 255) 100%)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent', 
                    fontSize: '18px', 
                    fontWeight: '700' 
                  }}>🔄 ETH → GM Token Swap</h2>
                  <div style={{ 
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '8px',
                    background: 'rgba(255, 84, 89, 0.15)', 
                    color: 'rgb(255, 84, 89)', 
                    border: '1px solid rgb(255, 84, 89)', 
                    display: 'inline-block', 
                    marginTop: '8px' 
                  }}>⚠️ FHE Required</div>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '12px',
                    padding: '16px', 
                    border: '1px solid rgba(255, 255, 255, 0.1)' 
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '8px', 
                        fontWeight: '600' 
                      }}>From</label>
                <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: '8px',
                        padding: '8px 12px' 
                }}>
                  <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          background: swapDirection === 'ETH_TO_GM' ? 'linear-gradient(135deg, rgb(0, 212, 255), rgb(0, 153, 204))' : 'linear-gradient(135deg, rgb(255, 184, 0), rgb(255, 107, 0))', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                    fontSize: '12px', 
                          fontWeight: 'bold', 
                          marginRight: '8px' 
                  }}>
                          {swapDirection === 'ETH_TO_GM' ? 'Ξ' : 'G'}
                  </div>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>
                          {swapDirection === 'ETH_TO_GM' ? 'ETH' : 'GM Tokens'}
                        </span>
                        <input
                          type="number"
                          className="form-input"
                          step="0.001" 
                          min="0.001" 
                          placeholder={swapDirection === 'ETH_TO_GM' ? '0.001' : '100'} 
                          value={fromAmount}
                          onChange={(e) => {
                            setFromAmount(e.target.value);
                            // Auto-calculate to amount based on direction
                            if (swapDirection === 'ETH_TO_GM') {
                              const ethValue = parseFloat(e.target.value) || 0;
                              setToAmount((ethValue * 100000).toString());
                            } else {
                              const gmValue = parseFloat(e.target.value) || 0;
                              setToAmount((gmValue / 100000).toString());
                            }
                          }}
                          style={{ 
                            flex: '1 1 0%', 
                            background: 'transparent',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            padding: '0px', 
                            marginLeft: '8px',
                            color: swapDirection === 'ETH_TO_GM' ? 'rgb(0, 212, 255)' : 'rgb(255, 184, 0)'
                          }}
                        />
                  </div>
                </div>
                    <div style={{ textAlign: 'center', margin: '8px 0px', position: 'relative' }}>
                  <button 
                        onClick={() => {
                          setSwapDirection(prev => {
                            const newDirection = prev === 'ETH_TO_GM' ? 'GM_TO_ETH' : 'ETH_TO_GM';
                            // Reset amounts when switching direction
                            if (newDirection === 'ETH_TO_GM') {
                              setFromAmount('0.001');
                              setToAmount('100');
                            } else {
                              setFromAmount('100');
                              setToAmount('0.001');
                            }
                            return newDirection;
                          });
                        }}
                    style={{
                          background: 'transparent', 
                      border: 'none',
                      cursor: 'pointer',
                          padding: '8px', 
                          borderRadius: '50%', 
                          transition: '0.3s', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          margin: '0px auto', 
                          fontSize: '24px', 
                          color: 'rgb(0, 212, 255)', 
                          transform: 'rotate(0deg)' 
                        }}
                      >↕️</button>
            </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '8px', 
                        fontWeight: '600' 
                      }}>To</label>
                  <div style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: '8px',
                        padding: '8px 12px' 
                      }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          background: swapDirection === 'ETH_TO_GM' ? 'linear-gradient(135deg, rgb(255, 184, 0), rgb(255, 107, 0))' : 'linear-gradient(135deg, rgb(0, 212, 255), rgb(0, 153, 204))', 
                          borderRadius: '50%', 
                            display: 'flex',
                            alignItems: 'center',
                          justifyContent: 'center', 
                    fontSize: '12px', 
                          fontWeight: 'bold', 
                          marginRight: '8px' 
                        }}>
                          {swapDirection === 'ETH_TO_GM' ? 'G' : 'Ξ'}
          </div>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>
                          {swapDirection === 'ETH_TO_GM' ? 'GM Tokens' : 'ETH'}
                        </span>
                  <input 
                          type="number"
                          className="form-input"
                          step={swapDirection === 'ETH_TO_GM' ? '1' : '0.001'}
                          min={swapDirection === 'ETH_TO_GM' ? '1' : '0.001'}
                          placeholder={swapDirection === 'ETH_TO_GM' ? '100' : '0.001'}
                          value={toAmount}
                          readOnly={false}
                          disabled={false}
                    onChange={(e) => {
                            console.log('🔄 To input changed:', e.target.value);
                            const value = e.target.value;
                            setToAmount(value);
                            // Auto-calculate from amount based on direction
                            const num = parseFloat(value) || 0;
                            if (swapDirection === 'ETH_TO_GM') {
                              // To is GM, From is ETH
                              setFromAmount((num / RATE).toString());
                            } else {
                              // To is ETH, From is GM
                              setFromAmount((num * RATE).toString());
                            }
                          }}
                    style={{ 
                            flex: '1 1 0%', 
                            background: 'transparent',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            padding: '0px',
                            marginLeft: '8px',
                            color: swapDirection === 'ETH_TO_GM' ? 'rgb(255, 184, 0)' : 'rgb(0, 212, 255)',
                            cursor: 'text'
                          }}
                        />
                          </div>
                        </div>
                  <button 
                      disabled={!isConnected}
                              className="modern-btn" 
                    style={{
                        width: '100%', 
                        background: isConnected ? 'linear-gradient(135deg, rgb(0, 255, 136), rgb(0, 212, 255))' : 'rgb(102, 102, 102)', 
                        fontSize: '16px', 
                        fontWeight: '700', 
                        padding: '12px', 
                        borderRadius: '8px', 
                      border: 'none',
                        cursor: isConnected ? 'pointer' : 'not-allowed', 
                        transition: '0.3s' 
                      }}
                      onClick={async () => {
                        if (!isConnected) {
                          try {
                            await connectWallet();
                          } catch (error) {
                            console.error('❌ Connect wallet error:', error);
                          }
                        } else {
                          // Trigger swap based on direction
                        console.log('🔄 Swap button clicked, direction:', swapDirection);
                        if (swapDirection === 'ETH_TO_GM') {
                          if (window.swapETHForGM) {
                            console.log('🔄 Calling swapETHForGM...');
                            window.swapETHForGM();
                          } else {
                            console.log('⚠️ swapETHForGM function not available');
                          }
                        } else {
                          if (window.swapGMForETH) {
                            console.log('🔄 Calling swapGMForETH (FHE Confidential)...');
                            window.swapGMForETH();
                          } else {
                            console.log('⚠️ swapGMForETH function not available');
                          }
                        }
                        }
                      }}
                    >
                        {isConnected ? 
                          (swapDirection === 'ETH_TO_GM' ? '🔄 Swap ETH for GM (Public)' : '🔐 Swap GM for ETH (FHE)') : 
                          '🔒 Connect Wallet'}
                  </button>
                </div>
                  <div style={{
                    marginTop: '12px', 
                            display: 'flex',
                    justifyContent: 'space-between', 
                            alignItems: 'center',
                    fontSize: '12px', 
                    color: 'rgba(255, 255, 255, 0.6)' 
                  }}>
                    <span>💡 Rate: {swapDirection === 'ETH_TO_GM' ? '0.001 ETH = 100 GM (1 ETH = 100,000 GM) | Public' : '100 GM = 0.001 ETH (1 GM = 0.00001 ETH) | FHE Confidential'} | Fee: 0.3%</span>
                    <span style={{ color: 'rgb(0, 212, 255)' }}>⚡ Instant</span>
                            </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

        {/* ========== NEWS PAGE ========== */}
        {currentPage === 'news' && (
          <div className="page">
            <div className="page-header">
              <h1>📰 Crypto News</h1>
              <p>Latest updates from the crypto world</p>
                </div>
            
            <div className="news-container">
              <div className="news-filters">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <h3 style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', margin: 0 }}>
                    Showing {getFilteredNews().length} of {getFilteredNewsCount()} articles
                    {Object.keys(feedStats).length > 0 && (
                      <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '8px' }}>
                        (Total: {Object.values(feedStats).reduce((sum, count) => sum + count, 0)} from feeds)
                              </span>
                    )}
                  </h3>
                  {Object.keys(feedStats).length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      {Object.entries(feedStats).map(([source, count]) => {
                        const displayedFromSource = newsData.filter((news: any) => news.source === source).length;
                        const remainingFromSource = count - displayedFromSource;
                        return (
                          <span key={source} style={{ 
                            background: remainingFromSource > 0 ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            border: `1px solid ${remainingFromSource > 0 ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
                            color: remainingFromSource > 0 ? '#00d4ff' : 'rgba(255, 255, 255, 0.6)'
                          }}>
                            {source}: {displayedFromSource}/{count} {remainingFromSource > 0 && `(+${remainingFromSource})`}
                          </span>
                        );
                      })}
                            </div>
        )}
                  {newsFilter !== 'All' && (
                            <button 
                      onClick={() => handleFilterChange('All')}
                              style={{ 
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Filter
                            </button>
                          )}
                        </div>
                <button 
                  className={`filter-btn ${newsFilter === 'All' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('All')}
                >
                  All ({newsData.length})
                </button>
                <button 
                  className={`filter-btn ${newsFilter === 'Bitcoin' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('Bitcoin')}
                >
                  Bitcoin ({newsData.filter((n: any) => n.title.toLowerCase().includes('bitcoin') || n.description.toLowerCase().includes('bitcoin')).length})
                </button>
                <button 
                  className={`filter-btn ${newsFilter === 'Ethereum' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('Ethereum')}
                >
                  Ethereum ({newsData.filter((n: any) => n.title.toLowerCase().includes('ethereum') || n.description.toLowerCase().includes('ethereum')).length})
                </button>
                <button 
                  className={`filter-btn ${newsFilter === 'DeFi' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('DeFi')}
                >
                  DeFi ({newsData.filter((n: any) => n.title.toLowerCase().includes('defi') || n.description.toLowerCase().includes('defi')).length})
                </button>
                <button 
                  className={`filter-btn ${newsFilter === 'NFT' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('NFT')}
                >
                  NFT ({newsData.filter((n: any) => n.title.toLowerCase().includes('nft') || n.description.toLowerCase().includes('nft')).length})
                </button>
                <button 
                  className={`filter-btn ${newsFilter === 'FHE' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('FHE')}
                >
                  FHE ({newsData.filter((n: any) => n.title.toLowerCase().includes('fhe') || n.description.toLowerCase().includes('fhe')).length})
                    </button>
                    </div>
              
              {isLoadingNews ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
                  <p>Loading news...</p>
                </div>
              ) : getFilteredNews().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '16px' }}>📰</div>
                  <h3>No news found</h3>
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginTop: '8px' }}>
                    Try selecting a different filter or check back later
              </div>
          </div>
              ) : (
                <div className={`news-grid ${getFilteredNews().length === 1 ? 'single-news' : ''}`}>
                  {getFilteredNews().map((news: any, index: number) => (
                    <div key={index} className="news-card" onClick={() => window.open(news.link, '_blank')}>
                      {news.imageUrl && (
                        <div className="news-image-container">
                          <img 
                            src={news.imageUrl} 
                            alt={news.title}
                            className="news-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
          </div>
        )}
                      <div className="news-content">
                        <div className="news-header">
                          <span className="news-source">{news.source}</span>
                          <span className="news-time">{news.timeAgo}</span>
              </div>
                        <h3>{news.title}</h3>
                        <p>{news.description}</p>
                        <div className="news-tags">
                          <span className="tag">{news.source}</span>
                          <span className="tag">Crypto</span>
                          <span className="tag">News</span>
              </div>
                      </div>
                    </div>
                  ))}
          </div>
        )}

              <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '40px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={loadMoreNews}
                  disabled={displayedNewsCount >= getFilteredNewsCount()}
                  style={{
                    background: 'linear-gradient(135deg, rgb(0, 212, 255), rgb(157, 78, 221))',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '10px 20px',
                    cursor: displayedNewsCount >= getFilteredNewsCount() ? 'not-allowed' : 'pointer',
                    opacity: displayedNewsCount >= getFilteredNewsCount() ? 0.6 : 1
                  }}
                >
                  {displayedNewsCount >= getFilteredNewsCount() ? '✅ All Loaded' : `📰 Load More (${getFilteredNewsCount() - displayedNewsCount} remaining)`}
                    </button>
                  </div>
            </div>
          </div>
        )}

        {/* ========== AI RESEARCH PAGE ========== */}
        {currentPage === 'research' && (
          <div className="page">
            {/* Debug log removed */}
            <AIResearchTool setCurrentPage={setCurrentPage} />
          </div>
        )}
        
      {/* Debug panel removed */}
      </div>
    </div>
  );
};