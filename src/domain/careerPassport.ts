/**
 * PIGEON-FLY — Lifetime Concourse Career Passport & Sport Archive Engine (Z-079 / DEC-93)
 * Full career history, lifetime kkm, prize efficiency, regularity index, and FCI Exhibition Passport generation.
 * Complies with PZHGP / FCI National Exhibition rules (Klasa Sport / Wyczyn) and international auction pedigree standards.
 */

export interface ConcourseRecord {
  id: string;
  year: number;
  raceDate: string; // YYYY-MM-DD
  raceName: string; // np. "Magdeburg I"
  releaseLocation: string; // np. "Magdeburg (Niemcy)"
  distanceKm: number;
  basketedCount: number; // Liczba gołębi na liście
  concoursePosition: number; // Zdobyta lokata
  fciCoefficient: number; // (position / basketed) * 1000
  pzhgpPoints?: number; // Punkty oddziałowe/okręgowe
  speedMPerMin: number; // Prędkość przelotowa w m/min
  concourseBase: 20 | 25 | 33; // Baza konkursowa (standard PZHGP = 20%)
  category: 'A' | 'B' | 'C' | 'M' | 'general';
}

export interface CareerDistanceBreakdown {
  shortSprintKm: number; // < 300 km (Kat. A)
  shortSprintPrizes: number;
  middleDistanceKm: number; // 300 - 500 km (Kat. B)
  middleDistancePrizes: number;
  longDistanceKm: number; // 500 - 700 km (Kat. C)
  longDistancePrizes: number;
  marathonKm: number; // > 700 km (Kat. M)
  marathonPrizes: number;
}

export interface CareerPassportAnalytics {
  ringNumber: string;
  pigeonName?: string;
  strain?: string; // Linia hodowlana (np. "Janssen / Koopman")
  sex: 'cock' | 'hen';
  birthYear: number;
  color?: string;
  totalBasketingCount: number;
  totalPrizesWon: number;
  prizeEfficiencyPercent: number; // (prizes / basketings) * 100
  totalConcourseKm: number; // Łącznie kkm
  bestPosition: number;
  firstPrizeCount: number;
  topTenCount: number;
  bestCoefficient: number;
  averageCoefficient: number;
  averageSpeedMPerMin: number;
  regularityIndex: number; // Średnia względna pozycja w procencie listy (np. 4.2% oznacza, że ptak ląduje średnio w top 4% włożonych ptaków)
  distanceBreakdown: CareerDistanceBreakdown;
  recordsByYear: Record<number, ConcourseRecord[]>;
  fciExhibitionEligibility: {
    sportA: boolean; // Sprint 100-400km (min 10 conc, 1500 kkm)
    sportB: boolean; // Średni 300-600km (min 8 conc, 2800 kkm)
    sportC: boolean; // Daleki >500km (min 6 conc, 3300 kkm)
    sportM: boolean; // Maraton >700km (min 2 conc, 1400 kkm)
    wyczyn: boolean; // Całokształt (min 18 conc, 6000 kkm)
  };
}

export interface CareerPassportInput {
  ringNumber: string;
  pigeonName?: string;
  strain?: string;
  sex: 'cock' | 'hen';
  birthYear: number;
  color?: string;
  totalBasketingCount?: number;
  records: ConcourseRecord[];
}

/**
 * Calculates complete career passport analytics from flight concourse history.
 */
export function calculateCareerPassport(input: CareerPassportInput): CareerPassportAnalytics {
  const records = input.records || [];
  const totalPrizesWon = records.length;
  const totalBasketing = Math.max(totalPrizesWon, input.totalBasketingCount ?? totalPrizesWon);

  const prizeEfficiencyPercent =
    totalBasketing > 0 ? Math.round((totalPrizesWon / totalBasketing) * 1000) / 10 : 0;

  let totalKm = 0;
  let firstPrizes = 0;
  let topTen = 0;
  let minCoeff = records.length > 0 ? records[0].fciCoefficient : 0;
  let coeffSum = 0;
  let speedSum = 0;
  let relativePosSum = 0;
  let bestPos = records.length > 0 ? records[0].concoursePosition : 0;

  const breakdown: CareerDistanceBreakdown = {
    shortSprintKm: 0,
    shortSprintPrizes: 0,
    middleDistanceKm: 0,
    middleDistancePrizes: 0,
    longDistanceKm: 0,
    longDistancePrizes: 0,
    marathonKm: 0,
    marathonPrizes: 0,
  };

  const recordsByYear: Record<number, ConcourseRecord[]> = {};

  records.forEach((r) => {
    totalKm += r.distanceKm;
    if (r.concoursePosition === 1) firstPrizes += 1;
    if (r.concoursePosition <= 10) topTen += 1;
    if (bestPos === 0 || r.concoursePosition < bestPos) bestPos = r.concoursePosition;

    if (r.fciCoefficient < minCoeff) minCoeff = r.fciCoefficient;
    coeffSum += r.fciCoefficient;
    speedSum += r.speedMPerMin;

    const relativePosPct = (r.concoursePosition / Math.max(1, r.basketedCount)) * 100;
    relativePosSum += relativePosPct;

    // Distance categorization
    if (r.distanceKm < 300) {
      breakdown.shortSprintKm += r.distanceKm;
      breakdown.shortSprintPrizes += 1;
    } else if (r.distanceKm <= 500) {
      breakdown.middleDistanceKm += r.distanceKm;
      breakdown.middleDistancePrizes += 1;
    } else if (r.distanceKm <= 700) {
      breakdown.longDistanceKm += r.distanceKm;
      breakdown.longDistancePrizes += 1;
    } else {
      breakdown.marathonKm += r.distanceKm;
      breakdown.marathonPrizes += 1;
    }

    if (!recordsByYear[r.year]) {
      recordsByYear[r.year] = [];
    }
    recordsByYear[r.year].push(r);
  });

  const totalConcourseKm = Math.round(totalKm * 10) / 10;
  const averageCoefficient =
    totalPrizesWon > 0 ? Math.round((coeffSum / totalPrizesWon) * 1000) / 1000 : 0;
  const averageSpeedMPerMin =
    totalPrizesWon > 0 ? Math.round((speedSum / totalPrizesWon) * 10) / 10 : 0;
  const regularityIndex =
    totalPrizesWon > 0 ? Math.round((relativePosSum / totalPrizesWon) * 100) / 100 : 0;

  // FCI Exhibition eligibility
  const prizesA = records.filter((r) => r.distanceKm >= 100 && r.distanceKm < 400);
  const kkmA = prizesA.reduce((sum, r) => sum + r.distanceKm, 0);

  const prizesB = records.filter((r) => r.distanceKm >= 300 && r.distanceKm <= 600);
  const kkmB = prizesB.reduce((sum, r) => sum + r.distanceKm, 0);

  const prizesC = records.filter((r) => r.distanceKm > 500);
  const kkmC = prizesC.reduce((sum, r) => sum + r.distanceKm, 0);

  const prizesM = records.filter((r) => r.distanceKm >= 700);
  const kkmM = prizesM.reduce((sum, r) => sum + r.distanceKm, 0);

  return {
    ringNumber: input.ringNumber,
    pigeonName: input.pigeonName,
    strain: input.strain,
    sex: input.sex,
    birthYear: input.birthYear,
    color: input.color,
    totalBasketingCount: totalBasketing,
    totalPrizesWon,
    prizeEfficiencyPercent,
    totalConcourseKm,
    bestPosition: bestPos,
    firstPrizeCount: firstPrizes,
    topTenCount: topTen,
    bestCoefficient: minCoeff,
    averageCoefficient,
    averageSpeedMPerMin,
    regularityIndex,
    distanceBreakdown: {
      shortSprintKm: Math.round(breakdown.shortSprintKm * 10) / 10,
      shortSprintPrizes: breakdown.shortSprintPrizes,
      middleDistanceKm: Math.round(breakdown.middleDistanceKm * 10) / 10,
      middleDistancePrizes: breakdown.middleDistancePrizes,
      longDistanceKm: Math.round(breakdown.longDistanceKm * 10) / 10,
      longDistancePrizes: breakdown.longDistancePrizes,
      marathonKm: Math.round(breakdown.marathonKm * 10) / 10,
      marathonPrizes: breakdown.marathonPrizes,
    },
    recordsByYear,
    fciExhibitionEligibility: {
      sportA: prizesA.length >= 10 && kkmA >= 1500,
      sportB: prizesB.length >= 8 && kkmB >= 2800,
      sportC: prizesC.length >= 6 && kkmC >= 3300,
      sportM: prizesM.length >= 2 && kkmM >= 1400,
      wyczyn: totalPrizesWon >= 18 && totalConcourseKm >= 6000,
    },
  };
}

/**
 * Generates official A4 Sport Career Passport HTML.
 */
export function generateCareerPassportHtml(
  analytics: CareerPassportAnalytics,
  meta?: {
    loftName?: string;
    breederName?: string;
    branchName?: string;
  }
): string {
  const loft = meta?.loftName || 'Gołębnik Mistrza Pigeon-Fly';
  const breeder = meta?.breederName || 'Łukasz';
  const branch = meta?.branchName || 'Oddział 0284 Gostyń PZHGP';

  const years = Object.keys(analytics.recordsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  let flightRowsHtml = '';

  years.forEach((yr) => {
    const list = analytics.recordsByYear[yr];
    flightRowsHtml += `
      <tr style="background: #e2e8f0;">
        <td colspan="9" style="font-weight: 800; font-size: 9pt; padding: 4px 6px; text-transform: uppercase;">
          Sezon Lotowy ${yr} — Liczba konkursów: ${list.length} | KKM: ${list.reduce((sum, r) => sum + r.distanceKm, 0).toFixed(1)} km
        </td>
      </tr>
    `;
    list.forEach((r, idx) => {
      flightRowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
          <td>${r.raceDate}</td>
          <td style="font-weight: 700;">${r.raceName}</td>
          <td style="text-align: right;">${r.distanceKm.toFixed(1)} km</td>
          <td style="text-align: center;">${r.concoursePosition} / ${r.basketedCount}</td>
          <td style="text-align: right; font-weight: bold; color: #1e3a8a;">${r.fciCoefficient.toFixed(3)}</td>
          <td style="text-align: right;">${r.speedMPerMin.toFixed(2)} m/min</td>
          <td style="text-align: right;">${r.pzhgpPoints ? r.pzhgpPoints.toFixed(2) : '—'}</td>
          <td style="text-align: center; font-weight: 700; color: #047857;">${r.category}</td>
        </tr>
      `;
    });
  });

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Paszport Sportowy Lotnika — ${analytics.ringNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.3;
      font-size: 9pt;
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
    .title { font-size: 15pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 9.5pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8.5pt; text-align: right; color: #334155; }
    .bird-box {
      border: 1.5px solid #0284c7;
      border-radius: 6px;
      background: #f0f9ff;
      padding: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .bird-ring { font-size: 16pt; font-weight: 900; color: #0369a1; }
    .bird-details { font-size: 9pt; color: #0f172a; margin-top: 2px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px 8px;
      background: #f8fafc;
    }
    .kpi-title { font-size: 7.5pt; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .kpi-val { font-size: 12pt; font-weight: 800; color: #0f172a; margin-top: 2px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 8pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      vertical-align: middle;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      text-align: left;
      font-size: 7.5pt;
      text-transform: uppercase;
      color: #334155;
    }
    .footer {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
    .sign-box {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
    }
    .sign-line {
      width: 170px;
      border-top: 1px dashed #94a3b8;
      text-align: center;
      font-size: 7.5pt;
      padding-top: 4px;
      color: #475569;
    }
    .badges-row {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .badge-pill {
      font-size: 8pt;
      font-weight: 800;
      padding: 3px 6px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
    }
    .badge-active {
      background: #ecfdf5;
      border-color: #10b981;
      color: #047857;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Oficjalny Paszport Sportowy Lotnika</div>
      <div class="subtitle">Księga Lotów Konkursowych i Dorobek Olimpijski FCI (Z-079)</div>
    </div>
    <div class="meta">
      <div><strong>${loft}</strong></div>
      <div>Hodowca: ${breeder}</div>
      <div>${branch}</div>
    </div>
  </div>

  <div class="bird-box">
    <div>
      <div class="bird-ring">${analytics.ringNumber}${analytics.pigeonName ? ` — "${analytics.pigeonName}"` : ''}</div>
      <div class="bird-details">
        Płeć: <strong>${analytics.sex === 'cock' ? 'Samiec 1.0' : 'Samica 0.1'}</strong> • Rocznik: <strong>${analytics.birthYear}</strong> • Barwa: <strong>${analytics.color || 'Niebieska'}</strong> • Szczep: <strong>${analytics.strain || 'Olimpijski'}</strong>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12pt; font-weight: 900; color: #0284c7;">${analytics.totalPrizesWon} k.</div>
      <div style="font-size: 8pt; color: #475569;">${analytics.totalConcourseKm.toFixed(1)} kkm</div>
    </div>
  </div>

  <div class="badges-row">
    <div class="badge-pill ${analytics.fciExhibitionEligibility.sportA ? 'badge-active' : ''}">
      Kat. A (Sprint): ${analytics.fciExhibitionEligibility.sportA ? '✓ ZAKWALIFIKOWANY' : 'Brak'}
    </div>
    <div class="badge-pill ${analytics.fciExhibitionEligibility.sportB ? 'badge-active' : ''}">
      Kat. B (Średni): ${analytics.fciExhibitionEligibility.sportB ? '✓ ZAKWALIFIKOWANY' : 'Brak'}
    </div>
    <div class="badge-pill ${analytics.fciExhibitionEligibility.sportC ? 'badge-active' : ''}">
      Kat. C (Daleki): ${analytics.fciExhibitionEligibility.sportC ? '✓ ZAKWALIFIKOWANY' : 'Brak'}
    </div>
    <div class="badge-pill ${analytics.fciExhibitionEligibility.sportM ? 'badge-active' : ''}">
      Kat. M (Maraton): ${analytics.fciExhibitionEligibility.sportM ? '✓ ZAKWALIFIKOWANY' : 'Brak'}
    </div>
    <div class="badge-pill ${analytics.fciExhibitionEligibility.wyczyn ? 'badge-active' : ''}">
      Kat. Wyczyn: ${analytics.fciExhibitionEligibility.wyczyn ? '✓ WYCZYNOWIEC POLSKI' : 'Brak'}
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Konkursy / Włożenia</div>
      <div class="kpi-val">${analytics.totalPrizesWon} / ${analytics.totalBasketingCount} (${analytics.prizeEfficiencyPercent}%)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Łącznie KKM</div>
      <div class="kpi-val">${analytics.totalConcourseKm.toFixed(1)} km</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Najlepszy Coeff</div>
      <div class="kpi-val" style="color: #0369a1;">${analytics.bestCoefficient.toFixed(3)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">1. Miejsca / Top 10</div>
      <div class="kpi-val">${analytics.firstPrizeCount} / ${analytics.topTenCount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 20px; text-align: center;">Lp</th>
        <th>Data</th>
        <th>Miejscowość Lotu</th>
        <th style="text-align: right;">Dystans</th>
        <th style="text-align: center;">Lokata / Baza</th>
        <th style="text-align: right;">Coeff FCI</th>
        <th style="text-align: right;">Prędkość</th>
        <th style="text-align: right;">Punkty</th>
        <th style="text-align: center;">Kat</th>
      </tr>
    </thead>
    <tbody>
      ${flightRowsHtml}
    </tbody>
  </table>

  <div class="sign-box">
    <div class="sign-line">Podpis Właściciela</div>
    <div class="sign-line">Prezes ds. Lotowych Oddziału</div>
    <div class="sign-line">Przewodniczący Komisji Obliczeniowej</div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Oficjalny Paszport Sportowy Lotnika PZHGP/FCI • Z-079</div>
    <div>Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
