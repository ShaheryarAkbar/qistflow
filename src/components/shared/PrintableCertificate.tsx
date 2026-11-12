// ============================================================================
// Shared Component: Debt-Free Clearance Certificate
// Formal Bilingual Certificate (Urdu & English) with Authorized Signatures
// Invariant: Displayed only when reconciled balance is 0.00 PKR.
// ============================================================================

import React from 'react';
import { Award, Printer, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { Customer, Contract, ClearanceCertificate } from '@/types';
import { MoneyDisplay } from './MoneyDisplay';

interface PrintableCertificateProps {
  certificate: ClearanceCertificate;
  contract: Contract;
  customer?: Customer;
  onClose: () => void;
}

export const PrintableCertificate: React.FC<PrintableCertificateProps> = ({
  certificate,
  contract,
  customer,
  onClose,
}) => {
  const { language } = useI18n();
  const { activeTenant } = useTenant();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-box" style={{ maxWidth: '680px', backgroundColor: '#ffffff' }}>
        <div className="modal-header" style={{ padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontWeight: 600 }}>
            <Award size={18} />
            <span>{language === 'ur' ? 'سرکاری بے باقی و کلیئرنس سرٹیفکیٹ' : 'Final Clearance Certificate'}</span>
          </div>
          <button onClick={onClose} className="btn btn-icon btn-outline">
            <X size={16} />
          </button>
        </div>

        {/* Certificate Printable Area */}
        <div id="certificate-print-area" style={{ padding: '2rem', backgroundColor: '#fff', border: '8px double #047857', margin: '1rem', borderRadius: '0.5rem' }}>
          {/* Shop Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #047857', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#064e3b' }}>
              {language === 'ur' && activeTenant?.businessNameUr
                ? activeTenant.businessNameUr
                : activeTenant?.businessName || 'QistFlow Installments'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#334155', marginTop: '0.25rem' }}>
              {activeTenant?.address || activeTenant?.city || 'Rahim Yar Khan, Pakistan'}
            </div>
            {activeTenant?.phone && (
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Helpline: {activeTenant.phone}
              </div>
            )}
            <div style={{ display: 'inline-block', backgroundColor: '#ecfdf5', color: '#065f46', padding: '0.25rem 1rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.875rem', marginTop: '0.75rem', border: '1px solid #a7f3d0' }}>
              DEBT-FREE CLEARANCE CERTIFICATE / بے باقی سرٹیفکیٹ
            </div>
          </div>

          {/* Certificate Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
            <div><strong>Cert #:</strong> {certificate.certificateNumber}</div>
            <div><strong>Date of Issue:</strong> {String(certificate.issuedAt).split('T')[0]}</div>
          </div>

          {/* Customer & Contract Particulars */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div>
                <span className="text-muted">Customer Name:</span>
                <div className="font-bold">{customer?.fullName || '—'}</div>
              </div>
              <div>
                <span className="text-muted">CNIC:</span>
                <div className="font-semibold">{customer?.cnic || '—'}</div>
              </div>
              <div>
                <span className="text-muted">Mobile Phone:</span>
                <div>{customer?.phoneDisplay || '—'}</div>
              </div>
              <div>
                <span className="text-muted">Contract Ref:</span>
                <div className="font-semibold">{contract.contractCode}</div>
              </div>
            </div>

            {customer?.address && (
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', fontSize: '0.8125rem' }}>
                <span className="text-muted">Address:</span> {customer.address} ({customer.area}, {customer.city})
              </div>
            )}
          </div>

          {/* Purchased Items List */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
              Purchased Items / فروخت شدہ اشیاء:
            </div>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '0.375rem', overflow: 'hidden' }}>
              {contract.itemsSnapshot?.map((item, idx) => (
                <div key={idx} style={{ padding: '0.5rem 0.75rem', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span>{item.quantity}x {item.productNameSnapshot} {item.modelSnapshot ? `(${item.modelSnapshot})` : ''}</span>
                  <span className="font-semibold"><MoneyDisplay paisa={item.lineTotalPaisa} /></span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Settlement Confirmation */}
          <div style={{ border: '2px solid #059669', borderRadius: '0.5rem', padding: '1rem', backgroundColor: '#f0fdf4', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Total Agreement</div>
                <MoneyDisplay paisa={contract.installmentPriceTotalPaisa} className="font-bold" style={{ fontSize: '1.125rem' }} />
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Total Amount Received</div>
                <MoneyDisplay paisa={certificate.totalReceivedPaisa || contract.installmentPriceTotalPaisa} className="font-bold text-success" style={{ fontSize: '1.125rem' }} />
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#065f46' }}>REMAINING BALANCE</div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                  Rs. 0.00 (NIL)
                </span>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#065f46', fontWeight: 600 }}>
              تصدیق کی جاتی ہے کہ مذکورہ گاہک نے تمام اقساط اور واجبات مکمل طور پر ادا کر دیے ہیں۔ اب اس معاہدے کی مد میں کوئی رقم واجب الادا نہیں ہے۔
            </div>
          </div>

          {/* Signature & Seal Lines */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2.5rem', paddingTop: '1rem', fontSize: '0.8125rem' }}>
            <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #64748b', paddingTop: '0.375rem' }}>
              <div>دستخط گاہک / Customer</div>
            </div>

            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px dashed #047857', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857', fontSize: '0.625rem', fontWeight: 700, textAlign: 'center', transform: 'rotate(-10deg)' }}>
              OFFICIAL<br />SEAL
            </div>

            <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #64748b', paddingTop: '0.375rem' }}>
              <div>دستخط و مہر دکان دار / Manager</div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '0.75rem 1rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} />
            <span>Print Official Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};

