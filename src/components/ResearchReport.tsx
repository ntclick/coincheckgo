import React, { useState } from 'react';

interface ResearchData {
  symbol: string;
  timeframe: string;
  candles: any[];
  indicators: { [key: string]: any };
  timestamp: string;
  aiAnalysis?: {
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
  };
}

interface ResearchReportProps {
  data: ResearchData;
  onExport: (format: 'pdf' | 'json' | 'markdown') => void;
  onRefine: (query: string) => void;
}

interface IndicatorCardProps {
  name: string;
  value: number;
  status: 'bullish' | 'bearish' | 'neutral';
  description: string;
  confidence: number;
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({ name, value, status, description, confidence }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'bullish': return '#4caf50';
      case 'bearish': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '➡️';
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${getStatusColor()}40`,
      borderRadius: '12px',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Status indicator */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: `${getStatusColor()}20`,
        color: getStatusColor(),
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>{getStatusIcon()}</span>
        {status.toUpperCase()}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${getStatusColor()}, ${getStatusColor()}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          {name.substring(0, 2).toUpperCase()}
        </div>
        
        <div>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '2px'
          }}>
            {name.toUpperCase()}
          </div>
          <div style={{
            color: getStatusColor(),
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </div>
        </div>
      </div>

      <div style={{
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px',
        lineHeight: '1.4',
        marginBottom: '12px'
      }}>
        {description}
      </div>

      {/* Confidence bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px'
        }}>
          Confidence:
        </span>
        <div style={{
          flex: 1,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${confidence}%`,
            background: `linear-gradient(90deg, ${getStatusColor()}, ${getStatusColor()}dd)`,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span style={{
          color: getStatusColor(),
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {confidence}%
        </span>
      </div>
    </div>
  );
};

const ResearchReport: React.FC<ResearchReportProps> = ({ data, onExport, onRefine }) => {
  const [refineQuery, setRefineQuery] = useState('');
  const [showRawData, setShowRawData] = useState(false);

  // Analyze indicators and generate insights
  const analyzeIndicators = () => {
    const insights: IndicatorCardProps[] = [];
    
    Object.entries(data.indicators).forEach(([name, indicator]) => {
      if (!indicator || typeof indicator.value !== 'number') return;

      let status: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let description = '';
      let confidence = 50;

      switch (name.toLowerCase()) {
        case 'rsi':
          if (indicator.value > 70) {
            status = 'bearish';
            description = 'RSI indicates overbought conditions. Consider potential pullback or reversal.';
            confidence = 75;
          } else if (indicator.value < 30) {
            status = 'bullish';
            description = 'RSI shows oversold conditions. Potential buying opportunity.';
            confidence = 75;
          } else {
            description = 'RSI in neutral zone. Market sentiment balanced.';
            confidence = 60;
          }
          break;

        case 'sma':
        case 'ema':
          const currentPrice = data.candles[data.candles.length - 1]?.close || 0;
          if (currentPrice > indicator.value) {
            status = 'bullish';
            description = `Price above ${name.toUpperCase()}. Uptrend momentum confirmed.`;
            confidence = 70;
          } else {
            status = 'bearish';
            description = `Price below ${name.toUpperCase()}. Downtrend pressure.`;
            confidence = 70;
          }
          break;

        case 'macd':
          if (indicator.value > 0) {
            status = 'bullish';
            description = 'MACD above zero line. Bullish momentum building.';
            confidence = 65;
          } else {
            status = 'bearish';
            description = 'MACD below zero line. Bearish momentum dominant.';
            confidence = 65;
          }
          break;

        case 'bbands':
          const price = data.candles[data.candles.length - 1]?.close || 0;
          const upper = indicator.valueHistory?.[0] || indicator.value;
          const lower = indicator.valueHistory?.[1] || indicator.value * 0.95;
          
          if (price > upper) {
            status = 'bearish';
            description = 'Price above upper Bollinger Band. Overbought conditions.';
            confidence = 70;
          } else if (price < lower) {
            status = 'bullish';
            description = 'Price below lower Bollinger Band. Oversold conditions.';
            confidence = 70;
          } else {
            description = 'Price within Bollinger Bands. Normal volatility range.';
            confidence = 60;
          }
          break;

        default:
          description = `${name.toUpperCase()} indicator analysis.`;
          confidence = 50;
      }

      insights.push({
        name,
        value: indicator.value,
        status,
        description,
        confidence
      });
    });

    return insights;
  };

  const insights = analyzeIndicators();
  const bullishCount = insights.filter(i => i.status === 'bullish').length;
  const bearishCount = insights.filter(i => i.status === 'bearish').length;
  const overallSentiment = bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral';

  const getSentimentColor = () => {
    switch (overallSentiment) {
      case 'bullish': return '#4caf50';
      case 'bearish': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getSentimentIcon = () => {
    switch (overallSentiment) {
      case 'bullish': return '🚀';
      case 'bearish': return '⚠️';
      default: return '⚖️';
    }
  };

  return (
    <div style={{
      background: 'rgba(26, 26, 46, 0.95)',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      borderRadius: '16px',
      padding: '24px',
      margin: '20px 0',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{
            color: '#00d4ff',
            fontSize: '28px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>📊</span>
            Research Report
          </h2>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '16px'
          }}>
            {data.symbol} • {data.timeframe} • {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Overall Sentiment */}
          <div style={{
            background: `${getSentimentColor()}20`,
            border: `1px solid ${getSentimentColor()}40`,
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>{getSentimentIcon()}</span>
            <div>
              <div style={{
                color: getSentimentColor(),
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {overallSentiment.toUpperCase()}
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px'
              }}>
                {bullishCount}B / {bearishCount}S
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => onExport('pdf')}
              style={{
                background: 'rgba(244, 67, 54, 0.2)',
                border: '1px solid rgba(244, 67, 54, 0.4)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f44336',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📄 PDF
            </button>
            <button
              onClick={() => onExport('json')}
              style={{
                background: 'rgba(0, 212, 255, 0.2)',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#00d4ff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📋 JSON
            </button>
            <button
              onClick={() => onExport('markdown')}
              style={{
                background: 'rgba(76, 175, 80, 0.2)',
                border: '1px solid rgba(76, 175, 80, 0.4)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#4caf50',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📝 MD
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid rgba(0, 212, 255, 0.2)'
      }}>
        <h3 style={{
          color: '#00d4ff',
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🎯</span>
          Executive Summary
        </h3>
        {data.aiAnalysis ? (
          <div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px',
              lineHeight: '1.6',
              margin: '0 0 16px 0'
            }}>
              {data.aiAnalysis.executiveSummary}
            </p>
            
            {/* AI Recommendations */}
            <div style={{
              background: 'rgba(0, 212, 255, 0.1)',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid rgba(0, 212, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <span style={{
                  background: data.aiAnalysis.recommendations.action === 'buy' ? '#4caf50' : 
                             data.aiAnalysis.recommendations.action === 'sell' ? '#f44336' : '#ff9800',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {data.aiAnalysis.recommendations.action.toUpperCase()}
                </span>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px'
                }}>
                  Confidence: {data.aiAnalysis.confidence}%
                </span>
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                margin: 0
              }}>
                {data.aiAnalysis.recommendations.reasoning}
              </p>
            </div>
          </div>
        ) : (
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: 0
          }}>
            Based on technical analysis of {data.symbol} over {data.timeframe} timeframe, 
            the market shows <strong style={{ color: getSentimentColor() }}>
              {overallSentiment}
            </strong> sentiment with {insights.length} indicators analyzed. 
            {overallSentiment === 'bullish' && ' Key support levels are holding and momentum indicators suggest continued upward movement.'}
            {overallSentiment === 'bearish' && ' Resistance levels are proving strong with momentum indicators showing weakness.'}
            {overallSentiment === 'neutral' && ' The market is in a consolidation phase with mixed signals across indicators.'}
          </p>
        )}
      </div>

      {/* AI Analysis Sections */}
      {data.aiAnalysis && (
        <>
          {/* AI Technical Signals */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }}>
            <h3 style={{
              color: '#00d4ff',
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🤖</span>
              AI Technical Signals
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {data.aiAnalysis.technicalSignals.bullish.length > 0 && (
                <div style={{
                  background: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ color: '#4caf50', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    📈 Bullish Signals
                  </div>
                  {data.aiAnalysis.technicalSignals.bullish.map((signal, index) => (
                    <div key={index} style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', marginBottom: '4px' }}>
                      • {signal}
                    </div>
                  ))}
                </div>
              )}
              
              {data.aiAnalysis.technicalSignals.bearish.length > 0 && (
                <div style={{
                  background: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ color: '#f44336', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    📉 Bearish Signals
                  </div>
                  {data.aiAnalysis.technicalSignals.bearish.map((signal, index) => (
                    <div key={index} style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', marginBottom: '4px' }}>
                      • {signal}
                    </div>
                  ))}
                </div>
              )}
              
              {data.aiAnalysis.technicalSignals.neutral.length > 0 && (
                <div style={{
                  background: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ color: '#ff9800', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    ⚖️ Neutral Signals
                  </div>
                  {data.aiAnalysis.technicalSignals.neutral.map((signal, index) => (
                    <div key={index} style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', marginBottom: '4px' }}>
                      • {signal}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Key Insights */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }}>
            <h3 style={{
              color: '#00d4ff',
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>💡</span>
              Key Insights
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '8px'
            }}>
              {data.aiAnalysis.keyInsights.map((insight, index) => (
                <div key={index} style={{
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px'
                }}>
                  • {insight}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Technical Indicators Grid */}
      <div style={{
        marginBottom: '24px'
      }}>
        <h3 style={{
          color: '#00d4ff',
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📈</span>
          Technical Indicators
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {insights.map((insight, index) => (
            <IndicatorCard key={index} {...insight} />
          ))}
        </div>
      </div>

      {/* Price Action Summary */}
      {data.candles.length > 0 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            color: '#00d4ff',
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 12px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💰</span>
            Price Action Summary
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px'
          }}>
            {(() => {
              const latest = data.candles[data.candles.length - 1];
              const previous = data.candles[data.candles.length - 2];
              const change = latest.close - previous.close;
              const changePercent = (change / previous.close) * 100;
              
              return (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Current Price</div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                      ${latest.close.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>24h Change</div>
                    <div style={{ 
                      color: change >= 0 ? '#4caf50' : '#f44336', 
                      fontSize: '18px', 
                      fontWeight: '600' 
                    }}>
                      {change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Volume</div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                      {latest.volume.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>High</div>
                    <div style={{ color: '#4caf50', fontSize: '18px', fontWeight: '600' }}>
                      ${latest.high.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Low</div>
                    <div style={{ color: '#f44336', fontSize: '18px', fontWeight: '600' }}>
                      ${latest.low.toFixed(2)}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Refinement Section */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid rgba(0, 212, 255, 0.2)'
      }}>
        <h3 style={{
          color: '#00d4ff',
          fontSize: '16px',
          fontWeight: '600',
          margin: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🔍</span>
          Refine Analysis
        </h3>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={refineQuery}
              onChange={(e) => setRefineQuery(e.target.value)}
              placeholder="Ask for deeper analysis on specific aspects..."
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>
          <button
            onClick={() => {
              if (refineQuery.trim()) {
                onRefine(refineQuery);
                setRefineQuery('');
              }
            }}
            disabled={!refineQuery.trim()}
            style={{
              background: refineQuery.trim() 
                ? 'linear-gradient(135deg, #00d4ff, #0099cc)' 
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: refineQuery.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: refineQuery.trim() ? 1 : 0.5
            }}
          >
            🔄 Refine
          </button>
        </div>
      </div>

      {/* Raw Data Toggle */}
      <div style={{
        textAlign: 'center'
      }}>
        <button
          onClick={() => setShowRawData(!showRawData)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {showRawData ? '🔽 Hide' : '🔼 Show'} Raw Data
        </button>
      </div>

      {/* Raw Data Display */}
      {showRawData && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '12px',
          padding: '16px',
          marginTop: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <pre style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '12px',
            lineHeight: '1.4',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ResearchReport;
