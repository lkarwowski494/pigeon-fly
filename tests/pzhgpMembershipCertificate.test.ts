import {
  validatePzhgpMembershipCertificate,
  generatePzhgpMembershipCertificateHtml,
  PzhgpMembershipCertificateData,
  PURPOSE_LABELS,
} from '../src/domain/pzhgpMembershipCertificate';

const sampleCertificate: PzhgpMembershipCertificateData = {
  certificateNumber: 'ZAS/0284/2026/089',
  issueDate: '2026-03-15',
  seasonYear: 2026,
  purpose: 'veterinary_inspection',
  breederName: 'Łukasz Nowak',
  breederPzhgpNumber: 'PL-0284-1420',
  districtName: 'Okręg Poznań',
  branchName: '0284 Nowy Tomyśl',
  sectionName: 'Sekcja 01 Zbąszyń',
  loftAddress: 'ul. Polna 8, 64-360 Zbąszyń',
  loftLatitude: 52.25142,
  loftLongitude: 15.91845,
  membershipSinceYear: 2012,
  isMembershipFeePaid: true,
  hasDisciplinarySanctions: false,
  pmvVaccinationCertified: true,
  sanitaryVetApprovalNumber: 'WET-POZ-2026/092',
  allocatedRings: [
    {
      id: 'rng-1',
      seriesRange: 'PL-0284-26-1001 — PL-0284-26-1050',
      ringsCount: 50,
      color: 'Czerwony (FCI 2026)',
      issueDate: '2026-01-10',
      paid: true,
    },
    {
      id: 'rng-2',
      seriesRange: 'PL-0284-26-1051 — PL-0284-26-1080',
      ringsCount: 30,
      color: 'Czerwony (FCI 2026)',
      issueDate: '2026-02-05',
      paid: true,
    },
  ],
  identityCardsIssued: true,
  branchPresident: 'Mirosław Kaczmarek',
  branchSecretary: 'Tomasz Adamczak',
  officialNotes: 'Hodowca złożył komplet dokumentów rejestracyjnych stada.',
};

describe('pzhgpMembershipCertificate (Z-086 / DEC-100)', () => {
  it('validates compliant PZHGP certificate successfully', () => {
    const result = validatePzhgpMembershipCertificate(sampleCertificate);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.totalRingsAllocated).toBe(80); // 50 + 30
    expect(result.statusLabel).toContain('ZAŚWIADCZENIE WAŻNE');
  });

  it('rejects certificate if membership fee is unpaid or sanctions exist', () => {
    const unpaidData: PzhgpMembershipCertificateData = {
      ...sampleCertificate,
      isMembershipFeePaid: false,
      hasDisciplinarySanctions: true,
    };

    const result = validatePzhgpMembershipCertificate(unpaidData);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('składki'))).toBe(true);
    expect(result.errors.some((e) => e.includes('dyscyplinarna'))).toBe(true);
  });

  it('rejects certificate if PMV-1 vaccination certification is missing', () => {
    const unvacData: PzhgpMembershipCertificateData = {
      ...sampleCertificate,
      pmvVaccinationCertified: false,
    };

    const result = validatePzhgpMembershipCertificate(unvacData);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('PMV-1'))).toBe(true);
  });

  it('flags warning when some rings are unpaid or identity cards unissued', () => {
    const warningData: PzhgpMembershipCertificateData = {
      ...sampleCertificate,
      identityCardsIssued: false,
      allocatedRings: [
        {
          ...sampleCertificate.allocatedRings[0],
          paid: false,
        },
      ],
    };

    const result = validatePzhgpMembershipCertificate(warningData);

    expect(result.warnings.some((w) => w.includes('nieopłacona') || w.includes('nie została opłacona'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('Karty tożsamości'))).toBe(true);
  });

  it('contains labels for all official purpose options', () => {
    expect(PURPOSE_LABELS.veterinary_inspection).toContain('Inspektoratu Weterynarii');
    expect(PURPOSE_LABELS.national_exhibition).toContain('Wystawy');
    expect(PURPOSE_LABELS.border_crossing_transit).toContain('Międzynarodowy Transport');
    expect(PURPOSE_LABELS.general_membership).toContain('Przynależności Związkowej');
  });

  it('generates valid official A4 Certificate HTML with ring registry and signatures', () => {
    const html = generatePzhgpMembershipCertificateHtml(sampleCertificate);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH');
    expect(html).toContain('ZAŚWIADCZENIE CZŁONKOWSKIE I EWIDENCJA OBRĄCZEK');
    expect(html).toContain('ZAS/0284/2026/089');
    expect(html).toContain('Łukasz Nowak');
    expect(html).toContain('PL-0284-1420');
    expect(html).toContain('PL-0284-26-1001 — PL-0284-26-1050');
    expect(html).toContain('80 SZTUK');
    expect(html).toContain('Mirosław Kaczmarek');
    expect(html).toContain('Tomasz Adamczak');
    expect(html).toContain('Miejsce na Pieczęć Urzędową');
  });
});
