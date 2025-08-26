import memoize from 'memoizee';

interface ExchangeRatesResponse {
  [key: string]: number;
}

// Cache exchange rates for 1 hour
const fetchExchangeRates = memoize(
  async (): Promise<ExchangeRatesResponse> => {
    try {
      // Free tier API that doesn't require API key
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/KES');
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract only the currencies we support
      const supportedCurrencies = ['KES', 'USD', 'EUR', 'GBP', 'ZAR'];
      const filteredRates: ExchangeRatesResponse = {};
      
      // KES is our base currency, so it's always 1
      filteredRates.KES = 1;
      
      // Convert other currencies relative to KES
      for (const currency of supportedCurrencies) {
        if (currency !== 'KES' && data.rates[currency]) {
          filteredRates[currency] = data.rates[currency];
        }
      }
      
      return filteredRates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      
      // Fallback rates (approximate as of 2024)
      return {
        KES: 1,
        USD: 0.0062,
        EUR: 0.0057,
        GBP: 0.0049,
        ZAR: 0.11
      };
    }
  },
  { maxAge: 3600000 } // 1 hour cache
);

export { fetchExchangeRates };