// ============================================================================
// Shared Component: StatusBadge
// ============================================================================

import React from 'react';
import { useI18n } from '@/i18n/I18nContext';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { language } = useI18n();

  const getBadgeClass = (s: string) => {
    switch (s) {
      case 'active':
      case 'posted':
      case 'paid':
      case 'fully_paid':
      case 'valid':
        return 'badge-success';
      case 'due':
      case 'partially_paid':
      case 'trial':
      case 'upcoming':
        return 'badge-warning';
      case 'overdue':
      case 'cancelled':
      case 'reversed':
      case 'blocked':
        return 'badge-danger';
      case 'draft':
      default:
        return 'badge-slate';
    }
  };

  const getLabel = (s: string) => {
    if (language === 'ur') {
      const urduLabels: Record<string, string> = {
        active: 'فعال',
        paid: 'ادا شدہ',
        fully_paid: 'مکمل ادا شدہ',
        partially_paid: 'جزوی ادا',
        overdue: 'تاخیر شدہ (واجب)',
        due: 'واجب الادا',
        upcoming: 'آئندہ قسط',
        draft: 'ڈرافٹ',
        cancelled: 'منسوخ',
        reversed: 'ریورس شدہ',
        posted: 'درج شدہ',
      };
      return urduLabels[s] || s;
    }

    const englishLabels: Record<string, string> = {
      active: 'Active',
      paid: 'Paid',
      fully_paid: 'Fully Paid',
      partially_paid: 'Partially Paid',
      overdue: 'Overdue',
      due: 'Due',
      upcoming: 'Upcoming',
      draft: 'Draft',
      cancelled: 'Cancelled',
      reversed: 'Reversed',
      posted: 'Posted',
    };
    return englishLabels[s] || s.replace('_', ' ').toUpperCase();
  };

  return <span className={`badge ${getBadgeClass(status)}`}>{getLabel(status)}</span>;
};

