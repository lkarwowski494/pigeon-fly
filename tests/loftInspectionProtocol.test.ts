import {
  evaluateLoftInspection,
  generateLoftInspectionProtocolHtml,
  LoftInspectionData,
  INSPECTION_TYPE_LABELS,
} from '../src/domain/loftInspectionProtocol';

const sampleInspection: LoftInspectionData = {
  protocolNumber: 'KONTROLA/0284/2026/007',
  inspectionDate: '2026-05-24',
  inspectionTime: '14:30',
  inspectionType: 'unannounced_race_day',
  breederName: 'Stanisław Kowalczyk',
  breederPzhgpNumber: 'PL-0284-1802',
  branchName: '0284 Nowy Tomyśl',
  sectionName: 'Sekcja 02 Buk',
  loftAddress: 'ul. Ogrodowa 14, 64-320 Buk',
  loftLatitude: 52.35512,
  loftLongitude: 16.51842,
  declaredBirdsCount: 68,
  actualBirdsCount: 68,
  foreignBirdsDetectedCount: 0,
  gpsCoordinatesMatch: true,
  eskAntennaPadsTamperFree: true,
  sealsIntact: true,
  trapGatesFunctioning: true,
  loftHygieneSatisfactory: true,
  freeFlightObservations: 'Oblot poranny w normie, stado zsynchronizowane.',
  sampledBirds: [
    {
      id: 'p-1',
      ringNumber: 'PL-0284-23-4412',
      sex: 'cock',
      plumageColor: 'Niebieska',
      chipBandSerial: 'CHIP-99014',
      ringCondition: 'flawless',
      inLoftVerified: true,
    },
    {
      id: 'p-2',
      ringNumber: 'PL-0284-24-1108',
      sex: 'hen',
      plumageColor: 'Ciemno-nakrapiana',
      chipBandSerial: 'CHIP-44120',
      ringCondition: 'flawless',
      inLoftVerified: true,
    },
  ],
  commissionMember1: 'Janusz Woźniak',
  commissionMember2: 'Marek Szymański',
  commissionPresident: 'Tadeusz Lewandowski',
  commissionVerdict: 'full_compliance',
  commissionObservations: 'Gołębnik w pełni zabezpieczony. Brak zastrzeżeń do instalacji ESK.',
};

describe('loftInspectionProtocol (Z-087 / DEC-101)', () => {
  it('evaluates fully compliant inspection with 100% conformity score', () => {
    const result = evaluateLoftInspection(sampleInspection);

    expect(result.isCompliant).toBe(true);
    expect(result.conformityScorePct).toBe(100);
    expect(result.errors).toHaveLength(0);
    expect(result.verdictLabel).toContain('ZGODNOŚĆ PEŁNA');
    expect(result.recommendations.some((r) => r.includes('Brak zastrzeżeń'))).toBe(true);
  });

  it('detects broken seals and antenna tampering as severe violations', () => {
    const tamperedData: LoftInspectionData = {
      ...sampleInspection,
      sealsIntact: false,
      eskAntennaPadsTamperFree: false,
      commissionVerdict: 'severe_violation',
    };

    const result = evaluateLoftInspection(tamperedData);

    expect(result.isCompliant).toBe(false);
    expect(result.errors.some((e) => e.includes('plomby'))).toBe(true);
    expect(result.errors.some((e) => e.includes('antenach'))).toBe(true);
    expect(result.verdictLabel).toContain('NARUSZENIE REGULAMINU');
    expect(result.recommendations.some((r) => r.includes('Sąd'))).toBe(true);
  });

  it('detects tampered ring or missing bird from sampled physical check', () => {
    const missingBirdData: LoftInspectionData = {
      ...sampleInspection,
      sampledBirds: [
        {
          ...sampleInspection.sampledBirds[0],
          ringCondition: 'suspicious_tamper',
          inLoftVerified: false,
        },
      ],
    };

    const result = evaluateLoftInspection(missingBirdData);

    expect(result.isCompliant).toBe(false);
    expect(result.errors.some((e) => e.includes('rozcinania'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Brak w gołębniku'))).toBe(true);
  });

  it('handles minor discrepancies with 7-day correction recommendation', () => {
    const minorData: LoftInspectionData = {
      ...sampleInspection,
      actualBirdsCount: 66, // -2 birds
      loftHygieneSatisfactory: false,
      commissionVerdict: 'minor_irregularity',
    };

    const result = evaluateLoftInspection(minorData);

    expect(result.isCompliant).toBe(true);
    expect(result.warnings.some((w) => w.includes('Różnica stanu'))).toBe(true);
    expect(result.verdictLabel).toContain('DROBNE UCHYBIENIA');
    expect(result.recommendations.some((r) => r.includes('7 dni'))).toBe(true);
  });

  it('contains labels for all inspection type categories', () => {
    expect(INSPECTION_TYPE_LABELS.unannounced_race_day).toContain('Dniu Lotu');
    expect(INSPECTION_TYPE_LABELS.pre_season_census).toContain('Przedsezonowy');
    expect(INSPECTION_TYPE_LABELS.routine_integrity_audit).toContain('Rutynowa');
    expect(INSPECTION_TYPE_LABELS.post_protest_verification).toContain('Protestu');
  });

  it('generates valid print-ready HTML protocol with sampled birds and commission signatures', () => {
    const html = generateLoftInspectionProtocolHtml(sampleInspection);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH');
    expect(html).toContain('Protokół Komisji Lotowej z Kontroli i Wizytacji Gołębnika');
    expect(html).toContain('Stanisław Kowalczyk');
    expect(html).toContain('PL-0284-23-4412');
    expect(html).toContain('Janusz Woźniak');
    expect(html).toContain('Tadeusz Lewandowski');
    expect(html).toContain('ZGODNOŚĆ PEŁNA');
  });
});
