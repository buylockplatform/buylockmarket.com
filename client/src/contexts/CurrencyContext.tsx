import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  currentCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRates: ExchangeRates;
  convertPrice: (price: number | string, fromCurrency?: string) => number;
  formatPrice: (price: number | string, currencyOverride?: Currency) => string;
  isLoading: boolean;
}

const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES', flag: '🇰🇪' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' }
];

const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0]; // KES

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ KES: 1 });
  const [isLoading, setIsLoading] = useState(false);

  // Load saved currency preference on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('buylock_currency');
    if (savedCurrency) {
      const currency = SUPPORTED_CURRENCIES.find(c => c.code === savedCurrency);
      if (currency) {
        setCurrentCurrency(currency);
      }
    }
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      try {
        // Check if we have cached rates (less than 1 hour old)
        const cachedRates = localStorage.getItem('buylock_exchange_rates');
        const cachedTimestamp = localStorage.getItem('buylock_rates_timestamp');
        
        if (cachedRates && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp);
          if (age < 3600000) { // 1 hour in milliseconds
            setExchangeRates(JSON.parse(cachedRates));
            setIsLoading(false);
            return;
          }
        }

        // Fetch fresh rates from API
        const response = await fetch('/api/exchange-rates');
        if (response.ok) {
          const rates = await response.json();
          setExchangeRates(rates);
          
          // Cache the rates
          localStorage.setItem('buylock_exchange_rates', JSON.stringify(rates));
          localStorage.setItem('buylock_rates_timestamp', Date.now().toString());
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Fallback rates if API fails
        setExchangeRates({
          KES: 1,
          USD: 0.0062,
          EUR: 0.0057,
          GBP: 0.0049,
          ZAR: 0.11
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const setCurrency = (currency: Currency) => {
    setCurrentCurrency(currency);
    localStorage.setItem('buylock_currency', currency.code);
  };

  const convertPrice = (price: number | string, fromCurrency: string = 'KES'): number => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (fromCurrency === currentCurrency.code) {
      return numPrice;
    }

    // Convert from base currency (KES) to target currency
    if (fromCurrency === 'KES') {
      const rate = exchangeRates[currentCurrency.code] || 1;
      return numPrice * rate;
    }

    // Convert from other currency to KES first, then to target
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[currentCurrency.code] || 1;
    const kesPrice = numPrice / fromRate;
    return kesPrice * toRate;
  };

  const formatPrice = (price: number | string, currencyOverride?: Currency): string => {
    const currency = currencyOverride || currentCurrency;
    const convertedPrice = convertPrice(price);
    
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.code === 'KES' ? 0 : 2,
    }).format(convertedPrice);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        setCurrency,
        exchangeRates,
        convertPrice,
        formatPrice,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export { SUPPORTED_CURRENCIES };