// ============================================================================
// Permission Governance Matrix & Definitions (PRD Section 4.1 & Multi-Tier Hierarchy)
// ============================================================================

import { UserRole } from '@/types';

export interface PermissionDefinition {
  key: string;
  parentModule?: string; // If sub-action, links to main module key
  isModule: boolean;
  labelEn: string;
  labelUr: string;
  descEn: string;
  descUr: string;
}

export interface PermissionGroup {
  moduleKey: string;
  labelEn: string;
  labelUr: string;
  descEn: string;
  descUr: string;
  subActions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    moduleKey: 'module_pos',
    labelEn: 'Point of Sale (POS / New Sale)',
    labelUr: 'نئی سیل / پوائنٹ آف سیل (POS)',
    descEn: 'Access to create cash or installment sales',
    descUr: 'نقد یا اقساط پر نیا سودا بنانے کا اختیار',
    subActions: [
      {
        key: 'action_create_cash_sale',
        parentModule: 'module_pos',
        isModule: false,
        labelEn: 'Direct Cash Sale',
        labelUr: 'ڈائریکٹ نقد فروخت',
        descEn: 'Allow creating outright cash sales',
        descUr: 'گاہک کو مکمل نقد رقم پر سامان فروخت کرنا',
      },
      {
        key: 'action_create_installment_sale',
        parentModule: 'module_pos',
        isModule: false,
        labelEn: 'Installment Sale Contract',
        labelUr: 'اقساط پر فروخت / نیا معاہدہ',
        descEn: 'Allow generating installment contracts with payment plans',
        descUr: 'ماہانہ یا ہفتہ وار اقساط کا نیا پلان بنانا',
      },
      {
        key: 'action_grant_discount',
        parentModule: 'module_pos',
        isModule: false,
        labelEn: 'Grant Special Discount',
        labelUr: 'گاہک کو خصوصی رعایت / ڈسکاؤنٹ',
        descEn: 'Allow applying custom discount on sale price',
        descUr: 'سودے پر خصوصی رعایت دینے کی اجازت',
      },
    ],
  },
  {
    moduleKey: 'module_customers',
    labelEn: 'Customer Directory',
    labelUr: 'گاہکوں کی فہرست (کسٹمرز)',
    descEn: 'Access to customer profiles, CNIC & contact records',
    descUr: 'تمام گاہکوں کے ریکارڈ، شناختی کارڈ اور پتے دیکھنا',
    subActions: [
      {
        key: 'action_add_customer',
        parentModule: 'module_customers',
        isModule: false,
        labelEn: 'Add New Customer',
        labelUr: 'نیا گاہک رجسٹر کرنا',
        descEn: 'Register new customers into the database',
        descUr: 'سسٹم میں نئے گاہک کا اندراج کرنا',
      },
      {
        key: 'action_edit_customer',
        parentModule: 'module_customers',
        isModule: false,
        labelEn: 'Edit Customer Details',
        labelUr: 'گاہک کی معلومات ترمیم کرنا',
        descEn: 'Update phone number, address, or guarantor details',
        descUr: 'فون، پتا یا ضامن کی معلومات تبدیل کرنا',
      },
      {
        key: 'action_delete_customer',
        parentModule: 'module_customers',
        isModule: false,
        labelEn: 'Archive / Deactivate Customer',
        labelUr: 'گاہک معطل / آرکائیو کرنا',
        descEn: 'Permission to mark customer as inactive or blocked',
        descUr: 'گاہک کا اکاؤنٹ بلاک یا غیر فعال کرنا',
      },
    ],
  },
  {
    moduleKey: 'module_contracts',
    labelEn: 'Contracts & Agreements',
    labelUr: 'اقساط کے معاہدات (کانٹریکٹس)',
    descEn: 'View and audit all signed installment agreements',
    descUr: 'تمام دستخط شدہ اقساط کے معاہدے اور تفصیلات دیکھنا',
    subActions: [
      {
        key: 'action_view_contracts',
        parentModule: 'module_contracts',
        isModule: false,
        labelEn: 'View Contract Ledgers',
        labelUr: 'معاہدہ و لیجر ملاحظہ کرنا',
        descEn: 'Inspect remaining balance and installment history',
        descUr: 'بقایا رقم اور ادا شدہ اقساط کا مکمل لیجر دیکھنا',
      },
    ],
  },
  {
    moduleKey: 'module_installments',
    labelEn: 'Due Installments & Collections',
    labelUr: 'واجب الادا اقساط و ریکوری شیڈول',
    descEn: 'View today, upcoming, and overdue installment lists',
    descUr: 'آج کی، آنے والی اور لیٹ اقساط کی لسٹ دیکھنا',
    subActions: [
      {
        key: 'action_collect_payment',
        parentModule: 'module_installments',
        isModule: false,
        labelEn: 'Collect Installment / Payment',
        labelUr: 'قسط وصول کر کے انٹری کرنا',
        descEn: 'Record incoming installment money from customer',
        descUr: 'گاہک سے قسط وصول کر کے سسٹم میں اندراج کرنا',
      },
      {
        key: 'action_reverse_payment',
        parentModule: 'module_installments',
        isModule: false,
        labelEn: 'Request / Process Reversal',
        labelUr: 'غلط انٹری واپسی / کینسلیشن',
        descEn: 'Initiate or process payment reversals',
        descUr: 'غلط وصولی کی رقم واپس یا ریورس کرنا',
      },
      {
        key: 'action_print_receipt',
        parentModule: 'module_installments',
        isModule: false,
        labelEn: 'Print Official Thermal Receipt',
        labelUr: 'سرکاری رسید پرنٹ کرنا',
        descEn: 'Print thermal slip or 80mm receipt for customer',
        descUr: 'گاہک کے لیے پرنٹر سے رسید نکالنا',
      },
    ],
  },
  {
    moduleKey: 'module_inventory',
    labelEn: 'Stock & Inventory Management',
    labelUr: 'اسٹاک و گودام مینجمنٹ',
    descEn: 'Track warehouse items, stock counts, and movements',
    descUr: 'دکان اور گودام میں موجود اشیاء کی نگرانی',
    subActions: [
      {
        key: 'action_add_product',
        parentModule: 'module_inventory',
        isModule: false,
        labelEn: 'Add / Edit Catalog Products',
        labelUr: 'نئی پراڈکٹ شامل / ایڈٹ کرنا',
        descEn: 'Create products, models, prices, and categories',
        descUr: 'سامان کی لسٹ میں نیا آئٹم یا ماڈل شامل کرنا',
      },
      {
        key: 'action_mark_damaged_stock',
        parentModule: 'module_inventory',
        isModule: false,
        labelEn: 'Mark Damaged / Scrapped Stock',
        labelUr: 'خراب / ڈیمج مال کا اندراج کرنا',
        descEn: 'Record faulty, damaged or returned inventory items',
        descUr: 'خراب یا ٹوٹ پھوٹ والے سامان کو الگ درج کرنا',
      },
      {
        key: 'action_record_purchase',
        parentModule: 'module_inventory',
        isModule: false,
        labelEn: 'Stock Purchase Inflow',
        labelUr: 'سپلائر سے مال خریداری اندراج',
        descEn: 'Post wholesale delivery invoices from suppliers',
        descUr: 'ہول سیلرز سے موصول ہونے والے اسٹاک کی انٹری',
      },
    ],
  },
  {
    moduleKey: 'module_expenses',
    labelEn: 'Shop Expenses & Office Budget',
    labelUr: 'دفتری اخراجات و ماہانہ بجٹ',
    descEn: 'Track shop operating expenses, rent, utilities & logistics',
    descUr: 'دکان کے روزمرہ خرچ، کرایہ، بجلی بل اور چائے پانی کا حساب',
    subActions: [
      {
        key: 'action_record_expense',
        parentModule: 'module_expenses',
        isModule: false,
        labelEn: 'Record Daily Expense',
        labelUr: 'روزانہ خرچہ درج کرنا',
        descEn: 'Submit daily shop expense receipts',
        descUr: 'دکان کے خرچ کی نئی انٹری درج کرنا',
      },
      {
        key: 'action_approve_expense',
        parentModule: 'module_expenses',
        isModule: false,
        labelEn: 'Approve Major Expenses',
        labelUr: 'بڑے اخراجات کی منظوری',
        descEn: 'Authorise high-value shop expenditures',
        descUr: 'بڑے اخراجات کی تصدیق و منظوری کا اختیار',
      },
    ],
  },
  {
    moduleKey: 'module_recovery',
    labelEn: 'Field Recovery Portal',
    labelUr: 'فیلڈ ریکوری پورٹل (دروازے پر وصولی)',
    descEn: 'Field officer collections, GPS visits, and customer audits',
    descUr: 'ریکوری ملازمین کا فیلڈ پورٹل اور دورے کی تصدیق',
    subActions: [
      {
        key: 'action_record_visit_proof',
        parentModule: 'module_recovery',
        isModule: false,
        labelEn: 'Capture Doorstep Visit & Photo Proof',
        labelUr: 'دروازے پر دورے اور تصویر کا ثبوت',
        descEn: 'Log visit reason, GPS location, and camera snap',
        descUr: 'موقع پر جا کر قسط وصولی یا عدم دستیابی کا ثبوت درج کرنا',
      },
      {
        key: 'action_reassign_recovery',
        parentModule: 'module_recovery',
        isModule: false,
        labelEn: 'Reassign Customer Recovery Targets',
        labelUr: 'دوسرے ملازم کو گاہک تفویض کرنا',
        descEn: 'Change recovery officer assignments for overdue cases',
        descUr: 'نا دہندہ گاہک کی فائل دوسرے آفیسر کو سونپنا',
      },
    ],
  },
  {
    moduleKey: 'module_staff',
    labelEn: 'Staff Governance & Salaries',
    labelUr: 'سٹاف مینجمنٹ و تنخواہیں',
    descEn: 'Manage employees, salaries, logins, and payroll slips',
    descUr: 'ملازمین کے لاگ ان، تنخواہوں کی ادائیگی اور سلپس',
    subActions: [
      {
        key: 'action_edit_salary',
        parentModule: 'module_staff',
        isModule: false,
        labelEn: 'Set / Edit Staff Salaries',
        labelUr: 'تنخواہ کی رقم طے / تبدیل کرنا',
        descEn: 'Modify monthly base pay and employee designation',
        descUr: 'ملازم کی ماہانہ تنخواہ اور عہدہ تبدیل کرنا',
      },
      {
        key: 'action_pay_salary',
        parentModule: 'module_staff',
        isModule: false,
        labelEn: 'Disburse Salary & Print Slip',
        labelUr: 'تنخواہ ادا کرنا و سیلری سلپ پرنٹ',
        descEn: 'Execute payroll payments and generate pay slips',
        descUr: 'ماہانہ تنخواہ کی ادائیگی اور پرنٹ سلپ جاری کرنا',
      },
    ],
  },
  {
    moduleKey: 'module_reports',
    labelEn: 'Reports & Executive Business Audit',
    labelUr: 'رپورٹس اور ماہانہ ایگزیکٹو آڈٹ',
    descEn: 'Access financial charts, collection summaries, and PDF audits',
    descUr: 'مالیاتی خلاصہ، کارکردگی چارٹس اور سرکاری پی ڈی ایف آڈٹ',
    subActions: [
      {
        key: 'action_view_monthly_audit',
        parentModule: 'module_reports',
        isModule: false,
        labelEn: 'View Full Monthly Audit',
        labelUr: 'ماہانہ مکمل ایگزیکٹو آڈٹ دیکھنا',
        descEn: 'Inspect comprehensive stock, sales, salaries & cash flow',
        descUr: 'اسٹاک، فروخت، تنخواہوں اور نقد بہاؤ کی تفصیلی رپورٹ',
      },
      {
        key: 'action_download_audit_pdf',
        parentModule: 'module_reports',
        isModule: false,
        labelEn: 'Download / Print Official PDF Report',
        labelUr: 'سرکاری پی ڈی ایف ڈاؤن لوڈ / پرنٹ کرنا',
        descEn: 'Export official stamped A4 business report for any month',
        descUr: 'مہر اور دستخط شدہ مکمل دفتری پی ڈی ایف حاصل کرنا',
      },
    ],
  },
  {
    moduleKey: 'module_calculator',
    labelEn: 'Installment Calculator',
    labelUr: 'اقساط و نفع کیلکولیٹر',
    descEn: 'Calculate monthly plans, profit margins, and down payments',
    descUr: 'ماہانہ اقساط، نفع شرح اور ایڈوانس کا فوری حساب کتاب',
    subActions: [],
  },
];

/**
 * Get role default permissions array (includes both module keys and sub-actions)
 */
export function getDefaultPermissionsForRole(role: UserRole): string[] {
  if (role === 'owner') {
    return ['all'];
  }

  if (role === 'manager') {
    return [
      // Modules
      'module_dashboard',
      'module_pos',
      'module_customers',
      'module_contracts',
      'module_installments',
      'module_payments',
      'module_products',
      'module_inventory',
      'module_suppliers',
      'module_purchases',
      'module_expenses',
      'module_recovery',
      'module_reports',
      'module_staff',
      'module_calculator',
      // Sub-actions
      'action_create_cash_sale',
      'action_create_installment_sale',
      'action_grant_discount',
      'action_add_customer',
      'action_edit_customer',
      'action_view_contracts',
      'action_collect_payment',
      'action_print_receipt',
      'action_add_product',
      'action_edit_product',
      'action_mark_damaged_stock',
      'action_record_purchase',
      'action_record_expense',
      'action_record_visit_proof',
      'action_reassign_recovery',
      'action_view_monthly_audit',
      'action_download_audit_pdf',
      // Legacy compatibility
      'manage_products',
      'manage_inventory',
      'view_reports',
      'assign_recovery',
      'can_manage_staff',
      'grant_discounts',
    ];
  }

  if (role === 'accountant') {
    return [
      // Modules
      'module_dashboard',
      'module_contracts',
      'module_customers',
      'module_installments',
      'module_payments',
      'module_expenses',
      'module_reports',
      'module_calculator',
      // Sub-actions
      'action_view_contracts',
      'action_collect_payment',
      'action_reverse_payment',
      'action_print_receipt',
      'action_record_expense',
      'action_approve_expense',
      'action_pay_salary',
      'action_view_monthly_audit',
      'action_download_audit_pdf',
      // Legacy compatibility
      'view_financial_reports',
      'record_expenses',
      'request_reversals',
      'view_contracts',
      'view_customers',
    ];
  }

  if (role === 'recovery') {
    return [
      // Modules
      'module_recovery',
      'module_calculator',
      // Sub-actions
      'action_collect_payment',
      'action_record_visit_proof',
      // Legacy compatibility
      'assigned_collections',
    ];
  }

  return [];
}

/**
 * Checks hierarchy rules:
 * - Owner can edit any staff member
 * - Manager can only edit Recovery Officers and subordinate staff (NOT Owner or Accountant)
 * - Accountant can inspect subordinate recovery collections
 */
export function canActorManageTarget(
  actorRole: UserRole,
  targetRole: UserRole
): boolean {
  if (actorRole === 'owner') return true;
  if (actorRole === 'manager') {
    return targetRole === 'recovery';
  }
  return false;
}
