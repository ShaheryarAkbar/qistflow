// ============================================================================
// Repository: Field Recovery Assignments & Visit Logs
// Scoped to /tenants/{tenantId}/recoveryAssignments & recoveryVisits
// ============================================================================

import {
  collection,
  doc,
  getDocs,
  setDoc,
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
      return [];
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
    note?: string;
    nextFollowUpAt?: string;
    paymentId?: string;
    isDemo?: boolean;
  }): Promise<RecoveryVisit> {
    const {
      tenantId,
      userId,
      assignmentId,
      customerId,
      contractId,
      outcome,
      note = '',
      nextFollowUpAt,
      paymentId,
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
      note,
      nextFollowUpAt: nextFollowUpAt ? (nextFollowUpAt as any) : undefined,
      paymentId,
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
};

