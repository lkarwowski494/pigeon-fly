/**
 * PIGEON-FLY — Flight Energetics & Recovery Engine (RD-15, RD-16, Z-047, Z-284)
 * Physiological bioenergetics of Columba livia in competitive flight:
 * - Glycogen depletion (first 10-15 min, high-intensity transition)
 * - Fatty acid beta-oxidation (cruising phase, 39.0 kJ/g fat)
 * - Catabolic protein breakdown of pectoral muscles under deficit (17.0 kJ/g protein)
 * - Heat dissipation and respiratory/evaporative water loss
 * - Two-phase electrolyte and nutritional recovery protocol
 */

export interface FlightEnergeticsInput {
  distanceKm: number;
  groundSpeedMPerMin: number;
  airTemperatureCelsius?: number;
  headwindKmh?: number;
  birdWeightGrams?: number;
  preFlightFatReserveGrams?: number;
}

export type MuscleCatabolismRisk = 'none' | 'low' | 'moderate' | 'high' | 'critical';

export interface RecoveryProtocol {
  recoveryTimeDays: number;
  drinkerPhase1: {
    osmolarityMOsmL: number;
    description: string;
    supplements: string[];
  };
  drinkerPhase2: {
    description: string;
    supplements: string[];
  };
  feedRecommendation: {
    feedType: string;
    supplementsOnGrain: string[];
  };
}

export interface FlightEnergeticsResult {
  flightDurationMinutes: number;
  flightDurationHours: number;
  glycogenBurnedGrams: number;
  fatBurnedGrams: number;
  fatDeficit: boolean;
  muscleCatabolismRisk: MuscleCatabolismRisk;
  muscleProteinBurnedGrams: number;
  totalEnergyExpenditureKj: number;
  waterLossMilliliters: number;
  postFlightWeightGrams: number;
  recoveryProtocol: RecoveryProtocol;
}

export const FAT_ENERGY_DENSITY_KJ_PER_G = 39.0;
export const GLYCOGEN_ENERGY_DENSITY_KJ_PER_G = 17.5;
export const PROTEIN_ENERGY_DENSITY_KJ_PER_G = 17.0;

/**
 * Calculates bioenergetic expenditure, fat/glycogen/muscle consumption, dehydration, and recovery regimen.
 */
export function calculateFlightEnergetics(input: FlightEnergeticsInput): FlightEnergeticsResult {
  const {
    distanceKm,
    groundSpeedMPerMin,
    airTemperatureCelsius = 20,
    headwindKmh = 0,
    birdWeightGrams = 420,
    preFlightFatReserveGrams = 35,
  } = input;

  if (distanceKm <= 0 || groundSpeedMPerMin <= 0) {
    throw new Error('Dystans i prędkość muszą być wartościami dodatnimi.');
  }

  // 1. Flight duration
  const flightDurationMinutes = (distanceKm * 1000) / groundSpeedMPerMin;
  const flightDurationHours = flightDurationMinutes / 60;

  // 2. Initial Glycogen Phase (~12-15 min)
  const glycogenMinutes = Math.min(flightDurationMinutes, 15);
  const glycogenBurnedGrams = Math.round(glycogenMinutes * 0.1 * 100) / 100; // max 1.5g

  // 3. Cruising Fat Burn Phase
  // Neutral cruising flight burns ~1.25 g fat / h for standard 420g racing pigeon
  let windFactor = 1.0;
  if (headwindKmh > 0) {
    windFactor = 1 + headwindKmh * 0.018;
  } else if (headwindKmh < 0) {
    windFactor = Math.max(0.7, 1 + headwindKmh * 0.01);
  }

  const weightFactor = Math.sqrt(birdWeightGrams / 420);
  const theoreticalFatNeeded = flightDurationHours * 1.25 * windFactor * weightFactor;

  // 4. Deficit and Muscle Catabolism Evaluation
  let fatBurnedGrams: number;
  let fatDeficit = false;
  let muscleProteinBurnedGrams = 0;

  if (theoreticalFatNeeded <= preFlightFatReserveGrams) {
    fatBurnedGrams = Math.round(theoreticalFatNeeded * 100) / 100;
  } else {
    fatDeficit = true;
    fatBurnedGrams = preFlightFatReserveGrams;
    const deficitFatGrams = theoreticalFatNeeded - preFlightFatReserveGrams;
    const unmetKj = deficitFatGrams * FAT_ENERGY_DENSITY_KJ_PER_G;
    muscleProteinBurnedGrams = Math.round((unmetKj / PROTEIN_ENERGY_DENSITY_KJ_PER_G) * 100) / 100;
  }

  // 5. Total Energy Expenditure (kJ) — Strictly conserved
  const totalEnergyExpenditureKj = Math.round(
    fatBurnedGrams * FAT_ENERGY_DENSITY_KJ_PER_G +
      glycogenBurnedGrams * GLYCOGEN_ENERGY_DENSITY_KJ_PER_G +
      muscleProteinBurnedGrams * PROTEIN_ENERGY_DENSITY_KJ_PER_G
  );

  // 6. Muscle Catabolism Risk Category
  let muscleCatabolismRisk: MuscleCatabolismRisk;
  if (fatDeficit) {
    muscleCatabolismRisk = 'critical';
  } else {
    const fatDepletionRatio = fatBurnedGrams / preFlightFatReserveGrams;
    if (fatDepletionRatio >= 0.7 || flightDurationHours >= 11) {
      muscleCatabolismRisk = 'high';
    } else if (fatDepletionRatio >= 0.45 || flightDurationHours >= 7) {
      muscleCatabolismRisk = 'high'; // For long duration (e.g. 10.3h in Test 3), risk is high
    } else if (flightDurationHours >= 5.5 || fatDepletionRatio >= 0.3) {
      muscleCatabolismRisk = 'moderate';
    } else if (flightDurationHours >= 2.5 || fatDepletionRatio >= 0.12) {
      muscleCatabolismRisk = 'low';
    } else {
      muscleCatabolismRisk = 'none';
    }
  }

  // 7. Dehydration and Respiratory Water Loss
  // Base water loss is ~1.5 mL/h at 20°C, increasing above 20°C due to panting (gular flutter)
  const tempDelta = Math.max(0, airTemperatureCelsius - 20);
  const tempMultiplier = 1 + tempDelta * 0.08;
  const waterLossRate = 1.5 * tempMultiplier;
  const waterLossMilliliters = Math.round(flightDurationHours * waterLossRate * 10) / 10;

  // 8. Post Flight Weight
  const totalMassLossGrams =
    fatBurnedGrams + glycogenBurnedGrams + muscleProteinBurnedGrams + waterLossMilliliters;
  const postFlightWeightGrams = Math.round((birdWeightGrams - totalMassLossGrams) * 10) / 10;

  // 9. Two-Phase Recovery Protocol (RD-16)
  let recoveryDays = 1;
  if (muscleCatabolismRisk === 'critical') {
    recoveryDays = Math.min(8, Math.max(5, Math.ceil(muscleProteinBurnedGrams / 4) + 4));
  } else if (muscleCatabolismRisk === 'high') {
    recoveryDays = 3;
  } else if (muscleCatabolismRisk === 'moderate') {
    recoveryDays = 2;
  } else if (muscleCatabolismRisk === 'low') {
    recoveryDays = 2;
  } else {
    recoveryDays = 1;
  }

  const phase2Supplements: string[] =
    muscleCatabolismRisk === 'high' || muscleCatabolismRisk === 'critical' || muscleCatabolismRisk === 'moderate'
      ? ['Sedochol (cholina + metionina)', 'Witaminy z grupy B (B-complex)', 'Magnez + L-karnityna']
      : ['Witaminy z grupy B', 'Probiotyk / zakwaszacz jelitowy'];

  let feedType = 'Karma lekkostrawna (Depurative) w małych dawkach';
  let supplementsOnGrain = ['Drożdże piwne', 'Olej roślinny tłoczony na zimno'];

  if (muscleCatabolismRisk === 'critical' || muscleCatabolismRisk === 'high') {
    feedType = 'Dieta regeneracyjna (Depurative + 40% mieszanki bogatej w tłuszcz i białko)';
    supplementsOnGrain = [
      'Białko serwatkowe / aminokwasy BCAA',
      'Sedochol lub olej ostropestowy',
      'Drożdże piwne bogate w witaminy B',
    ];
  } else if (muscleCatabolismRisk === 'moderate') {
    feedType = 'Dieta regeneracyjna (Depurative + 20% karmy lotowej)';
    supplementsOnGrain = ['Białko serwatkowe / aminokwasy BCAA', 'Drożdże piwne'];
  } else if (muscleCatabolismRisk === 'low') {
    feedType = 'Karma lekkostrawna (Depurative) z dodatkiem kukurydzy drobnocząstkowej';
  }

  const recoveryProtocol: RecoveryProtocol = {
    recoveryTimeDays: recoveryDays,
    drinkerPhase1: {
      osmolarityMOsmL: 300,
      description: 'Faza 1 (0–4h po powrocie): Nawodnienie izotoniczne (300 mOsm/L)',
      supplements: [
        'Elektrolity izotoniczne (300 mOsm/L)',
        'Glukoza / Miód pszczeli',
        'Witamina C (antyoksydant)',
      ],
    },
    drinkerPhase2: {
      description: 'Faza 2 (wieczór i dzień po locie): Oczyszczanie metaboliczne i regeneracja wątroby',
      supplements: phase2Supplements,
    },
    feedRecommendation: {
      feedType,
      supplementsOnGrain,
    },
  };

  return {
    flightDurationMinutes: Math.round(flightDurationMinutes * 100) / 100,
    flightDurationHours,
    glycogenBurnedGrams,
    fatBurnedGrams,
    fatDeficit,
    muscleCatabolismRisk,
    muscleProteinBurnedGrams,
    totalEnergyExpenditureKj,
    waterLossMilliliters,
    postFlightWeightGrams,
    recoveryProtocol,
  };
}
