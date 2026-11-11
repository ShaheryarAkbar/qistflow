// ============================================================================
// Dashboard Feature: Executive Overview & Today's Collections
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  DollarSign,
  PlusCircle,
  Receipt,
  UserPlus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();

  // Illustrative seed metric figures in integer Paisa for clean presentation
  const metrics = {
    todayExpectedPaisa: 8500000,   // Rs. 85,000
    todayReceivedPaisa: 5200000,   // Rs. 52,000
    todayPendingPaisa: 3300000,    // Rs. 33,000
    totalOutstandingPaisa: 142500000, // Rs. 1,425,000
    overdueAmountPaisa: 12500000,  // Rs. 125,000
    activeContractsCount: 48,
    totalCustomersCount: 112,
    lowStockAlertsCount: 3,
  };

  const sampleRecentDues = [
    {
      id: 'sch-01',
      customerName: 'Muhammad Arshad',
      phone: '0301-7654321',
      item: 'Super Asia Washing Machine (SA-240)',
      amountPaisa: 500000,
      dueDate: '2026-11-11',
      status: 'due',
    },
    {
      id: 'sch-02',
      customerName: 'Tariq Mehmood',
      phone: '0300-9876543',
      item: 'Waves Deep Freezer (WF-314)',
      amountPaisa: 800000,
      dueDate: '2026-11-11',
      status: 'paid',
    },
    {
      id: 'sch-03',
      customerName: 'Zahid Hussain',
      phone: '0302-1122334',
      item: 'Inverex Solar Inverter (3.2 kW)',
      amountPaisa: 1500000,
      dueDate: '2026-11-10',
      status: 'overdue',
    },
  ];

  return (
    <div>
      {/* Top Welcome & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.dashboard')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'آج کی وصولیاں اور اقساط کی صورتحال'
              : "Overview of today's expected recoveries and active installments."}
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
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.8125rem' }}>{t('dashboard.activeContracts')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{metrics.activeContractsCount}</div>
            </div>
            <FileText size={28} className="text-primary" />
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.8125rem' }}>{t('dashboard.totalCustomers')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{metrics.totalCustomersCount}</div>
            </div>
            <Users size={28} className="text-primary" />
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.8125rem' }}>{t('dashboard.lowStockAlerts')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }} className="text-warning">
                {metrics.lowStockAlertsCount}
              </div>
            </div>
            <AlertTriangle size={28} className="text-warning" />
          </div>
        </div>
      </div>

      {/* Today's Due Installments Table Preview */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">{t('nav.installments')} (Today)</h3>
            <p className="card-subtitle">
              {language === 'ur'
                ? 'آج کی تاریخ میں واجب الادا اقساط'
                : 'Installments scheduled for collection today.'}
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
              {sampleRecentDues.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.customerName}</td>
                  <td>{item.phone}</td>
                  <td>{item.item}</td>
                  <td>
                    <MoneyDisplay paisa={item.amountPaisa} />
                  </td>
                  <td>{item.dueDate}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    {item.status !== 'paid' ? (
                      <button
                        onClick={() => navigate('/payments')}
                        className="btn btn-sm btn-primary"
                      >
                        <CheckCircle2 size={14} />
                        <span>{t('dashboard.recordPayment')}</span>
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {t('common.confirm')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
