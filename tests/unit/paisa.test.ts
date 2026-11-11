import { describe, it, expect } from 'vitest';
import {
  rupeesToPaisa,
  paisaToRupees,
  addPaisa,
  subtractPaisa,
  formatPKR,
} from '@/domain/money/paisa';

describe('Domain: Money & Paisa Arithmetic', () => {
  it('correctly converts rupees to integer paisa without floating point bugs', () => {
    expect(rupeesToPaisa(1500)).toBe(150000);
    expect(rupeesToPaisa('2,500.50')).toBe(250050);
    expect(rupeesToPaisa(0.1 + 0.2)).toBe(30); // Classic JS 0.30000000000000004 bug prevented!
  });

  it('correctly converts paisa back to rupees', () => {
    expect(paisaToRupees(150000)).toBe(1500);
    expect(paisaToRupees(250050)).toBe(2500.5);
  });

  it('accurately adds and subtracts paisa amounts', () => {
    const total = addPaisa(10000, 20050, 50000);
    expect(total).toBe(80050);

    const balance = subtractPaisa(100000, 45000);
    expect(balance).toBe(55000);
  });

  it('formats PKR properly in English and Urdu', () => {
    const formattedEn = formatPKR(1500000, { locale: 'en' });
    expect(formattedEn).toContain('Rs.');
    expect(formattedEn).toContain('15,000');

    const formattedUr = formatPKR(1500000, { locale: 'ur' });
    expect(formattedUr).toContain('روپے');
  });
});

