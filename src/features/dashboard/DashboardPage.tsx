// ============================================================================
// Dashboard Feature: Executive Overview & Today's Collections
// Real-time aggregation of active contracts, recoveries, and overdue tracking
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  DollarSign,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Phone,
  RefreshCw,
  Printer,
  X,
  CreditCard,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Customer, ScheduleEntryStatus, PaymentMethod } from '@/types';
import { SaleRepository } from '@/repositories/sale.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { StaffRepository } from '@/repositories/staff.repository';
import { RecoveryRepository } from '@/repositories/recovery.repository';
import { PrintableReceipt } from '@/components/shared/PrintableReceipt';
import { rupeesToPaisa } from '@/domain/money/paisa';

interface DashboardMetrics {
  todayExpectedPaisa: number;
  todayReceivedPaisa: number;
  todayPendingPaisa: number;
  totalOutstandingPaisa: number;
  overdueAmountPaisa: number;
  activeContractsCount: number;
  totalCustomersCount: number;
  lowStockAlertsCount: number;
}

interface DueTableItem {
  entryId: string;
  contractId: string;
  contractCode: string;
  customerId: string;
  customerName: string;
  phone: string;
  item: string;
  amountPaisa: number;
  dueDate: string;
  status: ScheduleEntryStatus;
  assignedOfficerName?: string;
}

interface CollectedTableItem {
  paymentId: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  phone: string;
  contractCode: string;
  item: string;
  amountPaisa: number;
  method: PaymentMethod;
  paidAt: string;
  receivedByName: string;
}

export const DashboardPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant } = useTenant();
  const { currentUser, isDemoUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayExpectedPaisa: 0,
    todayReceivedPaisa: 0,
    todayPendingPaisa: 0,
    totalOutstandingPaisa: 0,
    overdueAmountPaisa: 0,
    activeContractsCount: 0,
    totalCustomersCount: 0,
    lowStockAlertsCount: 0,
  });

  const [activeTableTab, setActiveTableTab] = useState<'dues' | 'collected'>('dues');
  const [dueTableItems, setDueTableItems] = useState<DueTableItem[]>([]);
  const [collectedTableItems, setCollectedTableItems] = useState<CollectedTableItem[]>([]);

  // Quick Collect State on Dashboard
  const [collectModalItem, setCollectModalItem] = useState<DueTableItem | null>(null);
  const [collectAmountRupees, setCollectAmountRupees] = useState('');
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('cash');
  const [collectReference, setCollectReference] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [collectSaving, setCollectSaving] = useState(false);

  // Active receipt viewer
  const [receiptModalData, setReceiptModalData] = useState<any | null>(null);

  const todayKey = new Date().toISOString().split('T')[0];

  const loadDashboardData = async () => {
    if (!activeTenant) return;
    setLoading(true);

    try {
      const [contracts, customers, payments, products, staffList, asgList] = await Promise.all([
        SaleRepository.getContracts(activeTenant.tenantId, isDemoUser),
        CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser),
        PaymentRepository.getPayments(activeTenant.tenantId, isDemoUser),
        ProductRepository.getProducts(activeTenant.tenantId, isDemoUser),
        StaffRepository.getStaffMembers(activeTenant.tenantId, isDemoUser),
        RecoveryRepository.getAssignments(activeTenant.tenantId, undefined, isDemoUser),
      ]);

      const customerMap = new Map<string, Customer>();
      customers.forEach((c) => customerMap.set(c.customerId, c));

      const staffMap = new Map<string, string>();
      staffList.forEach((s) => staffMap.set(s.userId, s.displayName));

      const asgMap = new Map<string, string>();
      asgList.forEach((a) => {
        const officerName = staffMap.get(a.employeeId) || 'Kamran (Recovery)';
        asgMap.set(a.customerId, officerName);
      });

      // Calculate payments received today
      const todayPayments = payments.filter((p) => {
        if (p.status === 'reversed') return false;
        const pDate =
          typeof p.paidAt === 'string'
            ? p.paidAt.split('T')[0]
            : p.paidAt?.toDate
            ? p.paidAt.toDate().toISOString().split('T')[0]
            : '';
        return pDate === todayKey;
      });

      const todayReceived = todayPayments.reduce((sum, p) => sum + p.amountPaisa, 0);

      // Active contracts & outstanding
      const activeContracts = contracts.filter((c) => c.status === 'active');
      const totalOutstanding = activeContracts.reduce(
        (sum, c) => sum + (c.outstandingPaisa || 0),
        0
      );

      // Low stock count
      const lowStockCount = products.filter(
        (prd) => prd.stockOnHand <= (prd.reorderLevel ?? 2)
      ).length;

      // Inspect schedule entries
      let todayExpected = 0;
      let overdueAmount = 0;
      const allDues: DueTableItem[] = [];

      for (const contract of activeContracts) {
        const entries = await SaleRepository.getScheduleEntries(
          activeTenant.tenantId,
          contract.contractId,
          isDemoUser
        );

        const customer = customerMap.get(contract.customerId);
        const itemName =
          contract.itemsSnapshot?.[0]?.productNameSnapshot ||
          `Contract #${contract.contractCode || contract.contractId}`;

        for (const entry of entries) {
          const remainingForEntry = entry.remainingPaisa || 0;

          if (entry.status !== 'paid' && remainingForEntry > 0) {
            if (entry.dueDateKey === todayKey) {
              todayExpected += remainingForEntry;
            } else if (entry.dueDateKey < todayKey) {
              overdueAmount += remainingForEntry;
            }

            allDues.push({
              entryId: entry.scheduleEntryId,
              contractId: contract.contractId,
              contractCode: contract.contractCode || contract.contractId,
              customerId: contract.customerId,
              customerName: customer ? customer.fullName : 'Walk-in Customer',
              phone: customer?.phoneDisplay || customer?.normalizedPhone || '-',
              item: itemName,
              amountPaisa: remainingForEntry,
              dueDate: entry.dueDateKey,
              status: entry.status,
              assignedOfficerName: asgMap.get(contract.customerId) || (language === 'ur' ? 'کامران (ریکوری آفیسر)' : 'Kamran (Officer)'),
            });
          }
        }
      }

      // Sort table items: overdue first, then by date ascending
      allDues.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      // Map today's collected payments for the Collected tab
      const collectedItems: CollectedTableItem[] = todayPayments.map((p) => {
        const customer = customerMap.get(p.customerId);
        const contract = contracts.find((c) => c.contractId === p.contractId);
        const itemName =
          contract?.itemsSnapshot?.[0]?.productNameSnapshot ||
          (contract ? `Contract #${contract.contractCode || contract.contractId}` : 'Installment Payment');

        const collectorStaff = staffMap.get(p.receivedBy);
        const displayCollector =
          collectorStaff ||
          (p.receivedBy === 'owner' ? (language === 'ur' ? 'مالک دکان' : 'Shop Owner') : p.receivedBy) ||
          'Field Officer';

        return {
          paymentId: p.paymentId,
          receiptNumber: p.reference?.startsWith('RCP-') ? p.reference : `RCP-${p.paymentId.slice(-6).toUpperCase()}`,
          customerId: p.customerId,
          customerName: customer ? customer.fullName : 'Customer',
          phone: customer?.phoneDisplay || customer?.normalizedPhone || '-',
          contractCode: contract?.contractCode || '-',
          item: itemName,
          amountPaisa: p.amountPaisa,
          method: p.method,
          paidAt: typeof p.paidAt === 'string' ? p.paidAt : new Date().toISOString(),
          receivedByName: displayCollector,
        };
      });

      setCollectedTableItems(collectedItems);

      // Calculate today's pending
      const todayPending = Math.max(0, todayExpected - todayReceived);

      setMetrics({
        todayExpectedPaisa: todayExpected,
        todayReceivedPaisa: todayReceived,
        todayPendingPaisa: todayPending,
        totalOutstandingPaisa: totalOutstanding,
        overdueAmountPaisa: overdueAmount,
        activeContractsCount: activeContracts.length,
        totalCustomersCount: customers.length,
        lowStockAlertsCount: lowStockCount,
      });

      setDueTableItems(allDues.slice(0, 10)); // Top 10 priority dues
    } catch (err) {
      console.error('Failed to load dashboard aggregates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCollectModal = (item: DueTableItem) => {
    setCollectModalItem(item);
    setCollectAmountRupees((item.amountPaisa / 100).toString());
    setCollectMethod('cash');
    setCollectReference('');
    setCollectNotes('');
  };

  const handleConfirmDashboardCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !collectModalItem || !collectAmountRupees) return;

    setCollectSaving(true);
    try {
      const amountPaisa = rupeesToPaisa(collectAmountRupees);
      const res = await PaymentRepository.recordPayment({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        customerId: collectModalItem.customerId,
        contractId: collectModalItem.contractId,
        amountPaisa,
        method: collectMethod,
        paymentKind: 'installment',
        reference: collectReference || undefined,
        notes: collectNotes || undefined,
        isDemo: isDemoUser,
      });

      const contracts = await SaleRepository.getContracts(activeTenant.tenantId, isDemoUser);
      const updatedContract = contracts.find((c) => c.contractId === collectModalItem.contractId);

      setReceiptModalData({
        receiptNumber: res.receipt.receiptNumber,
        customerName: collectModalItem.customerName,
        customerPhone: collectModalItem.phone,
        contractCode: collectModalItem.contractCode,
        amountPaisa,
        remainingBalancePaisa: updatedContract ? updatedContract.outstandingPaisa : 0,
        paymentMethod: collectMethod,
        date: new Date().toISOString(),
        receivedBy: currentUser.displayName || 'Staff',
      });

      setCollectModalItem(null);
      setCollectAmountRupees('');
      await loadDashboardData();
      setActiveTableTab('collected');
    } catch (err: any) {
      alert(err?.message || 'Payment collection failed');
    } finally {
      setCollectSaving(false);
    }
  };

  const handleViewCollectedReceipt = (item: CollectedTableItem) => {
    setReceiptModalData({
      receiptNumber: item.receiptNumber,
      customerName: item.customerName,
      customerPhone: item.phone,
      contractCode: item.contractCode,
      amountPaisa: item.amountPaisa,
      remainingBalancePaisa: 0,
      paymentMethod: item.method,
      date: item.paidAt,
      receivedBy: currentUser?.displayName || 'Staff',
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeTenant?.tenantId, language]);

  return (
    <div>
      {/* Top Welcome & Quick Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
              {t('nav.dashboard')}
            </h2>
            <button
              onClick={loadDashboardData}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.25rem 0.5rem', height: 'auto' }}
              title="Refresh metrics"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {language === 'ur'
              ? 'آج کی وصولیاں اور اقساط کی صورتحال'
              : "Live overview of today's expected recoveries and active installments."}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            onClick={() => navigate('/sales/new')}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>{t('dashboard.newSale')}</span>
          </button>
          <button
            onClick={() => navigate('/payments')}
            className="btn btn-secondary"
          >
            <Receipt size={16} />
            <span>{t('dashboard.recordPayment')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon icon-emerald">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.todayReceived')}</div>
            <div className="stat-value text-success">
              <MoneyDisplay paisa={metrics.todayReceivedPaisa} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-amber">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.todayPending')}</div>
            <div className="stat-value text-warning">
              <MoneyDisplay paisa={metrics.todayPendingPaisa} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-blue">
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.totalOutstanding')}</div>
            <div className="stat-value">
              <MoneyDisplay paisa={metrics.totalOutstandingPaisa} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-rose">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('dashboard.overdueAmount')}</div>
            <div className="stat-value text-danger">
              <MoneyDisplay paisa={metrics.overdueAmountPaisa} />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/contracts')}
        >
          <div
            className="card-body"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
                {t('dashboard.activeContracts')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {metrics.activeContractsCount}
              </div>
            </div>
            <FileText size={28} className="text-primary" />
          </div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/customers')}
        >
          <div
            className="card-body"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
                {t('dashboard.totalCustomers')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {metrics.totalCustomersCount}
              </div>
            </div>
            <Users size={28} className="text-primary" />
          </div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/inventory')}
        >
          <div
            className="card-body"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: '0.8125rem' }}>
                {t('dashboard.lowStockAlerts')}
              </div>
              <div
                style={{ fontSize: '1.25rem', fontWeight: 700 }}
                className={metrics.lowStockAlertsCount > 0 ? 'text-warning' : ''}
              >
                {metrics.lowStockAlertsCount}
              </div>
            </div>
            <AlertTriangle
              size={28}
              className={metrics.lowStockAlertsCount > 0 ? 'text-warning' : 'text-muted'}
            />
          </div>
        </div>
      </div>

      {/* Installments & Collections Table with Tabs */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                {language === 'ur'
                  ? 'اقساط کی نگرانی و آج کی وصولیاں'
                  : 'Installments Sheet & Today Collections'}
              </h3>
            </div>
            <p className="card-subtitle" style={{ margin: 0 }}>
              {language === 'ur'
                ? 'واجب الادا اقساط کی فوری وصولی کریں یا آج وصول شدہ اقساط کی رسیدیں دیکھیں'
                : 'Collect pending dues instantly or review receipts of today recoveries.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25rem', padding: '0.25rem', background: '#f1f5f9', borderRadius: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setActiveTableTab('dues')}
                className={`btn btn-sm ${
                  activeTableTab === 'dues' ? 'btn-primary shadow-sm' : 'btn-ghost'
                }`}
                style={{ borderRadius: '8px', fontSize: '0.8125rem' }}
              >
                <span>{language === 'ur' ? 'واجب الادا' : 'Pending Dues'}</span>
                <span
                  style={{
                    marginInlineStart: '0.35rem',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: activeTableTab === 'dues' ? 'rgba(255,255,255,0.25)' : '#cbd5e1',
                    fontSize: '0.75rem',
                  }}
                >
                  {dueTableItems.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTableTab('collected')}
                className={`btn btn-sm ${
                  activeTableTab === 'collected' ? 'btn-primary shadow-sm' : 'btn-ghost'
                }`}
                style={{ borderRadius: '8px', fontSize: '0.8125rem' }}
              >
                <span>{language === 'ur' ? 'آج کی وصولیاں' : 'Collected'}</span>
                <span
                  style={{
                    marginInlineStart: '0.35rem',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: activeTableTab === 'collected' ? 'rgba(255,255,255,0.25)' : '#cbd5e1',
                    fontSize: '0.75rem',
                  }}
                >
                  {collectedTableItems.length}
                </span>
              </button>
            </div>

            <button
              onClick={() => navigate('/installments/due')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.8125rem', borderRadius: '8px' }}
            >
              <span>{t('common.view')} {t('common.all')}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {activeTableTab === 'dues' ? (
            dueTableItems.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }} className="text-muted">
                <CheckCircle2 size={36} className="text-success" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600 }}>
                  {language === 'ur'
                    ? 'کوئی واجب الادا قسط باقی نہیں ہے!'
                    : 'All installments are up-to-date! No pending dues.'}
                </p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('customers.name')}</th>
                    <th>{t('customers.phone')}</th>
                    <th>{t('products.name')}</th>
                    <th>{t('payments.amount')}</th>
                    <th>{t('common.date')}</th>
                    <th>{t('common.status')}</th>
                    <th>{language === 'ur' ? 'ریکوری آفیسر' : 'Assigned Officer'}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dueTableItems.map((item) => (
                    <tr key={item.entryId}>
                      <td className="font-semibold">{item.customerName}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Phone size={13} className="text-muted" />
                          <span dir="ltr">{item.phone}</span>
                        </div>
                      </td>
                      <td>{item.item}</td>
                      <td>
                        <MoneyDisplay paisa={item.amountPaisa} className="font-bold" />
                      </td>
                      <td>
                        <span
                          className={
                            item.dueDate < todayKey
                              ? 'text-danger font-semibold'
                              : item.dueDate === todayKey
                              ? 'text-warning font-semibold'
                              : ''
                          }
                        >
                          {item.dueDate}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <span className="badge badge-outline" style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                          {item.assignedOfficerName}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenCollectModal(item)}
                          className="btn btn-sm btn-primary"
                        >
                          <Receipt size={14} />
                          <span>{t('dashboard.recordPayment')}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            collectedTableItems.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }} className="text-muted">
                <Receipt size={36} className="text-muted" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600 }}>
                  {language === 'ur'
                    ? 'آج ابھی تک کوئی قسط وصول نہیں ہوئی۔'
                    : 'No payments have been collected yet today.'}
                </p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('customers.name')}</th>
                    <th>{t('customers.phone')}</th>
                    <th>{language === 'ur' ? 'معاہدہ / آئٹم' : 'Contract / Item'}</th>
                    <th>{language === 'ur' ? 'وصول شدہ رقم' : 'Amount Received'}</th>
                    <th>{language === 'ur' ? 'طریقہ ادائیگی' : 'Method'}</th>
                    <th>{language === 'ur' ? 'رسید نمبر' : 'Receipt #'}</th>
                    <th>{language === 'ur' ? 'وصول کنندہ (اسٹاف)' : 'Collected By'}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {collectedTableItems.map((col) => (
                    <tr key={col.paymentId}>
                      <td className="font-semibold">{col.customerName}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Phone size={13} className="text-muted" />
                          <span dir="ltr">{col.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>{col.item}</div>
                        <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                          {col.contractCode}
                        </span>
                      </td>
                      <td>
                        <MoneyDisplay paisa={col.amountPaisa} className="text-success font-bold" />
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                          {col.method}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>
                          {col.receiptNumber}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-primary" style={{ fontSize: '0.8125rem' }}>
                          {col.receivedByName}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleViewCollectedReceipt(col)}
                          className="btn btn-sm btn-outline"
                          title="View / Print Receipt"
                        >
                          <Printer size={13} />
                          <span>{language === 'ur' ? 'رسید دیکھیں' : 'Receipt'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Quick Collect Modal on Dashboard with Standard .modal-overlay & .modal-box */}
      {collectModalItem && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt className="text-primary" size={20} />
                <h3 className="modal-title">
                  {language === 'ur' ? 'فوری قسط وصولی' : 'Quick Installment Collection'}
                </h3>
              </div>
              <button
                onClick={() => setCollectModalItem(null)}
                className="btn btn-ghost btn-sm"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmDashboardCollect}>
              <div className="modal-body">
                {/* Customer & Contract Brief Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span className="font-semibold" style={{ color: '#0f172a' }}>
                      {collectModalItem.customerName}
                    </span>
                    <span dir="ltr" className="text-muted" style={{ fontSize: '0.8125rem' }}>
                      {collectModalItem.phone}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    {collectModalItem.item} •{' '}
                    <span className="font-mono font-semibold">{collectModalItem.contractCode}</span>
                  </div>
                  <div
                    style={{
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px dashed #cbd5e1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      {language === 'ur' ? 'مقررہ واجب رقم:' : 'Scheduled Due:'}
                    </span>
                    <MoneyDisplay paisa={collectModalItem.amountPaisa} className="font-bold text-primary" />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">
                    {language === 'ur' ? 'وصول ہونے والی رقم (روپے)' : 'Amount Collected (PKR)'} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    className="form-input font-bold"
                    value={collectAmountRupees}
                    onChange={(e) => setCollectAmountRupees(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">
                    {language === 'ur' ? 'طریقہ ادائیگی' : 'Payment Method'} *
                  </label>
                  <select
                    className="form-select"
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">{language === 'ur' ? 'نقد (Cash)' : 'Cash'}</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="bank">{language === 'ur' ? 'بینک ٹرانسفر (Bank)' : 'Bank Transfer'}</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">
                    {language === 'ur' ? 'رسید / ٹرانزیکشن حوالہ (اختیاری)' : 'Slip / Transaction Ref (Optional)'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. TRX-992384"
                    value={collectReference}
                    onChange={(e) => setCollectReference(e.target.value)}
                  />
                </div>

                <div className="form-group mb-2">
                  <label className="form-label">
                    {language === 'ur' ? 'نوٹس / تفصیل (اختیاری)' : 'Notes / Remarks (Optional)'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === 'ur' ? 'مثلاً: قسط موصول ہوئی بذریعہ دکان' : 'e.g. Collected at shop counter'}
                    value={collectNotes}
                    onChange={(e) => setCollectNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setCollectModalItem(null)}
                  className="btn btn-outline"
                  disabled={collectSaving}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={collectSaving}
                >
                  <Receipt size={15} />
                  <span>
                    {collectSaving
                      ? t('common.loading')
                      : language === 'ur'
                      ? 'وصول کریں اور رسید بنائیں'
                      : 'Confirm & Issue Receipt'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptModalData && (
        <PrintableReceipt
          receiptNumber={receiptModalData.receiptNumber}
          customerName={receiptModalData.customerName}
          customerPhone={receiptModalData.customerPhone}
          contractCode={receiptModalData.contractCode}
          amountPaisa={receiptModalData.amountPaisa}
          remainingBalancePaisa={receiptModalData.remainingBalancePaisa}
          paymentMethod={receiptModalData.paymentMethod}
          date={receiptModalData.date}
          receivedBy={receiptModalData.receivedBy}
          onClose={() => setReceiptModalData(null)}
        />
      )}
    </div>
  );
};
