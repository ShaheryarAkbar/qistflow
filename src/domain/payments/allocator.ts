// ============================================================================
// Domain Module: Payment Allocation Engine
// Strategy: Oldest Due First (Deterministic) with Unapplied / Advance Credit
// Invariant: Sum of allocations must exactly equal valid payment amount.
// ============================================================================

import { ScheduleEntry, AllocationType } from '@/types';

export interface AllocationResult {
  scheduleEntryId?: string;
  contractId: string;
  allocatedAmountPaisa: number;
  allocationType: AllocationType;
  updatedEntry?: {
    scheduleEntryId: string;
    allocatedPaidPaisa: number;
    remainingPaisa: number;
    status: 'upcoming' | 'due' | 'partially_paid' | 'paid' | 'overdue';
  };
}

export interface PaymentAllocationPlan {
  paymentAmountPaisa: number;
  totalAllocatedPaisa: number;
  unappliedPaisa: number;
  allocations: AllocationResult[];
}

export function allocatePaymentOldestDueFirst(params: {
  contractId: string;
  paymentAmountPaisa: number;
  scheduleEntries: ScheduleEntry[];
}): PaymentAllocationPlan {
  const { contractId, paymentAmountPaisa, scheduleEntries } = params;

  if (paymentAmountPaisa <= 0) {
    return {
      paymentAmountPaisa: 0,
      totalAllocatedPaisa: 0,
      unappliedPaisa: 0,
      allocations: [],
    };
  }

  // Sort schedule entries by sequenceNumber
  const sortedEntries = [...scheduleEntries].sort(
    (a, b) => a.sequenceNumber - b.sequenceNumber
  );

  let remainingPaymentPaisa = paymentAmountPaisa;
  const allocations: AllocationResult[] = [];

  for (const entry of sortedEntries) {
    if (remainingPaymentPaisa <= 0) break;

    // Remaining due amount on this schedule entry
    const entryDuePaisa = entry.remainingPaisa;
    if (entryDuePaisa <= 0) continue; // Already paid

    const allocatedForThis = Math.min(remainingPaymentPaisa, entryDuePaisa);
    const newPaidPaisa = entry.allocatedPaidPaisa + allocatedForThis;
    const newRemainingPaisa = entry.dueAmountPaisa - newPaidPaisa;

    const newStatus =
      newRemainingPaisa === 0
        ? 'paid'
        : ('partially_paid' as const);

    allocations.push({
      scheduleEntryId: entry.scheduleEntryId,
      contractId,
      allocatedAmountPaisa: allocatedForThis,
      allocationType: 'schedule',
      updatedEntry: {
        scheduleEntryId: entry.scheduleEntryId,
        allocatedPaidPaisa: newPaidPaisa,
        remainingPaisa: newRemainingPaisa,
        status: newStatus,
      },
    });

    remainingPaymentPaisa -= allocatedForThis;
  }

  // If excess payment remains after settling all schedule entries, record as advance credit
  if (remainingPaymentPaisa > 0) {
    allocations.push({
      contractId,
      allocatedAmountPaisa: remainingPaymentPaisa,
      allocationType: 'advance_credit',
    });
  }

  const totalAllocatedPaisa = allocations.reduce(
    (sum, a) => sum + a.allocatedAmountPaisa,
    0
  );

  return {
    paymentAmountPaisa,
    totalAllocatedPaisa,
    unappliedPaisa: remainingPaymentPaisa > 0 ? remainingPaymentPaisa : 0,
    allocations,
  };
}

