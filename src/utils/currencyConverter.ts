import { supabase } from "@/integrations/supabase/client";

interface CurrencyRate {
  currency_code: string;
  rate_to_ron: number;
}

let cachedRates: CurrencyRate[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export const fetchCurrencyRates = async (): Promise<CurrencyRate[]> => {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && now - lastFetchTime < CACHE_DURATION) {
    return cachedRates;
  }

  const { data, error } = await supabase
    .from("currency_rates")
    .select("currency_code, rate_to_ron");

  if (error) {
    console.error("Error fetching currency rates:", error);
    return [];
  }

  cachedRates = data || [];
  lastFetchTime = now;
  return cachedRates;
};

export const convertToRON = async (
  amount: number,
  fromCurrency: string
): Promise<number> => {
  if (fromCurrency === "RON") {
    return amount;
  }

  const rates = await fetchCurrencyRates();
  const rate = rates.find((r) => r.currency_code === fromCurrency);

  if (!rate) {
    console.warn(`No rate found for ${fromCurrency}, returning original amount`);
    return amount;
  }

  return amount * rate.rate_to_ron;
};

export const formatCurrency = (
  amount: number,
  currency: string,
  showOriginal: boolean = false
): string => {
  const formatted = amount.toFixed(2);
  
  if (showOriginal && currency !== "RON") {
    return `${formatted} ${currency}`;
  }
  
  return `${formatted} RON`;
};

export const formatWithConversion = async (
  amount: number,
  currency: string
): Promise<string> => {
  if (currency === "RON") {
    return `${amount.toFixed(2)} RON`;
  }

  const converted = await convertToRON(amount, currency);
  return `${converted.toFixed(2)} RON (${amount.toFixed(2)} ${currency})`;
};
