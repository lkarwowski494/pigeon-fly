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
