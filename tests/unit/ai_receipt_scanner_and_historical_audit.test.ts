import { describe, it, expect, beforeEach } from 'vitest';
import { AiReceiptScannerService } from '@/services/aiReceiptScanner.service';
import { SupplierRepository } from '@/repositories/supplier.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { InventoryRepository } from '@/repositories/inventory.repository';
import { RecoveryRepository } from '@/repositories/recovery.repository';

// Mock localStorage for node environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
};
(globalThis as any).localStorage = mockLocalStorage;

describe('AI Receipt Scanner & Historical Performance Audit Unit Tests', () => {
  const tenantId = 'tenant-test-ai-audit';

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('scans and parses a supplier delivery receipt into products, brands, and quantities (10 ACs, 5 Fridges)', async () => {
    const fakeImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await AiReceiptScannerService.scanReceipt(fakeImageBase64);

    expect(result).toBeDefined();
    expect(result.supplierName).toBeDefined();
    expect(result.items.length).toBeGreaterThanOrEqual(2);

    const acItem = result.items.find((i) => i.brand === 'Haier' || i.productName.includes('AC'));
    const fridgeItem = result.items.find((i) => i.brand === 'Dawlance' || i.productName.includes('Refrigerator'));

    expect(acItem).toBeDefined();
    expect(acItem?.quantity).toBe(10);
    expect(fridgeItem).toBeDefined();
    expect(fridgeItem?.quantity).toBe(5);
    expect(result.subtotalRupees).toBeGreaterThan(0);
  });

  it('automatically provisions products, registers purchase, attaches receipt image, and increments inventory stock', async () => {
    // 1. Find or create supplier
    const supplier = await SupplierRepository.findOrCreateSupplierByName(
      tenantId,
      'Haier Authorized Distributor',
      'Haier Pakistan Wholesale Hub',
      'owner-user-1',
      true
    );
    expect(supplier.supplierId).toBeDefined();
    expect(supplier.name).toBe('Haier Authorized Distributor');

    // 2. Find or create products dynamically
    const acProduct = await ProductRepository.findOrCreateProductByName(
      tenantId,
      {
        name: 'Haier 1.5 Ton DC Inverter AC (H-18-Clean)',
        brand: 'Haier',
        costPriceRupees: 88000,
      },
      'owner-user-1',
      true
    );
    expect(acProduct.productId).toBeDefined();
    expect(acProduct.stockOnHand).toBe(0);

    // 3. Post purchase with receipt image
    const fakeReceiptUrl = 'data:image/svg+xml;utf8,<svg>test-receipt</svg>';
    const purchase = await SupplierRepository.postPurchase(
      tenantId,
      {
        supplierId: supplier.supplierId,
        supplierNameSnapshot: supplier.name,
        purchaseDate: new Date().toISOString(),
        referenceNumber: 'INV-TEST-9901',
        items: [
          {
            productId: acProduct.productId,
            productNameSnapshot: acProduct.name,
            quantity: 10,
            unitCostPaisa: 8800000,
            lineTotalPaisa: 88000000,
          },
        ],
        subtotalPaisa: 88000000,
        discountPaisa: 0,
        totalPaisa: 88000000,
        paidPaisa: 88000000,
        balancePaisa: 0,
        status: 'posted',
        receiptImageUrl: fakeReceiptUrl,
        notes: 'Verified stock delivery intake',
      },
      'owner-user-1',
      true
    );

    expect(purchase.receiptImageUrl).toBe(fakeReceiptUrl);

    // 4. Verify inventory movement and adjusted stock on hand
    const movements = await InventoryRepository.getMovements(tenantId, true);
    const inMovement = movements.find((m) => m.productId === acProduct.productId && m.movementType === 'purchase_in');
    expect(inMovement).toBeDefined();
    expect(inMovement?.quantity).toBe(10);

    const updatedProducts = await ProductRepository.getProducts(tenantId, true);
    const updatedAc = updatedProducts.find((p) => p.productId === acProduct.productId);
    expect(updatedAc?.stockOnHand).toBe(10);
  });

  it('loads multi-officer demo visits including historical comparison snapshots for yesterday and earlier dates', async () => {
    const visits = await RecoveryRepository.getVisits('tenant-demo-ryk-01', true);
    expect(visits.length).toBeGreaterThanOrEqual(25);

    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayVisits = visits.filter((v) => {
      const vDate = typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : '';
      return vDate === yesterdayDate;
    });

    // Should contain historical visits for yesterday to allow trend calculation
    expect(yesterdayVisits.length).toBeGreaterThanOrEqual(10);
  });
});
