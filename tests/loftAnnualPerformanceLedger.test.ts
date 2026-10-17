import {
  LoftAnnualPerformanceLedger,
  calculateBasketingEfficiency,
  calculateBreedingMetrics,
  calculateFlockSurvivalRate,
  evaluateSeasonGrade,
  validateAnnualPerformanceLedger,
  generateLoftAnnualPerformanceLedgerHtml,
} from '../src/domain/loftAnnualPerformanceLedger';

describe('LoftAnnualPerformanceLedger Domain (Z-100 / DEC-114 Jubileuszowy)', () => {
  const validLedger: LoftAnnualPerformanceLedger = {
    id: 'ledger-2026-001',
    seasonYear: 2026,
    loftName: 'Mistrzowski Gołębnik Szmaragd',
    breederName: 'Łukasz Kowalski',
    breederPzhgpNumber: 'PL-0284-1234',
    sectionName: 'Sekcja 1 Gostyń',
    branchNumber: '0284',
    branchName: 'Gostyń',
    districtName: 'Okręg Poznań',
    racingKpis: {
      totalRaces: 14,
      totalBasketings: 560,
      totalConcourses: 185,
      basketingEfficiencyPct: 33.04,
      totalConcourseKm: 68420,
      firstPlaces: 4,
      secondPlaces: 6,
      thirdPlaces: 3,
      topTenPlaces: 28,
      championships: [
        {
          id: 'champ-1',
          title: 'Mistrz Oddziału',
          category: 'Kat. A (Sprint)',
          level: 'branch',
          rank: 1,
          concourseCount: 40,
          coefficient: 124.52,
        },
        {
          id: 'champ-2',
          title: 'I Wicemistrz Okręgu',
          category: 'Generalne Mistrzostwo Polski (GMP)',
          level: 'district',
          rank: 2,
          competitionPoints: 1824.15,
          concourseCount: 35,
        },
      ],
    },
    breedingKpis: {
      breedingPairsCount: 20,
      eggsLaidCount: 80,
      eggsFertileCount: 76,
      eggsHatchedCount: 74,
      squabsWeanedD24Count: 70,
      fertilityRatePct: 95.0,
      hatchabilityRatePct: 97.37,
      weaningRatePct: 94.59,
    },
    survivalBalance: {
      flockCountSeasonStart: 85,
      youngRingedCount: 70,
      lossesInRaces: 12,
      lossesLoftAndPredators: 3,
      flockCountSeasonEnd: 140,
      survivalRatePct: 90.32,
    },
    hallOfFame: [
      {
        id: 'hof-1',
        ringNumber: 'PL-0284-21-9988',
        nameOrNick: 'Błękitna Błyskawica',
        sex: 'cock',
        plumageColor: 'Niebieski',
        birthYear: 2021,
        careerConcourses: 38,
        careerConcourseKm: 14500,
        bestCoefficient: 2.14,
        bloodlineLineage: 'Janssen / De Klak',
        status: 'active_legend',
        crowningAchievements: [
          '1. As Okręgu Kat. A 2024',
          '3 x 1. konkurs z lotów > 300 km',
        ],
      },
      {
        id: 'hof-2',
        ringNumber: 'PL-0284-19-1122',
        nameOrNick: 'Złota Dama',
        sex: 'hen',
        plumageColor: 'Pstra',
        birthYear: 2019,
        careerConcourses: 29,
        careerConcourseKm: 11200,
        bestCoefficient: 4.88,
        bloodlineLineage: 'Gaby Vandenabeele',
        status: 'stud_pillar',
        crowningAchievements: [
          'Matka 6 asów lotowych oddziału',
          'Wybitna linia długodystansowa',
        ],
      },
    ],
    seasonEvaluationGrade: 'golden_loft',
    evaluationRationale: 'Bardzo wysoka wydajność stada (33.04%), 185 konkursów oraz tytuły mistrzowskie w oddziale i okręgu.',
    generationDate: '2026-10-18',
    breederSignatureConfirmed: true,
  };

  test('calculateBasketingEfficiency calculates correct percentage and handles zero', () => {
    expect(calculateBasketingEfficiency(185, 560)).toBe(33.04);
    expect(calculateBasketingEfficiency(0, 100)).toBe(0);
    expect(calculateBasketingEfficiency(50, 0)).toBe(0);
  });

  test('calculateBreedingMetrics accurately evaluates fertility, hatchability and weaning rates', () => {
    const metrics = calculateBreedingMetrics(80, 76, 74, 70);
    expect(metrics.fertilityRatePct).toBe(95.0);
    expect(metrics.hatchabilityRatePct).toBe(97.37);
    expect(metrics.weaningRatePct).toBe(94.59);

    const zeroMetrics = calculateBreedingMetrics(0, 0, 0, 0);
    expect(zeroMetrics.fertilityRatePct).toBe(0);
    expect(zeroMetrics.hatchabilityRatePct).toBe(0);
    expect(zeroMetrics.weaningRatePct).toBe(0);
  });

  test('calculateFlockSurvivalRate computes annual survival percentage', () => {
    // 140 / (85 + 70) = 140 / 155 = 90.32%
    expect(calculateFlockSurvivalRate(85, 70, 140)).toBe(90.32);
    expect(calculateFlockSurvivalRate(0, 0, 0)).toBe(0);
  });

  test('evaluateSeasonGrade assigns proper awards according to KPIs', () => {
    const diamond = evaluateSeasonGrade(38.5, 95, 4, 95);
    expect(diamond.grade).toBe('diamond_loft');

    const golden = evaluateSeasonGrade(30.0, 60, 2, 92);
    expect(golden.grade).toBe('golden_loft');

    const silver = evaluateSeasonGrade(24.0, 35, 0, 85);
    expect(silver.grade).toBe('silver_loft');

    const bronze = evaluateSeasonGrade(19.0, 15, 0, 91);
    expect(bronze.grade).toBe('bronze_loft');

    const distinction = evaluateSeasonGrade(10.0, 5, 0, 70);
    expect(distinction.grade).toBe('distinction');
  });

  test('validateAnnualPerformanceLedger approves valid ledger', () => {
    const result = validateAnnualPerformanceLedger(validLedger);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateAnnualPerformanceLedger detects invalid numbers and logical discrepancies', () => {
    const invalidLedger: LoftAnnualPerformanceLedger = {
      ...validLedger,
      breederName: '',
      loftName: ' ',
      racingKpis: {
        ...validLedger.racingKpis,
        totalBasketings: 100,
        totalConcourses: 120, // Concourse > basketings!
      },
      breedingKpis: {
        ...validLedger.breedingKpis,
        eggsLaidCount: 10,
        eggsFertileCount: 15, // Fertile > laid!
      },
      survivalBalance: {
        ...validLedger.survivalBalance,
        lossesInRaces: -5,
      },
      hallOfFame: [
        {
          ...validLedger.hallOfFame[0],
          ringNumber: '',
        },
      ],
    };

    const result = validateAnnualPerformanceLedger(invalidLedger);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
    expect(result.errors).toContain('Nazwa gołębnika jest wymagana.');
    expect(result.errors).toContain('Imię i nazwisko hodowcy są wymagane.');
    expect(result.errors).toContain('Liczba konkursów nie może przekraczać łącznej liczby koszowań.');
    expect(result.errors).toContain('Liczba jaj zapłodnionych nie może przekraczać liczby zniesionych jaj.');
    expect(result.errors).toContain('Wartości strat stada nie mogą być ujemne.');
  });

  test('generateLoftAnnualPerformanceLedgerHtml produces celebratory A4 chronicle with all sections', () => {
    const html = generateLoftAnnualPerformanceLedgerHtml(validLedger);
    expect(html).toContain('Złota Księga Mistrzów');
    expect(html).toContain('Mistrzowski Gołębnik Szmaragd');
    expect(html).toContain('Łukasz Kowalski');
    expect(html).toContain('33.04%');
    expect(html).toContain('Błękitna Błyskawica');
    expect(html).toContain('Złota Dama');
    expect(html).toContain('1. As Okręgu Kat. A 2024');
    expect(html).toContain('Podpis Właściciela Stada');
  });
});
