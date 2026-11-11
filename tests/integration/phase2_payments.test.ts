import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerRepository } from '@/repositories/customer.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { PaymentRepository } from '@/repositories/payment.repository';

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

describe('Integration: Phase 2 Payment Ledger & Reversals', () => {
  const tenantId = 'test-tenant-pay';
  const userId = 'user-owner-01';

  beforeEach(() => {
    localStorage.clear();
  });

  it('records payment, allocates to oldest installment, updates balance, and executes reversal', async () => {
    // 1. Create Customer & Contract
    const customer = await CustomerRepository.saveCustomer(
      tenantId,
      { fullName: 'Zahid Khan', phoneDisplay: '0300-1122334', status: 'active' },
      userId,
      true
    );

    const saleRes = await SaleRepository.createSaleAndContract({
      tenantId,
      userId,
      customerId: customer.customerId,
      saleType: 'installment',
      items: [
        {
          productId: 'prd-tv',
          productNameSnapshot: 'Samsung LED TV',
          quantity: 1,
          cashUnitPricePaisa: 5000000,
          agreedUnitPricePaisa: 6000000, // 60,000 PKR
          lineTotalPaisa: 6000000,
        },
      ],
      cashTotalPaisa: 5000000,
      agreedTotalPaisa: 6000000,
      discountPaisa: 0,
      advancePaisa: 1000000, // 10,000 PKR advance
      frequency: 'monthly',
      durationCount: 5,      // 5 installments of 10,000 PKR (1,000,000 paisa) each
      firstDueDateKey: '2026-11-01',
      isDemo: true,
    });

    const contractId = saleRes.contract?.contractId!;
    expect(saleRes.contract?.outstandingPaisa).toBe(5000000); // 50,000 PKR remaining

    // 2. Record Payment: Customer pays 15,000 PKR (1,500,000 paisa)
    // Should fully pay installment #1 (10,000 PKR) and pay 5,000 PKR toward installment #2
    const payRes = await PaymentRepository.recordPayment({
      tenantId,
      userId,
      customerId: customer.customerId,
      contractId,
      amountPaisa: 1500000,
      method: 'cash',
      isDemo: true,
    });

    expect(payRes.payment.paymentId).toBeDefined();
    expect(payRes.receipt.receiptNumber).toBeDefined();
    expect(payRes.allocations.length).toBe(2);

    // Verify contract updated balance: 50,000 - 15,000 = 35,000 PKR
    const contractsAfterPay = await SaleRepository.getContracts(tenantId, true);
    const updatedContract = contractsAfterPay.find((c) => c.contractId === contractId);
    expect(updatedContract?.outstandingPaisa).toBe(3500000);

    // 3. Test Payment Reversal
    const reversal = await PaymentRepository.reversePayment({
      tenantId,
      userId,
      paymentId: payRes.payment.paymentId,
      reason: 'Check bounced / customer error',
      isDemo: true,
    });

    expect(reversal.reversalId).toBeDefined();
    expect(reversal.amountPaisa).toBe(1500000);

    // Verify payment status is reversed
    const paymentsAfterRev = await PaymentRepository.getPayments(tenantId, true);
    const reversedPayment = paymentsAfterRev.find((p) => p.paymentId === payRes.payment.paymentId);
    expect(reversedPayment?.status).toBe('reversed');

    // Verify contract balance is restored to 50,000 PKR
    const contractsAfterRev = await SaleRepository.getContracts(tenantId, true);
    const restoredContract = contractsAfterRev.find((c) => c.contractId === contractId);
    expect(restoredContract?.outstandingPaisa).toBe(5000000);
  });
});
