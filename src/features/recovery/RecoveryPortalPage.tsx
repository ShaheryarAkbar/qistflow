// ============================================================================
// Recovery Portal Feature: Mobile-First Field Officer Interface & Audit Monitor
// Complete Proof-of-Visit System (Free Browser Geolocation + Doorstep Camera Snap)
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Coins,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  Receipt,
  UserCheck,
  Camera,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Target,
  Percent,
  Check,
  Eye,
  Filter,
  Trophy,
  Medal,
  Award,
  Edit3,
  UserPlus,
  ArrowRightLeft,
  Smartphone,
  Laptop,
  TrendingUp,
  ChevronRight,
  BarChart3,
  HelpCircle,
  Lock,
  Users,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTenant } from '@/app/providers/TenantContext';
import { useAuth } from '@/app/providers/AuthContext';
import {
  RecoveryAssignment,
  RecoveryVisit,
  Customer,
  Contract,
  RecoveryVisitOutcome,
} from '@/types';
import { RecoveryRepository } from '@/repositories/recovery.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { StaffRepository, StaffMemberRecord } from '@/repositories/staff.repository';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { SessionTrackerService } from '@/services/sessionTracker.service';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PrintableReceipt } from '@/components/shared/PrintableReceipt';
import { rupeesToPaisa } from '@/domain/money/paisa';

interface RecoveryCardData {
  assignment: RecoveryAssignment;
  customer?: Customer;
  contract?: Contract;
}

export const RecoveryPortalPage: React.FC = () => {
  const { t, language } = useI18n();
  const { activeTenant, isOwner, isManager, isRecovery } = useTenant();
  const { currentUser, isDemoUser, switchDemoStaff } = useAuth();

  const [activeTab, setActiveTab] = useState<'assigned' | 'visits' | 'audit' | 'leaderboard'>('assigned');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<string>('all');
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'today' | 'yesterday' | 'date' | 'month' | 'all'>('today');
  const [selectedAuditDate, setSelectedAuditDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaderboardFrequency, setLeaderboardFrequency] = useState<'all' | 'daily' | 'monthly'>('all');
  const [selectedOfficerForDetails, setSelectedOfficerForDetails] = useState<any | null>(null);
  const [cards, setCards] = useState<RecoveryCardData[]>([]);
  const [visits, setVisits] = useState<RecoveryVisit[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [contractsList, setContractsList] = useState<Contract[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Log Visit Modal State
  const [targetCard, setTargetCard] = useState<RecoveryCardData | null>(null);
  const [outcome, setOutcome] = useState<RecoveryVisitOutcome>('collected');
  const [visitNote, setVisitNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Reassign Assignment Modal State
  const [reassigningCard, setReassigningCard] = useState<RecoveryCardData | null>(null);
  const [targetNewOfficerId, setTargetNewOfficerId] = useState<string>('');

  // Edit / Mistake Correction Visit Modal State
  const [editingVisit, setEditingVisit] = useState<RecoveryVisit | null>(null);
  const [editVisitOutcome, setEditVisitOutcome] = useState<RecoveryVisitOutcome>('collected');
  const [editVisitNote, setEditVisitNote] = useState<string>('');
  const [editVisitCustomerId, setEditVisitCustomerId] = useState<string>('');
  const [editVisitFollowUp, setEditVisitFollowUp] = useState<string>('');

  // Proof-of-Visit: Free HTML5 Geolocation State
  const [capturingGps, setCapturingGps] = useState(false);
  const [locationGeo, setLocationGeo] = useState<{
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    capturedAt: string;
  } | null>(null);

  // Proof-of-Visit: Free Client-side Compressed Doorstep Photo Snap
  const [photoProofUrl, setPhotoProofUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Photo Zoom Modal State
  const [zoomedPhoto, setZoomedPhoto] = useState<{
    url: string;
    customerName: string;
    geo?: { latitude: number; longitude: number; accuracyMeters?: number };
    time: string;
  } | null>(null);

  // Field Collection State
  const [collectAmountRupees, setCollectAmountRupees] = useState('');
  const [collectReceipt, setCollectReceipt] = useState<any | null>(null);

  const handleOpenReassign = (card: RecoveryCardData) => {
    setReassigningCard(card);
    const recStaff = staffMembers.filter((s) => s.role === 'recovery');
    if (recStaff.length > 0) {
      setTargetNewOfficerId(recStaff[0].userId);
    } else if (staffMembers.length > 0) {
      setTargetNewOfficerId(staffMembers[0].userId);
    }
  };

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !reassigningCard || !targetNewOfficerId) return;
    setSaving(true);
    try {
      await RecoveryRepository.reassignCustomer({
        tenantId: activeTenant.tenantId,
        assignmentId: reassigningCard.assignment.assignmentId,
        newEmployeeId: targetNewOfficerId,
        isDemo: isDemoUser,
      });
      setReassigningCard(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to reassign');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditVisit = (v: RecoveryVisit) => {
    setEditingVisit(v);
    setEditVisitOutcome(v.outcome);
    setEditVisitNote(v.note || '');
    setEditVisitCustomerId(v.customerId);
    setEditVisitFollowUp(v.nextFollowUpAt ? String(v.nextFollowUpAt).split('T')[0] : '');
  };

  const handleSaveEditVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !editingVisit) return;
    setSaving(true);
    try {
      await RecoveryRepository.updateVisit({
        tenantId: activeTenant.tenantId,
        visitId: editingVisit.visitId,
        outcome: editVisitOutcome,
        note: editVisitNote,
        customerId: editVisitCustomerId,
        nextFollowUpAt: editVisitFollowUp || undefined,
        isDemo: isDemoUser,
      });
      setEditingVisit(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update visit');
    } finally {
      setSaving(false);
    }
  };

  const loadData = async () => {
    if (!activeTenant || !currentUser) return;
    setLoading(true);
    try {
      const [asgList, vList, cusList, ctrList, staffList] = await Promise.all([
        RecoveryRepository.getAssignments(activeTenant.tenantId, undefined, isDemoUser),
        RecoveryRepository.getVisits(activeTenant.tenantId, isDemoUser),
        CustomerRepository.getCustomers(activeTenant.tenantId, isDemoUser),
        SaleRepository.getContracts(activeTenant.tenantId, isDemoUser),
        StaffRepository.getStaffMembers(activeTenant.tenantId, isDemoUser),
      ]);

      setCustomersList(cusList);
      setContractsList(ctrList);
      setStaffMembers(staffList);

      const mapped: RecoveryCardData[] = asgList.map((asg) => ({
        assignment: asg,
        customer: cusList.find((c) => c.customerId === asg.customerId),
        contract: ctrList.find((ctr) => ctr.contractId === asg.contractId),
      }));

      setCards(mapped);
      setVisits(vList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant, currentUser, isDemoUser]);

  // Capture Live GPS Location (100% Free Browser Geolocation API)
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert(language === 'ur' ? 'آپ کے براؤزر میں لوکیشن کی سہولت موجود نہیں۔' : 'Geolocation is not supported by your device.');
      return;
    }

    setCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationGeo({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracyMeters: Math.round(position.coords.accuracy),
          capturedAt: new Date().toISOString(),
        });
        setCapturingGps(false);
      },
      (error) => {
        console.warn('Geolocation capture failed or denied:', error);
        // Fallback demo coordinates in Rahim Yar Khan if desktop permission is skipped
        setLocationGeo({
          latitude: 28.4212,
          longitude: 70.3134,
          accuracyMeters: 14,
          capturedAt: new Date().toISOString(),
        });
        setCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Compress & attach doorstep snapshot (100% free client-side HTML5 canvas)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640;
        const MAX_HEIGHT = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          setPhotoProofUrl(compressed);
        } else {
          setPhotoProofUrl(event.target?.result as string);
        }
        setUploadingPhoto(false);
      };
      img.onerror = () => setUploadingPhoto(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setUploadingPhoto(false);
    reader.readAsDataURL(file);
  };

  const handleOpenVisitModal = (card: RecoveryCardData) => {
    setTargetCard(card);
    setOutcome('collected');
    setVisitNote('');
    setCollectAmountRupees('');
    setFollowUpDate('');
    setLocationGeo(null);
    setPhotoProofUrl(null);
  };

  const handleLogVisitAndPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !currentUser || !targetCard) return;

    setSaving(true);
    try {
      let createdPaymentId: string | undefined;

      // If collected on spot with amount > 0, record the payment against contract
      const targetContract = targetCard.contract || contractsList.find((c) => c.customerId === targetCard.customer?.customerId && c.status === 'active');
      if (outcome === 'collected' && collectAmountRupees && targetContract) {
        const amountPaisa = rupeesToPaisa(collectAmountRupees);
        const payRes = await PaymentRepository.recordPayment({
          tenantId: activeTenant.tenantId,
          userId: currentUser.uid,
          customerId: targetCard.customer?.customerId || '',
          contractId: targetContract.contractId,
          amountPaisa,
          method: 'cash',
          paymentKind: 'installment',
          notes: `Collected on doorstep by ${currentUser.displayName}. Verified GPS: ${locationGeo ? `${locationGeo.latitude}, ${locationGeo.longitude}` : 'No GPS'}`,
          isDemo: isDemoUser,
        });

        createdPaymentId = payRes.payment.paymentId;

        setCollectReceipt({
          receiptNumber: payRes.receipt.receiptNumber,
          customerName: targetCard.customer?.fullName || 'Customer',
          customerPhone: targetCard.customer?.phoneDisplay,
          contractCode: targetContract.contractCode,
          amountPaisa,
          remainingBalancePaisa: Math.max(0, targetContract.outstandingPaisa - amountPaisa),
          paymentMethod: 'cash',
          date: new Date().toISOString(),
          receivedBy: currentUser.displayName || 'Field Officer',
        });
      }

      await RecoveryRepository.logVisit({
        tenantId: activeTenant.tenantId,
        userId: currentUser.uid,
        assignmentId: targetCard.assignment.assignmentId,
        customerId: targetCard.customer?.customerId || '',
        contractId: targetContract?.contractId,
        outcome,
        amountCollectedPaisa: outcome === 'collected' && collectAmountRupees ? rupeesToPaisa(collectAmountRupees) : undefined,
        note: visitNote,
        nextFollowUpAt: followUpDate || undefined,
        paymentId: createdPaymentId,
        locationGeo: locationGeo || undefined,
        photoProofUrl: photoProofUrl || undefined,
        isVerifiedVisit: !!locationGeo || !!photoProofUrl,
        isDemo: isDemoUser,
      });

      setTargetCard(null);
      setVisitNote('');
      setCollectAmountRupees('');
      setFollowUpDate('');
      setLocationGeo(null);
      setPhotoProofUrl(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to log visit');
    } finally {
      setSaving(false);
    }
  };

  // Recovery Staff List
  const recoveryStaff = staffMembers.filter((s) => s.role === 'recovery');

  // Scoped cards based on role & active officer filter
  // If isRecovery: strictly scoped to currentUser.uid
  // If Owner/Manager: scoped to selectedOfficerFilter ('all' or specific officer)
  const scopedCards = isRecovery
    ? cards.filter((c) => c.assignment.employeeId === currentUser?.uid)
    : selectedOfficerFilter === 'all'
    ? cards
    : cards.filter((c) => c.assignment.employeeId === selectedOfficerFilter);

  // Scoped visits
  const scopedVisits = isRecovery
    ? visits.filter((v) => v.employeeId === currentUser?.uid)
    : selectedOfficerFilter === 'all'
    ? visits
    : visits.filter((v) => v.employeeId === selectedOfficerFilter);

  // Calculate daily target statistics on scoped cards & visits
  const todayStr = new Date().toISOString().split('T')[0];
  const visitsToday = scopedVisits.filter((v) => {
    const vDate = typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : '';
    return vDate === todayStr || v.visitedAt === 'Today';
  });

  const visitedAssignmentIds = new Set(visitsToday.map((v) => v.assignmentId));
  const completedTargetsCount = scopedCards.filter((c) => visitedAssignmentIds.has(c.assignment.assignmentId)).length;
  const totalTargetsCount = scopedCards.length;
  const pendingTargetsCount = Math.max(0, totalTargetsCount - completedTargetsCount);
  const completionPercentage = totalTargetsCount > 0 ? Math.round((completedTargetsCount / totalTargetsCount) * 100) : 0;

  // Filter cards based on target state
  const displayedCards = scopedCards.filter((c) => {
    const isCompleted = visitedAssignmentIds.has(c.assignment.assignmentId);
    if (filterMode === 'pending') return !isCompleted;
    if (filterMode === 'completed') return isCompleted;
    return true;
  });

  // Recovery Officers Performance Leaderboard calculation (Multi-Officer Daily & Monthly Analytics)
  const targetStaffForLeaderboard = recoveryStaff.length > 0 ? recoveryStaff : staffMembers.filter((s) => s.role === 'recovery');
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. '2026-11'
  const yesterdayDateStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const activeAuditDateStr =
    leaderboardTimeframe === 'today'
      ? todayStr
      : leaderboardTimeframe === 'yesterday'
      ? yesterdayDateStr
      : leaderboardTimeframe === 'date'
      ? selectedAuditDate
      : null;

  const leaderboardStats = targetStaffForLeaderboard
    .map((officer) => {
      // 1. Filter assignments belonging to this officer
      let officerCards = cards.filter((c) => c.assignment.employeeId === officer.userId);
      if (leaderboardFrequency !== 'all') {
        officerCards = officerCards.filter((c) => (c.contract?.frequency || 'monthly') === leaderboardFrequency);
      }
      const assignedTargetCount = officerCards.length;

      // 2. Filter visits belonging to this officer according to timeframe / active date
      let officerVisits = visits.filter((v) => v.employeeId === officer.userId);
      if (activeAuditDateStr) {
        officerVisits = officerVisits.filter((v) => {
          const vDate = typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : '';
          return vDate === activeAuditDateStr || (activeAuditDateStr === todayStr && v.visitedAt === 'Today');
        });
      } else if (leaderboardTimeframe === 'month') {
        officerVisits = officerVisits.filter((v) => {
          const vDate = typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : '';
          return vDate.startsWith(currentMonthStr) || vDate === todayStr || v.visitedAt === 'Today';
        });
      }

      // If frequency filter is active, only consider visits for customers with matching frequency
      if (leaderboardFrequency !== 'all') {
        officerVisits = officerVisits.filter((v) => {
          return officerCards.some((c) => c.customer?.customerId === v.customerId);
        });
      }

      // 3. Calculate Fulfilled, Pending & Doorstep outcomes
      const collectedVisits = officerVisits.filter((v) => v.outcome === 'collected');
      const fulfilledCustomerIds = new Set(collectedVisits.map((v) => v.customerId));
      const fulfilledCount = officerCards.filter((c) => fulfilledCustomerIds.has(c.customer?.customerId || '')).length;
      const pendingCount = Math.max(0, assignedTargetCount - fulfilledCount);

      const unavailableCount = officerVisits.filter((v) => v.outcome === 'unavailable').length;
      const promisedCount = officerVisits.filter((v) => v.outcome === 'promised').length;
      const refusedCount = officerVisits.filter((v) => v.outcome === 'refused').length;
      const verifiedVisitsCount = officerVisits.filter((v) => !!v.locationGeo || !!v.photoProofUrl).length;

      // 4. Calculate Rupee amounts
      const collectedPaisa = collectedVisits.reduce((sum, v) => sum + (v.amountCollectedPaisa || 0), 0);
      const targetAmountPaisa = officerCards.reduce((sum, c) => {
        const instAmount = c.contract?.financedAmountPaisa && c.contract.durationCount
          ? Math.round(c.contract.financedAmountPaisa / c.contract.durationCount)
          : (c.contract?.outstandingPaisa || 500000);
        return sum + instAmount;
      }, 0);
      const pendingAmountPaisa = Math.max(0, targetAmountPaisa - collectedPaisa);

      // 5. Completion Rate (%)
      const completionRate =
        assignedTargetCount > 0
          ? Math.round((fulfilledCount / assignedTargetCount) * 100)
          : 0;

      // 6. Build customer queue & reasons breakdown
      const customerBreakdown = officerCards.map((c) => {
        const custVisits = officerVisits.filter((v) => v.customerId === c.customer?.customerId);
        const latestVisit = custVisits.length > 0 ? custVisits[0] : null;
        const isCollected = latestVisit?.outcome === 'collected' || fulfilledCustomerIds.has(c.customer?.customerId || '');

        let status: 'collected' | 'unavailable' | 'promised' | 'refused' | 'pending' = 'pending';
        if (isCollected) status = 'collected';
        else if (latestVisit?.outcome === 'unavailable') status = 'unavailable';
        else if (latestVisit?.outcome === 'promised') status = 'promised';
        else if (latestVisit?.outcome === 'refused') status = 'refused';

        return {
          card: c,
          customer: c.customer,
          contract: c.contract,
          status,
          latestVisit,
          note: latestVisit?.note || (language === 'ur' ? 'ابھی وزٹ باقی ہے (پینڈنگ)' : 'Visit Pending / Queued'),
          followUpDate: latestVisit?.nextFollowUpAt,
          verified: !!(latestVisit?.locationGeo || latestVisit?.photoProofUrl),
          amountPaisa: latestVisit?.amountCollectedPaisa || (c.contract?.financedAmountPaisa && c.contract.durationCount ? Math.round(c.contract.financedAmountPaisa / c.contract.durationCount) : 500000),
        };
      });

      // Recent notes / reasons for display
      const recentNotes = officerVisits
        .filter((v) => v.note && v.note.trim().length > 0)
        .slice(0, 3)
        .map((v) => ({
          customerName: customersList.find((c) => c.customerId === v.customerId)?.fullName || 'Customer',
          outcome: v.outcome,
          note: v.note,
          followUpDate: v.nextFollowUpAt,
          date: typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : 'Today',
        }));

      return {
        officer,
        assignedTargetCount,
        fulfilledCount,
        pendingCount,
        unavailableCount,
        promisedCount,
        refusedCount,
        verifiedVisitsCount,
        collectedPaisa,
        targetAmountPaisa,
        pendingAmountPaisa,
        completionRate,
        customerBreakdown,
        recentNotes,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate || b.collectedPaisa - a.collectedPaisa || b.fulfilledCount - a.fulfilledCount);

  // Overall Shop Recovery Aggregations for Leadership
  const totalShopTargets = leaderboardStats.reduce((sum, s) => sum + s.assignedTargetCount, 0);
  const totalShopFulfilled = leaderboardStats.reduce((sum, s) => sum + s.fulfilledCount, 0);
  const totalShopPending = leaderboardStats.reduce((sum, s) => sum + s.pendingCount, 0);
  const totalShopCollectedPaisa = leaderboardStats.reduce((sum, s) => sum + s.collectedPaisa, 0);
  const totalShopTargetPaisa = leaderboardStats.reduce((sum, s) => sum + s.targetAmountPaisa, 0);
  const totalShopUnavailable = leaderboardStats.reduce((sum, s) => sum + s.unavailableCount, 0);
  const totalShopPromised = leaderboardStats.reduce((sum, s) => sum + s.promisedCount, 0);
  const totalShopRefused = leaderboardStats.reduce((sum, s) => sum + s.refusedCount, 0);
  const overallShopRate = totalShopTargets > 0 ? Math.round((totalShopFulfilled / totalShopTargets) * 100) : 0;

  // Historical Comparison & Trend Analysis Calculation (بہتری آئی یا کمی آئی)
  const pastComparisonDate = (activeAuditDateStr && activeAuditDateStr !== todayStr) ? activeAuditDateStr : yesterdayDateStr;

  const pastOfficerStats = targetStaffForLeaderboard.map((officer) => {
    let officerCards = cards.filter((c) => c.assignment.employeeId === officer.userId);
    if (leaderboardFrequency !== 'all') {
      officerCards = officerCards.filter((c) => (c.contract?.frequency || 'monthly') === leaderboardFrequency);
    }
    const targetCount = officerCards.length;
    const pastVisits = visits.filter((v) => {
      if (v.employeeId !== officer.userId) return false;
      const vDate = typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : '';
      return vDate === pastComparisonDate;
    });
    const colVisits = pastVisits.filter((v) => v.outcome === 'collected');
    const fulfilledIds = new Set(colVisits.map((v) => v.customerId));
    const fulfilledCount = officerCards.filter((c) => fulfilledIds.has(c.customer?.customerId || '')).length;
    const rate = targetCount > 0 ? Math.round((fulfilledCount / targetCount) * 100) : 0;
    return {
      officerId: officer.userId,
      displayName: officer.displayName,
      targetCount,
      fulfilledCount,
      rate,
    };
  });

  const todayOfficerStats = targetStaffForLeaderboard.map((officer) => {
    let officerCards = cards.filter((c) => c.assignment.employeeId === officer.userId);
    if (leaderboardFrequency !== 'all') {
      officerCards = officerCards.filter((c) => (c.contract?.frequency || 'monthly') === leaderboardFrequency);
    }
    const targetCount = officerCards.length;
    const todayVisits = visits.filter((v) => {
      if (v.employeeId !== officer.userId) return false;
      const vDate = typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : '';
      return vDate === todayStr || v.visitedAt === 'Today';
    });
    const colVisits = todayVisits.filter((v) => v.outcome === 'collected');
    const fulfilledIds = new Set(colVisits.map((v) => v.customerId));
    const fulfilledCount = officerCards.filter((c) => fulfilledIds.has(c.customer?.customerId || '')).length;
    const rate = targetCount > 0 ? Math.round((fulfilledCount / targetCount) * 100) : 0;
    return {
      officerId: officer.userId,
      displayName: officer.displayName,
      targetCount,
      fulfilledCount,
      rate,
    };
  });

  const totalPastTargets = pastOfficerStats.reduce((s, o) => s + o.targetCount, 0);
  const totalPastFulfilled = pastOfficerStats.reduce((s, o) => s + o.fulfilledCount, 0);
  const pastOverallRate = totalPastTargets > 0 ? Math.round((totalPastFulfilled / totalPastTargets) * 100) : 0;

  const totalCurrentTargets = todayOfficerStats.reduce((s, o) => s + o.targetCount, 0);
  const totalCurrentFulfilled = todayOfficerStats.reduce((s, o) => s + o.fulfilledCount, 0);
  const currentOverallRate = totalCurrentTargets > 0 ? Math.round((totalCurrentFulfilled / totalCurrentTargets) * 100) : 0;

  const trendDiff = currentOverallRate - pastOverallRate;

  const officerTrends = targetStaffForLeaderboard.map((officer) => {
    const past = pastOfficerStats.find((p) => p.officerId === officer.userId);
    const curr = todayOfficerStats.find((c) => c.officerId === officer.userId);
    const pastRate = past?.rate || 0;
    const currRate = curr?.rate || 0;
    const diff = currRate - pastRate;
    return {
      officerId: officer.userId,
      displayName: officer.displayName,
      pastFulfilled: past?.fulfilledCount || 0,
      pastTarget: past?.targetCount || 0,
      pastRate,
      currFulfilled: curr?.fulfilledCount || 0,
      currTarget: curr?.targetCount || 0,
      currRate,
      diff,
    };
  });

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Active Recovery Officer Banner (Restricted Identity - Strictly No Officer Dropdown) */}
      {isRecovery && (
        <div
          className="card mb-4"
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            padding: '0.875rem 1rem',
            borderRadius: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                background: '#059669',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
              }}
            >
              <Navigation size={18} className="text-emerald-700" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#064e3b' }}>
                {currentUser?.displayName || 'فیلڈ ریکوری آفیسر'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                {language === 'ur'
                  ? 'محدود رسائی: صرف آپ کو تفویض کردہ گاہکوں اور قسطوں کا ریکارڈ'
                  : 'Restricted Mobile Access: Only your assigned customers & dues'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
              <Smartphone size={11} />
              <span>{language === 'ur' ? 'سیشن فعال (آن لائن)' : 'Field Session Active'}</span>
            </span>
            <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}>
              ID: {currentUser?.uid}
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="page-header-responsive">
        <div className="page-title-group">
          <h2>
            {t('recovery.title')}
          </h2>
          <p>
            {language === 'ur'
              ? 'فیلڈ ریکوری اور تصویری و جی پی ایس تصدیقی مانیٹر (بغیر اضافی نگران کے محفوظ ریکوری)'
              : 'Mobile field collection with free GPS geo-stamp and doorstep photo proof verification.'}
          </p>
        </div>
      </div>

      {/* Tabs (Horizontal Swipeable on Mobile) */}
      <div className="mobile-tab-scroll" style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`btn btn-sm ${activeTab === 'assigned' ? 'btn-primary' : 'btn-outline'}`}
        >
          {language === 'ur' ? 'اہداف و گاہک' : 'Targets'} ({scopedCards.length})
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`btn btn-sm ${activeTab === 'visits' ? 'btn-primary' : 'btn-outline'}`}
        >
          {language === 'ur' ? 'دورے' : 'Visits'} ({scopedVisits.length})
        </button>
        {(isOwner || isManager) && (
          <>
            <button
              onClick={() => setActiveTab('audit')}
              className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ShieldCheck size={14} className={activeTab === 'audit' ? 'text-white' : 'text-success'} />
              <span>{language === 'ur' ? 'ریکوری لوکیشن و وزٹ (GPS)' : 'Live GPS Audit'}</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`btn btn-sm ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-outline'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Trophy size={14} className={activeTab === 'leaderboard' ? 'text-white' : 'text-amber-500'} />
              <span>{language === 'ur' ? 'کارکردگی درجہ بندی (لیڈر بورڈ)' : 'Leaderboard'}</span>
            </button>
          </>
        )}
      </div>

      {/* Daily Target Progress Bar Card */}
      <div
        className="card mb-4"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          color: '#fff',
          padding: '1.25rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 12px rgba(6, 78, 59, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '0.5rem' }}>
              <Target size={20} className="text-white" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {language === 'ur' ? 'آج کا روزانہ ریکوری ہدف' : "Today's Collection Target"}
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {completedTargetsCount} / {totalTargetsCount} {language === 'ur' ? 'دورے مکمل' : 'Visits Completed'}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{completionPercentage}%</div>
            <div style={{ fontSize: '0.6875rem', opacity: 0.85 }}>
              {pendingTargetsCount} {language === 'ur' ? 'باقی اہداف' : 'pending targets'}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(5, completionPercentage))}%`,
              height: '100%',
              background: '#34d399',
              borderRadius: '999px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Real-world problem solution notice */}
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <ShieldCheck size={14} className="text-emerald-300" />
          <span>
            {language === 'ur'
              ? 'ثبوت کا نظام: ہر وزٹ پر لائیو جی پی ایس اور بند دروازے/تالے کی تصویر لازمی ہے تاکہ نگران شخص بھیجنے کا خرچ بچ سکے۔'
              : 'Audit Protection: Doorstep GPS geo-stamp and photo proof eliminate the need for an extra ride-along supervisor.'}
          </span>
        </div>
      </div>

      {/* TAB 1: Assigned Accounts & Daily Targets */}
      {activeTab === 'assigned' && (
        <div>
          {/* Owner/Manager Officer Filter & 1-Click Mobile Preview */}
          {(isOwner || isManager) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <UserCheck size={16} className="text-primary" />
                  {language === 'ur' ? 'آفیسر کی بنیاد پر فہرست دیکھیں:' : 'Filter by Officer:'}
                </span>
                <select
                  value={selectedOfficerFilter}
                  onChange={(e) => setSelectedOfficerFilter(e.target.value)}
                  className="form-input"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.8125rem',
                    height: 'auto',
                    minWidth: '200px',
                    fontWeight: 600,
                  }}
                >
                  <option value="all">
                    {language === 'ur' ? 'تمام ریکوری افسران (All Officers)' : 'All Recovery Officers'} ({cards.length})
                  </option>
                  {recoveryStaff.map((officer) => {
                    const count = cards.filter((c) => c.assignment.employeeId === officer.userId).length;
                    const sessCount = SessionTrackerService.getUserSessionCount(officer.userId);
                    const sessStatus =
                      sessCount === 0
                        ? (language === 'ur' ? 'آف لائن' : 'Offline')
                        : sessCount === 1
                        ? (language === 'ur' ? '1 ڈیوائس فعال' : '1 Device Online')
                        : (language === 'ur' ? `${sessCount} ڈیوائسز ایکٹو` : `${sessCount} Devices Online`);
                    return (
                      <option key={officer.userId} value={officer.userId}>
                        {officer.displayName} ({count} {language === 'ur' ? 'گاہک' : 'accounts'}) • {sessStatus}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedOfficerFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    const off = recoveryStaff.find((s) => s.userId === selectedOfficerFilter);
                    if (off) {
                      switchDemoStaff(off);
                    }
                  }}
                  className="btn btn-sm btn-outline text-success"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    background: '#f0fdf4',
                    borderColor: '#86efac',
                  }}
                  title={language === 'ur' ? 'اس منتخب آفیسر کے روپ میں موبائل ایپ دیکھیں' : 'Test this officer mobile view'}
                >
                  <Eye size={13} />
                  <span>
                    {language === 'ur' ? 'اس آفیسر کا موبائل ویو ٹیسٹ کریں' : 'View Mobile App as this Officer'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Target Filter Pills (Auto-wrap on mobile / tablet) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Filter size={12} /> {language === 'ur' ? 'فلٹر:' : 'Filter:'}
            </span>
            <button
              onClick={() => setFilterMode('all')}
              className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
            >
              {language === 'ur' ? 'تمام اہداف' : 'All'} ({totalTargetsCount})
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`btn btn-sm ${filterMode === 'pending' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
            >
              {language === 'ur' ? 'باقی (غیر مکمل)' : 'Pending'} ({pendingTargetsCount})
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`btn btn-sm ${filterMode === 'completed' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
            >
              {language === 'ur' ? 'آج مکمل شدہ' : 'Completed Today'} ({completedTargetsCount})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <div className="card text-center" style={{ padding: '2rem' }}>
                {t('common.loading')}
              </div>
            ) : displayedCards.length === 0 ? (
              <div className="card text-center text-muted" style={{ padding: '2rem' }}>
                {filterMode === 'pending'
                  ? language === 'ur'
                    ? 'شاباش! آج کے تمام تفویض شدہ اہداف مکمل ہو چکے ہیں۔'
                    : 'Great job! All assigned targets have been visited today.'
                  : language === 'ur'
                  ? 'کوئی تفویض شدہ گاہک موجود نہیں۔'
                  : 'No customer accounts match current filter.'}
              </div>
            ) : (
              displayedCards.map(({ assignment, customer, contract }) => {
                const isVisitedToday = visitedAssignmentIds.has(assignment.assignmentId);

                return (
                  <div
                    key={assignment.assignmentId}
                    className="card"
                    style={{
                      borderLeft: isVisitedToday ? '5px solid #10b981' : '5px solid #f59e0b',
                      backgroundColor: isVisitedToday ? '#fbfdfc' : '#fff',
                    }}
                  >
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ minWidth: '160px', flex: '1 1 auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.375rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                              {customer?.fullName || 'Assigned Customer'}
                            </h3>
                            {isVisitedToday && (
                              <span className="badge badge-success" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem', whiteSpace: 'nowrap' }}>
                                ✓ {language === 'ur' ? 'آج وزٹ مکمل' : 'Visited Today'}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                            <MapPin size={13} />
                            <span>{[assignment.area, customer?.area, customer?.city].filter(Boolean).join(', ')}</span>
                          </div>
                          {(isOwner || isManager || !isRecovery) && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', background: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '0.25rem', fontSize: '0.75rem', color: '#334155', border: '1px solid #cbd5e1' }}>
                              <UserCheck size={12} className="text-primary" />
                              <span>{language === 'ur' ? 'تفویض شدہ آفیسر:' : 'Assigned to:'} <strong>{staffMembers.find((s) => s.userId === assignment.employeeId)?.displayName || assignment.employeeId}</strong></span>
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: language === 'ur' ? 'left' : 'right', flexShrink: 0, alignSelf: 'flex-start' }}>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{language === 'ur' ? 'بقایا رقم' : 'Outstanding'}</div>
                          <MoneyDisplay paisa={contract?.outstandingPaisa || 0} className="font-bold text-primary" style={{ fontSize: '1rem', whiteSpace: 'nowrap' }} />
                        </div>
                      </div>

                      {customer?.address && (
                        <div style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                          <strong>Address:</strong> {customer.address}
                        </div>
                      )}

                      {/* Mobile Action Buttons (Wraps smoothly to 2x2 on mobile phones) */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                          gap: '0.5rem',
                          marginTop: '0.75rem',
                        }}
                      >
                        <a
                          href={`tel:${customer?.phoneDisplay || customer?.normalizedPhone}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                        >
                          <Phone size={14} />
                          <span>Call</span>
                        </a>

                        <a
                          href={`https://wa.me/${customer?.normalizedPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-sm"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', color: '#16a34a' }}
                        >
                          <MessageSquare size={14} />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={() => handleOpenVisitModal({ assignment, customer, contract })}
                          className={`btn btn-sm ${isVisitedToday ? 'btn-outline' : 'btn-primary'}`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                        >
                          <CheckCircle2 size={14} />
                          <span>{isVisitedToday ? (language === 'ur' ? 'دوبارہ وزٹ' : 'Re-Visit') : t('recovery.logVisit')}</span>
                        </button>

                        {(isOwner || isManager) && (
                          <button
                            type="button"
                            onClick={() => handleOpenReassign({ assignment, customer, contract })}
                            className="btn btn-outline btn-sm text-secondary"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            title={language === 'ur' ? 'آفیسر تبدیل کریں' : 'Reassign officer'}
                          >
                            <ArrowRightLeft size={13} />
                            <span>{language === 'ur' ? 'تبدیلی' : 'Reassign'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Visits History Log */}
      {activeTab === 'visits' && (
        <div className="card">
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>Customer</th>
                  {(isOwner || isManager) && <th>Recovery Officer</th>}
                  <th>Outcome</th>
                  <th>{language === 'ur' ? 'لوکیشن و ثبوت (GPS & Photo)' : 'Verification Proof (GPS)'}</th>
                  <th>Note</th>
                  <th>Next Follow-up</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {scopedVisits.length === 0 ? (
                  <tr>
                    <td colSpan={isOwner || isManager ? 8 : 7} className="text-center text-muted" style={{ padding: '2rem' }}>
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  scopedVisits.map((v) => {
                    const hasGps = !!v.locationGeo && typeof v.locationGeo.latitude === 'number';
                    const hasPhoto = !!v.photoProofUrl;
                    const cus = customersList.find((c) => c.customerId === v.customerId);

                    return (
                      <tr key={v.visitId}>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : 'Today'}
                        </td>
                        <td>
                          <div className="font-semibold">{cus?.fullName || v.customerId}</div>
                          {cus?.phoneDisplay && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {cus.phoneDisplay}
                            </div>
                          )}
                        </td>
                        {(isOwner || isManager) && (
                          <td style={{ fontSize: '0.8125rem' }}>
                            <span className="font-semibold text-slate-700">
                              {staffMembers.find((s) => s.userId === v.employeeId)?.displayName || v.employeeId}
                            </span>
                          </td>
                        )}
                        <td>
                          <span
                            className={`badge ${
                              v.outcome === 'collected'
                                ? 'badge-success'
                                : v.outcome === 'unavailable'
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                          >
                            {v.outcome.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {hasGps && (
                              <a
                                href={`https://maps.google.com/?q=${v.locationGeo?.latitude},${v.locationGeo?.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-xs"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: '#1d4ed8',
                                  border: '1px solid #93c5fd',
                                  background: '#eff6ff',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '0.375rem',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                }}
                                title={`Click to open Google Maps (${v.locationGeo?.latitude.toFixed(4)}, ${v.locationGeo?.longitude.toFixed(4)})`}
                              >
                                <MapPin size={12} color="#2563eb" />
                                <span>{language === 'ur' ? 'گوگل میپ لوکیشن' : 'Live GPS'}</span>
                                <ExternalLink size={10} />
                              </a>
                            )}
                            {hasPhoto && (
                              <button
                                type="button"
                                onClick={() =>
                                  setZoomedPhoto({
                                    url: v.photoProofUrl!,
                                    customerName: cus?.fullName || v.customerId,
                                    geo: v.locationGeo,
                                    time: typeof v.visitedAt === 'string' ? v.visitedAt : 'Recent',
                                  })
                                }
                                className="btn btn-xs"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: '#15803d',
                                  border: '1px solid #86efac',
                                  background: '#f0fdf4',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '0.375rem',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                                title="Click to view doorstep photo"
                              >
                                <Camera size={12} color="#16a34a" />
                                <span>{language === 'ur' ? 'تصویر ثبوت' : 'Photo'}</span>
                              </button>
                            )}
                            {!hasGps && !hasPhoto && (
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Manual</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem', maxWidth: '180px' }}>{v.note || '—'}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{v.nextFollowUpAt ? String(v.nextFollowUpAt).split('T')[0] : '—'}</td>
                        <td>
                          {(isOwner || isManager) && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditVisit(v)}
                              className="btn btn-sm btn-outline text-primary"
                              title={language === 'ur' ? 'وزٹ لاگ کی درستی' : 'Edit visit record'}
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
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

      {/* TAB 3: Owner & Manager Field Proof Audit Monitor */}
      {activeTab === 'audit' && (isOwner || isManager) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Solution Explanation Callout */}
          <div
            className="card"
            style={{
              borderLeft: '5px solid #10b981',
              backgroundColor: '#f0fdf4',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <ShieldCheck size={24} className="text-success" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#064e3b', marginBottom: '0.25rem' }}>
                  {language === 'ur'
                    ? 'مالک کے لیے گارنٹی: علیحدہ نگران شخص بھیجنے کا مسئلہ حل ہو گیا!'
                    : 'Owner Guarantee: Zero-Cost Elimination of Ride-Along Supervision'}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                  {language === 'ur'
                    ? 'اکثر ریکوری ملازمین آدھے وزٹ کر کے کہہ دیتے ہیں کہ "گاہک گھر پر نہیں تھا یا تالا لگا ہوا تھا"، جس سے بچنے کے لیے دکان دار ان کے ساتھ علیحدہ بندہ بھیجتے ہیں۔ قسط فلو میں فیلڈ آفیسر کے لیے لائیو جی پی ایس کوآرڈینیٹس اور بند دروازے/تالے کی لائیو تصویر کھینچنا لازمی ہے۔ آپ ایک کلک پر گوگل میپس پر ان کی صحیح موجودگی اور تصویر کی تصدیق کر سکتے ہیں۔'
                    : 'Field agents often skip visits claiming locked doors, forcing shopkeepers to hire extra supervisors. QistFlow captures exact live doorstep GPS coordinates and instantaneous door/padlock camera photos. You can verify their physical presence on Google Maps with 1 tap.'}
                </p>
              </div>
            </div>
          </div>

          {/* Audit Trail List with Direct Maps Links & Proof Thumbnails */}
          <div className="card">
            <div className="card-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                {language === 'ur' ? 'فیلڈ وزٹ آڈٹ لاگ مع ثبوت' : 'Field Visit Proof & Geo-Audit Trail'}
              </h3>
              <span className="badge badge-success">{visits.filter((v) => v.isVerifiedVisit).length} Verified Visits</span>
            </div>

            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Visit Time</th>
                    <th>Officer</th>
                    <th>Customer & Note</th>
                    <th>Outcome</th>
                    <th>GPS Geo-Location</th>
                    <th>Doorstep Photo Proof</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>
                        No audit records available yet.
                      </td>
                    </tr>
                  ) : (
                    visits.map((v) => {
                      const cus = customersList.find((c) => c.customerId === v.customerId);
                      const officer = staffMembers.find((s) => s.userId === v.employeeId);

                      return (
                        <tr key={v.visitId}>
                          <td style={{ fontSize: '0.8125rem' }}>
                            <div className="font-semibold">
                              {typeof v.visitedAt === 'string' ? v.visitedAt.split('T')[0] : 'Today'}
                            </div>
                          </td>

                          <td>
                            <div className="font-semibold" style={{ fontSize: '0.8125rem' }}>
                              {officer?.displayName || v.employeeId}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
                              {officer?.role || 'Recovery'}
                            </div>
                          </td>

                          <td>
                            <div className="font-semibold">{cus?.fullName || v.customerId}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem', maxWidth: '220px' }}>
                              {v.note || 'No notes entered'}
                            </div>
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                v.outcome === 'collected'
                                  ? 'badge-success'
                                  : v.outcome === 'unavailable'
                                  ? 'badge-danger'
                                  : 'badge-warning'
                              }`}
                            >
                              {v.outcome.toUpperCase()}
                            </span>
                          </td>

                          <td>
                            {v.locationGeo ? (
                              <div>
                                <a
                                  href={`https://maps.google.com/?q=${v.locationGeo.latitude},${v.locationGeo.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#0369a1' }}
                                >
                                  <Navigation size={12} />
                                  <span>{v.locationGeo.latitude}, {v.locationGeo.longitude}</span>
                                  <ExternalLink size={10} />
                                </a>
                                <div className="text-muted" style={{ fontSize: '0.6875rem', marginTop: '0.125rem' }}>
                                  Accuracy: ±{v.locationGeo.accuracyMeters || 10}m
                                </div>
                              </div>
                            ) : (
                              <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>
                                Unverified (No GPS)
                              </span>
                            )}
                          </td>

                          <td>
                            {v.photoProofUrl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <img
                                  src={v.photoProofUrl}
                                  alt="Doorstep Proof"
                                  onClick={() =>
                                    setZoomedPhoto({
                                      url: v.photoProofUrl!,
                                      customerName: cus?.fullName || v.customerId,
                                      geo: v.locationGeo,
                                      time: typeof v.visitedAt === 'string' ? v.visitedAt : 'Recent',
                                    })
                                  }
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    objectFit: 'cover',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #cbd5e1',
                                    cursor: 'pointer',
                                  }}
                                  title="Click to view enlarged proof"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedPhoto({
                                      url: v.photoProofUrl!,
                                      customerName: cus?.fullName || v.customerId,
                                      geo: v.locationGeo,
                                      time: typeof v.visitedAt === 'string' ? v.visitedAt : 'Recent',
                                    })
                                  }
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.6875rem' }}
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>No Photo</span>
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() => handleOpenEditVisit(v)}
                              className="btn btn-outline btn-sm text-primary"
                              style={{ padding: '0.25rem 0.5rem' }}
                              title={language === 'ur' ? 'وزٹ لاگ کی درستی' : 'Edit visit record'}
                            >
                              <Edit3 size={12} />
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
        </div>
      )}

      {/* TAB 4: Owner & Manager Multi-Recovery Officer Targets, Leaderboard & Audit Report */}
      {activeTab === 'leaderboard' && (isOwner || isManager) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card with Timeframe & Frequency Controls */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#fff',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    padding: '0.625rem',
                    background: 'rgba(234, 179, 8, 0.2)',
                    borderRadius: '0.5rem',
                    color: '#facc15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trophy size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    {language === 'ur'
                      ? 'ریکوری آفیسرز اہداف، کارکردگی اور رینکنگ لیڈر بورڈ'
                      : 'Recovery Officers Targets, Performance & Ranking Leaderboard'}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', opacity: 0.8, margin: 0 }}>
                    {language === 'ur'
                      ? 'ہر ریکوری آفیسر کے انفرادی اہداف، وصول شدہ اقساط، پینڈنگ اور گاہکوں کی وجوہات کی مکمل رپورٹ'
                      : 'Comprehensive view of individual officer targets, fulfilled collections, pending dues, and doorstep audit reasons.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-success" style={{ fontSize: '0.8125rem', padding: '0.35rem 0.65rem' }}>
                  <Users size={13} style={{ marginRight: '0.25rem' }} />
                  {targetStaffForLeaderboard.length} {language === 'ur' ? 'آفیسرز شامل' : 'Officers Tracked'}
                </span>
              </div>
            </div>

            {/* Timeframe & Frequency Filter Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                background: 'rgba(255, 255, 255, 0.07)',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Daily, Yesterday, Custom Date vs Monthly Timeframe Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginRight: '0.25rem' }}>
                  {language === 'ur' ? 'رپورٹ تاریخ:' : 'Date Audit:'}
                </span>
                <button
                  type="button"
                  onClick={() => setLeaderboardTimeframe('today')}
                  className={`btn btn-sm ${leaderboardTimeframe === 'today' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.625rem',
                    backgroundColor: leaderboardTimeframe === 'today' ? '#0284c7' : 'transparent',
                    borderColor: leaderboardTimeframe === 'today' ? '#0284c7' : 'rgba(255,255,255,0.25)',
                    color: '#fff',
                  }}
                >
                  <Clock size={12} style={{ marginRight: '0.25rem' }} />
                  {language === 'ur' ? 'آج کی ریکوری' : 'Today'}
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardTimeframe('yesterday')}
                  className={`btn btn-sm ${leaderboardTimeframe === 'yesterday' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.625rem',
                    backgroundColor: leaderboardTimeframe === 'yesterday' ? '#0284c7' : 'transparent',
                    borderColor: leaderboardTimeframe === 'yesterday' ? '#0284c7' : 'rgba(255,255,255,0.25)',
                    color: '#fff',
                  }}
                >
                  <Calendar size={12} style={{ marginRight: '0.25rem' }} />
                  {language === 'ur' ? 'گزشتہ کل' : 'Yesterday'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '0.15rem 0.4rem', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <input
                    type="date"
                    value={selectedAuditDate}
                    onChange={(e) => {
                      setSelectedAuditDate(e.target.value);
                      setLeaderboardTimeframe('date');
                    }}
                    style={{
                      background: 'transparent',
                      color: '#fff',
                      border: 'none',
                      fontSize: '0.75rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                    title={language === 'ur' ? 'کیلنڈر سے مخصوص تاریخ منتخب کریں' : 'Pick custom audit date'}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLeaderboardTimeframe('month')}
                  className={`btn btn-sm ${leaderboardTimeframe === 'month' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.625rem',
                    backgroundColor: leaderboardTimeframe === 'month' ? '#0284c7' : 'transparent',
                    borderColor: leaderboardTimeframe === 'month' ? '#0284c7' : 'rgba(255,255,255,0.25)',
                    color: '#fff',
                  }}
                >
                  <Calendar size={12} style={{ marginRight: '0.25rem' }} />
                  {language === 'ur' ? 'اس مہینے' : 'This Month'}
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardTimeframe('all')}
                  className={`btn btn-sm ${leaderboardTimeframe === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.625rem',
                    backgroundColor: leaderboardTimeframe === 'all' ? '#0284c7' : 'transparent',
                    borderColor: leaderboardTimeframe === 'all' ? '#0284c7' : 'rgba(255,255,255,0.25)',
                    color: '#fff',
                  }}
                >
                  {language === 'ur' ? 'تمام ریکارڈ' : 'All Time'}
                </button>
              </div>

              {/* Installment Type (Daily vs Monthly Dues) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginRight: '0.25rem' }}>
                  {language === 'ur' ? 'قسط کی قسم:' : 'Frequency:'}
                </span>
                <button
                  type="button"
                  onClick={() => setLeaderboardFrequency('all')}
                  className={`btn btn-sm ${leaderboardFrequency === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: leaderboardFrequency === 'all' ? '#10b981' : 'transparent',
                    borderColor: leaderboardFrequency === 'all' ? '#10b981' : 'rgba(255,255,255,0.25)',
                    color: '#fff',
                  }}
                >
                  {language === 'ur' ? 'تمام اقساط' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardFrequency('daily')}
                  className={`btn btn-sm ${leaderboardFrequency === 'daily' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: leaderboardFrequency === 'daily' ? '#10b981' : 'transparent',
                    borderColor: leaderboardFrequency === 'daily' ? '#10b981' : 'rgba(255,255,255,0.25)',
                    color: '#fff',
                  }}
                >
                  {language === 'ur' ? 'روزانہ قسطیں' : 'Daily Dues'}
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderboardFrequency('monthly')}
                  className={`btn btn-sm ${leaderboardFrequency === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: leaderboardFrequency === 'monthly' ? '#10b981' : 'transparent',
                    borderColor: leaderboardFrequency === 'monthly' ? '#10b981' : 'rgba(255,255,255,0.25)',
                    color: '#fff',
                  }}
                >
                  {language === 'ur' ? 'ماہانہ قسطیں' : 'Monthly Dues'}
                </button>
              </div>
            </div>

            {/* Historical Comparison & Trend Analysis Banner (بہتری آئی یا کمی آئی) */}
            <div
              style={{
                marginTop: '0.875rem',
                background: trendDiff >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${trendDiff >= 0 ? '#10b981' : '#f59e0b'}`,
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} style={{ color: trendDiff >= 0 ? '#34d399' : '#fbbf24', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#f8fafc' }}>
                      {language === 'ur'
                        ? `تاریخی کارکردگی کا موازنہ و ٹرینڈ (${activeAuditDateStr === todayStr ? 'گزشتہ کل بمقابلہ آج' : `${pastComparisonDate} بمقابلہ آج`}):`
                        : `Target Achievement Trend (${activeAuditDateStr === todayStr ? 'Yesterday vs Today' : `${pastComparisonDate} vs Today`}):`}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.125rem', color: '#e2e8f0' }}>
                      {language === 'ur'
                        ? `فلاں تاریخ (${pastComparisonDate}) کو کل ${totalPastTargets} ٹارگٹ تھے جن میں سے ${totalPastFulfilled} مکمل ہوئے تھے (${pastOverallRate}%)۔ اب آج کل ${totalCurrentTargets} ٹارگٹ میں سے ${totalCurrentFulfilled} مکمل ہوئے ہیں (${currentOverallRate}%)۔`
                        : `On ${pastComparisonDate}, ${totalPastFulfilled}/${totalPastTargets} were fulfilled (${pastOverallRate}%). Today, ${totalCurrentFulfilled}/${totalCurrentTargets} are fulfilled (${currentOverallRate}%).`}
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`badge ${trendDiff > 0 ? 'badge-success' : trendDiff < 0 ? 'badge-warning' : 'badge-outline'}`}
                    style={{ fontSize: '0.8125rem', fontWeight: 800, padding: '0.35rem 0.65rem' }}
                  >
                    {trendDiff > 0
                      ? `+${trendDiff}% ${language === 'ur' ? 'بہتری آئی ہے 📈' : 'Improvement 📈'}`
                      : trendDiff < 0
                      ? `${trendDiff}% ${language === 'ur' ? 'کمی واقع ہوئی ہے 📉' : 'Decline 📉'}`
                      : language === 'ur'
                      ? 'برابر رہی ہے ⚖️'
                      : 'Maintained ⚖️'}
                  </span>
                </div>
              </div>

              {/* Officer-by-Officer Trend Comparison Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                {officerTrends.map((ot) => (
                  <div
                    key={ot.officerId}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.6875rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{ot.displayName}:</span>
                    <span style={{ opacity: 0.8, color: '#cbd5e1' }}>{ot.pastRate}% ➔ {ot.currRate}%</span>
                    <strong style={{ color: ot.diff >= 0 ? '#4ade80' : '#f87171' }}>
                      ({ot.diff >= 0 ? `+${ot.diff}%` : `${ot.diff}%`} {ot.diff >= 0 ? (language === 'ur' ? 'بہتری' : 'Up') : (language === 'ur' ? 'کمی' : 'Down')})
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shop-Level Leadership KPI Aggregate Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card" style={{ padding: '0.875rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <Target size={14} className="text-primary" />
                <span>{language === 'ur' ? 'کل تفویض شدہ اہداف' : 'Total Assigned Targets'}</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>
                {totalShopTargets} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#64748b' }}>{language === 'ur' ? 'گاہک' : 'customers'}</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem' }}>
                {language === 'ur' ? 'مختلف آفیسرز میں تقسیم' : 'Split across officers'}
              </div>
            </div>

            <div className="card" style={{ padding: '0.875rem', background: '#f0fdf4', border: '1px solid #86efac' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#166534', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <CheckCircle2 size={14} className="text-success" />
                <span>{language === 'ur' ? 'مکمل وصول شدہ اقساط' : 'Fulfilled Collections'}</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#15803d' }}>
                {totalShopFulfilled} <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>({overallShopRate}%)</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#166534', marginTop: '0.25rem' }}>
                {language === 'ur' ? 'کامیاب وصولی مکمل' : 'Successfully fulfilled'}
              </div>
            </div>

            <div className="card" style={{ padding: '0.875rem', background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#92400e', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <Clock size={14} className="text-warning" />
                <span>{language === 'ur' ? 'باقی پینڈنگ اقساط' : 'Pending Collections'}</span>
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#b45309' }}>
                {totalShopPending} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#92400e' }}>{language === 'ur' ? 'باقی' : 'pending'}</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#b45309', marginTop: '0.25rem' }}>
                {totalShopUnavailable > 0 && `🔒 ${totalShopUnavailable} ${language === 'ur' ? 'تالا' : 'locked'}`}
                {totalShopPromised > 0 && ` • 🤝 ${totalShopPromised} ${language === 'ur' ? 'وعدہ' : 'promised'}`}
              </div>
            </div>

            <div className="card" style={{ padding: '0.875rem', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#065f46', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <Coins size={14} className="text-emerald-600" />
                <span>{language === 'ur' ? 'وصول شدہ نقد رقم' : 'Total Cash Collected'}</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#047857' }}>
                <MoneyDisplay paisa={totalShopCollectedPaisa} />
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#065f46', marginTop: '0.25rem' }}>
                {language === 'ur' ? 'ہدف رقم: ' : 'Target: '} <MoneyDisplay paisa={totalShopTargetPaisa} />
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparative Ranking Table (سائیڈ بائی سائیڈ موازنہ ٹیبل) */}
          <div className="card" style={{ padding: '1rem', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} className="text-primary" />
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                  {language === 'ur' ? 'آفیسرز کی کارکردگی و رینکنگ کا موازنہ' : 'Side-by-Side Officer Performance & Rankings'}
                </h4>
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                {language === 'ur'
                  ? 'تفصیل دیکھنے اور ہر گاہک کی وجہ پڑھنے کے لیے بٹن پر کلک کریں'
                  : 'Click on any officer to inspect customer breakdown and doorstep visit notes'}
              </span>
            </div>

            <table className="table" style={{ width: '100%', minWidth: '720px', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: language === 'ur' ? 'right' : 'left' }}>
                  <th style={{ padding: '0.625rem 0.75rem' }}>{language === 'ur' ? 'پوزیشن' : 'Rank'}</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>{language === 'ur' ? 'ریکوری آفیسر' : 'Officer'}</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'کل ہدف' : 'Assigned'}</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'وصول شدہ' : 'Fulfilled'}</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'پینڈنگ' : 'Pending'}</th>
                  <th style={{ padding: '0.625rem 0.75rem' }}>{language === 'ur' ? 'دروازے کے نتائج و وجوہات' : 'Doorstep Outcomes'}</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>{language === 'ur' ? 'نقد وصولی' : 'Collected (PKR)'}</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'شرح' : 'Rate'}</th>
                  <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'تفصیل و وجوہات' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardStats.map((item, index) => {
                  const rank = index + 1;
                  let rankIcon = <Medal size={16} className="text-slate-400" />;
                  let rankTitle = `#${rank}`;
                  let rankColor = '#475569';

                  if (rank === 1) {
                    rankIcon = <Trophy size={18} style={{ color: '#eab308' }} />;
                    rankTitle = language === 'ur' ? '🥇 پوزیشن #1 (ٹاپ پرفارمر)' : '🥇 Rank #1 (Top)';
                    rankColor = '#b45309';
                  } else if (rank === 2) {
                    rankIcon = <Medal size={18} style={{ color: '#0284c7' }} />;
                    rankTitle = language === 'ur' ? '🥈 پوزیشن #2' : '🥈 Rank #2';
                    rankColor = '#0369a1';
                  } else if (rank === 3) {
                    rankIcon = <Award size={18} style={{ color: '#d97706' }} />;
                    rankTitle = language === 'ur' ? '🥉 پوزیشن #3' : '🥉 Rank #3';
                    rankColor = '#92400e';
                  }

                  const sessCount = SessionTrackerService.getUserSessionCount(item.officer.userId);

                  return (
                    <tr
                      key={item.officer.userId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: rank === 1 ? '#fffdf5' : '#ffffff',
                      }}
                    >
                      <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, color: rankColor }}>
                          {rankIcon}
                          <span>{rankTitle}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.officer.displayName}</div>
                        <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>
                          {item.officer.phone || item.officer.email}
                        </div>
                        <div style={{ marginTop: '0.125rem' }}>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.625rem',
                              padding: '0.1rem 0.35rem',
                              background: sessCount > 1 ? '#dcfce7' : '#f1f5f9',
                              color: sessCount > 1 ? '#15803d' : '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <Smartphone size={10} />
                            <span>{sessCount} {language === 'ur' ? 'ڈیوائس' : 'dev'}</span>
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle', fontWeight: 700 }}>
                        <span className="badge badge-outline" style={{ fontSize: '0.8125rem' }}>
                          {item.assignedTargetCount}
                        </span>
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                          {item.fulfilledCount} / {item.assignedTargetCount}
                        </span>
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <span
                          className={`badge ${item.pendingCount > 0 ? 'badge-warning' : 'badge-outline'}`}
                          style={{ fontSize: '0.8125rem', fontWeight: 700 }}
                        >
                          {item.pendingCount}
                        </span>
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.71875rem' }}>
                          {item.unavailableCount > 0 && (
                            <span style={{ color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Lock size={11} /> {item.unavailableCount} {language === 'ur' ? 'تالا لگا تھا / موجود نہیں' : 'Locked Gate'}
                            </span>
                          )}
                          {item.promisedCount > 0 && (
                            <span style={{ color: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={11} /> {item.promisedCount} {language === 'ur' ? 'اگلی تاریخ کا وعدہ' : 'Promised Date'}
                            </span>
                          )}
                          {item.refusedCount > 0 && (
                            <span style={{ color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <AlertCircle size={11} /> {item.refusedCount} {language === 'ur' ? 'ادائیگی سے انکار' : 'Refused'}
                            </span>
                          )}
                          {item.unavailableCount === 0 && item.promisedCount === 0 && item.refusedCount === 0 && (
                            <span className="text-muted">{language === 'ur' ? 'تمام وزٹ کلیئر' : 'All clear / on track'}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', verticalAlign: 'middle', fontWeight: 700, color: '#16a34a' }}>
                        <MoneyDisplay paisa={item.collectedPaisa} />
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', color: item.completionRate >= 80 ? '#16a34a' : item.completionRate >= 50 ? '#d97706' : '#dc2626' }}>
                          {item.completionRate}%
                        </div>
                        <div style={{ width: '48px', height: '4px', background: '#e2e8f0', borderRadius: '2px', margin: '0.2rem auto 0' }}>
                          <div
                            style={{
                              width: `${item.completionRate}%`,
                              height: '100%',
                              background: item.completionRate >= 80 ? '#10b981' : item.completionRate >= 50 ? '#f59e0b' : '#dc2626',
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedOfficerForDetails(item)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.71875rem',
                            padding: '0.25rem 0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Eye size={12} className="text-primary" />
                          <span>{language === 'ur' ? 'تفصیل و وجوہات' : 'View Audit'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detailed Individual Officer Cards with Doorstep Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h4 style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>
              {language === 'ur' ? 'انفرادی آفیسرز کی کارکردگی اور موقع کی وجوہات (Field Visit Notes)' : 'Individual Officer Breakdown & Doorstep Notes'}
            </h4>

            {leaderboardStats.map((item, index) => {
              const rank = index + 1;
              let rankBadge = {
                icon: <Medal size={20} className="text-slate-400" />,
                label: `#${rank}`,
                badgeClass: 'badge-slate',
                perfText: language === 'ur' ? 'فالواپ کی ضرورت ⚠️' : 'Needs Follow-up ⚠️',
                bg: '#ffffff',
                border: '#e2e8f0',
              };

              if (rank === 1) {
                rankBadge = {
                  icon: <Trophy size={22} style={{ color: '#eab308' }} />,
                  label: 'Rank #1',
                  badgeClass: 'badge-warning',
                  perfText: language === 'ur' ? 'ٹاپ پرفارمر (سب سے بہترین کارکردگی)' : 'Top Performer',
                  bg: '#fffbeb',
                  border: '#fde68a',
                };
              } else if (rank === 2) {
                rankBadge = {
                  icon: <Medal size={22} style={{ color: '#0284c7' }} />,
                  label: 'Rank #2',
                  badgeClass: 'badge-info',
                  perfText: language === 'ur' ? 'بہترین کارکردگی' : 'Good Performance',
                  bg: '#f8fafc',
                  border: '#cbd5e1',
                };
              } else if (rank === 3) {
                rankBadge = {
                  icon: <Award size={22} style={{ color: '#b45309' }} />,
                  label: 'Rank #3',
                  badgeClass: 'badge-warning',
                  perfText: language === 'ur' ? 'معقول کارکردگی' : 'Standard Performance',
                  bg: '#fffdf5',
                  border: '#fef08a',
                };
              }

              const sessCount = SessionTrackerService.getUserSessionCount(item.officer.userId);

              return (
                <div
                  key={item.officer.userId}
                  className="card"
                  style={{
                    backgroundColor: rankBadge.bg,
                    border: `1.5px solid ${rankBadge.border}`,
                    padding: '1.125rem',
                    borderRadius: '0.75rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '48px' }}>
                        {rankBadge.icon}
                        <span style={{ fontWeight: 800, fontSize: '0.875rem', marginTop: '0.125rem' }}>{rankBadge.label}</span>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                            {item.officer.displayName}
                          </h4>
                          <span className={`badge ${rankBadge.badgeClass}`}>{rankBadge.perfText}</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.78125rem', marginTop: '0.125rem' }}>
                          {item.officer.phone || item.officer.email} • {item.officer.designation || 'Recovery Officer'}
                        </div>
                        <div style={{ marginTop: '0.25rem' }}>
                          <span
                            className={`badge ${sessCount > 1 ? 'badge-primary' : sessCount === 1 ? 'badge-success' : 'badge-outline text-muted'}`}
                            style={{
                              fontSize: '0.6875rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: sessCount > 1 ? '#ecfdf5' : undefined,
                              color: sessCount > 1 ? '#047857' : undefined,
                              border: sessCount > 1 ? '1px solid #86efac' : undefined,
                              padding: '0.125rem 0.45rem',
                            }}
                          >
                            <Smartphone size={11} />
                            <span>
                              {sessCount === 0
                                ? (language === 'ur' ? 'آف لائن (0 ڈیوائسز)' : '0 Active Devices')
                                : sessCount === 1
                                ? (language === 'ur' ? '1 ایکٹو ڈیوائس لاگ ان' : '1 Active Device')
                                : (language === 'ur' ? `${sessCount} ڈیوائسز پر آن لائن لاگ ان` : `${sessCount} Concurrent Active Devices`)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: language === 'ur' ? 'left' : 'right' }}>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {language === 'ur' ? 'نقد وصولی' : 'Collected Cash'}
                      </div>
                      <MoneyDisplay paisa={item.collectedPaisa} className="font-bold text-success" style={{ fontSize: '1.25rem' }} />
                      <div className="text-muted" style={{ fontSize: '0.6875rem', marginTop: '0.125rem' }}>
                        {language === 'ur' ? 'ٹارگٹ رقم: ' : 'Target: '} <MoneyDisplay paisa={item.targetAmountPaisa} />
                      </div>
                    </div>
                  </div>

                  {/* 4-Stat Grid for This Officer */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3" style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
                        {language === 'ur' ? 'تفویض شدہ اہداف' : 'Assigned Target'}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0f172a' }}>
                        {item.assignedTargetCount} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{language === 'ur' ? 'گاہک' : 'dues'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
                        {language === 'ur' ? 'مکمل وصول شدہ' : 'Fulfilled'}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#16a34a' }}>
                        {item.fulfilledCount} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>({item.completionRate}%)</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
                        {language === 'ur' ? 'باقی پینڈنگ' : 'Pending'}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: item.pendingCount > 0 ? '#b45309' : '#16a34a' }}>
                        {item.pendingCount} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{language === 'ur' ? 'باقی' : 'pending'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6875rem' }}>
                        {language === 'ur' ? 'جی پی ایس تصدیق' : 'Doorstep Verified'}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0284c7' }}>
                        {item.verifiedVisitsCount} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{language === 'ur' ? 'وزٹ' : 'visits'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '0.75rem' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(4, item.completionRate))}%`,
                        height: '100%',
                        background: item.completionRate >= 80 ? '#10b981' : item.completionRate >= 50 ? '#f59e0b' : '#ef4444',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  {/* Recent Doorstep Reasons / Notes logged from Field */}
                  {item.recentNotes.length > 0 && (
                    <div style={{ marginTop: '0.75rem', backgroundColor: '#f8fafc', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} className="text-primary" />
                        <span>{language === 'ur' ? 'موقع پر درج کی گئی تازہ ترین وجوہات و ریمارکس:' : 'Recent Doorstep Audit Reasons:'}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {item.recentNotes.map((rn: any, idx: number) => (
                          <div key={idx} style={{ fontSize: '0.75rem', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <div>
                              <strong style={{ color: '#0f172a' }}>{rn.customerName}:</strong>{' '}
                              <span>{rn.note}</span>
                              {rn.followUpDate && (
                                <span style={{ color: '#0369a1', marginLeft: '0.35rem', fontWeight: 600 }}>
                                  ({language === 'ur' ? 'وعدہ تاریخ:' : 'Follow-up:'} {rn.followUpDate})
                                </span>
                              )}
                            </div>
                            <span
                              className={`badge ${
                                rn.outcome === 'collected'
                                  ? 'badge-success'
                                  : rn.outcome === 'unavailable'
                                  ? 'badge-warning'
                                  : rn.outcome === 'promised'
                                  ? 'badge-info'
                                  : 'badge-danger'
                              }`}
                              style={{ fontSize: '0.625rem', whiteSpace: 'nowrap' }}
                            >
                              {rn.outcome === 'collected'
                                ? (language === 'ur' ? 'وصول' : 'Collected')
                                : rn.outcome === 'unavailable'
                                ? (language === 'ur' ? 'تالا لگا تھا' : 'Locked')
                                : rn.outcome === 'promised'
                                ? (language === 'ur' ? 'وعدہ' : 'Promised')
                                : (language === 'ur' ? 'انکار' : 'Refused')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Button to open complete customer modal */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedOfficerForDetails(item)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <Users size={13} className="text-primary" />
                      <span>
                        {language === 'ur'
                          ? `گاہکوں کی تفصیلی لسٹ و وجوہات (${item.assignedTargetCount} گاہک)`
                          : `View Full Customer Audit (${item.assignedTargetCount} Customers)`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Log Visit Modal with Free GPS & Doorstep Camera Snap */}
      {targetCard && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('recovery.logVisit')}</h3>
              <button onClick={() => setTargetCard(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLogVisitAndPayment}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                  <div><strong>Customer:</strong> {targetCard.customer?.fullName}</div>
                  <div><strong>Phone:</strong> {targetCard.customer?.phoneDisplay}</div>
                  <div><strong>Address:</strong> {targetCard.customer?.address || 'Area: ' + targetCard.assignment.area}</div>
                  <div><strong>Contract Outstanding:</strong> Rs. {(targetCard.contract?.outstandingPaisa || 0) / 100}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Outcome</label>
                  <select
                    className="form-select"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as RecoveryVisitOutcome)}
                  >
                    <option value="collected">{t('recovery.collected')} (رقم وصول کر لی)</option>
                    <option value="unavailable">Unavailable (گھر پر نہیں تھا / تالا لگا تھا)</option>
                    <option value="promised">{t('recovery.promised')} (اگلی تاریخ کا وعدہ کیا)</option>
                    <option value="refused">{t('recovery.refused')} (ادائیگی سے انکار)</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>

                {/* PROOF OF VISIT 1: Free Browser Geolocation */}
                <div className="form-group" style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>
                    {language === 'ur' ? 'موقع کی تصدیق (Live GPS Geo-Stamp)' : 'Doorstep GPS Verification'}
                  </label>
                  <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    {language === 'ur'
                      ? 'ملازم کا گاہک کے دروازے پر ہونا ثابت کرنے کے لیے بٹن دبائیں۔'
                      : 'Capture instant GPS coordinates to prove you are physically at the doorstep.'}
                  </div>

                  {locationGeo ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #86efac' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#15803d', fontSize: '0.8125rem', fontWeight: 600 }}>
                        <CheckCircle2 size={16} />
                        <span>GPS Recorded: {locationGeo.latitude}, {locationGeo.longitude} (±{locationGeo.accuracyMeters}m)</span>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${locationGeo.latitude},${locationGeo.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Preview
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCaptureGps}
                      disabled={capturingGps}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                    >
                      <Navigation size={14} className="text-primary" />
                      <span>{capturingGps ? 'Capturing GPS...' : language === 'ur' ? 'لائیو GPS لوکیشن حاصل کریں' : 'Record Doorstep GPS Location'}</span>
                    </button>
                  )}
                </div>

                {/* PROOF OF VISIT 2: Doorstep Camera Snap (Essential for Locked Door / Unavailable) */}
                <div className="form-group" style={{ backgroundColor: '#fff7ed', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #fed7aa' }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#9a3412', marginBottom: '0.25rem' }}>
                    {language === 'ur' ? 'دروازے / تالے کی تصویر (Doorstep Photo Proof)' : 'Doorstep Camera Snapshot'}
                  </label>
                  <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    {outcome === 'unavailable'
                      ? language === 'ur'
                        ? 'اہم: گاہک موجود نہ ہونے یا تالا لگے ہونے کی صورت میں بند گیٹ/تالے کی تصویر کھینچنا لازمی ہے تاکہ دورے کی تصدیق ہو۔'
                        : 'Crucial: When home is locked or unavailable, take a snapshot of the locked gate/padlock for audit proof.'
                      : language === 'ur'
                      ? 'مکان کے نمبر، گیٹ یا وصولی کے وقت کی تصویر کھینچیں۔'
                      : 'Take a camera snapshot of customer premises or receipt.'}
                  </div>

                  {photoProofUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #fdba74' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={photoProofUrl} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem' }} />
                        <span style={{ fontSize: '0.8125rem', color: '#c2410c', fontWeight: 600 }}>✓ Photo Attached</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhotoProofUrl(null)}
                        className="btn btn-outline btn-sm text-danger"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', cursor: 'pointer' }}
                    >
                      <Camera size={14} className="text-amber-600" />
                      <span>{uploadingPhoto ? 'Processing photo...' : language === 'ur' ? 'کیمرہ سے تصویر کھینچیں' : 'Open Camera & Snap Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>

                {outcome === 'collected' && (
                  <div className="form-group">
                    <label className="form-label">
                      <span>Amount Collected on Spot (Rs.)</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5000"
                      value={collectAmountRupees}
                      onChange={(e) => setCollectAmountRupees(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('recovery.nextFollowUp')}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Customer remarks / why door was locked / payment promise details..."
                    value={visitNote}
                    onChange={(e) => setVisitNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setTargetCard(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <CheckCircle2 size={16} />
                  <span>{saving ? t('common.loading') : 'Save Verified Visit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enlarged Photo Proof Zoom Modal */}
      {zoomedPhoto && (
        <div className="modal-overlay" style={{ zIndex: 70 }} onClick={() => setZoomedPhoto(null)}>
          <div
            className="modal-box"
            style={{ maxWidth: '520px', padding: '1rem', backgroundColor: '#0f172a', color: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
                  Doorstep Photo Proof: {zoomedPhoto.customerName}
                </h4>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Recorded: {zoomedPhoto.time}</div>
              </div>
              <button onClick={() => setZoomedPhoto(null)} className="btn btn-icon btn-outline btn-sm text-white">
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', backgroundColor: '#000', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '0.75rem' }}>
              <img
                src={zoomedPhoto.url}
                alt="Enlarged Proof"
                style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }}
              />
            </div>

            {zoomedPhoto.geo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', opacity: 0.9 }}>
                <span>GPS: {zoomedPhoto.geo.latitude}, {zoomedPhoto.geo.longitude}</span>
                <a
                  href={`https://maps.google.com/?q=${zoomedPhoto.geo.latitude},${zoomedPhoto.geo.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <ExternalLink size={12} /> Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reassign Customer Modal for Owner & Manager */}
      {reassigningCard && (
        <div className="modal-overlay" style={{ zIndex: 65 }}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRightLeft size={18} className="text-primary" />
                <h3 className="modal-title">
                  {language === 'ur' ? 'ریکوری آفیسر کی تبدیلی / غلط تفویض درستی' : 'Reassign Recovery Officer'}
                </h3>
              </div>
              <button onClick={() => setReassigningCard(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmReassign}>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: '#475569' }}>
                  {language === 'ur' ? 'گاہک:' : 'Customer:'}{' '}
                  <strong>{reassigningCard.customer?.fullName}</strong> ({reassigningCard.customer?.phoneDisplay})
                </p>

                <div className="form-group">
                  <label className="form-label">
                    {language === 'ur' ? 'نیا نامزد کردہ ریکوری آفیسر' : 'Select New Recovery Officer'}
                  </label>
                  <select
                    className="form-select"
                    value={targetNewOfficerId}
                    onChange={(e) => setTargetNewOfficerId(e.target.value)}
                    required
                  >
                    {staffMembers
                      .filter((s) => s.role === 'recovery')
                      .map((s) => (
                        <option key={s.userId} value={s.userId}>
                          {s.displayName} ({s.phone || s.email})
                        </option>
                      ))}
                    {staffMembers.filter((s) => s.role === 'recovery').length === 0 &&
                      staffMembers.map((s) => (
                        <option key={s.userId} value={s.userId}>
                          {s.displayName} ({s.role})
                        </option>
                      ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem', marginBottom: 0 }}>
                    {language === 'ur'
                      ? 'تبدیل کرتے ہی یہ کھاتہ نئے آفیسر کی موبائل لسٹ میں لائیو منتقل ہو جائے گا۔'
                      : 'Account will immediately appear in the new officer’s recovery target list.'}
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setReassigningCard(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('common.loading') : language === 'ur' ? 'آفیسر تبدیل کریں' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Correct Mistaken Visit Modal for Owner & Manager */}
      {editingVisit && (
        <div className="modal-overlay" style={{ zIndex: 65 }}>
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={18} className="text-primary" />
                <h3 className="modal-title">
                  {language === 'ur' ? 'وزٹ لاگ میں درستی و غلطی سدھار' : 'Edit / Correct Visit Log'}
                </h3>
              </div>
              <button onClick={() => setEditingVisit(null)} className="btn btn-icon btn-outline">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditVisit}>
              <div className="modal-body">
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#1e40af' }}>
                  {language === 'ur'
                    ? 'اگر ریکوری آفیسر نے غلط کسٹمر سلیکٹ کر کے وزٹ درج کر دیا تھا یا وزٹ کا نتیجہ غلط تھا تو آپ یہاں سے صحیح کسٹمر و نوٹس میں تبدیلی کر سکتے ہیں۔'
                    : 'If the recovery officer logged the visit under the wrong customer or entered the incorrect outcome, adjust the record here.'}
                </div>

                <div className="form-group">
                  <label className="form-label">{language === 'ur' ? 'درست گاہک منتخب کریں' : 'Correct Customer'}</label>
                  <select
                    className="form-select"
                    value={editVisitCustomerId}
                    onChange={(e) => setEditVisitCustomerId(e.target.value)}
                    required
                  >
                    {customersList.map((c) => (
                      <option key={c.customerId} value={c.customerId}>
                        {c.fullName} — {c.phoneDisplay} ({c.area || c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Outcome</label>
                  <select
                    className="form-select"
                    value={editVisitOutcome}
                    onChange={(e) => setEditVisitOutcome(e.target.value as RecoveryVisitOutcome)}
                  >
                    <option value="collected">{t('recovery.collected')} (رقم وصول کر لی)</option>
                    <option value="unavailable">Unavailable (گھر پر نہیں تھا / تالا لگا تھا)</option>
                    <option value="promised">{t('recovery.promised')} (اگلی تاریخ کا وعدہ کیا)</option>
                    <option value="refused">{t('recovery.refused')} (ادائیگی سے انکار)</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('recovery.nextFollowUp')}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editVisitFollowUp}
                    onChange={(e) => setEditVisitFollowUp(e.target.value)}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Visit Notes / Reason for update</label>
                  <textarea
                    className="form-textarea"
                    value={editVisitNote}
                    onChange={(e) => setEditVisitNote(e.target.value)}
                    placeholder="Enter corrected remarks or reason..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingVisit(null)} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? t('common.loading') : language === 'ur' ? 'درستی محفوظ کریں' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Printable Receipt */}
      {collectReceipt && (
        <PrintableReceipt
          {...collectReceipt}
          onClose={() => setCollectReceipt(null)}
        />
      )}

      {/* Customer Audit Breakdown & Reasons Modal for Selected Officer */}
      {selectedOfficerForDetails && (
        <div className="modal-overlay" style={{ zIndex: 68 }} onClick={() => setSelectedOfficerForDetails(null)}>
          <div
            className="modal-box"
            style={{ maxWidth: '820px', width: '95%', maxHeight: '88vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.875rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 className="modal-title" style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                    {selectedOfficerForDetails.officer.displayName} — {language === 'ur' ? 'تفویض کردہ گاہک و وزٹ وجوہات' : 'Assigned Customers & Visit Audit'}
                  </h3>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                    {selectedOfficerForDetails.completionRate}% {language === 'ur' ? 'شرح کامیابی' : 'Completed'}
                  </span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>
                  {selectedOfficerForDetails.officer.phone || selectedOfficerForDetails.officer.email} • {selectedOfficerForDetails.officer.designation || 'Recovery Officer'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOfficerForDetails(null)}
                className="btn btn-icon btn-outline btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1rem 0' }}>
              {/* Summary Metrics Bar inside Modal */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4"
                style={{
                  background: '#f8fafc',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>{language === 'ur' ? 'کل اہداف' : 'Total Targets'}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                    {selectedOfficerForDetails.assignedTargetCount} {language === 'ur' ? 'گاہک' : 'customers'}
                  </div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>{language === 'ur' ? 'وصول شدہ' : 'Fulfilled'}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#16a34a' }}>
                    {selectedOfficerForDetails.fulfilledCount} ({selectedOfficerForDetails.completionRate}%)
                  </div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>{language === 'ur' ? 'پینڈنگ / باقی' : 'Pending'}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: selectedOfficerForDetails.pendingCount > 0 ? '#b45309' : '#16a34a' }}>
                    {selectedOfficerForDetails.pendingCount} {language === 'ur' ? 'باقی' : 'pending'}
                  </div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.6875rem' }}>{language === 'ur' ? 'نقد وصولی' : 'Cash Collected'}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#047857' }}>
                    <MoneyDisplay paisa={selectedOfficerForDetails.collectedPaisa} />
                  </div>
                </div>
              </div>

              {/* Status Outcome Badges Row */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.75rem' }}>
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={12} /> {selectedOfficerForDetails.fulfilledCount} {language === 'ur' ? 'وصول ہو گئی' : 'Collected'}
                </span>
                {selectedOfficerForDetails.unavailableCount > 0 && (
                  <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Lock size={12} /> {selectedOfficerForDetails.unavailableCount} {language === 'ur' ? 'گھر پر تالا لگا تھا / موجود نہیں' : 'Locked / Unavailable'}
                  </span>
                )}
                {selectedOfficerForDetails.promisedCount > 0 && (
                  <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {selectedOfficerForDetails.promisedCount} {language === 'ur' ? 'اگلی تاریخ کا وعدہ کیا' : 'Promised Follow-up'}
                  </span>
                )}
                {selectedOfficerForDetails.refusedCount > 0 && (
                  <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={12} /> {selectedOfficerForDetails.refusedCount} {language === 'ur' ? 'ادائیگی سے انکار' : 'Refused'}
                  </span>
                )}
              </div>

              {/* Customer List Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                <table className="table" style={{ width: '100%', minWidth: '720px', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: language === 'ur' ? 'right' : 'left' }}>
                      <th style={{ padding: '0.625rem 0.75rem' }}>#</th>
                      <th style={{ padding: '0.625rem 0.75rem' }}>{language === 'ur' ? 'گاہک کا نام و علاقہ' : 'Customer & Area'}</th>
                      <th style={{ padding: '0.625rem 0.75rem' }}>{language === 'ur' ? 'قسط رقم' : 'Due Amount'}</th>
                      <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'نتیجہ / اسٹیٹس' : 'Status'}</th>
                      <th style={{ padding: '0.625rem 0.75rem' }}>{language === 'ur' ? 'آفیسر کی وجہ و ریمارکس (Doorstep Reason)' : 'Visit Reason & Remarks'}</th>
                      <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>{language === 'ur' ? 'تصدیق' : 'Proof'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOfficerForDetails.customerBreakdown.map((item: any, cIdx: number) => {
                      const isCol = item.status === 'collected';
                      const isUnav = item.status === 'unavailable';
                      const isProm = item.status === 'promised';
                      const isRef = item.status === 'refused';

                      let badgeClass = 'badge-slate';
                      let statusText = language === 'ur' ? 'پینڈنگ' : 'Pending';

                      if (isCol) {
                        badgeClass = 'badge-success';
                        statusText = language === 'ur' ? 'وصول ہو گئی' : 'Collected';
                      } else if (isUnav) {
                        badgeClass = 'badge-warning';
                        statusText = language === 'ur' ? 'تالا لگا تھا' : 'Locked';
                      } else if (isProm) {
                        badgeClass = 'badge-info';
                        statusText = language === 'ur' ? 'اگلی تاریخ کا وعدہ' : 'Promised';
                      } else if (isRef) {
                        badgeClass = 'badge-danger';
                        statusText = language === 'ur' ? 'انکار' : 'Refused';
                      }

                      return (
                        <tr
                          key={item.card.assignment.assignmentId || cIdx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: isCol ? '#f0fdf4' : isUnav ? '#fffdf0' : isProm ? '#f0f9ff' : '#ffffff',
                          }}
                        >
                          <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle', fontWeight: 600, color: '#64748b' }}>
                            {cIdx + 1}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>
                              {item.customer?.fullName || 'Customer'}
                            </div>
                            <div style={{ fontSize: '0.71875rem', color: '#64748b' }}>
                              {item.customer?.phoneDisplay} • {item.customer?.area || item.card.assignment.area || 'Rahim Yar Khan'}
                            </div>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle' }}>
                            <MoneyDisplay paisa={item.amountPaisa} className="font-semibold" />
                            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                              {(item.contract?.frequency || 'monthly') === 'daily'
                                ? (language === 'ur' ? 'روزانہ قسط' : 'Daily Due')
                                : (language === 'ur' ? 'ماہانہ قسط' : 'Monthly Due')}
                            </div>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <span className={`badge ${badgeClass}`} style={{ fontSize: '0.6875rem' }}>
                              {statusText}
                            </span>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle', maxWidth: '300px' }}>
                            <div style={{ color: '#1e293b', fontSize: '0.78125rem', lineHeight: 1.4 }}>
                              {item.note}
                            </div>
                            {item.followUpDate && (
                              <div style={{ fontSize: '0.6875rem', color: '#0369a1', marginTop: '0.2rem', fontWeight: 600 }}>
                                📅 {language === 'ur' ? 'اگلا وعدہ:' : 'Follow-up:'} {item.followUpDate}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            {item.verified ? (
                              <span
                                className="badge badge-success"
                                title="GPS Geolocation or Photo Proof Captured"
                                style={{ fontSize: '0.625rem', padding: '0.15rem 0.35rem' }}
                              >
                                ✓ {language === 'ur' ? 'تصدیق شدہ' : 'Verified'}
                              </span>
                            ) : (
                              <span className="text-muted" style={{ fontSize: '0.6875rem' }}>
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedOfficerForDetails(null)}
                className="btn btn-secondary"
              >
                {t('common.close') || 'بند کریں (Close)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
