// Taapi.io API Service for cryptocurrency data
// Documentation: https://taapi.io/documentation/

const TAAPI_BASE_URL = 'https://api.taapi.io';
const TAAPI_API_KEY = process.env.REACT_APP_TAAPI_API_KEY || 'YOUR_TAAPI_API_KEY';

export interface Cryptocurrency {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  rank: number;
}

export interface TechnicalIndicator {
  symbol: string;
  timeframe: string;
  indicator: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  rank: number;
  lastUpdate: string;
}

class TaapiService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || TAAPI_API_KEY;
  }

  // Get top 500 cryptocurrencies for suggestions
  async getTopCryptocurrencies(limit: number = 500): Promise<Cryptocurrency[]> {
    try {
      // Using CoinGecko API as fallback since Taapi doesn't have top coins endpoint
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((coin: any, index: number) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Error fetching top cryptocurrencies:', error);
      // Return mock data as fallback
      return this.getMockTopCryptocurrencies(limit);
    }
  }

  // Get real-time market data for a specific symbol
  async getMarketData(symbol: string): Promise<MarketData | null> {
    try {
      // Try Taapi.io first
      const taapiResponse = await fetch(
        `${TAAPI_BASE_URL}/price?secret=${this.apiKey}&exchange=binance&symbol=${symbol}/USDT&interval=1h`
      );

      if (taapiResponse.ok) {
        const taapiData = await taapiResponse.json();
        return {
          symbol: symbol.toUpperCase(),
          price: taapiData.value,
          change24h: 0, // Taapi doesn't provide 24h change in price endpoint
          volume24h: 0,
          high24h: 0,
          low24h: 0,
          marketCap: 0,
          rank: 0,
          lastUpdate: new Date().toISOString()
        };
      }

      // Fallback to CoinGecko
      const coingeckoResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );

      if (coingeckoResponse.ok) {
        const coingeckoData = await coingeckoResponse.json();
        const coinData = coingeckoData[symbol.toLowerCase()];
        
        if (coinData) {
          return {
            symbol: symbol.toUpperCase(),
            price: coinData.usd,
            change24h: coinData.usd_24h_change || 0,
            volume24h: coinData.usd_24h_vol || 0,
            high24h: 0,
            low24h: 0,
            marketCap: coinData.usd_market_cap || 0,
            rank: 0,
            lastUpdate: new Date().toISOString()
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return null;
    }
  }

  // Get technical indicators using Taapi.io
  async getTechnicalIndicators(symbol: string, timeframe: string = '1h'): Promise<TechnicalIndicator[]> {
    try {
      const indicators = ['rsi', 'macd', 'sma', 'ema', 'bbands'];
      const results: TechnicalIndicator[] = [];

      for (const indicator of indicators) {
        try {
          const response = await fetch(
            `${TAAPI_BASE_URL}/${indicator}?secret=${this.apiKey}&exchange=binance&symbol=${symbol}/USDT&interval=${timeframe}`
          );

          if (response.ok) {
            const data = await response.json();
            results.push({
              symbol: symbol.toUpperCase(),
              timeframe,
              indicator: indicator.toUpperCase(),
              value: data.value || 0,
              signal: this.getIndicatorSignal(indicator, data.value)
            });
          }
        } catch (indicatorError) {
          console.error(`Error fetching ${indicator} for ${symbol}:`, indicatorError);
        }
      }

      return results;
    } catch (error) {
      console.error(`Error fetching technical indicators for ${symbol}:`, error);
      return [];
    }
  }

  // Get indicator signal based on value
  private getIndicatorSignal(indicator: string, value: number): 'bullish' | 'bearish' | 'neutral' {
    switch (indicator.toLowerCase()) {
      case 'rsi':
        if (value > 70) return 'bearish';
        if (value < 30) return 'bullish';
        return 'neutral';
      case 'macd':
        if (value > 0) return 'bullish';
        if (value < 0) return 'bearish';
        return 'neutral';
      default:
        return 'neutral';
    }
  }

  // Search cryptocurrencies by name or symbol
  async searchCryptocurrencies(query: string): Promise<Cryptocurrency[]> {
    try {
      const topCoins = await this.getTopCryptocurrencies(500);
      const filtered = topCoins.filter(coin => 
        coin.name.toLowerCase().includes(query.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(query.toLowerCase())
      );
      return filtered.slice(0, 20); // Return top 20 matches
    } catch (error) {
      console.error('Error searching cryptocurrencies:', error);
      return [];
    }
  }

  // Mock data for fallback
  private getMockTopCryptocurrencies(limit: number): Cryptocurrency[] {
    const mockCoins = [
      { symbol: 'BTC', name: 'Bitcoin', price: 45000, change24h: 2.5, volume24h: 25000000000, marketCap: 850000000000, rank: 1 },
      { symbol: 'ETH', name: 'Ethereum', price: 3200, change24h: -1.2, volume24h: 15000000000, marketCap: 380000000000, rank: 2 },
      { symbol: 'BNB', name: 'BNB', price: 320, change24h: 0.8, volume24h: 2000000000, marketCap: 50000000000, rank: 3 },
      { symbol: 'SOL', name: 'Solana', price: 95, change24h: 5.2, volume24h: 3000000000, marketCap: 40000000000, rank: 4 },
      { symbol: 'ADA', name: 'Cardano', price: 0.45, change24h: -2.1, volume24h: 800000000, marketCap: 15000000000, rank: 5 },
      { symbol: 'XRP', name: 'XRP', price: 0.62, change24h: 1.8, volume24h: 1200000000, marketCap: 35000000000, rank: 6 },
      { symbol: 'DOT', name: 'Polkadot', price: 6.8, change24h: -0.5, volume24h: 400000000, marketCap: 8000000000, rank: 7 },
      { symbol: 'DOGE', name: 'Dogecoin', price: 0.08, change24h: 3.2, volume24h: 600000000, marketCap: 12000000000, rank: 8 },
      { symbol: 'AVAX', name: 'Avalanche', price: 28, change24h: -1.8, volume24h: 500000000, marketCap: 7000000000, rank: 9 },
      { symbol: 'MATIC', name: 'Polygon', price: 0.85, change24h: 2.1, volume24h: 300000000, marketCap: 8000000000, rank: 10 }
    ];

    return mockCoins.slice(0, limit);
  }

  // Generate AI research suggestions based on market data
  generateResearchSuggestions(symbol: string, marketData: MarketData, indicators: TechnicalIndicator[]): string[] {
    const suggestions: string[] = [];

    // Price-based suggestions
    if (marketData.change24h > 5) {
      suggestions.push(`Why is ${symbol} surging ${marketData.change24h.toFixed(2)}% in 24h?`);
    } else if (marketData.change24h < -5) {
      suggestions.push(`What's causing ${symbol}'s ${Math.abs(marketData.change24h).toFixed(2)}% decline?`);
    }

    // Volume-based suggestions
    if (marketData.volume24h > 1000000000) {
      suggestions.push(`High volume activity in ${symbol} - what's driving the interest?`);
    }

    // Technical indicator suggestions
    const rsiIndicator = indicators.find(ind => ind.indicator === 'RSI');
    if (rsiIndicator) {
      if (rsiIndicator.signal === 'bullish') {
        suggestions.push(`${symbol} RSI indicates oversold conditions - is this a buying opportunity?`);
      } else if (rsiIndicator.signal === 'bearish') {
        suggestions.push(`${symbol} RSI shows overbought signals - should investors be cautious?`);
      }
    }

    const macdIndicator = indicators.find(ind => ind.indicator === 'MACD');
    if (macdIndicator) {
      if (macdIndicator.signal === 'bullish') {
        suggestions.push(`${symbol} MACD shows bullish momentum - what's the outlook?`);
      } else if (macdIndicator.signal === 'bearish') {
        suggestions.push(`${symbol} MACD indicates bearish trend - what are the implications?`);
      }
    }

    // General suggestions
    suggestions.push(`What are the key factors affecting ${symbol} price movement?`);
    suggestions.push(`Technical analysis: ${symbol} support and resistance levels`);
    suggestions.push(`Market sentiment analysis for ${symbol}`);
    suggestions.push(`${symbol} vs other cryptocurrencies - comparative analysis`);

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}

export const taapiService = new TaapiService();
export default taapiService;
