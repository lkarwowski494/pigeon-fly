/**
 * PIGEON-FLY — Generator Protokołu Sanitarnego i Zabezpieczenia Biologicznego (Bioasekuracja PIW)
 * Z-062: Inspekcja weterynaryjna gołębnika, scoring bioasekuracji (HPAI / ND / PMV-1),
 * zalecenia pokontrolne i urzędowy wydruk protokołu A4 (PIW / GLW).
 */

export interface BiosecurityLoftInfo {
  wniNumber: string; // Weterynaryjny Numer Identyfikacyjny (np. PL 14120000)
  loftName: string;
  breederName: string;
  address: string;
  pzhgpBranch: string;
  pzhgpSection: string;
  totalBirdsCount: number;
  auditDate: string; // YYYY-MM-DD
  auditorName: string; // np. "Lek. wet. Janusz Ptasiński" lub "Hodowca (Samokontrola)"
  auditorRole: 'piw_inspector' | 'field_vet' | 'breeder_self_audit';
  auditReason: 'routine_inspection' | 'pre_season_check' | 'hpai_zone_control' | 'health_certificate';
}

export interface BiosecurityChecklist {
  // Filary 1: Bariera wejściowa i dezynfekcja
  matDisinfectionActive: boolean; // Mata nasączona atestowanym preparatem wirusobójczym (Virkon S / Ecocid)
  disinfectantRenewalDays: number; // Co ile dni wymieniany roztwór (<= 7 dni = OK)
  dedicatedFootwear: boolean; // Dedykowane obuwie zmienne / ochraniacze
  protectiveClothing: boolean; // Fartuch ochronny / odzież robocza
  visitorLogMaintained: boolean; // Rejestr osób wchodzących do gołębnika

  // Filar 2: Zabezpieczenie przed ptakami dzikimi i gryzoniami (Wektory)
  meshApertureMm: number; // Średnica oczek w wolierach i oknach (<= 19 mm = OK)
  enclosedFeedStorage: boolean; // Karma i grit w szczelnych pojemnikach niedostępnych dla gryzoni
  internalWateringOnly: boolean; // Poidła i karmniki wyłącznie wewnątrz gołębnika (pod dachem)
  activeRodentControl: boolean; // Aktywne stacje deratyzacyjne z atestowaną trutką

  // Filar 3: Higiena, obornik i kwarantanna
  thermalScorchingDone: boolean; // Regularne opalanie palnikiem rusztów i spoczywaków
  limeWhitewashingDone: boolean; // Bielenie ścian i sufitów wapnem gaszonym
  isolatedManureStorage: boolean; // Odchody składowane w szczelnych workach / na zabezpieczonej płycie
  quarantineStationFunctional: boolean; // Oddzielna, funkcjonalna izolatka dla nowych/chorych ptaków (min. 21 dni)

  // Filar 4: Profilaktyka i dokumentacja weterynaryjna
  validPmvVaccination: boolean; // Aktualne zaświadczenie o szczepieniu przeciw PMV-1/Salmo
  veterinaryBookUpToDate: boolean; // Prowadzona E-Księga leczenia zwierząt z okresami karencji
  feedOriginCertificates: boolean; // Atesty / dowody zakupu karmy od certyfikowanych producentów
}

export type BiosecurityVerdict = 'FULL_COMPLIANCE' | 'CONDITIONAL_COMPLIANCE' | 'NON_COMPLIANT';

export interface BiosecurityItemEvaluation {
  id: string;
  pillar: 'BARRIER' | 'VECTOR_EXCLUSION' | 'HYGIENE_QUARANTINE' | 'VET_DOCUMENTATION';
  title: string;
  isCritical: boolean;
  isCompliant: boolean;
  scoreWeight: number;
  failureReason?: string;
  correctiveAction?: string;
  deadlineDays?: number;
}

export interface BiosecurityComplianceResult {
  scorePercent: number;
  totalPoints: number;
  maxPoints: number;
  verdict: BiosecurityVerdict;
  verdictLabel: string;
  epizooticRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  criticalViolationsCount: number;
  evaluations: BiosecurityItemEvaluation[];
  correctivePlan: {
    item: string;
    action: string;
    deadlineDays: number;
  }[];
}

export const DEFAULT_BIOSECURITY_CHECKLIST: BiosecurityChecklist = {
  matDisinfectionActive: true,
  disinfectantRenewalDays: 5,
  dedicatedFootwear: true,
  protectiveClothing: true,
  visitorLogMaintained: true,
  meshApertureMm: 16,
  enclosedFeedStorage: true,
  internalWateringOnly: true,
  activeRodentControl: true,
  thermalScorchingDone: true,
  limeWhitewashingDone: true,
  isolatedManureStorage: true,
  quarantineStationFunctional: true,
  validPmvVaccination: true,
  veterinaryBookUpToDate: true,
  feedOriginCertificates: true,
};

/**
 * Oblicza ocenę zgodności bioasekuracyjnej gołębnika na podstawie standardów PIW / GLW
 */
export function evaluateBiosecurityCompliance(
  checklist: BiosecurityChecklist
): BiosecurityComplianceResult {
  const evaluations: BiosecurityItemEvaluation[] = [];

  // 1. Mata dezynfekcyjna (krytyczna)
  evaluations.push({
    id: 'mat_disinfection',
    pillar: 'BARRIER',
    title: 'Mata dezynfekcyjna nasączona preparatem wirusobójczym przy wejściu',
    isCritical: true,
    isCompliant: checklist.matDisinfectionActive,
    scoreWeight: 10,
    failureReason: !checklist.matDisinfectionActive ? 'Brak aktywnej maty dezynfekcyjnej przy wejściu do gołębnika' : undefined,
    correctiveAction: 'Wyłożyć matę dezynfekcyjną i nasączyć preparatem o działaniu wirusobójczym (np. Virkon S 1%)',
    deadlineDays: 2,
  });

  // 2. Regularna wymiana preparatu (<= 7 dni)
  const isRenewalValid = checklist.disinfectantRenewalDays <= 7 && checklist.disinfectantRenewalDays > 0;
  evaluations.push({
    id: 'disinfectant_renewal',
    pillar: 'BARRIER',
    title: 'Częstotliwość wymiany roztworu dezynfekcyjnego w macie (maks. co 7 dni)',
    isCritical: false,
    isCompliant: isRenewalValid,
    scoreWeight: 5,
    failureReason: !isRenewalValid ? `Roztwór wymieniany zbyt rzadko (co ${checklist.disinfectantRenewalDays} dni; norma max 7 dni)` : undefined,
    correctiveAction: 'Wprowadzić harmonogram wymiany roztworu w macie co najmniej raz w tygodniu lub po zabrudzeniu',
    deadlineDays: 3,
  });

  // 3. Obuwie zmienne (krytyczne)
  evaluations.push({
    id: 'dedicated_footwear',
    pillar: 'BARRIER',
    title: 'Dedykowane obuwie zmienne używane wyłącznie w gołębniku',
    isCritical: true,
    isCompliant: checklist.dedicatedFootwear,
    scoreWeight: 10,
    failureReason: !checklist.dedicatedFootwear ? 'Wchodzenie do gołębnika w obuwiu codziennym/terenowym' : undefined,
    correctiveAction: 'Wprowadzić bezwzględny nakaz zmiany obuwia w przedsionku gołębnika',
    deadlineDays: 1,
  });

  // 4. Odzież ochronna
  evaluations.push({
    id: 'protective_clothing',
    pillar: 'BARRIER',
    title: 'Odzież robocza/ochronna (fartuch/kombinezon) przeznaczona tylko do stada',
    isCritical: false,
    isCompliant: checklist.protectiveClothing,
    scoreWeight: 5,
    failureReason: !checklist.protectiveClothing ? 'Brak dedykowanej odzieży roboczej' : undefined,
    correctiveAction: 'Zapewnić odzież ochronną do obsługi stada',
    deadlineDays: 5,
  });

  // 5. Rejestr gości i osób postronnych
  evaluations.push({
    id: 'visitor_log',
    pillar: 'BARRIER',
    title: 'Ewidencja osób postronnych wchodzących do obiektu (rejestr gości)',
    isCritical: false,
    isCompliant: checklist.visitorLogMaintained,
    scoreWeight: 5,
    failureReason: !checklist.visitorLogMaintained ? 'Brak ewidencji odwiedzających obiekt' : undefined,
    correctiveAction: 'Założyć zeszyt/rejestr gości z rubrykami: data, imię, pochodzenie, cel wizyty',
    deadlineDays: 7,
  });

  // 6. Siatka ochronna przed ptakami dzikimi (krytyczna: <= 19 mm)
  const isMeshValid = checklist.meshApertureMm > 0 && checklist.meshApertureMm <= 19;
  evaluations.push({
    id: 'wild_bird_mesh',
    pillar: 'VECTOR_EXCLUSION',
    title: 'Zabezpieczenie woliery i okien siatką o oczku <= 19 mm (bariera przed wróblami)',
    isCritical: true,
    isCompliant: isMeshValid,
    scoreWeight: 10,
    failureReason: !isMeshValid ? `Oczko siatki zbyt duże (${checklist.meshApertureMm} mm > 19 mm), ryzyko kontaktu z wróblami/gołębiami miejskimi` : undefined,
    correctiveAction: 'Zainstalować siatkę drobnooczkową (maksymalny prześwit 19x19 mm) na wszystkich otworach woliery i okien',
    deadlineDays: 14,
  });

  // 7. Przechowywanie paszy w szczelnych pojemnikach (krytyczna)
  evaluations.push({
    id: 'feed_storage',
    pillar: 'VECTOR_EXCLUSION',
    title: 'Przechowywanie karmy i dodatków w szczelnych pojemnikach (ochrona przed gryzoniami)',
    isCritical: true,
    isCompliant: checklist.enclosedFeedStorage,
    scoreWeight: 10,
    failureReason: !checklist.enclosedFeedStorage ? 'Pasza przechowywana w otwartych workach narażona na kontakt z gryzoniami' : undefined,
    correctiveAction: 'Umieścić worki z karmą w zamykanych beczkach z tworzywa lub metalowych skrzyniach',
    deadlineDays: 3,
  });

  // 8. Karmienie i pojenie pod dachem (krytyczna)
  evaluations.push({
    id: 'internal_feeding',
    pillar: 'VECTOR_EXCLUSION',
    title: 'Karmienie i pojenie ptaków wyłącznie wewnątrz zadaszonego gołębnika',
    isCritical: true,
    isCompliant: checklist.internalWateringOnly,
    scoreWeight: 10,
    failureReason: !checklist.internalWateringOnly ? 'Poidła lub karmniki wystawione na zewnątrz (ryzyko zanieczyszczenia przez ptaki dzikie)' : undefined,
    correctiveAction: 'Przenieść wszystkie poidła i karmniki do wnętrza gołębnika pod szczelny dach',
    deadlineDays: 1,
  });

  // 9. Aktywna deratyzacja
  evaluations.push({
    id: 'rodent_control',
    pillar: 'VECTOR_EXCLUSION',
    title: 'Aktywny monitoring i stacje deratyzacyjne z atestowanym preparatem',
    isCritical: false,
    isCompliant: checklist.activeRodentControl,
    scoreWeight: 5,
    failureReason: !checklist.activeRodentControl ? 'Brak zabezpieczonych stacji deratyzacyjnych wokół gołębnika' : undefined,
    correctiveAction: 'Rozstawić atestowane karmniki deratyzacyjne wzdłuż ścian zewnętrznych',
    deadlineDays: 7,
  });

  // 10. Termiczne opalanie rusztów
  evaluations.push({
    id: 'thermal_scorching',
    pillar: 'HYGIENE_QUARANTINE',
    title: 'Termiczna dezynfekcja rusztów i spoczywaków palnikiem gazowym',
    isCritical: false,
    isCompliant: checklist.thermalScorchingDone,
    scoreWeight: 5,
    failureReason: !checklist.thermalScorchingDone ? 'Brak udokumentowanej okresowej dezynfekcji termicznej płomieniem' : undefined,
    correctiveAction: 'Przeprowadzić opalanie rusztów podłogowych i siodełek po mechanicznym czyszczeniu',
    deadlineDays: 14,
  });

  // 11. Bielenie wapnem gaszonym
  evaluations.push({
    id: 'lime_whitewashing',
    pillar: 'HYGIENE_QUARANTINE',
    title: 'Dezynfekcja ścian i sufitów przez bielenie mlekiem wapiennym (pH > 12)',
    isCritical: false,
    isCompliant: checklist.limeWhitewashingDone,
    scoreWeight: 5,
    failureReason: !checklist.limeWhitewashingDone ? 'Brak okresowego bielenia wnętrza gołębnika wapnem' : undefined,
    correctiveAction: 'Pobielić ściany i sufity gołębnika świeżym mlekiem wapiennym',
    deadlineDays: 21,
  });

  // 12. Bezpieczne składowanie odchodów
  evaluations.push({
    id: 'manure_storage',
    pillar: 'HYGIENE_QUARANTINE',
    title: 'Izolowane składowanie odchodów (szczelne worki / zabezpieczona płyta gnojowa)',
    isCritical: false,
    isCompliant: checklist.isolatedManureStorage,
    scoreWeight: 5,
    failureReason: !checklist.isolatedManureStorage ? 'Otwarte składowisko odchodów w bezpośrednim sąsiedztwie wolier' : undefined,
    correctiveAction: 'Zabezpieczyć pomiot w szczelnych workach lub na zadaszonej płycie gnojowej niedostępnej dla ptaków dzikich',
    deadlineDays: 7,
  });

  // 13. Funkcjonalna izolatka (kwarantanna)
  evaluations.push({
    id: 'quarantine_station',
    pillar: 'HYGIENE_QUARANTINE',
    title: 'Wydzielona izolatka kwarantannowa dla nowych i chorych ptaków (min. 21 dni)',
    isCritical: false,
    isCompliant: checklist.quarantineStationFunctional,
    scoreWeight: 5,
    failureReason: !checklist.quarantineStationFunctional ? 'Brak fizycznie odseparowanego pomieszczenia kwarantanny' : undefined,
    correctiveAction: 'Wyznaczyć i zdezynfekować klatki kwarantannowe w osobnym pomieszczeniu',
    deadlineDays: 10,
  });

  // 14. Ważne szczepienie PMV-1 (krytyczne)
  evaluations.push({
    id: 'pmv_vaccine',
    pillar: 'VET_DOCUMENTATION',
    title: 'Urzędowe zaświadczenie o ważnym szczepieniu stada przeciw PMV-1 (paramyksowiroza)',
    isCritical: true,
    isCompliant: checklist.validPmvVaccination,
    scoreWeight: 10,
    failureReason: !checklist.validPmvVaccination ? 'Brak aktualnego zaświadczenia lekarsko-weterynaryjnego o szczepieniu PMV-1' : undefined,
    correctiveAction: 'Wykonać urzędowe szczepienie stada przeciw PMV-1 pod nadzorem lekarza weterynarii',
    deadlineDays: 7,
  });

  // 15. E-Księga leczenia zwierząt
  evaluations.push({
    id: 'vet_treatment_book',
    pillar: 'VET_DOCUMENTATION',
    title: 'Urzędowa dokumentacja leczenia stada i przestrzegania okresów karencji',
    isCritical: false,
    isCompliant: checklist.veterinaryBookUpToDate,
    scoreWeight: 5,
    failureReason: !checklist.veterinaryBookUpToDate ? 'Niewypełniona lub niekompletna E-Książka Leczenia Zwierząt' : undefined,
    correctiveAction: 'Uzupełnić wpisy w rejestrze leczenia zwierząt wraz z numerami serii leków i karencjami',
    deadlineDays: 5,
  });

  // Obliczenia punktacji
  let totalPoints = 0;
  let maxPoints = 0;
  let criticalViolationsCount = 0;

  for (const item of evaluations) {
    maxPoints += item.scoreWeight;
    if (item.isCompliant) {
      totalPoints += item.scoreWeight;
    } else if (item.isCritical) {
      criticalViolationsCount++;
    }
  }

  const scorePercent = Math.round((totalPoints / maxPoints) * 100);

  // Werdykt bioasekuracyjny
  let verdict: BiosecurityVerdict;
  let verdictLabel: string;
  let epizooticRisk: 'LOW' | 'MEDIUM' | 'HIGH';

  if (criticalViolationsCount === 0 && scorePercent >= 85) {
    verdict = 'FULL_COMPLIANCE';
    verdictLabel = 'Zgodność Pełna — Obiekt bezpieczny epizootycznie (Brak uwag krytycznych)';
    epizooticRisk = 'LOW';
  } else if (criticalViolationsCount <= 1 && scorePercent >= 60) {
    verdict = 'CONDITIONAL_COMPLIANCE';
    verdictLabel = 'Zgodność Warunkowa — Wymagane usunięcie uchybień w wyznaczonym terminie';
    epizooticRisk = 'MEDIUM';
  } else {
    verdict = 'NON_COMPLIANT';
    verdictLabel = 'Niezgodność — Naruszenie krytycznych norm bioasekuracji PIW (Ryzyko HPAI/ND)';
    epizooticRisk = 'HIGH';
  }

  // Plan korygujący
  const correctivePlan = evaluations
    .filter((e) => !e.isCompliant && e.correctiveAction)
    .map((e) => ({
      item: e.title,
      action: e.correctiveAction!,
      deadlineDays: e.deadlineDays || 14,
    }));

  return {
    scorePercent,
    totalPoints,
    maxPoints,
    verdict,
    verdictLabel,
    epizooticRisk,
    criticalViolationsCount,
    evaluations,
    correctivePlan,
  };
}

/**
 * Generuje oficjalny urzędowy dokument A4 HTML do wydruku lub zapisu PDF
 */
export function generateBiosecurityReportHtml(data: {
  loftInfo: BiosecurityLoftInfo;
  checklist: BiosecurityChecklist;
  result: BiosecurityComplianceResult;
}): string {
  const { loftInfo, result } = data;

  const verdictColor =
    result.verdict === 'FULL_COMPLIANCE'
      ? '#2E7D32'
      : result.verdict === 'CONDITIONAL_COMPLIANCE'
      ? '#ED6C02'
      : '#D32F2F';

  const riskBadgeColor =
    result.epizooticRisk === 'LOW'
      ? '#2E7D32'
      : result.epizooticRisk === 'MEDIUM'
      ? '#ED6C02'
      : '#D32F2F';

  const riskBadgeLabel =
    result.epizooticRisk === 'LOW'
      ? 'NISKIE (BEZPIECZNY)'
      : result.epizooticRisk === 'MEDIUM'
      ? 'ŚREDNIE (WARUNKOWY)'
      : 'WYSOKIE (ZAGROŻENIE)';

  const auditRoleLabel =
    loftInfo.auditorRole === 'piw_inspector'
      ? 'Inspektor Powiatowego Inspektoratu Weterynarii (PIW)'
      : loftInfo.auditorRole === 'field_vet'
      ? 'Uprawniony Lekarz Weterynarii (Lecznica Wolnej Praktyki)'
      : 'Hodowca / Posiadacz Stada (Samokontrola Bioasekuracyjna)';

  const auditReasonLabel =
    loftInfo.auditReason === 'routine_inspection'
      ? 'Rutynowa kontrola urzędowa PIW'
      : loftInfo.auditReason === 'pre_season_check'
      ? 'Przegląd bioasekuracyjny przed sezonem lotowym PZHGP'
      : loftInfo.auditReason === 'hpai_zone_control'
      ? 'Kontrola w strefie zagrożonej wysoce zjadliwą grypą ptaków (HPAI)'
      : 'Wystawienie świadectwa zdrowia / paszportu stada';

  const evaluationRowsHtml = result.evaluations
    .map(
      (ev, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'};">
      <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-size: 11px; text-align: center;">${idx + 1}</td>
      <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-size: 11px;">
        <strong>${ev.title}</strong>
        ${ev.isCritical ? '<span style="color: #D32F2F; font-size: 9px; font-weight: bold; margin-left: 4px;">[KRYTYCZNE]</span>' : ''}
        ${ev.failureReason ? `<div style="color: #C62828; font-size: 10px; margin-top: 2px;">⚠️ ${ev.failureReason}</div>` : ''}
      </td>
      <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-size: 11px; text-align: center; font-weight: bold; color: ${
        ev.isCompliant ? '#2E7D32' : '#D32F2F'
      };">
        ${ev.isCompliant ? '✓ SPEŁNIONO' : '✗ NIESPEŁNIONO'}
      </td>
      <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-size: 11px; text-align: center;">
        ${ev.isCompliant ? `${ev.scoreWeight} / ${ev.scoreWeight}` : `0 / ${ev.scoreWeight}`}
      </td>
    </tr>
  `
    )
    .join('');

  const correctiveRowsHtml =
    result.correctivePlan.length > 0
      ? result.correctivePlan
          .map(
            (c, i) => `
        <tr style="background-color: ${i % 2 === 0 ? '#FFF8E1' : '#FFFDF7'};">
          <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-size: 11px; text-align: center; font-weight: bold;">${i + 1}</td>
          <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-size: 11px;"><strong>${c.item}</strong></td>
          <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-size: 11px; color: #B78103;">${c.action}</td>
          <td style="padding: 6px 8px; border: 1px solid #D1D5DB; font-size: 11px; text-align: center; font-weight: bold; color: #D32F2F;">${c.deadlineDays} dni</td>
        </tr>
      `
          )
          .join('')
      : `<tr><td colspan="4" style="padding: 10px; text-align: center; color: #2E7D32; font-size: 11px; border: 1px solid #D1D5DB;">Brak uchybień. Wszystkie standardy bioasekuracji zostały zachowane.</td></tr>`;

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Protokół Bioasekuracji PIW - ${loftInfo.wniNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      line-height: 1.35;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #111827;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .title-box {
      text-align: center;
      margin-bottom: 14px;
    }
    .title-box h1 {
      font-size: 16px;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      letter-spacing: 0.5px;
      color: #111827;
    }
    .title-box p {
      font-size: 10px;
      color: #4B5563;
      margin: 0;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border: 1px solid #D1D5DB;
    }
    .info-grid td {
      padding: 5px 8px;
      font-size: 11px;
      border: 1px solid #E5E7EB;
    }
    .info-label {
      background-color: #F3F4F6;
      font-weight: bold;
      width: 25%;
      color: #374151;
    }
    .scorecard {
      display: flex;
      border: 2px solid ${verdictColor};
      background-color: #F9FAFB;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      justify-content: space-between;
      align-items: center;
    }
    .scorecard-item {
      text-align: center;
    }
    .scorecard-val {
      font-size: 20px;
      font-weight: 800;
      color: ${verdictColor};
    }
    .scorecard-lbl {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: bold;
      color: #6B7280;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 12px 0 6px 0;
      color: #1F2937;
      border-left: 4px solid #1F2937;
      padding-left: 6px;
    }
    .audit-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .audit-table th {
      background-color: #F3F4F6;
      border: 1px solid #D1D5DB;
      padding: 6px 8px;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: bold;
      color: #374151;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    .signature-box {
      width: 48%;
      border-top: 1px dashed #4B5563;
      text-align: center;
      padding-top: 6px;
      font-size: 10px;
      color: #374151;
    }
    .footer {
      margin-top: 18px;
      font-size: 8px;
      color: #9CA3AF;
      text-align: center;
      border-top: 1px solid #E5E7EB;
      padding-top: 6px;
    }
  </style>
</head>
<body>

  <!-- Nagłówek Urzędowy -->
  <table class="header-table">
    <tr>
      <td style="width: 70%;">
        <div style="font-size: 12px; font-weight: 800; color: #111827;">RZECZPOSPOLITA POLSKA</div>
        <div style="font-size: 10px; font-weight: 600; color: #4B5563;">INSPEKCJA WETERYNARYJNA / POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH</div>
      </td>
      <td style="width: 30%; text-align: right;">
        <div style="font-size: 11px; font-weight: bold; color: #1F2937;">WNI: ${loftInfo.wniNumber}</div>
        <div style="font-size: 9px; color: #6B7280;">Data audytu: ${loftInfo.auditDate}</div>
      </td>
    </tr>
  </table>

  <!-- Tytuł -->
  <div class="title-box">
    <h1>PROTOKÓŁ KONTROLI SANITARNO-WETERYNARYJNEJ I BIOASEKURACJI GOŁĘBNIKA</h1>
    <p>Sporządzony zgodnie z wymogami Rozporządzenia Ministra Rolnictwa i Rozwoju Wsi w sprawie środków bioasekuracji dla ptaków</p>
  </div>

  <!-- Dane Podmiotu Kontrolowanego -->
  <table class="info-grid">
    <tr>
      <td class="info-label">Posiadacz stada:</td>
      <td><strong>${loftInfo.breederName}</strong> (${loftInfo.loftName})</td>
      <td class="info-label">Liczebność stada:</td>
      <td><strong>${loftInfo.totalBirdsCount} sztuk</strong></td>
    </tr>
    <tr>
      <td class="info-label">Lokalizacja gołębnika:</td>
      <td>${loftInfo.address}</td>
      <td class="info-label">Przynależność PZHGP:</td>
      <td>Oddział: ${loftInfo.pzhgpBranch}, Sekcja: ${loftInfo.pzhgpSection}</td>
    </tr>
    <tr>
      <td class="info-label">Osoba kontrolująca:</td>
      <td>${loftInfo.auditorName}</td>
      <td class="info-label">Rola kontrolera:</td>
      <td>${auditRoleLabel}</td>
    </tr>
    <tr>
      <td class="info-label">Cel inspekcji:</td>
      <td colspan="3">${auditReasonLabel}</td>
    </tr>
  </table>

  <!-- Tablica Wyników (Scorecard) -->
  <div class="scorecard">
    <div class="scorecard-item">
      <div class="scorecard-val">${result.scorePercent}%</div>
      <div class="scorecard-lbl">Wskaźnik Zgodności</div>
    </div>
    <div class="scorecard-item">
      <div class="scorecard-val">${result.totalPoints} / ${result.maxPoints} pkt</div>
      <div class="scorecard-lbl">Punktacja Audytu</div>
    </div>
    <div class="scorecard-item">
      <div class="scorecard-val" style="color: ${riskBadgeColor};">${riskBadgeLabel}</div>
      <div class="scorecard-lbl">Ryzyko Epizootyczne</div>
    </div>
    <div class="scorecard-item">
      <div class="scorecard-val" style="font-size: 13px; color: ${verdictColor}; line-height: 1.2; max-width: 260px; text-align: right;">
        ${result.verdict === 'FULL_COMPLIANCE' ? 'POZYTYWNY (ZGODNY)' : result.verdict === 'CONDITIONAL_COMPLIANCE' ? 'WARUNKOWO DOPUSZCZONY' : 'NEGATYWNY (ZAKAZ)'}
      </div>
      <div class="scorecard-lbl" style="text-align: right;">Werdykt Końcowy</div>
    </div>
  </div>

  <div style="font-size: 11px; margin-bottom: 12px; padding: 6px 10px; background-color: #F3F4F6; border-radius: 4px;">
    <strong>Orzeczenie audytora:</strong> ${result.verdictLabel}
  </div>

  <!-- Szczegółowa Karta Kontrolna -->
  <div class="section-title">I. KARTA KONTROLNA WYMOGÓW BIOASEKURACYJNYCH (15 PUNKTÓW)</div>
  <table class="audit-table">
    <thead>
      <tr>
        <th style="width: 5%;">Lp.</th>
        <th style="width: 65%;">Kontrolowany standard bioasekuracji</th>
        <th style="width: 18%;">Status inspekcji</th>
        <th style="width: 12%;">Waga</th>
      </tr>
    </thead>
    <tbody>
      ${evaluationRowsHtml}
    </tbody>
  </table>

  <!-- Zalecenia Pokontrolne -->
  <div class="section-title">II. ZALECENIA POKONTROLNE I TERMINY USUNIĘCIA UCHYBIEŃ</div>
  <table class="audit-table">
    <thead>
      <tr>
        <th style="width: 5%;">Lp.</th>
        <th style="width: 35%;">Obszar uchybienia</th>
        <th style="width: 45%;">Zalecane działanie naprawcze (standard PIW)</th>
        <th style="width: 15%;">Termin wykonania</th>
      </tr>
    </thead>
    <tbody>
      ${correctiveRowsHtml}
    </tbody>
  </table>

  <!-- Podpisy -->
  <table class="signatures-table">
    <tr>
      <td class="signature-box" style="margin-right: 4%;">
        .........................................................................<br>
        <strong>Podpis i pieczęć Lekarza Weterynarii / Kontrolera</strong><br>
        <span style="font-size: 9px; color: #6B7280;">(Potwierdzenie przeprowadzenia inspekcji)</span>
      </td>
      <td style="width: 4%;"></td>
      <td class="signature-box">
        .........................................................................<br>
        <strong>Czytelny podpis Posiadacza Stada</strong><br>
        <span style="font-size: 9px; color: #6B7280;">(Przyjmuję do wiadomości zalecenia pokontrolne)</span>
      </td>
    </tr>
  </table>

  <div class="footer">
    PIGEON-FLY Offline System Bioasekuracji • Wygenerowano automatycznie zgodnie z normami PIW / GLW • Weryfikacja cyfrowa: SHA-256
  </div>
</body>
</html>
  `.trim();
}
