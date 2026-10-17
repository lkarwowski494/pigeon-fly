/**
 * Tests for Pigeon-Fly Winter Rest & Vaccination Schedule Engine (Z-058)
 */

import {
  calculateWinterDietFormula,
  generateWinterSchedulePlan,
  WINTER_PHASES,
} from '../src/domain/winterSchedule';

describe('Winter Rest & Vaccination Schedule Generator (Z-058)', () => {
  describe('Thermal Winter Diet Modulation', () => {
    it('formulates high-energy diet with increased fat and corn during severe frost (< -5°C)', () => {
      const diet = calculateWinterDietFormula(-10);

      expect(diet.barleyPercent).toBe(35);
      expect(diet.cornPercent).toBe(25);
      expect(diet.fatSeedsPercent).toBe(15);
      expect(diet.dailyGramsPerBird).toBe(36);
      expect(diet.dietName).toContain('Mrozowa');
    });

    it('formulates balanced 50% barley resting diet during normal winter (-5°C to +5°C)', () => {
      const diet = calculateWinterDietFormula(0);

      expect(diet.barleyPercent).toBe(50);
      expect(diet.wheatPercent).toBe(20);
      expect(diet.cornPercent).toBe(18);
      expect(diet.dailyGramsPerBird).toBe(32);
      expect(diet.drinkerAdditions).toContain('Ocet jabłkowy 5% (1 łyżka/litr)');
    });

    it('formulates strict 65% barley detox diet during mild thaw (> 5°C) to prevent obesity', () => {
      const diet = calculateWinterDietFormula(8);

      expect(diet.barleyPercent).toBe(65);
      expect(diet.legumesPercent).toBe(0);
      expect(diet.dailyGramsPerBird).toBe(28);
      expect(diet.dietName).toContain('Oczyszczająca');
    });
  });

  describe('Winter Timeline & Vaccination Milestones', () => {
    it('computes chronological milestones backwards from spring pairing date', () => {
      const plan = generateWinterSchedulePlan({
        targetPairingDate: '2027-02-20',
        outdoorTemperatureCelsius: -2,
        hasHeatedBreedingSection: true,
      });

      expect(plan.targetPairingDate).toBe('2027-02-20');
      expect(plan.milestones.length).toBe(8);

      // Pairing day is day 0
      const pairing = plan.milestones.find((m) => m.category === 'pairing');
      expect(pairing?.targetDate).toBe('2027-02-20');

      // Coproscopy at -42 days (Jan 9, 2027)
      const coproscopy = plan.milestones.find((m) => m.category === 'lab');
      expect(coproscopy?.daysBeforePairing).toBe(42);

      // Salmonella vaccine at -28 days (Jan 23, 2027)
      const salmonella = plan.milestones.find((m) => m.title.includes('Salmonellozie'));
      expect(salmonella?.daysBeforePairing).toBe(28);

      // PMV-1 vaccine at -14 days (Feb 6, 2027)
      const pmv = plan.milestones.find((m) => m.title.includes('PMV-1'));
      expect(pmv?.daysBeforePairing).toBe(14);

      // Guaranteed 14-day gap between salmonella and PMV-1 vaccines
      if (salmonella && pmv) {
        const gap = salmonella.daysBeforePairing - pmv.daysBeforePairing;
        expect(gap).toBe(14);
      }
    });

    it('flags safety warning when attempting January pairing without heated nest boxes', () => {
      const plan = generateWinterSchedulePlan({
        targetPairingDate: '2027-01-15',
        hasHeatedBreedingSection: false,
      });

      expect(plan.safetyWarnings.length).toBeGreaterThan(0);
      expect(plan.safetyWarnings[0]).toContain('ogrzewania');
    });

    it('contains valid definitions for all biological winter phases', () => {
      expect(WINTER_PHASES.separation.id).toBe('separation');
      expect(WINTER_PHASES.deep_rest.id).toBe('deep_rest');
      expect(WINTER_PHASES.pre_breeding_prep.id).toBe('pre_breeding_prep');

      expect(WINTER_PHASES.deep_rest.keyRules.length).toBeGreaterThanOrEqual(3);
    });
  });
});
