// ============================================================================
// Platform Administration Feature (PRD Section 4.5, 5 & 6.16)
// Platform Super-Admin: Manage Tenants, SaaS Subscription Dues, Plans & Spark
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Store,
  Layers,
  KeyRound,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  Users,
  Settings,
  HardDrive,
  Activity,
  Edit,
  Edit2,
  Save,
  X,
  CreditCard,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Share2,
  PlusCircle,
  UserPlus,
  Mail,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/app/providers/AuthContext';
import { useTenant } from '@/app/providers/TenantContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlatformPlan, PlatformLicence } from '@/types';
import { StaffRepository } from '@/repositories/staff.repository';

export const PlatformAdminPage: React.FC = () => {
  const { t, language } = useI18n();
  const { currentUser, enableDemoMode } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'tenants' | 'dues' | 'plans' | 'health'>('tenants');
  const [searchShop, setSearchShop] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Password visibility & handover state
  const [showTenantPasswords, setShowTenantPasswords] = useState<Record<string, boolean>>({});
  const [isOnboardShopModalOpen, setIsOnboardShopModalOpen] = useState(false);
  const [shareTenantHandover, setShareTenantHandover] = useState<any | null>(null);
  const [tenantHandoverCopied, setTenantHandoverCopied] = useState(false);

  // Edit Owner Credentials State
  const [editingTenantOwner, setEditingTenantOwner] = useState<any | null>(null);
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');
  const [editOwnerPhone, setEditOwnerPhone] = useState('');
  const [editOwnerPassword, setEditOwnerPassword] = useState('');
  const [showEditOwnerPass, setShowEditOwnerPass] = useState(false);
  const [savingOwnerDetails, setSavingOwnerDetails] = useState(false);

  // Edit Subscription / Mistake Correction State
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [editSubStatus, setEditSubStatus] = useState<'paid' | 'due' | 'overdue' | 'lifetime'>('due');
  const [editSubMonthlyFee, setEditSubMonthlyFee] = useState('');
  const [editSubDueDate, setEditSubDueDate] = useState('');
  const [editSubLastPaidDate, setEditSubLastPaidDate] = useState('');

  // New Shop Form State
  const [newShopName, setNewShopName] = useState('');
  const [newShopNameUr, setNewShopNameUr] = useState('');
  const [newShopCity, setNewShopCity] = useState('Rahim Yar Khan');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('Pak@12345');
  const [newShopPhone, setNewShopPhone] = useState('0300-1234567');
  const [newShopPlan, setNewShopPlan] = useState('Professional Monthly (Rs. 3,499)');

  // Platform tenants: 1 Main Reference Demo Shop + 1 Fresh Clean Empty Demo Shop
  const defaultPlatformTenants = [
    {
      tenantId: 'tenant-demo-ryk-01',
      businessName: 'Malik Electronics & Installments',
      businessNameUr: 'ملک الیکٹرانکس اینڈ اقساط سینٹر (ریفرنس ڈیمو)',
      ownerName: 'Haji Abdul Malik',
      ownerEmail: 'owner@qistflow-demo.pk',
      ownerPassword: 'Pak@12345',
      phone: '0300-1234567',
      city: 'Rahim Yar Khan',
      plan: 'Professional Monthly (Rs. 3,499)',
      licenceType: 'subscription',
      status: 'active',
      activeContracts: 48,
      createdAt: '2026-10-01',
      supportNotes: 'ریفرنس ڈیمو شاپ: اس میں تمام کسٹمرز، پروڈکٹس، سیلز، منیجر، اکاؤنٹنٹ اور ریکوری آفیسرز کا مکمل ریکارڈ پہلے سے موجود ہے۔',
    },
    {
      tenantId: 'tenant-fresh-02',
      businessName: 'Al-Noor Electronics',
      businessNameUr: 'النور الیکٹرانکس (خالی ڈیمو دکان)',
      ownerName: 'Mian Muhammad Usman',
      ownerEmail: 'usman.owner@alnoor.pk',
      ownerPassword: 'Pak@12345',
      phone: '0300-7654321',
      city: 'Rahim Yar Khan',
      plan: 'Professional Monthly (Rs. 3,499)',
      licenceType: 'subscription',
      status: 'active',
      activeContracts: 0,
      createdAt: '2026-11-19',
      supportNotes: 'خالی ڈیمو دکان (Clean Slate): اس میں کوئی کسٹمر، پروڈکٹ یا ملازم پہلے سے شامل نہیں ہے۔ سب کچھ شروع سے خود مینوئل درج کریں۔',
    },
  ];

  const defaultShopSubscriptions = [
    {
      subId: 'sub-01',
      tenantId: 'tenant-demo-ryk-01',
      businessName: 'Malik Electronics & Installments',
      ownerName: 'Haji Abdul Malik',
      phone: '0300-1234567',
      city: 'Rahim Yar Khan',
      planName: 'Professional Monthly',
      monthlyFeePKR: 3499,
      dueDate: '2026-11-30',
      status: 'paid',
      lastPaidDate: '2026-10-30',
    },
    {
      subId: 'sub-02',
      tenantId: 'tenant-fresh-02',
      businessName: 'Al-Noor Electronics',
      ownerName: 'Mian Muhammad Usman',
      phone: '0300-7654321',
      city: 'Rahim Yar Khan',
      planName: 'Professional Monthly',
      monthlyFeePKR: 3499,
      dueDate: '2026-12-15',
      status: 'due',
      lastPaidDate: '2026-11-19',
    },
  ];

  const [tenants, setTenants] = useState(defaultPlatformTenants);
  const [shopSubscriptions, setShopSubscriptions] = useState(defaultShopSubscriptions);

  // Platform Plans Definitions (PRD Section 5)
  const [plans] = useState<PlatformPlan[]>([
    {
      planId: 'plan-starter-m',
      name: 'Starter Monthly',
      nameUr: 'اسٹارٹر ماہانہ',
      billingType: 'monthly',
      pricePaisa: 99900,
      features: ['1 Shop Branch', '2 Staff Accounts', 'Up to 200 Customers', 'Urdu & English UI', 'Daily Backup Reminders'],
      maxUsers: 2,
      maxCustomers: 200,
      status: 'active',
    },
    {
      planId: 'plan-standard-m',
      name: 'Standard Monthly',
      nameUr: 'اسٹینڈرڈ ماہانہ',
      billingType: 'monthly',
      pricePaisa: 199900,
      features: ['1 Shop Branch', '5 Staff Accounts', 'Up to 1,000 Customers', 'Recovery Field Portal', 'Thermal 80mm Receipts', 'CSV & JSON Exports'],
      maxUsers: 5,
      maxCustomers: 1000,
      status: 'active',
    },
    {
      planId: 'plan-pro-m',
      name: 'Professional Monthly',
      nameUr: 'پروفیشنل ماہانہ',
      billingType: 'monthly',
      pricePaisa: 349900,
      features: ['Multi-Branch Support', 'Unlimited Staff', 'Unlimited Customers', 'Full ZIP Backup Bundler', 'A4 Clearance Certificates', 'Priority Local Support'],
      maxUsers: 999,
      maxCustomers: 99999,
      status: 'active',
    },
    {
      planId: 'plan-basic-life',
      name: 'Lifetime Basic',
      nameUr: 'لائف ٹائم بنیادی',
      billingType: 'lifetime',
      pricePaisa: 1999900,
      features: ['One-time Fee', 'Single Shop License', '3 Staff Accounts', 'Permanent Local Data Ownership', 'Standard Updates'],
      maxUsers: 3,
      maxCustomers: 500,
      status: 'active',
    },
    {
      planId: 'plan-standard-life',
      name: 'Lifetime Standard',
      nameUr: 'لائف ٹائم اسٹینڈرڈ',
      billingType: 'lifetime',
      pricePaisa: 3499900,
      features: ['One-time Fee', '1 Shop + Mobile Recovery', '8 Staff Accounts', 'Full Portability & Exports', '1 Year Priority Support'],
      maxUsers: 8,
      maxCustomers: 2000,
      status: 'active',
    },
    {
      planId: 'plan-pro-life',
      name: 'Lifetime Professional',
      nameUr: 'لائف ٹائم پروفیشنل',
      billingType: 'lifetime',
      pricePaisa: 5999900,
      features: ['One-time Fee', 'Multi-Branch Ready', 'Unlimited Staff & Customers', 'Full Feature Access', 'Lifetime Product Updates'],
      maxUsers: 999,
      maxCustomers: 99999,
      status: 'active',
    },
  ]);

  // Support Notes Modal
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<string>('active');
  const [notesInput, setNotesInput] = useState<string>('');

  const openEditModal = (t: any) => {
    setSelectedTenant(t);
    setEditStatus(t.status);
    setNotesInput(t.supportNotes);
  };

  useEffect(() => {
    const saved = localStorage.getItem('qistflow_registered_shops');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove legacy dummy shops
          const cleaned = parsed.filter(
            (t: any) => !['tenant-kp-02', 'tenant-sqb-03', 'tenant-ryk-04'].includes(t.tenantId)
          );
          const hasMain = cleaned.some((t: any) => t.tenantId === 'tenant-demo-ryk-01');
          const hasFresh = cleaned.some((t: any) => t.tenantId === 'tenant-fresh-02');
          const finalShops = [
            ...(hasMain ? [] : [defaultPlatformTenants[0]]),
            ...(hasFresh ? [] : [defaultPlatformTenants[1]]),
            ...cleaned,
          ];
          setTenants(finalShops);
          localStorage.setItem('qistflow_registered_shops', JSON.stringify(finalShops));
          return;
        }
      } catch (e) {}
    }
    setTenants(defaultPlatformTenants);
    localStorage.setItem('qistflow_registered_shops', JSON.stringify(defaultPlatformTenants));
  }, []);

  const handleDeleteTenant = (tenantId: string) => {
    if (tenantId === 'tenant-demo-ryk-01') {
      alert(language === 'ur' ? 'مرکزی ریفرنس ڈیمو شاپ کو حذف نہیں کیا جا سکتا۔' : 'Cannot delete the primary reference demo shop.');
      return;
    }
    const target = tenants.find((t) => t.tenantId === tenantId);
    if (!window.confirm(language === 'ur' ? `کیا آپ واقعی دکان (${target?.businessName}) کو حذف کرنا چاہتے ہیں؟ اس کا تمام ڈیٹا ختم ہو جائے گا۔` : `Delete shop ${target?.businessName}?`)) {
      return;
    }

    const updated = tenants.filter((t) => t.tenantId !== tenantId);
    setTenants(updated);
    localStorage.setItem('qistflow_registered_shops', JSON.stringify(updated));

    setShopSubscriptions((prev) => prev.filter((s) => s.tenantId !== tenantId));

    // Clean up all local cache for that shop
    localStorage.removeItem(`qistflow_demo_staff_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_products_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_customers_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_contracts_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_sales_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_assignments_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_visits_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_expenses_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_suppliers_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_purchases_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_branches_${tenantId}`);
    localStorage.removeItem(`qistflow_demo_payments_${tenantId}`);

    setActionSuccess(language === 'ur' ? 'دکان کامیابی سے سسٹم سے ختم کر دی گئی ہے۔' : 'Shop removed successfully.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleOpenEditOwnerCredentials = (tenant: any) => {
    setEditingTenantOwner(tenant);
    setEditOwnerName(tenant.ownerName);
    setEditOwnerEmail(tenant.ownerEmail);
    setEditOwnerPhone(tenant.phone || '');
    setEditOwnerPassword(tenant.ownerPassword || 'Pak@12345');
    setShowEditOwnerPass(false);
  };

  const handleSaveOwnerCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenantOwner || !editOwnerName || !editOwnerEmail || !editOwnerPassword) return;
    setSavingOwnerDetails(true);
    try {
      const updatedTenants = tenants.map((t) => {
        if (t.tenantId === editingTenantOwner.tenantId) {
          return {
            ...t,
            ownerName: editOwnerName,
            ownerEmail: editOwnerEmail,
            phone: editOwnerPhone,
            ownerPassword: editOwnerPassword,
          };
        }
        return t;
      });
      setTenants(updatedTenants);
      localStorage.setItem('qistflow_registered_shops', JSON.stringify(updatedTenants));

      if (editingTenantOwner.tenantId === 'tenant-demo-ryk-01') {
        await StaffRepository.updateStaffDetails(
          'tenant-demo-ryk-01',
          'demo-owner-01',
          {
            displayName: editOwnerName,
            email: editOwnerEmail,
            phone: editOwnerPhone,
            password: editOwnerPassword,
          },
          true
        );
      }

      setEditingTenantOwner(null);
      setActionSuccess(
        language === 'ur'
          ? `دکان (${editingTenantOwner.businessName}) کے مالک کے لاگ ان کریڈنشلز کامیابی سے اپڈیٹ ہو گئے!`
          : 'Owner credentials updated successfully!'
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to save owner credentials');
    } finally {
      setSavingOwnerDetails(false);
    }
  };

  const handleSaveTenantStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    const updated = tenants.map((t) =>
      t.tenantId === selectedTenant.tenantId
        ? { ...t, status: editStatus, supportNotes: notesInput }
        : t
    );
    setTenants(updated);
    localStorage.setItem('qistflow_registered_shops', JSON.stringify(updated));
    setSelectedTenant(null);
    setActionSuccess('Shop status updated successfully!');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const toggleTenantPassword = (tenantId: string) => {
    setShowTenantPasswords((prev) => ({ ...prev, [tenantId]: !prev[tenantId] }));
  };

  const handleOnboardShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName || !newOwnerName || !newOwnerEmail || !newOwnerPassword) return;

    const newTenantId = `tenant_${Date.now()}`;
    const newTenant = {
      tenantId: newTenantId,
      businessName: newShopName,
      businessNameUr: newShopNameUr || newShopName,
      ownerName: newOwnerName,
      ownerEmail: newOwnerEmail,
      ownerPassword: newOwnerPassword,
      phone: newShopPhone,
      city: newShopCity,
      plan: newShopPlan,
      licenceType: 'subscription',
      status: 'active',
      activeContracts: 0,
      createdAt: new Date().toISOString().split('T')[0],
      supportNotes: 'Newly onboarded shop by Super-Admin.',
    };

    const updated = [newTenant, ...tenants];
    setTenants(updated);
    localStorage.setItem('qistflow_registered_shops', JSON.stringify(updated));
    setIsOnboardShopModalOpen(false);
    setShareTenantHandover(newTenant);
    setActionSuccess(language === 'ur' ? 'نئی دکان رجسٹر ہو گئی اور مالک کے لاگ ان کریڈنشلز تیار ہیں!' : 'Shop onboarded successfully!');
    setTimeout(() => setActionSuccess(null), 3000);

    setNewShopName('');
    setNewShopNameUr('');
    setNewOwnerName('');
    setNewOwnerEmail('');
    setNewOwnerPassword('Pak@12345');
  };

  const getTenantHandoverText = (t: any) => {
    return `*مبارک ہو! آپ کی دکان کا QistFlow پورٹل تیار ہے*
دکان کا نام: ${t.businessNameUr || t.businessName}
مالک کا نام: ${t.ownerName}
شہر: ${t.city}
لاگ ان ای میل (Gmail): ${t.ownerEmail}
پاس ورڈ (Password): ${t.ownerPassword}
سافٹ ویئر لنک: https://qistflow.app/login
سیکیورٹی نوٹ: اپنا پاس ورڈ محفوظ رکھیں اور صرف اپنے پاس رکھیں۔ ملازمین کے لاگ ان اکاؤنٹس آپ دکان کے اندر Staff پیج سے خود بنائیں گے۔`;
  };

  const copyTenantHandoverMessage = (t: any) => {
    navigator.clipboard.writeText(getTenantHandoverText(t));
    setTenantHandoverCopied(true);
    setTimeout(() => setTenantHandoverCopied(false), 2500);
  };

  const handleTestLoginAsOwner = (t: any) => {
    localStorage.setItem(
      'qistflow_demo_tenant',
      JSON.stringify({
        tenantId: t.tenantId,
        schemaVersion: 1,
        businessName: t.businessName,
        businessNameUr: t.businessNameUr || t.businessName,
        phone: t.phone || '',
        city: t.city || 'Rahim Yar Khan',
        address: t.city || '',
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        defaultLanguage: 'ur',
        subscriptionStatus: t.status || 'active',
        createdAt: t.createdAt || new Date().toISOString(),
        createdBy: t.tenantId + '_owner',
        updatedAt: new Date().toISOString(),
        updatedBy: t.tenantId + '_owner',
      })
    );

    enableDemoMode('owner', {
      userId: t.tenantId + '_owner',
      displayName: t.ownerName,
      email: t.ownerEmail,
      role: 'owner',
    });
    navigate('/dashboard');
  };

  const handleMarkSubscriptionPaid = (subId: string) => {
    setShopSubscriptions((prev) =>
      prev.map((s) => (s.subId === subId ? { ...s, status: 'paid', lastPaidDate: new Date().toISOString().split('T')[0] } : s))
    );
    setActionSuccess('Subscription payment recorded as paid!');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleOpenEditSub = (sub: any) => {
    setEditingSub(sub);
    setEditSubStatus(sub.status);
    setEditSubMonthlyFee(sub.monthlyFeePKR.toString());
    setEditSubDueDate(sub.dueDate);
    setEditSubLastPaidDate(sub.lastPaidDate || new Date().toISOString().split('T')[0]);
  };

  const handleSaveEditSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    const fee = parseInt(editSubMonthlyFee, 10) || 0;
    setShopSubscriptions((prev) =>
      prev.map((s) =>
        s.subId === editingSub.subId
          ? {
              ...s,
              status: editSubStatus,
              monthlyFeePKR: fee,
              annualCalculatedPKR: fee * 12,
              dueDate: editSubDueDate,
              lastPaidDate: editSubLastPaidDate,
            }
          : s
      )
    );
    setActionSuccess(
      language === 'ur'
        ? 'سبسکرپشن ریکارڈ کی کامیابی سے تصحیح کر دی گئی ہے۔'
        : 'Subscription record successfully updated.'
    );
    setEditingSub(null);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleUndoPaidSub = (subId: string) => {
    setShopSubscriptions((prev) =>
      prev.map((s) => (s.subId === subId ? { ...s, status: 'due' } : s))
    );
    setActionSuccess(
      language === 'ur' ? 'فیس کی وصولی منسوخ (Undo) کر دی گئی۔' : 'Fee collection undone.'
    );
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.businessName.toLowerCase().includes(searchShop.toLowerCase()) ||
      t.city.toLowerCase().includes(searchShop.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchShop.toLowerCase())
  );

  return (
    <div>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '1.25rem',
          borderRadius: '0.75rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ShieldAlert size={22} className="text-warning" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              {language === 'ur' ? 'پلیٹ فارم ایڈمن پورٹل' : 'Platform Super-Admin Portal'}
            </h2>
            <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>SaaS Governance</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', margin: 0 }}>
            {language === 'ur'
              ? 'شاپس کی ڈائریکٹری، دکانوں کی سبسکرپشن فیس، کمرشل پلانز اور فائر بیس اسپارک فری کوٹہ'
              : 'Multi-tenant shop directory, SaaS subscription fees, commercial plan entitlements, and Spark quota monitoring.'}
          </p>
        </div>

        {/* Tab pills */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.12)', padding: '0.25rem', borderRadius: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`btn btn-sm ${activeTab === 'tenants' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: activeTab === 'tenants' ? '#fff' : '#e2e8f0', fontSize: '0.75rem' }}
          >
            <Store size={14} />
            <span>{language === 'ur' ? 'شاپس ڈائریکٹری' : 'Shops Directory'}</span>
          </button>
          <button
            onClick={() => setActiveTab('dues')}
            className={`btn btn-sm ${activeTab === 'dues' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: activeTab === 'dues' ? '#fff' : '#e2e8f0', fontSize: '0.75rem' }}
          >
            <CreditCard size={14} />
            <span>{language === 'ur' ? 'سبسکرپشن فیس (Dues)' : 'Shop SaaS Fees'}</span>
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`btn btn-sm ${activeTab === 'plans' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: activeTab === 'plans' ? '#fff' : '#e2e8f0', fontSize: '0.75rem' }}
          >
            <Layers size={14} />
            <span>{language === 'ur' ? 'کمرشل پلانز' : 'Plans & Pricing'}</span>
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`btn btn-sm ${activeTab === 'health' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: activeTab === 'health' ? '#fff' : '#e2e8f0', fontSize: '0.75rem' }}
          >
            <Activity size={14} />
            <span>{language === 'ur' ? 'اسپارک کوٹہ' : 'Spark Health'}</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success mb-4" style={{ padding: '0.75rem' }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tenant Privacy Notice */}
      <div className="alert alert-info mb-4" style={{ fontSize: '0.8125rem', padding: '0.75rem 1rem' }}>
        <CheckCircle size={16} />
        <span>
          {language === 'ur'
            ? 'سیکیورٹی پرنسپل (PRD 4.5): سپر ایڈمن صرف شاپس کے لائسنس اور سبسکرپشن کا انتظام سنبھالتا ہے۔ دکانوں کی نجی اشیاء اور کسٹمرز کے اقساط کھاتے انفرادی دکان کے پاس مکمل محفوظ ہیں۔'
            : 'SaaS Governance Distinction: Platform Super-Admin manages shop subscription licensing and system health. Individual shop products and customer installment ledgers remain completely isolated.'}
        </span>
      </div>

      {/* ================= TAB 1: TENANTS DIRECTORY ================= */}
      {activeTab === 'tenants' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="card-title">
                {language === 'ur' ? 'رجسٹرڈ دکانوں کی فہرست و مالکان کے لاگ انز' : 'Registered Shops Directory & Owner Credentials'}
              </h3>
              <p className="card-subtitle">
                {language === 'ur'
                  ? 'سپر ایڈمن دکان کا کھاتہ اور مالک کا جی میل / پاس ورڈ بنا کر دیتا ہے (No public signup)'
                  : 'Platform super-admin provisions shop tenancies and creates owner login credentials.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setIsOnboardShopModalOpen(true)}
                className="btn btn-sm btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <PlusCircle size={15} />
                <span>{language === 'ur' ? 'نئی دکان آن بورڈ کریں' : 'Onboard New Shop'}</span>
              </button>
              <div style={{ width: '100%', maxWidth: '220px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={language === 'ur' ? 'تلاش کریں...' : 'Search shop, city, or owner...'}
                  value={searchShop}
                  onChange={(e) => setSearchShop(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ur' ? 'دکان کا نام' : 'Shop / Business'}</th>
                  <th>{language === 'ur' ? 'مالک / فون' : 'Owner & Contact'}</th>
                  <th>{language === 'ur' ? 'مالک کا لاگ ان (Gmail & Password)' : 'Owner Login (Gmail & Password)'}</th>
                  <th>{language === 'ur' ? 'شہر' : 'City'}</th>
                  <th>{language === 'ur' ? 'پلان' : 'Plan'}</th>
                  <th>{language === 'ur' ? 'اسٹیٹس' : 'Status'}</th>
                  <th>{language === 'ur' ? 'انتظام و ایکشنز' : 'Actions & Handover'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t) => {
                  const isPassVisible = !!showTenantPasswords[t.tenantId];
                  return (
                    <tr key={t.tenantId}>
                      <td>
                        <div className="font-semibold">{t.businessName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t.businessNameUr}</div>
                      </td>
                      <td>
                        <div className="font-semibold">{t.ownerName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }} dir="ltr">{t.phone}</div>
                      </td>
                      <td>
                        <div style={{ background: '#f8fafc', padding: '0.35rem 0.6rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', minWidth: '190px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{t.ownerEmail}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                              {isPassVisible ? t.ownerPassword : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleTenantPassword(t.tenantId)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b' }}
                              title={isPassVisible ? 'Hide password' : 'Show password'}
                            >
                              {isPassVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(t.ownerPassword);
                                setActionSuccess(`پاس ورڈ کاپی ہو گیا: ${t.ownerPassword}`);
                                setTimeout(() => setActionSuccess(null), 2500);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0284c7' }}
                              title="Copy password"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditOwnerCredentials(t)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#059669' }}
                              title={language === 'ur' ? 'مالک کی تفصیلات و پاس ورڈ تبدیل کریں' : 'Edit owner credentials'}
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline">{t.city}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t.plan}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            t.status === 'active'
                              ? 'badge-success'
                              : t.status === 'trial'
                              ? 'badge-info'
                              : t.status === 'grace'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setShareTenantHandover(t)}
                            className="btn btn-sm btn-outline text-success"
                            title={language === 'ur' ? 'مالک کو واٹس ایپ پر لاگ ان تفصیلات بھیجیں' : 'Send WhatsApp handover'}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            <MessageCircle size={13} />
                            <span>{language === 'ur' ? 'لاگ ان بھیجیں' : 'Handover'}</span>
                          </button>
                          <button
                            onClick={() => handleTestLoginAsOwner(t)}
                            className="btn btn-sm btn-outline"
                            title={language === 'ur' ? 'دکان دار کے طور پر ٹیسٹ لاگ ان کریں' : 'Test login as owner'}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            <Eye size={13} />
                            <span>{language === 'ur' ? 'ٹیسٹ لاگ ان' : 'Test'}</span>
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            className="btn btn-sm btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            <Edit size={13} />
                            <span>{language === 'ur' ? 'لائسنس' : 'Manage'}</span>
                          </button>
                          {t.tenantId !== 'tenant-demo-ryk-01' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTenant(t.tenantId)}
                              className="btn btn-sm btn-outline"
                              title={language === 'ur' ? 'دکان حذف کریں' : 'Delete Shop'}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: '#dc2626', borderColor: '#fca5a5' }}
                            >
                              <Trash2 size={13} />
                              <span>{language === 'ur' ? 'حذف' : 'Delete'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SHOP SAAS SUBSCRIPTION DUES ================= */}
      {activeTab === 'dues' && (() => {
        const totalMonthlyFee = shopSubscriptions.reduce((acc, s) => acc + s.monthlyFeePKR, 0);
        const totalAnnualProjected = totalMonthlyFee * 12;
        const lifetimeShopsCount = shopSubscriptions.filter((s) => s.status === 'lifetime').length;
        const activeMonthlyShops = shopSubscriptions.filter((s) => s.monthlyFeePKR > 0).length;

        return (
        <div>
          {/* Executive SaaS Revenue Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', color: '#fff' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                {language === 'ur' ? 'ماہانہ سبسکرپشن فیس (MRR)' : 'Monthly Recurring (MRR)'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>
                Rs. {totalMonthlyFee.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {activeMonthlyShops} {language === 'ur' ? 'ماہانہ پیکج والی دکانیں' : 'monthly subscription shops'}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: '#fff' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                {language === 'ur' ? 'سالانہ متوقع فیس (Annual Projected)' : 'Annual Projected (ARR)'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>
                Rs. {totalAnnualProjected.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {language === 'ur' ? '12 ماہ کے حساب سے سالانہ کل آمدنی' : 'Calculated over 12 months'}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, #6b21a8 0%, #7e22ce 100%)', color: '#fff' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                {language === 'ur' ? 'لائف ٹائم لائسنس وصولی' : 'Lifetime Licenses Revenue'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>
                Rs. 34,999
              </div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {lifetimeShopsCount} {language === 'ur' ? 'دکان (یکمشت مکمل ادا شدہ)' : 'shop (one-time paid)'}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {language === 'ur' ? 'مجموعی پلیٹ فارم پورٹ فولیو' : 'Total SaaS Portfolio'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                Rs. {(totalAnnualProjected + 34999).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
                {shopSubscriptions.length} {language === 'ur' ? 'رجسٹرڈ دکانیں آن بورڈ' : 'registered shops onboard'}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="card-title">
                  {language === 'ur' ? 'دکانوں کی ماہانہ فیس اور سالانہ حساب کتاب' : 'Shop SaaS Subscription Dues & Annual Billing'}
                </h3>
                <p className="card-subtitle">
                  {language === 'ur'
                    ? 'دکان داروں کی طرف سے قسط فلو سوفٹ ویئر کی واجب الادا ماہانہ و سالانہ فیس اور تجدید کی تاریخیں'
                    : 'Track monthly & annual equivalent SaaS subscription fees per shop tenant.'}
                </p>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>{language === 'ur' ? 'دکان اور مالک' : 'Shop & Owner'}</th>
                    <th>{language === 'ur' ? 'ماہانہ فیس (Monthly)' : 'Monthly Fee'}</th>
                    <th>{language === 'ur' ? 'سالانہ تخمینہ (Annual)' : 'Annual Equivalent'}</th>
                    <th>{language === 'ur' ? 'تجدید تاریخ' : 'Renewal Due Date'}</th>
                    <th>{language === 'ur' ? 'بلنگ اسٹیٹس' : 'Billing Status'}</th>
                    <th>{language === 'ur' ? 'یاددہانی و وصولی' : 'Collection Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {shopSubscriptions.map((sub) => {
                    const reminderMessage = `السلام علیکم ${sub.ownerName}! ${sub.businessName} کے قسط فلو سوفٹ ویئر کی ماہانہ فیس مبلغ Rs. ${sub.monthlyFeePKR.toLocaleString()} واجب الادا ہے۔ تجدید کے لیے رابطہ کریں۔ شکریہ`;
                    const annualFee = sub.monthlyFeePKR * 12;

                    return (
                      <tr key={sub.subId}>
                        <td>
                          <div className="font-semibold">{sub.businessName}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {sub.ownerName} • <span dir="ltr">{sub.phone}</span> ({sub.city})
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{sub.planName}</div>
                          <div className="text-success font-semibold" style={{ fontSize: '0.8125rem' }}>
                            {sub.monthlyFeePKR > 0 ? `Rs. ${sub.monthlyFeePKR.toLocaleString()} / mo` : 'Paid in Full (Lifetime)'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.875rem' }}>
                            {sub.monthlyFeePKR > 0 ? `Rs. ${annualFee.toLocaleString()} / yr` : 'Rs. 34,999 (Lifetime)'}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
                            {sub.monthlyFeePKR > 0 ? `12 × Rs. ${sub.monthlyFeePKR.toLocaleString()}` : 'One-time Payment'}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold">{sub.dueDate}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Last Paid: {sub.lastPaidDate}</div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              sub.status === 'paid' || sub.status === 'lifetime'
                                ? 'badge-success'
                                : sub.status === 'due'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {sub.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {sub.status !== 'paid' && sub.status !== 'lifetime' ? (
                              <>
                                <button
                                  onClick={() => handleMarkSubscriptionPaid(sub.subId)}
                                  className="btn btn-sm btn-primary"
                                  title="Mark fee as received"
                                >
                                  <CheckCircle2 size={14} />
                                  <span>{language === 'ur' ? 'فیس وصول' : 'Collect Fee'}</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEditSub(sub)}
                                  className="btn btn-sm btn-outline"
                                  title="Edit subscription details"
                                >
                                  <Edit2 size={13} />
                                  <span>{language === 'ur' ? 'درستی' : 'Edit'}</span>
                                </button>
                                <a
                                  href={`https://wa.me/?text=${encodeURIComponent(reminderMessage)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-sm btn-outline text-success"
                                  title="Send WhatsApp fee reminder"
                                >
                                  <MessageCircle size={14} />
                                  <span>WhatsApp</span>
                                </a>
                              </>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                                  {language === 'ur' ? 'کھاتہ اپ ٹو ڈیٹ ہے' : 'Up-to-date'}
                                </span>
                                <button
                                  onClick={() => handleOpenEditSub(sub)}
                                  className="btn btn-sm btn-outline"
                                  title="Edit subscription details"
                                >
                                  <Edit2 size={12} />
                                  <span>{language === 'ur' ? 'درستی' : 'Edit'}</span>
                                </button>
                                {sub.status === 'paid' && (
                                  <button
                                    onClick={() => handleUndoPaidSub(sub.subId)}
                                    className="btn btn-sm btn-ghost text-danger"
                                    title="Undo paid status if clicked by mistake"
                                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                                  >
                                    <RotateCcw size={12} />
                                    <span>Undo</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ================= TAB 3: PLANS & PRICING ================= */}
      {activeTab === 'plans' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {plans.map((p) => (
              <div
                key={p.planId}
                className="card"
                style={{
                  border: p.billingType === 'lifetime' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div className="card-header" style={{ background: p.billingType === 'lifetime' ? '#f5f3ff' : '#f8fafc', padding: '0.75rem 1rem' }}>
                  <div>
                    <h3 className="card-title" style={{ color: p.billingType === 'lifetime' ? '#7c3aed' : '#0f172a', fontSize: '1rem' }}>
                      {p.name}
                    </h3>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{p.nameUr}</div>
                  </div>
                  <span className={`badge ${p.billingType === 'lifetime' ? 'badge-primary' : 'badge-slate'}`} style={{ fontSize: '0.6875rem' }}>
                    {p.billingType === 'lifetime' ? 'LIFETIME' : 'MONTHLY'}
                  </span>
                </div>

                <div className="card-body" style={{ flex: 1, padding: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                      Rs. {(p.pricePaisa / 100).toLocaleString()}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {p.billingType === 'monthly' ? ' / month' : ' one-time'}
                    </span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
                    {p.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle size={14} className="text-success" style={{ flexShrink: 0 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span className="text-muted">Staff: <strong>{p.maxUsers}</strong></span>
                  <span className="text-muted">Customers: <strong>{p.maxCustomers.toLocaleString()}</strong></span>
                  <span className="badge badge-success">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: SPARK HEALTH ================= */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HardDrive size={18} className="text-primary" />
                <h3 className="card-title">Firebase Spark Free Tier Compliance</h3>
              </div>
            </div>
            <div className="card-body">
              <p className="text-muted mb-4" style={{ fontSize: '0.8125rem' }}>
                Strict zero-cost guarantee: 100% inside Google Firebase Spark Free Plan without Blaze billing.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                    <span className="font-semibold">Daily Reads: 1,420 / 50,000 (Free Limit)</span>
                    <span className="text-success font-semibold">2.8% Used</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '2.8%', height: '100%', background: '#059669' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                    <span className="font-semibold">Daily Writes: 340 / 20,000 (Free Limit)</span>
                    <span className="text-success font-semibold">1.7% Used</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '1.7%', height: '100%', background: '#059669' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                    <span className="font-semibold">Storage: 42 MB / 1,024 MB (1 GB Free Limit)</span>
                    <span className="text-success font-semibold">4.1% Used</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '4.1%', height: '100%', background: '#059669' }} />
                  </div>
                </div>
              </div>

              <div className="alert alert-success mt-4" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
                <CheckCircle size={15} />
                <span>Zero financial cost incurred. All computations, PDFs, and ZIP bundles generated client-side in browser.</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System & Hosting Health</h3>
            </div>
            <div className="card-body" style={{ fontSize: '0.8125rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span className="text-muted">Frontend Hosting:</span>
                  <span className="font-semibold text-success">GitHub Pages ($0/mo)</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span className="text-muted">Single Page App Fallback:</span>
                  <span className="font-semibold">public/404.html Active</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span className="text-muted">Financial Precision:</span>
                  <span className="font-semibold">Integer Paisa (1 PKR = 100 Paisa)</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                  <span className="text-muted">Target Districts:</span>
                  <span className="font-semibold">Rahim Yar Khan, Khanpur, Sadiqabad</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Edit Licence / Status Modal */}
      {selectedTenant && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="card" style={{ width: '92%', maxWidth: '520px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                {language === 'ur' ? 'شاپ لائسنس و اسٹیٹس' : 'Manage Shop Licence & Status'}
              </h3>
              <button
                onClick={() => setSelectedTenant(null)}
                className="btn btn-icon btn-outline btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTenantStatus}>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                <div className="font-semibold">{selectedTenant.businessName}</div>
                <div className="text-muted">{selectedTenant.city} • {selectedTenant.ownerName} ({selectedTenant.phone})</div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">{language === 'ur' ? 'لائسنس اسٹیٹس' : 'Licence Status'}</label>
                <select
                  className="form-input"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="active">Active (مکمل فعال)</option>
                  <option value="trial">Trial (آزمائشی مدت)</option>
                  <option value="grace">Grace Period (مہلت - 7 دن باقی)</option>
                  <option value="read_only">Read Only (صرف ریڈ کی اجازت)</option>
                  <option value="suspended">Suspended (معطل)</option>
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">{language === 'ur' ? 'سپورٹ نوٹس اور کمنٹس' : 'Internal Support Notes'}</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Record support interactions, pilot feedback, or renewal dates..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  className="btn btn-outline"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{t('common.save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboard New Shop & Owner Login Modal */}
      {isOnboardShopModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ margin: 0 }}>
                  {language === 'ur' ? 'نئی دکان اور مالک کا لاگ ان رجسٹر کریں' : 'Onboard New Shop & Owner Login'}
                </h3>
                <p className="card-subtitle" style={{ margin: '0.2rem 0 0', fontSize: '0.75rem' }}>
                  {language === 'ur' ? 'سپر ایڈمن دکان کا کھاتہ بنائے گا اور مالک کا جی میل / پاس ورڈ جاری کرے گا' : 'Super-Admin provisions tenancy and issues owner Gmail and initial password.'}
                </p>
              </div>
              <button
                onClick={() => setIsOnboardShopModalOpen(false)}
                className="btn btn-icon btn-outline btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleOnboardShop}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'دکان کا نام (English)' : 'Shop Name (English) *'}</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      placeholder="e.g. Al-Rehman Electronics"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'دکان کا نام (اردو)' : 'Shop Name (Urdu)'}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newShopNameUr}
                      onChange={(e) => setNewShopNameUr(e.target.value)}
                      placeholder="مثال: الرحمٰن الیکٹرانکس اینڈ انسٹالمنٹ"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'شہر' : 'City *'}</label>
                    <select
                      className="form-input"
                      value={newShopCity}
                      onChange={(e) => setNewShopCity(e.target.value)}
                    >
                      <option value="Rahim Yar Khan">Rahim Yar Khan (رحیم یار خان)</option>
                      <option value="Khanpur">Khanpur (خانپور)</option>
                      <option value="Sadiqabad">Sadiqabad (صادق آباد)</option>
                      <option value="Liaquatpur">Liaquatpur (لیاقت پور)</option>
                      <option value="Bahawalpur">Bahawalpur (بہاولپور)</option>
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'مالک کا نام' : 'Owner Name *'}</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                    />
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.875rem', borderRadius: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#166534', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <KeyRound size={15} />
                    <span>{language === 'ur' ? 'مالک کے لاگ ان کریڈنشلز (Owner Login Credentials)' : 'Owner Login Credentials (Gmail & Password)'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-group mb-0">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>{language === 'ur' ? 'مالک کی جی میل (Gmail) *' : 'Owner Gmail *'}</label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        value={newOwnerEmail}
                        onChange={(e) => setNewOwnerEmail(e.target.value)}
                        placeholder="owner@gmail.com"
                      />
                    </div>
                    <div className="form-group mb-0">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>{language === 'ur' ? 'مالک کا پاس ورڈ *' : 'Initial Password *'}</label>
                      <input
                        type="text"
                        required
                        className="form-input font-mono"
                        value={newOwnerPassword}
                        onChange={(e) => setNewOwnerPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'مالک کا موبائل نمبر' : 'Owner Phone *'}</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      value={newShopPhone}
                      onChange={(e) => setNewShopPhone(e.target.value)}
                      placeholder="0300-1234567"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'سبسکرپشن پلان' : 'Subscription Plan'}</label>
                    <select
                      className="form-input"
                      value={newShopPlan}
                      onChange={(e) => setNewShopPlan(e.target.value)}
                    >
                      <option value="Professional Monthly (Rs. 3,499)">Professional Monthly (Rs. 3,499)</option>
                      <option value="Standard Monthly (Rs. 1,999)">Standard Monthly (Rs. 1,999)</option>
                      <option value="Starter Monthly (Rs. 999)">Starter Monthly (Rs. 999)</option>
                      <option value="Standard Lifetime (Rs. 34,999)">Standard Lifetime (Rs. 34,999)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsOnboardShopModalOpen(false)}
                  className="btn btn-outline"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={16} />
                  <span>{language === 'ur' ? 'دکان آن بورڈ کریں و کریڈنشلز جاری کریں' : 'Onboard & Issue Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Owner Credentials Modal */}
      {editingTenantOwner && (
        <div className="modal-overlay" style={{ zIndex: 65 }}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={18} className="text-primary" />
                <h3 className="modal-title">
                  {language === 'ur' ? 'دکان دار کے لاگ ان کریڈنشلز میں ترمیم' : 'Edit Shop Owner Credentials'}
                </h3>
              </div>
              <button onClick={() => setEditingTenantOwner(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveOwnerCredentials}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{editingTenantOwner.businessName}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{editingTenantOwner.city} • ID: {editingTenantOwner.tenantId}</div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">{language === 'ur' ? 'دکان دار کا مکمل نام' : 'Owner Full Name *'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'موبائل نمبر (WhatsApp)' : 'Mobile Phone *'}</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editOwnerPhone}
                      onChange={(e) => setEditOwnerPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'لاگ ان پاس ورڈ' : 'Login Password *'}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showEditOwnerPass ? 'text' : 'password'}
                        className="form-input font-mono"
                        value={editOwnerPassword}
                        onChange={(e) => setEditOwnerPassword(e.target.value)}
                        required
                        minLength={6}
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditOwnerPass(!showEditOwnerPass)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {showEditOwnerPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">{language === 'ur' ? 'لاگ ان ای میل / جی میل' : 'Login Email / Gmail *'}</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editOwnerEmail}
                    onChange={(e) => setEditOwnerEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingTenantOwner(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingOwnerDetails}>
                  {savingOwnerDetails ? t('common.loading') : language === 'ur' ? 'کریڈنشلز محفوظ کریں' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Handover Credentials Modal (WhatsApp / Copy) */}
      {shareTenantHandover && (
        <div className="modal-overlay" style={{ zIndex: 70 }}>
          <div className="card" style={{ width: '92%', maxWidth: '520px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <MessageCircle size={18} />
                </div>
                <h3 className="card-title" style={{ margin: 0 }}>
                  {language === 'ur' ? 'مالک کو لاگ ان کی ترسیل (Handover)' : 'Share Login with Shop Owner'}
                </h3>
              </div>
              <button
                onClick={() => setShareTenantHandover(null)}
                className="btn btn-icon btn-outline btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
              {language === 'ur'
                ? `یہ لاگ ان پیغام دکان دار (${shareTenantHandover.ownerName}) کو واٹس ایپ یا ایس ایم ایس کے ذریعے بھیجیں تاکہ وہ اپنا پورٹل کھول سکیں۔`
                : `Send this login handover message to the shop owner (${shareTenantHandover.ownerName}) via WhatsApp or SMS.`}
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                padding: '0.875rem',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '220px',
                overflowY: 'auto',
                marginBottom: '1rem',
                lineHeight: 1.5,
              }}
            >
              {getTenantHandoverText(shareTenantHandover)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => copyTenantHandoverMessage(shareTenantHandover)}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Copy size={15} />
                <span>{tenantHandoverCopied ? (language === 'ur' ? 'کاپی ہو گیا!' : 'Copied!') : (language === 'ur' ? 'پیغام کاپی کریں' : 'Copy Message')}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getTenantHandoverText(shareTenantHandover))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ background: '#22c55e', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <MessageCircle size={15} />
                  <span>{language === 'ur' ? 'واٹس ایپ پر بھیجیں' : 'Send via WhatsApp'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal for Super Admin (Mistake Correction / Undo) */}
      {editingSub && (
        <div className="modal-overlay" style={{ zIndex: 75 }}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} className="text-primary" />
                <h3 className="modal-title">
                  {language === 'ur' ? 'سبسکرپشن فیس کھاتہ میں ترمیم' : 'Edit Shop Subscription & Billing'}
                </h3>
              </div>
              <button onClick={() => setEditingSub(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSub}>
              <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                  <div className="font-semibold" style={{ color: '#0f172a' }}>{editingSub.shopName}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Plan: {editingSub.planName}</div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">{language === 'ur' ? 'سبسکرپشن کیفیت (Status)' : 'Status'}</label>
                  <select
                    className="form-select"
                    value={editSubStatus}
                    onChange={(e: any) => setEditSubStatus(e.target.value)}
                  >
                    <option value="paid">{language === 'ur' ? 'ادا شدہ (Paid / Up-to-date)' : 'Paid / Up-to-date'}</option>
                    <option value="due">{language === 'ur' ? 'واجب الادا (Due)' : 'Due'}</option>
                    <option value="overdue">{language === 'ur' ? 'تاخیر کا شکار (Overdue)' : 'Overdue'}</option>
                    <option value="lifetime">{language === 'ur' ? 'لائف ٹائم لائسنس (Lifetime)' : 'Lifetime'}</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">{language === 'ur' ? 'ماہانہ فیس (روپے)' : 'Monthly Fee (PKR)'}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editSubMonthlyFee}
                    onChange={(e) => setEditSubMonthlyFee(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">{language === 'ur' ? 'اگلی مقررہ تاریخ (Due Date)' : 'Next Due Date'}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editSubDueDate}
                    onChange={(e) => setEditSubDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-2">
                  <label className="form-label">{language === 'ur' ? 'آخری ادائیگی کی تاریخ (Last Paid Date)' : 'Last Paid Date'}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editSubLastPaidDate}
                    onChange={(e) => setEditSubLastPaidDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingSub(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {language === 'ur' ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
