export function sanitizeNumericInput(
  value: string,
  decimalPlaces = 0,
): string {
  const numericValue = value.replace(/[^\d.]/g, '');
  if (decimalPlaces <= 0) return numericValue.replace(/\./g, '');

  const decimalIndex = numericValue.indexOf('.');
  if (decimalIndex === -1) return numericValue;

  const whole = numericValue.slice(0, decimalIndex) || '0';
  const fraction = numericValue
    .slice(decimalIndex + 1)
    .replace(/\./g, '')
    .slice(0, decimalPlaces);
  return `${whole}.${fraction}`;
}
