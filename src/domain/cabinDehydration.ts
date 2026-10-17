/**
 * PIGEON-FLY — Cabin Dehydration & Transport Welfare Engine (Z-085 / DEC-99)
 * Biological and environmental evaluation of water loss and thermal stress during pigeon transport:
 * - Evaporative respiration: Pigeons lack sweat glands; heat dissipation relies on panting & gular flutter.
 * - Water loss accelerates from ~0.25 ml/h (at 20°C) to 1.2-1.8 ml/h (at 30-34°C).
 * - Relative humidity and mechanical ventilation airflow (m³/h per 100 birds) modulate evaporation.
 * - Cabin trough watering sessions replenish fluid reserves before liberation.
 * - PZHGP Transport Regulations: mandatory watering schedule and race release safety thresholds.
 */

export interface CabinDehydrationInput {
  cabinTempC: number; // np. 24°C
  relativeHumidityPct: number; // np. 65%
  transitHours: number; // np. 14h jazdy
  releaseSiteWaitHours: number; // np. 10h postoju na miejscu wypuszczenia
  ventilationM3PerHourPer100Birds: number; // norma PZHGP: 20-30 m³/h
  birdsCountInCabin: number; // np. 2400 sztuk
  wateringSessionsCount: number; // np. 2 sesje pojenia w kabinie
  avgWaterConsumedMlPerBirdPerSession: number; // średnio 6-10 ml / sesję
  averagePigeonBodyWeightGrams?: number; // domyślnie 420g
  raceDistanceKm?: number; // np. 720 km
}

export type DehydrationRiskLevel = 'optimal' | 'moderate_warning' | 'critical_danger';

export interface CabinDehydrationReport {
  totalCabinHours: number;
  evaporationRateMlPerHour: number;
  grossWaterLossMlPerBird: number;
  waterReplenishedMlPerBird: number;
  netFluidDeficitMlPerBird: number;
  dehydrationPercentBodyWeight: number;
  totalFlockWaterLossLiters: number;
  totalFlockWaterReplenishedLiters: number;
  riskLevel: DehydrationRiskLevel;
  riskLabel: string;
  riskColor: string;
  flightImpactAnalysis: string;
  pzhgpComplianceStatus: 'compliant' | 'requires_action' | 'violation';
  pzhgpComplianceNotes: string[];
  recommendations: string[];
}

/**
 * Calculates hourly respiratory and cutaneous evaporation rate based on microclimate.
 */
export function calculateEvaporationRate(
  tempC: number,
  humidityPct: number,
  ventilationM3: number
): number {
  // Baseline evaporation rate at comfortable 18-20°C: ~0.25 ml/h per pigeon
  let rate = 0.25;

  if (tempC > 20) {
    const tempDelta = tempC - 20;
    if (tempC <= 26) {
      rate += tempDelta * 0.05; // 26°C -> 0.25 + 0.30 = 0.55 ml/h
    } else if (tempC <= 30) {
      // Moderate panting initiates
      rate += 6 * 0.05 + (tempC - 26) * 0.12; // 30°C -> 0.25 + 0.30 + 0.48 = 1.03 ml/h
    } else {
      // Intense gular fluttering / thermal distress
      rate += 6 * 0.05 + 4 * 0.12 + (tempC - 30) * 0.20; // 33°C -> 0.25 + 0.30 + 0.48 + 0.60 = 1.63 ml/h
    }
  } else if (tempC < 14) {
    // Cold thermogenesis induces slightly increased metabolic rate
    rate += 0.05;
  }

  // Humidity adjustment
  if (humidityPct > 75) {
    // High humidity impedes cooling, triggering higher frequency panting (+20% evaporation)
    rate *= 1.2;
  } else if (humidityPct < 35) {
    // Dry air accelerates vapor diffusion (+15%)
    rate *= 1.15;
  }

  // Poor ventilation build-up
  if (ventilationM3 < 18) {
    rate *= 1.15; // Stagnant air and CO2 build-up
  }

  return Math.round(rate * 100) / 100;
}

/**
 * Evaluates transport dehydration and generates welfare report.
 */
export function evaluateCabinDehydration(
  input: CabinDehydrationInput
): CabinDehydrationReport {
  const avgWeight = input.averagePigeonBodyWeightGrams ?? 420;
  const totalCabinHours = input.transitHours + input.releaseSiteWaitHours;

  const evaporationRateMlPerHour = calculateEvaporationRate(
    input.cabinTempC,
    input.relativeHumidityPct,
    input.ventilationM3PerHourPer100Birds
  );

  const grossWaterLossMlPerBird =
    Math.round(totalCabinHours * evaporationRateMlPerHour * 10) / 10;

  const waterReplenishedMlPerBird =
    Math.round(
      input.wateringSessionsCount * input.avgWaterConsumedMlPerBirdPerSession * 10
    ) / 10;

  const netFluidDeficitMlPerBird = Math.max(
    0,
    Math.round((grossWaterLossMlPerBird - waterReplenishedMlPerBird) * 10) / 10
  );

  const dehydrationPercentBodyWeight =
    Math.round((netFluidDeficitMlPerBird / avgWeight) * 1000) / 10;

  // Flock totals in Liters
  const totalFlockWaterLossLiters =
    Math.round(((grossWaterLossMlPerBird * input.birdsCountInCabin) / 1000) * 10) /
    10;
  const totalFlockWaterReplenishedLiters =
    Math.round(
      ((waterReplenishedMlPerBird * input.birdsCountInCabin) / 1000) * 10
    ) / 10;

  // Risk Classification
  let riskLevel: DehydrationRiskLevel = 'optimal';
  let riskLabel = 'OPTYMALNY DOBROSTAN (Wodny bilans stabilny)';
  let riskColor = '#10B981';
  let flightImpactAnalysis =
    'Ptaki są w pełni nawodnione. Krew zachowuje optymalną lepkość, a wymiana tlenowa w płucach i workach powietrznych jest maksymalna.';

  if (dehydrationPercentBodyWeight >= 4.5 || netFluidDeficitMlPerBird >= 19) {
    riskLevel = 'critical_danger';
    riskLabel = 'KRYTYCZNE ODWODNIENIE (Zagrożenie zapaścią)';
    riskColor = '#EF4444';
    flightImpactAnalysis =
      'Alarm! Ubytek wody >4.5% masy ciała wywołuje gwałtowne zagęszczenie krwi (hematokryt >60%), obciążenie lewej komory serca oraz 30-50% spadek zdolności lotowych. Ryzyko masowych ubytków stada na trasie!';
  } else if (dehydrationPercentBodyWeight >= 2.5 || netFluidDeficitMlPerBird >= 11) {
    riskLevel = 'moderate_warning';
    riskLabel = 'UMIARKOWANE ODWODNIENIE (Wymagane poidło)';
    riskColor = '#F59E0B';
    flightImpactAnalysis =
      'Ubytek płynów 2.5 - 4.5% osłabia termoregulację i przyspiesza wyczerpanie zapasów glikogenu. Spadek prędkości przelotowej szacowany na 10-18%.';
  }

  // PZHGP Compliance & Welfare Guidelines
  const pzhgpComplianceNotes: string[] = [];
  let pzhgpComplianceStatus: 'compliant' | 'requires_action' | 'violation' =
    'compliant';

  if (totalCabinHours >= 12 && input.wateringSessionsCount < 1) {
    pzhgpComplianceStatus = 'violation';
    pzhgpComplianceNotes.push(
      'Naruszenie Regulaminu PZHGP: Przy transporcie powyżej 12h obowiązkowe jest co najmniej jedno skuteczne pojenie w kabinie!'
    );
  } else if (totalCabinHours >= 20 && input.wateringSessionsCount < 2) {
    pzhgpComplianceStatus = 'requires_action';
    pzhgpComplianceNotes.push(
      'Wymagane działanie: Transport przekracza 20 godzin — zalecane min. 2 sesje pojenia (wieczorna po dojeździe i ranna przed startem).'
    );
  }

  if (input.ventilationM3PerHourPer100Birds < 20) {
    pzhgpComplianceNotes.push(
      'Wydajność wentylacji poniżej normy PZHGP (min. 20-30 m³/h na 100 gołębi). Ryzyko duszności i przegrzania klatek!'
    );
    if (pzhgpComplianceStatus !== 'violation') {
      pzhgpComplianceStatus = 'requires_action';
    }
  }

  const recommendations: string[] = [];
  if (riskLevel === 'critical_danger') {
    recommendations.push(
      'Bezwzględny zakaz natychmiastowego wypuszczenia stada! Odczekaj minimum 90-120 minut z opuszczonymi korytkami z wodą.'
    );
    recommendations.push(
      'Dodaj do poidła kabinowego elektrolit z glukozą (hipotoniczny roztwór ~250 mOsm/L).'
    );
  } else if (riskLevel === 'moderate_warning') {
    recommendations.push(
      'Zapewnij 45-minutową sesję pojenia przed otwarciem żaluzji kabiny startowej.'
    );
    recommendations.push(
      'Sprawdź czy rynienki z wodą są równomiernie napełnione we wszystkich piętrach (zwłaszcza górnych najbardziej nagrzanych).'
    );
  } else {
    recommendations.push(
      'Parametry mikroklimatu i nawodnienia w normie. Stado gotowe do wypuszczenia w wyznaczonym oknie czasowym.'
    );
  }

  return {
    totalCabinHours,
    evaporationRateMlPerHour,
    grossWaterLossMlPerBird,
    waterReplenishedMlPerBird,
    netFluidDeficitMlPerBird,
    dehydrationPercentBodyWeight,
    totalFlockWaterLossLiters,
    totalFlockWaterReplenishedLiters,
    riskLevel,
    riskLabel,
    riskColor,
    flightImpactAnalysis,
    pzhgpComplianceStatus,
    pzhgpComplianceNotes,
    recommendations,
  };
}

/**
 * Generates official PZHGP A4 Transport Dehydration & Watering Report HTML.
 */
export function generateCabinDehydrationReportHtml(
  report: CabinDehydrationReport,
  input: CabinDehydrationInput,
  meta?: {
    raceName?: string;
    cabinSerial?: string;
    convoyLeader?: string;
    branchName?: string;
  }
): string {
  const race = meta?.raceName || 'Lot Konkursowy PZHGP';
  const cabin = meta?.cabinSerial || 'Kabina Specjalistyczna PZHGP';
  const leader = meta?.convoyLeader || 'Konwojent Główny Oddziału';
  const branch = meta?.branchName || 'Oddział 0284';

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Protokół Nawodnienia i Mikroklimatu Kabiny — ${race}</title>
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
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8pt; text-align: right; color: #334155; }

    .kpi-banner {
      border: 1.5px solid ${report.riskColor};
      background: #f8fafc;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .kpi-title { font-size: 11pt; font-weight: 900; color: ${report.riskColor}; }
    .kpi-desc { font-size: 8pt; color: #475569; margin-top: 2px; }
    .kpi-stat { text-align: right; }
    .kpi-stat-val { font-size: 15pt; font-weight: 900; color: #0f172a; }
    .kpi-stat-sub { font-size: 8pt; color: #64748b; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .card-heading {
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 8pt;
    }
    .label { color: #64748b; }
    .val { font-weight: 700; color: #0f172a; }

    .analysis-box {
      background: #f1f5f9;
      border-left: 3.5px solid ${report.riskColor};
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 10px;
      font-size: 8pt;
      color: #334155;
    }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 24px;
      padding-top: 10px;
    }
    .sig-col {
      text-align: center;
      border-top: 1px dashed #94a3b8;
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
      <div class="title">Protokół Bilansu Wodnego i Mikroklimatu Kabiny</div>
      <div class="subtitle">Wskaźnik Odwodnienia i Dobrostanu Ptaków w Transporcie (Z-085)</div>
    </div>
    <div class="meta">
      <div><strong>${branch}</strong></div>
      <div>${race} • ${cabin}</div>
      <div>Konwojent: <strong>${leader}</strong></div>
    </div>
  </div>

  <div class="kpi-banner">
    <div>
      <div class="kpi-title">${report.riskLabel}</div>
      <div class="kpi-desc">
        Czas w kabinie: <strong>${report.totalCabinHours}h</strong> (Jazda: ${input.transitHours}h + Postój: ${input.releaseSiteWaitHours}h)
      </div>
    </div>
    <div class="kpi-stat">
      <div class="kpi-stat-val">${report.dehydrationPercentBodyWeight}% ubytku</div>
      <div class="kpi-stat-sub">Deficyt netto: ${report.netFluidDeficitMlPerBird} ml / ptaka</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-card">
      <div class="card-heading">WARUNKI MIKROKLIMATYCZNE KABINY</div>
      <div class="row">
        <span class="label">Temperatura wewnątrz kabiny:</span>
        <span class="val">${input.cabinTempC}°C</span>
      </div>
      <div class="row">
        <span class="label">Wilgotność względna (RH):</span>
        <span class="val">${input.relativeHumidityPct}%</span>
      </div>
      <div class="row">
        <span class="label">Wymiana powietrza (wentylacja):</span>
        <span class="val">${input.ventilationM3PerHourPer100Birds} m³/h / 100 ptaków</span>
      </div>
      <div class="row">
        <span class="label">Tempo parowania oddechowego:</span>
        <span class="val">${report.evaporationRateMlPerHour} ml/h / ptaka</span>
      </div>
      <div class="row">
        <span class="label">Obsada kabiny:</span>
        <span class="val">${input.birdsCountInCabin} gołębi</span>
      </div>
    </div>

    <div class="info-card">
      <div class="card-heading">BILANS POJENIA I PŁYNÓW STADA</div>
      <div class="row">
        <span class="label">Liczba przeprowadzonych sesji pojenia:</span>
        <span class="val">${input.wateringSessionsCount} sesje</span>
      </div>
      <div class="row">
        <span class="label">Pobranie wody na sesję:</span>
        <span class="val">~${input.avgWaterConsumedMlPerBirdPerSession} ml / ptaka</span>
      </div>
      <div class="row">
        <span class="label">Woda uzupełniona na ptaka:</span>
        <span class="val" style="color: #166534;">+${report.waterReplenishedMlPerBird} ml</span>
      </div>
      <div class="row">
        <span class="label">Woda wyparowana na ptaka (brutto):</span>
        <span class="val" style="color: #991b1b;">-${report.grossWaterLossMlPerBird} ml</span>
      </div>
      <div class="row">
        <span class="label">Łączny bilans wodny stada:</span>
        <span class="val">${report.totalFlockWaterReplenishedLiters}L napojono / ${report.totalFlockWaterLossLiters}L ubytku</span>
      </div>
    </div>
  </div>

  <div class="analysis-box">
    <strong>Ocena Wpływu na Zdolności Lotowe:</strong>
    <p style="margin: 4px 0;">${report.flightImpactAnalysis}</p>
  </div>

  ${
    report.pzhgpComplianceNotes.length > 0
      ? `
  <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 3.5px solid #d97706; padding: 6px 10px; margin-bottom: 10px; font-size: 8pt; color: #92400e;">
    <strong>Uwagi Regulaminowe PZHGP:</strong>
    <ul style="margin: 2px 0; padding-left: 16px;">
      ${report.pzhgpComplianceNotes.map((n) => `<li>${n}</li>`).join('')}
    </ul>
  </div>
  `
      : ''
  }

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; margin-bottom: 10px; font-size: 8pt;">
    <strong>Zalecenia dla Konwojenta i Komisji Wypuszczeniowej:</strong>
    <ul style="margin: 2px 0; padding-left: 16px; color: #334155;">
      ${report.recommendations.map((r) => `<li>${r}</li>`).join('')}
    </ul>
  </div>

  <div class="signatures">
    <div class="sig-col">
      <div class="sig-title">Konwojent Główny Kabiny</div>
      <div class="sig-name">${leader}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Przewodniczący Komisji Wypuszczeniowej</div>
      <div class="sig-name">Podpis i pieczęć stacji wypuszczeń</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Protokół Dobrostanu i Nawodnienia Kabiny Z-085</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
