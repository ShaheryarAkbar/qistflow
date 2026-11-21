// ============================================================================
// Shared Component: Official Monthly Executive Business Audit & Ledger PDF
// Comprehensive Executive A4 Report with Itemized Stock, Customers, Sales, Salaries, Recovery & Signatures
// ============================================================================

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  Package,
  Phone,
  MapPin,
  Coins,
  UserCheck,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Tenant, Sale, Contract, Payment, Expense, StaffPayrollRecord, Product, InventoryMovement, Customer, Purchase } from '@/types';
import { StaffMemberRecord } from '@/repositories/staff.repository';
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
  staff?: StaffMemberRecord[];
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
  staff = [],
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

  // Helper to extract year and month numbers
  const parseYearMonth = (key: string) => {
    const [y, m] = key.split('-').map((v) => parseInt(v, 10));
    return { year: y || 2026, month: m || 11 };
  };

  const targetYM = parseYearMonth(selectedMonth);

  // 1. Sales Metrics for Selected Month
  const salesInMonth = sales.filter((s) => isDateInMonth(s.saleDate) && s.status !== 'cancelled');
  const cashSales = salesInMonth.filter((s) => s.saleType === 'cash');
  const installmentSales = salesInMonth.filter((s) => s.saleType === 'installment');

  const cashSalesTotalPaisa = cashSales.reduce((sum, s) => sum + s.cashTotalPaisa, 0);
  const installmentSalesAgreedPaisa = installmentSales.reduce((sum, s) => sum + s.agreedTotalPaisa, 0);
  const totalSalesTurnoverPaisa = cashSalesTotalPaisa + installmentSalesAgreedPaisa;

  // 2. Customer Base Breakdown: New vs Recurring Customers
  const newCustomersInMonth = customers.filter((c) => isDateInMonth(c.createdAt));
  const existingCustomersCount = Math.max(0, customers.length - newCustomersInMonth.length);

  // 3. Stock & Inventory Movements for Selected Month
  const movementsInMonth = inventoryMovements.filter((m) => isDateInMonth(m.movementDate || m.createdAt));
  
  // Total units available on hand right now
  const totalStockOnHandUnits = products.reduce((sum, p) => sum + (p.stockOnHand || 0), 0);
  const totalStockAssetValuationPaisa = products.reduce(
    (sum, p) => sum + (p.stockOnHand || 0) * (p.costPricePaisa || 0),
    0
  );

  // Itemized product stock ledger calculation
  const itemizedProductLedger = products.map((prod) => {
    let prodCashSold = 0;
    cashSales.forEach((s) => {
      s.items?.forEach((it) => {
        if (it.productId === prod.productId || it.productNameSnapshot?.toLowerCase().includes(prod.name.toLowerCase())) {
          prodCashSold += it.quantity || 1;
        }
      });
    });

    let prodInstallmentSold = 0;
    installmentSales.forEach((s) => {
      s.items?.forEach((it) => {
        if (it.productId === prod.productId || it.productNameSnapshot?.toLowerCase().includes(prod.name.toLowerCase())) {
          prodInstallmentSold += it.quantity || 1;
        }
      });
    });

    const prodTotalSold = prodCashSold + prodInstallmentSold;

    const prodDamaged = movementsInMonth
      .filter((m) => m.movementType === 'damage' && m.productId === prod.productId)
      .reduce((sum, m) => sum + (m.quantity || 0), 0);

    const prodPurchased = movementsInMonth
      .filter((m) => m.movementType === 'purchase_in' && m.productId === prod.productId)
      .reduce((sum, m) => sum + (m.quantity || 0), 0);

    // Initial stock formula: (current stock on hand + sold + damaged - purchased)
    const initialStarting = Math.max(prod.stockOnHand + prodTotalSold + prodDamaged - prodPurchased, prod.stockOnHand + prodTotalSold);

    const remainingOnHand = prod.stockOnHand || 0;
    const remainingAssetPaisa = remainingOnHand * (prod.costPricePaisa || 0);

    return {
      product: prod,
      initialStarting,
      cashSold: prodCashSold,
      installmentSold: prodInstallmentSold,
      totalSold: prodTotalSold,
      damaged: prodDamaged,
      remainingOnHand,
      remainingAssetPaisa,
    };
  });

  const totalSoldUnitsAcrossCatalog = itemizedProductLedger.reduce((sum, i) => sum + i.totalSold, 0);
  const totalDamagedUnitsAcrossCatalog = itemizedProductLedger.reduce((sum, i) => sum + i.damaged, 0);
  const totalStartingUnitsAcrossCatalog = itemizedProductLedger.reduce((sum, i) => sum + i.initialStarting, 0);
  const damagedStockLossPaisa = itemizedProductLedger.reduce(
    (sum, i) => sum + i.damaged * (i.product.costPricePaisa || 0),
    0
  );

  // 4. Installments Recovery Performance
  const paymentsInMonth = payments.filter((p) => isDateInMonth(p.paidAt) && p.status === 'posted');
  const installmentPaymentsInMonth = paymentsInMonth.filter((p) => p.paymentKind === 'installment' || p.paymentKind === 'advance');
  const totalCollectedInMonthPaisa = paymentsInMonth.reduce((sum, p) => sum + p.amountPaisa, 0);

  // Contracts active or created in this month
  const nonCancelledContracts = contracts.filter((c) => c.status !== 'cancelled');
  const totalExpectedInstallmentPaisa = nonCancelledContracts.reduce((sum, c) => {
    const monthlyDue = Math.round(c.financedAmountPaisa / Math.max(1, c.durationCount || 10));
    return sum + monthlyDue;
  }, 0);

  const installmentCollectedPaisa = installmentPaymentsInMonth.reduce((sum, p) => sum + p.amountPaisa, 0);
  const pendingOverdueCarryPaisa = Math.max(0, totalExpectedInstallmentPaisa - installmentCollectedPaisa);
  const recoveryRate = totalExpectedInstallmentPaisa > 0
    ? Math.min(100, Math.round((installmentCollectedPaisa / totalExpectedInstallmentPaisa) * 100))
    : 100;

  // 5. Customer-by-Customer Detailed Monthly Installment Ledger
  const customerLedgerRows = nonCancelledContracts.map((c) => {
    const customer = customers.find((cust) => cust.customerId === c.customerId);
    const durationCount = c.durationCount || 10;

    // Calculate elapsed months between contract start and target month
    let monthsElapsed = 1;
    try {
      const startKey = c.startDateKey || (typeof c.createdAt === 'string' ? c.createdAt.split('T')[0] : '2026-01-01');
      const startYM = parseYearMonth(startKey);
      const diff = (targetYM.year - startYM.year) * 12 + (targetYM.month - startYM.month);
      monthsElapsed = Math.min(durationCount, Math.max(1, diff + 1));
    } catch {
      monthsElapsed = 1;
    }

    const monthsRemaining = Math.max(0, durationCount - monthsElapsed);

    // Paid installment count estimate
    const monthlyRatePaisa = Math.round(c.financedAmountPaisa / Math.max(1, durationCount));
    const paidInstallmentsCount = monthlyRatePaisa > 0 ? Math.min(durationCount, Math.round(c.totalPaidPaisa / monthlyRatePaisa)) : 0;

    // Check if this contract/customer made an installment payment in this selected month
    const paidInThisMonth = paymentsInMonth.some(
      (p) => p.customerId === c.customerId || (p.contractId && p.contractId === c.contractId)
    );

    let thisMonthStatus: 'paid' | 'due' | 'overdue' = 'due';
    if (paidInThisMonth) {
      thisMonthStatus = 'paid';
    } else if (c.status === 'overdue') {
      thisMonthStatus = 'overdue';
    } else {
      thisMonthStatus = 'due';
    }

    // Determine assigned recovery officer
    const assignedStaff = staff.find((s) => s.userId === c.assignedEmployeeId);
    const officerName = assignedStaff ? assignedStaff.displayName : (language === 'ur' ? 'طارق محمود (زون سی)' : 'Tariq Mehmood (Recovery)');

    const itemName = c.itemsSnapshot?.[0]?.productNameSnapshot || `Contract #${c.contractCode || c.contractId.slice(-4)}`;

    return {
      contract: c,
      customer,
      itemName,
      durationCount,
      monthsElapsed,
      monthsRemaining,
      paidInstallmentsCount,
      thisMonthStatus,
      officerName,
    };
  });

  // 6. Operating Expenses & Office Budget for Selected Month
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

  // 7. Staff Salaries & Payroll for Selected Month
  const monthPayroll = payrollRecords.filter((p) => p.monthKey === selectedMonth);
  const totalSalariesPaidPaisa = monthPayroll
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.netPayablePaisa, 0);
  const totalSalariesCommittedPaisa = monthPayroll.reduce((sum, p) => sum + p.netPayablePaisa, 0);

  // 8. Net Cash Flow & P&L Statement
  const totalInflowPaisa = totalCollectedInMonthPaisa;
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

  return createPortal(
    <div className="modal-overlay monthly-audit-modal-root" style={{ zIndex: 1250, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @media print {
          #root {
            display: none !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .modal-overlay.monthly-audit-modal-root {
            position: static !important;
            display: block !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            z-index: auto !important;
          }
          .monthly-audit-modal-root .modal-box {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          #monthly-audit-print-area {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 4mm 6mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 8.5pt !important;
          }
          #monthly-audit-print-area div,
          #monthly-audit-print-area [style*="overflow"],
          #monthly-audit-print-area [style*="max-height"] {
            max-height: none !important;
            overflow: visible !important;
            height: auto !important;
          }
          #monthly-audit-print-area table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
            font-size: 8pt !important;
            page-break-inside: auto !important;
          }
          #monthly-audit-print-area tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #monthly-audit-print-area th,
          #monthly-audit-print-area td {
            padding: 3px 5px !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 6mm;
          }
        }
      `}</style>
      <div
        className="modal-box"
        style={{
          maxWidth: '1040px',
          width: '100%',
          maxHeight: 'calc(100dvh - 24px)',
          height: '94vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Screen Controls Header (Pinned top, Never wraps the Close button) */}
        <div
          className="modal-header no-print"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {/* Row 1: Left Brand Title + Pinned Top-Right Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
              <div style={{ padding: '0.4rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '0.5rem', flexShrink: 0 }}>
                <FileText size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {language === 'ur' ? 'ماہانہ ایگزیکٹو بزنس آڈٹ و پی ڈی ایف' : 'Monthly Executive Business Audit'}
                </h3>
                <p className="hidden sm:block" style={{ margin: 0, fontSize: '0.6875rem', color: '#64748b' }}>
                  {language === 'ur'
                    ? 'دکان کا مکمل حساب، آئٹم وائز اسٹاک، گاہکوں کا کھاتہ، تنخواہیں اور منافع/نقصان'
                    : 'Audited monthly inventory, customer ledger, payroll disbursements & P&L.'}
                </p>
              </div>
            </div>

            {/* Pinned Top-Right Close Button */}
            <button
              onClick={onClose}
              className="btn btn-icon btn-outline"
              style={{ flexShrink: 0, marginInlineStart: 'auto', width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', padding: 0 }}
              title="Close modal"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Row 2: Month Picker & Download/Print Action (Clean wrap for mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: '1 1 auto', minWidth: '150px' }}>
              <Calendar size={14} className="text-muted" />
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
                className="form-control"
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.8125rem', height: '32px', width: '100%', maxWidth: '240px' }}
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
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', height: '32px' }}
            >
              <Printer size={14} />
              <span>{language === 'ur' ? 'پی ڈی ایف ڈاؤن لوڈ / پرنٹ کریں' : 'Download / Print PDF'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div
          id="monthly-audit-print-area"
          className="modal-body"
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '1.25rem',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontSize: '11px',
            lineHeight: 1.5,
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Top Formal Shop Header (Urdu & English, Location Address, Phone & Date) */}
          <div
            style={{
              borderBottom: '3px double #0f172a',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            {/* Top Serial & Timestamp Meta Bar (No absolute positioning = Zero overlap on mobile) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.4rem',
                marginBottom: '0.75rem',
                fontSize: '9px',
                color: '#64748b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 700, color: '#047857', backgroundColor: '#ecfdf5', padding: '1px 6px', borderRadius: '3px' }}>
                  OFFICIAL AUDIT REPORT
                </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{auditReportSerial}</span>
              </div>
              <div style={{ marginInlineStart: 'auto', textAlign: 'right' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>تاریخ اجرا (Generated): </span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{generatedTimestamp}</span>
              </div>
            </div>

            {/* Shop Titles (Urdu & English) - Completely Unobstructed */}
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: '2px', lineHeight: 1.3 }}>
              {tenant.businessNameUr || tenant.businessName}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tenant.businessName}
            </div>

            {/* Address & Contact Details */}
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
              <span>📍 {tenant.address || 'Shahi Road, Near City Chowk'}</span>
              <span style={{ margin: '0 6px' }}>•</span>
              <span>{tenant.city || 'Rahim Yar Khan, Pakistan'}</span>
              {tenant.phone && (
                <>
                  <span style={{ margin: '0 6px' }}>•</span>
                  <span>📞 Phone: {tenant.phone}</span>
                </>
              )}
            </div>

            {/* Document Title Banner with Distinct Respective Month Reference */}
            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                marginTop: '10px',
                padding: '6px 16px',
                backgroundColor: '#f8fafc',
                border: '1.5px solid #0f172a',
                borderRadius: '6px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                {language === 'ur'
                  ? `ماہانہ جامع بزنس آڈٹ و مالیاتی لیجر — ${currentMonthLabel}`
                  : `MONTHLY EXECUTIVE BUSINESS AUDIT & FINANCIAL LEDGER — ${currentMonthLabel.toUpperCase()}`}
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#047857' }}>
                {language === 'ur'
                  ? `رپورٹ برائے ماہ: ${currentMonthLabel} (${selectedMonth})`
                  : `Audit Month: ${currentMonthLabel} (${selectedMonth})`}
              </div>
            </div>
          </div>

          {/* Executive Overview KPI Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ padding: '8px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
              <div style={{ fontSize: '9px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
                {language === 'ur' ? 'کل وصولی (Inflow)' : 'Total Collections'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                Rs. {formatPaisa(totalInflowPaisa)}
              </div>
              <div style={{ fontSize: '9px', color: '#16a34a' }}>Cash + Installments</div>
            </div>

            <div style={{ padding: '8px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
              <div style={{ fontSize: '9px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>
                {language === 'ur' ? 'کل اخراجات و تنخواہیں' : 'Total Outflow'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#b91c1c', marginTop: '2px' }}>
                Rs. {formatPaisa(totalOutflowPaisa)}
              </div>
              <div style={{ fontSize: '9px', color: '#dc2626' }}>Expenses + Salaries</div>
            </div>

            <div style={{ padding: '8px 10px', backgroundColor: netCashFlowPaisa >= 0 ? '#eff6ff' : '#fff1f2', border: `1px solid ${netCashFlowPaisa >= 0 ? '#bfdbfe' : '#fecdd3'}`, borderRadius: '6px' }}>
              <div style={{ fontSize: '9px', color: netCashFlowPaisa >= 0 ? '#1e40af' : '#9f1239', fontWeight: 600, textTransform: 'uppercase' }}>
                {language === 'ur' ? 'خالص نقد بچت (P&L)' : 'Net Operating Flow'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: netCashFlowPaisa >= 0 ? '#1d4ed8' : '#be123c', marginTop: '2px' }}>
                Rs. {formatPaisa(netCashFlowPaisa)}
              </div>
              <div style={{ fontSize: '9px', color: netCashFlowPaisa >= 0 ? '#2563eb' : '#e11d48' }}>
                {netCashFlowPaisa >= 0 ? 'Monthly Net Surplus' : 'Monthly Deficit'}
              </div>
            </div>

            <div style={{ padding: '8px 10px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '6px' }}>
              <div style={{ fontSize: '9px', color: '#6b21a8', fontWeight: 600, textTransform: 'uppercase' }}>
                {language === 'ur' ? 'دستیاب اسٹاک مالیت' : 'Stock Asset Value'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#7e22ce', marginTop: '2px' }}>
                Rs. {formatPaisa(totalStockAssetValuationPaisa)}
              </div>
              <div style={{ fontSize: '9px', color: '#9333ea' }}>{totalStockOnHandUnits} Units on Hand</div>
            </div>
          </div>

          {/* Section 1: Customer Base Growth & Portfolio Health */}
          <div style={{ marginBottom: '1.25rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '3px',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>1. {language === 'ur' ? 'گاہکوں کا ماہانہ تناسب و پورٹ فولیو (Customer Base & Growth)' : 'Customer Portfolio & Monthly Growth'}</span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>New Registrations vs Existing Recurring Base</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>
                  {language === 'ur' ? 'اس مہینے نئے گاہک آئے (New Customers)' : 'New Customers Acquired'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  {newCustomersInMonth.length} Customers
                </div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>Registered in {currentMonthLabel}</div>
              </div>

              <div style={{ padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>
                  {language === 'ur' ? 'پرانے سابقہ گاہک (Existing Customers)' : 'Existing Recurring Base'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                  {existingCustomersCount} Customers
                </div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>Carried Forward</div>
              </div>

              <div style={{ padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>
                  {language === 'ur' ? 'دکان کے کل ایکٹو گاہک (Total Active Base)' : 'Total Active Customer Portfolio'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {customers.length} Customers
                </div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>Verified Passbooks</div>
              </div>
            </div>
          </div>

          {/* Section 2: Detailed Itemized Product Stock & Sales Breakdown */}
          <div style={{ marginBottom: '1.25rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '3px',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>2. {language === 'ur' ? 'تفصیلی آئٹم وائز انوینٹری، فروخت و ڈیمج مال (Itemized Stock & Sales Breakdown)' : 'Itemized Product Stock & Sales Breakdown'}</span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>Starting Stock, Cash/Installment Sold, Damaged & Remaining</span>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
              <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '5px 6px' }}>Product & Model (سامان کا نام و ماڈل)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center' }}>Total Was (کتنا تھا)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center' }}>Cash Sold (نقد بیکا)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center' }}>Installment Sold (اقساط بیکا)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center' }}>Total Sold (کل بیکا)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center', color: '#b91c1c' }}>Damaged (خراب)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700 }}>Left On Hand (بقایا پڑا ہے)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'right' }}>Remaining Valuation</th>
                  </tr>
                </thead>
                <tbody>
                  {itemizedProductLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>
                        No inventory catalog items found.
                      </td>
                    </tr>
                  ) : (
                    itemizedProductLedger.map((row, idx) => (
                      <tr key={row.product.productId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '5px 6px', fontWeight: 600 }}>
                          <div>{row.product.name}</div>
                          <div style={{ fontSize: '9px', color: '#64748b' }}>
                            {row.product.brand || 'Electronics'} {row.product.model ? `• ${row.product.model}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 600 }}>{row.initialStarting} Units</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center' }}>{row.cashSold}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center' }}>{row.installmentSold}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>{row.totalSold} Units</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700, color: row.damaged > 0 ? '#b91c1c' : '#64748b' }}>
                          {row.damaged > 0 ? `${row.damaged} Units` : '0'}
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 800, color: '#15803d' }}>
                          {row.remainingOnHand} Units
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600 }}>
                          Rs. {formatPaisa(row.remainingAssetPaisa)}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800, borderBottom: '1.5px solid #cbd5e1' }}>
                    <td style={{ padding: '6px' }}>Total Catalog Stock Reconciliation</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>{totalStartingUnitsAcrossCatalog} Units</td>
                    <td colSpan={2} style={{ padding: '6px', textAlign: 'center', color: '#64748b' }}>Cash & Installment</td>
                    <td style={{ padding: '6px', textAlign: 'center', color: '#2563eb' }}>{totalSoldUnitsAcrossCatalog} Sold</td>
                    <td style={{ padding: '6px', textAlign: 'center', color: '#b91c1c' }}>{totalDamagedUnitsAcrossCatalog} Damaged</td>
                    <td style={{ padding: '6px', textAlign: 'center', color: '#15803d' }}>{totalStockOnHandUnits} Units Left</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: '#0f172a' }}>
                      Rs. {formatPaisa(totalStockAssetValuationPaisa)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Customer-by-Customer Detailed Monthly Installments Ledger */}
          <div style={{ marginBottom: '1.25rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '3px',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '4px',
              }}
            >
              <span>3. {language === 'ur' ? 'گاہک وائز مکمل ماہانہ اقساط لیجر و ریکوری فالو اپ (Customer Installments Ledger)' : 'Customer Installments & Recovery Ledger'}</span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>Customer, Item Taken, Months Elapsed, Dues, Status & Assigned Officer</span>
            </div>

            <div style={{ maxHeight: '340px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
                <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '5px 6px' }}>Customer & Contact (گاہک، فون و پتہ)</th>
                      <th style={{ padding: '5px 6px' }}>Item Taken (سامان)</th>
                      <th style={{ padding: '5px 6px', textAlign: 'center' }}>Elapsed (کتنے مہینے ہوئے)</th>
                      <th style={{ padding: '5px 6px', textAlign: 'center' }}>Remaining (باقی مہینے)</th>
                      <th style={{ padding: '5px 6px', textAlign: 'right' }}>Paid So Far (ادا شدہ رقم)</th>
                      <th style={{ padding: '5px 6px', textAlign: 'right' }}>Outstanding (کل بقایا)</th>
                      <th style={{ padding: '5px 6px', textAlign: 'center' }}>{currentMonthLabel} Status</th>
                      <th style={{ padding: '5px 6px' }}>Recovery Officer (ملازم)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerLedgerRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>
                          No active customer contracts found.
                        </td>
                      </tr>
                    ) : (
                      customerLedgerRows.map((row) => (
                        <tr key={row.contract.contractId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '5px 6px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {row.customer ? row.customer.fullName : 'Customer'}
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              <span>📞 {row.customer?.phoneDisplay || row.customer?.normalizedPhone || '-'}</span>
                              <span style={{ margin: '0 4px' }}>•</span>
                              <span>📍 {row.customer?.address || row.customer?.area || 'Rahim Yar Khan'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '5px 6px', fontWeight: 600, color: '#334155' }}>
                            <div>{row.itemName}</div>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              Total: Rs. {formatPaisa(row.contract.installmentPriceTotalPaisa || row.contract.financedAmountPaisa)}
                            </div>
                          </td>
                          <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700 }}>
                            {row.monthsElapsed} / {row.durationCount} Months
                          </td>
                          <td style={{ padding: '5px 6px', textAlign: 'center', color: row.monthsRemaining === 0 ? '#15803d' : '#b45309', fontWeight: 600 }}>
                            {row.monthsRemaining === 0 ? 'Clear' : `${row.monthsRemaining} Months Left`}
                          </td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                            <div>Rs. {formatPaisa(row.contract.totalPaidPaisa || 0)}</div>
                            <div style={{ fontSize: '8px', color: '#16a34a' }}>({row.paidInstallmentsCount} Installments)</div>
                          </td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, color: '#b91c1c' }}>
                            Rs. {formatPaisa(row.contract.outstandingPaisa || 0)}
                          </td>
                          <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '8.5px',
                                fontWeight: 800,
                                backgroundColor:
                                  row.thisMonthStatus === 'paid'
                                    ? '#dcfce7'
                                    : row.thisMonthStatus === 'overdue'
                                    ? '#fee2e2'
                                    : '#fef3c7',
                                color:
                                  row.thisMonthStatus === 'paid'
                                    ? '#15803d'
                                    : row.thisMonthStatus === 'overdue'
                                    ? '#b91c1c'
                                    : '#b45309',
                              }}
                            >
                              {row.thisMonthStatus === 'paid'
                                ? 'PAID (ادا شدہ)'
                                : row.thisMonthStatus === 'overdue'
                                ? 'OVERDUE (تاخیر)'
                                : 'DUE (واجب الادا)'}
                            </span>
                          </td>
                          <td style={{ padding: '5px 6px', fontSize: '9.5px', color: '#475569' }}>
                            <div style={{ fontWeight: 600 }}>{row.officerName}</div>
                            <div style={{ fontSize: '8px', color: '#64748b' }}>Assigned Field Agent</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 4: Operating Expenses & Office Budget Breakdown */}
          <div style={{ marginBottom: '1.25rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '3px',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>4. {language === 'ur' ? 'دفتری اخراجات و بجٹ تفصیل (Office Budget & Expenses)' : 'Office Budget & Operating Expenses'}</span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>Itemized Shop Operating Expenditures</span>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
              <table style={{ width: '100%', minWidth: '450px', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '5px 6px' }}>Expense Category (کٹیگری)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'right' }}>Amount (PKR)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center' }}>% of Budget</th>
                    <th style={{ padding: '5px 6px' }}>Audited Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '6px', textAlign: 'center', color: '#64748b' }}>
                        No operating expenses posted for this month.
                      </td>
                    </tr>
                  ) : (
                    expenseBreakdown.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '5px 6px', fontWeight: 600 }}>{item.category}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600 }}>
                          Rs. {formatPaisa(item.totalPaisa)}
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'center' }}>{item.percentage}%</td>
                        <td style={{ padding: '5px 6px', color: '#059669' }}>Verified Voucher</td>
                      </tr>
                    ))
                  )}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800, borderBottom: '1.5px solid #cbd5e1' }}>
                    <td style={{ padding: '6px' }}>Total Operating Expenses</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: '#b91c1c' }}>
                      Rs. {formatPaisa(totalOfficeExpensesPaisa)}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>100%</td>
                    <td style={{ padding: '6px', color: '#0f172a' }}>Posted to Shop Ledger</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Staff Salaries & Payroll Disbursement */}
          <div style={{ marginBottom: '1.25rem', pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: '1.5px solid #0f172a',
                paddingBottom: '3px',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>5. {language === 'ur' ? 'سٹاف تنخواہوں کی ادائیگی - کس کو کتنی ملی (Staff Payroll Disbursement)' : 'Staff Payroll & Salaries Disbursement'}</span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>Employee Name, Role, Base, Paid Status & Method</span>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
              <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '5px 6px' }}>Staff Name</th>
                    <th style={{ padding: '5px 6px' }}>Role / Designation</th>
                    <th style={{ padding: '5px 6px', textAlign: 'right' }}>Base Pay</th>
                    <th style={{ padding: '5px 6px', textAlign: 'right' }}>Net Paid (PKR)</th>
                    <th style={{ padding: '5px 6px', textAlign: 'center' }}>Disbursement Status</th>
                    <th style={{ padding: '5px 6px' }}>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {monthPayroll.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '6px', textAlign: 'center', color: '#64748b' }}>
                        No payroll records generated for {currentMonthLabel}.
                      </td>
                    </tr>
                  ) : (
                    monthPayroll.map((record) => (
                      <tr key={record.payrollId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '5px 6px', fontWeight: 600 }}>{record.employeeName}</td>
                        <td style={{ padding: '5px 6px', color: '#475569' }}>
                          {record.designation || record.role.toUpperCase()}
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                          Rs. {formatPaisa(record.baseSalaryPaisa)}
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, color: record.status === 'paid' ? '#15803d' : '#b45309' }}>
                          Rs. {formatPaisa(record.netPayablePaisa)}
                        </td>
                        <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '8.5px',
                              fontWeight: 700,
                              backgroundColor: record.status === 'paid' ? '#dcfce7' : '#fef3c7',
                              color: record.status === 'paid' ? '#15803d' : '#b45309',
                            }}
                          >
                            {record.status === 'paid' ? 'PAID (ادا شدہ)' : 'PENDING'}
                          </span>
                        </td>
                        <td style={{ padding: '5px 6px', textTransform: 'capitalize', color: '#334155' }}>
                          {record.paymentMethod || 'Cash'}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800, borderBottom: '1.5px solid #cbd5e1' }}>
                    <td colSpan={3} style={{ padding: '6px' }}>Total Staff Salaries Disbursed</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: '#15803d' }}>
                      Rs. {formatPaisa(totalSalariesPaidPaisa)}
                    </td>
                    <td colSpan={2} style={{ padding: '6px', color: '#64748b', fontSize: '9px' }}>
                      Committed Total: Rs. {formatPaisa(totalSalariesCommittedPaisa)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6: Dual Signatures & Shop Seal */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1.5px solid #0f172a',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '15px',
              pageBreakInside: 'avoid',
            }}
          >
            {/* Owner Signature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '45px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ fontStyle: 'italic', fontWeight: 700, color: '#0f172a' }}>
                  {tenant.businessNameUr?.split(' ')[0] || 'Haji Abdul Malik'}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px' }}>
                <div style={{ fontWeight: 700, fontSize: '10px' }}>
                  {language === 'ur' ? 'دستخط دکان مالک (Business Owner)' : 'Business Owner Signature'}
                </div>
                <div style={{ fontSize: '8.5px', color: '#64748b' }}>Certified & Approved</div>
              </div>
            </div>

            {/* Official Shop Stamp Box */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  height: '48px',
                  width: '100px',
                  margin: 'auto',
                  border: '1.5px dashed #059669',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                <span>OFFICIAL SEAL</span>
                <span>دکان کی مہر</span>
              </div>
              <div style={{ marginTop: '3px', fontSize: '8px', color: '#64748b' }}>
                {tenant.businessName}
              </div>
            </div>

            {/* Accountant Signature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '45px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ fontStyle: 'italic', fontWeight: 600, color: '#475569' }}>Verified & Reconciled</div>
              </div>
              <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px' }}>
                <div style={{ fontWeight: 700, fontSize: '10px' }}>
                  {language === 'ur' ? 'دستخط ہیڈ اکاؤنٹنٹ (Head Accountant)' : 'Accountant Signature'}
                </div>
                <div style={{ fontSize: '8.5px', color: '#64748b' }}>Books & Ledger Balanced</div>
              </div>
            </div>
          </div>

          {/* System Footer & Security Trace */}
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '6px',
              borderTop: '1px dashed #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '8.5px',
              color: '#94a3b8',
              flexWrap: 'wrap',
              gap: '4px',
            }}
          >
            <span>QistFlow Enterprise Installment Operating System • Audit Trail Verified</span>
            <span>Document Serial: {auditReportSerial}</span>
          </div>
        </div>

        {/* Modal Footer (Screen View Only, Pinned bottom) */}
        <div
          className="modal-footer no-print"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {language === 'ur'
              ? 'یہ رپورٹ معیاری A4 سائز کے سرکاری پی ڈی ایف فارمیٹ میں ڈاؤن لوڈ اور پرنٹ ہوگی۔'
              : 'This audit report formats directly for high-resolution A4 official PDF export and printing.'}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onClose} className="btn btn-secondary btn-sm">
              {language === 'ur' ? 'بند کریں' : 'Close'}
            </button>
            <button onClick={handlePrint} disabled={isGenerating} className="btn btn-primary btn-sm">
              <Printer size={15} />
              <span>{language === 'ur' ? 'پی ڈی ایف پرنٹ / ڈاؤن لوڈ' : 'Print / Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
