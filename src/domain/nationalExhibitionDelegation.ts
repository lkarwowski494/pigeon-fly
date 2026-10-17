/**
 * PIGEON-FLY — Protokół Reprezentacji na Ogólnopolską Wystawę Gołębi Pocztowych (National Exhibition Delegation)
 * Zgodność z Regulaminem Wystawowym PZHGP oraz Międzynarodowej Federacji Gołębi Pocztowych (FCI):
 * - Kwalifikacja do Klas Sport (Kategorie A, B, C, D, E, F, G, H) na podstawie 2-letniego dorobku kkm i Coeff.
 * - Ocena sędziowska w Klasie Standard według 100-punktowego wzorca FCI (budowa, kościec, umięśnienie, skrzydło, oko).
 * - Weryfikacja spełnienia minimów regulaminowych (min. 2500 kkm dla samców standard, 2000 kkm dla samic standard).
 * - Generator urzędowego A4 Protokołu Reprezentacji Okręgu z podpisami Prezesa Okręgu i Sędziego Głównego.
 */

export type ExhibitionDivision = 'sport' | 'standard';

export type SportCategory =
  | 'sport_a' // Krótki dystans (Sprint 100-400 km)
  | 'sport_b' // Średni dystans (300-600 km)
  | 'sport_c' // Długi dystans (500-800 km)
  | 'sport_d' // Allround / Wielobój
  | 'sport_e' // Maraton (>700 km)
  | 'sport_f' // Młode (rok urodzenia)
  | 'sport_g' // Roczne
  | 'sport_h'; // Dojrzałe dorosłe

export const SPORT_CATEGORY_LABELS: Record<SportCategory, string> = {
  sport_a: 'Kat. A — Krótki Dystans / Sprint (100–400 km)',
  sport_b: 'Kat. B — Średni Dystans (300–600 km)',
  sport_c: 'Kat. C — Długi Dystans (500–800 km)',
  sport_d: 'Kat. D — Allround / Wielobój (Krótki + Średni + Długi)',
  sport_e: 'Kat. E — Maraton (> 700 km)',
  sport_f: 'Kat. F — Gołębie Młode (rok urodzenia)',
  sport_g: 'Kat. G — Gołębie Roczne',
  sport_h: 'Kat. H — Gołębie Dorosłe (Dojrzałe)',
};

export const SPORT_CATEGORY_REQUIREMENTS: Record<
  SportCategory,
  { minConcourses: number; minKkm: number; yearsPeriod: 1 | 2 }
> = {
  sport_a: { minConcourses: 10, minKkm: 1500, yearsPeriod: 2 },
  sport_b: { minConcourses: 8, minKkm: 2800, yearsPeriod: 2 },
  sport_c: { minConcourses: 6, minKkm: 3300, yearsPeriod: 2 },
  sport_d: { minConcourses: 11, minKkm: 3500, yearsPeriod: 2 },
  sport_e: { minConcourses: 4, minKkm: 2800, yearsPeriod: 2 },
  sport_f: { minConcourses: 3, minKkm: 300, yearsPeriod: 1 },
  sport_g: { minConcourses: 5, minKkm: 500, yearsPeriod: 1 },
  sport_h: { minConcourses: 6, minKkm: 1800, yearsPeriod: 1 },
};

export interface FciStandardScores {
  generalAppearance: number; // max 10 pkt (głowa, oko, ekspresja, kondycja)
  boneStructure: number; // max 30 pkt (kościec, grzebień mostka, zwarcie widełek)
  backAndTail: number; // max 20 pkt (lędźwie, pokrycie ogona, sterówki)
  musculature: number; // max 30 pkt (elastyczność mięśni piersiowych, wypełnienie)
  wingsAndPlumage: number; // max 10 pkt (jakość upierzenia, lotki, elastyczność)
}

export interface ExhibitionCandidatePigeon {
  id: string;
  ringNumber: string;
  breederName: string;
  branchName: string;
  sex: 'cock' | 'hen';
  color: string;
  birthYear: number;
  division: ExhibitionDivision;
  sportCategory?: SportCategory;
  totalConcourses2Years: number;
  totalKkm2Years: number;
  sportCoeffSum?: number; // najniższy wygrywa w kat. Sport
  standardScores?: FciStandardScores;
  qualificationStatus: 'qualified' | 'reserve' | 'disqualified_requirements_unmet';
  notes?: string;
}

export interface NationalExhibitionDelegationProtocol {
  id: string;
  protocolNumber: string; // np. 'WYSTAWA-2026/OKR-POZNAN/01'
  exhibitionYear: number; // np. 2026
  districtName: string; // np. 'Okręg Poznań PZHGP'
  exhibitionEventName: string; // np. '73. Ogólnopolska Wystawa Gołębi Pocztowych'
  verificationDate: string; // YYYY-MM-DD
  districtPresidentName: string;
  chiefJudgeName: string;
  candidates: ExhibitionCandidatePigeon[];
  notes?: string;
}

export interface ExhibitionValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ExhibitionStats {
  totalCandidates: number;
  sportQualifiedCount: number;
  standardQualifiedCount: number;
  reserveCount: number;
  averageStandardScore: number;
}

/**
 * Oblicza sumaryczną ocenę standardu według wzorca FCI (max 100 pkt).
 */
export function calculateStandardTotalScore(scores: FciStandardScores): number {
  return (
    scores.generalAppearance +
    scores.boneStructure +
    scores.backAndTail +
    scores.musculature +
    scores.wingsAndPlumage
  );
}

/**
 * Weryfikuje spełnienie minimów konkursowo-kilometrowych dla wybranej kategorii Sport.
 */
export function checkSportCategoryRequirements(
  pigeon: Pick<
    ExhibitionCandidatePigeon,
    'sportCategory' | 'totalConcourses2Years' | 'totalKkm2Years'
  >
): {
  meetsRequirements: boolean;
  requiredConcourses: number;
  requiredKkm: number;
  missingConcourses: number;
  missingKkm: number;
} {
  if (!pigeon.sportCategory) {
    return {
      meetsRequirements: false,
      requiredConcourses: 0,
      requiredKkm: 0,
      missingConcourses: 0,
      missingKkm: 0,
    };
  }

  const req = SPORT_CATEGORY_REQUIREMENTS[pigeon.sportCategory];
  const missingConcourses = Math.max(0, req.minConcourses - pigeon.totalConcourses2Years);
  const missingKkm = Math.max(0, req.minKkm - pigeon.totalKkm2Years);

  return {
    meetsRequirements: missingConcourses === 0 && missingKkm === 0,
    requiredConcourses: req.minConcourses,
    requiredKkm: req.minKkm,
    missingConcourses,
    missingKkm,
  };
}

/**
 * Waliduje formalną poprawność protokołu reprezentacji okręgu na wystawę ogólnopolską.
 */
export function validateExhibitionProtocol(
  protocol: NationalExhibitionDelegationProtocol
): ExhibitionValidationResult {
  const errors: string[] = [];

  if (!protocol.protocolNumber || protocol.protocolNumber.trim().length < 3) {
    errors.push('Wymagany jest oficjalny numer protokołu reprezentacji.');
  }

  if (!protocol.districtName || protocol.districtName.trim().length < 3) {
    errors.push('Wymagana jest nazwa macierzystego Okręgu PZHGP.');
  }

  if (!protocol.districtPresidentName || protocol.districtPresidentName.trim().length < 3) {
    errors.push('Wymagane jest nazwisko Prezesa Okręgu PZHGP.');
  }

  if (!protocol.chiefJudgeName || protocol.chiefJudgeName.trim().length < 3) {
    errors.push('Wymagane jest nazwisko Sędziego Głównego Wystawy Okręgowej.');
  }

  if (!protocol.candidates || protocol.candidates.length === 0) {
    errors.push('Protokół musi zawierać co najmniej jednego gołębia reprezentacji.');
  }

  // Weryfikacja każdego kandydata
  protocol.candidates.forEach((cand, idx) => {
    if (!cand.ringNumber || cand.ringNumber.trim().length < 4) {
      errors.push(`Kandydat #${idx + 1}: Brak numeru obrączki rodowej.`);
    }

    if (cand.division === 'sport') {
      if (!cand.sportCategory) {
        errors.push(`Kandydat ${cand.ringNumber}: Brak przypisanej kategorii Sport (A-H).`);
      } else {
        const check = checkSportCategoryRequirements(cand);
        if (!check.meetsRequirements && cand.qualificationStatus === 'qualified') {
          errors.push(
            `Kandydat ${cand.ringNumber} zakwalifikowany do ${SPORT_CATEGORY_LABELS[cand.sportCategory]}, lecz nie spełnia minimów (brakuje: ${check.missingConcourses} konk., ${check.missingKkm} kkm).`
          );
        }
      }
    } else if (cand.division === 'standard') {
      // Weryfikacja minimów kilometrowych dla standardu FCI: 2500 kkm samce, 2000 kkm samice
      const minStandardKkm = cand.sex === 'cock' ? 2500 : 2000;
      if (cand.totalKkm2Years < minStandardKkm && cand.qualificationStatus === 'qualified') {
        errors.push(
          `Kandydat Standard ${cand.ringNumber} (${cand.sex === 'cock' ? 'Samiec' : 'Samica'}) nie spełnia minimum lotowego FCI (wymagane: min. ${minStandardKkm} kkm, posiada: ${cand.totalKkm2Years} kkm).`
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Oblicza statystyki reprezentacji wystawowej okręgu.
 */
export function calculateExhibitionStats(
  protocol: NationalExhibitionDelegationProtocol
): ExhibitionStats {
  const candidates = protocol.candidates || [];
  let sportQualified = 0;
  let standardQualified = 0;
  let reserve = 0;
  let totalStandardScore = 0;
  let standardEvaluatedCount = 0;

  candidates.forEach((c) => {
    if (c.qualificationStatus === 'qualified') {
      if (c.division === 'sport') sportQualified++;
      if (c.division === 'standard') standardQualified++;
    } else if (c.qualificationStatus === 'reserve') {
      reserve++;
    }

    if (c.standardScores) {
      totalStandardScore += calculateStandardTotalScore(c.standardScores);
      standardEvaluatedCount++;
    }
  });

  return {
    totalCandidates: candidates.length,
    sportQualifiedCount: sportQualified,
    standardQualifiedCount: standardQualified,
    reserveCount: reserve,
    averageStandardScore:
      standardEvaluatedCount > 0
        ? parseFloat((totalStandardScore / standardEvaluatedCount).toFixed(2))
        : 0,
  };
}

/**
 * Generuje urzędowy dokument A4 HTML Protokołu Kwalifikacji Reprezentacji Okręgu.
 */
export function generateNationalExhibitionHtml(
  protocol: NationalExhibitionDelegationProtocol
): string {
  const stats = calculateExhibitionStats(protocol);

  const candidateRows = protocol.candidates
    .map((c, idx) => {
      const isSport = c.division === 'sport';
      const scoreVal =
        isSport
          ? `Coeff: ${c.sportCoeffSum?.toFixed(3) || '—'}`
          : c.standardScores
          ? `${calculateStandardTotalScore(c.standardScores).toFixed(2)} pkt`
          : '—';

      const statusBadge =
        c.qualificationStatus === 'qualified'
          ? '<span style="color: #059669; font-weight: bold;">✓ REPREZENTACJA</span>'
          : c.qualificationStatus === 'reserve'
          ? '<span style="color: #d97706; font-weight: bold;">REZERWA</span>'
          : '<span style="color: #dc2626; font-weight: bold;">BRAK MINIMUM</span>';

      return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px; text-align: left;">${c.ringNumber}</td>
        <td style="text-align: left; border: 1px solid #cbd5e1; padding: 4px;">${c.breederName}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px;">${c.sex === 'cock' ? '1.0 ♂' : '0.1 ♀'}</td>
        <td style="text-align: left; border: 1px solid #cbd5e1; padding: 4px;">${c.color}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px;">
          ${isSport ? `SPORT: ${c.sportCategory ? c.sportCategory.toUpperCase().replace('_', ' ') : '—'}` : 'STANDARD FCI'}
        </td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px;">${c.totalConcourses2Years} konk. / ${c.totalKkm2Years} kkm</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px; color: #1e3a8a;">${scoreVal}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px;">${statusBadge}</td>
      </tr>
    `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Reprezentacja Okręgu na Wystawę Ogólnopolską - ${protocol.protocolNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      color: #0f172a;
      line-height: 1.25;
      margin: 0;
      padding: 0;
    }
    .header-banner {
      background-color: #1e3a8a;
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 4px;
      text-align: center;
      margin-bottom: 10px;
    }
    .header-banner h1 {
      margin: 0;
      font-size: 13pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-banner p {
      margin: 2px 0 0 0;
      font-size: 8.5pt;
      color: #bfdbfe;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .info-grid td {
      padding: 3px 4px;
      font-size: 8.5pt;
    }
    .label {
      font-weight: bold;
      color: #475569;
    }
    .val {
      font-weight: bold;
      color: #0f172a;
    }
    .table-candidates {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 8pt;
    }
    .table-candidates th {
      background-color: #0f172a;
      color: #ffffff;
      padding: 5px 3px;
      border: 1px solid #0f172a;
      text-align: center;
      font-size: 8pt;
    }
    .stats-bar {
      display: flex;
      justify-content: space-between;
      background-color: #e2e8f0;
      padding: 5px 8px;
      border-radius: 4px;
      margin-top: 8px;
      font-size: 8pt;
      font-weight: bold;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .sig-cell {
      width: 50%;
      text-align: center;
      vertical-align: top;
      padding: 0 16px;
    }
    .sig-line {
      border-bottom: 1px dashed #0f172a;
      height: 38px;
      margin-bottom: 4px;
    }
    .sig-desc {
      font-size: 7.5pt;
      color: #475569;
    }
  </style>
</head>
<body>

  <div class="header-banner">
    <h1>OFICJALNA REPREZENTACJA OKRĘGU NA WYSTAWĘ OGÓLNOPOLSKĄ</h1>
    <p>Protokół Kwalifikacji Klas Sport i Standard FCI • ${protocol.exhibitionEventName}</p>
  </div>

  <table class="info-grid">
    <tr>
      <td style="width: 18%;" class="label">Okręg PZHGP:</td>
      <td style="width: 32%;" class="val">${protocol.districtName}</td>
      <td style="width: 18%;" class="label">Nr Protokołu:</td>
      <td style="width: 32%;" class="val" style="font-family: monospace;">${protocol.protocolNumber}</td>
    </tr>
    <tr>
      <td class="label">Prezes Okręgu:</td>
      <td class="val">${protocol.districtPresidentName}</td>
      <td class="label">Sędzia Główny Wystawy:</td>
      <td class="val">${protocol.chiefJudgeName}</td>
    </tr>
    <tr>
      <td class="label">Wydarzenie:</td>
      <td class="val">${protocol.exhibitionEventName} (${protocol.exhibitionYear})</td>
      <td class="label">Data weryfikacji:</td>
      <td class="val">${protocol.verificationDate}</td>
    </tr>
  </table>

  <!-- TABELA KANDYDATÓW -->
  <table class="table-candidates">
    <thead>
      <tr>
        <th style="width: 4%;">Lp.</th>
        <th style="width: 18%;">Nr Obrączki Rodowej</th>
        <th style="width: 18%;">Hodowca</th>
        <th style="width: 6%;">Płeć</th>
        <th style="width: 10%;">Barwa</th>
        <th style="width: 14%;">Klasa / Kat.</th>
        <th style="width: 14%;">Dorobek 2L</th>
        <th style="width: 10%;">Wynik / Ocena</th>
        <th style="width: 12%;">Kwalifikacja</th>
      </tr>
    </thead>
    <tbody>
      ${candidateRows}
    </tbody>
  </table>

  <!-- STATYSTYKI REPREZENTACJI -->
  <div class="stats-bar">
    <span>Kandydatów łącznie: <strong>${stats.totalCandidates}</strong></span>
    <span>Zakwalifikowani Sport: <strong>${stats.sportQualifiedCount}</strong></span>
    <span>Zakwalifikowani Standard: <strong>${stats.standardQualifiedCount}</strong></span>
    <span>Rezerwa: <strong>${stats.reserveCount}</strong></span>
    <span>Śr. nota Standard: <strong>${stats.averageStandardScore} pkt</strong></span>
  </div>

  <!-- PODPISY -->
  <table class="signatures-table">
    <tr>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8.5pt;">Prezes Okręgu PZHGP</div>
        <div class="sig-desc">${protocol.districtPresidentName}</div>
      </td>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8.5pt;">Przewodniczący Kolegium Sędziów / Sędzia Główny</div>
        <div class="sig-desc">${protocol.chiefJudgeName}</div>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}
