// CryptoRank Service for Fundamentals data
import axios from 'axios';

export interface CryptoRankFundamentals {
  tvl: number;
  tvl_change_7d: number;
  tvl_change_30d: number;
  next_unlock: string;
  next_unlock_amount: number;
  next_unlock_percentage: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  market_cap_dominance: number;
  fully_diluted_valuation: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
  price_change_7d: number;
  price_change_30d: number;
  price_change_1y: number;
}

class CryptoRankService {
  private baseUrl = 'https://api.coinranking.com/v2';
  private apiKey: string;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.apiKey = process.env.REACT_APP_COINRANKING_API_KEY || '';
    if (!this.apiKey) {
      console.warn('CryptoRank API key not found. Using fallback data.');
    }
  }

  async getFundamentals(symbol: string): Promise<CryptoRankFundamentals> {
    const cacheKey = `cr_fundamentals_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Search for coin by symbol
      const searchResponse = await axios.get(`${this.baseUrl}/search-suggestions`, {
        params: { query: symbol },
        headers: this.apiKey ? { 'x-access-token': this.apiKey } : {}
      });

      const coins = searchResponse.data?.data?.coins || [];
      if (coins.length === 0) {
        throw new Error('Coin not found');
      }

      const coin = coins[0];
      const coinId = coin.uuid;

      // Get detailed coin data
      const coinResponse = await axios.get(`${this.baseUrl}/coin/${coinId}`, {
        headers: this.apiKey ? { 'x-access-token': this.apiKey } : {}
      });

      const coinData = coinResponse.data?.data?.coin || {};
      const price = parseFloat(coinData.price || '0');
      const marketCap = parseFloat(coinData.marketCap || '0');
      const circulatingSupply = parseFloat(coinData.circulatingSupply || '0');
      const totalSupply = parseFloat(coinData.totalSupply || '0');
      const maxSupply = parseFloat(coinData.maxSupply || '0');

      const result: CryptoRankFundamentals = {
        tvl: 0, // TVL not available in CoinRanking
        tvl_change_7d: 0,
        tvl_change_30d: 0,
        next_unlock: 'N/A',
        next_unlock_amount: 0,
        next_unlock_percentage: 0,
        circulating_supply: circulatingSupply,
        total_supply: totalSupply,
        max_supply: maxSupply,
        market_cap_dominance: parseFloat(coinData.marketCapDominance || '0'),
        fully_diluted_valuation: maxSupply > 0 ? price * maxSupply : 0,
        ath: parseFloat(coinData.allTimeHigh?.price || '0'),
        ath_change_percentage: parseFloat(coinData.allTimeHigh?.percentage || '0'),
        atl: parseFloat(coinData.allTimeLow?.price || '0'),
        atl_change_percentage: parseFloat(coinData.allTimeLow?.percentage || '0'),
        price_change_7d: parseFloat(coinData.change || '0'),
        price_change_30d: 0, // Not available
        price_change_1y: 0 // Not available
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('CryptoRank fundamentals fetch failed:', error);
      // Return fallback data
      return this.getFallbackFundamentals(symbol);
    }
  }

  private getFallbackFundamentals(symbol: string): CryptoRankFundamentals {
    return {
      tvl: 0,
      tvl_change_7d: 0,
      tvl_change_30d: 0,
      next_unlock: 'N/A',
      next_unlock_amount: 0,
      next_unlock_percentage: 0,
      circulating_supply: 0,
      total_supply: 0,
      max_supply: 0,
      market_cap_dominance: 0,
      fully_diluted_valuation: 0,
      ath: 0,
      ath_change_percentage: 0,
      atl: 0,
      atl_change_percentage: 0,
      price_change_7d: 0,
      price_change_30d: 0,
      price_change_1y: 0
    };
  }

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
}

export const cryptoRankService = new CryptoRankService();

export async function getTopFunds(symbol: string): Promise<Array<{id:number;name:string;investment_stage:string;project_count:number}>> {
  try {
    const apiKey = process.env.REACT_APP_CRYPTORANK_API_KEY || '';
    if (!apiKey) throw new Error('no_api_key');
    // fetch actual data from cryptorank here
    // (example endpoint, replace with your actual one)
    const url = `https://api.cryptorank.io/v1/projects/${symbol}/funds?api_key=${apiKey}`;
    const response = await fetch(url);
    const json = await response.json();
    // map actual API result here as needed
    if (json?.data) return json.data;
    return [];
  } catch(e) {
    // fallback mock
    return [
      {id:1,name:'a16z Crypto',investment_stage:'Series A',project_count:37},
      {id:2,name:'Pantera Capital',investment_stage:'Seed',project_count:22},
      {id:3,name:'Binance Labs',investment_stage:'Strategic',project_count:17},
      {id:4,name:'Alameda Research',investment_stage:'Series B',project_count:12},
      {id:5,name:'Framework Ventures',investment_stage:'Seed',project_count:9}
    ];
  }
}