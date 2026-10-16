/**
 * PIGEON-FLY — Weather & Wind Aerodynamics Engine
 * Calculates flight bearing (azimuth), headwind/tailwind decomposition,
 * crosswind drift, and predicted arrival velocity (m/min).
 */

import { Coordinates } from './types';

export type FlightCondition =
  | 'tailwind_fast' // Wiatr w ogon (szybki lot >1500 m/min)
  | 'moderate' // Standardowy lot (1150-1350 m/min)
  | 'headwind_hard' // Ciężki lot pod wiatr (950-1150 m/min)
  | 'catastrophic_headwind'; // Ekstremalny lot pod wiatr / burza (<950 m/min)

export interface WindAnalysis {
  flightBearingDeg: number; // Kąt lotu od startu do gołębnika (0-360°)
  windDirectionDeg: number; // Kierunek wiatru (skąd wieje, 0-360°)
  windSpeedKmh: number; // Prędkość wiatru w km/h
  effectiveTailwindKmh: number; // Dodatnia: wiatr w plecy, ujemna: wiatr w dziób
  crosswindKmh: number; // Wiatr boczny znoszący
  estimatedVelocityMPerMin: number; // Prognozowana prędkość stada
  estimatedDurationMinutes: number; // Prognozowany czas lotu
  flightCondition: FlightCondition;
  conditionDescription: string;
  fancierAdvice: string;
}

/**
 * Calculates initial forward azimuth (bearing) from Point A (Release) to Point B (Loft).
 * Formula: atan2(sin(Δλ) * cos(φ2), cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ))
 */
export function calculateFlightBearing(from: Coordinates, to: Coordinates): number {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lon1 = (from.longitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const lon2 = (to.longitude * Math.PI) / 180;

  const dLon = lon2 - lon1;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return Math.round(bearing * 10) / 10;
}

/**
 * Analyzes wind impact on pigeon aerodynamics.
 * Base speed in calm air: 1250 m/min (~75 km/h).
 * In meteorology, wind direction indicates WHERE the wind blows FROM.
 * If wind is blowing FROM 270° (West) and flight bearing is 90° (East),
 * the wind is directly at the bird's back (pure tailwind!).
 */
export function calculateWindImpact(params: {
  releasePoint: Coordinates;
  loftPoint: Coordinates;
  distanceMeters: number;
  windFromDeg: number;
  windSpeedKmh: number;
  baseVelocityMPerMin?: number;
}): WindAnalysis {
  const {
    releasePoint,
    loftPoint,
    distanceMeters,
    windFromDeg,
    windSpeedKmh,
    baseVelocityMPerMin = 1250,
  } = params;

  const flightBearingDeg = calculateFlightBearing(releasePoint, loftPoint);

  // Relative angle between flight path and wind vector
  // Wind blowing FROM windFromDeg towards (windFromDeg + 180)
  const windToDeg = (windFromDeg + 180) % 360;
  const angleDiffRad = ((windToDeg - flightBearingDeg) * Math.PI) / 180;

  // Effective tailwind component (positive = pushes forward, negative = headwind opposing)
  const effectiveTailwindKmh = windSpeedKmh * Math.cos(angleDiffRad);
  const crosswindKmh = Math.abs(windSpeedKmh * Math.sin(angleDiffRad));

  // Aerodynamic effect: roughly 17 m/min velocity change per km/h of tailwind/headwind
  const velocityDelta = effectiveTailwindKmh * 17.0;
  const rawEstimatedVelocity = baseVelocityMPerMin + velocityDelta;
  // Clamped between 600 m/min and 2100 m/min
  const estimatedVelocityMPerMin = Math.round(
    Math.max(600, Math.min(2100, rawEstimatedVelocity))
  );

  const estimatedDurationMinutes =
    estimatedVelocityMPerMin > 0
      ? Math.round((distanceMeters / estimatedVelocityMPerMin) * 10) / 10
      : 0;

  let flightCondition: FlightCondition = 'moderate';
  let conditionDescription = 'Lot w normie pogodowej (Równy konkurs)';
  let fancierAdvice = 'Oczekuj przylotów w regularnych odstępach czasu.';

  if (effectiveTailwindKmh >= 15) {
    flightCondition = 'tailwind_fast';
    conditionDescription = 'Silny wiatr w ogon (Lot ekspresowy >1500 m/min)';
    fancierAdvice =
      'Bądź w gołębniku wcześniej! Przy silnym wietrze ptaki łatwo przelatują gołębniki lub wlatują w dużych szpicach.';
  } else if (effectiveTailwindKmh <= -25) {
    flightCondition = 'catastrophic_headwind';
    conditionDescription = 'Ciężki lot pod silny wiatr czołowy (<950 m/min)';
    fancierAdvice =
      'Przygotuj poidła z elektrolitami i miodem. Konkurs będzie się ciągnął godzinami. Ptaki będą skrajnie wyczerpane.';
  } else if (effectiveTailwindKmh <= -10) {
    flightCondition = 'headwind_hard';
    conditionDescription = 'Lot pod umiarkowany wiatr (Selektywny: 1000-1150 m/min)';
    fancierAdvice =
      'Wygrają ptaki o mocnej budowie klatki piersiowej i bez ubytków w lotkach pierwszorzędowych.';
  }

  return {
    flightBearingDeg,
    windDirectionDeg: windFromDeg,
    windSpeedKmh: Math.round(windSpeedKmh * 10) / 10,
    effectiveTailwindKmh: Math.round(effectiveTailwindKmh * 10) / 10,
    crosswindKmh: Math.round(crosswindKmh * 10) / 10,
    estimatedVelocityMPerMin,
    estimatedDurationMinutes,
    flightCondition,
    conditionDescription,
    fancierAdvice,
  };
}

export interface DriftCompensation {
  driftAngleDeg: number; // Kąt znoszenia (Crab Angle, 0-45°)
  driftDirection: 'left' | 'right' | 'none';
  groundSpeedKmh: number; // Prędkość stada względem ziemi
  headingCorrectionDeg: number; // Zalecana poprawka kursowa gołębia
}

/**
 * Calculates drift crab angle and ground track speed using the navigational wind triangle.
 * Base pigeon airspeed in still air is ~75 km/h (1250 m/min).
 */
export function calculateDriftAngle(params: {
  flightBearingDeg: number;
  pigeonAirspeedKmh?: number;
  windFromDeg: number;
  windSpeedKmh: number;
}): DriftCompensation {
  const {
    flightBearingDeg,
    pigeonAirspeedKmh = 75,
    windFromDeg,
    windSpeedKmh,
  } = params;

  const windToDeg = (windFromDeg + 180) % 360;
  const relAngleRad = ((windToDeg - flightBearingDeg) * Math.PI) / 180;

  const tailwind = windSpeedKmh * Math.cos(relAngleRad);
  const crosswind = windSpeedKmh * Math.sin(relAngleRad);

  // sin(drift) = crosswind / airspeed (clamped to [-1, 1])
  const sinDrift = Math.max(-0.95, Math.min(0.95, crosswind / pigeonAirspeedKmh));
  const driftAngleRad = Math.asin(sinDrift);
  const driftAngleDeg = Math.round(Math.abs((driftAngleRad * 180) / Math.PI) * 10) / 10;

  let driftDirection: 'left' | 'right' | 'none' = 'none';
  if (crosswind > 0.5) driftDirection = 'right';
  else if (crosswind < -0.5) driftDirection = 'left';

  const headingCorrectionDeg =
    driftDirection === 'right'
      ? (flightBearingDeg - driftAngleDeg + 360) % 360
      : driftDirection === 'left'
      ? (flightBearingDeg + driftAngleDeg) % 360
      : flightBearingDeg;

  const groundSpeedKmh = Math.max(
    30,
    Math.round((pigeonAirspeedKmh * Math.cos(driftAngleRad) + tailwind) * 10) / 10
  );

  return {
    driftAngleDeg,
    driftDirection,
    groundSpeedKmh,
    headingCorrectionDeg: Math.round(headingCorrectionDeg * 10) / 10,
  };
}

export interface FlightWaypoint {
  segmentIndex: number;
  name: string;
  coordinates: Coordinates;
  distanceFromStartKm: number;
  distanceRemainingKm: number;
  progressPct: number;
  estimatedArrivalIso: string;
  terrainProfile: 'nizina' | 'pojezierze' | 'pagorki' | 'kotlina';
}

/**
 * Interpolates flight corridor waypoints between release point and home loft.
 */
export function calculateFlightCorridorWaypoints(params: {
  releasePoint: Coordinates;
  loftPoint: Coordinates;
  totalDistanceMeters: number;
  releaseTimeIso: string;
  avgSpeedMPerMin: number;
  segmentsCount?: number;
}): FlightWaypoint[] {
  const {
    releasePoint,
    loftPoint,
    totalDistanceMeters,
    releaseTimeIso,
    avgSpeedMPerMin,
    segmentsCount = 4,
  } = params;

  const totalDistanceKm = totalDistanceMeters / 1000;
  const speedMPerMin = Math.max(500, avgSpeedMPerMin);
  const totalDurationMin = totalDistanceMeters / speedMPerMin;

  const waypoints: FlightWaypoint[] = [];
  const startTime = new Date(releaseTimeIso).getTime();

  for (let i = 0; i <= segmentsCount; i++) {
    const fraction = i / segmentsCount;
    const lat = releasePoint.latitude + (loftPoint.latitude - releasePoint.latitude) * fraction;
    const lon = releasePoint.longitude + (loftPoint.longitude - releasePoint.longitude) * fraction;
    const distFromStart = Math.round(totalDistanceKm * fraction * 10) / 10;
    const distRemaining = Math.round((totalDistanceKm - distFromStart) * 10) / 10;
    const waypointDurationMin = totalDurationMin * fraction;
    const estTime = new Date(startTime + waypointDurationMin * 60 * 1000).toISOString();

    let name = `Punkt Przelotowy ${i}`;
    let terrain: 'nizina' | 'pojezierze' | 'pagorki' | 'kotlina' = 'nizina';

    if (i === 0) {
      name = 'Start (Wypuszczenie)';
    } else if (i === segmentsCount) {
      name = 'Meta (Gołębnik Domowy)';
    } else if (i === 1) {
      name = 'Punkt Tranzytowy W1 (Korytarz Początkowy)';
      terrain = 'pojezierze';
    } else if (i === 2) {
      name = 'Punkt Tranzytowy W2 (Środek Trasy)';
      terrain = 'pagorki';
    } else {
      name = 'Punkt Tranzytowy W3 (Podejście do Mety)';
    }

    waypoints.push({
      segmentIndex: i,
      name,
      coordinates: {
        latitude: Math.round(lat * 10000) / 10000,
        longitude: Math.round(lon * 10000) / 10000,
      },
      distanceFromStartKm: distFromStart,
      distanceRemainingKm: distRemaining,
      progressPct: Math.round(fraction * 100),
      estimatedArrivalIso: estTime,
      terrainProfile: terrain,
    });
  }

  return waypoints;
}

/**
 * Standard European championship flight corridors.
 */
export const EUROPEAN_RACE_CORRIDORS = [
  {
    id: 'corridor-magdeburg-warszawa',
    name: 'Magdeburg -> Warszawa (GMP Kat. B/C)',
    category: 'middle_distance',
    distanceKm: 618,
    release: { latitude: 52.1205, longitude: 11.6276 },
    loft: { latitude: 52.2297, longitude: 21.0122 },
  },
  {
    id: 'corridor-bruksela-poznan',
    name: 'Bruksela -> Poznań (Kat. M Maraton)',
    category: 'marathon',
    distanceKm: 835,
    release: { latitude: 50.8503, longitude: 4.3517 },
    loft: { latitude: 52.4064, longitude: 16.9252 },
  },
  {
    id: 'corridor-luneburg-slask',
    name: 'Lüneburg -> Katowice / Śląsk (Kat. C)',
    category: 'long_distance',
    distanceKm: 654,
    release: { latitude: 53.2464, longitude: 10.4115 },
    loft: { latitude: 50.2649, longitude: 19.0238 },
  },
  {
    id: 'corridor-roosendaal-wroclaw',
    name: 'Roosendaal -> Wrocław (Kat. M)',
    category: 'marathon',
    distanceKm: 765,
    release: { latitude: 51.5308, longitude: 4.4653 },
    loft: { latitude: 51.1079, longitude: 17.0385 },
  },
];

