// ============================================================================
// Repository: Clearance Certificates
// Scoped to /tenants/{tenantId}/certificates/{certificateId}
// Invariant: Certificate can only be issued when contract outstanding is 0 paisa.
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
import { ClearanceCertificate, Contract } from '@/types';
import { checkClearanceEligibility } from '@/domain/certificates/eligibility';
import { SaleRepository } from './sale.repository';

const DEMO_CERTIFICATES_KEY = 'qistflow_demo_certificates';

export const CertificateRepository = {
  async getCertificates(tenantId: string, isDemo = false): Promise<ClearanceCertificate[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_CERTIFICATES_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);
      return [];
    }

    const colRef = collection(db, 'tenants', tenantId, 'certificates');
    const q = query(colRef, orderBy('issuedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as ClearanceCertificate));
  },

  async issueCertificate(params: {
    tenantId: string;
    userId: string;
    contract: Contract;
    isDemo?: boolean;
  }): Promise<ClearanceCertificate> {
    const { tenantId, userId, contract, isDemo = false } = params;

    // 1. Fetch schedule entries to verify exact 0 paisa balance
    const scheduleEntries = await SaleRepository.getScheduleEntries(
      tenantId,
      contract.contractId,
      isDemo
    );

    const eligibility = checkClearanceEligibility(contract, scheduleEntries);
    if (!eligibility.isEligible) {
      throw new Error(eligibility.reason || 'Contract is not fully settled.');
    }

    const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const certificateNumber = `CERT-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    const newCert: ClearanceCertificate = {
      certificateId,
      tenantId,
      certificateNumber,
      contractId: contract.contractId,
      customerId: contract.customerId,
      language: 'ur',
      status: 'valid',
      totalReceivedPaisa: eligibility.totalReceivedPaisa,
      settledAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      issuedAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      issuedBy: userId,
      documentVersion: 1,
    };

    if (isDemo) {
      const certificates = await this.getCertificates(tenantId, true);
      localStorage.setItem(`${DEMO_CERTIFICATES_KEY}_${tenantId}`, JSON.stringify([newCert, ...certificates]));
      return newCert;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'certificates', certificateId), newCert);
    return newCert;
  },
};

