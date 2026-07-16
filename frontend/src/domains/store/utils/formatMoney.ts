const CURRENCY = 'ETB';

export function formatMoney(amount: number | string | null | undefined): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `0.00 ${CURRENCY}`;
  return `${value.toFixed(2)} ${CURRENCY}`;
}

export function formatMoneyCompact(amount: number | string | null | undefined): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `0 ${CURRENCY}`;
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${CURRENCY}`;
}

export { CURRENCY };
