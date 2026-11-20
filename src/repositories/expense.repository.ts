// ============================================================================
// Repository: Shop Operating Expenses
// Scoped to /tenants/{tenantId}/expenses/{expenseId}
// ============================================================================

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/app';
import { Expense, PaymentMethod } from '@/types';

const DEMO_EXPENSES_KEY = 'qistflow_demo_expenses';

export const ExpenseRepository = {
  async getExpenses(tenantId: string, isDemo = false): Promise<Expense[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_EXPENSES_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      // Only seed initial expenses for reference demo shop 'tenant-demo-ryk-01' (or test runners)
      if (tenantId !== 'tenant-demo-ryk-01' && !tenantId.includes('test')) {
        localStorage.setItem(`${DEMO_EXPENSES_KEY}_${tenantId}`, JSON.stringify([]));
        return [];
      }

      const initialExpenses: Expense[] = [
        {
          expenseId: 'exp-01',
          tenantId,
          category: 'Rent',
          amountPaisa: 3500000, // 35,000 PKR
          expenseDate: new Date(Date.now() - 86400000 * 4).toISOString() as any,
          method: 'cash',
          description: 'Shop monthly rent (Shahi Road branch)',
          status: 'posted',
          createdAt: new Date().toISOString() as any,
          createdBy: 'owner',
        },
        {
          expenseId: 'exp-02',
          tenantId,
          category: 'Electricity',
          amountPaisa: 1250000, // 12,500 PKR
          expenseDate: new Date(Date.now() - 86400000 * 2).toISOString() as any,
          method: 'bank',
          description: 'MEPCO commercial electricity bill for October',
          status: 'posted',
          createdAt: new Date().toISOString() as any,
          createdBy: 'owner',
        },
        {
          expenseId: 'exp-03',
          tenantId,
          category: 'Tea & Hospitality',
          amountPaisa: 280000, // 2,800 PKR
          expenseDate: new Date(Date.now() - 86400000 * 1).toISOString() as any,
          method: 'cash',
          description: 'Weekly customer hospitality & tea bill',
          status: 'posted',
          createdAt: new Date().toISOString() as any,
          createdBy: 'owner',
        },
      ];
      localStorage.setItem(`${DEMO_EXPENSES_KEY}_${tenantId}`, JSON.stringify(initialExpenses));
      return initialExpenses;
    }

    const colRef = collection(db, 'tenants', tenantId, 'expenses');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as Expense));
  },

  async recordExpense(params: {
    tenantId: string;
    userId: string;
    category: string;
    amountPaisa: number;
    method: PaymentMethod;
    description?: string;
    reference?: string;
    expenseDate?: string;
    isDemo?: boolean;
  }): Promise<Expense> {
    const {
      tenantId,
      userId,
      category,
      amountPaisa,
      method,
      description = '',
      reference = '',
      expenseDate = new Date().toISOString(),
      isDemo = false,
    } = params;

    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newExpense: Expense = {
      expenseId,
      tenantId,
      category,
      amountPaisa,
      method,
      description,
      reference,
      expenseDate: isDemo ? expenseDate : (serverTimestamp() as any),
      status: 'posted',
      createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      createdBy: userId,
    };

    if (isDemo) {
      const expenses = await this.getExpenses(tenantId, true);
      const updated = [newExpense, ...expenses];
      localStorage.setItem(`${DEMO_EXPENSES_KEY}_${tenantId}`, JSON.stringify(updated));
      return newExpense;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'expenses', expenseId), newExpense);
    return newExpense;
  },

  async updateExpense(params: {
    tenantId: string;
    expenseId: string;
    data: Partial<Pick<Expense, 'category' | 'amountPaisa' | 'method' | 'description' | 'reference' | 'expenseDate'>>;
    userId: string;
    isDemo?: boolean;
  }): Promise<Expense | null> {
    const { tenantId, expenseId, data, userId, isDemo = false } = params;

    if (isDemo) {
      const expenses = await this.getExpenses(tenantId, true);
      const idx = expenses.findIndex((e) => e.expenseId === expenseId);
      if (idx !== -1) {
        const updated: Expense = {
          ...expenses[idx],
          ...data,
          updatedAt: new Date().toISOString() as any,
          updatedBy: userId,
        };
        expenses[idx] = updated;
        localStorage.setItem(`${DEMO_EXPENSES_KEY}_${tenantId}`, JSON.stringify(expenses));
        return updated;
      }
      return null;
    }

    const expRef = doc(db, 'tenants', tenantId, 'expenses', expenseId);
    await setDoc(expRef, { ...data, updatedAt: serverTimestamp(), updatedBy: userId }, { merge: true });
    return null;
  },
};

