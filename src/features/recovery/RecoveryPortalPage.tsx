// ============================================================================
// Recovery Portal Feature: Mobile-First Field Officer Interface
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Coins,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import {
  RecoveryAssignment,
  RecoveryVisit,
  Customer,
  Contract,
  RecoveryVisitOutcome,
} from '@/types';
import { RecoveryRepository } from '@/repositories/recovery.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PrintableReceipt } from '@/components/shared/PrintableReceipt';
import { rupeesToPaisa } from '@/domain/money/paisa';

interface RecoveryCardData {
  assignment: RecoveryAssignment;
  customer?: Customer;
  contract?: Contract;
}

export const RecoveryPortalPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'assigned' | 'visits'>('assigned');
  const [cards, setCards] = useState<RecoveryCardData[]>([]);
  const [visits, setVisits] = useState<RecoveryVisit[]>([]);
  const [loading, setLoading] = useState(true);

  // Log Visit Modal State
  const [targetCard, setTargetCard] = useState<RecoveryCardData | null>(null);
  const [outcome, setOutcome] = useState<RecoveryVisitOutcome>('collected');
  const [visitNote, setVisitNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Field Collection State
  const [collectAmountRupees, setCollectAmountRupees] = useState('');
  const [collectReceipt, setCollectReceipt] = useState<any | null>(null);

  const loadData = async () => {
    if (!activeTenant || !currentUser) return;
    setLoading(true);
    try {
      const [asgList, vList, cusList, ctrList] = await Promise.all([
        RecoveryRepository.getAssignments(activeTenant.tenantId, undefined, isDemoUser),
        RecoveryRepository.getVisits(activeTenant.tenantId, isDemoUser),
        CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser),
        SaleRepository.getContracts(activeTenant.tenantId, isDemoUser),
      ]);

      const mapped: RecoveryCardData[] = asgList.map((asg) => ({
        assignment: asg,
        customer: cusList.find((c) => c.customerId === asg.customerId),
        contract: ctrList.find((ctr) => ctr.contractId === asg.contractId),
      }));

      setCards(mapped);
      setVisits(vList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant, currentUser, isDemoUser]);

  const handleLogVisitAndPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !targetCard) return;

    setSaving(true);
    try {
      let createdPaymentId: string | undefined;

      // If collected on spot with amount > 0, record the payment
      if (outcome === 'collected' && collectAmountRupees && targetCard.contract) {
        const amountPaisa = rupeesToPaisa(collectAmountRupees);
        const payRes = await PaymentRepository.recordPayment({
          tenantId: activeTenant.tenantId,
          userId: currentUser.uid,
          customerId: targetCard.customer?.customerId || '',
          contractId: targetCard.contract.contractId,
          amountPaisa,
          method: 'cash',
          paymentKind: 'installment',
          notes: `Collected in field by ${currentUser.displayName}`,
          isDemo: isDemoUser,
        });

        createdPaymentId = payRes.payment.paymentId;

        setCollectReceipt({
          receiptNumber: payRes.receipt.receiptNumber,
          customerName: targetCard.customer?.fullName || 'Customer',
          customerPhone: targetCard.customer?.phoneDisplay,
          contractCode: targetCard.contract.contractCode,
          amountPaisa,
          remainingBalancePaisa: Math.max(0, targetCard.contract.outstandingPaisa - amountPaisa),
          paymentMethod: 'cash',
          date: new Date().toISOString(),
          receivedBy: currentUser.displayName || 'Field Officer',
        });
      }

      await RecoveryRepository.logVisit({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        assignmentId: targetCard.assignment.assignmentId,
        customerId: targetCard.customer?.customerId || '',
        contractId: targetCard.contract?.contractId,
        outcome,
        note: visitNote,
        nextFollowUpAt: followUpDate || undefined,
        paymentId: createdPaymentId,
        isDemo: isDemoUser,
      });

      setTargetCard(null);
      setVisitNote('');
      setCollectAmountRupees('');
      setFollowUpDate('');
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to log visit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a' }}>
            {t('recovery.title')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
            {language === 'ur'
              ? 'فیلڈ ریکوری عملے کے لیے موبائل دوست انٹرفیس'
              : 'Mobile field interface for assigned customer collection visits.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`btn btn-sm ${activeTab === 'assigned' ? 'btn-primary' : 'btn-outline'}`}
          >
            {language === 'ur' ? 'گاہک' : 'Assigned'} ({cards.length})
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`btn btn-sm ${activeTab === 'visits' ? 'btn-primary' : 'btn-outline'}`}
          >
            {language === 'ur' ? 'دورے' : 'Visits'} ({visits.length})
          </button>
        </div>
      </div>

      {/* Assigned Accounts Tab */}
      {activeTab === 'assigned' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div className="card text-center" style={{ padding: '2rem' }}>
              {t('common.loading')}
            </div>
          ) : cards.length === 0 ? (
            <div className="card text-center text-muted" style={{ padding: '2rem' }}>
              {language === 'ur' ? 'آپ کو کوئی گاہک تفویض نہیں کیا گیا۔' : 'No customers currently assigned.'}
            </div>
          ) : (
            cards.map(({ assignment, customer, contract }) => (
              <div key={assignment.assignmentId} className="card" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                        {customer?.fullName || 'Assigned Customer'}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                        <MapPin size={13} />
                        <span>{[customer?.area, customer?.city].filter(Boolean).join(', ')}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Outstanding</div>
                      <MoneyDisplay paisa={contract?.outstandingPaisa || 0} className="font-bold text-primary" style={{ fontSize: '1.125rem' }} />
                    </div>
                  </div>

                  {customer?.address && (
                    <div style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                      <strong>Address:</strong> {customer.address}
                    </div>
                  )}

                  {/* Mobile Quick Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                    <a
                      href={`tel:${customer?.phoneDisplay}`}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                    >
                      <Phone size={14} />
                      <span>Call</span>
                    </a>

                    <a
                      href={`https://wa.me/${customer?.normalizedPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', color: '#16a34a' }}
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      onClick={() => setTargetCard({ assignment, customer, contract })}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                    >
                      <CheckCircle2 size={14} />
                      <span>{t('recovery.logVisit')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Visits History Tab */
        <div className="card">
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>Customer</th>
                  <th>Outcome</th>
                  <th>Note</th>
                  <th>Next Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted" style={{ padding: '2rem' }}>
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  visits.map((v) => (
                    <tr key={v.visitId}>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : 'Today'}
                      </td>
                      <td className="font-semibold">{v.customerId}</td>
                      <td>
                        <span className={`badge ${v.outcome === 'collected' ? 'badge-success' : 'badge-warning'}`}>
                          {v.outcome.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{v.note || '—'}</td>
                      <td>{v.nextFollowUpAt ? String(v.nextFollowUpAt).split('T')[0] : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Visit & On-spot Collect Modal */}
      {targetCard && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('recovery.logVisit')}</h3>
              <button onClick={() => setTargetCard(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLogVisitAndPayment}>
              <div className="modal-body">
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                  <div><strong>Customer:</strong> {targetCard.customer?.fullName}</div>
                  <div><strong>Phone:</strong> {targetCard.customer?.phoneDisplay}</div>
                  <div><strong>Contract Outstanding:</strong> Rs. {(targetCard.contract?.outstandingPaisa || 0) / 100}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Outcome</label>
                  <select
                    className="form-select"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as RecoveryVisitOutcome)}
                  >
                    <option value="collected">{t('recovery.collected')}</option>
                    <option value="promised">{t('recovery.promised')}</option>
                    <option value="unavailable">{t('recovery.unavailable')}</option>
                    <option value="refused">{t('recovery.refused')}</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>

                {outcome === 'collected' && (
                  <div className="form-group">
                    <label className="form-label">
                      <span>Amount Collected on Spot (Rs.)</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5000"
                      value={collectAmountRupees}
                      onChange={(e) => setCollectAmountRupees(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('recovery.nextFollowUp')}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Customer remarks / location notes..."
                    value={visitNote}
                    onChange={(e) => setVisitNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setTargetCard(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <CheckCircle2 size={16} />
                  <span>{saving ? t('common.loading') : 'Save Visit Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Printable Receipt */}
      {collectReceipt && (
        <PrintableReceipt
          {...collectReceipt}
          onClose={() => setCollectReceipt(null)}
        />
      )}
    </div>
  );
};

