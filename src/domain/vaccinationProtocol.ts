/**
 * PIGEON-FLY — Urzędowy Protokół Szczepień Ochronnych i Paszport Odporności PZHGP/PIW (Z-069)
 * Standard PZHGP, FCI i Głównego Lekarza Weterynarii (GLW / PIW).
 * Weryfikacja 21-dniowej kwarantanny poszczepiennej (serokonwersja humoralna),
 * 365-dniowego okna ważności immunitetu oraz dopuszczenia do koszowania na loty.
 */

import { VaccinationCertificatePdfOptions } from './pdfExport';

export type VaccineType =
  | 'PMV1_PARAMYXO'
  | 'SALMONELLA_PARATYPHUS'
  | 'POX_DIPHTHERIA'
  | 'COMBINED_PMV_HERPES';

export interface VaccineInfo {
  type: VaccineType;
  tradeName: string;
  manufacturer: string;
  recommendedDoseMl: number;
  routeOfAdministration: string; // np. "podskórnie w dolną część szyi"
  mandatoryForPzhgpRaces: boolean;
  immunityOnsetDays: number; // 21 dni
  immunityDurationDays: number; // 365 dni
  description: string;
}

export const VACCINE_REGISTRY: Record<VaccineType, VaccineInfo> = {
  PMV1_PARAMYXO: {
    type: 'PMV1_PARAMYXO',
    tradeName: 'Pharmavac Columbi 2 / Columbovac PMV',
    manufacturer: 'Pharmagal / Zoetis',
    recommendedDoseMl: 0.25,
    routeOfAdministration: 'Podskórnie (s.c.) w 1/3 dolną część szyi',
    mandatoryForPzhgpRaces: true,
    immunityOnsetDays: 21,
    immunityDurationDays: 365,
    description: 'Obowiązkowe urzędowe szczepienie przeciw paramyksowirozie (PMV-1) przed sezonem lotowym.',
  },
  SALMONELLA_PARATYPHUS: {
    type: 'SALMONELLA_PARATYPHUS',
    tradeName: 'Zoosal T / SalmoPT',
    manufacturer: 'IDT Biologika / Chevita',
    recommendedDoseMl: 0.5,
    routeOfAdministration: 'Podskórnie (s.c.) w fałd szyjny',
    mandatoryForPzhgpRaces: false,
    immunityOnsetDays: 21,
    immunityDurationDays: 365,
    description: 'Profilaktyka paratyfusu (salmonellozy) u gołębi dorosłych i młodych przed parowaniem.',
  },
  POX_DIPHTHERIA: {
    type: 'POX_DIPHTHERIA',
    tradeName: 'Diphtho-Pharma / Ovoperisterin',
    manufacturer: 'Pharma-Zell / Bioveta',
    recommendedDoseMl: 0.2,
    routeOfAdministration: 'Metoda mieszkowa (wcieranie w oskubane mieszki piór na udzie)',
    mandatoryForPzhgpRaces: false,
    immunityOnsetDays: 21,
    immunityDurationDays: 365,
    description: 'Ochrona przed ospą i dyfterytem gołębi, zalecana szczególnie dla stada gołębi młodych.',
  },
  COMBINED_PMV_HERPES: {
    type: 'COMBINED_PMV_HERPES',
    tradeName: 'Pharmavac PHA / Chemo-Columb',
    manufacturer: 'Pharmagal-Bio',
    recommendedDoseMl: 0.3,
    routeOfAdministration: 'Podskórnie (s.c.) w kark',
    mandatoryForPzhgpRaces: true,
    immunityOnsetDays: 21,
    immunityDurationDays: 365,
    description: 'Skojarzona szczepionka przeciwko paramyksowirozie i herpeswirozie układu oddechowego.',
  },
};

export type ImmunityClearance =
  | 'ELIGIBLE_FOR_RACE' // Pełna odporność, po 21 dniach, ważna (<365 dni)
  | 'IN_SEROCONVERSION' // W trakcie kwarantanny poszczepiennej (<21 dni) - ZAKAZ KOSZOWANIA
  | 'EXPIRING_SOON' // Ważna, ale wygasa w ciągu 30 dni
  | 'EXPIRED' // Minęło >365 dni od szczepienia - ZAKAZ KOSZOWANIA
  | 'UNVACCINATED'; // Brak szczepienia - ZAKAZ KOSZOWANIA

export interface FlockPigeonVaccineStatus {
  ringNumber: string;
  sex?: 'cock' | 'hen';
  color?: string;
  year?: number;
  pmvClearance: ImmunityClearance;
  daysSinceInjection?: number;
  daysUntilExpiry?: number;
  basketingAllowed: boolean;
  rejectionReason?: string;
}

export interface FlockVaccinationSummary {
  totalBirds: number;
  eligibleCount: number;
  seroconvertingCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  unvaccinatedCount: number;
  flockImmunityPercentage: number;
  canSafelyBasketFlock: boolean;
  warnings: string[];
}

export interface VaccinationProtocolDraft {
  protocolNumber: string;
  issueDate: string; // YYYY-MM-DD
  vaccinationDate: string; // YYYY-MM-DD
  vaccineType: VaccineType;
  commercialName: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  veterinarianName: string;
  veterinarianPwzw: string;
  clinicName: string;
  clinicAddress: string;
  breederName: string;
  breederAddress: string;
  pzhgpBranch: string;
  pzhgpSection: string;
  loftCoordinates?: string;
  pigeons: {
    ringNumber: string;
    sex?: 'cock' | 'hen';
    color?: string;
    ageYears?: number;
  }[];
}

/**
 * Oblicza status odporności pojedynczego gołębia względem daty zawodów / sprawdzenia
 */
export function evaluatePigeonVaccineClearance(
  vaccinationDate: string | undefined,
  targetDate: string = new Date().toISOString().slice(0, 10)
): {
  clearance: ImmunityClearance;
  daysSinceInjection?: number;
  daysUntilExpiry?: number;
  basketingAllowed: boolean;
  rejectionReason?: string;
} {
  if (!vaccinationDate) {
    return {
      clearance: 'UNVACCINATED',
      basketingAllowed: false,
      rejectionReason: 'Brak zarejestrowanego urzędowego szczepienia PMV-1 w kartotece.',
    };
  }

  const vDate = new Date(vaccinationDate);
  const tDate = new Date(targetDate);
  const diffMs = tDate.getTime() - vDate.getTime();
  const daysSinceInjection = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysSinceInjection < 0) {
    return {
      clearance: 'UNVACCINATED',
      daysSinceInjection,
      basketingAllowed: false,
      rejectionReason: 'Data szczepienia jest późniejsza niż data lotu.',
    };
  }

  // Okno serokonwersji (21 dni)
  if (daysSinceInjection < 21) {
    const daysLeft = 21 - daysSinceInjection;
    return {
      clearance: 'IN_SEROCONVERSION',
      daysSinceInjection,
      daysUntilExpiry: 365 - daysSinceInjection,
      basketingAllowed: false,
      rejectionReason: `Kwarantanna poszczepienna: minęło ${daysSinceInjection} z 21 wymaganych dni. Zakaz koszowania jeszcze przez ${daysLeft} dni.`,
    };
  }

  // Ważność 365 dni
  const daysUntilExpiry = 365 - daysSinceInjection;
  if (daysUntilExpiry < 0) {
    return {
      clearance: 'EXPIRED',
      daysSinceInjection,
      daysUntilExpiry,
      basketingAllowed: false,
      rejectionReason: `Szczepienie wygasło ${Math.abs(daysUntilExpiry)} dni temu. Wymagane coroczne doszczepienie stada.`,
    };
  }

  if (daysUntilExpiry <= 30) {
    return {
      clearance: 'EXPIRING_SOON',
      daysSinceInjection,
      daysUntilExpiry,
      basketingAllowed: true,
      rejectionReason: undefined,
    };
  }

  return {
    clearance: 'ELIGIBLE_FOR_RACE',
    daysSinceInjection,
    daysUntilExpiry,
    basketingAllowed: true,
    rejectionReason: undefined,
  };
}

/**
 * Agreguje status immunologiczny całego stada
 */
export function calculateFlockImmunitySummary(
  birds: { ringNumber: string; vaccinationDate?: string }[],
  targetDate: string = new Date().toISOString().slice(0, 10)
): FlockVaccinationSummary {
  let eligibleCount = 0;
  let seroconvertingCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  let unvaccinatedCount = 0;
  const warnings: string[] = [];

  for (const bird of birds) {
    const evalRes = evaluatePigeonVaccineClearance(bird.vaccinationDate, targetDate);
    switch (evalRes.clearance) {
      case 'ELIGIBLE_FOR_RACE':
        eligibleCount++;
        break;
      case 'EXPIRING_SOON':
        expiringSoonCount++;
        eligibleCount++; // Nadal dopuszczony, ale wkrótce wygasa
        break;
      case 'IN_SEROCONVERSION':
        seroconvertingCount++;
        break;
      case 'EXPIRED':
        expiredCount++;
        break;
      case 'UNVACCINATED':
        unvaccinatedCount++;
        break;
    }
  }

  const totalBirds = birds.length;
  const flockImmunityPercentage = totalBirds > 0
    ? Number(((eligibleCount / totalBirds) * 100).toFixed(1))
    : 0;

  if (seroconvertingCount > 0) {
    warnings.push(`Uwaga: ${seroconvertingCount} ptaków jest w trakcie 21-dniowej kwarantanny poszczepiennej.`);
  }
  if (expiredCount > 0) {
    warnings.push(`Pilne: ${expiredCount} ptaków ma przeterminowane szczepienie (> 365 dni).`);
  }
  if (unvaccinatedCount > 0) {
    warnings.push(`Błąd dopuszczenia: ${unvaccinatedCount} ptaków nie posiada szczepienia PMV-1.`);
  }

  const canSafelyBasketFlock = totalBirds > 0 && eligibleCount === totalBirds;

  return {
    totalBirds,
    eligibleCount,
    seroconvertingCount,
    expiringSoonCount,
    expiredCount,
    unvaccinatedCount,
    flockImmunityPercentage,
    canSafelyBasketFlock,
    warnings,
  };
}

/**
 * Konwertuje roboczy szkic protokołu na opcje dla generatora HTML/PDF
 */
export function draftToPdfOptions(draft: VaccinationProtocolDraft): VaccinationCertificatePdfOptions {
  return {
    certificateNumber: draft.protocolNumber,
    issueDate: draft.issueDate,
    vetName: draft.veterinarianName,
    vetLicenseNumber: draft.veterinarianPwzw,
    clinicName: draft.clinicName,
    clinicAddress: draft.clinicAddress,
    loftName: `Gołębnik ${draft.breederName}`,
    fancierName: draft.breederName,
    fancierAddress: draft.breederAddress,
    pzhgpBranch: `${draft.pzhgpBranch} (${draft.pzhgpSection})`,
    vaccineName: draft.commercialName,
    batchNumber: draft.batchNumber,
    vaccinationDate: draft.vaccinationDate,
    expiryDate: draft.expiryDate,
    pigeons: draft.pigeons.map((p) => ({
      ringNumber: p.ringNumber,
      sex: p.sex,
      color: p.color,
      ageYears: p.ageYears,
    })),
  };
}
