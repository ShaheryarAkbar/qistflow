// ============================================================================
// Library: In-Browser ZIP Archive Packaging
// Conforming to QistFlow_Firebase_Database_Design_v1.0.md Section 10.1
// Uses JSZip completely client-side in the shopkeeper's browser.
// ============================================================================

import JSZip from 'jszip';
import { QistFlowBackupPackage } from './jsonBackup';
import { convertToCSV, downloadBlob } from './csvExporter';

export async function generateArchiveZip(backupPackage: QistFlowBackupPackage): Promise<Blob> {
  const zip = new JSZip();
  const tenantName = (backupPackage.tenant.businessName || 'Shop').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];

  // 1. Manifest
  const manifest = {
    product: 'QistFlow',
    schemaVersion: 1,
    tenantId: backupPackage.tenant.tenantId,
    businessName: backupPackage.tenant.businessName,
    archiveScope: backupPackage.scope.type,
    generatedAt: backupPackage.exportedAt,
    recordCounts: Object.entries(backupPackage.collections).reduce(
      (acc, [key, arr]) => ({ ...acc, [key]: arr.length }),
      {}
    ),
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Full JSON Backup
  zip.file('backup/qistflow-backup-v1.json', JSON.stringify(backupPackage, null, 2));

  // 3. Individual CSV Exports
  const { collections } = backupPackage;

  // Customers CSV
  zip.file(
    'csv/customers.csv',
    convertToCSV(
      collections.customers,
      ['customerId', 'fullName', 'phoneDisplay', 'alternatePhone', 'cnic', 'city', 'area', 'address', 'status', 'createdAt'],
      ['Customer ID', 'Full Name', 'Phone', 'Alt Phone', 'CNIC', 'City', 'Area', 'Address', 'Status', 'Created At']
    )
  );

  // Products CSV
  zip.file(
    'csv/products.csv',
    convertToCSV(
      collections.products,
      ['productId', 'name', 'category', 'brand', 'model', 'skuNormalized', 'costPricePaisa', 'cashPricePaisa', 'installmentPricePaisa', 'stockOnHand', 'status'],
      ['Product ID', 'Name', 'Category', 'Brand', 'Model', 'SKU', 'Cost Paisa', 'Cash Price Paisa', 'Installment Price Paisa', 'Stock On Hand', 'Status']
    )
  );

  // Contracts CSV
  zip.file(
    'csv/contracts.csv',
    convertToCSV(
      collections.contracts,
      ['contractId', 'contractCode', 'customerId', 'cashPriceTotalPaisa', 'installmentPriceTotalPaisa', 'advancePaisa', 'financedAmountPaisa', 'totalPaidPaisa', 'outstandingPaisa', 'frequency', 'durationCount', 'status', 'firstDueDateKey'],
      ['Contract ID', 'Code', 'Customer ID', 'Cash Total Paisa', 'Installment Total Paisa', 'Advance Paisa', 'Financed Paisa', 'Paid Paisa', 'Outstanding Paisa', 'Frequency', 'Duration (Months)', 'Status', 'First Due Date']
    )
  );

  // Schedule Entries CSV
  zip.file(
    'csv/schedule-entries.csv',
    convertToCSV(
      collections.scheduleEntries,
      ['scheduleEntryId', 'contractId', 'customerId', 'sequenceNumber', 'dueDateKey', 'dueAmountPaisa', 'allocatedPaidPaisa', 'remainingPaisa', 'status'],
      ['Schedule Entry ID', 'Contract ID', 'Customer ID', 'Sequence #', 'Due Date', 'Due Amount Paisa', 'Paid Paisa', 'Remaining Paisa', 'Status']
    )
  );

  // Payments CSV
  zip.file(
    'csv/payments.csv',
    convertToCSV(
      collections.payments,
      ['paymentId', 'customerId', 'contractId', 'amountPaisa', 'method', 'paidAt', 'receivedBy', 'reference', 'status'],
      ['Payment ID', 'Customer ID', 'Contract ID', 'Amount Paisa', 'Method', 'Paid At', 'Received By', 'Reference', 'Status']
    )
  );

  // Expenses CSV
  zip.file(
    'csv/expenses.csv',
    convertToCSV(
      collections.expenses,
      ['expenseId', 'category', 'amountPaisa', 'method', 'description', 'reference', 'expenseDate', 'status'],
      ['Expense ID', 'Category', 'Amount Paisa', 'Method', 'Description', 'Reference', 'Date', 'Status']
    )
  );

  // Inventory Movements CSV
  zip.file(
    'csv/inventory-movements.csv',
    convertToCSV(
      collections.inventoryMovements,
      ['movementId', 'productId', 'movementType', 'quantity', 'movementDate', 'referenceType', 'referenceId', 'reason'],
      ['Movement ID', 'Product ID', 'Type', 'Quantity', 'Date', 'Ref Type', 'Ref ID', 'Reason']
    )
  );

  // Recovery Visits CSV
  zip.file(
    'csv/recovery-visits.csv',
    convertToCSV(
      collections.recoveryVisits,
      ['visitId', 'customerId', 'contractId', 'employeeId', 'outcome', 'note', 'nextFollowUpAt', 'visitedAt'],
      ['Visit ID', 'Customer ID', 'Contract ID', 'Employee ID', 'Outcome', 'Note', 'Next Follow Up', 'Visited At']
    )
  );

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
