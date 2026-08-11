export const SUPPORTED_CURRENCIES = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", locale: "en-NG" },
  { code: "GHS", symbol: "₵", label: "Ghanaian Cedi", locale: "en-GH" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling", locale: "en-KE" },
  { code: "ZAR", symbol: "R", label: "South African Rand", locale: "en-ZA" },
  { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code) as readonly string[];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_CODES.includes(value);
}

export function currencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

/** Formats an amount for display. Falls back to a plain symbol + number if Intl lacks the locale. */
export function formatMoney(amount: number, code: string): string {
  const entry = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(entry?.locale ?? "en-US", {
      style: "currency",
      currency: entry?.code ?? "USD",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${currencySymbol(code)}${safe.toFixed(2)}`;
  }
}
