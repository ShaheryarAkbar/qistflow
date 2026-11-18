// ============================================================================
// Installments Feature: Due & Overdue Collection Sheet
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Search,
  Filter,
  CheckCircle2,
  Phone,
  AlertTriangle,
  Receipt,
  Printer,
  X,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Contract, ScheduleEntry, Customer, PaymentMethod } from '@/types';
import { SaleRepository } from '@/repositories/sale.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PrintableReceipt } from '@/components/shared/PrintableReceipt';
import { rupeesToPaisa } from '@/domain/money/paisa';

interface DueItem {
  entry: ScheduleEntry;
  contract: Contract;
  customer?: Customer;
}

interface CollectedItem {
  paymentId: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  phone: string;
  contractCode: string;
  amountPaisa: number;
  method: PaymentMethod;
  paidAt: string;
  receivedBy: string;
}

export const DueInstallmentsPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'today' | 'overdue' | 'all' | 'collected'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Collect State
  const [collectTarget, setCollectTarget] = useState<DueItem | null>(null);
  const [amountRupees, setAmountRupees] = useState('');
  const [collectMethod, setCollectMethod] = useState<'cash' | 'jazzcash' | 'easypaisa' | 'bank'>('cash');
  const [saving, setSaving] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  const todayKey = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [contracts, customers, payments] = await Promise.all([
        SaleRepository.getContracts(activeTenant.tenantId, isDemoUser),
        CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser),
        PaymentRepository.getPayments(activeTenant.tenantId, isDemoUser),
      ]);

      const items: DueItem[] = [];

      for (const contract of contracts) {
        if (contract.status === 'fully_paid' || contract.status === 'cancelled') continue;
        const entries = await SaleRepository.getScheduleEntries(
          activeTenant.tenantId,
          contract.contractId,
          isDemoUser
        );

        const customer = customers.find((c) => c.customerId === contract.customerId);

        for (const entry of entries) {
          if (entry.remainingPaisa > 0) {
            items.push({ entry, contract, customer });
          }
        }
      }

      setDueItems(items);

      // Filter payments collected today
      const todayPayments = payments.filter((p) => {
        if (p.status === 'reversed') return false;
        const pDate =
          typeof p.paidAt === 'string'
            ? p.paidAt.split('T')[0]
            : p.paidAt?.toDate
            ? p.paidAt.toDate().toISOString().split('T')[0]
            : '';
        return pDate === todayKey;
      });

      const mappedCollected: CollectedItem[] = todayPayments.map((p) => {
        const cus = customers.find((c) => c.customerId === p.customerId);
        const ctr = contracts.find((c) => c.contractId === p.contractId);
        return {
          paymentId: p.paymentId,
          receiptNumber: p.reference?.startsWith('RCP-') ? p.reference : `RCP-${p.paymentId.slice(-6).toUpperCase()}`,
          customerId: p.customerId,
          customerName: cus?.fullName || 'Customer',
          phone: cus?.phoneDisplay || cus?.normalizedPhone || '-',
          contractCode: ctr?.contractCode || '-',
          amountPaisa: p.amountPaisa,
          method: p.method,
          paidAt: typeof p.paidAt === 'string' ? p.paidAt : new Date().toISOString(),
          receivedBy: p.receivedBy || 'Staff',
        };
      });

      setCollectedItems(mappedCollected);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant, isDemoUser]);

  const handleQuickCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !collectTarget || !amountRupees) return;

    setSaving(true);
    try {
      const amountPaisa = rupeesToPaisa(amountRupees);
      const res = await PaymentRepository.recordPayment({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        customerId: collectTarget.contract.customerId,
        contractId: collectTarget.contract.contractId,
        amountPaisa,
        method: collectMethod,
        paymentKind: 'installment',
        isDemo: isDemoUser,
      });

      const newRemaining = Math.max(0, collectTarget.contract.outstandingPaisa - amountPaisa);

      setActiveReceipt({
        receiptNumber: res.receipt.receiptNumber,
        customerName: collectTarget.customer?.fullName || 'Customer',
        customerPhone: collectTarget.customer?.phoneDisplay,
        contractCode: collectTarget.contract.contractCode,
        amountPaisa,
        remainingBalancePaisa: newRemaining,
        paymentMethod: collectMethod,
        date: new Date().toISOString(),
        receivedBy: currentUser.displayName || 'Staff',
      });

      setCollectTarget(null);
      setAmountRupees('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Collection failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = dueItems.filter((item) => {
    // Filter type condition
    const isOverdue = item.entry.dueDateKey < todayKey;
    const isDueToday = item.entry.dueDateKey === todayKey;

    let matchesFilter = true;
    if (filterType === 'today') matchesFilter = isDueToday;
    if (filterType === 'overdue') matchesFilter = isOverdue;

    // Search query
    const q = searchQuery.toLowerCase();
    const cusName = item.customer?.fullName.toLowerCase() || '';
    const phone = item.customer?.phoneDisplay || '';
    const code = item.contract.contractCode?.toLowerCase() || '';
    const area = item.customer?.area?.toLowerCase() || '';

    return matchesFilter && (cusName.includes(q) || phone.includes(q) || code.includes(q) || area.includes(q));
  });

  const filteredCollected = collectedItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const cusName = item.customerName.toLowerCase();
    const phone = item.phone;
    const code = item.contractCode.toLowerCase();
    const rcp = item.receiptNumber.toLowerCase();
    return cusName.includes(q) || phone.includes(q) || code.includes(q) || rcp.includes(q);
  });

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.installments')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'روزانہ، ہفتہ وار اور تاخیر شدہ اقساط کی لسٹ، فوری وصولی اور وصول شدہ اقساط'
              : 'Daily collection sheet, overdue installments, quick repayment logging and today receipts.'}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('today')}
            className={`btn btn-sm ${filterType === 'today' ? 'btn-primary' : 'btn-outline'}`}
          >
            {language === 'ur' ? 'آج واجب الادا' : 'Due Today'} ({dueItems.filter((i) => i.entry.dueDateKey === todayKey).length})
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`btn btn-sm ${filterType === 'overdue' ? 'btn-danger' : 'btn-outline'}`}
          >
            {language === 'ur' ? 'تاخیر شدہ (بقایا)' : 'Overdue'} ({dueItems.filter((i) => i.entry.dueDateKey < todayKey).length})
          </button>
          <button
            onClick={() => setFilterType('all')}
            className={`btn btn-sm ${filterType === 'all' ? 'btn-secondary' : 'btn-outline'}`}
          >
            {language === 'ur' ? 'تمام غیر وصول شدہ' : 'All Unpaid'} ({dueItems.length})
          </button>
          <button
            onClick={() => setFilterType('collected')}
            className={`btn btn-sm ${filterType === 'collected' ? 'btn-success' : 'btn-outline'}`}
            style={filterType === 'collected' ? { background: '#059669', color: '#fff', borderColor: '#059669' } : {}}
          >
            {language === 'ur' ? 'وصول شدہ (آج)' : 'Collected Today'} ({collectedItems.length})
          </button>
        </div>

        <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder={
              language === 'ur'
                ? 'کسٹمر نام، فون، ایریا، رسید نمبر یا معاہدہ کوڈ سے تلاش کریں...'
                : 'Search by customer name, phone, area, receipt # or contract code...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Due / Collected Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {filterType === 'collected' ? (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('customers.name')}</th>
                  <th>{language === 'ur' ? 'معاہدہ کوڈ' : 'Contract'}</th>
                  <th>{language === 'ur' ? 'وصول شدہ رقم' : 'Amount Paid'}</th>
                  <th>{language === 'ur' ? 'طریقہ ادائیگی' : 'Method'}</th>
                  <th>{language === 'ur' ? 'رسید نمبر' : 'Receipt #'}</th>
                  <th>{language === 'ur' ? 'وصول کنندہ / وقت' : 'Received By / Time'}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center" style={{ padding: '2rem' }}>
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : filteredCollected.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                      {language === 'ur'
                        ? 'آج کے دن ابھی تک کوئی وصولی نہیں ہوئی۔'
                        : 'No installments collected yet today.'}
                    </td>
                  </tr>
                ) : (
                  filteredCollected.map((col) => (
                    <tr key={col.paymentId}>
                      <td>
                        <div className="font-semibold">{col.customerName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          <Phone size={11} style={{ display: 'inline', marginRight: '0.2rem' }} />
                          {col.phone}
                        </div>
                      </td>
                      <td>
                        <span className="font-semibold">{col.contractCode}</span>
                      </td>
                      <td>
                        <MoneyDisplay paisa={col.amountPaisa} className="font-bold text-success" />
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                          {col.method}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>
                          {col.receiptNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem' }}>{col.receivedBy}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {col.paidAt.split('T')[1]?.slice(0, 5) || col.paidAt.split('T')[0]}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setActiveReceipt({
                              receiptNumber: col.receiptNumber,
                              customerName: col.customerName,
                              customerPhone: col.phone,
                              contractCode: col.contractCode,
                              amountPaisa: col.amountPaisa,
                              remainingBalancePaisa: 0,
                              paymentMethod: col.method,
                              date: col.paidAt,
                              receivedBy: col.receivedBy,
                            });
                          }}
                          className="btn btn-sm btn-outline"
                          title="View / Print Receipt"
                        >
                          <Printer size={13} />
                          <span>{language === 'ur' ? 'رسید دیکھیں' : 'Receipt'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contract</th>
                  <th>Installment #</th>
                  <th>Due Date</th>
                  <th>Due Amount</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center" style={{ padding: '2rem' }}>
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted" style={{ padding: '2rem' }}>
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isOverdue = item.entry.dueDateKey < todayKey;
                    return (
                      <tr key={item.entry.scheduleEntryId}>
                        <td>
                          <div className="font-semibold">{item.customer?.fullName}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            <Phone size={11} style={{ display: 'inline', marginRight: '0.2rem' }} />
                            {item.customer?.phoneDisplay} • {item.customer?.area || item.customer?.city}
                          </div>
                        </td>
                        <td>
                          <span className="font-semibold">{item.contract.contractCode}</span>
                        </td>
                        <td>
                          <span>#{item.entry.sequenceNumber}</span>
                        </td>
                        <td>
                          <span className={isOverdue ? 'text-danger font-bold' : ''}>
                            {item.entry.dueDateKey}
                          </span>
                        </td>
                        <td>
                          <MoneyDisplay paisa={item.entry.dueAmountPaisa} />
                        </td>
                        <td>
                          <MoneyDisplay paisa={item.entry.remainingPaisa} className="font-bold text-primary" />
                        </td>
                        <td>
                          <StatusBadge status={isOverdue ? 'overdue' : item.entry.status} />
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setCollectTarget(item);
                              setAmountRupees((item.entry.remainingPaisa / 100).toString());
                            }}
                            className="btn btn-sm btn-primary"
                          >
                            <Receipt size={13} />
                            <span>Collect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Collect Modal */}
      {collectTarget && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Collect Installment</h3>
            </div>

            <form onSubmit={handleQuickCollect}>
              <div className="modal-body">
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                  <div><strong>Customer:</strong> {collectTarget.customer?.fullName} ({collectTarget.customer?.phoneDisplay})</div>
                  <div><strong>Contract:</strong> {collectTarget.contract.contractCode} (Inst #{collectTarget.entry.sequenceNumber})</div>
                  <div><strong>Due Amount:</strong> Rs. {collectTarget.entry.remainingPaisa / 100}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount Received (Rs.)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value as any)}
                  >
                    <option value="cash">Cash</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">Easypaisa</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setCollectTarget(null)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <CheckCircle2 size={16} />
                  <span>{saving ? t('common.loading') : 'Collect & Print Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt */}
      {activeReceipt && (
        <PrintableReceipt
          {...activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};

