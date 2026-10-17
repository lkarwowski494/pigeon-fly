/**
 * PIGEON-FLY — Carbo-Lipid Supercompensation & Marathon Loading Engine (Z-083 / DEC-97)
 * High-performance metabolic preparation for long-distance and marathon flights (400 - 1000+ km):
 * - Bioenergetics: Beta-oxidation of fatty acids supplies 90-95% of flight energy after 60 min.
 * - Fat combustion rate: 2.8 - 4.5 g/h depending on flight resistance, temperature, and wind.
 * - 96-hour phased supercompensation protocol (D-4, D-3, D-2, D-1 koszowanie).
 * - Targeted macro ratio balancing: Lipids (up to 16-22% in feed), Carbohydrates, L-Carnitine transport.
 */

export interface RaceConditionInput {
  raceDistanceKm: number; // np. 740 km
  predictedSpeedMPerMin: number; // np. 1150 m/min (~69 km/h)
  ambientTempC: number; // np. 26°C
  headwindKmh?: number; // np. 15 km/h
  flockSize?: number; // Liczba ptaków w stadzie lotowym
}

export interface DayFeedingPhase {
  dayName: string; // np. "D-4 (Wtorek) — 96h przed koszowaniem"
  phaseObjective: string;
  recommendedCarboPercent: number;
  recommendedFatPercent: number;
  recommendedProteinPercent: number;
  grainsRecommendation: string[];
  oilsAndSupplements: string[];
  drinkerAdditives: string[];
  feedGramsPerBird: number;
}

export interface CarboLipidSupercompensationPlan {
  raceDistanceKm: number;
  estimatedFlightHours: number;
  fatCombustionRateGramsPerHour: number;
  totalFatRequirementPerBirdGrams: number;
  totalEnergyExpenditureKcal: number;
  flightIntensityCategory: 'moderate' | 'demanding' | 'extreme_marathon';
  intensityLabel: string;
  intensityColor: string;
  fourDaySchedule: DayFeedingPhase[];
  keyTacticalGuidelines: string[];
}

/**
 * Calculates metabolic flight requirement and generates 4-day supercompensation loading schedule.
 */
export function calculateCarboLipidPlan(
  input: RaceConditionInput
): CarboLipidSupercompensationPlan {
  const dist = Math.max(100, input.raceDistanceKm);
  const speed = Math.max(700, Math.min(2000, input.predictedSpeedMPerMin));
  const temp = input.ambientTempC ?? 22;
  const wind = input.headwindKmh ?? 0;

  // Flight duration in hours: (dist * 1000) / (speed * 60)
  const estimatedFlightHours = Math.round(((dist * 1000) / (speed * 60)) * 10) / 10;

  // Base lipid burn: 2.8 g/h in neutral calm; increases with headwind and high/low temperatures
  let burnRate = 2.8;
  if (wind >= 20) burnRate += 0.8;
  else if (wind >= 10) burnRate += 0.4;

  if (temp >= 28) burnRate += 0.5; // Extra energy for heat dissipating evaporative panting
  else if (temp <= 14) burnRate += 0.4; // Extra thermogenesis

  burnRate = Math.round(burnRate * 10) / 10;

  const totalFatRequirementPerBirdGrams =
    Math.round(estimatedFlightHours * burnRate * 10) / 10;

  // 1 g fat = ~9.3 kcal; plus initial glycogen burst (~45 kcal)
  const totalEnergyExpenditureKcal = Math.round(
    totalFatRequirementPerBirdGrams * 9.3 + 45
  );

  let flightIntensityCategory: 'moderate' | 'demanding' | 'extreme_marathon' = 'moderate';
  let intensityLabel = 'Lot Średniodystansowy (Standardowe nasycenie)';
  let intensityColor = '#10B981';

  if (dist >= 700 || estimatedFlightHours >= 10) {
    flightIntensityCategory = 'extreme_marathon';
    intensityLabel = 'EKSTREMALNY MARATON (Maksymalne nasycenie lipidami)';
    intensityColor = '#EF4444';
  } else if (dist >= 450 || estimatedFlightHours >= 6.5) {
    flightIntensityCategory = 'demanding';
    intensityLabel = 'Wymagający Daleki Dystans (Wysokie ładowanie energetyczne)';
    intensityColor = '#F59E0B';
  }

  // 4-Day loading schedule
  const fourDaySchedule: DayFeedingPhase[] = [
    {
      dayName: 'D-4 (Wtorek) — 96h: Odbudowa Glikogenu Wątrobowego',
      phaseObjective: 'Uzupełnienie węglowodanów złożonych o średnim IG, lekkostrawna baza.',
      recommendedCarboPercent: 65,
      recommendedFatPercent: 8,
      recommendedProteinPercent: 14,
      grainsRecommendation: [
        'Drobna kukurydza żółta (cribbs)',
        'Dari i kardi w proporcji 1:1',
        'Ryż paddy (bogaty w krzemionkę)',
        'Jęczmień browarny łuskany',
      ],
      oilsAndSupplements: ['Olej z czosnku lub oregano', 'Drożdże piwne bogate w witaminy grupy B'],
      drinkerAdditives: ['Elektrolity z buforem cytrynianowym', 'Zakwaszacz ziołowy pH 4.5'],
      feedGramsPerBird: 32,
    },
    {
      dayName: 'D-3 (Środa) — 72h: Inicjacja Ładowania Tłuszczowego I',
      phaseObjective: 'Początek nasycania tkanki mięśniowej długołańcuchowymi kwasami tłuszczowymi.',
      recommendedCarboPercent: 54,
      recommendedFatPercent: 14,
      recommendedProteinPercent: 14,
      grainsRecommendation: [
        'Słonecznik czarny łuskany (15%)',
        'Kardi (krokosz barwierski 20%)',
        'Kukurydza czerwona Bordeaux (25%)',
        'Konopie siewne (5%)',
      ],
      oilsAndSupplements: ['Lecytyna sojowa (emulgator tłuszczów)', 'Glukoza w proszku na karmę'],
      drinkerAdditives: ['L-Karnityna (250 mg/L — stymulacja transportu mitochondrialnego kwasów tłuszczowych)'],
      feedGramsPerBird: 35,
    },
    {
      dayName: 'D-2 (Czwartek) — 48h: Szczyt Superkompensacji Lipidowej II',
      phaseObjective: 'Głębokie nasycenie rezerw wewnątrzkomórkowych mięśnia piersiowego.',
      recommendedCarboPercent: 44,
      recommendedFatPercent: 20,
      recommendedProteinPercent: 13,
      grainsRecommendation: [
        'Orzeszki ziemne nieprażone, niesolone (rozdrobnione 10%)',
        'Słonecznik łuskany (20%)',
        'Konopie (8%)',
        'Kukurydza zębowa i popcorn (30%)',
        'Siemię lniane złote (bogate w Omega-3)',
      ],
      oilsAndSupplements: [
        'Olej z zarodków pszennych (naturalna witamina E)',
        'Tłuszcz owczy z oregano',
      ],
      drinkerAdditives: [
        'L-Karnityna (500 mg/L)',
        'Magnez organiczny + Witamina C (ochrona przed skurczami mięśni)',
      ],
      feedGramsPerBird: 38,
    },
    {
      dayName: 'D-1 (Piątek) — Dzień Koszowania: Gotowość Metaboliczna',
      phaseObjective: 'Zapewnienie pełnego wola lekkostrawnej energii bez obciążania przewodu pokarmowego w kabinie.',
      recommendedCarboPercent: 50,
      recommendedFatPercent: 16,
      recommendedProteinPercent: 12,
      grainsRecommendation: [
        'Kukurydza drobna słodka (łatwo strawna)',
        'Nasiona słonecznika łuskanego i konopie',
        'Drobne nasiona oleiste (dari, kanar)',
        'Zakaz ciężkiego grochu i bobiku w ostatnich 12h!',
      ],
      oilsAndSupplements: ['Czysty miód pszczeli lekko nawilżający karmę'],
      drinkerAdditives: [
        'Czysta chłodna woda (18°C) z dodatkiem 5 g/L glukozy',
        'Pojenie do woli na 2 godziny przed koszowaniem',
      ],
      feedGramsPerBird: 30,
    },
  ];

  const keyTacticalGuidelines = [
    `Szacowany czas lotu wynosi ${estimatedFlightHours} godz. — gołąb spali ok. ${totalFatRequirementPerBirdGrams} g czystego tłuszczu ustrojowego.`,
    'Zasada L-Karnityny: Bez karnityny transport kwasów tłuszczowych przez wewnętrzną błonę mitochondriów ulega zablokowaniu, co wymusza katabolizm białek mięśniowych.',
    'Orzeszki ziemne podawaj wyłącznie z pewnego źródła, wolne od aflatoksyn (pleśni Aspergillus flavus).',
    'W dniu koszowania unikaj nasion strączkowych o wysokiej zawartości białka (groch, wyka), które zakwaszają organizm mocznikiem i wymagają dużych ilości wody do trawienia w kabinie.',
  ];

  return {
    raceDistanceKm: dist,
    estimatedFlightHours,
    fatCombustionRateGramsPerHour: burnRate,
    totalFatRequirementPerBirdGrams,
    totalEnergyExpenditureKcal,
    flightIntensityCategory,
    intensityLabel,
    intensityColor,
    fourDaySchedule,
    keyTacticalGuidelines,
  };
}

/**
 * Generates official A4 Carbo-Lipid Supercompensation Plan HTML.
 */
export function generateCarboLipidPlanHtml(
  plan: CarboLipidSupercompensationPlan,
  meta?: {
    loftName?: string;
    raceName?: string;
    seasonYear?: number;
  }
): string {
  const loft = meta?.loftName || 'Gołębnik Mistrza Pigeon-Fly';
  const race = meta?.raceName || 'Lot Dalekodystansowy / Maraton PZHGP';
  const year = meta?.seasonYear || new Date().getFullYear();

  const daysHtml = plan.fourDaySchedule
    .map((day) => `
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
          <div style="font-weight: 800; font-size: 9.5pt; color: #0f172a;">${day.dayName}</div>
          <div style="font-size: 8pt; font-weight: 700; color: #0369a1;">
            Tłuszcz: ${day.recommendedFatPercent}% | Węglowodany: ${day.recommendedCarboPercent}% | Białko: ${day.recommendedProteinPercent}%
          </div>
        </div>
        <div style="font-size: 8.5pt; color: #334155; margin-bottom: 4px; font-style: italic;">${day.phaseObjective}</div>
        <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 6px; font-size: 8pt;">
          <div>
            <strong>Mieszanka Ziaren:</strong>
            <ul style="margin: 2px 0; padding-left: 14px; color: #475569;">
              ${day.grainsRecommendation.map((g) => `<li>${g}</li>`).join('')}
            </ul>
          </div>
          <div>
            <strong>Oleje i Dodatki:</strong>
            <ul style="margin: 2px 0; padding-left: 14px; color: #475569;">
              ${day.oilsAndSupplements.map((o) => `<li>${o}</li>`).join('')}
            </ul>
          </div>
          <div>
            <strong>Poidło:</strong>
            <ul style="margin: 2px 0; padding-left: 14px; color: #475569;">
              ${day.drinkerAdditives.map((d) => `<li>${d}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `)
    .join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Plan Superkompensacji Węglowodanowo-Tłuszczowej — ${loft}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.35;
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
    .title { font-size: 14pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 9pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8.5pt; text-align: right; color: #334155; }
    .kpi-banner {
      border: 1.5px solid ${plan.intensityColor};
      background: #f8fafc;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .kpi-title { font-size: 11pt; font-weight: 900; color: ${plan.intensityColor}; }
    .kpi-desc { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .kpi-stat { text-align: right; }
    .kpi-stat-val { font-size: 15pt; font-weight: 900; color: #0f172a; }
    .kpi-stat-sub { font-size: 8pt; color: #64748b; }
    .guidelines-box {
      background: #f1f5f9;
      border-left: 3.5px solid #0284c7;
      border-radius: 4px;
      padding: 8px 12px;
      margin-top: 10px;
      font-size: 8pt;
      color: #334155;
    }
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
      <div class="title">Superkompensacja Metaboliczna Przed Lotem</div>
      <div class="subtitle">Krzywa Ładowania Tłuszczowego i Węglowodanowego (Z-083)</div>
    </div>
    <div class="meta">
      <div><strong>${loft}</strong></div>
      <div>${race} • Sezon ${year}</div>
      <div>Dystans: <strong>${plan.raceDistanceKm} km</strong></div>
    </div>
  </div>

  <div class="kpi-banner">
    <div>
      <div class="kpi-title">${plan.intensityLabel}</div>
      <div class="kpi-desc">
        Czas w locie: <strong>${plan.estimatedFlightHours} h</strong> • Spalanie tłuszczu: <strong>${plan.fatCombustionRateGramsPerHour} g/h</strong>
      </div>
    </div>
    <div class="kpi-stat">
      <div class="kpi-stat-val">${plan.totalFatRequirementPerBirdGrams} g tłuszczu</div>
      <div class="kpi-stat-sub">Zapotrzebowanie na ptaka (~${plan.totalEnergyExpenditureKcal} kcal)</div>
    </div>
  </div>

  ${daysHtml}

  <div class="guidelines-box">
    <strong>Kluczowe Zasady Fizjologiczne Przed Koszowaniem:</strong>
    <ul style="margin: 4px 0; padding-left: 16px;">
      ${plan.keyTacticalGuidelines.map((g) => `<li>${g}</li>`).join('')}
    </ul>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Protokół Przygotowania Metabolicznego Maratonu Z-083</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
