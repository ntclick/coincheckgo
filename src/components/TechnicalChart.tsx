import React, { useEffect, useRef } from 'react';
import { cryptoApiService, CryptoData } from '../services/cryptoApiService';

interface TechnicalChartProps {
  crypto: CryptoData;
  height?: number;
}

const TechnicalChart: React.FC<TechnicalChartProps> = ({ crypto, height = 300 }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current || !crypto.sparkline_in_7d) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, height);

    const prices = crypto.sparkline_in_7d.price;
    if (prices.length === 0) return;

    // Calculate chart dimensions
    const padding = 20;
    const chartWidth = canvas.offsetWidth - padding * 2;
    const chartHeight = height - padding * 2;

    // Find min/max prices
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = crypto.price_change_percentage_24h >= 0 ? '#00ff88' : '#ff4444';
    ctx.lineWidth = 2;
    ctx.beginPath();

    prices.forEach((price, index) => {
      const x = padding + (chartWidth / (prices.length - 1)) * index;
      const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw price labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`$${maxPrice.toFixed(2)}`, padding - 5, padding + 15);
    ctx.fillText(`$${minPrice.toFixed(2)}`, padding - 5, padding + chartHeight - 5);

  }, [crypto, height]);

  return (
    <div style={{ width: '100%', height: height }}>
      <canvas
        ref={chartRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default TechnicalChart;

