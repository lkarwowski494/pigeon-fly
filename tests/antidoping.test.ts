/**
 * Unit tests for FCI & PZHGP Antidoping Guard (Z-304, BR-ZDR-009)
 */

import {
  detectSubstanceInProduct,
  checkAntidopingClearance,
  validateBasketingAntidoping,
  getDetoxRecommendation,
  FCI_SUBSTANCES_REGISTRY,
} from '../src/domain/antidoping';
import { HealthLog } from '../src/domain/types';

describe('Antidoping Guard — Substance Detection', () => {
  test('correctly identifies brand and INN names', () => {
    const baytril = detectSubstanceInProduct('Baytril 10% roztwór');
    expect(baytril).not.toBeNull();
    expect(baytril?.name).toBe('Enrofloksacyna');
    expect(baytril?.category).toBe('antibiotic');

    const metacam = detectSubstanceInProduct('Metacam krople przeciwbólowe');
    expect(metacam?.name).toBe('Meloksykam');
    expect(metacam?.category).toBe('nsaid');

    const ventipulmin = detectSubstanceInProduct('Ventipulmin granulat');
    expect(ventipulmin?.name).toBe('Klenbuterol');
    expect(ventipulmin?.category).toBe('beta2_agonist');
    expect(ventipulmin?.fciClassification).toBe('strictly_banned');

    const dexa = detectSubstanceInProduct('Zastrzyk z deksametazonu');
    expect(dexa?.name).toBe('Deksametazon');
    expect(dexa?.category).toBe('corticosteroid');

    const tricho = detectSubstanceInProduct('Tricho Plus saszetki');
    expect(tricho?.name).toBe('Ronidazol');
  });

  test('returns null for natural/safe supplements', () => {
    expect(detectSubstanceInProduct('Herbatka ziołowa dla gołębi')).toBeNull();
    expect(detectSubstanceInProduct('Elektrolit z glukozą')).toBeNull();
    expect(detectSubstanceInProduct('Drożdże piwne')).toBeNull();
  });

  test('registry covers key FCI substances', () => {
    expect(FCI_SUBSTANCES_REGISTRY.length).toBeGreaterThanOrEqual(10);
    const hasAnabolics = FCI_SUBSTANCES_REGISTRY.some((s) => s.category === 'anabolic_steroid');
    const hasCortico = FCI_SUBSTANCES_REGISTRY.some((s) => s.category === 'corticosteroid');
    expect(hasAnabolics).toBe(true);
    expect(hasCortico).toBe(true);
  });
});

describe('Antidoping Guard — Clearance Calculation', () => {
  test('approves pigeon with no health logs', () => {
    const result = checkAntidopingClearance({
      pigeonId: 'p-01',
      healthLogs: [],
      raceDate: '2026-06-01',
    });

    expect(result.status).toBe('eligible');
    expect(result.isClearForRace).toBe(true);
    expect(result.violationsCount).toBe(0);
    expect(result.activeViolations).toHaveLength(0);
  });

  test('blocks basketing when treatment is within active withdrawal window', () => {
    const logs: HealthLog[] = [
      {
        id: 'hl-01',
        loftId: 'l-01',
        pigeonId: 'p-01',
        eventType: 'treatment',
        date: '2026-05-25',
        productName: 'Metacam (meloksykam)',
        withdrawalDays: 7, // clears on 2026-06-01
        createdAt: '',
        updatedAt: '',
      },
    ];

    // Race on 2026-05-28 (3 days after treatment, 4 days remaining)
    const result = checkAntidopingClearance({
      pigeonId: 'p-01',
      healthLogs: logs,
      raceDate: '2026-05-28',
    });

    expect(result.status).toBe('prohibited');
    expect(result.isClearForRace).toBe(false);
    expect(result.violationsCount).toBe(1);
    expect(result.activeViolations[0].substanceName).toBe('Meloksykam');
    expect(result.activeViolations[0].daysRemaining).toBe(4);
    expect(result.safestBasketingDate).toBe('2026-06-01');
    expect(result.summaryMessage).toContain('AKTYWNA KARENCJA');
  });

  test('allows basketing when withdrawal window has passed', () => {
    const logs: HealthLog[] = [
      {
        id: 'hl-01',
        loftId: 'l-01',
        pigeonId: 'p-01',
        eventType: 'treatment',
        date: '2026-05-10',
        productName: 'Metacam',
        withdrawalDays: 7, // cleared on 2026-05-17
        createdAt: '',
        updatedAt: '',
      },
    ];

    // Race on 2026-05-20 (10 days after administration)
    const result = checkAntidopingClearance({
      pigeonId: 'p-01',
      healthLogs: logs,
      raceDate: '2026-05-20',
    });

    expect(result.status).toBe('eligible');
    expect(result.isClearForRace).toBe(true);
    expect(result.violationsCount).toBe(0);
  });

  test('flock-level treatments apply to all birds', () => {
    const logs: HealthLog[] = [
      {
        id: 'hl-flock',
        loftId: 'l-01',
        pigeonId: undefined, // Flock-level water cure
        eventType: 'treatment',
        date: '2026-05-26',
        productName: 'Tricho Plus (ronidazol)',
        withdrawalDays: 5, // clears 2026-05-31
        createdAt: '',
        updatedAt: '',
      },
    ];

    const result = checkAntidopingClearance({
      pigeonId: 'p-99', // Any bird from the flock
      healthLogs: logs,
      raceDate: '2026-05-28',
    });

    expect(result.isClearForRace).toBe(false);
    expect(result.activeViolations[0].productName).toContain('Tricho Plus');
  });

  test('identifies strictly banned doping substances and issues high-level warning', () => {
    const logs: HealthLog[] = [
      {
        id: 'hl-dop',
        loftId: 'l-01',
        pigeonId: 'p-01',
        eventType: 'treatment',
        date: '2026-05-20',
        productName: 'Dexasone (deksametazon)',
        withdrawalDays: 21,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const result = checkAntidopingClearance({
      pigeonId: 'p-01',
      healthLogs: logs,
      raceDate: '2026-05-28',
    });

    expect(result.isClearForRace).toBe(false);
    expect(result.activeViolations[0].isStrictlyBanned).toBe(true);
    expect(result.summaryMessage).toContain('ZAKAZ KOSZOWANIA (DOPING FCI)');
  });
});

describe('Antidoping Guard — Basketing Validation & Detox Recommendations', () => {
  test('validateBasketingAntidoping returns error message on active violation', () => {
    const logs: HealthLog[] = [
      {
        id: 'hl-02',
        loftId: 'l-01',
        pigeonId: 'p-01',
        eventType: 'treatment',
        date: '2026-06-01',
        productName: 'Baytril',
        withdrawalDays: 7,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const val = validateBasketingAntidoping('p-01', 'PL-0284-23-1402', logs, '2026-06-03');
    expect(val.isAllowed).toBe(false);
    expect(val.errorMessage).toContain('BLOKADA ANTYDOPINGOWA FCI');
    expect(val.errorMessage).toContain('PL-0284-23-1402');
    expect(val.clearanceDate).toBe('2026-06-08');
  });

  test('validateBasketingAntidoping succeeds when safe', () => {
    const val = validateBasketingAntidoping('p-01', 'PL-0284-23-1402', [], '2026-06-03');
    expect(val.isAllowed).toBe(true);
    expect(val.errorMessage).toBeUndefined();
  });

  test('getDetoxRecommendation provides targeted protocols', () => {
    const steroidDetox = getDetoxRecommendation('corticosteroid');
    expect(steroidDetox.protocolName).toContain('Hepatologiczny');
    expect(steroidDetox.supplements).toContain('Sedochol (cholina + metionina) 10 ml / 1 L wody');

    const abDetox = getDetoxRecommendation('antibiotic');
    expect(abDetox.protocolName).toContain('Mikrobiomu');
    expect(abDetox.durationDays).toBe(5);

    const protoDetox = getDetoxRecommendation('antiprotozoal');
    expect(protoDetox.durationDays).toBe(3);
  });
});
