import {
  FoundPigeonEntry,
  decodeRingCountry,
  validateFoundPigeonEntry,
  calculateFoundPigeonsStats,
  generateFoundPigeonProtocolHtml,
} from '../src/domain/foundPigeonRegistry';

describe('FoundPigeonRegistry Domain (Z-097 / DEC-111)', () => {
  const sampleEntry: FoundPigeonEntry = {
    id: 'found-2026-001',
    ringNumber: 'DV-01234-23-567',
    countryCode: 'DV',
    foreignFederationName: 'Niemcy (Verband Deutscher Brieftaubenzüchter)',
    discoveryDate: '2026-07-04',
    discoveryTime: '18:30',
    finderName: 'Janusz Kowalski',
    finderPhone: '+48 601 234 567',
    finderLoftAddress: 'ul. Słoneczna 12, 63-800 Gostyń',
    finderBranch: 'Oddział 0284 Gostyń',
    quarantineCageNumber: 'IZO-03',
    status: 'in_quarantine',
    exhaustionLevel: 'moderate',
    plumageColor: 'Niebieska-Pstra',
    sex: 'cock',
    electronicChipCode: 'BNZ-89104',
    symptoms: ['emaciation_keel', 'severe_dehydration'],
    treatmentGiven:
      'Pojenie elektrolitowe hipotoniczne, roztwór glukozy, kardi i drobna kukurydza, zakwaszacz pH 4.0.',
    ownerName: 'Hans Müller',
    ownerPhone: '+49 171 1234567',
    ownerBranch: 'RV Leipzig 01234',
    contactMethod: 'phone_call',
    notes: 'Ptak zgłoszony do niemieckiego związku, właściciel poprosił o odkarmienie i wypuszczenie.',
  };

  test('decodeRingCountry correctly decodes PL and international rings', () => {
    expect(decodeRingCountry('PL-0284-23-1402')).toEqual({
      countryCode: 'PL',
      federationName: 'Polska (PZHGP)',
      isForeign: false,
    });
    expect(decodeRingCountry('DV-01234-22-100')).toEqual({
      countryCode: 'DV',
      federationName: 'Niemcy (Verband Deutscher Brieftaubenzüchter)',
      isForeign: true,
    });
    expect(decodeRingCountry('BE-23-6012345')).toEqual({
      countryCode: 'BE',
      federationName: 'Belgia (KBDB / RFCB)',
      isForeign: true,
    });
    expect(decodeRingCountry('NL-23-1456789')).toEqual({
      countryCode: 'NL',
      federationName: 'Holandia (NPO - Nederlandse Postduivenhouders Organisatie)',
      isForeign: true,
    });
    expect(decodeRingCountry('CZ-23-0101-500')).toEqual({
      countryCode: 'CZ',
      federationName: 'Czechy (ČMSSKHP)',
      isForeign: true,
    });
    expect(decodeRingCountry('SK-23-0202-777')).toEqual({
      countryCode: 'SK',
      federationName: 'Słowacja (SZCHPH)',
      isForeign: true,
    });
    expect(decodeRingCountry('FR-23-999999')).toEqual({
      countryCode: 'OTHER',
      federationName: 'Inna federacja zagraniczna (FCI)',
      isForeign: true,
    });
  });

  test('validates correctly filled entry with quarantine isolation cage', () => {
    const val = validateFoundPigeonEntry(sampleEntry);
    expect(val.isValid).toBe(true);
    expect(val.errors).toHaveLength(0);
  });

  test('rejects entry missing ring number, discovery date, or quarantine cage', () => {
    const invalid: FoundPigeonEntry = {
      ...sampleEntry,
      ringNumber: '',
      discoveryDate: '',
      quarantineCageNumber: '',
    };
    const val = validateFoundPigeonEntry(invalid);
    expect(val.isValid).toBe(false);
    expect(val.errors).toHaveLength(3);
  });

  test('requires ownerName when status is repatriated_to_owner', () => {
    const repatriatedWithoutOwner: FoundPigeonEntry = {
      ...sampleEntry,
      status: 'repatriated_to_owner',
      ownerName: undefined,
    };
    const val = validateFoundPigeonEntry(repatriatedWithoutOwner);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('wymagane jest nazwisko właściciela'))).toBe(true);
  });

  test('calculates accurate statistics for found pigeons list', () => {
    const list: FoundPigeonEntry[] = [
      sampleEntry,
      {
        ...sampleEntry,
        id: 'found-2',
        ringNumber: 'PL-0284-23-9999',
        countryCode: 'PL',
        status: 'repatriated_to_owner',
        exhaustionLevel: 'critical',
      },
      {
        ...sampleEntry,
        id: 'found-3',
        ringNumber: 'BE-23-1111111',
        countryCode: 'BE',
        status: 'released_after_recovery',
        exhaustionLevel: 'mild',
      },
    ];

    const stats = calculateFoundPigeonsStats(list);
    expect(stats.total).toBe(3);
    expect(stats.inQuarantine).toBe(1);
    expect(stats.repatriated).toBe(1);
    expect(stats.released).toBe(1);
    expect(stats.foreignCount).toBe(2);
    expect(stats.criticalCount).toBe(1); // sampleEntry is moderate, found-2 is critical, found-3 is mild
  });

  test('generates complete A4 HTML with biosecurity warning and repatriation details', () => {
    const html = generateFoundPigeonProtocolHtml(sampleEntry);
    expect(html).toContain('PROTOKÓŁ PRZYJĘCIA BŁĄKACZA');
    expect(html).toContain('DV-01234-23-567');
    expect(html).toContain('IZO-03');
    expect(html).toContain('Hans Müller');
    expect(html).toContain('Janusz Kowalski');
    expect(html).toContain('Niemcy (Verband Deutscher Brieftaubenzüchter)');
  });
});
