// ============================================================================
// Repository: Movement-Led Inventory Ledger
// Scoped to /tenants/{tenantId}/inventoryMovements/{movementId}
// Invariant: Posted movements are append-only. Stock is reconciled from movements.
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
import { InventoryMovement } from '@/types';
import { ProductRepository } from './product.repository';

const DEMO_STORAGE_KEY = 'qistflow_demo_inventory_movements';

export const InventoryRepository = {
  async getMovements(tenantId: string, isDemo = false): Promise<InventoryMovement[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_STORAGE_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      const initialMovements: InventoryMovement[] = [
        {
          movementId: 'mov-001',
          tenantId,
          productId: 'prd-sa-240',
          movementType: 'purchase_in',
          quantity: 10,
          movementDate: new Date(Date.now() - 86400000 * 5).toISOString(),
          referenceType: 'purchase',
          referenceId: 'po-1001',
          reason: 'Initial wholesale batch from Lahore distributor',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          createdBy: 'owner',
        },
        {
          movementId: 'mov-002',
          tenantId,
          productId: 'prd-sa-240',
          movementType: 'sale_out',
          quantity: 2,
          movementDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          referenceType: 'sale',
          referenceId: 'sale-2001',
          reason: 'Installment sale to Muhammad Arshad',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          createdBy: 'owner',
        },
      ];
      localStorage.setItem(`${DEMO_STORAGE_KEY}_${tenantId}`, JSON.stringify(initialMovements));
      return initialMovements;
    }

    const colRef = collection(db, 'tenants', tenantId, 'inventoryMovements');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as InventoryMovement));
  },

  async recordMovement(
    tenantId: string,
    movementData: Omit<InventoryMovement, 'movementId' | 'tenantId' | 'createdAt' | 'createdBy'>,
    userId: string,
    isDemo = false
  ): Promise<InventoryMovement> {
    const movementId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const movement: InventoryMovement = {
      ...movementData,
      movementId,
      tenantId,
      createdAt: isDemo ? new Date().toISOString() : serverTimestamp(),
      createdBy: userId,
    };

    // Determine stockOnHand delta
    let delta = 0;
    if (['purchase_in', 'customer_return', 'adjustment_in'].includes(movementData.movementType)) {
      delta = movementData.quantity;
    } else if (['sale_out', 'supplier_return', 'damage', 'adjustment_out'].includes(movementData.movementType)) {
      delta = -movementData.quantity;
    }

    // Persist movement and adjust stock projection
    if (isDemo) {
      const movements = await this.getMovements(tenantId, true);
      const updated = [movement, ...movements];
      localStorage.setItem(`${DEMO_STORAGE_KEY}_${tenantId}`, JSON.stringify(updated));
      await ProductRepository.adjustStockOnHand(tenantId, movementData.productId, delta, true);
      return movement;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'inventoryMovements', movementId), movement);
    await ProductRepository.adjustStockOnHand(tenantId, movementData.productId, delta, false);
    return movement;
  },
};

