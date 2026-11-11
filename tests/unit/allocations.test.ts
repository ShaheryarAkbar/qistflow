import { describe, it, expect } from 'vitest';
import { allocatePaymentOldestDueFirst } from '@/domain/payments/allocator';
import { ScheduleEntry } from '@/types';

describe('Domain: Payment Allocation Engine', () => {
  const sampleEntries: ScheduleEntry[] = [
    {
      scheduleEntryId: 'sch-1',
      tenantId: 't-1',
      contractId: 'ctr-1',
      customerId: 'cus-1',
      sequenceNumber: 1,
      dueDateKey: '2026-09-01',
      dueAmountPaisa: 500000, // 5,000 PKR
      allocatedPaidPaisa: 0,
      remainingPaisa: 500000,
      status: 'upcoming',
      createdAt: null,
      createdBy: 'user',
      updatedAt: null,
    },
    {
      scheduleEntryId: 'sch-2',
      tenantId: 't-1',
      contractId: 'ctr-1',
      customerId: 'cus-1',
      sequenceNumber: 2,
      dueDateKey: '2026-10-01',
      dueAmountPaisa: 500000, // 5,000 PKR
      allocatedPaidPaisa: 0,
      remainingPaisa: 500000,
      status: 'upcoming',
      createdAt: null,
      createdBy: 'user',
      updatedAt: null,
    },
  ];

  it('correctly allocates partial payment across multiple installments', () => {
    // Customer pays 7,000 PKR (700,000 paisa)
    // Settle entry 1 in full (5,000 PKR) and allocate 2,000 PKR to entry 2
    const result = allocatePaymentOldestDueFirst({
      contractId: 'ctr-1',
      paymentAmountPaisa: 700000,
      scheduleEntries: sampleEntries,
    });

    expect(result.totalAllocatedPaisa).toBe(700000);
    expect(result.allocations.length).toBe(2);

    expect(result.allocations[0].allocatedAmountPaisa).toBe(500000);
    expect(result.allocations[0].updatedEntry?.status).toBe('paid');
    expect(result.allocations[0].updatedEntry?.remainingPaisa).toBe(0);

    expect(result.allocations[1].allocatedAmountPaisa).toBe(200000);
    expect(result.allocations[1].updatedEntry?.status).toBe('partially_paid');
    expect(result.allocations[1].updatedEntry?.remainingPaisa).toBe(300000);
  });

  it('allocates excess overpayment as advance credit', () => {
    // Customer pays 12,000 PKR (1,200,000 paisa) when only 10,000 is due
    const result = allocatePaymentOldestDueFirst({
      contractId: 'ctr-1',
      paymentAmountPaisa: 1200000,
      scheduleEntries: sampleEntries,
    });

    expect(result.totalAllocatedPaisa).toBe(1200000);
    expect(result.unappliedPaisa).toBe(200000); // 2,000 PKR advance credit
    expect(result.allocations[2].allocationType).toBe('advance_credit');
  });
});
