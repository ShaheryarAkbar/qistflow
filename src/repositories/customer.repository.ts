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
      if (stored) {
        const parsed: Customer[] = JSON.parse(stored);
        if (tenantId === 'tenant-demo-ryk-01' && parsed.length < 10) {
          // Upgrade reference demo shop to full customer roster
        } else {
          return parsed;
        }
      }

      // Only seed initial demo customers for the reference demo shop 'tenant-demo-ryk-01' (or test runners)
      if (tenantId !== 'tenant-demo-ryk-01' && !tenantId.includes('test')) {
        localStorage.setItem(`${DEMO_STORAGE_KEY}_${tenantId}`, JSON.stringify([]));
        return [];
      }

      // Seed initial demo customers from Southern Punjab (25 realistic customers)
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
        {
          customerId: 'cus-ryk-004',
          tenantId,
          customerCode: 'CUS-1004',
          fullName: 'Abdul Rehman',
          normalizedPhone: '923004455661',
          phoneDisplay: '0300-4455661',
          cnic: '31303-2233445-7',
          area: 'Satellite Town',
          city: 'Rahim Yar Khan',
          address: 'House #45, Block B, Satellite Town',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-005',
          tenantId,
          customerCode: 'CUS-1005',
          fullName: 'Farhan Ali',
          normalizedPhone: '923037788992',
          phoneDisplay: '0303-7788992',
          cnic: '31301-3344556-9',
          area: 'Factory Area',
          city: 'Rahim Yar Khan',
          address: 'Near Lever Brothers, Factory Area',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-006',
          tenantId,
          customerCode: 'CUS-1006',
          fullName: 'Nadeem Akhtar',
          normalizedPhone: '923061122445',
          phoneDisplay: '0306-1122445',
          cnic: '31303-4455667-1',
          area: 'Abbasia Town',
          city: 'Rahim Yar Khan',
          address: 'Street #7, Abbasia Town',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-007',
          tenantId,
          customerCode: 'CUS-1007',
          fullName: 'Waseem Akram',
          normalizedPhone: '923078899112',
          phoneDisplay: '0307-8899112',
          cnic: '31302-5566778-3',
          area: 'Gulberg Colony',
          city: 'Khanpur',
          address: 'Near Civil Hospital, Gulberg',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-008',
          tenantId,
          customerCode: 'CUS-1008',
          fullName: 'Saeed Anwar',
          normalizedPhone: '923083344556',
          phoneDisplay: '0308-3344556',
          cnic: '31304-6677889-5',
          area: 'Shahi Road',
          city: 'Rahim Yar Khan',
          address: 'Opposite Town Hall, Shahi Road',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-009',
          tenantId,
          customerCode: 'CUS-1009',
          fullName: 'Kashif Javed',
          normalizedPhone: '923056677889',
          phoneDisplay: '0305-6677889',
          cnic: '31303-7788990-7',
          area: 'Trust Colony',
          city: 'Rahim Yar Khan',
          address: 'Street #2, Trust Colony',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-010',
          tenantId,
          customerCode: 'CUS-1010',
          fullName: 'Hamza Tariq',
          normalizedPhone: '923025566778',
          phoneDisplay: '0302-5566778',
          cnic: '31301-8899001-9',
          area: 'Iqbal Nagar',
          city: 'Rahim Yar Khan',
          address: 'Near Government Degree College, Iqbal Nagar',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-011',
          tenantId,
          customerCode: 'CUS-1011',
          fullName: 'Rashid Mehmood',
          normalizedPhone: '923042233445',
          phoneDisplay: '0304-2233445',
          cnic: '31302-9900112-1',
          area: 'Canal Park',
          city: 'Khanpur',
          address: 'Canal Road, Khanpur',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-012',
          tenantId,
          customerCode: 'CUS-1012',
          fullName: 'Imran Nazir',
          normalizedPhone: '923099988112',
          phoneDisplay: '0309-9988112',
          cnic: '31303-0011223-3',
          area: 'Khawaja Fareed Colony',
          city: 'Rahim Yar Khan',
          address: 'House #88, Khawaja Fareed Colony',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-013',
          tenantId,
          customerCode: 'CUS-1013',
          fullName: 'Sohail Tanveer',
          normalizedPhone: '923003322114',
          phoneDisplay: '0300-3322114',
          cnic: '31304-1122334-5',
          area: 'Circular Road',
          city: 'Rahim Yar Khan',
          address: 'Near Old Bus Stand, Circular Road',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-014',
          tenantId,
          customerCode: 'CUS-1014',
          fullName: 'Kamran Ghulam',
          normalizedPhone: '923014455223',
          phoneDisplay: '0301-4455223',
          cnic: '31301-2233445-7',
          area: 'Jinnah Hall',
          city: 'Sadiqabad',
          address: 'Main Bazaar, Jinnah Hall, Sadiqabad',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-015',
          tenantId,
          customerCode: 'CUS-1015',
          fullName: 'Asad Shafiq',
          normalizedPhone: '923036655441',
          phoneDisplay: '0303-6655441',
          cnic: '31302-3344556-9',
          area: 'Officers Colony',
          city: 'Rahim Yar Khan',
          address: 'Officers Colony, Street #4',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-016',
          tenantId,
          customerCode: 'CUS-1016',
          fullName: 'Faisal Qureshi',
          normalizedPhone: '923068877665',
          phoneDisplay: '0306-8877665',
          cnic: '31303-4455667-1',
          area: 'Railway Road',
          city: 'Khanpur',
          address: 'Near Railway Crossing, Khanpur',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-017',
          tenantId,
          customerCode: 'CUS-1017',
          fullName: 'Babar Azam',
          normalizedPhone: '923071133557',
          phoneDisplay: '0307-1133557',
          cnic: '31304-5566778-3',
          area: 'General Bus Stand',
          city: 'Rahim Yar Khan',
          address: 'Shop #14, General Bus Stand',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-018',
          tenantId,
          customerCode: 'CUS-1018',
          fullName: 'Rizwan Ahmad',
          normalizedPhone: '923082244668',
          phoneDisplay: '0308-2244668',
          cnic: '31301-6677889-5',
          area: 'Purani Chungi',
          city: 'Rahim Yar Khan',
          address: 'House #9, Purani Chungi',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-019',
          tenantId,
          customerCode: 'CUS-1019',
          fullName: 'Shahzad Khan',
          normalizedPhone: '923059911223',
          phoneDisplay: '0305-9911223',
          cnic: '31302-7788990-7',
          area: 'Thali Road',
          city: 'Rahim Yar Khan',
          address: 'Street #12, Thali Road',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-020',
          tenantId,
          customerCode: 'CUS-1020',
          fullName: 'Bilal Hassan',
          normalizedPhone: '923028844331',
          phoneDisplay: '0302-8844331',
          cnic: '31303-8899001-9',
          area: 'Bano Bazaar',
          city: 'Sadiqabad',
          address: 'Bano Bazaar, Sadiqabad',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-021',
          tenantId,
          customerCode: 'CUS-1021',
          fullName: 'Umair Riaz',
          normalizedPhone: '923047755339',
          phoneDisplay: '0304-7755339',
          cnic: '31304-9900112-1',
          area: 'Civil Lines',
          city: 'Rahim Yar Khan',
          address: 'Civil Lines Road, House #2',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-022',
          tenantId,
          customerCode: 'CUS-1022',
          fullName: 'Zeeshan Afzal',
          normalizedPhone: '923091144772',
          phoneDisplay: '0309-1144772',
          cnic: '31301-0011223-3',
          area: 'Stadium Road',
          city: 'Khanpur',
          address: 'Near Sports Complex, Stadium Road',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-023',
          tenantId,
          customerCode: 'CUS-1023',
          fullName: 'Mohsin Raza',
          normalizedPhone: '923008833221',
          phoneDisplay: '0300-8833221',
          cnic: '31302-1122334-5',
          area: 'Tariqabad',
          city: 'Rahim Yar Khan',
          address: 'Street #5, Tariqabad',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-024',
          tenantId,
          customerCode: 'CUS-1024',
          fullName: 'Haris Rauf',
          normalizedPhone: '923016622448',
          phoneDisplay: '0301-6622448',
          cnic: '31303-2233445-7',
          area: 'Dharanwala Mor',
          city: 'Rahim Yar Khan',
          address: 'Near Bypass Chowk, Dharanwala Mor',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          customerId: 'cus-ryk-025',
          tenantId,
          customerCode: 'CUS-1025',
          fullName: 'Junaid Niazi',
          normalizedPhone: '923034411993',
          phoneDisplay: '0303-4411993',
          cnic: '31304-3344556-9',
          area: 'Main Highway',
          city: 'Sadiqabad',
          address: 'KLP Road, Sadiqabad',
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

  async updateCustomer(
    tenantId: string,
    customerId: string,
    customerData: Partial<Omit<Customer, 'customerId' | 'tenantId' | 'createdAt' | 'createdBy'>>,
    userId: string,
    isDemo = false
  ): Promise<Customer | null> {
    const normalizedPhone = customerData.phoneDisplay ? normalizePhoneNumber(customerData.phoneDisplay) : undefined;

    if (isDemo) {
      const customers = await this.getCustomers(tenantId, true);
      const idx = customers.findIndex((c) => c.customerId === customerId);
      if (idx !== -1) {
        const updated: Customer = {
          ...customers[idx],
          ...customerData,
          ...(normalizedPhone ? { normalizedPhone } : {}),
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        };
        customers[idx] = updated;
        localStorage.setItem(`${DEMO_STORAGE_KEY}_${tenantId}`, JSON.stringify(customers));
        return updated;
      }
      return null;
    }

    const ref = doc(db, 'tenants', tenantId, 'customers', customerId);
    await updateDoc(ref, {
      ...customerData,
      ...(normalizedPhone ? { normalizedPhone } : {}),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
    const snap = await getDoc(ref);
    return snap.exists() ? ({ ...snap.data(), customerId: snap.id } as Customer) : null;
  },
};

