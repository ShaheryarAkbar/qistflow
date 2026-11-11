// ============================================================================
// Domain Module: Calendar-Aware Installment Schedule Generator
// Handles: Daily, Weekly, Biweekly, Monthly (month-end clamped), Quarterly, Yearly
// Invariant: Sum of generated installment dueAmountPaisa must exactly equal financedAmountPaisa.
// ============================================================================

import { ScheduleFrequency } from '@/types';

export interface GenerateScheduleParams {
  contractId: string;
  customerId: string;
  tenantId: string;
  financedAmountPaisa: number;
  durationCount: number;
  frequency: ScheduleFrequency;
  firstDueDateKey: string; // YYYY-MM-DD in Asia/Karachi
  monthEndRule?: 'clamp_to_last_day' | 'preserve_end_of_month';
}

export interface GeneratedScheduleEntry {
  sequenceNumber: number;
  dueDateKey: string;
  dueAmountPaisa: number;
  allocatedPaidPaisa: number;
  remainingPaisa: number;
  status: 'upcoming';
}

/**
 * Parses YYYY-MM-DD into year, month (1-indexed), day
 */
function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const parts = dateKey.split('-').map((p) => parseInt(p, 10));
  return { year: parts[0], month: parts[1], day: parts[2] };
}

/**
 * Returns number of days in a given year and month (1-indexed month)
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Formats year, month, day into YYYY-MM-DD
 */
function formatDateKey(year: number, month: number, day: number): string {
  const y = year.toString().padStart(4, '0');
  const m = month.toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates the next due date based on frequency and month-end rules
 */
export function calculateNextDueDate(
  currentDateKey: string,
  frequency: ScheduleFrequency,
  originalDayOfMonth: number,
  sequenceIndex: number,
  firstDueDateKey: string,
  monthEndRule: 'clamp_to_last_day' | 'preserve_end_of_month' = 'clamp_to_last_day'
): string {
  if (sequenceIndex === 0) {
    return currentDateKey;
  }

  const { year, month, day } = parseDateKey(currentDateKey);

  switch (frequency) {
    case 'daily': {
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() + 1);
      return formatDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }

    case 'weekly': {
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() + 7);
      return formatDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }

    case 'biweekly': {
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() + 14);
      return formatDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }

    case 'monthly': {
      // Calculate target month from start
      const first = parseDateKey(firstDueDateKey);
      let targetMonth = first.month + sequenceIndex;
      let targetYear = first.year + Math.floor((targetMonth - 1) / 12);
      targetMonth = ((targetMonth - 1) % 12) + 1;

      const maxDaysInTarget = getDaysInMonth(targetYear, targetMonth);
      let targetDay = originalDayOfMonth;

      if (monthEndRule === 'clamp_to_last_day') {
        targetDay = Math.min(originalDayOfMonth, maxDaysInTarget);
      } else {
        // preserve end of month if start was end of month
        const firstMonthMax = getDaysInMonth(first.year, first.month);
        if (first.day === firstMonthMax) {
          targetDay = maxDaysInTarget;
        } else {
          targetDay = Math.min(originalDayOfMonth, maxDaysInTarget);
        }
      }

      return formatDateKey(targetYear, targetMonth, targetDay);
    }

    case 'quarterly': {
      const first = parseDateKey(firstDueDateKey);
      let targetMonth = first.month + sequenceIndex * 3;
      let targetYear = first.year + Math.floor((targetMonth - 1) / 12);
      targetMonth = ((targetMonth - 1) % 12) + 1;

      const maxDays = getDaysInMonth(targetYear, targetMonth);
      const targetDay = Math.min(originalDayOfMonth, maxDays);
      return formatDateKey(targetYear, targetMonth, targetDay);
    }

    case 'yearly': {
      const first = parseDateKey(firstDueDateKey);
      const targetYear = first.year + sequenceIndex;
      const maxDays = getDaysInMonth(targetYear, first.month);
      const targetDay = Math.min(originalDayOfMonth, maxDays);
      return formatDateKey(targetYear, first.month, targetDay);
    }

    case 'custom':
    default:
      return currentDateKey;
  }
}

/**
 * Generates schedule entries where total amount equals financedAmountPaisa with zero loss.
 */
export function generateScheduleEntries(params: GenerateScheduleParams): GeneratedScheduleEntry[] {
  const {
    financedAmountPaisa,
    durationCount,
    frequency,
    firstDueDateKey,
    monthEndRule = 'clamp_to_last_day',
  } = params;

  if (durationCount <= 0 || financedAmountPaisa <= 0) {
    return [];
  }

  const baseInstallmentPaisa = Math.floor(financedAmountPaisa / durationCount);
  const remainderPaisa = financedAmountPaisa % durationCount;

  const firstDate = parseDateKey(firstDueDateKey);
  const originalDay = firstDate.day;

  const entries: GeneratedScheduleEntry[] = [];
  let currentDate = firstDueDateKey;

  for (let i = 0; i < durationCount; i++) {
    const sequenceNumber = i + 1;
    const dueDateKey = calculateNextDueDate(
      currentDate,
      frequency,
      originalDay,
      i,
      firstDueDateKey,
      monthEndRule
    );

    // Distribute remainder paisa to the last installment so each monthly installment is neat
    const dueAmountPaisa =
      i === durationCount - 1
        ? baseInstallmentPaisa + remainderPaisa
        : baseInstallmentPaisa;

    entries.push({
      sequenceNumber,
      dueDateKey,
      dueAmountPaisa,
      allocatedPaidPaisa: 0,
      remainingPaisa: dueAmountPaisa,
      status: 'upcoming',
    });

    currentDate = dueDateKey;
  }

  return entries;
}
