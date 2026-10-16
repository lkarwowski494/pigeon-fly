/**
 * PIGEON-FLY — Nutrition & Supplementation Domain Engine
 * Feeding phases, weekly widowhood racing rotation, and supplement scheduling.
 */

export type AnnualLoftPhase =
  | 'winter_rest' // Spoczynek zimowy (grudzień - luty)
  | 'breeding_reproduction' // Lęgi i odchów młodych (marzec - maj)
  | 'racing_widowhood' // Sezon lotowy dorosłych (maj - lipiec)
  | 'young_birds_season' // Sezon młódków i zaciemnianie (lipiec - wrzesień)
  | 'autumn_moult'; // Wielkie pierzenie jesienne (wrzesień - listopad)

export type SupplementApplication = 'water' | 'feed' | 'free_access';

export interface FeedNutritionalProfile {
  proteinPct: number; // Białko ogólne (%)
  fatPct: number; // Tłuszcz surowy (%)
  carbohydratesPct: number; // Węglowodany (%)
  fiberPct: number; // Włókno surowe (%)
  recommendedGramsPerBird: number; // np. 30g/dzień
}

export interface DayFeedingPlan {
  dayOfWeek: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  morningFeed: string;
  eveningFeed: string;
  profile: FeedNutritionalProfile;
  waterSupplements: string[];
  feedSupplements: string[];
  notes?: string;
}

export interface FeedingProtocol {
  phase: AnnualLoftPhase;
  phaseName: string;
  description: string;
  weeklySchedule: Record<string, DayFeedingPlan>;
  criticalMinerals: string[];
}

/**
 * Returns the official master loft feeding protocol for a given season phase.
 */
export function getFeedingProtocol(phase: AnnualLoftPhase): FeedingProtocol {
  switch (phase) {
    case 'racing_widowhood':
      return {
        phase,
        phaseName: 'Sezon Lotowy — Tygodniowa Rotacja Wdowia',
        description: 'Od poniedziałkowej diety oczyszczającej do czwartkowo-piątkowego ładowania tłuszczem i węglowodanami przed koszowaniem.',
        criticalMinerals: ['Grit z anyżem', 'Czerwony kamień', 'Glinka lecznicza', 'Kostka mineralna'],
        weeklySchedule: {
          mon: {
            dayOfWeek: 'mon',
            morningFeed: 'Dieta oczyszczająca / Depurative (jęczmień, kardi, ryż paddy)',
            eveningFeed: 'Dieta oczyszczająca 70% + Dieta lotowa 30%',
            profile: { proteinPct: 11.5, fatPct: 4.2, carbohydratesPct: 62.0, fiberPct: 5.5, recommendedGramsPerBird: 28 },
            waterSupplements: ['Elektrolity + Miód pszczeli (regeneracja glikogenu)'],
            feedSupplements: ['Herbata ziołowa (oczyszczanie wątroby)'],
          },
          tue: {
            dayOfWeek: 'tue',
            morningFeed: 'Dieta lekka 50% + Dieta sportowa 50%',
            eveningFeed: 'Dieta sportowa (kukurydza cribs, groch drobny, słonecznik, dari)',
            profile: { proteinPct: 14.0, fatPct: 6.5, carbohydratesPct: 58.0, fiberPct: 4.8, recommendedGramsPerBird: 30 },
            waterSupplements: ['Zakwaszacz jelitowy (ocet jabłkowy z oregano)'],
            feedSupplements: ['Drożdże piwne + Olej czosnkowy'],
          },
          wed: {
            dayOfWeek: 'wed',
            morningFeed: 'Dieta sportowa wysokiej jakości',
            eveningFeed: 'Dieta sportowa + 20% nasion energii',
            profile: { proteinPct: 14.8, fatPct: 7.8, carbohydratesPct: 56.0, fiberPct: 4.5, recommendedGramsPerBird: 32 },
            waterSupplements: ['Kompleks witamin z grupy B + Aminokwasy'],
            feedSupplements: ['Magnez + Żelazo chelatowane'],
          },
          thu: {
            dayOfWeek: 'thu',
            morningFeed: 'Dieta lotowa energetyczna (kukurydza bordowa, dari, kardi)',
            eveningFeed: 'Ładowanie energią: Kukurydza cribs + Słonecznik łuskany + Orzeszki ziemne',
            profile: { proteinPct: 13.5, fatPct: 11.5, carbohydratesPct: 54.0, fiberPct: 3.8, recommendedGramsPerBird: 35 },
            waterSupplements: ['L-karnityna (poprawa spalania kwasów tłuszczowych)'],
            feedSupplements: ['Olej z zarodków pszennych (witamina E)'],
          },
          fri: {
            dayOfWeek: 'fri',
            morningFeed: 'Lekkostrawna energia (drobna kukurydza, łuskany słonecznik, ryż)',
            eveningFeed: 'Dzień koszowania (lub przedkoszowy): do syta do 14:00, świeża czysta woda',
            profile: { proteinPct: 12.8, fatPct: 12.0, carbohydratesPct: 55.0, fiberPct: 3.5, recommendedGramsPerBird: 30 },
            waterSupplements: ['CZYSTA ŚWIEŻA WODA (żadnych dodatków przed lotem)'],
            feedSupplements: [],
            notes: 'Poidło zabrać na 2 godziny przed koszowaniem, aby wole było puste.',
          },
          sat: {
            dayOfWeek: 'sat',
            morningFeed: 'Dzień lotu (ptaki w kabinie lub w powietrzu)',
            eveningFeed: 'Przylot: drobne nasiona (kanar, proso) po napojeniu',
            profile: { proteinPct: 11.0, fatPct: 5.0, carbohydratesPct: 65.0, fiberPct: 4.0, recommendedGramsPerBird: 25 },
            waterSupplements: ['W letniej wodzie: Elektrolit + Glukoza po przylocie'],
            feedSupplements: [],
          },
          sun: {
            dayOfWeek: 'sun',
            morningFeed: 'Dieta regeneracyjna lekka',
            eveningFeed: 'Dieta lekka z dodatkiem drożdży',
            profile: { proteinPct: 12.0, fatPct: 4.5, carbohydratesPct: 63.0, fiberPct: 5.0, recommendedGramsPerBird: 28 },
            waterSupplements: ['Probiotyk (odbudowa flory bakteryjnej jelit)'],
            feedSupplements: ['Kąpiel z solą kąpielową do dyspozycji ptaków'],
          },
        },
      };

    case 'breeding_reproduction':
      return {
        phase,
        phaseName: 'Okres Lęgowy i Wychów Młodzieży',
        description: 'Białko 18–20% z pełnym profilem aminokwasowym dla szybkiego wzrostu kośćca i mięśni piskląt.',
        criticalMinerals: ['Grit z muszlami ostryg', 'Czerwony kamień', 'Glukoza', 'Wapń w płynie'],
        weeklySchedule: {
          mon: {
            dayOfWeek: 'mon',
            morningFeed: 'Mieszanka lęgowa bogata w grochy (peluszka, groch żółty/zielony, wyka)',
            eveningFeed: 'Mieszanka lęgowa do syta (stały dostęp przy karmieniu młodych)',
            profile: { proteinPct: 18.5, fatPct: 6.0, carbohydratesPct: 54.0, fiberPct: 5.2, recommendedGramsPerBird: 40 },
            waterSupplements: ['Witamina A, D3, E (płodność i mocna skorupka)'],
            feedSupplements: ['Drożdże piwne + Białko serwatkowe'],
          },
          tue: {
            dayOfWeek: 'tue',
            morningFeed: 'Mieszanka lęgowa',
            eveningFeed: 'Mieszanka lęgowa',
            profile: { proteinPct: 18.5, fatPct: 6.0, carbohydratesPct: 54.0, fiberPct: 5.2, recommendedGramsPerBird: 40 },
            waterSupplements: ['Zakwaszacz jelitowy'],
            feedSupplements: ['Olej rybi (kwasy Omega-3)'],
          },
          wed: {
            dayOfWeek: 'wed',
            morningFeed: 'Mieszanka lęgowa',
            eveningFeed: 'Mieszanka lęgowa',
            profile: { proteinPct: 18.5, fatPct: 6.0, carbohydratesPct: 54.0, fiberPct: 5.2, recommendedGramsPerBird: 40 },
            waterSupplements: ['Wapń + Magnez rozpuszczalny'],
            feedSupplements: ['Grit witaminizowany'],
          },
          thu: {
            dayOfWeek: 'thu',
            morningFeed: 'Mieszanka lęgowa',
            eveningFeed: 'Mieszanka lęgowa',
            profile: { proteinPct: 18.5, fatPct: 6.0, carbohydratesPct: 54.0, fiberPct: 5.2, recommendedGramsPerBird: 40 },
            waterSupplements: ['Czysta woda'],
            feedSupplements: ['Zioła trawienne'],
          },
          fri: {
            dayOfWeek: 'fri',
            morningFeed: 'Mieszanka lęgowa',
            eveningFeed: 'Mieszanka lęgowa',
            profile: { proteinPct: 18.5, fatPct: 6.0, carbohydratesPct: 54.0, fiberPct: 5.2, recommendedGramsPerBird: 40 },
            waterSupplements: ['Kompleks witamin z mikroelementami'],
            feedSupplements: ['Drożdże piwne'],
          },
          sat: {
            dayOfWeek: 'sat',
            morningFeed: 'Mieszanka lęgowa',
            eveningFeed: 'Mieszanka lęgowa',
            profile: { proteinPct: 18.5, fatPct: 6.0, carbohydratesPct: 54.0, fiberPct: 5.2, recommendedGramsPerBird: 40 },
            waterSupplements: ['Czysta woda'],
            feedSupplements: ['Kąpiel dla rodziców'],
          },
          sun: {
            dayOfWeek: 'sun',
            morningFeed: 'Mieszanka lęgowa',
            eveningFeed: 'Mieszanka lęgowa',
            profile: { proteinPct: 18.5, fatPct: 6.0, carbohydratesPct: 54.0, fiberPct: 5.2, recommendedGramsPerBird: 40 },
            waterSupplements: ['Probiotyk'],
            feedSupplements: [],
          },
        },
      };

    case 'autumn_moult':
      return {
        phase,
        phaseName: 'Wielkie Pierzenie Jesienne',
        description: 'Maksymalna podaż aminokwasów siarkowych (metionina, cystyna) oraz nasion oleistych na jedwabiste pióra.',
        criticalMinerals: ['Siarka paszowa', 'Grit mineralny', 'Algi morskie'],
        weeklySchedule: {
          mon: {
            dayOfWeek: 'mon',
            morningFeed: 'Mieszanka pierzeniowa (siemię lniane, rzepak, konopie, słonecznik, kardi)',
            eveningFeed: 'Mieszanka pierzeniowa z drożdżami',
            profile: { proteinPct: 16.0, fatPct: 9.5, carbohydratesPct: 52.0, fiberPct: 6.5, recommendedGramsPerBird: 35 },
            waterSupplements: ['Metionina + Cholina (ochrona wątroby i budulec piór)'],
            feedSupplements: ['Siemię lniane gotowane (śluz lniany)'],
          },
          tue: {
            dayOfWeek: 'tue',
            morningFeed: 'Mieszanka pierzeniowa',
            eveningFeed: 'Mieszanka pierzeniowa',
            profile: { proteinPct: 16.0, fatPct: 9.5, carbohydratesPct: 52.0, fiberPct: 6.5, recommendedGramsPerBird: 35 },
            waterSupplements: ['Herbata ziołowa z pokrzywą'],
            feedSupplements: ['Olej czosnkowy + Drożdże'],
          },
          wed: {
            dayOfWeek: 'wed',
            morningFeed: 'Mieszanka pierzeniowa',
            eveningFeed: 'Mieszanka pierzeniowa',
            profile: { proteinPct: 16.0, fatPct: 9.5, carbohydratesPct: 52.0, fiberPct: 6.5, recommendedGramsPerBird: 35 },
            waterSupplements: ['Biotyna + Cynk (elastyczność stosin piór)'],
            feedSupplements: ['Algi morskie'],
          },
          thu: {
            dayOfWeek: 'thu',
            morningFeed: 'Mieszanka pierzeniowa',
            eveningFeed: 'Mieszanka pierzeniowa',
            profile: { proteinPct: 16.0, fatPct: 9.5, carbohydratesPct: 52.0, fiberPct: 6.5, recommendedGramsPerBird: 35 },
            waterSupplements: ['Czysta woda'],
            feedSupplements: ['Sól kąpielowa do cotygodniowej kąpieli'],
          },
          fri: {
            dayOfWeek: 'fri',
            morningFeed: 'Mieszanka pierzeniowa',
            eveningFeed: 'Mieszanka pierzeniowa',
            profile: { proteinPct: 16.0, fatPct: 9.5, carbohydratesPct: 52.0, fiberPct: 6.5, recommendedGramsPerBird: 35 },
            waterSupplements: ['Kompleks multiwitaminowy'],
            feedSupplements: ['Olej z nasion wiesiołka'],
          },
          sat: {
            dayOfWeek: 'sat',
            morningFeed: 'Mieszanka pierzeniowa',
            eveningFeed: 'Mieszanka pierzeniowa',
            profile: { proteinPct: 16.0, fatPct: 9.5, carbohydratesPct: 52.0, fiberPct: 6.5, recommendedGramsPerBird: 35 },
            waterSupplements: ['Czysta woda'],
            feedSupplements: [],
          },
          sun: {
            dayOfWeek: 'sun',
            morningFeed: 'Mieszanka pierzeniowa',
            eveningFeed: 'Mieszanka pierzeniowa',
            profile: { proteinPct: 16.0, fatPct: 9.5, carbohydratesPct: 52.0, fiberPct: 6.5, recommendedGramsPerBird: 35 },
            waterSupplements: ['Probiotyk'],
            feedSupplements: [],
          },
        },
      };

    default: // winter_rest
      return {
        phase: 'winter_rest',
        phaseName: 'Spoczynek Zimowy (Zimowanie)',
        description: 'Lekka karma z przewagą jęczmienia (40-50%) zapobiegająca otłuszczeniu ptaków przed wiosną.',
        criticalMinerals: ['Grit podstawowy', 'Cegła mineralna'],
        weeklySchedule: {
          mon: {
            dayOfWeek: 'mon',
            morningFeed: 'Jęczmień 50% + Pszenica 30% + Dari 20%',
            eveningFeed: 'Jedno karmienie dziennie po południu',
            profile: { proteinPct: 10.5, fatPct: 2.8, carbohydratesPct: 68.0, fiberPct: 6.0, recommendedGramsPerBird: 25 },
            waterSupplements: ['Czysta woda z czosnkiem naturalnym'],
            feedSupplements: [],
          },
          tue: {
            dayOfWeek: 'tue',
            morningFeed: 'Mieszanka zimowa lekka',
            eveningFeed: 'Mieszanka zimowa',
            profile: { proteinPct: 10.5, fatPct: 2.8, carbohydratesPct: 68.0, fiberPct: 6.0, recommendedGramsPerBird: 25 },
            waterSupplements: ['Ocet jabłkowy (1 łyżka na 1 litr)'],
            feedSupplements: [],
          },
          wed: {
            dayOfWeek: 'wed',
            morningFeed: 'Mieszanka zimowa lekka',
            eveningFeed: 'Mieszanka zimowa',
            profile: { proteinPct: 10.5, fatPct: 2.8, carbohydratesPct: 68.0, fiberPct: 6.0, recommendedGramsPerBird: 25 },
            waterSupplements: ['Czysta woda'],
            feedSupplements: [],
          },
          thu: {
            dayOfWeek: 'thu',
            morningFeed: 'Mieszanka zimowa lekka',
            eveningFeed: 'Mieszanka zimowa',
            profile: { proteinPct: 10.5, fatPct: 2.8, carbohydratesPct: 68.0, fiberPct: 6.0, recommendedGramsPerBird: 25 },
            waterSupplements: ['Herbata z dzikiej róży i rumianku'],
            feedSupplements: [],
          },
          fri: {
            dayOfWeek: 'fri',
            morningFeed: 'Mieszanka zimowa lekka',
            eveningFeed: 'Mieszanka zimowa',
            profile: { proteinPct: 10.5, fatPct: 2.8, carbohydratesPct: 68.0, fiberPct: 6.0, recommendedGramsPerBird: 25 },
            waterSupplements: ['Witaminy A+D3 zimowe'],
            feedSupplements: [],
          },
          sat: {
            dayOfWeek: 'sat',
            morningFeed: 'Mieszanka zimowa lekka',
            eveningFeed: 'Mieszanka zimowa',
            profile: { proteinPct: 10.5, fatPct: 2.8, carbohydratesPct: 68.0, fiberPct: 6.0, recommendedGramsPerBird: 25 },
            waterSupplements: ['Czysta woda'],
            feedSupplements: [],
          },
          sun: {
            dayOfWeek: 'sun',
            morningFeed: 'Mieszanka zimowa lekka',
            eveningFeed: 'Mieszanka zimowa',
            profile: { proteinPct: 10.5, fatPct: 2.8, carbohydratesPct: 68.0, fiberPct: 6.0, recommendedGramsPerBird: 25 },
            waterSupplements: ['Probiotyk'],
            feedSupplements: [],
          },
        },
      };
  }
}
