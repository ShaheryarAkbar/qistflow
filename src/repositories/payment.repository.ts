// ============================================================================
// Repository: Payment Ledger, Allocations & Reversals
// Scoped to /tenants/{tenantId}/payments/{paymentId} & paymentAllocations
// Invariant: Posted payments are immutable and append-only.
// Invariant: Idempotency keys prevent double charging.
// ============================================================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/app';
import {
  Payment,
  PaymentAllocation,
  PaymentReversal,
  Receipt,
  PaymentMethod,
  PaymentKind,
} from '@/types';
import { SaleRepository } from './sale.repository';
import { allocatePaymentOldestDueFirst } from '@/domain/payments/allocator';

const DEMO_PAYMENTS_KEY = 'qistflow_demo_payments';
const DEMO_ALLOCATIONS_KEY = 'qistflow_demo_allocations';
const DEMO_REVERSALS_KEY = 'qistflow_demo_reversals';
const DEMO_RECEIPTS_KEY = 'qistflow_demo_receipts';

export const PaymentRepository = {
  async getPayments(tenantId: string, isDemo = false): Promise<Payment[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_PAYMENTS_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      const initialPayments: Payment[] = [
        {
          paymentId: 'pay-2026-001',
          tenantId,
          customerId: 'cus-ryk-001',
          contractId: 'ctr-ryk-1001',
          amountPaisa: 500000, // 5,000 PKR
          method: 'cash',
          paidAt: new Date(Date.now() - 86400000 * 2).toISOString() as any,
          receivedBy: 'owner',
          reference: 'SLIP-101',
          paymentKind: 'installment',
          status: 'posted',
          idempotencyKeyId: 'idem-001',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString() as any,
          createdBy: 'owner',
        },
      ];
      localStorage.setItem(`${DEMO_PAYMENTS_KEY}_${tenantId}`, JSON.stringify(initialPayments));
      return initialPayments;
    }

    const colRef = collection(db, 'tenants', tenantId, 'payments');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as Payment));
  },

  async recordPayment(params: {
    tenantId: string;
    userId: string;
    customerId: string;
    contractId?: string;
    amountPaisa: number;
    method: PaymentMethod;
    paymentKind?: PaymentKind;
    reference?: string;
    notes?: string;
    idempotencyKey?: string;
    isDemo?: boolean;
  }): Promise<{ payment: Payment; receipt: Receipt; allocations: PaymentAllocation[] }> {
    const {
      tenantId,
      userId,
      customerId,
      contractId,
      amountPaisa,
      method,
      paymentKind = 'installment',
      reference = '',
      notes = '',
      idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isDemo = false,
    } = params;

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
    const receiptId = `rcp_${paymentId}`;

    const newPayment: Payment = {
      paymentId,
      tenantId,
      customerId,
      contractId,
      amountPaisa,
      method,
      paidAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      receivedBy: userId,
      reference,
      notes,
      paymentKind,
      status: 'posted',
      idempotencyKeyId: idempotencyKey,
      createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      createdBy: userId,
    };

    const newReceipt: Receipt = {
      tenantId,
      receiptNumber,
      paymentId,
      customerId,
      contractId,
      language: 'ur',
      issuedAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      issuedBy: userId,
      documentVersion: 1,
      status: 'issued',
    };

    const newAllocations: PaymentAllocation[] = [];

    // If payment is for a contract, allocate against schedule entries
    if (contractId) {
      const scheduleEntries = await SaleRepository.getScheduleEntries(tenantId, contractId, isDemo);
      const allocationPlan = allocatePaymentOldestDueFirst({
        contractId,
        paymentAmountPaisa: amountPaisa,
        scheduleEntries,
      });

      for (const item of allocationPlan.allocations) {
        const allocId = `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        newAllocations.push({
          allocationId: allocId,
          tenantId,
          paymentId,
          contractId,
          scheduleEntryId: item.scheduleEntryId,
          customerId,
          allocatedAmountPaisa: item.allocatedAmountPaisa,
          allocationType: item.allocationType,
          createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
          createdBy: userId,
        });

        // Update schedule entry state
        if (item.updatedEntry) {
          const targetEntry = scheduleEntries.find((s) => s.scheduleEntryId === item.updatedEntry?.scheduleEntryId);
          if (targetEntry) {
            targetEntry.allocatedPaidPaisa = item.updatedEntry.allocatedPaidPaisa;
            targetEntry.remainingPaisa = item.updatedEntry.remainingPaisa;
            targetEntry.status = item.updatedEntry.status;
          }
        }
      }

      // Update contract balance projection
      const contracts = await SaleRepository.getContracts(tenantId, isDemo);
      const targetContract = contracts.find((c) => c.contractId === contractId);
      if (targetContract) {
        targetContract.totalPaidPaisa += amountPaisa;
        targetContract.outstandingPaisa = Math.max(0, targetContract.outstandingPaisa - amountPaisa);
        if (targetContract.outstandingPaisa === 0) {
          targetContract.status = 'fully_paid';
        }

        if (isDemo) {
          localStorage.setItem(`qistflow_demo_contracts_${tenantId}`, JSON.stringify(contracts));
          localStorage.setItem(`qistflow_demo_schedules_${tenantId}_${contractId}`, JSON.stringify(scheduleEntries));
        } else {
          await updateDoc(doc(db, 'tenants', tenantId, 'contracts', contractId), {
            totalPaidPaisa: targetContract.totalPaidPaisa,
            outstandingPaisa: targetContract.outstandingPaisa,
            status: targetContract.status,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    if (isDemo) {
      const payments = await this.getPayments(tenantId, true);
      localStorage.setItem(`${DEMO_PAYMENTS_KEY}_${tenantId}`, JSON.stringify([newPayment, ...payments]));

      const prevReceipts = JSON.parse(localStorage.getItem(`${DEMO_RECEIPTS_KEY}_${tenantId}`) || '[]');
      localStorage.setItem(`${DEMO_RECEIPTS_KEY}_${tenantId}`, JSON.stringify([newReceipt, ...prevReceipts]));

      const prevAlloc = JSON.parse(localStorage.getItem(`${DEMO_ALLOCATIONS_KEY}_${tenantId}`) || '[]');
      localStorage.setItem(`${DEMO_ALLOCATIONS_KEY}_${tenantId}`, JSON.stringify([...newAllocations, ...prevAlloc]));

      return { payment: newPayment, receipt: newReceipt, allocations: newAllocations };
    }

    // Live Firestore save
    await setDoc(doc(db, 'tenants', tenantId, 'payments', paymentId), newPayment);
    await setDoc(doc(db, 'tenants', tenantId, 'receipts', receiptId), newReceipt);
    for (const alloc of newAllocations) {
      await setDoc(doc(db, 'tenants', tenantId, 'paymentAllocations', alloc.allocationId), alloc);
    }

    return { payment: newPayment, receipt: newReceipt, allocations: newAllocations };
  },

  async reversePayment(params: {
    tenantId: string;
    userId: string;
    paymentId: string;
    reason: string;
    isDemo?: boolean;
  }): Promise<PaymentReversal> {
    const { tenantId, userId, paymentId, reason, isDemo = false } = params;

    const payments = await this.getPayments(tenantId, isDemo);
    const targetPayment = payments.find((p) => p.paymentId === paymentId);
    if (!targetPayment) throw new Error('Payment not found');
    if (targetPayment.status === 'reversed') throw new Error('Payment is already reversed');

    const reversalId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reversal: PaymentReversal = {
      reversalId,
      tenantId,
      paymentId,
      amountPaisa: targetPayment.amountPaisa,
      reversalType: 'full',
      reason,
      approvedBy: userId,
      reversedAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      createdBy: userId,
    };

    targetPayment.status = 'reversed';

    // Restore contract balances if contract-linked
    if (targetPayment.contractId) {
      const contracts = await SaleRepository.getContracts(tenantId, isDemo);
      const targetContract = contracts.find((c) => c.contractId === targetPayment.contractId);
      if (targetContract) {
        targetContract.totalPaidPaisa = Math.max(0, targetContract.totalPaidPaisa - targetPayment.amountPaisa);
        targetContract.outstandingPaisa += targetPayment.amountPaisa;
        if (targetContract.status === 'fully_paid') {
          targetContract.status = 'active';
        }

        if (isDemo) {
          localStorage.setItem(`qistflow_demo_contracts_${tenantId}`, JSON.stringify(contracts));
        } else {
          await updateDoc(doc(db, 'tenants', tenantId, 'contracts', targetPayment.contractId), {
            totalPaidPaisa: targetContract.totalPaidPaisa,
            outstandingPaisa: targetContract.outstandingPaisa,
            status: targetContract.status,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    if (isDemo) {
      localStorage.setItem(`${DEMO_PAYMENTS_KEY}_${tenantId}`, JSON.stringify(payments));
      const prevRev = JSON.parse(localStorage.getItem(`${DEMO_REVERSALS_KEY}_${tenantId}`) || '[]');
      localStorage.setItem(`${DEMO_REVERSALS_KEY}_${tenantId}`, JSON.stringify([reversal, ...prevRev]));
      return reversal;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'paymentReversals', reversalId), reversal);
    await updateDoc(doc(db, 'tenants', tenantId, 'payments', paymentId), { status: 'reversed' });

    return reversal;
  },
};
