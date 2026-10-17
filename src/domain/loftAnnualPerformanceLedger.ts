/**
 * PIGEON-FLY — Złota Księga Mistrzów i Roczny Bilans Hodowlano-Sportowy Stada (Loft Annual Performance Ledger)
 * Jubileuszowy moduł Z-100 (DEC-114):
 * - Roczny bilans sportowy: loty, koszowania, konkursy, wydajność lotowa (%), kkm, podia, tytuły mistrzowskie.
 * - Roczny bilans hodowlano-lęgowy: pary, zniesione jaja, zapłodnienie (%), wyklucie (%), odchów D24 (%).
 * - Bilans przeżywalności i dobrostanu stada: stan początkowy, zaobrączkowane, straty lotowe/drapieżniki, stan końcowy, wskaźnik przeżywalności.
 * - Złota Księga Mistrzów (Hall of Fame): wybitne asy rozpłodowe i lotowe stada, linia rodowodowa, rekordy kkm i Coeff.
 * - Ceremonialny A4 Dyplom / Kronika Roczna stada z pieczęcią PZHGP i klasyfikacją medalową (Diamentowy / Złoty / Srebrny / Brązowy Gołębnik).
 */

export type SeasonEvaluationGrade =
  | 'diamond_loft' // Wybitny / Diamentowy Gołębnik (>35% wydajności, tytuły okręgowe/krajowe)
  | 'golden_loft'  // Złoty Gołębnik (>28% wydajności, mistrzostwo oddziału)
  | 'silver_loft'  // Srebrny Gołębnik (>22% wydajności, czołówka oddziału)
  | 'bronze_loft'  // Brązowy Gołębnik (>18% wydajności, stabilne wyniki)
  | 'distinction'; // Wyróżnienie Hodowlane

export const GRADE_LABELS: Record<SeasonEvaluationGrade, string> = {
  diamond_loft: '💎 DIAMENTOWY GOŁĘBNIK ROKU (Klasa Wybitna Krajowa)',
  golden_loft: '🥇 ZŁOTY GOŁĘBNIK ROKU (Klasa Mistrzowska)',
  silver_loft: '🥈 SREBRNY GOŁĘBNIK ROKU (Klasa Wicemistrzowska)',
  bronze_loft: '🥉 BRĄZOWY GOŁĘBNIK ROKU (Klasa Pucharowa)',
  distinction: '🎖️ DYPLOM UZNANIA HODOWLANO-SPORTOWEGO',
};

export type CompetitionLevel = 'section' | 'branch' | 'district' | 'region' | 'national';

export const COMPETITION_LEVEL_LABELS: Record<CompetitionLevel, string> = {
  section: 'Sekcja',
  branch: 'Oddział',
  district: 'Okręg',
  region: 'Region',
  national: 'Kraj (PZHGP / Generalne Mistrzostwo)',
};

export interface ChampionshipAchievement {
  id: string;
  title: string; // np. 'Mistrz Oddziału', 'I Wicemistrz Okręgu', 'Przodownik Polski'
  category: string; // np. 'Kat. A Sprint', 'Kat. B Średnia', 'Kat. C Długa', 'Kat. Maraton', 'GMP', 'Inter'
  level: CompetitionLevel;
  rank: number | string; // np. 1, 2, 3, 'Mistrz'
  competitionPoints?: number;
  concourseCount?: number;
  coefficient?: number;
}

export interface RacingPerformanceKpis {
  totalRaces: number; // Liczba odbytych lotów konkursowych w sezonie
  totalBasketings: number; // Suma gołębiokoszykowań stada
  totalConcourses: number; // Suma zdobytych konkursów
  basketingEfficiencyPct: number; // (totalConcourses / totalBasketings) * 100
  totalConcourseKm: number; // Suma konkursokilometrów
  firstPlaces: number; // 1. miejsca w lotach
  secondPlaces: number; // 2. miejsca w lotach
  thirdPlaces: number; // 3. miejsca w lotach
  topTenPlaces: number; // Miejsca w pierwszej 10-tce
  championships: ChampionshipAchievement[];
}

export interface BreedingPerformanceKpis {
  breedingPairsCount: number; // Liczba zestawionych par lęgowych
  eggsLaidCount: number; // Łączna liczba złożonych jaj
  eggsFertileCount: number; // Liczba jaj zapłodnionych (potwierdzonych prześwietleniem)
  eggsHatchedCount: number; // Liczba wyklutych piskląt
  squabsWeanedD24Count: number; // Liczba odsadzonych młódków (D24 z obrączką rodową)
  fertilityRatePct: number; // (eggsFertileCount / eggsLaidCount) * 100
  hatchabilityRatePct: number; // (eggsHatchedCount / eggsFertileCount) * 100
  weaningRatePct: number; // (squabsWeanedD24Count / eggsHatchedCount) * 100
}

export interface SurvivalWelfareBalance {
  flockCountSeasonStart: number; // Stan stada na początek sezonu (dorosłe)
  youngRingedCount: number; // Młode zaobrączkowane w sezonie
  lossesInRaces: number; // Straty na lotach konkursowych i treningowych
  lossesLoftAndPredators: number; // Straty w gołębniku (drapieżniki, selekcja weterynaryjna)
  flockCountSeasonEnd: number; // Stan stada na koniec sezonu
  survivalRatePct: number; // (flockCountSeasonEnd / (flockCountSeasonStart + youngRingedCount)) * 100
}

export type HallOfFameStatus = 'active_legend' | 'stud_pillar' | 'retired_hero';

export const HALL_OF_FAME_STATUS_LABELS: Record<HallOfFameStatus, string> = {
  active_legend: '⚡ Aktywny As Lotowy (Legenda w locie)',
  stud_pillar: '👑 Filar Rozpłodu (Złota Para / Czołowy Rozpłodowiec)',
  retired_hero: '🏛️ Zasłużony Weteran (Emerytowany As)',
};

export interface HallOfFamePigeon {
  id: string;
  ringNumber: string;
  nameOrNick?: string;
  sex: 'cock' | 'hen';
  plumageColor: string;
  birthYear: number;
  careerConcourses: number;
  careerConcourseKm: number;
  bestCoefficient: number;
  bloodlineLineage: string; // np. 'Janssen / De Klak', 'Gaby Vandenabeele', 'Aarden'
  status: HallOfFameStatus;
  crowningAchievements: string[]; // np. ['1. As Polski Kat. B 2024', '12 konk. / 5200 kkm w 2025']
}

export interface LoftAnnualPerformanceLedger {
  id: string;
  seasonYear: number; // np. 2026
  loftName: string; // np. 'Gołębnik Mistrzowski Szmaragd'
  breederName: string; // np. 'Jan Kowalski'
  breederPzhgpNumber: string; // np. 'PL-0284-9912'
  sectionName: string; // np. 'Sekcja 1 Gostyń'
  branchNumber: string; // np. '0284'
  branchName: string; // np. 'Gostyń'
  districtName: string; // np. 'Okręg Poznań'
  racingKpis: RacingPerformanceKpis;
  breedingKpis: BreedingPerformanceKpis;
  survivalBalance: SurvivalWelfareBalance;
  hallOfFame: HallOfFamePigeon[];
  seasonEvaluationGrade: SeasonEvaluationGrade;
  evaluationRationale: string;
  generationDate: string; // YYYY-MM-DD
  breederSignatureConfirmed: boolean;
  notes?: string;
}

export interface LedgerValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Oblicza wydajność koszowaniową stada (procent zdobytych konkursów).
 */
export function calculateBasketingEfficiency(concourses: number, basketings: number): number {
  if (basketings <= 0) return 0;
  const pct = (concourses / basketings) * 100;
  return Number(pct.toFixed(2));
}

/**
 * Oblicza wskaźniki lęgowe: zapłodnienie, klujność i odchów D24.
 */
export function calculateBreedingMetrics(
  eggsLaid: number,
  eggsFertile: number,
  eggsHatched: number,
  squabsWeaned: number
): {
  fertilityRatePct: number;
  hatchabilityRatePct: number;
  weaningRatePct: number;
} {
  const fertilityRatePct = eggsLaid > 0 ? Number(((eggsFertile / eggsLaid) * 100).toFixed(2)) : 0;
  const hatchabilityRatePct = eggsFertile > 0 ? Number(((eggsHatched / eggsFertile) * 100).toFixed(2)) : 0;
  const weaningRatePct = eggsHatched > 0 ? Number(((squabsWeaned / eggsHatched) * 100).toFixed(2)) : 0;

  return {
    fertilityRatePct,
    hatchabilityRatePct,
    weaningRatePct,
  };
}

/**
 * Oblicza wskaźnik przeżywalności stada w skali całego roku.
 */
export function calculateFlockSurvivalRate(
  startCount: number,
  youngRinged: number,
  endCount: number
): number {
  const totalInSeason = startCount + youngRinged;
  if (totalInSeason <= 0) return 0;
  const rate = (endCount / totalInSeason) * 100;
  return Number(rate.toFixed(2));
}

/**
 * Ustala oficjalną ocenę medalową sezonu na podstawie parametrów sportowych i hodowlanych.
 */
export function evaluateSeasonGrade(
  efficiencyPct: number,
  concoursesCount: number,
  championshipCount: number,
  weaningRatePct: number
): {
  grade: SeasonEvaluationGrade;
  label: string;
  rationale: string;
} {
  if (efficiencyPct >= 35 && championshipCount >= 3 && concoursesCount >= 80) {
    return {
      grade: 'diamond_loft',
      label: GRADE_LABELS.diamond_loft,
      rationale: `Wybitna wydajność stada (${efficiencyPct}%), ${concoursesCount} konkursów oraz ${championshipCount} tytułów mistrzowskich. Poziom ogólnokrajowy.`,
    };
  }

  if (efficiencyPct >= 28 && championshipCount >= 1 && concoursesCount >= 50) {
    return {
      grade: 'golden_loft',
      label: GRADE_LABELS.golden_loft,
      rationale: `Bardzo wysoka wydajność stada (${efficiencyPct}%), zdobyte ${concoursesCount} konkursów oraz tytuły mistrzowskie w oddziale/okręgu.`,
    };
  }

  if (efficiencyPct >= 22 && concoursesCount >= 30) {
    return {
      grade: 'silver_loft',
      label: GRADE_LABELS.silver_loft,
      rationale: `Wysoka wydajność stada (${efficiencyPct}%), solidny dorobek ${concoursesCount} konkursów. Stabilna czołówka rywalizacji.`,
    };
  }

  if (efficiencyPct >= 18 || weaningRatePct >= 90) {
    return {
      grade: 'bronze_loft',
      label: GRADE_LABELS.bronze_loft,
      rationale: `Przyzwoity poziom sportowy (${efficiencyPct}% wydajności) i zdrowy rozwój młodzieży (${weaningRatePct}% odchowu D24).`,
    };
  }

  return {
    grade: 'distinction',
    label: GRADE_LABELS.distinction,
    rationale: `Ukończony pełny roczny cykl hodowlano-lotowy stada z perspektywami dalszego rozwoju genetycznego.`,
  };
}

/**
 * Waliduje poprawność spójności danych rocznego bilansu stada.
 */
export function validateAnnualPerformanceLedger(
  ledger: LoftAnnualPerformanceLedger
): LedgerValidationResult {
  const errors: string[] = [];

  if (!ledger.loftName || ledger.loftName.trim().length === 0) {
    errors.push('Nazwa gołębnika jest wymagana.');
  }

  if (!ledger.breederName || ledger.breederName.trim().length === 0) {
    errors.push('Imię i nazwisko hodowcy są wymagane.');
  }

  if (!ledger.breederPzhgpNumber || ledger.breederPzhgpNumber.trim().length === 0) {
    errors.push('Numer członkowski PZHGP hodowcy jest wymagany.');
  }

  if (ledger.seasonYear < 1900 || ledger.seasonYear > 2100) {
    errors.push('Niepoprawny rok sezonu.');
  }

  // Walidacja danych lotowych
  const racing = ledger.racingKpis;
  if (racing.totalRaces < 0) errors.push('Liczba lotów nie może być ujemna.');
  if (racing.totalBasketings < 0) errors.push('Liczba gołębiokoszykowań nie może być ujemna.');
  if (racing.totalConcourses < 0) errors.push('Liczba konkursów nie może być ujemna.');
  if (racing.totalConcourses > racing.totalBasketings) {
    errors.push('Liczba konkursów nie może przekraczać łącznej liczby koszowań.');
  }

  // Walidacja danych lęgowych
  const breeding = ledger.breedingKpis;
  if (breeding.breedingPairsCount < 0) errors.push('Liczba par lęgowych nie może być ujemna.');
  if (breeding.eggsLaidCount < 0) errors.push('Liczba zniesionych jaj nie może być ujemna.');
  if (breeding.eggsFertileCount > breeding.eggsLaidCount) {
    errors.push('Liczba jaj zapłodnionych nie może przekraczać liczby zniesionych jaj.');
  }
  if (breeding.eggsHatchedCount > breeding.eggsFertileCount) {
    errors.push('Liczba wyklutych piskląt nie może przekraczać liczby zapłodnionych jaj.');
  }
  if (breeding.squabsWeanedD24Count > breeding.eggsHatchedCount) {
    errors.push('Liczba odsadzonych młódków D24 nie może przekraczać liczby wyklutych piskląt.');
  }

  // Walidacja bilansu przeżywalności
  const survival = ledger.survivalBalance;
  if (survival.flockCountSeasonStart < 0) errors.push('Stan początkowy stada nie może być ujemny.');
  if (survival.youngRingedCount < 0) errors.push('Liczba zaobrączkowanych młodych nie może być ujemna.');
  if (survival.lossesInRaces < 0 || survival.lossesLoftAndPredators < 0) {
    errors.push('Wartości strat stada nie mogą być ujemne.');
  }
  if (survival.flockCountSeasonEnd < 0) errors.push('Stan stada na koniec sezonu nie może być ujemny.');

  // Walidacja Złotej Księgi Mistrzów
  if (ledger.hallOfFame && ledger.hallOfFame.length > 0) {
    ledger.hallOfFame.forEach((pigeon, idx) => {
      if (!pigeon.ringNumber || pigeon.ringNumber.trim().length === 0) {
        errors.push(`As #${idx + 1} w Złotej Księdze nie ma podanego numeru obrączki.`);
      }
      if (pigeon.careerConcourses < 0) {
        errors.push(`As ${pigeon.ringNumber} ma ujemną liczbę konkursów kariery.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generator uroczystego, jubileuszowego A4 Dyplomu i Kroniki Rocznej Stada (HTML / PDF).
 */
export function generateLoftAnnualPerformanceLedgerHtml(
  ledger: LoftAnnualPerformanceLedger
): string {
  const racing = ledger.racingKpis;
  const breeding = ledger.breedingKpis;
  const survival = ledger.survivalBalance;

  const championshipsRows = racing.championships.length > 0
    ? racing.championships.map((champ, idx) => `
      <tr class="${idx % 2 === 0 ? 'even-row' : ''}">
        <td style="font-weight: bold; color: #b8860b;">${champ.rank}.</td>
        <td style="font-weight: 600;">${champ.title}</td>
        <td>${champ.category}</td>
        <td>${COMPETITION_LEVEL_LABELS[champ.level]}</td>
        <td style="text-align: right; font-family: monospace;">${champ.concourseCount ?? '-'}</td>
        <td style="text-align: right; font-family: monospace;">${champ.coefficient ? champ.coefficient.toFixed(2) : '-'}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="6" style="text-align: center; color: #777; font-style: italic;">Brak zarejestrowanych oficjalnych tytułów mistrzowskich</td></tr>`;

  const hallOfFameCards = ledger.hallOfFame.length > 0
    ? ledger.hallOfFame.map((pigeon) => `
      <div class="fame-card">
        <div class="fame-header">
          <span class="fame-ring">${pigeon.ringNumber}</span>
          ${pigeon.nameOrNick ? `<span class="fame-nick">"${pigeon.nameOrNick}"</span>` : ''}
          <span class="fame-sex">${pigeon.sex === 'cock' ? '1.0 ♂' : '0.1 ♀'} (${pigeon.birthYear})</span>
        </div>
        <div class="fame-meta">
          <strong>Linia:</strong> ${pigeon.bloodlineLineage} | <strong>Ubarwienie:</strong> ${pigeon.plumageColor}
        </div>
        <div class="fame-stats">
          <div class="fame-stat-box">
            <span class="num">${pigeon.careerConcourses}</span>
            <span class="lbl">Konkursów w karierze</span>
          </div>
          <div class="fame-stat-box">
            <span class="num">${pigeon.careerConcourseKm.toLocaleString('pl-PL')} km</span>
            <span class="lbl">Konkursokilometrów</span>
          </div>
          <div class="fame-stat-box">
            <span class="num">${pigeon.bestCoefficient.toFixed(2)}</span>
            <span class="lbl">Top Coeff</span>
          </div>
        </div>
        <div class="fame-status">
          <strong>Status:</strong> ${HALL_OF_FAME_STATUS_LABELS[pigeon.status]}
        </div>
        ${pigeon.crowningAchievements.length > 0 ? `
          <ul class="fame-achievements">
            ${pigeon.crowningAchievements.map((ach) => `<li>🏆 ${ach}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')
    : `<div style="text-align: center; color: #777; padding: 20px; font-style: italic;">Brak wpisów w Złotej Księdze na ten sezon.</div>`;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Złota Księga Mistrzów — Roczny Bilans Hodowlano-Sportowy Stada (${ledger.seasonYear})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background-color: #faf8f5;
      color: #1a1a1a;
      margin: 0;
      padding: 16px;
      line-height: 1.4;
    }
    .diploma-border {
      border: 6px double #c59b27;
      padding: 18px;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      position: relative;
    }
    .header-box {
      text-align: center;
      border-bottom: 2px solid #e2c974;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .federation-title {
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 2px;
      color: #555;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .main-title {
      font-size: 20pt;
      font-weight: 900;
      color: #8c6d1f;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 4px 0;
    }
    .sub-title {
      font-size: 13pt;
      color: #333;
      font-style: italic;
      margin-bottom: 8px;
    }
    .loft-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: #fdfaf2;
      border: 1px solid #ebd999;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 10pt;
    }
    .loft-info-item strong {
      color: #8c6d1f;
    }
    .grade-banner {
      background: linear-gradient(135deg, #f7ecd2 0%, #fff8e7 100%);
      border: 2px solid #d4af37;
      border-radius: 6px;
      padding: 10px 16px;
      text-align: center;
      margin-bottom: 16px;
    }
    .grade-title {
      font-size: 14pt;
      font-weight: 900;
      color: #996515;
      margin-bottom: 4px;
    }
    .grade-desc {
      font-size: 10pt;
      color: #444;
      font-style: italic;
    }
    .kpi-section-title {
      font-size: 12pt;
      font-weight: 800;
      color: #8c6d1f;
      border-bottom: 1.5px solid #d4af37;
      padding-bottom: 3px;
      margin-top: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-box {
      background: #faf7f0;
      border: 1px solid #e5d5a8;
      border-radius: 5px;
      padding: 8px;
      text-align: center;
    }
    .kpi-box .val {
      font-size: 15pt;
      font-weight: 900;
      color: #1a1a1a;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    .kpi-box .lbl {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      margin-top: 2px;
      font-weight: 600;
    }
    .podium-row {
      display: flex;
      justify-content: space-around;
      background: #fffcee;
      border: 1px dashed #d4af37;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 10pt;
    }
    .podium-item {
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 14px;
    }
    th {
      background-color: #f2e6c4;
      color: #594200;
      border: 1px solid #d4af37;
      padding: 5px 8px;
      text-align: left;
      font-weight: 700;
    }
    td {
      border: 1px solid #ebd999;
      padding: 5px 8px;
    }
    .even-row {
      background-color: #fcf9f2;
    }
    .fame-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }
    .fame-card {
      background: #fdfcf7;
      border: 1.5px solid #d4af37;
      border-radius: 6px;
      padding: 10px;
    }
    .fame-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid #e8dbb0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .fame-ring {
      font-size: 11pt;
      font-weight: 900;
      color: #8c6d1f;
      font-family: monospace;
    }
    .fame-nick {
      font-size: 10pt;
      font-weight: 700;
      font-style: italic;
      color: #333;
    }
    .fame-sex {
      font-size: 9pt;
      color: #555;
    }
    .fame-meta {
      font-size: 8.5pt;
      color: #444;
      margin-bottom: 6px;
    }
    .fame-stats {
      display: flex;
      justify-content: space-between;
      background: #faf4e3;
      border-radius: 4px;
      padding: 4px 6px;
      margin-bottom: 6px;
    }
    .fame-stat-box {
      text-align: center;
    }
    .fame-stat-box .num {
      font-size: 10pt;
      font-weight: 800;
      color: #1a1a1a;
      display: block;
    }
    .fame-stat-box .lbl {
      font-size: 7pt;
      color: #777;
      text-transform: uppercase;
    }
    .fame-status {
      font-size: 8pt;
      color: #8c6d1f;
      margin-bottom: 4px;
    }
    .fame-achievements {
      margin: 4px 0 0 16px;
      padding: 0;
      font-size: 8pt;
      color: #2e7d32;
    }
    .signatures-section {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #d4af37;
    }
    .signature-block {
      text-align: center;
      width: 28%;
    }
    .signature-line {
      border-bottom: 1px dotted #888;
      height: 35px;
      margin-bottom: 4px;
    }
    .signature-title {
      font-size: 8pt;
      color: #555;
      text-transform: uppercase;
      font-weight: 700;
    }
    .footer-stamp {
      text-align: center;
      margin-top: 16px;
      font-size: 8pt;
      color: #888;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div class="diploma-border">
    <div class="header-box">
      <div class="federation-title">Polski Związek Hodowców Gołębi Pocztowych</div>
      <div class="main-title">Złota Księga Mistrzów</div>
      <div class="sub-title">Roczny Bilans Hodowlano-Sportowy Stada — Sezon ${ledger.seasonYear}</div>
    </div>

    <div class="loft-info-grid">
      <div class="loft-info-item"><strong>Gołębnik:</strong> ${ledger.loftName}</div>
      <div class="loft-info-item"><strong>Hodowca:</strong> ${ledger.breederName} (Nr ${ledger.breederPzhgpNumber})</div>
      <div class="loft-info-item"><strong>Struktura PZHGP:</strong> ${ledger.sectionName}, Oddział ${ledger.branchNumber} ${ledger.branchName}</div>
      <div class="loft-info-item"><strong>Okręg:</strong> ${ledger.districtName} | <strong>Data bilansu:</strong> ${ledger.generationDate}</div>
    </div>

    <div class="grade-banner">
      <div class="grade-title">${GRADE_LABELS[ledger.seasonEvaluationGrade]}</div>
      <div class="grade-desc">${ledger.evaluationRationale}</div>
    </div>

    <!-- 1. BILANS SPORTOWY -->
    <div class="kpi-section-title">1. Wyniki Sportowo-Lotowe Sezonu ${ledger.seasonYear}</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="val">${racing.totalRaces}</div>
        <div class="lbl">Loty w sezonie</div>
      </div>
      <div class="kpi-box">
        <div class="val">${racing.totalBasketings}</div>
        <div class="lbl">Gołębiokoszowań</div>
      </div>
      <div class="kpi-box">
        <div class="val">${racing.totalConcourses}</div>
        <div class="lbl">Zdobytych konkursów</div>
      </div>
      <div class="kpi-box">
        <div class="val" style="color: #b8860b;">${racing.basketingEfficiencyPct.toFixed(2)}%</div>
        <div class="lbl">Wydajność stada</div>
      </div>
    </div>

    <div class="podium-row">
      <div class="podium-item" style="color: #d4af37;">🥇 1. miejsca: <strong>${racing.firstPlaces}</strong></div>
      <div class="podium-item" style="color: #8c8c8c;">🥈 2. miejsca: <strong>${racing.secondPlaces}</strong></div>
      <div class="podium-item" style="color: #cd7f32;">🥉 3. miejsca: <strong>${racing.thirdPlaces}</strong></div>
      <div class="podium-item" style="color: #2e7d32;">🎯 Top 10 w lotach: <strong>${racing.topTenPlaces}</strong></div>
      <div class="podium-item">🏁 Łącznie kkm: <strong>${racing.totalConcourseKm.toLocaleString('pl-PL')}</strong></div>
    </div>

    <div style="font-weight: 700; font-size: 9.5pt; color: #555; margin-bottom: 4px;">🏆 Tytuły Mistrzowskie i Osiągnięcia Zespołowe:</div>
    <table>
      <thead>
        <tr>
          <th style="width: 8%;">Lokata</th>
          <th style="width: 32%;">Tytuł Mistrzowski</th>
          <th style="width: 25%;">Kategoria</th>
          <th style="width: 15%;">Szczebel</th>
          <th style="width: 10%; text-align: right;">Konkursy</th>
          <th style="width: 10%; text-align: right;">Coeff.</th>
        </tr>
      </thead>
      <tbody>
        ${championshipsRows}
      </tbody>
    </table>

    <!-- 2. BILANS HODOWLANO-LĘGOWY -->
    <div class="kpi-section-title">2. Bilans Rozpłodowo-Lęgowy Stada</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="val">${breeding.breedingPairsCount}</div>
        <div class="lbl">Par lęgowych</div>
      </div>
      <div class="kpi-box">
        <div class="val">${breeding.eggsLaidCount}</div>
        <div class="lbl">Zniesionych jaj</div>
      </div>
      <div class="kpi-box">
        <div class="val" style="color: #2e7d32;">${breeding.fertilityRatePct.toFixed(1)}%</div>
        <div class="lbl">Zapłodnienie jaj (${breeding.eggsFertileCount})</div>
      </div>
      <div class="kpi-box">
        <div class="val" style="color: #b8860b;">${breeding.weaningRatePct.toFixed(1)}%</div>
        <div class="lbl">Odchów D24 (${breeding.squabsWeanedD24Count} szt.)</div>
      </div>
    </div>

    <!-- 3. BILANS PRZEŻYWALNOŚCI I DOBROSTANU -->
    <div class="kpi-section-title">3. Bilans Przeżywalności i Stanu Stada</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="val">${survival.flockCountSeasonStart}</div>
        <div class="lbl">Stan wiosenny</div>
      </div>
      <div class="kpi-box">
        <div class="val">${survival.youngRingedCount}</div>
        <div class="lbl">Zaobrączkowane</div>
      </div>
      <div class="kpi-box">
        <div class="val" style="color: #c62828;">${survival.lossesInRaces + survival.lossesLoftAndPredators}</div>
        <div class="lbl">Straty łączne (loty+drap.)</div>
      </div>
      <div class="kpi-box">
        <div class="val" style="color: #2e7d32;">${survival.survivalRatePct.toFixed(1)}%</div>
        <div class="lbl">Przeżywalność stada (${survival.flockCountSeasonEnd} szt.)</div>
      </div>
    </div>

    <!-- 4. ZŁOTA KSIĘGA MISTRZÓW (HALL OF FAME) -->
    <div class="kpi-section-title">4. Złota Księga Mistrzów — Panteon Wybitnych Asów</div>
    <div class="fame-grid">
      ${hallOfFameCards}
    </div>

    <!-- PODPISY -->
    <div class="signatures-section">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-title">Podpis Właściciela Stada</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-title">Zarząd Sekcji PZHGP</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-title">Prezes Oddziału / Okręgu</div>
      </div>
    </div>

    <div class="footer-stamp">
      Dokument wygenerowany w systemie PIGEON-FLY — Urzędowa ewidencja wyników sportowo-hodowlanych stada gołębi pocztowych.
    </div>
  </div>
</body>
</html>`;
}
