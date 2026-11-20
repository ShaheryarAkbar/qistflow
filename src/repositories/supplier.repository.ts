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
import { generateReceiptVisualSvg } from '@/services/aiReceiptScanner.service';

const DEMO_SUPPLIER_KEY = 'qistflow_demo_suppliers';
const DEMO_PURCHASE_KEY = 'qistflow_demo_purchases';

export const SupplierRepository = {
  async getSuppliers(tenantId: string, isDemo = false): Promise<Supplier[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_SUPPLIER_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      // Only seed initial suppliers for reference demo shop 'tenant-demo-ryk-01' (or test runners)
      if (tenantId !== 'tenant-demo-ryk-01' && !tenantId.includes('test')) {
        localStorage.setItem(`${DEMO_SUPPLIER_KEY}_${tenantId}`, JSON.stringify([]));
        return [];
      }

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

  async updateSupplier(
    tenantId: string,
    supplierId: string,
    data: Partial<Omit<Supplier, 'supplierId' | 'tenantId' | 'createdAt' | 'createdBy'>>,
    userId: string,
    isDemo = false
  ): Promise<Supplier | null> {
    if (isDemo) {
      const suppliers = await this.getSuppliers(tenantId, true);
      const idx = suppliers.findIndex((s) => s.supplierId === supplierId);
      if (idx !== -1) {
        const updated: Supplier = {
          ...suppliers[idx],
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        };
        suppliers[idx] = updated;
        localStorage.setItem(`${DEMO_SUPPLIER_KEY}_${tenantId}`, JSON.stringify(suppliers));
        return updated;
      }
      return null;
    }

    const docRef = doc(db, 'tenants', tenantId, 'suppliers', supplierId);
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp(), updatedBy: userId }, { merge: true });
    return null;
  },

  async getPurchases(tenantId: string, isDemo = false): Promise<Purchase[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_PURCHASE_KEY}_${tenantId}`);
      if (stored) {
        const parsed: Purchase[] = JSON.parse(stored);
        if (tenantId === 'tenant-demo-ryk-01' && !parsed.some((p) => !!p.receiptImageUrl)) {
          // Upgrade reference demo shop to include realistic visual receipt scans
        } else {
          return parsed;
        }
      }

      // Only seed initial purchases for reference demo shop 'tenant-demo-ryk-01' (or test runners)
      if (tenantId !== 'tenant-demo-ryk-01' && !tenantId.includes('test')) {
        localStorage.setItem(`${DEMO_PURCHASE_KEY}_${tenantId}`, JSON.stringify([]));
        return [];
      }

      const receipt1Svg = generateReceiptVisualSvg(
        'Al-Rehman Electronics Wholesale',
        'INV-78601',
        new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        [
          {
            productName: 'Super Asia Washing Machine (SA-240)',
            brand: 'Super Asia',
            quantity: 10,
            unitCostRupees: 32000,
            lineTotalRupees: 320000,
          },
        ]
      );

      const receipt2Svg = generateReceiptVisualSvg(
        'Haier & Dawlance Authorized Distributors',
        'HAP-2026-9410',
        new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
        [
          {
            productName: 'Haier 1.5 Ton DC Inverter AC',
            brand: 'Haier',
            quantity: 10,
            unitCostRupees: 88000,
            lineTotalRupees: 880000,
          },
          {
            productName: 'Dawlance 9170 WB Avante Refrigerator',
            brand: 'Dawlance',
            quantity: 5,
            unitCostRupees: 72000,
            lineTotalRupees: 360000,
          },
        ]
      );

      const initialPurchases: Purchase[] = [
        {
          tenantId,
          supplierId: 'sup-lahore-01',
          supplierNameSnapshot: 'Al-Rehman Electronics Wholesale',
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
          receiptImageUrl: receipt1Svg,
          notes: 'Wholesale batch from Lahore distributor with delivery receipt attached.',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString() as any,
          createdBy: 'owner',
        },
        {
          tenantId,
          supplierId: 'sup-multan-02',
          supplierNameSnapshot: 'Haier & Dawlance Authorized Distributors',
          purchaseDate: new Date(Date.now() - 86400000 * 1).toISOString() as any,
          referenceNumber: 'HAP-2026-9410',
          items: [
            {
              productId: 'prd-ha-ac18',
              productNameSnapshot: 'Haier 1.5 Ton DC Inverter AC',
              quantity: 10,
              unitCostPaisa: 8800000,
              lineTotalPaisa: 88000000,
            },
            {
              productId: 'prd-dw-9170',
              productNameSnapshot: 'Dawlance 9170 WB Avante Refrigerator',
              quantity: 5,
              unitCostPaisa: 7200000,
              lineTotalPaisa: 36000000,
            },
          ],
          subtotalPaisa: 124000000,
          discountPaisa: 0,
          totalPaisa: 124000000,
          paidPaisa: 124000000,
          balancePaisa: 0,
          status: 'posted',
          receiptImageUrl: receipt2Svg,
          notes: 'AI Scanned Receipt: 10x Inverter ACs and 5x Fridges intake verified by manager.',
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString() as any,
          createdBy: 'manager',
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

  async updatePurchase(
    tenantId: string,
    referenceNumber: string,
    data: Partial<Purchase>,
    userId: string,
    isDemo = false
  ): Promise<Purchase | null> {
    if (isDemo) {
      const purchases = await this.getPurchases(tenantId, true);
      const idx = purchases.findIndex((p) => p.referenceNumber === referenceNumber);
      if (idx !== -1) {
        const updated = {
          ...purchases[idx],
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        };
        purchases[idx] = updated;
        localStorage.setItem(`${DEMO_PURCHASE_KEY}_${tenantId}`, JSON.stringify(purchases));
        return updated;
      }
      return null;
    }

    const colRef = collection(db, 'tenants', tenantId, 'purchases');
    const q = query(colRef);
    const snap = await getDocs(q);
    const foundDoc = snap.docs.find((d) => (d.data() as Purchase).referenceNumber === referenceNumber);
    if (foundDoc) {
      await setDoc(foundDoc.ref, { ...data, updatedAt: serverTimestamp(), updatedBy: userId }, { merge: true });
    }
    return null;
  },

  async findOrCreateSupplierByName(
    tenantId: string,
    name: string,
    company: string | undefined,
    userId: string,
    isDemo = false
  ): Promise<Supplier> {
    const suppliers = await this.getSuppliers(tenantId, isDemo);
    const normalizedTarget = name.toLowerCase().trim();
    const existing = suppliers.find(
      (s) =>
        s.name.toLowerCase().trim() === normalizedTarget ||
        (s.company && s.company.toLowerCase().trim() === normalizedTarget) ||
        (company && s.company && s.company.toLowerCase().trim() === company.toLowerCase().trim()) ||
        s.name.toLowerCase().includes(normalizedTarget) ||
        normalizedTarget.includes(s.name.toLowerCase())
    );
    if (existing) return existing;

    return await this.saveSupplier(
      tenantId,
      {
        supplierCode: `SUP-${Math.floor(10 + Math.random() * 90)}`,
        name,
        company: company || name,
        phoneDisplay: '0300-1234567',
        normalizedPhone: '923001234567',
        status: 'active',
      },
      userId,
      isDemo
    );
  },
};

