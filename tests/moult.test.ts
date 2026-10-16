/**
 * Tests for Wing Moult Engine (10 flight feathers, ARI, and flight readiness)
 */

import { analyzeWingMoult } from '../src/domain/moult';
import { MoultLog } from '../src/domain/types';

describe('Moult Engine — 10 Primary Flight Feathers', () => {
  test('returns 100% ARI and fit status for fully intact wing', () => {
    const analysis = analyzeWingMoult('p-01', []);
    expect(analysis.annualRegenerationIndex).toBe(100.0);
    expect(analysis.droppedFeatherCount).toBe(0);
    expect(analysis.isFitForRacing).toBe(true);
    expect(analysis.feathers).toHaveLength(10);
  });

  test('detects unfitness when outer primary flight feather (#8) is dropped or regrowing < 60%', () => {
    const logs: MoultLog[] = [
      {
        id: '1',
        pigeonId: 'p-01',
        checkDate: '2026-09-01',
        primaryFeatherNumber: 8,
        status: 'regrowing',
        lengthPct: 40,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const analysis = analyzeWingMoult('p-01', logs);
    expect(analysis.isFitForRacing).toBe(false);
    expect(analysis.unfitnessReason).toBeDefined();
    expect(analysis.droppedFeatherCount).toBe(1);
    expect(analysis.currentDroppingFeather).toBe(8);
  });

  test('allows racing when inner feather (#1) has fully regrown', () => {
    const logs: MoultLog[] = [
      {
        id: '1',
        pigeonId: 'p-01',
        checkDate: '2026-06-01',
        primaryFeatherNumber: 1,
        status: 'full',
        lengthPct: 100,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const analysis = analyzeWingMoult('p-01', logs);
    expect(analysis.isFitForRacing).toBe(true);
    expect(analysis.annualRegenerationIndex).toBe(100.0);
  });
});

describe('Photoperiod Engine — Darkness (Verdunkelung) & Lighting', () => {
  const { getPhotoperiodStatus } = require('../src/domain/moult');

  test('activates Darkness System in April (14h dark / 10h light)', () => {
    const status = getPhotoperiodStatus(new Date('2026-04-15'));
    expect(status.systemType).toBe('darkness');
    expect(status.isActive).toBe(true);
    expect(status.darkHoursPerDay).toBe(14);
    expect(status.scheduleDescription).toContain('14h');
  });

  test('activates Lighting System in July (16h light)', () => {
    const status = getPhotoperiodStatus(new Date('2026-07-15'));
    expect(status.systemType).toBe('lighting');
    expect(status.isActive).toBe(true);
    expect(status.lightHoursPerDay).toBe(16);
  });

  test('returns natural photoperiod in December during winter rest', () => {
    const status = getPhotoperiodStatus(new Date('2026-12-15'));
    expect(status.systemType).toBe('natural');
    expect(status.isActive).toBe(false);
  });
});
