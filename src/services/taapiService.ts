// Taapi.io Technical Analysis Service
import axios from 'axios';

export interface TechnicalIndicator {
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 0-100
}

export interface TechnicalAnalysis {
  rsi: TechnicalIndicator;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    signal_type: 'BUY' | 'SELL' | 'NEUTRAL';
  };
  ema: {
    ema_12: number;
    ema_26: number;
    ema_50: number;
    ema_200: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  bollinger_bands: {
    upper: number;
    middle: number;
    lower: number;
    position: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL';
  };
  adx: {
    value: number;
    trend_strength: 'STRONG' | 'MODERATE' | 'WEAK';
  };
  support_resistance: {
    support: number[];
    resistance: number[];
  };
  volume_analysis: {
    volume_trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    volume_vs_avg: number; // percentage
  };
}

class TaapiService {
  private baseUrl = 'https://api.taapi.io';
  private apiKey: string;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 2 * 60 * 1000; // 2 minutes
  private allowMock: boolean;

  constructor() {
    this.apiKey = process.env.REACT_APP_TAAPI_API_KEY || '';
    this.allowMock = (process.env.REACT_APP_ALLOW_MOCK ?? 'true').toLowerCase() !== 'false' ;
    if (!this.apiKey) {
      console.warn('Taapi.io API key not found. Technical analysis will be limited.');
    }
  }

  // Get RSI (Relative Strength Index)
  async getRSI(symbol: string, interval: string = '1h'): Promise<TechnicalIndicator> {
    const cacheKey = `rsi_${symbol}_${interval}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/rsi`, {
        params: {
          secret: this.apiKey,
          exchange: 'binance',
          symbol: symbol,
          interval: interval,
          optInTimePeriod: 14
        }
      });

      const value = response.data.value;
      const signal = this.getRSISignal(value);
      const strength = Math.abs(value - 50) * 2; // Convert to 0-100 scale

      const result: TechnicalIndicator = {
        value,
        signal,
        strength: Math.min(strength, 100)
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching RSI for ${symbol}:`, error);
      return { value: 50, signal: 'NEUTRAL', strength: 0 };
    }
  }

  // Get MACD (Moving Average Convergence Divergence)
  async getMACD(symbol: string, interval: string = '1h'): Promise<TechnicalAnalysis['macd']> {
    const cacheKey = `macd_${symbol}_${interval}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/macd`, {
        params: {
          secret: this.apiKey,
          exchange: 'binance',
          symbol: symbol,
          interval: interval,
          optInFastPeriod: 12,
          optInSlowPeriod: 26,
          optInSignalPeriod: 9
        }
      });

      const data = response.data;
      const result = {
        macd: data.valueMACD,
        signal: data.valueMACDSignal,
        histogram: data.valueMACDHist,
        signal_type: this.getMACDSignalType(data.valueMACD, data.valueMACDSignal)
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching MACD for ${symbol}:`, error);
      return {
        macd: 0,
        signal: 0,
        histogram: 0,
        signal_type: 'NEUTRAL'
      };
    }
  }

  // Get EMA (Exponential Moving Average)
  async getEMA(symbol: string, interval: string = '1h'): Promise<TechnicalAnalysis['ema']> {
    const cacheKey = `ema_${symbol}_${interval}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [ema12, ema26, ema50, ema200] = await Promise.all([
        this.getEMASingle(symbol, interval, 12),
        this.getEMASingle(symbol, interval, 26),
        this.getEMASingle(symbol, interval, 50),
        this.getEMASingle(symbol, interval, 200)
      ]);

      const result = {
        ema_12: ema12,
        ema_26: ema26,
        ema_50: ema50,
        ema_200: ema200,
        trend: this.getEMATrend(ema12, ema26, ema50, ema200)
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching EMA for ${symbol}:`, error);
      return {
        ema_12: 0,
        ema_26: 0,
        ema_50: 0,
        ema_200: 0,
        trend: 'NEUTRAL'
      };
    }
  }

  // Get Bollinger Bands
  async getBollingerBands(symbol: string, interval: string = '1h'): Promise<TechnicalAnalysis['bollinger_bands']> {
    const cacheKey = `bb_${symbol}_${interval}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/bbands2`, {
        params: {
          secret: this.apiKey,
          exchange: 'binance',
          symbol: symbol,
          interval: interval,
          optInTimePeriod: 20,
          optInNbStdDevs: 2
        }
      });

      const data = response.data;
      const result: TechnicalAnalysis['bollinger_bands'] = {
        upper: data.valueUpperBand,
        middle: data.valueMiddleBand,
        lower: data.valueLowerBand,
        position: 'NEUTRAL' as const // Will be calculated based on current price
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching Bollinger Bands for ${symbol}:`, error);
      return {
        upper: 0,
        middle: 0,
        lower: 0,
        position: 'NEUTRAL' as const
      };
    }
  }

  // Get ADX (Average Directional Index)
  async getADX(symbol: string, interval: string = '1h'): Promise<TechnicalAnalysis['adx']> {
    const cacheKey = `adx_${symbol}_${interval}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/adx`, {
        params: {
          secret: this.apiKey,
          exchange: 'binance',
          symbol: symbol,
          interval: interval,
          optInTimePeriod: 14
        }
      });

      const value = response.data.value;
      const result = {
        value,
        trend_strength: this.getADXTrendStrength(value)
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching ADX for ${symbol}:`, error);
      return {
        value: 0,
        trend_strength: 'WEAK'
      };
    }
  }

  // Get comprehensive technical analysis using bulk query (more efficient)
  async getTechnicalAnalysis(symbol: string, interval: string = '1h'): Promise<TechnicalAnalysis> {
    if (!this.apiKey && !this.allowMock) throw new Error('Taapi.io API key not configured and mock data not allowed.');
    if (!this.apiKey && this.allowMock) return this.getMockTechnicalAnalysis();

    try {
      // Use bulk query to get all indicators in one request (more efficient)
      const bulkResponse = await this.getBulkTechnicalAnalysis(symbol, interval);
      return bulkResponse;
    } catch (error) {
      console.error(`Error fetching technical analysis for ${symbol}:`, error);
      if (this.allowMock) return this.getMockTechnicalAnalysis();
      throw error;
    }
  }

  // Bulk query for multiple indicators (more efficient according to Taapi.io docs)
  async getBulkTechnicalAnalysis(symbol: string, interval: string = '1h'): Promise<TechnicalAnalysis> {
    if (!this.apiKey) throw new Error('Taapi.io API key not configured.');

    const cacheKey = `bulk_ta_${symbol}_${interval}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Use bulk endpoint as per Taapi.io documentation
      const response = await axios.post(`${this.baseUrl}/bulk`, {
        secret: this.apiKey,
        construct: {
          exchange: 'binance',
          symbol: symbol,
          interval: interval,
          indicators: [
            { indicator: 'rsi', period: 14 },
            { indicator: 'macd' },
            { indicator: 'ema', period: 12 },
            { indicator: 'ema', period: 26 },
            { indicator: 'ema', period: 50 },
            { indicator: 'ema', period: 200 },
            { indicator: 'bbands2', period: 20, stddev: 2 },
            { indicator: 'adx', period: 14 }
          ]
        }
      });

      const data = response.data.data;
      const result = this.parseBulkResponse(data);
      
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error in bulk technical analysis for ${symbol}:`, error);
      throw error;
    }
  }

  // Parse bulk response into TechnicalAnalysis format
  private parseBulkResponse(data: any[]): TechnicalAnalysis {
    const indicators: any = {};
    
    data.forEach(item => {
      const id = item.id;
      if (id.includes('rsi')) {
        indicators.rsi = {
          value: item.result.value,
          signal: this.getRSISignal(item.result.value),
          strength: Math.abs(item.result.value - 50) * 2
        };
      } else if (id.includes('macd')) {
        indicators.macd = {
          macd: item.result.valueMACD,
          signal: item.result.valueMACDSignal,
          histogram: item.result.valueMACDHist,
          signal_type: this.getMACDSignalType(item.result.valueMACD, item.result.valueMACDSignal)
        };
      } else if (id.includes('ema_12')) {
        indicators.ema12 = item.result.value;
      } else if (id.includes('ema_26')) {
        indicators.ema26 = item.result.value;
      } else if (id.includes('ema_50')) {
        indicators.ema50 = item.result.value;
      } else if (id.includes('ema_200')) {
        indicators.ema200 = item.result.value;
      } else if (id.includes('bbands2')) {
        indicators.bollinger = {
          upper: item.result.valueUpperBand,
          middle: item.result.valueMiddleBand,
          lower: item.result.valueLowerBand,
          position: 'NEUTRAL' as const // Will be calculated based on current price
        };
      } else if (id.includes('adx')) {
        indicators.adx = {
          value: item.result.value,
          trend_strength: this.getADXTrendStrength(item.result.value)
        };
      }
    });

    return {
      rsi: indicators.rsi || this.getMockRSI(),
      macd: indicators.macd || this.getMockMACD(),
      ema: {
        ema_12: indicators.ema12 || 0,
        ema_26: indicators.ema26 || 0,
        ema_50: indicators.ema50 || 0,
        ema_200: indicators.ema200 || 0,
        trend: this.getEMATrend(indicators.ema12, indicators.ema26, indicators.ema50, indicators.ema200)
      },
      bollinger_bands: indicators.bollinger || this.getMockBollingerBands(),
      adx: indicators.adx || this.getMockADX(),
      support_resistance: {
        support: [indicators.bollinger?.lower * 0.95 || 80, indicators.bollinger?.lower * 0.9 || 75],
        resistance: [indicators.bollinger?.upper * 1.05 || 120, indicators.bollinger?.upper * 1.1 || 125]
      },
      volume_analysis: {
        volume_trend: 'STABLE',
        volume_vs_avg: 100
      }
    };
  }

  // Helper methods
  private getRSISignal(value: number): 'BUY' | 'SELL' | 'NEUTRAL' {
    if (value > 70) return 'SELL';
    if (value < 30) return 'BUY';
    return 'NEUTRAL';
  }

  private getMACDSignalType(macd: number, signal: number): 'BUY' | 'SELL' | 'NEUTRAL' {
    if (macd > signal && macd < 0) return 'BUY'; // Bullish crossover below zero
    if (macd < signal && macd > 0) return 'SELL'; // Bearish crossover above zero
    return 'NEUTRAL';
  }

  private getEMATrend(ema12: number, ema26: number, ema50: number, ema200: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    if (ema12 > ema26 && ema26 > ema50 && ema50 > ema200) return 'BULLISH';
    if (ema12 < ema26 && ema26 < ema50 && ema50 < ema200) return 'BEARISH';
    return 'NEUTRAL';
  }

  private getADXTrendStrength(value: number): 'STRONG' | 'MODERATE' | 'WEAK' {
    if (value > 50) return 'STRONG';
    if (value > 25) return 'MODERATE';
    return 'WEAK';
  }

  private async getEMASingle(symbol: string, interval: string, period: number): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/ema`, {
        params: {
          secret: this.apiKey,
          exchange: 'binance',
          symbol: symbol,
          interval: interval,
          optInTimePeriod: period
        }
      });
      return response.data.value;
    } catch (error) {
      console.error(`Error fetching EMA${period} for ${symbol}:`, error);
      return 0;
    }
  }


  // Mock data methods for fallback
  private getMockRSI(): TechnicalIndicator {
    return {
      value: Math.random() * 40 + 30, // 30-70 range
      signal: Math.random() > 0.5 ? 'BUY' as const : 'SELL' as const,
      strength: Math.random() * 50 + 25
    };
  }

  private getMockMACD() {
    const macd = (Math.random() - 0.5) * 10;
    return {
      macd,
      signal: macd * 0.8,
      histogram: macd * 0.2,
      signal_type: macd > 0 ? 'BUY' as const : 'SELL' as const
    };
  }

  private getMockEMA() {
    const base = 100 + Math.random() * 200;
    return {
      ema_12: base * (1 + Math.random() * 0.1),
      ema_26: base * (1 + Math.random() * 0.05),
      ema_50: base * (1 + Math.random() * 0.02),
      ema_200: base,
      trend: Math.random() > 0.5 ? 'BULLISH' as const : 'BEARISH' as const
    };
  }

  private getMockBollingerBands() {
    const middle = 100 + Math.random() * 200;
    const width = middle * 0.1;
    return {
      upper: middle + width,
      middle,
      lower: middle - width,
      position: Math.random() > 0.5 ? 'OVERBOUGHT' as const : 'OVERSOLD' as const
    };
  }

  private getMockADX() {
    return {
      value: Math.random() * 40 + 20,
      trend_strength: Math.random() > 0.5 ? 'STRONG' as const : 'WEAK' as const
    };
  }

  private getMockTechnicalAnalysis(): TechnicalAnalysis {
    return {
      rsi: this.getMockRSI(),
      macd: this.getMockMACD(),
      ema: this.getMockEMA(),
      bollinger_bands: this.getMockBollingerBands(),
      adx: this.getMockADX(),
      support_resistance: {
        support: [80, 75],
        resistance: [120, 125]
      },
      volume_analysis: {
        volume_trend: 'STABLE',
        volume_vs_avg: 100
      }
    };
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
}

export const taapiService = new TaapiService();
