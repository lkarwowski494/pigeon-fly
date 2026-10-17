/**
 * PIGEON-FLY — Health, Medication, and Withdrawal Period Guard
 * Prevents basketing birds during active pharmaceutical withdrawal (karencja).
 */

import { HealthLog } from './types';

export interface WithdrawalStatus {
  isUnderWithdrawal: boolean;
  daysRemaining: number;
  clearedDate: string; // YYYY-MM-DD
  activeMedications: {
    productName: string;
    treatedDate: string;
    withdrawalDays: number;
    daysRemaining: number;
  }[];
}

/**
 * Checks whether a pigeon is currently under medication withdrawal period.
 */
export function checkWithdrawalPeriod(
  pigeonId: string,
  healthLogs: HealthLog[],
  targetDate: Date = new Date()
): WithdrawalStatus {
  const targetTime = new Date(targetDate).setHours(0, 0, 0, 0);

  const activeMedications: WithdrawalStatus['activeMedications'] = [];
  let maxClearedTime = targetTime;

  for (const log of healthLogs) {
    // Check if log applies to this pigeon or entire flock (pigeonId is null/undefined)
    if (log.pigeonId && log.pigeonId !== pigeonId) {
      continue;
    }

    if (log.withdrawalDays > 0) {
      const treatedDate = new Date(log.date);
      treatedDate.setHours(0, 0, 0, 0);

      const clearedDate = new Date(treatedDate);
      clearedDate.setDate(clearedDate.getDate() + log.withdrawalDays);

      if (clearedDate.getTime() > targetTime) {
        const daysRemaining = Math.ceil((clearedDate.getTime() - targetTime) / (1000 * 60 * 60 * 24));
        activeMedications.push({
          productName: log.productName,
          treatedDate: log.date,
          withdrawalDays: log.withdrawalDays,
          daysRemaining,
        });

        if (clearedDate.getTime() > maxClearedTime) {
          maxClearedTime = clearedDate.getTime();
        }
      }
    }
  }

  const isUnderWithdrawal = activeMedications.length > 0;
  const daysRemaining = isUnderWithdrawal
    ? Math.max(...activeMedications.map((m) => m.daysRemaining))
    : 0;

  const clearedDateObj = new Date(maxClearedTime);
  const clearedDate = clearedDateObj.toISOString().split('T')[0];

  return {
    isUnderWithdrawal,
    daysRemaining,
    clearedDate,
    activeMedications,
  };
}

/**
 * Validates PMV-1 (paramyxovirus) vaccination compliance.
 * Official regulations require vaccination at least 21 days before basketing and within the last 365 days.
 */
export function validateParamyxoVaccination(
  pigeonId: string,
  healthLogs: HealthLog[],
  basketDate: Date = new Date()
): { isValid: boolean; reason?: string; lastVaccinatedDate?: string } {
  const basketTime = new Date(basketDate).setHours(0, 0, 0, 0);

  const vaccineLogs = healthLogs
    .filter(
      (log) =>
        (!log.pigeonId || log.pigeonId === pigeonId) &&
        (log.eventType === 'vaccine' || log.productName.toLowerCase().includes('paramyxo') || log.productName.toLowerCase().includes('pmv'))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (vaccineLogs.length === 0) {
    return {
      isValid: false,
      reason: 'Brak zarejestrowanego szczepienia przeciw paramyksowirozie (PMV-1). Ptak nie może być koszowany na loty.',
    };
  }

  const lastVaccine = vaccineLogs[0];
  const lastVaccineTime = new Date(lastVaccine.date).setHours(0, 0, 0, 0);
  const daysSinceVaccine = Math.floor((basketTime - lastVaccineTime) / (1000 * 60 * 60 * 24));

  if (daysSinceVaccine < 21) {
    return {
      isValid: false,
      lastVaccinatedDate: lastVaccine.date,
      reason: `Szczepienie wykonano zaledwie ${daysSinceVaccine} dni temu. Odporność poszczepienna rozwija się po min. 21 dniach.`,
    };
  }

  if (daysSinceVaccine > 365) {
    return {
      isValid: false,
      lastVaccinatedDate: lastVaccine.date,
      reason: `Ważność szczepienia wygasła (${daysSinceVaccine} dni temu). Wymagane coroczne doszczepienie stada.`,
    };
  }

  return {
    isValid: true,
    lastVaccinatedDate: lastVaccine.date,
  };
}

/**
 * -------------------------------------------------------------
 * BR-ZDR-010 & RD-27: YPDS (Adeno-Coli) Clinical Diagnostic & Triage
 * -------------------------------------------------------------
 */

export type YpdsSymptom =
  | 'crop_stasis' // Wole lejące / zaleganie płynu i fermentującego ziarna
  | 'vomiting' // Wymioty ziarnem
  | 'green_mucoid_diarrhea' // Zielonkawa śluzowata cuchnąca biegunka
  | 'lethargy' // Apatia, nastroszone pióra, chowanie głowy w ramionach
  | 'rapid_weight_loss'; // Gwałtowne chudnięcie / ostry spadek masy mięśniowej

export type YpdsRiskLevel = 'none' | 'suspected' | 'acute' | 'critical';

export interface YpdsAssessment {
  riskLevel: YpdsRiskLevel;
  isEmergency: boolean;
  quarantineRequired: boolean;
  contraindications: string[];
  recommendedProtocols: {
    title: string;
    description: string;
    priority: 'urgent' | 'high' | 'standard';
  }[];
  summary: string;
}

export function evaluateYpdsRisk(params: {
  symptoms: YpdsSymptom[];
  isYoungBird: boolean;
}): YpdsAssessment {
  const { symptoms, isYoungBird } = params;
  const count = symptoms.length;

  if (count === 0) {
    return {
      riskLevel: 'none',
      isEmergency: false,
      quarantineRequired: false,
      contraindications: [],
      recommendedProtocols: [],
      summary: 'Brak objawów chorobowych. Ptak zdrowy.',
    };
  }

  const hasCropStasis = symptoms.includes('crop_stasis');
  const hasVomiting = symptoms.includes('vomiting');
  const hasGreenDiarrhea = symptoms.includes('green_mucoid_diarrhea');

  let riskLevel: YpdsRiskLevel = 'suspected';
  if ((hasCropStasis || hasVomiting) && hasGreenDiarrhea && isYoungBird) {
    riskLevel = count >= 4 ? 'critical' : 'acute';
  } else if (count >= 3 && isYoungBird) {
    riskLevel = 'acute';
  }

  const isEmergency = riskLevel === 'acute' || riskLevel === 'critical';

  const contraindications = [
    'BEZWZGLĘDNY ZAKAZ KOSZOWANIA na loty konkursowe i treningi!',
    'ZAKAZ podawania twardego ziarna (groch, wyka, kukurydza) przez minimum 24-48 godzin.',
    'ZAKAZ podawania zimnej wody z kranu — może wywołać szok termiczny osłabionego wola.',
    'ZAKAZ podawania antybiotyków w ciemno bez antybiogramu (wirusa Adeno antybiotyk nie leczy!).',
  ];

  const recommendedProtocols = [
    {
      title: '1. Natychmiastowa Izolacja (Quarantine)',
      description:
        'Przenieś chorego ptaka do przedziału Izolatka, aby zablokować transmisję Adenowirusa i enteropatogennej E. coli na resztę stada.',
      priority: 'urgent' as const,
    },
    {
      title: '2. Głódź lecznicza i odciążenie wola',
      description:
        'Całkowite odstawienie karmy przez 24 godziny. Po ustąpieniu wymiotów podawaj wyłącznie lekkostrawny ryż łuskany, kanar i proso.',
      priority: 'urgent' as const,
    },
    {
      title: '3. Zakwaszenie poidła do pH 4.0 - 4.2',
      description:
        'Podaj ocet jabłkowy lub kwas mrówkowy/propionowy z oregano. Niskie pH niszczy otoczkę bakteryjną E. coli w żołądku gruczołowym.',
      priority: 'urgent' as const,
    },
    {
      title: '4. Rehydratacja izotoniczna (300 mOsm/L)',
      description:
        'Elektrolity z glukozą i miodem zapobiegają wstrząsowi hipowolemicznemu w wyniku odwodnienia biegunkowego.',
      priority: 'high' as const,
    },
    {
      title: '5. Przeciwciała żółtkowe IgY + Maślan sodu',
      description:
        'Biologiczna ochrona nabłonka jelitowego: immunoglobuliny żółtkowe IgY neutralizują patogeny, a kwas masłowy odbudowuje kosmki jelitowe.',
      priority: 'high' as const,
    },
  ];

  let summary = '';
  if (riskLevel === 'critical') {
    summary =
      'KRYTYCZNE ZAGROŻENIE ŻYCIA: Ostra postać posocznicy Adeno-Coli z zaleganiem w wolu i wycieńczeniem. Wymagana natychmiastowa interwencja lekarska.';
  } else if (riskLevel === 'acute') {
    summary =
      'Poważne podejrzenie Zespołu Choroby Młodych (YPDS / Adeno-Coli). Wdrożono czerwony protokół ratunkowy RD-27.';
  } else {
    summary =
      'Objawy niespecyficzne lub wczesne stadium niestrawności. Obserwuj ptaka w izolatce przez 24 godziny.';
  }

  return {
    riskLevel,
    isEmergency,
    quarantineRequired: true,
    contraindications,
    recommendedProtocols,
    summary,
  };
}

/**
 * -------------------------------------------------------------
 * BR-ZDR-008 & Z-306: Koproskopia i Diagnostyka Pasożytnicza
 * -------------------------------------------------------------
 */

export type CoccidiaLevel = 'negative' | 'mild' | 'moderate' | 'heavy';
export type TrichomonasLevel = 'negative' | 'mild' | 'severe';

export interface CoproscopyRecord {
  id: string;
  loftId: string;
  date: string; // YYYY-MM-DD
  sampleType: 'flock_composite' | 'individual';
  pigeonId?: string;
  coccidia: CoccidiaLevel; // 0, +, ++, +++
  nematodesPresent: boolean; // Ascaridia columbae
  capillariaPresent: boolean; // Capillaria obsignata
  trichomonas: TrichomonasLevel; // Trichomonas gallinae
  notes?: string;
}

export interface CoproscopyEvaluation {
  overallHealthStatus: 'clean' | 'mild_infestation' | 'treatment_required';
  requiresChemicalMedication: boolean;
  requiresLoftDisinfection: boolean;
  coccidiaOpg?: number;
  nematodeHpf?: number;
  recommendations: {
    target: string;
    protocol: string;
    isChemical: boolean;
  }[];
  summary: string;
}

/**
 * Classifies quantitative Coccidia OPG (Oocysts Per Gram of feces)
 * according to veterinary clinical parasitology thresholds (Z-306):
 * - 0: negative
 * - 1-999: mild / subclinical (natural acids, no chemical coccidiostat)
 * - 1000-4999: moderate (toltrazuril or sulfonamides under vet control)
 * - >=5000: heavy / acute clinical coccidiosis (urgent therapy + flaming/disinfection)
 */
export function classifyCoccidiaOpg(opg: number): {
  level: CoccidiaLevel;
  thresholdLabel: string;
  isChemicalNeeded: boolean;
} {
  if (opg <= 0) {
    return { level: 'negative', thresholdLabel: '0 OPG — Wynik ujemny', isChemicalNeeded: false };
  } else if (opg < 1000) {
    return {
      level: 'mild',
      thresholdLabel: `${opg} OPG — Poziom subkliniczny (<1000 OPG). Tylko terapia naturalna!`,
      isChemicalNeeded: false,
    };
  } else if (opg < 5000) {
    return {
      level: 'moderate',
      thresholdLabel: `${opg} OPG — Poziom umiarkowany (1000–5000 OPG). Zalecana kuracja celowana.`,
      isChemicalNeeded: true,
    };
  } else {
    return {
      level: 'heavy',
      thresholdLabel: `⚠️ ${opg} OPG — Poziom masowy (>5000 OPG)! Bezwzględna kuracja i wypalenie rusztów.`,
      isChemicalNeeded: true,
    };
  }
}

export interface CoproscopyInput {
  coccidia?: CoccidiaLevel;
  coccidiaOpg?: number;
  nematodesPresent?: boolean;
  nematodeHpf?: number;
  capillariaPresent?: boolean;
  trichomonas?: TrichomonasLevel;
}

export function evaluateCoproscopy(record: CoproscopyInput): CoproscopyEvaluation {
  const recommendations: CoproscopyEvaluation['recommendations'] = [];
  let requiresChemicalMedication = false;
  let requiresLoftDisinfection = false;

  // Determine effective coccidia level
  let effectiveCoccidia: CoccidiaLevel = record.coccidia || 'negative';
  if (record.coccidiaOpg !== undefined && record.coccidiaOpg >= 0) {
    effectiveCoccidia = classifyCoccidiaOpg(record.coccidiaOpg).level;
  }

  // Determine effective nematode status
  let effectiveNematodes = record.nematodesPresent ?? false;
  if (record.nematodeHpf !== undefined && record.nematodeHpf > 0) {
    effectiveNematodes = true;
  }

  const effectiveCapillaria = record.capillariaPresent ?? false;
  const effectiveTrichomonas = record.trichomonas || 'negative';

  // Coccidia evaluation
  if (effectiveCoccidia === 'heavy') {
    requiresChemicalMedication = true;
    requiresLoftDisinfection = true;
    recommendations.push({
      target: 'Kokcydioza (Masowa +++)',
      protocol:
        'Kuracja toltrazurilem (Baycox 2.5%, 1 ml/L przez 2 dni) + wypalenie podłogi palnikiem gazowym.',
      isChemical: true,
    });
  } else if (effectiveCoccidia === 'moderate') {
    requiresChemicalMedication = true;
    recommendations.push({
      target: 'Kokcydioza (Pojedyncza ++)',
      protocol: 'Kuracja sulfonamidem lub toltrazurilem pod kontrolą weterynarza.',
      isChemical: true,
    });
  } else if (effectiveCoccidia === 'mild') {
    recommendations.push({
      target: 'Kokcydioza (Nieliczne +)',
      protocol:
        'Tylko naturalna terapia: zakwaszanie poidła octem jabłkowym / oregano, witamina A + suszenie rusztów bez chemii!',
      isChemical: false,
    });
  }

  // Nematodes evaluation
  if (effectiveNematodes) {
    requiresChemicalMedication = true;
    requiresLoftDisinfection = true;
    recommendations.push({
      target: 'Glistnica (Ascaridia columbae)',
      protocol:
        'Jednorazowe podanie lewamizolu lub fenbendazolu na czczo; powtórka po 14 dniach; dokładne odkurzenie i dezynfekcja celi.',
      isChemical: true,
    });
  }

  // Capillaria evaluation
  if (effectiveCapillaria) {
    requiresChemicalMedication = true;
    requiresLoftDisinfection = true;
    recommendations.push({
      target: 'Kapilarioza (Capillaria obsignata)',
      protocol:
        'Kuracja lewamizolem lub iwermektyną; włosogłówki głęboko wnikają w śluzówkę jelita, podać probiotyk po kuracji.',
      isChemical: true,
    });
  }

  // Trichomonas evaluation
  if (effectiveTrichomonas === 'severe') {
    requiresChemicalMedication = true;
    recommendations.push({
      target: 'Trichomonadoza (Rzęsistek / Żółty guzek)',
      protocol:
        'Ronidazol 10% (lub karnidazol 1 tabl./ptaka) przez 5-7 dni + zakwaszenie poidła do pH 4.2.',
      isChemical: true,
    });
  } else if (effectiveTrichomonas === 'mild') {
    recommendations.push({
      target: 'Trichomonadoza (Niska liczba trofozoitów)',
      protocol:
        'Naturalne zakwaszenie poidła (pH 4.2) + wyciąg z czosnku i brodaczki (usnea barbata) przez 3 dni.',
      isChemical: false,
    });
  }

  let overallHealthStatus: CoproscopyEvaluation['overallHealthStatus'] = 'clean';
  let summary =
    'Wynik badania parazytologicznego prawidłowy — stado wolne od inwazji pasożytów.';

  if (requiresChemicalMedication) {
    overallHealthStatus = 'treatment_required';
    summary = 'Wykryto patogeny wymagające interwencji leczniczej i dezynfekcji gołębnika.';
  } else if (recommendations.length > 0) {
    overallHealthStatus = 'mild_infestation';
    summary =
      'Wykryto nieliczne pasożyty podprogowe. Rekomendowana profilaktyka naturalna bez antybiotyków i chemioterapii.';
  }

  return {
    overallHealthStatus,
    requiresChemicalMedication,
    requiresLoftDisinfection,
    coccidiaOpg: record.coccidiaOpg,
    nematodeHpf: record.nematodeHpf,
    recommendations,
    summary,
  };
}

/**
 * -------------------------------------------------------------
 * BR-ZDR-008: 12-Miesięczny Kalendarz Weterynaryjny Stada
 * -------------------------------------------------------------
 */

export interface VeterinaryMonthGuide {
  month: number;
  monthName: string;
  seasonFocus: string;
  keyActions: string[];
  recommendedDiagnostics: string[];
  mandatoryVaccinations: string[];
}

const ANNUAL_VET_CALENDAR: VeterinaryMonthGuide[] = [
  {
    month: 1,
    monthName: 'Styczeń',
    seasonFocus: 'Przegląd zimowy & Szczepienia przedlęgowe',
    keyActions: [
      'Badanie koproskopowe (flotacja) na kokcydia i nicienie',
      'Wypalanie rusztów i cel palnikiem gazowym',
      'Szczepienie stada przeciw paramyksowirozie (PMV-1)',
    ],
    recommendedDiagnostics: ['Badanie kału (koproskopia flotacyjna)', 'Ocena ubytków upierzenia'],
    mandatoryVaccinations: ['PMV-1 (Paramyxo)'],
  },
  {
    month: 2,
    monthName: 'Luty',
    seasonFocus: 'Szczepienia uzupełniające & Dezynfekcja cel',
    keyActions: [
      'Szczepienie przeciw ospie gołębi (Pigeon Pox)',
      'Kontrola obecności rzęsistka (Trichomonas gallinae) przed łączeniem w pary',
      'Suplementacja witaminy E i selenu dla popędu lęgowego',
    ],
    recommendedDiagnostics: ['Wymaz z wola (test canker/żółty guzek)'],
    mandatoryVaccinations: ['Ospa gołębi (Diphtheria / Pox)'],
  },
  {
    month: 3,
    monthName: 'Marzec',
    seasonFocus: 'Przygotowanie do lęgów & Start ciemni (Verdunkelung)',
    keyActions: [
      'Owoskopia jaj w 5. dobie inkubacji',
      'Montaż rolet zaciemniających dla wylęgających się młodych (Verdunkelung od 15 marca)',
      'Grit mineralny i wapń dla niosek',
    ],
    recommendedDiagnostics: ['Owoskopia (prześwietlanie jaj)'],
    mandatoryVaccinations: [],
  },
  {
    month: 4,
    monthName: 'Kwiecień',
    seasonFocus: 'Drogi oddechowe & Przedsezonowe obloty',
    keyActions: [
      'Kontrola dróg oddechowych (mykoplazmoza, ornitoza, katar zakaźny)',
      'Obrączkowanie pierwszego lęgu (6-8 doba życia)',
      'Pierwsze krótkie wywózki treningowe (5-20 km)',
    ],
    recommendedDiagnostics: ['Wymaz z gardła i nosogardzieli'],
    mandatoryVaccinations: [],
  },
  {
    month: 5,
    monthName: 'Maj',
    seasonFocus: 'Rozpoczęcie lotów konkursowych dorosłych & Ochrona młodzieży',
    keyActions: [
      'Nadzór nad młodymi: wczesne wykrywanie syndromu YPDS (Adeno-Coli)',
      'Zakwaszanie poidła do pH 4.2 po każdym locie konkursowym',
      'Rehydratacja elektrolitami (300 mOsm/L) w dniu powrotu',
    ],
    recommendedDiagnostics: ['Kontrola wola po locie', 'Triage YPDS'],
    mandatoryVaccinations: ['Szczepienie młódków PMV-1 (po odsadzeniu)'],
  },
  {
    month: 6,
    monthName: 'Czerwiec',
    seasonFocus: 'Szczyt sezonu lotowego & Przejście z ciemni na doświetlanie',
    keyActions: [
      '21 czerwca: zakończenie Verdunkelung u młodych, start Belichtung (16h światła)',
      'Monitoring zmęczenia mięśniowego (kreatynina, mleczan)',
      'Podawanie L-karnityny i magnezu przed lotami długodystansowymi (>500 km)',
    ],
    recommendedDiagnostics: ['Ocena 10 lotek (wskaźnik ARI)'],
    mandatoryVaccinations: [],
  },
  {
    month: 7,
    monthName: 'Lipiec',
    seasonFocus: 'Maratony (>700 km) & Pierwsze loty młodych',
    keyActions: [
      'Ładowanie lipidowe (Carbo-Lipid Shift) przed lotami maratońskimi',
      'Kontrola wola i poidła przeciw rzęsistkowi w upalne dni',
      'Treningi koszowe stada młodych ptaków',
    ],
    recommendedDiagnostics: ['Badanie wola w upale (Trichomonas)'],
    mandatoryVaccinations: [],
  },
  {
    month: 8,
    monthName: 'Sierpień',
    seasonFocus: 'Sezon lotowy gołębi młodych',
    keyActions: [
      'Ścisły monitoring Adeno-Coli podczas powrotów z koszowania młodych',
      'Podawanie przeciwciał IgY i kwasu masłowego w karmie',
      'Kontrola wskaźnika ARI lotek młódków',
    ],
    recommendedDiagnostics: ['Triage objawów YPDS po locie'],
    mandatoryVaccinations: [],
  },
  {
    month: 9,
    monthName: 'Wrzesień',
    seasonFocus: 'Koniec sezonu & Początek wielkiego pierzenia',
    keyActions: [
      'Badanie na salmonellozę (paratyfus) po sezonie lotowym',
      'Zwiększenie podaży nasion oleistych (siemię lniane, rzepak, słonecznik)',
      'Kąpiele stada z solami mineralnymi 2 razy w tygodniu',
    ],
    recommendedDiagnostics: ['Posiew kału w kierunku Salmonella enterica'],
    mandatoryVaccinations: [],
  },
  {
    month: 10,
    monthName: 'Październik',
    seasonFocus: 'Główne pierzenie stada',
    keyActions: [
      'Dostarczanie aminokwasów siarkowych (metionina, cystyna) na budowę piór',
      'Czyste, suche ruszty — unikanie wilgoci podczas zrzucania lotek',
      'Odstawienie leków zaburzających wzrost piór',
    ],
    recommendedDiagnostics: ['Ocena symetrii lotek i struktury chorągiewki'],
    mandatoryVaccinations: [],
  },
  {
    month: 11,
    monthName: 'Listopad',
    seasonFocus: 'Koniec pierzenia & Spoczynek zimowy',
    keyActions: [
      'Przejście na dietę spoczynkową (dieta jęczmienna / niskobiałkowa)',
      'Ostateczna selekcja stada i ocena standardu FCI',
      'Dezynfekcja cel i wietrzenie gołębnika',
    ],
    recommendedDiagnostics: ['Wycena standardu i cech anatomicznych'],
    mandatoryVaccinations: [],
  },
  {
    month: 12,
    monthName: 'Grudzień',
    seasonFocus: 'Spoczynek & Planowanie par lęgowych',
    keyActions: [
      'Wstępne kojarzenia w aplikacji (kalkulacja inbredu Wrighta F)',
      'Zamówienie obrączek rodowych na nowy rok',
      'Badanie kału przed sezonem szczepień',
    ],
    recommendedDiagnostics: ['Koproskopia flotacyjna zimowa'],
    mandatoryVaccinations: [],
  },
];

export function getVeterinaryCalendarMonth(monthNumber: number): VeterinaryMonthGuide {
  const safeMonth = Math.max(1, Math.min(12, monthNumber));
  return ANNUAL_VET_CALENDAR[safeMonth - 1];
}

export function getAnnualVeterinaryCalendar(): VeterinaryMonthGuide[] {
  return ANNUAL_VET_CALENDAR;
}

