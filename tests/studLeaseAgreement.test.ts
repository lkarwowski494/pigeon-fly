/**
 * Unit tests for Stud Pigeon Lease Agreement Domain (Z-081 / DEC-95)
 */

import {
  validateStudLeaseAgreement,
  generateStudLeaseAgreementHtml,
  StudLeaseAgreementRecord,
} from '../src/domain/studLeaseAgreement';

describe('StudLeaseAgreement Domain (Z-081)', () => {
  const sampleAgreement: StudLeaseAgreementRecord = {
    id: 'agr-01',
    contractNumber: 'DZIERZ-2026/001',
    agreementDate: '2026-02-10',
    startDate: '2026-03-01',
    endDate: '2026-07-31',
    lessor: {
      fullName: 'Łukasz Karwowski',
      pzhgpMemberNumber: '0284-1420',
      branchSection: 'Oddział 0284 Gostyń, Sekcja 1',
      address: 'ul. Polna 12, 63-800 Gostyń',
      phone: '+48 600 111 222',
      email: 'lukasz@pigeonfly.pl',
    },
    lessee: {
      fullName: 'Jan Kowalski',
      pzhgpMemberNumber: '0284-3312',
      branchSection: 'Oddział 0284 Gostyń, Sekcja 2 Piaski',
      address: 'ul. Leśna 4, 63-820 Piaski',
      phone: '+48 601 222 333',
    },
    pigeon: {
      ringNumber: 'PL-0284-23-1402',
      pedigreeName: 'Błękitny As',
      sex: 'cock',
      birthYear: 2023,
      plumageColor: 'Niebieski nakrapiany',
      strain: 'Koopman / Gaby Vandenabeele',
      chipRingNumber: 'TAURIS-99412',
      estimatedValuePln: 8000,
    },
    offspringSharingModel: 'alternating_clutches',
    offspringSharingNotes: 'Lęg 1 i 3 dla Właściciela, Lęg 2 i 4 dla Dzierżawcy.',
    leaseFeePln: 0,
    strictHousingClause: true,
    ringCardsRetainedByLessor: true,
    veterinaryClearanceConfirmed: true,
    autopsyRequiredOnCasualty: true,
    quarantineReturnRequired: true,
    isSigned: true,
  };

  test('validateStudLeaseAgreement returns valid for complete agreement', () => {
    const res = validateStudLeaseAgreement(sampleAgreement);

    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.offspringModelLabel).toContain('Lęgi naprzemienne');
  });

  test('validateStudLeaseAgreement detects missing critical clauses and parties', () => {
    const invalidAgreement: StudLeaseAgreementRecord = {
      ...sampleAgreement,
      lessor: { ...sampleAgreement.lessor, fullName: '' },
      strictHousingClause: false,
      pigeon: { ...sampleAgreement.pigeon, estimatedValuePln: 0 },
    };

    const res = validateStudLeaseAgreement(invalidAgreement);

    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Brak pełnych danych identyfikacyjnych Właściciela (Użyczającego).');
    expect(res.errors).toContain('Krytyczny brak klauzuli zakazu wypuszczania ptaka na wolne obloty!');
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  test('validateStudLeaseAgreement labels all offspring sharing models accurately', () => {
    const resEqual = validateStudLeaseAgreement({
      ...sampleAgreement,
      offspringSharingModel: 'equal_split_per_clutch',
    });
    expect(resEqual.offspringModelLabel).toContain('Równy podział');

    const resFee = validateStudLeaseAgreement({
      ...sampleAgreement,
      offspringSharingModel: 'all_to_lessee_fixed_fee',
    });
    expect(resFee.offspringModelLabel).toContain('Wszystkie pisklęta dla Dzierżawcy');
  });

  test('generateStudLeaseAgreementHtml produces valid printable HTML contract', () => {
    const html = generateStudLeaseAgreementHtml(sampleAgreement);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Umowa Dzierżawy i Użyczenia Rozpłodowego');
    expect(html).toContain('DZIERZ-2026/001');
    expect(html).toContain('PL-0284-23-1402');
    expect(html).toContain('Łukasz Karwowski');
    expect(html).toContain('Jan Kowalski');
    expect(html).toContain('ZAKAZ wypuszczania gołębia na otwarte obloty');
    expect(html).toContain('8000 PLN');
  });
});
