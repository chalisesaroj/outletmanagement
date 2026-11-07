// ==============================================================================
// Currency & Tax Helpers (Nepal Rupee - NPR, 13% VAT, PAN Validator)
// ==============================================================================

/**
 * Formats numbers in standard South Asian numbering format (Lakhs & Crores)
 * e.g., 1250000 -> 12,50,000.00
 */
export function formatNPR(amount: number | string | undefined | null, showSymbol = true): string {
  const val = typeof amount === 'number' ? amount : parseFloat(amount || '0') || 0;
  
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const fixed = absVal.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // Format integer with Nepali/Indian commas: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const formattedNumber = `${isNegative ? '-' : ''}${formattedInteger}.${decimalPart}`;

  if (showSymbol) {
    return `रू ${formattedNumber}`;
  }
  return formattedNumber;
}

/**
 * Calculates standard Nepalese VAT (13% default)
 */
export interface VatCalculationResult {
  taxableAmount: number;
  vatAmount: number;
  totalWithVat: number;
}

export function calculateVat(taxableAmount: number, vatPercent = 13.0): VatCalculationResult {
  const vatAmount = (taxableAmount * vatPercent) / 100;
  const totalWithVat = taxableAmount + vatAmount;

  return {
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalWithVat: Math.round(totalWithVat * 100) / 100,
  };
}

/**
 * Extracts VAT from gross amount (tax inclusive)
 */
export function extractVat(grossAmount: number, vatPercent = 13.0): VatCalculationResult {
  const taxableAmount = grossAmount / (1 + vatPercent / 100);
  const vatAmount = grossAmount - taxableAmount;

  return {
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalWithVat: Math.round(grossAmount * 100) / 100,
  };
}

/**
 * Validates a Nepalese PAN / VAT Number (typically 9 digits)
 */
export function isValidPan(pan: string | undefined | null): boolean {
  if (!pan) return false;
  const cleanPan = pan.trim().replace(/[^0-9]/g, '');
  return cleanPan.length === 9;
}
