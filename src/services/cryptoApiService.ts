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
  private baseUrl = 'https://api.coingecko.com/api/v3';
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
        per_page: Math.min(limit, 300),
        page: 1,
        sparkline: true,
        price_change_percentage: '24h,7d,30d'
      };
      const apiKey = process.env.REACT_APP_COINCHECKGO_API_KEY;
      const paramsWithKey = apiKey ? { ...paramsBase, x_cg_demo_api_key: apiKey } : paramsBase;

      let response = await axios.get(`${this.baseUrl}/coins/markets`, { params: paramsWithKey });
      let data = response.data as CryptoData[];

      // If API returns fewer than requested, try aggregating multiple pages without key
      if (!data || data.length < limit) {
        const pages = [1, 2, 3];
        const results = await Promise.all(
          pages.map((p) =>
            axios.get(`${this.baseUrl}/coins/markets`, {
              params: { ...paramsBase, per_page: 100, page: p }
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
          sparkline: true,
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
      const apiKey = process.env.REACT_APP_COINCHECKGO_API_KEY;
      const response = await axios.get(`${this.baseUrl}/coins/${id}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: true,
          ...(apiKey ? { x_cg_demo_api_key: apiKey } : {})
        }
      });

      const data = response.data;
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      // Retry once without api key and with lighter fields
      try {
        const response = await axios.get(`${this.baseUrl}/coins/${id}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false
          }
        });
        const data = response.data;
        this.setCachedData(cacheKey, data);
        return data;
      } catch (e) {
        // Final fallback to markets endpoint by id (minimal data) to bypass 429
        try {
          const res = await axios.get(`${this.baseUrl}/coins/markets`, {
            params: { vs_currency: 'usd', ids: id }
          });
          const arr = res.data || [];
          if (arr.length > 0) {
            this.setCachedData(cacheKey, arr[0]);
            return arr[0];
          }
        } catch {}
        console.error(`Error fetching details for ${id}:`, error);
        throw new Error(`Failed to fetch details for ${id}`);
      }
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
