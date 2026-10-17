import {
  evaluatePostRaceDeficit,
  generatePostRaceRestitutionHtml,
  PostRaceDeficitInput,
} from '../src/domain/postRaceRestitution';

describe('PostRaceRestitution Domain (Z-077)', () => {
  test('evaluates mild post-race deficit correctly', () => {
    const input: PostRaceDeficitInput = {
      ringNumber: 'PL-0284-23-1402',
      normalWeightGrams: 420,
      returnWeightGrams: 405, // 15g loss = 3.6%
      raceDistanceKm: 220,
      flightDurationHours: 3.2,
      ambientTempC: 18,
    };

    const evaluation = evaluatePostRaceDeficit(input);

    expect(evaluation.massLossGrams).toBe(15);
    expect(evaluation.massLossPercent).toBe(3.6);
    expect(evaluation.estimatedFluidDeficitMl).toBe(11);
    expect(evaluation.severity).toBe('mild');
    expect(evaluation.phase1.solutionTonicity).toBe('hypotonic');
    expect(evaluation.phase2.recoveryEstimatedHours).toBe(24);
  });

  test('evaluates moderate deficit for 5-8% mass loss', () => {
    const input: PostRaceDeficitInput = {
      ringNumber: 'PL-0284-22-9854',
      normalWeightGrams: 420,
      returnWeightGrams: 392, // 28g loss = 6.7%
      raceDistanceKm: 420,
      flightDurationHours: 6.0,
      ambientTempC: 24,
    };

    const evaluation = evaluatePostRaceDeficit(input);

    expect(evaluation.massLossPercent).toBe(6.7);
    expect(evaluation.severity).toBe('moderate');
    expect(evaluation.phase1.targetOsmolalityMOsmKg).toBe(300); // Isotonic
    expect(evaluation.phase2.recoveryEstimatedHours).toBe(36);
  });

  test('evaluates severe deficit for > 8% loss in heat', () => {
    const input: PostRaceDeficitInput = {
      ringNumber: 'PL-0284-21-3001',
      normalWeightGrams: 420,
      returnWeightGrams: 380, // 40g loss = 9.5%
      raceDistanceKm: 600,
      flightDurationHours: 9.0,
      ambientTempC: 29,
    };

    const evaluation = evaluatePostRaceDeficit(input);

    expect(evaluation.massLossPercent).toBe(9.5);
    expect(evaluation.severity).toBe('severe');
    expect(evaluation.phase2.bcaaDosageGramsPerKgFeed).toBe(8.0);
    expect(evaluation.phase2.recoveryEstimatedHours).toBe(48);
  });

  test('evaluates critical exhaustion with blue breast skin and severe dehydration', () => {
    const input: PostRaceDeficitInput = {
      ringNumber: 'PL-0284-20-1001',
      normalWeightGrams: 420,
      returnWeightGrams: 365, // 55g loss = 13.1%
      raceDistanceKm: 850,
      flightDurationHours: 13.5,
      ambientTempC: 31,
      clinicalSigns: {
        blueBreastSkin: true,
        sunkenEyes: true,
        sharpKeel: true,
      },
    };

    const evaluation = evaluatePostRaceDeficit(input);

    expect(evaluation.severity).toBe('critical');
    expect(evaluation.clinicalRiskSummary.length).toBeGreaterThan(0);
    expect(evaluation.phase1.maxInitialIntakeMlPerBird).toBe(15); // Controlled small intake
    expect(evaluation.phase2.recoveryEstimatedHours).toBe(72);
    expect(evaluation.phase2.feedRecommendation).toContain('Zakaz twardej kukurydzy');
  });

  test('generatePostRaceRestitutionHtml produces valid printable report', () => {
    const input: PostRaceDeficitInput = {
      ringNumber: 'PL-0284-23-1402',
      normalWeightGrams: 420,
      returnWeightGrams: 388,
      raceDistanceKm: 450,
      flightDurationHours: 6.5,
      ambientTempC: 25,
      clinicalSigns: {
        blueBreastSkin: true,
      },
    };
    const evaluation = evaluatePostRaceDeficit(input);

    const html = generatePostRaceRestitutionHtml(evaluation, {
      loftName: 'Gołębnik Mistrza',
      raceName: 'Lot Narodowy Bruksela',
      seasonYear: 2026,
    });

    expect(html).toContain('PROTOKÓŁ BILANSU ELEKTROLITOWEGO');
    expect(html).toContain('PL-0284-23-1402');
    expect(html).toContain('Lot Narodowy Bruksela');
    expect(html).toContain('FAZA I: REHYDRATACJA');
    expect(html).toContain('FAZA II: RESTYTUCJA MIĘŚNIOWA');
    expect(html).toContain('BCAA');
  });
});
