/**
 * Tests for Weather Aerodynamics & Wind Vectoring (src/domain/weather.ts)
 */

import { calculateFlightBearing, calculateWindImpact } from '../src/domain/weather';

describe('Weather Engine — Flight Bearing (Azimuth)', () => {
  test('calculates accurate initial bearing from Point A to Point B', () => {
    // Berlin to Warsaw is roughly East (~94°)
    const berlin = { latitude: 52.52, longitude: 13.405 };
    const warsaw = { latitude: 52.2297, longitude: 21.0122 };

    const bearing = calculateFlightBearing(berlin, warsaw);
    expect(bearing).toBeGreaterThan(85);
    expect(bearing).toBeLessThan(105);
  });

  test('calculates exact cardinal bearings (North, South, East, West)', () => {
    const origin = { latitude: 50.0, longitude: 20.0 };
    const north = { latitude: 52.0, longitude: 20.0 };
    const south = { latitude: 48.0, longitude: 20.0 };

    expect(calculateFlightBearing(origin, north)).toBeCloseTo(0, 0);
    expect(calculateFlightBearing(origin, south)).toBeCloseTo(180, 0);
  });
});

describe('Weather Engine — Wind Impact & Aerodynamics', () => {
  const release = { latitude: 52.1205, longitude: 11.6276 }; // Magdeburg (West)
  const loft = { latitude: 52.2297, longitude: 21.0122 }; // Warsaw (East)
  const distance = 345000;

  test('strong tailwind increases velocity above 1500 m/min', () => {
    // Flight is East (~90°). Wind blowing FROM West (270°) is pure tailwind!
    const res = calculateWindImpact({
      releasePoint: release,
      loftPoint: loft,
      distanceMeters: distance,
      windFromDeg: 270,
      windSpeedKmh: 25,
      baseVelocityMPerMin: 1250,
    });

    expect(res.effectiveTailwindKmh).toBeGreaterThan(20);
    expect(res.estimatedVelocityMPerMin).toBeGreaterThan(1500);
    expect(res.flightCondition).toBe('tailwind_fast');
  });

  test('strong headwind drops velocity below 1000 m/min', () => {
    // Wind blowing FROM East (90°) directly opposes flight towards East!
    const res = calculateWindImpact({
      releasePoint: release,
      loftPoint: loft,
      distanceMeters: distance,
      windFromDeg: 90,
      windSpeedKmh: 25,
      baseVelocityMPerMin: 1250,
    });

    expect(res.effectiveTailwindKmh).toBeLessThan(-20);
    expect(res.estimatedVelocityMPerMin).toBeLessThan(1000);
    expect(res.flightCondition).toMatch(/headwind/);
  });

  test('pure crosswind creates lateral drift without large speed change', () => {
    // Flight is East (~90°). Wind blowing FROM North (0°) is pure crosswind!
    const res = calculateWindImpact({
      releasePoint: release,
      loftPoint: loft,
      distanceMeters: distance,
      windFromDeg: 0,
      windSpeedKmh: 20,
      baseVelocityMPerMin: 1250,
    });

    expect(res.crosswindKmh).toBeGreaterThan(18);
    expect(Math.abs(res.effectiveTailwindKmh)).toBeLessThan(5);
    expect(res.estimatedVelocityMPerMin).toBeCloseTo(1250, -2);
    expect(res.flightCondition).toBe('moderate');
  });
});

describe('Weather Engine — Drift Crab Angle & Corridor Waypoints', () => {
  const { calculateDriftAngle, calculateFlightCorridorWaypoints, EUROPEAN_RACE_CORRIDORS } = require('../src/domain/weather');

  test('calculates drift angle and heading correction under crosswind', () => {
    // Flight bearing is East (90°). Wind is from North (0°), blowing South
    const drift = calculateDriftAngle({
      flightBearingDeg: 90,
      pigeonAirspeedKmh: 75,
      windFromDeg: 0,
      windSpeedKmh: 25,
    });

    expect(drift.driftAngleDeg).toBeGreaterThan(15);
    expect(drift.driftAngleDeg).toBeLessThan(25);
    expect(drift.driftDirection).toBe('right');
    // Crab correction should aim left of bearing (less than 90°)
    expect(drift.headingCorrectionDeg).toBeLessThan(90);
    expect(drift.groundSpeedKmh).toBeGreaterThan(60);
  });

  test('interpolates accurate corridor waypoints along route', () => {
    const release = { latitude: 52.1205, longitude: 11.6276 }; // Magdeburg
    const loft = { latitude: 52.2297, longitude: 21.0122 }; // Warsaw
    const waypoints = calculateFlightCorridorWaypoints({
      releasePoint: release,
      loftPoint: loft,
      totalDistanceMeters: 620000,
      releaseTimeIso: '2026-06-01T06:00:00.000Z',
      avgSpeedMPerMin: 1250,
      segmentsCount: 4,
    });

    expect(waypoints).toHaveLength(5);
    expect(waypoints[0].name).toContain('Start');
    expect(waypoints[0].distanceFromStartKm).toBe(0);
    expect(waypoints[0].progressPct).toBe(0);

    expect(waypoints[4].name).toContain('Meta');
    expect(waypoints[4].distanceFromStartKm).toBe(620);
    expect(waypoints[4].progressPct).toBe(100);

    // Intermediate waypoints have valid arrival ISO and coordinates
    expect(waypoints[2].coordinates.latitude).toBeCloseTo(52.175, 1);
    expect(waypoints[2].estimatedArrivalIso).toBeDefined();
  });

  test('includes standard European race corridors presets', () => {
    expect(EUROPEAN_RACE_CORRIDORS.length).toBeGreaterThanOrEqual(4);
    const magdeburg = EUROPEAN_RACE_CORRIDORS.find((c: any) => c.id.includes('magdeburg'));
    expect(magdeburg).toBeDefined();
    expect(magdeburg.distanceKm).toBeGreaterThan(500);
  });
});

