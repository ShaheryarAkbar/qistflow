// ============================================================================
// Archives Feature: Data Portability, Backups & Safe Restore Drills
// ============================================================================

import React, { useState } from 'react';
import {
  DownloadCloud,
  FileArchive,
  FileSpreadsheet,
  FileJson,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { ArchiveRepository, RestoreReport } from '@/repositories/archive.repository';
import { generateArchiveZip } from '@/lib/archive/zipBundler';
import { validateBackupPackage } from '@/lib/archive/jsonBackup';
import { downloadBlob, convertToCSV } from '@/lib/archive/csvExporter';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';

export const ArchivesPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { isDemoUser } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Restore Drill state
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreReport, setRestoreReport] = useState<RestoreReport | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleExportZip = async () => {
    if (!activeTenant) return;
    setExporting(true);
    setExportSuccess(null);
    try {
      const backupPackage = await ArchiveRepository.exportFullTenantPackage(activeTenant, isDemoUser);
      const zipBlob = await generateArchiveZip(backupPackage);
      const safeName = (activeTenant.businessName || 'QistFlow').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `QistFlow_${safeName}_all_time_${new Date().toISOString().split('T')[0]}.zip`;

      downloadBlob(zipBlob, fileName, 'application/zip');
      setExportSuccess(`Complete ZIP Archive downloaded: ${fileName}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate archive');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    if (!activeTenant) return;
    setExporting(true);
    setExportSuccess(null);
    try {
      const backupPackage = await ArchiveRepository.exportFullTenantPackage(activeTenant, isDemoUser);
      const jsonStr = JSON.stringify(backupPackage, null, 2);
      const fileName = `qistflow-backup-v1_${new Date().toISOString().split('T')[0]}.json`;

      downloadBlob(jsonStr, fileName, 'application/json');
      setExportSuccess(`Full Database JSON downloaded: ${fileName}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to export JSON');
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);
    setRestoreError(null);
    setRestoreReport(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreFileContent(content);
    };
    reader.readAsText(file);
  };

  const handleRunRestoreDrill = async () => {
    if (!restoreFileContent) return;

    setRestoring(true);
    setRestoreError(null);
    try {
      const validation = validateBackupPackage(restoreFileContent);
      if (!validation.isValid || !validation.package) {
        setRestoreError(validation.error || 'Invalid backup structure.');
        setRestoring(false);
        return;
      }

      // Safe Sandbox Test Tenant
      const testTenantId = `tenant_test_drill_${Date.now()}`;
      const report = await ArchiveRepository.restoreIntoTestTenant(
        testTenantId,
        validation.package,
        isDemoUser
      );

      setRestoreReport(report);
    } catch (err: any) {
      setRestoreError(err?.message || 'Failed to complete restore drill.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.archives')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'ڈیٹا کی مکمل خود مختاری، آف لائن بیک اپ، اور محفوظ ریسٹور ٹیسٹ'
              : 'Zero vendor lock-in: Full database JSON backups, RFC 4180 CSV exports and restore drills.'}
          </p>
        </div>
      </div>

      {/* Backup Reminder Banner */}
      <div className="alert alert-success mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={24} className="text-success" />
          <div>
            <div className="font-semibold" style={{ fontSize: '0.9375rem' }}>
              {language === 'ur' ? 'آپ کے ڈیٹا پر آپ کی مکمل ملکیت' : 'Complete Data Portability Guaranteed'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#166534' }}>
              {language === 'ur'
                ? 'کسی بھی وقت اپنی دکان کا مکمل بیک اپ اپنے کمپیوٹر پر محفوظ کر سکتے ہیں۔'
                : 'Download all contracts, customers, and payments at any time with no fees.'}
            </div>
          </div>
        </div>

        <button
          onClick={handleExportZip}
          className="btn btn-primary btn-sm"
          disabled={exporting}
        >
          <FileArchive size={14} />
          <span>{exporting ? 'Packing...' : '1-Click All-Time ZIP'}</span>
        </button>
      </div>

      {exportSuccess && (
        <div className="alert alert-success mb-6">
          <CheckCircle2 size={18} />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Full ZIP Package */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileArchive size={20} className="text-primary" />
              <h3 className="card-title">All-Time ZIP Archive</h3>
            </div>
          </div>
          <div className="card-body">
            <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
              {language === 'ur'
                ? 'مکمل دکان کا پیکیج مع مینی فیسٹ، فل JSON فائل، اور تمام کلیکشنز کی انفرادی ایکسل CSVs۔'
                : 'Contains manifest.json, full qistflow-backup-v1.json, and individual RFC 4180 CSVs for Excel.'}
            </p>

            <button
              onClick={handleExportZip}
              className="btn btn-primary btn-block"
              disabled={exporting}
            >
              <DownloadCloud size={16} />
              <span>{exporting ? t('common.loading') : 'Download Complete ZIP Archive'}</span>
            </button>
          </div>
        </div>

        {/* Database JSON Backup */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileJson size={20} className="text-primary" />
              <h3 className="card-title">Versioned JSON Database Backup</h3>
            </div>
          </div>
          <div className="card-body">
            <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
              {language === 'ur'
                ? 'اصلی آئی ڈیز اور تعلقات کے ساتھ مشین کے پڑھنے کے قابل مکمل ورژن ۱ بیک اپ۔'
                : 'Raw portable JSON schema preserving exact document IDs, foreign references, and ledger events.'}
            </p>

            <button
              onClick={handleExportJson}
              className="btn btn-secondary btn-block"
              disabled={exporting}
            >
              <DownloadCloud size={16} />
              <span>{exporting ? t('common.loading') : 'Download qistflow-backup-v1.json'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safe Restore Drill Section */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} className="text-primary" />
            <h3 className="card-title">Safe Restore Drill & Verification</h3>
          </div>
          <span className="badge badge-info">Sandbox Safety Drill</span>
        </div>
        <div className="card-body">
          <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'کسی بھی بیک اپ JSON فائل کو اپ لوڈ کر کے اس کے بیلنسز اور کھاتوں کی تصدیق کریں۔ یہ آپ کے لائیو ڈیٹا کو اوور رائٹ نہیں کرتا بلکہ محفوظ سینڈ باکس میں ٹیسٹ کرتا ہے۔'
              : 'Verify your backup integrity by importing into an isolated sandbox test tenant. Live shop records are never overwritten silently.'}
          </p>

          <div style={{ border: '2px dashed #cbd5e1', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '1.25rem' }}>
            <input
              type="file"
              accept=".json"
              id="backup-file-input"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label htmlFor="backup-file-input" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <UploadCloud size={16} />
              <span>{restoreFileName ? restoreFileName : 'Select Backup JSON File'}</span>
            </label>
            {restoreFileName && (
              <div style={{ fontSize: '0.8125rem', color: '#16a34a', marginTop: '0.5rem', fontWeight: 600 }}>
                File ready: {restoreFileName}
              </div>
            )}
          </div>

          {restoreError && (
            <div className="alert alert-danger mb-4">
              <AlertTriangle size={18} />
              <span>{restoreError}</span>
            </div>
          )}

          <button
            onClick={handleRunRestoreDrill}
            className="btn btn-primary"
            disabled={!restoreFileContent || restoring}
          >
            <RefreshCw size={16} className={restoring ? 'animate-spin' : ''} />
            <span>{restoring ? 'Validating & Reconciling...' : 'Run Safe Restore Drill'}</span>
          </button>

          {/* Post-Restore Verification Report */}
          {restoreReport && (
            <div style={{ marginTop: '1.5rem', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem', backgroundColor: '#f0fdf4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700, marginBottom: '0.75rem' }}>
                <CheckCircle2 size={20} />
                <span>Restore Verification Passed (Sandbox Tenant: {restoreReport.targetTenantId})</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4" style={{ fontSize: '0.8125rem' }}>
                <div style={{ backgroundColor: '#fff', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                  <div className="text-muted">Customers</div>
                  <div className="font-bold">{restoreReport.restoredCounts.customers}</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                  <div className="text-muted">Products</div>
                  <div className="font-bold">{restoreReport.restoredCounts.products}</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                  <div className="text-muted">Contracts</div>
                  <div className="font-bold">{restoreReport.restoredCounts.contracts}</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                  <div className="text-muted">Payments</div>
                  <div className="font-bold">{restoreReport.restoredCounts.payments}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem' }}>
                <div><strong>Reconciled Outstanding:</strong> <MoneyDisplay paisa={restoreReport.reconciledBalances.totalOutstandingPaisa} /></div>
                <div><strong>Total Stock On Hand:</strong> {restoreReport.reconciledBalances.totalStockOnHand} units</div>
              </div>

              {restoreReport.warnings.length > 0 && (
                <div style={{ marginTop: '0.75rem', color: '#b45309', fontSize: '0.8125rem' }}>
                  <strong>Warnings:</strong> {restoreReport.warnings.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

