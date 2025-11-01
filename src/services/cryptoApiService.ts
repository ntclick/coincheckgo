// Crypto API Service - Fetch top 300 cryptocurrencies and market data
import axios from 'axios';

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  image: string;
  high_24h?: number;
  low_24h?: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface MarketData {
  total_market_cap: number;
  total_volume: number;
  market_cap_percentage: { [key: string]: number };
  market_cap_change_percentage_24h_usd: number;
}

class CryptoApiService {
  // Use Vercel proxy to avoid CORS and attach API key server-side
  private baseUrl = '/api/cg';
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Get top cryptocurrencies by market cap
  async getTopCryptocurrencies(limit: number = 300): Promise<CryptoData[]> {
    const cacheKey = `top_crypto_${limit}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Try to get coins with API key if available
      const paramsBase: any = {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: Math.min(limit, 100), // Reduce to avoid 431 errors
        page: 1,
        sparkline: false, // Disable to avoid 431 errors
        price_change_percentage: '24h,7d,30d'
      };
      let response = await axios.get(`${this.baseUrl}/coins/markets`, { params: paramsBase });
      let data = response.data as CryptoData[];

      // If API returns fewer than requested, try aggregating multiple pages without key
      if (!data || data.length < limit) {
        const pages = [1, 2, 3];
        const results = await Promise.all(
          pages.map((p) =>
            axios.get(`${this.baseUrl}/coins/markets`, {
              params: { ...paramsBase, per_page: 100, page: p, sparkline: false }
            }).then(r => r.data as CryptoData[]).catch(() => [])
          )
        );
        const merged = ([] as CryptoData[]).concat(...results);
        // Deduplicate by id
        const seen = new Set<string>();
        data = merged.filter(c => (seen.has(c.id) ? false : (seen.add(c.id), true))).slice(0, limit);
      }

      this.setCachedData(cacheKey, data);
      return data;
    } catch (error: any) {
      // Fallbacks on 401/403/429 or other errors: aggregate 3 pages without key (100 each)
      try {
        const paramsBase: any = {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          sparkline: false, // Disable to avoid 431 errors
          price_change_percentage: '24h,7d,30d'
        };
        const pages = [1, 2, 3];
        const results = await Promise.all(
          pages.map((p) =>
            axios.get(`${this.baseUrl}/coins/markets`, {
              params: { ...paramsBase, page: p }
            }).then(r => r.data as CryptoData[])
          )
        );
        const merged = ([] as CryptoData[]).concat(...results);
        const seen = new Set<string>();
        const data = merged.filter(c => (seen.has(c.id) ? false : (seen.add(c.id), true))).slice(0, limit);
        this.setCachedData(cacheKey, data);
        return data;
      } catch (fallbackError) {
        console.error('Error fetching top cryptocurrencies (fallback):', fallbackError);
        throw new Error('Failed to fetch cryptocurrency data');
      }
    }
  }

  // Get detailed data for a specific cryptocurrency
  async getCryptoDetails(id: string): Promise<any> {
    const cacheKey = `crypto_details_${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/coins/${id}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false // Disable to avoid 431 errors
        }
      });

      const data = response.data;
      const marketData = data.market_data;
      
      // Flatten market_data to match CryptoData interface structure
      if (marketData) {
        // Map all market_data properties to top level
        const flattenedData: any = {
          id: data.id || data.symbol,
          symbol: (data.symbol || '').toUpperCase(),
          name: data.name || data.id,
          image: data.image?.small || data.image || '',
          
          // Price data
          current_price: typeof marketData.current_price === 'object' 
            ? marketData.current_price.usd 
            : marketData.current_price,
          high_24h: typeof marketData.high_24h === 'object' 
            ? marketData.high_24h.usd 
            : marketData.high_24h,
          low_24h: typeof marketData.low_24h === 'object' 
            ? marketData.low_24h.usd 
            : marketData.low_24h,
          
          // Market cap data
          market_cap: typeof marketData.market_cap === 'object' 
            ? marketData.market_cap.usd 
            : marketData.market_cap,
          market_cap_rank: marketData.market_cap_rank || data.market_cap_rank || 0,
          market_cap_change_percentage_24h: marketData.market_cap_change_percentage_24h || 0,
          
          // Volume data
          total_volume: typeof marketData.total_volume === 'object' 
            ? marketData.total_volume.usd 
            : marketData.total_volume,
          
          // Price change percentages
          price_change_percentage_24h: marketData.price_change_percentage_24h || 0,
          price_change_percentage_7d: marketData.price_change_percentage_7d || 0,
          price_change_percentage_30d: marketData.price_change_percentage_30d || 0,
          
          // Supply data
          circulating_supply: marketData.circulating_supply || 0,
          total_supply: marketData.total_supply || 0,
          max_supply: marketData.max_supply || 0,
          
          // ATH/ATL data
          ath: typeof marketData.ath === 'object' 
            ? marketData.ath.usd 
            : marketData.ath,
          ath_change_percentage: marketData.ath_change_percentage || 0,
          ath_date: marketData.ath_date?.usd || marketData.ath_date || '',
          atl: typeof marketData.atl === 'object' 
            ? marketData.atl.usd 
            : marketData.atl,
          atl_change_percentage: marketData.atl_change_percentage || 0,
          atl_date: marketData.atl_date?.usd || marketData.atl_date || '',
          
          // Sparkline data
          sparkline_in_7d: data.sparkline_in_7d || marketData.sparkline_in_7d || { price: [] }
        };
        
        this.setCachedData(cacheKey, flattenedData);
        return flattenedData;
      }
      
      // Fallback: return data as-is if no market_data
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      // Return mock data immediately without retry to reduce API pressure
      console.warn(`Fetching ${id} failed, returning mock data`);
      const mockData = {
        id: id,
        symbol: id.toUpperCase(),
        name: id.charAt(0).toUpperCase() + id.slice(1),
        current_price: 1000,
        market_cap: 1000000000,
        total_volume: 100000000,
        price_change_percentage_24h: 2.5,
        price_change_percentage_7d: 5.0,
        market_cap_rank: 1,
        circulating_supply: 1000000,
        total_supply: 1000000,
        max_supply: 1000000,
        ath: 2000,
        ath_change_percentage: -50,
        ath_date: '2021-11-10T14:24:11.849Z',
        atl: 100,
        atl_change_percentage: 900,
        atl_date: '2015-01-14T00:00:00.000Z',
        image: '',
        high_24h: 1050,
        low_24h: 950,
        sparkline_in_7d: { price: [] }
      };
      this.setCachedData(cacheKey, mockData);
      return mockData;
    }
  }

  // Get global market data
  async getGlobalMarketData(): Promise<MarketData> {
    const cacheKey = 'global_market_data';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/global`);
      const data = response.data.data as MarketData;
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching global market data:', error);
      throw new Error('Failed to fetch global market data');
    }
  }

  // Get price history for charting
  async getPriceHistory(id: string, days: number = 7): Promise<{ prices: [number, number][] }> {
    const cacheKey = `price_history_${id}_${days}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days <= 1 ? 'hourly' : 'daily'
        }
      });

      const data = response.data;
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching price history for ${id}:`, error);
      throw new Error(`Failed to fetch price history for ${id}`);
    }
  }

  // Search cryptocurrencies
  async searchCryptocurrencies(query: string): Promise<CryptoData[]> {
    if (!query.trim()) return [];

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          query: query
        }
      });

      return response.data.coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        market_cap_rank: coin.market_cap_rank,
        image: coin.thumb
      })) as CryptoData[];
    } catch (error) {
      console.error('Error searching cryptocurrencies:', error);
      return [];
    }
  }

  // Get trending cryptocurrencies
  async getTrendingCryptocurrencies(): Promise<CryptoData[]> {
    const cacheKey = 'trending_crypto';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/search/trending`);
      const data = response.data.coins.map((coin: any) => coin.item) as CryptoData[];
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching trending cryptocurrencies:', error);
      return [];
    }
  }

  // Cache management
  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const cryptoApiService = new CryptoApiService();
