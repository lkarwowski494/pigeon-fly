/**
 * PIGEON-FLY — Testy Jednostkowe E-Paszportu i Świadectwa Zdrowia TRACES-NT (Z-063)
 */

import {
  validateConsignmentForTraces,
  generateTracesCertificateHtml,
  TracesConsignmentInfo,
} from '../src/domain/vetPassportTraces';

describe('TRACES-NT Vet Passport & Health Certificate Engine (Z-063)', () => {
  const baseTimestamp = new Date('2026-06-15T08:00:00Z');

  const sampleConsignment: TracesConsignmentInfo = {
    certificateId: 'PL-TRACES-2026-00491',
    wniNumber: 'PL 14120099',
    breederName: 'Jan Kowalski',
    breederPhone: '+48 600 123 456',
    loftAddress: 'ul. Lotników 44, 05-500 Piaseczno',
    departureCountry: 'PL',
    destinationCountry: 'DE',
    releaseLocationName: 'Magdeburg',
    releaseCoordinates: {
      latitude: 52.1205,
      longitude: 11.6276,
    },
    raceDistanceKm: 580,
    transporterName: 'PZHGP Oddział 0284 Transport',
    transporterLicenseNumber: 'PL-1412-T2-088',
    vehicleRegistrationNumber: 'WI 4492A',
    pigeonsCount: 120,
    ringNumbersSample: ['PL-0284-23-1402', 'PL-0284-22-9854', 'DV-01234-24-512'],
    departureTimestamp: new Date(baseTimestamp.getTime() + 1000 * 60 * 60 * 12).toISOString(), // 12h later
    clinicalExamTimestamp: baseTimestamp.toISOString(),
    examiningVetName: 'Lek. wet. Janusz Ptasiński',
    examiningVetLicenseNumber: 'WET-WAW-9912',
    isInHpaiZone: false,
    hasClinicalSymptoms: false,
    pmvVaccineValid: true,
    pmvVaccineBatchNumber: 'LOT-PMV-2026-04',
    pmvVaccinationDate: '2026-02-15',
  };

  it('approves compliant consignment within 48h clinical exam window', () => {
    // Current time is 10 hours after clinical exam
    const now = new Date(baseTimestamp.getTime() + 1000 * 60 * 60 * 10);
    const result = validateConsignmentForTraces(sampleConsignment, now);

    expect(result.isValid).toBe(true);
    expect(result.statusCode).toBe('APPROVED');
    expect(result.examExpired).toBe(false);
    expect(result.hoursUntilExamExpiry).toBe(38);
    expect(result.violations.length).toBe(0);
  });

  it('rejects consignment when clinical exam is older than 48 hours', () => {
    // Current time is 49 hours after clinical exam
    const now = new Date(baseTimestamp.getTime() + 1000 * 60 * 60 * 49);
    const result = validateConsignmentForTraces(sampleConsignment, now);

    expect(result.isValid).toBe(false);
    expect(result.statusCode).toBe('EXPIRED');
    expect(result.examExpired).toBe(true);
    expect(result.hoursUntilExamExpiry).toBe(0);
    expect(result.violations.some((v) => v.includes('48 godzin'))).toBe(true);
  });

  it('rejects consignment when loft is located inside HPAI zone', () => {
    const hpaiConsignment: TracesConsignmentInfo = {
      ...sampleConsignment,
      isInHpaiZone: true,
    };

    const now = new Date(baseTimestamp.getTime() + 1000 * 60 * 60 * 5);
    const result = validateConsignmentForTraces(hpaiConsignment, now);

    expect(result.isValid).toBe(false);
    expect(result.statusCode).toBe('REJECTED_HPAI');
    expect(result.violations.some((v) => v.includes('HPAI'))).toBe(true);
  });

  it('rejects consignment when clinical symptoms are detected during vet inspection', () => {
    const sickConsignment: TracesConsignmentInfo = {
      ...sampleConsignment,
      hasClinicalSymptoms: true,
    };

    const now = new Date(baseTimestamp.getTime() + 1000 * 60 * 60 * 5);
    const result = validateConsignmentForTraces(sickConsignment, now);

    expect(result.isValid).toBe(false);
    expect(result.statusCode).toBe('REJECTED_SYMPTOMS');
    expect(result.violations.some((v) => v.includes('objawów klinicznych'))).toBe(true);
  });

  it('rejects consignment when PMV-1 vaccine is missing or invalid', () => {
    const noVaccineConsignment: TracesConsignmentInfo = {
      ...sampleConsignment,
      pmvVaccineValid: false,
    };

    const now = new Date(baseTimestamp.getTime() + 1000 * 60 * 60 * 5);
    const result = validateConsignmentForTraces(noVaccineConsignment, now);

    expect(result.isValid).toBe(false);
    expect(result.statusCode).toBe('REJECTED_VACCINE');
    expect(result.violations.some((v) => v.includes('PMV-1'))).toBe(true);
  });

  it('generates complete official bilingual TRACES-NT HTML document', () => {
    const now = new Date(baseTimestamp.getTime() + 1000 * 60 * 60 * 6);
    const validation = validateConsignmentForTraces(sampleConsignment, now);
    const html = generateTracesCertificateHtml(sampleConsignment, validation);

    expect(html).toContain('PL-TRACES-2026-00491');
    expect(html).toContain('PL 14120099');
    expect(html).toContain('Magdeburg (DE)');
    expect(html).toContain('Jan Kowalski');
    expect(html).toContain('WI 4492A');
    expect(html).toContain('Lek. wet. Janusz Ptasiński');
    expect(html).toContain('VETERINARY HEALTH CERTIFICATE');
    expect(html).toContain('ZEZWOLONO');
  });
});
