/**
 * PIGEON-FLY — Post-Race Electrolyte & Energy Recovery Engine (Z-077 / DEC-91)
 * Scientific rehydration & muscle restitution physiology:
 * - Fluid & mass loss evaluation (5-10% acute mass loss during flight)
 * - Isotonic / hypotonic drinker balancing (280-310 mOsm/L, Na+, K+, citrate, glucose/maltodextrin)
 * - Two-phase restitution protocol:
 *   Phase I (Hours 0-3): Isotonic rehydration & liver glycogen restoration (no crop gorge)
 *   Phase II (Evening / Day +1): BCAA & whey protein anti-catabolism, L-Carnitine & Vit E/Se
 */

export type DehydrationSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export interface ClinicalSigns {
  sunkenEyes: boolean; // zapadnięte oko (odwodnienie tkanek oczodołu)
  blueBreastSkin: boolean; // sinica mięśnia piersiowego (hipoksja, zakwaszenie kwasem mlekowym)
  sharpKeel: boolean; // ostry grzebień mostka (głęboki katabolizm białek mięśniowych)
  dryCrop: boolean; // wole zapadnięte, suche
  exhaustedPanting: boolean; // przyspieszony oddech / ziajanie powrotowe
}

export interface PostRaceDeficitInput {
  pigeonId?: string;
  ringNumber?: string;
  normalWeightGrams: number; // Masa wyjściowa przed koszowaniem (np. 420g)
  returnWeightGrams: number; // Masa po powrocie z lotu (np. 385g)
  raceDistanceKm: number; // np. 450 km
  flightDurationHours: number; // np. 6.5 h
  ambientTempC: number; // Temperatura na trasie np. 26°C
  headwindKmh?: number; // Prędkość wiatru czołowego np. 25 km/h
  clinicalSigns?: Partial<ClinicalSigns>;
}

export interface Phase1RehydrationPlan {
  drinkerWaterLiters: number;
  glucoseOrMaltodextrinGramsPerLiter: number;
  sodiumChlorideGramsPerLiter: number;
  potassiumChlorideGramsPerLiter: number;
  sodiumCitrateGramsPerLiter: number;
  targetOsmolalityMOsmKg: number;
  solutionTonicity: 'hypotonic' | 'isotonic';
  waterTemperatureAdvice: string;
  maxInitialIntakeMlPerBird: number;
  timingAdvice: string;
}

export interface Phase2MuscleRestitutionPlan {
  bcaaDosageGramsPerKgFeed: number; // Aminokwasy rozgałęzione BCAA (2:1:1)
  wheyProteinGramsPerKgFeed: number; // Izolat białka serwatkowego lub drożdże piwne
  lCarnitineMgPerLiterWater: number; // Spłukiwanie kwasu mlekowego i transport kwasów tłuszczowych
  vitaminEPlusSeleniumMgPerLiter: number; // Zmiatanie wolnych rodników tlenowych
  feedRecommendation: string;
  recoveryEstimatedHours: number;
}

export interface PostRaceDeficitEvaluation {
  ringNumber: string;
  normalWeightGrams: number;
  returnWeightGrams: number;
  massLossGrams: number;
  massLossPercent: number; // % ubytku masy
  estimatedFluidDeficitMl: number; // ~75% ubytku to płyny
  estimatedLipidCombustedGrams: number; // ~25% to spalone rezerwy tłuszczowe
  severity: DehydrationSeverity;
  severityLabel: string;
  severityColor: string;
  clinicalRiskSummary: string[];
  phase1: Phase1RehydrationPlan;
  phase2: Phase2MuscleRestitutionPlan;
}

/**
 * Evaluates clinical deficit and generates personalized 2-phase rehydration and muscle recovery plan.
 */
export function evaluatePostRaceDeficit(
  input: PostRaceDeficitInput,
  birdsCount: number = 20
): PostRaceDeficitEvaluation {
  const ring = input.ringNumber || 'PL-0284-23-1402';
  const normalW = Math.max(250, input.normalWeightGrams);
  const returnW = Math.max(200, Math.min(normalW, input.returnWeightGrams));

  const massLossGrams = Math.round((normalW - returnW) * 10) / 10;
  const massLossPercent = Math.round((massLossGrams / normalW) * 1000) / 10;

  // Approx 75% of acute flight mass loss is water (evaporative cooling); 25% is fat & glycogen
  const fluidDeficitMl = Math.round(massLossGrams * 0.75);
  const lipidCombustedGrams = Math.round(massLossGrams * 0.25 * 10) / 10;

  const signs = input.clinicalSigns || {};
  const clinicalRiskSummary: string[] = [];

  // Severity classification
  let severity: DehydrationSeverity = 'mild';
  let severityLabel = 'Lekkie zmęczenie (Restytucja standardowa)';
  let severityColor = '#10B981';

  if (massLossPercent >= 12.0 || (signs.blueBreastSkin && signs.sunkenEyes)) {
    severity = 'critical';
    severityLabel = 'KRYTYCZNE ODWODNIENIE & ZAKWASZENIE MIĘŚNI';
    severityColor = '#EF4444';
  } else if (massLossPercent >= 8.0 || input.flightDurationHours >= 8 || input.ambientTempC >= 28) {
    severity = 'severe';
    severityLabel = 'Ciężkie wyczerpanie powrotowe (Deficyt > 8%)';
    severityColor = '#F59E0B';
  } else if (massLossPercent >= 5.0 || input.flightDurationHours >= 5) {
    severity = 'moderate';
    severityLabel = 'Umiarkowane odwodnienie (Ubytek 5–8%)';
    severityColor = '#3B82F6';
  } else {
    severity = 'mild';
    severityLabel = 'Lekki ubytek powrotowy (< 5%)';
    severityColor = '#10B981';
  }

  if (signs.sunkenEyes) {
    clinicalRiskSummary.push('Zapadnięte gałki oczne: znaczny deficyt płynów wewnątrzkomórkowych.');
  }
  if (signs.blueBreastSkin) {
    clinicalRiskSummary.push('Sinica skóry mięśnia piersiowego: hipoksja tkankowa i wysokie stężenie mleczanów.');
  }
  if (signs.sharpKeel) {
    clinicalRiskSummary.push('Zaostrzony grzebień mostka: zaawansowany katabolizm białek mięśniowych.');
  }
  if (signs.exhaustedPanting) {
    clinicalRiskSummary.push('Dyszenie i ziajanie: alkalozę oddechową wyrównaj elektrolitami z buforem cytrynianowym.');
  }

  // Phase 1 Formulation (Hours 0-3)
  let glucoseGrams = 12.0;
  let naclGrams = 2.5;
  let kclGrams = 1.2;
  let citrateGrams = 1.5;
  let targetOsm = 290; // Isotonic
  let maxIntake = 20;

  if (severity === 'critical') {
    glucoseGrams = 10.0; // Lower sugar to keep hypotonic for ultra-fast absorption without gut draw
    naclGrams = 3.0;
    kclGrams = 1.6;
    citrateGrams = 2.0;
    targetOsm = 280; // Slightly hypotonic
    maxIntake = 15; // Small initial sips to prevent vomiting
  } else if (severity === 'severe') {
    glucoseGrams = 14.0;
    naclGrams = 2.8;
    kclGrams = 1.4;
    citrateGrams = 1.8;
    targetOsm = 295;
    maxIntake = 20;
  } else if (severity === 'moderate') {
    glucoseGrams = 15.0;
    naclGrams = 2.5;
    kclGrams = 1.2;
    citrateGrams = 1.5;
    targetOsm = 300;
    maxIntake = 25;
  } else {
    glucoseGrams = 12.0;
    naclGrams = 2.0;
    kclGrams = 1.0;
    citrateGrams = 1.0;
    targetOsm = 285;
    maxIntake = 30;
  }

  const phase1: Phase1RehydrationPlan = {
    drinkerWaterLiters: Math.max(1, Math.round((birdsCount * 0.06) * 10) / 10),
    glucoseOrMaltodextrinGramsPerLiter: glucoseGrams,
    sodiumChlorideGramsPerLiter: naclGrams,
    potassiumChlorideGramsPerLiter: kclGrams,
    sodiumCitrateGramsPerLiter: citrateGrams,
    targetOsmolalityMOsmKg: targetOsm,
    solutionTonicity: targetOsm <= 285 ? 'hypotonic' : 'isotonic',
    waterTemperatureAdvice: 'Woda w poidle o temperaturze 18–20°C (bezwzględny zakaz wody lodowatej z kranu!).',
    maxInitialIntakeMlPerBird: maxIntake,
    timingAdvice: 'Podaj natychmiast po przylocie na 2-3 godziny; usuń przed podaniem karmy wieczornej.',
  };

  // Phase 2 Formulation (Evening / Day +1)
  let bcaaGrams = 5.0;
  let wheyProteinGrams = 10.0;
  let lCarnitineMg = 250;
  let vitESeMg = 100;
  let recoveryHours = 24;
  let feedRec = 'Lekkostrawna karma oczyszczająca: dari, kardi, ryż paddy, słonecznik łuskany.';

  if (severity === 'critical') {
    bcaaGrams = 10.0;
    wheyProteinGrams = 18.0;
    lCarnitineMg = 500;
    vitESeMg = 200;
    recoveryHours = 72;
    feedRec = 'Wyłącznie drobne nasiona (dari, proso, siemię lniane, ryż) zwilżone olejem z ostropestu. Zakaz twardej kukurydzy!';
  } else if (severity === 'severe') {
    bcaaGrams = 8.0;
    wheyProteinGrams = 14.0;
    lCarnitineMg = 400;
    vitESeMg = 150;
    recoveryHours = 48;
    feedRec = 'Mieszanka regeneracyjna z 30% udziałem nasion drobnych i oleistych. Drożdże piwne na karmę.';
  } else if (severity === 'moderate') {
    bcaaGrams = 6.0;
    wheyProteinGrams = 10.0;
    lCarnitineMg = 300;
    vitESeMg = 100;
    recoveryHours = 36;
    feedRec = 'Dieta regeneracyjna: kardi, dari, kukurydza drobna, siemię lniane z dodatkiem aminokwasów.';
  }

  const phase2: Phase2MuscleRestitutionPlan = {
    bcaaDosageGramsPerKgFeed: bcaaGrams,
    wheyProteinGramsPerKgFeed: wheyProteinGrams,
    lCarnitineMgPerLiterWater: lCarnitineMg,
    vitaminEPlusSeleniumMgPerLiter: vitESeMg,
    feedRecommendation: feedRec,
    recoveryEstimatedHours: recoveryHours,
  };

  return {
    ringNumber: ring,
    normalWeightGrams: normalW,
    returnWeightGrams: returnW,
    massLossGrams,
    massLossPercent,
    estimatedFluidDeficitMl: fluidDeficitMl,
    estimatedLipidCombustedGrams: lipidCombustedGrams,
    severity,
    severityLabel,
    severityColor,
    clinicalRiskSummary,
    phase1,
    phase2,
  };
}

/**
 * Generates official A4 Post-Race Restitution Protocol HTML.
 */
export function generatePostRaceRestitutionHtml(
  evaluation: PostRaceDeficitEvaluation,
  meta?: {
    loftName?: string;
    raceName?: string;
    seasonYear?: number;
  }
): string {
  const loft = meta?.loftName || 'Gołębnik Mistrza Pigeon-Fly';
  const race = meta?.raceName || 'Lot Konkursowy PZHGP';
  const year = meta?.seasonYear || new Date().getFullYear();

  const risksHtml = evaluation.clinicalRiskSummary.length > 0
    ? evaluation.clinicalRiskSummary.map((r) => `<li>${r}</li>`).join('')
    : '<li>Brak ostrych objawów powikłań powrotowych; ubytek w granicach fizjologii.</li>';

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>Protokół Restytucji Powrotowej - ${evaluation.ringNumber}</title>
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
    .header-box { border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 12px; }
    .title { font-size: 19px; font-weight: 900; color: #0284c7; text-transform: uppercase; }
    .subtitle { font-size: 11px; color: #64748b; font-weight: 600; }
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
    .kpi-val { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 2px; }
    .severity-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      color: #ffffff;
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      margin: 12px 0 6px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 6px 8px; border: 1px solid #cbd5e1; }
    td { padding: 5px 8px; border: 1px solid #cbd5e1; }
    .val-strong { font-weight: 800; color: #0369a1; }
    .risk-box {
      background: #fef2f2;
      border: 1px solid #f87171;
      border-radius: 6px;
      padding: 10px;
      font-size: 11px;
      color: #991b1b;
      margin-bottom: 12px;
    }
    .risk-box ul { margin: 4px 0 0 16px; padding: 0; }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="title">⚡ PROTOKÓŁ BILANSU ELEKTROLITOWEGO I RESTYTUCJI POWROTOWEJ</div>
    <div class="subtitle">${loft} &bull; ${race} &bull; Sezon ${year} &bull; Ptak: ${evaluation.ringNumber}</div>
  </div>

  <div class="severity-badge" style="background-color: ${evaluation.severityColor};">
    ${evaluation.severityLabel}
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">UBYTEK MASY</div>
      <div class="kpi-val">${evaluation.massLossGrams} g (${evaluation.massLossPercent}%)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">DEFICYT PŁYNÓW</div>
      <div class="kpi-val">${evaluation.estimatedFluidDeficitMl} ml</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">SPALONY TŁUSZCZ</div>
      <div class="kpi-val">${evaluation.estimatedLipidCombustedGrams} g</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">CZAS REGENERACJI</div>
      <div class="kpi-val">${evaluation.phase2.recoveryEstimatedHours} h</div>
    </div>
  </div>

  <div class="risk-box">
    <strong>OCENA KLINICZNA I RYZYKA METABOLICZNE:</strong>
    <ul>${risksHtml}</ul>
  </div>

  <div class="section-title">FAZA I: REHYDRATACJA I ODBUDOWA GLIKOGENU (GODZINY 0–3)</div>
  <table>
    <thead>
      <tr>
        <th>Składnik poidła</th>
        <th>Dawka / Litr wody</th>
        <th>Rola fizjologiczna</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Glukoza / Maltodekstryna</strong></td>
        <td class="val-strong">${evaluation.phase1.glucoseOrMaltodextrinGramsPerLiter} g/L</td>
        <td>Błyskawiczne zasilenie wątroby bez fermentacji w wolu</td>
      </tr>
      <tr>
        <td><strong>Sól kuchenna (NaCl)</strong></td>
        <td class="val-strong">${evaluation.phase1.sodiumChlorideGramsPerLiter} g/L</td>
        <td>Odbudowa objętości osocza krwi i zatrzymanie wody w komórkach</td>
      </tr>
      <tr>
        <td><strong>Chlorek potasu (KCl)</strong></td>
        <td class="val-strong">${evaluation.phase1.potassiumChlorideGramsPerLiter} g/L</td>
        <td>Przywrócenie potencjału błonowego mięśnia sercowego</td>
      </tr>
      <tr>
        <td><strong>Cytrynian sodu</strong></td>
        <td class="val-strong">${evaluation.phase1.sodiumCitrateGramsPerLiter} g/L</td>
        <td>Neutralizacja kwasicy metabolicznej po wysiłku beztlenowym</td>
      </tr>
      <tr>
        <td><strong>Osmolalność docelowa</strong></td>
        <td class="val-strong">${evaluation.phase1.targetOsmolalityMOsmKg} mOsm/kg (${evaluation.phase1.solutionTonicity})</td>
        <td>Gwarancja natychmiastowego wchłaniania bez biegunki osmotycznej</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size: 10px; color: #475569; margin-bottom: 12px;">
    &bull; ${evaluation.phase1.waterTemperatureAdvice}<br />
    &bull; Maksymalna porcja na 1. napojenie: <strong>${evaluation.phase1.maxInitialIntakeMlPerBird} ml/ptaka</strong> (zapobiega wymiotom powrotnym).
  </div>

  <div class="section-title">FAZA II: RESTYTUCJA MIĘŚNIOWA I OCHRONA MITOCHONDRIÓW (WIECZÓR / DZIEŃ +1)</div>
  <table>
    <thead>
      <tr>
        <th>Suplement / Karma</th>
        <th>Zalecana dawka</th>
        <th>Mechanizm działania</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>BCAA (Leucyna, Izoleucyna, Walina)</strong></td>
        <td class="val-strong">${evaluation.phase2.bcaaDosageGramsPerKgFeed} g/kg karmy</td>
        <td>Natychmiastowe zahamowanie katabolizmu białek mięśni piersiowych</td>
      </tr>
      <tr>
        <td><strong>Izolat białka serwatkowego / Drożdże</strong></td>
        <td class="val-strong">${evaluation.phase2.wheyProteinGramsPerKgFeed} g/kg karmy</td>
        <td>Odbudowa mikrouszkodzeń włókien mięśnia piersiowego większego</td>
      </tr>
      <tr>
        <td><strong>L-Karnityna</strong></td>
        <td class="val-strong">${evaluation.phase2.lCarnitineMgPerLiterWater} mg/L wody</td>
        <td>Spłukiwanie kwasu mlekowego i transport kwasów tłuszczowych</td>
      </tr>
      <tr>
        <td><strong>Witamina E + Selen organiczny</strong></td>
        <td class="val-strong">${evaluation.phase2.vitaminEPlusSeleniumMgPerLiter} mg/L wody</td>
        <td>Ochrona błon komórkowych przed stresem oksydacyjnym</td>
      </tr>
    </tbody>
  </table>

  <div style="font-size: 11px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px;">
    <strong>Zalecana dieta wieczorna:</strong> ${evaluation.phase2.feedRecommendation}
  </div>

  <div style="font-size: 9px; color: #94a3b8; text-align: right; margin-top: 14px;">
    Pigeon-Fly Physiology Lab &bull; Zgodność ze standardami medycyny sportowej ptaków PZHGP
  </div>
</body>
</html>
  `.trim();
}
