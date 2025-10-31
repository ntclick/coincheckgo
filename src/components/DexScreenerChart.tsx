import React from 'react';

interface DexScreenerChartProps {
  // Example TradingView-like symbol: 'BINANCE:BTCUSDT' or 'BINANCE:HBARUSDT'
  symbol?: string;
  // Direct DexScreener pair, e.g., 'ethereum/ethusdt' or 'ethereum/0xPAIRADDRESS'
  pair?: string;
  // Optional on-chain info to resolve pair more accurately
  chainId?: string; // e.g., 'ethereum', 'binance', 'base', 'arbitrum', 'solana'
  tokenAddress?: string; // base token address to resolve most-liquid pool
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

const DexScreenerChart: React.FC<DexScreenerChartProps> = ({ symbol, pair, chainId, tokenAddress, height = 500, theme = 'dark' }) => {
  const [resolvedPair, setResolvedPair] = React.useState<string | null>(pair || null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let aborted = false;
    async function resolve() {
      try {
        setError(null);
        // 1) If explicit pair provided, use it
        if (pair) {
          setResolvedPair(pair);
          return;
        }
        // 2) If chainId + tokenAddress provided → pick top-liquidity pair for that token
        if (chainId && tokenAddress) {
          const r = await fetch(`https://api.dexscreener.com/token-pairs/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(tokenAddress)}`);
          if (aborted) return;
          if (r.ok) {
            const data = await r.json();
            if (Array.isArray(data) && data.length > 0) {
              // Choose pair with highest USD liquidity
              const best = data.reduce((acc: any, cur: any) => {
                const curLiq = cur?.liquidity?.usd || 0;
                const accLiq = acc?.liquidity?.usd || 0;
                return curLiq > accLiq ? cur : acc;
              }, data[0]);
              if (best?.pairAddress) {
                setResolvedPair(`${chainId}/${best.pairAddress}`);
                return;
              }
            }
          }
        }
        // 3) If symbol available → try search endpoint (assume USDT or USD quote)
        if (symbol) {
          const parts = symbol.split(':');
          const raw = parts.length === 2 ? parts[1] : symbol; // e.g., BTCUSDT
          // Try with slash first e.g., BTC/USDT, fallback BTC/USD
          const queries = [
            `${raw}`,
            `${raw.replace(/(USDT|USD)$/i, '')}/USDT`,
            `${raw.replace(/(USDT|USD)$/i, '')}/USD`
          ];
          for (const q of queries) {
            const r = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`);
            if (aborted) return;
            if (r.ok) {
              const data = await r.json();
              const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
              if (pairs.length > 0) {
                // Prefer highest liquidity
                const best = pairs.reduce((acc: any, cur: any) => {
                  const curLiq = cur?.liquidity?.usd || 0;
                  const accLiq = acc?.liquidity?.usd || 0;
                  return curLiq > accLiq ? cur : acc;
                }, pairs[0]);
                if (best?.chainId && best?.pairAddress) {
                  setResolvedPair(`${best.chainId}/${best.pairAddress}`);
                  return;
                }
              }
            }
          }
        }
        // 4) Fallback heuristic
        setResolvedPair(mapSymbolToDexPair(symbol));
      } catch (e: any) {
        if (aborted) return;
        setError(e?.message || 'Failed to resolve DexScreener pair');
        setResolvedPair(mapSymbolToDexPair(symbol));
      }
    }
    resolve();
    return () => { aborted = true; };
  }, [pair, chainId, tokenAddress, symbol]);

  const src = resolvedPair
    ? `https://dexscreener.com/${resolvedPair}?embed=1&theme=${encodeURIComponent(theme)}`
    : undefined;

  if (!src) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}>Loading chart...</div>;
  }

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


