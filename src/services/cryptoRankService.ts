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
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // Use API URL from env if available, otherwise default
    this.baseUrl = process.env.REACT_APP_CRYPTORANK_API_URL || 'https://api.cryptorank.io/v2';
    this.apiKey = process.env.REACT_APP_CRYPTORANK_API_KEY || '';
    if (!this.apiKey) {
      console.warn('CryptoRank API key not found. Using fallback data.');
    }
  }

  async getFundamentals(symbol: string): Promise<CryptoRankFundamentals> {
    const cacheKey = `cr_fundamentals_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // CryptoRank API v2: Get currency data by key (symbol)
      // API key should be passed in headers only, NOT in query params (causes 400 Bad Request)
      const params: any = {
        locale: 'en'
      };
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        // CryptoRank API v2: Use headers only (query param api_key causes 400 error)
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        headers['x-api-key'] = this.apiKey;
      }

      // Get currency data from CryptoRank v2
      const currencyResponse = await axios.get(`${this.baseUrl}/currencies/${symbol.toLowerCase()}`, {
        params,
        headers
      });

      const currencyData = currencyResponse.data?.data || {};
      const marketData = currencyData.markets || {};
      
      const price = parseFloat(currencyData.values?.USD?.price || '0');
      const marketCap = parseFloat(currencyData.values?.USD?.marketCap || '0');
      const circulatingSupply = parseFloat(currencyData.circulatingSupply || '0');
      const totalSupply = parseFloat(currencyData.totalSupply || '0');
      const maxSupply = parseFloat(currencyData.maxSupply || '0');
      
      // Calculate market cap dominance (if available)
      const marketCapDominance = marketCap > 0 && currencyData.globalMarketCap 
        ? (marketCap / currencyData.globalMarketCap) * 100 
        : 0;

      // Get ATH/ATL from price history if available
      const ath = parseFloat(currencyData.allTimeHigh?.USD || '0');
      const athChangePercentage = ath > 0 && price > 0 
        ? ((price - ath) / ath) * 100 
        : 0;
      
      const atl = parseFloat(currencyData.allTimeLow?.USD || '0');
      const atlChangePercentage = atl > 0 && price > 0 
        ? ((price - atl) / atl) * 100 
        : 0;

      // Price changes
      const priceChange7d = parseFloat(currencyData.priceChange?.['7d'] || '0');
      const priceChange30d = parseFloat(currencyData.priceChange?.['30d'] || '0');
      const priceChange1y = parseFloat(currencyData.priceChange?.['1y'] || '0');

      const result: CryptoRankFundamentals = {
        tvl: parseFloat(currencyData.tvl || '0'),
        tvl_change_7d: parseFloat(currencyData.tvlChange?.['7d'] || '0'),
        tvl_change_30d: parseFloat(currencyData.tvlChange?.['30d'] || '0'),
        next_unlock: currencyData.nextUnlock?.date || 'N/A',
        next_unlock_amount: parseFloat(currencyData.nextUnlock?.amount || '0'),
        next_unlock_percentage: parseFloat(currencyData.nextUnlock?.percentage || '0'),
        circulating_supply: circulatingSupply,
        total_supply: totalSupply,
        max_supply: maxSupply,
        market_cap_dominance: marketCapDominance,
        fully_diluted_valuation: maxSupply > 0 ? price * maxSupply : 0,
        ath: ath,
        ath_change_percentage: athChangePercentage,
        atl: atl,
        atl_change_percentage: atlChangePercentage,
        price_change_7d: priceChange7d,
        price_change_30d: priceChange30d,
        price_change_1y: priceChange1y
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error: any) {
      // Log error details for debugging
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
      const statusCode = error?.response?.status || error?.code;
      
      // If 404 or 400, coin might not exist in CryptoRank - return fallback gracefully
      if (statusCode === 404 || statusCode === 400) {
        console.warn(`CryptoRank: Coin "${symbol}" not found or invalid (${statusCode}). Using fallback data.`);
      } else {
        console.error(`CryptoRank fundamentals fetch failed for ${symbol}:`, errorMessage, `(Status: ${statusCode})`);
      }
      
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

export async function getTopFunds(symbol: string): Promise<Array<{id:number;name:string;investment_stage:string;project_count:number;isMock?:boolean}>> {
  try {
    const apiKey = process.env.REACT_APP_CRYPTORANK_API_KEY || '';
    if (!apiKey) {
      throw new Error('no_api_key');
    }

    // CryptoRank API v2: Try different endpoints for funds
    // Note: The /funds endpoint may not exist in v2, using alternative approach
    const apiUrl = process.env.REACT_APP_CRYPTORANK_API_URL || 'https://api.cryptorank.io/v2';
    
    // Try with Authorization header instead of query param
    const headers: HeadersInit = {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    };

    // Try endpoint: /v2/currencies/{key}/investors or /v2/currencies/{key}/funds
    let url = `${apiUrl}/currencies/${symbol.toLowerCase()}/investors?locale=en`;
    let response = await fetch(url, { headers });
    
    // If 404, try funds endpoint
    if (response.status === 404) {
      url = `${apiUrl}/currencies/${symbol.toLowerCase()}/funds?locale=en`;
      response = await fetch(url, { headers });
    }
    
    // If still failing, try without sub-path (get from currency data)
    if (!response.ok && response.status !== 404) {
      // Fall back to trying to get from currency detail if funds endpoint doesn't exist
      console.warn(`CryptoRank funds endpoint returned ${response.status}, returning empty`);
      throw new Error(`CryptoRank API error: ${response.status}`);
    }
    
    if (!response.ok) {
      // If endpoint doesn't exist (404), return empty array (no funds data for this coin)
      return []; // Return empty, don't show mock data
    }

    const json = await response.json();
    
    // Map CryptoRank v2 response structure - only return if we have real data
    if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
      return json.data.map((fund: any, index: number) => ({
        id: fund.id || index + 1,
        name: fund.name || fund.fundName || 'Unknown Fund',
        investment_stage: fund.stage || fund.investmentStage || 'N/A',
        project_count: fund.projectCount || fund.projects || 0,
        isMock: false // Real data from API
      }));
    }
    
    // No funds data available for this coin
    return [];
  } catch(e: any) {
    console.warn('CryptoRank funds fetch failed:', e.message || e);
    // Return empty array - don't show mock data
    // Many coins like BTC don't have investment funds, so showing nothing is correct
    return [];
  }
}