// ============================================================================
// Products Feature: Catalogue, Pricing & Stock Levels
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  AlertTriangle,
  X,
  CheckCircle,
  Barcode,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Product } from '@/types';
import { ProductRepository } from '@/repositories/product.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { rupeesToPaisa } from '@/domain/money/paisa';

export const ProductsPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Appliances');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [sku, setSku] = useState('');
  const [costPriceRupees, setCostPriceRupees] = useState('');
  const [cashPriceRupees, setCashPriceRupees] = useState('');
  const [installmentPriceRupees, setInstallmentPriceRupees] = useState('');
  const [initialStock, setInitialStock] = useState('5');
  const [reorderLevel, setReorderLevel] = useState('2');

  const loadProducts = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await ProductRepository.getProducts(activeTenant.tenantId, isDemoUser);
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeTenant, isDemoUser]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser) return;
    if (!name || !cashPriceRupees || !installmentPriceRupees) {
      alert('Please fill in product name and prices.');
      return;
    }

    setSaving(true);
    try {
      await ProductRepository.saveProduct(
        activeTenant.tenantId,
        {
          name,
          category,
          brand,
          model,
          skuNormalized: sku.toUpperCase().replace(/\s+/g, ''),
          barcodeNormalized: sku,
          costPricePaisa: rupeesToPaisa(costPriceRupees || 0),
          cashPricePaisa: rupeesToPaisa(cashPriceRupees),
          installmentPricePaisa: rupeesToPaisa(installmentPriceRupees),
          stockOnHand: parseInt(initialStock, 10) || 0,
          reorderLevel: parseInt(reorderLevel, 10) || 2,
          status: 'active',
        },
        currentUser.uid,
        isDemoUser
      );

      // Reset
      setName('');
      setBrand('');
      setModel('');
      setSku('');
      setCostPriceRupees('');
      setCashPriceRupees('');
      setInstallmentPriceRupees('');
      setIsAddModalOpen(false);
      await loadProducts();
    } finally {
      setSaving(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.model && p.model.toLowerCase().includes(q)) ||
      (p.skuNormalized && p.skuNormalized.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('products.title')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'اشیاء کی فہرست، نقد و اقساط کی قیمتیں اور موجودہ اسٹاک'
              : 'Catalogue, cash/installment price tiers and physical stock on hand.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>{t('products.newProduct')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-6">
        <div className="card-body" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
            <Search size={18} className="text-muted" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', padding: '0.25rem 0', boxShadow: 'none' }}
              placeholder={t('products.searchPlaceholder')}
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
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? (language === 'ur' ? 'تمام کیٹیگریز' : 'All Categories') : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('products.name')}</th>
                <th>{t('products.category')}</th>
                <th>{t('products.costPrice')}</th>
                <th>{t('products.cashPrice')}</th>
                <th>{t('products.installmentPrice')}</th>
                <th>{t('products.stock')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: '2rem' }}>
                    {t('common.loading')}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stockOnHand <= (p.reorderLevel || 2);
                  return (
                    <tr key={p.productId}>
                      <td>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {[p.brand, p.model, p.skuNormalized].filter(Boolean).join(' • ')}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-slate">{p.category || 'General'}</span>
                      </td>
                      <td>
                        <MoneyDisplay paisa={p.costPricePaisa} className="text-muted" />
                      </td>
                      <td>
                        <MoneyDisplay paisa={p.cashPricePaisa} />
                      </td>
                      <td>
                        <MoneyDisplay paisa={p.installmentPricePaisa} className="text-primary font-bold" />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600 }}>{p.stockOnHand}</span>
                          {isLowStock && (
                            <span
                              className="badge badge-warning"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Low stock alert"
                            >
                              <AlertTriangle size={12} />
                              <span>Low</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('products.newProduct')}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    <span>{t('products.name')}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Haier Inverter AC 1.5 Ton (HAC-18T)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('products.category')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Air Conditioners"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('products.brand')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Haier"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('products.model')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="HAC-18T"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('products.sku')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Barcode or serial number..."
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Cost (Rs.)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="110000"
                      value={costPriceRupees}
                      onChange={(e) => setCostPriceRupees(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <span>Cash Price (Rs.)</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="125000"
                      value={cashPriceRupees}
                      onChange={(e) => setCashPriceRupees(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <span>Installment (Rs.)</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="155000"
                      value={installmentPriceRupees}
                      onChange={(e) => setInstallmentPriceRupees(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <input
                      type="number"
                      className="form-input"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('products.reorderLevel')}</label>
                    <input
                      type="number"
                      className="form-input"
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
    </div>
  );
};

