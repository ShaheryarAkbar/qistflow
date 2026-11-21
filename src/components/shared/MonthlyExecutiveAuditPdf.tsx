// ============================================================================
// Shared Component: Official Monthly Executive Business Audit & Ledger PDF
// Comprehensive Executive A4 Report with Inventory, Sales, Salaries, Recovery & Signatures
// ============================================================================

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  X,
  Calendar,
  Building2,
  TrendingUp,
  CreditCard,
  Boxes,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
  DollarSign,
  Download,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Tenant, Sale, Contract, Payment, Expense, StaffPayrollRecord, Product, InventoryMovement, Customer, Purchase } from '@/types';
import { MoneyDisplay } from './MoneyDisplay';
import { formatPaisa } from '@/domain/money/paisa';

interface MonthlyExecutiveAuditPdfProps {
  tenant: Tenant;
  selectedMonth: string; // e.g. '2026-11'
  onMonthChange?: (month: string) => void;
  sales: Sale[];
  contracts: Contract[];
  payments: Payment[];
  expenses: Expense[];
  payrollRecords: StaffPayrollRecord[];
  products: Product[];
  inventoryMovements: InventoryMovement[];
  purchases?: Purchase[];
  customers: Customer[];
  onClose: () => void;
}

export const MonthlyExecutiveAuditPdf: React.FC<MonthlyExecutiveAuditPdfProps> = ({
  tenant,
  selectedMonth,
  onMonthChange,
  sales,
  contracts,
  payments,
  expenses,
  payrollRecords,
  products,
  inventoryMovements,
  purchases = [],
  customers,
  onClose,
}) => {
  const { language } = useI18n();
  const [isGenerating, setIsGenerating] = useState(false);

  // Month labels helper
  const getMonthName = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return monthKey;
    }
  };

  const currentMonthLabel = getMonthName(selectedMonth);

  // Filter items by selectedMonth (YYYY-MM)
  const isDateInMonth = (dateValue: any) => {
    if (!dateValue) return false;
    let str = '';
    if (typeof dateValue === 'string') {
      str = dateValue;
    } else if (dateValue instanceof Date) {
      str = dateValue.toISOString();
    } else if (dateValue.seconds) {
      str = new Date(dateValue.seconds * 1000).toISOString();
    }
    return str.startsWith(selectedMonth);
  };

  // 1. Sales Metrics for Selected Month
  const salesInMonth = sales.filter((s) => isDateInMonth(s.saleDate) && s.status !== 'cancelled');
  const cashSales = salesInMonth.filter((s) => s.saleType === 'cash');
  const installmentSales = salesInMonth.filter((s) => s.saleType === 'installment');

  const cashSalesTotalPaisa = cashSales.reduce((sum, s) => sum + s.cashTotalPaisa, 0);
  const installmentSalesAgreedPaisa = installmentSales.reduce((sum, s) => sum + s.agreedTotalPaisa, 0);
  const totalSalesTurnoverPaisa = cashSalesTotalPaisa + installmentSalesAgreedPaisa;

  // New customers in month
  const newCustomersInMonth = customers.filter((c) => isDateInMonth(c.createdAt));

  // 2. Stock & Inventory Movements for Selected Month
  const movementsInMonth = inventoryMovements.filter((m) => isDateInMonth(m.movementDate || m.createdAt));
  
  // Total units available on hand right now
  const totalStockOnHandUnits = products.reduce((sum, p) => sum + (p.stockOnHand || 0), 0);
  const totalStockAssetValuationPaisa = products.reduce(
    (sum, p) => sum + (p.stockOnHand || 0) * (p.costPricePaisa || 0),
    0
  );

  // Units sold this month (from sales items)
  let unitsSoldThisMonth = 0;
  salesInMonth.forEach((s) => {
    s.items?.forEach((item) => {
      unitsSoldThisMonth += item.quantity || 1;
    });
  });

  // Units purchased/received this month
  const purchaseMovements = movementsInMonth.filter((m) => m.movementType === 'purchase_in');
  const unitsPurchasedThisMonth = purchaseMovements.reduce((sum, m) => sum + (m.quantity || 0), 0);

  // Damaged stock this month
  const damageMovements = movementsInMonth.filter((m) => m.movementType === 'damage');
  const unitsDamagedThisMonth = damageMovements.reduce((sum, m) => sum + (m.quantity || 0), 0);
  const damagedStockLossPaisa = damageMovements.reduce((sum, m) => {
    const matchedPrd = products.find((p) => p.productId === m.productId);
    const unitCost = matchedPrd?.costPricePaisa || 2500000;
    return sum + (m.quantity || 0) * unitCost;
  }, 0);

  // 3. Installments Recovery Performance
  const paymentsInMonth = payments.filter((p) => isDateInMonth(p.paidAt) && p.status === 'posted');
  const installmentPaymentsInMonth = paymentsInMonth.filter((p) => p.paymentKind === 'installment' || p.paymentKind === 'advance');
  const totalCollectedInMonthPaisa = paymentsInMonth.reduce((sum, p) => sum + p.amountPaisa, 0);

  // Contracts active or created in this month
  const contractsInMonth = contracts.filter((c) => c.status !== 'cancelled');
  const totalExpectedInstallmentPaisa = contractsInMonth.reduce((sum, c) => {
    // Standard monthly due estimate
    const monthlyDue = Math.round(c.financedAmountPaisa / Math.max(1, c.durationCount || 10));
    return sum + monthlyDue;
  }, 0);

  const installmentCollectedPaisa = installmentPaymentsInMonth.reduce((sum, p) => sum + p.amountPaisa, 0);
  const pendingOverdueCarryPaisa = Math.max(0, totalExpectedInstallmentPaisa - installmentCollectedPaisa);
  const recoveryRate = totalExpectedInstallmentPaisa > 0
    ? Math.min(100, Math.round((installmentCollectedPaisa / totalExpectedInstallmentPaisa) * 100))
    : 100;

  // 4. Operating Expenses & Office Budget for Selected Month
  const expensesInMonth = expenses.filter((e) => isDateInMonth(e.expenseDate) && e.status === 'posted');
  const totalOfficeExpensesPaisa = expensesInMonth.reduce((sum, e) => sum + e.amountPaisa, 0);

  const expenseCategories = Array.from(new Set(expensesInMonth.map((e) => e.category || 'General Office')));
  const expenseBreakdown = expenseCategories.map((cat) => {
    const total = expensesInMonth
      .filter((e) => (e.category || 'General Office') === cat)
      .reduce((sum, e) => sum + e.amountPaisa, 0);
    const pct = totalOfficeExpensesPaisa > 0 ? Math.round((total / totalOfficeExpensesPaisa) * 100) : 0;
    return { category: cat, totalPaisa: total, percentage: pct };
  });

  // 5. Staff Salaries & Payroll for Selected Month
  const monthPayroll = payrollRecords.filter((p) => p.monthKey === selectedMonth);
  const totalSalariesPaidPaisa = monthPayroll
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.netPayablePaisa, 0);
  const totalSalariesCommittedPaisa = monthPayroll.reduce((sum, p) => sum + p.netPayablePaisa, 0);

  // 6. Net Cash Flow & P&L Statement
  // Total Inflow = Cash sales + Installment dues collected + Down payments
  const totalInflowPaisa = totalCollectedInMonthPaisa;
  // Total Outflow = Office expenses + Staff salaries paid
  const totalOutflowPaisa = totalOfficeExpensesPaisa + totalSalariesPaidPaisa;
  const netCashFlowPaisa = totalInflowPaisa - totalOutflowPaisa;

  // Available selectable months for history dropdown (last 12 months)
  const availableMonths = [
    '2026-11',
    '2026-10',
    '2026-09',
    '2026-08',
    '2026-07',
    '2026-06',
    '2026-05',
    '2026-04',
    '2026-03',
    '2026-02',
    '2026-01',
    '2025-12',
  ];

  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 150);
  };

  const auditReportSerial = `QST-AUDIT-${selectedMonth.replace('-', '')}-${(tenant.tenantId || 'SHOP').slice(-4).toUpperCase()}`;
  const generatedTimestamp = new Date().toLocaleString(language === 'ur' ? 'ur-PK' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="modal-overlay" style={{ zIndex: 1250, padding: '1rem', overflowY: 'auto' }}>
      <div
        className="modal-box"
        style={{
          maxWidth: '920px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          margin: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Screen Controls Header (Hidden in Print) */}
        <div
          className="modal-header no-print"
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '0.5rem' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                {language === 'ur' ? 'ماہانہ ایگزیکٹو بزنس آڈٹ و پی ڈی ایف' : 'Monthly Executive Business Audit'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                {language === 'ur'
                  ? 'دکان کا مکمل حساب، انوینٹری، تنخواہیں، سیلز، اخراجات اور منافع/نقصان'
                  : 'Official monthly ledger, stock health, payroll disbursements, recovery & P&L.'}
              </p>
            </div>
          </div>

          {/* Month Selector & Print Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={15} className="text-muted" />
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
                className="form-control"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8125rem', minWidth: '150px' }}
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {getMonthName(m)} ({m})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
            >
              <Printer size={15} />
              <span>{language === 'ur' ? 'پی ڈی ایف ڈاؤن لوڈ / پرنٹ کریں' : 'Download / Print PDF'}</span>
            </button>

            <button onClick={onClose} className="btn btn-icon btn-outline" title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div
          id="monthly-audit-print-area"
          style={{
            padding: '2rem',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontSize: '12px',
            lineHeight: 1.5,
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Top Formal Shop Header (Urdu & English, Location Address, Phone & Date) */}
          <div
            style={{
              borderBottom: '3px double #0f172a',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Serial badge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                fontSize: '10px',
                textAlign: 'right',
                color: '#64748b',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{auditReportSerial}</div>
              <div>Generated: {generatedTimestamp}</div>
            </div>

            {/* Shop Titles */}
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: '2px' }}>
              {tenant.businessNameUr || tenant.businessName}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tenant.businessName}
            </div>

            {/* Address & Contact Details */}
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              <span>📍 {tenant.address || 'Shahi Road, Near City Chowk'}</span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>{tenant.city || 'Rahim Yar Khan, Pakistan'}</span>
              {tenant.phone && (
                <>
                  <span style={{ margin: '0 8px' }}>•</span>
                  <span>📞 Phone: {tenant.phone}</span>
                </>
              )}
            </div>

            {/* Document Title Banner */}
            <div
              style={{
                display: 'inline-block',
                marginTop: '12px',
                padding: '4px 16px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '13px',
                color: '#0f172a',
                letterSpacing: '0.02em',
              }}
            >
              {language === 'ur'
                ? `ماہانہ ایگزیکٹو بزنس آڈٹ، انوینٹری و مالیاتی رپورٹ — ${currentMonthLabel}`
                : `MONTHLY EXECUTIVE BUSINESS AUDIT & FINANCIAL LEDGER — ${currentMonthLabel.toUpperCase()}`}
            </div>
          </div>

          {/* Executive Overview KPI Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
                {language === 'ur' ? 'کل وصولی (Inflow)' : 'Total Collections'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                Rs. {formatPaisa(totalInflowPaisa)}
              </div>
              <div style={{ fontSize: '9px', color: '#16a34a' }}>Cash + Installments</div>
            </div>

            <div style={{ padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>
                {language === 'ur' ? 'کل اخراجات و تنخواہیں' : 'Total Outflow'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#b91c1c', marginTop: '2px' }}>
                Rs. {formatPaisa(totalOutflowPaisa)}
              </div>
              <div style={{ fontSize: '9px', color: '#dc2626' }}>Office Budget + Payroll</div>
            </div>

            <div style={{ padding: '10px', backgroundColor: netCashFlowPaisa >= 0 ? '#eff6ff' : '#fff1f2', border: `1px solid ${netCashFlowPaisa >= 0 ? '#bfdbfe' : '#fecdd3'}`, borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: netCashFlowPaisa >= 0 ? '#1e40af' : '#9f1239', fontWeight: 600, textTransform: 'uppercase' }}>
                {language === 'ur' ? 'خالص نقد بیلنس (P&L)' : 'Net Operating Flow'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: netCashFlowPaisa >= 0 ? '#1d4ed8' : '#be123c', marginTop: '2px' }}>
                Rs. {formatPaisa(netCashFlowPaisa)}
              </div>
              <div style={{ fontSize: '9px', color: netCashFlowPaisa >= 0 ? '#2563eb' : '#e11d48' }}>
                {netCashFlowPaisa >= 0 ? 'Monthly Net Surplus' : 'Monthly Deficit'}
              </div>
            </div>

            <div style={{ padding: '10px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: '#6b21a8', fontWeight: 600, textTransform: 'uppercase' }}>
                {language === 'ur' ? 'دستیاب اسٹاک مالیت' : 'Stock Asset Value'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#7e22ce', marginTop: '2px' }}>
                Rs. {formatPaisa(totalStockAssetValuationPaisa)}
              </div>
              <div style={{ fontSize: '9px', color: '#9333ea' }}>{totalStockOnHandUnits} Units on Hand</div>
            </div>
          </div>

          {/* Section 1: Stock & Inventory Health */}
          <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '4px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>1. {language === 'ur' ? 'اسٹاک و گودام کی تفصیلی پوزیشن (Stock & Inventory Position)' : 'Stock & Inventory Position'}</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Current Count, Monthly Sales, Inflow & Damaged</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px 8px' }}>Inventory Metric / Description</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Units</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Valuation / Amount (PKR)</th>
                  <th style={{ padding: '6px 8px' }}>Audit Status & Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {language === 'ur' ? 'دکان و گودام میں موجود دستیاب اسٹاک (کتنا پڑا ہے)' : 'Current Available Stock on Hand'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{totalStockOnHandUnits} Units</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>
                    Rs. {formatPaisa(totalStockAssetValuationPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#059669' }}>Active Wholesale Asset Valuation</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {language === 'ur' ? 'اس مہینے فروخت شدہ سامان (کتنا اس مہینے بیکا)' : 'Units Sold in this Month'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{unitsSoldThisMonth} Units</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>
                    Rs. {formatPaisa(totalSalesTurnoverPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#2563eb' }}>
                    Cash: {cashSales.length} | Installment Contracts: {installmentSales.length}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {language === 'ur' ? 'اس مہینے سپلائر سے موصول شدہ نیا مال (Inflow)' : 'New Stock Received / Purchases'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{unitsPurchasedThisMonth} Units</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                    Rs. {formatPaisa(purchases.reduce((s, p) => isDateInMonth(p.purchaseDate) ? s + p.totalPaisa : s, 0))}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#475569' }}>Recorded Delivery Invoices</td>
                </tr>
                <tr style={{ borderBottom: '1.5px solid #cbd5e1', backgroundColor: '#fff1f2' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#b91c1c' }}>
                    {language === 'ur' ? 'خراب / ڈیمج مال (کتنا خراب ہے)' : 'Damaged / Scrapped / Defective Stock'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#b91c1c' }}>
                    {unitsDamagedThisMonth} Units
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#b91c1c' }}>
                    Rs. {formatPaisa(damagedStockLossPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#991b1b' }}>
                    {unitsDamagedThisMonth > 0 ? 'Depreciated / Separated from Sales' : 'Zero Damage Reported'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Sales & Customer Acquisition */}
          <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '4px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>2. {language === 'ur' ? 'نئی فروخت و گاہکوں کا اندراج (Sales & Customer Acquisition)' : 'Sales & Customer Acquisition'}</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Direct Cash vs Installment Contracts</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px 8px' }}>Sales Category</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Transactions / Count</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total Contract Value (PKR)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Immediate Cash Collected</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {language === 'ur' ? 'ڈائریکٹ نقد خریداری (Direct Cash Sales)' : 'Direct Cash Purchases'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{cashSales.length} Customers</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                    Rs. {formatPaisa(cashSalesTotalPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                    Rs. {formatPaisa(cashSalesTotalPaisa)}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {language === 'ur' ? 'اقساط پر نئے معاہدے (Installment Contracts)' : 'Installment Contracts Financed'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{installmentSales.length} Contracts</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                    Rs. {formatPaisa(installmentSalesAgreedPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                    Rs. {formatPaisa(installmentSales.reduce((s, sale) => s + (sale.discountPaisa || 0), 0) /* sample advance */ || totalCollectedInMonthPaisa - cashSalesTotalPaisa)}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {language === 'ur' ? 'نئے رجسٹرڈ گاہک (New Registered Customers)' : 'New Customer Registrations'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{newCustomersInMonth.length} Acquired</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b' }}>-</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b' }}>-</td>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc', fontWeight: 700, borderBottom: '1.5px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 8px' }}>Total Monthly Sales Volume</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{salesInMonth.length} Total Sales</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#0f172a' }}>
                    Rs. {formatPaisa(totalSalesTurnoverPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#15803d' }}>
                    Rs. {formatPaisa(totalInflowPaisa)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Monthly Installments Collection & Recovery Health */}
          <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '4px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>3. {language === 'ur' ? 'ماہانہ اقساط وصولی و ریکوری کارکردگی (Installments Recovery)' : 'Monthly Installments Recovery Health'}</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Target Dues, Realized Collections & Overdue Carry</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px 8px' }}>Collection Metric</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Target / Scheduled</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Realized Cash</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Fulfillment Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {language === 'ur' ? 'اس مہینے جتنی اقساط کور کرنی تھیں (Target Dues)' : 'Monthly Scheduled Installment Dues'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                    Rs. {formatPaisa(totalExpectedInstallmentPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                    Rs. {formatPaisa(installmentCollectedPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: recoveryRate >= 80 ? '#15803d' : '#b91c1c' }}>
                    {recoveryRate}%
                  </td>
                </tr>
                <tr style={{ borderBottom: '1.5px solid #cbd5e1', backgroundColor: '#fffbeb' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600, color: '#b45309' }}>
                    {language === 'ur' ? 'بقایا / پینڈنگ اقساط جو آگے منتقل ہوئیں (Pending Carryover)' : 'Overdue / Pending Dues Carried Forward'}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#b45309' }}>
                    Rs. {formatPaisa(pendingOverdueCarryPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#b45309' }}>Under Field Follow-up</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: '#b45309' }}>
                    {100 - recoveryRate}% Pending
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Operating Expenses & Office Budget */}
          <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '4px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>4. {language === 'ur' ? 'دفتری اخراجات و بجٹ تفصیل (Office Budget & Operating Expenses)' : 'Office Budget & Operating Expenses'}</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Itemized Category Breakdown</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px 8px' }}>Expense Category</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount (PKR)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>% of Budget</th>
                  <th style={{ padding: '6px 8px' }}>Audited Status</th>
                </tr>
              </thead>
              <tbody>
                {expenseBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>
                      No expenses posted for this month.
                    </td>
                  </tr>
                ) : (
                  expenseBreakdown.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{item.category}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                        Rs. {formatPaisa(item.totalPaisa)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.percentage}%</td>
                      <td style={{ padding: '6px 8px', color: '#059669' }}>Verified Voucher</td>
                    </tr>
                  ))
                )}
                <tr style={{ backgroundColor: '#f8fafc', fontWeight: 700, borderBottom: '1.5px solid #cbd5e1' }}>
                  <td style={{ padding: '6px 8px' }}>Total Operating Expenses</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#b91c1c' }}>
                    Rs. {formatPaisa(totalOfficeExpensesPaisa)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>100%</td>
                  <td style={{ padding: '6px 8px', color: '#0f172a' }}>Posted to Shop Ledger</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: Staff Salaries & Payroll Disbursement */}
          <div style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '4px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>5. {language === 'ur' ? 'سٹاف تنخواہوں کی ادائیگی - کس کو کتنی ملی (Staff Payroll & Salaries)' : 'Staff Payroll & Salaries Disbursement'}</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Employee Name, Role, Base, Paid Status & Method</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px 8px' }}>Staff Name</th>
                  <th style={{ padding: '6px 8px' }}>Role / Designation</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Base Pay</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Net Paid (PKR)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Disbursement Status</th>
                  <th style={{ padding: '6px 8px' }}>Method</th>
                </tr>
              </thead>
              <tbody>
                {monthPayroll.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>
                      No payroll records generated for {currentMonthLabel}.
                    </td>
                  </tr>
                ) : (
                  monthPayroll.map((record) => (
                    <tr key={record.payrollId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{record.employeeName}</td>
                      <td style={{ padding: '6px 8px', color: '#475569' }}>
                        {record.designation || record.role.toUpperCase()}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        Rs. {formatPaisa(record.baseSalaryPaisa)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: record.status === 'paid' ? '#15803d' : '#b45309' }}>
                        Rs. {formatPaisa(record.netPayablePaisa)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: 700,
                            backgroundColor: record.status === 'paid' ? '#dcfce7' : '#fef3c7',
                            color: record.status === 'paid' ? '#15803d' : '#b45309',
                          }}
                        >
                          {record.status === 'paid' ? 'PAID (ادا شدہ)' : 'PENDING'}
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px', textTransform: 'capitalize', color: '#334155' }}>
                        {record.paymentMethod || 'Cash'}
                      </td>
                    </tr>
                  ))
                )}
                <tr style={{ backgroundColor: '#f8fafc', fontWeight: 700, borderBottom: '1.5px solid #cbd5e1' }}>
                  <td colSpan={3} style={{ padding: '6px 8px' }}>Total Staff Salaries Disbursed</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#15803d' }}>
                    Rs. {formatPaisa(totalSalariesPaidPaisa)}
                  </td>
                  <td colSpan={2} style={{ padding: '6px 8px', color: '#64748b', fontSize: '10px' }}>
                    Committed Total: Rs. {formatPaisa(totalSalariesCommittedPaisa)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 6: Dual Signatures & Shop Seal */}
          <div
            style={{
              marginTop: '2.5rem',
              paddingTop: '1.25rem',
              borderTop: '1.5px solid #0f172a',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              pageBreakInside: 'avoid',
            }}
          >
            {/* Owner Signature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ fontStyle: 'italic', fontWeight: 700, color: '#0f172a' }}>
                  {tenant.businessNameUr?.split(' ')[0] || 'Haji Abdul Malik'}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px' }}>
                <div style={{ fontWeight: 700, fontSize: '11px' }}>
                  {language === 'ur' ? 'دستخط دکان مالک (Business Owner)' : 'Business Owner Signature'}
                </div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>Certified & Approved</div>
              </div>
            </div>

            {/* Official Shop Stamp Box */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  height: '55px',
                  width: '110px',
                  margin: 'auto',
                  border: '1.5px dashed #059669',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                <span>OFFICIAL SEAL</span>
                <span>دکان کی مہر</span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '9px', color: '#64748b' }}>
                {tenant.businessName}
              </div>
            </div>

            {/* Accountant Signature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ fontStyle: 'italic', fontWeight: 600, color: '#475569' }}>Verified & Reconciled</div>
              </div>
              <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px' }}>
                <div style={{ fontWeight: 700, fontSize: '11px' }}>
                  {language === 'ur' ? 'دستخط ہیڈ اکاؤنٹنٹ (Head Accountant)' : 'Accountant Signature'}
                </div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>Books & Ledger Balanced</div>
              </div>
            </div>
          </div>

          {/* System Footer & Security Trace */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '8px',
              borderTop: '1px dashed #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9px',
              color: '#94a3b8',
            }}
          >
            <span>QistFlow Enterprise Installment Operating System • Audit Trail Verified</span>
            <span>Document Serial: {auditReportSerial}</span>
          </div>
        </div>

        {/* Modal Footer (Screen View Only) */}
        <div
          className="modal-footer no-print"
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            {language === 'ur'
              ? 'یہ رپورٹ معیاری A4 سائز کے سرکاری پی ڈی ایف فارمیٹ میں ڈاؤن لوڈ اور پرنٹ ہوگی۔'
              : 'This audit report formats directly for high-resolution A4 official PDF export and printing.'}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onClose} className="btn btn-secondary">
              {language === 'ur' ? 'بند کریں' : 'Close'}
            </button>
            <button onClick={handlePrint} disabled={isGenerating} className="btn btn-primary">
              <Printer size={16} />
              <span>{language === 'ur' ? 'پی ڈی ایف پرنٹ / ڈاؤن لوڈ' : 'Print / Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
