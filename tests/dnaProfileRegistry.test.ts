import {
  verifyParentage,
  evaluatePerformanceGenetics,
  validateDnaCertificate,
  generateDnaCertificateHtml,
  DnaCertificateData,
  StrLocus,
} from '../src/domain/dnaProfileRegistry';

const sampleOffspringLoci: StrLocus[] = [
  { name: 'PIGN04', allele1: 182, allele2: 194 },
  { name: 'PIGN12', allele1: 220, allele2: 228 },
  { name: 'PIGN15', allele1: 144, allele2: 152 },
  { name: 'PIGN26', allele1: 302, allele2: 310 },
  { name: 'PIGN57', allele1: 168, allele2: 174 },
  { name: 'PIGN69', allele1: 250, allele2: 256 },
  { name: 'PIGN73', allele1: 190, allele2: 198 },
  { name: 'PIGN82', allele1: 212, allele2: 218 },
];

const sampleSireLoci: StrLocus[] = [
  { name: 'PIGN04', allele1: 182, allele2: 188 }, // 182 matches
  { name: 'PIGN12', allele1: 220, allele2: 224 }, // 220 matches
  { name: 'PIGN15', allele1: 140, allele2: 144 }, // 144 matches
  { name: 'PIGN26', allele1: 302, allele2: 308 }, // 302 matches
  { name: 'PIGN57', allele1: 168, allele2: 170 }, // 168 matches
  { name: 'PIGN69', allele1: 248, allele2: 250 }, // 250 matches
  { name: 'PIGN73', allele1: 190, allele2: 194 }, // 190 matches
  { name: 'PIGN82', allele1: 212, allele2: 220 }, // 212 matches
];

const sampleDamLoci: StrLocus[] = [
  { name: 'PIGN04', allele1: 194, allele2: 198 }, // 194 matches
  { name: 'PIGN12', allele1: 228, allele2: 232 }, // 228 matches
  { name: 'PIGN15', allele1: 152, allele2: 156 }, // 152 matches
  { name: 'PIGN26', allele1: 310, allele2: 314 }, // 310 matches
  { name: 'PIGN57', allele1: 174, allele2: 178 }, // 174 matches
  { name: 'PIGN69', allele1: 256, allele2: 260 }, // 256 matches
  { name: 'PIGN73', allele1: 198, allele2: 202 }, // 198 matches
  { name: 'PIGN82', allele1: 218, allele2: 222 }, // 218 matches
];

const sampleCertificate: DnaCertificateData = {
  certificateNumber: 'DNA-2026-PL-8941',
  laboratoryName: 'Laboklin Badania Genetyczne Weterynarii',
  issueDate: '2026-04-15',
  sampleDate: '2026-04-02',
  veterinarianName: 'Lek. wet. Janusz Ptasiński',
  loftName: 'Mistrzowski Gołębnik Poznań',
  breederName: 'Tomasz Nowak',
  breederPzhgpNumber: 'PL-0284-1102',
  pigeonRing: 'PL-0284-26-1401',
  pigeonSex: 'cock',
  pigeonColor: 'Niebieski nakrapiany',
  sireRing: 'PL-0284-21-9901',
  damRing: 'PL-0284-22-4410',
  offspringLoci: sampleOffspringLoci,
  sireLoci: sampleSireLoci,
  damLoci: sampleDamLoci,
  genotypes: {
    ldha: 'A/A',
    drd4: 'T/T',
    mstn: 'C/T',
  },
  verification: verifyParentage(sampleOffspringLoci, sampleSireLoci, sampleDamLoci),
  notes: 'Profil DNA certyfikowany dla Wystawy Ogólnopolskiej PZHGP.',
};

describe('dnaProfileRegistry (Z-091 / DEC-105)', () => {
  it('confirms 100% parentage when offspring matches both sire and dam across all STR loci', () => {
    const res = verifyParentage(sampleOffspringLoci, sampleSireLoci, sampleDamLoci);

    expect(res.status).toBe('confirmed');
    expect(res.isSireConfirmed).toBe(true);
    expect(res.isDamConfirmed).toBe(true);
    expect(res.mismatchedSireLoci).toBe(0);
    expect(res.mismatchedDamLoci).toBe(0);
    expect(res.testedLociCount).toBe(8);
    expect(res.summaryText).toContain('100% zgodne');
  });

  it('detects parentage exclusion when sire has incompatible alleles', () => {
    const fakeSireLoci: StrLocus[] = [
      { name: 'PIGN04', allele1: 170, allele2: 172 }, // neither matches 182 or 194
      { name: 'PIGN12', allele1: 210, allele2: 214 }, // neither matches 220 or 228
      ...sampleSireLoci.slice(2),
    ];

    const res = verifyParentage(sampleOffspringLoci, fakeSireLoci, sampleDamLoci);

    expect(res.status).toBe('excluded_sire');
    expect(res.isSireConfirmed).toBe(false);
    expect(res.isDamConfirmed).toBe(true);
    expect(res.mismatchedSireLoci).toBe(2);
    expect(res.summaryText).toContain('WYKLUCZENIE OJCOSTWA');
  });

  it('detects exclusion of both parents', () => {
    const fakeSireLoci: StrLocus[] = [
      { name: 'PIGN04', allele1: 170, allele2: 172 },
      { name: 'PIGN12', allele1: 210, allele2: 214 },
    ];
    const fakeDamLoci: StrLocus[] = [
      { name: 'PIGN04', allele1: 160, allele2: 162 },
      { name: 'PIGN12', allele1: 200, allele2: 204 },
    ];

    const res = verifyParentage(sampleOffspringLoci, fakeSireLoci, fakeDamLoci);
    expect(res.status).toBe('excluded_both');
    expect(res.isSireConfirmed).toBe(false);
    expect(res.isDamConfirmed).toBe(false);
  });

  it('evaluates performance genotypes (LDHA and DRD4)', () => {
    const elite = evaluatePerformanceGenetics({
      ldha: 'A/A',
      drd4: 'T/T',
    });
    expect(elite.score).toBeGreaterThanOrEqual(85);
    expect(elite.verdict).toContain('Elitarny');

    const standard = evaluatePerformanceGenetics({
      ldha: 'B/B',
      drd4: 'C/C',
    });
    expect(standard.score).toBeLessThan(70);
    expect(standard.verdict).toContain('Standardowy');
  });

  it('validates certificate data completeness', () => {
    const valid = validateDnaCertificate(sampleCertificate);
    expect(valid.isValid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = validateDnaCertificate({
      ...sampleCertificate,
      certificateNumber: '',
      laboratoryName: '',
      pigeonRing: '',
      offspringLoci: [],
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('generates valid print-ready HTML DNA Certificate', () => {
    const html = generateDnaCertificateHtml(sampleCertificate);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Certyfikat Badań Genetycznych DNA (ISAG)');
    expect(html).toContain('DNA-2026-PL-8941');
    expect(html).toContain('PL-0284-26-1401');
    expect(html).toContain('Laboklin');
    expect(html).toContain('POTWIERDZONE POCHODZENIE');
    expect(html).toContain('PIGN04');
    expect(html).toContain('A/A');
    expect(html).toContain('T/T');
    expect(html).toContain('Lek. wet. Janusz Ptasiński');
  });
});
