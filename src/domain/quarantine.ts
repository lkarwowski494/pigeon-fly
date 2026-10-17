/**
 * PIGEON-FLY — Quarantine & Isolation Ward Domain Engine (Z-308, BR-ZDR-010)
 * Zoohygienic management of isolated pigeons: clinical triage follow-up,
 * daily monitoring of crop emptying, droppings consistency, body weight,
 * polydipsia (water intake), and official criteria for release back to flock.
 */

export type QuarantineReason =
  | 'ypds_adeno_coli' // Zespół Choroby Młodych (ostry stan biegunkowy)
  | 'coryza_respiratory' // Katar zakaźny / Mycoplasma / Ornithosis
  | 'race_exhaustion' // Skrajne wycieńczenie powrotowe z lotu
  | 'new_purchase' // Nowo zakupiony ptak (kwarantanna wstępna 21 dni)
  | 'injury_trauma' // Zranienie przez drapieżnika / uraz mechaniczny
  | 'suspected_infection'; // Inne podejrzenie choroby zakaźnej

export type CropCondition =
  | 'normal_empty' // Puste rano, prawidłowa perystaltyka
  | 'slow_digestion' // Opóźnione trawienie (ziarno zalega > 12h)
  | 'fermenting_stasis' // Ciężkie zaleganie fermentującego płynu i gazu (Adeno-Coli)
  | 'vomiting'; // Aktywne wymioty po napojeniu/karmieniu

export type DroppingsConsistency =
  | 'normal_firm' // Zwarte kuleczki z białym kwasem moczowym (stan prawidłowy)
  | 'soft_pasty' // Lekko rozluźniony kał (niestrawność)
  | 'green_mucoid' // Zielonkawy cuchnący śluz (ostra enterotoksemia E. coli / YPDS)
  | 'watery_puddle'; // Kał wodnisty / plama bezpostaciowa (uszkodzenie nerek / heksamitoza)

export type PatientStatus =
  | 'isolated_active' // W trakcie kwarantanny / leczenia
  | 'cleared_for_release' // Spełnia kryteria zwolnienia do stada
  | 'discharged' // Zwolniony do przedziału lotowego / rozpłodowego
  | 'deceased'; // Padł w trakcie leczenia

export interface QuarantineDailyLog {
  date: string; // YYYY-MM-DD
  cropCondition: CropCondition;
  droppingsConsistency: DroppingsConsistency;
  weightGrams?: number;
  appetite: 'normal' | 'reduced' | 'anorexic';
  waterIntake: 'normal' | 'polydipsia_excessive' | 'none';
  bodyTemperature: 'normal' | 'cold_extremities' | 'feverish';
  treatmentsAdministered: string[]; // np. ["Elektrolity 300 mOsm/L", "Ocet jabłkowy pH 4.0", "IgY"]
  notes?: string;
}

export interface QuarantinePatient {
  id: string;
  pigeonId: string;
  ringNumber: string;
  admissionDate: string; // YYYY-MM-DD
  reason: QuarantineReason;
  minQuarantineDays: number; // np. 14 dni dla YPDS, 21 dla nowych nabytków, 7 dla wycieńczenia
  status: PatientStatus;
  dailyLogs: QuarantineDailyLog[];
  dischargeDate?: string;
}

export interface ReleaseEvaluation {
  canRelease: boolean;
  daysInQuarantine: number;
  minDaysRequired: number;
  consecutiveHealthyDays: number;
  requiredHealthyDays: number;
  reasonsBlocking: string[];
  recommendations: string[];
}

/**
 * Returns minimum quarantine duration according to veterinary zoohygienic protocols.
 */
export function getMinimumQuarantineDays(reason: QuarantineReason): number {
  switch (reason) {
    case 'new_purchase':
      return 21; // Pełna kwarantanna biologiczna na ukryte zakażenia i serokonwersję
    case 'ypds_adeno_coli':
      return 14; // Okres eliminacji enteropatogennej E. coli i odbudowy kosmków
    case 'coryza_respiratory':
      return 14;
    case 'suspected_infection':
      return 10;
    case 'race_exhaustion':
    case 'injury_trauma':
      return 5;
    default:
      return 14;
  }
}

/**
 * Evaluates whether an isolated patient can be safely released back to the general flock.
 * Criteria:
 * 1. Must spend at least minQuarantineDays in the isolation ward.
 * 2. Must exhibit at least 3 consecutive days of normal crop emptying AND normal firm droppings.
 * 3. Must have normal appetite and no excessive polydipsia or fever.
 */
export function evaluateQuarantineRelease(
  patient: QuarantinePatient,
  currentDate: Date = new Date()
): ReleaseEvaluation {
  const admissionTime = new Date(patient.admissionDate).setHours(0, 0, 0, 0);
  const currentTime = new Date(currentDate).setHours(0, 0, 0, 0);
  const daysInQuarantine = Math.max(
    0,
    Math.floor((currentTime - admissionTime) / (1000 * 60 * 60 * 24))
  );

  const minDaysRequired = patient.minQuarantineDays;
  const requiredHealthyDays = 3;

  // Sort logs chronological ascending
  const sortedLogs = [...patient.dailyLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Count consecutive healthy days from the most recent logs backwards
  let consecutiveHealthyDays = 0;
  for (let i = sortedLogs.length - 1; i >= 0; i--) {
    const log = sortedLogs[i];
    const isCropHealthy = log.cropCondition === 'normal_empty';
    const isDroppingsHealthy = log.droppingsConsistency === 'normal_firm';
    const isAppetiteOk = log.appetite !== 'anorexic';
    const isWaterOk = log.waterIntake !== 'none';

    if (isCropHealthy && isDroppingsHealthy && isAppetiteOk && isWaterOk) {
      consecutiveHealthyDays++;
    } else {
      break; // Streak broken
    }
  }

  const reasonsBlocking: string[] = [];
  const recommendations: string[] = [];

  if (daysInQuarantine < minDaysRequired) {
    const remainingDays = minDaysRequired - daysInQuarantine;
    reasonsBlocking.push(
      `Wymagany minimalny czas kwarantanny (${minDaysRequired} dni) nie minął. Pozostało jeszcze ${remainingDays} dni.`
    );
  }

  if (consecutiveHealthyDays < requiredHealthyDays) {
    const missingHealthyDays = requiredHealthyDays - consecutiveHealthyDays;
    reasonsBlocking.push(
      `Wymagane minimum 3 kolejne dni pełnego zdrowia (normalne wole + prawidłowy kał). Aktualnie: ${consecutiveHealthyDays} dni (brakuje ${missingHealthyDays}).`
    );
  }

  if (sortedLogs.length > 0) {
    const lastLog = sortedLogs[sortedLogs.length - 1];
    if (lastLog.cropCondition === 'fermenting_stasis' || lastLog.cropCondition === 'vomiting') {
      reasonsBlocking.push('Wciąż występuje zaleganie lub wymioty w wolu.');
      recommendations.push('Kontynuuj głodówkę i pojenie elektrolitami z zakwaszaczem pH 4.0.');
    }
    if (lastLog.droppingsConsistency === 'green_mucoid') {
      reasonsBlocking.push('Obecna zielona śluzowata biegunka enterotoksyczna.');
      recommendations.push('Podaj maślan sodu i przeciwciała żółtkowe IgY.');
    }
  } else {
    reasonsBlocking.push('Brak jakichkolwiek wpisów w dzienniku codziennych obserwacji.');
    recommendations.push('Uzupełnij codzienną kartę badania klinicznego pacjenta.');
  }

  const canRelease = reasonsBlocking.length === 0;

  if (canRelease) {
    recommendations.push(
      'Ptak spełnia rygorystyczne kryteria kliniczne. Może zostać zdezynfekowany i bezpiecznie przeniesiony do gołębnika macierzystego.'
    );
  }

  return {
    canRelease,
    daysInQuarantine,
    minDaysRequired,
    consecutiveHealthyDays,
    requiredHealthyDays,
    reasonsBlocking,
    recommendations,
  };
}

/**
 * Creates a new quarantine patient record.
 */
export function createQuarantinePatient(params: {
  pigeonId: string;
  ringNumber: string;
  reason: QuarantineReason;
  admissionDate?: string;
}): QuarantinePatient {
  const admissionDate = params.admissionDate || new Date().toISOString().split('T')[0];
  const minQuarantineDays = getMinimumQuarantineDays(params.reason);

  return {
    id: `quar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    pigeonId: params.pigeonId,
    ringNumber: params.ringNumber,
    admissionDate,
    reason: params.reason,
    minQuarantineDays,
    status: 'isolated_active',
    dailyLogs: [],
  };
}
