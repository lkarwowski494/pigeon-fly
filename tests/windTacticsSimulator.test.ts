import {
  simulateTacticalReleaseWindows,
  calculateConcourseCloseVelocity,
  generateTacticalAdvisory,
  PRESET_RACE_ROUTES,
  HourlyWindForecast,
} from '../src/domain/windTacticsSimulator';

describe('Wind Tactics Simulator & Release Window Optimizer (Z-070)', () => {
  const route = PRESET_RACE_ROUTES[0]; // Magdeburg (approx 375 km)

  const sampleForecasts: HourlyWindForecast[] = [
    {
      timeLabel: '06:00',
      windSpeedKmh: 15,
      windFromDeg: 270, // West wind (Tailwind towards Poland/East)
      gustSpeedKmh: 20,
      temperatureC: 16,
      cloudCoverPct: 30,
    },
    {
      timeLabel: '07:00',
      windSpeedKmh: 25,
      windFromDeg: 90, // East wind (Headwind opposing flight to East)
      gustSpeedKmh: 35,
      temperatureC: 19,
      cloudCoverPct: 60,
    },
    {
      timeLabel: '08:00',
      windSpeedKmh: 40,
      windFromDeg: 0, // North wind (Crosswind)
      gustSpeedKmh: 55, // Stormy gusts
      temperatureC: 22,
      cloudCoverPct: 90,
    },
  ];

  describe('Concourse Close Velocity Calculation', () => {
    it('calculates tighter closure for fast tailwind races', () => {
      const closeVelocity = calculateConcourseCloseVelocity(1600, 350);
      expect(closeVelocity).toBe(Math.round(1600 * 0.92)); // 1472 m/min
    });

    it('calculates wider closure for slow exhausting headwind races', () => {
      const closeVelocity = calculateConcourseCloseVelocity(900, 350);
      expect(closeVelocity).toBe(Math.round(900 * 0.78)); // 702 m/min
    });
  });

  describe('Tactical Release Simulation', () => {
    it('evaluates tailwind, headwind and crosswind scenarios correctly', () => {
      const result = simulateTacticalReleaseWindows({
        route,
        hourlyForecasts: sampleForecasts,
        baseAirspeedKmh: 72,
        raceDate: '2026-06-15',
      });

      expect(result.distanceKm).toBeGreaterThan(300);
      expect(result.flightBearingDeg).toBeGreaterThan(80);
      expect(result.flightBearingDeg).toBeLessThan(120); // Towards ESE

      expect(result.windows.length).toBe(3);

      // Window 0 (06:00 - West wind -> Tailwind)
      const w0 = result.windows[0];
      expect(w0.effectiveTailwindKmh).toBeGreaterThan(0);
      expect(w0.firstBirdVelocityMPerMin).toBeGreaterThan(1200);
      expect(w0.safetyScore).toBeGreaterThanOrEqual(80);
      expect(w0.decision).toBe('RECOMMENDED');

      // Window 1 (07:00 - East wind -> Headwind)
      const w1 = result.windows[1];
      expect(w1.effectiveTailwindKmh).toBeLessThan(0);
      expect(w1.firstBirdVelocityMPerMin).toBeLessThan(1200);

      // Window 2 (08:00 - North wind 40 km/h with 55 km/h gusts -> Dangerous)
      const w2 = result.windows[2];
      expect(w2.crosswindKmh).toBeGreaterThan(25);
      expect(w2.driftAngleDeg).toBeGreaterThan(15);
      expect(w2.safetyScore).toBeLessThan(50);
      expect(w2.decision).toMatch(/RISKY|UNACCEPTABLE/);

      // Best window should be 06:00
      expect(result.bestWindowIndex).toBe(0);
    });
  });

  describe('Tactical and Nutritional Advisory', () => {
    it('advises high fat, L-carnitine and warns of raptors in heavy headwind', () => {
      const advisory = generateTacticalAdvisory(-15, 10, 400);
      expect(advisory.feedingStrategy).toContain('DIETA ENERGETYCZNA');
      expect(advisory.feedingStrategy).toContain('L-karnitynę');
      expect(advisory.geographicHazards.some((h) => h.includes('jastrzębi'))).toBe(true);
    });

    it('advises light carbs and warns of overshooting in fast tailwind', () => {
      const advisory = generateTacticalAdvisory(20, 5, 300);
      expect(advisory.feedingStrategy).toContain('DIETA LEKKA');
      expect(advisory.geographicHazards.some((h) => h.includes('overshooting'))).toBe(true);
    });

    it('warns of lateral drift under strong crosswinds', () => {
      const advisory = generateTacticalAdvisory(0, 28, 300);
      expect(advisory.geographicHazards.some((h) => h.includes('wiatr boczny'))).toBe(true);
    });
  });
});
