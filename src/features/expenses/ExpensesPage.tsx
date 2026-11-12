// ============================================================================
// Expenses Feature: Shop Operating Expenses
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  PlusCircle,
  Search,
  Tag,
  DollarSign,
  CheckCircle,
  X,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Expense, PaymentMethod } from '@/types';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { rupeesToPaisa } from '@/domain/money/paisa';

export const ExpensesPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
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

  const categories = [
    'Rent',
    'Electricity',
    'Staff Salaries',
    'Transport / Fuel',
    'Tea & Hospitality',
    'Maintenance / Repairs',
    'Office Supplies',
    'Other',
  ];

  const loadExpenses = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await ExpenseRepository.getExpenses(activeTenant.tenantId, isDemoUser);
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeTenant, isDemoUser]);

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

  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const desc = exp.description?.toLowerCase() || '';
    const cat = exp.category.toLowerCase();
    const matchesSearch = desc.includes(q) || cat.includes(q);
    return matchesCategory && matchesSearch;
  });

  const totalExpensePaisa = filteredExpenses.reduce((sum, e) => sum + e.amountPaisa, 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.expenses')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'دکان کے اخراجات (کرایہ، بجلی، تنخواہیں، چائے وغیرہ) کا مکمل ریکارڈ'
              : 'Shop operational expenses, rent, bills, payroll and utilities.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          <span>{language === 'ur' ? 'نیا خرچہ درج کریں' : 'Record Expense'}</span>
        </button>
      </div>

      {/* KPI & Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon icon-rose">
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Selected Expenses</div>
            <div className="stat-value text-danger">
              <MoneyDisplay paisa={totalExpensePaisa} />
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-body" style={{ padding: '0.875rem 1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
              <Search size={16} className="text-muted" />
              <input
                type="text"
                className="form-input"
                style={{ border: 'none', padding: '0.25rem 0', boxShadow: 'none' }}
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={16} className="text-muted" />
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.25rem 0.75rem' }}
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center" style={{ padding: '2rem' }}>
                    {t('common.loading')}
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted" style={{ padding: '2rem' }}>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Record Operating Expense</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category</label>
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
                    <span>Amount (Rs.)</span>
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
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">Easypaisa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Remarks</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Shahi Road shop rent / Generator fuel"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reference / Bill # (Optional)</label>
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
                  <span>{saving ? t('common.loading') : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

