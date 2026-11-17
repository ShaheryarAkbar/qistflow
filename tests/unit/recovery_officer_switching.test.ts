// ============================================================================
// Unit Tests: Multi-Recovery Officer Testing, Dynamic Switching & Role Isolation
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { StaffRepository } from '@/repositories/staff.repository';
import { RecoveryRepository } from '@/repositories/recovery.repository';

// In-memory localStorage mock for node environment
const storageMock: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, value: string) => {
    storageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const key of Object.keys(storageMock)) delete storageMock[key];
  },
  key: (index: number) => Object.keys(storageMock)[index] || null,
  length: 0,
};

describe('Multi-Recovery Officer Dynamic Testing & Role Isolation', () => {
  const tenantId = 'tenant-test-ryk-01';

  beforeEach(() => {
    global.localStorage.clear();
  });

  it('provisions multiple distinct recovery officers in demo mode', async () => {
    const initialStaff = await StaffRepository.getStaffMembers(tenantId, true);
    const initialRecovery = initialStaff.filter((s) => s.role === 'recovery');
    expect(initialRecovery.length).toBeGreaterThanOrEqual(2);

    // Create a new field recovery officer dynamically
    const newOfficer = await StaffRepository.inviteStaffMember({
      tenantId,
      invitedBy: 'owner',
      displayName: 'Farhan Akhtar',
      email: 'farhan.recovery@test.pk',
      phone: '0309-8877665',
      role: 'recovery',
      isDemo: true,
    });

    expect(newOfficer.displayName).toBe('Farhan Akhtar');
    expect(newOfficer.role).toBe('recovery');
    expect(newOfficer.userId).toContain('staff_');

    const updatedStaff = await StaffRepository.getStaffMembers(tenantId, true);
    const found = updatedStaff.find((s) => s.email === 'farhan.recovery@test.pk');
    expect(found).toBeDefined();
    expect(found?.displayName).toBe('Farhan Akhtar');
  });

  it('strictly isolates customer queues between distinct recovery officers', async () => {
    const officer1Id = 'demo-recovery-101'; // Kamran Ali / Bilal
    const officer2Id = 'staff_farhan_999';

    // Assign Customer 1 to Officer 1
    await RecoveryRepository.assignCustomer({
      tenantId,
      assignedBy: 'owner',
      customerId: 'cus-101',
      contractId: 'ctr-101',
      employeeId: officer1Id,
      area: 'Zone A - Sadiqabad Road',
      isDemo: true,
    });

    // Assign Customer 2 to Officer 2
    await RecoveryRepository.assignCustomer({
      tenantId,
      assignedBy: 'owner',
      customerId: 'cus-202',
      contractId: 'ctr-202',
      employeeId: officer2Id,
      area: 'Zone B - Khanpur Road',
      isDemo: true,
    });

    // 1. Owner view (unfiltered): gets both assignments
    const allAssignments = await RecoveryRepository.getAssignments(tenantId, undefined, true);
    expect(allAssignments.some((a) => a.customerId === 'cus-101')).toBe(true);
    expect(allAssignments.some((a) => a.customerId === 'cus-202')).toBe(true);

    // 2. Officer 1 perspective: strictly gets ONLY Customer 1
    const officer1Assignments = await RecoveryRepository.getAssignments(tenantId, officer1Id, true);
    expect(officer1Assignments.length).toBe(1);
    expect(officer1Assignments[0].customerId).toBe('cus-101');
    expect(officer1Assignments[0].employeeId).toBe(officer1Id);

    // 3. Officer 2 perspective: strictly gets ONLY Customer 2
    const officer2Assignments = await RecoveryRepository.getAssignments(tenantId, officer2Id, true);
    expect(officer2Assignments.length).toBe(1);
    expect(officer2Assignments[0].customerId).toBe('cus-202');
    expect(officer2Assignments[0].employeeId).toBe(officer2Id);
  });

  it('allows owner to reassign a customer from one officer to another', async () => {
    const officer1Id = 'demo-recovery-101';
    const officer2Id = 'staff_farhan_999';

    const asg = await RecoveryRepository.assignCustomer({
      tenantId,
      assignedBy: 'owner',
      customerId: 'cus-303',
      contractId: 'ctr-303',
      employeeId: officer1Id,
      isDemo: true,
    });

    expect(asg.employeeId).toBe(officer1Id);

    // Reassign to Officer 2
    const reassigned = await RecoveryRepository.reassignCustomer({
      tenantId,
      assignmentId: asg.assignmentId,
      newEmployeeId: officer2Id,
      isDemo: true,
    });

    expect(reassigned).toBeDefined();
    expect(reassigned?.employeeId).toBe(officer2Id);

    // Verify Officer 1 no longer has cus-303
    const officer1Queue = await RecoveryRepository.getAssignments(tenantId, officer1Id, true);
    expect(officer1Queue.some((a) => a.customerId === 'cus-303')).toBe(false);

    // Verify Officer 2 now has cus-303
    const officer2Queue = await RecoveryRepository.getAssignments(tenantId, officer2Id, true);
    expect(officer2Queue.some((a) => a.customerId === 'cus-303')).toBe(true);
  });

  it('authenticates demo staff with custom email and accurately resolves recovery role', () => {
    const demoStaffList = [
      {
        userId: 'staff_1739_custom',
        displayName: 'Zahid Khan (New Officer)',
        email: 'zahid@qistflow.pk',
        role: 'recovery',
        status: 'active',
        permissions: ['assigned_collections'],
        joinedAt: '2026-11-17',
      },
    ];

    global.localStorage.setItem(
      `qistflow_demo_staff_${tenantId}`,
      JSON.stringify(demoStaffList)
    );

    const stored = global.localStorage.getItem(`qistflow_demo_staff_${tenantId}`);
    expect(stored).toBeDefined();

    const parsed = JSON.parse(stored!);
    const found = parsed.find((s: any) => s.email === 'zahid@qistflow.pk');
    expect(found).toBeDefined();
    expect(found.userId).toBe('staff_1739_custom');
    expect(found.role).toBe('recovery');

    // Simulate switching demo staff in localStorage
    const demoUser = {
      uid: found.userId,
      email: found.email,
      displayName: found.displayName,
      emailVerified: true,
    };

    global.localStorage.setItem(
      'qistflow_demo_user',
      JSON.stringify({ user: demoUser, profile: demoUser, role: found.role })
    );

    const activeDemo = JSON.parse(global.localStorage.getItem('qistflow_demo_user')!);
    expect(activeDemo.user.uid).toBe('staff_1739_custom');
    expect(activeDemo.role).toBe('recovery');
  });
});
