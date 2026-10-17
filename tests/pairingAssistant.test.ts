/**
 * Test Suite: Intelligent Pairing & Genetic Breeding Assistant Engine (Z-052)
 * Verifies calculation of pairing compatibility score, conformation compensation,
 * Wright's inbreeding F thresholds, and AI recommendations.
 */

import {
  evaluateBreedingPair,
  BreederBirdProfile,
} from '../src/domain/pairingAssistant';

describe('Intelligent Pairing & Breeding Assistant Domain Engine (Z-052)', () => {
  const eliteCock: BreederBirdProfile = {
    id: 'p-cock-01',
    ringNumber: 'PL-0284-21-1402',
    name: 'Super Crack 02',
    sex: 'cock',
    bloodline: 'Gaby Vandenabeele',
    conformation: {
      forearm: 'short',
      primaryFlights: 'long_ventilated',
      muscle: 'fibrillar_supple',
      ventBones: 'tight_rock_hard',
      eyeCircle: 'full_360',
    },
    raceSpecialty: 'middle_B',
    totalPrizesWon: 24,
    fciAcePoints: 92,
  };

  const eliteHen: BreederBirdProfile = {
    id: 'p-hen-01',
    ringNumber: 'BE-22-6012345',
    name: 'Golden Lady',
    sex: 'hen',
    bloodline: 'Gaby Vandenabeele',
    conformation: {
      forearm: 'medium',
      primaryFlights: 'long_ventilated',
      muscle: 'fibrillar_supple',
      ventBones: 'tight_rock_hard',
      eyeCircle: 'full_360',
    },
    raceSpecialty: 'middle_B',
    totalPrizesWon: 18,
    fciAcePoints: 88,
  };

  it('classifies ideal pair with optimal linebreeding as elite champion (>= 90 pts)', () => {
    // 6.25% inbreeding F (grandfather x granddaughter)
    const result = evaluateBreedingPair(eliteCock, eliteHen, {
      calculatedInbreedingF: 0.0625,
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.tier).toBe('elite_champion');
    expect(result.inbreedingEvaluation).toContain('Optymalny Inbred Liniowy');
    expect(result.isHighInbreedingRisk).toBe(false);
    expect(result.compensationHighlights.some((h) => h.includes('Kompensacja skrzydła'))).toBe(true);
  });

  it('penalizes pairing when both birds possess heavy stiff muscle tone', () => {
    const heavyCock: BreederBirdProfile = {
      ...eliteCock,
      conformation: {
        ...eliteCock.conformation,
        muscle: 'heavy_stiff',
      },
    };

    const heavyHen: BreederBirdProfile = {
      ...eliteHen,
      conformation: {
        ...eliteHen.conformation,
        muscle: 'heavy_stiff',
      },
    };

    const result = evaluateBreedingPair(heavyCock, heavyHen, {
      calculatedInbreedingF: 0.0,
    });

    expect(result.overallScore).toBeLessThan(90);
    expect(result.compensationHighlights.some((h) => h.includes('podwójne ciężkie mięśnie'))).toBe(true);
  });

  it('flags extreme inbreeding risk when F exceeds 20%', () => {
    const result = evaluateBreedingPair(eliteCock, eliteHen, {
      calculatedInbreedingF: 0.25, // 25% (brother x sister)
    });

    expect(result.isHighInbreedingRisk).toBe(true);
    expect(result.inbreedingEvaluation).toContain('Ekstremalny Inbred');
    expect(result.breakdown.geneticDiversityScore).toBeLessThanOrEqual(15);
  });

  it('correctly maps Sprint x Marathon cross to Modern Middle Distance target', () => {
    const sprintCock: BreederBirdProfile = {
      ...eliteCock,
      raceSpecialty: 'sprint_A',
    };

    const marathonHen: BreederBirdProfile = {
      ...eliteHen,
      raceSpecialty: 'marathon_M',
    };

    const result = evaluateBreedingPair(sprintCock, marathonHen, {
      calculatedInbreedingF: 0.0,
    });

    expect(result.targetCategoryRecommended).toContain('Średni Dystans');
    expect(result.compensationHighlights.some((h) => h.includes('Sprint x Maraton'))).toBe(true);
  });

  it('penalizes cock with weak wide vent bones', () => {
    const weakCock: BreederBirdProfile = {
      ...eliteCock,
      conformation: {
        ...eliteCock.conformation,
        ventBones: 'weak_wide',
      },
    };

    const result = evaluateBreedingPair(weakCock, eliteHen, {
      calculatedInbreedingF: 0.0,
    });

    expect(result.compensationHighlights.some((h) => h.includes('luźne widełki'))).toBe(true);
  });
});
