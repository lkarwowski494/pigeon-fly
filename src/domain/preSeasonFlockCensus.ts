/**
 * PIGEON-FLY — Urzędowy Spis Gołębi PZHGP (Pre-Season Flock Census & ESK Chip Audit)
 * Moduł zgodny z Regulaminem Lotowo-Zegarowym PZHGP i procedurami weryfikacji stada:
 * - Warianty spisu: Spis 50 do GMP, Spis Całościowy Stada Dorosłych, Spis Młodych.
 * - Ewidencja obrączek rodowych FCI, płci, barwy i unikalnych numerów chipów ESK.
 * - Poświadczenie szczepienia przeciwko rzekomemu pomorowi drobiu (PMV-1) przez Lekarza Weterynarii.
 * - 3-egzemplarzowy urzędowy wydruk A4 (Zarząd Oddziału, Rachmistrz, Hodowca).
 */

export type CensusType = 'gmp_50' | 'total_flock' | 'youngsters';

export const CENSUS_TYPE_LABELS: Record<CensusType, string> = {
  gmp_50: 'Spis 50 Gołębi do Generalnego Mistrzostwa Polski (GMP)',
  total_flock: 'Spis Całościowy Stada Gołębi Dorosłych',
  youngsters: 'Spis Gołębi Młodych (Derby / Zgłoszenie Jesienne)',
};

export interface PigeonCensusEntry {
  ordinalNumber: number;
  ringNumber: string;
  color: string;
  sex: 'cock' | 'hen';
  birthYear: number;
  chipCode: string;
  isDesignatedForGmp: boolean;
  isDesignatedForInter: boolean;
  notes?: string;
}

export interface PreSeasonFlockCensus {
  id: string;
  seasonYear: number;
  censusType: CensusType;
  submissionDate: string; // YYYY-MM-DD
  breederName: string;
  breederPzhgpNumber: string; // np. '0284-1234'
  branchName: string; // np. 'Oddział 0284 Gostyń'
  sectionName: string; // np. 'Sekcja 02 Poniec'
  loftAddress: string;
  loftGpsCoordinates: string; // np. '51°45\'22.1"N 16°52\'10.4"E'
  eskSystemName: string; // np. 'Tauris', 'Benzing', 'Bricon', 'Mega'
  pmvVaccineName: string;
  pmvVaccineLotNumber: string;
  pmvVaccinationDate: string; // YYYY-MM-DD
  vetName: string;
  vetLicenseNumber: string;
  pigeons: PigeonCensusEntry[];
  notes?: string;
}

export interface FlockCensusValidationResult {
  isValid: boolean;
  errors: string[];
  duplicateRings: string[];
  duplicateChips: string[];
}

export interface FlockCensusStats {
  totalPigeons: number;
  cocksCount: number;
  hensCount: number;
  gmpCount: number;
  interCount: number;
  chipsAssignedCount: number;
  chipsMissingCount: number;
  yearDistribution: Record<number, number>;
}

/**
 * Waliduje poprawność urzędowego spisu gołębi przed złożeniem w Oddziale.
 */
export function validateFlockCensus(census: PreSeasonFlockCensus): FlockCensusValidationResult {
  const errors: string[] = [];
  const duplicateRings: string[] = [];
  const duplicateChips: string[] = [];

  if (!census.breederName || census.breederName.trim().length < 3) {
    errors.push('Wymagane jest poprawne imię i nazwisko hodowcy (min. 3 znaki).');
  }

  if (!census.breederPzhgpNumber || census.breederPzhgpNumber.trim().length < 3) {
    errors.push('Wymagany jest oficjalny numer członkowski PZHGP hodowcy.');
  }

  if (!census.branchName || census.branchName.trim().length < 3) {
    errors.push('Wymagana jest nazwa macierzystego Oddziału PZHGP.');
  }

  if (!census.submissionDate) {
    errors.push('Wymagana jest data sporządzenia i złożenia spisu.');
  }

  if (!census.pigeons || census.pigeons.length === 0) {
    errors.push('Spis musi zawierać co najmniej jednego gołębia.');
  }

  // Weryfikacja limitu spisu 50 do GMP
  const gmpPigeonsCount = census.pigeons.filter((p) => p.isDesignatedForGmp).length;
  if (census.censusType === 'gmp_50') {
    if (census.pigeons.length > 50) {
      errors.push(`Spis do GMP nie może liczyć więcej niż 50 ptaków (obecnie: ${census.pigeons.length}).`);
    }
  } else if (gmpPigeonsCount > 50) {
    errors.push(`Liczba wytypowanych do GMP nie może przekraczać 50 ptaków (oznaczono: ${gmpPigeonsCount}).`);
  }

  // Weryfikacja ważności szczepienia PMV-1 (w ciągu 365 dni od daty złożenia)
  if (!census.pmvVaccineName || census.pmvVaccineName.trim().length === 0) {
    errors.push('Wymagana jest nazwa szczepionki przeciwko PMV-1 (np. Colombovac PMV).');
  }

  if (!census.pmvVaccineLotNumber || census.pmvVaccineLotNumber.trim().length === 0) {
    errors.push('Wymagany jest numer serii (LOT) szczepionki PMV-1.');
  }

  if (!census.pmvVaccinationDate) {
    errors.push('Wymagana jest data szczepienia stada przeciwko PMV-1.');
  } else if (census.submissionDate) {
    const subTime = new Date(census.submissionDate).getTime();
    const vaccTime = new Date(census.pmvVaccinationDate).getTime();
    const diffDays = (subTime - vaccTime) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      errors.push('Data szczepienia PMV-1 nie może być późniejsza niż data złożenia spisu.');
    } else if (diffDays > 365) {
      errors.push(`Szczepienie PMV-1 wygasło (${Math.floor(diffDays)} dni temu). Maksymalna ważność to 365 dni.`);
    }
  }

  if (!census.vetName || census.vetName.trim().length < 3) {
    errors.push('Wymagane jest nazwisko Lekarza Weterynarii poświadczającego szczepienie.');
  }

  if (!census.vetLicenseNumber || census.vetLicenseNumber.trim().length < 3) {
    errors.push('Wymagany jest numer prawa wykonywania zawodu (PWZW) Lekarza Weterynarii.');
  }

  // Weryfikacja unikalności obrączek rodowych i chipów ESK
  const seenRings = new Set<string>();
  const seenChips = new Set<string>();

  census.pigeons.forEach((p, index) => {
    const ring = p.ringNumber ? p.ringNumber.trim().toUpperCase() : '';
    if (!ring) {
      errors.push(`Pozycja ${index + 1}: Brak numeru obrączki rodowej.`);
    } else if (seenRings.has(ring)) {
      if (!duplicateRings.includes(ring)) {
        duplicateRings.push(ring);
      }
    } else {
      seenRings.add(ring);
    }

    const chip = p.chipCode ? p.chipCode.trim().toUpperCase() : '';
    if (chip) {
      if (seenChips.has(chip)) {
        if (!duplicateChips.includes(chip)) {
          duplicateChips.push(chip);
        }
      } else {
        seenChips.add(chip);
      }
    }
  });

  if (duplicateRings.length > 0) {
    errors.push(`Wykryto zduplikowane numery obrączek: ${duplicateRings.join(', ')}.`);
  }

  if (duplicateChips.length > 0) {
    errors.push(`Wykryto zduplikowane kody chipów ESK przypisane do wielu ptaków: ${duplicateChips.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    duplicateRings,
    duplicateChips,
  };
}

/**
 * Oblicza statystyki stada zgłoszonego w spisie.
 */
export function calculateCensusStats(census: PreSeasonFlockCensus): FlockCensusStats {
  const pigeons = census.pigeons || [];
  let cocksCount = 0;
  let hensCount = 0;
  let gmpCount = 0;
  let interCount = 0;
  let chipsAssignedCount = 0;
  let chipsMissingCount = 0;
  const yearDistribution: Record<number, number> = {};

  pigeons.forEach((p) => {
    if (p.sex === 'cock') {
      cocksCount++;
    } else {
      hensCount++;
    }

    if (p.isDesignatedForGmp) {
      gmpCount++;
    }

    if (p.isDesignatedForInter) {
      interCount++;
    }

    if (p.chipCode && p.chipCode.trim().length > 0) {
      chipsAssignedCount++;
    } else {
      chipsMissingCount++;
    }

    if (p.birthYear) {
      yearDistribution[p.birthYear] = (yearDistribution[p.birthYear] || 0) + 1;
    }
  });

  return {
    totalPigeons: pigeons.length,
    cocksCount,
    hensCount,
    gmpCount,
    interCount,
    chipsAssignedCount,
    chipsMissingCount,
    yearDistribution,
  };
}

/**
 * Generuje urzędowy dokument A4 HTML Spisu Gołębi PZHGP dla jednego z 3 egzemplarzy.
 */
export function generatePreSeasonFlockCensusHtml(
  census: PreSeasonFlockCensus,
  copyType: 'branch' | 'calc_officer' | 'breeder' = 'branch'
): string {
  const copyLabels: Record<typeof copyType, string> = {
    branch: 'EGZEMPLARZ 1 — ZARZĄD ODDZIAŁU PZHGP (ARCHIWUM KOMISJI LOTOWEJ)',
    calc_officer: 'EGZEMPLARZ 2 — RACHMISTRZ ODDZIAŁOWY (DO SYSTEMU OBLICZENIOWEGO)',
    breeder: 'EGZEMPLARZ 3 — HODOWCA (POTWIERDZENIE ZŁOŻENIA I DOPUSZCZENIA)',
  };

  const copyColors: Record<typeof copyType, string> = {
    branch: '#1e3a8a',
    calc_officer: '#065f46',
    breeder: '#b45309',
  };

  const stats = calculateCensusStats(census);

  const pigeonRows = census.pigeons
    .map(
      (p, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px; text-align: left;">${p.ringNumber}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px;">${p.sex === 'cock' ? '1.0 ♂' : '0.1 ♀'}</td>
        <td style="text-align: left; border: 1px solid #cbd5e1; padding: 4px;">${p.color}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 4px;">${p.birthYear}</td>
        <td style="font-family: monospace; text-align: center; border: 1px solid #cbd5e1; padding: 4px; color: ${p.chipCode ? '#0f172a' : '#94a3b8'};">
          ${p.chipCode || '— BRAK —'}
        </td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px; color: ${p.isDesignatedForGmp ? '#047857' : '#94a3b8'};">
          ${p.isDesignatedForGmp ? 'TAK (GMP)' : '—'}
        </td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 4px; color: ${p.isDesignatedForInter ? '#0284c7' : '#94a3b8'};">
          ${p.isDesignatedForInter ? 'TAK (INT)' : '—'}
        </td>
        <td style="text-align: left; font-size: 8pt; border: 1px solid #cbd5e1; padding: 4px;">${p.notes || ''}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Spis Gołębi PZHGP - ${census.breederName}</title>
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
    .copy-banner {
      background-color: ${copyColors[copyType]};
      color: #ffffff;
      text-align: center;
      padding: 5px;
      font-weight: 800;
      font-size: 8.5pt;
      letter-spacing: 0.5px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .header-table td {
      vertical-align: top;
    }
    .title-box {
      text-align: center;
    }
    .title-main {
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .title-sub {
      font-size: 10pt;
      font-weight: bold;
      color: #334155;
    }
    .info-card {
      border: 1.5px solid #0f172a;
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 8px;
      background-color: #f8fafc;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
    }
    .info-grid td {
      padding: 2px 4px;
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
    .vaccine-box {
      border: 1.5px solid #dc2626;
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 8px;
      background-color: #fef2f2;
    }
    .vaccine-title {
      font-size: 8.5pt;
      font-weight: 900;
      color: #b91c1c;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .pigeons-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 8pt;
    }
    .pigeons-table th {
      background-color: #1e293b;
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
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 6px;
      font-size: 8pt;
      font-weight: bold;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
    }
    .sig-cell {
      width: 33.3%;
      text-align: center;
      vertical-align: top;
      padding: 0 8px;
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

  <div class="copy-banner">${copyLabels[copyType]}</div>

  <table class="header-table">
    <tr>
      <td style="width: 20%; text-align: left;">
        <div style="font-weight: 900; font-size: 9pt; color: #1e3a8a;">POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH</div>
        <div style="font-size: 8pt; color: #475569;">Zarząd Oddziału</div>
      </td>
      <td style="width: 60%; text-align: center;">
        <div class="title-main">URZĘDOWY SPIS GOŁĘBI — SEZON ${census.seasonYear}</div>
        <div class="title-sub">${CENSUS_TYPE_LABELS[census.censusType]}</div>
      </td>
      <td style="width: 20%; text-align: right;">
        <div style="font-size: 8pt; font-weight: bold;">Data spisu:</div>
        <div style="font-size: 9pt; font-weight: 900; color: #0f172a;">${census.submissionDate}</div>
      </td>
    </tr>
  </table>

  <!-- DANE HODOWCY I GOŁĘBNIKA -->
  <div class="info-card">
    <table class="info-grid">
      <tr>
        <td style="width: 15%;" class="label">Hodowca:</td>
        <td style="width: 35%;" class="val">${census.breederName}</td>
        <td style="width: 15%;" class="label">Nr Członkowski:</td>
        <td style="width: 35%;" class="val">${census.breederPzhgpNumber}</td>
      </tr>
      <tr>
        <td class="label">Oddział:</td>
        <td class="val">${census.branchName}</td>
        <td class="label">Sekcja:</td>
        <td class="val">${census.sectionName}</td>
      </tr>
      <tr>
        <td class="label">Adres gołębnika:</td>
        <td class="val">${census.loftAddress || 'Brak danych'}</td>
        <td class="label">Koordynaty GPS:</td>
        <td class="val" style="font-family: monospace;">${census.loftGpsCoordinates || 'Brak'}</td>
      </tr>
      <tr>
        <td class="label">System ESK:</td>
        <td class="val">${census.eskSystemName || 'Zegar Tradycyjny / Mechaniczny'}</td>
        <td class="label">Podsumowanie stada:</td>
        <td class="val">Razem: ${stats.totalPigeons} szt. (♂: ${stats.cocksCount}, ♀: ${stats.hensCount}) | Chipy: ${stats.chipsAssignedCount}/${stats.totalPigeons}</td>
      </tr>
    </table>
  </div>

  <!-- ATESTACJA WETERYNARYJNA PMV-1 -->
  <div class="vaccine-box">
    <div class="vaccine-title">Zaświadczenie Weterynaryjne o Obowiązkowym Szczepieniu PMV-1 (Paramyxowiroza)</div>
    <table class="info-grid">
      <tr>
        <td style="width: 18%;" class="label">Szczepionka / LOT:</td>
        <td style="width: 32%;" class="val">${census.pmvVaccineName} (Seria: ${census.pmvVaccineLotNumber})</td>
        <td style="width: 18%;" class="label">Data szczepienia:</td>
        <td style="width: 32%;" class="val">${census.pmvVaccinationDate} (Ważne do 365 dni)</td>
      </tr>
      <tr>
        <td class="label">Lekarz Weterynarii:</td>
        <td class="val">${census.vetName}</td>
        <td class="label">Nr Prawa Wyk. Zawodu:</td>
        <td class="val">${census.vetLicenseNumber}</td>
      </tr>
    </table>
  </div>

  <!-- TABELA GOŁĘBI -->
  <table class="pigeons-table">
    <thead>
      <tr>
        <th style="width: 4%;">Lp.</th>
        <th style="width: 22%;">Numer Obrączki Rodowej FCI</th>
        <th style="width: 8%;">Płeć</th>
        <th style="width: 14%;">Barwa</th>
        <th style="width: 8%;">Rocznik</th>
        <th style="width: 18%;">Kod Chipa ESK</th>
        <th style="width: 9%;">Seria GMP</th>
        <th style="width: 9%;">Intermistrz.</th>
        <th style="width: 8%;">Uwagi</th>
      </tr>
    </thead>
    <tbody>
      ${pigeonRows}
    </tbody>
  </table>

  <!-- STATYSTYKI STADA -->
  <div class="stats-bar">
    <span>Łącznie zgłoszono: <strong>${stats.totalPigeons}</strong> gołębi</span>
    <span>Typowane do GMP: <strong>${stats.gmpCount}</strong> / 50</span>
    <span>Typowane do Inter: <strong>${stats.interCount}</strong></span>
    <span>Wyposażone w chip ESK: <strong>${stats.chipsAssignedCount}</strong> (Bez chipa: ${stats.chipsMissingCount})</span>
  </div>

  <!-- PODPISY I PIECZĘCIE -->
  <table class="signatures-table">
    <tr>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Podpis Hodowcy</div>
        <div class="sig-desc">Oświadczam, że wszystkie zgłoszone gołębie są moją własnością i przebywają w zgłoszonym gołębniku.</div>
      </td>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Pieczęć i Podpis Lekarza Weterynarii</div>
        <div class="sig-desc">Poświadczam zaszczepienie stada przeciwko PMV-1 zgodnie z kartą rejestracyjną.</div>
      </td>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8pt;">Komisja Weryfikacyjna Oddziału / Sekcji</div>
        <div class="sig-desc">Sprawdzono zgodność z kartami tożsamości, bazą ESK i zatwierdzono do lotów konkursowych.</div>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}
