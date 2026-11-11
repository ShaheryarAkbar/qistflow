// ============================================================================
// Inventory Feature: Movement-Led Stock Ledger & Adjustments
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
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { InventoryMovement, Product } from '@/types';
import { InventoryRepository } from '@/repositories/inventory.repository';
import { ProductRepository } from '@/repositories/product.repository';

export const InventoryPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
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
      const [movList, prdList] = await Promise.all([
        InventoryRepository.getMovements(activeTenant.tenantId, isDemoUser),
        ProductRepository.getProducts(activeTenant.tenantId, isDemoUser),
      ]);
      setMovements(movList);
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

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.inventory')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'مال کی آمد و روانگی اور اسٹاک آڈٹ لاگ (Movement-Led Inventory)'
              : 'Permanent audit ledger of all stock intake, sales, returns and physical adjustments.'}
          </p>
        </div>

        <button
          onClick={() => setIsAdjustModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          <span>{language === 'ur' ? 'اسٹاک ایڈجسٹمنٹ' : 'Stock Adjustment'}</span>
        </button>
      </div>

      {/* Movements Table */}
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
                  <td colSpan={5} className="text-center text-muted" style={{ padding: '2rem' }}>
                    {t('common.noData')}
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
                        {p.name} (Current Stock: {p.stockOnHand})
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
                    <option value="adjustment_in">Adjustment In (Stock Found / +)</option>
                    <option value="adjustment_out">Adjustment Out (Missing / -)</option>
                    <option value="damage">Damage / Write-off (-)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'ur' ? 'تعداد' : 'Quantity'}
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
                    <span>{language === 'ur' ? 'وجہ' : 'Audit Reason'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Month-end physical count reconciliation"
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

