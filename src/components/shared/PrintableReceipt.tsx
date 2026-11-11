// ============================================================================
// Shared Component: Printable Receipt (Thermal 80mm / A4)
// ============================================================================

import React from 'react';
import { Printer, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { MoneyDisplay } from './MoneyDisplay';

interface PrintableReceiptProps {
  receiptNumber: string;
  customerName: string;
  customerPhone?: string;
  contractCode?: string;
  amountPaisa: number;
  remainingBalancePaisa?: number;
  paymentMethod: string;
  date: string;
  receivedBy: string;
  onClose: () => void;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  receiptNumber,
  customerName,
  customerPhone,
  contractCode,
  amountPaisa,
  remainingBalancePaisa,
  paymentMethod,
  date,
  receivedBy,
  onClose,
}) => {
  const { language } = useI18n();
  const { activeTenant } = useTenant();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-box" style={{ maxWidth: '420px', backgroundColor: '#ffffff' }}>
        <div className="modal-header" style={{ padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {language === 'ur' ? 'رسید برائے وصولی قسط' : 'Official Payment Receipt'}
          </span>
          <button onClick={onClose} className="btn btn-icon btn-outline">
            <X size={16} />
          </button>
        </div>

        {/* Printable Area */}
        <div id="receipt-print-area" style={{ padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
          {/* Shop Header */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #94a3b8', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'sans-serif' }}>
              {language === 'ur' && activeTenant?.businessNameUr
                ? activeTenant.businessNameUr
                : activeTenant?.businessName || 'QistFlow Shop'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {activeTenant?.address || activeTenant?.city || 'Rahim Yar Khan'}
            </div>
            {activeTenant?.phone && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Helpline: {activeTenant.phone}
              </div>
            )}
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.25rem' }}>
              {receiptNumber}
            </div>
          </div>

          {/* Receipt Meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Date & Time:</span>
              <span>{date.split('T')[0]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Customer:</span>
              <span style={{ fontWeight: 600 }}>{customerName}</span>
            </div>
            {customerPhone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mobile:</span>
                <span>{customerPhone}</span>
              </div>
            )}
            {contractCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Contract #:</span>
                <span>{contractCode}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Method:</span>
              <span>{paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div style={{ borderTop: '1px dashed #94a3b8', borderBottom: '1px dashed #94a3b8', padding: '0.75rem 0', margin: '0.75rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700 }}>
              <span>AMOUNT RECEIVED:</span>
              <MoneyDisplay paisa={amountPaisa} />
            </div>

            {remainingBalancePaisa !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.375rem', color: '#475569' }}>
                <span>Remaining Balance:</span>
                <MoneyDisplay paisa={remainingBalancePaisa} className="font-semibold" />
              </div>
            )}
          </div>

          {/* Footer & Signatures */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: '#64748b' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              شکریہ! بروقت قسط ادائیگی پر ہم آپ کے مشکور ہیں۔
            </div>

            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>دستخط وصول کنندہ</span>
              <span>{receivedBy}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '0.75rem 1rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} />
            <span>Print Thermal / A4</span>
          </button>
        </div>
      </div>
    </div>
  );
};
