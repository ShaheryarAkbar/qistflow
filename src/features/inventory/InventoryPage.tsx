// ============================================================================
// Inventory Feature: Movement-Led Stock Ledger & Real-Time Stock Management
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
  X,
  Package,
  Layers,
  TrendingDown,
  DollarSign,
  Sliders,
  Camera,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { InventoryMovement, Product, Supplier } from '@/types';
import { InventoryRepository } from '@/repositories/inventory.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { SupplierRepository } from '@/repositories/supplier.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { paisaToRupees } from '@/domain/money/paisa';
import { AiReceiptScannerModal } from '@/components/suppliers/AiReceiptScannerModal';

export const InventoryPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Adjustment form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'adjustment_in' | 'adjustment_out' | 'damage'>('adjustment_in');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');

  const loadData = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [movList, prdList, supList] = await Promise.all([
        InventoryRepository.getMovements(activeTenant.tenantId, isDemoUser),
        ProductRepository.getProducts(activeTenant.tenantId, isDemoUser),
        SupplierRepository.getSuppliers(activeTenant.tenantId, isDemoUser),
      ]);
      setSuppliers(supList);

      // Auto-reconcile opening stock movement for products created with stockOnHand > 0 that don't have an audit log entry yet
      const reconciledMovements = [...movList];
      for (const p of prdList) {
        if (p.stockOnHand > 0) {
          const hasAnyMovement = movList.some((m) => m.productId === p.productId);
          if (!hasAnyMovement) {
            const initMovement = await InventoryRepository.recordMovement(
              activeTenant.tenantId,
              {
                productId: p.productId,
                movementType: 'adjustment_in',
                quantity: p.stockOnHand,
                movementDate: p.createdAt ? (typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString()) : new Date().toISOString(),
                referenceType: 'adjustment',
                referenceId: p.productId,
                reason: 'افتتاحی اسٹاک اندراج (Initial Opening Stock Balance)',
              },
              currentUser?.uid || 'owner',
              isDemoUser,
              true // skip stockOnHand delta adjustment because product was already saved with initial stock
            );
            reconciledMovements.unshift(initMovement);
          }
        }
      }

      setMovements(reconciledMovements);
      setProducts(prdList);
      if (prdList.length > 0 && !selectedProductId) {
        setSelectedProductId(prdList[0].productId);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant, isDemoUser]);

  const handleOpenAdjustForProduct = (productId: string) => {
    setSelectedProductId(productId);
    setQuantity('1');
    setReason('');
    setAdjustmentType('adjustment_in');
    setIsAdjustModalOpen(true);
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !selectedProductId) return;

    setSaving(true);
    try {
      await InventoryRepository.recordMovement(
        activeTenant.tenantId,
        {
          productId: selectedProductId,
          movementType: adjustmentType,
          quantity: parseInt(quantity, 10) || 1,
          movementDate: new Date().toISOString(),
          referenceType: 'adjustment',
          reason: reason || 'Physical stock audit reconciliation',
        },
        currentUser.uid,
        isDemoUser
      );

      setReason('');
      setIsAdjustModalOpen(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const getProductName = (id: string) => {
    return products.find((p) => p.productId === id)?.name || id;
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'purchase_in':
      case 'customer_return':
      case 'adjustment_in':
        return { label: type.replace('_', ' ').toUpperCase(), bg: 'badge-success', sign: '+' };
      case 'sale_out':
      case 'supplier_return':
      case 'damage':
      case 'adjustment_out':
        return { label: type.replace('_', ' ').toUpperCase(), bg: 'badge-danger', sign: '-' };
      default:
        return { label: type, bg: 'badge-slate', sign: '' };
    }
  };

  // Summary KPI metrics
  const totalUnitsOnHand = products.reduce((sum, p) => sum + (p.stockOnHand || 0), 0);
  const totalCatalogItems = products.length;
  const lowStockCount = products.filter((p) => (p.stockOnHand || 0) <= (p.reorderLevel || 2)).length;
  const totalValuationPaisa = products.reduce((sum, p) => sum + ((p.costPricePaisa || 0) * (p.stockOnHand || 0)), 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.inventory')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'موجودہ گودام کا اسٹاک اور مال کی آمد و رفت کا مکمل آڈٹ لیجر (Movement-Led Inventory)'
              : 'Real-time stock balance, valuation and movement audit ledger.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            <span>{language === 'ur' ? 'AI سپلائر پرچی سکینر' : 'AI Receipt Scanner'}</span>
          </button>
          <button
            onClick={() => {
              if (products.length > 0 && !selectedProductId) {
                setSelectedProductId(products[0].productId);
              }
              setIsAdjustModalOpen(true);
            }}
            className="btn btn-secondary"
          >
            <PlusCircle size={16} />
            <span>{language === 'ur' ? 'اسٹاک ایڈجسٹمنٹ (+/-)' : 'Stock Adjustment'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
            <Boxes size={24} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {language === 'ur' ? 'مجموعی اسٹاک (یونٹس)' : 'Total Units In Stock'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {totalUnitsOnHand}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {language === 'ur' ? 'کل کیٹلاگ مصنوعات' : 'Catalog Products'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {totalCatalogItems}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: lowStockCount > 0 ? '#ffedd5' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: lowStockCount > 0 ? '#ea580c' : '#16a34a' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {language === 'ur' ? 'کم اسٹاک کی وارننگ' : 'Low Stock Alerts'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: lowStockCount > 0 ? '#ea580c' : '#16a34a' }}>
              {lowStockCount}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {language === 'ur' ? 'اسٹاک کی کل مالیت' : 'Stock Valuation'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              <MoneyDisplay paisa={totalValuationPaisa} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Layers size={16} />
          <span>{language === 'ur' ? 'موجودہ اسٹاک بیلنس' : 'Current Stock Levels'} ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`btn ${activeTab === 'movements' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Boxes size={16} />
          <span>{language === 'ur' ? 'اسٹاک آمد و رفت لاگ (Movements Ledger)' : 'Movement Ledger'} ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: Current Stock on Hand Table */}
      {activeTab === 'stock' && (
        <div className="card">
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ur' ? 'کوڈ / بارکوڈ' : 'Product Code'}</th>
                  <th>{t('products.name')}</th>
                  <th>{language === 'ur' ? 'کیٹگری' : 'Category'}</th>
                  <th>{language === 'ur' ? 'خرید قیمت' : 'Cost Price'}</th>
                  <th>{language === 'ur' ? 'موجودہ اسٹاک' : 'Stock On Hand'}</th>
                  <th>{language === 'ur' ? 'ری آرڈر حد' : 'Reorder Level'}</th>
                  <th>{language === 'ur' ? 'کل مالیت' : 'Total Value'}</th>
                  <th>{language === 'ur' ? 'ایکشن' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center" style={{ padding: '2rem' }}>
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted" style={{ padding: '2.5rem' }}>
                      <Package size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                      <p>{language === 'ur' ? 'کوئی پروڈکٹ موجود نہیں ہے۔ برائے مہربانی پہلے کیٹلاگ میں پروڈکٹ شامل کریں۔' : 'No products found. Please add products to your catalogue first.'}</p>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLowStock = (p.stockOnHand || 0) <= (p.reorderLevel || 2);
                    const isOutOfStock = (p.stockOnHand || 0) === 0;
                    const itemValuation = (p.costPricePaisa || 0) * (p.stockOnHand || 0);

                    return (
                      <tr key={p.productId}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          {p.productCode || p.barcodeNormalized || '—'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                          {p.model && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {p.brand ? `${p.brand} • ` : ''}{p.model}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-slate" style={{ fontSize: '0.75rem' }}>
                            {p.category || 'General'}
                          </span>
                        </td>
                        <td>
                          <MoneyDisplay paisa={p.costPricePaisa} />
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              isOutOfStock
                                ? 'badge-danger'
                                : isLowStock
                                ? 'badge-warning'
                                : 'badge-success'
                            }`}
                            style={{ fontSize: '0.8125rem', fontWeight: 700 }}
                          >
                            {p.stockOnHand || 0} {language === 'ur' ? 'یونٹس' : 'Units'}
                          </span>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.8125rem' }}>
                          {p.reorderLevel || 2}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <MoneyDisplay paisa={itemValuation} />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustForProduct(p.productId)}
                            className="btn btn-sm btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                            title={language === 'ur' ? 'اسٹاک ایڈجسٹ کریں' : 'Adjust Stock'}
                          >
                            <Sliders size={13} />
                            <span>{language === 'ur' ? 'ایڈجسٹ کریں' : 'Adjust'}</span>
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
      )}

      {/* TAB 2: Movements Audit Ledger */}
      {activeTab === 'movements' && (
        <div className="card">
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>{t('products.name')}</th>
                  <th>{language === 'ur' ? 'حرکت کی قسم' : 'Movement Type'}</th>
                  <th>{language === 'ur' ? 'تعداد' : 'Quantity'}</th>
                  <th>{language === 'ur' ? 'حوالہ و وجہ' : 'Reference / Reason'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center" style={{ padding: '2rem' }}>
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted" style={{ padding: '2.5rem' }}>
                      <Boxes size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                      <p>{t('common.noData')}</p>
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const badge = getMovementBadge(m.movementType);
                    return (
                      <tr key={m.movementId}>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {typeof m.movementDate === 'string'
                            ? m.movementDate.split('T')[0]
                            : 'Recent'}
                        </td>
                        <td className="font-semibold">{getProductName(m.productId)}</td>
                        <td>
                          <span className={`badge ${badge.bg}`}>{badge.label}</span>
                        </td>
                        <td className="font-bold">
                          <span style={{ color: badge.sign === '+' ? '#16a34a' : '#dc2626' }}>
                            {badge.sign}{m.quantity}
                          </span>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.8125rem' }}>
                          {m.reason || m.referenceId || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {language === 'ur' ? 'فزیکل اسٹاک ایڈجسٹمنٹ' : 'Physical Stock Adjustment'}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment}>
              <div className="modal-body">
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
                        {p.name} (Current Stock: {p.stockOnHand || 0} Units)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'ur' ? 'ایڈجسٹمنٹ کی قسم' : 'Adjustment Type'}
                  </label>
                  <select
                    className="form-select"
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as any)}
                  >
                    <option value="adjustment_in">Adjustment In (اسٹاک میں اضافہ / + Stock Found)</option>
                    <option value="adjustment_out">Adjustment Out (اسٹاک میں کمی / - Missing/Count Error)</option>
                    <option value="damage">Damage / Write-off (خراب مال / کٹوتی)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'ur' ? 'تعداد (یونٹس)' : 'Quantity (Units)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'وجہ و تفصیل' : 'Audit Reason'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Month-end physical count reconciliation / Damage replacement"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
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
                  <span>{saving ? t('common.loading') : language === 'ur' ? 'ایڈجسٹمنٹ محفوظ کریں' : t('common.save')}</span>
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
