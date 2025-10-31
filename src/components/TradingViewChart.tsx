import React, { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol: string; // e.g., 'BINANCE:BTCUSDT'
  height?: number;
  theme?: 'dark' | 'light';
}

const TV_SCRIPT_SRC = 'https://s3.tradingview.com/tv.js';
let tvScriptLoadingPromise: Promise<void> | null = null;

const loadTradingViewScript = (): Promise<void> => {
  if (tvScriptLoadingPromise) return tvScriptLoadingPromise;
  
  // Check if already loaded
  if ((window as any).TradingView) {
    tvScriptLoadingPromise = Promise.resolve();
    return tvScriptLoadingPromise;
  }
  
  tvScriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${TV_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load TradingView script')));
      return;
    }
    
    const script = document.createElement('script');
    script.src = TV_SCRIPT_SRC;
    script.async = true;
    script.type = 'text/javascript';
    // Add integrity and crossorigin for better security (optional but recommended)
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      // Wait a bit for TradingView to be available
      let attempts = 0;
      const maxAttempts = 100; // 5 seconds at 50ms intervals
      
      const checkInterval = setInterval(() => {
        attempts++;
        if ((window as any).TradingView && (window as any).TradingView.widget) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          // Still reject but with more context
          reject(new Error('TradingView library loaded but widget constructor not available. Check CSP headers.'));
        }
      }, 50);
    };
    
    script.onerror = (error) => {
      console.error('TradingView script load error:', error);
      reject(new Error('Failed to load TradingView script. Check network tab and CSP headers.'));
    };
    
    document.head.appendChild(script);
  });
  return tvScriptLoadingPromise;
};

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol, height = 400, theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Ensure container has a unique ID
    if (!container.id) {
      container.id = `tv_widget_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    }

    const containerId = container.id;

    // Clean up previous widget
    if (widgetRef.current) {
      try {
        // Clear container content
        container.innerHTML = '';
      } catch (e) {
        // Ignore cleanup errors
      }
      widgetRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    const initWidget = async () => {
      try {
        // Wait for script to load
        await loadTradingViewScript();
        
        // Double check TradingView is available
        if (!(window as any).TradingView) {
          throw new Error('TradingView library not available');
        }

        // Ensure container still exists and is mounted
        if (!containerRef.current || containerRef.current.id !== containerId) {
          return;
        }

        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create widget with full configuration for Vercel compatibility
        widgetRef.current = new (window as any).TradingView.widget({
          autosize: true,
          symbol: symbol || 'BINANCE:BTCUSDT',
          interval: '60',
          timezone: 'Etc/UTC',
          theme: theme === 'dark' ? 'dark' : 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
          enable_publishing: false,
          allow_symbol_change: false,
          hide_top_toolbar: false,
          save_image: false,
          container_id: containerId,
          width: '100%',
          height: height.toString(),
          // Additional options for better Vercel compatibility
          hide_volume: false,
          studies_overrides: {},
          studies: [],
          overrides: {},
          disabled_features: ['use_localstorage_for_settings'],
          enabled_features: ['study_templates'],
          // Ensure proper rendering on production
          loading_screen: { backgroundColor: 'transparent' },
          fullscreen: false,
          // Allow TradingView to connect properly
          allowfullscreen: false,
          withdateranges: true,
        });

        setIsLoading(false);
      } catch (e: any) {
        console.error('TradingView widget failed to initialize:', e);
        setError(e?.message || 'Failed to load chart');
        setIsLoading(false);
      }
    };

    initWidget();

    return () => {
      // Cleanup
      if (widgetRef.current) {
        widgetRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme, height]);

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px'
        }}
      />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px'
        }}>
          Loading chart...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'rgba(255, 100, 100, 0.8)',
          fontSize: '14px',
          textAlign: 'center',
          padding: '20px'
        }}>
          Chart unavailable: {error}
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;
