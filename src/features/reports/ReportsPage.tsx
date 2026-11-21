// ============================================================================
// Reports Feature: Financial Analytics, Recovery Performance & Cash Flow
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  UserCheck,
  Printer,
  Trophy,
  Medal,
  Award,
  ArrowRight,
  ExternalLink,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  Boxes,
  DownloadCloud,
  FileCheck,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import {
  Sale,
  Payment,
  Expense,
  Contract,
  RecoveryVisit,
  RecoveryAssignment,
  Product,
  InventoryMovement,
  Customer,
  Purchase,
  StaffPayrollRecord,
} from '@/types';
import { SaleRepository } from '@/repositories/sale.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { RecoveryRepository } from '@/repositories/recovery.repository';
import { StaffRepository, StaffMemberRecord } from '@/repositories/staff.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { InventoryRepository } from '@/repositories/inventory.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { SupplierRepository } from '@/repositories/supplier.repository';
import { MonthlyExecutiveAuditPdf } from '@/components/shared/MonthlyExecutiveAuditPdf';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';

export const ReportsPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { isDemoUser } = useAuth();
  const navigate = useNavigate();

  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [visits, setVisits] = useState<RecoveryVisit[]>([]);
  const [staff, setStaff] = useState<StaffMemberRecord[]>([]);
  const [assignments, setAssignments] = useState<RecoveryAssignment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<StaffPayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [showMonthlyAuditModal, setShowMonthlyAuditModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenant) return;
    const load = async () => {
      setLoading(true);
      try {
        const [sList, pList, eList, cList, vList, stList, aList, prList, mList, purList, custList, payrList] = await Promise.all([
          SaleRepository.getSales(activeTenant.tenantId, isDemoUser),
          PaymentRepository.getPayments(activeTenant.tenantId, isDemoUser),
          ExpenseRepository.getExpenses(activeTenant.tenantId, isDemoUser),
          SaleRepository.getContracts(activeTenant.tenantId, isDemoUser),
          RecoveryRepository.getVisits(activeTenant.tenantId, isDemoUser),
          StaffRepository.getStaffMembers(activeTenant.tenantId, isDemoUser),
          RecoveryRepository.getAssignments(activeTenant.tenantId, undefined, isDemoUser),
          ProductRepository.getProducts(activeTenant.tenantId, isDemoUser),
          InventoryRepository.getMovements(activeTenant.tenantId, isDemoUser),
          SupplierRepository.getPurchases(activeTenant.tenantId, isDemoUser),
          CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser),
          StaffRepository.getPayrollRecords(activeTenant.tenantId, selectedMonth, isDemoUser),
        ]);
        setSales(sList);
        setPayments(pList);
        setExpenses(eList);
        setContracts(cList);
        setVisits(vList);
        setStaff(stList);
        setAssignments(aList);
        setProducts(prList);
        setInventoryMovements(mList);
        setPurchases(purList);
        setCustomers(custList);
        setPayrollRecords(payrList);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTenant, selectedMonth, isDemoUser]);

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

  // Recovery Officers Targets & Leaderboard Aggregations
  const recoveryStaff = staff.filter((s) => s.role === 'recovery');
  const targetStaff = recoveryStaff.length > 0 ? recoveryStaff : staff.filter((s) => s.role !== 'owner');

  const recoveryStats = targetStaff
    .map((officer) => {
      const officerAsgs = assignments.filter((a) => a.employeeId === officer.userId);
      const assignedCount = officerAsgs.length;
      const officerVisits = visits.filter((v) => v.employeeId === officer.userId);
      const collectedVisits = officerVisits.filter((v) => v.outcome === 'collected');
      const fulfilledCustomerIds = new Set(collectedVisits.map((v) => v.customerId));
      const fulfilledCount = officerAsgs.filter((a) => fulfilledCustomerIds.has(a.customerId)).length;
      const pendingCount = Math.max(0, assignedCount - fulfilledCount);
      const unavailableCount = officerVisits.filter((v) => v.outcome === 'unavailable').length;
      const promisedCount = officerVisits.filter((v) => v.outcome === 'promised').length;
      const collectedPaisa = collectedVisits.reduce((sum, v) => sum + (v.amountCollectedPaisa || 0), 0);
      const completionRate = assignedCount > 0 ? Math.round((fulfilledCount / assignedCount) * 100) : 0;

      return {
        officer,
        assignedCount,
        fulfilledCount,
        pendingCount,
        unavailableCount,
        promisedCount,
        collectedPaisa,
        completionRate,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate || b.collectedPaisa - a.collectedPaisa);

  return (
    <div>
      {/* Top Header */}
      <div className="page-header-responsive">
        <div className="page-title-group">
          <h2>
            {t('nav.reports')}
          </h2>
          <p>
            {language === 'ur'
              ? 'مالیاتی خلاصہ، نقد بہاؤ، اخراجات اور ریکوری کارکردگی'
              : 'Business financial performance, recovery collections and net cash flow analysis.'}
          </p>
        </div>

        <div className="page-action-group">
          <button
            onClick={() => setShowMonthlyAuditModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileText size={16} />
            <span>{language === 'ur' ? 'ماہانہ ایگزیکٹو بزنس آڈٹ (پی ڈی ایف)' : 'Monthly Executive Audit (PDF)'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-outline"
          >
            <Printer size={16} />
            <span>{t('common.print')} Report</span>
          </button>
        </div>
      </div>

      {/* Featured Executive Monthly Business Audit & Official PDF Download Banner */}
      <div
        className="card mb-6"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f766e 100%)',
          color: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)',
          border: 'none',
          overflow: 'hidden',
        }}
      >
        <div className="card-body" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileCheck size={28} color="#a7f3d0" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#ffffff' }}>
                    {language === 'ur'
                      ? 'ماہانہ ایگزیکٹو بزنس آڈٹ و لیجر رپورٹ'
                      : 'Official Monthly Executive Business Audit'}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    A4 Official PDF
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#d1fae5', maxWidth: '620px' }}>
                  {language === 'ur'
                    ? 'دکان کا مکمل ماہانہ حساب: اسٹاک (کتنا پڑا ہے، کتنا بیکا، کتنا خراب ہے)، دفتری اخراجات، کس کو کتنی تنخواہ ملی، نقد و اقساط سیلز اور ریکوری کا باضابطہ مہر و دستخط شدہ پرنٹ۔'
                    : 'Complete audited monthly ledger: stock on hand, units sold, damaged stock, itemized expenses, staff payroll disbursements, cash vs installment sales & dual authorization stamps.'}
                </p>
              </div>
            </div>

            {/* Month Picker & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.35rem 0.65rem', borderRadius: '0.5rem' }}>
                <Calendar size={15} color="#a7f3d0" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="2026-11" style={{ color: '#0f172a' }}>November 2026 (نومبر 2026)</option>
                  <option value="2026-10" style={{ color: '#0f172a' }}>October 2026 (اکتوبر 2026)</option>
                  <option value="2026-09" style={{ color: '#0f172a' }}>September 2026 (ستمبر 2026)</option>
                  <option value="2026-08" style={{ color: '#0f172a' }}>August 2026 (اگست 2026)</option>
                  <option value="2026-07" style={{ color: '#0f172a' }}>July 2026 (جولائی 2026)</option>
                  <option value="2026-06" style={{ color: '#0f172a' }}>June 2026 (جون 2026)</option>
                </select>
              </div>

              <button
                onClick={() => setShowMonthlyAuditModal(true)}
                className="btn"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#065f46',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  border: 'none',
                }}
              >
                <FileText size={15} />
                <span>{language === 'ur' ? 'مکمل ایگزیکٹو آڈٹ کھولیں' : 'View Full Executive Audit'}</span>
              </button>

              <button
                onClick={() => setShowMonthlyAuditModal(true)}
                className="btn"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Printer size={15} />
                <span>{language === 'ur' ? 'پرنٹ / پی ڈی ایف' : 'Print / PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Highlights Grid (1 col on mobile, 2 on tablet/laptop, 4 on wide desktop to avoid cramped prices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
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

      {/* Recovery Officers Target Fulfillment & Ranking Leaderboard Card */}
      <div className="card mb-6" style={{ border: '1px solid #cbd5e1', overflowX: 'auto' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ padding: '0.4rem', background: '#fef3c7', borderRadius: '0.375rem', color: '#d97706' }}>
              <Trophy size={18} />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1rem' }}>
                {language === 'ur'
                  ? 'ریکوری آفیسرز اہداف و کارکردگی لیڈر بورڈ'
                  : 'Recovery Officers Target Fulfillment & Ranking'}
              </h3>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.75rem' }}>
                {language === 'ur'
                  ? 'مختلف تفویض شدہ اہداف (مثلاً 10، 8 اور 7 گاہک)، وصول شدہ اور وجوہات کا خلاصہ'
                  : 'Performance comparison across individual targets (e.g. 10, 8, 7), fulfilled dues, and doorstep audit reasons.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/recovery')}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <span>{language === 'ur' ? 'مکمل پورٹل و لائیو جی پی ایس' : 'Open Full Audit Portal'}</span>
            <ExternalLink size={12} />
          </button>
        </div>

        <div className="card-body" style={{ padding: '0.5rem 1rem 1rem' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ width: '100%', minWidth: '700px', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: language === 'ur' ? 'right' : 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>{language === 'ur' ? 'پوزیشن' : 'Rank'}</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>{language === 'ur' ? 'آفیسر' : 'Officer'}</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'کل ہدف' : 'Assigned'}</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'وصول شدہ' : 'Fulfilled'}</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'پینڈنگ' : 'Pending'}</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>{language === 'ur' ? 'غیر وصول شدہ وجوہات' : 'Doorstep Reasons'}</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{language === 'ur' ? 'وصول شدہ رقم' : 'Collected'}</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'شرح کامیابی' : 'Rate'}</th>
              </tr>
            </thead>
            <tbody>
              {recoveryStats.map((item, index) => {
                const rank = index + 1;
                let rankIcon = <Medal size={16} className="text-slate-400" />;
                let rankTitle = `#${rank}`;
                let rankColor = '#475569';

                if (rank === 1) {
                  rankIcon = <Trophy size={16} style={{ color: '#eab308' }} />;
                  rankTitle = language === 'ur' ? '🥇 پوزیشن #1 (ٹاپ پرفارمر)' : '🥇 Rank #1 (Top)';
                  rankColor = '#b45309';
                } else if (rank === 2) {
                  rankIcon = <Medal size={16} style={{ color: '#0284c7' }} />;
                  rankTitle = language === 'ur' ? '🥈 پوزیشن #2' : '🥈 Rank #2';
                  rankColor = '#0369a1';
                } else if (rank === 3) {
                  rankIcon = <Award size={16} style={{ color: '#d97706' }} />;
                  rankTitle = language === 'ur' ? '🥉 پوزیشن #3' : '🥉 Rank #3';
                  rankColor = '#92400e';
                }

                return (
                  <tr key={item.officer.userId} style={{ borderBottom: '1px solid #f1f5f9', background: rank === 1 ? '#fffdf5' : '#ffffff' }}>
                    <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle', fontWeight: 700, color: rankColor }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {rankIcon}
                        <span>{rankTitle}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.officer.displayName}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{item.officer.phone || item.officer.email}</div>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', verticalAlign: 'middle', fontWeight: 700 }}>
                      <span className="badge badge-outline" style={{ fontSize: '0.8125rem' }}>
                        {item.assignedCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                        {item.fulfilledCount} / {item.assignedCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span className={`badge ${item.pendingCount > 0 ? 'badge-warning' : 'badge-outline'}`} style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                        {item.pendingCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.6875rem' }}>
                        {item.unavailableCount > 0 && (
                          <span style={{ color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Lock size={10} /> {item.unavailableCount} {language === 'ur' ? 'تالا لگا تھا' : 'Locked'}
                          </span>
                        )}
                        {item.promisedCount > 0 && (
                          <span style={{ color: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={10} /> {item.promisedCount} {language === 'ur' ? 'اگلا وعدہ' : 'Promised'}
                          </span>
                        )}
                        {item.unavailableCount === 0 && item.promisedCount === 0 && (
                          <span className="text-muted">{language === 'ur' ? 'کلیئر' : 'All Clear'}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', verticalAlign: 'middle', fontWeight: 700, color: '#16a34a' }}>
                      <MoneyDisplay paisa={item.collectedPaisa} />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 800, color: item.completionRate >= 80 ? '#16a34a' : item.completionRate >= 50 ? '#d97706' : '#dc2626' }}>
                        {item.completionRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Monthly Executive Business Audit Modal (A4 Printable Document) */}
      {showMonthlyAuditModal && activeTenant && (
        <MonthlyExecutiveAuditPdf
          tenant={activeTenant}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          sales={sales}
          contracts={contracts}
          payments={payments}
          expenses={expenses}
          payrollRecords={payrollRecords}
          products={products}
          inventoryMovements={inventoryMovements}
          purchases={purchases}
          customers={customers}
          staff={staff}
          onClose={() => setShowMonthlyAuditModal(false)}
        />
      )}
    </div>
  );
};

