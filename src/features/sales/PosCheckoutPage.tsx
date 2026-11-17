// ============================================================================
// Sales POS Feature: Point of Sale & Installment Contract Wizard
// Step 1: Select Customer
// Step 2: Basket & Stock Validation
// Step 3: Cash vs Installment Terms & Calendar Schedule Preview
// Step 4: Commit Sale, Snapshot Items, Decrement Inventory & Generate Installments
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Package,
  Calendar,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  Coins,
  Receipt,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Customer, Product, SaleItemSnapshot, ScheduleFrequency } from '@/types';
import { CustomerRepository } from '@/repositories/customer.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { StaffRepository, StaffMemberRecord } from '@/repositories/staff.repository';
import { RecoveryRepository } from '@/repositories/recovery.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { rupeesToPaisa } from '@/domain/money/paisa';
import { generateScheduleEntries } from '@/domain/schedules/generator';

export const PosCheckoutPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recoveryOfficers, setRecoveryOfficers] = useState<StaffMemberRecord[]>([]);
  const [assignedOfficerId, setAssignedOfficerId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [basket, setBasket] = useState<
    { product: Product; quantity: number; agreedPriceRupees?: string }[]
  >([]);

  // Terms state
  const [saleType, setSaleType] = useState<'installment' | 'cash'>('installment');
  const [advanceRupees, setAdvanceRupees] = useState<string>('10000');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('monthly');
  const [durationCount, setDurationCount] = useState<number>(6);
  const [firstDueDateKey, setFirstDueDateKey] = useState<string>(() => {
    // Default first installment to 30 days ahead
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [saving, setSaving] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    saleId: string;
    contractId?: string;
    assignedOfficerName?: string;
  } | null>(null);

  useEffect(() => {
    if (!activeTenant) return;
    const load = async () => {
      setLoading(true);
      try {
        const [cList, pList, staffList] = await Promise.all([
          CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser),
          ProductRepository.getProducts(activeTenant.tenantId, isDemoUser),
          StaffRepository.getStaffMembers(activeTenant.tenantId, isDemoUser),
        ]);
        setCustomers(cList);
        setProducts(pList);
        if (cList.length > 0) setSelectedCustomerId(cList[0].customerId);

        const recList = staffList.filter((s) => s.role === 'recovery');
        setRecoveryOfficers(recList);
        if (recList.length > 0) {
          setAssignedOfficerId(recList[0].userId);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTenant, isDemoUser]);

  const addProductToBasket = (product: Product) => {
    const existing = basket.find((b) => b.product.productId === product.productId);
    if (existing) {
      if (existing.quantity >= product.stockOnHand) {
        alert(`Cannot add more than available stock (${product.stockOnHand} units)`);
        return;
      }
      setBasket(
        basket.map((b) =>
          b.product.productId === product.productId ? { ...b, quantity: b.quantity + 1 } : b
        )
      );
    } else {
      if (product.stockOnHand < 1) {
        alert('This item is currently out of stock.');
        return;
      }
      setBasket([...basket, { product, quantity: 1 }]);
    }
  };

  const incrementBasketItem = (productId: string) => {
    setBasket(
      basket.map((b) => {
        if (b.product.productId === productId) {
          if (b.quantity >= b.product.stockOnHand) {
            alert(`Cannot add more than available stock (${b.product.stockOnHand} units)`);
            return b;
          }
          return { ...b, quantity: b.quantity + 1 };
        }
        return b;
      })
    );
  };

  const decrementBasketItem = (productId: string) => {
    setBasket(
      basket
        .map((b) => {
          if (b.product.productId === productId) {
            return { ...b, quantity: b.quantity - 1 };
          }
          return b;
        })
        .filter((b) => b.quantity > 0)
    );
  };

  const removeEntireBasketItem = (productId: string) => {
    setBasket(basket.filter((b) => b.product.productId !== productId));
  };

  // Calculations in paisa
  const cashTotalPaisa = basket.reduce(
    (sum, b) => sum + b.product.cashPricePaisa * b.quantity,
    0
  );

  const installmentTotalPaisa = basket.reduce((sum, b) => {
    const unitPrice = b.agreedPriceRupees
      ? rupeesToPaisa(b.agreedPriceRupees)
      : b.product.installmentPricePaisa;
    return sum + unitPrice * b.quantity;
  }, 0);

  const activeTotalPaisa = saleType === 'cash' ? cashTotalPaisa : installmentTotalPaisa;
  const advancePaisa = saleType === 'installment' ? rupeesToPaisa(advanceRupees || 0) : 0;
  const financedAmountPaisa = Math.max(0, activeTotalPaisa - advancePaisa);

  // Live schedule preview calculation
  const schedulePreview =
    saleType === 'installment' && durationCount > 0 && financedAmountPaisa > 0
      ? generateScheduleEntries({
          contractId: 'preview',
          customerId: selectedCustomerId,
          tenantId: activeTenant?.tenantId || '',
          financedAmountPaisa,
          durationCount,
          frequency,
          firstDueDateKey,
        })
      : [];

  const handleCompleteSale = async () => {
    if (!activeTenant || !currentUser || !selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }
    if (basket.length === 0) {
      alert('Please add at least one product to the basket.');
      return;
    }
    if (saleType === 'installment' && advancePaisa > activeTotalPaisa) {
      alert('Advance payment cannot exceed the total installment price.');
      return;
    }

    setSaving(true);
    try {
      const snapshots: SaleItemSnapshot[] = basket.map((b) => {
        const agreedUnitPricePaisa = b.agreedPriceRupees
          ? rupeesToPaisa(b.agreedPriceRupees)
          : b.product.installmentPricePaisa;

        return {
          productId: b.product.productId,
          productNameSnapshot: b.product.name,
          brandSnapshot: b.product.brand,
          modelSnapshot: b.product.model,
          quantity: b.quantity,
          cashUnitPricePaisa: b.product.cashPricePaisa,
          agreedUnitPricePaisa,
          lineTotalPaisa: (saleType === 'cash' ? b.product.cashPricePaisa : agreedUnitPricePaisa) * b.quantity,
        };
      });

      const res = await SaleRepository.createSaleAndContract({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        customerId: selectedCustomerId,
        saleType,
        items: snapshots,
        cashTotalPaisa,
        agreedTotalPaisa: installmentTotalPaisa,
        discountPaisa: 0,
        advancePaisa,
        frequency,
        durationCount,
        firstDueDateKey,
        isDemo: isDemoUser,
      });

      let officerName: string | undefined;
      // Auto-assign to Recovery Officer if installment contract
      if (saleType === 'installment' && res.contract?.contractId && assignedOfficerId) {
        const officer = recoveryOfficers.find((o) => o.userId === assignedOfficerId);
        officerName = officer?.displayName;
        const selectedCus = customers.find((c) => c.customerId === selectedCustomerId);

        await RecoveryRepository.assignCustomer({
          tenantId: activeTenant.tenantId,
          assignedBy: currentUser.uid,
          customerId: selectedCustomerId,
          contractId: res.contract.contractId,
          employeeId: assignedOfficerId,
          area: selectedCus?.area || selectedCus?.city || 'Main Area',
          isDemo: isDemoUser,
        });
      }

      setSuccessResult({
        saleId: res.sale.saleId,
        contractId: res.contract?.contractId,
        assignedOfficerName: officerName,
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to complete sale.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.customerId === selectedCustomerId);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('sales.title')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'نقد و اقساط سیل وزرڈ، ایڈوانس کٹوتی اور خودکار شیڈول'
              : 'Create cash or installment contracts with live schedule preview and stock deduction.'}
          </p>
        </div>

        <button
          onClick={() => navigate('/contracts')}
          className="btn btn-outline"
        >
          <span>{t('nav.contracts')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Steps & Basket */}
        <div style={{ gridColumn: 'span 2' }}>
          {/* Step 1: Customer Selection */}
          <div className="card mb-6">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} className="text-primary" />
                <h3 className="card-title">{t('sales.step1')}</h3>
              </div>
              <button
                onClick={() => navigate('/customers')}
                className="btn btn-sm btn-outline"
              >
                <Plus size={14} />
                <span>{t('customers.newCustomer')}</span>
              </button>
            </div>
            <div className="card-body">
              <div className="form-group mb-0">
                <select
                  className="form-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  {customers.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.fullName} — {c.phoneDisplay} ({c.area || c.city})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>CNIC:</strong> {selectedCustomer.cnic || '—'}</span>
                    <span><strong>Address:</strong> {selectedCustomer.address || selectedCustomer.city}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Items */}
          <div className="card mb-6">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} className="text-primary" />
                <h3 className="card-title">{t('sales.step2')}</h3>
              </div>
            </div>
            <div className="card-body">
              {/* Quick product selection grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {products.map((p) => (
                  <div
                    key={p.productId}
                    onClick={() => addProductToBasket(p)}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      cursor: p.stockOnHand > 0 ? 'pointer' : 'not-allowed',
                      opacity: p.stockOnHand > 0 ? 1 : 0.5,
                      backgroundColor: '#ffffff',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                  >
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                      {language === 'ur' ? 'اسٹاک:' : 'Stock:'} {p.stockOnHand}
                    </div>
                    <div style={{ marginTop: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <MoneyDisplay paisa={p.installmentPricePaisa} className="text-primary font-bold" />
                      <span className="btn btn-sm btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>+ Add</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Basket Table */}
              {basket.length > 0 && (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{language === 'ur' ? 'پروڈکٹ' : 'Item'}</th>
                        <th>{language === 'ur' ? 'تعداد (کم / زیادہ)' : 'Quantity (Add / Remove)'}</th>
                        <th>{language === 'ur' ? 'نقد قیمت' : 'Cash Price'}</th>
                        <th>{language === 'ur' ? 'اقساط قیمت' : 'Installment Price'}</th>
                        <th>{language === 'ur' ? 'ہٹائیں' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {basket.map((b) => (
                        <tr key={b.product.productId}>
                          <td className="font-semibold">{b.product.name}</td>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid #cbd5e1', borderRadius: '0.5rem', overflow: 'hidden' }}>
                              <button
                                type="button"
                                onClick={() => decrementBasketItem(b.product.productId)}
                                className="btn btn-icon btn-sm"
                                style={{ border: 'none', borderRadius: 0, padding: '0.35rem 0.6rem', background: '#f1f5f9' }}
                                title={language === 'ur' ? 'ایک کم کریں' : 'Decrease 1'}
                              >
                                <Minus size={14} />
                              </button>
                              <span style={{ minWidth: '2.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', padding: '0 0.5rem' }}>
                                {b.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => incrementBasketItem(b.product.productId)}
                                className="btn btn-icon btn-sm"
                                style={{ border: 'none', borderRadius: 0, padding: '0.35rem 0.6rem', background: '#f1f5f9' }}
                                title={language === 'ur' ? 'ایک بڑھائیں' : 'Increase 1'}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <MoneyDisplay paisa={b.product.cashPricePaisa * b.quantity} />
                          </td>
                          <td>
                            <MoneyDisplay paisa={b.product.installmentPricePaisa * b.quantity} className="text-primary font-bold" />
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeEntireBasketItem(b.product.productId)}
                              className="btn btn-icon btn-outline text-danger"
                              title={language === 'ur' ? 'پوری آئٹم ڈیلیٹ کریں' : 'Remove item'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Terms & Schedule Preview */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} className="text-primary" />
                <h3 className="card-title">{t('sales.step3')}</h3>
              </div>
            </div>
            <div className="card-body">
              {/* Sale Type Selector */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="saleType"
                    checked={saleType === 'installment'}
                    onChange={() => setSaleType('installment')}
                  />
                  <span>{t('sales.installmentSale')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="saleType"
                    checked={saleType === 'cash'}
                    onChange={() => setSaleType('cash')}
                  />
                  <span>{t('sales.cashSale')}</span>
                </label>
              </div>

              {saleType === 'installment' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="form-group">
                      <label className="form-label">{t('sales.advance')}</label>
                      <input
                        type="number"
                        className="form-input"
                        value={advanceRupees}
                        onChange={(e) => setAdvanceRupees(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t('sales.duration')}</label>
                      <select
                        className="form-select"
                        value={durationCount}
                        onChange={(e) => setDurationCount(parseInt(e.target.value, 10))}
                      >
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={9}>9 Months</option>
                        <option value={12}>12 Months (1 Year)</option>
                        <option value={18}>18 Months</option>
                        <option value={24}>24 Months (2 Years)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t('sales.firstDueDate')}</label>
                      <input
                        type="date"
                        className="form-input"
                        value={firstDueDateKey}
                        onChange={(e) => setFirstDueDateKey(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Recovery Officer Assignment */}
                  <div className="form-group" style={{ padding: '0.875rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600 }}>
                      <UserCheck size={16} />
                      <span>{language === 'ur' ? 'تفویض شدہ ریکوری آفیسر (Auto-Assign Recovery Officer)' : 'Assign Recovery Officer'}</span>
                    </label>
                    <select
                      className="form-select"
                      value={assignedOfficerId}
                      onChange={(e) => setAssignedOfficerId(e.target.value)}
                    >
                      {recoveryOfficers.length === 0 ? (
                        <option value="">{language === 'ur' ? 'کوئی ریکوری آفیسر دستیاب نہیں' : 'No recovery officers found'}</option>
                      ) : (
                        recoveryOfficers.map((o) => (
                          <option key={o.userId} value={o.userId}>
                            {o.displayName} ({o.email})
                          </option>
                        ))
                      )}
                    </select>
                    <p style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.375rem', marginBottom: 0 }}>
                      {language === 'ur'
                        ? 'معاہدہ کنفرم ہوتے ہی یہ گاہک اس ریکوری آفیسر کے موبائل پورٹل میں خودکار طور پر شو ہو جائے گا۔'
                        : 'Contract will automatically show up in this officer’s assigned recovery list upon activation.'}
                    </p>
                  </div>

                  {/* Schedule Preview Table */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
                      {language === 'ur' ? 'خودکار اقساط کا شیڈول (پیشگی منظر):' : 'Generated Installment Schedule (Preview):'}
                    </h4>

                    <div className="table-wrapper" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>{language === 'ur' ? 'تاریخ قسط' : 'Due Date'}</th>
                            <th>{language === 'ur' ? 'رقم' : 'Due Amount'}</th>
                            <th>{t('common.status')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedulePreview.map((s) => (
                            <tr key={s.sequenceNumber}>
                              <td>{s.sequenceNumber}</td>
                              <td>{s.dueDateKey}</td>
                              <td>
                                <MoneyDisplay paisa={s.dueAmountPaisa} className="font-semibold" />
                              </td>
                              <td>
                                <span className="badge badge-warning">Upcoming</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Confirmation Box */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '5rem' }}>
            <div className="card-header">
              <h3 className="card-title">Order Summary</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Customer:</span>
                  <span className="font-semibold">{selectedCustomer?.fullName || '—'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Sale Type:</span>
                  <span className="badge badge-info">{saleType.toUpperCase()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Total Price:</span>
                  <MoneyDisplay paisa={activeTotalPaisa} className="font-bold" />
                </div>

                {saleType === 'installment' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted">Advance (Paid Now):</span>
                      <MoneyDisplay paisa={advancePaisa} className="text-success font-semibold" />
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span className="font-bold">Financed Balance:</span>
                      <MoneyDisplay paisa={financedAmountPaisa} className="font-bold text-primary" style={{ fontSize: '1.125rem' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#64748b' }}>
                      <span>Monthly Installment:</span>
                      <span>
                        {durationCount > 0 ? (
                          <MoneyDisplay paisa={Math.round(financedAmountPaisa / durationCount)} />
                        ) : '—'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleCompleteSale}
                className="btn btn-primary btn-block btn-lg mt-6"
                disabled={saving || basket.length === 0}
              >
                <CheckCircle2 size={18} />
                <span>{saving ? t('common.loading') : t('sales.confirmSale')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successResult && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <div className="modal-body" style={{ padding: '2.5rem 1.5rem' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                {language === 'ur' ? 'سیل و معاہدہ کامیابی سے درج ہو گیا!' : 'Sale & Contract Posted Successfully!'}
              </h3>
              <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                {language === 'ur'
                  ? 'اسٹاک سے اشیاء خودکار طور پر کم ہو گئی ہیں اور اقساط کا کھاتہ چالو کر دیا گیا ہے۔'
                  : 'Items have been deducted from inventory movements and installment schedule entries are active.'}
              </p>

              {successResult.assignedOfficerName && (
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0', textAlign: 'left', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600 }}>
                    <UserCheck size={16} />
                    <span>{language === 'ur' ? 'تفویض شدہ ریکوری آفیسر:' : 'Assigned Recovery Officer:'}</span>
                  </div>
                  <div style={{ color: '#15803d', marginTop: '0.25rem' }}>
                    {successResult.assignedOfficerName} — {language === 'ur' ? 'آفیسر کے ریکوری پورٹل میں کامیابی سے شامل کر دیا گیا ہے۔' : 'Added to officer\'s live recovery queue.'}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/contracts')}
                  className="btn btn-primary"
                >
                  <span>{t('nav.contracts')}</span>
                </button>
                <button
                  onClick={() => {
                    setSuccessResult(null);
                    setBasket([]);
                  }}
                  className="btn btn-secondary"
                >
                  <span>{language === 'ur' ? 'مزید فروخت کریں' : 'New Sale'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

