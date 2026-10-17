/**
 * PIGEON-FLY — Immunological Passport & Official Vaccination Certificate (Z-307, BR-ZDR-009)
 * Official PZHGP and PIW (Powiatowy Lekarz Weterynarii) compliance for racing pigeons.
 * Paramyxovirus (PMV-1), Pigeon Pox (Ospa), Salmonella (SalmoPT), 21-day seroconversion,
 * 365-day validity window, and pre-basketing vaccination clearance.
 */

export type VaccinePathogen = 'pmv' | 'pox' | 'salmonella' | 'herpes' | 'rotavirus';

export interface VaccineRecord {
  id: string;
  pigeonId: string;
  ringNumber: string;
  pathogen: VaccinePathogen;
  productName: string; // np. "Pharmavac Columbi 2", "Columbovac PMV", "Nobilis Paramyxo"
  batchNumber: string; // Seria szczepionki
  vaccinationDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD (typically +365 days)
  vetName: string;
  vetLicenseNumber: string; // Numer PWZ lekarza weterynarii
  clinicName?: string;
  notes?: string;
}

export type ImmunityStatus =
  | 'immune' // Pełna odporność poszczepienna
  | 'seroconverting' // W oknie wytwarzania odporności (< 21 dni od szczepienia)
  | 'expiring_soon' // Wygasa w ciągu 30 dni
  | 'expired' // Minęło > 365 dni
  | 'unvaccinated'; // Brak wpisu o szczepieniu

export interface PigeonImmunityEvaluation {
  pigeonId: string;
  ringNumber: string;
  pmvStatus: ImmunityStatus;
  poxStatus: ImmunityStatus;
  salmonellaStatus: ImmunityStatus;
  canBasketForRaces: boolean;
  daysSincePmvVaccine?: number;
  daysUntilPmvExpiry?: number;
  basketingBlockReason?: string;
  recommendations: string[];
}

export interface OfficialVetCertificateInfo {
  certificateNumber: string; // np. "ZAŚ-WET/2026/048"
  issueDate: string; // YYYY-MM-DD
  vetName: string;
  vetLicenseNumber: string;
  clinicName: string;
  clinicAddress: string;
  loftId: string;
  loftName: string;
  fancierName: string;
  fancierAddress: string;
  pzhgpBranch: string; // np. "Oddział 0284 Rawicz"
  vaccineName: string;
  batchNumber: string;
  vaccinationDate: string;
  expiryDate: string;
  vaccinatedPigeons: {
    ringNumber: string;
    sex?: 'cock' | 'hen';
    color?: string;
    ageYears?: number;
  }[];
}

/**
 * Evaluates immunological status of a pigeon regarding mandatory PMV-1 and optional vaccines.
 * Standard PZHGP rule:
 * 1. PMV-1 is MANDATORY for all basketed birds.
 * 2. Minimum 21 days must elapse after vaccination for seroconversion before basketing.
 * 3. Maximum 365 days validity from vaccination date.
 */
export function evaluatePigeonImmunity(params: {
  pigeonId: string;
  ringNumber: string;
  records: VaccineRecord[];
  targetDate?: Date;
}): PigeonImmunityEvaluation {
  const { pigeonId, ringNumber, records } = params;
  const targetTime = (params.targetDate ? new Date(params.targetDate) : new Date()).setHours(0, 0, 0, 0);

  const pigeonRecords = records.filter(
    (r) => r.pigeonId === pigeonId || r.ringNumber === ringNumber
  );

  const getLatestRecord = (pathogen: VaccinePathogen): VaccineRecord | undefined => {
    return pigeonRecords
      .filter((r) => r.pathogen === pathogen)
      .sort(
        (a, b) =>
          new Date(b.vaccinationDate).getTime() - new Date(a.vaccinationDate).getTime()
      )[0];
  };

  const evaluatePathogen = (
    rec?: VaccineRecord
  ): { status: ImmunityStatus; daysSince?: number; daysUntilExpiry?: number } => {
    if (!rec) {
      return { status: 'unvaccinated' };
    }

    const vTime = new Date(rec.vaccinationDate).setHours(0, 0, 0, 0);
    const expTime = new Date(rec.expiryDate).setHours(0, 0, 0, 0);
    const daysSince = Math.floor((targetTime - vTime) / (1000 * 60 * 60 * 24));
    const daysUntilExpiry = Math.floor((expTime - targetTime) / (1000 * 60 * 60 * 24));

    if (daysSince < 0) {
      return { status: 'unvaccinated' };
    }

    if (daysSince < 21) {
      return { status: 'seroconverting', daysSince, daysUntilExpiry };
    }

    if (daysUntilExpiry < 0) {
      return { status: 'expired', daysSince, daysUntilExpiry };
    }

    if (daysUntilExpiry <= 30) {
      return { status: 'expiring_soon', daysSince, daysUntilExpiry };
    }

    return { status: 'immune', daysSince, daysUntilExpiry };
  };

  const pmvEval = evaluatePathogen(getLatestRecord('pmv'));
  const poxEval = evaluatePathogen(getLatestRecord('pox'));
  const salmoEval = evaluatePathogen(getLatestRecord('salmonella'));

  let canBasketForRaces = true;
  let basketingBlockReason: string | undefined;
  const recommendations: string[] = [];

  // PMV-1 rules for basketing
  if (pmvEval.status === 'unvaccinated') {
    canBasketForRaces = false;
    basketingBlockReason =
      'Brak zarejestrowanego szczepienia przeciw paramyksowirozie (PMV-1). Zakaz koszowania wg regulaminu PZHGP.';
    recommendations.push('Wykonaj pilne szczepienie stada przeciw PMV-1 u uprawnionego lekarza weterynarii.');
  } else if (pmvEval.status === 'seroconverting') {
    canBasketForRaces = false;
    basketingBlockReason = `Szczepienie PMV-1 wykonano ${pmvEval.daysSince} dni temu. Odporność poszczepienna rozwija się 21 dni — ptak w okresie kwarantanny.`;
    recommendations.push(
      `Odczekaj jeszcze ${21 - (pmvEval.daysSince ?? 0)} dni przed pierwszym koszowaniem.`
    );
  } else if (pmvEval.status === 'expired') {
    canBasketForRaces = false;
    basketingBlockReason = `Ważność szczepienia PMV-1 wygasła (${Math.abs(pmvEval.daysUntilExpiry ?? 0)} dni temu). Wymagane coroczne doszczepienie.`;
    recommendations.push('Zaszczep ptaka przypominającą dawką PMV-1.');
  } else if (pmvEval.status === 'expiring_soon') {
    recommendations.push(
      `⚠️ Ważność szczepienia PMV-1 kończy się za ${pmvEval.daysUntilExpiry} dni. Zaplanuj doszczepienie stada.`
    );
  }

  // Ospa recommendations
  if (poxEval.status === 'unvaccinated' || poxEval.status === 'expired') {
    recommendations.push(
      'Zalecane szczepienie przeciwko ospie gołębi (Pigeon Pox) przed sezonem lotów młodych.'
    );
  }

  return {
    pigeonId,
    ringNumber,
    pmvStatus: pmvEval.status,
    poxStatus: poxEval.status,
    salmonellaStatus: salmoEval.status,
    canBasketForRaces,
    daysSincePmvVaccine: pmvEval.daysSince,
    daysUntilPmvExpiry: pmvEval.daysUntilExpiry,
    basketingBlockReason,
    recommendations,
  };
}

/**
 * Creates default 1-year expiry date from vaccination date string.
 */
export function calculateVaccineExpiryDate(vaccinationDate: string): string {
  const d = new Date(vaccinationDate);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}
