// ============================================================================
// Reports Feature: Financial Analytics, Recovery Performance & Cash Flow
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  UserCheck,
  Printer,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Sale, Payment, Expense, Contract, RecoveryVisit } from '@/types';
import { SaleRepository } from '@/repositories/sale.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { RecoveryRepository } from '@/repositories/recovery.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';

export const ReportsPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { isDemoUser } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [visits, setVisits] = useState<RecoveryVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenant) return;
    const load = async () => {
      setLoading(true);
      try {
        const [sList, pList, eList, cList, vList] = await Promise.all([
          SaleRepository.getSales(activeTenant.tenantId, isDemoUser),
          PaymentRepository.getPayments(activeTenant.tenantId, isDemoUser),
          ExpenseRepository.getExpenses(activeTenant.tenantId, isDemoUser),
          SaleRepository.getContracts(activeTenant.tenantId, isDemoUser),
          RecoveryRepository.getVisits(activeTenant.tenantId, isDemoUser),
        ]);
        setSales(sList);
        setPayments(pList);
        setExpenses(eList);
        setContracts(cList);
        setVisits(vList);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTenant, isDemoUser]);

  // Aggregate metrics
  const totalSalesPaisa = sales.reduce(
    (sum, s) => sum + (s.saleType === 'cash' ? s.cashTotalPaisa : s.agreedTotalPaisa),
    0
  );

  const totalCollectedPaisa = payments
    .filter((p) => p.status === 'posted')
    .reduce((sum, p) => sum + p.amountPaisa, 0);

  const totalExpensesPaisa = expenses
    .filter((e) => e.status === 'posted')
    .reduce((sum, e) => sum + e.amountPaisa, 0);

  const netCashFlowPaisa = totalCollectedPaisa - totalExpensesPaisa;

  const totalOutstandingPaisa = contracts
    .filter((c) => c.status !== 'fully_paid' && c.status !== 'cancelled')
    .reduce((sum, c) => sum + c.outstandingPaisa, 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.reports')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'مالیاتی خلاصہ، نقد بہاؤ، اخراجات اور ریکوری کارکردگی'
              : 'Business financial performance, recovery collections and net cash flow analysis.'}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="btn btn-outline"
        >
          <Printer size={16} />
          <span>{t('common.print')} Report</span>
        </button>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon icon-emerald">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Collections</div>
            <div className="stat-value text-success">
              <MoneyDisplay paisa={totalCollectedPaisa} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-rose">
            <CreditCard size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Operating Expenses</div>
            <div className="stat-value text-danger">
              <MoneyDisplay paisa={totalExpensesPaisa} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-blue">
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Net Operating Flow</div>
            <div className={`stat-value ${netCashFlowPaisa >= 0 ? 'text-success' : 'text-danger'}`}>
              <MoneyDisplay paisa={netCashFlowPaisa} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-amber">
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Shop Outstanding</div>
            <div className="stat-value text-primary">
              <MoneyDisplay paisa={totalOutstandingPaisa} />
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Expense Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Expenses Breakdown</h3>
          </div>
          <div className="card-body">
            {expenses.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: '1.5rem' }}>No expenses recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.from(new Set(expenses.map((e) => e.category))).map((cat) => {
                  const catTotal = expenses
                    .filter((e) => e.category === cat && e.status === 'posted')
                    .reduce((sum, e) => sum + e.amountPaisa, 0);

                  const pct = totalExpensesPaisa > 0 ? Math.round((catTotal / totalExpensesPaisa) * 100) : 0;

                  return (
                    <div key={cat} style={{ fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span className="font-semibold">{cat}</span>
                        <span><MoneyDisplay paisa={catTotal} /> ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#ef4444' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recovery Field Activity Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recovery Field Summary</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Total Recorded Visits:</span>
                <span className="font-bold">{visits.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Successful Collections:</span>
                <span className="font-bold text-success">
                  {visits.filter((v) => v.outcome === 'collected').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Promised Follow-ups:</span>
                <span className="font-bold text-warning">
                  {visits.filter((v) => v.outcome === 'promised').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Unavailable / Rescheduled:</span>
                <span className="font-bold">
                  {visits.filter((v) => ['unavailable', 'rescheduled'].includes(v.outcome)).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

