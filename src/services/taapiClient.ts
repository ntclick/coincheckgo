import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface TaapiConfig {
  apiKey: string;
  baseUrl?: string;
  rateLimitPerMinute?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface TaapiIndicator {
  value: number;
  time?: string;
  valueHistory?: number[];
}

export interface TaapiResponse {
  [key: string]: TaapiIndicator;
}

export interface TaapiCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ResearchRequest {
  symbol: string;
  timeframe: string;
  indicators: string[];
  depth: 'fast' | 'deep';
  modules: ('technical' | 'onchain' | 'news')[];
}

export interface ResearchProgress {
  stage: 'define' | 'ingest' | 'analyze' | 'draft' | 'finalize';
  progress: number;
  details: {
    taapiCalls: number;
    candlesFetched: number;
    transfersFetched: number;
    newsFetched: number;
    indicators: string[];
    errors: string[];
  };
}

export class TaapiClient {
  private client: AxiosInstance;
  private config: TaapiConfig;
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private callCount = 0;
  private lastResetTime = Date.now();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(config: TaapiConfig) {
    this.config = {
      baseUrl: 'https://api.taapi.io',
      rateLimitPerMinute: 60,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      await this.waitForRateLimit();
      return config;
    });

    // Add response interceptor for retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429 || error.response?.status >= 500) {
          return this.retryRequest(error.config);
        }
        throw error;
      }
    );
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - this.lastResetTime >= 60000) {
      this.callCount = 0;
      this.lastResetTime = now;
    }

    // If we've hit the rate limit, wait
    if (this.callCount >= this.config.rateLimitPerMinute!) {
      const waitTime = 60000 - (now - this.lastResetTime);
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.callCount = 0;
      this.lastResetTime = Date.now();
    }

    this.callCount++;
  }

  private async retryRequest(config: any, attempt = 1): Promise<AxiosResponse> {
    if (attempt > this.config.retryAttempts!) {
      throw new Error(`Max retry attempts (${this.config.retryAttempts}) exceeded`);
    }

    const delay = this.config.retryDelay! * Math.pow(2, attempt - 1);
    console.log(`Retrying request in ${delay}ms (attempt ${attempt})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      return await this.client.request(config);
    } catch (error) {
      return this.retryRequest(config, attempt + 1);
    }
  }

  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  async getIndicator(
    indicator: string, 
    symbol: string, 
    interval: string = '1h',
    params: any = {}
  ): Promise<TaapiIndicator> {
    const cacheKey = this.getCacheKey('indicator', { indicator, symbol, interval, params });
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${indicator} on ${symbol}`);
      return cached;
    }

    try {
      const response = await this.client.get(`/${indicator}`, {
        params: {
          secret: this.config.apiKey,
          exchange: 'binance',
          symbol: symbol,
          interval: interval,
          ...params
        }
      });

      const result = response.data;
      this.setCache(cacheKey, result, 30000); // 30s cache for indicators
      return result;
    } catch (error) {
      console.error(`Error fetching ${indicator} for ${symbol}:`, error);
      throw error;
    }
  }

  async getCandles(
    symbol: string, 
    interval: string = '1h', 
    limit: number = 100
  ): Promise<TaapiCandle[]> {
    const cacheKey = this.getCacheKey('candles', { symbol, interval, limit });
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`Cache hit for candles on ${symbol}`);
      return cached;
    }

    try {
      const response = await this.client.get('/candles', {
        params: {
          secret: this.config.apiKey,
          exchange: 'binance',
          symbol: symbol,
          interval: interval,
          limit: limit
        }
      });

      const result = response.data;
      this.setCache(cacheKey, result, 60000); // 1min cache for candles
      return result;
    } catch (error) {
      console.error(`Error fetching candles for ${symbol}:`, error);
      throw error;
    }
  }

  async getMultipleIndicators(
    symbol: string,
    indicators: string[],
    interval: string = '1h'
  ): Promise<{ [key: string]: TaapiIndicator }> {
    const results: { [key: string]: TaapiIndicator } = {};
    const promises = indicators.map(async (indicator) => {
      try {
        const result = await this.getIndicator(indicator, symbol, interval);
        results[indicator] = result;
      } catch (error) {
        console.error(`Failed to fetch ${indicator}:`, error);
        results[indicator] = { value: 0, time: new Date().toISOString() };
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  async getRSI(symbol: string, interval: string = '1h', period: number = 14): Promise<number | null> {
    try {
      const result = await this.getIndicator('rsi', symbol, interval, { period });
      return result.value;
    } catch (error) {
      console.error(`Error fetching RSI for ${symbol}:`, error);
      return null;
    }
  }

  async getMACD(symbol: string, interval: string = '1h'): Promise<{ macd: number; signal: number; histogram: number } | null> {
    try {
      const result = await this.getIndicator('macd', symbol, interval);
      return {
        macd: result.value,
        signal: result.valueHistory?.[0] || 0,
        histogram: result.valueHistory?.[1] || 0
      };
    } catch (error) {
      console.error(`Error fetching MACD for ${symbol}:`, error);
      return null;
    }
  }

  async getSMA(symbol: string, interval: string = '1h', period: number = 20): Promise<number | null> {
    try {
      const result = await this.getIndicator('sma', symbol, interval, { period });
      return result.value;
    } catch (error) {
      console.error(`Error fetching SMA for ${symbol}:`, error);
      return null;
    }
  }

  async getEMA(symbol: string, interval: string = '1h', period: number = 20): Promise<number | null> {
    try {
      const result = await this.getIndicator('ema', symbol, interval, { period });
      return result.value;
    } catch (error) {
      console.error(`Error fetching EMA for ${symbol}:`, error);
      return null;
    }
  }

  async getBollingerBands(symbol: string, interval: string = '1h'): Promise<{ upper: number; middle: number; lower: number } | null> {
    try {
      const result = await this.getIndicator('bbands', symbol, interval);
      return {
        upper: result.value,
        middle: result.valueHistory?.[0] || 0,
        lower: result.valueHistory?.[1] || 0
      };
    } catch (error) {
      console.error(`Error fetching Bollinger Bands for ${symbol}:`, error);
      return null;
    }
  }

  // Advanced research orchestration with AI integration
  async performResearch(request: ResearchRequest): Promise<{
    progress: ResearchProgress;
    data: any;
    aiAnalysis?: any;
  }> {
    const progress: ResearchProgress = {
      stage: 'define',
      progress: 0,
      details: {
        taapiCalls: 0,
        candlesFetched: 0,
        transfersFetched: 0,
        newsFetched: 0,
        indicators: [],
        errors: []
      }
    };

    try {
      // Stage 1: Ingest
      progress.stage = 'ingest';
      progress.progress = 20;

      const candles = await this.getCandles(request.symbol, request.timeframe, 100);
      progress.details.candlesFetched = candles.length;
      progress.details.taapiCalls++;

      // Stage 2: Analyze
      progress.stage = 'analyze';
      progress.progress = 60;

      const indicators = await this.getMultipleIndicators(
        request.symbol,
        request.indicators,
        request.timeframe
      );
      progress.details.indicators = Object.keys(indicators);
      progress.details.taapiCalls += request.indicators.length;

      // Stage 3: Draft (AI Analysis)
      progress.stage = 'draft';
      progress.progress = 80;

      const analysisData = {
        symbol: request.symbol,
        timeframe: request.timeframe,
        candles: candles.slice(-20), // Last 20 candles for analysis
        indicators,
        timestamp: new Date().toISOString()
      };

      // AI Analysis (if available)
      let aiAnalysis = null;
      try {
        const { aiOrchestrator } = await import('./aiOrchestrator');
        if (aiOrchestrator.isConfigured()) {
          aiAnalysis = await aiOrchestrator.performQuickAnalysis({
            symbol: request.symbol,
            timeframe: request.timeframe,
            indicators,
            candles: candles.slice(-20),
            analysisType: request.depth === 'deep' ? 'comprehensive' : 'quick'
          });
        }
      } catch (error) {
        console.warn('AI analysis not available:', error);
      }

      // Stage 4: Finalize
      progress.stage = 'finalize';
      progress.progress = 100;

      return {
        progress,
        data: analysisData,
        aiAnalysis
      };

    } catch (error) {
      progress.details.errors.push(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Utility methods
  getCallStats(): { callsThisMinute: number; cacheSize: number; rateLimitRemaining: number } {
    const now = Date.now();
    const callsThisMinute = now - this.lastResetTime < 60000 ? this.callCount : 0;
    const rateLimitRemaining = Math.max(0, this.config.rateLimitPerMinute! - callsThisMinute);
    
    return {
      callsThisMinute,
      cacheSize: this.cache.size,
      rateLimitRemaining
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const taapiClient = new TaapiClient({
  apiKey: process.env.REACT_APP_TAAPI_API_KEY || '',
  rateLimitPerMinute: 60,
  retryAttempts: 3,
  retryDelay: 1000
});
