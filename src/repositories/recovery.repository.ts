// ============================================================================
// Repository: Field Recovery Assignments & Visit Logs
// Scoped to /tenants/{tenantId}/recoveryAssignments & recoveryVisits
// ============================================================================

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/app';
import { RecoveryAssignment, RecoveryVisit, RecoveryVisitOutcome } from '@/types';

const DEMO_ASSIGNMENTS_KEY = 'qistflow_demo_assignments';
const DEMO_VISITS_KEY = 'qistflow_demo_visits';

export const RecoveryRepository = {
  async getAssignments(tenantId: string, employeeId?: string, isDemo = false): Promise<RecoveryAssignment[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_ASSIGNMENTS_KEY}_${tenantId}`);
      if (stored) {
        const all: RecoveryAssignment[] = JSON.parse(stored);
        if (tenantId === 'tenant-demo-ryk-01' && all.length < 15) {
          // Upgrade reference demo shop to 25 assignments across 3 recovery officers
        } else {
          return employeeId ? all.filter((a) => a.employeeId === employeeId) : all;
        }
      }

      // Only seed initial demo assignments for the reference demo shop 'tenant-demo-ryk-01' (or test runners)
      if (tenantId !== 'tenant-demo-ryk-01' && !tenantId.includes('test')) {
        localStorage.setItem(`${DEMO_ASSIGNMENTS_KEY}_${tenantId}`, JSON.stringify([]));
        return [];
      }

      const initialAssignments: RecoveryAssignment[] = [
        // Officer 1: Kamran Akram (demo-recovery-101) - Target: 10 Customers / Installments
        { assignmentId: 'asg-01', tenantId, customerId: 'cus-ryk-001', contractId: 'ctr-ryk-1001', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Gulshan-e-Usman' },
        { assignmentId: 'asg-02', tenantId, customerId: 'cus-ryk-002', contractId: 'ctr-ryk-1002', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Model Town' },
        { assignmentId: 'asg-03', tenantId, customerId: 'cus-ryk-003', contractId: 'ctr-ryk-1003', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Chowk Bahadurpur' },
        { assignmentId: 'asg-04', tenantId, customerId: 'cus-ryk-004', contractId: 'ctr-ryk-1004', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Satellite Town' },
        { assignmentId: 'asg-05', tenantId, customerId: 'cus-ryk-005', contractId: 'ctr-ryk-1005', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Factory Area' },
        { assignmentId: 'asg-06', tenantId, customerId: 'cus-ryk-006', contractId: 'ctr-ryk-1006', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Abbasia Town' },
        { assignmentId: 'asg-07', tenantId, customerId: 'cus-ryk-007', contractId: 'ctr-ryk-1007', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Gulberg Colony' },
        { assignmentId: 'asg-08', tenantId, customerId: 'cus-ryk-008', contractId: 'ctr-ryk-1008', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Shahi Road' },
        { assignmentId: 'asg-09', tenantId, customerId: 'cus-ryk-009', contractId: 'ctr-ryk-1009', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Trust Colony' },
        { assignmentId: 'asg-10', tenantId, customerId: 'cus-ryk-010', contractId: 'ctr-ryk-1010', employeeId: 'demo-recovery-101', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Iqbal Nagar' },

        // Officer 2: Ali Raza (demo-recovery-102) - Target: 8 Customers / Installments
        { assignmentId: 'asg-11', tenantId, customerId: 'cus-ryk-011', contractId: 'ctr-ryk-1011', employeeId: 'demo-recovery-102', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Canal Park' },
        { assignmentId: 'asg-12', tenantId, customerId: 'cus-ryk-012', contractId: 'ctr-ryk-1012', employeeId: 'demo-recovery-102', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Khawaja Fareed' },
        { assignmentId: 'asg-13', tenantId, customerId: 'cus-ryk-013', contractId: 'ctr-ryk-1013', employeeId: 'demo-recovery-102', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Circular Road' },
        { assignmentId: 'asg-14', tenantId, customerId: 'cus-ryk-014', contractId: 'ctr-ryk-1014', employeeId: 'demo-recovery-102', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Jinnah Hall' },
        { assignmentId: 'asg-15', tenantId, customerId: 'cus-ryk-015', contractId: 'ctr-ryk-1015', employeeId: 'demo-recovery-102', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Officers Colony' },
        { assignmentId: 'asg-16', tenantId, customerId: 'cus-ryk-016', contractId: 'ctr-ryk-1016', employeeId: 'demo-recovery-102', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Railway Road' },
        { assignmentId: 'asg-17', tenantId, customerId: 'cus-ryk-017', contractId: 'ctr-ryk-1017', employeeId: 'demo-recovery-102', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'General Bus Stand' },
        { assignmentId: 'asg-18', tenantId, customerId: 'cus-ryk-018', contractId: 'ctr-ryk-1018', employeeId: 'demo-recovery-102', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Purani Chungi' },

        // Officer 3: Tariq Mehmood (demo-recovery-103) - Target: 7 Customers / Installments
        { assignmentId: 'asg-19', tenantId, customerId: 'cus-ryk-019', contractId: 'ctr-ryk-1019', employeeId: 'demo-recovery-103', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Thali Road' },
        { assignmentId: 'asg-20', tenantId, customerId: 'cus-ryk-020', contractId: 'ctr-ryk-1020', employeeId: 'demo-recovery-103', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Bano Bazaar' },
        { assignmentId: 'asg-21', tenantId, customerId: 'cus-ryk-021', contractId: 'ctr-ryk-1021', employeeId: 'demo-recovery-103', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Civil Lines' },
        { assignmentId: 'asg-22', tenantId, customerId: 'cus-ryk-022', contractId: 'ctr-ryk-1022', employeeId: 'demo-recovery-103', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Stadium Road' },
        { assignmentId: 'asg-23', tenantId, customerId: 'cus-ryk-023', contractId: 'ctr-ryk-1023', employeeId: 'demo-recovery-103', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Tariqabad' },
        { assignmentId: 'asg-24', tenantId, customerId: 'cus-ryk-024', contractId: 'ctr-ryk-1024', employeeId: 'demo-recovery-103', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Dharanwala Mor' },
        { assignmentId: 'asg-25', tenantId, customerId: 'cus-ryk-025', contractId: 'ctr-ryk-1025', employeeId: 'demo-recovery-103', assignedAt: new Date().toISOString() as any, assignedBy: 'owner', status: 'active', area: 'Main Highway' },
      ];
      localStorage.setItem(`${DEMO_ASSIGNMENTS_KEY}_${tenantId}`, JSON.stringify(initialAssignments));
      return employeeId ? initialAssignments.filter((a) => a.employeeId === employeeId) : initialAssignments;
    }

    const colRef = collection(db, 'tenants', tenantId, 'recoveryAssignments');
    const snap = await getDocs(colRef);
    const matches = snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as RecoveryAssignment));
    return employeeId ? matches.filter((a) => a.employeeId === employeeId) : matches;
  },

  async getVisits(tenantId: string, isDemo = false): Promise<RecoveryVisit[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_VISITS_KEY}_${tenantId}`);
      if (stored) {
        const parsed: RecoveryVisit[] = JSON.parse(stored);
        if (tenantId === 'tenant-demo-ryk-01' && parsed.length < 35) {
          // Upgrade reference demo shop to full multi-officer visit records including historical comparison dates
        } else {
          return parsed;
        }
      }

      // Only seed initial demo visits for the reference demo shop 'tenant-demo-ryk-01' (or test runners)
      if (tenantId !== 'tenant-demo-ryk-01' && !tenantId.includes('test')) {
        localStorage.setItem(`${DEMO_VISITS_KEY}_${tenantId}`, JSON.stringify([]));
        return [];
      }

      // Preload verified demo visits for all 3 recovery officers with realistic outcomes and reasons
      const initialVisits: RecoveryVisit[] = [
        // Officer 1: Kamran Akram (demo-recovery-101) - 10 Target: 8 Collected, 1 Unavailable, 1 Promised
        {
          visitId: 'vst-demo-101-1',
          tenantId,
          assignmentId: 'asg-01',
          customerId: 'cus-ryk-001',
          contractId: 'ctr-ryk-1001',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 3600000 * 4).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 600000,
          note: 'گاہک نے گھر پر نقد قسط ادا کی، رسید جاری کر دی گئی۔',
          locationGeo: { latitude: 28.4212, longitude: 70.3134, accuracyMeters: 12, capturedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-101-2',
          tenantId,
          assignmentId: 'asg-02',
          customerId: 'cus-ryk-002',
          contractId: 'ctr-ryk-1002',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 3600000 * 3).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 1200000,
          note: 'ماہانہ قسط وصول، گاہک مطمئن ہے۔',
          locationGeo: { latitude: 28.6489, longitude: 70.6598, accuracyMeters: 15, capturedAt: new Date(Date.now() - 3600000 * 3).toISOString() },
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-101-3',
          tenantId,
          assignmentId: 'asg-03',
          customerId: 'cus-ryk-003',
          contractId: 'ctr-ryk-1003',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 3600000 * 2).toISOString() as any,
          outcome: 'unavailable',
          note: 'مین گیٹ پر تالا لگا تھا۔ پڑوسی نے بتایا فیملی شادی کے سلسلے میں پیر تک کراچی گئی ہوئی ہے۔',
          nextFollowUpAt: '2026-11-24',
          locationGeo: { latitude: 28.4195, longitude: 70.3098, accuracyMeters: 18, capturedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-101-4',
          tenantId,
          assignmentId: 'asg-04',
          customerId: 'cus-ryk-004',
          contractId: 'ctr-ryk-1004',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 3600000 * 2).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 500000,
          note: 'سیٹلائٹ ٹاؤن وزٹ، نقد قسط وصول۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-101-5',
          tenantId,
          assignmentId: 'asg-05',
          customerId: 'cus-ryk-005',
          contractId: 'ctr-ryk-1005',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 3600000 * 1).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 800000,
          note: 'فیکٹری ایریا، بقایا قسط وصول۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-101-6',
          tenantId,
          assignmentId: 'asg-06',
          customerId: 'cus-ryk-006',
          contractId: 'ctr-ryk-1006',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date().toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 60000, // Rs. 600 daily
          note: 'روزانہ کی قسط وصول کی (Daily collection).',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-101-7',
          tenantId,
          assignmentId: 'asg-07',
          customerId: 'cus-ryk-007',
          contractId: 'ctr-ryk-1007',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date().toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 50000, // Rs. 500 daily
          note: 'روزانہ قسط کلیکشن۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-101-8',
          tenantId,
          assignmentId: 'asg-08',
          customerId: 'cus-ryk-008',
          contractId: 'ctr-ryk-1008',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date().toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 700000,
          note: 'شاہی روڈ دکان سے قسط وصول۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-101-9',
          tenantId,
          assignmentId: 'asg-09',
          customerId: 'cus-ryk-009',
          contractId: 'ctr-ryk-1009',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date().toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 80000, // Rs. 800 daily
          note: 'روزانہ قسط نقد موصول۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-101-10',
          tenantId,
          assignmentId: 'asg-10',
          customerId: 'cus-ryk-010',
          contractId: 'ctr-ryk-1010',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date().toISOString() as any,
          outcome: 'promised',
          note: 'گاہک کی تنخواہ 25 تاریخ کو آنی ہے، انہوں نے 25 تاریخ کو مکمل قسط ادا کرنے کا پکا وعدہ کیا ہے۔',
          nextFollowUpAt: '2026-11-25',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-101',
        },

        // Officer 2: Ali Raza (demo-recovery-102) - 8 Target: 6 Collected, 1 Unavailable, 1 Pending
        {
          visitId: 'vst-demo-102-1',
          tenantId,
          assignmentId: 'asg-11',
          customerId: 'cus-ryk-011',
          contractId: 'ctr-ryk-1011',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date(Date.now() - 3600000 * 5).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 500000,
          note: 'کینال پارک گاہک نے وقت پر قسط ادا کی۔',
          locationGeo: { latitude: 28.6512, longitude: 70.6621, accuracyMeters: 10, capturedAt: new Date().toISOString() },
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-demo-102-2',
          tenantId,
          assignmentId: 'asg-12',
          customerId: 'cus-ryk-012',
          contractId: 'ctr-ryk-1012',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date(Date.now() - 3600000 * 4).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 650000,
          note: 'خواجہ فرید کالونی ڈور اسٹیپ وصولی۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-demo-102-3',
          tenantId,
          assignmentId: 'asg-13',
          customerId: 'cus-ryk-013',
          contractId: 'ctr-ryk-1013',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date(Date.now() - 3600000 * 3).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 450000,
          note: 'سرکلر روڈ دکان سے وصولی۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-demo-102-4',
          tenantId,
          assignmentId: 'asg-14',
          customerId: 'cus-ryk-014',
          contractId: 'ctr-ryk-1014',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date().toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 60000, // Rs. 600 daily
          note: 'صادق آباد روزانہ قسط وصول۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-demo-102-5',
          tenantId,
          assignmentId: 'asg-15',
          customerId: 'cus-ryk-015',
          contractId: 'ctr-ryk-1015',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date().toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 700000,
          note: 'آفیسرز کالونی قسط ادا کی گئی۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-demo-102-6',
          tenantId,
          assignmentId: 'asg-16',
          customerId: 'cus-ryk-016',
          contractId: 'ctr-ryk-1016',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date().toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 50000, // Rs. 500 daily
          note: 'روزانہ کاؤنٹر قسط وصول۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-demo-102-7',
          tenantId,
          assignmentId: 'asg-17',
          customerId: 'cus-ryk-017',
          contractId: 'ctr-ryk-1017',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date().toISOString() as any,
          outcome: 'unavailable',
          note: 'گاہک زرعی رقبے پر پانی لگانے گیا ہوا تھا، گھر پر تالا تھا۔ شام کو کال کی جائے گی۔',
          nextFollowUpAt: '2026-11-23',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-102',
        },

        // Officer 3: Tariq Mehmood (demo-recovery-103) - 7 Target: 4 Collected, 2 Promised, 1 Pending
        {
          visitId: 'vst-demo-103-1',
          tenantId,
          assignmentId: 'asg-19',
          customerId: 'cus-ryk-019',
          contractId: 'ctr-ryk-1019',
          employeeId: 'demo-recovery-103',
          visitedAt: new Date(Date.now() - 3600000 * 6).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 400000,
          note: 'تھلی روڈ نقد وصولی۔',
          locationGeo: { latitude: 28.4180, longitude: 70.3015, accuracyMeters: 14, capturedAt: new Date().toISOString() },
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-103',
        },
        {
          visitId: 'vst-demo-103-2',
          tenantId,
          assignmentId: 'asg-20',
          customerId: 'cus-ryk-020',
          contractId: 'ctr-ryk-1020',
          employeeId: 'demo-recovery-103',
          visitedAt: new Date(Date.now() - 3600000 * 4).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 500000,
          note: 'بانو بازار صادق آباد قسط وصول۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-103',
        },
        {
          visitId: 'vst-demo-103-3',
          tenantId,
          assignmentId: 'asg-21',
          customerId: 'cus-ryk-021',
          contractId: 'ctr-ryk-1021',
          employeeId: 'demo-recovery-103',
          visitedAt: new Date().toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 60000, // Rs. 600 daily
          note: 'سول لائنز روزانہ قسط موصول۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-103',
        },
        {
          visitId: 'vst-demo-103-4',
          tenantId,
          assignmentId: 'asg-22',
          customerId: 'cus-ryk-022',
          contractId: 'ctr-ryk-1022',
          employeeId: 'demo-recovery-103',
          visitedAt: new Date().toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 450000,
          note: 'اسٹیڈیم روڈ قسط کلیئر۔',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-103',
        },
        {
          visitId: 'vst-demo-103-5',
          tenantId,
          assignmentId: 'asg-23',
          customerId: 'cus-ryk-023',
          contractId: 'ctr-ryk-1023',
          employeeId: 'demo-recovery-103',
          visitedAt: new Date().toISOString() as any,
          outcome: 'promised',
          note: 'گاہک کی شاپ پر کام سست تھا، جمعہ کے روز بعد نمازِ جمعہ رقم دینے کا پکا وعدہ کیا ہے۔',
          nextFollowUpAt: '2026-11-27',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-103',
        },
        {
          visitId: 'vst-demo-103-6',
          tenantId,
          assignmentId: 'asg-24',
          customerId: 'cus-ryk-024',
          contractId: 'ctr-ryk-1024',
          employeeId: 'demo-recovery-103',
          visitedAt: new Date().toISOString() as any,
          outcome: 'promised',
          note: 'گاہک کے والد صاحب ہسپتال میں ہیں، 28 تاریخ تک ادائیگی کی مہلت مانگی ہے۔',
          nextFollowUpAt: '2026-11-28',
          isVerifiedVisit: true,
          createdAt: new Date().toISOString() as any,
          createdBy: 'demo-recovery-103',
        },

        // ====================================================================
        // Historical Snapshot: Yesterday's Visits for Trend Comparison
        // Kamran (6 collected yesterday out of 10)
        // Ali (4 collected yesterday out of 8)
        // Tariq (3 collected yesterday out of 7)
        // Total Yesterday: 13/25 (52%) vs Today 18/25 (72%) -> +20% Improvement
        // ====================================================================
        {
          visitId: 'vst-yest-101-1',
          tenantId,
          assignmentId: 'asg-01',
          customerId: 'cus-ryk-001',
          contractId: 'ctr-ryk-1001',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 600000,
          note: 'گزشتہ کل قسط وصول۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-yest-101-2',
          tenantId,
          assignmentId: 'asg-02',
          customerId: 'cus-ryk-002',
          contractId: 'ctr-ryk-1002',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 1200000,
          note: 'گزشتہ کل وصولی مکمل۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-yest-101-4',
          tenantId,
          assignmentId: 'asg-04',
          customerId: 'cus-ryk-004',
          contractId: 'ctr-ryk-1004',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 500000,
          note: 'گزشتہ کل نقد قسط جمع۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-yest-101-5',
          tenantId,
          assignmentId: 'asg-05',
          customerId: 'cus-ryk-005',
          contractId: 'ctr-ryk-1005',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 800000,
          note: 'گزشتہ کل وصولی۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-yest-101-6',
          tenantId,
          assignmentId: 'asg-06',
          customerId: 'cus-ryk-006',
          contractId: 'ctr-ryk-1006',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 900000,
          note: 'گزشتہ کل وزٹ مکمل۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-yest-101-7',
          tenantId,
          assignmentId: 'asg-07',
          customerId: 'cus-ryk-007',
          contractId: 'ctr-ryk-1007',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 50000,
          note: 'گزشتہ کل روزانہ قسط وصول۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-yest-102-1',
          tenantId,
          assignmentId: 'asg-11',
          customerId: 'cus-ryk-011',
          contractId: 'ctr-ryk-1011',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 500000,
          note: 'علی رضا گزشتہ کل وصولی۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-yest-102-2',
          tenantId,
          assignmentId: 'asg-12',
          customerId: 'cus-ryk-012',
          contractId: 'ctr-ryk-1012',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 650000,
          note: 'علی رضا گزشتہ کل وزٹ۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-yest-102-3',
          tenantId,
          assignmentId: 'asg-13',
          customerId: 'cus-ryk-013',
          contractId: 'ctr-ryk-1013',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 500000,
          note: 'گزشتہ کل کلیکشن۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-yest-102-4',
          tenantId,
          assignmentId: 'asg-14',
          customerId: 'cus-ryk-014',
          contractId: 'ctr-ryk-1014',
          employeeId: 'demo-recovery-102',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 750000,
          note: 'گزشتہ کل وصولی مکمل۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-102',
        },
        {
          visitId: 'vst-yest-103-1',
          tenantId,
          assignmentId: 'asg-19',
          customerId: 'cus-ryk-019',
          contractId: 'ctr-ryk-1019',
          employeeId: 'demo-recovery-103',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 400000,
          note: 'طارق محمود گزشتہ کل وزٹ۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-103',
        },
        {
          visitId: 'vst-yest-103-2',
          tenantId,
          assignmentId: 'asg-20',
          customerId: 'cus-ryk-020',
          contractId: 'ctr-ryk-1020',
          employeeId: 'demo-recovery-103',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 550000,
          note: 'گزشتہ کل وصولی۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-103',
        },
        {
          visitId: 'vst-yest-103-3',
          tenantId,
          assignmentId: 'asg-21',
          customerId: 'cus-ryk-021',
          contractId: 'ctr-ryk-1021',
          employeeId: 'demo-recovery-103',
          visitedAt: new Date(Date.now() - 86400000).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 600000,
          note: 'گزشتہ کل قسط موصول۔',
          isVerifiedVisit: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() as any,
          createdBy: 'demo-recovery-103',
        },
      ];
      localStorage.setItem(`${DEMO_VISITS_KEY}_${tenantId}`, JSON.stringify(initialVisits));
      return initialVisits;
    }

    const colRef = collection(db, 'tenants', tenantId, 'recoveryVisits');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as RecoveryVisit));
  },

  async logVisit(params: {
    tenantId: string;
    userId: string;
    assignmentId: string;
    customerId: string;
    contractId?: string;
    outcome: RecoveryVisitOutcome;
    amountCollectedPaisa?: number;
    note?: string;
    nextFollowUpAt?: string;
    paymentId?: string;
    locationGeo?: {
      latitude: number;
      longitude: number;
      accuracyMeters?: number;
      capturedAt: string;
    };
    photoProofUrl?: string;
    isVerifiedVisit?: boolean;
    isDemo?: boolean;
  }): Promise<RecoveryVisit> {
    const {
      tenantId,
      userId,
      assignmentId,
      customerId,
      contractId,
      outcome,
      amountCollectedPaisa,
      note = '',
      nextFollowUpAt,
      paymentId,
      locationGeo,
      photoProofUrl,
      isVerifiedVisit = false,
      isDemo = false,
    } = params;

    const visitId = `vst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newVisit: RecoveryVisit = {
      visitId,
      tenantId,
      assignmentId,
      customerId,
      contractId,
      employeeId: userId,
      visitedAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      outcome,
      amountCollectedPaisa,
      note,
      nextFollowUpAt: nextFollowUpAt ? (nextFollowUpAt as any) : undefined,
      paymentId,
      locationGeo,
      photoProofUrl,
      isVerifiedVisit: isVerifiedVisit || !!locationGeo || !!photoProofUrl,
      createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      createdBy: userId,
    };

    if (isDemo) {
      const visits = await this.getVisits(tenantId, true);
      localStorage.setItem(`${DEMO_VISITS_KEY}_${tenantId}`, JSON.stringify([newVisit, ...visits]));
      return newVisit;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'recoveryVisits', visitId), newVisit);
    return newVisit;
  },

  async assignCustomer(params: {
    tenantId: string;
    assignedBy: string;
    customerId: string;
    contractId?: string;
    employeeId: string;
    area?: string;
    isDemo?: boolean;
  }): Promise<RecoveryAssignment> {
    const {
      tenantId,
      assignedBy,
      customerId,
      contractId,
      employeeId,
      area = 'Main Area',
      isDemo = false,
    } = params;

    const assignmentId = `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAssignment: RecoveryAssignment = {
      assignmentId,
      tenantId,
      customerId,
      contractId,
      employeeId,
      assignedAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      assignedBy,
      status: 'active',
      area,
    };

    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_ASSIGNMENTS_KEY}_${tenantId}`);
      const list: RecoveryAssignment[] = stored ? JSON.parse(stored) : [];
      // If customer was already assigned, update or prepend
      const updated = [newAssignment, ...list.filter((a) => a.customerId !== customerId)];
      localStorage.setItem(`${DEMO_ASSIGNMENTS_KEY}_${tenantId}`, JSON.stringify(updated));
      return newAssignment;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'recoveryAssignments', assignmentId), newAssignment);
    return newAssignment;
  },

  async updateVisit(params: {
    tenantId: string;
    visitId: string;
    outcome?: RecoveryVisitOutcome;
    note?: string;
    nextFollowUpAt?: string;
    customerId?: string;
    contractId?: string;
    isDemo?: boolean;
  }): Promise<RecoveryVisit | null> {
    const { tenantId, visitId, outcome, note, nextFollowUpAt, customerId, contractId, isDemo = false } = params;

    if (isDemo) {
      const visits = await this.getVisits(tenantId, true);
      const target = visits.find((v) => v.visitId === visitId);
      if (!target) return null;
      if (outcome) target.outcome = outcome;
      if (note !== undefined) target.note = note;
      if (nextFollowUpAt !== undefined) target.nextFollowUpAt = nextFollowUpAt as any;
      if (customerId) target.customerId = customerId;
      if (contractId) target.contractId = contractId;

      localStorage.setItem(`${DEMO_VISITS_KEY}_${tenantId}`, JSON.stringify(visits));
      return target;
    }

    const docRef = doc(db, 'tenants', tenantId, 'recoveryVisits', visitId);
    const updates: any = { updatedAt: serverTimestamp() };
    if (outcome) updates.outcome = outcome;
    if (note !== undefined) updates.note = note;
    if (nextFollowUpAt !== undefined) updates.nextFollowUpAt = nextFollowUpAt;
    if (customerId) updates.customerId = customerId;
    if (contractId) updates.contractId = contractId;

    await updateDoc(docRef, updates);
    const visits = await this.getVisits(tenantId, false);
    return visits.find((v) => v.visitId === visitId) || null;
  },

  async reassignCustomer(params: {
    tenantId: string;
    assignmentId: string;
    newEmployeeId: string;
    isDemo?: boolean;
  }): Promise<RecoveryAssignment | null> {
    const { tenantId, assignmentId, newEmployeeId, isDemo = false } = params;

    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_ASSIGNMENTS_KEY}_${tenantId}`);
      if (!stored) return null;
      const list: RecoveryAssignment[] = JSON.parse(stored);
      const target = list.find((a) => a.assignmentId === assignmentId);
      if (target) {
        target.employeeId = newEmployeeId;
        localStorage.setItem(`${DEMO_ASSIGNMENTS_KEY}_${tenantId}`, JSON.stringify(list));
        return target;
      }
      return null;
    }

    await updateDoc(doc(db, 'tenants', tenantId, 'recoveryAssignments', assignmentId), {
      employeeId: newEmployeeId,
      updatedAt: serverTimestamp(),
    });
    const assignments = await this.getAssignments(tenantId, undefined, false);
    return assignments.find((a) => a.assignmentId === assignmentId) || null;
  },
};

