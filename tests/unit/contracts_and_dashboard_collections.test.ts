import { describe, it, expect, beforeEach } from 'vitest';
import { SaleRepository } from '@/repositories/sale.repository';
import { PaymentRepository } from '@/repositories/payment.repository';

// Mock localStorage in Vitest Node environment
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
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

(global as any).localStorage = mockLocalStorage;

describe('Realistic Seed Contracts & Dashboard Collections Coherence', () => {
  const tenantId = 'tenant_test_seed';

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('provides realistic seed contracts for all customers without duplicate 29k artifacts', async () => {
    const contracts = await SaleRepository.getContracts(tenantId, true);

    expect(contracts.length).toBeGreaterThanOrEqual(3);

    // Verify Muhammad Arshad (ctr-ryk-1001)
    const arshadCtr = contracts.find((c) => c.customerId === 'cus-ryk-001');
    expect(arshadCtr).toBeDefined();
    expect(arshadCtr?.contractCode).toBe('CTR-2026-001');
    expect(arshadCtr?.installmentPriceTotalPaisa).toBe(4800000); // Rs. 48,000
    expect(arshadCtr?.advancePaisa).toBe(1200000); // Rs. 12,000
    expect(arshadCtr?.financedAmountPaisa).toBe(3600000); // Rs. 36,000
    expect(arshadCtr?.outstandingPaisa).toBe(3000000); // Rs. 30,000

    // Verify Tariq Mehmood (ctr-ryk-1002) - completely solves the 29000 issue!
    const tariqCtr = contracts.find((c) => c.customerId === 'cus-ryk-002');
    expect(tariqCtr).toBeDefined();
    expect(tariqCtr?.contractCode).toBe('CTR-2026-002');
    expect(tariqCtr?.installmentPriceTotalPaisa).toBe(9200000); // Rs. 92,000
    expect(tariqCtr?.advancePaisa).toBe(2000000); // Rs. 20,000
    expect(tariqCtr?.financedAmountPaisa).toBe(7200000); // Rs. 72,000
    expect(tariqCtr?.outstandingPaisa).toBe(4800000); // Rs. 48,000
    expect(tariqCtr?.durationCount).toBe(6);

    // Verify outstanding is NOT equal to 29000
    expect(tariqCtr?.outstandingPaisa).not.toBe(2900000);

    // Verify Zahid Hussain (ctr-ryk-1003)
    const zahidCtr = contracts.find((c) => c.customerId === 'cus-ryk-003');
    expect(zahidCtr).toBeDefined();
    expect(zahidCtr?.financedAmountPaisa).toBe(9000000); // Rs. 90,000
    expect(zahidCtr?.outstandingPaisa).toBe(8000000); // Rs. 80,000
  });

  it('generates coherent schedule entries for Tariq Mehmood with Rs. 12,000 installments', async () => {
    const entries = await SaleRepository.getScheduleEntries(tenantId, 'ctr-ryk-1002', true);

    expect(entries.length).toBe(6);

    // Each installment is Rs. 12,000
    entries.forEach((e) => {
      expect(e.dueAmountPaisa).toBe(1200000); // 12,000 PKR
    });

    // Installments #1 and #2 were paid
    expect(entries[0].status).toBe('paid');
    expect(entries[0].remainingPaisa).toBe(0);

    expect(entries[1].status).toBe('paid');
    expect(entries[1].remainingPaisa).toBe(0);

    // Installment #3 is upcoming / due today
    expect(entries[2].remainingPaisa).toBe(1200000);
    expect(entries[2].remainingPaisa).not.toBe(entries[2].dueAmountPaisa * 4); // not remaining balance!
  });

  it('records quick payment collection and updates schedule entry & contract balance', async () => {
    const res = await PaymentRepository.recordPayment({
      tenantId,
      userId: 'test-cashier',
      customerId: 'cus-ryk-002',
      contractId: 'ctr-ryk-1002',
      amountPaisa: 1200000, // Pay Rs. 12,000
      method: 'cash',
      paymentKind: 'installment',
      isDemo: true,
    });

    expect(res.payment.amountPaisa).toBe(1200000);
    expect(res.receipt.receiptNumber).toBeDefined();

    // Verify contract balance is reduced from 48,000 to 36,000
    const contracts = await SaleRepository.getContracts(tenantId, true);
    const updatedTariq = contracts.find((c) => c.contractId === 'ctr-ryk-1002');
    expect(updatedTariq?.outstandingPaisa).toBe(3600000); // Rs. 36,000 remaining
    expect(updatedTariq?.totalPaidPaisa).toBe(5600000); // Rs. 56,000 paid

    // Verify payment is listed in getPayments
    const payments = await PaymentRepository.getPayments(tenantId, true);
    const todayPayment = payments.find((p) => p.paymentId === res.payment.paymentId);
    expect(todayPayment).toBeDefined();
    expect(todayPayment?.reference).toBe(res.receipt.receiptNumber);
  });
});
