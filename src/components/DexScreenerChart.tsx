import React from 'react';

interface DexScreenerChartProps {
  // Example TradingView-like symbol: 'BINANCE:BTCUSDT' or 'BINANCE:HBARUSDT'
  symbol?: string;
  // Or pass DexScreener pair directly, e.g., 'ethereum/ethusdt', 'binance/hbarusdt'
  pair?: string;
  height?: number;
  theme?: 'dark' | 'light';
}

function mapSymbolToDexPair(symbol?: string): string {
  if (!symbol) return 'ethereum/ethusdt';
  const parts = symbol.split(':');
  if (parts.length !== 2) return 'ethereum/ethusdt';
  const [exchange, pair] = parts;
  const lower = pair.toLowerCase();
  // Heuristic mapping
  // - BINANCE => binance (BSC) if common BSC pairs, else fallback ethereum
  // - By default use 'ethereum'
  if (exchange.toUpperCase() === 'BINANCE') {
    return `binance/${lower}`;
  }
  return `ethereum/${lower}`;
}

const DexScreenerChart: React.FC<DexScreenerChartProps> = ({ symbol, pair, height = 500, theme = 'dark' }) => {
  const resolvedPair = pair || mapSymbolToDexPair(symbol);
  const src = `https://dexscreener.com/${resolvedPair}?embed=1&theme=${encodeURIComponent(theme)}`;

  return (
    <iframe
      src={src}
      width="100%"
      height={height}
      frameBorder={0}
      allowFullScreen
      style={{ border: 'none', borderRadius: 12, overflow: 'hidden' }}
      title={`DexScreener ${resolvedPair}`}
    />
  );
};

export default DexScreenerChart;


