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
  Edit3,
  Camera,
  Sparkles,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Supplier, Purchase, Product } from '@/types';
import { SupplierRepository } from '@/repositories/supplier.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { rupeesToPaisa } from '@/domain/money/paisa';
import { AiReceiptScannerModal } from '@/components/suppliers/AiReceiptScannerModal';
import { ReceiptArchiveGallery } from '@/components/suppliers/ReceiptArchiveGallery';

export const SuppliersPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchases' | 'receipts_archive'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Receipt Scanner Modal
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);

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

  // Edit Supplier Modal
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editSupName, setEditSupName] = useState('');
  const [editSupCompany, setEditSupCompany] = useState('');
  const [editSupPhone, setEditSupPhone] = useState('');
  const [editSupAddress, setEditSupAddress] = useState('');
  const [savingEditSup, setSavingEditSup] = useState(false);

  // Edit Purchase Modal
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editPurchaseRef, setEditPurchaseRef] = useState('');
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editPurchaseStatus, setEditPurchaseStatus] = useState<Purchase['status']>('posted');
  const [savingEditPur, setSavingEditPur] = useState(false);

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

  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setEditSupName(sup.name);
    setEditSupCompany(sup.company || '');
    setEditSupPhone(sup.phoneDisplay || '');
    setEditSupAddress(sup.address || '');
  };

  const handleSaveEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !editingSupplier || !editSupName) return;

    setSavingEditSup(true);
    try {
      await SupplierRepository.updateSupplier(
        activeTenant.tenantId,
        editingSupplier.supplierId,
        {
          name: editSupName,
          company: editSupCompany,
          phoneDisplay: editSupPhone,
          normalizedPhone: editSupPhone.replace(/\D/g, ''),
          address: editSupAddress,
        },
        currentUser.uid,
        isDemoUser
      );

      setEditingSupplier(null);
      await loadData();
    } finally {
      setSavingEditSup(false);
    }
  };

  const handleOpenEditPurchase = (pur: Purchase) => {
    setEditingPurchase(pur);
    setEditPurchaseRef(pur.referenceNumber || '');
    setEditPurchaseDate(typeof pur.purchaseDate === 'string' ? pur.purchaseDate.split('T')[0] : '');
    setEditPurchaseStatus(pur.status as any);
  };

  const handleSaveEditPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !editingPurchase) return;

    setSavingEditPur(true);
    try {
      await SupplierRepository.updatePurchase(
        activeTenant.tenantId,
        editingPurchase.referenceNumber || '',
        {
          referenceNumber: editPurchaseRef,
          purchaseDate: editPurchaseDate ? new Date(editPurchaseDate).toISOString() as any : undefined,
          status: editPurchaseStatus,
        },
        currentUser.uid,
        isDemoUser
      );

      setEditingPurchase(null);
      await loadData();
    } finally {
      setSavingEditPur(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="page-header-responsive">
        <div className="page-title-group">
          <h2>
            {t('nav.suppliers')} & {t('nav.purchases')}
          </h2>
          <p>
            {language === 'ur'
              ? 'سپلائرز کی تفصیلات اور دکان کے لیے مال کی خریداری'
              : 'Vendor directory and stock procurement purchase orders.'}
          </p>
        </div>

        <div className="page-action-group">
          <button
            onClick={() => setIsAiScannerOpen(true)}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Camera size={16} />
            <Sparkles size={14} className="text-amber-300" />
            <span>{language === 'ur' ? 'AI انوائس سکینر (Scan)' : 'AI Scanner'}</span>
          </button>
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="btn btn-secondary"
          >
            <Truck size={16} />
            <span>{language === 'ur' ? 'نیا سپلائر' : 'Add Supplier'}</span>
          </button>
          <button
            onClick={() => setIsAddPurchaseOpen(true)}
            className="btn btn-outline"
          >
            <ShoppingCart size={16} />
            <span>{language === 'ur' ? 'نئی خریداری (Stock)' : 'New Purchase'}</span>
          </button>
        </div>
      </div>

      {/* Tabs (Horizontal Swipeable on Mobile) */}
      <div className="mobile-tab-scroll">
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
        <button
          onClick={() => setActiveTab('receipts_archive')}
          className={`btn ${activeTab === 'receipts_archive' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <FileText size={15} />
          <span>{language === 'ur' ? 'رسیدیں و بلٹی آرکائیو' : 'Receipts Archive'}</span>
          <span className="badge badge-success" style={{ fontSize: '0.6875rem', padding: '0.1rem 0.35rem' }}>
            {purchases.filter((p) => !!p.receiptImageUrl).length}
          </span>
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
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center" style={{ padding: '2rem' }}>
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted" style={{ padding: '2rem' }}>
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
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenEditSupplier(s)}
                          className="btn btn-sm btn-outline text-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                          title={language === 'ur' ? 'سپلائر کی درستی' : 'Edit Supplier'}
                        >
                          <Edit3 size={12} />
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
      ) : activeTab === 'purchases' ? (
        /* Purchases Table */
        <div className="card">
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>{language === 'ur' ? 'انوائس نمبر' : 'Invoice #'}</th>
                  <th>{language === 'ur' ? 'سپلائر' : 'Supplier'}</th>
                  <th>{language === 'ur' ? 'اشیاء' : 'Items'}</th>
                  <th>{language === 'ur' ? 'کل لاگت' : 'Total Amount'}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => {
                    const sup = suppliers.find((s) => s.supplierId === p.supplierId);
                    return (
                      <tr key={p.referenceNumber || Math.random().toString()}>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {typeof p.purchaseDate === 'string'
                            ? p.purchaseDate.split('T')[0]
                            : 'Recent'}
                        </td>
                        <td className="font-semibold">{p.referenceNumber || '—'}</td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          <div style={{ fontWeight: 600 }}>{p.supplierNameSnapshot || sup?.name || '—'}</div>
                        </td>
                        <td>
                          {p.items?.map((item, idx) => (
                            <div key={idx} style={{ fontSize: '0.8125rem' }}>
                              {item.quantity}x {item.productNameSnapshot}
                            </div>
                          ))}
                        </td>
                        <td>
                          <MoneyDisplay paisa={p.totalPaisa} className="font-bold text-success" />
                        </td>
                        <td>
                          <span className="badge badge-success">{p.status.toUpperCase()}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPurchase(p)}
                            className="btn btn-sm btn-outline text-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                            title={language === 'ur' ? 'انوائس کی درستی' : 'Edit Purchase'}
                          >
                            <Edit3 size={12} />
                            <span>{language === 'ur' ? 'درستی' : 'Edit'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Receipts & Delivery Challan Archive Gallery */
        <ReceiptArchiveGallery
          purchases={purchases}
          suppliers={suppliers}
          onOpenScanner={() => setIsAiScannerOpen(true)}
        />
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

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{language === 'ur' ? 'سپلائر کی تفصیلات کی درستی' : 'Edit Supplier Details'}</h3>
              <button
                onClick={() => setEditingSupplier(null)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSupplier}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'سپلائر کا نام' : 'Supplier Name'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editSupName}
                    onChange={(e) => setEditSupName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'کمپنی کا نام' : 'Company Name'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editSupCompany}
                    onChange={(e) => setEditSupCompany(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('customers.phone')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editSupPhone}
                    onChange={(e) => setEditSupPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'شہر و مکمل پتہ' : 'Address & City'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editSupAddress}
                    onChange={(e) => setEditSupAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEditSup}
                >
                  <CheckCircle size={16} />
                  <span>{savingEditSup ? t('common.loading') : (language === 'ur' ? 'تبدیلی محفوظ کریں' : 'Update Supplier')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{language === 'ur' ? 'انوائس کی درستی' : 'Edit Purchase Record'}</h3>
              <button
                onClick={() => setEditingPurchase(null)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditPurchase}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'انوائس نمبر' : 'Invoice / Ref #'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPurchaseRef}
                    onChange={(e) => setEditPurchaseRef(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'خریداری کی تاریخ' : 'Purchase Date'}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editPurchaseDate}
                    onChange={(e) => setEditPurchaseDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'کیفیت (اسٹیٹس)' : 'Status'}</label>
                  <select
                    className="form-select"
                    value={editPurchaseStatus}
                    onChange={(e) => setEditPurchaseStatus(e.target.value as any)}
                  >
                    <option value="posted">Posted (درج شدہ)</option>
                    <option value="pending">Pending (زیر التواء)</option>
                    <option value="cancelled">Cancelled (منسوخ شدہ)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEditPur}
                >
                  <CheckCircle size={16} />
                  <span>{savingEditPur ? t('common.loading') : (language === 'ur' ? 'محفوظ کریں' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Supplier Receipt & Challan Scanner Modal */}
      <AiReceiptScannerModal
        isOpen={isAiScannerOpen}
        onClose={() => setIsAiScannerOpen(false)}
        onSuccess={loadData}
        existingSuppliers={suppliers}
        existingProducts={products}
      />
    </div>
  );
};

