// ============================================================================
// Repository: Sales POS & Installment Contracts
// Scoped to /tenants/{tenantId}/sales/{saleId} & contracts/{contractId}
// Invariant: Full item snapshots are stored immutably at the time of sale.
// ============================================================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/app';
import {
  Sale,
  Contract,
  ScheduleEntry,
  SaleItemSnapshot,
  ScheduleFrequency,
} from '@/types';
import { generateScheduleEntries } from '@/domain/schedules/generator';
import { InventoryRepository } from './inventory.repository';

const DEMO_SALES_KEY = 'qistflow_demo_sales';
const DEMO_CONTRACTS_KEY = 'qistflow_demo_contracts';
const DEMO_SCHEDULE_KEY = 'qistflow_demo_schedules';

export const getInitialDemoContracts = (tenantId: string): Contract[] => {
  const todayKey = new Date().toISOString().split('T')[0];
  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
  const oneMonthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const twoMonthsAgo = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0];

  return [
    // Contract 1: Muhammad Arshad (cus-ryk-001) - Super Asia Washing Machine
    // Financed: Rs. 36,000 across 6 months = Rs. 6,000 / month
    {
      contractId: 'ctr-ryk-1001',
      tenantId,
      customerId: 'cus-ryk-001',
      saleId: 'sale-2001',
      contractCode: 'CTR-2026-001',
      itemsSnapshot: [
        {
          productId: 'prd-sa-240',
          productNameSnapshot: 'Super Asia Washing Machine (SA-240)',
          quantity: 1,
          cashUnitPricePaisa: 3800000,
          agreedUnitPricePaisa: 4800000,
          lineTotalPaisa: 4800000,
        },
      ],
      cashPriceTotalPaisa: 3800000,
      installmentPriceTotalPaisa: 4800000,
      discountPaisa: 0,
      advancePaisa: 1200000,           // Rs. 12,000 advance
      financedAmountPaisa: 3600000,     // Rs. 36,000 financed
      totalPaidPaisa: 1800000,          // Advance + Inst #1 (Rs. 18,000)
      outstandingPaisa: 3000000,       // Rs. 30,000 remaining
      frequency: 'monthly',
      durationCount: 6,
      startDateKey: oneMonthAgo,
      firstDueDateKey: oneMonthAgo,
      schedulePolicy: { monthEndRule: 'clamp_to_last_day' },
      status: 'active',
      createdAt: oneMonthAgo as any,
      createdBy: 'owner',
      updatedAt: todayKey as any,
      updatedBy: 'owner',
    },
    // Contract 2: Tariq Mehmood (cus-ryk-002) - Waves Deep Freezer (WF-314)
    // Financed: Rs. 72,000 across 6 months = Rs. 12,000 / month (Clean math!)
    {
      contractId: 'ctr-ryk-1002',
      tenantId,
      customerId: 'cus-ryk-002',
      saleId: 'sale-2002',
      contractCode: 'CTR-2026-002',
      itemsSnapshot: [
        {
          productId: 'prd-wv-314',
          productNameSnapshot: 'Waves Deep Freezer (WF-314)',
          quantity: 1,
          cashUnitPricePaisa: 7200000,
          agreedUnitPricePaisa: 9200000,
          lineTotalPaisa: 9200000,
        },
      ],
      cashPriceTotalPaisa: 7200000,
      installmentPriceTotalPaisa: 9200000,
      discountPaisa: 0,
      advancePaisa: 2000000,           // Rs. 20,000 advance
      financedAmountPaisa: 7200000,     // Rs. 72,000 financed
      totalPaidPaisa: 4400000,          // Advance 20k + Inst #1 12k + Inst #2 12k = Rs. 44,000
      outstandingPaisa: 4800000,       // Rs. 48,000 remaining balance
      frequency: 'monthly',
      durationCount: 6,
      startDateKey: twoMonthsAgo,
      firstDueDateKey: twoMonthsAgo,
      schedulePolicy: { monthEndRule: 'clamp_to_last_day' },
      status: 'active',
      createdAt: twoMonthsAgo as any,
      createdBy: 'owner',
      updatedAt: todayKey as any,
      updatedBy: 'owner',
    },
    // Contract 3: Zahid Hussain (cus-ryk-003) - Samsung 43" Smart LED TV 4K
    // Financed: Rs. 90,000 across 9 months = Rs. 10,000 / month
    {
      contractId: 'ctr-ryk-1003',
      tenantId,
      customerId: 'cus-ryk-003',
      saleId: 'sale-2003',
      contractCode: 'CTR-2026-003',
      itemsSnapshot: [
        {
          productId: 'prd-sams-43',
          productNameSnapshot: 'Samsung 43" Smart LED TV 4K',
          quantity: 1,
          cashUnitPricePaisa: 8800000,
          agreedUnitPricePaisa: 11500000,
          lineTotalPaisa: 11500000,
        },
      ],
      cashPriceTotalPaisa: 8800000,
      installmentPriceTotalPaisa: 11500000,
      discountPaisa: 0,
      advancePaisa: 2500000,           // Rs. 25,000 advance
      financedAmountPaisa: 9000000,     // Rs. 90,000 financed
      totalPaidPaisa: 3500000,          // Advance 25k + Inst #1 10k = Rs. 35,000
      outstandingPaisa: 8000000,       // Rs. 80,000 remaining balance
      frequency: 'monthly',
      durationCount: 9,
      startDateKey: oneMonthAgo,
      firstDueDateKey: oneMonthAgo,
      schedulePolicy: { monthEndRule: 'clamp_to_last_day' },
      status: 'active',
      createdAt: oneMonthAgo as any,
      createdBy: 'owner',
      updatedAt: todayKey as any,
      updatedBy: 'owner',
    },
  ];
};

export const SaleRepository = {
  async getSales(tenantId: string, isDemo = false): Promise<Sale[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_SALES_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);
      return [];
    }

    const colRef = collection(db, 'tenants', tenantId, 'sales');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Sale));
  },

  async getContracts(tenantId: string, isDemo = false): Promise<Contract[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_CONTRACTS_KEY}_${tenantId}`);
      if (stored) {
        let contracts: Contract[] = JSON.parse(stored);
        const hasTariq = contracts.some((c) => c.contractId === 'ctr-ryk-1002');
        const hasZahid = contracts.some((c) => c.contractId === 'ctr-ryk-1003');
        const hasBad29k = contracts.some(
          (c) => c.outstandingPaisa === 2900000 || c.installmentPriceTotalPaisa === 2900000
        );

        if (!hasTariq || !hasZahid || hasBad29k) {
          const defaults = getInitialDemoContracts(tenantId);
          const userCreated = contracts.filter(
            (c) =>
              !['ctr-ryk-1001', 'ctr-ryk-1002', 'ctr-ryk-1003'].includes(c.contractId) &&
              c.outstandingPaisa !== 2900000
          );
          contracts = [...defaults, ...userCreated];
          localStorage.setItem(`${DEMO_CONTRACTS_KEY}_${tenantId}`, JSON.stringify(contracts));
        }
        return contracts;
      }

      const initialContracts = getInitialDemoContracts(tenantId);
      localStorage.setItem(`${DEMO_CONTRACTS_KEY}_${tenantId}`, JSON.stringify(initialContracts));
      return initialContracts;
    }

    const colRef = collection(db, 'tenants', tenantId, 'contracts');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Contract));
  },

  async getScheduleEntries(
    tenantId: string,
    contractId: string,
    isDemo = false
  ): Promise<ScheduleEntry[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_SCHEDULE_KEY}_${tenantId}_${contractId}`);
      if (stored) {
        const parsed: ScheduleEntry[] = JSON.parse(stored);
        const hasBad29k = parsed.some((e) => e.dueAmountPaisa === 2900000);
        if (!hasBad29k && parsed.length > 0) return parsed;
      }

      const todayKey = new Date().toISOString().split('T')[0];
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
      const oneMonthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const twoMonthsAgo = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0];

      let entries: ScheduleEntry[] = [];

      if (contractId === 'ctr-ryk-1001') {
        // Muhammad Arshad: 6 monthly installments of Rs. 6,000 (Financed: Rs. 36,000)
        // Inst #1 is paid, Inst #2 is Due Today!
        entries = [
          {
            scheduleEntryId: `sch-${contractId}-1`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-001',
            sequenceNumber: 1,
            dueDateKey: oneMonthAgo,
            dueAmountPaisa: 600000,
            allocatedPaidPaisa: 600000,
            remainingPaisa: 0,
            status: 'paid',
            createdAt: oneMonthAgo as any,
            createdBy: 'owner',
            updatedAt: oneMonthAgo as any,
          },
          {
            scheduleEntryId: `sch-${contractId}-2`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-001',
            sequenceNumber: 2,
            dueDateKey: todayKey,
            dueAmountPaisa: 600000,
            allocatedPaidPaisa: 0,
            remainingPaisa: 600000,
            status: 'upcoming',
            createdAt: oneMonthAgo as any,
            createdBy: 'owner',
            updatedAt: todayKey as any,
          },
          ...[3, 4, 5, 6].map((seq, idx) => ({
            scheduleEntryId: `sch-${contractId}-${seq}`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-001',
            sequenceNumber: seq,
            dueDateKey: new Date(Date.now() + (idx + 1) * 30 * 86400000).toISOString().split('T')[0],
            dueAmountPaisa: 600000,
            allocatedPaidPaisa: 0,
            remainingPaisa: 600000,
            status: 'upcoming' as const,
            createdAt: oneMonthAgo as any,
            createdBy: 'owner',
            updatedAt: todayKey as any,
          })),
        ];
      } else if (contractId === 'ctr-ryk-1002') {
        // Tariq Mehmood: 6 monthly installments of Rs. 12,000 (Financed: Rs. 72,000)
        // Inst #1 and #2 are paid, Inst #3 is Due Today!
        entries = [
          {
            scheduleEntryId: `sch-${contractId}-1`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-002',
            sequenceNumber: 1,
            dueDateKey: twoMonthsAgo,
            dueAmountPaisa: 1200000,
            allocatedPaidPaisa: 1200000,
            remainingPaisa: 0,
            status: 'paid',
            createdAt: twoMonthsAgo as any,
            createdBy: 'owner',
            updatedAt: twoMonthsAgo as any,
          },
          {
            scheduleEntryId: `sch-${contractId}-2`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-002',
            sequenceNumber: 2,
            dueDateKey: oneMonthAgo,
            dueAmountPaisa: 1200000,
            allocatedPaidPaisa: 1200000,
            remainingPaisa: 0,
            status: 'paid',
            createdAt: twoMonthsAgo as any,
            createdBy: 'owner',
            updatedAt: oneMonthAgo as any,
          },
          {
            scheduleEntryId: `sch-${contractId}-3`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-002',
            sequenceNumber: 3,
            dueDateKey: todayKey,
            dueAmountPaisa: 1200000,
            allocatedPaidPaisa: 0,
            remainingPaisa: 1200000,
            status: 'upcoming',
            createdAt: twoMonthsAgo as any,
            createdBy: 'owner',
            updatedAt: todayKey as any,
          },
          ...[4, 5, 6].map((seq, idx) => ({
            scheduleEntryId: `sch-${contractId}-${seq}`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-002',
            sequenceNumber: seq,
            dueDateKey: new Date(Date.now() + (idx + 1) * 30 * 86400000).toISOString().split('T')[0],
            dueAmountPaisa: 1200000,
            allocatedPaidPaisa: 0,
            remainingPaisa: 1200000,
            status: 'upcoming' as const,
            createdAt: twoMonthsAgo as any,
            createdBy: 'owner',
            updatedAt: todayKey as any,
          })),
        ];
      } else if (contractId === 'ctr-ryk-1003') {
        // Zahid Hussain: 9 monthly installments of Rs. 10,000 (Financed: Rs. 90,000)
        // Inst #1 is paid, Inst #2 is OVERDUE (5 days ago)!
        entries = [
          {
            scheduleEntryId: `sch-${contractId}-1`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-003',
            sequenceNumber: 1,
            dueDateKey: oneMonthAgo,
            dueAmountPaisa: 1000000,
            allocatedPaidPaisa: 1000000,
            remainingPaisa: 0,
            status: 'paid',
            createdAt: oneMonthAgo as any,
            createdBy: 'owner',
            updatedAt: oneMonthAgo as any,
          },
          {
            scheduleEntryId: `sch-${contractId}-2`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-003',
            sequenceNumber: 2,
            dueDateKey: fiveDaysAgo,
            dueAmountPaisa: 1000000,
            allocatedPaidPaisa: 0,
            remainingPaisa: 1000000,
            status: 'overdue',
            createdAt: oneMonthAgo as any,
            createdBy: 'owner',
            updatedAt: fiveDaysAgo as any,
          },
          ...[3, 4, 5, 6, 7, 8, 9].map((seq, idx) => ({
            scheduleEntryId: `sch-${contractId}-${seq}`,
            tenantId,
            contractId,
            customerId: 'cus-ryk-003',
            sequenceNumber: seq,
            dueDateKey: new Date(Date.now() + (idx + 1) * 30 * 86400000).toISOString().split('T')[0],
            dueAmountPaisa: 1000000,
            allocatedPaidPaisa: 0,
            remainingPaisa: 1000000,
            status: 'upcoming' as const,
            createdAt: oneMonthAgo as any,
            createdBy: 'owner',
            updatedAt: todayKey as any,
          })),
        ];
      } else {
        const contracts = await this.getContracts(tenantId, true);
        const ctr = contracts.find((c) => c.contractId === contractId);
        const generated = generateScheduleEntries({
          contractId,
          customerId: ctr?.customerId || 'cus-unknown',
          tenantId,
          financedAmountPaisa: ctr?.financedAmountPaisa || 3600000,
          durationCount: ctr?.durationCount || 6,
          frequency: ctr?.frequency || 'monthly',
          firstDueDateKey: ctr?.firstDueDateKey || todayKey,
        });

        entries = generated.map((g) => ({
          ...g,
          scheduleEntryId: `sch-${contractId}-${g.sequenceNumber}`,
          tenantId,
          contractId,
          customerId: ctr?.customerId || 'cus-unknown',
          allocatedPaidPaisa: 0,
          remainingPaisa: g.dueAmountPaisa,
          status: 'upcoming',
          createdAt: new Date().toISOString() as any,
          createdBy: 'owner',
          updatedAt: new Date().toISOString() as any,
        }));
      }

      localStorage.setItem(`${DEMO_SCHEDULE_KEY}_${tenantId}_${contractId}`, JSON.stringify(entries));
      return entries;
    }

    const colRef = collection(db, 'tenants', tenantId, 'scheduleEntries');
    const snap = await getDocs(colRef);
    const matches = snap.docs
      .map((d) => ({ ...d.data(), id: d.id } as ScheduleEntry))
      .filter((e) => e.contractId === contractId)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    return matches;
  },

  async createSaleAndContract(params: {
    tenantId: string;
    userId: string;
    customerId: string;
    saleType: 'cash' | 'installment';
    items: SaleItemSnapshot[];
    cashTotalPaisa: number;
    agreedTotalPaisa: number;
    discountPaisa: number;
    advancePaisa: number;
    frequency?: ScheduleFrequency;
    durationCount?: number;
    firstDueDateKey?: string;
    isDemo?: boolean;
  }): Promise<{ sale: Sale; contract?: Contract; scheduleEntries?: ScheduleEntry[] }> {
    const {
      tenantId,
      userId,
      customerId,
      saleType,
      items,
      cashTotalPaisa,
      agreedTotalPaisa,
      discountPaisa,
      advancePaisa,
      frequency = 'monthly',
      durationCount = 6,
      firstDueDateKey = new Date().toISOString().split('T')[0],
      isDemo = false,
    } = params;

    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const contractId = saleType === 'installment' ? `ctr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` : undefined;

    const newSale: Sale = {
      saleId,
      tenantId,
      customerId,
      saleType,
      saleDate: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      items,
      cashTotalPaisa,
      agreedTotalPaisa,
      discountPaisa,
      status: 'posted',
      contractId,
      createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      createdBy: userId,
    };

    let newContract: Contract | undefined;
    let scheduleEntries: ScheduleEntry[] | undefined;

    if (saleType === 'installment' && contractId) {
      const financedAmountPaisa = Math.max(0, agreedTotalPaisa - advancePaisa);

      newContract = {
        contractId,
        tenantId,
        customerId,
        saleId,
        contractCode: `CTR-${Date.now().toString().slice(-4)}`,
        itemsSnapshot: items,
        cashPriceTotalPaisa: cashTotalPaisa,
        installmentPriceTotalPaisa: agreedTotalPaisa,
        discountPaisa,
        advancePaisa,
        financedAmountPaisa,
        totalPaidPaisa: advancePaisa,
        outstandingPaisa: financedAmountPaisa,
        frequency,
        durationCount,
        startDateKey: new Date().toISOString().split('T')[0],
        firstDueDateKey,
        schedulePolicy: { monthEndRule: 'clamp_to_last_day' },
        status: 'active',
        createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
        createdBy: userId,
        updatedAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
        updatedBy: userId,
      };

      const generated = generateScheduleEntries({
        contractId,
        customerId,
        tenantId,
        financedAmountPaisa,
        durationCount,
        frequency,
        firstDueDateKey,
      });

      scheduleEntries = generated.map((g) => ({
        ...g,
        scheduleEntryId: `sch_${contractId}_${g.sequenceNumber}`,
        tenantId,
        contractId,
        customerId,
        allocatedPaidPaisa: 0,
        remainingPaisa: g.dueAmountPaisa,
        status: 'upcoming',
        createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
        createdBy: userId,
        updatedAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      }));
    }

    // Persist to Demo Storage or Firestore
    if (isDemo) {
      const sales = await this.getSales(tenantId, true);
      localStorage.setItem(`${DEMO_SALES_KEY}_${tenantId}`, JSON.stringify([newSale, ...sales]));

      if (newContract && scheduleEntries) {
        const contracts = await this.getContracts(tenantId, true);
        localStorage.setItem(`${DEMO_CONTRACTS_KEY}_${tenantId}`, JSON.stringify([newContract, ...contracts]));
        localStorage.setItem(`${DEMO_SCHEDULE_KEY}_${tenantId}_${contractId}`, JSON.stringify(scheduleEntries));
      }

      // Record stock-out movement for each product sold
      for (const item of items) {
        await InventoryRepository.recordMovement(
          tenantId,
          {
            productId: item.productId,
            movementType: 'sale_out',
            quantity: item.quantity,
            movementDate: new Date().toISOString(),
            referenceType: 'sale',
            referenceId: saleId,
            reason: `${saleType === 'cash' ? 'Cash Sale' : 'Installment Sale'} #${saleId}`,
          },
          userId,
          true
        );
      }

      return { sale: newSale, contract: newContract, scheduleEntries };
    }

    // Live Firestore save
    await setDoc(doc(db, 'tenants', tenantId, 'sales', saleId), newSale);
    if (newContract && scheduleEntries && contractId) {
      await setDoc(doc(db, 'tenants', tenantId, 'contracts', contractId), newContract);
      for (const entry of scheduleEntries) {
        await setDoc(doc(db, 'tenants', tenantId, 'scheduleEntries', entry.scheduleEntryId), entry);
      }
    }

    for (const item of items) {
      await InventoryRepository.recordMovement(
        tenantId,
        {
          productId: item.productId,
          movementType: 'sale_out',
          quantity: item.quantity,
          movementDate: new Date().toISOString(),
          referenceType: 'sale',
          referenceId: saleId,
          reason: `${saleType === 'cash' ? 'Cash Sale' : 'Installment Sale'} #${saleId}`,
        },
        userId,
        false
      );
    }

    return { sale: newSale, contract: newContract, scheduleEntries };
  },
};

