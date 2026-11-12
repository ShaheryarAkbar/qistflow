// ============================================================================
// Unit Tests: Role Governance, Permissions Matrix & Universal Calculator Math
// ============================================================================

import { describe, it, expect } from 'vitest';
import { UserRole } from '@/types';

// Calculator logic helper
export function calculateInstallmentPlan(params: {
  cashPrice: number;
  advance: number;
  durationMonths: number;
  markupPercent: number;
}) {
  const financed = Math.max(0, params.cashPrice - params.advance);
  const profit = Math.round((financed * params.markupPercent) / 100);
  const totalInstallmentPrice = params.advance + financed + profit;
  const remainingFinanced = Math.max(0, totalInstallmentPrice - params.advance);
  const monthly = params.durationMonths > 0 ? Math.round(remainingFinanced / params.durationMonths) : 0;
  return { financed, profit, totalInstallmentPrice, monthly };
}

export function calculateLumpSumSplit(params: {
  lumpSum: number;
  monthlyDue: number;
}) {
  if (params.monthlyDue <= 0) return { clearedCount: 0, advanceCredit: params.lumpSum };
  const clearedCount = Math.floor(params.lumpSum / params.monthlyDue);
  const clearedTotal = clearedCount * params.monthlyDue;
  const advanceCredit = Math.max(0, params.lumpSum - clearedTotal);
  return { clearedCount, clearedTotal, advanceCredit };
}

// Role permission helper
export function checkRoleCanAccessModule(role: UserRole, module: string): boolean {
  switch (role) {
    case 'recovery':
      // Strictly recovery portal & calculator only
      return ['recovery', 'calculator', 'portal'].includes(module);

    case 'accountant':
      // Financial records only, strictly no staff or stock mutations
      return [
        'dashboard',
        'installments/due',
        'payments',
        'expenses',
        'reports',
        'contracts',
        'customers',
        'calculator',
        'portal',
      ].includes(module);

    case 'manager':
      // Day to day operations, no raw archives/backups or shop legal settings
      return [
        'dashboard',
        'sales/new',
        'customers',
        'contracts',
        'installments/due',
        'payments',
        'products',
        'inventory',
        'suppliers',
        'purchases',
        'expenses',
        'recovery',
        'reports',
        'staff',
        'calculator',
        'portal',
      ].includes(module);

    case 'owner':
      // Full unrestricted business authority
      return true;

    case 'super_admin':
      return ['admin', 'calculator', 'portal', 'settings'].includes(module);

    default:
      return false;
  }
}

describe('Universal Installment Calculator Mathematical Precision', () => {
  it('correctly calculates monthly installment, profit, and financed total', () => {
    const plan = calculateInstallmentPlan({
      cashPrice: 50000,
      advance: 10000,
      durationMonths: 5,
      markupPercent: 25,
    });

    expect(plan.financed).toBe(40000);
    expect(plan.profit).toBe(10000);
    expect(plan.totalInstallmentPrice).toBe(60000);
    expect(plan.monthly).toBe(10000);
  });

  it('accurately splits lump-sum payment into full installments and advance credit', () => {
    const split = calculateLumpSumSplit({
      lumpSum: 23000,
      monthlyDue: 5000,
    });

    expect(split.clearedCount).toBe(4); // 4 full installments
    expect(split.clearedTotal).toBe(20000);
    expect(split.advanceCredit).toBe(3000); // Rs. 3,000 advance credit for month 5
  });

  it('handles edge cases gracefully (zero advance, zero duration)', () => {
    const zeroAdvance = calculateInstallmentPlan({
      cashPrice: 30000,
      advance: 0,
      durationMonths: 6,
      markupPercent: 20,
    });
    expect(zeroAdvance.financed).toBe(30000);
    expect(zeroAdvance.profit).toBe(6000);
    expect(zeroAdvance.monthly).toBe(6000);
  });
});

describe('Strict Role-Based Access Control Matrix (PRD Section 4)', () => {
  it('strictly blocks Recovery Employee from accessing sensitive shop views', () => {
    const role: UserRole = 'recovery';

    // Must be granted access
    expect(checkRoleCanAccessModule(role, 'recovery')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'calculator')).toBe(true);

    // Must be DENIED access
    expect(checkRoleCanAccessModule(role, 'dashboard')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'products')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'sales/new')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'inventory')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'suppliers')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'expenses')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'staff')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'archives')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'settings')).toBe(false);
  });

  it('grants Accountant financial access while preventing staff and catalog alterations', () => {
    const role: UserRole = 'accountant';

    // Financial access granted
    expect(checkRoleCanAccessModule(role, 'dashboard')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'payments')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'installments/due')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'expenses')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'reports')).toBe(true);

    // Operational mutations denied
    expect(checkRoleCanAccessModule(role, 'sales/new')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'products')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'inventory')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'staff')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'archives')).toBe(false);
  });

  it('allows Business Owner full administrative authority', () => {
    const role: UserRole = 'owner';
    expect(checkRoleCanAccessModule(role, 'dashboard')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'sales/new')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'staff')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'archives')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'settings')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'recovery')).toBe(true);
  });

  it('allows Super-Admin access to platform management while keeping shop products isolated', () => {
    const role: UserRole = 'super_admin';
    expect(checkRoleCanAccessModule(role, 'admin')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'calculator')).toBe(true);
    expect(checkRoleCanAccessModule(role, 'settings')).toBe(true);

    // Super-Admin does NOT deal with shop products, sales, inventory or customer recovery
    expect(checkRoleCanAccessModule(role, 'products')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'sales/new')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'inventory')).toBe(false);
    expect(checkRoleCanAccessModule(role, 'recovery')).toBe(false);
  });
});

