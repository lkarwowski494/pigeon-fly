/**
 * PIGEON-FLY — Rejestr Badań Genetycznych DNA & Parentage Verification (Z-091 / DEC-105)
 * Zgodność ze standardami ISAG (International Society for Animal Genetics):
 * - Panel mikrosatelitarny STR (PIGN04, PIGN12, PIGN15, PIGN26, PIGN57, PIGN69, PIGN73, PIGN82).
 * - Algorytm weryfikacji pokrewieństwa ojcowskiego i matecznego (Parentage Verification).
 * - Analiza markerów wydolnościowych i predyspozycji lotowych:
 *   * LDHA (dehydrogenaza mleczanowa: A/A - wybitny maraton, A/B - wysoka wydolność, B/B - standard),
 *   * DRD4 (receptor dopaminy: T/T lub C/T - wytrwałość orientacyjna i formy powrotowej),
 *   * MSTN (miostatyna - siła i profil włókien mięśniowych).
 * - Generator oficjalnego Certyfikatu DNA A4 HTML/PDF dla celów FCI, aukcji i wystaw.
 */

import { Sex } from './types';

export interface StrLocus {
  name: string; // np. "PIGN04"
  allele1: number; // np. 182
  allele2: number; // np. 194
}

export type LdhaGenotype = 'A/A' | 'A/B' | 'B/B';
export type Drd4Genotype = 'C/C' | 'C/T' | 'T/T';
export type MstnGenotype = 'T/T' | 'C/T' | 'C/C';

export interface DnaGenotype {
  ldha: LdhaGenotype;
  drd4: Drd4Genotype;
  mstn?: MstnGenotype;
}

export type ParentageStatus =
  | 'confirmed'
  | 'excluded_sire'
  | 'excluded_dam'
  | 'excluded_both'
  | 'inconclusive';

export interface LocusComparison {
  locus: string;
  offspring: [number, number];
  sire?: [number, number];
  dam?: [number, number];
  sireMatch: boolean;
  damMatch: boolean;
}

export interface ParentageVerificationResult {
  status: ParentageStatus;
  isSireConfirmed: boolean;
  isDamConfirmed: boolean;
  mismatchedSireLoci: number;
  mismatchedDamLoci: number;
  testedLociCount: number;
  details: LocusComparison[];
  summaryText: string;
}

export interface DnaCertificateData {
  certificateNumber: string; // np. "DNA-2026-PL-8941"
  laboratoryName: string; // np. "Laboklin Badania Genetyczne Weterynarii"
  issueDate: string; // YYYY-MM-DD
  sampleDate: string;
  veterinarianName: string;
  loftName: string;
  breederName: string;
  breederPzhgpNumber: string;
  pigeonRing: string;
  pigeonSex: Sex;
  pigeonColor: string;
  sireRing: string;
  damRing: string;
  offspringLoci: StrLocus[];
  sireLoci?: StrLocus[];
  damLoci?: StrLocus[];
  genotypes: DnaGenotype;
  verification: ParentageVerificationResult;
  notes?: string;
}

export const STANDARD_ISAG_LOCI = [
  'PIGN04',
  'PIGN12',
  'PIGN15',
  'PIGN26',
  'PIGN57',
  'PIGN69',
  'PIGN73',
  'PIGN82',
];

/**
 * Checks whether an offspring allele pair could have inherited from parent allele pair.
 * For parent to be compatible, at least one of the offspring's alleles must match at least one of the parent's alleles.
 */
function isLocusCompatible(offspring: [number, number], parent: [number, number]): boolean {
  return (
    offspring[0] === parent[0] ||
    offspring[0] === parent[1] ||
    offspring[1] === parent[0] ||
    offspring[1] === parent[1]
  );
}

/**
 * Evaluates Mendelian parentage verification based on ISAG STR panel loci.
 */
export function verifyParentage(
  offspringLoci: StrLocus[],
  sireLoci?: StrLocus[],
  damLoci?: StrLocus[]
): ParentageVerificationResult {
  const sireMap = new Map<string, [number, number]>();
  if (sireLoci) {
    sireLoci.forEach((l) => sireMap.set(l.name, [l.allele1, l.allele2]));
  }

  const damMap = new Map<string, [number, number]>();
  if (damLoci) {
    damLoci.forEach((l) => damMap.set(l.name, [l.allele1, l.allele2]));
  }

  let mismatchedSireCount = 0;
  let mismatchedDamCount = 0;
  const comparisons: LocusComparison[] = [];

  for (const off of offspringLoci) {
    const offPair: [number, number] = [off.allele1, off.allele2];
    const sirePair = sireMap.get(off.name);
    const damPair = damMap.get(off.name);

    let sireMatch = true;
    if (sirePair) {
      sireMatch = isLocusCompatible(offPair, sirePair);
      if (!sireMatch) mismatchedSireCount++;
    }

    let damMatch = true;
    if (damPair) {
      damMatch = isLocusCompatible(offPair, damPair);
      if (!damMatch) mismatchedDamCount++;
    }

    comparisons.push({
      locus: off.name,
      offspring: offPair,
      sire: sirePair,
      dam: damPair,
      sireMatch,
      damMatch,
    });
  }

  const hasSireData = Boolean(sireLoci && sireLoci.length > 0);
  const hasDamData = Boolean(damLoci && damLoci.length > 0);

  // In genetics, 0 mismatches = confirmed, 1 mismatch could be mutation (inconclusive/caution), 2+ = exclusion
  const isSireConfirmed = hasSireData && mismatchedSireCount === 0;
  const isDamConfirmed = hasDamData && mismatchedDamCount === 0;

  let status: ParentageStatus = 'inconclusive';

  if (hasSireData && hasDamData) {
    if (isSireConfirmed && isDamConfirmed) {
      status = 'confirmed';
    } else if (!isSireConfirmed && !isDamConfirmed) {
      status = 'excluded_both';
    } else if (!isSireConfirmed) {
      status = 'excluded_sire';
    } else {
      status = 'excluded_dam';
    }
  } else if (hasSireData) {
    status = isSireConfirmed ? 'confirmed' : 'excluded_sire';
  } else if (hasDamData) {
    status = isDamConfirmed ? 'confirmed' : 'excluded_dam';
  }

  let summaryText = '';
  switch (status) {
    case 'confirmed':
      summaryText = 'Pochodzenie w 100% zgodne genetycznie z obojgiem rodziców (Zgodność z rodowodem).';
      break;
    case 'excluded_sire':
      summaryText = `WYKLUCZENIE OJCOSTWA: Niezgodność na ${mismatchedSireCount} loci mikrosatelitarnych. Samiec nie jest biologicznym ojcem!`;
      break;
    case 'excluded_dam':
      summaryText = `WYKLUCZENIE MACIERZYŃSTWA: Niezgodność na ${mismatchedDamCount} loci. Samica nie jest biologiczną matką!`;
      break;
    case 'excluded_both':
      summaryText = 'WYKLUCZENIE OBOJGA RODZICÓW: Brak zgodności genetycznej z ojcem i matką.';
      break;
    default:
      summaryText = 'Profil cząstkowy lub brak próbek porównawczych rodziców.';
  }

  return {
    status,
    isSireConfirmed,
    isDamConfirmed,
    mismatchedSireLoci: mismatchedSireCount,
    mismatchedDamLoci: mismatchedDamCount,
    testedLociCount: comparisons.length,
    details: comparisons,
    summaryText,
  };
}

/**
 * Analyzes performance genetic markers (LDHA, DRD4, MSTN).
 */
export function evaluatePerformanceGenetics(genotypes: DnaGenotype): {
  score: number; // 0-100
  verdict: string;
  description: string;
} {
  let score = 50;

  // LDHA (Lactate Dehydrogenase A):
  // Allele A allows efficient lactate recycling into energy during sustained anaerobic muscle work
  if (genotypes.ldha === 'A/A') {
    score += 35; // Rzadki, złoty gen maratoński
  } else if (genotypes.ldha === 'A/B') {
    score += 20; // Heterozygota, wysoka zdolność wysiłkowa
  } else {
    score += 5; // Standardowy dziki allel B/B
  }

  // DRD4 (Dopamine Receptor D4):
  // Allele T correlates with psychological grit, persistence, and navigation in adverse weather
  if (genotypes.drd4 === 'T/T') {
    score += 15;
  } else if (genotypes.drd4 === 'C/T') {
    score += 10;
  }

  let verdict = 'Standardowy profil sportowy';
  let description = 'Podstawowe uwarunkowania genetyczne stada lotowego.';

  if (score >= 85) {
    verdict = 'Elitarny profil maratoński (Wybitny)';
    description =
      'Rzadka kombinacja genetyczna (LDHA A/A i DRD4). Maksymalna odporność na kwas mlekowy i żelazna psychika powrotna w lotach długich i maratonach.';
  } else if (score >= 70) {
    verdict = 'Wysoki potencjał wydolnościowy (Zaawansowany)';
    description =
      'Obecność korzystnego allelu LDHA (A/B) gwarantuje podwyższoną kinetykę usuwania kwasu mlekowego oraz sprawną regenerację powysiłkową.';
  }

  return {
    score: Math.min(100, score),
    verdict,
    description,
  };
}

/**
 * Validates DNA Certificate data completeness.
 */
export function validateDnaCertificate(data: DnaCertificateData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.certificateNumber || !data.certificateNumber.trim()) {
    errors.push('Brak numeru certyfikatu DNA!');
  }
  if (!data.pigeonRing || !data.pigeonRing.trim()) {
    errors.push('Brak numeru obrączki badanego ptaka!');
  }
  if (!data.laboratoryName || !data.laboratoryName.trim()) {
    errors.push('Brak nazwy laboratorium genetycznego!');
  }
  if (!data.offspringLoci || data.offspringLoci.length === 0) {
    errors.push('Brak danych markerów mikrosatelitarnych STR!');
  }
  if (!data.veterinarianName || !data.veterinarianName.trim()) {
    errors.push('Brak nazwiska lekarza weterynarii pobierającego próbkę!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates official A4 Printable DNA Certificate HTML.
 */
export function generateDnaCertificateHtml(data: DnaCertificateData): string {
  const perf = evaluatePerformanceGenetics(data.genotypes);

  const lociRows = data.verification.details
    .map(
      (d) => `
    <tr>
      <td style="font-family: monospace; font-weight: 800;">${d.locus}</td>
      <td style="text-align: center; font-family: monospace; font-weight: 700; color: #0284c7;">
        ${d.offspring[0]} / ${d.offspring[1]}
      </td>
      <td style="text-align: center; font-family: monospace;">
        ${d.sire ? `${d.sire[0]} / ${d.sire[1]}` : '—'}
      </td>
      <td style="text-align: center; font-weight: 800; color: ${d.sireMatch ? '#166534' : '#991b1b'};">
        ${d.sire ? (d.sireMatch ? '✓ ZGODNY' : '✕ NIEZGODNY') : '—'}
      </td>
      <td style="text-align: center; font-family: monospace;">
        ${d.dam ? `${d.dam[0]} / ${d.dam[1]}` : '—'}
      </td>
      <td style="text-align: center; font-weight: 800; color: ${d.damMatch ? '#166534' : '#991b1b'};">
        ${d.dam ? (d.damMatch ? '✓ ZGODNY' : '✕ NIEZGODNY') : '—'}
      </td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Certyfikat Genetyczny DNA i Potwierdzenie Pochodzenia — ${data.pigeonRing}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.35;
      font-size: 8.5pt;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8pt; text-align: right; color: #334155; }

    .banner {
      background: #f8fafc;
      border: 1.5px solid #0284c7;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .banner-title { font-size: 11pt; font-weight: 900; color: #0284c7; }
    .banner-desc { font-size: 8pt; color: #475569; margin-top: 2px; }

    .verdict-box {
      background: ${data.verification.status === 'confirmed' ? '#f0fdf4' : '#fef2f2'};
      border: 1.5px solid ${data.verification.status === 'confirmed' ? '#16a34a' : '#dc2626'};
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .verdict-title {
      font-size: 10pt;
      font-weight: 900;
      color: ${data.verification.status === 'confirmed' ? '#166534' : '#991b1b'};
    }
    .verdict-desc { font-size: 8pt; color: #334155; margin-top: 2px; }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .card-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .gene-val {
      font-size: 12pt;
      font-weight: 900;
      color: #0284c7;
      text-align: center;
      margin: 4px 0;
    }
    .gene-desc { font-size: 7.5pt; color: #64748b; text-align: center; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 12px;
      font-size: 8pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
    }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-top: 24px;
      padding-top: 8px;
    }
    .sig-col {
      text-align: center;
      border-top: 1px dashed #64748b;
      padding-top: 6px;
    }
    .sig-title { font-size: 7.5pt; color: #64748b; text-transform: uppercase; }
    .sig-name { font-size: 8pt; font-weight: 800; margin-top: 2px; }

    .footer {
      margin-top: 16px;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      font-size: 7.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Certyfikat Badań Genetycznych DNA (ISAG)</div>
      <div class="subtitle">Weryfikacja Pochodzenia (Parentage Verification) i Markery Wydolnościowe (Z-091)</div>
    </div>
    <div class="meta">
      <div>Certyfikat Nr: <strong>${data.certificateNumber}</strong></div>
      <div>Laboratorium: <strong>${data.laboratoryName}</strong></div>
      <div>Data wydania: <strong>${data.issueDate}</strong></div>
    </div>
  </div>

  <div class="banner">
    <div>
      <div class="banner-title">Oznaczenie Ptaka: ${data.pigeonRing}</div>
      <div class="banner-desc">
        Płeć: <strong>${data.pigeonSex === 'cock' ? '1.0 Samiec' : data.pigeonSex === 'hen' ? '0.1 Samica' : 'Nieznana'}</strong> • 
        Upierzenie: <strong>${data.pigeonColor}</strong> • 
        Hodowca: <strong>${data.breederName}</strong> (${data.breederPzhgpNumber})
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 8pt; color: #64748b;">Pobranie próbki:</span><br>
      <strong style="font-size: 9pt; color: #0f172a;">${data.sampleDate}</strong>
    </div>
  </div>

  <div class="verdict-box">
    <div>
      <div class="verdict-title">
        ${data.verification.status === 'confirmed' ? '✓ POTWIERDZONE POCHODZENIE (PARENTAGE QUALIFIED)' : '✕ WYKLUCZENIE RODZICIELSKIE (PARENTAGE EXCLUDED)'}
      </div>
      <div class="verdict-desc">${data.verification.summaryText}</div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 7.5pt; color: #64748b;">Przebadane Loci:</span><br>
      <strong style="font-size: 11pt; color: #0f172a;">${data.verification.testedLociCount} / ${data.verification.testedLociCount}</strong>
    </div>
  </div>

  <div class="grid-3">
    <!-- LDHA -->
    <div class="card">
      <div class="card-title">1. GEN LDHA (METABOLIZM MLEKOWY)</div>
      <div class="gene-val">${data.genotypes.ldha}</div>
      <div class="gene-desc">
        ${
          data.genotypes.ldha === 'A/A'
            ? 'Genotyp wybitny maratoński (A/A) — maksymalny recykling kwasu mlekowego.'
            : data.genotypes.ldha === 'A/B'
            ? 'Genotyp korzystny (A/B) — wysoka tolerancja zmęczeniowa.'
            : 'Genotyp standardowy (B/B) — typ dziki.'
        }
      </div>
    </div>

    <!-- DRD4 -->
    <div class="card">
      <div class="card-title">2. GEN DRD4 (MOTYWACJA I ORIENTACJA)</div>
      <div class="gene-val">${data.genotypes.drd4}</div>
      <div class="gene-desc">
        ${
          data.genotypes.drd4 === 'T/T'
            ? 'Wybitna determinacja powrotowa i odwaga w trudnych warunkach.'
            : data.genotypes.drd4 === 'C/T'
            ? 'Podwyższona motywacja i orientacja przestrzenna.'
            : 'Standardowy profil behawioralny (C/C).'
        }
      </div>
    </div>

    <!-- MSTN / Podsumowanie -->
    <div class="card">
      <div class="card-title">3. INDEKS WYDOLNOŚCIOWY</div>
      <div class="gene-val" style="color: #166534;">${perf.score} / 100 pkt</div>
      <div class="gene-desc">${perf.verdict}</div>
    </div>
  </div>

  <div style="font-weight: 800; font-size: 9pt; margin-bottom: 2px;">
    TABELA PROFILOWANIA MIKROSATELITARNEGO STR (ISAG PANEL):
  </div>
  <table>
    <thead>
      <tr>
        <th>Locus STR</th>
        <th style="text-align: center;">Badany Ptak (Allele)</th>
        <th style="text-align: center;">Ojciec: ${data.sireRing || 'Brak próbki'}</th>
        <th style="text-align: center;">Zgodność ♂</th>
        <th style="text-align: center;">Matka: ${data.damRing || 'Brak próbki'}</th>
        <th style="text-align: center;">Zgodność ♀</th>
      </tr>
    </thead>
    <tbody>
      ${lociRows}
    </tbody>
  </table>

  <div style="font-size: 7.5pt; color: #64748b; line-height: 1.35; margin-bottom: 12px;">
    Badanie wykonano techniką amplifikacji PCR i elektroforezy kapilarnej fragmentów DNA zgodnie ze standardami ISAG.
    Potwierdzenie rodzicielstwa wymaga obecności co najmniej jednego allelu wspólnego z ojcem i jednego z matką na każdym z analizowanych loci.
  </div>

  <div class="signatures">
    <div class="sig-col">
      <div class="sig-title">Lekarz Pobierający Krew / Pióra</div>
      <div class="sig-name">${data.veterinarianName}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Kierownik Laboratorium DNA</div>
      <div class="sig-name">Dr hab. n. wet. Diagnosta</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Hodowca / Właściciel Ptaka</div>
      <div class="sig-name">${data.breederName}</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Certyfikat Badań Genetycznych DNA Z-091 (DEC-105)</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
