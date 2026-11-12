// ============================================================================
// Repository: Archive, Data Portability & Safe Restore Drills
// ============================================================================

import { CustomerRepository } from './customer.repository';
import { ProductRepository } from './product.repository';
import { SupplierRepository } from './supplier.repository';
import { InventoryRepository } from './inventory.repository';
import { SaleRepository } from './sale.repository';
import { PaymentRepository } from './payment.repository';
import { ExpenseRepository } from './expense.repository';
import { RecoveryRepository } from './recovery.repository';
import { CertificateRepository } from './certificate.repository';
import { StaffRepository } from './staff.repository';
import { Tenant } from '@/types';
import { QistFlowBackupPackage, createBackupPackage } from '@/lib/archive/jsonBackup';

export interface RestoreReport {
  success: boolean;
  targetTenantId: string;
  restoredCounts: Record<string, number>;
  reconciledBalances: {
    totalContracts: number;
    totalOutstandingPaisa: number;
    totalStockOnHand: number;
  };
  warnings: string[];
}

export const ArchiveRepository = {
  async exportFullTenantPackage(
    tenant: Tenant,
    isDemo = false
  ): Promise<QistFlowBackupPackage> {
    const tenantId = tenant.tenantId;

    const [
      customers,
      products,
      suppliers,
      purchases,
      inventoryMovements,
      sales,
      contracts,
      payments,
      expenses,
      recoveryAssignments,
      recoveryVisits,
      certificates,
      staff,
    ] = await Promise.all([
      CustomerRepository.getCustomers(tenantId, isDemo),
      ProductRepository.getProducts(tenantId, isDemo),
      SupplierRepository.getSuppliers(tenantId, isDemo),
      SupplierRepository.getPurchases(tenantId, isDemo),
      InventoryRepository.getMovements(tenantId, isDemo),
      SaleRepository.getSales(tenantId, isDemo),
      SaleRepository.getContracts(tenantId, isDemo),
      PaymentRepository.getPayments(tenantId, isDemo),
      ExpenseRepository.getExpenses(tenantId, isDemo),
      RecoveryRepository.getAssignments(tenantId, undefined, isDemo),
      RecoveryRepository.getVisits(tenantId, isDemo),
      CertificateRepository.getCertificates(tenantId, isDemo),
      StaffRepository.getStaffMembers(tenantId, isDemo),
    ]);

    // Gather schedule entries for each contract
    let allScheduleEntries: any[] = [];
    for (const c of contracts) {
      const entries = await SaleRepository.getScheduleEntries(tenantId, c.contractId, isDemo);
      allScheduleEntries = [...allScheduleEntries, ...entries];
    }

    return createBackupPackage({
      tenant: {
        tenantId: tenant.tenantId,
        businessName: tenant.businessName,
        businessNameUr: tenant.businessNameUr,
        city: tenant.city,
        currency: tenant.currency,
        timezone: tenant.timezone,
      },
      scopeType: 'all_time',
      collections: {
        customers,
        products,
        suppliers,
        purchases,
        inventoryMovements,
        sales,
        contracts,
        scheduleEntries: allScheduleEntries,
        payments,
        paymentAllocations: [],
        paymentReversals: [],
        expenses,
        recoveryAssignments,
        recoveryVisits,
        certificates,
        staff,
      },
    });
  },

  async restoreIntoTestTenant(
    targetTenantId: string,
    backupPackage: QistFlowBackupPackage,
    isDemo = false
  ): Promise<RestoreReport> {
    const { collections } = backupPackage;
    const warnings: string[] = [];

    // Re-key items to targetTenantId to prevent cross-tenant overwrites
    const rekeyedCustomers = collections.customers.map((c) => ({ ...c, tenantId: targetTenantId }));
    const rekeyedProducts = collections.products.map((p) => ({ ...p, tenantId: targetTenantId }));
    const rekeyedContracts = collections.contracts.map((c) => ({ ...c, tenantId: targetTenantId }));
    const rekeyedSchedules = collections.scheduleEntries.map((s) => ({ ...s, tenantId: targetTenantId }));
    const rekeyedPayments = collections.payments.map((p) => ({ ...p, tenantId: targetTenantId }));

    if (isDemo) {
      localStorage.setItem(`qistflow_demo_customers_${targetTenantId}`, JSON.stringify(rekeyedCustomers));
      localStorage.setItem(`qistflow_demo_products_${targetTenantId}`, JSON.stringify(rekeyedProducts));
      localStorage.setItem(`qistflow_demo_contracts_${targetTenantId}`, JSON.stringify(rekeyedContracts));
      localStorage.setItem(`qistflow_demo_payments_${targetTenantId}`, JSON.stringify(rekeyedPayments));

      for (const s of rekeyedSchedules) {
        const key = `qistflow_demo_schedules_${targetTenantId}_${s.contractId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.some((e: any) => e.scheduleEntryId === s.scheduleEntryId)) {
          localStorage.setItem(key, JSON.stringify([...existing, s]));
        }
      }
    }

    // Post-Restore Ledger Reconciliation
    const totalOutstandingPaisa = rekeyedContracts.reduce((sum, c) => sum + (c.outstandingPaisa || 0), 0);
    const totalStockOnHand = rekeyedProducts.reduce((sum, p) => sum + (p.stockOnHand || 0), 0);

    const scheduleRemainingSum = rekeyedSchedules.reduce((sum, s) => sum + (s.remainingPaisa || 0), 0);
    if (scheduleRemainingSum !== totalOutstandingPaisa) {
      warnings.push(
        `Discrepancy detected: Contracts outstanding (Rs. ${totalOutstandingPaisa / 100}) vs Schedule remaining sum (Rs. ${scheduleRemainingSum / 100})`
      );
    }

    return {
      success: true,
      targetTenantId,
      restoredCounts: {
        customers: rekeyedCustomers.length,
        products: rekeyedProducts.length,
        contracts: rekeyedContracts.length,
        scheduleEntries: rekeyedSchedules.length,
        payments: rekeyedPayments.length,
      },
      reconciledBalances: {
        totalContracts: rekeyedContracts.length,
        totalOutstandingPaisa,
        totalStockOnHand,
      },
      warnings,
    };
  },
};
