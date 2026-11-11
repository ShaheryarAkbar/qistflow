// ============================================================================
// Suppliers & Procurement Feature
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  ShoppingCart,
  Phone,
  MapPin,
  CheckCircle,
  X,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Supplier, Purchase, Product } from '@/types';
import { SupplierRepository } from '@/repositories/supplier.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { rupeesToPaisa } from '@/domain/money/paisa';

export const SuppliersPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchases'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Supplier Modal
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supCompany, setSupCompany] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Add Purchase Modal
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('5');
  const [purchaseUnitCostRupees, setPurchaseUnitCostRupees] = useState('');
  const [purchaseRef, setPurchaseRef] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [supList, purList, prdList] = await Promise.all([
        SupplierRepository.getSuppliers(activeTenant.tenantId, isDemoUser),
        SupplierRepository.getPurchases(activeTenant.tenantId, isDemoUser),
        ProductRepository.getProducts(activeTenant.tenantId, isDemoUser),
      ]);
      setSuppliers(supList);
      setPurchases(purList);
      setProducts(prdList);
      if (supList.length > 0 && !selectedSupplierId) setSelectedSupplierId(supList[0].supplierId);
      if (prdList.length > 0 && !selectedProductId) setSelectedProductId(prdList[0].productId);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant, isDemoUser]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !supName) return;

    setSaving(true);
    try {
      await SupplierRepository.saveSupplier(
        activeTenant.tenantId,
        {
          name: supName,
          company: supCompany,
          phoneDisplay: supPhone,
          normalizedPhone: supPhone.replace(/\D/g, ''),
          address: supAddress,
          status: 'active',
        },
        currentUser.uid,
        isDemoUser
      );

      setSupName('');
      setSupCompany('');
      setSupPhone('');
      setSupAddress('');
      setIsAddSupplierOpen(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !selectedSupplierId || !selectedProductId) return;

    const targetProduct = products.find((p) => p.productId === selectedProductId);
    if (!targetProduct) return;

    const qty = parseInt(purchaseQty, 10) || 1;
    const unitCostPaisa = purchaseUnitCostRupees
      ? rupeesToPaisa(purchaseUnitCostRupees)
      : targetProduct.costPricePaisa;
    const totalPaisa = unitCostPaisa * qty;

    setSaving(true);
    try {
      await SupplierRepository.postPurchase(
        activeTenant.tenantId,
        {
          supplierId: selectedSupplierId,
          purchaseDate: new Date().toISOString() as any,
          referenceNumber: purchaseRef || `INV-${Date.now().toString().slice(-5)}`,
          items: [
            {
              productId: targetProduct.productId,
              productNameSnapshot: targetProduct.name,
              quantity: qty,
              unitCostPaisa,
              lineTotalPaisa: totalPaisa,
            },
          ],
          subtotalPaisa: totalPaisa,
          discountPaisa: 0,
          totalPaisa,
          paidPaisa: totalPaisa,
          balancePaisa: 0,
          status: 'posted',
        },
        currentUser.uid,
        isDemoUser
      );

      setPurchaseRef('');
      setPurchaseUnitCostRupees('');
      setIsAddPurchaseOpen(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.suppliers')} & {t('nav.purchases')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'سپلائرز کی تفصیلات اور دکان کے لیے مال کی خریداری'
              : 'Vendor directory and stock procurement purchase orders.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="btn btn-secondary"
          >
            <Truck size={16} />
            <span>{language === 'ur' ? 'نیا سپلائر' : 'Add Supplier'}</span>
          </button>
          <button
            onClick={() => setIsAddPurchaseOpen(true)}
            className="btn btn-primary"
          >
            <ShoppingCart size={16} />
            <span>{language === 'ur' ? 'نئی خریداری (Stock-In)' : 'New Purchase'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`btn ${activeTab === 'suppliers' ? 'btn-primary' : 'btn-outline'}`}
        >
          {t('nav.suppliers')} ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`btn ${activeTab === 'purchases' ? 'btn-primary' : 'btn-outline'}`}
        >
          {t('nav.purchases')} ({purchases.length})
        </button>
      </div>

      {/* Suppliers Table */}
      {activeTab === 'suppliers' ? (
        <div className="card">
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ur' ? 'نام' : 'Supplier Name'}</th>
                  <th>{language === 'ur' ? 'کمپنی' : 'Company'}</th>
                  <th>{t('customers.phone')}</th>
                  <th>{language === 'ur' ? 'شہر و پتہ' : 'Address'}</th>
                  <th>{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center" style={{ padding: '2rem' }}>
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted" style={{ padding: '2rem' }}>
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.supplierId}>
                      <td className="font-semibold">{s.name}</td>
                      <td>{s.company || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={13} className="text-muted" />
                          <span>{s.phoneDisplay}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={13} className="text-muted" />
                          <span>{s.address}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-success">Active</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Purchases Table */
        <div className="card">
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>{language === 'ur' ? 'انوائس نمبر' : 'Invoice #'}</th>
                  <th>{language === 'ur' ? 'اشیاء' : 'Items'}</th>
                  <th>{language === 'ur' ? 'کل لاگت' : 'Total Amount'}</th>
                  <th>{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted" style={{ padding: '2rem' }}>
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.referenceNumber || Math.random().toString()}>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {typeof p.purchaseDate === 'string'
                          ? p.purchaseDate.split('T')[0]
                          : 'Recent'}
                      </td>
                      <td className="font-semibold">{p.referenceNumber || '—'}</td>
                      <td>
                        {p.items?.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '0.8125rem' }}>
                            {item.quantity}x {item.productNameSnapshot}
                          </div>
                        ))}
                      </td>
                      <td>
                        <MoneyDisplay paisa={p.totalPaisa} className="font-bold" />
                      </td>
                      <td>
                        <span className="badge badge-success">{p.status.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{language === 'ur' ? 'نیا سپلائر شامل کریں' : 'Add New Supplier'}</h3>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSupplier}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'سپلائر کا نام' : 'Supplier Name'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Al-Madina Trading"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'کمپنی کا نام' : 'Company Name'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Waves Authorized Distributor"
                    value={supCompany}
                    onChange={(e) => setSupCompany(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('customers.phone')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0321-1234567"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'پتہ و شہر' : 'City & Address'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Hall Road, Lahore / Bosan Road, Multan"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <CheckCircle size={16} />
                  <span>{saving ? t('common.loading') : t('common.save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      {isAddPurchaseOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {language === 'ur' ? 'نئی خریداری (اسٹاک انٹری)' : 'New Stock Purchase Order'}
              </h3>
              <button
                onClick={() => setIsAddPurchaseOpen(false)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPurchase}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'سپلائر' : 'Supplier'}</label>
                  <select
                    className="form-select"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.supplierId} value={s.supplierId}>
                        {s.name} ({s.company || s.phoneDisplay})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('products.name')}</label>
                  <select
                    className="form-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    {products.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      {language === 'ur' ? 'خریداری تعداد' : 'Intake Quantity'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={purchaseQty}
                      onChange={(e) => setPurchaseQty(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Cost (Rs.)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Leave blank for catalogue cost"
                      value={purchaseUnitCostRupees}
                      onChange={(e) => setPurchaseUnitCostRupees(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Invoice / Reference #</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. INV-8921"
                    value={purchaseRef}
                    onChange={(e) => setPurchaseRef(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddPurchaseOpen(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <CheckCircle size={16} />
                  <span>{saving ? t('common.loading') : language === 'ur' ? 'خریداری محفوظ کریں' : 'Confirm Purchase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
