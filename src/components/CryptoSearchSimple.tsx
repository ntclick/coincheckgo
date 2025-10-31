import React, { useState, useEffect } from 'react';
import { CryptoData, cryptoApiService } from '../services/cryptoApiService';

interface CryptoSearchSimpleProps {
  onSelect: (crypto: CryptoData) => void;
  placeholder?: string;
  cryptos: CryptoData[];
  isLoading: boolean;
}

const CryptoSearchSimple: React.FC<CryptoSearchSimpleProps> = ({
  onSelect,
  placeholder = "Search cryptocurrencies...",
  cryptos,
  isLoading
}) => {
  const [query, setQuery] = useState('');
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const q = query.toLowerCase();
    if (q.length < 2) {
      // Show up to 300 when no/short query
      setFilteredCryptos(cryptos.slice(0, 300));
      return;
    }

    // Local filter first (instant, no API)
    const localFiltered = cryptos.filter(crypto => 
      crypto.name.toLowerCase().includes(q) ||
      crypto.symbol.toLowerCase().includes(q) ||
      (crypto as any).id?.toLowerCase()?.includes(q)
    );
    setFilteredCryptos(localFiltered.slice(0, 300));

    // Debounced remote merge when local results are too few
    if (localFiltered.length < 10) {
      const handle = setTimeout(async () => {
        try {
          const remote = await cryptoApiService.searchCryptocurrencies(query);
          const byId = new Map<string, CryptoData>();
          for (const c of localFiltered) if ((c as any)?.id) byId.set((c as any).id, c);
          for (const c of remote) if ((c as any)?.id) byId.set((c as any).id, c as any);
          setFilteredCryptos(Array.from(byId.values()).slice(0, 300));
        } catch {
          // ignore, keep local results
        }
      }, 400); // debounce 400ms
      return () => clearTimeout(handle);
    }
  }, [query, cryptos]);

  const handleSelect = (crypto: CryptoData) => {
    setQuery(`${crypto.name} (${crypto.symbol.toUpperCase()})`);
    setShowDropdown(false);
    onSelect(crypto);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={isLoading ? "Loading cryptocurrencies..." : placeholder}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.2)',
          color: 'white',
          fontSize: '14px',
          outline: 'none',
          transition: '0.3s'
        }}
      />
      
      {showDropdown && filteredCryptos.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '8px',
          maxHeight: '480px',
          overflowY: 'auto',
          zIndex: 1000,
          marginTop: '4px'
        }}>
          {filteredCryptos.map((crypto, index) => (
            <div
              key={crypto.id}
              onClick={() => handleSelect(crypto)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < filteredCryptos.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <img
                src={crypto.image}
                alt={crypto.symbol}
                style={{ width: '24px', height: '24px', borderRadius: '50%' }}
              />
              <div>
                <div style={{ color: 'white', fontWeight: '600' }}>
                  {crypto.name}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  {crypto.symbol.toUpperCase()} • Rank #{crypto.market_cap_rank}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CryptoSearchSimple;
