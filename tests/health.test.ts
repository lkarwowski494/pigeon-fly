/**
 * Tests for Health Engine (PMV-1 vaccination compliance and drug withdrawal guard)
 */

import {
  checkWithdrawalPeriod,
  validateParamyxoVaccination,
  evaluateYpdsRisk,
  evaluateCoproscopy,
  getVeterinaryCalendarMonth,
  getAnnualVeterinaryCalendar,
} from '../src/domain/health';
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

describe('Health Engine — YPDS (Adeno-Coli) Clinical Diagnostic & Triage (BR-ZDR-010, RD-27)', () => {
  test('evaluates healthy bird with zero symptoms', () => {
    const assessment = evaluateYpdsRisk({ symptoms: [], isYoungBird: true });
    expect(assessment.riskLevel).toBe('none');
    expect(assessment.isEmergency).toBe(false);
    expect(assessment.quarantineRequired).toBe(false);
    expect(assessment.recommendedProtocols).toHaveLength(0);
  });

  test('flags acute Adeno-Coli emergency when young bird presents crop stasis and green diarrhea', () => {
    const assessment = evaluateYpdsRisk({
      symptoms: ['crop_stasis', 'green_mucoid_diarrhea', 'vomiting'],
      isYoungBird: true,
    });

    expect(assessment.riskLevel).toBe('acute');
    expect(assessment.isEmergency).toBe(true);
    expect(assessment.quarantineRequired).toBe(true);
    expect(assessment.contraindications).toContain(
      'BEZWZGLĘDNY ZAKAZ KOSZOWANIA na loty konkursowe i treningi!'
    );
    expect(assessment.recommendedProtocols.some((p) => p.title.includes('pH 4.0 - 4.2'))).toBe(true);
    expect(assessment.recommendedProtocols.some((p) => p.title.includes('Izolacja'))).toBe(true);
  });

  test('flags critical collapse when 4 or more symptoms are present in young bird', () => {
    const assessment = evaluateYpdsRisk({
      symptoms: ['crop_stasis', 'green_mucoid_diarrhea', 'vomiting', 'lethargy', 'rapid_weight_loss'],
      isYoungBird: true,
    });

    expect(assessment.riskLevel).toBe('critical');
    expect(assessment.isEmergency).toBe(true);
    expect(assessment.summary).toContain('KRYTYCZNE ZAGROŻENIE ŻYCIA');
  });
});

describe('Health Engine — Koproskopia & Parasitological Assessment (BR-ZDR-008, Z-306)', () => {
  test('recommends natural therapy without chemical coccidiostats for mild coccidia (+)', () => {
    const evaluation = evaluateCoproscopy({
      coccidia: 'mild',
      nematodesPresent: false,
      capillariaPresent: false,
      trichomonas: 'negative',
    });

    expect(evaluation.overallHealthStatus).toBe('mild_infestation');
    expect(evaluation.requiresChemicalMedication).toBe(false);
    expect(evaluation.requiresLoftDisinfection).toBe(false);
    expect(evaluation.recommendations[0].isChemical).toBe(false);
    expect(evaluation.recommendations[0].protocol).toContain('octem jabłkowym');
  });

  test('requires chemical treatment and torch disinfection when heavy coccidia or nematodes are found', () => {
    const evaluation = evaluateCoproscopy({
      coccidia: 'heavy',
      nematodesPresent: true,
      capillariaPresent: false,
      trichomonas: 'mild',
    });

    expect(evaluation.overallHealthStatus).toBe('treatment_required');
    expect(evaluation.requiresChemicalMedication).toBe(true);
    expect(evaluation.requiresLoftDisinfection).toBe(true);
    expect(evaluation.recommendations.some((r) => r.target.includes('Glistnica'))).toBe(true);
    expect(evaluation.recommendations.some((r) => r.target.includes('Kokcydioza'))).toBe(true);
  });
});

describe('Health Engine — 12-Month Veterinary Calendar (BR-ZDR-008)', () => {
  test('returns all 12 calendar months with key seasonal actions', () => {
    const calendar = getAnnualVeterinaryCalendar();
    expect(calendar).toHaveLength(12);
    expect(calendar[0].monthName).toBe('Styczeń');
    expect(calendar[0].mandatoryVaccinations).toContain('PMV-1 (Paramyxo)');
    expect(calendar[5].monthName).toBe('Czerwiec');
    expect(calendar[5].keyActions.some((a) => a.includes('Verdunkelung'))).toBe(true);
  });

  test('retrieves single month by index safely', () => {
    const may = getVeterinaryCalendarMonth(5);
    expect(may.monthName).toBe('Maj');
    expect(may.seasonFocus).toContain('Rozpoczęcie lotów');
    expect(may.recommendedDiagnostics).toContain('Triage YPDS');
  });
});

