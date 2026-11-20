// ============================================================================
// Component: Supplier Receipts & Invoices Archive Gallery
// Browse past & current scanned receipts with full-screen slide modal
// ============================================================================

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Calendar,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Package,
  Layers,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Purchase, Supplier } from '@/types';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';

interface ReceiptArchiveGalleryProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  onOpenScanner: () => void;
}

export const ReceiptArchiveGallery: React.FC<ReceiptArchiveGalleryProps> = ({
  purchases,
  suppliers,
  onOpenScanner,
}) => {
  const { language } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(null);

  // Filter purchases that have receipt images or purchase records
  const receiptPurchases = purchases.filter((p) => {
    const sTerm = searchTerm.toLowerCase();
    const supName =
      p.supplierNameSnapshot ||
      suppliers.find((s) => s.supplierId === p.supplierId)?.name ||
      '';
    const matchesSearch =
      !searchTerm ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(sTerm)) ||
      supName.toLowerCase().includes(sTerm) ||
      p.items?.some((it) => it.productNameSnapshot.toLowerCase().includes(sTerm));
    return matchesSearch;
  });

  const activeSlidePurchase =
    selectedSlideIndex !== null && selectedSlideIndex >= 0 && selectedSlideIndex < receiptPurchases.length
      ? receiptPurchases[selectedSlideIndex]
      : null;

  const handleNextSlide = () => {
    if (selectedSlideIndex !== null && selectedSlideIndex < receiptPurchases.length - 1) {
      setSelectedSlideIndex(selectedSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (selectedSlideIndex !== null && selectedSlideIndex > 0) {
      setSelectedSlideIndex(selectedSlideIndex - 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controls Bar */}
      <div
        className="card"
        style={{
          padding: '1rem',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px' }}>
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="form-input"
            placeholder={
              language === 'ur'
                ? 'رسید نمبر، سپلائر (Haier، Dawlance) یا آئٹم تلاش کریں...'
                : 'Search receipt by invoice #, supplier or item (Haier, Fridge, AC)...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', fontSize: '0.8125rem' }}
          />
        </div>

        <button
          type="button"
          onClick={onOpenScanner}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}
        >
          <Camera size={14} />
          <Sparkles size={13} className="text-amber-300" />
          <span>{language === 'ur' ? 'نئی رسید سکین کریں' : 'Scan New Receipt'}</span>
        </button>
      </div>

      {/* Receipts Grid */}
      {receiptPurchases.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem 1rem', border: '1px dashed #cbd5e1' }}>
          <FileText size={48} className="text-muted" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
            {language === 'ur' ? 'کوئی رسید دستیاب نہیں ہے' : 'No supplier receipts found'}
          </h4>
          <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            {language === 'ur'
              ? 'سپلائر سے سامان وصول کرتے وقت رسید کی تصویر کھینچیں، وہ خود بخود یہاں محفوظ ہو جائے گی۔'
              : 'Scan and intake stock receipts using the AI scanner above.'}
          </p>
          <button
            type="button"
            onClick={onOpenScanner}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', margin: '0 auto' }}
          >
            <Camera size={14} />
            <span>{language === 'ur' ? 'ابھی پہلی رسید سکین کریں' : 'Scan First Receipt Now'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {receiptPurchases.map((purchase, idx) => {
            const supName =
              purchase.supplierNameSnapshot ||
              suppliers.find((s) => s.supplierId === purchase.supplierId)?.name ||
              'Distributor';

            const totalUnits = purchase.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;

            return (
              <div
                key={purchase.referenceNumber || idx}
                className="card"
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  background: '#ffffff',
                }}
              >
                {/* Visual Image Preview */}
                <div
                  style={{
                    height: '180px',
                    background: '#f8fafc',
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                  onClick={() => setSelectedSlideIndex(idx)}
                >
                  {purchase.receiptImageUrl ? (
                    <img
                      src={purchase.receiptImageUrl}
                      alt="Receipt"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <FileText size={42} style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '0.75rem' }}>{purchase.referenceNumber}</div>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                      ✓ {language === 'ur' ? 'انوینٹری شامل' : 'Stock Verified'}
                    </span>
                  </div>

                  <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
                    <span
                      style={{
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#fff',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.6875rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <ZoomIn size={12} /> {language === 'ur' ? 'بڑا کریں' : 'Zoom'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                        {supName}
                      </h4>
                      <div style={{ fontSize: '0.71875rem', color: '#0284c7', fontWeight: 600 }}>
                        {purchase.referenceNumber || 'Invoice'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.6875rem', color: '#64748b' }}>
                      <Calendar size={11} style={{ display: 'inline', marginRight: '0.2rem' }} />
                      {typeof purchase.purchaseDate === 'string'
                        ? purchase.purchaseDate.split('T')[0]
                        : 'Recent'}
                    </div>
                  </div>

                  {/* Itemized summary */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.625rem', borderRadius: '0.375rem', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      {language === 'ur' ? 'وصول شدہ اشیاء:' : 'Received Items:'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#1e293b' }}>
                      {purchase.items?.slice(0, 3).map((it, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                            {it.productNameSnapshot}
                          </span>
                          <strong style={{ color: '#0284c7' }}>{it.quantity}x</strong>
                        </div>
                      ))}
                      {(purchase.items?.length || 0) > 3 && (
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                          +{(purchase.items?.length || 0) - 3} {language === 'ur' ? 'مزید آئٹمز' : 'more items'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Footer with Total */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.6875rem' }}>
                        {totalUnits} {language === 'ur' ? 'یونٹس' : 'units'}
                      </span>
                    </div>
                    <div>
                      <MoneyDisplay paisa={purchase.totalPaisa} className="font-bold text-success" style={{ fontSize: '1rem' }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSlideIndex(idx)}
                    className="btn btn-outline btn-sm"
                    style={{
                      width: '100%',
                      marginTop: '0.25rem',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <ZoomIn size={13} />
                    <span>{language === 'ur' ? 'رسید کی فل سکرین تصویر دیکھیں' : 'View Full Image Slide'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL-SCREEN SLIDE / MODAL VIEWER */}
      {activeSlidePurchase && selectedSlideIndex !== null && (
        <div
          className="modal-overlay"
          style={{ zIndex: 95, padding: '14px' }}
          onClick={() => setSelectedSlideIndex(null)}
        >
          <div
            className="modal-box"
            style={{
              maxWidth: '880px',
              width: '100%',
              maxHeight: 'calc(100dvh - 28px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              margin: 'auto',
              background: '#0f172a',
              color: '#fff',
              padding: '1.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Slide Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#f8fafc' }}>
                    {activeSlidePurchase.supplierNameSnapshot || 'Supplier Receipt'} — {activeSlidePurchase.referenceNumber}
                  </h4>
                  <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                    {selectedSlideIndex + 1} of {receiptPurchases.length}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {language === 'ur' ? 'خریداری تاریخ:' : 'Date:'}{' '}
                  {typeof activeSlidePurchase.purchaseDate === 'string'
                    ? activeSlidePurchase.purchaseDate.split('T')[0]
                    : 'Recent'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  disabled={selectedSlideIndex === 0}
                  className="btn btn-outline btn-sm text-white"
                  title="Previous Receipt"
                  style={{ opacity: selectedSlideIndex === 0 ? 0.3 : 1 }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  disabled={selectedSlideIndex === receiptPurchases.length - 1}
                  className="btn btn-outline btn-sm text-white"
                  title="Next Receipt"
                  style={{ opacity: selectedSlideIndex === receiptPurchases.length - 1 ? 0.3 : 1 }}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlideIndex(null)}
                  className="btn btn-icon btn-outline btn-sm text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Slide Image with Pinch/Fit */}
            <div
              style={{
                backgroundColor: '#000',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                textAlign: 'center',
                marginBottom: '1rem',
                border: '1px solid #1e293b',
              }}
            >
              {activeSlidePurchase.receiptImageUrl ? (
                <img
                  src={activeSlidePurchase.receiptImageUrl}
                  alt="High Resolution Receipt"
                  style={{ width: '100%', maxHeight: '520px', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ padding: '3rem', color: '#64748b' }}>
                  <FileText size={64} style={{ margin: '0 auto 1rem' }} />
                  <div>No image attached to this invoice</div>
                </div>
              )}
            </div>

            {/* Slide Itemized Details Table */}
            <div style={{ background: '#1e293b', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc' }}>
                  {language === 'ur' ? 'انوائس میں شامل پروڈکٹس اور اسٹاک:' : 'Products Intake from this Receipt:'}
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#4ade80' }}>
                  <MoneyDisplay paisa={activeSlidePurchase.totalPaisa} />
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.75rem' }}>
                {activeSlidePurchase.items?.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.35rem 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <span>{it.productNameSnapshot}</span>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span className="badge badge-primary">{it.quantity} Units</span>
                      <strong style={{ color: '#e2e8f0' }}>
                        <MoneyDisplay paisa={it.lineTotalPaisa} />
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
