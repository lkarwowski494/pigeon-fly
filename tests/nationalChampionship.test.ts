import {
  determineFlightCategory,
  getGmpScaleForCategory,
  calculateGmpPointsForPosition,
  calculateGmpChampionship,
  calculateInterChampionship,
  calculateAcePigeonRankings,
  generateNationalChampionshipReportHtml,
  RaceFlightRecord,
  PigeonArrivalRecord,
} from '../src/domain/nationalChampionship';

describe('NationalChampionship Domain (Z-075)', () => {
  test('determines correct PZHGP distance categories', () => {
    expect(determineFlightCategory(180)).toBe('A');
    expect(determineFlightCategory(380)).toBe('B');
    expect(determineFlightCategory(550)).toBe('C');
    expect(determineFlightCategory(720)).toBe('M');
  });

  test('calculates correct GMP point scales for each category', () => {
    expect(getGmpScaleForCategory('A')).toEqual({ maxPoints: 40, minPoints: 20 });
    expect(getGmpScaleForCategory('B')).toEqual({ maxPoints: 60, minPoints: 30 });
    expect(getGmpScaleForCategory('C')).toEqual({ maxPoints: 80, minPoints: 40 });
    expect(getGmpScaleForCategory('M')).toEqual({ maxPoints: 100, minPoints: 50 });

    // Category A (40-20 pkt), prize limit 100
    expect(calculateGmpPointsForPosition(1, 100, 'A')).toBe(40.0);
    expect(calculateGmpPointsForPosition(100, 100, 'A')).toBe(20.0);
    expect(calculateGmpPointsForPosition(101, 100, 'A')).toBe(0.0); // Out of base

    // Category M (100-50 pkt), prize limit 50
    expect(calculateGmpPointsForPosition(1, 50, 'M')).toBe(100.0);
    expect(calculateGmpPointsForPosition(50, 50, 'M')).toBe(50.0);
  });

  const mockFlights: RaceFlightRecord[] = [
    {
      flightId: 'f-1',
      flightName: 'Świebodzin I',
      flightDate: '2026-05-10',
      distanceKm: 220,
      category: 'A',
      totalBasketedPigeons: 1000, // prize limit 20% = 200
    },
    {
      flightId: 'f-2',
      flightName: 'Magdeburg I',
      flightDate: '2026-05-24',
      distanceKm: 420,
      category: 'B',
      totalBasketedPigeons: 800, // prize limit 20% = 160
    },
    {
      flightId: 'f-3',
      flightName: 'Bruksela Narodowy',
      flightDate: '2026-06-20',
      distanceKm: 850,
      category: 'M',
      totalBasketedPigeons: 500, // prize limit 20% = 100
    },
  ];

  const mockArrivals: PigeonArrivalRecord[] = [
    // Flight 1 (limit 200):
    { pigeonId: 'p-1', ringNumber: 'PL-0284-23-1402', sex: 'cock', flightId: 'f-1', positionInConcourse: 5, isNominatedSeries: true },
    { pigeonId: 'p-2', ringNumber: 'PL-0284-22-9854', sex: 'hen', flightId: 'f-1', positionInConcourse: 12, isNominatedSeries: true },
    { pigeonId: 'p-3', ringNumber: 'PL-0284-24-4401', sex: 'hen', isYearling: true, flightId: 'f-1', positionInConcourse: 28, isNominatedSeries: true },
    { pigeonId: 'p-4', ringNumber: 'DV-01234-24-512', sex: 'cock', isYearling: true, flightId: 'f-1', positionInConcourse: 50, isNominatedSeries: true }, // 4th nominated, only 3 count
    { pigeonId: 'p-5', ringNumber: 'PL-0284-21-3001', sex: 'cock', flightId: 'f-1', positionInConcourse: 2, isNominatedSeries: false }, // not nominated, won't count for GMP series
    // Flight 2 (limit 160):
    { pigeonId: 'p-1', ringNumber: 'PL-0284-23-1402', sex: 'cock', flightId: 'f-2', positionInConcourse: 8, isNominatedSeries: true },
    { pigeonId: 'p-2', ringNumber: 'PL-0284-22-9854', sex: 'hen', flightId: 'f-2', positionInConcourse: 15, isNominatedSeries: true },
    { pigeonId: 'p-6', ringNumber: 'PL-0284-20-1001', sex: 'cock', flightId: 'f-2', positionInConcourse: 210, isNominatedSeries: true }, // out of prize limit
    // Flight 3 (limit 100):
    { pigeonId: 'p-1', ringNumber: 'PL-0284-23-1402', sex: 'cock', flightId: 'f-3', positionInConcourse: 4, isNominatedSeries: true },
  ];

  test('calculates GMP team championship correctly', () => {
    const gmp = calculateGmpChampionship({
      loftName: 'Mistrzowski Gołębnik',
      flights: mockFlights,
      arrivals: mockArrivals,
      maxCountedPerFlight: 3,
    });

    expect(gmp.loftName).toBe('Mistrzowski Gołębnik');
    expect(gmp.flights.length).toBe(3);

    // Flight 1: 3 counted pigeons (p-1, p-2, p-3)
    expect(gmp.flights[0].countedPigeons.length).toBe(3);
    expect(gmp.flights[0].countedPigeons[0].ringNumber).toBe('PL-0284-23-1402');
    expect(gmp.flights[0].totalFlightGmpPoints).toBeGreaterThan(110);

    // Flight 2: 2 counted pigeons (p-1, p-2; p-6 is out of limit)
    expect(gmp.flights[1].countedPigeons.length).toBe(2);

    // Flight 3: 1 counted pigeon (p-1, maraton 100-50 pts)
    expect(gmp.flights[2].countedPigeons.length).toBe(1);
    expect(gmp.flights[2].countedPigeons[0].gmpPoints).toBeGreaterThan(90);

    expect(gmp.totalPrizesCount).toBe(6);
    expect(gmp.totalChampionshipPoints).toBeGreaterThan(300);
    expect(gmp.totalConcourseKm).toBe(220 * 3 + 420 * 2 + 850 * 1);
  });

  test('calculates Intermistrzostwo only for flights >= 285 km', () => {
    const inter = calculateInterChampionship({
      flights: mockFlights,
      arrivals: mockArrivals,
    });

    // Qualifying flights: f-2 (420km) and f-3 (850km) = 2 flights
    expect(inter.flightsCount).toBe(2);
    expect(inter.totalNominatedPrizes).toBe(3); // 2 from f-2, 1 from f-3
    expect(inter.totalCoeffSum).toBeGreaterThan(0);
    expect(inter.qualifies).toBe(true);
  });

  test('ranks Ace Pigeons (Asy Lotowe) by prizes desc and coeff asc', () => {
    const aces = calculateAcePigeonRankings({
      flights: mockFlights,
      arrivals: mockArrivals,
    });

    expect(aces.length).toBeGreaterThanOrEqual(4);
    // p-1 has 3 prizes (f-1, f-2, f-3)
    expect(aces[0].ringNumber).toBe('PL-0284-23-1402');
    expect(aces[0].totalPrizes).toBe(3);
    expect(aces[0].rank).toBe(1);
    expect(aces[0].categoryBadges).toContain('Kat. A');
    expect(aces[0].categoryBadges).toContain('Kat. B');
    expect(aces[0].categoryBadges).toContain('Kat. M');

    // Filter yearlings only
    const yearlingAces = calculateAcePigeonRankings({
      flights: mockFlights,
      arrivals: mockArrivals,
      onlyYearlings: true,
    });
    expect(yearlingAces.every((a) => a.isYearling)).toBe(true);
    expect(yearlingAces.some((a) => a.ringNumber === 'PL-0284-24-4401')).toBe(true);
  });

  test('generateNationalChampionshipReportHtml returns valid printable HTML report', () => {
    const gmp = calculateGmpChampionship({
      loftName: 'Gołębnik Olimpijski',
      flights: mockFlights,
      arrivals: mockArrivals,
    });
    const inter = calculateInterChampionship({
      flights: mockFlights,
      arrivals: mockArrivals,
    });
    const aces = calculateAcePigeonRankings({
      flights: mockFlights,
      arrivals: mockArrivals,
    });

    const html = generateNationalChampionshipReportHtml({
      gmp,
      inter,
      aces,
      loftName: 'Gołębnik Olimpijski',
      seasonYear: 2026,
    });

    expect(html).toContain('PROTOKÓŁ WYNIKÓW MISTRZOSTWA POLSKI PZHGP');
    expect(html).toContain('Gołębnik Olimpijski');
    expect(html).toContain('Świebodzin I');
    expect(html).toContain('PL-0284-23-1402');
    expect(html).toContain('PUNKTY GMP (SERIA)');
    expect(html).toContain('Podpis Hodowcy');
  });
});
