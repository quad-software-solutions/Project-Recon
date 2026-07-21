const CURRENCY = 'ETB';

function formatAmount(value: number, fractionDigits: { min: number; max: number }): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits.min,
    maximumFractionDigits: fractionDigits.max,
  });
}

export function formatMoney(amount: number | string | null | undefined): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${CURRENCY} 0.00`;
  return `${CURRENCY} ${formatAmount(value, { min: 2, max: 2 })}`;
}

export function formatMoneyCompact(amount: number | string | null | undefined): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${CURRENCY} 0`;
  return `${CURRENCY} ${formatAmount(value, { min: 0, max: 2 })}`;
}

export { CURRENCY };
