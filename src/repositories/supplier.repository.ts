// ============================================================================
// Repository: Suppliers & Procurement
// Scoped to /tenants/{tenantId}/suppliers/{supplierId}
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
import { Supplier, Purchase } from '@/types';
import { InventoryRepository } from './inventory.repository';

const DEMO_SUPPLIER_KEY = 'qistflow_demo_suppliers';
const DEMO_PURCHASE_KEY = 'qistflow_demo_purchases';

export const SupplierRepository = {
  async getSuppliers(tenantId: string, isDemo = false): Promise<Supplier[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_SUPPLIER_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      const initialSuppliers: Supplier[] = [
        {
          supplierId: 'sup-lahore-01',
          tenantId,
          supplierCode: 'SUP-01',
          name: 'Al-Rehman Electronics Wholesale',
          company: 'Al-Rehman Traders Lahore',
          phoneDisplay: '0321-4567890',
          normalizedPhone: '923214567890',
          address: 'Hall Road, Electronics Market, Lahore',
          notes: 'Main distributor for Super Asia and Waves appliances',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          supplierId: 'sup-multan-02',
          tenantId,
          supplierCode: 'SUP-02',
          name: 'South Solar Technologies',
          company: 'South Solar Systems Ltd.',
          phoneDisplay: '0300-6789123',
          normalizedPhone: '923006789123',
          address: 'Bosan Road, Near Chungi #9, Multan',
          notes: 'Inverex inverters and Longi solar panels supplier',
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
      ];
      localStorage.setItem(`${DEMO_SUPPLIER_KEY}_${tenantId}`, JSON.stringify(initialSuppliers));
      return initialSuppliers;
    }

    const colRef = collection(db, 'tenants', tenantId, 'suppliers');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Supplier));
  },

  async saveSupplier(
    tenantId: string,
    data: Omit<Supplier, 'supplierId' | 'tenantId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
    userId: string,
    isDemo = false
  ): Promise<Supplier> {
    const supplierId = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSupplier: Supplier = {
      ...data,
      supplierId,
      tenantId,
      createdAt: isDemo ? new Date().toISOString() : serverTimestamp(),
      createdBy: userId,
      updatedAt: isDemo ? new Date().toISOString() : serverTimestamp(),
      updatedBy: userId,
    };

    if (isDemo) {
      const suppliers = await this.getSuppliers(tenantId, true);
      const updated = [newSupplier, ...suppliers];
      localStorage.setItem(`${DEMO_SUPPLIER_KEY}_${tenantId}`, JSON.stringify(updated));
      return newSupplier;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'suppliers', supplierId), newSupplier);
    return newSupplier;
  },

  async getPurchases(tenantId: string, isDemo = false): Promise<Purchase[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_PURCHASE_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      const initialPurchases: Purchase[] = [
        {
          tenantId,
          supplierId: 'sup-lahore-01',
          purchaseDate: new Date(Date.now() - 86400000 * 5).toISOString() as any,
          referenceNumber: 'INV-78601',
          items: [
            {
              productId: 'prd-sa-240',
              productNameSnapshot: 'Super Asia Washing Machine (SA-240)',
              quantity: 10,
              unitCostPaisa: 3200000,
              lineTotalPaisa: 32000000,
            },
          ],
          subtotalPaisa: 32000000,
          discountPaisa: 0,
          totalPaisa: 32000000,
          paidPaisa: 32000000,
          balancePaisa: 0,
          status: 'posted',
          createdAt: new Date().toISOString() as any,
          createdBy: 'owner',
        },
      ];
      localStorage.setItem(`${DEMO_PURCHASE_KEY}_${tenantId}`, JSON.stringify(initialPurchases));
      return initialPurchases;
    }

    const colRef = collection(db, 'tenants', tenantId, 'purchases');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Purchase));
  },

  async postPurchase(
    tenantId: string,
    purchaseData: Omit<Purchase, 'tenantId' | 'createdAt' | 'createdBy'>,
    userId: string,
    isDemo = false
  ): Promise<Purchase> {
    const purchaseId = `pur_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPurchase: Purchase = {
      ...purchaseData,
      tenantId,
      createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      createdBy: userId,
    };

    // Save purchase & generate inventory movement records for each item
    if (isDemo) {
      const purchases = await this.getPurchases(tenantId, true);
      const updated = [newPurchase, ...purchases];
      localStorage.setItem(`${DEMO_PURCHASE_KEY}_${tenantId}`, JSON.stringify(updated));

      for (const item of purchaseData.items) {
        await InventoryRepository.recordMovement(
          tenantId,
          {
            productId: item.productId,
            movementType: 'purchase_in',
            quantity: item.quantity,
            movementDate: new Date().toISOString(),
            referenceType: 'purchase',
            referenceId: purchaseId,
            reason: `Stock intake invoice #${purchaseData.referenceNumber || purchaseId}`,
          },
          userId,
          true
        );
      }
      return newPurchase;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'purchases', purchaseId), newPurchase);
    for (const item of purchaseData.items) {
      await InventoryRepository.recordMovement(
        tenantId,
        {
          productId: item.productId,
          movementType: 'purchase_in',
          quantity: item.quantity,
          movementDate: new Date().toISOString(),
          referenceType: 'purchase',
          referenceId: purchaseId,
          reason: `Stock intake invoice #${purchaseData.referenceNumber || purchaseId}`,
        },
        userId,
        false
      );
    }
    return newPurchase;
  },
};
