import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerRepository } from '@/repositories/customer.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { InventoryRepository } from '@/repositories/inventory.repository';

// In-memory mock for localStorage in Node environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0,
};

describe('Integration: Phase 1 Core Shop Operations', () => {
  const tenantId = 'test-tenant-101';
  const userId = 'user-owner-01';

  beforeEach(() => {
    localStorage.clear();
  });

  it('performs end-to-end customer -> product -> installment sale -> stock reduction workflow', async () => {
    // 1. Create a Customer
    const customer = await CustomerRepository.saveCustomer(
      tenantId,
      {
        fullName: 'Muhammad Tariq',
        phoneDisplay: '0300-5544332',
        city: 'Rahim Yar Khan',
        area: 'Model Town',
        status: 'active',
      },
      userId,
      true
    );
    expect(customer.customerId).toBeDefined();
    expect(customer.normalizedPhone).toBe('923005544332');

    // 2. Fetch or save product with stock 5
    const product = await ProductRepository.saveProduct(
      tenantId,
      {
        name: 'Waves Deep Freezer Cool Bank',
        costPricePaisa: 6000000,
        cashPricePaisa: 7500000,
        installmentPricePaisa: 9000000, // 90,000 PKR
        stockOnHand: 5,
        status: 'active',
      },
      userId,
      true
    );
    expect(product.stockOnHand).toBe(5);

    // 3. Post an Installment Sale: 90,000 total, 20,000 advance, 70,000 financed over 7 months
    const saleResult = await SaleRepository.createSaleAndContract({
      tenantId,
      userId,
      customerId: customer.customerId,
      saleType: 'installment',
      items: [
        {
          productId: product.productId,
          productNameSnapshot: product.name,
          quantity: 1,
          cashUnitPricePaisa: product.cashPricePaisa,
          agreedUnitPricePaisa: product.installmentPricePaisa,
          lineTotalPaisa: product.installmentPricePaisa,
        },
      ],
      cashTotalPaisa: product.cashPricePaisa,
      agreedTotalPaisa: product.installmentPricePaisa,
      discountPaisa: 0,
      advancePaisa: 2000000, // 20,000 PKR advance
      frequency: 'monthly',
      durationCount: 7,
      firstDueDateKey: '2026-12-01',
      isDemo: true,
    });

    expect(saleResult.sale.saleId).toBeDefined();
    expect(saleResult.contract).toBeDefined();
    expect(saleResult.contract?.financedAmountPaisa).toBe(7000000); // 70,000 PKR

    // 4. Verify schedule entries generated
    expect(saleResult.scheduleEntries?.length).toBe(7);
    const sumScheduled = saleResult.scheduleEntries?.reduce((sum, e) => sum + e.dueAmountPaisa, 0);
    expect(sumScheduled).toBe(7000000); // Zero paisa loss invariant!

    // 5. Verify stock was automatically decremented by 1
    const updatedProducts = await ProductRepository.getProducts(tenantId, true);
    const updatedProduct = updatedProducts.find((p) => p.productId === product.productId);
    expect(updatedProduct?.stockOnHand).toBe(4);

    // 6. Verify inventory movement was logged
    const movements = await InventoryRepository.getMovements(tenantId, true);
    const saleMovement = movements.find((m) => m.referenceId === saleResult.sale.saleId);
    expect(saleMovement).toBeDefined();
    expect(saleMovement?.movementType).toBe('sale_out');
    expect(saleMovement?.quantity).toBe(1);
  });
});
