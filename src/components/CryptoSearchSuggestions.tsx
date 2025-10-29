// LunarCrush Social Sentiment Service
import React, { useState, useEffect, useRef } from 'react';
import { coinGeckoService, CoinData } from '../services/coinGeckoService';
import { CryptoData } from '../services/cryptoApiService';

interface CryptoSearchSuggestionsProps {
  onSelect: (coin: CryptoData) => void;
  placeholder?: string;
  className?: string;
  cryptos?: CryptoData[];
  isLoading?: boolean;
}

export const CryptoSearchSuggestions: React.FC<CryptoSearchSuggestionsProps> = ({
  onSelect,
  placeholder = "Search cryptocurrencies...",
  className = "",
  cryptos = [],
  isLoading: externalLoading = false
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CryptoData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Use cryptos prop or load popular coins
  useEffect(() => {
    if (cryptos.length > 0) {
      setSuggestions(cryptos.slice(0, 20)); // Show top 20
    } else {
      const loadPopularCoins = async () => {
        try {
          const popularCoins = coinGeckoService.getPopularCoins();
          setSuggestions(popularCoins.map(coin => ({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            current_price: 0,
            market_cap: 0,
            market_cap_rank: 0,
            total_volume: 0,
            price_change_percentage_24h: 0,
            price_change_percentage_7d: 0,
            price_change_percentage_30d: 0,
            market_cap_change_percentage_24h: 0,
            circulating_supply: 0,
            total_supply: 0,
            max_supply: 0,
            ath: 0,
            ath_change_percentage: 0,
            ath_date: '',
            atl: 0,
            atl_change_percentage: 0,
            atl_date: '',
            image: coin.image
          })));
        } catch (error) {
          console.error('Failed to load popular coins:', error);
        }
      };
      loadPopularCoins();
    }
  }, [cryptos]);

  // Handle search
  useEffect(() => {
    const searchCoins = async () => {
      if (query.length < 2) {
        if (cryptos.length > 0) {
          setSuggestions(cryptos.slice(0, 20));
        } else {
          setSuggestions([]);
        }
        return;
      }

      if (cryptos.length > 0) {
        // Filter from loaded cryptos
        const filtered = cryptos.filter(coin => 
          coin.name.toLowerCase().includes(query.toLowerCase()) ||
          coin.symbol.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 10));
      } else {
        // Fallback to API search
        setIsLoading(true);
        try {
          const results = await coinGeckoService.searchCoins(query, 20);
          setSuggestions(results.map(coin => ({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            current_price: 0,
            market_cap: 0,
            market_cap_rank: 0,
            total_volume: 0,
            price_change_percentage_24h: 0,
            price_change_percentage_7d: 0,
            price_change_percentage_30d: 0,
            market_cap_change_percentage_24h: 0,
            circulating_supply: 0,
            total_supply: 0,
            max_supply: 0,
            ath: 0,
            ath_change_percentage: 0,
            ath_date: '',
            atl: 0,
            atl_change_percentage: 0,
            atl_date: '',
            image: coin.image
          })));
        } catch (error) {
          console.error('Search failed:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(searchCoins, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [query, cryptos]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSelect = (coin: CryptoData) => {
    setQuery(coin.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(coin);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  return (
    <div className={`crypto-search-container ${className}`} style={{ position: 'relative', width: '100%' }}>
      <div className="search-input-wrapper" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={externalLoading || isLoading ? 'Loading cryptocurrencies...' : (placeholder || 'Search cryptocurrencies...')}
          disabled={externalLoading}
          className="crypto-search-input"
          style={{
            width: '100%',
            padding: '12px 16px',
            paddingRight: (isLoading || externalLoading) ? '40px' : '16px',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
            transition: '0.3s'
          }}
        />

        {(isLoading || externalLoading) && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            border: '2px solid rgba(0, 212, 255, 0.3)',
            borderTopColor: 'rgb(0, 212, 255)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="suggestions-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '8px',
            maxHeight: '280px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {suggestions.map((coin, index) => (
            <div
              key={coin.id}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(coin)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <img
                src={coin.image}
                alt={coin.symbol}
                style={{ width: '28px', height: '28px', borderRadius: '50%' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'white', fontWeight: 600 }}>{coin.name}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  {coin.symbol.toUpperCase()} • Rank #{coin.market_cap_rank || '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .crypto-search-input:focus {
          border-color: rgb(0, 212, 255);
          box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
        }
        .suggestion-item.selected {
          background: rgba(0, 212, 255, 0.1);
        }
        .suggestions-dropdown::-webkit-scrollbar {
          width: 6px;
        }
        .suggestions-dropdown::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .suggestions-dropdown::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.5);
          border-radius: 3px;
        }
        .suggestions-dropdown::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 212, 255, 0.7);
        }
      `}</style>
    </div>
  );
};

export default CryptoSearchSuggestions;