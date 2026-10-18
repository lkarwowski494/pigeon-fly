import {
  ClockOpeningAuditProtocol,
  determineDriftStatus,
  validateClockOpeningProtocol,
  generateClockOpeningAuditHtml,
} from '../src/domain/clockOpeningAuditProtocol';
import clockFixture from './fixtures/clock-opening-audit.fixture.json';

describe('ClockOpeningAuditProtocol Domain (Z-098 / DEC-112)', () => {
  test('validates Ground Truth test vectors from clock-opening-audit.fixture.json', () => {
    clockFixture.vectors.forEach((v) => {
      const status = determineDriftStatus(v.drift_seconds, false);
      expect(status).toBe(v.expected_status);
    });
  });
  const sampleProtocol: ClockOpeningAuditProtocol = {
    id: 'clock-audit-2026-001',
    protocolNumber: 'OTWARCIE-2026/0284/01',
    raceName: 'Szczecin Narodowy 2026',
    raceDate: '2026-06-14',
    openingDate: '2026-06-14',
    openingTime: '19:30',
    stationName: 'Punkt Zegarowy Sekcja 02 Poniec',
    branchName: 'Oddział 0284 Gostyń',
    sectionName: 'Sekcja 02 Poniec',
    breederName: 'Janusz Kowalski',
    breederPzhgpNumber: '0284-1234',
    clockSystemType: 'esk_electronic',
    clockDeviceModel: 'Benzing M1',
    clockDeviceSerial: 'BNZ-M1-89104',
    sealSerialNumber: 'PLOMBA-78190',
    tamperSealIntact: true,
    driftSeconds: 0.8,
    driftStatus: 'normal_within_tolerance',
    isTwoDayRace: false,
    eskSyncSource: 'gps',
    totalArrivalsRecorded: 18,
    firstArrivalTime: '13:42:15',
    firstArrivalRing: 'PL-0284-22-1402',
    lastArrivalTime: '16:10:04',
    checksumHash: 'SHA256:8f4a1290bb34e91209cc542918231',
    verdict: 'approved',
    committeePresident: 'Marek Wiśniewski',
    committeeMember1: 'Tomasz Nowak',
    committeeMember2: 'Piotr Zieliński (Rachmistrz)',
    notes: 'Odczyt z bazy pamięci terminala przebiegł pomyślnie, brak kolizji chipów.',
  };

  test('determineDriftStatus evaluates single-day and two-day race limits correctly', () => {
    // 1-day race: <= 2.0s is normal
    expect(determineDriftStatus(1.5, false)).toBe('normal_within_tolerance');
    expect(determineDriftStatus(-2.0, false)).toBe('normal_within_tolerance');
    expect(determineDriftStatus(2.1, false)).toBe('drift_corrected');
    expect(determineDriftStatus(9.8, false)).toBe('drift_corrected');
    expect(determineDriftStatus(10.5, false)).toBe('disqualified_excessive_drift');
    expect(determineDriftStatus(-15.0, false)).toBe('disqualified_excessive_drift');

    // 2-day marathon: <= 4.0s is normal
    expect(determineDriftStatus(3.8, true)).toBe('normal_within_tolerance');
    expect(determineDriftStatus(5.5, true)).toBe('drift_corrected');
    expect(determineDriftStatus(14.9, true)).toBe('drift_corrected');
    expect(determineDriftStatus(16.0, true)).toBe('disqualified_excessive_drift');
  });

  test('validates fully compliant clock opening protocol with 3 committee members', () => {
    const val = validateClockOpeningProtocol(sampleProtocol);
    expect(val.isValid).toBe(true);
    expect(val.errors).toHaveLength(0);
  });

  test('rejects protocol missing committee members or serials', () => {
    const invalid: ClockOpeningAuditProtocol = {
      ...sampleProtocol,
      protocolNumber: '',
      clockDeviceSerial: '',
      committeeMember2: '',
    };
    const val = validateClockOpeningProtocol(invalid);
    expect(val.isValid).toBe(false);
    expect(val.errors).toHaveLength(3);
  });

  test('rejects approved verdict when seal is broken', () => {
    const brokenSeal: ClockOpeningAuditProtocol = {
      ...sampleProtocol,
      tamperSealIntact: false,
      verdict: 'approved',
    };
    const val = validateClockOpeningProtocol(brokenSeal);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('przy naruszonej lub zerwanej plombie'))).toBe(true);
  });

  test('rejects approved verdict when clock has excessive drift', () => {
    const excessiveDrift: ClockOpeningAuditProtocol = {
      ...sampleProtocol,
      driftSeconds: 15.0,
      driftStatus: 'disqualified_excessive_drift',
      verdict: 'approved',
    };
    const val = validateClockOpeningProtocol(excessiveDrift);
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes('z niedopuszczalną odchyłką chodu'))).toBe(true);
  });

  test('generates complete A4 HTML with verdict banner, ESK details, and 4 signatures', () => {
    const html = generateClockOpeningAuditHtml(sampleProtocol);
    expect(html).toContain('ZATWIERDZONY BEZ ZASTRZEŻEŃ');
    expect(html).toContain('OTWARCIE-2026/0284/01');
    expect(html).toContain('Benzing M1');
    expect(html).toContain('BNZ-M1-89104');
    expect(html).toContain('+0.8 s');
    expect(html).toContain('Marek Wiśniewski');
    expect(html).toContain('Janusz Kowalski');
  });
});
