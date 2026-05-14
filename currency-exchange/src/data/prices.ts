import priceData from "../../price.json";

export interface TokenPrice {
  currency: string;
  date: string;
  price: number;
}

// Deduplicate: keep the latest entry per currency
const priceMap = new Map<string, TokenPrice>();
(priceData as TokenPrice[]).forEach((entry) => {
  const existing = priceMap.get(entry.currency);
  if (!existing || new Date(entry.date) > new Date(existing.date)) {
    priceMap.set(entry.currency, entry);
  }
});

export const tokens: TokenPrice[] = Array.from(priceMap.values()).sort((a, b) =>
  a.currency.localeCompare(b.currency),
);

export const getTokenIcon = (currency: string) => `/tokens/${currency}.svg`;

export const convertAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number | null => {
  const from = priceMap.get(fromCurrency);
  const to = priceMap.get(toCurrency);
  if (!from || !to || to.price === 0) return null;
  return (amount * from.price) / to.price;
};

export const getRate = (
  fromCurrency: string,
  toCurrency: string,
): number | null => {
  const from = priceMap.get(fromCurrency);
  const to = priceMap.get(toCurrency);
  if (!from || !to || to.price === 0) return null;
  return from.price / to.price;
};
