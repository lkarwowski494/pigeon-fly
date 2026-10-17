/**
 * PIGEON-FLY — Moduł E-Księgi Lotowej i Pucharowej (Career Ledger & Trophy Cabinet - Z-061)
 * Cyfrowa ewidencja dokonań życiowych lotnika w polskim i międzynarodowym sporcie gołębiarskim:
 * 1. Rejestr wszystkich zdobytych konkursów w karierze z bazy 20%, 25%, 33%
 * 2. Sumaryczne wskaźniki kariery: konkursy, kkm (konkursokilometry), wydajność konkursowa %
 * 3. Kwalifikacje do Kategorii Olimpijskich FCI (Kat. A, B, C, M, Wyczyn)
 * 4. Gablota Trofeów i Odznak (Trophy Cabinet: Złoty As, Klub 10,000 kkm, Zwycięzca Lotu, itp.)
 */

export interface RacePrizeRecord {
  id: string;
  year: number;
  raceDate: string; // YYYY-MM-DD
  raceName: string;
  raceDistanceKm: number;
  basketedCount: number;
  concoursePosition: number;
  fciCoefficient: number;
  gmpPoints?: number;
  isFirstPrize?: boolean;
  category?: 'A' | 'B' | 'C' | 'M';
}

export interface TrophyBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate?: string;
  isUnlocked: boolean;
  category: 'speed' | 'distance' | 'endurance' | 'olympic';
}

export interface OlympicCategoryQualification {
  category: 'A' | 'B' | 'C' | 'M' | 'Wyczyn';
  categoryName: string;
  isQualified: boolean;
  requiredPrizes: number;
  earnedPrizes: number;
  requiredMinKkm: number;
  earnedKkm: number;
  totalCoefficient: number;
  notes: string;
}

export interface PigeonCareerSummary {
  pigeonRing: string;
  totalRacesBasketed: number;
  totalPrizesWon: number;
  concourseEffectivenessPercent: number; // (totalPrizesWon / totalRacesBasketed) * 100
  totalConcourseKilometers: number; // Suma kkm
  firstPrizeCount: number; // 1. lokaty
  topTenCount: number; // lokaty 1-10
  bestFciCoefficient: number; // Najniższy (najlepszy) pojedynczy coeff
  averageFciCoefficient: number;
  olympicQualifications: OlympicCategoryQualification[];
  trophies: TrophyBadge[];
  yearlyBreakdown: Record<number, { prizes: number; kkm: number; bestCoeff: number }>;
}

/**
 * Wylicza sumaryczny dorobek sportowy i pucharowy gołębia w całej karierze
 */
export function calculatePigeonCareer(
  pigeonRing: string,
  prizes: RacePrizeRecord[],
  totalRacesBasketed?: number
): PigeonCareerSummary {
  const totalPrizesWon = prizes.length;
  const effectiveBasketed = Math.max(totalPrizesWon, totalRacesBasketed ?? totalPrizesWon);

  const concourseEffectivenessPercent =
    effectiveBasketed > 0 ? Math.round((totalPrizesWon / effectiveBasketed) * 1000) / 10 : 0;

  let totalKkm = 0;
  let firstPrizes = 0;
  let topTen = 0;
  let minCoeff = prizes.length > 0 ? prizes[0].fciCoefficient : 0;
  let coeffSum = 0;

  const yearlyMap: Record<number, { prizes: number; kkm: number; bestCoeff: number }> = {};

  prizes.forEach((p) => {
    totalKkm += p.raceDistanceKm;
    if (p.concoursePosition === 1 || p.isFirstPrize) firstPrizes += 1;
    if (p.concoursePosition <= 10) topTen += 1;

    if (p.fciCoefficient < minCoeff) {
      minCoeff = p.fciCoefficient;
    }
    coeffSum += p.fciCoefficient;

    if (!yearlyMap[p.year]) {
      yearlyMap[p.year] = { prizes: 0, kkm: 0, bestCoeff: p.fciCoefficient };
    }
    yearlyMap[p.year].prizes += 1;
    yearlyMap[p.year].kkm += Math.round(p.raceDistanceKm * 10) / 10;
    if (p.fciCoefficient < yearlyMap[p.year].bestCoeff) {
      yearlyMap[p.year].bestCoeff = p.fciCoefficient;
    }
  });

  const totalConcourseKilometers = Math.round(totalKkm * 10) / 10;
  const averageFciCoefficient =
    totalPrizesWon > 0 ? Math.round((coeffSum / totalPrizesWon) * 1000) / 1000 : 0;

  // Weryfikacja kategorii olimpijskich FCI
  const olympicQualifications = evaluateOlympicQualifications(prizes);

  // Odznaki i gablota trofeów
  const trophies = evaluateTrophyCabinet(
    prizes,
    totalPrizesWon,
    totalConcourseKilometers,
    firstPrizes,
    minCoeff,
    olympicQualifications
  );

  return {
    pigeonRing,
    totalRacesBasketed: effectiveBasketed,
    totalPrizesWon,
    concourseEffectivenessPercent,
    totalConcourseKilometers,
    firstPrizeCount: firstPrizes,
    topTenCount: topTen,
    bestFciCoefficient: minCoeff,
    averageFciCoefficient,
    olympicQualifications,
    trophies,
    yearlyBreakdown: yearlyMap,
  };
}

/**
 * Weryfikuje kwalifikację do Kategorii Sportowych Olimpiady FCI
 */
export function evaluateOlympicQualifications(prizes: RacePrizeRecord[]): OlympicCategoryQualification[] {
  // Kat. A (Sprint: 100-400 km, min. 10 konkursów, min. 1500 kkm)
  const prizesA = prizes.filter((p) => p.raceDistanceKm >= 100 && p.raceDistanceKm < 400);
  const kkmA = Math.round(prizesA.reduce((sum, p) => sum + p.raceDistanceKm, 0) * 10) / 10;
  const coeffA = Math.round(prizesA.slice(0, 10).reduce((sum, p) => sum + p.fciCoefficient, 0) * 1000) / 1000;

  // Kat. B (Średni dystans: 300-600 km, min. 8 konkursów, min. 2800 kkm)
  const prizesB = prizes.filter((p) => p.raceDistanceKm >= 300 && p.raceDistanceKm <= 600);
  const kkmB = Math.round(prizesB.reduce((sum, p) => sum + p.raceDistanceKm, 0) * 10) / 10;
  const coeffB = Math.round(prizesB.slice(0, 8).reduce((sum, p) => sum + p.fciCoefficient, 0) * 1000) / 1000;

  // Kat. C (Daleki dystans: >500 km, min. 6 konkursów, min. 3300 kkm)
  const prizesC = prizes.filter((p) => p.raceDistanceKm > 500);
  const kkmC = Math.round(prizesC.reduce((sum, p) => sum + p.raceDistanceKm, 0) * 10) / 10;
  const coeffC = Math.round(prizesC.slice(0, 6).reduce((sum, p) => sum + p.fciCoefficient, 0) * 1000) / 1000;

  // Kat. M (Maraton: >700 km, min. 2 konkursy, min. 1400 kkm)
  const prizesM = prizes.filter((p) => p.raceDistanceKm >= 700);
  const kkmM = Math.round(prizesM.reduce((sum, p) => sum + p.raceDistanceKm, 0) * 10) / 10;
  const coeffM = Math.round(prizesM.slice(0, 2).reduce((sum, p) => sum + p.fciCoefficient, 0) * 1000) / 1000;

  // Kat. Wyczyn (Dowolny dystans >100 km, min. 18-20 konkursów, min. 6000 kkm)
  const totalKkm = Math.round(prizes.reduce((sum, p) => sum + p.raceDistanceKm, 0) * 10) / 10;

  return [
    {
      category: 'A',
      categoryName: 'Kategoria A (Sprint 100-400 km)',
      isQualified: prizesA.length >= 10 && kkmA >= 1500,
      requiredPrizes: 10,
      earnedPrizes: prizesA.length,
      requiredMinKkm: 1500,
      earnedKkm: kkmA,
      totalCoefficient: coeffA,
      notes: prizesA.length >= 10 ? 'Kwalifikacja do Mistrzostwa Polski Kat. A.' : `Brakuje ${10 - prizesA.length} konkursów.`,
    },
    {
      category: 'B',
      categoryName: 'Kategoria B (Średni Dystans 300-600 km)',
      isQualified: prizesB.length >= 8 && kkmB >= 2800,
      requiredPrizes: 8,
      earnedPrizes: prizesB.length,
      requiredMinKkm: 2800,
      earnedKkm: kkmB,
      totalCoefficient: coeffB,
      notes: prizesB.length >= 8 ? 'Kwalifikacja do Mistrzostwa Polski Kat. B.' : `Brakuje ${8 - prizesB.length} konkursów.`,
    },
    {
      category: 'C',
      categoryName: 'Kategoria C (Daleki Dystans >500 km)',
      isQualified: prizesC.length >= 6 && kkmC >= 3300,
      requiredPrizes: 6,
      earnedPrizes: prizesC.length,
      requiredMinKkm: 3300,
      earnedKkm: kkmC,
      totalCoefficient: coeffC,
      notes: prizesC.length >= 6 ? 'Kwalifikacja do Mistrzostwa Polski Kat. C.' : `Brakuje ${6 - prizesC.length} konkursów.`,
    },
    {
      category: 'M',
      categoryName: 'Kategoria M (Maraton >700 km)',
      isQualified: prizesM.length >= 2 && kkmM >= 1400,
      requiredPrizes: 2,
      earnedPrizes: prizesM.length,
      requiredMinKkm: 1400,
      earnedKkm: kkmM,
      totalCoefficient: coeffM,
      notes: prizesM.length >= 2 ? 'Kwalifikacja do Mistrzostwa Polski Kat. M.' : `Brakuje ${2 - prizesM.length} konkursów maratońskich.`,
    },
    {
      category: 'Wyczyn',
      categoryName: 'Kategoria Wyczyn (Całokształt)',
      isQualified: prizes.length >= 18 && totalKkm >= 6000,
      requiredPrizes: 18,
      earnedPrizes: prizes.length,
      requiredMinKkm: 6000,
      earnedKkm: totalKkm,
      totalCoefficient: 0,
      notes: prizes.length >= 18 ? 'Super Lotnik: Tytuł Wyczynowca Polski!' : `Brakuje ${18 - prizes.length} konkursów do Wyczynu.`,
    },
  ];
}

/**
 * Generuje odznaki i trofea pucharowe na podstawie wyników
 */
export function evaluateTrophyCabinet(
  prizes: RacePrizeRecord[],
  totalPrizes: number,
  totalKkm: number,
  firstPrizes: number,
  bestCoeff: number,
  olympicQuals: OlympicCategoryQualification[]
): TrophyBadge[] {
  const isOlympicQualified = olympicQuals.some((q) => q.isQualified);

  return [
    {
      id: 'first_prize',
      title: 'Zwycięzca Lotu (1. Nagroda)',
      description: 'Zdobycie 1. lokaty w locie konkursowym oddziałowym lub okręgowym.',
      icon: '🥇',
      isUnlocked: firstPrizes >= 1,
      category: 'speed',
    },
    {
      id: 'super_ace',
      title: 'Super Szpic (Coeff < 5.0)',
      description: 'Uzyskanie fenomenalnego wskaźnika Coeff FCI poniżej 5.000.',
      icon: '⚡',
      isUnlocked: bestCoeff > 0 && bestCoeff < 5.0,
      category: 'speed',
    },
    {
      id: 'club_5000_kkm',
      title: 'Klub 5,000 kkm',
      description: 'Przebycie ponad 5,000 kilometrów konkursowych w karierze.',
      icon: '🛡️',
      isUnlocked: totalKkm >= 5000,
      category: 'distance',
    },
    {
      id: 'club_10000_kkm',
      title: 'Klub 10,000 kkm (Żelazny Lotnik)',
      description: 'Przebycie elitarnego progu 10,000 kilometrów na liście konkursowej.',
      icon: '💎',
      isUnlocked: totalKkm >= 10000,
      category: 'distance',
    },
    {
      id: 'twenty_prizes',
      title: 'Wielki Jubileusz (20 Konkursów)',
      description: 'Zdobycie co najmniej 20 ważnych konkursów w dorobku sportowym.',
      icon: '🎖️',
      isUnlocked: totalPrizes >= 20,
      category: 'endurance',
    },
    {
      id: 'olympian',
      title: 'Olimpijczyk FCI',
      description: 'Oficjalna kwalifikacja do Reprezentacji Polski na Olimpiadę Gołębi Pocztowych.',
      icon: '🏆',
      isUnlocked: isOlympicQualified,
      category: 'olympic',
    },
  ];
}
