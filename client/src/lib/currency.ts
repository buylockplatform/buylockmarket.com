// Currency utilities for BuyLock platform
// All prices are stored in KES and converted to other currencies as needed

export interface CurrencyFormatterOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}

// Currency symbols mapping
export const CURRENCY_SYMBOLS = {
  KES: 'KES',
  USD: '$',
  EUR: '€',
  GBP: '£'
} as const;

// Base currency utilities (always work with KES as base)
export function formatKESPrice(price: string | number, options: CurrencyFormatterOptions = {}): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    showSymbol = true
  } = options;

  if (isNaN(numPrice)) return 'KES 0';

  const formatted = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numPrice);

  return showSymbol ? `KES ${formatted}` : formatted;
}

// Currency conversion utility
export function convertPrice(
  kesPrice: string | number, 
  targetCurrency: string, 
  exchangeRates: Record<string, number>
): number {
  const numPrice = typeof kesPrice === 'string' ? parseFloat(kesPrice) : kesPrice;
  
  if (isNaN(numPrice) || !exchangeRates[targetCurrency]) {
    return numPrice;
  }

  return numPrice * exchangeRates[targetCurrency];
}

// Main formatting function that uses currency context
export function formatCurrencyPrice(
  kesPrice: string | number,
  currency: string,
  exchangeRates: Record<string, number>,
  options: CurrencyFormatterOptions = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    showSymbol = true
  } = options;

  // If it's KES, use the base formatter
  if (currency === 'KES') {
    return formatKESPrice(kesPrice, options);
  }

  // Convert to target currency
  const convertedPrice = convertPrice(kesPrice, currency, exchangeRates);
  
  if (isNaN(convertedPrice)) return `${CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency} 0`;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(convertedPrice);

  const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
  return showSymbol ? `${symbol} ${formatted}` : formatted;
}

// React hook for easy price formatting
export function useFormatPrice() {
  // This will be implemented with the currency context
  const { currentCurrency, exchangeRates } = require("@/contexts/CurrencyContext").useCurrency();

  return (kesPrice: string | number, options?: CurrencyFormatterOptions) => {
    return formatCurrencyPrice(kesPrice, currentCurrency.code, exchangeRates, options);
  };
}

// Utility to clean up old currency references
export function cleanCurrencyText(text: string): string {
  return text
    .replace(/KSh\s*/g, 'KES ')
    .replace(/₦\s*/g, 'KES ')
    .replace(/NGN\s*/g, 'KES ')
    .replace(/Ksh\s*/g, 'KES ');
}