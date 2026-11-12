import { describe, it, expect, beforeEach } from 'vitest';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { CertificateRepository } from '@/repositories/certificate.repository';
import { StaffRepository } from '@/repositories/staff.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
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

describe('Integration: Phase 3 Business Management, Expenses & Certificates', () => {
  const tenantId = 'test-tenant-biz';
  const userId = 'user-owner-01';

  beforeEach(() => {
    localStorage.clear();
  });

  it('records expenses and verifies total calculation', async () => {
    const exp = await ExpenseRepository.recordExpense({
      tenantId,
      userId,
      category: 'Rent',
      amountPaisa: 4000000, // 40,000 PKR
      method: 'cash',
      description: 'Monthly shop rent',
      isDemo: true,
    });

    expect(exp.expenseId).toBeDefined();
    expect(exp.amountPaisa).toBe(4000000);

    const allExpenses = await ExpenseRepository.getExpenses(tenantId, true);
    expect(allExpenses.length).toBeGreaterThan(0);
  });

  it('enforces 0-paisa invariant for clearance certificates', async () => {
    // 1. Create customer and contract with 20,000 financed
    const customer = await CustomerRepository.saveCustomer(
      tenantId,
      { fullName: 'Akram Raza', phoneDisplay: '0301-4455667', status: 'active' },
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
          productId: 'prd-fan',
          productNameSnapshot: 'Pak Fan Deluxe',
          quantity: 2,
          cashUnitPricePaisa: 1000000,
          agreedUnitPricePaisa: 1200000,
          lineTotalPaisa: 2400000,
        },
      ],
      cashTotalPaisa: 2000000,
      agreedTotalPaisa: 2400000,
      discountPaisa: 0,
      advancePaisa: 400000, // 4,000 PKR advance
      frequency: 'monthly',
      durationCount: 2,      // 2 installments of 10,000 PKR
      firstDueDateKey: '2026-11-01',
      isDemo: true,
    });

    const contract = saleRes.contract!;
    expect(contract.outstandingPaisa).toBe(2000000); // 20,000 PKR remaining

    // 2. Attempting to issue certificate with balance remaining MUST fail!
    await expect(
      CertificateRepository.issueCertificate({
        tenantId,
        userId,
        contract,
        isDemo: true,
      })
    ).rejects.toThrow('Contract still has an outstanding balance');

    // 3. Pay off the remaining 20,000 PKR in full
    await PaymentRepository.recordPayment({
      tenantId,
      userId,
      customerId: customer.customerId,
      contractId: contract.contractId,
      amountPaisa: 2000000,
      method: 'cash',
      isDemo: true,
    });

    // Refresh contract state
    const contracts = await SaleRepository.getContracts(tenantId, true);
    const settledContract = contracts.find((c) => c.contractId === contract.contractId)!;
    expect(settledContract.outstandingPaisa).toBe(0);
    expect(settledContract.status).toBe('fully_paid');

    // 4. Now issuing certificate MUST succeed!
    const cert = await CertificateRepository.issueCertificate({
      tenantId,
      userId,
      contract: settledContract,
      isDemo: true,
    });

    expect(cert.certificateId).toBeDefined();
    expect(cert.certificateNumber).toContain('CERT-');
    expect(cert.status).toBe('valid');
  });

  it('invites staff members and toggles status', async () => {
    const member = await StaffRepository.inviteStaffMember({
      tenantId,
      invitedBy: userId,
      displayName: 'Asif Mehmood',
      email: 'asif@qistflow.pk',
      role: 'recovery',
      isDemo: true,
    });

    expect(member.userId).toBeDefined();
    expect(member.role).toBe('recovery');
    expect(member.status).toBe('active');

    await StaffRepository.updateStaffStatus(tenantId, member.userId, 'suspended', true);
    const staff = await StaffRepository.getStaffMembers(tenantId, true);
    const target = staff.find((s) => s.userId === member.userId);
    expect(target?.status).toBe('suspended');
  });
});
