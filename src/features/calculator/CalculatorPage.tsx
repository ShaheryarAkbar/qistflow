// ============================================================================
// Quick Installment & Due Calculator (قسط اور حساب کتاب کیلکولیٹر)
// Multi-mode fast calculations for shop owners, managers, accountants, & recovery
// ============================================================================

import React, { useState } from 'react';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  DollarSign,
  Copy,
  Share2,
  Percent,
  Clock,
  Sparkles,
  HelpCircle,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { rupeesToPaisa, formatPKR } from '@/domain/money/paisa';

export const CalculatorPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();

  const [activeTab, setActiveTab] = useState<'plan' | 'payoff' | 'lumpsum'>('plan');
  const [copied, setCopied] = useState(false);

  // Tab 1: New Installment Plan State
  const [cashPrice, setCashPrice] = useState<number>(45000);
  const [advance, setAdvance] = useState<number>(10000);
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [markupType, setMarkupType] = useState<'percent' | 'fixed'>('percent');
  const [markupPercent, setMarkupPercent] = useState<number>(25);
  const [fixedTotal, setFixedTotal] = useState<number>(55000);

  // Tab 2: Overdue & Early Payoff State
  const [contractTotal, setContractTotal] = useState<number>(60000);
  const [totalPaid, setTotalPaid] = useState<number>(30000);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(5000);
  const [elapsedMonths, setElapsedMonths] = useState<number>(8);
  const [earlyDiscount, setEarlyDiscount] = useState<number>(2000);

  // Tab 3: Lump-sum Cash Allocation State
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(23000);
  const [targetMonthlyDue, setTargetMonthlyDue] = useState<number>(5000);

  // Calculations: Tab 1
  const financedAmount = Math.max(0, cashPrice - advance);
  let totalInstallmentPrice = 0;
  let totalProfit = 0;

  if (markupType === 'percent') {
    totalProfit = Math.round((financedAmount * markupPercent) / 100);
    totalInstallmentPrice = advance + financedAmount + totalProfit;
  } else {
    totalInstallmentPrice = Math.max(advance, fixedTotal);
    totalProfit = Math.max(0, totalInstallmentPrice - cashPrice);
  }

  const remainingFinanced = Math.max(0, totalInstallmentPrice - advance);
  const calculatedMonthly = durationMonths > 0 ? Math.round(remainingFinanced / durationMonths) : 0;

  // Calculations: Tab 2
  const remainingBalance = Math.max(0, contractTotal - totalPaid);
  const expectedPaidByNow = elapsedMonths * monthlyInstallment;
  const overdueAmount = Math.max(0, expectedPaidByNow - totalPaid);
  const earlyPayoffSettlement = Math.max(0, remainingBalance - earlyDiscount);

  // Calculations: Tab 3
  const clearedInstallmentsCount = targetMonthlyDue > 0 ? Math.floor(lumpSumAmount / targetMonthlyDue) : 0;
  const clearedTotalPaisa = clearedInstallmentsCount * targetMonthlyDue;
  const advanceCreditPaisa = Math.max(0, lumpSumAmount - clearedTotalPaisa);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getUrduPlanText = () => {
    return `*${activeTenant?.businessNameUr || activeTenant?.businessName || 'قسط فلو'} — اقساط کا حساب کتاب*
--------------------------------
• نقد قیمت: ${cashPrice.toLocaleString()} روپے
• پیشگی ایڈوانس: ${advance.toLocaleString()} روپے
• باقی قرض رقم: ${financedAmount.toLocaleString()} روپے
• مدت: ${durationMonths} ماہ
• کل قسط قیمت: ${totalInstallmentPrice.toLocaleString()} روپے
• ماہانہ قسط: ${calculatedMonthly.toLocaleString()} روپے
--------------------------------
رابطہ: ${activeTenant?.phone || ''}
${activeTenant?.city || 'رحیم یار خان'}`;
  };

  const getUrduPayoffText = () => {
    return `*${activeTenant?.businessNameUr || activeTenant?.businessName || 'قسط فلو'} — بقایا حساب کتاب*
--------------------------------
• کل معاہدہ رقم: ${contractTotal.toLocaleString()} روپے
• اب تک وصول شدہ: ${totalPaid.toLocaleString()} روپے
• واجب الادا بقایا رقم: ${overdueAmount.toLocaleString()} روپے
• کل بقایا بیلنس: ${remainingBalance.toLocaleString()} روپے
• فوری کلیئرنس پر فائنل رقم: ${earlyPayoffSettlement.toLocaleString()} روپے (رعایت: ${earlyDiscount.toLocaleString()})
--------------------------------
رابطہ: ${activeTenant?.phone || ''}`;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={26} className="text-primary" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              {language === 'ur' ? 'حساب کتاب و قسط کیلکولیٹر' : 'Installment & Due Calculator'}
            </h2>
          </div>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'نئی قسط کا تخمینہ، واجب الادا حساب، اور یک مشت رقم کی خودکار تقسیم'
              : 'Fast, on-the-spot financial calculations for shop owners, accountants, and field recovery staff.'}
          </p>
        </div>

        {/* Tab switcher pills */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '0.5rem', padding: '0.25rem' }}>
          <button
            onClick={() => setActiveTab('plan')}
            className={`btn btn-sm ${activeTab === 'plan' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 600 }}
          >
            {language === 'ur' ? 'نئی قسط کا تخمینہ' : 'New Plan'}
          </button>
          <button
            onClick={() => setActiveTab('payoff')}
            className={`btn btn-sm ${activeTab === 'payoff' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 600 }}
          >
            {language === 'ur' ? 'بقایا اور کلیئرنس' : 'Dues & Payoff'}
          </button>
          <button
            onClick={() => setActiveTab('lumpsum')}
            className={`btn btn-sm ${activeTab === 'lumpsum' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontWeight: 600 }}
          >
            {language === 'ur' ? 'رقم کی تقسیم' : 'Lump-sum Split'}
          </button>
        </div>
      </div>

      {copied && (
        <div className="alert alert-success mb-4">
          <CheckCircle2 size={18} />
          <span>{language === 'ur' ? 'حساب کتاب کامیابی سے کاپی ہو گیا! واٹس ایپ پر پیسٹ کریں۔' : 'Breakdown copied to clipboard! Ready to share.'}</span>
        </div>
      )}

      {/* ================= TAB 1: NEW INSTALLMENT PLAN ================= */}
      {activeTab === 'plan' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="md:col-span-6 card">
            <div className="card-header">
              <h3 className="card-title">
                {language === 'ur' ? 'معلومات درج کریں' : 'Installment Parameters'}
              </h3>
            </div>
            <div className="card-body">
              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'نقد قیمت (Cash Price PKR)' : 'Cash Price (PKR)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={cashPrice}
                  onChange={(e) => setCashPrice(Number(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'پیشگی ایڈوانس (Down Payment PKR)' : 'Down Payment / Advance (PKR)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={advance}
                  onChange={(e) => setAdvance(Number(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'مدت (Months)' : 'Duration (Months)'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  {[3, 6, 9, 12, 18].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`btn btn-sm ${durationMonths === m ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {m} M
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Custom Months"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value) || 0)}
                  min="1"
                />
              </div>

              {/* Profit Mode Switch */}
              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'منافع کا طریقہ' : 'Markup Calculation Method'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setMarkupType('percent')}
                    className={`btn btn-sm ${markupType === 'percent' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    <Percent size={14} />
                    <span>{language === 'ur' ? 'فیصد کے حساب سے (%)' : 'Percentage (%)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarkupType('fixed')}
                    className={`btn btn-sm ${markupType === 'fixed' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    <Coins size={14} />
                    <span>{language === 'ur' ? 'طے شدہ کل رقم' : 'Fixed Total Price'}</span>
                  </button>
                </div>

                {markupType === 'percent' ? (
                  <div>
                    <input
                      type="number"
                      className="form-input"
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(Number(e.target.value) || 0)}
                      min="0"
                    />
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {language === 'ur' ? 'باقی رقم پر منافع شرح' : 'Markup applied on financed principal'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      className="form-input"
                      value={fixedTotal}
                      onChange={(e) => setFixedTotal(Number(e.target.value) || 0)}
                      min={advance}
                    />
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {language === 'ur' ? 'کل قسط رقم (بشمول ایڈوانس)' : 'Agreed total price including advance'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Output Summary Column */}
          <div className="md:col-span-6">
            <div className="card" style={{ background: '#f8fafc', border: '2px solid #059669' }}>
              <div className="card-header" style={{ background: '#ecfdf5', borderBottom: '1px solid #a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} className="text-success" />
                    <h3 className="card-title text-success" style={{ margin: 0 }}>
                      {language === 'ur' ? 'حساب کا خلاصہ' : 'Calculated Plan Summary'}
                    </h3>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getUrduPlanText())}
                    className="btn btn-sm btn-outline"
                    title="Copy breakdown"
                  >
                    <Copy size={14} />
                    <span>{language === 'ur' ? 'کاپی کریں' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* Big Highlight: Monthly Installment */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    textAlign: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {language === 'ur' ? 'ماہانہ قسط کی رقم' : 'Monthly Installment'}
                  </div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#059669' }}>
                    Rs. {calculatedMonthly.toLocaleString()}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {durationMonths} {language === 'ur' ? 'ماہانہ اقساط' : 'monthly installments'}
                  </div>
                </div>

                {/* Detail Breakdown Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9375rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                    <span className="text-muted">{language === 'ur' ? 'نقد اصل قیمت' : 'Original Cash Price'}:</span>
                    <span className="font-semibold">Rs. {cashPrice.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                    <span className="text-muted">{language === 'ur' ? 'پیشگی ایڈوانس' : 'Down Payment'}:</span>
                    <span className="font-semibold text-success">- Rs. {advance.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                    <span className="text-muted">{language === 'ur' ? 'باقی قرض رقم (Financed)' : 'Financed Balance'}:</span>
                    <span className="font-semibold">Rs. {financedAmount.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                    <span className="text-muted">{language === 'ur' ? 'کل منافع رقم' : 'Estimated Markup'}:</span>
                    <span className="font-semibold text-primary">+ Rs. {totalProfit.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', fontSize: '1.125rem', fontWeight: 700 }}>
                    <span>{language === 'ur' ? 'کل قسط قیمت' : 'Total Installment Price'}:</span>
                    <span className="text-primary">Rs. {totalInstallmentPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(getUrduPlanText())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-block"
                  >
                    <Share2 size={16} />
                    <span>{language === 'ur' ? 'واٹس ایپ پر شیئر کریں' : 'Share on WhatsApp'}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: OVERDUE & EARLY PAYOFF ================= */}
      {activeTab === 'payoff' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 card">
            <div className="card-header">
              <h3 className="card-title">
                {language === 'ur' ? 'معاہدے کی معلومات' : 'Contract Standing'}
              </h3>
            </div>
            <div className="card-body">
              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'معاہدے کی کل قیمت (Total Contract Value)' : 'Total Contract Value (PKR)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={contractTotal}
                  onChange={(e) => setContractTotal(Number(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'اب تک وصول شدہ رقم (Paid So Far)' : 'Total Amount Paid (PKR)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={totalPaid}
                  onChange={(e) => setTotalPaid(Number(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'ماہانہ قسط کی رقم (Monthly Due Amount)' : 'Monthly Installment (PKR)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={monthlyInstallment}
                  onChange={(e) => setMonthlyInstallment(Number(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'گزشتہ ماہانہ اقساط کی تعداد (Elapsed Months)' : 'Elapsed Months so far'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={elapsedMonths}
                  onChange={(e) => setElapsedMonths(Number(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'فوری کلیئرنس رعایت (Early Settlement Discount)' : 'Early Settlement Discount (PKR)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={earlyDiscount}
                  onChange={(e) => setEarlyDiscount(Number(e.target.value) || 0)}
                  min="0"
                />
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {language === 'ur' ? 'اگر کسٹمر آج ہی سارا کھاتہ کلیئر کرے تو منافع میں رعایت' : 'Special rebate given for instant full clearance'}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-6">
            <div className="card" style={{ background: '#f8fafc', border: '2px solid #2563eb' }}>
              <div className="card-header" style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <h3 className="card-title text-primary" style={{ margin: 0 }}>
                    {language === 'ur' ? 'بقایا اور کلیئرنس پوزیشن' : 'Payoff & Outstanding Status'}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(getUrduPayoffText())}
                    className="btn btn-sm btn-outline"
                  >
                    <Copy size={14} />
                    <span>{language === 'ur' ? 'کاپی' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="card-body">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {language === 'ur' ? 'واجب الادا بقایا قسطیں' : 'Current Overdue Amount'}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: overdueAmount > 0 ? '#e11d48' : '#059669' }}>
                      Rs. {overdueAmount.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {language === 'ur' ? 'کل بقایا بیلنس' : 'Total Remaining Balance'}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                      Rs. {remainingBalance.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    textAlign: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <div className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {language === 'ur' ? 'فوری یک مشت کلیئرنس رقم' : 'Instant Final Clearance Amount'}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>
                    Rs. {earlyPayoffSettlement.toLocaleString()}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {language === 'ur' ? `(رعایت: Rs. ${earlyDiscount.toLocaleString()})` : `(Discount applied: Rs. ${earlyDiscount.toLocaleString()})`}
                  </div>
                </div>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getUrduPayoffText())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-block"
                >
                  <Share2 size={16} />
                  <span>{language === 'ur' ? 'واٹس ایپ پر بھیجیں' : 'Send via WhatsApp'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: LUMP-SUM ALLOCATION ================= */}
      {activeTab === 'lumpsum' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 card">
            <div className="card-header">
              <h3 className="card-title">
                {language === 'ur' ? 'یک مشت رقم کی تقسیم' : 'Lump-sum Amount Allocation'}
              </h3>
            </div>
            <div className="card-body">
              <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
                {language === 'ur'
                  ? 'کسٹمر جب غیر متوقع رقم لائے (مثلاً 23,000 روپے)، تو فوری جانیں کہ کتنے مہینوں کی قسطیں کلیئر ہوں گی اور کتنا ایڈوانس بچے گا۔'
                  : 'Instantly calculate how many future installments are covered when a customer brings an arbitrary lump-sum payment.'}
              </p>

              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'کسٹمر کی لائی گئی رقم (Customer Cash In Hand)' : 'Customer Payment (PKR)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={lumpSumAmount}
                  onChange={(e) => setLumpSumAmount(Number(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">
                  {language === 'ur' ? 'ماہانہ قسط کی طے شدہ رقم (Monthly Installment)' : 'Monthly Installment (PKR)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={targetMonthlyDue}
                  onChange={(e) => setTargetMonthlyDue(Number(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-6">
            <div className="card" style={{ background: '#f8fafc', border: '2px solid #8b5cf6' }}>
              <div className="card-header" style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
                <h3 className="card-title text-purple-700" style={{ margin: 0, color: '#7c3aed' }}>
                  {language === 'ur' ? 'تقسیم کا نتیجہ' : 'Allocation Breakdown'}
                </h3>
              </div>

              <div className="card-body">
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    textAlign: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <div className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {language === 'ur' ? 'مکمل ادا ہونے والی اقساط' : 'Full Installments Settled'}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#7c3aed' }}>
                    {clearedInstallmentsCount} {language === 'ur' ? 'ماہ' : 'Months'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
                    Rs. {clearedTotalPaisa.toLocaleString()} {language === 'ur' ? 'اقساط میں جمع ہوں گے' : 'settled to schedule'}
                  </div>
                </div>

                <div
                  style={{
                    background: advanceCreditPaisa > 0 ? '#ecfdf5' : '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
                    {language === 'ur' ? 'باقی بچنے والا ایڈوانس کریڈٹ' : 'Remaining Advance Credit'}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: advanceCreditPaisa > 0 ? '#059669' : '#64748b' }}>
                    Rs. {advanceCreditPaisa.toLocaleString()}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {language === 'ur'
                      ? 'یہ رقم اگلی قسط میں خودکار کٹوتی کے لیے محفوظ رہے گی'
                      : 'Held as advance credit applied to the next schedule entry'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
