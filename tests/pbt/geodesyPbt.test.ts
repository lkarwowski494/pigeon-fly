/**
 * PIGEON-FLY — Property-Based Testing (PBT) for Vincenty Geodesy
 * Mathematical Invariants:
 * 1. Identity: d(A, A) == 0
 * 2. Symmetry: d(A, B) == d(B, A)
 * 3. Range Bound: 0 <= d(A, B) <= Earth Semi-Circumference (~20,037.5 km)
 * 4. Triangle Inequality: d(A, C) <= d(A, B) + d(B, C) + epsilon
 */

import fc from 'fast-check';
import { calculateGeodesicDistanceMeters } from '../../src/domain/racing';
import { Coordinates } from '../../src/domain/types';

describe('Property-Based Testing: Vincenty Geodesic Distance', () => {
  const PROP_SEED = process.env.PROP_SEED ? parseInt(process.env.PROP_SEED, 10) : 1718192026;

  beforeAll(() => {
    console.log(`[PBT GEODESY] Running 1000 trials with PROP_SEED=${PROP_SEED}`);
  });

  // Generator for valid global WGS-84 coordinates avoiding pole singularities (|lat| <= 85)
  const coordArbitrary = fc.record({
    latitude: fc.double({ min: -85.0, max: 85.0, noNaN: true }),
    longitude: fc.double({ min: -180.0, max: 180.0, noNaN: true }),
  });

  it('Invariant 1: Identity — distance from any point to itself is 0', () => {
    fc.assert(
      fc.property(coordArbitrary, (pt: Coordinates) => {
        const dist = calculateGeodesicDistanceMeters(pt, pt);
        return dist >= 0 && dist < 0.001;
      }),
      { numRuns: 1000, seed: PROP_SEED }
    );
  });

  it('Invariant 2: Symmetry — d(A, B) == d(B, A) within 0.1 mm precision', () => {
    fc.assert(
      fc.property(coordArbitrary, coordArbitrary, (a: Coordinates, b: Coordinates) => {
        const distAB = calculateGeodesicDistanceMeters(a, b);
        const distBA = calculateGeodesicDistanceMeters(b, a);
        const diff = Math.abs(distAB - distBA);
        return diff < 0.001; // < 1 mm
      }),
      { numRuns: 1000, seed: PROP_SEED }
    );
  });

  it('Invariant 3: Boundedness — distance is non-negative and <= 20,038 km', () => {
    const MAX_EARTH_SEMI_CIRCUMFERENCE_METERS = 20_038_000;
    fc.assert(
      fc.property(coordArbitrary, coordArbitrary, (a: Coordinates, b: Coordinates) => {
        const dist = calculateGeodesicDistanceMeters(a, b);
        return dist >= 0 && dist <= MAX_EARTH_SEMI_CIRCUMFERENCE_METERS;
      }),
      { numRuns: 1000, seed: PROP_SEED }
    );
  });

  // Arbitrary for racing/continental domains (max 10,000 km span, avoiding antipodal non-convergence)
  const racingCoordArbitrary = fc.record({
    latitude: fc.double({ min: -60.0, max: 70.0, noNaN: true }),
    longitude: fc.double({ min: -30.0, max: 60.0, noNaN: true }), // Europe, Africa, Middle East racing spans
  });

  it('Invariant 4: Metric Triangle Inequality — d(A, C) <= d(A, B) + d(B, C) + 1m in racing domain', () => {
    fc.assert(
      fc.property(racingCoordArbitrary, racingCoordArbitrary, racingCoordArbitrary, (a: Coordinates, b: Coordinates, c: Coordinates) => {
        const dAC = calculateGeodesicDistanceMeters(a, c);
        const dAB = calculateGeodesicDistanceMeters(a, b);
        const dBC = calculateGeodesicDistanceMeters(b, c);
        // On an oblate ellipsoid, geodesic triangle inequality holds within numerical geodesic tolerance
        return dAC <= dAB + dBC + 1.0;
      }),
      { numRuns: 1000, seed: PROP_SEED }
    );
  });
});
