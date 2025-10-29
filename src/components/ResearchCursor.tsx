import React, { useState, useEffect, useCallback } from 'react';
import { taapiClient, ResearchRequest, ResearchProgress } from '../services/taapiClient';

interface ResearchCursorProps {
  onResearchComplete: (data: any) => void;
  onError: (error: string) => void;
}

interface StageConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'define',
    title: 'Define Research',
    description: 'Configure token, timeframe, and analysis depth',
    icon: '🎯',
    color: '#00d4ff'
  },
  {
    id: 'ingest',
    title: 'Data Ingestion',
    description: 'Fetching market data, indicators, and on-chain metrics',
    icon: '📊',
    color: '#ff6b35'
  },
  {
    id: 'analyze',
    title: 'Technical Analysis',
    description: 'Computing indicators and identifying patterns',
    icon: '🔍',
    color: '#f7931e'
  },
  {
    id: 'draft',
    title: 'AI Analysis',
    description: 'Generating professional research report',
    icon: '🤖',
    color: '#9c27b0'
  },
  {
    id: 'finalize',
    title: 'Finalize Report',
    description: 'Compiling results and preparing export',
    icon: '📋',
    color: '#4caf50'
  }
];

const ResearchCursor: React.FC<ResearchCursorProps> = ({ onResearchComplete, onError }) => {
  const [currentStage, setCurrentStage] = useState<string>('define');
  const [progress, setProgress] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [researchRequest, setResearchRequest] = useState<ResearchRequest>({
    symbol: 'BTC/USDT',
    timeframe: '1h',
    indicators: ['rsi', 'sma', 'ema', 'macd', 'bbands'],
    depth: 'fast',
    modules: ['technical']
  });
  const [progressDetails, setProgressDetails] = useState<ResearchProgress['details']>({
    taapiCalls: 0,
    candlesFetched: 0,
    transfersFetched: 0,
    newsFetched: 0,
    indicators: [],
    errors: []
  });

  const handleStartResearch = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentStage('define');
    setProgress(0);
    setProgressDetails({
      taapiCalls: 0,
      candlesFetched: 0,
      transfersFetched: 0,
      newsFetched: 0,
      indicators: [],
      errors: []
    });

    try {
      const result = await taapiClient.performResearch(researchRequest);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCurrentStage(result.progress.stage);
        setProgress(result.progress.progress);
        setProgressDetails(result.progress.details);
      }, 100);

        // Wait for completion
        setTimeout(() => {
          clearInterval(progressInterval);
          setCurrentStage('finalize');
          setProgress(100);
          onResearchComplete({
            ...result.data,
            aiAnalysis: result.aiAnalysis
          });
          setIsRunning(false);
        }, 3000);

    } catch (error) {
      setIsRunning(false);
      onError(error instanceof Error ? error.message : 'Research failed');
    }
  }, [researchRequest, isRunning, onResearchComplete, onError]);

  const getCurrentStageIndex = (): number => {
    return STAGES.findIndex(stage => stage.id === currentStage);
  };

  const getStageStatus = (stageIndex: number): 'completed' | 'current' | 'pending' => {
    const currentIndex = getCurrentStageIndex();
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
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
        marginBottom: '24px'
      }}>
        <h2 style={{
          color: '#00d4ff',
          fontSize: '24px',
          fontWeight: '600',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>🔬</span>
          AI Research Cursor
        </h2>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px 8px',
            borderRadius: '12px'
          }}>
            {progressDetails.taapiCalls} API calls
          </div>
          
          <button
            onClick={handleStartResearch}
            disabled={isRunning}
            style={{
              background: isRunning ? 'rgba(255, 107, 53, 0.3)' : 'linear-gradient(135deg, #00d4ff, #0099cc)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isRunning ? 0.7 : 1
            }}
          >
            {isRunning ? '⏳ Running...' : '🚀 Start Research'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        height: '8px',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #00d4ff, #4caf50)',
          height: '100%',
          width: `${progress}%`,
          transition: 'width 0.3s ease',
          borderRadius: '8px'
        }} />
      </div>

      {/* Stage Indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '24px',
        position: 'relative'
      }}>
        {/* Connection Line */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: 1
        }} />
        
        {STAGES.map((stage, index) => {
          const status = getStageStatus(index);
          const isActive = status === 'current' || status === 'completed';
          
          return (
            <div
              key={stage.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 2,
                position: 'relative'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: isActive 
                  ? `linear-gradient(135deg, ${stage.color}, ${stage.color}dd)`
                  : 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                border: `2px solid ${isActive ? stage.color : 'rgba(255, 255, 255, 0.2)'}`,
                transition: 'all 0.3s ease',
                transform: status === 'current' ? 'scale(1.1)' : 'scale(1)',
                boxShadow: status === 'current' ? `0 0 20px ${stage.color}40` : 'none'
              }}>
                {status === 'completed' ? '✅' : stage.icon}
              </div>
              
              <div style={{
                marginTop: '8px',
                textAlign: 'center',
                maxWidth: '80px'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isActive ? stage.color : 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '2px'
                }}>
                  {stage.title}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  lineHeight: '1.2'
                }}>
                  {stage.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Stage Details */}
      {isRunning && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(0, 212, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>
              {STAGES.find(s => s.id === currentStage)?.icon}
            </span>
            <div>
              <div style={{
                color: '#00d4ff',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                {STAGES.find(s => s.id === currentStage)?.title}
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px'
              }}>
                {STAGES.find(s => s.id === currentStage)?.description}
              </div>
            </div>
          </div>

          {/* Progress Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            fontSize: '12px'
          }}>
            <div style={{
              background: 'rgba(0, 212, 255, 0.1)',
              padding: '8px',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#00d4ff', fontWeight: '600' }}>
                {progressDetails.taapiCalls}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                API Calls
              </div>
            </div>
            
            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              padding: '8px',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4caf50', fontWeight: '600' }}>
                {progressDetails.candlesFetched}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Candles
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 107, 53, 0.1)',
              padding: '8px',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff6b35', fontWeight: '600' }}>
                {progressDetails.indicators.length}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Indicators
              </div>
            </div>
            
            {progressDetails.errors.length > 0 && (
              <div style={{
                background: 'rgba(244, 67, 54, 0.1)',
                padding: '8px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#f44336', fontWeight: '600' }}>
                  {progressDetails.errors.length}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Errors
                </div>
              </div>
            )}
          </div>

          {/* Active Indicators */}
          {progressDetails.indicators.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                marginBottom: '6px'
              }}>
                Active Indicators:
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px'
              }}>
                {progressDetails.indicators.map((indicator, index) => (
                  <span
                    key={index}
                    style={{
                      background: 'rgba(0, 212, 255, 0.2)',
                      color: '#00d4ff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}
                  >
                    {indicator.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Research Configuration */}
      {!isRunning && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(0, 212, 255, 0.2)'
        }}>
          <div style={{
            color: '#00d4ff',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            Research Configuration
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '4px'
              }}>
                Symbol
              </label>
              <input
                type="text"
                value={researchRequest.symbol}
                onChange={(e) => setResearchRequest(prev => ({ ...prev, symbol: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
                placeholder="BTC/USDT"
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '4px'
              }}>
                Timeframe
              </label>
              <select
                value={researchRequest.timeframe}
                onChange={(e) => setResearchRequest(prev => ({ ...prev, timeframe: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '4px'
              }}>
                Depth
              </label>
              <select
                value={researchRequest.depth}
                onChange={(e) => setResearchRequest(prev => ({ ...prev, depth: e.target.value as 'fast' | 'deep' }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="fast">Fast (Summary Only)</option>
                <option value="deep">Deep (Full Analysis)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchCursor;
