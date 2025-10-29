import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string; // e.g., 'BINANCE:BTCUSDT'
  height?: number;
  theme?: 'dark' | 'light';
}

const TV_SCRIPT_SRC = 'https://s3.tradingview.com/tv.js';
let tvScriptLoadingPromise: Promise<void> | null = null;

const loadTradingViewScript = (): Promise<void> => {
  if (tvScriptLoadingPromise) return tvScriptLoadingPromise;
  tvScriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TV_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load TradingView script'));
    document.head.appendChild(script);
  });
  return tvScriptLoadingPromise;
};

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol, height = 400, theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widget: any = null;

    const initWidget = async () => {
      try {
        await loadTradingViewScript();
        if (containerRef.current && (window as any).TradingView) {
          widget = new (window as any).TradingView.widget({
            autosize: true,
            symbol,
            interval: '60',
            timezone: 'Etc/UTC',
            theme: theme === 'dark' ? 'dark' : 'light',
            style: '1',
            locale: 'en',
            toolbar_bg: 'rgba(0, 0, 0, 0.2)',
            enable_publishing: false,
            allow_symbol_change: false,
            hide_top_toolbar: false,
            container_id: containerRef.current.id,
          });
        }
      } catch (e) {
        // Silent fail; UI should continue without chart
        // eslint-disable-next-line no-console
        console.warn('TradingView widget failed to initialize:', e);
      }
    };

    if (containerRef.current && !containerRef.current.id) {
      containerRef.current.id = `tv_widget_${Math.random().toString(36).slice(2)}`;
    }

    initWidget();

    return () => {
      // TradingView does not provide a public destroy; rely on DOM cleanup
      widget = null;
    };
  }, [symbol, theme]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
    />
  );
};

export default TradingViewChart;
