/**
 * Test Suite: Immunological Passport & Official Vaccination Certificate (Z-307)
 * PMV-1 compliance, seroconversion window (21 days), 365-day expiry, and PIW certificate export.
 */

import {
  evaluatePigeonImmunity,
  calculateVaccineExpiryDate,
  VaccineRecord,
} from '../src/domain/vaccination';
import {
  generateVaccinationCertificateHtml,
  VaccinationCertificatePdfOptions,
} from '../src/domain/pdfExport';
import { PdfService } from '../src/services/pdfService';

describe('Immunological Passport & Official Vaccination Certificate (Z-307)', () => {
  const baseTargetDate = new Date('2026-06-01T12:00:00Z');

  describe('evaluatePigeonImmunity', () => {
    it('blocks basketing for completely unvaccinated pigeon', () => {
      const evaluation = evaluatePigeonImmunity({
        pigeonId: 'p-01',
        ringNumber: 'PL-0284-24-1001',
        records: [],
        targetDate: baseTargetDate,
      });

      expect(evaluation.canBasketForRaces).toBe(false);
      expect(evaluation.pmvStatus).toBe('unvaccinated');
      expect(evaluation.basketingBlockReason).toContain('Brak zarejestrowanego szczepienia');
      expect(evaluation.recommendations.length).toBeGreaterThan(0);
    });

    it('blocks basketing during 21-day seroconversion window (kwarantanna poszczepienna)', () => {
      const records: VaccineRecord[] = [
        {
          id: 'v-1',
          pigeonId: 'p-02',
          ringNumber: 'PL-0284-24-1002',
          pathogen: 'pmv',
          productName: 'Pharmavac Columbi 2',
          batchNumber: 'SER-2026-X1',
          vaccinationDate: '2026-05-20', // 12 days ago relative to 2026-06-01
          expiryDate: '2027-05-20',
          vetName: 'dr Jan Kowal',
          vetLicenseNumber: 'PWZ-12345',
        },
      ];

      const evaluation = evaluatePigeonImmunity({
        pigeonId: 'p-02',
        ringNumber: 'PL-0284-24-1002',
        records,
        targetDate: baseTargetDate,
      });

      expect(evaluation.canBasketForRaces).toBe(false);
      expect(evaluation.pmvStatus).toBe('seroconverting');
      expect(evaluation.basketingBlockReason).toContain('Odporność poszczepienna rozwija się 21 dni');
    });

    it('allows basketing for fully immune pigeon vaccinated within 365 days', () => {
      const records: VaccineRecord[] = [
        {
          id: 'v-2',
          pigeonId: 'p-03',
          ringNumber: 'PL-0284-24-1003',
          pathogen: 'pmv',
          productName: 'Columbovac PMV',
          batchNumber: 'SER-2026-C1',
          vaccinationDate: '2026-04-01', // 61 days ago
          expiryDate: '2027-04-01',
          vetName: 'dr Jan Kowal',
          vetLicenseNumber: 'PWZ-12345',
        },
      ];

      const evaluation = evaluatePigeonImmunity({
        pigeonId: 'p-03',
        ringNumber: 'PL-0284-24-1003',
        records,
        targetDate: baseTargetDate,
      });

      expect(evaluation.canBasketForRaces).toBe(true);
      expect(evaluation.pmvStatus).toBe('immune');
      expect(evaluation.basketingBlockReason).toBeUndefined();
    });

    it('issues warning when vaccine expires in less than 30 days', () => {
      const records: VaccineRecord[] = [
        {
          id: 'v-3',
          pigeonId: 'p-04',
          ringNumber: 'PL-0284-24-1004',
          pathogen: 'pmv',
          productName: 'Nobilis Paramyxo',
          batchNumber: 'SER-2025-N9',
          vaccinationDate: '2025-06-15',
          expiryDate: '2026-06-15', // expires in 14 days relative to 2026-06-01
          vetName: 'dr Jan Kowal',
          vetLicenseNumber: 'PWZ-12345',
        },
      ];

      const evaluation = evaluatePigeonImmunity({
        pigeonId: 'p-04',
        ringNumber: 'PL-0284-24-1004',
        records,
        targetDate: baseTargetDate,
      });

      expect(evaluation.canBasketForRaces).toBe(true);
      expect(evaluation.pmvStatus).toBe('expiring_soon');
      expect(evaluation.recommendations.some((r) => r.includes('kończy się za'))).toBe(true);
    });

    it('blocks basketing when vaccination has expired (> 365 days)', () => {
      const records: VaccineRecord[] = [
        {
          id: 'v-4',
          pigeonId: 'p-05',
          ringNumber: 'PL-0284-24-1005',
          pathogen: 'pmv',
          productName: 'Columbovac PMV',
          batchNumber: 'SER-2024-C9',
          vaccinationDate: '2025-05-01',
          expiryDate: '2026-05-01', // expired 31 days ago
          vetName: 'dr Jan Kowal',
          vetLicenseNumber: 'PWZ-12345',
        },
      ];

      const evaluation = evaluatePigeonImmunity({
        pigeonId: 'p-05',
        ringNumber: 'PL-0284-24-1005',
        records,
        targetDate: baseTargetDate,
      });

      expect(evaluation.canBasketForRaces).toBe(false);
      expect(evaluation.pmvStatus).toBe('expired');
      expect(evaluation.basketingBlockReason).toContain('Ważność szczepienia PMV-1 wygasła');
    });
  });

  describe('calculateVaccineExpiryDate', () => {
    it('accurately calculates +1 year expiry date', () => {
      expect(calculateVaccineExpiryDate('2026-03-15')).toBe('2027-03-15');
      expect(calculateVaccineExpiryDate('2025-11-20')).toBe('2026-11-20');
    });
  });

  describe('generateVaccinationCertificateHtml (PIW / PZHGP)', () => {
    const certOptions: VaccinationCertificatePdfOptions = {
      certificateNumber: 'ZAŚ-WET/2026/048',
      issueDate: '2026-04-10',
      vetName: 'dr n. wet. Janusz Kaczmarek',
      vetLicenseNumber: 'PWZ-WET-18492',
      clinicName: 'Przychodnia Weterynaryjna Ptaków Pocztowych',
      clinicAddress: 'ul. Parkowa 12, 63-900 Rawicz',
      loftName: 'Gołębnik Mistrza',
      fancierName: 'Stanisław Kowalski',
      fancierAddress: 'ul. Leśna 4, 63-900 Rawicz',
      pzhgpBranch: 'Oddział 0284 Rawicz (Sekcja 1)',
      vaccineName: 'Pharmavac Columbi 2',
      batchNumber: 'SER-2026-X88',
      vaccinationDate: '2026-04-10',
      expiryDate: '2027-04-10',
      pigeons: [
        { ringNumber: 'PL-0284-24-9102', sex: 'cock', color: 'Niebieski', ageYears: 2 },
        { ringNumber: 'PL-0284-23-1402', sex: 'cock', color: 'Nakrapiany', ageYears: 3 },
      ],
    };

    it('generates HTML containing official legal headers and veterinarian details', () => {
      const html = generateVaccinationCertificateHtml(certOptions);
      expect(html).toContain('URZĘDOWE ZAŚWIADCZENIE SZCZEPIENIA GOŁĘBI');
      expect(html).toContain('ZAŚ-WET/2026/048');
      expect(html).toContain('PWZ-WET-18492');
      expect(html).toContain('dr n. wet. Janusz Kaczmarek');
      expect(html).toContain('Pharmavac Columbi 2');
      expect(html).toContain('SER-2026-X88');
      expect(html).toContain('PL-0284-24-9102');
      expect(html).toContain('PL-0284-23-1402');
      expect(html).toContain('OŚWIADCZENIE LEKARZA WETERYNARII');
    });

    it('exports vaccination certificate via PdfService', async () => {
      const printSpy = jest.spyOn(PdfService, 'printHtml').mockResolvedValue(undefined as any);
      const shareSpy = jest
        .spyOn(PdfService, 'shareHtmlAsPdf')
        .mockResolvedValue('file:///tmp/cert.pdf');

      await PdfService.exportVaccinationCertificate(certOptions, 'print');
      expect(printSpy).toHaveBeenCalled();

      const result = await PdfService.exportVaccinationCertificate(certOptions, 'share');
      expect(shareSpy).toHaveBeenCalled();
      expect(result).toBe('file:///tmp/cert.pdf');

      printSpy.mockRestore();
      shareSpy.mockRestore();
    });
  });
});
