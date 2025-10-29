// LunarCrush Social Sentiment Service
import axios from 'axios';

export interface SocialSentiment {
  social_volume: number;
  social_engagement: number;
  social_dominance: number;
  social_mentions: number;
  social_likes: number;
  social_comments: number;
  social_shares: number;
  social_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentiment_score: number; // -100 to 100
  buzz_score: number; // 0 to 100
  alt_rank: number;
  market_cap_rank: number;
}

class LunarCrushService {
  private baseUrl = 'https://api.lunarcrush.com/v2';
  private baseUrlV4 = 'https://lunarcrush.com/api4/public';
  private apiKey: string;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private allowMock: boolean;

  constructor() {
    this.apiKey = process.env.REACT_APP_LUNARCRUSH_API_KEY || '';
    this.allowMock = (process.env.REACT_APP_ALLOW_MOCK ?? 'true').toLowerCase() !== 'false';
    if (!this.apiKey) {
      console.warn('LunarCrush API key not found. Social sentiment will be limited.');
    }
  }

  async getSocialSentiment(symbol: string): Promise<SocialSentiment> {
    const cacheKey = `sentiment_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/assets`, {
        params: {
          key: this.apiKey,
          symbol: symbol,
          data_points: 1,
          interval: 'day'
        }
      });

      const data = response.data.data?.[0];
      if (!data) {
        throw new Error(`No data found for ${symbol}`);
      }

      const result: SocialSentiment = {
        social_volume: data.social_volume || 0,
        social_engagement: data.social_engagement || 0,
        social_dominance: data.social_dominance || 0,
        social_mentions: data.social_mentions || 0,
        social_likes: data.social_likes || 0,
        social_comments: data.social_comments || 0,
        social_shares: data.social_shares || 0,
        social_sentiment: this.getSentimentType(data.sentiment || 0),
        sentiment_score: data.sentiment || 0,
        buzz_score: data.buzz || 0,
        alt_rank: data.alt_rank || 0,
        market_cap_rank: data.market_cap_rank || 0
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.warn(`LunarCrush v2 failed for ${symbol}:`, (error as any)?.message);
      // Try v2 via proxy (avoid CORS)
      try {
        if (typeof window !== 'undefined' && window.location) {
          const origin = window.location.origin;
          const v2 = await axios.get(`${origin}/api/lunarcrush-v2/assets`, {
            params: {
              key: this.apiKey,
              symbol: symbol,
              data_points: 1,
              interval: 'day'
            }
          });
          const data = v2.data?.data?.[0];
          if (data) {
            const result: SocialSentiment = {
              social_volume: data.social_volume || 0,
              social_engagement: data.social_engagement || 0,
              social_dominance: data.social_dominance || 0,
              social_mentions: data.social_mentions || 0,
              social_likes: data.social_likes || 0,
              social_comments: data.social_comments || 0,
              social_shares: data.social_shares || 0,
              social_sentiment: this.getSentimentType(data.sentiment || 0),
              sentiment_score: data.sentiment || 0,
              buzz_score: data.buzz || 0,
              alt_rank: data.alt_rank || 0,
              market_cap_rank: data.market_cap_rank || 0
            };
            this.setCachedData(cacheKey, result);
            return result;
          }
        }
      } catch (eProxyV2) {
        console.warn('LunarCrush proxy v2 failed:', (eProxyV2 as any)?.message);
      }
      // Try v4 public list via proxy as last resort
      try {
        if (typeof window !== 'undefined' && window.location) {
          const origin = window.location.origin;
          const list = await axios.get(`${origin}/api/lunarcrush/coins/list/v1`, {
            params: { sort: 'interactions_24h' }
          });
          const arr = Array.isArray(list.data?.data) ? list.data.data : Array.isArray(list.data) ? list.data : [];
          const sym = symbol.toUpperCase();
          const item = arr.find((it: any) => (it.symbol || it.s) === sym || (it.name || '').toUpperCase() === sym);
          const result: SocialSentiment = {
            social_volume: item?.interactions_24h || 0,
            social_engagement: item?.social_score_24h || 0,
            social_dominance: 0,
            social_mentions: item?.mentions_24h || 0,
            social_likes: 0,
            social_comments: 0,
            social_shares: 0,
            social_sentiment: 'NEUTRAL',
            sentiment_score: 0,
            buzz_score: 0,
            alt_rank: item?.alt_rank || 0,
            market_cap_rank: 0
          };
          this.setCachedData(cacheKey, result);
          return result;
        }
      } catch (eProxyV4) {
        console.error('LunarCrush proxy v4 failed:', (eProxyV4 as any)?.message);
      }
      if (this.allowMock) return this.getDefaultSentiment();
      throw error;
    }
  }

  private getSentimentType(score: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    if (score > 10) return 'BULLISH';
    if (score < -10) return 'BEARISH';
    return 'NEUTRAL';
  }

  private getDefaultSentiment(): SocialSentiment {
    return {
      social_volume: 0,
      social_engagement: 0,
      social_dominance: 0,
      social_mentions: 0,
      social_likes: 0,
      social_comments: 0,
      social_shares: 0,
      social_sentiment: 'NEUTRAL',
      sentiment_score: 0,
      buzz_score: 0,
      alt_rank: 0,
      market_cap_rank: 0
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

export const lunarcrushService = new LunarCrushService();

