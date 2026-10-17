/**
 * PIGEON-FLY — Advanced Moult Progress Tracker & Keratin Nutrition Engine (Z-055, BR-ZDR-011)
 * Biological monitoring of:
 * - 10 primary flight feathers (lotki pierwszorzędowe I rzędu) with blood-quill growth stages
 * - 12 tail retrices (sterówki ogona) moult sequence
 * - Body covert moult (pierzenie drobne)
 * - Safe race basketing barriers (feather 7-10 growth phase & blood quill protection)
 * - Keratin regeneration nutritional protocol (sulfur amino acids, methionine, biotin, linseed)
 * - Flock-level moult distribution and progression rate.
 */

export type FeatherGrowthStage =
  | 'intact' // 100% stara lub w pełni dojrzała lotka
  | 'dropped' // 0% świeżo wypadła (pusty mieszek piórowy)
  | 'blood_quill' // 10-25% intensywnie ukrwiona dętka (bardzo podatna na urazy i krwotok)
  | 'brushing' // 26-60% pędzel pióra wychodzi z pochewki
  | 'maturing' // 61-90% zaawansowany wzrost, dosychająca stosina
  | 'completed'; // 100% nowa, w pełni zrogowaciała lotka

export interface PrimaryFeatherDetail {
  number: number; // 1 (najgłębsza) do 10 (skrajna na szczycie skrzydła)
  stage: FeatherGrowthStage;
  lengthPercent: number; // 0 - 100%
  isBloodQuillVulnerable: boolean; // czy stosina jest ukrwiona (ryzyko krwotoku w koszu)
  isOuterWingFeather: boolean; // lotki 7, 8, 9, 10
}

export interface TailMoultStatus {
  droppedPairsCount: number; // 0 do 6 par (łącznie 12 sterówek)
  isTailMoultActive: boolean;
  notes: string;
}

export interface PigeonMoultProfile {
  pigeonId: string;
  ringNumber: string;
  inspectionDate: string; // YYYY-MM-DD
  primaries: PrimaryFeatherDetail[];
  tail: TailMoultStatus;
  bodyMoultIntensity: 'none' | 'light' | 'heavy_peak';
}

export interface MoultEvaluationResult {
  pigeonId: string;
  ringNumber: string;
  droppedPrimariesCount: number;
  activeRegrowingFeatherNumber: number | null;
  overallWingRenovationPercent: number; // 0.0 - 100.0%
  isFitForBasketing: boolean;
  basketingBlockReason?: string;
  flightRiskLevel: 'safe' | 'caution' | 'dangerous_prohibited';
  keratinNutritionalAdvice: string[];
  recommendedFeedSupplements: string[];
}

export interface FlockMoultDistribution {
  totalBirdsInspected: number;
  averageRenovationPercent: number;
  birdsPerActiveFeather: { [featherNumber: number]: number };
  birdsFitForRacingCount: number;
  birdsBlockedDueToMoultCount: number;
}

/**
 * Evaluates individual pigeon wing & tail moult condition and checks flight safety.
 */
export function evaluatePigeonMoult(profile: PigeonMoultProfile): MoultEvaluationResult {
  let totalLength = 0;
  let droppedCount = 0;
  let activeFeather: number | null = null;
  let isFit = true;
  let blockReason: string | undefined;
  let riskLevel: 'safe' | 'caution' | 'dangerous_prohibited' = 'safe';

  for (const f of profile.primaries) {
    totalLength += f.lengthPercent;

    if (f.stage !== 'intact' && f.stage !== 'completed') {
      droppedCount++;
      if (activeFeather === null || f.number > activeFeather) {
        activeFeather = f.number;
      }
    }

    // Safety rule 1: Outer wing feathers (7-10) during active growth (<65%) destroy flight lift
    if (f.number >= 7 && (f.stage === 'dropped' || f.stage === 'blood_quill' || f.lengthPercent < 65)) {
      isFit = false;
      riskLevel = 'dangerous_prohibited';
      blockReason = `Skrajna lotka nośna #${f.number} w fazie wzrostu (${f.lengthPercent}%). Niedostateczna siła nośna i ryzyko trwałego wykrzywienia rosnącego pióra!`;
    }

    // Safety rule 2: Blood quill (<25%) on ANY feather is vulnerable to hemorrhaging in the race crate
    if (f.isBloodQuillVulnerable || f.stage === 'blood_quill' || (f.lengthPercent > 0 && f.lengthPercent <= 25)) {
      isFit = false;
      riskLevel = 'dangerous_prohibited';
      blockReason = `Lotka #${f.number} posiada żywą, ukrwioną dętkę. Ryzyko pęknięcia naczynia krwionośnego i wykrwawienia przy stłoczeniu w kabinie!`;
    }
  }

  // Safety rule 3: Heavy tail moult with >3 pairs missing impairs steering in turbulence
  if (isFit && profile.tail.droppedPairsCount >= 4) {
    riskLevel = 'caution';
  }

  // Calculate wing renovation percentage (sum of lengths / 1000 * 100)
  const overallWingRenovationPercent = Number((totalLength / 10).toFixed(1));

  // Keratin nutritional protocol based on moult intensity
  const keratinAdvice: string[] = [];
  const supplements: string[] = [];

  if (droppedCount >= 5 || profile.bodyMoultIntensity === 'heavy_peak') {
    keratinAdvice.push(
      'Szczyt wymiany upierzenia: organizm zużywa do 40% białka pobranego z diety na syntezę keratyny.',
      'Zwiększ udział nasion bogatych w aminokwasy siarkowe (metionina i cysteina warunkują elastyczność stosiny).'
    );
    supplements.push(
      'Siemię lniane i kardi (kwasy Omega-3 i Omega-6)',
      'Drożdże piwne z biotyną (witamina H dla połysku)',
      'MSM (organiczna siarka biogenna 2g/kg karmy)',
      'Herbata ziołowa z pokrzywy i skrzypu polnego (naturalna krzemionka)'
    );
  } else {
    keratinAdvice.push(
      'Umiarkowane tempo pierzenia: regularna kąpiel z solą kąpielową raz w tygodniu.',
      'Dostęp do świeżego gritu czerwonego i kostki mineralnej.'
    );
    supplements.push(
      'Sól do kąpieli z eukaliptusem (usuwa łupież piórowy)',
      'Mieszanka drobnych nasion oleistych'
    );
  }

  return {
    pigeonId: profile.pigeonId,
    ringNumber: profile.ringNumber,
    droppedPrimariesCount: droppedCount,
    activeRegrowingFeatherNumber: activeFeather,
    overallWingRenovationPercent,
    isFitForBasketing: isFit,
    basketingBlockReason: blockReason,
    flightRiskLevel: riskLevel,
    keratinNutritionalAdvice: keratinAdvice,
    recommendedFeedSupplements: supplements,
  };
}

/**
 * Calculates flock-wide moult statistics to guide team feeding and training.
 */
export function calculateFlockMoultDistribution(
  profiles: PigeonMoultProfile[]
): FlockMoultDistribution {
  if (profiles.length === 0) {
    return {
      totalBirdsInspected: 0,
      averageRenovationPercent: 100,
      birdsPerActiveFeather: {},
      birdsFitForRacingCount: 0,
      birdsBlockedDueToMoultCount: 0,
    };
  }

  let totalRenovation = 0;
  let fitCount = 0;
  let blockedCount = 0;
  const featherCounts: { [featherNumber: number]: number } = {};

  for (let i = 1; i <= 10; i++) {
    featherCounts[i] = 0;
  }

  for (const p of profiles) {
    const res = evaluatePigeonMoult(p);
    totalRenovation += res.overallWingRenovationPercent;

    if (res.isFitForBasketing) {
      fitCount++;
    } else {
      blockedCount++;
    }

    if (res.activeRegrowingFeatherNumber) {
      featherCounts[res.activeRegrowingFeatherNumber] =
        (featherCounts[res.activeRegrowingFeatherNumber] || 0) + 1;
    }
  }

  return {
    totalBirdsInspected: profiles.length,
    averageRenovationPercent: Number((totalRenovation / profiles.length).toFixed(1)),
    birdsPerActiveFeather: featherCounts,
    birdsFitForRacingCount: fitCount,
    birdsBlockedDueToMoultCount: blockedCount,
  };
}
