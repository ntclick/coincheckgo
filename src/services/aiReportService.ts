// AI Report Generation Service using OpenAI
import axios from 'axios';

export interface AIReport {
  summary: string;
  technical_analysis: string;
  fundamental_analysis: string;
  sentiment_analysis: string;
  risk_assessment: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence_score: number; // 0-100
  price_targets: {
    short_term: number;
    medium_term: number;
    long_term: number;
  };
  key_risks: string[];
  key_opportunities: string[];
}

class AIReportService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.baseUrl = process.env.REACT_APP_OPENAI_API_URL || 'https://api.openai.com/v1';
    this.model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4-mini';
    // Respect mock flag for OpenAI fallback
    (this as any).allowMock = (process.env.REACT_APP_ALLOW_MOCK ?? 'true').toLowerCase() !== 'false';
  }

  async generateReport(
    symbol: string,
    marketData: any,
    technicalData: any,
    sentimentData: any
  ): Promise<AIReport> {
    // If no API key, return a mock report only if allowed
    if (!this.apiKey) {
      console.warn('OpenAI API key not configured.');
      if ((this as any).allowMock) {
        console.warn('Returning mock report due to missing key.');
        return this.generateMockReport(symbol, marketData, technicalData, sentimentData);
      }
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildPrompt(symbol, marketData, technicalData, sentimentData);

    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional cryptocurrency analyst. Provide comprehensive, data-driven analysis with clear recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const content = response.data.choices[0].message.content;
      return this.parseAIResponse(content);
    } catch (error) {
      console.error('Error generating AI report:', error);
      if ((this as any).allowMock) {
        return this.generateMockReport(symbol, marketData, technicalData, sentimentData);
      }
      throw error;
    }
  }

  private buildPrompt(symbol: string, marketData: any, technicalData: any, sentimentData: any): string {
    // Normalize CoinGecko shapes: markets (flat) vs coin details (nested under market_data)
    const currentPrice = (
      marketData?.current_price ??
      marketData?.market_data?.current_price?.usd ??
      0
    );
    const marketCap = (
      marketData?.market_cap ??
      marketData?.market_data?.market_cap?.usd ??
      0
    );
    const volume24h = (
      marketData?.total_volume ??
      marketData?.market_data?.total_volume?.usd ??
      0
    );
    const change24hPct = (
      marketData?.price_change_percentage_24h ??
      marketData?.market_data?.price_change_percentage_24h ??
      0
    );
    const rank = marketData?.market_cap_rank ?? marketData?.market_data?.market_cap_rank ?? 'N/A';

    const rsi = technicalData?.rsi?.value ?? 'N/A';
    const rsiSignal = technicalData?.rsi?.signal ?? 'N/A';
    const macd = technicalData?.macd?.macd ?? 'N/A';
    const macdSignalType = technicalData?.macd?.signal_type ?? 'N/A';
    const emaTrend = technicalData?.ema?.trend ?? 'N/A';
    const bbPos = technicalData?.bollinger_bands?.position ?? 'N/A';
    const adx = technicalData?.adx?.value ?? 'N/A';
    const adxStrength = technicalData?.adx?.trend_strength ?? 'N/A';

    const sentiScore = sentimentData?.sentiment_score ?? 0;
    const socialVolume = sentimentData?.social_volume ?? 0;
    const buzzScore = sentimentData?.buzz_score ?? 0;
    const socialSentiment = sentimentData?.social_sentiment ?? 'N/A';

    return `
Analyze ${symbol} cryptocurrency and provide a comprehensive investment report.

MARKET DATA (from CoinGecko):
- Current Price (USD): $${Number(currentPrice).toFixed(2)}
- Market Cap (USD): $${Number(marketCap).toLocaleString()}
- 24h Change (%): ${Number(change24hPct).toFixed(2)}
- Volume 24h (USD): $${Number(volume24h).toLocaleString()}
- Market Cap Rank: #${rank}

TECHNICAL ANALYSIS (from Taapi.io or fallbacks when unavailable):
- RSI (14): ${rsi} (${rsiSignal})
- MACD: ${macd} (${macdSignalType})
- EMA Trend: ${emaTrend}
- Bollinger Bands Position: ${bbPos}
- ADX: ${adx} (${adxStrength})

SOCIAL SENTIMENT (from CryptoCompare):
- Sentiment Score (-100..+100): ${sentiScore}
- Social Volume (24h mentions): ${socialVolume}
- Buzz Score (0..100): ${buzzScore}
- Overall Sentiment: ${socialSentiment}

Please provide:
1. Executive Summary (2-3 sentences)
2. Technical Analysis (key indicators and trends)
3. Fundamental Analysis (market position, adoption)
4. Sentiment Analysis (social media and community)
5. Risk Assessment (main risks)
6. Recommendation (BUY/HOLD/SELL with confidence %)
7. Price Targets (short/medium/long term)
8. Key Risks (3-5 bullet points)
9. Key Opportunities (3-5 bullet points)

Format as JSON with these exact keys: summary, technical_analysis, fundamental_analysis, sentiment_analysis, risk_assessment, recommendation, confidence_score, price_targets, key_risks, key_opportunities
    `;
  }

  private parseAIResponse(content: string): AIReport {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return this.validateReport(parsed);
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback to default report
    return this.getDefaultReport();
  }

  private validateReport(data: any): AIReport {
    return {
      summary: data.summary || 'Analysis completed',
      technical_analysis: data.technical_analysis || 'Technical analysis not available',
      fundamental_analysis: data.fundamental_analysis || 'Fundamental analysis not available',
      sentiment_analysis: data.sentiment_analysis || 'Sentiment analysis not available',
      risk_assessment: data.risk_assessment || 'Risk assessment not available',
      recommendation: ['BUY', 'HOLD', 'SELL'].includes(data.recommendation) ? data.recommendation : 'HOLD',
      confidence_score: Math.max(0, Math.min(100, data.confidence_score || 50)),
      price_targets: {
        short_term: data.price_targets?.short_term || 0,
        medium_term: data.price_targets?.medium_term || 0,
        long_term: data.price_targets?.long_term || 0
      },
      key_risks: Array.isArray(data.key_risks) ? data.key_risks : ['Market volatility', 'Regulatory risks'],
      key_opportunities: Array.isArray(data.key_opportunities) ? data.key_opportunities : ['Market growth potential', 'Technology adoption']
    };
  }

  private generateMockReport(symbol: string, marketData: any, technicalData: any, sentimentData: any): AIReport {
    const currentPrice = marketData?.current_price || 100;
    const priceChange = marketData?.price_change_percentage_24h || 0;
    const marketCap = marketData?.market_cap || 0;
    const volume = marketData?.total_volume || 0;
    const rsi = technicalData?.rsi?.value || 50;
    const macdSignal = technicalData?.macd?.signal_type || 'NEUTRAL';
    const emaTrend = technicalData?.ema?.trend || 'NEUTRAL';
    const sentiment = sentimentData?.social_sentiment || 'NEUTRAL';
    const sentimentScore = sentimentData?.sentiment_score || 0;
    const socialVolume = sentimentData?.social_volume || 0;
    
    // Calculate recommendation based on multiple factors
    type Recommendation = 'BUY' | 'HOLD' | 'SELL';
    let recommendation: Recommendation = 'HOLD';
    let confidenceScore = 50;
    
    // Technical analysis scoring
    let technicalScore = 0;
    if (rsi < 30) technicalScore += 20; // Oversold - bullish
    else if (rsi > 70) technicalScore -= 20; // Overbought - bearish
    else technicalScore += 5; // Neutral
    
    if (macdSignal === 'BUY') technicalScore += 15;
    else if (macdSignal === 'SELL') technicalScore -= 15;
    
    if (emaTrend === 'BULLISH') technicalScore += 10;
    else if (emaTrend === 'BEARISH') technicalScore -= 10;
    
    // Sentiment scoring
    let sentimentScorePoints = 0;
    if (sentiment === 'BULLISH') sentimentScorePoints += 15;
    else if (sentiment === 'BEARISH') sentimentScorePoints -= 15;
    
    if (sentimentScore > 20) sentimentScorePoints += 10;
    else if (sentimentScore < -20) sentimentScorePoints -= 10;
    
    if (socialVolume > 50000) sentimentScorePoints += 5; // High engagement
    
    // Price momentum scoring
    let momentumScore = 0;
    if (priceChange > 5) momentumScore += 15;
    else if (priceChange < -5) momentumScore -= 15;
    else if (priceChange > 2) momentumScore += 5;
    else if (priceChange < -2) momentumScore -= 5;
    
    // Volume scoring
    let volumeScore = 0;
    if (volume > marketCap * 0.1) volumeScore += 10; // High volume relative to market cap
    else if (volume < marketCap * 0.01) volumeScore -= 5; // Low volume
    
    const totalScore = technicalScore + sentimentScorePoints + momentumScore + volumeScore;
    confidenceScore = Math.max(30, Math.min(90, 50 + totalScore));
    
    if (totalScore > 20) recommendation = 'BUY';
    else if (totalScore < -20) recommendation = 'SELL';
    else recommendation = 'HOLD';
    
    // Calculate price targets based on current price and momentum
    const momentumMultiplier = 1 + (priceChange / 100);
    const shortTermTarget = currentPrice * momentumMultiplier * (1 + (totalScore > 0 ? 0.05 : -0.05));
    const mediumTermTarget = currentPrice * momentumMultiplier * (1 + (totalScore > 0 ? 0.15 : -0.15));
    const longTermTarget = currentPrice * momentumMultiplier * (1 + (totalScore > 0 ? 0.30 : -0.30));
    
    return {
      summary: `${symbol.toUpperCase()} is currently trading at $${currentPrice.toFixed(2)} with a ${priceChange >= 0 ? 'positive' : 'negative'} ${Math.abs(priceChange).toFixed(2)}% change in the last 24 hours. Technical analysis shows ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'} conditions with RSI at ${rsi.toFixed(1)}. Social sentiment is ${sentiment.toLowerCase()} with a score of ${sentimentScore.toFixed(1)}.`,
      technical_analysis: `RSI (14) at ${rsi.toFixed(1)} indicates ${rsi > 70 ? 'overbought conditions suggesting potential selling pressure' : rsi < 30 ? 'oversold conditions suggesting potential buying opportunity' : 'neutral market conditions'}. MACD shows a ${macdSignal.toLowerCase()} signal, while EMA trend is ${emaTrend.toLowerCase()}. ${technicalData?.bollinger_bands?.position ? `Bollinger Bands position is ${technicalData.bollinger_bands.position.toLowerCase()}.` : ''} ADX at ${technicalData?.adx?.value?.toFixed(1) || 'N/A'} indicates ${technicalData?.adx?.trend_strength?.toLowerCase() || 'moderate'} trend strength.`,
      fundamental_analysis: `${symbol.toUpperCase()} has a market capitalization of $${(marketCap / 1e9).toFixed(1)}B, ranking #${marketData?.market_cap_rank || 'N/A'} globally. 24-hour trading volume of $${(volume / 1e6).toFixed(1)}M represents ${volume > marketCap * 0.1 ? 'high' : volume > marketCap * 0.05 ? 'moderate' : 'low'} trading activity relative to market cap. ${marketData?.circulating_supply ? `Circulating supply is ${(marketData.circulating_supply / 1e6).toFixed(1)}M tokens.` : ''}`,
      sentiment_analysis: `Social sentiment analysis shows ${sentiment.toLowerCase()} sentiment with a score of ${sentimentScore.toFixed(1)} (range: -100 to +100). Social volume of ${(socialVolume / 1000).toFixed(0)}K mentions in the last 24 hours indicates ${socialVolume > 50000 ? 'high' : socialVolume > 10000 ? 'moderate' : 'low'} community engagement. Buzz score of ${sentimentData?.buzz_score?.toFixed(1) || 'N/A'} and AltRank of #${sentimentData?.alt_rank || 'N/A'} provide additional context on social media presence and ranking.`,
      risk_assessment: `Primary risks include market volatility (24h change: ${priceChange.toFixed(2)}%), regulatory uncertainty in the cryptocurrency space, technology adoption challenges, and liquidity concerns. ${rsi > 70 ? 'Current overbought conditions increase short-term downside risk.' : rsi < 30 ? 'Current oversold conditions may present buying opportunities but also indicate weak momentum.' : 'Technical indicators suggest balanced risk-reward profile.'}`,
      recommendation,
      confidence_score: Math.round(confidenceScore),
      price_targets: {
        short_term: Math.max(0, shortTermTarget),
        medium_term: Math.max(0, mediumTermTarget),
        long_term: Math.max(0, longTermTarget)
      },
      key_risks: [
        'Market volatility and price fluctuations',
        'Regulatory changes and compliance risks',
        'Technology adoption and scalability challenges',
        'Liquidity concerns and market depth',
        rsi > 70 ? 'Overbought technical conditions' : rsi < 30 ? 'Oversold conditions indicating weak momentum' : 'Balanced technical risk profile'
      ],
      key_opportunities: [
        'Market growth potential and adoption',
        'Technology innovation and development',
        'Community development and engagement',
        'Institutional interest and adoption',
        sentiment === 'BULLISH' ? 'Positive social sentiment momentum' : sentiment === 'BEARISH' ? 'Potential sentiment reversal opportunity' : 'Stable social sentiment foundation'
      ]
    };
  }

  private getDefaultReport(): AIReport {
    return {
      summary: 'Analysis completed with limited data',
      technical_analysis: 'Technical indicators suggest neutral market conditions',
      fundamental_analysis: 'Fundamental analysis based on available market data',
      sentiment_analysis: 'Social sentiment appears neutral',
      risk_assessment: 'Standard cryptocurrency market risks apply',
      recommendation: 'HOLD',
      confidence_score: 50,
      price_targets: {
        short_term: 0,
        medium_term: 0,
        long_term: 0
      },
      key_risks: ['Market volatility', 'Regulatory uncertainty', 'Technology risks'],
      key_opportunities: ['Market growth', 'Adoption potential', 'Innovation']
    };
  }
}

export const aiReportService = new AIReportService();

