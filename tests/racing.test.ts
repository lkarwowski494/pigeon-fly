/**
 * Tests for Racing Engine (Vincenty distance, speed m/min, night neutralization)
 * Includes unit tests, known benchmarks, and fast-check property-based tests.
 */

import fc from 'fast-check';
import {
  calculateGeodesicDistanceMeters,
  calculateHaversineDistanceMeters,
  calculateFlightSpeed,
  calculateNightNeutralizationSeconds,
  getRaceCategory,
} from '../src/domain/racing';

describe('Racing Engine — Geodesic Distance', () => {
  // Known benchmark coordinates:
  // Warsaw, Poland: 52.2297° N, 21.0122° E
  // Berlin, Germany: 52.5200° N, 13.4050° E
  // Official Vincenty geodesic distance: ~517,800 m (approx 517.8 km)
  const warsaw = { latitude: 52.2297, longitude: 21.0122 };
  const berlin = { latitude: 52.5200, longitude: 13.4050 };

  test('calculates exact zero distance for identical coordinates', () => {
    expect(calculateGeodesicDistanceMeters(warsaw, warsaw)).toBe(0);
  });

  test('calculates accurate distance between Warsaw and Berlin (~517.8 km)', () => {
    const dist = calculateGeodesicDistanceMeters(warsaw, berlin);
    expect(dist).toBeGreaterThan(515000);
    expect(dist).toBeLessThan(520000);
  });

  test('Vincenty distance is symmetric: dist(A, B) === dist(B, A)', () => {
    const ab = calculateGeodesicDistanceMeters(warsaw, berlin);
    const ba = calculateGeodesicDistanceMeters(berlin, warsaw);
    expect(Math.abs(ab - ba)).toBeLessThanOrEqual(0.01);
  });

  test('property-based test: distance symmetry for arbitrary valid coordinates', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -80, max: 80, noNaN: true }),
        fc.double({ min: -170, max: 170, noNaN: true }),
        fc.double({ min: -80, max: 80, noNaN: true }),
        fc.double({ min: -170, max: 170, noNaN: true }),
        (lat1, lon1, lat2, lon2) => {
          const p1 = { latitude: lat1, longitude: lon1 };
          const p2 = { latitude: lat2, longitude: lon2 };
          const d1 = calculateGeodesicDistanceMeters(p1, p2);
          const d2 = calculateGeodesicDistanceMeters(p2, p1);
          expect(Math.abs(d1 - d2)).toBeLessThanOrEqual(0.1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Racing Engine — Speed (m/min) and Categories', () => {
  test('calculates speed correctly without neutralization', () => {
    // 300,000 meters in 240 minutes (4 hours) = 1,250 m/min
    const release = new Date('2026-06-01T06:00:00Z');
    const arrival = new Date('2026-06-01T10:00:00Z');

    const result = calculateFlightSpeed({
      distanceMeters: 300000,
      releaseTime: release,
      arrivalTime: arrival,
    });

    expect(result.flightDurationSeconds).toBe(14400); // 4 * 3600
    expect(result.netFlightDurationSeconds).toBe(14400);
    expect(result.velocityMPerMin).toBe(1250);
    expect(result.velocityKmH).toBe(75);
  });

  test('throws error when arrival time is earlier than release time', () => {
    const release = new Date('2026-06-01T10:00:00Z');
    const arrival = new Date('2026-06-01T06:00:00Z');

    expect(() =>
      calculateFlightSpeed({
        distanceMeters: 300000,
        releaseTime: release,
        arrivalTime: arrival,
      })
    ).toThrow();
  });

  test('calculates correct FCI race categories', () => {
    expect(getRaceCategory(150000)).toBe('short'); // 150 km
    expect(getRaceCategory(450000)).toBe('middle'); // 450 km
    expect(getRaceCategory(720000)).toBe('long'); // 720 km
    expect(getRaceCategory(950000)).toBe('marathon'); // 950 km
  });
});

describe('Racing Engine — Night Neutralization', () => {
  test('subtracts 7 hours (25200s) for flight spanning 22:00 to 05:00 next day', () => {
    // Release Day 1 at 12:00, Arrival Day 2 at 12:00
    const release = new Date('2026-06-01T12:00:00');
    const arrival = new Date('2026-06-02T12:00:00');

    const neutralSeconds = calculateNightNeutralizationSeconds(
      release,
      arrival,
      '22:00',
      '05:00'
    );

    // 22:00 to 05:00 is exactly 7 hours = 7 * 3600 = 25,200 seconds
    expect(neutralSeconds).toBe(25200);
  });

  test('no neutralization deducted for same-day flight ending before 22:00', () => {
    const release = new Date('2026-06-01T06:00:00');
    const arrival = new Date('2026-06-01T18:00:00');

    const neutralSeconds = calculateNightNeutralizationSeconds(
      release,
      arrival,
      '22:00',
      '05:00'
    );

    expect(neutralSeconds).toBe(0);
  });
});
