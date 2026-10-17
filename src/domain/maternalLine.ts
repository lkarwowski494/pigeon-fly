/**
 * PIGEON-FLY — Moduł Analizy Linii Matecznych i Dziedziczenia Mitochondrialnego DNA (mtDNA - Z-060)
 * Genetyka mitochondrialna i selekcja linii żeńskich:
 * 1. Mitochondria (mtDNA) odpowiadają za fosforylację oksydacyjną (OXPHOS) i produkcję >90% ATP w locie
 * 2. Dziedziczenie mtDNA jest bezwzględnie matczyne (jednokierunkowe, bez crossing-over mejozy)
 * 3. Samice (ZW) przekazują mtDNA całemu potomstwu; Samce (ZZ) posiadają mtDNA matki, lecz nie przekazują go dalej
 * 4. Analiza dynastii matczynej (Matka Założycielka -> Babka -> Matka -> Ptak docelowy) i ocena wydolności tlenowej
 */

export interface PigeonPedigreeLite {
  ringNumber: string;
  name?: string;
  sex: 'cock' | 'hen' | 'unknown';
  color: string;
  year: number;
  motherRingNumber?: string;
  fatherRingNumber?: string;
  raceAchievements?: string[];
}

export interface MaternalAncestor {
  generation: number; // 1 = Matka (Dam), 2 = Babka macierzysta (Maternal Granddam), 3 = Prababka...
  relationshipTitle: string; // "Matka", "Babka macierzysta", "Prababka macierzysta", itp.
  ringNumber: string;
  name?: string;
  color: string;
  year: number;
  motherRingNumber?: string;
  raceAchievements: string[];
  isFoundationHen: boolean;
}

export type AerobicOxphosRating = 'world_class' | 'elite' | 'proven' | 'promising' | 'untested';

export interface MaternalLineAnalysis {
  targetRingNumber: string;
  targetSex: 'cock' | 'hen' | 'unknown';
  canTransmitMtDna: boolean; // Prawda tylko dla samic (0.1)! Samce posiadają mtDNA matki, ale go nie przekazują
  transmissionNotice: string;
  depthGenerations: number;
  unbrokenChain: boolean;
  foundationHen: MaternalAncestor | null;
  ancestors: MaternalAncestor[];
  championAncestorCount: number;
  mitochondrialIntegrityScore: number; // 0 - 100 pkt
  aerobicCapacityRating: AerobicOxphosRating;
  biologicalSummary: string;
  breederGuidance: string[];
}

const RELATIONSHIP_TITLES: Record<number, string> = {
  1: 'Matka (Dam)',
  2: 'Babka macierzysta (2. gen)',
  3: 'Prababka macierzysta (3. gen)',
  4: 'Praprababka (4. gen)',
  5: 'Prapraprababka (5. gen)',
  6: 'Matka Założycielka Linii (6. gen)',
};

/**
 * Rekurencyjnie rekonstruuje bezpośrednią linię mateczną (żeńską)
 */
export function traceMaternalLine(
  targetPigeon: PigeonPedigreeLite,
  getPigeonByRing: (ring: string) => PigeonPedigreeLite | undefined,
  maxGenerations = 6
): MaternalAncestor[] {
  const ancestors: MaternalAncestor[] = [];
  let currentMotherRing = targetPigeon.motherRingNumber;
  let gen = 1;

  while (currentMotherRing && gen <= maxGenerations) {
    const damRecord = getPigeonByRing(currentMotherRing);
    if (!damRecord) {
      // Przodek znany tylko z numeru obrączki
      ancestors.push({
        generation: gen,
        relationshipTitle: RELATIONSHIP_TITLES[gen] || `${gen}. pokolenie mateczne`,
        ringNumber: currentMotherRing,
        color: '---',
        year: 0,
        raceAchievements: [],
        isFoundationHen: false,
      });
      break;
    }

    ancestors.push({
      generation: gen,
      relationshipTitle: RELATIONSHIP_TITLES[gen] || `${gen}. pokolenie mateczne`,
      ringNumber: damRecord.ringNumber,
      name: damRecord.name,
      color: damRecord.color,
      year: damRecord.year,
      motherRingNumber: damRecord.motherRingNumber,
      raceAchievements: damRecord.raceAchievements || [],
      isFoundationHen: false,
    });

    currentMotherRing = damRecord.motherRingNumber;
    gen += 1;
  }

  if (ancestors.length > 0) {
    // Ostatnia odnaleziona samica w nieprzerwanej linii jest oznaczana jako Matka Założycielka
    ancestors[ancestors.length - 1].isFoundationHen = true;
  }

  return ancestors;
}

/**
 * Przeprowadza pełną analizę genetyki mitochondrialnej (mtDNA) i potencjału tlenowego
 */
export function analyzeMaternalLineage(
  targetPigeon: PigeonPedigreeLite,
  getPigeonByRing: (ring: string) => PigeonPedigreeLite | undefined,
  maxGenerations = 6
): MaternalLineAnalysis {
  const ancestors = traceMaternalLine(targetPigeon, getPigeonByRing, maxGenerations);
  const depth = ancestors.length;
  const isFemale = targetPigeon.sex === 'hen';

  const foundationHen = ancestors.find((a) => a.isFoundationHen) || null;

  // Samice (0.1 ZW) przekazują mtDNA całemu swojemu potomstwu.
  // Samce (1.0 ZZ) posiadają identyczne mtDNA matki, ale plemniki nie wnoszą mitochondriów do oocytu!
  const canTransmitMtDna = isFemale;
  const transmissionNotice = isFemale
    ? '✓ Samica (0.1 ZW): Przekaże to identyczne mitochondrialne DNA (mtDNA) 100% swojego potomstwa (zarówno synom, jak i córkom).'
    : 'ℹ️ Samiec (1.0 ZZ): Posiada to wybitne mtDNA matki (silnik tlenowy w locie), ale NIE przekaże go potomstwu (dzieci odziedziczą mtDNA po samicy-partnerce).';

  let championCount = 0;
  ancestors.forEach((a) => {
    if (a.raceAchievements && a.raceAchievements.length > 0) {
      championCount += 1;
    }
  });

  // Obliczenie wskaźnika integralności mitochondrialnej (0 - 100 pkt)
  let score = Math.min(60, depth * 15); // do 60 pkt za głębokość udokumentowanej linii (4 pokolenia = 60 pkt)
  score += Math.min(30, championCount * 10); // do 30 pkt za wybitne samice w linii
  if (depth >= 3 && foundationHen && foundationHen.name) {
    score += 10; // premia za nazwaną linię założycielską
  }
  score = Math.max(0, Math.min(100, score));

  let aerobicCapacityRating: AerobicOxphosRating = 'untested';
  if (score >= 85) {
    aerobicCapacityRating = 'world_class';
  } else if (score >= 70) {
    aerobicCapacityRating = 'elite';
  } else if (score >= 50) {
    aerobicCapacityRating = 'proven';
  } else if (score >= 30) {
    aerobicCapacityRating = 'promising';
  }

  const unbrokenChain = depth >= 1;

  const guidance: string[] = [];
  if (isFemale) {
    guidance.push('Jako samica jest bezpośrednią nośniczką mtDNA — jej córki będą kontynuować tę samą dynastię komórkową.');
    if (championCount >= 2) {
      guidance.push('Zalecane parowanie z wybitnym samcem z obcej linii w celu uzyskania efektu heterozji przy zachowaniu tlenowego silnika matki.');
    }
  } else {
    guidance.push('Samiec jest idealnym lotnikiem (korzysta z tlenowego napędu mtDNA matki), lecz do rozrodu żeńskiego jego córki pobiorą mtDNA partnerki.');
  }

  const biologicalSummary =
    depth > 0
      ? `Zidentyfikowano nieprzerwaną ${depth}-pokoleniową linię mateczną wywodzącą się od założycielki: ${foundationHen?.ringNumber || '---'} (${foundationHen?.name || 'Linia bezimienna'}). W linii stwierdzono ${championCount} wybitnych asów/medalistek.`
      : 'Brak udokumentowanej matki w bazie rodowodowej.';

  return {
    targetRingNumber: targetPigeon.ringNumber,
    targetSex: targetPigeon.sex,
    canTransmitMtDna,
    transmissionNotice,
    depthGenerations: depth,
    unbrokenChain,
    foundationHen,
    ancestors,
    championAncestorCount: championCount,
    mitochondrialIntegrityScore: score,
    aerobicCapacityRating,
    biologicalSummary,
    breederGuidance: guidance,
  };
}
