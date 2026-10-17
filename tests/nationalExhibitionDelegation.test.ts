import {
  NationalExhibitionDelegationProtocol,
  calculateStandardTotalScore,
  checkSportCategoryRequirements,
  validateExhibitionProtocol,
  calculateExhibitionStats,
  generateNationalExhibitionHtml,
} from '../src/domain/nationalExhibitionDelegation';

describe('NationalExhibitionDelegation Domain (Z-099 / DEC-113)', () => {
  const sampleProtocol: NationalExhibitionDelegationProtocol = {
    id: 'exhib-2026-001',
    protocolNumber: 'WYSTAWA-2026/OKR-POZNAN/01',
    exhibitionYear: 2026,
    districtName: 'Okręg Poznań PZHGP',
    exhibitionEventName: '73. Ogólnopolska Wystawa Gołębi Pocztowych',
    verificationDate: '2026-11-20',
    districtPresidentName: 'Stanisław Wolny',
    chiefJudgeName: 'Marek Wiśniewski (Sędzia Ekspert FCI)',
    candidates: [
      {
        id: 'cand-01',
        ringNumber: 'PL-0284-22-1402',
        breederName: 'Janusz Kowalski',
        branchName: 'Oddział 0284 Gostyń',
        sex: 'cock',
        color: 'Niebieski',
        birthYear: 2022,
        division: 'sport',
        sportCategory: 'sport_a',
        totalConcourses2Years: 12,
        totalKkm2Years: 2450,
        sportCoeffSum: 14.285,
        qualificationStatus: 'qualified',
      },
      {
        id: 'cand-02',
        ringNumber: 'PL-0284-23-4412',
        breederName: 'Janusz Kowalski',
        branchName: 'Oddział 0284 Gostyń',
        sex: 'cock',
        color: 'Ciemna-Nakrapiana',
        birthYear: 2023,
        division: 'standard',
        totalConcourses2Years: 10,
        totalKkm2Years: 3200,
        standardScores: {
          generalAppearance: 9.25,
          boneStructure: 28.5,
          backAndTail: 19.0,
          musculature: 28.25,
          wingsAndPlumage: 9.25,
        },
        qualificationStatus: 'qualified',
      },
      {
        id: 'cand-03',
        ringNumber: 'PL-0285-23-9999',
        breederName: 'Tomasz Nowak',
        branchName: 'Oddział 0285 Leszno',
        sex: 'hen',
        color: 'Płowa',
        birthYear: 2023,
        division: 'standard',
        totalConcourses2Years: 8,
        totalKkm2Years: 2400,
        standardScores: {
          generalAppearance: 9.0,
          boneStructure: 28.0,
          backAndTail: 18.5,
          musculature: 28.0,
          wingsAndPlumage: 9.0,
        },
        qualificationStatus: 'reserve',
      },
    ],
  };

  test('calculateStandardTotalScore accurately sums 5 FCI criteria', () => {
    const total = calculateStandardTotalScore({
      generalAppearance: 9.25,
      boneStructure: 28.5,
      backAndTail: 19.0,
      musculature: 28.25,
      wingsAndPlumage: 9.25,
    });
    expect(total).toBe(94.25);
  });

  test('checkSportCategoryRequirements validates category A and B requirements', () => {
    // Sport A: min 10 concourses, 1500 kkm
    expect(
      checkSportCategoryRequirements({
        sportCategory: 'sport_a',
        totalConcourses2Years: 11,
        totalKkm2Years: 1600,
      }).meetsRequirements
    ).toBe(true);

    expect(
      checkSportCategoryRequirements({
        sportCategory: 'sport_a',
        totalConcourses2Years: 9,
        totalKkm2Years: 1600,
      }).meetsRequirements
    ).toBe(false);

    // Sport B: min 8 concourses, 2800 kkm
    expect(
      checkSportCategoryRequirements({
        sportCategory: 'sport_b',
        totalConcourses2Years: 8,
        totalKkm2Years: 2900,
      }).meetsRequirements
    ).toBe(true);
  });

  test('validates fully compliant exhibition delegation protocol', () => {
    const val = validateExhibitionProtocol(sampleProtocol);
    expect(val.isValid).toBe(true);
    expect(val.errors).toHaveLength(0);
  });

  test('rejects candidate qualified for sport when minimums are unmet', () => {
    const unmetSport: NationalExhibitionDelegationProtocol = {
      ...sampleProtocol,
      candidates: [
        {
          ...sampleProtocol.candidates[0],
          sportCategory: 'sport_b', // requires 8 concourses, 2800 kkm (cand has 2450 kkm)
          totalKkm2Years: 2450,
          qualificationStatus: 'qualified',
        },
      ],
    };

    const val = validateExhibitionProtocol(unmetSport);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('nie spełnia minimów'))).toBe(true);
  });

  test('rejects candidate qualified for standard when cock has < 2500 kkm', () => {
    const unmetStandardCock: NationalExhibitionDelegationProtocol = {
      ...sampleProtocol,
      candidates: [
        {
          ...sampleProtocol.candidates[1],
          sex: 'cock',
          totalKkm2Years: 2100, // below 2500 kkm for cocks
          qualificationStatus: 'qualified',
        },
      ],
    };

    const val = validateExhibitionProtocol(unmetStandardCock);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('nie spełnia minimum lotowego FCI'))).toBe(true);
  });

  test('calculates accurate exhibition stats and generates complete A4 HTML', () => {
    const stats = calculateExhibitionStats(sampleProtocol);
    expect(stats.totalCandidates).toBe(3);
    expect(stats.sportQualifiedCount).toBe(1);
    expect(stats.standardQualifiedCount).toBe(1);
    expect(stats.reserveCount).toBe(1);
    expect(stats.averageStandardScore).toBe(93.38);

    const html = generateNationalExhibitionHtml(sampleProtocol);
    expect(html).toContain('OFICJALNA REPREZENTACJA OKRĘGU NA WYSTAWĘ OGÓLNOPOLSKĄ');
    expect(html).toContain('Okręg Poznań PZHGP');
    expect(html).toContain('PL-0284-22-1402');
    expect(html).toContain('Stanisław Wolny');
    expect(html).toContain('Marek Wiśniewski');
  });
});
