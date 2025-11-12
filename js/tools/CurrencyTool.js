// Currency Conversion Tool - Uses ExchangeRate-API (supports 160+ currencies including UAH)
export class CurrencyTool {
    static async convert(amount, fromCurrency, toCurrency) {
        try {
            const from = fromCurrency.toUpperCase();
            const to = toCurrency.toUpperCase();
            
            // Use ExchangeRate-API (free, no API key needed, supports UAH and 160+ currencies)
            const response = await fetch(
                `https://api.exchangerate-api.com/v4/latest/${from}`
            );

            if (!response.ok) {
                return {
                    success: false,
                    error: `Invalid currency: ${from}. Supported: EUR, USD, GBP, PLN, UAH, CHF, JPY, etc.`
                };
            }

            const data = await response.json();
            const rate = data.rates[to];
            
            if (!rate) {
                return {
                    success: false,
                    error: `Invalid currency: ${to}. Supported: EUR, USD, GBP, PLN, UAH, CHF, JPY, etc.`
                };
            }

            const convertedAmount = amount * rate;

            return {
                success: true,
                amount: convertedAmount,
                from: from,
                to: to,
                rate: rate,
                date: data.date
            };
        } catch (error) {
            console.error('Currency conversion error:', error);
            return {
                success: false,
                error: 'Network error. Check your connection.'
            };
        }
    }

    static async getSupportedCurrencies() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            return Object.keys(data.rates);
        } catch (error) {
            return null;
        }
    }
}

