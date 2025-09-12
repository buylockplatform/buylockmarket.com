/**
 * Utility functions for handling monetary values consistently
 * All monetary values come from the API as strings (from decimal database fields)
 * and need to be parsed for calculations/comparisons
 */

/**
 * Parse a monetary string value to a number for calculations
 * @param value - String representation of money (e.g., "123.45")
 * @returns Parsed number or 0 if invalid
 */
export function parseMoneyToNumber(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a monetary value for display
 * @param value - String or number representation of money
 * @param currency - Currency symbol to prefix (default: "KES")
 * @returns Formatted money string (e.g., "KES 1,234.56")
 */
export function formatMoney(value: string | number | null | undefined, currency: string = "KES"): string {
  const numValue = typeof value === 'string' ? parseMoneyToNumber(value) : (value || 0);
  return `${currency} ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a monetary value for display without currency symbol
 * @param value - String or number representation of money
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatMoneyNumber(value: string | number | null | undefined): string {
  const numValue = typeof value === 'string' ? parseMoneyToNumber(value) : (value || 0);
  return numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Compare two monetary values
 * @param value1 - First monetary value (string or number)
 * @param value2 - Second monetary value (string or number)
 * @returns Comparison result (-1, 0, 1)
 */
export function compareMoney(value1: string | number | null | undefined, value2: string | number | null | undefined): number {
  const num1 = typeof value1 === 'string' ? parseMoneyToNumber(value1) : (value1 || 0);
  const num2 = typeof value2 === 'string' ? parseMoneyToNumber(value2) : (value2 || 0);
  
  if (num1 < num2) return -1;
  if (num1 > num2) return 1;
  return 0;
}

/**
 * Check if one monetary value is greater than another
 * @param value1 - First monetary value (string or number)
 * @param value2 - Second monetary value (string or number)
 * @returns True if value1 > value2
 */
export function isMoneyGreater(value1: string | number | null | undefined, value2: string | number | null | undefined): boolean {
  return compareMoney(value1, value2) > 0;
}

/**
 * Check if one monetary value is greater than or equal to another
 * @param value1 - First monetary value (string or number)
 * @param value2 - Second monetary value (string or number)
 * @returns True if value1 >= value2
 */
export function isMoneyGreaterOrEqual(value1: string | number | null | undefined, value2: string | number | null | undefined): boolean {
  return compareMoney(value1, value2) >= 0;
}

/**
 * Add two monetary values
 * @param value1 - First monetary value (string or number)
 * @param value2 - Second monetary value (string or number)
 * @returns Sum as number
 */
export function addMoney(value1: string | number | null | undefined, value2: string | number | null | undefined): number {
  const num1 = typeof value1 === 'string' ? parseMoneyToNumber(value1) : (value1 || 0);
  const num2 = typeof value2 === 'string' ? parseMoneyToNumber(value2) : (value2 || 0);
  return num1 + num2;
}

/**
 * Subtract two monetary values
 * @param value1 - First monetary value (string or number)
 * @param value2 - Second monetary value (string or number)
 * @returns Difference as number
 */
export function subtractMoney(value1: string | number | null | undefined, value2: string | number | null | undefined): number {
  const num1 = typeof value1 === 'string' ? parseMoneyToNumber(value1) : (value1 || 0);
  const num2 = typeof value2 === 'string' ? parseMoneyToNumber(value2) : (value2 || 0);
  return num1 - num2;
}

/**
 * Convert a number to a string representation for API calls
 * @param value - Number value
 * @returns String representation with 2 decimal places
 */
export function numberToMoneyString(value: number): string {
  return value.toFixed(2);
}

/**
 * Validate if a monetary input is valid
 * @param value - Input value to validate
 * @returns True if valid monetary value
 */
export function isValidMoneyInput(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}