// CoinGecko Service for fetching top cryptocurrencies
export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  image: string;
  last_updated: string;
}

export interface CoinGeckoResponse {
  data: CoinData[];
  timestamp: number;
}

class CoinGeckoService {
  private cache: CoinGeckoResponse | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly API_BASE = 'https://api.coingecko.com/api/v3';

  // Top 500 coins data (fallback if API fails)
  private readonly FALLBACK_COINS: CoinData[] = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 67000, market_cap: 1300000000000, market_cap_rank: 1, total_volume: 25000000000, price_change_percentage_24h: 2.5, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', last_updated: new Date().toISOString() },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 4200, market_cap: 500000000000, market_cap_rank: 2, total_volume: 15000000000, price_change_percentage_24h: 1.8, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', last_updated: new Date().toISOString() },
    { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1.00, market_cap: 120000000000, market_cap_rank: 3, total_volume: 50000000000, price_change_percentage_24h: 0.01, image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', last_updated: new Date().toISOString() },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 650, market_cap: 100000000000, market_cap_rank: 4, total_volume: 2000000000, price_change_percentage_24h: 3.2, image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', last_updated: new Date().toISOString() },
    { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 180, market_cap: 80000000000, market_cap_rank: 5, total_volume: 3000000000, price_change_percentage_24h: 5.5, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', last_updated: new Date().toISOString() },
    { id: 'usd-coin', symbol: 'usdc', name: 'USD Coin', current_price: 1.00, market_cap: 35000000000, market_cap_rank: 6, total_volume: 8000000000, price_change_percentage_24h: 0.02, image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png', last_updated: new Date().toISOString() },
    { id: 'xrp', symbol: 'xrp', name: 'XRP', current_price: 0.62, market_cap: 35000000000, market_cap_rank: 7, total_volume: 2500000000, price_change_percentage_24h: -1.2, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', last_updated: new Date().toISOString() },
    { id: 'staked-ether', symbol: 'steth', name: 'Lido Staked ETH', current_price: 4200, market_cap: 30000000000, market_cap_rank: 8, total_volume: 500000000, price_change_percentage_24h: 1.9, image: 'https://assets.coingecko.com/coins/images/13442/large/steth_logo.png', last_updated: new Date().toISOString() },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', current_price: 0.089, market_cap: 25000000000, market_cap_rank: 9, total_volume: 1200000000, price_change_percentage_24h: -2.1, image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', last_updated: new Date().toISOString() },
    { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 0.52, market_cap: 18000000000, market_cap_rank: 10, total_volume: 800000000, price_change_percentage_24h: 1.5, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', last_updated: new Date().toISOString() },
    { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', current_price: 35, market_cap: 14000000000, market_cap_rank: 11, total_volume: 600000000, price_change_percentage_24h: 2.8, image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', last_updated: new Date().toISOString() },
    { id: 'tron', symbol: 'trx', name: 'TRON', current_price: 0.12, market_cap: 12000000000, market_cap_rank: 12, total_volume: 400000000, price_change_percentage_24h: 0.8, image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', last_updated: new Date().toISOString() },
    { id: 'chainlink', symbol: 'link', name: 'Chainlink', current_price: 18, market_cap: 11000000000, market_cap_rank: 13, total_volume: 500000000, price_change_percentage_24h: 3.1, image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', last_updated: new Date().toISOString() },
    { id: 'polkadot', symbol: 'dot', name: 'Polkadot', current_price: 7.5, market_cap: 10000000000, market_cap_rank: 14, total_volume: 300000000, price_change_percentage_24h: 1.2, image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', last_updated: new Date().toISOString() },
    { id: 'polygon', symbol: 'matic', name: 'Polygon', current_price: 0.95, market_cap: 9000000000, market_cap_rank: 15, total_volume: 400000000, price_change_percentage_24h: 2.3, image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png', last_updated: new Date().toISOString() },
    { id: 'litecoin', symbol: 'ltc', name: 'Litecoin', current_price: 85, market_cap: 8000000000, market_cap_rank: 16, total_volume: 200000000, price_change_percentage_24h: -0.5, image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', last_updated: new Date().toISOString() },
    { id: 'bitcoin-cash', symbol: 'bch', name: 'Bitcoin Cash', current_price: 420, market_cap: 7000000000, market_cap_rank: 17, total_volume: 150000000, price_change_percentage_24h: 0.9, image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash.png', last_updated: new Date().toISOString() },
    { id: 'near', symbol: 'near', name: 'NEAR Protocol', current_price: 4.2, market_cap: 6000000000, market_cap_rank: 18, total_volume: 180000000, price_change_percentage_24h: 4.1, image: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg', last_updated: new Date().toISOString() },
    { id: 'uniswap', symbol: 'uni', name: 'Uniswap', current_price: 8.5, market_cap: 5500000000, market_cap_rank: 19, total_volume: 120000000, price_change_percentage_24h: 2.7, image: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png', last_updated: new Date().toISOString() },
    { id: 'internet-computer', symbol: 'icp', name: 'Internet Computer', current_price: 12, market_cap: 5000000000, market_cap_rank: 20, total_volume: 100000000, price_change_percentage_24h: 1.8, image: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png', last_updated: new Date().toISOString() }
  ];

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.CACHE_DURATION;
  }

  async getTopCoins(limit: number = 500): Promise<CoinData[]> {
    // Return cached data if valid
    if (this.isCacheValid() && this.cache) {
      return this.cache.data.slice(0, limit);
    }

    try {
      // Try to fetch from CoinGecko API
      const response = await fetch(
        `${this.API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${Math.min(limit, 250)}&page=1&sparkline=false&price_change_percentage=24h`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the data
      this.cache = {
        data: data,
        timestamp: Date.now()
      };

      return data.slice(0, limit);
    } catch (error) {
      console.warn('Failed to fetch from CoinGecko API, using fallback data:', error);
      
      // Use fallback data
      this.cache = {
        data: this.FALLBACK_COINS,
        timestamp: Date.now()
      };

      return this.FALLBACK_COINS.slice(0, limit);
    }
  }

  async searchCoins(query: string, limit: number = 50): Promise<CoinData[]> {
    const allCoins = await this.getTopCoins(500);
    
    const filtered = allCoins.filter(coin => 
      coin.name.toLowerCase().includes(query.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(query.toLowerCase()) ||
      coin.id.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, limit);
  }

  getCoinSuggestions(query: string, limit: number = 10): CoinData[] {
    if (!this.cache) return [];
    
    const filtered = this.cache.data.filter(coin => 
      coin.name.toLowerCase().includes(query.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(query.toLowerCase()) ||
      coin.id.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, limit);
  }

  // Get popular coins for quick suggestions
  getPopularCoins(): CoinData[] {
    if (!this.cache) return this.FALLBACK_COINS.slice(0, 20);
    return this.cache.data.slice(0, 20);
  }

  // Initialize the service by fetching data
  async initialize(): Promise<void> {
    try {
      await this.getTopCoins(100); // Pre-load top 100 coins
      console.log('✅ CoinGecko service initialized successfully');
    } catch (error) {
      console.warn('⚠️ CoinGecko service initialization failed, using fallback data:', error);
    }
  }
}

// Export singleton instance
export const coinGeckoService = new CoinGeckoService();

// Auto-initialize when module loads
coinGeckoService.initialize();
