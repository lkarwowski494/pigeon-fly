import {
  validatePigeonMortality,
  evaluateEpizooticRisk,
  generatePigeonMortalityProtocolHtml,
  PigeonMortalityProtocolData,
  CAUSE_LABELS,
  RING_DISPOSAL_LABELS,
  CARCASS_DISPOSAL_LABELS,
} from '../src/domain/pigeonMortalityProtocol';

const sampleProtocol: PigeonMortalityProtocolData = {
  protocolNumber: 'ZGON-2026/014',
  incidentDate: '2026-04-12',
  discoveryTime: '07:30',
  loftName: 'Mistrzowski Gołębnik Poznań',
  breederName: 'Tomasz Nowak',
  breederPzhgpNumber: 'PL-0284-1102',
  ringNumber: 'PL-0284-23-1402',
  sex: 'cock',
  plumageColor: 'Niebieski',
  birthYear: 2023,
  causeCategory: 'trauma_flight_collision',
  causeDescription: 'Zderzenie z linią napowietrzną wysokiego napięcia podczas porannego oblotu.',
  incidentLocation: 'Teren przyległy do gołębnika (50m od wlotu)',
  autopsyConducted: true,
  autopsyFindings: {
    muscleCondition: 'normal',
    cropCondition: 'Puste wole, bez nalotów rzęsistka.',
    liverCondition: 'Prawidłowa, brak zmian patologicznych.',
    airSacsCondition: 'Krwotok do prawego worka piersiowego na skutek złamania kości kruczej.',
    intestinesCondition: 'Brak zmian, perystaltyka zachowana.',
  },
  ringDisposal: 'ring_cut_destroyed',
  carcassDisposal: 'vet_cremation',
  disposalCompanyOrClinic: 'Lecznica Weterynaryjna AVI-MED Poznań',
  disposalCertificateNumber: 'UTYL-2026/889',
  veterinarianName: 'Lek. wet. Janusz Ptasiński',
  vetLicenseNumber: 'PWZW-10492',
  epizooticNotificationRequired: false,
  notes: 'Ptak wybitny lotnik — 14 konkursów. Zgon natychmiastowy na skutek urazu czaszkowo-mózgowego.',
};

describe('pigeonMortalityProtocol (Z-090 / DEC-104)', () => {
  it('validates a complete mortality and disposal protocol', () => {
    const res = validatePigeonMortality(sampleProtocol);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('detects missing mandatory protocol fields and requires vet name for euthanasia', () => {
    const invalid = validatePigeonMortality({
      ...sampleProtocol,
      ringNumber: '',
      protocolNumber: '',
      disposalCompanyOrClinic: '',
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.some((e) => e.includes('obrączki'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('protokołu'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('utylizującego'))).toBe(true);

    const euthanasiaNoVet = validatePigeonMortality({
      ...sampleProtocol,
      causeCategory: 'humane_euthanasia',
      veterinarianName: undefined,
    });
    expect(euthanasiaNoVet.isValid).toBe(false);
    expect(euthanasiaNoVet.errors.some((e) => e.includes('lekarza'))).toBe(true);
  });

  it('evaluates epizootic risk and flags mandatory PIW notification for PMV/Salmonella', () => {
    const traumaRisk = evaluateEpizooticRisk(sampleProtocol);
    expect(traumaRisk.requiresImmediatePiwReport).toBe(false);

    const infectiousPmv = evaluateEpizooticRisk({
      ...sampleProtocol,
      causeCategory: 'infectious_disease',
      epizooticDiseaseSuspected: 'Paramyksowiroza (PMV-1)',
      epizooticNotificationRequired: true,
    });
    expect(infectiousPmv.requiresImmediatePiwReport).toBe(true);
    expect(infectiousPmv.alertMessage).toContain('PIW');
    expect(infectiousPmv.alertMessage).toContain('Powiatowym Inspektoratem');

    const birdFluRisk = evaluateEpizooticRisk({
      ...sampleProtocol,
      causeCategory: 'infectious_disease',
      causeDescription: 'Podejrzenie wysoce zjadliwej grypy ptaków',
    });
    expect(birdFluRisk.requiresImmediatePiwReport).toBe(true);
  });

  it('contains comprehensive cause and disposal category labels', () => {
    expect(CAUSE_LABELS.predator).toContain('jastrząb');
    expect(CAUSE_LABELS.trauma_flight_collision).toContain('zderzenie');
    expect(CAUSE_LABELS.exhaustion_post_race).toContain('maratonie');
    expect(CAUSE_LABELS.humane_euthanasia).toContain('eutanazja');

    expect(RING_DISPOSAL_LABELS.ring_cut_destroyed).toContain('przecięta');
    expect(CARCASS_DISPOSAL_LABELS.vet_cremation).toContain('kremacja');
    expect(CARCASS_DISPOSAL_LABELS.rendering_plant_cat2_cat3).toContain('Kategoria 2/3');
  });

  it('generates valid print-ready HTML certificate for PIW and PZHGP', () => {
    const html = generatePigeonMortalityProtocolHtml(sampleProtocol);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Świadectwo Zgonu i Protokół Utylizacji');
    expect(html).toContain('ZGON-2026/014');
    expect(html).toContain('PL-0284-23-1402');
    expect(html).toContain('Tomasz Nowak');
    expect(html).toContain('Lek. wet. Janusz Ptasiński');
    expect(html).toContain('PWZW-10492');
    expect(html).toContain('Zderzenie z linią napowietrzną');
    expect(html).toContain('Lecznica Weterynaryjna AVI-MED');
    expect(html).toContain('WYREJESTROWANY (ZGON)');
  });
});
