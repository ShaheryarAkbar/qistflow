// ============================================================================
// Expenses Feature: Shop Operating Expenses & Staff Payroll Register
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  PlusCircle,
  Search,
  Tag,
  CheckCircle,
  X,
  Edit3,
  Users,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Expense, PaymentMethod, StaffPayrollRecord } from '@/types';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { StaffRepository, StaffMemberRecord } from '@/repositories/staff.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { rupeesToPaisa, paisaToRupees } from '@/domain/money/paisa';

export const ExpensesPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant, isOwner, isManager } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'expenses' | 'payroll'>('expenses');

  // Operating Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Expense Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [category, setCategory] = useState('Rent');
  const [amountRupees, setAmountRupees] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit Expense Modal
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editCategory, setEditCategory] = useState('Rent');
  const [editAmountRupees, setEditAmountRupees] = useState('');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('cash');
  const [editDescription, setEditDescription] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editDate, setEditDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Payroll state
  const [payrollRecords, setPayrollRecords] = useState<StaffPayrollRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMemberRecord[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026-11');

  // Pay Salary Modal
  const [payingRecord, setPayingRecord] = useState<StaffPayrollRecord | null>(null);
  const [payAmountRupees, setPayAmountRupees] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payNotes, setPayNotes] = useState('');
  const [savingPay, setSavingPay] = useState(false);

  // Edit Staff Salary Modal
  const [editingSalaryStaff, setEditingSalaryStaff] = useState<StaffMemberRecord | null>(null);
  const [newSalaryRupees, setNewSalaryRupees] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [savingStaffSalary, setSavingStaffSalary] = useState(false);

  const categories = [
    'Rent',
    'Electricity',
    'Salaries (تنخواہیں)',
    'Transport / Fuel',
    'Tea & Hospitality',
    'Maintenance / Repairs',
    'Office Supplies',
    'Other',
  ];

  const loadExpenses = async () => {
    if (!activeTenant) return;
    setLoadingExpenses(true);
    try {
      const data = await ExpenseRepository.getExpenses(activeTenant.tenantId, isDemoUser);
      setExpenses(data);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const loadPayroll = async () => {
    if (!activeTenant) return;
    setLoadingPayroll(true);
    try {
      const [records, staff] = await Promise.all([
        StaffRepository.getPayrollRecords(activeTenant.tenantId, selectedMonth, isDemoUser),
        StaffRepository.getStaffMembers(activeTenant.tenantId, isDemoUser),
      ]);
      setPayrollRecords(records);
      setStaffMembers(staff);
    } finally {
      setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeTenant, isDemoUser]);

  useEffect(() => {
    if (activeTab === 'payroll') {
      loadPayroll();
    }
  }, [activeTab, activeTenant, selectedMonth, isDemoUser]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !amountRupees) return;

    setSaving(true);
    try {
      await ExpenseRepository.recordExpense({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        category,
        amountPaisa: rupeesToPaisa(amountRupees),
        method,
        description,
        reference,
        isDemo: isDemoUser,
      });

      setAmountRupees('');
      setDescription('');
      setReference('');
      setIsAddModalOpen(false);
      await loadExpenses();
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setEditCategory(exp.category);
    setEditAmountRupees(paisaToRupees(exp.amountPaisa).toString());
    setEditMethod(exp.method);
    setEditDescription(exp.description || '');
    setEditReference(exp.reference || '');
    setEditDate(typeof exp.expenseDate === 'string' ? exp.expenseDate.split('T')[0] : '');
  };

  const handleSaveEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !editingExpense || !editAmountRupees) return;

    setSavingEdit(true);
    try {
      await ExpenseRepository.updateExpense({
        tenantId: activeTenant.tenantId,
        expenseId: editingExpense.expenseId,
        data: {
          category: editCategory,
          amountPaisa: rupeesToPaisa(editAmountRupees),
          method: editMethod,
          description: editDescription,
          reference: editReference,
          expenseDate: editDate ? new Date(editDate).toISOString() as any : undefined,
        },
        userId: currentUser.uid,
        isDemo: isDemoUser,
      });

      setEditingExpense(null);
      await loadExpenses();
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenPaySalary = (record: StaffPayrollRecord) => {
    setPayingRecord(record);
    setPayAmountRupees(paisaToRupees(record.netPayablePaisa).toString());
    setPayMethod('cash');
    setPayNotes(`Monthly salary for ${selectedMonth}`);
  };

  const handleConfirmPaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !payingRecord || !payAmountRupees) return;

    setSavingPay(true);
    try {
      await StaffRepository.paySalary({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        payrollId: payingRecord.payrollId,
        amountPaisa: rupeesToPaisa(payAmountRupees),
        paymentMethod: payMethod,
        notes: payNotes,
        isDemo: isDemoUser,
      });

      setPayingRecord(null);
      await loadPayroll();
      await loadExpenses();
    } finally {
      setSavingPay(false);
    }
  };

  const handleOpenEditSalary = (staff: StaffMemberRecord) => {
    setEditingSalaryStaff(staff);
    setNewSalaryRupees(paisaToRupees(staff.monthlySalaryPaisa || 0).toString());
    setNewDesignation(staff.designation || '');
  };

  const handleSaveStaffSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !editingSalaryStaff || !newSalaryRupees) return;

    setSavingStaffSalary(true);
    try {
      await StaffRepository.updateStaffSalary(
        activeTenant.tenantId,
        editingSalaryStaff.userId,
        rupeesToPaisa(newSalaryRupees),
        newDesignation,
        isDemoUser
      );

      setEditingSalaryStaff(null);
      await loadPayroll();
    } finally {
      setSavingStaffSalary(false);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const desc = exp.description?.toLowerCase() || '';
    const cat = exp.category.toLowerCase();
    const matchesSearch = desc.includes(q) || cat.includes(q);
    return matchesCategory && matchesSearch;
  });

  const totalExpensePaisa = filteredExpenses.reduce((sum, e) => sum + e.amountPaisa, 0);

  // Payroll Totals
  const totalPayrollPaisa = payrollRecords.reduce((sum, r) => sum + r.netPayablePaisa, 0);
  const paidPayrollPaisa = payrollRecords.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.netPayablePaisa, 0);
  const pendingPayrollPaisa = Math.max(0, totalPayrollPaisa - paidPayrollPaisa);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.expenses')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'دکان کے تمام کاروباری اخراجات، بجلی، بلز اور ملازمین کی تنخواہیں'
              : 'Shop operational expenditures, utility bills, rent and staff salary register.'}
          </p>
        </div>

        {activeTab === 'expenses' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>{language === 'ur' ? 'نیا خرچہ درج کریں' : 'Record Expense'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`btn btn-sm ${activeTab === 'expenses' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <Building size={14} />
          <span>{language === 'ur' ? 'دکان کے عمومی اخراجات' : 'Operating Expenses'}</span>
          <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>{expenses.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`btn btn-sm ${activeTab === 'payroll' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <Users size={14} />
          <span>{language === 'ur' ? 'ملازمین کی تنخواہیں (Staff Payroll)' : 'Staff Salaries & Payroll'}</span>
          <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>{payrollRecords.length}</span>
        </button>
      </div>

      {/* TAB 1: OPERATING EXPENSES */}
      {activeTab === 'expenses' && (
        <>
          {/* KPI & Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card">
              <div className="stat-icon icon-rose">
                <DollarSign size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Filtered Expenses</div>
                <div className="stat-value text-danger">
                  <MoneyDisplay paisa={totalExpensePaisa} />
                </div>
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={16} className="text-muted" />
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '160px' }}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="card">
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('common.date')}</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingExpenses ? (
                    <tr>
                      <td colSpan={7} className="text-center" style={{ padding: '2rem' }}>
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                        {t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.expenseId}>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {typeof exp.expenseDate === 'string'
                            ? exp.expenseDate.split('T')[0]
                            : 'Recent'}
                        </td>
                        <td>
                          <span className="badge badge-slate">{exp.category}</span>
                        </td>
                        <td>
                          <div className="font-semibold">{exp.description || '—'}</div>
                          {exp.reference && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Ref: {exp.reference}</div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-slate">{exp.method.toUpperCase()}</span>
                        </td>
                        <td>
                          <MoneyDisplay paisa={exp.amountPaisa} className="font-bold text-danger" />
                        </td>
                        <td>
                          <span className="badge badge-success">POSTED</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenEditExpense(exp)}
                            className="btn btn-sm btn-outline text-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                            title={language === 'ur' ? 'خرچہ درست کریں' : 'Edit Expense'}
                          >
                            <Edit3 size={13} />
                            <span>{language === 'ur' ? 'درستی' : 'Edit'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: STAFF PAYROLL REGISTER */}
      {activeTab === 'payroll' && (
        <>
          {/* Payroll Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card">
              <div className="stat-icon icon-indigo">
                <Users size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Monthly Payroll</div>
                <div className="stat-value text-slate-800">
                  <MoneyDisplay paisa={totalPayrollPaisa} />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-emerald">
                <CheckCircle2 size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Paid This Month</div>
                <div className="stat-value text-success">
                  <MoneyDisplay paisa={paidPayrollPaisa} />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon icon-amber">
                <DollarSign size={22} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Pending Salaries</div>
                <div className="stat-value text-warning">
                  <MoneyDisplay paisa={pendingPayrollPaisa} />
                </div>
              </div>
            </div>
          </div>

          {/* Month Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} className="text-muted" />
              <span className="font-semibold" style={{ fontSize: '0.875rem' }}>
                {language === 'ur' ? 'مہینہ برائے تنخواہ:' : 'Payroll Month:'}
              </span>
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '150px' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="2026-11">November 2026</option>
                <option value="2026-10">October 2026</option>
                <option value="2026-09">September 2026</option>
              </select>
            </div>

            <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
              {language === 'ur'
                ? 'تنخواہ کی ادائیگی کا اندراج خودکار طور پر دکان کے اخراجات میں ظاہر ہوگا'
                : 'Recorded salaries automatically flow into Shop Operating Expenses'}
            </div>
          </div>

          {/* Payroll Table */}
          <div className="card">
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{language === 'ur' ? 'ملازم کا نام' : 'Employee Name'}</th>
                    <th>{language === 'ur' ? 'عہدہ / رول' : 'Designation / Role'}</th>
                    <th>{language === 'ur' ? 'ماہانہ تنخواہ' : 'Basic Salary'}</th>
                    <th>{language === 'ur' ? 'قابل ادائیگی' : 'Net Payable'}</th>
                    <th>{language === 'ur' ? 'کیفیت' : 'Status'}</th>
                    <th>{language === 'ur' ? 'ادائیگی تاریخ / ذریعہ' : 'Paid Date / Method'}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPayroll ? (
                    <tr>
                      <td colSpan={7} className="text-center" style={{ padding: '2rem' }}>
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : payrollRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                        {t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    payrollRecords.map((r) => {
                      const staffInfo = staffMembers.find((s) => s.userId === r.userId);
                      const isPaid = r.status === 'paid';

                      return (
                        <tr key={r.payrollId}>
                          <td>
                            <div className="font-semibold">{r.employeeName}</div>
                            {staffInfo?.phone && (
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{staffInfo.phone}</div>
                            )}
                          </td>
                          <td>
                            <div className="font-semibold text-slate-700" style={{ fontSize: '0.8125rem' }}>
                              {r.designation}
                            </div>
                            <span className="badge badge-slate" style={{ fontSize: '0.6875rem' }}>
                              {r.role.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <MoneyDisplay paisa={r.baseSalaryPaisa} className="text-slate-700 font-semibold" />
                          </td>
                          <td>
                            <MoneyDisplay paisa={r.netPayablePaisa} className="font-bold text-slate-900" />
                          </td>
                          <td>
                            <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                              {isPaid ? (language === 'ur' ? 'ادا شدہ' : 'PAID') : (language === 'ur' ? 'باقی' : 'PENDING')}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>
                            {isPaid ? (
                              <div>
                                <span className="font-semibold text-emerald-700">{r.paidAt || 'Done'}</span>
                                {r.paymentMethod && (
                                  <span className="badge badge-slate ml-1" style={{ fontSize: '0.6875rem' }}>
                                    {r.paymentMethod.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                              {!isPaid && (isOwner || isManager) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaySalary(r)}
                                  className="btn btn-sm btn-primary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  <CheckCircle size={12} />
                                  <span>{language === 'ur' ? 'تنخواہ ادا کریں' : 'Pay'}</span>
                                </button>
                              )}

                              {isPaid && (
                                <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                                  ✓ Cleared
                                </span>
                              )}

                              {isOwner && staffInfo && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSalary(staffInfo)}
                                  className="btn btn-sm btn-outline text-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  title={language === 'ur' ? 'تنخواہ یا عہدہ تبدیل کریں' : 'Edit salary settings'}
                                >
                                  <Edit3 size={12} />
                                  <span>{language === 'ur' ? 'تنظیم' : 'Edit'}</span>
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
        </>
      )}

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{language === 'ur' ? 'دکان کا نیا خرچہ درج کریں' : 'Record Operating Expense'}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'کیٹیگری' : 'Category'}</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'رقم (روپے)' : 'Amount (Rs.)'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 35000"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'ادائیگی کا طریقہ' : 'Payment Method'}</label>
                  <select
                    className="form-select"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Cash (نقد)</option>
                    <option value="bank">Bank Transfer (بینک)</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">Easypaisa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'تفصیل / نوٹ' : 'Description / Remarks'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Shahi Road shop rent / Generator fuel"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'بل یا رسید نمبر (اختیاری)' : 'Reference / Bill # (Optional)'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. MEPCO-987162"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <CheckCircle size={16} />
                  <span>{saving ? t('common.loading') : (language === 'ur' ? 'خرچہ محفوظ کریں' : 'Save Expense')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{language === 'ur' ? 'خرچہ کی درستی (Edit Expense)' : 'Edit Operating Expense'}</h3>
              <button onClick={() => setEditingExpense(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'کیٹیگری' : 'Category'}</label>
                  <select
                    className="form-select"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'رقم (روپے)' : 'Amount (Rs.)'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 35000"
                    value={editAmountRupees}
                    onChange={(e) => setEditAmountRupees(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'ادائیگی کا طریقہ' : 'Payment Method'}</label>
                  <select
                    className="form-select"
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Cash (نقد)</option>
                    <option value="bank">Bank Transfer (بینک)</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">Easypaisa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'تاریخ' : 'Date'}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'تفصیل / نوٹ' : 'Description / Remarks'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'بل یا رسید نمبر' : 'Reference / Bill #'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editReference}
                    onChange={(e) => setEditReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingExpense(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  <CheckCircle size={16} />
                  <span>{savingEdit ? t('common.loading') : (language === 'ur' ? 'تبدیلی محفوظ کریں' : 'Update Expense')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {payingRecord && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{language === 'ur' ? 'ملازم کی تنخواہ کی ادائیگی' : 'Pay Staff Salary'}</h3>
              <button onClick={() => setPayingRecord(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmPaySalary}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '0.875rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                  <div className="font-semibold text-slate-900" style={{ fontSize: '1rem' }}>{payingRecord.employeeName}</div>
                  <div className="text-muted" style={{ fontSize: '0.8125rem' }}>{payingRecord.designation} ({payingRecord.role.toUpperCase()})</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    <span className="text-muted">{language === 'ur' ? 'ماہ:' : 'Month:'} </span>
                    <span className="font-bold">{payingRecord.monthKey}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'رقم تنخواہ (روپے)' : 'Salary Amount (Rs.)'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={payAmountRupees}
                    onChange={(e) => setPayAmountRupees(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'ادائیگی کا ذریعہ' : 'Payment Method'}</label>
                  <select
                    className="form-select"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Cash (نقد ادا کی)</option>
                    <option value="bank">Bank Transfer (بینک ٹرانسفر)</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">Easypaisa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'نوٹ / ریمارکس' : 'Payment Notes'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Paid in full for November"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setPayingRecord(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingPay}>
                  <CheckCircle size={16} />
                  <span>{savingPay ? t('common.loading') : (language === 'ur' ? 'ادائیگی مکمل کریں' : 'Confirm Payment')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Salary Modal */}
      {editingSalaryStaff && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{language === 'ur' ? 'ملازم کا عہدہ اور تنخواہ تبدیل کریں' : 'Update Staff Salary & Designation'}</h3>
              <button onClick={() => setEditingSalaryStaff(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStaffSalary}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <div className="font-semibold">{editingSalaryStaff.displayName}</div>
                  <div className="text-muted" style={{ fontSize: '0.8125rem' }}>{editingSalaryStaff.email}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'ماہانہ بنیادی تنخواہ (روپے)' : 'Monthly Basic Salary (Rs.)'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={newSalaryRupees}
                    onChange={(e) => setNewSalaryRupees(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'عہدہ / تفصیل' : 'Designation'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    placeholder="e.g. Shop Manager, Senior Recovery Officer, Office Support"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingSalaryStaff(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingStaffSalary}>
                  <CheckCircle size={16} />
                  <span>{savingStaffSalary ? t('common.loading') : (language === 'ur' ? 'محفوظ کریں' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
