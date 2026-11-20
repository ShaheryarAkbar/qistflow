import { describe, it, expect, beforeEach } from 'vitest';
import { ProductRepository } from '@/repositories/product.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { StaffRepository } from '@/repositories/staff.repository';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { SupplierRepository } from '@/repositories/supplier.repository';
import { RecoveryRepository } from '@/repositories/recovery.repository';

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

describe('Clean Slate Multi-Tenant Isolation & Reference Shop Preservation', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('preserves full reference demo data for tenant-demo-ryk-01', async () => {
    const tenantId = 'tenant-demo-ryk-01';

    const products = await ProductRepository.getProducts(tenantId, true);
    expect(products.length).toBeGreaterThanOrEqual(3);

    const customers = await CustomerRepository.getCustomers(tenantId, true);
    expect(customers.length).toBeGreaterThanOrEqual(3);

    const contracts = await SaleRepository.getContracts(tenantId, true);
    expect(contracts.length).toBeGreaterThanOrEqual(3);

    const staff = await StaffRepository.getStaffMembers(tenantId, true);
    expect(staff.some((s) => s.role === 'owner')).toBe(true);
    expect(staff.some((s) => s.role === 'manager')).toBe(true);
    expect(staff.some((s) => s.role === 'accountant')).toBe(true);
    const recoveryOfficers = staff.filter((s) => s.role === 'recovery');
    expect(recoveryOfficers.length).toBeGreaterThanOrEqual(2);

    const expenses = await ExpenseRepository.getExpenses(tenantId, true);
    expect(expenses.length).toBeGreaterThan(0);

    const suppliers = await SupplierRepository.getSuppliers(tenantId, true);
    expect(suppliers.length).toBeGreaterThan(0);

    const assignments = await RecoveryRepository.getAssignments(tenantId, undefined, true);
    expect(assignments.length).toBeGreaterThan(0);
  });

  it('guarantees clean slate (0 records except owner) for tenant-fresh-02', async () => {
    const tenantId = 'tenant-fresh-02';

    // 0 Products
    const products = await ProductRepository.getProducts(tenantId, true);
    expect(products).toHaveLength(0);

    // 0 Customers
    const customers = await CustomerRepository.getCustomers(tenantId, true);
    expect(customers).toHaveLength(0);

    // 0 Contracts & Sales
    const contracts = await SaleRepository.getContracts(tenantId, true);
    expect(contracts).toHaveLength(0);

    // 0 Recovery Assignments & 0 Visits
    const assignments = await RecoveryRepository.getAssignments(tenantId, undefined, true);
    expect(assignments).toHaveLength(0);
    const visits = await RecoveryRepository.getVisits(tenantId, true);
    expect(visits).toHaveLength(0);

    // 0 Expenses
    const expenses = await ExpenseRepository.getExpenses(tenantId, true);
    expect(expenses).toHaveLength(0);

    // 0 Suppliers
    const suppliers = await SupplierRepository.getSuppliers(tenantId, true);
    expect(suppliers).toHaveLength(0);

    // Staff contains ONLY the Shop Owner
    const staff = await StaffRepository.getStaffMembers(tenantId, true);
    expect(staff).toHaveLength(1);
    expect(staff[0].role).toBe('owner');
    expect(staff.some((s) => s.role === 'manager')).toBe(false);
    expect(staff.some((s) => s.role === 'accountant')).toBe(false);
    expect(staff.some((s) => s.role === 'recovery')).toBe(false);
  });

  it('supports independent manual data creation in tenant-fresh-02 without leaking into reference shop', async () => {
    const freshTenantId = 'tenant-fresh-02';
    const refTenantId = 'tenant-demo-ryk-01';

    // Add a manual product in fresh shop
    const newProduct = await ProductRepository.saveProduct(
      freshTenantId,
      {
        productCode: 'PRD-AC-01',
        name: 'Haier Inverter AC 1.5 Ton',
        category: 'Air Conditioners',
        brand: 'Haier',
        model: 'HSU-18HFCD',
        skuNormalized: 'HAIER15AC',
        barcodeNormalized: '896400999001',
        description: '1.5 Ton Inverter Heat & Cool',
        costPricePaisa: 12000000,
        cashPricePaisa: 14500000,
        installmentPricePaisa: 17500000,
        stockOnHand: 5,
        status: 'active',
      },
      'usman_owner',
      true
    );
    expect(newProduct.productId).toBeDefined();

    // Verify fresh shop has 1 product
    const freshProducts = await ProductRepository.getProducts(freshTenantId, true);
    expect(freshProducts).toHaveLength(1);
    expect(freshProducts[0].name).toBe('Haier Inverter AC 1.5 Ton');

    // Verify reference shop is untouched
    const refProducts = await ProductRepository.getProducts(refTenantId, true);
    expect(refProducts.some((p) => p.name === 'Haier Inverter AC 1.5 Ton')).toBe(false);

    // Add a manual recovery officer in fresh shop
    const newOfficer = await StaffRepository.inviteStaffMember({
      tenantId: freshTenantId,
      invitedBy: 'usman_owner',
      displayName: 'Asif Field Officer',
      email: 'asif.recovery@alnoor.pk',
      phone: '0302-9988776',
      role: 'recovery',
      password: 'Pak@12345',
      designation: 'Recovery Executive',
      isDemo: true,
    });
    expect(newOfficer.userId).toBeDefined();

    const freshStaff = await StaffRepository.getStaffMembers(freshTenantId, true);
    expect(freshStaff).toHaveLength(2); // Owner + Asif
    expect(freshStaff.some((s) => s.displayName === 'Asif Field Officer')).toBe(true);

    const refStaff = await StaffRepository.getStaffMembers(refTenantId, true);
    expect(refStaff.some((s) => s.displayName === 'Asif Field Officer')).toBe(false);
  });
});
