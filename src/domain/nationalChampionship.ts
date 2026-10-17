/**
 * PIGEON-FLY — National Championship Calculator & Ace Ranking Engine (Z-075 / DEC-89)
 * Official PZHGP & FCI Championship Algorithms:
 * 1. Generalne Mistrzostwo Polski (GMP): Nominated series (e.g. 5/3), category point scales (A: 40-20, B: 60-30, C: 80-40, M: 100-50).
 * 2. Intermistrzostwo: 3 from 5 designated pigeons on flights > 285 km, ordered by lowest Coeff sum.
 * 3. As Lotowy (Ace Pigeons): Multi-category rankings (Category A, B, C, M, Yearlings, All-rounders) with kkm and Coeff.
 */

import { calculateFciCoefficient, calculateConcourseLimit } from './concourse';

export type FlightCategory = 'A' | 'B' | 'C' | 'M';

export interface RaceFlightRecord {
  flightId: string;
  flightName: string;
  flightDate: string; // YYYY-MM-DD
  distanceKm: number;
  category: FlightCategory;
  totalBasketedPigeons: number; // Całość w oddziale/strefie
  prizeBasePercent?: 20 | 25 | 33; // Domyślnie 20%
}

export interface PigeonArrivalRecord {
  pigeonId: string;
  ringNumber: string;
  isYearling?: boolean;
  sex: 'cock' | 'hen';
  flightId: string;
  positionInConcourse: number; // Pozycja na liście konkursowej (np. 1..N)
  isNominatedSeries: boolean; // Czy wytypowany do serii GMP / Intermistrzostwo
}

export interface GmpFlightResult {
  flightId: string;
  flightName: string;
  category: FlightCategory;
  distanceKm: number;
  prizeLimit: number;
  countedPigeons: {
    ringNumber: string;
    position: number;
    gmpPoints: number;
    fciCoeff: number;
  }[];
  totalFlightGmpPoints: number;
  totalFlightCoeff: number;
}

export interface GmpChampionshipSummary {
  loftName: string;
  breederName: string;
  seasonYear: number;
  totalChampionshipPoints: number;
  totalPrizesCount: number;
  totalConcourseKm: number;
  averageCoeff: number;
  flights: GmpFlightResult[];
}

export interface InterChampionshipSummary {
  loftName: string;
  seasonYear: number;
  totalNominatedPrizes: number;
  totalCoeffSum: number;
  flightsCount: number;
  qualifies: boolean; // Wymóg min. 3 konkursów z 3 lotów
}

export interface AceRankingItem {
  rank: number;
  pigeonId: string;
  ringNumber: string;
  sex: 'cock' | 'hen';
  isYearling: boolean;
  totalPrizes: number;
  totalConcourseKm: number;
  totalGmpPoints: number;
  totalCoeff: number;
  categoryBadges: string[];
}

/**
 * Returns PZHGP official GMP point scale limits for a given distance category.
 */
export function getGmpScaleForCategory(category: FlightCategory): { maxPoints: number; minPoints: number } {
  switch (category) {
    case 'A':
      return { maxPoints: 40.0, minPoints: 20.0 };
    case 'B':
      return { maxPoints: 60.0, minPoints: 30.0 };
    case 'C':
      return { maxPoints: 80.0, minPoints: 40.0 };
    case 'M':
      return { maxPoints: 100.0, minPoints: 50.0 };
    default:
      return { maxPoints: 40.0, minPoints: 20.0 };
  }
}

/**
 * Determines flight distance category (A, B, C, M) according to PZHGP regulations.
 */
export function determineFlightCategory(distanceKm: number): FlightCategory {
  if (distanceKm >= 700) {
    return 'M'; // Maraton
  }
  if (distanceKm >= 500) {
    return 'C'; // Długi dystans
  }
  if (distanceKm >= 300) {
    return 'B'; // Średni dystans
  }
  return 'A'; // Krótki dystans / sprint
}

/**
 * Calculates GMP points for a single pigeon according to official PZHGP formula.
 */
export function calculateGmpPointsForPosition(
  position: number,
  prizeLimit: number,
  category: FlightCategory
): number {
  if (position <= 0 || prizeLimit <= 0 || position > prizeLimit) {
    return 0.0;
  }
  const { maxPoints, minPoints } = getGmpScaleForCategory(category);
  if (prizeLimit === 1) {
    return maxPoints;
  }
  const pts = maxPoints - ((maxPoints - minPoints) * (position - 1)) / (prizeLimit - 1);
  return Math.round(pts * 100) / 100;
}

/**
 * Evaluates full Generalne Mistrzostwo Polski (GMP) for a season across all races.
 * Takes up to `maxCountedPerFlight` (standard: 3) best nominated pigeons per flight.
 */
export function calculateGmpChampionship(params: {
  loftName?: string;
  breederName?: string;
  seasonYear?: number;
  flights: RaceFlightRecord[];
  arrivals: PigeonArrivalRecord[];
  maxCountedPerFlight?: number; // Domyślnie 3 z 5
}): GmpChampionshipSummary {
  const {
    loftName = 'Gołębnik Mistrza Pigeon-Fly',
    breederName = 'Hodowca Pigeon-Fly',
    seasonYear = new Date().getFullYear(),
    flights,
    arrivals,
    maxCountedPerFlight = 3,
  } = params;

  let grandTotalPoints = 0;
  let grandTotalPrizes = 0;
  let grandTotalKm = 0;
  let sumCoeffAll = 0;

  const flightResults: GmpFlightResult[] = [];

  for (const flight of flights) {
    const concourse = calculateConcourseLimit(flight.totalBasketedPigeons, flight.prizeBasePercent || 20);
    const flightArrivals = arrivals.filter((a) => a.flightId === flight.flightId);

    // Filter only nominated birds that earned a prize in base
    const prizeNominated = flightArrivals
      .filter((a) => a.isNominatedSeries && a.positionInConcourse > 0 && a.positionInConcourse <= concourse.prizeLimit)
      .sort((a, b) => a.positionInConcourse - b.positionInConcourse);

    // Pick top N counted pigeons
    const topCounted = prizeNominated.slice(0, maxCountedPerFlight);

    let flightPoints = 0;
    let flightCoeffSum = 0;

    const countedPigeons = topCounted.map((arr) => {
      const gmpPts = calculateGmpPointsForPosition(arr.positionInConcourse, concourse.prizeLimit, flight.category);
      const coeff = calculateFciCoefficient(arr.positionInConcourse, flight.totalBasketedPigeons);
      flightPoints += gmpPts;
      flightCoeffSum += coeff;
      grandTotalKm += flight.distanceKm;
      return {
        ringNumber: arr.ringNumber,
        position: arr.positionInConcourse,
        gmpPoints: gmpPts,
        fciCoeff: coeff,
      };
    });

    flightPoints = Math.round(flightPoints * 100) / 100;
    flightCoeffSum = Math.round(flightCoeffSum * 1000) / 1000;

    grandTotalPoints += flightPoints;
    grandTotalPrizes += countedPigeons.length;
    sumCoeffAll += flightCoeffSum;

    flightResults.push({
      flightId: flight.flightId,
      flightName: flight.flightName,
      category: flight.category,
      distanceKm: flight.distanceKm,
      prizeLimit: concourse.prizeLimit,
      countedPigeons,
      totalFlightGmpPoints: flightPoints,
      totalFlightCoeff: flightCoeffSum,
    });
  }

  const averageCoeff = grandTotalPrizes > 0 ? Math.round((sumCoeffAll / grandTotalPrizes) * 1000) / 1000 : 0.0;

  return {
    loftName,
    breederName,
    seasonYear,
    totalChampionshipPoints: Math.round(grandTotalPoints * 100) / 100,
    totalPrizesCount: grandTotalPrizes,
    totalConcourseKm: Math.round(grandTotalKm * 10) / 10,
    averageCoeff,
    flights: flightResults,
  };
}

/**
 * Calculates Intermistrzostwo standing (FCI / PZHGP Inter-Championship).
 * Series of 3 from 5 on flights > 285 km, ranked by lowest Coeff sum.
 */
export function calculateInterChampionship(params: {
  loftName?: string;
  seasonYear?: number;
  flights: RaceFlightRecord[];
  arrivals: PigeonArrivalRecord[];
}): InterChampionshipSummary {
  const {
    loftName = 'Gołębnik Mistrza Pigeon-Fly',
    seasonYear = new Date().getFullYear(),
    flights,
    arrivals,
  } = params;

  // Intermistrzostwo only counts flights > 285 km
  const qualifyingFlights = flights.filter((f) => f.distanceKm >= 285);
  let totalNominatedPrizes = 0;
  let totalCoeffSum = 0;

  for (const flight of qualifyingFlights) {
    const concourse = calculateConcourseLimit(flight.totalBasketedPigeons, flight.prizeBasePercent || 20);
    const flightArrivals = arrivals
      .filter(
        (a) =>
          a.flightId === flight.flightId &&
          a.isNominatedSeries &&
          a.positionInConcourse > 0 &&
          a.positionInConcourse <= concourse.prizeLimit
      )
      .sort((a, b) => a.positionInConcourse - b.positionInConcourse)
      .slice(0, 3); // top 3 from series

    for (const arr of flightArrivals) {
      totalNominatedPrizes += 1;
      totalCoeffSum += calculateFciCoefficient(arr.positionInConcourse, flight.totalBasketedPigeons);
    }
  }

  return {
    loftName,
    seasonYear,
    totalNominatedPrizes,
    totalCoeffSum: Math.round(totalCoeffSum * 1000) / 1000,
    flightsCount: qualifyingFlights.length,
    qualifies: totalNominatedPrizes >= 3,
  };
}

/**
 * Compiles Ace Pigeon (As Lotowy) rankings for the loft across multiple categories:
 * - All-round (Wielobój)
 * - Yearling (Roczne)
 * - Category A, B, C, M
 */
export function calculateAcePigeonRankings(params: {
  flights: RaceFlightRecord[];
  arrivals: PigeonArrivalRecord[];
  filterCategory?: FlightCategory;
  onlyYearlings?: boolean;
}): AceRankingItem[] {
  const { flights, arrivals, filterCategory, onlyYearlings } = params;
  const flightMap = new Map<string, RaceFlightRecord>(flights.map((f) => [f.flightId, f]));

  // Group arrivals by pigeon
  const pigeonMap = new Map<
    string,
    {
      pigeonId: string;
      ringNumber: string;
      sex: 'cock' | 'hen';
      isYearling: boolean;
      prizes: {
        flight: RaceFlightRecord;
        position: number;
        gmpPoints: number;
        coeff: number;
      }[];
    }
  >();

  for (const arr of arrivals) {
    const flight = flightMap.get(arr.flightId);
    if (!flight) continue;

    const concourse = calculateConcourseLimit(flight.totalBasketedPigeons, flight.prizeBasePercent || 20);
    if (arr.positionInConcourse <= 0 || arr.positionInConcourse > concourse.prizeLimit) {
      continue; // Not a prize in concourse base
    }

    if (filterCategory && flight.category !== filterCategory) {
      continue;
    }

    if (onlyYearlings && !arr.isYearling) {
      continue;
    }

    if (!pigeonMap.has(arr.pigeonId)) {
      pigeonMap.set(arr.pigeonId, {
        pigeonId: arr.pigeonId,
        ringNumber: arr.ringNumber,
        sex: arr.sex,
        isYearling: Boolean(arr.isYearling),
        prizes: [],
      });
    }

    const item = pigeonMap.get(arr.pigeonId)!;
    const gmpPts = calculateGmpPointsForPosition(arr.positionInConcourse, concourse.prizeLimit, flight.category);
    const coeff = calculateFciCoefficient(arr.positionInConcourse, flight.totalBasketedPigeons);

    item.prizes.push({
      flight,
      position: arr.positionInConcourse,
      gmpPoints: gmpPts,
      coeff,
    });
  }

  // Convert to ranking items
  const rankings: AceRankingItem[] = [];

  for (const p of pigeonMap.values()) {
    let totalKm = 0;
    let totalPoints = 0;
    let totalCoeff = 0;
    const categoriesSeen = new Set<string>();

    for (const pr of p.prizes) {
      totalKm += pr.flight.distanceKm;
      totalPoints += pr.gmpPoints;
      totalCoeff += pr.coeff;
      categoriesSeen.add(pr.flight.category);
    }

    const badges: string[] = Array.from(categoriesSeen).map((c) => `Kat. ${c}`);
    if (p.isYearling) {
      badges.push('Roczniak');
    }

    rankings.push({
      rank: 0,
      pigeonId: p.pigeonId,
      ringNumber: p.ringNumber,
      sex: p.sex,
      isYearling: p.isYearling,
      totalPrizes: p.prizes.length,
      totalConcourseKm: Math.round(totalKm * 10) / 10,
      totalGmpPoints: Math.round(totalPoints * 100) / 100,
      totalCoeff: Math.round(totalCoeff * 1000) / 1000,
      categoryBadges: badges,
    });
  }

  // Sort by: 1. Total prizes desc, 2. Lowest Coeff asc (or GMP points desc)
  rankings.sort((a, b) => {
    if (b.totalPrizes !== a.totalPrizes) {
      return b.totalPrizes - a.totalPrizes;
    }
    return a.totalCoeff - b.totalCoeff;
  });

  // Assign ranks
  rankings.forEach((item, index) => {
    item.rank = index + 1;
  });

  return rankings;
}

/**
 * Generates ready-to-print official PZHGP National Championship Report HTML (A4).
 */
export function generateNationalChampionshipReportHtml(params: {
  gmp: GmpChampionshipSummary;
  inter: InterChampionshipSummary;
  aces: AceRankingItem[];
  loftName?: string;
  seasonYear?: number;
}): string {
  const { gmp, inter, aces } = params;
  const loft = params.loftName || gmp.loftName || 'Gołębnik Mistrza Pigeon-Fly';
  const year = params.seasonYear || gmp.seasonYear || new Date().getFullYear();

  const flightRowsHtml = gmp.flights
    .map(
      (f, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${f.flightName}</strong></td>
      <td>${f.category} (${f.distanceKm} km)</td>
      <td>${f.countedPigeons.length}</td>
      <td>${f.countedPigeons.map((p) => `${p.ringNumber} (#${p.position})`).join(', ') || '&mdash;'}</td>
      <td style="font-weight: 800; color: #1e3a8a;">${f.totalFlightGmpPoints.toFixed(2)} pkt</td>
      <td>${f.totalFlightCoeff.toFixed(3)}</td>
    </tr>
  `
    )
    .join('');

  const aceRowsHtml = aces
    .slice(0, 10)
    .map(
      (a) => `
    <tr>
      <td style="font-weight: bold; text-align: center;">${a.rank}</td>
      <td><strong>${a.ringNumber}</strong> (${a.sex === 'cock' ? '♂ Samiec' : '♀ Samica'})</td>
      <td>${a.categoryBadges.join(', ')}</td>
      <td style="text-align: center; font-weight: bold;">${a.totalPrizes} konk.</td>
      <td>${a.totalConcourseKm} kkm</td>
      <td style="font-weight: 800; color: #0284c7;">${a.totalCoeff.toFixed(3)}</td>
      <td style="font-weight: bold;">${a.totalGmpPoints.toFixed(2)} pkt</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>Zestawienie Mistrzostwa Polski PZHGP - ${loft}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
    }
    .header-box {
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .title { font-size: 20px; font-weight: 900; color: #1e3a8a; }
    .subtitle { font-size: 11px; color: #475569; font-weight: 600; margin-top: 2px; }
    .kpi-grid { display: flex; gap: 10px; margin-bottom: 14px; }
    .kpi-card {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
      text-align: center;
    }
    .kpi-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
    .kpi-value { font-size: 18px; font-weight: 900; color: #0284c7; margin-top: 2px; }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      margin: 14px 0 6px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 5px 6px; border: 1px solid #cbd5e1; }
    td { padding: 4px 6px; border: 1px solid #cbd5e1; }
    .signatures-box {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 10px;
    }
    .sig-col { text-align: center; width: 45%; }
    .sig-line { border-bottom: 1px dashed #64748b; height: 35px; margin-bottom: 4px; }
    .sig-lbl { font-size: 10px; color: #64748b; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="title">🏆 PROTOKÓŁ WYNIKÓW MISTRZOSTWA POLSKI PZHGP — SEZON ${year}</div>
    <div class="subtitle">${loft} &bull; ${gmp.breederName} &bull; Zgodność z Regulaminem PZHGP i FCI</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">PUNKTY GMP (SERIA)</div>
      <div class="kpi-value">${gmp.totalChampionshipPoints.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">KONKURSY GMP</div>
      <div class="kpi-value">${gmp.totalPrizesCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">INTERMISTRZOSTWO COEFF</div>
      <div class="kpi-value">${inter.totalCoeffSum.toFixed(3)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">ŚREDNI COEFF STADA</div>
      <div class="kpi-value">${gmp.averageCoeff.toFixed(3)}</div>
    </div>
  </div>

  <div class="section-title">1. Rozliczenie Lotów do Generalnego Mistrzostwa Polski (GMP)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 25px;">Lp.</th>
        <th>Lot</th>
        <th>Kat. / Dystans</th>
        <th>Konk.</th>
        <th>Zaliczone gołębie (seria)</th>
        <th>Punkty GMP</th>
        <th>Coeff</th>
      </tr>
    </thead>
    <tbody>
      ${flightRowsHtml}
    </tbody>
  </table>

  <div class="section-title">2. Ranking Najlepszych Lotników Gołębnika (Asy Lotowe)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 30px;">Poz.</th>
        <th>Obrączka rodowa</th>
        <th>Kategorie / Odznaka</th>
        <th>Konk.</th>
        <th>kkm</th>
        <th>Łączny Coeff</th>
        <th>Punkty GMP</th>
      </tr>
    </thead>
    <tbody>
      ${aceRowsHtml}
    </tbody>
  </table>

  <div class="signatures-box">
    <div class="sig-col">
      <div class="sig-line"></div>
      <div class="sig-lbl">Podpis Hodowcy</div>
    </div>
    <div class="sig-col">
      <div class="sig-line"></div>
      <div class="sig-lbl">Komisja Obliczeniowa Oddziału PZHGP</div>
    </div>
  </div>

  <div style="font-size: 9px; color: #94a3b8; text-align: right; margin-top: 14px;">
    Pigeon-Fly Championship Engine &bull; Data wygenerowania: ${new Date().toISOString().slice(0, 10)}
  </div>
</body>
</html>
  `.trim();
}
