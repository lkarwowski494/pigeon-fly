import {
  evaluateVeterinaryLabReport,
  generateVeterinaryLabReportHtml,
  VeterinaryLabReportData,
  SAMPLE_TYPE_LABELS,
} from '../src/domain/veterinaryLabRegistry';

const sampleHealthyReport: VeterinaryLabReportData = {
  reportNumber: 'LAB-VET-2026/041',
  samplingDate: '2026-03-20',
  completionDate: '2026-03-23',
  laboratoryName: 'Zakład Higieny Weterynaryjnej (ZHW) Poznań',
  veterinarianName: 'Lek. wet. Janusz Ptasiński',
  sampleType: 'pool_feces_3day',
  loftName: 'Mistrzowski Gołębnik PL-0284',
  breederName: 'Tomasz Nowak',
  breederPzhgpNumber: 'PL-0284-1102',
  flockSection: 'wdowcy',
  coccidiaOpg: 450, // low
  ascaridiaPresent: false,
  ascaridiaEpg: 0,
  capillariaPresent: false,
  capillariaEpg: 0,
  trichomonasLevel: 'negative',
  candidaDetected: false,
  hexamitaDetected: false,
  salmonellaDetected: false,
  pathogenicEColiDetected: false,
  antibiogram: [],
  treatmentPrescribed: false,
};

describe('veterinaryLabRegistry (Z-088 / DEC-102)', () => {
  it('clears healthy flock as fit for racing', () => {
    const result = evaluateVeterinaryLabReport(sampleHealthyReport);

    expect(result.flockHealthStatus).toBe('healthy_cleared');
    expect(result.isFitForRacing).toBe(true);
    expect(result.statusLabel).toContain('STADO ZDROWE');
    expect(result.actionableTherapySteps.some((s) => s.includes('normie'))).toBe(true);
  });

  it('detects moderate coccidiosis and canker requiring targeted therapy', () => {
    const moderateReport: VeterinaryLabReportData = {
      ...sampleHealthyReport,
      coccidiaOpg: 4200,
      trichomonasLevel: 'moderate',
      treatmentPrescribed: true,
      medicationName: 'Ronidazol 10% + Amprolium',
      activeSubstance: 'Ronidazol, Amprolium',
      dosageInstruction: '2 g / 1 L wody',
      treatmentDurationDays: 5,
      withdrawalDays: 3,
    };

    const result = evaluateVeterinaryLabReport(moderateReport);

    expect(result.flockHealthStatus).toBe('treatment_required');
    expect(result.statusLabel).toContain('WYMAGANA KURACJA');
    expect(result.primaryDiagnoses.some((d) => d.includes('kokcydioza'))).toBe(true);
    expect(result.primaryDiagnoses.some((d) => d.includes('Rzęsistkowica'))).toBe(true);
  });

  it('imposes critical quarantine and race ban upon Salmonella or heavy Capillaria detection', () => {
    const salmonellaReport: VeterinaryLabReportData = {
      ...sampleHealthyReport,
      salmonellaDetected: true,
      salmonellaSerotype: 'Salmonella enterica ser. Typhimurium var. Copenhagen',
      capillariaPresent: true,
      capillariaEpg: 850,
      antibiogram: [
        { antibioticName: 'Enrofloksacyna', susceptibility: 'S', notes: 'Zalecany wybór' },
        { antibioticName: 'Doksycyklina', susceptibility: 'I', notes: 'Średnia wrażliwość' },
        { antibioticName: 'Amoksycylina', susceptibility: 'S', notes: 'Alternatywa' },
        { antibioticName: 'Tetracyklina', susceptibility: 'R', notes: 'Szczep oporny!' },
      ],
      treatmentPrescribed: true,
      medicationName: 'Baytril 10%',
      activeSubstance: 'Enrofloksacyna',
      dosageInstruction: '1.5 ml / 1 L wody przez 10 dni',
      treatmentDurationDays: 10,
      withdrawalDays: 14,
    };

    const result = evaluateVeterinaryLabReport(salmonellaReport);

    expect(result.flockHealthStatus).toBe('critical_isolation');
    expect(result.isFitForRacing).toBe(false);
    expect(result.statusLabel).toContain('KWARANTANNA');
    expect(result.actionableTherapySteps.some((s) => s.includes('IZOLACJA'))).toBe(true);
  });

  it('provides descriptive labels for all sample types', () => {
    expect(SAMPLE_TYPE_LABELS.pool_feces_3day).toContain('3-dniowa');
    expect(SAMPLE_TYPE_LABELS.crop_swab).toContain('wola');
    expect(SAMPLE_TYPE_LABELS.cloacal_swab_culture).toContain('posiew');
    expect(SAMPLE_TYPE_LABELS.blood_serology).toContain('serologia');
  });

  it('generates valid print-ready HTML diagnostic report with antibiogram and prescription', () => {
    const reportWithAntibiogram: VeterinaryLabReportData = {
      ...sampleHealthyReport,
      coccidiaOpg: 9200,
      ascaridiaPresent: true,
      ascaridiaEpg: 350,
      antibiogram: [
        { antibioticName: 'Toltrazuril', susceptibility: 'S', notes: 'Optimum' },
        { antibioticName: 'Lewamizol', susceptibility: 'S', notes: 'Odrobaczanie' },
      ],
      treatmentPrescribed: true,
      medicationName: 'Baycox 2.5% + Levamisol',
      activeSubstance: 'Toltrazuril, Lewamizol',
      dosageInstruction: '2 ml / 1 L przez 2 dni',
      treatmentDurationDays: 2,
      withdrawalDays: 5,
      retestRecommendedDays: 14,
    };

    const html = generateVeterinaryLabReportHtml(reportWithAntibiogram);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Zakład Higieny Weterynaryjnej (ZHW) Poznań');
    expect(html).toContain('SPRAWOZDANIE Z BADAŃ PARAZYTOLOGICZNYCH');
    expect(html).toContain('LAB-VET-2026/041');
    expect(html).toContain('9200 OPG');
    expect(html).toContain('Ascaridia columbae');
    expect(html).toContain('ANTYBIOGRAM');
    expect(html).toContain('Baycox 2.5%');
    expect(html).toContain('Lek. wet. Janusz Ptasiński');
  });
});
