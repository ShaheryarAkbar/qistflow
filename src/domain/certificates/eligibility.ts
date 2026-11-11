// ============================================================================
// Domain Module: Clearance Certificate Eligibility
// Invariant: Certificate can only be issued when outstanding is exactly 0 paisa.
// ============================================================================

import { Contract, ScheduleEntry } from '@/types';

export interface EligibilityResult {
  isEligible: boolean;
  contractId: string;
  reconciledOutstandingPaisa: number;
  totalReceivedPaisa: number;
  reason?: string;
}

export function checkClearanceEligibility(
  contract: Contract,
  scheduleEntries: ScheduleEntry[]
): EligibilityResult {
  // Reconcile outstanding directly from schedule entries
  const totalScheduleRemainingPaisa = scheduleEntries.reduce(
    (sum, entry) => sum + Math.max(0, entry.remainingPaisa),
    0
  );

  const totalSchedulePaidPaisa = scheduleEntries.reduce(
    (sum, entry) => sum + Math.max(0, entry.allocatedPaidPaisa),
    0
  );

  // Invariant check: Outstanding must be 0
  if (totalScheduleRemainingPaisa > 0) {
    return {
      isEligible: false,
      contractId: contract.contractId,
      reconciledOutstandingPaisa: totalScheduleRemainingPaisa,
      totalReceivedPaisa: totalSchedulePaidPaisa,
      reason: `Contract still has an outstanding balance of ${totalScheduleRemainingPaisa / 100} PKR.`,
    };
  }

  return {
    isEligible: true,
    contractId: contract.contractId,
    reconciledOutstandingPaisa: 0,
    totalReceivedPaisa: totalSchedulePaidPaisa,
  };
}
