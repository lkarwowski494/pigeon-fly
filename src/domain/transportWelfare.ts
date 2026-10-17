/**
 * PIGEON-FLY — Elektroniczny Dziennik Koszyka i Kabiny Transportowej (Z-059)
 * Standard Dobrostanu Zwierząt w Transporcie (FCI / PZHGP):
 * 1. Obliczanie powierzchni podłogowej i norm zagęszczenia na ptaka (cm²/gołąb)
 * 2. Wskaźnik stresu termicznego THI (Temperature-Humidity Index) dla kabin ptasich
 * 3. Ewidencja pojenia w kabinie (watering) i wymogów odpoczynku przed wypuszczeniem
 * 4. Holistyczna ocena dobrostanu stada (Transport Welfare Index) z statusem GO / DELAY
 */

export type RaceDistanceTier = 'short' | 'medium' | 'long' | 'marathon';

export interface CrateManifest {
  crateId: string;
  crateNumber: number;
  widthCm: number; // Domyślnie 100 cm
  depthCm: number; // Domyślnie 100 cm
  birdCount: number;
  sexRestriction?: 'cocks_only' | 'hens_only' | 'mixed';
  notes?: string;
}

export interface CabinEnvironmentLog {
  timestamp: string; // ISO
  temperatureCelsius: number;
  relativeHumidityPercent: number;
  isForcedVentilationActive: boolean;
  isVehicleMoving: boolean;
}

export interface WateringEvent {
  timestamp: string; // ISO
  drinkerTroughsFilled: boolean;
  waterQuality: 'clean_fresh' | 'lukewarm' | 'soiled';
  observedDrinkingIntensity: 'eager' | 'normal' | 'reluctant';
  notes?: string;
}

export interface CrateDensityResult {
  floorAreaCm2: number;
  areaPerBirdCm2: number;
  minRequiredAreaPerBirdCm2: number;
  densityStatus: 'optimal' | 'acceptable' | 'overcrowded';
  maxAllowedBirds: number;
  overcrowdingDeltaBirds: number;
}

export type ThiRiskLevel = 'normal' | 'alert' | 'danger' | 'critical';

export interface ThiAssessment {
  thiValue: number;
  riskLevel: ThiRiskLevel;
  description: string;
  recommendedAction: string;
}

export interface TransportWelfareSummary {
  welfareScore: number; // 0 - 100 pkt
  overallStatus: 'optimal' | 'caution' | 'critical';
  releaseReadiness: 'GO' | 'DELAY_FOR_WATERING' | 'EMERGENCY_VENTILATION';
  totalBirds: number;
  totalCrates: number;
  avgAreaPerBirdCm2: number;
  currentThi: ThiAssessment;
  lastWateringHoursAgo: number | null;
  violations: string[];
  recommendations: string[];
}

/**
 * Minimalne normy powierzchni podłogowej wg regulaminów FCI w zależności od dystansu i czasu w kabinie:
 * - Kat. A/B (krótkie/średnie <400 km, 1 noc): min. 360 cm²/ptak (~27 ptaków/m²)
 * - Kat. C (dalekie 400-700 km, 1-2 noce): min. 440 cm²/ptak (~22 ptaki/m²)
 * - Kat. M (maraton >700 km, 2-3 noce): min. 520 cm²/ptak (~19 ptaków/m²)
 */
export function getMinRequiredAreaPerBird(distanceTier: RaceDistanceTier): number {
  switch (distanceTier) {
    case 'marathon':
      return 520;
    case 'long':
      return 440;
    case 'medium':
      return 380;
    case 'short':
    default:
      return 350;
  }
}

/**
 * Oblicza gęstość obsady w klatce transportowej
 */
export function calculateCrateDensity(
  widthCm: number,
  depthCm: number,
  birdCount: number,
  distanceTier: RaceDistanceTier = 'medium'
): CrateDensityResult {
  const floorAreaCm2 = Math.max(100, widthCm * depthCm);
  const count = Math.max(1, birdCount);
  const areaPerBirdCm2 = Math.round((floorAreaCm2 / count) * 10) / 10;
  const minRequired = getMinRequiredAreaPerBird(distanceTier);

  const maxAllowedBirds = Math.floor(floorAreaCm2 / minRequired);
  const overcrowdingDeltaBirds = Math.max(0, count - maxAllowedBirds);

  let densityStatus: 'optimal' | 'acceptable' | 'overcrowded' = 'optimal';
  if (count > maxAllowedBirds) {
    densityStatus = 'overcrowded';
  } else if (areaPerBirdCm2 < minRequired * 1.05) {
    densityStatus = 'acceptable';
  }

  return {
    floorAreaCm2,
    areaPerBirdCm2,
    minRequiredAreaPerBirdCm2: minRequired,
    densityStatus,
    maxAllowedBirds,
    overcrowdingDeltaBirds,
  };
}

/**
 * Oblicza Temperature-Humidity Index (THI) dla transportu ptaków:
 * Wzór Thom/NRC dostosowany do fizjologii ptaków:
 * THI = 0.8 * T + (RH / 100) * (T - 14.4) + 46.4
 */
export function calculateCabinThi(temperatureCelsius: number, relativeHumidityPercent: number): ThiAssessment {
  const T = temperatureCelsius;
  const RH = Math.max(0, Math.min(100, relativeHumidityPercent));

  const thi = Math.round((0.8 * T + (RH / 100) * (T - 14.4) + 46.4) * 10) / 10;

  if (thi < 70.0) {
    return {
      thiValue: thi,
      riskLevel: 'normal',
      description: 'Strefa pełnego komfortu cieplno-wilgotnościowego stada.',
      recommendedAction: 'Standardowa wentylacja grawitacyjna kabiny.',
    };
  }

  if (thi < 78.0) {
    return {
      thiValue: thi,
      riskLevel: 'alert',
      description: 'Umiarkowany stres cieplny — ptaki zaczynają przyspieszać oddechy.',
      recommendedAction: 'Włącz wentylatory mechaniczne nawiewno-wywiewne w kabinie.',
    };
  }

  if (thi < 83.0) {
    return {
      thiValue: thi,
      riskLevel: 'danger',
      description: 'Wysoki stres cieplny i duszność — ryzyko odwodnienia i zasłabnięć.',
      recommendedAction: 'Natychmiastowe napełnienie rynienek wodą, osłonięcie kabiny przed słońcem, maksymalny nawiew.',
    };
  }

  return {
    thiValue: thi,
    riskLevel: 'critical',
    description: 'STAN KRYTYCZNY (Zagrożenie uduszeniem / hipertermią).',
    recommendedAction: 'Bezwzględny zakaz wypuszczania w tym stanie. Otwórz wszystkie luki boczne kabiny, schłodź pojazd zraszaczami.',
  };
}

/**
 * Holistyczna ocena dobrostanu stada w kabinie przed wypuszczeniem
 */
export function evaluateTransportWelfare(
  crates: CrateManifest[],
  latestEnvLog?: CabinEnvironmentLog,
  wateringEvents: WateringEvent[] = [],
  distanceTier: RaceDistanceTier = 'medium',
  nowIso: string = new Date().toISOString()
): TransportWelfareSummary {
  const violations: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const totalBirds = crates.reduce((sum, c) => sum + c.birdCount, 0);
  const totalCrates = crates.length;
  const totalAreaCm2 = crates.reduce((sum, c) => sum + c.widthCm * c.depthCm, 0);
  const avgAreaPerBirdCm2 = totalBirds > 0 ? Math.round((totalAreaCm2 / totalBirds) * 10) / 10 : 0;

  // 1. Walidacja zagęszczenia w koszach
  let overcrowdedCratesCount = 0;
  crates.forEach((crate) => {
    const density = calculateCrateDensity(crate.widthCm, crate.depthCm, crate.birdCount, distanceTier);
    if (density.densityStatus === 'overcrowded') {
      overcrowdedCratesCount += 1;
      violations.push(
        `Kosz #${crate.crateNumber}: Przepełnienie! ${crate.birdCount} ptaków (limit: ${density.maxAllowedBirds}, brak ${density.overcrowdingDeltaBirds * density.minRequiredAreaPerBirdCm2} cm²).`
      );
    }
  });

  if (overcrowdedCratesCount > 0) {
    score -= Math.min(40, overcrowdedCratesCount * 15);
  }

  // 2. Walidacja wskaźnika THI
  const env = latestEnvLog || {
    timestamp: nowIso,
    temperatureCelsius: 21,
    relativeHumidityPercent: 55,
    isForcedVentilationActive: true,
    isVehicleMoving: false,
  };

  const thiAssessment = calculateCabinThi(env.temperatureCelsius, env.relativeHumidityPercent);
  if (thiAssessment.riskLevel === 'critical') {
    score -= 55;
    violations.push(`Krytyczny wskaźnik THI: ${thiAssessment.thiValue} (${env.temperatureCelsius}°C, ${env.relativeHumidityPercent}% RH).`);
  } else if (thiAssessment.riskLevel === 'danger') {
    score -= 25;
    violations.push(`Zagrożenie stresem cieplnym: THI ${thiAssessment.thiValue}.`);
  } else if (thiAssessment.riskLevel === 'alert') {
    score -= 10;
    recommendations.push('Utrzymuj ciągłą wentylację wymuszoną podczas postoju kabiny.');
  }

  // 3. Walidacja pojenia
  let lastWateringHoursAgo: number | null = null;
  if (wateringEvents.length > 0) {
    const sorted = [...wateringEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastEvent = sorted[0];
    const diffMs = new Date(nowIso).getTime() - new Date(lastEvent.timestamp).getTime();
    lastWateringHoursAgo = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    if (lastEvent.waterQuality === 'soiled') {
      score -= 15;
      violations.push('Woda w rynienkach zanieczyszczona odchodami — wymagana natychmiastowa wymiana.');
    }

    if (lastWateringHoursAgo > 12) {
      score -= 20;
      violations.push(`Brak pojenia od ponad ${lastWateringHoursAgo} godzin! Standard FCI nakazuje pojenie co 10-12h.`);
    }
  } else if (distanceTier === 'long' || distanceTier === 'marathon') {
    score -= 30;
    violations.push('Brak zarejestrowanego pojenia dla lotu dalekodystansowego/maratońskiego!');
  }

  score = Math.max(0, Math.min(100, score));

  let overallStatus: 'optimal' | 'caution' | 'critical' = 'optimal';
  let releaseReadiness: 'GO' | 'DELAY_FOR_WATERING' | 'EMERGENCY_VENTILATION' = 'GO';

  if (score < 50 || thiAssessment.riskLevel === 'critical') {
    overallStatus = 'critical';
    releaseReadiness = thiAssessment.riskLevel === 'critical' ? 'EMERGENCY_VENTILATION' : 'DELAY_FOR_WATERING';
  } else if (score < 80 || thiAssessment.riskLevel === 'danger' || (lastWateringHoursAgo !== null && lastWateringHoursAgo > 12)) {
    overallStatus = 'caution';
    releaseReadiness = 'DELAY_FOR_WATERING';
  }

  if (recommendations.length === 0 && overallStatus === 'optimal') {
    recommendations.push('Warunki transportu zgodne z najwyższymi standardami dobrostanu FCI.');
  }

  return {
    welfareScore: score,
    overallStatus,
    releaseReadiness,
    totalBirds,
    totalCrates,
    avgAreaPerBirdCm2,
    currentThi: thiAssessment,
    lastWateringHoursAgo,
    violations,
    recommendations,
  };
}
