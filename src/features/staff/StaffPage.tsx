// ============================================================================
// Staff Feature: Staff Governance, Roles & Invitations
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
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { UserRole } from '@/types';
import { StaffRepository, StaffMemberRecord } from '@/repositories/staff.repository';
import { StatusBadge } from '@/components/shared/StatusBadge';

export const StaffPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant, isOwner } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [staff, setStaff] = useState<StaffMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Invite form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('recovery');
  const [saving, setSaving] = useState(false);

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

  const handleInviteStaff = async (e: React.FormEvent) => {
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

      setName('');
      setEmail('');
      setPhone('');
      setIsInviteModalOpen(false);
      await loadStaff();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (member: StaffMemberRecord) => {
    if (!activeTenant || !isOwner) return;
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    await StaffRepository.updateStaffStatus(activeTenant.tenantId, member.userId, newStatus, isDemoUser);
    await loadStaff();
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return { label: 'Owner (مالک)', bg: 'badge-success' };
      case 'manager':
        return { label: 'Manager (مینیجر)', bg: 'badge-info' };
      case 'accountant':
        return { label: 'Accountant (اکاؤنٹنٹ)', bg: 'badge-warning' };
      case 'recovery':
        return { label: 'Recovery (ریکوری فیلڈ)', bg: 'badge-slate' };
      default:
        return { label: r, bg: 'badge-slate' };
    }
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
              ? 'دکان کا عملہ، انتظامی اختیارات اور لاگ ان رسائی'
              : 'Shop staff accounts, role-based security access and field permissions.'}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="btn btn-primary"
          >
            <UserPlus size={16} />
            <span>{language === 'ur' ? 'نیا ملازم شامل کریں' : 'Invite Staff Member'}</span>
          </button>
        )}
      </div>

      {/* Staff Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Assigned Role</th>
                <th>Contact</th>
                <th>Joined Date</th>
                <th>{t('common.status')}</th>
                {isOwner && <th>{t('common.actions')}</th>}
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
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{member.joinedAt}</td>
                    <td>
                      <StatusBadge status={member.status} />
                    </td>
                    {isOwner && (
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

      {/* Invite Staff Modal */}
      {isInviteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Invite Staff Member</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInviteStaff}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    <span>Full Name</span>
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
                    <span>Email Address</span>
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
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="recovery">Recovery Agent (فیلڈ پورٹل - محدود رسائی)</option>
                    <option value="accountant">Accountant (مالیاتی کھاتہ، پیمنٹس، اخراجات)</option>
                    <option value="manager">Shop Manager (سیلز، اشیاء، گاہک، معاہدات)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <CheckCircle size={16} />
                  <span>{saving ? t('common.loading') : 'Add Staff Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

