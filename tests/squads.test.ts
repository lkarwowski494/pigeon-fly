import {
  getDefaultSquadPresets,
  canAssignToSquad,
  analyzeSquad,
  assignPigeonToSquad,
  removePigeonFromSquad,
  RacingSquad,
} from '../src/domain/squads';
import { Pigeon } from '../src/domain/types';

describe('PIGEON-FLY — Racing Squads & Tactical Teams (BR-STADO-006, Z-018)', () => {
  const currentYear = 2026;

  const mockAdultCock: Pigeon = {
    id: 'p-adult-cock',
    loftId: 'loft-01',
    ringNumber: 'PL-0284-23-1402',
    countryCode: 'PL',
    year: 2023,
    sex: 'cock',
    plumageColor: 'Niebieski',
    status: 'racing',
    qrCodeUuid: 'uuid-1',
    isDeleted: false,
    createdAt: '',
    updatedAt: '',
  };

  const mockAdultHen: Pigeon = {
    id: 'p-adult-hen',
    loftId: 'loft-01',
    ringNumber: 'PL-0284-22-9854',
    countryCode: 'PL',
    year: 2022,
    sex: 'hen',
    plumageColor: 'Pstra',
    status: 'racing',
    qrCodeUuid: 'uuid-2',
    isDeleted: false,
    createdAt: '',
    updatedAt: '',
  };

  const mockYoungster: Pigeon = {
    id: 'p-youngster',
    loftId: 'loft-01',
    ringNumber: 'PL-0284-26-101',
    countryCode: 'PL',
    year: 2026,
    sex: 'cock',
    plumageColor: 'Ciemna',
    status: 'racing',
    qrCodeUuid: 'uuid-3',
    isDeleted: false,
    createdAt: '',
    updatedAt: '',
  };

  const mockBreederPigeon: Pigeon = {
    id: 'p-breeder',
    loftId: 'loft-01',
    ringNumber: 'DV-0123-20-44',
    countryCode: 'DV',
    year: 2020,
    sex: 'cock',
    plumageColor: 'Płowa',
    status: 'breeding', // Not racing!
    qrCodeUuid: 'uuid-4',
    isDeleted: false,
    createdAt: '',
    updatedAt: '',
  };

  describe('Squad Presets', () => {
    it('returns standard 4 squad presets with distinct colors and categories', () => {
      const presets = getDefaultSquadPresets('loft-01');
      expect(presets).toHaveLength(4);
      expect(presets.map((s) => s.type)).toEqual([
        'championship_a',
        'middle_distance_b',
        'marathon_c',
        'youngsters',
      ]);
      expect(presets[0].maxCapacity).toBe(50);
      expect(presets[0].color).toBe('#E5A93C');
    });
  });

  describe('canAssignToSquad', () => {
    const squads = getDefaultSquadPresets('loft-01');
    const squadA = squads[0];
    const squadYoung = squads[3];

    it('rejects pigeon that is not in racing status', () => {
      const result = canAssignToSquad(squadA, mockBreederPigeon, currentYear);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('breeding');
    });

    it('rejects adult pigeon from Youngsters squad', () => {
      const result = canAssignToSquad(squadYoung, mockAdultCock, currentYear);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('bieżącego rocznika');
    });

    it('rejects current year youngster from adult Championship A or Marathon C squads', () => {
      const result = canAssignToSquad(squadA, mockYoungster, currentYear);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('dorosłej drużyny');
    });

    it('rejects assignment if squad is at max capacity', () => {
      const fullSquad: RacingSquad = {
        ...squadA,
        maxCapacity: 2,
        assignedPigeonIds: ['p-1', 'p-2'],
      };
      const result = canAssignToSquad(fullSquad, mockAdultCock, currentYear);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('maksymalną pojemność');
    });

    it('allows valid assignment', () => {
      const resultAdult = canAssignToSquad(squadA, mockAdultCock, currentYear);
      expect(resultAdult.allowed).toBe(true);

      const resultYoung = canAssignToSquad(squadYoung, mockYoungster, currentYear);
      expect(resultYoung.allowed).toBe(true);
    });
  });

  describe('analyzeSquad', () => {
    it('analyzes empty squad gracefully', () => {
      const squads = getDefaultSquadPresets('loft-01');
      const analysis = analyzeSquad({ squad: squads[0], pigeons: [] });
      expect(analysis.totalBirds).toBe(0);
      expect(analysis.averageAgeYears).toBe(0);
      expect(analysis.readinessScorePct).toBe(100);
    });

    it('computes accurate flock demographics, prizes, and average Coeff', () => {
      const squads = getDefaultSquadPresets('loft-01');
      const squadA: RacingSquad = {
        ...squads[0],
        assignedPigeonIds: ['p-adult-cock', 'p-adult-hen'],
      };

      const pigeons = [mockAdultCock, mockAdultHen];
      const performances = {
        'p-adult-cock': {
          prizesCount: 8,
          concourseKm: 2450.5,
          averageCoeff: 4.25,
          isFit: true,
        },
        'p-adult-hen': {
          prizesCount: 6,
          concourseKm: 1820.0,
          averageCoeff: 7.75,
          isFit: false,
        },
      };

      const analysis = analyzeSquad({
        squad: squadA,
        pigeons,
        performances,
        currentYear,
      });

      expect(analysis.totalBirds).toBe(2);
      expect(analysis.cocksCount).toBe(1);
      expect(analysis.hensCount).toBe(1);
      // Ages: Cock born 2023 (age 3), Hen born 2022 (age 4) => average 3.5
      expect(analysis.averageAgeYears).toBe(3.5);
      expect(analysis.totalPrizes).toBe(14);
      expect(analysis.totalConcourseKm).toBe(4270.5);
      expect(analysis.averageCoeff).toBe(6.0); // (4.25 + 7.75) / 2 = 6.0
      expect(analysis.readinessScorePct).toBe(50); // 1 out of 2 isFit
      expect(analysis.isAtCapacity).toBe(false);
    });
  });

  describe('assignPigeonToSquad & removePigeonFromSquad', () => {
    it('assigns bird and ensures exclusivity across squads', () => {
      let squads = getDefaultSquadPresets('loft-01');
      const squadAId = squads[0].id;
      const squadBId = squads[1].id;

      // Assign to Squad A
      squads = assignPigeonToSquad({
        squads,
        pigeonId: mockAdultCock.id,
        targetSquadId: squadAId,
        pigeon: mockAdultCock,
        currentYear,
      });

      expect(squads.find((s) => s.id === squadAId)?.assignedPigeonIds).toContain(mockAdultCock.id);

      // Reassign to Squad B => must be automatically removed from Squad A
      squads = assignPigeonToSquad({
        squads,
        pigeonId: mockAdultCock.id,
        targetSquadId: squadBId,
        pigeon: mockAdultCock,
        currentYear,
      });

      expect(squads.find((s) => s.id === squadAId)?.assignedPigeonIds).not.toContain(mockAdultCock.id);
      expect(squads.find((s) => s.id === squadBId)?.assignedPigeonIds).toContain(mockAdultCock.id);
    });

    it('removes bird from squad', () => {
      let squads = getDefaultSquadPresets('loft-01');
      const squadAId = squads[0].id;

      squads = assignPigeonToSquad({
        squads,
        pigeonId: mockAdultCock.id,
        targetSquadId: squadAId,
        pigeon: mockAdultCock,
        currentYear,
      });

      squads = removePigeonFromSquad({
        squads,
        pigeonId: mockAdultCock.id,
        squadId: squadAId,
      });

      expect(squads.find((s) => s.id === squadAId)?.assignedPigeonIds).not.toContain(mockAdultCock.id);
    });
  });
});
