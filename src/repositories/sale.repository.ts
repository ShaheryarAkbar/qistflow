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
      if (stored) return JSON.parse(stored);

      const initialContract: Contract = {
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
        totalPaidPaisa: 1700000,          // Advance + 1 installment (Rs. 17,000)
        outstandingPaisa: 3100000,       // Rs. 31,000 remaining
        frequency: 'monthly',
        durationCount: 6,
        startDateKey: '2026-10-10',
        firstDueDateKey: '2026-11-10',
        schedulePolicy: { monthEndRule: 'clamp_to_last_day' },
        status: 'active',
        createdAt: new Date().toISOString() as any,
        createdBy: 'owner',
        updatedAt: new Date().toISOString() as any,
        updatedBy: 'owner',
      };
      localStorage.setItem(`${DEMO_CONTRACTS_KEY}_${tenantId}`, JSON.stringify([initialContract]));
      return [initialContract];
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
      if (stored) return JSON.parse(stored);

      // Seed 6 monthly entries for initial demo contract
      const generated = generateScheduleEntries({
        contractId,
        customerId: 'cus-ryk-001',
        tenantId,
        financedAmountPaisa: 3600000,
        durationCount: 6,
        frequency: 'monthly',
        firstDueDateKey: '2026-11-10',
      });

      const entries: ScheduleEntry[] = generated.map((g, idx) => ({
        ...g,
        scheduleEntryId: `sch-${contractId}-${g.sequenceNumber}`,
        tenantId,
        contractId,
        customerId: 'cus-ryk-001',
        allocatedPaidPaisa: idx === 0 ? 500000 : 0,
        remainingPaisa: idx === 0 ? 100000 : g.dueAmountPaisa,
        status: idx === 0 ? 'partially_paid' : 'upcoming',
        createdAt: new Date().toISOString() as any,
        createdBy: 'owner',
        updatedAt: new Date().toISOString() as any,
      }));

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

