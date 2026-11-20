// ============================================================================
// Shared Component: MoneyDisplay (Formats integer paisa into formatted PKR)
// ============================================================================

import React from 'react';
import { formatPKR } from '@/domain/money/paisa';
import { useI18n } from '@/i18n/I18nContext';

interface MoneyDisplayProps {
  paisa: number;
  className?: string;
  showCurrencySymbol?: boolean;
  style?: React.CSSProperties;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  paisa,
  className = '',
  showCurrencySymbol = true,
  style,
}) => {
  const { language } = useI18n();
  const formatted = formatPKR(paisa, {
    locale: language,
    showCurrencySymbol,
    useUrduNumerals: language === 'ur',
  });

  return <span className={`font-medium ${className}`} style={{ whiteSpace: 'nowrap', ...style }}>{formatted}</span>;
};

