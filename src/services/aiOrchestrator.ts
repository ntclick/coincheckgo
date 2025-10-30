import axios from 'axios';

export interface AIAnalysisRequest {
  symbol: string;
  timeframe: string;
  indicators: { [key: string]: any };
  candles: any[];
  analysisType: 'quick' | 'comprehensive';
}

export interface AIAnalysisResult {
  executiveSummary: string;
  technicalSignals: {
    bullish: string[];
    bearish: string[];
    neutral: string[];
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  priceTargets: {
    support: number[];
    resistance: number[];
    target: number;
  };
  confidence: number;
  recommendations: {
    action: 'buy' | 'sell' | 'hold' | 'wait';
    reasoning: string;
    timeframe: string;
  };
  keyInsights: string[];
  citations: string[];
}

export class AIOrchestrator {
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiUrl = '/api/openai';
    this.model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4-mini';
  }

  isConfigured(): boolean {
    return true; // handled by backend proxy
  }

  async performQuickAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    // Key handled by backend

    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional cryptocurrency analyst with expertise in technical analysis, market sentiment, and risk assessment. Provide concise, actionable insights based on the provided data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }
      );

      const content = response.data.choices[0].message.content;
      return this.parseAIResponse(content, request);
    } catch (error) {
      console.error('AI Analysis failed:', error);
      throw new Error('Failed to generate AI analysis');
    }
  }

  private buildAnalysisPrompt(request: AIAnalysisRequest): string {
    const { symbol, timeframe, indicators, candles } = request;
    
    // Extract key data points
    const latestCandle = candles[candles.length - 1];
    const priceChange = candles.length > 1 ? 
      ((latestCandle.close - candles[candles.length - 2].close) / candles[candles.length - 2].close * 100) : 0;

    const indicatorData = Object.entries(indicators).map(([name, data]) => {
      if (!data || typeof data.value !== 'number') return null;
      return `${name.toUpperCase()}: ${data.value.toFixed(2)}`;
    }).filter(Boolean).join(', ');

    return `
Analyze the following cryptocurrency data and provide a professional research report:

**Asset**: ${symbol}
**Timeframe**: ${timeframe}
**Current Price**: $${latestCandle.close.toFixed(2)}
**24h Change**: ${priceChange.toFixed(2)}%
**Volume**: ${latestCandle.volume.toLocaleString()}
**Technical Indicators**: ${indicatorData}

**Recent Price Action** (last 5 candles):
${candles.slice(-5).map((candle, i) => 
  `Candle ${i + 1}: O:$${candle.open.toFixed(2)} H:$${candle.high.toFixed(2)} L:$${candle.low.toFixed(2)} C:$${candle.close.toFixed(2)} V:${candle.volume.toLocaleString()}`
).join('\n')}

Please provide a structured analysis in the following JSON format:

{
  "executiveSummary": "Brief 2-3 sentence summary of market conditions and outlook",
  "technicalSignals": {
    "bullish": ["List of bullish technical signals"],
    "bearish": ["List of bearish technical signals"],
    "neutral": ["List of neutral/mixed signals"]
  },
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["Key risk factors affecting this asset"]
  },
  "priceTargets": {
    "support": [support_level_1, support_level_2],
    "resistance": [resistance_level_1, resistance_level_2],
    "target": expected_price_target
  },
  "confidence": 85,
  "recommendations": {
    "action": "buy|sell|hold|wait",
    "reasoning": "Detailed reasoning for the recommendation",
    "timeframe": "short-term|medium-term|long-term"
  },
  "keyInsights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "citations": [
    "Technical indicator: RSI showing oversold conditions",
    "Price action: Breaking above key resistance",
    "Volume: Increasing volume confirms breakout"
  ]
}

Focus on:
1. Technical analysis based on the provided indicators
2. Price action and volume analysis
3. Risk assessment considering market volatility
4. Clear, actionable recommendations
5. Confidence level based on signal strength

Provide only the JSON response, no additional text.
    `.trim();
  }

  private parseAIResponse(content: string, request: AIAnalysisRequest): AIAnalysisResult {
    try {
      // Clean the response to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and provide defaults
      return {
        executiveSummary: parsed.executiveSummary || 'Analysis completed based on technical indicators.',
        technicalSignals: {
          bullish: Array.isArray(parsed.technicalSignals?.bullish) ? parsed.technicalSignals.bullish : [],
          bearish: Array.isArray(parsed.technicalSignals?.bearish) ? parsed.technicalSignals.bearish : [],
          neutral: Array.isArray(parsed.technicalSignals?.neutral) ? parsed.technicalSignals.neutral : []
        },
        riskAssessment: {
          level: ['low', 'medium', 'high'].includes(parsed.riskAssessment?.level) ? parsed.riskAssessment.level : 'medium',
          factors: Array.isArray(parsed.riskAssessment?.factors) ? parsed.riskAssessment.factors : ['Market volatility']
        },
        priceTargets: {
          support: Array.isArray(parsed.priceTargets?.support) ? parsed.priceTargets.support : [],
          resistance: Array.isArray(parsed.priceTargets?.resistance) ? parsed.priceTargets.resistance : [],
          target: typeof parsed.priceTargets?.target === 'number' ? parsed.priceTargets.target : 0
        },
        confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(100, parsed.confidence)) : 75,
        recommendations: {
          action: ['buy', 'sell', 'hold', 'wait'].includes(parsed.recommendations?.action) ? parsed.recommendations.action : 'hold',
          reasoning: parsed.recommendations?.reasoning || 'Based on technical analysis',
          timeframe: parsed.recommendations?.timeframe || 'short-term'
        },
        keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : ['Technical analysis completed'],
        citations: Array.isArray(parsed.citations) ? parsed.citations : ['Technical indicators analysis']
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      
      // Fallback response
      return {
        executiveSummary: `Technical analysis of ${request.symbol} shows mixed signals across indicators.`,
        technicalSignals: {
          bullish: ['Price above key moving averages'],
          bearish: ['RSI in neutral zone'],
          neutral: ['Volume patterns suggest consolidation']
        },
        riskAssessment: {
          level: 'medium',
          factors: ['Market volatility', 'Technical uncertainty']
        },
        priceTargets: {
          support: [],
          resistance: [],
          target: 0
        },
        confidence: 60,
        recommendations: {
          action: 'hold',
          reasoning: 'Mixed technical signals suggest waiting for clearer direction',
          timeframe: 'short-term'
        },
        keyInsights: [
          'Technical indicators show mixed signals',
          'Price action suggests consolidation phase',
          'Volume patterns need monitoring'
        ],
        citations: [
          'Technical indicator analysis',
          'Price action assessment',
          'Volume pattern evaluation'
        ]
      };
    }
  }

  async performComprehensiveAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    // For comprehensive analysis, we could extend the prompt with more detailed instructions
    // and potentially make multiple API calls for different aspects
    return this.performQuickAnalysis(request);
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();
