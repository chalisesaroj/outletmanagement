// ==============================================================================
// Bikram Sambat (BS) / Nepalese Calendar Utility
// Accurate conversion between Gregorian (AD) and Bikram Sambat (BS)
// ==============================================================================

export const NEPALI_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

export const NEPALI_MONTHS_NP = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भाद्र',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फाल्गुन',
  'चैत',
] as const;

export const NEPALI_NUMERALS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toNepaliNumerals(num: number | string): string {
  return String(num).replace(/[0-9]/g, (digit) => NEPALI_NUMERALS[parseInt(digit, 10)]);
}

/**
 * Days in BS months lookup from 2080 to 2085 BS
 * Each array has 12 entries corresponding to Baisakh to Chaitra
 */
const BS_MONTH_DAYS: Record<number, number[]> = {
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 32, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
};

// Anchor: 2024-04-13 AD is 2081-01-01 BS (1 Baisakh 2081)
const ANCHOR_AD_DATE = new Date(2024, 3, 13); // Note: month is 0-indexed in JS (3 = April)
const ANCHOR_BS_YEAR = 2081;
const ANCHOR_BS_MONTH = 1; // 1-indexed
const ANCHOR_BS_DAY = 1;

export interface NepaliDateInfo {
  year: number;
  month: number;
  day: number;
  monthNameEn: string;
  monthNameNp: string;
  formattedEn: string;
  formattedNp: string;
}

/**
 * Converts a Javascript Date (or ISO date string) to Bikram Sambat (BS) date
 */
export function getNepaliDate(dateInput: Date | string = new Date()): NepaliDateInfo {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Strip time part for pure day-level delta calculation
  const targetUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const anchorUtc = Date.UTC(
    ANCHOR_AD_DATE.getFullYear(),
    ANCHOR_AD_DATE.getMonth(),
    ANCHOR_AD_DATE.getDate()
  );

  let diffDays = Math.round((targetUtc - anchorUtc) / (1000 * 60 * 60 * 24));

  let bsYear = ANCHOR_BS_YEAR;
  let bsMonth = ANCHOR_BS_MONTH;
  let bsDay = ANCHOR_BS_DAY;

  if (diffDays >= 0) {
    while (diffDays > 0) {
      const daysInYear = BS_MONTH_DAYS[bsYear] || [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 29, 30];
      const daysInCurrentMonth = daysInYear[bsMonth - 1];

      if (diffDays >= daysInCurrentMonth - bsDay + 1) {
        diffDays -= (daysInCurrentMonth - bsDay + 1);
        bsDay = 1;
        bsMonth++;
        if (bsMonth > 12) {
          bsMonth = 1;
          bsYear++;
        }
      } else {
        bsDay += diffDays;
        diffDays = 0;
      }
    }
  } else {
    while (diffDays < 0) {
      bsMonth--;
      if (bsMonth < 1) {
        bsMonth = 12;
        bsYear--;
      }
      const daysInYear = BS_MONTH_DAYS[bsYear] || [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 29, 30];
      const daysInCurrentMonth = daysInYear[bsMonth - 1];

      if (Math.abs(diffDays) >= daysInCurrentMonth) {
        diffDays += daysInCurrentMonth;
      } else {
        bsDay = daysInCurrentMonth + diffDays + 1;
        diffDays = 0;
      }
    }
  }

  const monthIdx = bsMonth - 1;
  const monthNameEn = NEPALI_MONTHS_EN[monthIdx] || 'Baisakh';
  const monthNameNp = NEPALI_MONTHS_NP[monthIdx] || 'बैशाख';

  const formattedEn = `${bsDay} ${monthNameEn} ${bsYear} BS`;
  const formattedNp = `${toNepaliNumerals(bsDay)} ${monthNameNp} ${toNepaliNumerals(bsYear)}`;

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    monthNameEn,
    monthNameNp,
    formattedEn,
    formattedNp,
  };
}

/**
 * Returns formatted dual date string: e.g. "2026-11-07 (22 Kartik 2083 BS)"
 */
export function formatDualDate(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const adStr = d.toISOString().split('T')[0];
  const bsInfo = getNepaliDate(d);
  return `${adStr} (${bsInfo.formattedEn})`;
}
