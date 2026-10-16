/**
 * PIGEON-FLY — Health, Medication, and Withdrawal Period Guard
 * Prevents basketing birds during active pharmaceutical withdrawal (karencja).
 */

import { HealthLog } from './types';

export interface WithdrawalStatus {
  isUnderWithdrawal: boolean;
  daysRemaining: number;
  clearedDate: string; // YYYY-MM-DD
  activeMedications: {
    productName: string;
    treatedDate: string;
    withdrawalDays: number;
    daysRemaining: number;
  }[];
}

/**
 * Checks whether a pigeon is currently under medication withdrawal period.
 */
export function checkWithdrawalPeriod(
  pigeonId: string,
  healthLogs: HealthLog[],
  targetDate: Date = new Date()
): WithdrawalStatus {
  const targetTime = new Date(targetDate).setHours(0, 0, 0, 0);

  const activeMedications: WithdrawalStatus['activeMedications'] = [];
  let maxClearedTime = targetTime;

  for (const log of healthLogs) {
    // Check if log applies to this pigeon or entire flock (pigeonId is null/undefined)
    if (log.pigeonId && log.pigeonId !== pigeonId) {
      continue;
    }

    if (log.withdrawalDays > 0) {
      const treatedDate = new Date(log.date);
      treatedDate.setHours(0, 0, 0, 0);

      const clearedDate = new Date(treatedDate);
      clearedDate.setDate(clearedDate.getDate() + log.withdrawalDays);

      if (clearedDate.getTime() > targetTime) {
        const daysRemaining = Math.ceil((clearedDate.getTime() - targetTime) / (1000 * 60 * 60 * 24));
        activeMedications.push({
          productName: log.productName,
          treatedDate: log.date,
          withdrawalDays: log.withdrawalDays,
          daysRemaining,
        });

        if (clearedDate.getTime() > maxClearedTime) {
          maxClearedTime = clearedDate.getTime();
        }
      }
    }
  }

  const isUnderWithdrawal = activeMedications.length > 0;
  const daysRemaining = isUnderWithdrawal
    ? Math.max(...activeMedications.map((m) => m.daysRemaining))
    : 0;

  const clearedDateObj = new Date(maxClearedTime);
  const clearedDate = clearedDateObj.toISOString().split('T')[0];

  return {
    isUnderWithdrawal,
    daysRemaining,
    clearedDate,
    activeMedications,
  };
}

/**
 * Validates PMV-1 (paramyxovirus) vaccination compliance.
 * Official regulations require vaccination at least 21 days before basketing and within the last 365 days.
 */
export function validateParamyxoVaccination(
  pigeonId: string,
  healthLogs: HealthLog[],
  basketDate: Date = new Date()
): { isValid: boolean; reason?: string; lastVaccinatedDate?: string } {
  const basketTime = new Date(basketDate).setHours(0, 0, 0, 0);

  const vaccineLogs = healthLogs
    .filter(
      (log) =>
        (!log.pigeonId || log.pigeonId === pigeonId) &&
        (log.eventType === 'vaccine' || log.productName.toLowerCase().includes('paramyxo') || log.productName.toLowerCase().includes('pmv'))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (vaccineLogs.length === 0) {
    return {
      isValid: false,
      reason: 'Brak zarejestrowanego szczepienia przeciw paramyksowirozie (PMV-1). Ptak nie może być koszowany na loty.',
    };
  }

  const lastVaccine = vaccineLogs[0];
  const lastVaccineTime = new Date(lastVaccine.date).setHours(0, 0, 0, 0);
  const daysSinceVaccine = Math.floor((basketTime - lastVaccineTime) / (1000 * 60 * 60 * 24));

  if (daysSinceVaccine < 21) {
    return {
      isValid: false,
      lastVaccinatedDate: lastVaccine.date,
      reason: `Szczepienie wykonano zaledwie ${daysSinceVaccine} dni temu. Odporność poszczepienna rozwija się po min. 21 dniach.`,
    };
  }

  if (daysSinceVaccine > 365) {
    return {
      isValid: false,
      lastVaccinatedDate: lastVaccine.date,
      reason: `Ważność szczepienia wygasła (${daysSinceVaccine} dni temu). Wymagane coroczne doszczepienie stada.`,
    };
  }

  return {
    isValid: true,
    lastVaccinatedDate: lastVaccine.date,
  };
}
