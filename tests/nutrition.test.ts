/**
 * Tests for Nutrition & Supplementation Protocols Engine
 */

import { getFeedingProtocol, AnnualLoftPhase } from '../src/domain/nutrition';

describe('Nutrition Engine — Master Loft Protocols', () => {
  const phases: AnnualLoftPhase[] = [
    'racing_widowhood',
    'breeding_reproduction',
    'autumn_moult',
    'winter_rest',
  ];

  test('provides valid weekly schedule for all 4 biological phases', () => {
    for (const phase of phases) {
      const protocol = getFeedingProtocol(phase);
      expect(protocol.phase).toBe(phase);
      expect(protocol.phaseName).toBeDefined();
      expect(protocol.criticalMinerals.length).toBeGreaterThan(0);

      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      for (const d of days) {
        const plan = protocol.weeklySchedule[d];
        expect(plan).toBeDefined();
        expect(plan.morningFeed).toBeDefined();
        expect(plan.eveningFeed).toBeDefined();
        expect(plan.profile.proteinPct).toBeGreaterThan(5);
        expect(plan.profile.fatPct).toBeGreaterThan(1);
        expect(plan.profile.recommendedGramsPerBird).toBeGreaterThan(15);
      }
    }
  });

  test('breeding diet has high protein (≥ 18%) for rapid chick growth', () => {
    const protocol = getFeedingProtocol('breeding_reproduction');
    expect(protocol.weeklySchedule.mon.profile.proteinPct).toBeGreaterThanOrEqual(18.0);
  });

  test('racing diet increases fat profile before basketing (Thursday/Friday)', () => {
    const protocol = getFeedingProtocol('racing_widowhood');
    const monFat = protocol.weeklySchedule.mon.profile.fatPct;
    const thuFat = protocol.weeklySchedule.thu.profile.fatPct;

    // Fat loading for energy before flight
    expect(thuFat).toBeGreaterThan(monFat * 2);
  });

  test('moult diet includes methionine and sulfur-rich supplements', () => {
    const protocol = getFeedingProtocol('autumn_moult');
    const mondayWater = protocol.weeklySchedule.mon.waterSupplements.join(' ');
    expect(mondayWater.toLowerCase()).toContain('metionina');
  });
});
