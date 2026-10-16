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
