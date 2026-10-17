/**
 * PIGEON-FLY — Testy Jednostkowe Asystenta Aerodynamiki i Biomechaniki Skrzydła (Z-064)
 */

import {
  calculateWingAerodynamics,
  simulatePairAerodynamics,
  WingBiometrics,
} from '../src/domain/wingAerodynamics';

describe('Wing Aerodynamics & Biomechanical Breeding Engine (Z-064)', () => {
  const marathonCockBiometrics: WingBiometrics = {
    pigeonRing: 'PL-0284-22-1001',
    pigeonSex: 'cock',
    wingspanCm: 72,
    wingAreaCm2: 600, // AR = 72^2 / 600 = 5184 / 600 = 8.64
    wingtipSlotDegree: 5,
    camberType: 'DEEP',
    forearmLeverRatio: 0.78,
    primaryFeatherRigidity: 5,
  };

  const sprintHenBiometrics: WingBiometrics = {
    pigeonRing: 'PL-0284-23-2002',
    pigeonSex: 'hen',
    wingspanCm: 68,
    wingAreaCm2: 620, // AR = 68^2 / 620 = 4624 / 620 = 7.46
    wingtipSlotDegree: 3,
    camberType: 'FLAT',
    forearmLeverRatio: 0.85,
    primaryFeatherRigidity: 4,
  };

  describe('Single Wing Aerodynamic Analysis', () => {
    it('computes correct Aspect Ratio and identifies High Aspect marathon wing', () => {
      const profile = calculateWingAerodynamics(marathonCockBiometrics);

      expect(profile.aspectRatio).toBe(8.64);
      expect(profile.aspectRatioCategory).toBe('HIGH_ASPECT');
      expect(profile.specialty).toBe('MARATHON_M');
      expect(profile.headwindScore).toBeGreaterThanOrEqual(80);
      expect(profile.inducedDragIndex).toBeLessThanOrEqual(50);
    });

    it('computes correct Aspect Ratio and identifies Low Aspect sprint wing', () => {
      const profile = calculateWingAerodynamics(sprintHenBiometrics);

      expect(profile.aspectRatio).toBe(7.46);
      expect(profile.aspectRatioCategory).toBe('LOW_ASPECT');
      expect(profile.specialty).toBe('SPRINT_A');
      expect(profile.tailwindScore).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Biomechanical Breeding Pair Mating Simulator', () => {
    it('awards EXCELLENT for compensatory Sprint x Marathon pairing', () => {
      const result = simulatePairAerodynamics(marathonCockBiometrics, sprintHenBiometrics);

      expect(result.breedingRecommendation).toBe('EXCELLENT');
      expect(result.complementarityScore).toBeGreaterThanOrEqual(85);
      expect(result.predictedOffspringAspectRatio).toBe(8.05);
      expect(result.predictedSpecialty).toBe('MIDDLE_B');
      expect(result.recommendationReason).toContain('Wzorcowe kojarzenie kompensacyjne');
    });

    it('identifies elite marathon synergy when both partners have High Aspect wings', () => {
      const marathonHen: WingBiometrics = {
        ...marathonCockBiometrics,
        pigeonRing: 'PL-0284-21-9988',
        pigeonSex: 'hen',
        wingspanCm: 71,
        wingAreaCm2: 590, // AR = 71^2 / 590 = 5041 / 590 = 8.54
      };

      const result = simulatePairAerodynamics(marathonCockBiometrics, marathonHen);

      expect(result.breedingRecommendation).toBe('EXCELLENT');
      expect(result.complementarityScore).toBeGreaterThanOrEqual(90);
      expect(result.predictedSpecialty).toBe('MARATHON_M');
      expect(result.recommendationReason).toContain('kojarzenie maratońskie');
    });

    it('flags CAUTION when pairing two low aspect sprinters due to drag risk', () => {
      const sprintCock: WingBiometrics = {
        ...sprintHenBiometrics,
        pigeonRing: 'PL-0284-23-4411',
        pigeonSex: 'cock',
      };

      const result = simulatePairAerodynamics(sprintCock, sprintHenBiometrics);

      expect(result.breedingRecommendation).toBe('CAUTION');
      expect(result.complementarityScore).toBeLessThan(60);
      expect(result.recommendationReason).toContain('niskie wydłużenie');
    });

    it('penalizes pairing when both parents have poor wingtip slotting', () => {
      const poorSlotCock: WingBiometrics = {
        ...marathonCockBiometrics,
        wingtipSlotDegree: 1,
      };
      const poorSlotHen: WingBiometrics = {
        ...sprintHenBiometrics,
        wingtipSlotDegree: 2,
      };

      const result = simulatePairAerodynamics(poorSlotCock, poorSlotHen);

      expect(result.breedingRecommendation).toBe('NOT_RECOMMENDED');
      expect(result.recommendationReason).toContain('brak szczelin wentylacyjnych');
    });
  });
});
