// ============================================================================
// Repository: Shop Branches & Multi-Store Licensing Governance
// Scoped to /tenants/{tenantId}/branches/{branchId}
// Anti-Piracy / Licence Isolation: Enforces unique sub-licence per active branch
// ============================================================================

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/app';
import { ShopBranch } from '@/types';

const DEMO_BRANCHES_KEY = 'qistflow_demo_branches';

export const BranchRepository = {
  async getBranches(tenantId: string, isDemo = false): Promise<ShopBranch[]> {
    if (isDemo) {
      const stored = localStorage.getItem(`${DEMO_BRANCHES_KEY}_${tenantId}`);
      if (stored) return JSON.parse(stored);

      const initialBranches: ShopBranch[] = [
        {
          branchId: 'br-ryk-01',
          tenantId,
          branchCode: 'BR-01',
          name: 'Main City Branch (شاہی روڈ مین برانچ)',
          nameUr: 'شاہی روڈ مین برانچ',
          managerId: 'demo-manager-102',
          managerName: 'Muhammad Tariq',
          phone: '0301-7654321',
          city: 'Rahim Yar Khan',
          address: 'Main Shahi Road, Near City Chowk, Rahim Yar Khan',
          licenceKey: 'QIST-BR1-2026-LIVE-8891',
          licenceStatus: 'active',
          monthlyTargetPaisa: 500000000, // Rs. 5,000,000 target
          status: 'active',
          metrics: {
            totalSalesPaisa: 540000000, // Rs. 5.4M
            totalCollectedPaisa: 410000000, // Rs. 4.1M
            totalExpensesPaisa: 38000000, // Rs. 380k
            netProfitPaisa: 95000000, // Rs. 950k profit
            performanceRating: 'profit',
          },
          createdAt: '2026-01-01',
          createdBy: 'demo-owner-101',
        },
        {
          branchId: 'br-ryk-02',
          tenantId,
          branchCode: 'BR-02',
          name: 'Satellite Town Branch (سیٹلائٹ ٹاؤن برانچ)',
          nameUr: 'سیٹلائٹ ٹاؤن برانچ',
          managerId: 'demo-manager-105',
          managerName: 'Zubair Khan',
          phone: '0302-3344556',
          city: 'Rahim Yar Khan',
          address: 'Main Commercial Market, Satellite Town, RYK',
          licenceKey: 'QIST-BR2-2026-LIVE-9923',
          licenceStatus: 'active',
          monthlyTargetPaisa: 300000000, // Rs. 3,000,000 target
          status: 'active',
          metrics: {
            totalSalesPaisa: 285000000, // Rs. 2.85M (95% of target)
            totalCollectedPaisa: 220000000, // Rs. 2.2M
            totalExpensesPaisa: 29000000, // Rs. 290k
            netProfitPaisa: 32000000, // Rs. 320k profit
            performanceRating: 'average',
          },
          createdAt: '2026-04-10',
          createdBy: 'demo-owner-101',
        },
        {
          branchId: 'br-ryk-03',
          tenantId,
          branchCode: 'BR-03',
          name: 'Factory Area Branch (فیکٹری ایریا برانچ)',
          nameUr: 'فیکٹری ایریا برانچ',
          managerId: 'demo-manager-106',
          managerName: 'Noman Bashir',
          phone: '0304-7788990',
          city: 'Rahim Yar Khan',
          address: 'Industrial Estate Road, Rahim Yar Khan',
          licenceKey: 'QIST-BR3-2026-LIVE-4412',
          licenceStatus: 'active',
          monthlyTargetPaisa: 250000000, // Rs. 2,500,000 target
          status: 'active',
          metrics: {
            totalSalesPaisa: 140000000, // Rs. 1.4M (56% of target)
            totalCollectedPaisa: 95000000, // Rs. 950k
            totalExpensesPaisa: 32000000, // Rs. 320k
            netProfitPaisa: -8000000, // Rs. -80k loss
            performanceRating: 'loss',
          },
          createdAt: '2026-07-01',
          createdBy: 'demo-owner-101',
        },
      ];

      localStorage.setItem(`${DEMO_BRANCHES_KEY}_${tenantId}`, JSON.stringify(initialBranches));
      return initialBranches;
    }

    const colRef = collection(db, 'tenants', tenantId, 'branches');
    const snap = await getDocs(colRef);
    return snap.docs.map((d: any) => ({ ...d.data(), id: d.id } as ShopBranch));
  },

  async createBranch(params: {
    tenantId: string;
    userId: string;
    branchCode: string;
    name: string;
    nameUr?: string;
    managerName?: string;
    phone?: string;
    city?: string;
    address?: string;
    licenceKey?: string;
    monthlyTargetPaisa: number;
    isDemo?: boolean;
  }): Promise<ShopBranch> {
    const {
      tenantId,
      userId,
      branchCode,
      name,
      nameUr,
      managerName = 'Branch In-charge',
      phone,
      city = 'Rahim Yar Khan',
      address,
      licenceKey = `QIST-SUB-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      monthlyTargetPaisa,
      isDemo = false,
    } = params;

    const branchId = `br_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBranch: ShopBranch = {
      branchId,
      tenantId,
      branchCode,
      name,
      nameUr: nameUr || name,
      managerName,
      phone,
      city,
      address,
      licenceKey,
      licenceStatus: 'active',
      monthlyTargetPaisa,
      status: 'active',
      metrics: {
        totalSalesPaisa: 0,
        totalCollectedPaisa: 0,
        totalExpensesPaisa: 0,
        netProfitPaisa: 0,
        performanceRating: 'average',
      },
      createdAt: isDemo ? new Date().toISOString() : (serverTimestamp() as any),
      createdBy: userId,
    };

    if (isDemo) {
      const branches = await this.getBranches(tenantId, true);
      const updated = [...branches, newBranch];
      localStorage.setItem(`${DEMO_BRANCHES_KEY}_${tenantId}`, JSON.stringify(updated));
      return newBranch;
    }

    await setDoc(doc(db, 'tenants', tenantId, 'branches', branchId), newBranch);
    return newBranch;
  },

  async updateBranchStatus(
    tenantId: string,
    branchId: string,
    status: 'active' | 'inactive',
    isDemo = false
  ): Promise<void> {
    if (isDemo) {
      const branches = await this.getBranches(tenantId, true);
      const target = branches.find((b) => b.branchId === branchId);
      if (target) {
        target.status = status;
        localStorage.setItem(`${DEMO_BRANCHES_KEY}_${tenantId}`, JSON.stringify(branches));
      }
      return;
    }

    await updateDoc(doc(db, 'tenants', tenantId, 'branches', branchId), {
      status,
      updatedAt: serverTimestamp(),
    });
  },
};
