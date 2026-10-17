import {
  calculateClockDrift,
  correctArrivalTimestamp,
  generateClockProtocolHtml,
  CLOCK_TYPES,
  ClockSyncSession,
  ClockProtocolData,
} from '../src/domain/clockSynchronization';

describe('Clock Synchronization & Offset Calculator (Z-071)', () => {
  const baseSession: ClockSyncSession = {
    clockId: 'clk-01',
    clockType: 'MECHANICAL_BENZING',
    clockNumber: 'B-77491',
    breederName: 'Janusz Kowalski (PL-0284-1234)',
    raceName: 'Magdeburg (375 km)',
    masterSyncStartIso: '2026-06-13T16:00:00Z',
    clockSyncStartIso: '2026-06-13T16:00:00Z',
    masterSyncEndIso: '2026-06-14T16:00:00Z', // 24.0h duration
    clockSyncEndIso: '2026-06-14T16:00:00Z', // 0 drift default
  };

  describe('calculateClockDrift (art. 44 Regulaminu PZHGP)', () => {
    it('detects PERFECT_SYNC when master and clock have 0.0s difference', () => {
      const result = calculateClockDrift(baseSession);
      expect(result.totalDriftSeconds).toBe(0);
      expect(result.hourlyDriftSeconds).toBe(0);
      expect(result.status).toBe('PERFECT_SYNC');
      expect(result.isDisqualified).toBe(false);
    });

    it('identifies NORMAL_TOLERANCE for slight drift within regulations', () => {
      const session: ClockSyncSession = {
        ...baseSession,
        clockSyncEndIso: '2026-06-14T16:00:04Z', // +4s over 24h (~0.167 s/h)
      };
      const result = calculateClockDrift(session);
      expect(result.totalDriftSeconds).toBe(4);
      expect(result.sessionDurationHours).toBe(24);
      expect(result.status).toBe('NORMAL_TOLERANCE');
      expect(result.isDisqualified).toBe(false);
    });

    it('identifies ACCEPTABLE_DRIFT when approaching hourly limits', () => {
      const session: ClockSyncSession = {
        ...baseSession,
        masterSyncEndIso: '2026-06-14T02:00:00Z', // 10h duration
        clockSyncEndIso: '2026-06-14T02:00:22Z', // +22s over 10h = 2.2 s/h (>= 70% of 3.0)
      };
      const result = calculateClockDrift(session);
      expect(result.totalDriftSeconds).toBe(22);
      expect(result.hourlyDriftSeconds).toBe(2.2);
      expect(result.status).toBe('ACCEPTABLE_DRIFT');
      expect(result.isDisqualified).toBe(false);
    });

    it('flags DISQUALIFIED_EXCEEDED when exceeding max hourly tolerance (> 3.0 s/h)', () => {
      const session: ClockSyncSession = {
        ...baseSession,
        masterSyncEndIso: '2026-06-14T02:00:00Z', // 10h
        clockSyncEndIso: '2026-06-14T02:00:40Z', // +40s over 10h = 4.0 s/h (> 3.0 s/h)
      };
      const result = calculateClockDrift(session);
      expect(result.status).toBe('DISQUALIFIED_EXCEEDED');
      expect(result.isDisqualified).toBe(true);
      expect(result.disqualificationReason).toContain('Przekroczono dopuszczalną odchyłkę');
    });

    it('respects stricter limits for ELECTRONIC_ESK clocks (max 1.0 s/h)', () => {
      const session: ClockSyncSession = {
        ...baseSession,
        clockType: 'ELECTRONIC_ESK',
        masterSyncEndIso: '2026-06-14T02:00:00Z', // 10h
        clockSyncEndIso: '2026-06-14T02:00:15Z', // +15s over 10h = 1.5 s/h (> 1.0 s/h for ESK)
      };
      const result = calculateClockDrift(session);
      expect(result.isDisqualified).toBe(true);
      expect(result.status).toBe('DISQUALIFIED_EXCEEDED');
    });
  });

  describe('correctArrivalTimestamp (Proportional Math)', () => {
    it('proportionally corrects arrival time for clock running fast', () => {
      // 24h duration, +24s total drift (clock running 1s fast per hour)
      const session: ClockSyncSession = {
        ...baseSession,
        clockSyncEndIso: '2026-06-14T16:00:24Z',
      };
      const drift = calculateClockDrift(session);

      // Bird clocked exactly halfway through session (after 12 hours)
      const clockArrivalIso = '2026-06-14T04:00:00Z';
      const raceDistanceMeters = 360000; // 360 km

      const corrected = correctArrivalTimestamp({
        clockArrivalIso,
        syncSession: session,
        driftResult: drift,
        raceDistanceMeters,
      });

      // Exactly half of +24s is +12s correction offset
      expect(corrected.correctionOffsetSeconds).toBe(12);

      // Official arrival must be 12s earlier than clock
      const expectedTime = new Date('2026-06-14T04:00:00Z').getTime() - 12000;
      expect(new Date(corrected.officialArrivalIso).getTime()).toBe(expectedTime);
      expect(corrected.officialCorrectedVelocityMPerMin).toBeGreaterThan(corrected.originalVelocityMPerMin);
      expect(corrected.explanation).toContain('odjęto 12.0 s');
    });
  });

  describe('generateClockProtocolHtml', () => {
    it('generates compliant official PZHGP clock protocol A4 document', () => {
      const protocolData: ClockProtocolData = {
        protocolNumber: 'PZ-2026/04/12',
        issueDate: '2026-06-14',
        raceName: 'Magdeburg',
        pzhgpBranch: 'Oddział 0284 Gostyń',
        pzhgpSection: 'Sekcja 01',
        session: baseSession,
        drift: calculateClockDrift(baseSession),
        arrivals: [
          {
            ringNumber: 'PL-0284-23-1402',
            clockTime: '2026-06-14T11:15:30Z',
            correctedTime: '2026-06-14T11:15:30Z',
            driftSeconds: 0,
            officialVelocity: 1342.54,
          },
        ],
      };

      const html = generateClockProtocolHtml(protocolData);

      expect(html).toContain('Oficjalny Protokół Rozliczenia i Korekty Chodu Zegara');
      expect(html).toContain('art. 44 Regulaminu PZHGP');
      expect(html).toContain('PZ-2026/04/12');
      expect(html).toContain('B-77491');
      expect(html).toContain('Janusz Kowalski');
      expect(html).toContain('PL-0284-23-1402');
      expect(html).toContain('1342.54 m/min');
      expect(html).toContain('Przewodniczący Komisji Zegarowej');
    });
  });
});
