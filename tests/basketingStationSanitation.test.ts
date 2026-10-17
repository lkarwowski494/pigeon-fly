import {
  validateBasketingStationSanitation,
  calculateSanitationScore,
  generateBasketingStationSanitationHtml,
  BasketingStationSanitationData,
  VERDICT_LABELS,
} from '../src/domain/basketingStationSanitationProtocol';

const sampleSanitationData: BasketingStationSanitationData = {
  protocolNumber: 'AT-SAN-2026/009',
  inspectionDate: '2026-05-08',
  inspectionTime: '16:30',
  raceName: 'Lot nr 3 — Nowa Sól (220 km)',
  stationName: 'Punkt Wkładań Sekcja 1 — Poznań Wilda',
  stationAddress: 'ul. Rolna 24, 61-487 Poznań',
  branchNumber: '0284',
  branchName: 'Poznań Zachód',
  disinfectant: {
    productName: 'Virkon S',
    activeSubstance: 'Mononadsiarczan potasu (potassium peroxymonosulfate)',
    batchNumber: 'LOT-2026/03V',
    expiryDate: '2027-12-31',
    solutionConcentrationPct: 2.0,
    exposureTimeMinutes: 30,
  },
  crateAudit: {
    cratesCount: 45,
    cratesCleanAndDisinfected: true,
    beddingType: 'corrugated_cardboard',
    technicalIntegrityOk: true,
    densityCompliant: true,
  },
  checklist: {
    entranceDisinfectionMatsActive: true,
    surfacesAndTablesSanitized: true,
    ventilationOperational: true,
    rodentAndWildBirdShielded: true,
    handSanitationAvailable: true,
    cleanWaterSourceAvailable: true,
  },
  verdict: 'approved_full',
  inspectorName: 'Marek Wiśniewski',
  veterinarianName: 'Lek. wet. Janusz Ptasiński',
  sectionPresidentName: 'Piotr Kaczmarek',
  notes: 'Stan sanitarno-higieniczny punktu wzorowy. Klatki wywietrzone po oprysku.',
};

describe('basketingStationSanitation (Z-092 / DEC-106)', () => {
  it('validates a complete and correct basketing sanitation protocol', () => {
    const res = validateBasketingStationSanitation(sampleSanitationData);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('detects missing fields, invalid concentration, and short exposure time', () => {
    const invalid = validateBasketingStationSanitation({
      ...sampleSanitationData,
      protocolNumber: '',
      stationName: '',
      disinfectant: {
        ...sampleSanitationData.disinfectant,
        solutionConcentrationPct: 0,
        exposureTimeMinutes: 5, // < 10
      },
      crateAudit: {
        ...sampleSanitationData.crateAudit,
        cratesCount: 0,
      },
    });

    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.some((e) => e.includes('protokołu'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('punktu'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('stężenie'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('ekspozycji'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('klatek'))).toBe(true);
  });

  it('requires conditional requirements description when verdict is approved_conditional', () => {
    const conditionalNoDesc = validateBasketingStationSanitation({
      ...sampleSanitationData,
      verdict: 'approved_conditional',
      conditionalRequirements: undefined,
    });
    expect(conditionalNoDesc.isValid).toBe(false);
    expect(conditionalNoDesc.errors.some((e) => e.includes('warunkowego'))).toBe(true);

    const conditionalWithDesc = validateBasketingStationSanitation({
      ...sampleSanitationData,
      verdict: 'approved_conditional',
      conditionalRequirements: 'Dolać 2 litry roztworu Virkon S do maty wejściowej przed wpuszczeniem hodowców.',
    });
    expect(conditionalWithDesc.isValid).toBe(true);
  });

  it('calculates sanitation score and flags critical issues', () => {
    const fullScore = calculateSanitationScore(sampleSanitationData);
    expect(fullScore.score).toBe(100);
    expect(fullScore.criticalIssues).toHaveLength(0);

    const flawedScore = calculateSanitationScore({
      ...sampleSanitationData,
      crateAudit: {
        ...sampleSanitationData.crateAudit,
        cratesCleanAndDisinfected: false,
        technicalIntegrityOk: false,
      },
      checklist: {
        ...sampleSanitationData.checklist,
        entranceDisinfectionMatsActive: false,
      },
    });

    expect(flawedScore.score).toBeLessThan(70);
    expect(flawedScore.criticalIssues.length).toBe(3);
    expect(flawedScore.criticalIssues.some((i) => i.includes('Klatki koszowe'))).toBe(true);
    expect(flawedScore.criticalIssues.some((i) => i.includes('mat dezynfekcyjnych'))).toBe(true);
  });

  it('generates valid print-ready HTML certificate for PIW and PZHGP', () => {
    const html = generateBasketingStationSanitationHtml(sampleSanitationData);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Świadectwo Zgodności Sanitarnej Punktu Koszowania');
    expect(html).toContain('AT-SAN-2026/009');
    expect(html).toContain('Punkt Wkładań Sekcja 1 — Poznań Wilda');
    expect(html).toContain('Virkon S');
    expect(html).toContain('LOT-2026/03V');
    expect(html).toContain('2.0%');
    expect(html).toContain('45 szt.');
    expect(html).toContain('Marek Wiśniewski');
    expect(html).toContain('Lek. wet. Janusz Ptasiński');
    expect(html).toContain('100%');
    expect(html).toContain(VERDICT_LABELS.approved_full);
  });
});
