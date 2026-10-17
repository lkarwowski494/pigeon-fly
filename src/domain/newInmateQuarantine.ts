/**
 * PIGEON-FLY — New Inmate Quarantine & Isolation Ward Engine (Z-076 / DEC-90)
 * Biosecurity standard for newly acquired pigeons (purchases, imports, gifts):
 * 21-day quarantine protocol in 4 distinct clinical stages:
 * - Stage 1 (D1-D5): Aklimatyzacja, zbiórka próbki kału (kokcydia, glisty, kapilaria, salmonella).
 * - Stage 2 (D6-D12): Diagnostyka wymazu z wola (Trichomonas, Candida), celowane leczenie.
 * - Stage 3 (D13-D20): Szczepienie przypominające PMV-1, zwalczanie pasożytów zewnętrznych, probiotykoterapia.
 * - Stage 4 (D21): Końcowy audyt kliniczny i urzędowe Świadectwo Zakończenia Kwarantanny (PIW/PZHGP).
 */

export type QuarantineStageCode =
  | 'STAGE_1_ADMISSION' // D1-D5
  | 'STAGE_2_DIAGNOSTICS' // D6-D12
  | 'STAGE_3_IMMUNIZATION' // D13-D20
  | 'STAGE_4_CLEARANCE' // D21+
  | 'CLEARED'
  | 'REJECTED_DISEASED';

export type LabTestResultStatus = 'pending' | 'negative' | 'positive_treated';
export type VaccinationCheckStatus = 'verified_valid' | 'booster_administered' | 'pending';

export interface InmateQuarantineRecord {
  id: string;
  ringNumber: string;
  originSource: string; // np. "Aukcja PIPA - Belgia", "Hodowla Kowalski - Oddział 0284"
  countryCode: string; // PL, DV, BE, NL itp.
  sex: 'cock' | 'hen';
  plumage?: string; // np. "Niebieski", "Nakrapiany"
  admissionDate: string; // YYYY-MM-DD
  targetLoftSection: 'breeding' | 'racing' | 'youngsters';
  coproscopyStatus: LabTestResultStatus;
  coproscopyDetails?: string; // np. "Pojedyncze oocysty kokcydiów (<10 w p.w.), odrobaczony"
  cropSmearStatus: LabTestResultStatus;
  cropSmearDetails?: string; // np. "Brak rzęsistka (Trichomonas ujemny)"
  pmv1Status: VaccinationCheckStatus;
  pmv1VaccineBatch?: string; // np. "Pharmavac PMV ser. 24881"
  ectoparasiteTreatmentDone: boolean; // Pasożyty zewnętrzne (wszoły, piórojady)
  clinicalExamNormal: boolean; // Waga, woskówka, gardło, odchody
  clinicalNotes?: string;
  clearedDate?: string; // YYYY-MM-DD
  assignedVeterinarian?: string;
}

export interface InmateQuarantineEvaluation {
  id: string;
  ringNumber: string;
  daysElapsed: number;
  minRequiredDays: number;
  currentStage: QuarantineStageCode;
  stageName: string;
  progressPct: number; // 0 - 100%
  canDischargeToMainLoft: boolean;
  blockingReasons: string[];
  recommendations: string[];
  nextActionRequired: string;
}

const parseDateOnly = (dStr: string): Date => {
  const parts = dStr.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
};

const diffDays = (d1: Date, d2: Date): number => {
  const ms1 = d1.getTime();
  const ms2 = d2.getTime();
  return Math.round((ms1 - ms2) / (1000 * 60 * 60 * 24));
};

/**
 * Evaluates clinical quarantine stage, progress, and discharge eligibility for a new pigeon.
 */
export function evaluateInmateQuarantine(
  record: InmateQuarantineRecord,
  nowDate: Date = new Date()
): InmateQuarantineEvaluation {
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 12, 0, 0, 0);
  const admDate = parseDateOnly(record.admissionDate);
  const daysElapsed = Math.max(1, diffDays(today, admDate) + 1);
  const minRequiredDays = 21;

  const blockingReasons: string[] = [];
  const recommendations: string[] = [];
  let currentStage: QuarantineStageCode = 'STAGE_1_ADMISSION';
  let stageName = 'Etap 1: Aklimatyzacja i Badanie Kału (D1–D5)';
  let progressPct = 15;
  let nextAction = 'Pobierz próbkę kału na badanie koproskopowe i podawaj elektrolity.';

  if (record.clearedDate) {
    return {
      id: record.id,
      ringNumber: record.ringNumber,
      daysElapsed,
      minRequiredDays,
      currentStage: 'CLEARED',
      stageName: 'Kwarantanna zakończona pomyślnie (Wprowadzony do stada)',
      progressPct: 100,
      canDischargeToMainLoft: true,
      blockingReasons: [],
      recommendations: ['Ptak wprowadzony do stada głównego. Monitoruj integrację w celi.'],
      nextActionRequired: 'Brak akcji — kwarantanna sfinalizowana.',
    };
  }

  // Determine stage by calendar days
  if (daysElapsed >= 21) {
    currentStage = 'STAGE_4_CLEARANCE';
    stageName = 'Etap 4: Audyt Końcowy i Dopuszczenie (D21+)';
    progressPct = 95;
    nextAction = 'Przeprowadź końcowe badanie kliniczne i wystaw certyfikat dopuszczenia.';
  } else if (daysElapsed >= 13) {
    currentStage = 'STAGE_3_IMMUNIZATION';
    stageName = 'Etap 3: Immunizacja PMV-1 i Odbudowa Flory (D13–D20)';
    progressPct = 65;
    nextAction = 'Wykonaj szczepienie przypominające PMV-1 i kąpiel przeciw insektycydom.';
  } else if (daysElapsed >= 6) {
    currentStage = 'STAGE_2_DIAGNOSTICS';
    stageName = 'Etap 2: Diagnostyka Wola i Terapia (D6–D12)';
    progressPct = 40;
    nextAction = 'Pobierz wymaz z wola pod kątem rzęsistka i grzybicy (Candida).';
  } else {
    currentStage = 'STAGE_1_ADMISSION';
    stageName = 'Etap 1: Aklimatyzacja i Badanie Kału (D1–D5)';
    progressPct = Math.round((daysElapsed / 21) * 100);
    nextAction = 'Zbieraj 3-dniową próbkę kału, podawaj zakwaszacz pH 4.0.';
  }

  // Clinical verification checklist
  if (daysElapsed < minRequiredDays) {
    blockingReasons.push(`Wymóg czasu: Kwarantanna trwa ${daysElapsed} dni (minimum zoohigieniczne to 21 dni).`);
  }

  if (record.coproscopyStatus === 'pending') {
    blockingReasons.push('Brak ostatecznego wyniku badania koproskopowego kału (kokcydioza / robaczyca).');
    recommendations.push('Przekaż 3-dniową próbkę kału do laboratorium weterynaryjnego.');
  }

  if (record.cropSmearStatus === 'pending') {
    blockingReasons.push('Brak wyniku wymazu z wola (Trichomonas / Candida).');
    recommendations.push('Wykonaj badanie mikroskopowe wymazu z wola.');
  }

  if (record.pmv1Status === 'pending') {
    blockingReasons.push('Brak potwierdzenia lub wykonania szczepienia przeciw paramyksowirozie (PMV-1).');
    recommendations.push('Podaj dawkę szczepionki PMV-1 z zachowaniem kwarantanny poszczepiennej.');
  }

  if (!record.ectoparasiteTreatmentDone) {
    blockingReasons.push('Brak zabiegu eliminacji pasożytów zewnętrznych (piórojady / roztocza).');
    recommendations.push('Zastosuj kroplę insektycydu lub kąpiel z solą i permetryną.');
  }

  if (!record.clinicalExamNormal) {
    blockingReasons.push('Objawy kliniczne nieprawidłowe (osowiałość, brak apetytu, duszność lub kał wodnisty).');
    recommendations.push('Skonsultuj ptaka z lekarzem weterynarii przed zwolnieniem.');
  }

  const canDischarge = blockingReasons.length === 0;

  return {
    id: record.id,
    ringNumber: record.ringNumber,
    daysElapsed,
    minRequiredDays,
    currentStage,
    stageName,
    progressPct: canDischarge ? 100 : progressPct,
    canDischargeToMainLoft: canDischarge,
    blockingReasons,
    recommendations,
    nextActionRequired: nextAction,
  };
}

/**
 * Generates official A4 Clearance Certificate HTML for PIW/PZHGP records.
 */
export function generateInmateQuarantineCertificateHtml(params: {
  record: InmateQuarantineRecord;
  evaluation: InmateQuarantineEvaluation;
  loftName?: string;
  breederName?: string;
  seasonYear?: number;
}): string {
  const { record, evaluation } = params;
  const loft = params.loftName || 'Gołębnik Mistrza Pigeon-Fly';
  const breeder = params.breederName || 'Hodowca Pigeon-Fly';
  const year = params.seasonYear || new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>Świadectwo Zakończenia Kwarantanny - ${record.ringNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
    }
    .header-box {
      border-bottom: 2px solid #047857;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .title { font-size: 19px; font-weight: 900; color: #047857; text-transform: uppercase; }
    .subtitle { font-size: 11px; color: #475569; font-weight: 600; margin-top: 3px; }
    .patient-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
      margin-bottom: 14px;
    }
    .patient-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 12px;
    }
    .grid-cell { flex: 1 1 45%; }
    .cell-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .cell-val { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .badge-clear {
      display: inline-block;
      background: #047857;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .table-title {
      font-size: 12px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      margin: 14px 0 6px 0;
    }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 14px; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 6px 8px; border: 1px solid #cbd5e1; }
    td { padding: 6px 8px; border: 1px solid #cbd5e1; }
    .status-ok { color: #047857; font-weight: 800; }
    .verdict-box {
      border: 2px solid #047857;
      background: #ecfdf5;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 18px;
    }
    .verdict-title { font-size: 13px; font-weight: 900; color: #065f46; text-transform: uppercase; margin-bottom: 4px; }
    .verdict-text { font-size: 11px; color: #047857; line-height: 1.5; }
    .signatures-box {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 10px;
    }
    .sig-col { text-align: center; width: 45%; }
    .sig-line { border-bottom: 1px dashed #64748b; height: 35px; margin-bottom: 4px; }
    .sig-lbl { font-size: 10px; color: #64748b; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="title">🛡️ ŚWIADECTWO ZAKOŃCZENIA KWARANTANNY BIOLOGICZNEJ (PIW / PZHGP)</div>
    <div class="subtitle">E-Księga Kontroli Weterynaryjnej Nowych Nabytków &bull; ${loft} &bull; ${year}</div>
  </div>

  <div class="patient-card">
    <div class="patient-grid">
      <div class="grid-cell">
        <div class="cell-lbl">Obrączka rodowa ptaka</div>
        <div class="cell-val">${record.ringNumber} (${record.countryCode})</div>
      </div>
      <div class="grid-cell">
        <div class="cell-lbl">Płeć i Umaszczenie</div>
        <div class="cell-val">${record.sex === 'cock' ? '♂ Samiec' : '♀ Samica'} &bull; ${record.plumage || 'Standard'}</div>
      </div>
      <div class="grid-cell">
        <div class="cell-lbl">Pochodzenie / Źródło zakupu</div>
        <div class="cell-val">${record.originSource}</div>
      </div>
      <div class="grid-cell">
        <div class="cell-lbl">Czas kwarantanny</div>
        <div class="cell-val">${evaluation.daysElapsed} dni (od ${record.admissionDate})</div>
      </div>
      <div class="grid-cell">
        <div class="cell-lbl">Sekcja docelowa</div>
        <div class="cell-val">${record.targetLoftSection === 'breeding' ? 'Przedział Rozpłodowy' : record.targetLoftSection === 'racing' ? 'Przedział Lotowy' : 'Młodzież'}</div>
      </div>
      <div class="grid-cell">
        <div class="cell-lbl">Orzeczenie weterynaryjne</div>
        <div>
          <span class="badge-clear">${evaluation.canDischargeToMainLoft ? 'DOPUSZCZONY DO STADA' : 'W TRAKCIE PROCEDURY'}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="table-title">1. Wyniki Badań Laboratoryjnych i Zabiegów Weterynaryjnych</div>
  <table>
    <thead>
      <tr>
        <th>Badanie / Procedura zoohigieniczna</th>
        <th>Termin</th>
        <th>Wynik laboratoryjny</th>
        <th>Szczegóły / Seria leku</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Badanie koproskopowe (kał)</strong></td>
        <td>D1–D5</td>
        <td class="status-ok">${record.coproscopyStatus === 'negative' ? 'UJEMNY (brak oocyst)' : record.coproscopyStatus === 'positive_treated' ? 'WYLECZONY' : 'W TOKU'}</td>
        <td>${record.coproscopyDetails || 'Brak inwazji glist i kokcydiów'}</td>
      </tr>
      <tr>
        <td><strong>Wymaz z wola (Trichomonas / Candida)</strong></td>
        <td>D6–D12</td>
        <td class="status-ok">${record.cropSmearStatus === 'negative' ? 'PRAWIDŁOWY' : record.cropSmearStatus === 'positive_treated' ? 'WYLECZONY' : 'W TOKU'}</td>
        <td>${record.cropSmearDetails || 'Brak rzęsistka (Trichomonas ujemny)'}</td>
      </tr>
      <tr>
        <td><strong>Szczepienie ochronne PMV-1</strong></td>
        <td>D13–D20</td>
        <td class="status-ok">${record.pmv1Status === 'verified_valid' ? 'WAŻNE' : record.pmv1Status === 'booster_administered' ? 'PODANE' : 'W TOKU'}</td>
        <td>${record.pmv1VaccineBatch || 'Potwierdzone zaświadczeniem'}</td>
      </tr>
      <tr>
        <td><strong>Pasożyty zewnętrzne (piórojady)</strong></td>
        <td>D13–D20</td>
        <td class="status-ok">${record.ectoparasiteTreatmentDone ? 'ZABIEG WYKONANY' : 'BRAK'}</td>
        <td>Kąpiel z insektycydem / permetryna</td>
      </tr>
      <tr>
        <td><strong>Końcowe badanie kliniczne</strong></td>
        <td>D21</td>
        <td class="status-ok">${record.clinicalExamNormal ? 'ZDROWE (stan b. dobry)' : 'ZMIANY'}</td>
        <td>${record.clinicalNotes || 'Brak zmian osłuchowych, wole i odchody wzorowe'}</td>
      </tr>
    </tbody>
  </table>

  <div class="verdict-box">
    <div class="verdict-title">Orzeczenie i Zaświadczenie Końcowe:</div>
    <div class="verdict-text">
      Niniejszym zaświadcza się, że wyżej wymieniony gołąb pocztowy o numerze obrączki <strong>${record.ringNumber}</strong>
      przeszedł pełną 21-dniową kwarantannę biologiczną w odrębnym boksie izolacyjnym zgodnie z procedurami
      bioasekuracji PIW. Badania laboratoryjne i kliniczne nie wykazały nosicielstwa patogenów zakaźnych.
      Ptak zostaje <strong>DOPUSZCZONY do wpuszczenia do gołębnika głównego</strong> (${loft}).
    </div>
  </div>

  <div class="signatures-box">
    <div class="sig-col">
      <div class="sig-line"></div>
      <div class="sig-lbl">Podpis i pieczęć Lekarza Weterynarii (lub Hodowcy)</div>
    </div>
    <div class="sig-col">
      <div class="sig-line"></div>
      <div class="sig-lbl">Księga Rejestru Bioasekuracji Gołębnika</div>
    </div>
  </div>

  <div style="font-size: 9px; color: #94a3b8; text-align: right; margin-top: 14px;">
    Pigeon-Fly Quarantine Ward &bull; ID: ${record.id} &bull; Wygenerowano: ${new Date().toISOString().slice(0, 10)}
  </div>
</body>
</html>
  `.trim();
}
