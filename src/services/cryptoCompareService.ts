// CryptoCompare Social/Sentiment Service
import axios from 'axios';

export interface CcSocialSentiment {
  social_volume: number;
  social_engagement: number;
  social_dominance: number;
  social_mentions: number;
  social_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentiment_score: number; // -100..100 approximated
  buzz_score: number; // 0..100 approximated
  alt_rank: number; // not provided -> 0
  market_cap_rank: number; // not provided -> 0
}

class CryptoCompareService {
  private baseUrl = 'https://min-api.cryptocompare.com/data';
  private apiKey: string;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.apiKey = process.env.REACT_APP_CRYPTOCOMPARE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('CryptoCompare API key not found. Social sentiment may be limited.');
    }
  }

  async getSocialSentiment(symbol: string): Promise<CcSocialSentiment> {
    const cacheKey = `cc_sentiment_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const fsym = symbol.toUpperCase();
    // CryptoCompare social latest endpoint
    const url = `${this.baseUrl}/social/coin/latest`;
    try {
      const res = await axios.get(url, {
        params: { fsym },
        headers: { authorization: `Apikey ${this.apiKey}` }
      });
      const raw = res.data?.Data || {};
      // Map approximate fields from sources (Twitter, Reddit etc.)
      const totalMentions = (raw.Twitter?.mentions || 0) + (raw.Reddit?.mentions || 0) + (raw.Telegram?.mentions || 0);
      const totalPosts = (raw.Twitter?.posts || 0) + (raw.Reddit?.posts || 0);
      const sentiment = (raw.Twitter?.sentiment || 0) + (raw.Reddit?.sentiment || 0);
      const score = Math.max(-100, Math.min(100, Math.round(sentiment)));

      const result: CcSocialSentiment = {
        social_volume: totalMentions,
        social_engagement: totalPosts,
        social_dominance: 0,
        social_mentions: totalMentions,
        social_sentiment: score > 10 ? 'BULLISH' : score < -10 ? 'BEARISH' : 'NEUTRAL',
        sentiment_score: score,
        buzz_score: Math.max(0, Math.min(100, Math.round((totalMentions / 1000) * 10))),
        alt_rank: 0,
        market_cap_rank: 0
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (e) {
      console.error('CryptoCompare sentiment fetch failed:', (e as any)?.message);
      // Return neutral minimal structure
      return {
        social_volume: 0,
        social_engagement: 0,
        social_dominance: 0,
        social_mentions: 0,
        social_sentiment: 'NEUTRAL',
        sentiment_score: 0,
        buzz_score: 0,
        alt_rank: 0,
        market_cap_rank: 0
      };
    }
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

export const cryptoCompareService = new CryptoCompareService();


