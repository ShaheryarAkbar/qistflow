// ============================================================================
// Customers Feature: Directory, Search, Duplicate Check & Ledger
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  X,
  CheckCircle,
  Edit3,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { Customer } from '@/types';
import { CustomerRepository, normalizePhoneNumber } from '@/repositories/customer.repository';
import { StatusBadge } from '@/components/shared/StatusBadge';

export const CustomersPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState(activeTenant?.city || 'Rahim Yar Khan');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Duplicate phone warning modal state
  const [duplicateWarning, setDuplicateWarning] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhoneDisplay, setEditPhoneDisplay] = useState('');
  const [editAlternatePhone, setEditAlternatePhone] = useState('');
  const [editCnic, setEditCnic] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<any>('active');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadCustomers = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const data = await CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser);
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [activeTenant, isDemoUser]);

  const handlePhoneCheckAndSubmit = async (overrideConfirmed = false) => {
    if (!activeTenant || !currentUser) return;
    if (!fullName || !phoneDisplay) {
      alert('Please provide customer name and phone number.');
      return;
    }

    setSaving(true);
    try {
      // Check for duplicate normalized phone if not already overridden
      if (!overrideConfirmed) {
        const existing = await CustomerRepository.findCustomerByPhone(
          activeTenant.tenantId,
          phoneDisplay,
          isDemoUser
        );
        if (existing) {
          setDuplicateWarning(existing);
          setSaving(false);
          return;
        }
      }

      await CustomerRepository.saveCustomer(
        activeTenant.tenantId,
        {
          fullName,
          phoneDisplay,
          alternatePhone,
          cnic,
          area,
          city,
          address,
          notes,
          status: 'active',
        },
        currentUser.uid,
        isDemoUser
      );

      // Reset form
      setFullName('');
      setPhoneDisplay('');
      setAlternatePhone('');
      setCnic('');
      setArea('');
      setAddress('');
      setNotes('');
      setDuplicateWarning(null);
      setIsAddModalOpen(false);
      await loadCustomers();
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setEditFullName(c.fullName);
    setEditPhoneDisplay(c.phoneDisplay || '');
    setEditAlternatePhone(c.alternatePhone || '');
    setEditCnic(c.cnic || '');
    setEditArea(c.area || '');
    setEditCity(c.city || '');
    setEditAddress(c.address || '');
    setEditNotes(c.notes || '');
    setEditStatus(c.status || 'active');
  };

  const handleSaveEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !editingCustomer || !editFullName) return;

    setSavingEdit(true);
    try {
      await CustomerRepository.updateCustomer(
        activeTenant.tenantId,
        editingCustomer.customerId,
        {
          fullName: editFullName,
          phoneDisplay: editPhoneDisplay,
          alternatePhone: editAlternatePhone,
          cnic: editCnic,
          area: editArea,
          city: editCity,
          address: editAddress,
          notes: editNotes,
          status: editStatus,
        },
        currentUser.uid,
        isDemoUser
      );

      setEditingCustomer(null);
      await loadCustomers();
      if (selectedCustomer?.customerId === editingCustomer.customerId) {
        setSelectedCustomer({
          ...selectedCustomer,
          fullName: editFullName,
          phoneDisplay: editPhoneDisplay,
          alternatePhone: editAlternatePhone,
          cnic: editCnic,
          area: editArea,
          city: editCity,
          address: editAddress,
          notes: editNotes,
          status: editStatus,
        });
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      (c.phoneDisplay && c.phoneDisplay.includes(q)) ||
      (c.cnic && c.cnic.includes(q)) ||
      (c.area && c.area.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Top Header */}
      <div className="page-header-responsive">
        <div className="page-title-group">
          <h2>
            {t('customers.title')}
          </h2>
          <p>
            {language === 'ur'
              ? 'تمام رجسٹرڈ گاہکوں کا مکمل ریکارڈ اور رابطہ'
              : 'Directory of registered customers, installment accounts and contacts.'}
          </p>
        </div>

        <div className="page-action-group">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
          >
            <UserPlus size={16} />
            <span>{t('customers.newCustomer')}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-box mb-6">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="form-input"
          placeholder={t('customers.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('customers.name')}</th>
                <th>{t('customers.phone')}</th>
                <th>{t('customers.cnic')}</th>
                <th>{t('customers.area')} / {t('customers.city')}</th>
                <th>{t('customers.status')}</th>
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
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted" style={{ padding: '2rem' }}>
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.customerId}>
                    <td className="font-semibold">{c.fullName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Phone size={13} className="text-muted" />
                        <span>{c.phoneDisplay}</span>
                      </div>
                    </td>
                    <td>{c.cnic || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <MapPin size={13} className="text-muted" />
                        <span>{[c.area, c.city].filter(Boolean).join(', ')}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          {t('common.view')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCustomer(c)}
                          className="btn btn-sm btn-outline text-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                          title={language === 'ur' ? 'گاہک کی معلومات درست کریں' : 'Edit Customer'}
                        >
                          <Edit3 size={12} />
                          <span>{language === 'ur' ? 'درستی' : 'Edit'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{t('customers.newCustomer')}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  <span>{t('customers.name')}</span>
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Muhammad Imran"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">
                    <span>{t('customers.phone')}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0300-1234567"
                    value={phoneDisplay}
                    onChange={(e) => setPhoneDisplay(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('customers.alternatePhone')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0301-9876543"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">{t('customers.cnic')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="31303-1234567-1"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('customers.area')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Gulshan-e-Iqbal"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('customers.city')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('customers.address')}</label>
                <textarea
                  className="form-textarea"
                  placeholder="Street / House details..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Guarantor / Business references..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handlePhoneCheckAndSubmit(false)}
                className="btn btn-primary"
                disabled={saving}
              >
                <CheckCircle size={16} />
                <span>{saving ? t('common.loading') : t('customers.save')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Phone Warning Override Dialog */}
      {duplicateWarning && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ backgroundColor: '#fffbeb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309' }}>
                <AlertTriangle size={20} />
                <h3 className="modal-title" style={{ color: '#b45309' }}>
                  {language === 'ur' ? 'فون نمبر کی تکرار (وارننگ)' : 'Duplicate Phone Warning'}
                </h3>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                {t('customers.phoneWarning')}
              </p>

              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                <div><strong>{language === 'ur' ? 'پہلے سے درج گاہک:' : 'Existing Customer:'}</strong> {duplicateWarning.fullName}</div>
                <div><strong>{language === 'ur' ? 'فون نمبر:' : 'Phone Number:'}</strong> {duplicateWarning.phoneDisplay}</div>
                <div><strong>{language === 'ur' ? 'علاقہ:' : 'Area:'}</strong> {duplicateWarning.area || '—'}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handlePhoneCheckAndSubmit(true)}
                className="btn btn-primary"
              >
                {language === 'ur' ? 'تصدیق اور محفوظ کریں' : 'Confirm & Save Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedCustomer.fullName}</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('customers.phone')}</div>
                  <div className="font-semibold">{selectedCustomer.phoneDisplay}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('customers.alternatePhone')}</div>
                  <div>{selectedCustomer.alternatePhone || '—'}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('customers.cnic')}</div>
                  <div>{selectedCustomer.cnic || '—'}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('customers.city')}</div>
                  <div>{[selectedCustomer.area, selectedCustomer.city].filter(Boolean).join(', ')}</div>
                </div>
              </div>

              {selectedCustomer.address && (
                <div className="mb-4">
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('customers.address')}</div>
                  <div style={{ fontSize: '0.875rem' }}>{selectedCustomer.address}</div>
                </div>
              )}

              {selectedCustomer.notes && (
                <div className="mb-4">
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Notes</div>
                  <div style={{ fontSize: '0.875rem' }}>{selectedCustomer.notes}</div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleOpenEditCustomer(selectedCustomer)}
                className="btn btn-outline text-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Edit3 size={14} />
                <span>{language === 'ur' ? 'گاہک کی درستی' : 'Edit Customer'}</span>
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{language === 'ur' ? 'گاہک کی معلومات کی درستی' : 'Edit Customer Profile'}</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="btn btn-icon btn-outline"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    <span>{t('customers.name')}</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      <span>{t('customers.phone')}</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editPhoneDisplay}
                      onChange={(e) => setEditPhoneDisplay(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('customers.alternatePhone')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editAlternatePhone}
                      onChange={(e) => setEditAlternatePhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('customers.cnic')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editCnic}
                      onChange={(e) => setEditCnic(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('common.status')}</label>
                    <select
                      className="form-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="active">Active (فعال)</option>
                      <option value="inactive">Inactive (غیر فعال)</option>
                      <option value="defaulter">Defaulter (نادہندہ)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">{t('customers.area')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('customers.city')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('customers.address')}</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (نوٹس)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEdit}
                >
                  <CheckCircle size={16} />
                  <span>{savingEdit ? t('common.loading') : (language === 'ur' ? 'تبدیلی محفوظ کریں' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

