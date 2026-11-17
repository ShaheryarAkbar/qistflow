// ============================================================================
// Multi-Store Branches & Sub-Licensing Governance Feature
// Anti-Abuse Sub-Licensing & Branch-to-Manager Performance Attribution
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Store,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  UserCheck,
  MapPin,
  Phone,
  KeyRound,
  CheckCircle2,
  X,
  Target,
  BarChart3,
  Building2,
  Lock,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { ShopBranch } from '@/types';
import { BranchRepository } from '@/repositories/branch.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { rupeesToPaisa } from '@/domain/money/paisa';

export const BranchesPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant, isOwner } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [branches, setBranches] = useState<ShopBranch[]>([]);
  const [loading, setLoading] = useState(true);

  // New Branch Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [branchCode, setBranchCode] = useState('');
  const [name, setName] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Rahim Yar Khan');
  const [address, setAddress] = useState('');
  const [monthlyTargetRupees, setMonthlyTargetRupees] = useState('3000000');
  const [customLicenceKey, setCustomLicenceKey] = useState('');
  const [saving, setSaving] = useState(false);

  // Inspection modal
  const [selectedBranch, setSelectedBranch] = useState<ShopBranch | null>(null);

  const loadBranches = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await BranchRepository.getBranches(activeTenant.tenantId, isDemoUser);
      setBranches(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [activeTenant, isDemoUser]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !name || !branchCode) return;

    setSaving(true);
    try {
      const targetPaisa = rupeesToPaisa(monthlyTargetRupees || '0');
      await BranchRepository.createBranch({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        branchCode,
        name,
        nameUr,
        managerName,
        phone,
        city,
        address,
        monthlyTargetPaisa: targetPaisa,
        licenceKey: customLicenceKey || undefined,
        isDemo: isDemoUser,
      });

      setBranchCode('');
      setName('');
      setNameUr('');
      setManagerName('');
      setPhone('');
      setAddress('');
      setMonthlyTargetRupees('3000000');
      setCustomLicenceKey('');
      setIsNewModalOpen(false);
      await loadBranches();
    } catch (err: any) {
      alert(err?.message || 'Failed to create branch');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (branch: ShopBranch) => {
    if (!activeTenant) return;
    const nextStatus = branch.status === 'active' ? 'inactive' : 'active';
    await BranchRepository.updateBranchStatus(activeTenant.tenantId, branch.branchId, nextStatus, isDemoUser);
    await loadBranches();
  };

  // Aggregated network metrics
  const totalSalesPaisa = branches.reduce((s, b) => s + (b.metrics?.totalSalesPaisa || 0), 0);
  const totalCollectedPaisa = branches.reduce((s, b) => s + (b.metrics?.totalCollectedPaisa || 0), 0);
  const totalExpensesPaisa = branches.reduce((s, b) => s + (b.metrics?.totalExpensesPaisa || 0), 0);
  const totalNetProfitPaisa = branches.reduce((s, b) => s + (b.metrics?.netProfitPaisa || 0), 0);

  const profitBranchesCount = branches.filter((b) => b.metrics?.performanceRating === 'profit').length;
  const averageBranchesCount = branches.filter((b) => b.metrics?.performanceRating === 'average').length;
  const lossBranchesCount = branches.filter((b) => b.metrics?.performanceRating === 'loss').length;

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {language === 'ur' ? 'شاخیں، ذیلی دکانیں اور لائسنس کنٹرول' : 'Shop Branches & Multi-Store Licensing'}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'تمام ذیلی دکانوں کی کارکردگی (نفع/نقصان)، برانچ مینیجر کارکردگی، اور سب لائسنس کی پابندی'
              : 'Multi-branch governance, manager accountability, anti-piracy sub-licence enforcement and P&L tracking.'}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>{language === 'ur' ? 'نئی برانچ شامل کریں' : 'Register New Branch'}</span>
          </button>
        )}
      </div>

      {/* Anti-Piracy Licensing Explainer Box */}
      <div
        className="card mb-6"
        style={{
          borderLeft: '5px solid #0284c7',
          backgroundColor: '#f0f9ff',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <ShieldCheck size={24} className="text-info" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0369a1', marginBottom: '0.25rem' }}>
              {language === 'ur'
                ? 'پلیٹ فارم تحفظ اصول: ایک ہی سبسکرپشن پر ایک سے زائد آزاد دکانیں غیر مجاز نہیں چل سکتیں'
                : 'Platform Policy: Isolated Sub-Licensing for Multi-Store Owners'}
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#075985', margin: 0, lineHeight: 1.5 }}>
              {language === 'ur'
                ? 'اگر کسی مالک کے پاس ایک سے زائد دکانیں (ذیلی شاخیں) ہیں، تو ہر برانچ کو ایک علیحدہ تصدیق شدہ ذیلی لائسنس کی (Sub-Licence Key) الاٹ کی جاتی ہے۔ اس طرح کوئی بھی شخص ایک واحد سنگل شاپ پیکج پر خفیہ طور پر متعدد الگ الگ دکانیں نہیں چلا سکتا۔ ہر برانچ کا مینیجر مقرر ہوتا ہے اور برانچ کی کارکردگی براہ راست اس مینیجر کے کھاتے میں شمار ہوتی ہے۔'
                : 'To prevent subscription abuse where an owner runs multiple independent physical shops under a single-store plan, every branch is cryptographically bound to an authorized sub-licence key. Branch performance directly reflects the branch manager’s performance.'}
            </p>
          </div>
        </div>
      </div>

      {/* Network Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Total Active Branches</span>
              <Store size={18} className="text-primary" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {branches.length} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Branches</span>
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.375rem', display: 'flex', gap: '0.5rem' }}>
              <span className="text-success font-semibold">{profitBranchesCount} Profit 🟢</span>
              <span className="text-warning font-semibold">{averageBranchesCount} Avg 🟡</span>
              <span className="text-danger font-semibold">{lossBranchesCount} Loss 🔴</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Network Total Sales</span>
              <BarChart3 size={18} className="text-info" />
            </div>
            <MoneyDisplay paisa={totalSalesPaisa} className="font-bold text-info" style={{ fontSize: '1.5rem' }} />
            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.375rem' }}>
              Across all registered retail outlets
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Total Recoveries Collected</span>
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <MoneyDisplay paisa={totalCollectedPaisa} className="font-bold text-success" style={{ fontSize: '1.5rem' }} />
            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.375rem' }}>
              Total installment cash inflow
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Overall Net Profit / Loss</span>
              {totalNetProfitPaisa >= 0 ? (
                <TrendingUp size={18} className="text-success" />
              ) : (
                <TrendingDown size={18} className="text-danger" />
              )}
            </div>
            <MoneyDisplay
              paisa={totalNetProfitPaisa}
              className={`font-bold ${totalNetProfitPaisa >= 0 ? 'text-success' : 'text-danger'}`}
              style={{ fontSize: '1.5rem' }}
            />
            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.375rem' }}>
              After branch expenses: <MoneyDisplay paisa={totalExpensesPaisa} />
            </div>
          </div>
        </div>
      </div>

      {/* Branches Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <div className="card text-center" style={{ padding: '3rem', gridColumn: '1 / -1' }}>
            {t('common.loading')}
          </div>
        ) : branches.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: '3rem', gridColumn: '1 / -1' }}>
            No branches found. Click "Register New Branch" to add your first sub-store.
          </div>
        ) : (
          branches.map((b) => {
            const rating = b.metrics?.performanceRating || 'average';
            let ratingBadge = {
              label: language === 'ur' ? 'نفع بخش (Profit 🟢)' : 'Profitable 🟢',
              badgeClass: 'badge-success',
              borderColor: '#10b981',
              bgHeader: '#ecfdf5',
            };

            if (rating === 'average') {
              ratingBadge = {
                label: language === 'ur' ? 'معمولی (Average 🟡)' : 'Average 🟡',
                badgeClass: 'badge-warning',
                borderColor: '#f59e0b',
                bgHeader: '#fffbeb',
              };
            } else if (rating === 'loss') {
              ratingBadge = {
                label: language === 'ur' ? 'نقصان میں (Loss 🔴)' : 'In Loss 🔴',
                badgeClass: 'badge-danger',
                borderColor: '#ef4444',
                bgHeader: '#fef2f2',
              };
            }

            const targetAchieved =
              b.monthlyTargetPaisa > 0 && b.metrics?.totalSalesPaisa
                ? Math.min(100, Math.round((b.metrics.totalSalesPaisa / b.monthlyTargetPaisa) * 100))
                : 0;

            return (
              <div
                key={b.branchId}
                className="card"
                style={{
                  borderTop: `4px solid ${ratingBadge.borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: ratingBadge.bgHeader,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className="badge badge-slate" style={{ fontSize: '0.6875rem' }}>
                          {b.branchCode}
                        </span>
                        <span className={`badge ${ratingBadge.badgeClass}`} style={{ fontSize: '0.6875rem' }}>
                          {ratingBadge.label}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', marginTop: '0.375rem', marginBottom: 0 }}>
                        {b.name}
                      </h3>
                      {b.nameUr && language !== 'ur' && (
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{b.nameUr}</div>
                      )}
                    </div>
                  </div>

                  <div className="card-body" style={{ padding: '1.25rem' }}>
                    {/* Branch Manager attribution callout */}
                    <div style={{ padding: '0.625rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#334155', fontWeight: 600 }}>
                        <UserCheck size={15} className="text-primary" />
                        <span>{language === 'ur' ? 'برانچ مینیجر انچارج:' : 'Branch Manager In-Charge:'}</span>
                      </div>
                      <div style={{ color: '#0f172a', fontWeight: 700, marginTop: '0.125rem' }}>
                        {b.managerName || 'Assigned Manager'}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        {language === 'ur'
                          ? 'نوٹ: برانچ کا نفع/نقصان براہ راست اس مینیجر کی کارکردگی ظاہر کرتا ہے۔'
                          : 'Manager performance is directly rated on this branch’s net margin.'}
                      </div>
                    </div>

                    {/* Sub-Licence status pill */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '0.75rem', padding: '0.375rem 0.5rem', background: '#f1f5f9', borderRadius: '0.375rem' }}>
                      <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <KeyRound size={12} />
                        <span>Sub-Licence:</span>
                      </span>
                      <code style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0f172a' }}>
                        {b.licenceKey || 'QIST-LIC-ACTIVE'}
                      </code>
                    </div>

                    {/* Metrics Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted">Monthly Target:</span>
                        <MoneyDisplay paisa={b.monthlyTargetPaisa} className="font-semibold" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted">Total Sales:</span>
                        <MoneyDisplay paisa={b.metrics?.totalSalesPaisa || 0} className="font-bold text-info" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted">Collections:</span>
                        <MoneyDisplay paisa={b.metrics?.totalCollectedPaisa || 0} className="font-bold text-success" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted">Branch Expenses:</span>
                        <MoneyDisplay paisa={b.metrics?.totalExpensesPaisa || 0} className="font-semibold text-danger" />
                      </div>
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="font-bold">Net Profit / Loss:</span>
                        <MoneyDisplay
                          paisa={b.metrics?.netProfitPaisa || 0}
                          className={`font-bold ${((b.metrics?.netProfitPaisa || 0) >= 0) ? 'text-success' : 'text-danger'}`}
                          style={{ fontSize: '1rem' }}
                        />
                      </div>
                    </div>

                    {/* Target Progress Bar */}
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        <span>Target Progress:</span>
                        <span>{targetAchieved}% achieved</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${targetAchieved}%`,
                            height: '100%',
                            background: targetAchieved >= 80 ? '#10b981' : targetAchieved >= 50 ? '#f59e0b' : '#ef4444',
                            borderRadius: '999px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Location & Contact */}
                    {(b.address || b.city) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                        <MapPin size={12} />
                        <span>{[b.address, b.city].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setSelectedBranch(b)}
                    className="btn btn-sm btn-outline"
                  >
                    <span>{language === 'ur' ? 'تفصیلات دیکھیں' : 'Branch Details'}</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => handleToggleStatus(b)}
                      className={`btn btn-sm ${b.status === 'active' ? 'btn-outline text-danger' : 'btn-outline text-success'}`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {b.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Branch Registration Modal */}
      {isNewModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-box" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={20} className="text-primary" />
                <h3 className="modal-title">
                  {language === 'ur' ? 'نئی دکان / ذیلی برانچ کا اندراج' : 'Register New Shop Branch'}
                </h3>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBranch}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#0369a1' }}>
                  {language === 'ur'
                    ? 'نوٹ: ہر نئی دکان کے لیے خودکار سب-لائسنس کی جنریٹ ہو گی تاکہ سبسکرپشن کا غلط استعمال نہ ہو۔ ہر برانچ کا الگ مینیجر مقرر کریں۔'
                    : 'Note: An authorized Sub-Licence Key will be assigned to this branch to protect single-store plans from unauthorized sharing.'}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      <span>Branch Code</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. BR-04"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Branch Name (English)</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Model Town Branch"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">برانچ کا نام (اردو)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: ماڈل ٹاؤن برانچ"
                    value={nameUr}
                    onChange={(e) => setNameUr(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      <span>Branch Manager Name</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Asif Raza"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Mobile</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0300-9876543"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Sales Target (PKR)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="3000000"
                    value={monthlyTargetRupees}
                    onChange={(e) => setMonthlyTargetRupees(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address / Landmark</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Shop # 12, Main Bazar, Rahim Yar Khan"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Authorized Sub-Licence Key (Optional override)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Leave empty for auto-generated licence key"
                    value={customLicenceKey}
                    onChange={(e) => setCustomLicenceKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <CheckCircle2 size={16} />
                  <span>{saving ? t('common.loading') : language === 'ur' ? 'برانچ رجسٹر کریں' : 'Register Branch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Inspection Details Modal */}
      {selectedBranch && (
        <div className="modal-overlay" style={{ zIndex: 65 }}>
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} className="text-primary" />
                <h3 className="modal-title">{selectedBranch.name}</h3>
              </div>
              <button onClick={() => setSelectedBranch(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ fontSize: '0.875rem' }}>
              <div style={{ padding: '0.875rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span className="text-muted">Branch Code:</span>
                  <span className="font-bold">{selectedBranch.branchCode}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span className="text-muted">Manager In-Charge:</span>
                  <strong>{selectedBranch.managerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span className="text-muted">Sub-Licence Key:</span>
                  <code>{selectedBranch.licenceKey}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Licence Status:</span>
                  <span className="badge badge-success">ACTIVE & VERIFIED</span>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                Financial & Operations Performance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Monthly Target:</span>
                  <MoneyDisplay paisa={selectedBranch.monthlyTargetPaisa} className="font-semibold" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Total Sales Posted:</span>
                  <MoneyDisplay paisa={selectedBranch.metrics?.totalSalesPaisa || 0} className="font-bold text-info" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Total Cash Inflow:</span>
                  <MoneyDisplay paisa={selectedBranch.metrics?.totalCollectedPaisa || 0} className="font-bold text-success" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Total Expenses:</span>
                  <MoneyDisplay paisa={selectedBranch.metrics?.totalExpensesPaisa || 0} className="font-bold text-danger" />
                </div>
                <div style={{ borderTop: '2px solid #0f172a', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-bold">Net Margin / Profit:</span>
                  <MoneyDisplay paisa={selectedBranch.metrics?.netProfitPaisa || 0} className="font-bold text-success" style={{ fontSize: '1.125rem' }} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedBranch(null)} className="btn btn-secondary">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
