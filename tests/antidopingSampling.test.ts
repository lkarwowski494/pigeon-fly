import {
  validateAntidopingSampling,
  generateAntidopingSamplingHtml,
  AntidopingSamplingData,
  SAMPLE_EVENT_LABELS,
  SAMPLE_TYPE_LABELS,
} from '../src/domain/antidopingSamplingProtocol';

const sampleAntidopingData: AntidopingSamplingData = {
  protocolNumber: 'DOP-FCI-2026/007',
  samplingDate: '2026-05-16',
  samplingTime: '19:45',
  event: 'race_basketing',
  eventName: 'Lot Narodowy Bruksela (980 km)',
  samplingLocation: 'Punkt Koszowania Poznań Wilda',
  pigeon: {
    ringNumber: 'PL-0284-23-1402',
    sex: 'cock',
    plumageColor: 'Niebieski',
    electronicChipSerial: 'CHIP-99014',
    concourseArrivalOrder: 1,
  },
  breederName: 'Tomasz Nowak',
  breederPzhgpNumber: 'PL-0284-1102',
  sampleType: 'feces_pool',
  sampleASerial: 'FCI-A-89104',
  sampleBSerial: 'FCI-B-89105',
  tamperEvidentSealIntact: true,
  storageTemperatureCelsius: 4,
  transportContainerSerial: 'COOL-FCI-03',
  targetLaboratory: 'Ghent University Anti-Doping Lab (Ghent, Belgium)',
  fciInspectorName: 'Marek Wiśniewski',
  veterinarianName: 'Lek. wet. Janusz Ptasiński',
  vetLicenseNumber: 'PWZW-10492',
  breederWitnessName: 'Tomasz Nowak',
  breederPresentDuringSealing: true,
  breederObjections: 'Brak zastrzeżeń do procedury pobrania i plombowania.',
  notes: 'Losowanie wyrywkowe przeprowadzone komisyjnie przed załadunkiem do kabiny.',
};

describe('antidopingSamplingProtocol (Z-093 / DEC-107)', () => {
  it('validates a complete and compliant anti-doping sampling protocol', () => {
    const res = validateAntidopingSampling(sampleAntidopingData);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('detects missing fields (protocolNumber, ringNumber, vetLicenseNumber, inspectorName)', () => {
    const invalid = validateAntidopingSampling({
      ...sampleAntidopingData,
      protocolNumber: '',
      pigeon: { ...sampleAntidopingData.pigeon, ringNumber: '' },
      vetLicenseNumber: '',
      fciInspectorName: '',
    });

    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.some((e) => e.includes('protokołu'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('obrączki'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('PWZW'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('delegata'))).toBe(true);
  });

  it('rejects identical seal serials for Sample A and Sample B', () => {
    const duplicateSeals = validateAntidopingSampling({
      ...sampleAntidopingData,
      sampleASerial: 'FCI-SAME-001',
      sampleBSerial: 'FCI-SAME-001',
    });

    expect(duplicateSeals.isValid).toBe(false);
    expect(duplicateSeals.errors.some((e) => e.includes('unikalne'))).toBe(true);
  });

  it('requires breeder presence during sample sealing', () => {
    const noBreeder = validateAntidopingSampling({
      ...sampleAntidopingData,
      breederPresentDuringSealing: false,
    });

    expect(noBreeder.isValid).toBe(false);
    expect(noBreeder.errors.some((e) => e.includes('obecność'))).toBe(true);
  });

  it('provides comprehensive event and sample type labels', () => {
    expect(SAMPLE_EVENT_LABELS.race_basketing).toContain('Koszowanie');
    expect(SAMPLE_EVENT_LABELS.race_arrival).toContain('przylotowa');
    expect(SAMPLE_TYPE_LABELS.feces_pool).toContain('kału');
    expect(SAMPLE_TYPE_LABELS.crop_lavage).toContain('wola');
  });

  it('generates valid print-ready HTML certificate for FCI and PZHGP', () => {
    const html = generateAntidopingSamplingHtml(sampleAntidopingData);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Protokół Pobrania Prób do Kontroli Antydopingowej');
    expect(html).toContain('DOP-FCI-2026/007');
    expect(html).toContain('PL-0284-23-1402');
    expect(html).toContain('FCI-A-89104');
    expect(html).toContain('FCI-B-89105');
    expect(html).toContain('PWZW: PWZW-10492');
    expect(html).toContain('Lek. wet. Janusz Ptasiński');
    expect(html).toContain('Marek Wiśniewski');
    expect(html).toContain('Ghent University');
  });
});
