// ============================================================================
// Payments Feature: Collections Ledger, Reversals & Receipts
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Receipt as ReceiptIcon,
  PlusCircle,
  Search,
  Printer,
  RotateCcw,
  CheckCircle,
  X,
  CreditCard,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Payment, Customer, Contract, PaymentMethod } from '@/types';
import { PaymentRepository } from '@/repositories/payment.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PrintableReceipt } from '@/components/shared/PrintableReceipt';
import { rupeesToPaisa } from '@/domain/money/paisa';

export const PaymentsPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant, isOwner, isManager } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Collect Payment Modal
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit / Mistake Correction Modal
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editContractId, setEditContractId] = useState('');
  const [editAmountRupees, setEditAmountRupees] = useState('');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('cash');
  const [editReference, setEditReference] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCorrectionReason, setEditCorrectionReason] = useState('');

  // Active receipt viewer
  const [activeReceiptData, setActiveReceiptData] = useState<any | null>(null);

  // Reversal Modal
  const [reversingPayment, setReversingPayment] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  const loadData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [payList, cusList, ctrList] = await Promise.all([
        PaymentRepository.getPayments(activeTenant.tenantId, isDemoUser),
        CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser),
        SaleRepository.getContracts(activeTenant.tenantId, isDemoUser),
      ]);
      setPayments(payList);
      setCustomers(cusList);
      setContracts(ctrList);
      if (cusList.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(cusList[0].customerId);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant, isDemoUser]);

  // Update selected contract when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      const customerContracts = contracts.filter((c) => c.customerId === selectedCustomerId && c.status !== 'fully_paid');
      if (customerContracts.length > 0) {
        setSelectedContractId(customerContracts[0].contractId);
      } else {
        setSelectedContractId('');
      }
    }
  }, [selectedCustomerId, contracts]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !selectedCustomerId || !amountRupees) {
      alert('Please fill in customer and payment amount.');
      return;
    }

    setSaving(true);
    try {
      const amountPaisa = rupeesToPaisa(amountRupees);
      const res = await PaymentRepository.recordPayment({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        customerId: selectedCustomerId,
        contractId: selectedContractId || undefined,
        amountPaisa,
        method,
        reference,
        notes,
        isDemo: isDemoUser,
      });

      const customer = customers.find((c) => c.customerId === selectedCustomerId);
      const contract = contracts.find((c) => c.contractId === selectedContractId);
      const newRemainingPaisa = contract
        ? Math.max(0, contract.outstandingPaisa - amountPaisa)
        : undefined;

      // Show receipt modal
      setActiveReceiptData({
        receiptNumber: res.receipt.receiptNumber,
        customerName: customer?.fullName || 'Customer',
        customerPhone: customer?.phoneDisplay,
        contractCode: contract?.contractCode,
        amountPaisa,
        remainingBalancePaisa: newRemainingPaisa,
        paymentMethod: method,
        date: new Date().toISOString(),
        receivedBy: currentUser.displayName || 'Staff',
      });

      setAmountRupees('');
      setReference('');
      setNotes('');
      setIsCollectModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReversal = async () => {
    if (!activeTenant || !currentUser || !reversingPayment || !reversalReason) {
      alert('Please provide a formal reversal reason.');
      return;
    }

    setSaving(true);
    try {
      await PaymentRepository.reversePayment({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        paymentId: reversingPayment.paymentId,
        reason: reversalReason,
        isDemo: isDemoUser,
      });

      setReversingPayment(null);
      setReversalReason('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to reverse payment');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (p: Payment) => {
    setEditingPayment(p);
    setEditCustomerId(p.customerId);
    setEditContractId(p.contractId || '');
    setEditAmountRupees((p.amountPaisa / 100).toString());
    setEditMethod(p.method);
    setEditReference(p.reference || '');
    setEditNotes(p.notes || '');
    setEditCorrectionReason('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !editingPayment) return;
    if (!editCorrectionReason.trim()) {
      alert(
        language === 'ur'
          ? 'براہ کرم درستی کی وجہ ضرور درج کریں تاکہ آڈٹ ٹریل اور ریکارڈ درست رہے (مثلاً: غلط گاہک کو چلی گئی تھی)'
          : 'Please enter a correction reason for audit records.'
      );
      return;
    }

    setSaving(true);
    try {
      await PaymentRepository.updatePayment({
        tenantId: activeTenant.tenantId,
        userId: currentUser?.uid || 'staff',
        paymentId: editingPayment.paymentId,
        customerId: editCustomerId,
        contractId: editContractId || undefined,
        amountPaisa: rupeesToPaisa(editAmountRupees),
        method: editMethod,
        reference: editReference,
        notes: editNotes,
        correctionReason: editCorrectionReason,
        isDemo: isDemoUser,
      });

      setEditingPayment(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  const getCustomer = (id: string) => customers.find((c) => c.customerId === id);
  const getContract = (id?: string) => contracts.find((c) => c.contractId === id);

  const filteredPayments = payments.filter((p) => {
    const cus = getCustomer(p.customerId);
    const q = searchQuery.toLowerCase();
    const cusName = cus?.fullName.toLowerCase() || '';
    const phone = cus?.phoneDisplay || '';
    const ref = p.reference?.toLowerCase() || '';
    return cusName.includes(q) || phone.includes(q) || ref.includes(q);
  });

  const activeCustomerContracts = contracts.filter((c) => c.customerId === selectedCustomerId);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('payments.title')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'وصولیوں کا مصدقہ لیجر، رسیدیں اور ریورسلز (Payment Allocations & Ledger)'
              : 'Audit ledger of customer installment payments, receipts and authorized reversals.'}
          </p>
        </div>

        <button
          onClick={() => setIsCollectModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          <span>{t('payments.recordPayment')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-box mb-6">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="form-input"
          placeholder="Search by customer name, mobile or transaction reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('customers.name')}</th>
                <th>Contract</th>
                <th>Amount</th>
                <th>Method</th>
                <th>{t('common.status')}</th>
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
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const cus = getCustomer(p.customerId);
                  const ctr = getContract(p.contractId);
                  return (
                    <tr key={p.paymentId}>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {typeof p.paidAt === 'string' ? p.paidAt.split('T')[0] : 'Recent'}
                      </td>
                      <td>
                        <div className="font-semibold">{cus?.fullName || 'Customer'}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {cus?.phoneDisplay}
                        </div>
                      </td>
                      <td>
                        <span className="font-semibold">{ctr?.contractCode || '—'}</span>
                      </td>
                      <td>
                        <MoneyDisplay paisa={p.amountPaisa} className="font-bold text-success" />
                      </td>
                      <td>
                        <span className="badge badge-slate">{p.method.toUpperCase()}</span>
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button
                            onClick={() =>
                              setActiveReceiptData({
                                receiptNumber: `RCP-${p.paymentId.slice(-6)}`,
                                customerName: cus?.fullName || 'Customer',
                                customerPhone: cus?.phoneDisplay,
                                contractCode: ctr?.contractCode,
                                amountPaisa: p.amountPaisa,
                                remainingBalancePaisa: ctr?.outstandingPaisa,
                                paymentMethod: p.method,
                                date: typeof p.paidAt === 'string' ? p.paidAt : new Date().toISOString(),
                                receivedBy: p.receivedBy,
                              })
                            }
                            className="btn btn-sm btn-outline"
                            title="Print Receipt"
                          >
                            <Printer size={13} />
                          </button>

                          {(isOwner || isManager) && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="btn btn-sm btn-outline text-primary"
                              title={language === 'ur' ? 'غلطی کی درستی / کسٹمر تبدیلی' : 'Edit / Correct mistake'}
                            >
                              <Edit3 size={13} />
                            </button>
                          )}

                          {p.status === 'posted' && (
                            <button
                              onClick={() => setReversingPayment(p)}
                              className="btn btn-sm btn-outline text-danger"
                              title="Reverse Payment"
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {isCollectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('payments.recordPayment')}</h3>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('customers.name')}</label>
                  <select
                    className="form-select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.customerId} value={c.customerId}>
                        {c.fullName} — {c.phoneDisplay}
                      </option>
                    ))}
                  </select>
                </div>

                {activeCustomerContracts.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">
                      <span>Select Contract / Installment Account</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedContractId}
                      onChange={(e) => setSelectedContractId(e.target.value)}
                    >
                      {activeCustomerContracts.map((c) => (
                        <option key={c.contractId} value={c.contractId}>
                          {c.contractCode} (Outstanding: Rs. {c.outstandingPaisa / 100})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    <span>Amount Received (Rs.)</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 5000"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('payments.method')}</label>
                  <select
                    className="form-select"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">{t('payments.cash')}</option>
                    <option value="jazzcash">{t('payments.jazzcash')}</option>
                    <option value="easypaisa">{t('payments.easypaisa')}</option>
                    <option value="bank">{t('payments.bank')}</option>
                    <option value="card">Debit / Credit Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reference / Slip # (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. TID-982173 or Cash Slip"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <CheckCircle size={16} />
                  <span>{saving ? t('common.loading') : 'Collect & Issue Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Mistake Correction Modal */}
      {editingPayment && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-box" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={18} className="text-primary" />
                <h3 className="modal-title">
                  {language === 'ur' ? 'ادائیگی میں درستی و کسٹمر تبدیلی' : 'Edit & Correct Payment Entry'}
                </h3>
              </div>
              <button
                onClick={() => setEditingPayment(null)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#1e40af' }}>
                  {language === 'ur'
                    ? 'نوٹ: اگر غلطی سے کسی اور گاہک کی رقم دوسرے کے کھاتے میں ڈال دی گئی تھی یا رقم غلط درج ہو گئی تھی، تو آپ یہاں سے صحیح کسٹمر و رقم میں تبدیل کر سکتے ہیں۔ تمام سابقہ اور نئے بیلنس خودکار سیٹ ہو جائیں گے۔'
                    : 'Note: If payment was recorded under the wrong customer or incorrect amount, you can re-allocate it here with an audit note. Contract balances will adjust reactively.'}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('customers.name')}</label>
                  <select
                    className="form-select"
                    value={editCustomerId}
                    onChange={(e) => {
                      setEditCustomerId(e.target.value);
                      const cusCtr = contracts.filter((c) => c.customerId === e.target.value);
                      if (cusCtr.length > 0) setEditContractId(cusCtr[0].contractId);
                      else setEditContractId('');
                    }}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.customerId} value={c.customerId}>
                        {c.fullName} — {c.phoneDisplay} ({c.area || c.city})
                      </option>
                    ))}
                  </select>
                </div>

                {contracts.filter((c) => c.customerId === editCustomerId).length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Contract</label>
                    <select
                      className="form-select"
                      value={editContractId}
                      onChange={(e) => setEditContractId(e.target.value)}
                    >
                      <option value="">No specific contract</option>
                      {contracts
                        .filter((c) => c.customerId === editCustomerId)
                        .map((c) => (
                          <option key={c.contractId} value={c.contractId}>
                            {c.contractCode} (Remaining: Rs. {c.outstandingPaisa / 100})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('payments.amount')} (PKR)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editAmountRupees}
                      onChange={(e) => setEditAmountRupees(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('payments.method')}</label>
                    <select
                      className="form-select"
                      value={editMethod}
                      onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                    >
                      <option value="cash">Cash (نقد)</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Easypaisa / JazzCash</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'درستی کی وجہ (آڈٹ ٹریل کے لیے لازمی)' : 'Correction Reason (Required for audit)'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === 'ur' ? 'مثال: غلط کسٹمر کا نام چن لیا گیا تھا یا رقم غلط لکھی گئی تھی' : 'e.g. Mistakenly entered under wrong customer with same name'}
                    value={editCorrectionReason}
                    onChange={(e) => setEditCorrectionReason(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Reference / Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editReference}
                    placeholder="Trx ID or additional reference"
                    onChange={(e) => setEditReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !editCorrectionReason.trim()}
                >
                  {saving ? t('common.loading') : language === 'ur' ? 'درستی محفوظ کریں' : 'Save Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Reversal Confirm Dialog */}
      {reversingPayment && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ backgroundColor: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b' }}>
                <AlertTriangle size={20} />
                <h3 className="modal-title" style={{ color: '#991b1b' }}>
                  Confirm Payment Reversal
                </h3>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                Are you sure you want to reverse this payment of{' '}
                <strong>Rs. {reversingPayment.amountPaisa / 100}</strong>?
                This will legally unwind the schedule allocations and restore the customer's outstanding balance.
              </p>

              <div className="form-group">
                <label className="form-label">
                  <span>Formal Reversal Reason</span>
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Wrong customer selected / bounced cheque"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setReversingPayment(null)}
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmReversal}
                className="btn btn-danger"
                disabled={saving || !reversalReason}
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {activeReceiptData && (
        <PrintableReceipt
          {...activeReceiptData}
          onClose={() => setActiveReceiptData(null)}
        />
      )}
    </div>
  );
};

