// ============================================================================
// Contracts Feature: Installment Contracts & Schedule Viewer
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Calendar,
  CheckCircle,
  X,
  CreditCard,
  Clock,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Contract, ScheduleEntry, Customer, ClearanceCertificate } from '@/types';
import { SaleRepository } from '@/repositories/sale.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { CertificateRepository } from '@/repositories/certificate.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PrintableCertificate } from '@/components/shared/PrintableCertificate';
import { Award } from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { isDemoUser } = useAuth();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Schedule modal state
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Clearance Certificate Modal State
  const [activeCertData, setActiveCertData] = useState<{
    cert: ClearanceCertificate;
    contract: Contract;
    customer?: Customer;
  } | null>(null);

  const loadData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [ctrList, cusList] = await Promise.all([
        SaleRepository.getContracts(activeTenant.tenantId, isDemoUser),
        CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser),
      ]);
      setContracts(ctrList);
      setCustomers(cusList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant, isDemoUser]);

  const viewSchedule = async (contract: Contract) => {
    if (!activeTenant) return;
    setSelectedContract(contract);
    setLoadingSchedule(true);
    try {
      const entries = await SaleRepository.getScheduleEntries(
        activeTenant.tenantId,
        contract.contractId,
        isDemoUser
      );
      setScheduleEntries(entries);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleIssueCertificate = async (contract: Contract) => {
    if (!activeTenant) return;
    try {
      const cert = await CertificateRepository.issueCertificate({
        tenantId: activeTenant.tenantId,
        userId: 'owner',
        contract,
        isDemo: isDemoUser,
      });

      const customer = customers.find((c) => c.customerId === contract.customerId);
      setActiveCertData({ cert, contract, customer });
    } catch (err: any) {
      alert(err?.message || 'Failed to issue clearance certificate.');
    }
  };

  const getCustomer = (id: string) => {
    return customers.find((c) => c.customerId === id);
  };

  const filteredContracts = contracts.filter((c) => {
    const cus = getCustomer(c.customerId);
    const q = searchQuery.toLowerCase();
    const cusName = cus?.fullName.toLowerCase() || '';
    const cusPhone = cus?.phoneDisplay || '';
    const code = c.contractCode?.toLowerCase() || '';
    return cusName.includes(q) || cusPhone.includes(q) || code.includes(q);
  });

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.contracts')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'تمام فعال اور مکمل شدہ اقساط معاہدات کی مکمل تفصیل'
              : 'Active and settled customer installment contracts and repayment schedules.'}
          </p>
        </div>

        <button
          onClick={() => navigate('/sales/new')}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          <span>{t('dashboard.newSale')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-box mb-6">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="form-input"
          placeholder="Search by customer name, mobile or contract code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Contracts Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>{t('customers.name')}</th>
                <th>Items</th>
                <th>Agreed Total</th>
                <th>Advance</th>
                <th>Outstanding</th>
                <th>{t('common.status')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: '2rem' }}>
                    {t('common.loading')}
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted" style={{ padding: '2rem' }}>
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const cus = getCustomer(c.customerId);
                  return (
                    <tr key={c.contractId}>
                      <td>
                        <div className="font-semibold">{c.contractCode || 'CTR'}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {c.frequency.toUpperCase()} • {c.durationCount} mos
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{cus?.fullName || 'Customer'}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {cus?.phoneDisplay}
                        </div>
                      </td>
                      <td>
                        {c.itemsSnapshot?.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '0.8125rem' }}>
                            {item.quantity}x {item.productNameSnapshot}
                          </div>
                        ))}
                      </td>
                      <td>
                        <MoneyDisplay paisa={c.installmentPriceTotalPaisa} />
                      </td>
                      <td>
                        <MoneyDisplay paisa={c.advancePaisa} className="text-success" />
                      </td>
                      <td>
                        <MoneyDisplay paisa={c.outstandingPaisa} className="text-primary font-bold" />
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button
                            onClick={() => viewSchedule(c)}
                            className="btn btn-sm btn-outline"
                          >
                            <Calendar size={13} />
                            <span>Schedule</span>
                          </button>

                          {(c.outstandingPaisa === 0 || c.status === 'fully_paid') && (
                            <button
                              onClick={() => handleIssueCertificate(c)}
                              className="btn btn-sm btn-primary"
                              title="Issue Clearance Certificate"
                            >
                              <Award size={13} />
                              <span>Clearance</span>
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

      {/* Contract Schedule Modal */}
      {selectedContract && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  Installment Schedule — {selectedContract.contractCode}
                </h3>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  {getCustomer(selectedContract.customerId)?.fullName} • Remaining:{' '}
                  <MoneyDisplay paisa={selectedContract.outstandingPaisa} className="font-bold text-primary" />
                </div>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {loadingSchedule ? (
                <div className="text-center" style={{ padding: '2rem' }}>
                  {t('common.loading')}
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Due Date</th>
                        <th>Due Amount</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleEntries.map((entry) => (
                        <tr key={entry.scheduleEntryId}>
                          <td className="font-semibold">{entry.sequenceNumber}</td>
                          <td>{entry.dueDateKey}</td>
                          <td>
                            <MoneyDisplay paisa={entry.dueAmountPaisa} />
                          </td>
                          <td>
                            <MoneyDisplay paisa={entry.allocatedPaidPaisa} className="text-success" />
                          </td>
                          <td>
                            <MoneyDisplay paisa={entry.remainingPaisa} className={entry.remainingPaisa > 0 ? 'text-primary font-bold' : 'text-muted'} />
                          </td>
                          <td>
                            <StatusBadge status={entry.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setSelectedContract(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clearance Certificate Modal */}
      {activeCertData && (
        <PrintableCertificate
          certificate={activeCertData.cert}
          contract={activeCertData.contract}
          customer={activeCertData.customer}
          onClose={() => setActiveCertData(null)}
        />
      )}
    </div>
  );
};

