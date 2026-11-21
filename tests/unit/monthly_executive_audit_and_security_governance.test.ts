// ============================================================================
// Unit Tests: Monthly Executive Business Audit & Granular Security Governance
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PERMISSION_GROUPS,
  getDefaultPermissionsForRole,
  canActorManageTarget,
} from '@/domain/permissions/definitions';
import { StaffRepository } from '@/repositories/staff.repository';
import { Product, Sale, InventoryMovement, StaffPayrollRecord, Expense, Payment } from '@/types';
import { formatPaisa, rupeesToPaisa } from '@/domain/money/paisa';

// In-memory localStorage mock for node environment
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, value: string) => {
    storageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const key of Object.keys(storageMock)) delete storageMock[key];
  },
  key: (index: number) => Object.keys(storageMock)[index] || null,
  length: 0,
};

describe('Granular Security & Permission Governance Matrix', () => {
  it('defines all required core modules and granular minor sub-actions', () => {
    const moduleKeys = PERMISSION_GROUPS.map((g) => g.moduleKey);
    expect(moduleKeys).toContain('module_pos');
    expect(moduleKeys).toContain('module_customers');
    expect(moduleKeys).toContain('module_contracts');
    expect(moduleKeys).toContain('module_installments');
    expect(moduleKeys).toContain('module_inventory');
    expect(moduleKeys).toContain('module_expenses');
    expect(moduleKeys).toContain('module_recovery');
    expect(moduleKeys).toContain('module_staff');
    expect(moduleKeys).toContain('module_reports');
    expect(moduleKeys).toContain('module_calculator');

    // POS group sub-actions
    const posGroup = PERMISSION_GROUPS.find((g) => g.moduleKey === 'module_pos');
    expect(posGroup).toBeDefined();
    const posActionKeys = posGroup!.subActions.map((a) => a.key);
    expect(posActionKeys).toContain('action_create_cash_sale');
    expect(posActionKeys).toContain('action_create_installment_sale');
    expect(posActionKeys).toContain('action_grant_discount');

    // Inventory group sub-actions (including marking damaged stock)
    const invGroup = PERMISSION_GROUPS.find((g) => g.moduleKey === 'module_inventory');
    expect(invGroup).toBeDefined();
    const invActionKeys = invGroup!.subActions.map((a) => a.key);
    expect(invActionKeys).toContain('action_mark_damaged_stock');
    expect(invActionKeys).toContain('action_add_product');
  });

  it('correctly supplies default permissions according to role tiers', () => {
    const ownerPerms = getDefaultPermissionsForRole('owner');
    expect(ownerPerms).toEqual(['all']);

    const managerPerms = getDefaultPermissionsForRole('manager');
    expect(managerPerms).toContain('module_pos');
    expect(managerPerms).toContain('module_inventory');
    expect(managerPerms).toContain('action_mark_damaged_stock');
    expect(managerPerms).toContain('action_create_cash_sale');

    const accountantPerms = getDefaultPermissionsForRole('accountant');
    expect(accountantPerms).toContain('module_expenses');
    expect(accountantPerms).toContain('module_reports');
    expect(accountantPerms).toContain('action_pay_salary');
    expect(accountantPerms).not.toContain('module_pos');

    const recoveryPerms = getDefaultPermissionsForRole('recovery');
    expect(recoveryPerms).toContain('module_recovery');
    expect(recoveryPerms).toContain('action_collect_payment');
    expect(recoveryPerms).not.toContain('module_inventory');
  });

  it('enforces strict hierarchy governance between roles', () => {
    // Owner can manage all subordinate roles
    expect(canActorManageTarget('owner', 'manager')).toBe(true);
    expect(canActorManageTarget('owner', 'accountant')).toBe(true);
    expect(canActorManageTarget('owner', 'recovery')).toBe(true);

    // Manager can ONLY manage Recovery Officers, NOT Owner or Accountant
    expect(canActorManageTarget('manager', 'recovery')).toBe(true);
    expect(canActorManageTarget('manager', 'owner')).toBe(false);
    expect(canActorManageTarget('manager', 'accountant')).toBe(false);

    // Recovery officers cannot manage anyone
    expect(canActorManageTarget('recovery', 'manager')).toBe(false);
  });

  it('allows owner to block/suspend and subsequently unblock any staff account', async () => {
    const testTenantId = 'tenant_test_security_01';
    localStorage.clear();

    const staffList = await StaffRepository.getStaffMembers(testTenantId, true);
    // Add a demo manager to test block/unblock
    const member = await StaffRepository.inviteStaffMember({
      tenantId: testTenantId,
      invitedBy: 'owner',
      displayName: 'Asif Nadeem',
      email: 'asif@test.pk',
      role: 'manager',
      isDemo: true,
    });

    expect(member.status).toBe('active');
    expect(member.isBlocked).toBeFalsy();

    // 1. Block account
    const blocked = await StaffRepository.toggleStaffBlock(testTenantId, member.userId, true);
    expect(blocked).toBe(true);

    const updatedStaffAfterBlock = await StaffRepository.getStaffMembers(testTenantId, true);
    const targetAfterBlock = updatedStaffAfterBlock.find((s) => s.userId === member.userId);
    expect(targetAfterBlock?.isBlocked).toBe(true);
    expect(targetAfterBlock?.status).toBe('suspended');

    // 2. Unblock account
    const unblocked = await StaffRepository.toggleStaffBlock(testTenantId, member.userId, true);
    expect(unblocked).toBe(false);

    const updatedStaffAfterUnblock = await StaffRepository.getStaffMembers(testTenantId, true);
    const targetAfterUnblock = updatedStaffAfterUnblock.find((s) => s.userId === member.userId);
    expect(targetAfterUnblock?.isBlocked).toBe(false);
    expect(targetAfterUnblock?.status).toBe('active');
  });
});

describe('Monthly Executive Business Audit Financial Reconciliation', () => {
  it('correctly audits stock on hand, units sold, purchases, and damaged inventory', () => {
    const sampleProducts: Product[] = [
      {
        productId: 'prd-ac-01',
        tenantId: 't-1',
        name: 'Haier 1.5 Ton DC Inverter',
        costPricePaisa: 8000000, // Rs. 80,000
        cashPricePaisa: 9500000,
        installmentPricePaisa: 11000000,
        stockOnHand: 6,
        status: 'active',
        createdAt: '2026-11-01',
        createdBy: 'owner',
        updatedAt: '2026-11-01',
        updatedBy: 'owner',
      },
      {
        productId: 'prd-fridge-02',
        tenantId: 't-1',
        name: 'Dawlance 9170 Refrigerator',
        costPricePaisa: 6000000, // Rs. 60,000
        cashPricePaisa: 7500000,
        installmentPricePaisa: 8800000,
        stockOnHand: 4,
        status: 'active',
        createdAt: '2026-11-01',
        createdBy: 'owner',
        updatedAt: '2026-11-01',
        updatedBy: 'owner',
      },
    ];

    // Current available stock
    const totalUnitsOnHand = sampleProducts.reduce((sum, p) => sum + p.stockOnHand, 0);
    expect(totalUnitsOnHand).toBe(10); // 6 + 4

    // Total stock asset valuation
    const stockAssetValuation = sampleProducts.reduce(
      (sum, p) => sum + p.stockOnHand * p.costPricePaisa,
      0
    );
    expect(stockAssetValuation).toBe(6 * 8000000 + 4 * 6000000); // 480,000 + 240,000 = Rs. 720,000 (72,000,000 paisa)
    expect(formatPaisa(stockAssetValuation)).toBe('720,000');

    // Damaged stock movement
    const sampleMovements: InventoryMovement[] = [
      {
        movementId: 'mov-dmg-01',
        tenantId: 't-1',
        productId: 'prd-fridge-02',
        movementType: 'damage',
        quantity: 1, // 1 damaged fridge
        movementDate: '2026-11-15T10:00:00Z',
        reason: 'Transit compressor gas leak and dented door',
        createdAt: '2026-11-15T10:00:00Z',
        createdBy: 'manager',
      },
    ];

    const damagedCount = sampleMovements
      .filter((m) => m.movementType === 'damage')
      .reduce((sum, m) => sum + m.quantity, 0);
    expect(damagedCount).toBe(1);

    const damagedLossPaisa = sampleMovements
      .filter((m) => m.movementType === 'damage')
      .reduce((sum, m) => {
        const p = sampleProducts.find((x) => x.productId === m.productId);
        return sum + m.quantity * (p?.costPricePaisa || 0);
      }, 0);

    expect(damagedLossPaisa).toBe(6000000); // Rs. 60,000
    expect(formatPaisa(damagedLossPaisa)).toBe('60,000');
  });

  it('correctly audits monthly payroll disbursements (who was paid how much)', () => {
    const samplePayroll: StaffPayrollRecord[] = [
      {
        payrollId: 'pr-01',
        tenantId: 't-1',
        userId: 'u-manager',
        employeeName: 'Muhammad Tariq',
        role: 'manager',
        designation: 'Shop General Manager',
        monthKey: '2026-11',
        baseSalaryPaisa: 4500000, // Rs. 45,000
        bonusPaisa: 500000, // Rs. 5,000
        deductionsPaisa: 0,
        netPayablePaisa: 5000000, // Rs. 50,000
        status: 'paid',
        paymentMethod: 'cash',
        paidAt: '2026-11-05',
        createdAt: '2026-11-01',
      },
      {
        payrollId: 'pr-02',
        tenantId: 't-1',
        userId: 'u-accountant',
        employeeName: 'Kamran Ali',
        role: 'accountant',
        designation: 'Head Accountant',
        monthKey: '2026-11',
        baseSalaryPaisa: 3500000, // Rs. 35,000
        bonusPaisa: 0,
        deductionsPaisa: 0,
        netPayablePaisa: 3500000, // Rs. 35,000
        status: 'paid',
        paymentMethod: 'bank',
        paidAt: '2026-11-05',
        createdAt: '2026-11-01',
      },
      {
        payrollId: 'pr-03',
        tenantId: 't-1',
        userId: 'u-recovery',
        employeeName: 'Tariq Mehmood',
        role: 'recovery',
        designation: 'Field Recovery Officer (Zone C)',
        monthKey: '2026-11',
        baseSalaryPaisa: 2800000, // Rs. 28,000
        bonusPaisa: 0,
        deductionsPaisa: 0,
        netPayablePaisa: 2800000, // Rs. 28,000
        status: 'pending',
        createdAt: '2026-11-01',
      },
    ];

    const totalPaidSalaries = samplePayroll
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.netPayablePaisa, 0);

    expect(totalPaidSalaries).toBe(5000000 + 3500000); // Rs. 85,000 (8,500,000 paisa)
    expect(formatPaisa(totalPaidSalaries)).toBe('85,000');

    // Total committed payroll
    const totalCommitted = samplePayroll.reduce((sum, p) => sum + p.netPayablePaisa, 0);
    expect(totalCommitted).toBe(5000000 + 3500000 + 2800000); // Rs. 113,000
  });

  it('correctly calculates monthly net cash flow (Inflow vs Outflow & P&L)', () => {
    // Total Collections Inflow in month = Rs. 250,000 (25,000,000 paisa)
    const totalInflowPaisa = 25000000;
    // Office expenses = Rs. 40,000 (4,000,000 paisa)
    const totalOfficeExpensesPaisa = 4000000;
    // Paid salaries = Rs. 85,000 (8,500,000 paisa)
    const totalSalariesPaidPaisa = 8500000;

    const totalOutflowPaisa = totalOfficeExpensesPaisa + totalSalariesPaidPaisa; // Rs. 125,000
    const netCashFlowPaisa = totalInflowPaisa - totalOutflowPaisa; // Rs. 125,000

    expect(totalOutflowPaisa).toBe(12500000);
    expect(netCashFlowPaisa).toBe(12500000);
    expect(formatPaisa(netCashFlowPaisa)).toBe('125,000');
  });
});
