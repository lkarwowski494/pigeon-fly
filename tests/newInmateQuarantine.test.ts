import {
  evaluateInmateQuarantine,
  generateInmateQuarantineCertificateHtml,
  InmateQuarantineRecord,
} from '../src/domain/newInmateQuarantine';

describe('NewInmateQuarantine Domain (Z-076)', () => {
  const baseRecord: InmateQuarantineRecord = {
    id: 'quar-01',
    ringNumber: 'BE-2025-6012488',
    originSource: 'Aukcja PIPA - Belgia (Ludo Claessens)',
    countryCode: 'BE',
    sex: 'cock',
    plumage: 'Ciemno-nakrapiany',
    admissionDate: '2026-03-01',
    targetLoftSection: 'breeding',
    coproscopyStatus: 'pending',
    cropSmearStatus: 'pending',
    pmv1Status: 'pending',
    ectoparasiteTreatmentDone: false,
    clinicalExamNormal: true,
  };

  test('identifies Stage 1 on Day 3 and blocks early release', () => {
    const evalResult = evaluateInmateQuarantine(baseRecord, new Date('2026-03-03'));

    expect(evalResult.daysElapsed).toBe(3);
    expect(evalResult.currentStage).toBe('STAGE_1_ADMISSION');
    expect(evalResult.canDischargeToMainLoft).toBe(false);
    expect(evalResult.blockingReasons.some((r) => r.includes('21 dni'))).toBe(true);
    expect(evalResult.blockingReasons.some((r) => r.includes('koproskopowego'))).toBe(true);
  });

  test('identifies Stage 2 (Diagnostics) on Day 8', () => {
    const evalResult = evaluateInmateQuarantine(baseRecord, new Date('2026-03-08'));

    expect(evalResult.daysElapsed).toBe(8);
    expect(evalResult.currentStage).toBe('STAGE_2_DIAGNOSTICS');
    expect(evalResult.stageName).toContain('Etap 2: Diagnostyka Wola');
  });

  test('identifies Stage 3 (Immunization) on Day 16', () => {
    const evalResult = evaluateInmateQuarantine(baseRecord, new Date('2026-03-16'));

    expect(evalResult.daysElapsed).toBe(16);
    expect(evalResult.currentStage).toBe('STAGE_3_IMMUNIZATION');
    expect(evalResult.stageName).toContain('Etap 3: Immunizacja');
  });

  test('blocks clearance on Day 22 if tests are still pending', () => {
    const evalResult = evaluateInmateQuarantine(baseRecord, new Date('2026-03-22'));

    expect(evalResult.daysElapsed).toBe(22);
    expect(evalResult.currentStage).toBe('STAGE_4_CLEARANCE');
    expect(evalResult.canDischargeToMainLoft).toBe(false);
    expect(evalResult.blockingReasons.length).toBeGreaterThan(0);
  });

  test('grants clearance on Day 22 when all tests and exams are passed', () => {
    const fullyTestedRecord: InmateQuarantineRecord = {
      ...baseRecord,
      coproscopyStatus: 'negative',
      coproscopyDetails: 'Brak inwazji oocyst i nicieni',
      cropSmearStatus: 'negative',
      cropSmearDetails: 'Trichomonas gallinae ujemny',
      pmv1Status: 'verified_valid',
      pmv1VaccineBatch: 'Pharmavac PMV ser. 2026-01',
      ectoparasiteTreatmentDone: true,
      clinicalExamNormal: true,
      clinicalNotes: 'Waga 460g, sprężysty mięsień piersiowy, czysta woskówka',
    };

    const evalResult = evaluateInmateQuarantine(fullyTestedRecord, new Date('2026-03-22'));

    expect(evalResult.daysElapsed).toBe(22);
    expect(evalResult.canDischargeToMainLoft).toBe(true);
    expect(evalResult.blockingReasons.length).toBe(0);
    expect(evalResult.progressPct).toBe(100);
  });

  test('returns CLEARED stage when clearedDate is filled', () => {
    const clearedRecord: InmateQuarantineRecord = {
      ...baseRecord,
      clearedDate: '2026-03-22',
    };

    const evalResult = evaluateInmateQuarantine(clearedRecord, new Date('2026-03-25'));
    expect(evalResult.currentStage).toBe('CLEARED');
    expect(evalResult.canDischargeToMainLoft).toBe(true);
  });

  test('generateInmateQuarantineCertificateHtml returns valid printable clearance certificate', () => {
    const record: InmateQuarantineRecord = {
      ...baseRecord,
      coproscopyStatus: 'negative',
      cropSmearStatus: 'negative',
      pmv1Status: 'verified_valid',
      ectoparasiteTreatmentDone: true,
      clinicalExamNormal: true,
    };
    const evaluation = evaluateInmateQuarantine(record, new Date('2026-03-22'));

    const html = generateInmateQuarantineCertificateHtml({
      record,
      evaluation,
      loftName: 'Mistrzowski Gołębnik Rozpłodowy',
      breederName: 'Jan Kowalski',
      seasonYear: 2026,
    });

    expect(html).toContain('ŚWIADECTWO ZAKOŃCZENIA KWARANTANNY BIOLOGICZNEJ');
    expect(html).toContain('BE-2025-6012488');
    expect(html).toContain('Mistrzowski Gołębnik Rozpłodowy');
    expect(html).toContain('DOPUSZCZONY DO STADA');
    expect(html).toContain('Badanie koproskopowe (kał)');
    expect(html).toContain('Wymaz z wola');
    expect(html).toContain('Szczepienie ochronne PMV-1');
  });
});
