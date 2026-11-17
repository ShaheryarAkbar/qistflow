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
        return employeeId ? all.filter((a) => a.employeeId === employeeId) : all;
      }

      const initialAssignments: RecoveryAssignment[] = [
        {
          assignmentId: 'asg-01',
          tenantId,
          customerId: 'cus-ryk-001',
          contractId: 'ctr-ryk-1001',
          employeeId: 'demo-recovery-101',
          assignedAt: new Date().toISOString() as any,
          assignedBy: 'owner',
          status: 'active',
          area: 'Gulshan-e-Usman',
        },
        {
          assignmentId: 'asg-02',
          tenantId,
          customerId: 'cus-ryk-003',
          employeeId: 'demo-recovery-101',
          assignedAt: new Date().toISOString() as any,
          assignedBy: 'owner',
          status: 'active',
          area: 'Chowk Bahadurpur',
        },
        {
          assignmentId: 'asg-03',
          tenantId,
          customerId: 'cus-ryk-002',
          employeeId: 'demo-recovery-101',
          assignedAt: new Date().toISOString() as any,
          assignedBy: 'owner',
          status: 'active',
          area: 'Abbasia Town',
        },
        {
          assignmentId: 'asg-04',
          tenantId,
          customerId: 'cus-ryk-004',
          employeeId: 'demo-recovery-101',
          assignedAt: new Date().toISOString() as any,
          assignedBy: 'owner',
          status: 'active',
          area: 'Satellite Town',
        },
        {
          assignmentId: 'asg-05',
          tenantId,
          customerId: 'cus-ryk-005',
          employeeId: 'demo-recovery-101',
          assignedAt: new Date().toISOString() as any,
          assignedBy: 'owner',
          status: 'active',
          area: 'Factory Area',
        },
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
      if (stored) return JSON.parse(stored);

      // Preload a verified demo visit with GPS coordinates and sample proof
      const initialVisits: RecoveryVisit[] = [
        {
          visitId: 'vst-demo-001',
          tenantId,
          assignmentId: 'asg-01',
          customerId: 'cus-ryk-001',
          contractId: 'ctr-ryk-1001',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 3600000 * 3).toISOString() as any,
          outcome: 'collected',
          amountCollectedPaisa: 500000,
          note: 'Customer paid installment cash on doorstep. Receipt issued.',
          locationGeo: {
            latitude: 28.4212,
            longitude: 70.3134,
            accuracyMeters: 12,
            capturedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          },
          isVerifiedVisit: true,
          photoProofUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23e2e8f0"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="sans-serif" font-size="12">House Gate Photo Proof</text></svg>',
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString() as any,
          createdBy: 'demo-recovery-101',
        },
        {
          visitId: 'vst-demo-002',
          tenantId,
          assignmentId: 'asg-02',
          customerId: 'cus-ryk-003',
          employeeId: 'demo-recovery-101',
          visitedAt: new Date(Date.now() - 3600000 * 1).toISOString() as any,
          outcome: 'unavailable',
          note: 'Main gate locked with padlock. Neighbor confirmed out of city till Monday.',
          nextFollowUpAt: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] as any,
          locationGeo: {
            latitude: 28.4195,
            longitude: 70.3098,
            accuracyMeters: 18,
            capturedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
          },
          isVerifiedVisit: true,
          photoProofUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23fef2f2"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" fill="%23b91c1c" font-family="sans-serif" font-size="12">Padlocked Door Snap</text><text x="50%25" y="65%25" dominant-baseline="middle" text-anchor="middle" fill="%23991b1b" font-family="sans-serif" font-size="9">Lat: 28.4195, Lng: 70.3098</text></svg>',
          createdAt: new Date(Date.now() - 3600000 * 1).toISOString() as any,
          createdBy: 'demo-recovery-101',
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
  }): Promise<void> {
    const { tenantId, assignmentId, newEmployeeId, isDemo = false } = params;

    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_ASSIGNMENTS_KEY}_${tenantId}`);
      if (!stored) return;
      const list: RecoveryAssignment[] = JSON.parse(stored);
      const target = list.find((a) => a.assignmentId === assignmentId);
      if (target) {
        target.employeeId = newEmployeeId;
        localStorage.setItem(`${DEMO_ASSIGNMENTS_KEY}_${tenantId}`, JSON.stringify(list));
      }
      return;
    }

    await updateDoc(doc(db, 'tenants', tenantId, 'recoveryAssignments', assignmentId), {
      employeeId: newEmployeeId,
      updatedAt: serverTimestamp(),
    });
  },
};

