// Currency Conversion Tool - Uses free Frankfurter API
export class CurrencyTool {
    static async convert(amount, fromCurrency, toCurrency) {
        try {
            const from = fromCurrency.toUpperCase();
            const to = toCurrency.toUpperCase();
            
            // Use Frankfurter API (free, no API key needed, maintained by ECB)
            const response = await fetch(
                `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                
                // Check for specific errors
                if (response.status === 404 || (errorData && errorData.message)) {
                    return {
                        success: false,
                        error: `Invalid currency: ${from} or ${to}. Try: EUR, USD, GBP, PLN, UAH, CHF, JPY`
                    };
                }
                
                return {
                    success: false,
                    error: 'Currency API error. Check your internet connection.'
                };
            }

            const data = await response.json();
            const convertedAmount = data.rates[to];
            
            if (!convertedAmount) {
                return {
                    success: false,
                    error: `Currency ${to} not supported`
                };
            }

            return {
                success: true,
                amount: convertedAmount,
                from: from,
                to: to,
                rate: convertedAmount / amount,
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
            const response = await fetch('https://api.frankfurter.app/currencies');
            return await response.json();
        } catch (error) {
            return null;
        }
    }
}

