/**
 * Tests for Health Engine (PMV-1 vaccination compliance and drug withdrawal guard)
 */

import { checkWithdrawalPeriod, validateParamyxoVaccination } from '../src/domain/health';
import { HealthLog } from '../src/domain/types';

describe('Health Engine — Drug Withdrawal Period (Karencja)', () => {
  test('detects active withdrawal period and days remaining', () => {
    const today = new Date('2026-06-10T12:00:00Z');
    const logs: HealthLog[] = [
      {
        id: 'h-1',
        loftId: 'l-1',
        pigeonId: 'p-01',
        eventType: 'antibiotic',
        date: '2026-06-05', // 5 days ago
        productName: 'Enrofloksacyna',
        withdrawalDays: 10, // 10 days withdrawal => clears on 2026-06-15
        createdAt: '',
        updatedAt: '',
      },
    ];

    const status = checkWithdrawalPeriod('p-01', logs, today);
    expect(status.isUnderWithdrawal).toBe(true);
    expect(status.daysRemaining).toBe(5);
    expect(status.activeMedications).toHaveLength(1);
    expect(status.activeMedications[0].productName).toBe('Enrofloksacyna');
  });

  test('clears withdrawal status after withdrawal days have elapsed', () => {
    const today = new Date('2026-06-20T12:00:00Z');
    const logs: HealthLog[] = [
      {
        id: 'h-1',
        loftId: 'l-1',
        pigeonId: 'p-01',
        eventType: 'antibiotic',
        date: '2026-06-05',
        productName: 'Enrofloksacyna',
        withdrawalDays: 10,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const status = checkWithdrawalPeriod('p-01', logs, today);
    expect(status.isUnderWithdrawal).toBe(false);
    expect(status.daysRemaining).toBe(0);
  });
});

describe('Health Engine — PMV-1 Paramyxovirus Vaccination', () => {
  test('rejects basketing if bird was vaccinated less than 21 days ago', () => {
    const basketDate = new Date('2026-05-10T12:00:00Z');
    const logs: HealthLog[] = [
      {
        id: 'v-1',
        loftId: 'l-1',
        eventType: 'vaccine',
        productName: 'Pharmavac Columbi 2 (PMV-1)',
        date: '2026-05-01', // 9 days ago
        withdrawalDays: 0,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const result = validateParamyxoVaccination('p-01', logs, basketDate);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('21 dniach');
  });

  test('accepts basketing when vaccination was performed between 21 and 365 days ago', () => {
    const basketDate = new Date('2026-05-10T12:00:00Z');
    const logs: HealthLog[] = [
      {
        id: 'v-1',
        loftId: 'l-1',
        eventType: 'vaccine',
        productName: 'Pharmavac Columbi 2 (PMV-1)',
        date: '2026-04-01', // ~39 days ago
        withdrawalDays: 0,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const result = validateParamyxoVaccination('p-01', logs, basketDate);
    expect(result.isValid).toBe(true);
    expect(result.lastVaccinatedDate).toBe('2026-04-01');
  });

  test('rejects basketing if vaccination is older than 365 days (expired)', () => {
    const basketDate = new Date('2026-05-10T12:00:00Z');
    const logs: HealthLog[] = [
      {
        id: 'v-1',
        loftId: 'l-1',
        eventType: 'vaccine',
        productName: 'Pharmavac Columbi 2 (PMV-1)',
        date: '2025-04-01', // >400 days ago
        withdrawalDays: 0,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const result = validateParamyxoVaccination('p-01', logs, basketDate);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('wygasła');
  });
});
