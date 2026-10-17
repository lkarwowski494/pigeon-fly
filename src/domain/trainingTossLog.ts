/**
 * PIGEON-FLY — Electronic Training Toss Log & Flock Cohesion Engine (Z-078 / DEC-92)
 * Private toss flight tracking, speed evaluation, flock cohesion index, and season readiness scoring.
 * Biological basis:
 * - 15-minute arrival window is the gold standard for flock synchronization and orientation sharpness.
 * - Distance progression (15 -> 30 -> 50 -> 75 -> 100 km) prevents disorientation and raptor scattering.
 * - Flock Cohesion Index >= 80% indicates competitive readiness for PZHGP official races.
 */

export type CohesionRating =
  | 'EXCELLENT_SYNCHRONIZED'
  | 'GOOD_COMPACT'
  | 'SCATTERED_CONCERN'
  | 'POOR_DISPERSED';

export type ReadinessVerdict =
  | 'READY_FOR_OFFICIAL_RACE'
  | 'REQUIRES_ADDITIONAL_TOSS'
  | 'ALERT_NOT_READY';

export interface TrainingTossLogEntry {
  id: string;
  tossDate: string; // YYYY-MM-DD
  tossName: string; // np. "Wywózka Rawicz 35 km"
  squadType: 'youngsters' | 'widowhood_cocks' | 'widowhood_hens' | 'general_squad';
  releaseLocation: string; // np. "Rawicz - Leśniczówka"
  distanceKm: number;
  azimuthDeg: number; // 0-360° (kierunek powrotu do gołębnika)
  releaseTime: string; // HH:MM np. "07:30"
  leadArrivalTime: string; // HH:MM np. "07:58"
  tailArrivalTime?: string; // HH:MM np. "08:15"
  basketedCount: number; // Liczba wywiezionych gołębi
  leadGroupCount: number; // Liczba ptaków w pierwszej grupie (szpica)
  returned15MinCount: number; // Ptaki w 15 minut od czołówki
  totalReturnedSameDayCount: number; // Łączny powrót tego samego dnia
  ambientTempC?: number;
  windCondition?: string; // np. "NW 15 km/h (boczny z lewej)"
  notes?: string;
}

export interface TrainingTossAnalysis {
  entry: TrainingTossLogEntry;
  leadDurationMinutes: number;
  speedLeadMPerMin: number;
  flockCohesionPct: number; // (returned15MinCount / basketedCount) * 100
  sameDayReturnPct: number; // (totalReturnedSameDayCount / basketedCount) * 100
  lossesCount: number; // basketedCount - totalReturnedSameDayCount
  cohesionRating: CohesionRating;
  cohesionRatingLabel: string;
  cohesionRatingColor: string;
}

export interface FlockSeasonReadiness {
  totalTosses: number;
  totalDistanceFlownKm: number;
  maxTossDistanceKm: number;
  averageSpeedMPerMin: number;
  averageCohesionPct: number;
  readinessScore: number; // 0-100 pts
  verdict: ReadinessVerdict;
  verdictLabel: string;
  verdictColor: string;
  recommendations: string[];
  analyses: TrainingTossAnalysis[];
}

/**
 * Calculates minutes elapsed between two HH:MM strings.
 */
export function calculateMinutesElapsed(startHhmm: string, endHhmm: string): number {
  const [startH, startM] = startHhmm.split(':').map((v) => parseInt(v, 10) || 0);
  const [endH, endM] = endHhmm.split(':').map((v) => parseInt(v, 10) || 0);

  let startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;

  if (endTotal < startTotal) {
    endTotal += 24 * 60; // Crosses midnight
  }

  return Math.max(1, endTotal - startTotal);
}

/**
 * Analyzes a single training toss entry.
 */
export function analyzeTrainingToss(entry: TrainingTossLogEntry): TrainingTossAnalysis {
  const leadDurationMinutes = calculateMinutesElapsed(entry.releaseTime, entry.leadArrivalTime);
  const speedLeadMPerMin = Math.round(((entry.distanceKm * 1000) / leadDurationMinutes) * 100) / 100;

  const basketed = Math.max(1, entry.basketedCount);
  const returned15 = Math.min(basketed, Math.max(0, entry.returned15MinCount));
  const returnedSameDay = Math.min(basketed, Math.max(returned15, entry.totalReturnedSameDayCount));

  const flockCohesionPct = Math.round((returned15 / basketed) * 1000) / 10;
  const sameDayReturnPct = Math.round((returnedSameDay / basketed) * 1000) / 10;
  const lossesCount = Math.max(0, basketed - returnedSameDay);

  let cohesionRating: CohesionRating = 'GOOD_COMPACT';
  let cohesionRatingLabel = 'Dobra zwartość stada';
  let cohesionRatingColor = '#3B82F6';

  if (flockCohesionPct >= 80.0) {
    cohesionRating = 'EXCELLENT_SYNCHRONIZED';
    cohesionRatingLabel = 'DOSKONAŁA ZWARTOŚĆ (SZPICA ZSYNCHRONIZOWANA)';
    cohesionRatingColor = '#10B981';
  } else if (flockCohesionPct >= 65.0) {
    cohesionRating = 'GOOD_COMPACT';
    cohesionRatingLabel = 'Dobra spójność grupy przelotowej';
    cohesionRatingColor = '#3B82F6';
  } else if (flockCohesionPct >= 50.0) {
    cohesionRating = 'SCATTERED_CONCERN';
    cohesionRatingLabel = 'Rozproszenie stada — wydłużony dolot';
    cohesionRatingColor = '#F59E0B';
  } else {
    cohesionRating = 'POOR_DISPERSED';
    cohesionRatingLabel = 'ALARM: Rozbicie stada (brak orientacji zespołowej)';
    cohesionRatingColor = '#EF4444';
  }

  return {
    entry,
    leadDurationMinutes,
    speedLeadMPerMin,
    flockCohesionPct,
    sameDayReturnPct,
    lossesCount,
    cohesionRating,
    cohesionRatingLabel,
    cohesionRatingColor,
  };
}

/**
 * Evaluates the full training season progression and determines competition readiness.
 */
export function evaluateFlockSeasonReadiness(tosses: TrainingTossLogEntry[]): FlockSeasonReadiness {
  if (!tosses || tosses.length === 0) {
    return {
      totalTosses: 0,
      totalDistanceFlownKm: 0,
      maxTossDistanceKm: 0,
      averageSpeedMPerMin: 0,
      averageCohesionPct: 0,
      readinessScore: 0,
      verdict: 'ALERT_NOT_READY',
      verdictLabel: 'Brak zarejestrowanych wywózek treningowych',
      verdictColor: '#EF4444',
      recommendations: ['Rozpocznij cykl treningowy od dystansu 15–20 km w optymalnych warunkach pogodowych.'],
      analyses: [],
    };
  }

  const analyses = tosses.map(analyzeTrainingToss);

  const totalTosses = analyses.length;
  const totalDistanceFlownKm = analyses.reduce((sum, a) => sum + a.entry.distanceKm, 0);
  const maxTossDistanceKm = Math.max(...analyses.map((a) => a.entry.distanceKm));
  const averageSpeedMPerMin =
    Math.round(
      (analyses.reduce((sum, a) => sum + a.speedLeadMPerMin, 0) / totalTosses) * 10
    ) / 10;
  const averageCohesionPct =
    Math.round(
      (analyses.reduce((sum, a) => sum + a.flockCohesionPct, 0) / totalTosses) * 10
    ) / 10;

  // Readiness scoring algorithm:
  // 1. Number of tosses: up to 30 pts (>= 5 tosses = 30 pts)
  let tossScore = Math.min(30, totalTosses * 6);

  // 2. Max distance: up to 25 pts (>= 60 km = 25 pts, >= 40 km = 18 pts)
  let distScore = 0;
  if (maxTossDistanceKm >= 70) distScore = 25;
  else if (maxTossDistanceKm >= 50) distScore = 20;
  else if (maxTossDistanceKm >= 30) distScore = 14;
  else distScore = 8;

  // 3. Average Cohesion: up to 30 pts (80% = 30 pts, 70% = 24 pts)
  let cohesionScore = Math.min(30, Math.round((averageCohesionPct / 100) * 35));

  // 4. Return safety: up to 15 pts (average same-day return >= 95%)
  const avgReturnPct =
    analyses.reduce((sum, a) => sum + a.sameDayReturnPct, 0) / totalTosses;
  let returnScore = Math.min(15, Math.round((avgReturnPct / 100) * 15));

  const readinessScore = Math.min(100, Math.max(0, tossScore + distScore + cohesionScore + returnScore));

  const recommendations: string[] = [];

  let verdict: ReadinessVerdict = 'ALERT_NOT_READY';
  let verdictLabel = 'Stado wymaga dalszych treningów';
  let verdictColor = '#EF4444';

  if (readinessScore >= 80 && maxTossDistanceKm >= 45 && averageCohesionPct >= 70) {
    verdict = 'READY_FOR_OFFICIAL_RACE';
    verdictLabel = 'STADO W PEŁNI GOTOWE DO LOTÓW KONKURSOWYCH PZHGP';
    verdictColor = '#10B981';
    recommendations.push('Stado wykazuje znakomitą dyscyplinę przestrzenną i szybkie opuszczanie punktu startu.');
    recommendations.push('Utrzymuj lekki trening z dachu oraz 1 krótki rozruch (30 km) w środku tygodnia.');
  } else if (readinessScore >= 60) {
    verdict = 'REQUIRES_ADDITIONAL_TOSS';
    verdictLabel = 'ZALECANY 1 DODATKOWY TRENING PRZED LOTEM OFICJALNYM';
    verdictColor = '#F59E0B';
    if (maxTossDistanceKm < 50) {
      recommendations.push(`Maksymalna wywózka to ${maxTossDistanceKm} km — zalecana wywózka sprawdzająca na 50–70 km.`);
    }
    if (averageCohesionPct < 75) {
      recommendations.push(`Wskaźnik zwartości ${averageCohesionPct}% sugeruje rozrywanie stada. Zwróć uwagę na motywację gniazdową.`);
    }
  } else {
    verdict = 'ALERT_NOT_READY';
    verdictLabel = 'ALARM: NIEDOSTATECZNE PRZYGOTOWANIE — RYZYKO STRAT';
    verdictColor = '#EF4444';
    recommendations.push('Zbyt mała liczba wywózek lub wysokie rozproszenie stada.');
    recommendations.push('Nie koszuj stada na loty konkursowe bez przeprowadzenia przynajmniej 2 udanych wywózek na 35–50 km.');
  }

  return {
    totalTosses,
    totalDistanceFlownKm,
    maxTossDistanceKm,
    averageSpeedMPerMin,
    averageCohesionPct,
    readinessScore,
    verdict,
    verdictLabel,
    verdictColor,
    recommendations,
    analyses,
  };
}

/**
 * Generates an official printable A4 Training Toss Log Sheet HTML.
 */
export function generateTrainingTossLogSheetHtml(
  readiness: FlockSeasonReadiness,
  meta?: {
    loftName?: string;
    breederName?: string;
    seasonYear?: number;
    squadName?: string;
  }
): string {
  const loft = meta?.loftName || 'Gołębnik Mistrza Pigeon-Fly';
  const breeder = meta?.breederName || 'Łukasz';
  const year = meta?.seasonYear || new Date().getFullYear();
  const squad = meta?.squadName || 'Stado Lotowe';

  const rowsHtml = readiness.analyses
    .map((a, idx) => {
      const e = a.entry;
      return `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td>${e.tossDate}</td>
        <td style="font-weight: 600;">${e.releaseLocation}</td>
        <td style="text-align: right;">${e.distanceKm.toFixed(1)} km</td>
        <td style="text-align: center;">${e.azimuthDeg}°</td>
        <td style="text-align: center;">${e.releaseTime}</td>
        <td style="text-align: center;">${e.leadArrivalTime}</td>
        <td style="text-align: right; font-weight: bold; color: #1e3a8a;">${a.speedLeadMPerMin.toFixed(1)} m/min</td>
        <td style="text-align: center;">${e.leadGroupCount} / ${e.basketedCount}</td>
        <td style="text-align: center; font-weight: bold; color: ${a.flockCohesionPct >= 75 ? '#047857' : '#b45309'};">
          ${a.flockCohesionPct.toFixed(0)}% (${e.returned15MinCount} szt.)
        </td>
        <td style="text-align: center;">${a.lossesCount > 0 ? `<span style="color: #b91c1c; font-weight: bold;">-${a.lossesCount}</span>` : '0'}</td>
        <td style="font-size: 8pt; color: #475569;">${e.windCondition || '—'}</td>
      </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Dziennik Wywózek Treningowych i Zwartości Stada — ${loft}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.35;
      font-size: 9.5pt;
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
    .title { font-size: 14pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 9pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8.5pt; text-align: right; color: #334155; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px;
      background: #f8fafc;
    }
    .kpi-title { font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .kpi-val { font-size: 13pt; font-weight: 800; color: #0f172a; margin-top: 3px; }
    .verdict-box {
      border: 1.5px solid ${readiness.verdictColor};
      background: ${readiness.verdict === 'READY_FOR_OFFICIAL_RACE' ? '#ecfdf5' : '#fef2f2'};
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
    }
    .verdict-title {
      font-size: 10.5pt;
      font-weight: 800;
      color: ${readiness.verdictColor};
      text-transform: uppercase;
    }
    .verdict-desc { font-size: 8.5pt; margin-top: 4px; color: #334155; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 8.5pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      vertical-align: middle;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      text-align: left;
      font-size: 8pt;
      text-transform: uppercase;
      color: #334155;
    }
    .footer {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
    .sign-box {
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
    }
    .sign-line {
      width: 200px;
      border-top: 1px dashed #94a3b8;
      text-align: center;
      font-size: 8pt;
      padding-top: 4px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Elektroniczny Dziennik Lotów Próbnych i Wywózek</div>
      <div class="subtitle">Wskaźnik Zwartości Stada (15-min) & Prędkości Przelotowe (Z-078)</div>
    </div>
    <div class="meta">
      <div><strong>${loft}</strong></div>
      <div>Hodowca: ${breeder} | Sezon: ${year}</div>
      <div>Grupa: ${squad}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Łącznie Wywózek</div>
      <div class="kpi-val">${readiness.totalTosses} lotów</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Maks. Dystans</div>
      <div class="kpi-val">${readiness.maxTossDistanceKm.toFixed(1)} km</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Śr. Prędkość Szpicy</div>
      <div class="kpi-val">${readiness.averageSpeedMPerMin.toFixed(1)} m/min</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Śr. Zwartość (15 min)</div>
      <div class="kpi-val" style="color: ${readiness.averageCohesionPct >= 75 ? '#047857' : '#b45309'};">
        ${readiness.averageCohesionPct.toFixed(1)}%
      </div>
    </div>
  </div>

  <div class="verdict-box">
    <div class="verdict-title">${readiness.verdictLabel} (Ocena: ${readiness.readinessScore} / 100 pkt)</div>
    <div class="verdict-desc">
      ${readiness.recommendations.map((r) => `• ${r}`).join('<br>')}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 24px; text-align: center;">Lp</th>
        <th>Data</th>
        <th>Miejsce Wypuszczenia</th>
        <th style="text-align: right;">Dystans</th>
        <th style="text-align: center;">Azymut</th>
        <th style="text-align: center;">Start</th>
        <th style="text-align: center;">Szpica</th>
        <th style="text-align: right;">Prędkość</th>
        <th style="text-align: center;">Szpica/Włożone</th>
        <th style="text-align: center;">Zwartość (15m)</th>
        <th style="text-align: center;">Straty</th>
        <th>Warunki / Wiatr</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="sign-box">
    <div class="sign-line">Podpis Hodowcy</div>
    <div class="sign-line">Weryfikator / Zarząd Sekcji</div>
  </div>

  <div class="footer">
    <div>Wygenerowano z systemu PIGEON-FLY v0.1.0 • Moduł Gotowości Bojowej Stada Z-078</div>
    <div>Data wydruku: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
