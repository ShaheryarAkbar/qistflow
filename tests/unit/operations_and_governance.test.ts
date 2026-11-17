import { describe, it, expect, beforeEach } from 'vitest';
import { BranchRepository } from '@/repositories/branch.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { RecoveryRepository } from '@/repositories/recovery.repository';
import { StaffRepository } from '@/repositories/staff.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { rupeesToPaisa } from '@/domain/money/paisa';

// In-memory mock for localStorage in Node environment
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  key: (index: number) => Object.keys(mockStorage)[index] || null,
  length: 0,
};

describe('Operations, Mistakes Correction & Multi-Branch Governance', () => {
  const tenantId = 't-test-governance';
  const userId = 'u-test-owner';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Multi-Branch Sub-Licensing & Performance Attribution', () => {
    it('should retrieve initial demo branches with unique sub-licences and P&L metrics', async () => {
      const branches = await BranchRepository.getBranches(tenantId, true);
      expect(branches.length).toBeGreaterThanOrEqual(3);

      const mainBranch = branches.find((b) => b.branchCode === 'BR-01');
      expect(mainBranch).toBeDefined();
      expect(mainBranch?.licenceKey).toMatch(/^QIST-BR1/);
      expect(mainBranch?.metrics.performanceRating).toBe('profit');
      expect(mainBranch?.managerName).toBe('Muhammad Tariq');

      const lossBranch = branches.find((b) => b.branchCode === 'BR-03');
      expect(lossBranch).toBeDefined();
      expect(lossBranch?.metrics.performanceRating).toBe('loss');
    });

    it('should register a new branch with an enforced sub-licence key and monthly target', async () => {
      const created = await BranchRepository.createBranch({
        tenantId,
        userId,
        branchCode: 'BR-04',
        name: 'Model Town Outpost',
        nameUr: 'ماڈل ٹاؤن آؤٹ پوسٹ',
        managerName: 'Hamza Farooq',
        monthlyTargetPaisa: rupeesToPaisa('4000000'),
        isDemo: true,
      });

      expect(created.branchCode).toBe('BR-04');
      expect(created.licenceKey).toBeDefined();
      expect(created.licenceStatus).toBe('active');
      expect(created.monthlyTargetPaisa).toBe(400000000);

      const all = await BranchRepository.getBranches(tenantId, true);
      expect(all.some((b) => b.branchCode === 'BR-04')).toBe(true);
    });

    it('should allow owner to toggle branch status between active and inactive', async () => {
      const branches = await BranchRepository.getBranches(tenantId, true);
      const target = branches[0];
      await BranchRepository.updateBranchStatus(tenantId, target.branchId, 'inactive', true);

      const updated = await BranchRepository.getBranches(tenantId, true);
      expect(updated.find((b) => b.branchId === target.branchId)?.status).toBe('inactive');
    });
  });

  describe('Financial Mistake Correction (Payment Reallocation & Audit)', () => {
    it('should update payment customer, amount and adjust contract balances with audit note', async () => {
      // 1. Create sale & contract
      const saleRes = await SaleRepository.createSaleAndContract({
        tenantId,
        userId,
        customerId: 'cus-1',
        saleType: 'installment',
        items: [
          {
            productId: 'p-1',
            productNameSnapshot: 'Dawlance Refrigerator',
            quantity: 1,
            unitCostPaisa: 5000000,
            unitCashPricePaisa: 6000000,
            unitInstallmentPricePaisa: 8000000,
            lineTotalPaisa: 8000000,
          },
        ],
        advancePaisa: 2000000,
        cashTotalPaisa: 6000000,
        agreedTotalPaisa: 8000000,
        discountPaisa: 0,
        frequency: 'monthly',
        durationCount: 6,
        firstDueDateKey: '2026-12-05',
        schedulePreview: [
          {
            sequenceNumber: 1,
            dueDateKey: '2026-12-05',
            dueAmountPaisa: 6000000,
          },
        ],
        isDemo: true,
      });

      const contractId = saleRes.contract?.contractId!;
      expect(contractId).toBeDefined();

      // 2. Record payment mistakenly
      const payRes = await PaymentRepository.recordPayment({
        tenantId,
        userId,
        customerId: 'cus-1',
        contractId,
        amountPaisa: 1000000, // 10,000 Rs
        method: 'cash',
        isDemo: true,
      });

      // 3. Update payment with corrected amount and customer
      const corrected = await PaymentRepository.updatePayment({
        tenantId,
        userId,
        paymentId: payRes.payment.paymentId,
        customerId: 'cus-2', // reallocated to customer 2
        contractId,
        amountPaisa: 1500000, // changed to 15,000 Rs
        correctionReason: 'Wrong customer and amount entered by cashier',
        isDemo: true,
      });

      expect(corrected.customerId).toBe('cus-2');
      expect(corrected.amountPaisa).toBe(1500000);
      expect(corrected.notes).toContain('Wrong customer and amount entered by cashier');

      // Contract total paid should reflect advance (20,000 Rs) + corrected payment (15,000 Rs) = 35,000 Rs = 3,500,000 Paisa
      const contracts = await SaleRepository.getContracts(tenantId, true);
      const ctr = contracts.find((c) => c.contractId === contractId);
      expect(ctr?.totalPaidPaisa).toBe(3500000);
      expect(ctr?.outstandingPaisa).toBe(4500000); // 80,000 - 35,000 = 45,000 Rs
    });
  });

  describe('Recovery Auto-Assignment, Reassignment & Visit Updates', () => {
    it('should assign customer to recovery officer and support reassignment', async () => {
      const assignment = await RecoveryRepository.assignCustomer({
        tenantId,
        assignedBy: userId,
        customerId: 'cus-101',
        employeeId: 'rec-officer-01',
        isDemo: true,
      });

      expect(assignment.employeeId).toBe('rec-officer-01');

      // Reassign to officer 02
      await RecoveryRepository.reassignCustomer({
        tenantId,
        assignmentId: assignment.assignmentId,
        newEmployeeId: 'rec-officer-02',
        isDemo: true,
      });

      const list = await RecoveryRepository.getAssignments(tenantId, undefined, true);
      const found = list.find((a) => a.assignmentId === assignment.assignmentId);
      expect(found?.employeeId).toBe('rec-officer-02');
    });

    it('should update recovery visit outcome and corrected customer notes', async () => {
      const visit = await RecoveryRepository.logVisit({
        tenantId,
        userId: 'rec-officer-01',
        assignmentId: 'asg-test-01',
        customerId: 'cus-wrong-01',
        outcome: 'unavailable',
        note: 'Door locked',
        isDemo: true,
      });

      const updated = await RecoveryRepository.updateVisit({
        tenantId,
        visitId: visit.visitId,
        customerId: 'cus-correct-01',
        outcome: 'collected',
        note: 'Customer paid installment cash, corrected entry',
        isDemo: true,
      });

      expect(updated?.customerId).toBe('cus-correct-01');
      expect(updated?.outcome).toBe('collected');
      expect(updated?.note).toContain('corrected entry');
    });
  });

  describe('Staff Salary & Payroll Linked to Expenses', () => {
    it('should update staff designation and monthly salary', async () => {
      const staffList = await StaffRepository.getStaffMembers(tenantId, true);
      const helper = staffList.find((s) => s.role === 'recovery');
      expect(helper).toBeDefined();

      await StaffRepository.updateStaffSalary(
        tenantId,
        helper!.userId,
        rupeesToPaisa('28000'),
        'Safai & Field Assistant',
        true
      );

      const updatedList = await StaffRepository.getStaffMembers(tenantId, true);
      const updatedHelper = updatedList.find((s) => s.userId === helper!.userId);
      expect(updatedHelper?.monthlySalaryPaisa).toBe(2800000);
      expect(updatedHelper?.designation).toBe('Safai & Field Assistant');
    });

    it('should pay monthly salary and automatically register it under shop expenses', async () => {
      const payroll = await StaffRepository.getPayrollRecords(tenantId, '2026-11', true);
      expect(payroll.length).toBeGreaterThan(0);

      const pendingRecord = payroll.find((p) => p.status === 'pending');
      expect(pendingRecord).toBeDefined();

      const paid = await StaffRepository.paySalary({
        tenantId,
        userId,
        payrollId: pendingRecord!.payrollId,
        amountPaisa: pendingRecord!.netPayablePaisa,
        paymentMethod: 'bank',
        notes: 'November 2026 Bank Transfer',
        isDemo: true,
      });

      expect(paid.status).toBe('paid');
      expect(paid.paymentMethod).toBe('bank');

      // Verify expense record created under 'Salaries (تنخواہیں)'
      const expenses = await ExpenseRepository.getExpenses(tenantId, true);
      const salaryExpense = expenses.find((e) => e.category === 'Salaries (تنخواہیں)');
      expect(salaryExpense).toBeDefined();
      expect(salaryExpense?.amountPaisa).toBe(pendingRecord!.netPayablePaisa);
    });
  });
});
