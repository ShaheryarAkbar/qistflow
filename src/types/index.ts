// ============================================================================
// QistFlow Core Domain & Database Types
// Conforming to QistFlow_Firebase_Database_Design_v1.0.md
// ============================================================================

export type TimestampLike = {
  seconds: number;
  nanoseconds: number;
} | Date | string;

export type SupportedLanguage = 'en' | 'ur';

export type UserRole = 'owner' | 'manager' | 'accountant' | 'recovery' | 'super_admin';

export type MembershipStatus = 'invited' | 'active' | 'suspended' | 'removed';

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'grace'
  | 'read_only'
  | 'suspended'
  | 'cancelled';

export type SaleType = 'cash' | 'installment';

export type ContractStatus =
  | 'draft'
  | 'active'
  | 'overdue'
  | 'fully_paid'
  | 'cancelled'
  | 'written_off'
  | 'disputed';

export type ScheduleFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

export type ScheduleEntryStatus =
  | 'upcoming'
  | 'due'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'adjusted';

export type PaymentMethod =
  | 'cash'
  | 'jazzcash'
  | 'easypaisa'
  | 'bank'
  | 'card'
  | 'other';

export type PaymentKind =
  | 'advance'
  | 'installment'
  | 'early_settlement'
  | 'cash_sale'
  | 'other';

export type PaymentStatus = 'posted' | 'partially_reversed' | 'reversed';

export type AllocationType =
  | 'schedule'
  | 'advance_credit'
  | 'early_settlement'
  | 'unapplied';

export type InventoryMovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'customer_return'
  | 'supplier_return'
  | 'damage'
  | 'adjustment_in'
  | 'adjustment_out';

export type RecoveryVisitOutcome =
  | 'collected'
  | 'unavailable'
  | 'promised'
  | 'refused'
  | 'rescheduled'
  | 'other';

export type StaffPermission =
  | 'manage_products'
  | 'manage_inventory'
  | 'view_reports'
  | 'assign_recovery'
  | 'can_manage_staff'
  | 'grant_discounts'
  | 'view_financial_reports'
  | 'record_expenses'
  | 'request_reversals'
  | 'view_contracts'
  | 'view_customers';

// --- Entities ---

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  photoURL?: string;
  preferredLanguage: SupportedLanguage;
  accountStatus: 'active' | 'disabled';
  createdAt: any;
  updatedAt: any;
}

export interface Tenant {
  tenantId: string;
  schemaVersion: number;
  businessName: string;
  businessNameUr?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  logoDataUrl?: string;
  currency: 'PKR';
  timezone: 'Asia/Karachi';
  defaultLanguage: SupportedLanguage;
  subscriptionStatus: SubscriptionStatus;
  planId?: string;
  licenceType?: 'subscription' | 'lifetime';
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface Membership {
  userId: string;
  tenantId: string;
  role: UserRole;
  permissions: string[];
  membershipStatus: MembershipStatus;
  preferredLanguage?: SupportedLanguage;
  invitedBy?: string;
  joinedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface Customer {
  id?: string;
  customerId: string;
  tenantId: string;
  customerCode?: string;
  fullName: string;
  normalizedPhone?: string;
  phoneDisplay?: string;
  alternatePhone?: string;
  cnic?: string;
  address?: string;
  area?: string;
  city?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface Product {
  id?: string;
  productId: string;
  tenantId: string;
  productCode?: string;
  name: string;
  category?: string;
  brand?: string;
  model?: string;
  skuNormalized?: string;
  barcodeNormalized?: string;
  description?: string;
  costPricePaisa: number;
  cashPricePaisa: number;
  installmentPricePaisa: number;
  stockOnHand: number;
  reorderLevel?: number;
  status: 'active' | 'inactive';
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface Supplier {
  id?: string;
  supplierId: string;
  tenantId: string;
  supplierCode?: string;
  name: string;
  company?: string;
  normalizedPhone?: string;
  phoneDisplay?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface PurchaseItemSnapshot {
  productId: string;
  productNameSnapshot: string;
  modelSnapshot?: string;
  quantity: number;
  unitCostPaisa: number;
  lineTotalPaisa: number;
}

export interface Purchase {
  id?: string;
  tenantId: string;
  supplierId: string;
  branchId?: string;
  purchaseDate: any;
  referenceNumber?: string;
  items: PurchaseItemSnapshot[];
  subtotalPaisa: number;
  discountPaisa: number;
  totalPaisa: number;
  paidPaisa: number;
  balancePaisa: number;
  status: 'draft' | 'posted' | 'partially_paid' | 'paid' | 'cancelled';
  createdAt: any;
  createdBy: string;
}

export interface InventoryMovement {
  id?: string;
  movementId: string;
  tenantId: string;
  productId: string;
  branchId?: string;
  movementType: InventoryMovementType;
  quantity: number;
  movementDate: any;
  referenceType?: 'purchase' | 'sale' | 'adjustment' | 'return';
  referenceId?: string;
  reason?: string;
  createdAt: any;
  createdBy: string;
}

export interface SaleItemSnapshot {
  productId: string;
  productNameSnapshot: string;
  brandSnapshot?: string;
  modelSnapshot?: string;
  descriptionSnapshot?: string;
  quantity: number;
  cashUnitPricePaisa: number;
  agreedUnitPricePaisa: number;
  lineTotalPaisa: number;
}

export interface Sale {
  id?: string;
  saleId: string;
  tenantId: string;
  customerId: string;
  branchId?: string;
  saleType: SaleType;
  saleDate: any;
  items: SaleItemSnapshot[];
  cashTotalPaisa: number;
  agreedTotalPaisa: number;
  discountPaisa: number;
  status: 'draft' | 'posted' | 'cancelled';
  contractId?: string;
  createdAt: any;
  createdBy: string;
}

export interface Contract {
  id?: string;
  contractId: string;
  tenantId: string;
  customerId: string;
  saleId: string;
  branchId?: string;
  contractCode?: string;
  itemsSnapshot: SaleItemSnapshot[];
  cashPriceTotalPaisa: number;
  installmentPriceTotalPaisa: number;
  discountPaisa: number;
  advancePaisa: number;
  financedAmountPaisa: number;
  totalPaidPaisa: number;
  outstandingPaisa: number;
  frequency: ScheduleFrequency;
  durationCount?: number;
  startDateKey: string;
  firstDueDateKey: string;
  schedulePolicy: {
    monthEndRule?: 'clamp_to_last_day' | 'preserve_end_of_month';
    customSchedule?: boolean;
  };
  status: ContractStatus;
  assignedEmployeeId?: string;
  settledAt?: any;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
  updatedBy: string;
}

export interface ScheduleEntry {
  id?: string;
  scheduleEntryId: string;
  tenantId: string;
  contractId: string;
  customerId: string;
  branchId?: string;
  sequenceNumber: number;
  dueDateKey: string;
  dueAt?: any;
  dueAmountPaisa: number;
  allocatedPaidPaisa: number;
  remainingPaisa: number;
  status: ScheduleEntryStatus;
  assignedEmployeeId?: string;
  createdAt: any;
  createdBy: string;
  updatedAt: any;
}

export interface Payment {
  id?: string;
  paymentId: string;
  tenantId: string;
  customerId: string;
  contractId?: string;
  saleId?: string;
  branchId?: string;
  amountPaisa: number;
  method: PaymentMethod;
  paidAt: any;
  receivedBy: string;
  reference?: string;
  notes?: string;
  paymentKind: PaymentKind;
  status: PaymentStatus;
  idempotencyKeyId: string;
  createdAt: any;
  createdBy: string;
}

export interface PaymentAllocation {
  id?: string;
  allocationId: string;
  tenantId: string;
  paymentId: string;
  contractId: string;
  scheduleEntryId?: string;
  customerId: string;
  allocatedAmountPaisa: number;
  allocationType: AllocationType;
  createdAt: any;
  createdBy: string;
}

export interface PaymentReversal {
  id?: string;
  reversalId: string;
  tenantId: string;
  paymentId: string;
  amountPaisa: number;
  reversalType: 'full' | 'partial' | 'refund' | 'correction';
  reason: string;
  approvedBy: string;
  reversedAt: any;
  createdAt: any;
  createdBy: string;
}

export interface Receipt {
  id?: string;
  tenantId: string;
  receiptNumber: string;
  paymentId: string;
  customerId: string;
  contractId?: string;
  language: SupportedLanguage;
  issuedAt: any;
  issuedBy: string;
  documentVersion: number;
  status: 'issued' | 'voided' | 'reissued';
}

export interface Expense {
  id?: string;
  expenseId: string;
  tenantId: string;
  branchId?: string;
  category: string;
  amountPaisa: number;
  expenseDate: any;
  method: PaymentMethod;
  description?: string;
  reference?: string;
  status: 'posted' | 'voided';
  createdAt: any;
  createdBy: string;
}

export interface RecoveryAssignment {
  id?: string;
  assignmentId: string;
  tenantId: string;
  customerId: string;
  contractId?: string;
  employeeId: string;
  assignedAt: any;
  assignedBy: string;
  status: 'active' | 'completed' | 'revoked';
  area?: string;
  nextFollowUpAt?: any;
}

export interface RecoveryVisit {
  id?: string;
  visitId: string;
  tenantId: string;
  assignmentId: string;
  customerId: string;
  contractId?: string;
  employeeId: string;
  visitedAt: any;
  outcome: RecoveryVisitOutcome;
  note?: string;
  nextFollowUpAt?: any;
  paymentId?: string;
  // Free Proof-of-Visit fields (HTML5 Geolocation & Camera Snap)
  locationGeo?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    capturedAt: string;
  };
  photoProofUrl?: string; // Client-side compressed base64 data URL
  isVerifiedVisit?: boolean;
  createdAt: any;
  createdBy: string;
}

export interface ClearanceCertificate {
  id?: string;
  certificateId: string;
  tenantId: string;
  certificateNumber: string;
  contractId: string;
  customerId: string;
  language: SupportedLanguage;
  status: 'valid' | 'invalidated' | 'reissued';
  totalReceivedPaisa: number;
  settledAt: any;
  issuedAt: any;
  issuedBy: string;
  documentVersion: number;
  invalidationReason?: string;
  supersedesCertificateId?: string;
}

export interface Summary {
  tenantId: string;
  summaryType: string;
  periodKey: string;
  totals: {
    expectedPaisa?: number;
    collectedPaisa?: number;
    pendingPaisa?: number;
    overduePaisa?: number;
    salesPaisa?: number;
    expensesPaisa?: number;
    outstandingPaisa?: number;
  };
  counts?: Record<string, number>;
  calculatedAt: any;
  schemaVersion: number;
}

// --- Platform Super-Admin Entities (PRD Section 4.5 & 6.16) ---

export interface PlatformPlan {
  planId: string;
  name: string;
  nameUr?: string;
  billingType: 'monthly' | 'lifetime';
  pricePaisa: number;
  features: string[];
  maxUsers: number;
  maxCustomers: number;
  status: 'active' | 'archived';
}

export interface PlatformLicence {
  licenceId: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  licenceType: 'subscription' | 'lifetime';
  status: 'trial' | 'active' | 'grace' | 'suspended' | 'cancelled';
  startedAt: any;
  expiresAt?: any;
  supportNotes?: string;
}

export interface PlatformAuditEvent {
  auditId: string;
  actorUserId: string;
  action: string;
  targetTenantId?: string;
  details: string;
  occurredAt: any;
}

