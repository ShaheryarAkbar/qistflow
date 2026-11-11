// ============================================================================
// Domain Module: Money & Paisa Fixed-Precision Calculations
// Invariant: 1 PKR = 100 Paisa. Floating point values are strictly forbidden.
// ============================================================================

export function rupeesToPaisa(rupees: number | string): number {
  if (typeof rupees === 'string') {
    // Clean currency symbols, commas and spaces
    const cleaned = rupees.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }
  return Math.round(rupees * 100);
}

export function paisaToRupees(paisa: number): number {
  return Math.round(paisa) / 100;
}

export function addPaisa(...amounts: number[]): number {
  return amounts.reduce((acc, curr) => acc + Math.round(curr || 0), 0);
}

export function subtractPaisa(minuend: number, subtrahend: number): number {
  return Math.round(minuend || 0) - Math.round(subtrahend || 0);
}

export function multiplyPaisa(paisa: number, factor: number): number {
  return Math.round(paisa * factor);
}

export function formatPKR(
  paisa: number,
  options: {
    locale?: 'en' | 'ur';
    showCurrencySymbol?: boolean;
    useUrduNumerals?: boolean;
  } = {}
): string {
  const {
    locale = 'en',
    showCurrencySymbol = true,
    useUrduNumerals = false,
  } = options;

  const rupees = Math.abs(paisaToRupees(paisa));
  const isNegative = paisa < 0;

  // Pakistani standard grouping (Lakhs and Crores or standard thousands)
  const formattedNumber = new Intl.NumberFormat(locale === 'ur' ? 'ur-PK' : 'en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);

  let finalNumber = formattedNumber;
  if (useUrduNumerals) {
    const urduDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    finalNumber = finalNumber.replace(/[0-9]/g, (d) => urduDigits[parseInt(d, 10)]);
  }

  const sign = isNegative ? '-' : '';
  if (!showCurrencySymbol) {
    return `${sign}${finalNumber}`;
  }

  if (locale === 'ur') {
    return `${sign}روپے ${finalNumber}`;
  }

  return `${sign}Rs. ${finalNumber}`;
}

