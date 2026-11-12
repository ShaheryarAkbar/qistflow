// ============================================================================
// Library: Full Database JSON Backup & Schema Envelope
// Conforming to QistFlow_Firebase_Database_Design_v1.0.md Section 10.2
// ============================================================================

import {
  Tenant,
  Customer,
  Product,
  Supplier,
  Purchase,
  InventoryMovement,
  Sale,
  Contract,
  ScheduleEntry,
  Payment,
  PaymentAllocation,
  PaymentReversal,
  Expense,
  RecoveryAssignment,
  RecoveryVisit,
  ClearanceCertificate,
} from '@/types';
import { StaffMemberRecord } from '@/repositories/staff.repository';

export interface QistFlowBackupPackage {
  product: 'QistFlow';
  backupFormatVersion: 1;
  schemaVersion: 1;
  tenant: Partial<Tenant>;
  exportedAt: string;
  scope: {
    type: 'all_time' | 'monthly' | 'custom';
    startDateKey?: string | null;
    endDateKey?: string | null;
  };
  collections: {
    customers: Customer[];
    products: Product[];
    suppliers: Supplier[];
    purchases: Purchase[];
    inventoryMovements: InventoryMovement[];
    sales: Sale[];
    contracts: Contract[];
    scheduleEntries: ScheduleEntry[];
    payments: Payment[];
    paymentAllocations: PaymentAllocation[];
    paymentReversals: PaymentReversal[];
    expenses: Expense[];
    recoveryAssignments: RecoveryAssignment[];
    recoveryVisits: RecoveryVisit[];
    certificates: ClearanceCertificate[];
    staff: StaffMemberRecord[];
  };
}

export function createBackupPackage(params: {
  tenant: Partial<Tenant>;
  scopeType?: 'all_time' | 'monthly' | 'custom';
  collections: QistFlowBackupPackage['collections'];
}): QistFlowBackupPackage {
  return {
    product: 'QistFlow',
    backupFormatVersion: 1,
    schemaVersion: 1,
    tenant: params.tenant,
    exportedAt: new Date().toISOString(),
    scope: {
      type: params.scopeType || 'all_time',
      startDateKey: null,
      endDateKey: null,
    },
    collections: params.collections,
  };
}

export function validateBackupPackage(jsonString: string): {
  isValid: boolean;
  package?: QistFlowBackupPackage;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    if (parsed.product !== 'QistFlow') {
      return { isValid: false, error: 'Invalid backup file: Not a recognized QistFlow backup package.' };
    }
    if (parsed.backupFormatVersion !== 1) {
      return { isValid: false, error: `Unsupported backup format version: ${parsed.backupFormatVersion}` };
    }
    if (!parsed.collections || typeof parsed.collections !== 'object') {
      return { isValid: false, error: 'Malformed backup: Missing collections object.' };
    }

    return { isValid: true, package: parsed as QistFlowBackupPackage };
  } catch (err: any) {
    return { isValid: false, error: `Failed to parse backup JSON: ${err.message}` };
  }
}
