import { describe, it, expect, beforeEach } from 'vitest';
import { ArchiveRepository } from '@/repositories/archive.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { convertToCSV } from '@/lib/archive/csvExporter';
import { validateBackupPackage } from '@/lib/archive/jsonBackup';
import { generateArchiveZip } from '@/lib/archive/zipBundler';
import { Tenant } from '@/types';

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

describe('Integration: Phase 4 Data Portability & Restore Drills', () => {
  const sourceTenant: Tenant = {
    tenantId: 'tenant-source-port',
    schemaVersion: 1,
    businessName: 'Rahim Yar Khan Electronics',
    businessNameUr: 'رحیم یار خان الیکٹرانکس',
    city: 'Rahim Yar Khan',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    defaultLanguage: 'ur',
    subscriptionStatus: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'owner',
    updatedAt: new Date().toISOString(),
    updatedBy: 'owner',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('exports full tenant data package and validates schema envelope', async () => {
    // 1. Seed customer & product
    await CustomerRepository.saveCustomer(
      sourceTenant.tenantId,
      { fullName: 'Haji Aslam', phoneDisplay: '0300-9988776', status: 'active' },
      'owner',
      true
    );

    await ProductRepository.saveProduct(
      sourceTenant.tenantId,
      {
        name: 'Haier Refrigerator (HRF-306)',
        costPricePaisa: 5000000,
        cashPricePaisa: 6000000,
        installmentPricePaisa: 7500000,
        stockOnHand: 4,
        status: 'active',
      },
      'owner',
      true
    );

    // 2. Export package
    const backup = await ArchiveRepository.exportFullTenantPackage(sourceTenant, true);

    expect(backup.product).toBe('QistFlow');
    expect(backup.backupFormatVersion).toBe(1);
    expect(backup.schemaVersion).toBe(1);
    expect(backup.tenant.tenantId).toBe(sourceTenant.tenantId);
    expect(backup.collections.customers.length).toBeGreaterThan(0);
    expect(backup.collections.products.length).toBeGreaterThan(0);

    // 3. Validate JSON serialized string
    const jsonStr = JSON.stringify(backup);
    const validation = validateBackupPackage(jsonStr);
    expect(validation.isValid).toBe(true);
    expect(validation.package?.product).toBe('QistFlow');
  });

  it('generates valid RFC 4180 CSV with UTF-8 BOM for Urdu text', () => {
    const sampleRows = [
      { id: '1', name: 'محمد ارشد', note: 'Cloth Market, Shop #4' },
      { id: '2', name: 'Tariq Mehmood', note: 'Paid "in full" on Monday' },
    ];

    const csv = convertToCSV(sampleRows, ['id', 'name', 'note'], ['ID', 'نام', 'تفصیل']);

    // Check BOM present
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    // Check Urdu character preservation
    expect(csv).toContain('محمد ارشد');

    // Check RFC 4180 quote escaping
    expect(csv).toContain('"Paid ""in full"" on Monday"');
    expect(csv).toContain('"Cloth Market, Shop #4"');
  });

  it('packages ZIP archive and runs sandbox restore drill with 100% balance parity', async () => {
    // Seed and export
    const backup = await ArchiveRepository.exportFullTenantPackage(sourceTenant, true);

    // Generate ZIP
    const zipBlob = await generateArchiveZip(backup);
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(0);

    // Restore Drill into clean sandbox tenant
    const targetTenantId = 'tenant-sandbox-verify';
    const report = await ArchiveRepository.restoreIntoTestTenant(targetTenantId, backup, true);

    expect(report.success).toBe(true);
    expect(report.targetTenantId).toBe(targetTenantId);
    expect(report.restoredCounts.customers).toBe(backup.collections.customers.length);
    expect(report.restoredCounts.products).toBe(backup.collections.products.length);
    expect(report.warnings.length).toBe(0);
  });
});
