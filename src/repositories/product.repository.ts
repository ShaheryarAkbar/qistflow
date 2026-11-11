// ============================================================================
// Repository: Product Catalogue & Inventory
// Scoped to /tenants/{tenantId}/products/{productId}
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
import { Product } from '@/types';

const DEMO_STORAGE_KEY = 'qistflow_demo_products';

export const ProductRepository = {
  async getProducts(tenantId: string, isDemo = false): Promise<Product[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_STORAGE_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      const initialProducts: Product[] = [
        {
          productId: 'prd-sa-240',
          tenantId,
          productCode: 'PRD-101',
          name: 'Super Asia Washing Machine (SA-240)',
          category: 'Washing Machines',
          brand: 'Super Asia',
          model: 'SA-240 Twin Tub 10kg',
          skuNormalized: 'SA240TT',
          barcodeNormalized: '896400123001',
          description: 'Double body heavy-duty twin tub washer with spin dryer',
          costPricePaisa: 3200000,         // Rs. 32,000
          cashPricePaisa: 3800000,         // Rs. 38,000
          installmentPricePaisa: 4800000,  // Rs. 48,000
          stockOnHand: 8,
          reorderLevel: 2,
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          productId: 'prd-wv-314',
          tenantId,
          productCode: 'PRD-102',
          name: 'Waves Deep Freezer (WF-314)',
          category: 'Deep Freezers',
          brand: 'Waves',
          model: 'WF-314 Single Door Cool Bank',
          skuNormalized: 'WF314CB',
          barcodeNormalized: '896400123002',
          costPricePaisa: 6200000,         // Rs. 62,000
          cashPricePaisa: 7200000,         // Rs. 72,000
          installmentPricePaisa: 9200000,  // Rs. 92,000
          stockOnHand: 4,
          reorderLevel: 2,
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          productId: 'prd-inv-32',
          tenantId,
          productCode: 'PRD-103',
          name: 'Inverex Solar Inverter (Yukon II 3.2kW)',
          category: 'Solar Equipment',
          brand: 'Inverex',
          model: 'Yukon II 3.2 kW VM-III',
          skuNormalized: 'INV-YK32',
          barcodeNormalized: '896400123003',
          costPricePaisa: 11000000,        // Rs. 110,000
          cashPricePaisa: 12500000,        // Rs. 125,000
          installmentPricePaisa: 16000000, // Rs. 160,000
          stockOnHand: 3,
          reorderLevel: 1,
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
        {
          productId: 'prd-sams-43',
          tenantId,
          productCode: 'PRD-104',
          name: 'Samsung 43" Smart LED TV 4K',
          category: 'Television & LED',
          brand: 'Samsung',
          model: 'UA43CU7000 Smart UHD',
          skuNormalized: 'SAM43UHD',
          barcodeNormalized: '896400123004',
          costPricePaisa: 7500000,         // Rs. 75,000
          cashPricePaisa: 8800000,         // Rs. 88,000
          installmentPricePaisa: 11500000, // Rs. 115,000
          stockOnHand: 6,
          reorderLevel: 2,
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'owner',
          updatedAt: new Date().toISOString(),
          updatedBy: 'owner',
        },
      ];
      localStorage.setItem(`${DEMO_STORAGE_KEY}_${tenantId}`, JSON.stringify(initialProducts));
      return initialProducts;
    }

    const colRef = collection(db, 'tenants', tenantId, 'products');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Product));
  },

  async saveProduct(
    tenantId: string,
    productData: Omit<Product, 'productId' | 'tenantId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
    userId: string,
    isDemo = false
  ): Promise<Product> {
    const productId = `prd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: Product = {
      ...productData,
      productId,
      tenantId,
      createdAt: isDemo ? new Date().toISOString() : serverTimestamp(),
      createdBy: userId,
      updatedAt: isDemo ? new Date().toISOString() : serverTimestamp(),
      updatedBy: userId,
    };

    if (isDemo) {
      const products = await this.getProducts(tenantId, true);
      const updated = [newProduct, ...products];
      localStorage.setItem(`${DEMO_STORAGE_KEY}_${tenantId}`, JSON.stringify(updated));
      return newProduct;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'products', productId), newProduct);
    return newProduct;
  },

  async adjustStockOnHand(
    tenantId: string,
    productId: string,
    delta: number,
    isDemo = false
  ): Promise<number> {
    if (isDemo) {
      const products = await this.getProducts(tenantId, true);
      const target = products.find((p) => p.productId === productId);
      if (target) {
        target.stockOnHand = Math.max(0, target.stockOnHand + delta);
        localStorage.setItem(`${DEMO_STORAGE_KEY}_${tenantId}`, JSON.stringify(products));
        return target.stockOnHand;
      }
      return 0;
    }

    const productRef = doc(db, 'tenants', tenantId, 'products', productId);
    const snap = await getDoc(productRef);
    if (snap.exists()) {
      const curr = (snap.data() as Product).stockOnHand || 0;
      const updated = Math.max(0, curr + delta);
      await updateDoc(productRef, { stockOnHand: updated, updatedAt: serverTimestamp() });
      return updated;
    }
    return 0;
  },
};
