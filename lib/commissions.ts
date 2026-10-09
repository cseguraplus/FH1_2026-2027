// Plan confirmado por Carlos el 6 de octubre de 2026.
export const ticketPrice = 2500;
export const commissionRates = [36, 9, 5] as const;
export const commissionAmounts = commissionRates.map(rate => ticketPrice * rate / 100);
export function commissionTotal(counts: readonly number[]): number {
  return commissionAmounts.reduce((total, amount, level) => total + amount * (counts[level] ?? 0), 0);
}
