import {
  validateEskRegistration,
  generateEskRegistrationProtocolHtml,
  EskRegistrationData,
} from '../src/domain/eskRegistrationProtocol';

const sampleEskData: EskRegistrationData = {
  protocolNumber: 'ESK/0284/2026/014',
  verificationDate: '2026-04-18',
  seasonYear: 2026,
  breederName: 'Jan Kowalski',
  breederPzhgpNumber: 'PL-0284-1420',
  branchName: '0284 Nowy Tomyśl',
  sectionName: 'Sekcja 01 Zbąszyń',
  loftAddress: 'ul. Parkowa 12, 64-360 Zbąszyń',
  loftLatitude: 52.25142,
  loftLongitude: 15.91845,
  systemBrand: 'Tauris',
  baseStationSerial: 'TAU-BASE-89410',
  terminalSerial: 'TAU-TERM-11204',
  softwareVersion: 'v14.02-PL',
  backupBatteryWorking: true,
  timeSyncSource: 'DCF-77',
  antennas: [
    {
      id: 'ant-1',
      antennaNumber: 1,
      padModel: 'Tauris 4-polowa',
      serialNumber: 'ANT-4P-99210',
      fieldCount: 4,
      entranceLocation: 'Wylot Wdowcy (Północ)',
      cableLengthMeters: 15,
      sensitivityDistanceCm: 7.5,
      sensitivityTestPassed: true,
    },
    {
      id: 'ant-2',
      antennaNumber: 2,
      padModel: 'Tauris 2-polowa',
      serialNumber: 'ANT-2P-44102',
      fieldCount: 2,
      entranceLocation: 'Wylot Samice (Wschód)',
      cableLengthMeters: 8,
      sensitivityDistanceCm: 6.0,
      sensitivityTestPassed: true,
    },
  ],
  tamperSeals: [
    {
      id: 'seal-1',
      sealNumber: 'PL-PZHGP-2026-8812',
      sealLocation: 'Złącze magistrali stacji matki',
      installedDate: '2026-04-18',
    },
  ],
  commissionMember1: 'Marek Nowak',
  commissionMember2: 'Piotr Wiśniewski',
  commissionPresident: 'Tadeusz Zieliński',
  commissionNotes: 'Instalacja w pełni ekranowana, brak zakłóceń elektromagnetycznych.',
};

describe('eskRegistrationProtocol (Z-084 / DEC-98)', () => {
  it('validates compliant ESK installation successfully', () => {
    const result = validateEskRegistration(sampleEskData);

    expect(result.isCompliant).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.totalAntennaFields).toBe(6); // 4 + 2
    expect(result.allAntennasPassedSensitivity).toBe(true);
  });

  it('rejects installation if antenna fails PZHGP sensitivity threshold (< 5.0 cm)', () => {
    const invalidData: EskRegistrationData = {
      ...sampleEskData,
      antennas: [
        {
          ...sampleEskData.antennas[0],
          sensitivityDistanceCm: 4.2,
          sensitivityTestPassed: false,
        },
      ],
    };

    const result = validateEskRegistration(invalidData);
    expect(result.isCompliant).toBe(false);
    expect(result.allAntennasPassedSensitivity).toBe(false);
    expect(result.errors.some((e) => e.includes('nie spełnia normy czułości PZHGP'))).toBe(true);
  });

  it('detects missing base serial and commission members', () => {
    const incompleteData: EskRegistrationData = {
      ...sampleEskData,
      baseStationSerial: '',
      commissionMember2: '',
    };

    const result = validateEskRegistration(incompleteData);
    expect(result.isCompliant).toBe(false);
    expect(result.errors.some((e) => e.includes('stacji matki'))).toBe(true);
    expect(result.errors.some((e) => e.includes('Komisji Zegarowej'))).toBe(true);
  });

  it('flags warning when battery backup is failing', () => {
    const dataWithoutBattery: EskRegistrationData = {
      ...sampleEskData,
      backupBatteryWorking: false,
    };

    const result = validateEskRegistration(dataWithoutBattery);
    expect(result.warnings.some((w) => w.includes('akumulatorowego'))).toBe(true);
  });

  it('generates valid official PZHGP HTML document with antennas and signatures', () => {
    const html = generateEskRegistrationProtocolHtml(sampleEskData);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH');
    expect(html).toContain('Protokół Zgłoszenia i Weryfikacji Stacji Zegarowej ESK');
    expect(html).toContain('Jan Kowalski');
    expect(html).toContain('PL-0284-1420');
    expect(html).toContain('TAU-BASE-89410');
    expect(html).toContain('Tauris 4-polowa');
    expect(html).toContain('PL-PZHGP-2026-8812');
    expect(html).toContain('Marek Nowak');
    expect(html).toContain('Tadeusz Zieliński');
    expect(html).toContain('SYSTEM ZWERYFIKOWANY');
  });
});
