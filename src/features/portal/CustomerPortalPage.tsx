// ============================================================================
// Customer Portal Feature (PRD Section 4.6 & 14 - Explicitly Deferred / Future)
// Interactive simulation of customer passbook, schedule, receipts & clearance
// ============================================================================

import React, { useState } from 'react';
import {
  Smartphone,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';

export const CustomerPortalPage: React.FC = () => {
  const { t, language } = useI18n();

  const [phoneLookup, setPhoneLookup] = useState('0301-7654321');
  const [passbookCode, setPassbookCode] = useState('PB-2026-9901');
  const [searched, setSearched] = useState(true);

  // Sample customer contract passbook for preview
  const samplePassbook = {
    customerName: 'Muhammad Arshad (محمد ارشد)',
    phone: '0301-7654321',
    shopName: 'Malik Electronics & Installments, Rahim Yar Khan',
    contractCode: 'CTR-2026-001',
    productName: 'Super Asia Washing Machine (SA-240)',
    agreedPricePaisa: 4800000, // Rs. 48,000
    advancePaisa: 1200000,      // Rs. 12,000
    totalPaidPaisa: 1700000,    // Rs. 17,000
    remainingPaisa: 3100000,    // Rs. 31,000
    monthlyDuePaisa: 600000,    // Rs. 6,000
    nextDueDate: '2026-12-10',
    schedule: [
      { seq: 1, dueDate: '2026-11-10', amountPaisa: 600000, status: 'paid', paidDate: '2026-11-09' },
      { seq: 2, dueDate: '2026-12-10', amountPaisa: 600000, status: 'due', paidDate: null },
      { seq: 3, dueDate: '2027-01-10', amountPaisa: 600000, status: 'upcoming', paidDate: null },
      { seq: 4, dueDate: '2027-02-10', amountPaisa: 600000, status: 'upcoming', paidDate: null },
      { seq: 5, dueDate: '2027-03-10', amountPaisa: 600000, status: 'upcoming', paidDate: null },
      { seq: 6, dueDate: '2027-04-10', amountPaisa: 600000, status: 'upcoming', paidDate: null },
    ],
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Roadmap Notice Badge */}
      <div className="alert alert-warning mb-6">
        <Lock size={18} />
        <div>
          <div style={{ fontWeight: 700 }}>
            {language === 'ur'
              ? 'کسٹمر پورٹل — زیرِ تکمیل فیچر (PRD سیکشن 4.6 اور 14)'
              : 'Customer Portal — Explicitly Deferred / Future Roadmap (PRD Section 4.6 & 14)'}
          </div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            {language === 'ur'
              ? 'یہ ماڈیول کسٹمرز کے لیے ڈیجیٹل پاس بک اور اقساط کی صورتحال دیکھنے کے لیے اگلی فیز میں ریلیز ہوگا۔ نیچے اس کا لائیو انٹرایکٹو پری ویو دکھایا گیا ہے۔'
              : 'This interface allows customers to view their installment passbook, payment receipts, and schedule via their mobile phones. Currently staged for next rollout.'}
          </div>
        </div>
      </div>

      {/* Customer Lookup Card */}
      <div className="card mb-6">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={20} className="text-primary" />
            <h3 className="card-title">
              {language === 'ur' ? 'کسٹمر ڈیجیٹل پاس بک تلاش' : 'Customer Passbook Lookup'}
            </h3>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="form-label">{language === 'ur' ? 'موبائل نمبر' : 'Phone Number'}</label>
              <input
                type="text"
                className="form-input"
                value={phoneLookup}
                onChange={(e) => setPhoneLookup(e.target.value)}
                placeholder="0300-XXXXXXX"
              />
            </div>
            <div className="md:col-span-4">
              <label className="form-label">{language === 'ur' ? 'پاس بک کوڈ' : 'Passbook Security Code'}</label>
              <input
                type="text"
                className="form-input"
                value={passbookCode}
                onChange={(e) => setPassbookCode(e.target.value)}
                placeholder="PB-XXXX-XXXX"
              />
            </div>
            <div className="md:col-span-2" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSearched(true)}
                className="btn btn-primary btn-block"
              >
                <Search size={16} />
                <span>{language === 'ur' ? 'کھولیں' : 'View'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Passbook Live Preview */}
      {searched && (
        <div className="card" style={{ border: '2px solid #059669', overflow: 'hidden' }}>
          {/* Shop Header */}
          <div style={{ background: '#059669', color: '#ffffff', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{samplePassbook.shopName}</div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.9 }}>
              {language === 'ur' ? 'کسٹمر اقساط پاس بک' : 'Customer Installment Passbook'}
            </div>
          </div>

          <div className="card-body">
            {/* Customer Details */}
            <div
              style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Customer Name</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{samplePassbook.customerName}</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{samplePassbook.phone}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Purchased Item</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{samplePassbook.productName}</div>
                <div style={{ fontSize: '0.8125rem', color: '#059669' }}>Contract #{samplePassbook.contractCode}</div>
              </div>
            </div>

            {/* Financial Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #a7f3d0' }}>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Agreed Price</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                  <MoneyDisplay paisa={samplePassbook.agreedPricePaisa} />
                </div>
              </div>

              <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Paid So Far</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                  <MoneyDisplay paisa={samplePassbook.totalPaidPaisa} />
                </div>
              </div>

              <div style={{ background: '#fff1f2', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #fecdd3' }}>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Remaining Balance</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e11d48' }}>
                  <MoneyDisplay paisa={samplePassbook.remainingPaisa} />
                </div>
              </div>
            </div>

            {/* Schedule Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                {language === 'ur' ? 'اقساط کا شیڈول اور ادائیگیاں' : 'Installment Schedule & History'}
              </h4>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{language === 'ur' ? 'واجب الادا تاریخ' : 'Due Date'}</th>
                      <th>{language === 'ur' ? 'رقم' : 'Amount'}</th>
                      <th>{language === 'ur' ? 'اسٹیٹس' : 'Status'}</th>
                      <th>{language === 'ur' ? 'وصولی تاریخ' : 'Paid Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samplePassbook.schedule.map((row) => (
                      <tr key={row.seq}>
                        <td>#{row.seq}</td>
                        <td className="font-semibold">{row.dueDate}</td>
                        <td>
                          <MoneyDisplay paisa={row.amountPaisa} />
                        </td>
                        <td>
                          <StatusBadge status={row.status as any} />
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.8125rem' }}>
                          {row.paidDate || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Next Due Date: <strong>{samplePassbook.nextDueDate}</strong> (Rs. 6,000)
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => window.print()}
              >
                <Download size={14} />
                <span>{language === 'ur' ? 'پاس بک ڈاؤن لوڈ' : 'Download Passbook'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
