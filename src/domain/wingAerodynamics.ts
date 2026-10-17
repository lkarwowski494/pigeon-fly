/**
 * PIGEON-FLY — Aerodynamiczny Asystent Doboru Par i Biomechaniki Skrzydła (Z-064)
 * Analiza biomechaniki lotu gołębia pocztowego:
 * - Wskaźnik wydłużenia skrzydła (Aspect Ratio: AR = b^2 / S)
 * - Szczeliny wentylacyjne na końcach lotek (Wingtip slotting / rozszczepienie)
 * - Ramię dźwigniowe przedramienia i wysklepienie profilu (Camber)
 * - Przystosowanie wiatrowe (wiatr czołowy / w plecy / boczny)
 * - Kompensacyjny symulator doboru par rozpłodowych pod kątem aerodynamiki
 */

export type WingCamberType = 'FLAT' | 'MODERATE' | 'DEEP'; // Wysklepienie profilu skrzydła
export type FlightSpecialty = 'SPRINT_A' | 'MIDDLE_B' | 'LONG_C' | 'MARATHON_M' | 'ALL_ROUND';

export interface WingBiometrics {
  pigeonRing: string;
  pigeonSex: 'cock' | 'hen';
  wingspanCm: number; // b: rozpiętość skrzydeł (cm, np. 68 - 76 cm)
  wingAreaCm2: number; // S: łączna powierzchnia nośna obu skrzydeł (cm2, np. 520 - 660 cm2)
  wingtipSlotDegree: number; // 1-5 (stopień rozszczepienia ostatnich 4 lotek 7-10)
  camberType: WingCamberType; // Wysklepienie profilu (płaskie / umiarkowane / głębokie)
  forearmLeverRatio: number; // Stosunek kości ramienia do przedramienia (0.70 - 0.95, optimum <= 0.82)
  primaryFeatherRigidity: number; // 1-5 (sprężystość stosiny lotek I rzędu)
}

export interface WingAerodynamicProfile {
  aspectRatio: number; // AR = b^2 / S
  aspectRatioCategory: 'LOW_ASPECT' | 'OPTIMAL_ALLROUND' | 'HIGH_ASPECT';
  aspectRatioLabel: string;
  inducedDragIndex: number; // 0-100 (im niższy AR, tym wyższy opór indukowany przy długim locie)
  headwindScore: number; // 0-100 odporność na lot pod wiatr
  tailwindScore: number; // 0-100 prędkość przy locie z wiatrem
  crosswindStabilityScore: number; // 0-100 stabilność przy bocznym znoszeniu
  specialty: FlightSpecialty;
  specialtyLabel: string;
  aerodynamicSummary: string;
}

export interface PairMatingAerodynamicResult {
  cockProfile: WingAerodynamicProfile;
  henProfile: WingAerodynamicProfile;
  complementarityScore: number; // 0-100% dopasowanie kompensacyjne
  predictedOffspringAspectRatio: number;
  predictedSpecialty: FlightSpecialty;
  breedingRecommendation: 'EXCELLENT' | 'RECOMMENDED' | 'CAUTION' | 'NOT_RECOMMENDED';
  recommendationReason: string;
  offspringAdvantage: string;
}

/**
 * Oblicza profil aerodynamiczny pojedynczego skrzydła na podstawie parametrów biometrycznych
 */
export function calculateWingAerodynamics(biometrics: WingBiometrics): WingAerodynamicProfile {
  const {
    wingspanCm,
    wingAreaCm2,
    wingtipSlotDegree,
    camberType,
    forearmLeverRatio,
    primaryFeatherRigidity,
  } = biometrics;

  // 1. Obliczenie Aspect Ratio: AR = b^2 / S
  // b w cm, S w cm2 -> (b * b) / S
  const rawAR = (wingspanCm * wingspanCm) / Math.max(100, wingAreaCm2);
  const aspectRatio = Math.round(rawAR * 100) / 100;

  let aspectRatioCategory: WingAerodynamicProfile['aspectRatioCategory'];
  let aspectRatioLabel: string;

  if (aspectRatio >= 8.5) {
    aspectRatioCategory = 'HIGH_ASPECT';
    aspectRatioLabel = 'Wysokie wydłużenie (Długie, smukłe skrzydło szybowcowe / maratońskie)';
  } else if (aspectRatio >= 7.8) {
    aspectRatioCategory = 'OPTIMAL_ALLROUND';
    aspectRatioLabel = 'Optymalne wydłużenie (Uniwersalne skrzydło sportowe all-round)';
  } else {
    aspectRatioCategory = 'LOW_ASPECT';
    aspectRatioLabel = 'Niskie wydłużenie (Szerokie skrzydło nośne o wysokim ciągu sprinterskim)';
  }

  // 2. Wskaźnik oporu indukowanego (im wyższy AR, tym niższy opór indukowany w locie wielogodzinnym)
  // AR 9.0 -> niski opór (~20), AR 7.2 -> wysoki opór (~80)
  const inducedDragIndex = Math.max(10, Math.min(100, Math.round((10 - aspectRatio) * 35)));

  // 3. Odporność na wiatr czołowy (Headwind)
  // Wymaga: dobrego slottingu (redukcja wirów), zwartego przedramienia (krótka dźwignia <= 0.82),
  // sztywnej stosiny (>=4) i umiarkowanego/głębokiego wysklepienia
  let headwindBase = 50;
  headwindBase += (wingtipSlotDegree - 3) * 8; // -16 do +16
  headwindBase += (primaryFeatherRigidity - 3) * 7; // -14 do +14
  headwindBase += forearmLeverRatio <= 0.82 ? 12 : -10;
  if (camberType === 'DEEP') headwindBase += 10;
  else if (camberType === 'FLAT') headwindBase -= 8;
  if (aspectRatio >= 8.2) headwindBase += 6;
  const headwindScore = Math.max(15, Math.min(100, Math.round(headwindBase)));

  // 4. Prędkość z wiatrem (Tailwind speeder)
  // Płaski profil (FLAT), szerokie lotki (niższe AR daje wysoki ciąg uderzeniowy), wysoka sprężystość
  let tailwindBase = 55;
  if (camberType === 'FLAT') tailwindBase += 15;
  else if (camberType === 'DEEP') tailwindBase -= 10;
  if (aspectRatio < 8.0) tailwindBase += 10;
  tailwindBase += (primaryFeatherRigidity - 3) * 6;
  const tailwindScore = Math.max(20, Math.min(100, Math.round(tailwindBase)));

  // 5. Stabilność przy wietrze bocznym (Crosswind)
  let crosswindBase = 60;
  crosswindBase += (wingtipSlotDegree - 3) * 7;
  if (aspectRatio >= 8.0 && aspectRatio <= 8.8) crosswindBase += 10; // złoty środek
  const crosswindStabilityScore = Math.max(20, Math.min(100, Math.round(crosswindBase)));

  // 6. Dominująca specjalizacja dystansowa
  let specialty: FlightSpecialty;
  let specialtyLabel: string;
  let aerodynamicSummary: string;

  if (aspectRatio >= 8.6 && wingtipSlotDegree >= 4) {
    specialty = 'MARATHON_M';
    specialtyLabel = 'Maraton & Daleki Dystans (Kat. M / C: >700 km)';
    aerodynamicSummary = 'Wybitnie aerodynamiczne skrzydło o minimalnym oporze indukowanym. Zdolne do 12-15 godzin nieprzerwanego lotu ślizgowego przy minimalnym wydatku glikogenu.';
  } else if (aspectRatio >= 8.2) {
    specialty = 'LONG_C';
    specialtyLabel = 'Długi Dystans (Kat. C: 500-700 km)';
    aerodynamicSummary = 'Świetna aerodynamika przelotowa. Skrzydło doskonale zachowuje siłę nośną w drugiej połowie dnia lotowego pod zmiennym kątem wiatru.';
  } else if (aspectRatio >= 7.7) {
    specialty = 'MIDDLE_B';
    specialtyLabel = 'Średni Dystans & All-Round (Kat. B: 300-600 km)';
    aerodynamicSummary = 'Idealna równowaga pomiędzy ciągiem uderzeniowym a oporem przelotowym. Uniwersalny profil sprawdzający się w każdych warunkach pogodowych.';
  } else {
    specialty = 'SPRINT_A';
    specialtyLabel = 'Krótki Dystans & Sprint (Kat. A: 100-350 km)';
    aerodynamicSummary = 'Skrzydło o potężnym ciągu startowym i wysokiej dynamice uderzeń. Fenomenalna prędkość przelotowa z wiatrem w plecy, wyższa energochłonność na maratonach.';
  }

  return {
    aspectRatio,
    aspectRatioCategory,
    aspectRatioLabel,
    inducedDragIndex,
    headwindScore,
    tailwindScore,
    crosswindStabilityScore,
    specialty,
    specialtyLabel,
    aerodynamicSummary,
  };
}

/**
 * Symuluje komplementarność aerodynamiczną pary rozpłodowej (Samiec x Samica)
 */
export function simulatePairAerodynamics(
  cock: WingBiometrics,
  hen: WingBiometrics
): PairMatingAerodynamicResult {
  const cockProfile = calculateWingAerodynamics(cock);
  const henProfile = calculateWingAerodynamics(hen);

  // Średni przewidywany wskaźnik AR u potomstwa
  const predictedOffspringAspectRatio =
    Math.round(((cockProfile.aspectRatio + henProfile.aspectRatio) / 2) * 100) / 100;

  // Analiza kompensacyjna:
  // Jeśli oboje mają bardzo niskie AR (<7.7) lub brak slottingu (<2) -> ryzyko u potomstwa zbyt wysokiego oporu
  let score = 75;
  let recommendation: PairMatingAerodynamicResult['breedingRecommendation'] = 'RECOMMENDED';
  let reason = '';
  let advantage = '';

  const arDiff = Math.abs(cockProfile.aspectRatio - henProfile.aspectRatio);

  if (cockProfile.aspectRatio < 7.6 && henProfile.aspectRatio < 7.6) {
    // Obie strony zbyt krótkie skrzydła
    score = 45;
    recommendation = 'CAUTION';
    reason = 'Oboje partnerzy posiadają niskie wydłużenie skrzydła (AR < 7.6). Ryzyko ograniczenia potomstwa wyłącznie do krótkich lotów sprinterskich i wysokiej podatności na zmęczenie pod wiatr.';
    advantage = 'Maksymalny ciąg startowy na loty poniżej 200 km z wiatrem w plecy.';
  } else if (cockProfile.aspectRatio >= 8.5 && henProfile.aspectRatio >= 8.5) {
    // Para maratońska
    score = 95;
    recommendation = 'EXCELLENT';
    reason = 'Doskonałe skojarzenie maratońskie (High AR x High AR). Potomstwo odziedziczy wybitną doskonałość aerodynamiczną, predysponującą do lotów >700 km.';
    advantage = 'Minimalny opór indukowany i wysoka ekonomia energetyczna podczas 14-godzinnego lotu.';
  } else if (
    (cockProfile.aspectRatio < 8.0 && henProfile.aspectRatio >= 8.3) ||
    (henProfile.aspectRatio < 8.0 && cockProfile.aspectRatio >= 8.3)
  ) {
    // Klasyczna kompensacja sprintera z maratończykiem -> wzorcowy All-Round
    score = 90;
    recommendation = 'EXCELLENT';
    reason = 'Wzorcowe kojarzenie kompensacyjne (Sprint x Maraton). Skrzyżowanie wysokiego ciągu ze smukłością szybowcową stworzy nowoczesnego lotnika na dystanse 300-600 km.';
    advantage = 'Wszechstronność aerodynamiczna: dynamika startu połączona z niskim oporem na trasie.';
  } else {
    score = 80;
    recommendation = 'RECOMMENDED';
    reason = 'Zrównoważone parametry aerodynamiczne obojga rodziców bez skrajnych dysproporcji profilu skrzydła.';
    advantage = 'Stabilne potomstwo o uniwersalnych parametrach lotowych w kategorii All-Round.';
  }

  // Korekta za wady anatomiczne (np. oboje mają wiotką stosinę lub brak szczelin)
  if (cock.wingtipSlotDegree <= 2 && hen.wingtipSlotDegree <= 2) {
    score -= 20;
    recommendation = 'NOT_RECOMMENDED';
    reason += ' UWAGA: Oboje partnerzy wykazują słabe rozszczepienie lotek (brak szczelin wentylacyjnych), co wywoła silne wiry brzegowe u potomstwa.';
  }

  // Przewidywana specjalizacja potomstwa
  let predictedSpecialty: FlightSpecialty;
  if (predictedOffspringAspectRatio >= 8.5) {
    predictedSpecialty = 'MARATHON_M';
  } else if (predictedOffspringAspectRatio >= 8.1) {
    predictedSpecialty = 'LONG_C';
  } else if (predictedOffspringAspectRatio >= 7.7) {
    predictedSpecialty = 'MIDDLE_B';
  } else {
    predictedSpecialty = 'SPRINT_A';
  }

  return {
    cockProfile,
    henProfile,
    complementarityScore: Math.max(10, Math.min(100, score)),
    predictedOffspringAspectRatio,
    predictedSpecialty,
    breedingRecommendation: recommendation,
    recommendationReason: reason,
    offspringAdvantage: advantage,
  };
}
