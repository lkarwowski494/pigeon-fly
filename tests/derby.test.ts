/**
 * Unit Tests for Private Section Mini-Derby Engine
 */

import {
  calculateDerbyStandings,
  generateDerbyLiveFeed,
  generateDerbyBroadcastCode,
  calculateLoftDerbyDistance,
  MiniDerbyRace,
  DerbyArrival,
} from '../src/domain/derby';

describe('Private Section Mini-Derby Engine', () => {
  const mockDerby: MiniDerbyRace = {
    id: 'derby-01',
    name: 'Derby Sekcji Rawicz',
    releasePointName: 'Magdeburg',
    releaseLat: 52.13,
    releaseLon: 11.62,
    releaseTime: '2026-06-14T06:00:00Z',
    participatingLofts: [
      {
        loftId: 'loft-a',
        loftName: 'Gołębnik Mistrza',
        fancierName: 'Stanisław Kowalski',
        latitude: 51.88,
        longitude: 17.02,
        geodesicDistanceMeters: 382450,
      },
      {
        loftId: 'loft-b',
        loftName: 'Wichura Loft',
        fancierName: 'Marek Nowak',
        latitude: 51.95,
        longitude: 17.15,
        geodesicDistanceMeters: 391200,
      },
      {
        loftId: 'loft-c',
        loftName: 'Srebrne Skrzydło',
        fancierName: 'Andrzej Wiśniewski',
        latitude: 51.82,
        longitude: 16.90,
        geodesicDistanceMeters: 374000,
      },
    ],
  };

  const mockArrivals: DerbyArrival[] = [
    {
      arrivalId: 'arr-1',
      loftId: 'loft-a',
      pigeonId: 'p-01',
      ringNumber: 'PL-0284-23-1402',
      arrivalTime: '2026-06-14T10:45:00Z',
      distanceMeters: 382450,
      velocityMPerMin: 1341.93,
    },
    {
      arrivalId: 'arr-2',
      loftId: 'loft-b',
      pigeonId: 'p-02',
      ringNumber: 'PL-0284-24-5501',
      arrivalTime: '2026-06-14T10:50:00Z',
      distanceMeters: 391200,
      velocityMPerMin: 1348.97, // Higher speed despite arriving 5 minutes later because longer distance!
    },
    {
      arrivalId: 'arr-3',
      loftId: 'loft-c',
      pigeonId: 'p-03',
      ringNumber: 'PL-0284-22-9011',
      arrivalTime: '2026-06-14T10:44:00Z',
      distanceMeters: 374000,
      velocityMPerMin: 1316.90,
    },
  ];

  test('correctly calculates geodesic distance for a participating loft', () => {
    const dist = calculateLoftDerbyDistance(52.13, 11.62, 51.88, 17.02);
    expect(dist).toBeGreaterThan(370000);
    expect(dist).toBeLessThan(390000);
  });

  test('ranks arrivals strictly by velocity m/min and computes gaps', () => {
    const standings = calculateDerbyStandings(mockDerby, mockArrivals);
    expect(standings).toHaveLength(3);

    // Loft B should be 1st rank because 1348.97 > 1341.93
    expect(standings[0].rank).toBe(1);
    expect(standings[0].loftId).toBe('loft-b');
    expect(standings[0].fancierName).toBe('Marek Nowak');
    expect(standings[0].gapToLeaderMpm).toBe(0);

    // Loft A should be 2nd rank
    expect(standings[1].rank).toBe(2);
    expect(standings[1].loftId).toBe('loft-a');
    expect(standings[1].gapToLeaderMpm).toBeCloseTo(7.04, 2);

    // Loft C should be 3rd rank
    expect(standings[2].rank).toBe(3);
    expect(standings[2].loftId).toBe('loft-c');
    expect(standings[2].velocityMPerMin).toBe(1316.90);
  });

  test('generates dynamic broadcast feed messages for podium and followers', () => {
    const standings = calculateDerbyStandings(mockDerby, mockArrivals);
    const feed1 = generateDerbyLiveFeed(standings[0]);
    expect(feed1).toContain('NOWY LIDER DERBÓW');
    expect(feed1).toContain('Marek Nowak');

    const feed2 = generateDerbyLiveFeed(standings[1]);
    expect(feed2).toContain('PODIUM');
    expect(feed2).toContain('2. miejsce');
  });

  test('generates standardized derby broadcast code', () => {
    const code = generateDerbyBroadcastCode('Sekcja Rawicz', 2026);
    expect(code).toBe('DERBY-SEKCJA-RAWICZ-2026');
  });
});
