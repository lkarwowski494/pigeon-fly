/**
 * Test Suite: Quarantine & Isolation Ward Domain Engine (Z-308, RD-27)
 * Zoohygienic management of isolated pigeons: clinical checkups,
 * crop/droppings streak, and release criteria.
 */

import {
  evaluateQuarantineRelease,
  createQuarantinePatient,
  getMinimumQuarantineDays,
  QuarantinePatient,
} from '../src/domain/quarantine';

describe('Quarantine & Isolation Ward Domain Engine (Z-308)', () => {
  const baseAdmissionDate = '2026-06-01';
  const currentDate = new Date('2026-06-16T12:00:00Z'); // 15 days later

  describe('getMinimumQuarantineDays', () => {
    it('mandates 14 days for YPDS Adeno-Coli recovery', () => {
      expect(getMinimumQuarantineDays('ypds_adeno_coli')).toBe(14);
    });

    it('mandates 21 days for newly purchased stock birds', () => {
      expect(getMinimumQuarantineDays('new_purchase')).toBe(21);
    });

    it('mandates 5 days for race exhaustion recovery', () => {
      expect(getMinimumQuarantineDays('race_exhaustion')).toBe(5);
    });
  });

  describe('evaluateQuarantineRelease', () => {
    it('blocks release if minimum quarantine duration has not elapsed', () => {
      const patient: QuarantinePatient = {
        id: 'q-1',
        pigeonId: 'p-01',
        ringNumber: 'PL-0284-24-9102',
        admissionDate: '2026-06-10', // only 6 days ago relative to 2026-06-16
        reason: 'ypds_adeno_coli',
        minQuarantineDays: 14,
        status: 'isolated_active',
        dailyLogs: [
          {
            date: '2026-06-14',
            cropCondition: 'normal_empty',
            droppingsConsistency: 'normal_firm',
            appetite: 'normal',
            waterIntake: 'normal',
            bodyTemperature: 'normal',
            treatmentsAdministered: [],
          },
          {
            date: '2026-06-15',
            cropCondition: 'normal_empty',
            droppingsConsistency: 'normal_firm',
            appetite: 'normal',
            waterIntake: 'normal',
            bodyTemperature: 'normal',
            treatmentsAdministered: [],
          },
          {
            date: '2026-06-16',
            cropCondition: 'normal_empty',
            droppingsConsistency: 'normal_firm',
            appetite: 'normal',
            waterIntake: 'normal',
            bodyTemperature: 'normal',
            treatmentsAdministered: [],
          },
        ],
      };

      const result = evaluateQuarantineRelease(patient, currentDate);
      expect(result.canRelease).toBe(false);
      expect(result.reasonsBlocking.some((r) => r.includes('minimalny czas kwarantanny'))).toBe(true);
      expect(result.consecutiveHealthyDays).toBe(3);
    });

    it('blocks release if bird does not have 3 consecutive healthy days', () => {
      const patient: QuarantinePatient = {
        id: 'q-2',
        pigeonId: 'p-02',
        ringNumber: 'PL-0284-24-9103',
        admissionDate: baseAdmissionDate, // 15 days ago (duration fulfilled)
        reason: 'ypds_adeno_coli',
        minQuarantineDays: 14,
        status: 'isolated_active',
        dailyLogs: [
          {
            date: '2026-06-14',
            cropCondition: 'fermenting_stasis', // sick
            droppingsConsistency: 'green_mucoid',
            appetite: 'reduced',
            waterIntake: 'polydipsia_excessive',
            bodyTemperature: 'feverish',
            treatmentsAdministered: ['Elektrolity'],
          },
          {
            date: '2026-06-15',
            cropCondition: 'normal_empty',
            droppingsConsistency: 'normal_firm',
            appetite: 'normal',
            waterIntake: 'normal',
            bodyTemperature: 'normal',
            treatmentsAdministered: [],
          },
          {
            date: '2026-06-16',
            cropCondition: 'normal_empty',
            droppingsConsistency: 'normal_firm',
            appetite: 'normal',
            waterIntake: 'normal',
            bodyTemperature: 'normal',
            treatmentsAdministered: [],
          },
        ],
      };

      const result = evaluateQuarantineRelease(patient, currentDate);
      expect(result.canRelease).toBe(false);
      expect(result.consecutiveHealthyDays).toBe(2); // Only 2 healthy days, need 3
      expect(result.reasonsBlocking.some((r) => r.includes('minimum 3 kolejne dni'))).toBe(true);
    });

    it('approves release when both minimum days and 3 consecutive healthy checkups are fulfilled', () => {
      const patient: QuarantinePatient = {
        id: 'q-3',
        pigeonId: 'p-03',
        ringNumber: 'PL-0284-24-9104',
        admissionDate: baseAdmissionDate, // 15 days ago
        reason: 'ypds_adeno_coli',
        minQuarantineDays: 14,
        status: 'isolated_active',
        dailyLogs: [
          {
            date: '2026-06-14',
            cropCondition: 'normal_empty',
            droppingsConsistency: 'normal_firm',
            appetite: 'normal',
            waterIntake: 'normal',
            bodyTemperature: 'normal',
            treatmentsAdministered: ['Maślan sodu'],
          },
          {
            date: '2026-06-15',
            cropCondition: 'normal_empty',
            droppingsConsistency: 'normal_firm',
            appetite: 'normal',
            waterIntake: 'normal',
            bodyTemperature: 'normal',
            treatmentsAdministered: ['Probiotyk'],
          },
          {
            date: '2026-06-16',
            cropCondition: 'normal_empty',
            droppingsConsistency: 'normal_firm',
            appetite: 'normal',
            waterIntake: 'normal',
            bodyTemperature: 'normal',
            treatmentsAdministered: [],
          },
        ],
      };

      const result = evaluateQuarantineRelease(patient, currentDate);
      expect(result.canRelease).toBe(true);
      expect(result.reasonsBlocking).toHaveLength(0);
      expect(result.recommendations.some((r) => r.toLowerCase().includes('zdezynfekowany'))).toBe(true);
    });

    it('correctly creates a new quarantine patient record with expected days', () => {
      const p = createQuarantinePatient({
        pigeonId: 'p-99',
        ringNumber: 'PL-0284-25-1111',
        reason: 'new_purchase',
      });

      expect(p.ringNumber).toBe('PL-0284-25-1111');
      expect(p.minQuarantineDays).toBe(21);
      expect(p.status).toBe('isolated_active');
      expect(p.dailyLogs).toEqual([]);
    });
  });
});
