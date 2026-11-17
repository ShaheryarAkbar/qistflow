// ============================================================================
// Staff Feature: Staff Governance, Roles & Direct Credential Creation
// Exclusive to Business Owner & Shop Manager (PRD Section 4.1 & 6.1)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  UserPlus,
  Shield,
  Phone,
  Mail,
  CheckCircle,
  X,
  Lock,
  Copy,
  Share2,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Sliders,
  Check,
  Banknote,
  DollarSign,
  Wallet,
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  Edit2,
  Building2,
  Smartphone,
  Laptop,
  Tablet,
  Radio,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { UserRole, StaffPayrollRecord, PaymentMethod } from '@/types';
import { StaffRepository, StaffMemberRecord } from '@/repositories/staff.repository';
import { SessionTrackerService, ActiveSessionRecord } from '@/services/sessionTracker.service';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { rupeesToPaisa } from '@/domain/money/paisa';

export const StaffPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant, isOwner, isManager, canManageStaff, reloadMembership } = useTenant();
  const { currentUser, isDemoUser, switchDemoStaff } = useAuth();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'payroll'>('members');

  // Payroll state
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [payrollRecords, setPayrollRecords] = useState<StaffPayrollRecord[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // Salary Edit Modal
  const [editingSalaryMember, setEditingSalaryMember] = useState<StaffMemberRecord | null>(null);
  const [editSalaryRupees, setEditSalaryRupees] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);

  // Pay Salary Modal
  const [payingPayrollRecord, setPayingPayrollRecord] = useState<StaffPayrollRecord | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payNotes, setPayNotes] = useState('');
  const [processingPay, setProcessingPay] = useState(false);

  // Printable Salary Slip
  const [activeSlipRecord, setActiveSlipRecord] = useState<StaffPayrollRecord | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tempPassword, setTempPassword] = useState('Pak@12345');
  const [role, setRole] = useState<UserRole>('recovery');
  const [designation, setDesignation] = useState('Recovery Officer');
  const [monthlySalaryRupees, setMonthlySalaryRupees] = useState('30000');
  const [saving, setSaving] = useState(false);

  // Permission Configuration Modal State
  const [targetMemberForPerms, setTargetMemberForPerms] = useState<StaffMemberRecord | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Success Credential Card Modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Password Vault States
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMemberRecord | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffDesignation, setEditStaffDesignation] = useState('');
  const [editStaffPassword, setEditStaffPassword] = useState('');
  const [showEditStaffPass, setShowEditStaffPass] = useState(false);
  const [savingStaffDetails, setSavingStaffDetails] = useState(false);
  const [shareHandoverMember, setShareHandoverMember] = useState<StaffMemberRecord | null>(null);
  const [handoverCopied, setHandoverCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Concurrent Device Sessions State
  const [activeSessions, setActiveSessions] = useState<ActiveSessionRecord[]>([]);
  const [inspectingStaffSessions, setInspectingStaffSessions] = useState<{
    member: StaffMemberRecord;
    sessions: ActiveSessionRecord[];
  } | null>(null);

  useEffect(() => {
    setActiveSessions(SessionTrackerService.getAllSessions());
    const unsub = SessionTrackerService.subscribe((sessions) => {
      setActiveSessions(sessions);
      setInspectingStaffSessions((prev) => {
        if (!prev) return null;
        return {
          member: prev.member,
          sessions: sessions.filter((s) => s.userId === prev.member.userId),
        };
      });
    });
    return () => unsub();
  }, []);

  const handleTerminateSession = (sessionId: string) => {
    SessionTrackerService.terminateSession(sessionId);
    showToast(language === 'ur' ? 'ڈیوائس سیشن لاگ آؤٹ / منقطع کر دیا گیا!' : 'Device session terminated successfully!');
  };

  const handleSimulateAddDevice = (userId: string) => {
    SessionTrackerService.simulateAddDeviceSession(userId);
    showToast(language === 'ur' ? 'نیا فیلڈ موبائل لاگ ان کامیابی سے شامل ہوا!' : 'New field mobile login simulated!');
  };

  const handleTerminateAllStaffSessions = (userId: string) => {
    SessionTrackerService.terminateAllUserSessions(userId);
    showToast(language === 'ur' ? 'تمام ریموٹ ڈیوائسز لاگ آؤٹ کر دی گئیں!' : 'All remote sessions terminated!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleShowPassword = (userId: string) => {
    setShowPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenEditStaff = (member: StaffMemberRecord) => {
    setEditingStaffMember(member);
    setEditStaffName(member.displayName);
    setEditStaffPhone(member.phone || '');
    setEditStaffEmail(member.email);
    setEditStaffDesignation(member.designation || member.role.toUpperCase());
    setEditStaffPassword(member.password || 'Pak@12345');
    setShowEditStaffPass(false);
  };

  const handleSaveStaffDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !editingStaffMember || !editStaffName || !editStaffEmail || !editStaffPassword) return;
    setSavingStaffDetails(true);
    try {
      await StaffRepository.updateStaffDetails(
        activeTenant.tenantId,
        editingStaffMember.userId,
        {
          displayName: editStaffName,
          email: editStaffEmail,
          phone: editStaffPhone,
          designation: editStaffDesignation,
          password: editStaffPassword,
        },
        isDemoUser
      );
      setEditingStaffMember(null);
      await loadStaff();
      showToast(language === 'ur' ? 'ملازم کی تفصیلات و پاس ورڈ کامیابی سے تبدیل ہو گئے!' : 'Staff credentials updated successfully!');
    } catch (err: any) {
      alert(err?.message || 'Failed to update credentials');
    } finally {
      setSavingStaffDetails(false);
    }
  };

  const handleOpenShareHandover = (member: StaffMemberRecord) => {
    setShareHandoverMember(member);
    setHandoverCopied(false);
  };

  const getHandoverText = (member: StaffMemberRecord) => {
    return `*QistFlow لاگ ان تفصیلات برائے ملازم*
دکان: ${activeTenant?.businessNameUr || activeTenant?.businessName || 'قسط فلو'}
نام: ${member.displayName}
عہدہ: ${member.designation || member.role}
لاگ ان ای میل (Gmail): ${member.email}
پاس ورڈ (Password): ${member.password || 'Pak@12345'}
سافٹ ویئر لاگ ان لنک: https://qistflow.app/login
نوٹ: اپنا پاس ورڈ محفوظ رکھیں اور صرف اپنی ڈیوائس پر لاگ ان کریں۔`;
  };

  const copyHandoverMessage = (member: StaffMemberRecord) => {
    navigator.clipboard.writeText(getHandoverText(member));
    setHandoverCopied(true);
    setTimeout(() => setHandoverCopied(false), 2500);
  };

  const loadStaff = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await StaffRepository.getStaffMembers(activeTenant.tenantId, isDemoUser);
      setStaff(data);
    } finally {
      setLoading(false);
    }
  };

  const loadPayroll = async () => {
    if (!activeTenant) return;
    setLoadingPayroll(true);
    try {
      const data = await StaffRepository.getPayrollRecords(activeTenant.tenantId, selectedMonth, isDemoUser);
      setPayrollRecords(data);
    } finally {
      setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [activeTenant, isDemoUser]);

  useEffect(() => {
    if (activeTab === 'payroll') {
      loadPayroll();
    }
  }, [activeTenant, selectedMonth, activeTab, isDemoUser]);

  const handleOpenEditSalary = (member: StaffMemberRecord) => {
    setEditingSalaryMember(member);
    setEditSalaryRupees(((member.monthlySalaryPaisa || 0) / 100).toString());
    setEditDesignation(member.designation || member.role.toUpperCase());
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !editingSalaryMember) return;
    setSavingSalary(true);
    try {
      const paisa = rupeesToPaisa(editSalaryRupees);
      await StaffRepository.updateStaffSalary(
        activeTenant.tenantId,
        editingSalaryMember.userId,
        paisa,
        editDesignation,
        isDemoUser
      );
      setEditingSalaryMember(null);
      await loadStaff();
      if (activeTab === 'payroll') await loadPayroll();
    } catch (err: any) {
      alert(err?.message || 'Failed to update salary');
    } finally {
      setSavingSalary(false);
    }
  };

  const handleOpenPaySalary = (record: StaffPayrollRecord) => {
    setPayingPayrollRecord(record);
    setPayMethod('cash');
    setPayNotes(`Monthly salary for ${record.employeeName} (${record.monthKey})`);
  };

  const handleConfirmPaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !payingPayrollRecord) return;
    setProcessingPay(true);
    try {
      await StaffRepository.paySalary({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        payrollId: payingPayrollRecord.payrollId,
        amountPaisa: payingPayrollRecord.netPayablePaisa,
        paymentMethod: payMethod,
        notes: payNotes,
        isDemo: isDemoUser,
      });
      setPayingPayrollRecord(null);
      await loadPayroll();
    } catch (err: any) {
      alert(err?.message || 'Failed to process salary payment');
    } finally {
      setProcessingPay(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !name || !email) return;

    setSaving(true);
    try {
      await StaffRepository.inviteStaffMember({
        tenantId: activeTenant.tenantId,
        invitedBy: currentUser.uid,
        displayName: name,
        email,
        phone,
        role,
        password: tempPassword,
        designation,
        monthlySalaryPaisa: rupeesToPaisa(monthlySalaryRupees),
        isDemo: isDemoUser,
      });

      setCreatedCredentials({
        name,
        email,
        password: tempPassword,
        role,
        phone,
      });

      setName('');
      setEmail('');
      setPhone('');
      setTempPassword('Pak@12345');
      setIsInviteModalOpen(false);
      await loadStaff();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (member: StaffMemberRecord) => {
    if (!activeTenant || !canManageStaff) return;
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    await StaffRepository.updateStaffStatus(activeTenant.tenantId, member.userId, newStatus, isDemoUser);
    await loadStaff();
  };

  const handleOpenPermissionsModal = (member: StaffMemberRecord) => {
    setTargetMemberForPerms(member);
    setSelectedPerms(member.permissions || []);
  };

  const handleTogglePermission = (permKey: string) => {
    if (selectedPerms.includes(permKey)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== permKey));
    } else {
      setSelectedPerms([...selectedPerms, permKey]);
    }
  };

  const handleSavePermissions = async () => {
    if (!activeTenant || !targetMemberForPerms) return;
    setSavingPerms(true);
    try {
      await StaffRepository.updateStaffPermissions(
        activeTenant.tenantId,
        targetMemberForPerms.userId,
        selectedPerms,
        isDemoUser
      );
      await reloadMembership();
      setTargetMemberForPerms(null);
      await loadStaff();
    } finally {
      setSavingPerms(false);
    }
  };

  const managerPermOptions = [
    {
      key: 'manage_products',
      labelEn: 'Manage Products & Catalog',
      labelUr: 'پراڈکٹس اور کیٹلاگ شامل/تبدیل کرنا',
      descEn: 'Can create and edit inventory products and retail prices',
      descUr: 'نیا سامان شامل کرنے اور نقد/اقساط قیمتیں سیٹ کرنے کی اجازت',
    },
    {
      key: 'manage_inventory',
      labelEn: 'Stock Movements & Warehouse',
      labelUr: 'اسٹاک اور گودام مینجمنٹ',
      descEn: 'Can post stock movements (purchase-in, adjustments, damage)',
      descUr: 'مال کی خریداری انٹری اور گودام کے اسٹاک ایڈجسٹمنٹ',
    },
    {
      key: 'view_reports',
      labelEn: 'Shop Analytics & Reports',
      labelUr: 'دکان کی رپورٹس اور تجزئیے',
      descEn: 'Can view monthly collection summaries and sales reports',
      descUr: 'ماہانہ سیلز اور ریکوری چارٹس دیکھنے کی رسائی',
    },
    {
      key: 'assign_recovery',
      labelEn: 'Assign Recovery Officers',
      labelUr: 'ریکوری ملازمین کو گاہک تفویض کرنا',
      descEn: 'Can assign pending customer installments to field agents',
      descUr: 'واجب الادا قسطوں کی ریکوری کے لیے ملازم مقرر کرنا',
    },
    {
      key: 'can_manage_staff',
      labelEn: 'Manage Staff Logins',
      labelUr: 'ملازمین کے لاگ ان سنبھالنا',
      descEn: 'Can create or suspend sub-staff accounts',
      descUr: 'اکاؤنٹنٹ اور فیلڈ آفیسر کے لاگ ان بنانے یا معطل کرنے کا اختیار',
    },
    {
      key: 'grant_discounts',
      labelEn: 'POS Special Discounts',
      labelUr: 'سیلز میں رعایت (ڈسکاؤنٹ) دینا',
      descEn: 'Can approve customer discounts during checkout',
      descUr: 'نقد یا اقساط پر رعایت دینے کی اجازت',
    },
  ];

  const accountantPermOptions = [
    {
      key: 'view_financial_reports',
      labelEn: 'Full Financial Statements',
      labelUr: 'مکمل مالیاتی بیانات اور لیجر',
      descEn: 'Access to balance sheet, ledger summaries and P&L metrics',
      descUr: 'کھاتہ جاتی خلاصے اور نفع و نقصان کی تفصیلی رپورٹس',
    },
    {
      key: 'record_expenses',
      labelEn: 'Record Shop Expenses',
      labelUr: 'روزمرہ اخراجات کا اندراج',
      descEn: 'Can record shop expenses (rent, electricity, salaries, tea)',
      descUr: 'دکان کے روزمرہ اخراجات درج کرنے کی اجازت',
    },
    {
      key: 'request_reversals',
      labelEn: 'Payment Reversals',
      labelUr: 'پیمنٹ ریورسل / تصحیح',
      descEn: 'Can request reversal of mistakenly posted payments',
      descUr: 'غلط درج شدہ ادائیگی کی تصحیح یا منسوخی',
    },
    {
      key: 'view_contracts',
      labelEn: 'View Installment Contracts',
      labelUr: 'اقساط کے تمام معاہدات دیکھنا',
      descEn: 'Access to customer installment schedules and outstanding balances',
      descUr: 'کسٹمر کی قسطوں کے شیڈول اور بقیہ رقم کی معلومات',
    },
    {
      key: 'view_customers',
      labelEn: 'Customer Account Details',
      labelUr: 'گاہکوں کے کھاتے اور رابطے',
      descEn: 'View customer contact and guarantor info for audit',
      descUr: 'گاہکوں کے رابطے اور ضامن کی تصدیق',
    },
  ];

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return { label: language === 'ur' ? 'مالک (Owner)' : 'Owner', bg: 'badge-success' };
      case 'manager':
        return { label: language === 'ur' ? 'مینیجر (Manager)' : 'Manager', bg: 'badge-info' };
      case 'accountant':
        return { label: language === 'ur' ? 'اکاؤنٹنٹ (Finance)' : 'Accountant', bg: 'badge-warning' };
      case 'recovery':
        return { label: language === 'ur' ? 'ریکوری فیلڈ (Field)' : 'Recovery Agent', bg: 'badge-slate' };
      default:
        return { label: r, bg: 'badge-slate' };
    }
  };

  const copyCredentialsText = () => {
    if (!createdCredentials) return;
    const text = `*QistFlow Staff Login Credentials — ${activeTenant?.businessName || 'قسط فلو'}*
-----------------------------------
نام (Name): ${createdCredentials.name}
عہدہ (Role): ${createdCredentials.role.toUpperCase()}
لاگ ان ای میل (Email): ${createdCredentials.email}
پاس ورڈ (Password): ${createdCredentials.password}
پورٹل لنک: https://qistflow.pk (یا ایپ کھولیں)
-----------------------------------
نوٹ: پہلی بار لاگ ان کے بعد اپنا پاس ورڈ تبدیل کر لیں۔`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {t('nav.staff')}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'دکان کا عملہ، لاگ ان اکاؤنٹس، اور اختیارات (صرف مالک اور منیجر بنا سکتے ہیں)'
              : 'Shop staff accounts and role governance. Credentials can only be generated by shop leadership.'}
          </p>
        </div>

        {canManageStaff && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="btn btn-primary"
          >
            <UserPlus size={16} />
            <span>{language === 'ur' ? 'نیا عملہ شامل کریں (Create Login)' : 'Create Staff Login'}</span>
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('members')}
          className={`btn btn-sm ${activeTab === 'members' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <UserCheck size={15} />
          <span>{language === 'ur' ? 'عملہ اور لاگ ان اکاؤنٹس' : 'Staff Accounts & Roles'} ({staff.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`btn btn-sm ${activeTab === 'payroll' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <Banknote size={15} />
          <span>{language === 'ur' ? 'تنخواہوں کا رجسٹر و سلیپ (Salaries & Payroll)' : 'Salaries & Payroll Register'}</span>
        </button>
      </div>

      {/* Security principle box */}
      <div className="alert alert-info mb-6" style={{ fontSize: '0.8125rem' }}>
        <Shield size={16} />
        <span>
          {language === 'ur'
            ? 'سیکیورٹی اصول: ملازمین (ریکوری آفیسر، اکاؤنٹنٹ) باہر سے خود سائن اپ نہیں کر سکتے۔ ان کے لاگ ان صرف آپ (دکان کا مالک یا مینیجر) یہاں سے بنا کر دیں گے۔ ریکوری عملہ کو صرف اپنے تفویض شدہ کھاتوں تک محدود رسائی حاصل ہوگی۔'
            : 'Access Governance: Staff members cannot register externally. Their credentials must be directly provisioned here by shop leadership. Recovery agents have restricted mobile-first access.'}
        </span>
      </div>

      {/* TAB 1: Staff Members & Roles */}
      {activeTab === 'members' && (() => {
        const ownerMember = staff.find((m) => m.role === 'owner');
        const displayedStaff = isManager
          ? staff.filter((m) => m.role !== 'owner' && m.role !== 'manager')
          : isOwner
          ? staff.filter((m) => m.role !== 'owner')
          : staff;

        return (
        <div>
          {/* Staff Credentials & Passwords Vault Info Card */}
          <div
            className="card mb-4"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderLeft: '5px solid #2563eb',
              padding: '1rem',
              borderRadius: '0.625rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <KeyRound size={22} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                  {language === 'ur'
                    ? 'ملازمین کے لاگ انز و پاس ورڈز والٹ (Staff Credentials & Handover Vault)'
                    : 'Staff Credentials & Handover Vault'}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
                  {language === 'ur'
                    ? isOwner
                      ? 'دکان کا مالک مینیجر، اکاؤنٹنٹ، اور تمام ریکوری افسران کے لاگ ان ای میلز اور پاس ورڈز یہاں سے دیکھ سکتے ہیں، تبدیل کر سکتے ہیں اور براہ راست ملازم کو واٹس ایپ پر بھیج سکتے ہیں۔'
                      : 'دکان کا مینیجر اکاؤنٹنٹ اور فیلڈ ریکوری افسران کے لاگ ان ای میلز اور پاس ورڈز یہاں سے منظم کر سکتا ہے اور واٹس ایپ پر بھیج سکتا ہے۔'
                    : 'Shop leadership has visibility over subordinate staff credentials. You can view, reset, and hand over credentials directly via WhatsApp/SMS.'}
                </p>
              </div>
            </div>
          </div>

          {/* Owner Business Identity Banner (Visible strictly to Owner, hidden from Manager) */}
          {isOwner && ownerMember && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 size={22} className="text-success" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#166534' }}>
                    {language === 'ur' ? 'دکان دار و چیف ایڈمنسٹریٹر (Shop Owner & Founder)' : 'Shop Owner & Founder'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                    {ownerMember.displayName} • {ownerMember.email} • <span dir="ltr">{ownerMember.phone || '0300-1234567'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-success" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Smartphone size={11} />
                  <span>{language === 'ur' ? '1 ایکٹو ڈیوائس (آن لائن)' : '1 Active Device'}</span>
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  Full Business Control (کامل اختیارات)
                </span>
              </div>
            </div>
          )}

          <div className="card">
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Assigned Role</th>
                    <th>Designation</th>
                    <th>Monthly Salary</th>
                    <th>Permissions & Scope</th>
                    <th>Login Email & Password</th>
                    <th>{language === 'ur' ? 'ایکٹو ڈیوائسز / لاگ انز' : 'Active Devices / Logins'}</th>
                    <th>Phone</th>
                    <th>Joined Date</th>
                    <th>{t('common.status')}</th>
                    {canManageStaff && <th>{t('common.actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="text-center" style={{ padding: '2rem' }}>
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : displayedStaff.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center text-muted" style={{ padding: '2rem' }}>
                        {language === 'ur' ? 'کوئی ملازم ریکارڈ موجود نہیں' : 'No staff members found'}
                      </td>
                    </tr>
                  ) : displayedStaff.map((member) => {
                    const roleBadge = getRoleBadge(member.role);
                    const canConfigureThisMember = isOwner && (member.role === 'manager' || member.role === 'accountant');

                    return (
                      <tr key={member.userId}>
                        <td>
                          <div className="font-semibold">{member.displayName}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            ID: {member.userId}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${roleBadge.bg}`}>{roleBadge.label}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-slate-700" style={{ fontSize: '0.8125rem' }}>
                            {member.designation || member.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <MoneyDisplay paisa={member.monthlySalaryPaisa || 0} className="font-bold text-primary" />
                            {canManageStaff && (
                              <button
                                onClick={() => handleOpenEditSalary(member)}
                                className="btn btn-icon btn-sm btn-outline"
                                title={language === 'ur' ? 'تنخواہ تبدیل کریں' : 'Edit salary'}
                                style={{ padding: '0.2rem', width: '22px', height: '22px' }}
                              >
                                <Edit2 size={11} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          {member.role === 'owner' ? (
                            <span className="badge badge-success">Full Business Access</span>
                          ) : member.role === 'recovery' ? (
                            <span className="badge badge-slate">Restricted Mobile Field</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                                {member.permissions ? `${member.permissions.length} Active Rules` : 'Default Scope'}
                              </span>
                              {canConfigureThisMember && (
                                <button
                                  onClick={() => handleOpenPermissionsModal(member)}
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '0.125rem 0.5rem', fontSize: '0.6875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  title="Owner Configure Permissions"
                                >
                                  <Sliders size={12} />
                                  <span>{language === 'ur' ? 'اختیارات تبدیل کریں' : 'Configure'}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                              <Mail size={12} className="text-primary" />
                              <strong className="text-slate-900">{member.email}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <KeyRound size={12} className="text-amber-600" />
                              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                                {showPasswords[member.userId] ? (member.password || 'Pak@12345') : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleShowPassword(member.userId)}
                                className="btn btn-icon btn-sm btn-outline"
                                style={{ padding: '0.1rem', width: '20px', height: '20px' }}
                                title={showPasswords[member.userId] ? 'Hide' : 'Show password'}
                              >
                                {showPasswords[member.userId] ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(member.password || 'Pak@12345');
                                  showToast(language === 'ur' ? 'پاس ورڈ کاپی ہو گیا!' : 'Password copied!');
                                }}
                                className="btn btn-icon btn-sm btn-outline"
                                style={{ padding: '0.1rem', width: '20px', height: '20px' }}
                                title="Copy password"
                              >
                                <Copy size={11} />
                              </button>
                              {canManageStaff && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStaff(member)}
                                  className="btn btn-icon btn-sm btn-outline text-primary"
                                  style={{ padding: '0.1rem', width: '20px', height: '20px' }}
                                  title={language === 'ur' ? 'ملازم کی تفصیلات و پاس ورڈ تبدیل کریں' : 'Edit staff credentials & password'}
                                >
                                  <Edit2 size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {(() => {
                            const memberSessions = activeSessions.filter((s) => s.userId === member.userId);
                            const count = memberSessions.length;
                            if (count === 0) {
                              return (
                                <span
                                  className="badge badge-outline text-muted"
                                  style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }}></span>
                                  <span>{language === 'ur' ? 'آف لائن (0)' : 'Offline'}</span>
                                </span>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => setInspectingStaffSessions({ member, sessions: memberSessions })}
                                className={`badge ${count > 1 ? 'badge-primary' : 'badge-success'}`}
                                style={{
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  border: count > 1 ? '1px solid #86efac' : 'none',
                                  background: count > 1 ? '#f0fdf4' : undefined,
                                  color: count > 1 ? '#15803d' : undefined,
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.5rem',
                                  fontWeight: 600,
                                }}
                                title={language === 'ur' ? 'ایکٹو ڈیوائسز اور لاگ انز کی تفصیل دیکھیں' : 'View active device logins'}
                              >
                                <Smartphone size={12} />
                                <span>
                                  {count === 1
                                    ? (language === 'ur' ? '1 ڈیوائس (آن لائن)' : '1 Active Device')
                                    : (language === 'ur' ? `${count} ڈیوائسز (آن لائن)` : `${count} Active Devices`)}
                                </span>
                              </button>
                            );
                          })()}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem' }}>
                            {member.phone ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Phone size={12} className="text-muted" />
                                <span dir="ltr">{member.phone}</span>
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>{member.joinedAt}</td>
                        <td>
                          <StatusBadge status={member.status} />
                        </td>
                        {canManageStaff && (
                          <td>
                            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenShareHandover(member)}
                                className="btn btn-sm btn-outline text-success"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: '#86efac', background: '#f0fdf4' }}
                                title={language === 'ur' ? 'لاگ ان کی تفصیلات واٹس ایپ پر بھیجیں' : 'Share credentials with employee'}
                              >
                                <Share2 size={12} />
                                <span>{language === 'ur' ? 'لاگ ان بھیجیں' : 'Share'}</span>
                              </button>
                              {isDemoUser && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    switchDemoStaff(member);
                                    if (member.role === 'recovery') navigate('/recovery');
                                    else if (member.role === 'super_admin') navigate('/admin');
                                    else navigate('/dashboard');
                                  }}
                                  className="btn btn-sm btn-outline text-primary"
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  title={language === 'ur' ? `${member.displayName} کا لاگ ان ویو ٹیسٹ کریں` : `Test view as ${member.displayName}`}
                                >
                                  <Eye size={12} />
                                  <span>{language === 'ur' ? 'ٹیسٹ لاگ ان' : 'Test View'}</span>
                                </button>
                              )}
                              {canConfigureThisMember && (
                                <button
                                  onClick={() => handleOpenPermissionsModal(member)}
                                  className="btn btn-sm btn-outline text-primary"
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <Sliders size={13} />
                                  <span>{language === 'ur' ? 'اختیارات' : 'Perms'}</span>
                                </button>
                              )}
                              {member.role !== 'owner' ? (
                                <button
                                  onClick={() => handleToggleStatus(member)}
                                  className={`btn btn-sm ${member.status === 'active' ? 'btn-outline text-danger' : 'btn-outline text-success'}`}
                                >
                                  {member.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                              ) : (
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Owner</span>
                              )}
                            </div>
                          </td>
                        )}
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

      {/* TAB 2: Salaries & Payroll Register */}
      {activeTab === 'payroll' && (
        <div>
          {/* Payroll Header Controls & Summary */}
          <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {language === 'ur' ? 'ماہانہ تنخواہوں کا مصدقہ رجسٹر (Staff Payroll Register)' : 'Staff Monthly Payroll Register'}
                </h3>
                <p style={{ fontSize: '0.8125rem', opacity: 0.8, margin: '0.25rem 0 0' }}>
                  {language === 'ur'
                    ? 'تمام عملہ (مینیجر، اکاؤنٹنٹ، ریکوری ایجنٹس، صفائی والا/ہیلپر) کی تنخواہیں ادا کریں اور پرچی پرنٹ کریں۔'
                    : 'Manage salaries for all employees (Manager, Accountant, Recovery, Helper/Cleaner) with expense integration.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} className="text-emerald-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-input"
                  style={{ backgroundColor: '#fff', color: '#0f172a', fontWeight: 600, padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* Quick Metrics */}
            {(() => {
              const totalPayable = payrollRecords.reduce((s, r) => s + r.netPayablePaisa, 0);
              const totalPaid = payrollRecords.filter((r) => r.status === 'paid').reduce((s, r) => s + r.netPayablePaisa, 0);
              const totalPending = payrollRecords.filter((r) => r.status === 'pending').reduce((s, r) => s + r.netPayablePaisa, 0);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total Employees</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{payrollRecords.length}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total Monthly Payroll</div>
                    <MoneyDisplay paisa={totalPayable} className="font-bold" style={{ fontSize: '1.25rem' }} />
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, color: '#86efac' }}>Total Paid</div>
                    <MoneyDisplay paisa={totalPaid} className="font-bold text-success" style={{ fontSize: '1.25rem' }} />
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, color: '#fde047' }}>Pending To Pay</div>
                    <MoneyDisplay paisa={totalPending} className="font-bold text-warning" style={{ fontSize: '1.25rem' }} />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Payroll Table */}
          <div className="card">
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee & Designation</th>
                    <th>Role</th>
                    <th>Base Salary</th>
                    <th>Net Payable</th>
                    <th>Status</th>
                    <th>Payment Details</th>
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
                  ) : (() => {
                    const displayedPayroll = isManager
                      ? payrollRecords.filter((r) => r.role !== 'owner' && r.role !== 'manager')
                      : payrollRecords.filter((r) => r.role !== 'owner');

                    if (displayedPayroll.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                            {language === 'ur' ? 'اس ماہ کا کوئی پے رول ریکارڈ موجود نہیں' : 'No payroll records found for this month'}
                          </td>
                        </tr>
                      );
                    }

                    return displayedPayroll.map((r) => (
                      <tr key={r.payrollId}>
                        <td>
                          <div className="font-semibold">{r.employeeName}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {r.designation}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-slate">{r.role.toUpperCase()}</span>
                        </td>
                        <td>
                          <MoneyDisplay paisa={r.baseSalaryPaisa} />
                        </td>
                        <td>
                          <MoneyDisplay paisa={r.netPayablePaisa} className="font-bold text-primary" />
                        </td>
                        <td>
                          <span className={`badge ${r.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                            {r.status === 'paid' ? (language === 'ur' ? 'ادا شدہ (Paid)' : 'PAID') : (language === 'ur' ? 'زیر التواء (Pending)' : 'PENDING')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {r.status === 'paid' ? (
                            <div>
                              <div>Paid: {r.paidAt}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Method: {r.paymentMethod?.toUpperCase()}</div>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                            {r.status === 'pending' && canManageStaff && (
                              <button
                                onClick={() => handleOpenPaySalary(r)}
                                className="btn btn-sm btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Banknote size={13} />
                                <span>{language === 'ur' ? 'تنخواہ ادا کریں' : 'Pay Salary'}</span>
                              </button>
                            )}
                            {r.status === 'paid' && (
                              <button
                                onClick={() => setActiveSlipRecord(r)}
                                className="btn btn-sm btn-outline text-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Printer size={13} />
                                <span>{language === 'ur' ? 'پرچی' : 'Slip'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Created Credentials Handover Card Modal */}
      {createdCredentials && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} className="text-success" />
                <h3 className="card-title text-success" style={{ margin: 0 }}>
                  {language === 'ur' ? 'نیا عملہ اکاؤنٹ تیار ہے!' : 'Staff Credentials Created!'}
                </h3>
              </div>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="btn btn-icon btn-outline btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
              {language === 'ur'
                ? 'یہ لاگ ان معلومات ملازم کو واٹس ایپ کریں یا فراہم کریں تاکہ وہ فوری لاگ ان کر سکے۔'
                : 'Share these login credentials with the employee for immediate sign-in.'}
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="text-muted">Name:</span>
                <strong>{createdCredentials.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="text-muted">Role:</span>
                <span className="badge badge-info">{createdCredentials.role.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="text-muted">Login Email:</span>
                <strong dir="ltr">{createdCredentials.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Initial Password:</span>
                <code style={{ background: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {createdCredentials.password}
                </code>
              </div>
            </div>

            {copied && (
              <div className="alert alert-success mb-4" style={{ padding: '0.5rem' }}>
                <CheckCircle size={15} />
                <span>{language === 'ur' ? 'تفصیلات کاپی ہو گئیں!' : 'Credentials copied to clipboard!'}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={copyCredentialsText}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                <Copy size={16} />
                <span>{language === 'ur' ? 'کاپی کریں' : 'Copy'}</span>
              </button>
              {isDemoUser && (
                <button
                  type="button"
                  onClick={() => {
                    const targetStaff = staff.find((s) => s.email === createdCredentials.email);
                    if (targetStaff) {
                      switchDemoStaff(targetStaff);
                      setCreatedCredentials(null);
                      if (targetStaff.role === 'recovery') navigate('/recovery');
                      else if (targetStaff.role === 'super_admin') navigate('/admin');
                      else navigate('/dashboard');
                    } else {
                      setCreatedCredentials(null);
                    }
                  }}
                  className="btn btn-success"
                  style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Eye size={15} />
                  <span>{language === 'ur' ? 'ابھی اس کا ویو ٹیسٹ کریں' : 'Test View Now'}</span>
                </button>
              )}
              <button
                onClick={() => setCreatedCredentials(null)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Staff Modal */}
      {isInviteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {language === 'ur' ? 'نیا اسٹاف اکاؤنٹ بنائیں' : 'Create Staff Member Account'}
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'مکمل نام' : 'Full Name'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Kamran Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'لاگ ان ای میل ایڈریس' : 'Login Email Address'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="kamran@qistflow.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>{language === 'ur' ? 'عارضی پاس ورڈ' : 'Temporary Password'}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {language === 'ur' ? 'ملازم اس پاس ورڈ سے لاگ ان کرے گا' : 'Employee will sign in using this password'}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'موبائل نمبر (اختیاری)' : 'Phone Number'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'ذمہ داری / عہدہ (Role)' : 'Assigned Role'}</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="recovery">
                      {language === 'ur'
                        ? 'Recovery Agent (فیلڈ پورٹل - صرف تفویض شدہ کسٹمرز اور وصولی)'
                        : 'Recovery Agent (Restricted Mobile Portal Only)'}
                    </option>
                    <option value="accountant">
                      {language === 'ur'
                        ? 'Accountant (اکاؤنٹنٹ - صرف مالیاتی کھاتے، پیمنٹس، اخراجات)'
                        : 'Accountant (Financial Ledger, Payments & Expenses)'}
                    </option>
                    <option value="manager">
                      {language === 'ur'
                        ? 'Shop Manager (دکان کا مینیجر - سیلز، اشیاء، گاہک، معاہدات)'
                        : 'Shop Manager (Daily Operations, POS, Inventory)'}
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'عہدہ / ٹائٹل (Designation)' : 'Designation'}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Field Officer / Helper / Safai"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'ماہانہ تنخواہ (PKR)' : 'Monthly Salary (PKR)'}</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 30000"
                      value={monthlySalaryRupees}
                      onChange={(e) => setMonthlySalaryRupees(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <CheckCircle size={16} />
                  <span>{saving ? t('common.loading') : language === 'ur' ? 'اکاؤنٹ بنائیں' : 'Create Login'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owner-Configurable Permissions Modal */}
      {targetMemberForPerms && (
        <div className="modal-overlay" style={{ zIndex: 65 }}>
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={20} className="text-primary" />
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.125rem' }}>
                    {language === 'ur'
                      ? `${targetMemberForPerms.displayName} کے اختیارات`
                      : `Permissions: ${targetMemberForPerms.displayName}`}
                  </h3>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {language === 'ur'
                      ? 'دکان کا مالک اپنی مرضی سے اختیارات آن یا آف کر سکتا ہے'
                      : 'Owner can toggle specific operational or financial permissions'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setTargetMemberForPerms(null)}
                className="btn btn-icon btn-outline btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="alert alert-info mb-4" style={{ fontSize: '0.8125rem' }}>
                <span>
                  {language === 'ur'
                    ? `عہدہ: ${targetMemberForPerms.role.toUpperCase()} — نیچے دیے گئے اختیارات میں سے جو آپ منتخب کریں گے، ملازم کو صرف انہی حصوں تک رسائی ہوگی۔`
                    : `Role: ${targetMemberForPerms.role.toUpperCase()} — This staff member will strictly only be able to perform checked actions.`}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(targetMemberForPerms.role === 'manager'
                  ? managerPermOptions
                  : accountantPermOptions
                ).map((opt) => {
                  const isChecked = selectedPerms.includes(opt.key);
                  return (
                    <label
                      key={opt.key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: isChecked ? '1px solid #10b981' : '1px solid #e2e8f0',
                        backgroundColor: isChecked ? '#f0fdf4' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(opt.key)}
                        style={{ marginTop: '0.25rem', width: '16px', height: '16px', accentColor: '#10b981' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                          {language === 'ur' ? opt.labelUr : opt.labelEn}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.125rem' }}>
                          {language === 'ur' ? opt.descUr : opt.descEn}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                {selectedPerms.length} {language === 'ur' ? 'اختیارات منتخب' : 'permissions granted'}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setTargetMemberForPerms(null)}
                  className="btn btn-secondary btn-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savingPerms}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Check size={14} />
                  <span>{savingPerms ? t('common.loading') : language === 'ur' ? 'محفوظ کریں' : 'Save Permissions'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Salary Modal */}
      {editingSalaryMember && (
        <div className="modal-overlay" style={{ zIndex: 65 }}>
          <div className="modal-box" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Banknote size={18} className="text-primary" />
                <h3 className="modal-title">
                  {language === 'ur' ? 'ماہانہ تنخواہ و عہدہ تبدیل کریں' : 'Edit Staff Salary & Title'}
                </h3>
              </div>
              <button onClick={() => setEditingSalaryMember(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSalary}>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
                  {language === 'ur' ? 'ملازم:' : 'Employee:'} <strong>{editingSalaryMember.displayName}</strong> ({editingSalaryMember.email})
                </p>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'عہدہ / ٹائٹل (Designation)' : 'Designation'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    placeholder="e.g. Senior Recovery Agent / Helper / Safai"
                    required
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">{language === 'ur' ? 'ماہانہ تنخواہ (PKR)' : 'Monthly Base Salary (PKR)'}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editSalaryRupees}
                    onChange={(e) => setEditSalaryRupees(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingSalaryMember(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingSalary}>
                  {savingSalary ? t('common.loading') : language === 'ur' ? 'تنخواہ محفوظ کریں' : 'Save Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {payingPayrollRecord && (
        <div className="modal-overlay" style={{ zIndex: 65 }}>
          <div className="modal-box" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Banknote size={18} className="text-success" />
                <h3 className="modal-title">
                  {language === 'ur' ? 'ماہانہ تنخواہ کی ادائیگی' : 'Pay Monthly Salary'}
                </h3>
              </div>
              <button onClick={() => setPayingPayrollRecord(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmPaySalary}>
              <div className="modal-body">
                <div style={{ padding: '0.875rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className="text-muted">Employee:</span>
                    <strong>{payingPayrollRecord.employeeName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className="text-muted">Designation:</span>
                    <span>{payingPayrollRecord.designation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className="text-muted">Month:</span>
                    <span className="font-semibold">{payingPayrollRecord.monthKey}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-bold">Net Salary Payable:</span>
                    <MoneyDisplay paisa={payingPayrollRecord.netPayablePaisa} className="font-bold text-success" style={{ fontSize: '1.125rem' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'ادائیگی کا ذریعہ' : 'Payment Method'}</label>
                  <select
                    className="form-select"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Cash (نقد دکان کی دراز سے)</option>
                    <option value="bank_transfer">Bank Transfer (بینک سے آن لائن)</option>
                    <option value="online">Easypaisa / JazzCash</option>
                    <option value="cheque">Cheque (چیک)</option>
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Notes / Reference</label>
                  <input
                    type="text"
                    className="form-input"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Salary paid via cash / bank Trx ID"
                  />
                  <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.375rem', marginBottom: 0 }}>
                    {language === 'ur'
                      ? 'نوٹ: یہ ادائیگی خودکار طور پر دکان کے اخراجات (Expenses) میں تنخواہوں کی مد میں درج ہو جائے گی۔'
                      : 'Note: This payment will automatically register under shop Expenses ("Salaries") for accounting.'}
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setPayingPayrollRecord(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={processingPay}>
                  {processingPay ? t('common.loading') : language === 'ur' ? 'ادائیگی مکمل کریں' : 'Confirm & Post Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Salary Voucher Modal */}
      {activeSlipRecord && (
        <div className="modal-overlay" style={{ zIndex: 70 }}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={18} className="text-primary" />
                <h3 className="modal-title">{language === 'ur' ? 'ماہانہ تنخواہ واؤچر / پرچی' : 'Official Salary Voucher'}</h3>
              </div>
              <button onClick={() => setActiveSlipRecord(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', backgroundColor: '#fff' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {activeTenant?.businessName || 'QistFlow Partner Shop'}
                </h2>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  {language === 'ur' ? 'تنخواہ کی باضابطہ رسید / واؤچر' : 'Official Staff Salary Payment Slip'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Month: <strong>{activeSlipRecord.monthKey}</strong> | Date: <strong>{activeSlipRecord.paidAt || new Date().toISOString().split('T')[0]}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">{language === 'ur' ? 'ملازم کا نام:' : 'Employee Name:'}</span>
                  <span className="font-bold">{activeSlipRecord.employeeName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">{language === 'ur' ? 'عہدہ:' : 'Designation:'}</span>
                  <span className="font-semibold">{activeSlipRecord.designation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">{language === 'ur' ? 'بنیادی تنخواہ:' : 'Base Salary:'}</span>
                  <MoneyDisplay paisa={activeSlipRecord.baseSalaryPaisa} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">{language === 'ur' ? 'ادائیگی کا ذریعہ:' : 'Payment Method:'}</span>
                  <span className="badge badge-slate">{(activeSlipRecord.paymentMethod || 'cash').toUpperCase()}</span>
                </div>
                <div style={{ borderTop: '2px solid #0f172a', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-bold" style={{ fontSize: '1rem' }}>{language === 'ur' ? 'کل ادا شدہ رقم:' : 'Net Paid Amount:'}</span>
                  <MoneyDisplay paisa={activeSlipRecord.netPayablePaisa} className="font-bold text-success" style={{ fontSize: '1.25rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '0.75rem' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #94a3b8', height: '2rem', marginBottom: '0.25rem' }} />
                  <span>{language === 'ur' ? 'وصول کنندہ دستخط (Employee)' : 'Employee Signature'}</span>
                </div>
                <div>
                  <div style={{ borderBottom: '1px solid #94a3b8', height: '2rem', marginBottom: '0.25rem' }} />
                  <span>{language === 'ur' ? 'دکان مینیجر / مالک دستخط' : 'Owner / Manager Signature'}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setActiveSlipRecord(null)} className="btn btn-secondary">
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Printer size={15} />
                <span>{language === 'ur' ? 'پرنٹ کریں' : 'Print Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Notice */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: '#065f46',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 100,
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} className="text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Edit Staff Credentials & Details Modal */}
      {editingStaffMember && (
        <div className="modal-overlay" style={{ zIndex: 65 }}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={18} className="text-primary" />
                <h3 className="modal-title">
                  {language === 'ur' ? 'ملازم کی تفصیلات و لاگ ان کریڈنشلز میں ترمیم' : 'Edit Staff Credentials & Details'}
                </h3>
              </div>
              <button onClick={() => setEditingStaffMember(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStaffDetails}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{editingStaffMember.displayName}</strong>
                    <span className="badge badge-primary">{editingStaffMember.role.toUpperCase()}</span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    {language === 'ur' ? 'کردار (Role) فکسڈ ہے، نام، فون، جی میل اور پاس ورڈ تبدیل کیا جا سکتا ہے۔' : 'Role is fixed; Name, Phone, Email, and Password can be modified.'}
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">{language === 'ur' ? 'ملازم کا مکمل نام' : 'Full Name *'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editStaffName}
                    onChange={(e) => setEditStaffName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'عہدہ (Designation)' : 'Designation'}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editStaffDesignation}
                      onChange={(e) => setEditStaffDesignation(e.target.value)}
                      placeholder="e.g. Senior Cashier"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">{language === 'ur' ? 'موبائل نمبر (WhatsApp)' : 'Mobile Phone'}</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editStaffPhone}
                      onChange={(e) => setEditStaffPhone(e.target.value)}
                      placeholder="0300-1234567"
                    />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">{language === 'ur' ? 'لاگ ان ای میل / جی میل' : 'Login Email / Gmail *'}</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editStaffEmail}
                    onChange={(e) => setEditStaffEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">{language === 'ur' ? 'لاگ ان پاس ورڈ' : 'Login Password *'}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showEditStaffPass ? 'text' : 'password'}
                      className="form-input font-mono"
                      value={editStaffPassword}
                      onChange={(e) => setEditStaffPassword(e.target.value)}
                      required
                      minLength={6}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditStaffPass(!showEditStaffPass)}
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
                      {showEditStaffPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingStaffMember(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingStaffDetails}>
                  {savingStaffDetails ? t('common.loading') : language === 'ur' ? 'کریڈنشلز محفوظ کریں' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Credentials Handover Modal */}
      {shareHandoverMember && (
        <div className="modal-overlay" style={{ zIndex: 65 }}>
          <div className="card" style={{ width: '90%', maxWidth: '480px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={20} className="text-success" />
                <h3 className="card-title text-success" style={{ margin: 0 }}>
                  {language === 'ur' ? 'لاگ ان تفصیلات برائے ملازم' : 'Employee Login Handover'}
                </h3>
              </div>
              <button onClick={() => setShareHandoverMember(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <p className="text-muted mb-3" style={{ fontSize: '0.8125rem' }}>
              {language === 'ur'
                ? 'یہ پیغام کاپی کر کے ملازم کو واٹس ایپ یا ایس ایم ایس پر بھیجیں تاکہ وہ فوری سائن ان کر سکے۔'
                : 'Copy or send this message directly to the employee via WhatsApp or SMS for login.'}
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                padding: '0.875rem',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                whiteSpace: 'pre-line',
                lineHeight: 1.5,
                color: '#0f172a',
                marginBottom: '1rem',
              }}
            >
              {getHandoverText(shareHandoverMember)}
            </div>

            {handoverCopied && (
              <div className="alert alert-success mb-3" style={{ padding: '0.5rem' }}>
                <CheckCircle size={15} />
                <span>{language === 'ur' ? 'مکمل پیغام کاپی ہو گیا!' : 'Credentials message copied to clipboard!'}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => copyHandoverMessage(shareHandoverMember)}
                className="btn btn-outline"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <Copy size={15} />
                <span>{language === 'ur' ? 'پیغام کاپی کریں' : 'Copy Text'}</span>
              </button>
              {shareHandoverMember.phone && (
                <a
                  href={`https://wa.me/${shareHandoverMember.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getHandoverText(shareHandoverMember))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-success"
                  style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Share2 size={15} />
                  <span>WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setShareHandoverMember(null)}
                className="btn btn-secondary"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Inspect Staff Active Device Sessions Modal */}
      {inspectingStaffSessions && (
        <div className="modal-overlay" style={{ zIndex: 70 }}>
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={20} className="text-primary" />
                <div>
                  <h3 className="modal-title" style={{ margin: 0, fontSize: '1.0625rem' }}>
                    {language === 'ur'
                      ? `${inspectingStaffSessions.member.displayName} کے ایکٹو ڈیوائس لاگ انز`
                      : `Active Device Logins for ${inspectingStaffSessions.member.displayName}`}
                  </h3>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {inspectingStaffSessions.member.role.toUpperCase()} • {inspectingStaffSessions.member.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingStaffSessions(null)}
                className="btn btn-icon btn-outline btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Summary Banner */}
              <div
                style={{
                  background: inspectingStaffSessions.sessions.length > 1 ? '#ecfdf5' : '#f8fafc',
                  border: `1px solid ${inspectingStaffSessions.sessions.length > 1 ? '#a7f3d0' : '#e2e8f0'}`,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: inspectingStaffSessions.sessions.length > 1 ? '#065f46' : '#0f172a' }}>
                    {language === 'ur'
                      ? `کل ایکٹو لاگ ان ڈیوائسز: ${inspectingStaffSessions.sessions.length}`
                      : `Total Concurrent Device Sessions: ${inspectingStaffSessions.sessions.length}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: inspectingStaffSessions.sessions.length > 1 ? '#047857' : '#64748b' }}>
                    {language === 'ur'
                      ? 'ملازم اپنے موبائل یا دوسرے ڈیوائس پر آزادانہ کام کر سکتا ہے۔ مینیجر اور مالک یہاں سے ریئل ٹائم مانیٹرنگ کر سکتے ہیں۔'
                      : 'Staff can operate simultaneously on field phones and tablets without session conflicts.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSimulateAddDevice(inspectingStaffSessions.member.userId)}
                  className="btn btn-sm btn-outline text-success"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', borderColor: '#86efac', background: '#ffffff' }}
                  title={language === 'ur' ? 'دوسرا موبائل لاگ ان ٹیسٹ کریں' : 'Simulate another active device login'}
                >
                  <Smartphone size={13} />
                  <span>{language === 'ur' ? '+ ٹیسٹ نیا لاگ ان' : '+ Simulate Login'}</span>
                </button>
              </div>

              {/* Sessions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '360px', overflowY: 'auto' }}>
                {inspectingStaffSessions.sessions.length === 0 ? (
                  <div className="text-center text-muted" style={{ padding: '2rem' }}>
                    {language === 'ur' ? 'اس وقت کوئی ڈیوائس ایکٹو نہیں ہے (آف لائن)' : 'No active sessions found (Offline)'}
                  </div>
                ) : (
                  inspectingStaffSessions.sessions.map((sess) => (
                    <div
                      key={sess.sessionId}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: sess.deviceType === 'desktop' ? '#eff6ff' : '#f0fdf4',
                            color: sess.deviceType === 'desktop' ? '#2563eb' : '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {sess.deviceType === 'desktop' ? <Laptop size={18} /> : sess.deviceType === 'tablet' ? <Tablet size={18} /> : <Smartphone size={18} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                              {sess.deviceName}
                            </span>
                            {sess.isCurrentTab && (
                              <span className="badge badge-info" style={{ fontSize: '0.625rem' }}>
                                {language === 'ur' ? 'یہ ٹیب' : 'This Tab'}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            <span>{sess.browser}</span> • <span dir="ltr">{sess.ipAddress}</span> • <span>{sess.location}</span>
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                            {language === 'ur' ? 'لاگ ان وقت: ' : 'Logged in: '}
                            {new Date(sess.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                            <span className="text-success" style={{ fontWeight: 600 }}> 🟢 {language === 'ur' ? 'آن لائن' : 'Active'}</span>
                          </div>
                        </div>
                      </div>

                      {canManageStaff && (
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(sess.sessionId)}
                          className="btn btn-sm btn-outline text-danger"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title={language === 'ur' ? 'اس ڈیوائس کو لاگ آؤٹ کریں' : 'Terminate this device session'}
                        >
                          <X size={13} />
                          <span>{language === 'ur' ? 'لاگ آؤٹ' : 'Terminate'}</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {canManageStaff && inspectingStaffSessions.sessions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => handleTerminateAllStaffSessions(inspectingStaffSessions.member.userId)}
                  className="btn btn-sm btn-outline text-danger"
                >
                  {language === 'ur' ? 'تمام ریموٹ ڈیوائسز لاگ آؤٹ کریں' : 'Terminate All Remote Devices'}
                </button>
              ) : (
                <div></div>
              )}
              <button
                type="button"
                onClick={() => setInspectingStaffSessions(null)}
                className="btn btn-secondary"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
