import { describe, it, expect } from 'vitest';
import { generateScheduleEntries } from '@/domain/schedules/generator';

describe('Domain: Installment Schedule Generator', () => {
  it('generates exact monthly installment entries with zero remainder loss', () => {
    // 50,000 PKR financed over 6 months: 50,000 / 6 = 8,333.33 PKR
    // 5,000,000 paisa / 6 = 833,333 paisa each, remainder 2 paisa distributed to final installment
    const entries = generateScheduleEntries({
      contractId: 'ctr-01',
      customerId: 'cus-01',
      tenantId: 'tenant-01',
      financedAmountPaisa: 5000000,
      durationCount: 6,
      frequency: 'monthly',
      firstDueDateKey: '2026-11-10',
    });

    expect(entries.length).toBe(6);
    expect(entries[0].dueAmountPaisa).toBe(833333);
    expect(entries[5].dueAmountPaisa).toBe(833335);

    // Invariant verification: sum of due amounts must match financed amount exactly
    const totalGeneratedPaisa = entries.reduce((sum, e) => sum + e.dueAmountPaisa, 0);
    expect(totalGeneratedPaisa).toBe(5000000);
  });

  it('correctly clamps month-end dates for February and 30-day months', () => {
    // Contract starts on Jan 31st
    const entries = generateScheduleEntries({
      contractId: 'ctr-02',
      customerId: 'cus-02',
      tenantId: 'tenant-01',
      financedAmountPaisa: 3000000,
      durationCount: 4,
      frequency: 'monthly',
      firstDueDateKey: '2026-01-31',
      monthEndRule: 'clamp_to_last_day',
    });

    expect(entries[0].dueDateKey).toBe('2026-01-31');
    expect(entries[1].dueDateKey).toBe('2026-02-28'); // Feb 28th clamped
    expect(entries[2].dueDateKey).toBe('2026-03-31'); // Mar 31st
    expect(entries[3].dueDateKey).toBe('2026-04-30'); // Apr 30th clamped
  });
});
