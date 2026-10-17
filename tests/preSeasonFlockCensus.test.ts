import {
  PreSeasonFlockCensus,
  validateFlockCensus,
  calculateCensusStats,
  generatePreSeasonFlockCensusHtml,
} from '../src/domain/preSeasonFlockCensus';

describe('PreSeasonFlockCensus Domain (Z-095 / DEC-109)', () => {
  const sampleCensus: PreSeasonFlockCensus = {
    id: 'census-2026-001',
    seasonYear: 2026,
    censusType: 'gmp_50',
    submissionDate: '2026-04-15',
    breederName: 'Janusz Kowalski',
    breederPzhgpNumber: '0284-1234',
    branchName: 'Oddział 0284 Gostyń',
    sectionName: 'Sekcja 02 Poniec',
    loftAddress: 'ul. Słoneczna 12, 63-800 Gostyń',
    loftGpsCoordinates: '51°45\'22.1"N 16°52\'10.4"E',
    eskSystemName: 'Tauris World',
    pmvVaccineName: 'Colombovac PMV',
    pmvVaccineLotNumber: 'LOT-PMV-2026-04',
    pmvVaccinationDate: '2026-02-10',
    vetName: 'Lek. wet. Janusz Ptasiński',
    vetLicenseNumber: 'PWZW-10492',
    pigeons: [
      {
        ordinalNumber: 1,
        ringNumber: 'PL-0284-22-1402',
        color: 'Niebieski',
        sex: 'cock',
        birthYear: 2022,
        chipCode: 'TAUR-89A04F',
        isDesignatedForGmp: true,
        isDesignatedForInter: true,
      },
      {
        ordinalNumber: 2,
        ringNumber: 'PL-0284-23-4412',
        color: 'Ciemna-Nakrapiana',
        sex: 'hen',
        birthYear: 2023,
        chipCode: 'TAUR-89A050',
        isDesignatedForGmp: true,
        isDesignatedForInter: false,
      },
      {
        ordinalNumber: 3,
        ringNumber: 'PL-0284-24-7890',
        color: 'Płowa',
        sex: 'cock',
        birthYear: 2024,
        chipCode: '',
        isDesignatedForGmp: false,
        isDesignatedForInter: true,
      },
    ],
  };

  test('validates correctly filled flock census within 365 days of PMV-1 vaccination', () => {
    const val = validateFlockCensus(sampleCensus);
    expect(val.isValid).toBe(true);
    expect(val.errors).toHaveLength(0);
    expect(val.duplicateRings).toHaveLength(0);
    expect(val.duplicateChips).toHaveLength(0);
  });

  test('detects duplicate ring numbers and duplicate ESK chips', () => {
    const duplicateData: PreSeasonFlockCensus = {
      ...sampleCensus,
      pigeons: [
        {
          ordinalNumber: 1,
          ringNumber: 'PL-0284-22-1402',
          color: 'Niebieski',
          sex: 'cock',
          birthYear: 2022,
          chipCode: 'CHIP-DUPLICATE-1',
          isDesignatedForGmp: true,
          isDesignatedForInter: false,
        },
        {
          ordinalNumber: 2,
          ringNumber: 'PL-0284-22-1402', // duplicate ring
          color: 'Niebieski',
          sex: 'cock',
          birthYear: 2022,
          chipCode: 'CHIP-DUPLICATE-1', // duplicate chip
          isDesignatedForGmp: true,
          isDesignatedForInter: false,
        },
      ],
    };

    const val = validateFlockCensus(duplicateData);
    expect(val.isValid).toBe(false);
    expect(val.duplicateRings).toContain('PL-0284-22-1402');
    expect(val.duplicateChips).toContain('CHIP-DUPLICATE-1');
    expect(val.errors.some((e) => e.includes('zduplikowane numery obrączek'))).toBe(true);
    expect(val.errors.some((e) => e.includes('zduplikowane kody chipów'))).toBe(true);
  });

  test('enforces max 50 pigeons limit for GMP census', () => {
    const pigeons51 = Array.from({ length: 51 }, (_, i) => ({
      ordinalNumber: i + 1,
      ringNumber: `PL-0284-22-10${i + 1}`,
      color: 'Niebieski',
      sex: 'cock' as const,
      birthYear: 2022,
      chipCode: `CHIP-${i + 1}`,
      isDesignatedForGmp: true,
      isDesignatedForInter: false,
    }));

    const invalidGmp: PreSeasonFlockCensus = {
      ...sampleCensus,
      censusType: 'gmp_50',
      pigeons: pigeons51,
    };

    const val = validateFlockCensus(invalidGmp);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('Spis do GMP nie może liczyć więcej niż 50 ptaków'))).toBe(true);
  });

  test('rejects expired PMV-1 vaccination (>365 days) and future vaccination date', () => {
    // Expired
    const expiredVaccine: PreSeasonFlockCensus = {
      ...sampleCensus,
      submissionDate: '2026-05-01',
      pmvVaccinationDate: '2025-04-10', // 386 days ago
    };
    const valExpired = validateFlockCensus(expiredVaccine);
    expect(valExpired.isValid).toBe(false);
    expect(valExpired.errors.some((e) => e.includes('Szczepienie PMV-1 wygasło'))).toBe(true);

    // Future
    const futureVaccine: PreSeasonFlockCensus = {
      ...sampleCensus,
      submissionDate: '2026-04-15',
      pmvVaccinationDate: '2026-05-10', // future
    };
    const valFuture = validateFlockCensus(futureVaccine);
    expect(valFuture.isValid).toBe(false);
    expect(valFuture.errors.some((e) => e.includes('nie może być późniejsza niż data złożenia spisu'))).toBe(true);
  });

  test('calculates accurate census statistics across sexes, GMP, and year distribution', () => {
    const stats = calculateCensusStats(sampleCensus);
    expect(stats.totalPigeons).toBe(3);
    expect(stats.cocksCount).toBe(2);
    expect(stats.hensCount).toBe(1);
    expect(stats.gmpCount).toBe(2);
    expect(stats.interCount).toBe(2);
    expect(stats.chipsAssignedCount).toBe(2);
    expect(stats.chipsMissingCount).toBe(1);
    expect(stats.yearDistribution[2022]).toBe(1);
    expect(stats.yearDistribution[2023]).toBe(1);
    expect(stats.yearDistribution[2024]).toBe(1);
  });

  test('generates complete A4 HTML with appropriate copy headers for branch, calculation officer, and breeder', () => {
    const htmlBranch = generatePreSeasonFlockCensusHtml(sampleCensus, 'branch');
    expect(htmlBranch).toContain('EGZEMPLARZ 1 — ZARZĄD ODDZIAŁU PZHGP');
    expect(htmlBranch).toContain('Janusz Kowalski');
    expect(htmlBranch).toContain('PL-0284-22-1402');
    expect(htmlBranch).toContain('Colombovac PMV');
    expect(htmlBranch).toContain('Lek. wet. Janusz Ptasiński');
    expect(htmlBranch).toContain('PWZW-10492');

    const htmlCalc = generatePreSeasonFlockCensusHtml(sampleCensus, 'calc_officer');
    expect(htmlCalc).toContain('EGZEMPLARZ 2 — RACHMISTRZ ODDZIAŁOWY');

    const htmlBreeder = generatePreSeasonFlockCensusHtml(sampleCensus, 'breeder');
    expect(htmlBreeder).toContain('EGZEMPLARZ 3 — HODOWCA');
  });
});
