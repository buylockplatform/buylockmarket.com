import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES, Currency } from '@/contexts/CurrencyContext';

export const CurrencySwitch: React.FC = () => {
  const { currentCurrency, setCurrency, isLoading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-buylock-primary transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg"
        disabled={isLoading}
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">{currentCurrency.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-1">
              {SUPPORTED_CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencyChange(currency)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    currentCurrency.code === currency.code 
                      ? 'bg-buylock-primary/10 text-buylock-primary' 
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{currency.flag}</span>
                      <div>
                        <div className="font-medium">{currency.code}</div>
                        <div className="text-xs text-gray-500">{currency.name}</div>
                      </div>
                    </div>
                    <span className="text-gray-400 font-mono">{currency.symbol}</span>
                  </div>
                </button>
              ))}
            </div>
            
            {isLoading && (
              <div className="px-4 py-2 text-xs text-gray-500 border-t">
                Updating rates...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};