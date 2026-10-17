import {
  evaluatePigeonVaccineClearance,
  calculateFlockImmunitySummary,
  VACCINE_REGISTRY,
  draftToPdfOptions,
  VaccinationProtocolDraft,
} from '../src/domain/vaccinationProtocol';

describe('Vaccination Protocol & Immunity Passport Engine (Z-069)', () => {
  const baseTargetDate = '2026-06-01';

  describe('evaluatePigeonVaccineClearance', () => {
    it('rejects unvaccinated pigeon with clear rule justification', () => {
      const res = evaluatePigeonVaccineClearance(undefined, baseTargetDate);
      expect(res.clearance).toBe('UNVACCINATED');
      expect(res.basketingAllowed).toBe(false);
      expect(res.rejectionReason).toContain('Brak zarejestrowanego urzędowego szczepienia');
    });

    it('enforces 21-day humoral seroconversion window (kwarantanna poszczepienna)', () => {
      // Injected 10 days before target date
      const res = evaluatePigeonVaccineClearance('2026-05-22', baseTargetDate);
      expect(res.clearance).toBe('IN_SEROCONVERSION');
      expect(res.basketingAllowed).toBe(false);
      expect(res.daysSinceInjection).toBe(10);
      expect(res.rejectionReason).toContain('Kwarantanna poszczepienna: minęło 10 z 21 wymaganych dni');
    });

    it('grants race eligibility exactly after 21 days', () => {
      // Injected 21 days before target date
      const res = evaluatePigeonVaccineClearance('2026-05-11', baseTargetDate);
      expect(res.clearance).toBe('ELIGIBLE_FOR_RACE');
      expect(res.basketingAllowed).toBe(true);
      expect(res.daysSinceInjection).toBe(21);
      expect(res.rejectionReason).toBeUndefined();
    });

    it('warns when immunity expires within 30 days', () => {
      // Injected 345 days ago -> 20 days until 365-day expiry
      const d = new Date(baseTargetDate);
      d.setDate(d.getDate() - 345);
      const res = evaluatePigeonVaccineClearance(d.toISOString().slice(0, 10), baseTargetDate);
      expect(res.clearance).toBe('EXPIRING_SOON');
      expect(res.basketingAllowed).toBe(true);
      expect(res.daysUntilExpiry).toBeLessThanOrEqual(30);
    });

    it('strictly forbids basketing if vaccination expired (> 365 days)', () => {
      // Injected 370 days ago
      const d = new Date(baseTargetDate);
      d.setDate(d.getDate() - 370);
      const res = evaluatePigeonVaccineClearance(d.toISOString().slice(0, 10), baseTargetDate);
      expect(res.clearance).toBe('EXPIRED');
      expect(res.basketingAllowed).toBe(false);
      expect(res.rejectionReason).toContain('Szczepienie wygasło');
    });

    it('rejects future vaccination date', () => {
      const res = evaluatePigeonVaccineClearance('2026-06-15', baseTargetDate);
      expect(res.clearance).toBe('UNVACCINATED');
      expect(res.basketingAllowed).toBe(false);
      expect(res.rejectionReason).toContain('Data szczepienia jest późniejsza niż data lotu');
    });
  });

  describe('calculateFlockImmunitySummary', () => {
    it('aggregates flock statistics and generates relevant warnings', () => {
      const birds = [
        { ringNumber: 'PL-0284-23-101', vaccinationDate: '2026-03-01' }, // eligible (approx 92 days)
        { ringNumber: 'PL-0284-23-102', vaccinationDate: '2026-03-01' }, // eligible
        { ringNumber: 'PL-0284-24-201', vaccinationDate: '2026-05-25' }, // seroconverting (7 days)
        { ringNumber: 'PL-0284-21-301', vaccinationDate: '2025-04-01' }, // expired (426 days)
        { ringNumber: 'PL-0284-24-999', vaccinationDate: undefined }, // unvaccinated
      ];

      const summary = calculateFlockImmunitySummary(birds, baseTargetDate);

      expect(summary.totalBirds).toBe(5);
      expect(summary.eligibleCount).toBe(2);
      expect(summary.seroconvertingCount).toBe(1);
      expect(summary.expiredCount).toBe(1);
      expect(summary.unvaccinatedCount).toBe(1);
      expect(summary.flockImmunityPercentage).toBe(40.0); // 2/5 = 40%
      expect(summary.canSafelyBasketFlock).toBe(false);
      expect(summary.warnings.length).toBe(3);
    });

    it('confirms 100% flock readiness when all birds are fully immunized', () => {
      const birds = [
        { ringNumber: 'PL-0284-23-101', vaccinationDate: '2026-04-01' },
        { ringNumber: 'PL-0284-23-102', vaccinationDate: '2026-04-01' },
      ];

      const summary = calculateFlockImmunitySummary(birds, baseTargetDate);

      expect(summary.flockImmunityPercentage).toBe(100);
      expect(summary.canSafelyBasketFlock).toBe(true);
      expect(summary.warnings.length).toBe(0);
    });
  });

  describe('VACCINE_REGISTRY and Protocol Draft conversion', () => {
    it('contains standard PZHGP veterinary preparations', () => {
      expect(VACCINE_REGISTRY.PMV1_PARAMYXO.mandatoryForPzhgpRaces).toBe(true);
      expect(VACCINE_REGISTRY.PMV1_PARAMYXO.immunityOnsetDays).toBe(21);
      expect(VACCINE_REGISTRY.PMV1_PARAMYXO.immunityDurationDays).toBe(365);
      expect(VACCINE_REGISTRY.SALMONELLA_PARATYPHUS.mandatoryForPzhgpRaces).toBe(false);
    });

    it('correctly maps VaccinationProtocolDraft to PDF options', () => {
      const draft: VaccinationProtocolDraft = {
        protocolNumber: 'ZAŚ-WET/2026/089',
        issueDate: '2026-04-15',
        vaccinationDate: '2026-04-15',
        vaccineType: 'PMV1_PARAMYXO',
        commercialName: 'Pharmavac Columbi 2',
        batchNumber: 'SER-2026-X99',
        expiryDate: '2027-04-15',
        veterinarianName: 'dr Janusz Nowak',
        veterinarianPwzw: 'PWZ-77123',
        clinicName: 'Lecznica Weterynaryjna Ptaków Pocztowych',
        clinicAddress: 'ul. Parkowa 1, 63-900 Rawicz',
        breederName: 'Stanisław Kowalski',
        breederAddress: 'ul. Leśna 4, 63-900 Rawicz',
        pzhgpBranch: 'Oddział 0284 Gostyń',
        pzhgpSection: 'Sekcja 02',
        pigeons: [
          { ringNumber: 'PL-0284-24-1001', sex: 'cock', color: 'Niebieski', ageYears: 2 },
          { ringNumber: 'PL-0284-24-1002', sex: 'hen', color: 'Ciemna', ageYears: 2 },
        ],
      };

      const pdfOpts = draftToPdfOptions(draft);
      expect(pdfOpts.certificateNumber).toBe('ZAŚ-WET/2026/089');
      expect(pdfOpts.vetName).toBe('dr Janusz Nowak');
      expect(pdfOpts.vetLicenseNumber).toBe('PWZ-77123');
      expect(pdfOpts.pigeons.length).toBe(2);
      expect(pdfOpts.pigeons[0].ringNumber).toBe('PL-0284-24-1001');
    });
  });
});
