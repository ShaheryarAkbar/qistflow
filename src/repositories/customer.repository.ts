// ============================================================================
// Repository: Customer Repository
// Scoped to /tenants/{tenantId}/customers/{customerId}
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
import { Customer } from '@/types';

const DEMO_STORAGE_KEY = 'qistflow_demo_customers';

export function normalizePhoneNumber(phone: string): string {
  // Normalize Pakistani mobile numbers: e.g. "0300 1234567" or "+923001234567" -> "923001234567"
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('03')) {
    return '92' + digitsOnly.slice(1);
  }
  if (digitsOnly.startsWith('3') && digitsOnly.length === 10) {
    return '92' + digitsOnly;
  }
  return digitsOnly;
}

export const CustomerRepository = {
  async getCustomers(tenantId: string, isDemo = false): Promise<Customer[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_STORAGE_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      // Seed initial demo customers from Southern Punjab
      const initialSeed: Customer[] = [
        {
          customerId: 'cus-ryk-001',
          tenantId,
          customerCode: 'CUS-1001',
          fullName: 'Muhammad Arshad',
          normalizedPhone: '923017654321',
          phoneDisplay: '0301-7654321',
          alternatePhone: '0300-1122334',
          cnic: '31303-1234567-1',
          area: 'Gulshan-e-Usman',
          city: 'Rahim Yar Khan',
          address: 'Street #3, House #12, Gulshan-e-Usman',
          notes: 'Shopkeeper at City Cloth Market. Good payment history.',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-002',
          tenantId,
          customerCode: 'CUS-1002',
          fullName: 'Tariq Mehmood',
          normalizedPhone: '923009876543',
          phoneDisplay: '0300-9876543',
          cnic: '31302-7654321-3',
          area: 'Model Town',
          city: 'Khanpur',
          address: 'Near Old Railway Station, Khanpur',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-003',
          tenantId,
          customerCode: 'CUS-1003',
          fullName: 'Zahid Hussain',
          normalizedPhone: '923021122334',
          phoneDisplay: '0302-1122334',
          cnic: '31304-9988776-5',
          area: 'Chowk Bahadurpur',
          city: 'Rahim Yar Khan',
          address: 'Basti Amanat Ali, Near Canal Road',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
      ];
      localStorage.setItem(`${DEMO_STORAGE_KEY}_${tenantId}`, JSON.stringify(initialSeed));
      return initialSeed;
    }

    const colRef = collection(db, 'tenants', tenantId, 'customers');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Customer));
  },

  async getCustomerById(tenantId: string, customerId: string, isDemo = false): Promise<Customer | null> {
    if (isDemo) {
      const customers = await this.getCustomers(tenantId, true);
      return customers.find((c) => c.customerId === customerId) || null;
    }

    const docRef = doc(db, 'tenants', tenantId, 'customers', customerId);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as Customer) : null;
  },

  async findCustomerByPhone(tenantId: string, phone: string, isDemo = false): Promise<Customer | null> {
    const normalized = normalizePhoneNumber(phone);
    if (isDemo) {
      const customers = await this.getCustomers(tenantId, true);
      return customers.find((c) => c.normalizedPhone === normalized) || null;
    }

    const colRef = collection(db, 'tenants', tenantId, 'customers');
    const snap = await getDocs(colRef);
    const match = snap.docs.find((d) => (d.data() as Customer).normalizedPhone === normalized);
    return match ? ({ ...match.data(), id: match.id } as Customer) : null;
  },

  async saveCustomer(
    tenantId: string,
    customerData: Omit<Customer, 'customerId' | 'tenantId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
    userId: string,
    isDemo = false
  ): Promise<Customer> {
    const customerId = `cus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const normalizedPhone = customerData.phoneDisplay
      ? normalizePhoneNumber(customerData.phoneDisplay)
      : '';

    const newCustomer: Customer = {
      ...customerData,
      customerId,
      tenantId,
      normalizedPhone,
      createdAt: isDemo ? new Date().toISOString() : serverTimestamp(),
      createdBy: userId,
      updatedAt: isDemo ? new Date().toISOString() : serverTimestamp(),
      updatedBy: userId,
    };

    if (isDemo) {
      const customers = await this.getCustomers(tenantId, true);
      const updated = [newCustomer, ...customers];
      localStorage.setItem(`${DEMO_STORAGE_KEY}_${tenantId}`, JSON.stringify(updated));
      return newCustomer;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'customers', customerId), newCustomer);
    return newCustomer;
  },
};

