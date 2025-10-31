// AI Report Generation Service using OpenAI
import axios from 'axios';

export interface AIReport {
  summary: string;
  technical_analysis: string;
  fundamental_analysis: string;
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
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = '/api/openai';
    this.model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4-mini';
    // Respect mock flag for OpenAI fallback
    (this as any).allowMock = (process.env.REACT_APP_ALLOW_MOCK ?? 'true').toLowerCase() !== 'false';
  }

  async generateReport(
    symbol: string,
    marketData: any,
    technicalData: any,
    fundamentalsData: any
  ): Promise<AIReport> {
    // Key is handled server-side via backend proxy

    const prompt = this.buildPrompt(symbol, marketData, technicalData, fundamentalsData);

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a senior crypto market research expert with the ability to translate dry data and charts into insights that feel vivid, human, and even a little bit emotional. Write clear, vivid, concise research reports, but always:\n- Be warm, supportive, and honest, like talking to a friend.\n- Use relatable analogies/metaphors and call out emotional or market psychology angles.\n- End every summary with a one-sentence actionable takeaway.\n- Inject empathy and real feelings about the market without losing core facts.\n\nAll data and explanations must be accurate, but your report must feel written by a human with market intuition, not a robot or AI."`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        }
      );

      const content = response.data.choices[0].message.content;
      return this.parseAIResponse(content);
    } catch (error) {
      console.error('Error generating AI report:', error);
      if ((this as any).allowMock) {
        return this.generateMockReport(symbol, marketData, technicalData, fundamentalsData);
      }
      throw error;
    }
  }

  private buildPrompt(symbol: string, marketData: any, technicalData: any, fundamentalsData: any): string {
    // Normalize CoinGecko shapes: markets (flat) vs coin details (nested under market_data)
    const currentPrice = (
      marketData?.current_price ??
      marketData?.market_data?.current_price?.usd ??
      0
    );
    const high24h = (
      marketData?.high_24h ??
      marketData?.market_data?.high_24h?.usd ??
      'N/A'
    );
    const low24h = (
      marketData?.low_24h ??
      marketData?.market_data?.low_24h?.usd ??
      'N/A'
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

    // Extract detailed Technical Analysis data
    const rsiValue = technicalData?.rsi?.value ?? 'N/A';
    const rsiSignal = technicalData?.rsi?.signal ?? 'N/A';
    const rsiStrength = technicalData?.rsi?.strength ?? 'N/A';
    
    const macdValue = technicalData?.macd?.macd ?? 'N/A';
    const macdSignal = technicalData?.macd?.signal ?? 'N/A';
    const macdHistogram = technicalData?.macd?.histogram ?? 'N/A';
    const macdSignalType = technicalData?.macd?.signal_type ?? 'N/A';
    
    const ema12 = technicalData?.ema?.ema_12 ?? 'N/A';
    const ema26 = technicalData?.ema?.ema_26 ?? 'N/A';
    const ema50 = technicalData?.ema?.ema_50 ?? 'N/A';
    const ema200 = technicalData?.ema?.ema_200 ?? 'N/A';
    const emaTrend = technicalData?.ema?.trend ?? 'N/A';
    
    const bbUpper = technicalData?.bollinger_bands?.upper ?? 'N/A';
    const bbMiddle = technicalData?.bollinger_bands?.middle ?? 'N/A';
    const bbLower = technicalData?.bollinger_bands?.lower ?? 'N/A';
    const bbPosition = technicalData?.bollinger_bands?.position ?? 'N/A';
    
    const adxValue = technicalData?.adx?.value ?? 'N/A';
    const adxStrength = technicalData?.adx?.trend_strength ?? 'N/A';
    
    const supportLevels = technicalData?.support_resistance?.support ?? [];
    const resistanceLevels = technicalData?.support_resistance?.resistance ?? [];
    
    const volumeTrend = technicalData?.volume_analysis?.volume_trend ?? 'N/A';
    const volumeVsAvg = technicalData?.volume_analysis?.volume_vs_avg ?? 'N/A';

    const circulatingSupply = fundamentalsData?.circulating_supply ?? 0;
    const totalSupply = fundamentalsData?.total_supply ?? 0;
    const maxSupply = fundamentalsData?.max_supply ?? 0;
    const marketCapDominance = fundamentalsData?.market_cap_dominance ?? 0;
    const ath = fundamentalsData?.ath ?? 0;
    const athChange = fundamentalsData?.ath_change_percentage ?? 0;
    const atl = fundamentalsData?.atl ?? 0;
    const atlChange = fundamentalsData?.atl_change_percentage ?? 0;

    return `
Analyze ${symbol} cryptocurrency and provide a comprehensive, objective, and accurate investment report based on the provided market data, technical analysis, and fundamentals.

═══════════════════════════════════════════════════════════════
MARKET DATA (from CoinGecko):
═══════════════════════════════════════════════════════════════
• Current Price: $${Number(currentPrice).toFixed(2)}
• 24h High: $${typeof high24h === 'number' ? Number(high24h).toFixed(2) : high24h}
• 24h Low: $${typeof low24h === 'number' ? Number(low24h).toFixed(2) : low24h}
• 24h Price Range: ${typeof high24h === 'number' && typeof low24h === 'number' ? `${((Number(high24h) - Number(low24h)) / Number(low24h) * 100).toFixed(2)}%` : 'N/A'}
• 24h Change: ${Number(change24hPct) >= 0 ? '+' : ''}${Number(change24hPct).toFixed(2)}%
• Market Cap: $${Number(marketCap).toLocaleString()}
• 24h Volume: $${Number(volume24h).toLocaleString()}
• Market Cap Rank: #${rank}

═══════════════════════════════════════════════════════════════
TECHNICAL ANALYSIS (from Taapi.io):
═══════════════════════════════════════════════════════════════
RSI (Relative Strength Index - 14 period):
  • Value: ${rsiValue} ${typeof rsiValue === 'number' ? (rsiValue > 70 ? '(OVERBOUGHT)' : rsiValue < 30 ? '(OVERSOLD)' : '(NEUTRAL)') : ''}
  • Signal: ${rsiSignal}
  • Strength: ${rsiStrength}/100

MACD (Moving Average Convergence Divergence):
  • MACD Line: ${macdValue}
  • Signal Line: ${macdSignal}
  • Histogram: ${macdHistogram} ${typeof macdHistogram === 'number' ? (macdHistogram > 0 ? '(BULLISH)' : '(BEARISH)') : ''}
  • Overall Signal: ${macdSignalType}

EMA (Exponential Moving Averages):
  • EMA 12: $${typeof ema12 === 'number' ? Number(ema12).toFixed(2) : ema12}
  • EMA 26: $${typeof ema26 === 'number' ? Number(ema26).toFixed(2) : ema26}
  • EMA 50: $${typeof ema50 === 'number' ? Number(ema50).toFixed(2) : ema50}
  • EMA 200: $${typeof ema200 === 'number' ? Number(ema200).toFixed(2) : ema200}
  • Trend: ${emaTrend}
  • Price vs EMAs: Current price ($${Number(currentPrice).toFixed(2)}) is ${typeof ema200 === 'number' ? (Number(currentPrice) > ema200 ? 'ABOVE' : 'BELOW') : ''} 200-day EMA

Bollinger Bands:
  • Upper Band: $${typeof bbUpper === 'number' ? Number(bbUpper).toFixed(2) : bbUpper}
  • Middle Band (SMA 20): $${typeof bbMiddle === 'number' ? Number(bbMiddle).toFixed(2) : bbMiddle}
  • Lower Band: $${typeof bbLower === 'number' ? Number(bbLower).toFixed(2) : bbLower}
  • Current Position: ${bbPosition} ${typeof currentPrice === 'number' && typeof bbUpper === 'number' && typeof bbLower === 'number' ? (Number(currentPrice) > bbUpper ? '(Above upper - potential reversal)' : Number(currentPrice) < bbLower ? '(Below lower - potential bounce)' : '(Within bands)') : ''}

ADX (Average Directional Index):
  • Value: ${adxValue} ${typeof adxValue === 'number' ? (adxValue > 25 ? '(STRONG TREND)' : adxValue > 20 ? '(MODERATE TREND)' : '(WEAK TREND)') : ''}
  • Trend Strength: ${adxStrength}

Support & Resistance Levels:
  • Support Levels: ${supportLevels.length > 0 ? supportLevels.map((s: number) => `$${s.toFixed(2)}`).join(', ') : 'N/A'}
  • Resistance Levels: ${resistanceLevels.length > 0 ? resistanceLevels.map((r: number) => `$${r.toFixed(2)}`).join(', ') : 'N/A'}

Volume Analysis:
  • Volume Trend: ${volumeTrend}
  • Volume vs Average: ${typeof volumeVsAvg === 'number' ? `${volumeVsAvg > 0 ? '+' : ''}${volumeVsAvg.toFixed(2)}%` : volumeVsAvg}

═══════════════════════════════════════════════════════════════
FUNDAMENTALS (from CryptoRank):
═══════════════════════════════════════════════════════════════
• Circulating Supply: ${(circulatingSupply / 1e6).toFixed(1)}M tokens
• Total Supply: ${totalSupply > 0 ? (totalSupply / 1e6).toFixed(1) + 'M' : 'N/A'} tokens
• Max Supply: ${maxSupply > 0 ? (maxSupply / 1e6).toFixed(1) + 'M' : 'Unlimited'} tokens
• Market Cap Dominance: ${marketCapDominance.toFixed(2)}%
• All-Time High: $${ath.toFixed(2)} (currently ${athChange.toFixed(2)}% below ATH)
• All-Time Low: $${atl.toFixed(2)} (currently ${atlChange.toFixed(2)}% above ATL)

═══════════════════════════════════════════════════════════════
INSTRUCTIONS:
═══════════════════════════════════════════════════════════════
Provide a comprehensive, objective, and data-driven investment report. Use the technical analysis values and market price data to make accurate assessments. Focus on:

1. EXECUTIVE SUMMARY (2-3 sentences): High-level overview combining current price, technical signals, and market position
2. TECHNICAL ANALYSIS: Detailed interpretation of all indicators:
   - Explain what RSI, MACD, EMA crossovers, Bollinger Bands position mean for price action
   - Analyze support/resistance levels in context of current price
   - Discuss volume patterns and their significance
   - Provide specific price levels based on technical indicators
3. FUNDAMENTAL ANALYSIS: Supply metrics, market position, and historical performance
4. RISK ASSESSMENT: Objective evaluation of main risks based on technical and fundamental data
5. RECOMMENDATION: BUY/HOLD/SELL with specific confidence percentage (0-100%)
6. PRICE TARGETS: Short-term (1-7 days), Medium-term (1-4 weeks), Long-term (1-3 months) with reasoning based on technical levels
7. KEY RISKS: 3-5 specific risk factors supported by the data
8. KEY OPPORTUNITIES: 3-5 specific opportunities supported by technical/fundamental analysis

Be precise, objective, and reference specific technical values and price levels in your analysis.

Format as JSON with these exact keys: summary, technical_analysis, fundamental_analysis, risk_assessment, recommendation, confidence_score, price_targets, key_risks, key_opportunities
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

  private generateMockReport(symbol: string, marketData: any, technicalData: any, fundamentalsData: any): AIReport {
    const currentPrice = marketData?.current_price || 100;
    const priceChange = marketData?.price_change_percentage_24h || 0;
    const marketCap = marketData?.market_cap || 0;
    const volume = marketData?.total_volume || 0;
    const rsi = technicalData?.rsi?.value || 50;
    const macdSignal = technicalData?.macd?.signal_type || 'NEUTRAL';
    const emaTrend = technicalData?.ema?.trend || 'NEUTRAL';
    const circulatingSupply = fundamentalsData?.circulating_supply || 0;
    const totalSupply = fundamentalsData?.total_supply || 0;
    const maxSupply = fundamentalsData?.max_supply || 0;
    const marketCapDominance = fundamentalsData?.market_cap_dominance || 0;
    const ath = fundamentalsData?.ath || 0;
    const athChange = fundamentalsData?.ath_change_percentage || 0;
    const atl = fundamentalsData?.atl || 0;
    const atlChange = fundamentalsData?.atl_change_percentage || 0;
    
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
    
    // Fundamentals scoring
    let fundamentalsScore = 0;
    if (marketCapDominance > 5) fundamentalsScore += 10; // High market dominance
    else if (marketCapDominance > 1) fundamentalsScore += 5;
    
    if (circulatingSupply > 0 && totalSupply > 0) {
      const supplyRatio = circulatingSupply / totalSupply;
      if (supplyRatio > 0.8) fundamentalsScore += 5; // High circulating supply
      else if (supplyRatio < 0.5) fundamentalsScore -= 5; // Low circulating supply
    }
    
    if (ath > 0 && currentPrice > 0) {
      const athRatio = currentPrice / ath;
      if (athRatio > 0.8) fundamentalsScore += 5; // Close to ATH
      else if (athRatio < 0.3) fundamentalsScore += 10; // Far from ATH, potential upside
    }
    
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
    
    const totalScore = technicalScore + fundamentalsScore + momentumScore + volumeScore;
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
      summary: `${symbol.toUpperCase()} is currently trading at $${currentPrice.toFixed(2)} with a ${priceChange >= 0 ? 'positive' : 'negative'} ${Math.abs(priceChange).toFixed(2)}% change in the last 24 hours. Technical analysis shows ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'} conditions with RSI at ${rsi.toFixed(1)}. Market dominance is ${marketCapDominance.toFixed(2)}% with ${circulatingSupply > 0 ? (circulatingSupply / 1e6).toFixed(1) + 'M' : 'N/A'} tokens in circulation.`,
      technical_analysis: `RSI (14) at ${rsi.toFixed(1)} indicates ${rsi > 70 ? 'overbought conditions suggesting potential selling pressure' : rsi < 30 ? 'oversold conditions suggesting potential buying opportunity' : 'neutral market conditions'}. MACD shows a ${macdSignal.toLowerCase()} signal, while EMA trend is ${emaTrend.toLowerCase()}. ${technicalData?.bollinger_bands?.position ? `Bollinger Bands position is ${technicalData.bollinger_bands.position.toLowerCase()}.` : ''} ADX at ${technicalData?.adx?.value?.toFixed(1) || 'N/A'} indicates ${technicalData?.adx?.trend_strength?.toLowerCase() || 'moderate'} trend strength.`,
      fundamental_analysis: `${symbol.toUpperCase()} has a market capitalization of $${(marketCap / 1e9).toFixed(1)}B with ${marketCapDominance.toFixed(2)}% market dominance. Circulating supply is ${circulatingSupply > 0 ? (circulatingSupply / 1e6).toFixed(1) + 'M' : 'N/A'} tokens${totalSupply > 0 ? ` out of ${(totalSupply / 1e6).toFixed(1)}M total supply` : ''}${maxSupply > 0 ? ` (max: ${(maxSupply / 1e6).toFixed(1)}M)` : ' (unlimited supply)'}. All-time high was $${ath.toFixed(2)} (${athChange.toFixed(2)}% from current price) and all-time low was $${atl.toFixed(2)} (${atlChange.toFixed(2)}% from current price).`,
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
        marketCapDominance > 5 ? 'Strong market position and dominance' : 'Potential for market share growth'
      ]
    };
  }

  private getDefaultReport(): AIReport {
    return {
      summary: 'Analysis completed with limited data',
      technical_analysis: 'Technical indicators suggest neutral market conditions',
      fundamental_analysis: 'Fundamental analysis based on available market data',
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

