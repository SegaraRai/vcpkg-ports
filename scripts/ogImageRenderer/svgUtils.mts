const PRECISION = 8;

export function renderNumber(number: number): string {
  return number
    .toFixed(PRECISION)
    .replace(/\.?0+$/, '')
    .replace(/^-0$/, '0');
}
