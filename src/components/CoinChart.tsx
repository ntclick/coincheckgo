import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickData, IChartApi, ISeriesApi } from 'lightweight-charts';

interface CoinChartProps {
  symbol?: string; // e.g., 'BTCUSDT'
  height?: number;
  dark?: boolean;
  enableRealtime?: boolean; // Binance websocket realtime kline updates
  interval?: string; // e.g., '1h', '15m', '4h'
}

const CoinChart: React.FC<CoinChartProps> = ({
  symbol = 'BTCUSDT',
  height = 400,
  dark = true,
  enableRealtime = true,
  interval = '1h',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Init chart
    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { color: dark ? '#0f172a' : '#ffffff' },
        textColor: dark ? '#e2e8f0' : '#0f172a',
      },
      grid: {
        vertLines: { color: dark ? '#1e293b' : '#e2e8f0' },
        horzLines: { color: dark ? '#1e293b' : '#e2e8f0' },
      },
      crosshair: { mode: 0 },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      color: '#3b82f6',
      priceScaleId: '',
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Fetch initial OHLC from Binance REST
    const fetchCandles = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(
            symbol
          )}&interval=${encodeURIComponent(interval)}&limit=500`
        );
        const data = await res.json();

        const candles: CandlestickData[] = data.map((d: any) => ({
          time: d[0] / 1000,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        candleSeries.setData(candles);

        // volume
        const volumes = data.map((d: any) => ({
          time: d[0] / 1000,
          value: parseFloat(d[5]),
          color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#22c55e55' : '#ef444455',
        }));
        volumeSeries.setData(volumes);
      } catch {}
    };
    fetchCandles();

    // Realtime via Binance WS
    if (enableRealtime) {
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`
      );
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const k = message.k;
          if (!k) return;
          candleSeries.update({
            time: k.t / 1000,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
          });
          volumeSeries.update({
            time: k.t / 1000,
            value: parseFloat(k.v),
            color: parseFloat(k.c) >= parseFloat(k.o) ? '#22c55e55' : '#ef444455',
          });
        } catch {}
      };
    }

    // Resize
    const onResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      wsRef.current?.close();
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [symbol, height, dark, enableRealtime, interval]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    />
  );
};

export default CoinChart;


