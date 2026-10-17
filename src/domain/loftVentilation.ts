/**
 * PIGEON-FLY — Biometryczny Monitor Mikroklimatu i Wentylacji Gołębnika (Z-066)
 * Zoohigiena układu oddechowego i mikroklimatu gołębnika:
 * - Punkt rosy (Dew Point) wg aproksymacji Magnusa-Tetensa
 * - Ryzyko kondensacji wilgoci w ściółce i namnażania oocyst kokcydiozy
 * - Kubatura, wymiana powietrza na ptaka (0.5 - 1.5 m3/ptak/h) i krotność wymian (ACH)
 * - Rekomendowane nastawy przepustnic kominów wentylacji grawitacyjnej
 */

export type SeasonMode = 'WINTER_REST' | 'BREEDING_SPRING' | 'RACING_SUMMER' | 'MOULT_AUTUMN';

export interface LoftDimensions {
  lengthM: number;
  widthM: number;
  heightM: number;
  birdsCount: number;
}

export interface ClimateConditions {
  temperatureCelsius: number;
  relativeHumidityPct: number; // 0 - 100%
  seasonMode: SeasonMode;
  hasHeatedFloor: boolean;
}

export type CondensationRiskLevel = 'SAFE_DRY' | 'WARNING_HUMID' | 'CRITICAL_CONDENSATION';
export type DamperPosition = 'MINIMAL_SLIT' | 'HALF_OPEN' | 'THREE_QUARTERS' | 'MAX_OPEN';

export interface LoftVentilationResult {
  loftVolumeM3: number;
  volumePerBirdM3: number;
  isOvercrowded: boolean;

  // Punkt rosy i wilgotność
  dewPointCelsius: number;
  condensationMarginDeltaT: number; // T_ambient - T_dew
  condensationRisk: CondensationRiskLevel;
  condensationRiskLabel: string;

  // Wymiana powietrza
  requiredAirflowM3PerHour: number;
  airChangesPerHourACH: number; // ACH = Q / V
  targetAirflowPerBirdM3: number;

  // Rekomendacje zoohigieniczne
  damperRecommendation: DamperPosition;
  damperRecommendationLabel: string;
  damperPercentOpen: number;

  // Ryzyka chorobowe
  coccidiosisRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  respiratorySyndromeRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  actionRecommendations: string[];
}

/**
 * Oblicza punkt rosy (Dew Point) na podstawie temperatury i wilgotności względnej
 * przy użyciu aproksymacji Magnusa-Tetensa (dokładność +/- 0.4°C w zakresie -40 do +50°C)
 */
export function calculateDewPoint(tempCelsius: number, relativeHumidityPct: number): number {
  const safeRH = Math.max(1, Math.min(100, relativeHumidityPct));
  const a = 17.27;
  const b = 237.7;

  const alpha = (a * tempCelsius) / (b + tempCelsius) + Math.log(safeRH / 100);
  const dewPoint = (b * alpha) / (a - alpha);

  return Math.round(dewPoint * 10) / 10;
}

/**
 * Wylicza parametry wentylacji, punkt rosy, krotność wymian i zalecenia kominowe
 */
export function calculateLoftVentilation(
  dimensions: LoftDimensions,
  climate: ClimateConditions
): LoftVentilationResult {
  const { lengthM, widthM, heightM, birdsCount } = dimensions;
  const { temperatureCelsius, relativeHumidityPct, seasonMode, hasHeatedFloor } = climate;

  const loftVolumeM3 = Math.round(lengthM * widthM * heightM * 10) / 10;
  const safeBirdsCount = Math.max(1, birdsCount);
  const volumePerBirdM3 = Math.round((loftVolumeM3 / safeBirdsCount) * 100) / 100;
  const isOvercrowded = volumePerBirdM3 < 0.45;

  // 1. Punkt rosy i margines kondensacji
  const dewPointCelsius = calculateDewPoint(temperatureCelsius, relativeHumidityPct);
  // Jeśli podłoga jest podgrzewana, efektywna temperatura powierzchni wzrasta o ok. 2.5°C
  const effectiveSurfaceTemp = hasHeatedFloor ? temperatureCelsius + 2.5 : temperatureCelsius;
  const condensationMarginDeltaT = Math.round((effectiveSurfaceTemp - dewPointCelsius) * 10) / 10;

  let condensationRisk: CondensationRiskLevel;
  let condensationRiskLabel: string;

  if (condensationMarginDeltaT <= 2.0) {
    condensationRisk = 'CRITICAL_CONDENSATION';
    condensationRiskLabel = 'KRYTYCZNE: Wilgoć skrapla się w ściółce! Natychmiastowe ryzyko kokcydiozy';
  } else if (condensationMarginDeltaT <= 4.0) {
    condensationRisk = 'WARNING_HUMID';
    condensationRiskLabel = 'OSTRZEŻENIE: Podwyższona wilgotność powietrza, ściółka traci sypkość';
  } else {
    condensationRisk = 'SAFE_DRY';
    condensationRiskLabel = 'OPTYMALNIE: Suchy i bezpieczny mikroklimat (Margines kondensacji > 4°C)';
  }

  // 2. Normy wymiany powietrza wg fazy biologicznej (m3/ptak/h)
  let targetAirflowPerBirdM3 = 1.0;
  switch (seasonMode) {
    case 'WINTER_REST':
      targetAirflowPerBirdM3 = 0.6;
      break;
    case 'BREEDING_SPRING':
      targetAirflowPerBirdM3 = 1.0;
      break;
    case 'RACING_SUMMER':
      targetAirflowPerBirdM3 = 1.4;
      break;
    case 'MOULT_AUTUMN':
      targetAirflowPerBirdM3 = 1.2; // wysokie zapylenie łupieżem piór
      break;
  }

  const requiredAirflowM3PerHour = Math.round(safeBirdsCount * targetAirflowPerBirdM3 * 10) / 10;
  const airChangesPerHourACH = Math.round((requiredAirflowM3PerHour / loftVolumeM3) * 10) / 10;

  // 3. Pozycja przepustnicy kominowej
  let damperRecommendation: DamperPosition = 'HALF_OPEN';
  let damperRecommendationLabel = 'Przepustnica uchylona w 50% (Standard)';
  let damperPercentOpen = 50;

  if (temperatureCelsius < 0) {
    damperRecommendation = 'MINIMAL_SLIT';
    damperRecommendationLabel = 'Szczelina minimalna (15-20%) — Ochrona przed wyziębieniem i zamarzaniem wody';
    damperPercentOpen = 20;
  } else if (temperatureCelsius >= 24 || isOvercrowded) {
    damperRecommendation = 'MAX_OPEN';
    damperRecommendationLabel = 'Pełne otwarcie (100%) — Ewakuacja ciepła i amoniaku';
    damperPercentOpen = 100;
  } else if (condensationRisk === 'CRITICAL_CONDENSATION' || relativeHumidityPct >= 80) {
    damperRecommendation = 'THREE_QUARTERS';
    damperRecommendationLabel = 'Uchylona w 75% — Wymuszony ciąg dla osuszenia powietrza';
    damperPercentOpen = 75;
  }

  // 4. Ocena ryzyka chorobowego
  let coccidiosisRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (condensationRisk === 'CRITICAL_CONDENSATION' || (relativeHumidityPct > 80 && temperatureCelsius > 8)) {
    coccidiosisRiskLevel = 'HIGH';
  } else if (condensationRisk === 'WARNING_HUMID') {
    coccidiosisRiskLevel = 'MEDIUM';
  }

  let respiratorySyndromeRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (isOvercrowded && airChangesPerHourACH < 2.5) {
    respiratorySyndromeRiskLevel = 'HIGH';
  } else if (seasonMode === 'MOULT_AUTUMN' && airChangesPerHourACH < 3.0) {
    respiratorySyndromeRiskLevel = 'MEDIUM';
  }

  // 5. Lista zaleceń
  const actionRecommendations: string[] = [];

  if (isOvercrowded) {
    actionRecommendations.push(`Zbyt mała kubatura na ptaka (${volumePerBirdM3} m³ < 0.45 m³). Zredukuj stado lub zwiększ wentylację.`);
  }

  if (condensationRisk === 'CRITICAL_CONDENSATION') {
    actionRecommendations.push('Krytyczny punkt rosy: włącz płytowe ogrzewanie podłogowe lub zastosuj suchą posypkę pochłaniającą wilgoć.');
  }

  if (seasonMode === 'MOULT_AUTUMN') {
    actionRecommendations.push('Okres pierzenia: intensywny puder z lotek zapycha siatki wlotowe — czyść czerpnie co 4 dni.');
  }

  if (relativeHumidityPct > 85) {
    actionRecommendations.push('Wilgotność powyżej 85%: wymień ściółkę słomiastą na suchy zeolit lub pellet drzewny.');
  }

  if (actionRecommendations.length === 0) {
    actionRecommendations.push('Mikroklimat gołębnika w normie zoohigienicznej. Warunki sprzyjające zdrowiu dróg oddechowych.');
  }

  return {
    loftVolumeM3,
    volumePerBirdM3,
    isOvercrowded,
    dewPointCelsius,
    condensationMarginDeltaT,
    condensationRisk,
    condensationRiskLabel,
    requiredAirflowM3PerHour,
    airChangesPerHourACH,
    targetAirflowPerBirdM3,
    damperRecommendation,
    damperRecommendationLabel,
    damperPercentOpen,
    coccidiosisRiskLevel,
    respiratorySyndromeRiskLevel,
    actionRecommendations,
  };
}
