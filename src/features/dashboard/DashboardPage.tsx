// ============================================================================
// Dashboard Feature: Executive Overview & Today's Collections
// Real-time aggregation of active contracts, recoveries, and overdue tracking
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  DollarSign,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Customer, ScheduleEntryStatus } from '@/types';
import { SaleRepository } from '@/repositories/sale.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { ProductRepository } from '@/repositories/product.repository';

interface DashboardMetrics {
  todayExpectedPaisa: number;
  todayReceivedPaisa: number;
  todayPendingPaisa: number;
  totalOutstandingPaisa: number;
  overdueAmountPaisa: number;
  activeContractsCount: number;
  totalCustomersCount: number;
  lowStockAlertsCount: number;
}

interface DueTableItem {
  entryId: string;
  contractId: string;
  contractCode: string;
  customerName: string;
  phone: string;
  item: string;
  amountPaisa: number;
  dueDate: string;
  status: ScheduleEntryStatus;
}

export const DashboardPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { isDemoUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayExpectedPaisa: 0,
    todayReceivedPaisa: 0,
    todayPendingPaisa: 0,
    totalOutstandingPaisa: 0,
    overdueAmountPaisa: 0,
    activeContractsCount: 0,
    totalCustomersCount: 0,
    lowStockAlertsCount: 0,
  });

  const [dueTableItems, setDueTableItems] = useState<DueTableItem[]>([]);

  const todayKey = new Date().toISOString().split('T')[0];

  const loadDashboardData = async () => {
    if (!activeTenant) return;
    setLoading(true);

    try {
      const [contracts, customers, payments, products] = await Promise.all([
        SaleRepository.getContracts(activeTenant.tenantId, isDemoUser),
        CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser),
        PaymentRepository.getPayments(activeTenant.tenantId, isDemoUser),
        ProductRepository.getProducts(activeTenant.tenantId, isDemoUser),
      ]);

      const customerMap = new Map<string, Customer>();
      customers.forEach((c) => customerMap.set(c.customerId, c));

      // Calculate payments received today
      const todayReceived = payments
        .filter((p) => {
          if (p.status === 'reversed') return false;
          const pDate =
            typeof p.paidAt === 'string'
              ? p.paidAt.split('T')[0]
              : p.paidAt?.toDate
              ? p.paidAt.toDate().toISOString().split('T')[0]
              : '';
          return pDate === todayKey;
        })
        .reduce((sum, p) => sum + p.amountPaisa, 0);

      // Active contracts & outstanding
      const activeContracts = contracts.filter((c) => c.status === 'active');
      const totalOutstanding = activeContracts.reduce(
        (sum, c) => sum + (c.outstandingPaisa || 0),
        0
      );

      // Low stock count
      const lowStockCount = products.filter(
        (prd) => prd.stockOnHand <= (prd.reorderLevel ?? 2)
      ).length;

      // Inspect schedule entries
      let todayExpected = 0;
      let overdueAmount = 0;
      const allDues: DueTableItem[] = [];

      for (const contract of activeContracts) {
        const entries = await SaleRepository.getScheduleEntries(
          activeTenant.tenantId,
          contract.contractId,
          isDemoUser
        );

        const customer = customerMap.get(contract.customerId);
        const itemName =
          contract.itemsSnapshot?.[0]?.productNameSnapshot ||
          `Contract #${contract.contractCode || contract.contractId}`;

        for (const entry of entries) {
          const remainingForEntry = entry.remainingPaisa || 0;

          if (entry.status !== 'paid' && remainingForEntry > 0) {
            if (entry.dueDateKey === todayKey) {
              todayExpected += remainingForEntry;
            } else if (entry.dueDateKey < todayKey) {
              overdueAmount += remainingForEntry;
            }

            allDues.push({
              entryId: entry.scheduleEntryId,
              contractId: contract.contractId,
              contractCode: contract.contractCode || contract.contractId,
              customerName: customer ? customer.fullName : 'Walk-in Customer',
              phone: customer?.phoneDisplay || customer?.normalizedPhone || '-',
              item: itemName,
              amountPaisa: remainingForEntry,
              dueDate: entry.dueDateKey,
              status: entry.status,
            });
          }
        }
      }

      // Sort table items: overdue first, then by date ascending
      allDues.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      // Calculate today's pending
      const todayPending = Math.max(0, todayExpected - todayReceived);

      setMetrics({
        todayExpectedPaisa: todayExpected,
        todayReceivedPaisa: todayReceived,
        todayPendingPaisa: todayPending,
        totalOutstandingPaisa: totalOutstanding,
        overdueAmountPaisa: overdueAmount,
        activeContractsCount: activeContracts.length,
        totalCustomersCount: customers.length,
        lowStockAlertsCount: lowStockCount,
      });

      setDueTableItems(allDues.slice(0, 10)); // Top 10 priority dues
    } catch (err) {
      console.error('Failed to load dashboard aggregates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeTenant?.tenantId, language]);

  return (
    <div>
      {/* Top Welcome & Quick Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              {t('nav.dashboard')}
            </h2>
            <button
              onClick={loadDashboardData}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.25rem 0.5rem', height: 'auto' }}
              title="Refresh metrics"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'آج کی وصولیاں اور اقساط کی صورتحال'
              : "Live overview of today's expected recoveries and active installments."}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => navigate('/sales/new')}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>{t('dashboard.newSale')}</span>
          </button>
          <button
            onClick={() => navigate('/payments')}
            className="btn btn-secondary"
          >
            <Receipt size={16} />
            <span>{t('dashboard.recordPayment')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon icon-emerald">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.todayReceived')}</div>
            <div className="stat-value text-success">
              <MoneyDisplay paisa={metrics.todayReceivedPaisa} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-amber">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.todayPending')}</div>
            <div className="stat-value text-warning">
              <MoneyDisplay paisa={metrics.todayPendingPaisa} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-blue">
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.totalOutstanding')}</div>
            <div className="stat-value">
              <MoneyDisplay paisa={metrics.totalOutstandingPaisa} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-rose">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.overdueAmount')}</div>
            <div className="stat-value text-danger">
              <MoneyDisplay paisa={metrics.overdueAmountPaisa} />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/contracts')}
        >
          <div
            className="card-body"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
                {t('dashboard.activeContracts')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {metrics.activeContractsCount}
              </div>
            </div>
            <FileText size={28} className="text-primary" />
          </div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/customers')}
        >
          <div
            className="card-body"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
                {t('dashboard.totalCustomers')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {metrics.totalCustomersCount}
              </div>
            </div>
            <Users size={28} className="text-primary" />
          </div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/inventory')}
        >
          <div
            className="card-body"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
                {t('dashboard.lowStockAlerts')}
              </div>
              <div
                style={{ fontSize: '1.25rem', fontWeight: 700 }}
                className={metrics.lowStockAlertsCount > 0 ? 'text-warning' : ''}
              >
                {metrics.lowStockAlertsCount}
              </div>
            </div>
            <AlertTriangle
              size={28}
              className={metrics.lowStockAlertsCount > 0 ? 'text-warning' : 'text-muted'}
            />
          </div>
        </div>
      </div>

      {/* Priority Due Installments Table Preview */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              {language === 'ur'
                ? 'واجب الادا اقساط (فوری وصولی)'
                : 'Priority Due & Overdue Installments'}
            </h3>
            <p className="card-subtitle">
              {language === 'ur'
                ? 'آج کی واجب الادا اور تاخیر کا شکار اقساط کی فہرست'
                : 'Top overdue and current due installments requiring collection.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/installments/due')}
            className="btn btn-sm btn-outline"
          >
            <span>{t('common.view')} {t('common.all')}</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {dueTableItems.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }} className="text-muted">
              <CheckCircle2 size={36} className="text-success" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600 }}>
                {language === 'ur'
                  ? 'کوئی واجب الادا قسط باقی نہیں ہے!'
                  : 'All installments are up-to-date! No pending dues.'}
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('customers.name')}</th>
                  <th>{t('customers.phone')}</th>
                  <th>{t('products.name')}</th>
                  <th>{t('payments.amount')}</th>
                  <th>{t('common.date')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {dueTableItems.map((item) => (
                  <tr key={item.entryId}>
                    <td className="font-semibold">{item.customerName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={13} className="text-muted" />
                        <span dir="ltr">{item.phone}</span>
                      </div>
                    </td>
                    <td>{item.item}</td>
                    <td>
                      <MoneyDisplay paisa={item.amountPaisa} />
                    </td>
                    <td>
                      <span
                        className={
                          item.dueDate < todayKey
                            ? 'text-danger font-semibold'
                            : item.dueDate === todayKey
                            ? 'text-warning font-semibold'
                            : ''
                        }
                      >
                        {item.dueDate}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <button
                        onClick={() => navigate('/payments')}
                        className="btn btn-sm btn-primary"
                      >
                        <Receipt size={14} />
                        <span>{t('dashboard.recordPayment')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
