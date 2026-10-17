import {
  calculateSealingReadiness,
  generateCabinSealingProtocolHtml,
  SEAL_POSITIONS,
  CabinSealingProtocolData,
} from '../src/domain/cabinSealingProtocol';

describe('Transport Cabin Sealing & Welfare Verification Protocol Engine (Z-072)', () => {
  const baseProtocol: CabinSealingProtocolData = {
    protocolNumber: 'PLOMB-2026/06/02',
    issueDate: '2026-06-13',
    departureTimeIso: '2026-06-13T19:30:00Z',
    pzhgpBranch: 'Oddział 0284 Gostyń',
    pzhgpSection: 'Sekcja 01 Gostyń-Centrum',
    raceName: 'Lot nr 4: Magdeburg',
    releasePlace: 'Magdeburg (Niemcy)',
    vehicleRegistrationPlate: 'PGS 44102',
    cabinModel: 'Geraldy 3000 Eco-Vent',
    convoyLeaderName: 'Andrzej Woźniak',
    convoyLeaderPhone: '+48 601 234 567',
    driverName: 'Marek Szymański',
    commissionChairmanName: 'Tadeusz Kaczmarek',
    commissionMemberName: 'Piotr Nowak',
    seals: [
      {
        id: 's-1',
        position: 'LEFT_SIDE_CURTAIN',
        sealCode: 'PL-0284-SEAL-01298',
        isVerifiedIntact: true,
      },
      {
        id: 's-2',
        position: 'RIGHT_SIDE_CURTAIN',
        sealCode: 'PL-0284-SEAL-01299',
        isVerifiedIntact: true,
      },
      {
        id: 's-3',
        position: 'REAR_INSPECTION_DOOR',
        sealCode: 'PL-0284-SEAL-01300',
        isVerifiedIntact: true,
      },
      {
        id: 's-4',
        position: 'RELEASE_MECHANISM_LOCK',
        sealCode: 'PL-0284-SEAL-01301',
        isVerifiedIntact: true,
      },
      {
        id: 's-5',
        position: 'WATER_TANK_VALVE',
        sealCode: 'PL-0284-SEAL-01302',
        isVerifiedIntact: true,
      },
    ],
    welfare: {
      floorGratesAndBeddingOk: true,
      wateringSystemFunctioning: true,
      freshWaterLoadedLiters: 180,
      ventilationFansOperational: true,
      temperatureSensorsOperational: true,
      densityNormsCompliant: true,
      totalBasketsCount: 96,
      totalPigeonsCount: 2400,
      avgPigeonsPerBasket: 25,
    },
    routeNotes: 'Trasa: Gostyń -> A2 -> Magdeburg. Postój na pojenie o 02:00.',
  };

  describe('calculateSealingReadiness', () => {
    it('approves departure when all seals are intact and welfare checklist is 100% compliant', () => {
      const result = calculateSealingReadiness(baseProtocol);
      expect(result.isReadyForDeparture).toBe(true);
      expect(result.totalSealsCount).toBe(5);
      expect(result.missingSealsCount).toBe(0);
      expect(result.checklistIssues.length).toBe(0);
      expect(result.readinessScorePct).toBe(100);
    });

    it('rejects departure if less than 4 seals are registered', () => {
      const protocol: CabinSealingProtocolData = {
        ...baseProtocol,
        seals: [baseProtocol.seals[0], baseProtocol.seals[1]], // only 2 seals
      };
      const result = calculateSealingReadiness(protocol);
      expect(result.isReadyForDeparture).toBe(false);
      expect(result.checklistIssues.some((i) => i.includes('minimum 4'))).toBe(true);
    });

    it('flags damaged or missing seal code', () => {
      const protocol: CabinSealingProtocolData = {
        ...baseProtocol,
        seals: [
          ...baseProtocol.seals.slice(0, 4),
          { id: 's-bad', position: 'WATER_TANK_VALVE', sealCode: '', isVerifiedIntact: false },
        ],
      };
      const result = calculateSealingReadiness(protocol);
      expect(result.isReadyForDeparture).toBe(false);
      expect(result.missingSealsCount).toBe(1);
    });

    it('blocks departure if fresh water reserve is below 100 liters', () => {
      const protocol: CabinSealingProtocolData = {
        ...baseProtocol,
        welfare: {
          ...baseProtocol.welfare,
          freshWaterLoadedLiters: 50, // under 100 l
        },
      };
      const result = calculateSealingReadiness(protocol);
      expect(result.isReadyForDeparture).toBe(false);
      expect(result.checklistIssues.some((i) => i.includes('rezerwa wody'))).toBe(true);
    });

    it('blocks departure if mechanical ventilation fans failed', () => {
      const protocol: CabinSealingProtocolData = {
        ...baseProtocol,
        welfare: {
          ...baseProtocol.welfare,
          ventilationFansOperational: false,
        },
      };
      const result = calculateSealingReadiness(protocol);
      expect(result.isReadyForDeparture).toBe(false);
      expect(result.checklistIssues.some((i) => i.includes('wentylatorów'))).toBe(true);
    });
  });

  describe('generateCabinSealingProtocolHtml', () => {
    it('generates compliant official PZHGP document with all seals and welfare metrics', () => {
      const html = generateCabinSealingProtocolHtml(baseProtocol);

      expect(html).toContain('Urzędowy Protokół Plombowania i Stanu Technicznego Kabiny');
      expect(html).toContain('PLOMB-2026/06/02');
      expect(html).toContain('Oddział 0284 Gostyń');
      expect(html).toContain('PGS 44102');
      expect(html).toContain('Andrzej Woźniak');
      expect(html).toContain('PL-0284-SEAL-01298');
      expect(html).toContain('PL-0284-SEAL-01301');
      expect(html).toContain('2400'); // total pigeons
      expect(html).toContain('180 l'); // water
      expect(html).toContain('ZATWIERDZONY');
      expect(html).toContain('Główny Konwojent Lotu');
      expect(html).toContain('Kierowca Kabiny');
      expect(html).toContain('Przewodniczący Komisji Koszowej');
    });
  });

  describe('SEAL_POSITIONS registry', () => {
    it('defines standard PZHGP cabin inspection positions', () => {
      expect(SEAL_POSITIONS.LEFT_SIDE_CURTAIN.label).toContain('Lewej Strony');
      expect(SEAL_POSITIONS.RIGHT_SIDE_CURTAIN.label).toContain('Prawej Strony');
      expect(SEAL_POSITIONS.RELEASE_MECHANISM_LOCK.label).toContain('Spustowego');
      expect(SEAL_POSITIONS.WATER_TANK_VALVE.label).toContain('Wody');
    });
  });
});
