/**
 * PIGEON-FLY — Racing Domain Engine
 * High-precision geodesic calculations (Vincenty WGS-84), velocity (m/min),
 * and night neutralization according to international racing standards (FCI / PZHGP).
 */

import { Coordinates, RaceCategory, SpeedCalculationResult } from './types';

// WGS-84 Ellipsoid Constants
const WGS84_A = 6378137.0; // semi-major axis (meters)
const WGS84_B = 6356752.314245; // semi-minor axis (meters)
const WGS84_F = 1 / 298.257223563; // flattening
const MAX_ITERATIONS = 200;
const CONVERGENCE_THRESHOLD = 1e-12;

/**
 * Calculates geodesic distance between two coordinates using Vincenty inverse formula.
 * Fallback to Haversine if points are antipodal or iteration fails to converge.
 * Accuracy: ~0.5 mm on WGS-84 ellipsoid.
 */
export function calculateGeodesicDistanceMeters(
  point1: Coordinates,
  point2: Coordinates
): number {
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lon1 = (point1.longitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const lon2 = (point2.longitude * Math.PI) / 180;

  // Zero distance for identical points
  if (point1.latitude === point2.latitude && point1.longitude === point2.longitude) {
    return 0.0;
  }

  let L = lon2 - lon1;
  while (L > Math.PI) L -= 2 * Math.PI;
  while (L < -Math.PI) L += 2 * Math.PI;
  const U1 = Math.atan((1 - WGS84_F) * Math.tan(lat1));
  const U2 = Math.atan((1 - WGS84_F) * Math.tan(lat2));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);

  let lambda = L;
  let lambdaP = 2 * Math.PI;
  let iterLimit = MAX_ITERATIONS;

  let cosSqAlpha = 0;
  let sinSigma = 0;
  let cos2SigmaM = 0;
  let cosSigma = 0;
  let sigma = 0;

  while (Math.abs(lambda - lambdaP) > CONVERGENCE_THRESHOLD && --iterLimit > 0) {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);

    sinSigma = Math.sqrt(
      cosU2 * sinLambda * (cosU2 * sinLambda) +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) *
          (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
    );

    if (sinSigma === 0) {
      return 0.0; // Coincident points
    }

    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);

    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;

    cos2SigmaM = cosSqAlpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha : 0; // Equatorial line

    const C = (WGS84_F / 16) * cosSqAlpha * (4 + WGS84_F * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda =
      L +
      (1 - C) *
        WGS84_F *
        sinAlpha *
        (sigma +
          C *
            sinSigma *
            (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  }

  if (iterLimit === 0) {
    // Formula failed to converge, use spherical Haversine fallback
    return calculateHaversineDistanceMeters(point1, point2);
  }

  const uSq =
    (cosSqAlpha * (WGS84_A * WGS84_A - WGS84_B * WGS84_B)) / (WGS84_B * WGS84_B);
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma =
    B *
    sinSigma *
    (cos2SigmaM +
      (B / 4) *
        (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
          (B / 6) *
            cos2SigmaM *
            (-3 + 4 * sinSigma * sinSigma) *
            (-3 + 4 * cos2SigmaM * cos2SigmaM)));

  const distance = WGS84_B * A * (sigma - deltaSigma);
  return Math.round(distance * 1000) / 1000; // Millimeter precision
}

/**
 * Fallback spherical Haversine formula (Mean Earth Radius = 6371000 m).
 */
export function calculateHaversineDistanceMeters(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371000.0;
  const lat1 = (point1.latitude * Math.PI) / 180;
  const lon1 = (point1.longitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;
  const lon2 = (point2.longitude * Math.PI) / 180;

  const dLat = lat2 - lat1;
  let dLon = lon2 - lon1;
  while (dLon > Math.PI) dLon -= 2 * Math.PI;
  while (dLon < -Math.PI) dLon += 2 * Math.PI;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 1000) / 1000;
}

/**
 * Calculates night neutralization overlap in seconds between flight interval and night windows.
 * Night neutralization applies when a flight spans over official twilight/night hours.
 * Window format: 'HH:mm' e.g., start: '22:00', end: '05:00'.
 */
export function calculateNightNeutralizationSeconds(
  releaseDate: Date,
  arrivalDate: Date,
  neutralStart = '22:00',
  neutralEnd = '05:00'
): number {
  if (arrivalDate <= releaseDate) {
    return 0;
  }

  const [startHour, startMin] = neutralStart.split(':').map(Number);
  const [endHour, endMin] = neutralEnd.split(':').map(Number);

  let neutralizedSeconds = 0;

  // Iterate day by day from release date until arrival date
  const curDay = new Date(releaseDate);
  curDay.setHours(0, 0, 0, 0);

  const endDay = new Date(arrivalDate);
  endDay.setHours(23, 59, 59, 999);

  while (curDay <= endDay) {
    // Current night window begins on curDay at startHour:startMin
    // and ends on next day at endHour:endMin
    const nightStart = new Date(curDay);
    nightStart.setHours(startHour, startMin, 0, 0);

    const nightEnd = new Date(curDay);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(endHour, endMin, 0, 0);

    // Calculate overlap with [releaseDate, arrivalDate]
    const overlapStart = Math.max(releaseDate.getTime(), nightStart.getTime());
    const overlapEnd = Math.min(arrivalDate.getTime(), nightEnd.getTime());

    if (overlapEnd > overlapStart) {
      neutralizedSeconds += (overlapEnd - overlapStart) / 1000;
    }

    curDay.setDate(curDay.getDate() + 1);
  }

  return Math.round(neutralizedSeconds);
}

/**
 * Computes official pigeon flight velocity in meters per minute (m/min) and km/h.
 * Formula: v = distance / (net_duration_seconds / 60)
 */
export function calculateFlightSpeed(params: {
  distanceMeters: number;
  releaseTime: Date | string;
  arrivalTime: Date | string;
  neutralStart?: string;
  neutralEnd?: string;
}): SpeedCalculationResult {
  const release = typeof params.releaseTime === 'string' ? new Date(params.releaseTime) : params.releaseTime;
  const arrival = typeof params.arrivalTime === 'string' ? new Date(params.arrivalTime) : params.arrivalTime;

  if (isNaN(release.getTime()) || isNaN(arrival.getTime())) {
    throw new Error('Nieprawidłowy format daty wypuszczenia lub przylotu.');
  }

  if (arrival < release) {
    throw new Error('Czas przylotu nie może być wcześniejszy niż czas wypuszczenia.');
  }

  const totalDurationSeconds = Math.max(0, (arrival.getTime() - release.getTime()) / 1000);

  let neutralizedSeconds = 0;
  if (params.neutralStart && params.neutralEnd) {
    neutralizedSeconds = calculateNightNeutralizationSeconds(
      release,
      arrival,
      params.neutralStart,
      params.neutralEnd
    );
  }

  // Net duration clamped to minimum 1 second if same-second arrival
  const netDurationSeconds = Math.max(1, totalDurationSeconds - neutralizedSeconds);
  const netMinutes = netDurationSeconds / 60;

  const rawVelocity = params.distanceMeters / netMinutes;
  const velocityMPerMin = Math.round(rawVelocity * 1000) / 1000;
  const velocityKmH = Math.round(((rawVelocity * 60) / 1000) * 100) / 100;

  return {
    distanceMeters: params.distanceMeters,
    flightDurationSeconds: totalDurationSeconds,
    neutralizedSeconds,
    netFlightDurationSeconds: netDurationSeconds,
    velocityMPerMin,
    velocityKmH,
  };
}

/**
 * Categorizes race distance according to FCI sports categories.
 */
export function getRaceCategory(distanceMeters: number): RaceCategory {
  const km = distanceMeters / 1000;
  if (km < 300) return 'short'; // Kat. A (Sprint / Krótki dystans: 100-300 km)
  if (km < 600) return 'middle'; // Kat. B (Średni dystans: 300-600 km)
  if (km < 800) return 'long'; // Kat. C (Długi dystans: 600-800 km)
  return 'marathon'; // Kat. M (Maraton / Ekstremalny: >800 km)
}
