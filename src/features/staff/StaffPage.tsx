// ============================================================================
// Staff Feature: Staff Governance, Roles & Direct Credential Creation
// Exclusive to Business Owner & Shop Manager (PRD Section 4.1 & 6.1)
// ============================================================================

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { UserRole } from '@/types';
import { StaffRepository, StaffMemberRecord } from '@/repositories/staff.repository';
import { StatusBadge } from '@/components/shared/StatusBadge';

export const StaffPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant, isOwner, isManager, canManageStaff } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [staff, setStaff] = useState<StaffMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tempPassword, setTempPassword] = useState('Pak@12345');
  const [role, setRole] = useState<UserRole>('recovery');
  const [saving, setSaving] = useState(false);

  // Success Credential Card Modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    loadStaff();
  }, [activeTenant, isDemoUser]);

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

      {/* Security principle box */}
      <div className="alert alert-info mb-6" style={{ fontSize: '0.8125rem' }}>
        <Shield size={16} />
        <span>
          {language === 'ur'
            ? 'سیکیورٹی اصول: ملازمین (ریکوری آفیسر، اکاؤنٹنٹ) باہر سے خود سائن اپ نہیں کر سکتے۔ ان کے لاگ ان صرف آپ (دکان کا مالک یا مینیجر) یہاں سے بنا کر دیں گے۔ ریکوری عملہ کو صرف اپنے تفویض شدہ کھاتوں تک محدود رسائی حاصل ہوگی۔'
            : 'Access Governance: Staff members cannot register externally. Their credentials must be directly provisioned here by shop leadership. Recovery agents have restricted mobile-first access.'}
        </span>
      </div>

      {/* Staff Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Assigned Role</th>
                <th>Contact Information</th>
                <th>Joined Date</th>
                <th>{t('common.status')}</th>
                {canManageStaff && <th>{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center" style={{ padding: '2rem' }}>
                    {t('common.loading')}
                  </td>
                </tr>
              ) : staff.map((member) => {
                const roleBadge = getRoleBadge(member.role);
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
                      <div style={{ fontSize: '0.8125rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Mail size={12} className="text-muted" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <Phone size={12} className="text-muted" />
                            <span dir="ltr">{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{member.joinedAt}</td>
                    <td>
                      <StatusBadge status={member.status} />
                    </td>
                    {canManageStaff && (
                      <td>
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
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={copyCredentialsText}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                <Copy size={16} />
                <span>{language === 'ur' ? 'کاپی کریں' : 'Copy'}</span>
              </button>
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
    </div>
  );
};
