// ============================================================================
// Component: AI Supplier Receipt & Delivery Challan Scanner Modal
// Camera snap / file upload + Optical Extraction + Strict Verification Step
// ============================================================================

import React, { useState } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Plus,
  Trash2,
  ZoomIn,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import {
  AiReceiptScannerService,
  ScannedReceiptResult,
  ScannedReceiptItem,
  SAMPLE_SUPPLIER_INVOICES,
} from '@/services/aiReceiptScanner.service';
import { SupplierRepository } from '@/repositories/supplier.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { Supplier, Product, PurchaseItemSnapshot } from '@/types';
import { rupeesToPaisa } from '@/domain/money/paisa';

interface AiReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingSuppliers: Supplier[];
  existingProducts: Product[];
}

export const AiReceiptScannerModal: React.FC<AiReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingSuppliers,
  existingProducts,
}) => {
  const { language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState('');
  const [scannedResult, setScannedResult] = useState<ScannedReceiptResult | null>(null);

  // Editable Form fields during verification
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [items, setItems] = useState<ScannedReceiptItem[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Enlarged photo preview
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);

  if (!isOpen) return null;

  const handleStartScan = async (file: File) => {
    setScanning(true);
    setScanStage(language === 'ur' ? 'تصویر اپلوڈ اور سائز ایڈجسٹ کیا جا رہا ہے...' : 'Preprocessing image...');
    try {
      const result = await AiReceiptScannerService.scanReceipt(file, (stage) => setScanStage(stage));
      loadResultIntoForm(result);
    } catch (err: any) {
      alert(err?.message || 'Failed to scan receipt');
    } finally {
      setScanning(false);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    setScanning(true);
    setScanStage(language === 'ur' ? 'سیمپل انوائس لوڈ کی جا رہی ہے...' : 'Loading sample invoice...');
    setTimeout(() => {
      const result = AiReceiptScannerService.getSampleReceipt(sampleId);
      loadResultIntoForm(result);
      setScanning(false);
    }, 400);
  };

  const loadResultIntoForm = (result: ScannedReceiptResult) => {
    setScannedResult(result);
    setSupplierName(result.supplierName);
    setInvoiceNumber(result.invoiceNumber);
    setInvoiceDate(result.invoiceDate);
    setItems(result.items);
    setNotes(result.notes);
  };

  const handleItemChange = (index: number, field: keyof ScannedReceiptItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitCostRupees') {
      const qty = Number(field === 'quantity' ? value : item.quantity) || 0;
      const unit = Number(field === 'unitCostRupees' ? value : item.unitCostRupees) || 0;
      item.lineTotalRupees = qty * unit;
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productName: 'Dawlance Refrigerator / New Appliance',
        brand: 'Dawlance',
        quantity: 5,
        unitCostRupees: 65000,
        lineTotalRupees: 325000,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert(language === 'ur' ? 'کم از کم ایک آئٹم ہونا ضروری ہے' : 'At least one item is required');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCalculatedRupees = items.reduce((sum, item) => sum + (item.lineTotalRupees || 0), 0);

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || items.length === 0) return;

    setSaving(true);
    try {
      // 1. Find or create supplier
      const matchedSupplier = await SupplierRepository.findOrCreateSupplierByName(
        activeTenant.tenantId,
        supplierName || 'General Distributor',
        supplierName,
        currentUser.uid,
        isDemoUser
      );

      // 2. Find or create products and prepare purchase line items
      const purchaseItemsSnapshots: PurchaseItemSnapshot[] = [];
      for (const it of items) {
        const prod = await ProductRepository.findOrCreateProductByName(
          activeTenant.tenantId,
          {
            name: it.productName,
            brand: it.brand,
            costPriceRupees: it.unitCostRupees,
          },
          currentUser.uid,
          isDemoUser
        );

        purchaseItemsSnapshots.push({
          productId: prod.productId,
          productNameSnapshot: prod.name,
          modelSnapshot: prod.model || it.brand,
          quantity: it.quantity,
          unitCostPaisa: rupeesToPaisa(it.unitCostRupees),
          lineTotalPaisa: rupeesToPaisa(it.lineTotalRupees),
        });
      }

      // 3. Post purchase order & intake stock
      const totalPaisa = rupeesToPaisa(totalCalculatedRupees);
      await SupplierRepository.postPurchase(
        activeTenant.tenantId,
        {
          supplierId: matchedSupplier.supplierId,
          supplierNameSnapshot: matchedSupplier.name,
          purchaseDate: invoiceDate ? new Date(invoiceDate).toISOString() as any : new Date().toISOString() as any,
          referenceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
          items: purchaseItemsSnapshots,
          subtotalPaisa: totalPaisa,
          discountPaisa: 0,
          totalPaisa,
          paidPaisa: totalPaisa,
          balancePaisa: 0,
          status: 'posted',
          receiptImageUrl: scannedResult?.receiptImageUrl,
          notes: notes || 'AI Scanned & Verified Supplier Delivery',
        },
        currentUser.uid,
        isDemoUser
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to save purchase from receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 85 }} onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: '920px', width: '96%', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {language === 'ur'
                  ? 'AI سپلائر پرچی و انوائس سکینر (Smart OCR)'
                  : 'AI Supplier Receipt & Invoice Scanner'}
              </h3>
              <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0.125rem 0 0' }}>
                {language === 'ur'
                  ? 'رسید کی تصویر اپلوڈ کریں، سسٹم خودکار طریقے سے اشیاء اور تعداد انوینٹری میں درج کرے گا'
                  : 'Snap/upload invoice photo to auto-extract supplier items, brands & quantities into inventory'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-icon btn-outline btn-sm">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1rem 0' }}>
          {/* STEP 1: UPLOAD / CAMERA SNAP / SAMPLES SELECTOR */}
          {!scannedResult && !scanning && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  border: '2px dashed #0284c7',
                  borderRadius: '0.75rem',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  background: '#f0f9ff',
                }}
              >
                <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#e0f2fe', padding: '0.75rem', borderRadius: '50%', color: '#0284c7' }}>
                      <Camera size={32} />
                    </div>
                    <div style={{ background: '#e0f2fe', padding: '0.75rem', borderRadius: '50%', color: '#0369a1' }}>
                      <Upload size={32} />
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0c4a6e', marginBottom: '0.375rem' }}>
                    {language === 'ur' ? 'سپلائر کی رسید یا بلٹی کی تصویر کھینچیں' : 'Snap or Upload Supplier Invoice Photo'}
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: '#0369a1', marginBottom: '1.25rem' }}>
                    {language === 'ur'
                      ? 'موبائل کیمرہ سے رسید کی فوٹو لیں یا فائل منتخب کریں۔ AI خود بخود 10 AC، 5 فریج وغیرہ تلاش کر کے فارم تیار کرے گا۔'
                      : 'Take a camera snapshot of paper invoice or delivery challan. AI extracts brands, models and stock.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Camera size={16} />
                      <span>{language === 'ur' ? 'کیمرہ سے تصویر لیں' : 'Camera Snapshot'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => e.target.files?.[0] && handleStartScan(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Upload size={16} />
                      <span>{language === 'ur' ? 'گیلری سے فائل اپلوڈ کریں' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleStartScan(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Sample Invoices for Instant Demonstration */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Sparkles size={14} className="text-amber-500" />
                  <span>{language === 'ur' ? 'یا فوراً ٹیسٹ کرنے کے لیے تیار شدہ سیمپل انوائس منتخب کریں:' : 'Or test immediately with pre-loaded delivery samples:'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_SUPPLIER_INVOICES.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleLoadSample(sample.id)}
                      className="btn btn-outline"
                      style={{
                        padding: '0.625rem 0.75rem',
                        textAlign: language === 'ur' ? 'right' : 'left',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.2rem',
                        background: '#ffffff',
                      }}
                    >
                      <strong style={{ color: '#0f172a' }}>{sample.title}</strong>
                      <span className="text-muted" style={{ fontSize: '0.6875rem' }}>{sample.itemsSummary}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCANNING PROGRESS ANIMATION */}
          {scanning && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  border: '4px solid #e0f2fe',
                  borderTop: '4px solid #0284c7',
                  borderRadius: '50%',
                  margin: '0 auto 1.25rem',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.375rem' }}>
                {language === 'ur' ? 'رسید کا AI تجزیہ جاری ہے...' : 'AI Scanning in Progress...'}
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#0284c7', fontWeight: 600 }}>{scanStage}</p>
            </div>
          )}

          {/* STEP 2: STRICT VERIFICATION AND REVIEW FORM */}
          {scannedResult && !scanning && (
            <form onSubmit={handleConfirmAndSave}>
              {/* Caution Banner */}
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  fontSize: '0.8125rem',
                  color: '#92400e',
                }}
              >
                <ShieldCheck size={20} style={{ flexShrink: 0, color: '#d97706' }} />
                <div>
                  <strong>{language === 'ur' ? 'احتیاطی چیک و تصدیق لازمی ہے:' : 'Strict Verification Step:'}</strong>{' '}
                  {language === 'ur'
                    ? 'رسید کی فوٹو دیکھ کر اشیاء، تعداد (مثلاً 10 AC، 5 فریج) اور قیمت کی تسلی فرما لیں۔ تصدیق پر یہ اسٹاک لائیو انوینٹری میں درج ہو جائے گا۔'
                    : 'Verify extracted quantities and unit costs against the invoice image before committing to inventory.'}
                </div>
              </div>

              {/* 2-Column Responsive Layout: Photo on Left / Form on Right */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left: Receipt Photo Preview */}
                <div className="md:col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                      {language === 'ur' ? 'سپلائر کی اصلی رسید (Image Preview)' : 'Original Supplier Receipt'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPhotoZoomed(true)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.6875rem', padding: '0.15rem 0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <ZoomIn size={12} /> {language === 'ur' ? 'بڑی تصویر' : 'Zoom'}
                    </button>
                  </div>

                  <div
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      background: '#0f172a',
                      textAlign: 'center',
                      maxHeight: '380px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => setIsPhotoZoomed(true)}
                  >
                    <img
                      src={scannedResult.receiptImageUrl}
                      alt="Scanned Invoice"
                      style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setScannedResult(null)}
                    className="btn btn-outline btn-sm text-muted"
                    style={{ fontSize: '0.71875rem', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  >
                    <RefreshCw size={12} />
                    <span>{language === 'ur' ? 'دوسری تصویر سکین کریں' : 'Scan Another Receipt'}</span>
                  </button>
                </div>

                {/* Right: Extracted Editable Fields */}
                <div className="md:col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Supplier & Invoice metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>
                        {language === 'ur' ? 'سپلائر کا نام' : 'Supplier Name'}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        required
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>
                        {language === 'ur' ? 'انوائس / بلٹی نمبر' : 'Invoice / Challan #'}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        required
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>
                        {language === 'ur' ? 'خریداری تاریخ' : 'Receipt Date'}
                      </label>
                      <input
                        type="date"
                        className="form-input"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        required
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>

                  {/* Items Table */}
                  <div style={{ marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        {language === 'ur' ? 'رسید میں موجود اشیاء اور تعداد:' : 'Extracted Items & Quantities:'}
                      </span>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="btn btn-outline btn-sm text-primary"
                        style={{ fontSize: '0.6875rem', padding: '0.15rem 0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Plus size={11} /> {language === 'ur' ? 'نیا آئٹم جوڑیں' : 'Add Item'}
                      </button>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflowX: 'auto', background: '#fff' }}>
                      <table className="table" style={{ width: '100%', fontSize: '0.78125rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: language === 'ur' ? 'right' : 'left' }}>
                            <th style={{ padding: '0.4rem 0.5rem' }}>{language === 'ur' ? 'پروڈکٹ کا نام' : 'Product'}</th>
                            <th style={{ padding: '0.4rem 0.5rem' }}>{language === 'ur' ? 'کمپنی / برانڈ' : 'Brand'}</th>
                            <th style={{ padding: '0.4rem 0.5rem', width: '70px', textAlign: 'center' }}>{language === 'ur' ? 'تعداد' : 'Qty'}</th>
                            <th style={{ padding: '0.4rem 0.5rem', width: '95px' }}>{language === 'ur' ? 'فی لاگت' : 'Unit Cost'}</th>
                            <th style={{ padding: '0.4rem 0.5rem', width: '95px', textAlign: 'right' }}>{language === 'ur' ? 'ٹوٹل' : 'Total'}</th>
                            <th style={{ padding: '0.4rem 0.5rem', width: '35px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.35rem 0.5rem' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                                  value={item.productName}
                                  onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                                  required
                                />
                              </td>
                              <td style={{ padding: '0.35rem 0.5rem' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                                  value={item.brand}
                                  onChange={(e) => handleItemChange(idx, 'brand', e.target.value)}
                                  required
                                />
                              </td>
                              <td style={{ padding: '0.35rem 0.5rem' }}>
                                <input
                                  type="number"
                                  min="1"
                                  className="form-input"
                                  style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', textAlign: 'center', fontWeight: 700 }}
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                  required
                                />
                              </td>
                              <td style={{ padding: '0.35rem 0.5rem' }}>
                                <input
                                  type="number"
                                  min="0"
                                  className="form-input"
                                  style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                                  value={item.unitCostRupees}
                                  onChange={(e) => handleItemChange(idx, 'unitCostRupees', e.target.value)}
                                  required
                                />
                              </td>
                              <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                Rs. {(item.lineTotalRupees || 0).toLocaleString()}
                              </td>
                              <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="btn btn-icon btn-sm text-danger"
                                  style={{ padding: '0.2rem' }}
                                  title="Delete item"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total summary bar */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
                      {language === 'ur' ? 'کل خریدی گئی اشیاء کی تعداد:' : 'Total Units:'}{' '}
                      <strong>{items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)}</strong>
                    </span>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '0.5rem' }}>
                        {language === 'ur' ? 'کل انوائس رقم:' : 'Total Amount:'}
                      </span>
                      <strong style={{ fontSize: '1.125rem', color: '#15803d' }}>
                        Rs. {totalCalculatedRupees.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.71875rem' }}>
                      {language === 'ur' ? 'اضافی نوٹس / بلٹی ریمارکس' : 'Remarks / Bilty Details'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Delivered via Daewoo Cargo to Main Showroom"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer with Confirmation Button */}
              <div
                className="modal-footer"
                style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '0.875rem',
                  marginTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  {language === 'ur' ? 'کینسل کریں' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || items.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {saving
                      ? (language === 'ur' ? 'اسٹاک درج ہو رہا ہے...' : 'Recording stock...')
                      : (language === 'ur' ? 'تصدیق کریں اور انوینٹری میں اسٹاک شامل کریں' : 'Confirm & Add Stock to Inventory')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Enlarged High-Resolution Photo Zoom Modal */}
      {isPhotoZoomed && scannedResult && (
        <div
          className="modal-overlay"
          style={{ zIndex: 90 }}
          onClick={() => setIsPhotoZoomed(false)}
        >
          <div
            className="modal-box"
            style={{ maxWidth: '780px', width: '95%', backgroundColor: '#0f172a', color: '#fff', padding: '1rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                  {supplierName} — {invoiceNumber}
                </h4>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Original Delivery Receipt Image</div>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoZoomed(false)}
                className="btn btn-icon btn-outline btn-sm text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', backgroundColor: '#000', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <img
                src={scannedResult.receiptImageUrl}
                alt="Enlarged Invoice"
                style={{ width: '100%', maxHeight: '650px', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
