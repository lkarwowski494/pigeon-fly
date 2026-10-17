/**
 * PIGEON-FLY — Veterinary Laboratory Registry & Antibiogram Engine (Z-088 / DEC-102)
 * Comprehensive parasitology, bacteriology, and targeted therapeutic prescription management:
 * - Diagnostic coproscopy: Eimeria coccidiosis (OPG), Ascaridia roundworms, Capillaria hairworms.
 * - Crop swab wet mount: Trichomonas gallinae (canker), Candida albicans, Hexamita.
 * - Microbiological culture: Salmonella Typhimurium var. Copenhagen, pathogenic E. coli.
 * - Antibiogram profiling: S (Susceptible), I (Intermediate), R (Resistant) sensitivity matrix.
 * - Targeted therapy protocol: active substance, dosage per liter/kg, withdrawal days, retest calendar.
 */

export type SampleType =
  | 'pool_feces_3day'
  | 'crop_swab'
  | 'cloacal_swab_culture'
  | 'blood_serology';

export const SAMPLE_TYPE_LABELS: Record<SampleType, string> = {
  pool_feces_3day: 'Zbiorcza 3-dniowa próbka kału (koprofagia stada)',
  crop_swab: 'Wymaz z wola (mikroskopia bezpośrednia / rzęsistek)',
  cloacal_swab_culture: 'Wymaz z kloaki (posiew bakteriologiczny + antybiogram)',
  blood_serology: 'Krew obwodowa (serologia / miano przeciwciał PMV-1)',
};

export interface AntibiogramEntry {
  antibioticName: string;
  susceptibility: 'S' | 'I' | 'R'; // S: Wrażliwy, I: Średnio wrażliwy, R: Oporny
  notes?: string;
}

export interface VeterinaryLabReportData {
  reportNumber: string; // np. "LAB-VET-2026/041"
  samplingDate: string;
  completionDate: string;
  laboratoryName: string;
  veterinarianName: string;
  sampleType: SampleType;
  // Loft details
  loftName: string;
  breederName: string;
  breederPzhgpNumber: string;
  flockSection: 'wdowcy' | 'samice' | 'mlode' | 'rozplod' | 'cale_stado';
  // Coproscopy / Parasitology
  coccidiaOpg: number; // Oocysts Per Gram (<1000 ok, 1000-8000 umiarkowane, >8000 ostre)
  ascaridiaPresent: boolean;
  ascaridiaEpg: number; // Eggs Per Gram
  capillariaPresent: boolean;
  capillariaEpg: number;
  // Crop / Protozoa / Fungi
  trichomonasLevel: 'negative' | 'low' | 'moderate' | 'high';
  candidaDetected: boolean;
  hexamitaDetected: boolean;
  // Bacteriology
  salmonellaDetected: boolean;
  salmonellaSerotype?: string;
  pathogenicEColiDetected: boolean;
  // Antibiogram (if culture positive)
  antibiogram: AntibiogramEntry[];
  // Treatment Prescription
  treatmentPrescribed: boolean;
  medicationName?: string;
  activeSubstance?: string;
  dosageInstruction?: string;
  treatmentDurationDays?: number;
  withdrawalDays?: number; // karencja lotowa
  retestRecommendedDays?: number; // np. 14 dni po kuracji
  doctorNotes?: string;
}

export interface LabEvaluationResult {
  flockHealthStatus: 'healthy_cleared' | 'treatment_required' | 'critical_isolation';
  statusLabel: string;
  statusColor: string;
  isFitForRacing: boolean;
  primaryDiagnoses: string[];
  actionableTherapySteps: string[];
}

/**
 * Evaluates laboratory diagnostics and determines flock flight eligibility.
 */
export function evaluateVeterinaryLabReport(
  data: VeterinaryLabReportData
): LabEvaluationResult {
  const primaryDiagnoses: string[] = [];
  const actionableTherapySteps: string[] = [];

  // 1. Salmonella - Critical Danger
  if (data.salmonellaDetected) {
    primaryDiagnoses.push(
      `Salmonelloza (${data.salmonellaSerotype || 'Salmonella enterica ser. Typhimurium'})`
    );
    actionableTherapySteps.push(
      'NATYCHMIASTOWA IZOLACJA ODDZIAŁU: Bezwzględny zakaz koszowania gołębi na loty konkursowe!',
      'Wdrożenie celowanej antybiotykoterapii zgodnie z antybiogramem (szczep wrażliwy).',
      'Dezynfekcja termiczna (opalanie palnikiem) rusztów i misek gniazdowych.'
    );
  }

  // 2. Capillaria (Nicienie włoskowate) - Severe
  if (data.capillariaPresent || data.capillariaEpg > 0) {
    primaryDiagnoses.push(`Kapilarioza (Capillaria obsignata: ${data.capillariaEpg} EPG)`);
    actionableTherapySteps.push(
      'Podaj lewamizol (np. Levamisol 10% 2 ml/L) lub fenbendazol przez 2 kolejne dni.',
      'Powtórz odrobaczanie dokładnie po 10-12 dniach, aby zniszczyć wylęgające się larwy.'
    );
  }

  // 3. Ascaridia (Glista gołębia)
  if (data.ascaridiaPresent || data.ascaridiaEpg > 0) {
    primaryDiagnoses.push(`Glistnica (Ascaridia columbae: ${data.ascaridiaEpg} EPG)`);
    if (!data.capillariaPresent) {
      actionableTherapySteps.push(
        'Jednorazowe odrobaczenie stada lewamizolem lub iwermektyną w kropli na skórę karku.'
      );
    }
  }

  // 4. Coccidiosis (Kokcydioza)
  if (data.coccidiaOpg >= 8000) {
    primaryDiagnoses.push(`Ostra kokcydioza (Eimeria labbeana: ${data.coccidiaOpg} OPG)`);
    actionableTherapySteps.push(
      'Zastosuj toltrazuril 2.5% (Baycox 2 ml/L wody przez 2 dni) lub sulfonamidy.',
      'Utrzymuj ściółkę w stanie idealnej suchości (Eimeria wymaga wilgoci do sporulacji).'
    );
  } else if (data.coccidiaOpg >= 2000) {
    primaryDiagnoses.push(`Umiarkowana kokcydioza (${data.coccidiaOpg} OPG)`);
    actionableTherapySteps.push(
      'Podaj łagodny preparat kokcydiostatyczny (amprolium lub oregano z zakwaszaczem pH 4.0).'
    );
  }

  // 5. Trichomonas (Rzęsistkowica)
  if (data.trichomonasLevel === 'high' || data.trichomonasLevel === 'moderate') {
    primaryDiagnoses.push(`Rzęsistkowica wola (Trichomonas gallinae: stopień ${data.trichomonasLevel})`);
    actionableTherapySteps.push(
      'Kuracja ronidazolem (10%) przez 5-6 dni lub jednorazowa tabletka karnidazolowa.',
      'Wymiana wody w poidłach 2x dziennie w celu przerwania łańcucha zakażeń.'
    );
  }

  // 6. Candida
  if (data.candidaDetected) {
    primaryDiagnoses.push('Kandydoza wola (Candida albicans)');
    actionableTherapySteps.push(
      'Podaj nystatynę lub zakwaszacz z miedzią; zakaz podawania antybiotyków bez osłony przeciwgrzybiczej.'
    );
  }

  // Classification & Flight Eligibility
  let flockHealthStatus: 'healthy_cleared' | 'treatment_required' | 'critical_isolation' =
    'healthy_cleared';
  let statusLabel = 'STADO ZDROWE — DOPUSZCZONE DO LOTÓW';
  let statusColor = '#10B981';
  let isFitForRacing = true;

  if (data.salmonellaDetected || data.capillariaEpg > 500 || data.coccidiaOpg > 15000) {
    flockHealthStatus = 'critical_isolation';
    statusLabel = 'KWARANTANNA LECZNICZA — ZAKAZ KOSZOWANIA';
    statusColor = '#EF4444';
    isFitForRacing = false;
  } else if (primaryDiagnoses.length > 0) {
    flockHealthStatus = 'treatment_required';
    statusLabel = 'WYKRYTO PATOGENY — WYMAGANA KURACJA CELOWANA';
    statusColor = '#F59E0B';
    isFitForRacing = data.coccidiaOpg < 6000 && data.trichomonasLevel !== 'high';
  } else {
    actionableTherapySteps.push(
      'Wyniki badań parazytologicznych i bakteriologicznych w normie fizjologicznej.',
      'Zaleca się kontynuację probiotykoterapii i zakwaszacza poidłowego.'
    );
  }

  return {
    flockHealthStatus,
    statusLabel,
    statusColor,
    isFitForRacing,
    primaryDiagnoses:
      primaryDiagnoses.length > 0 ? primaryDiagnoses : ['Stan fizjologiczny prawidłowy (brak inwazji)'],
    actionableTherapySteps,
  };
}

/**
 * Generates official PZHGP / Veterinary Diagnostic Lab Report HTML.
 */
export function generateVeterinaryLabReportHtml(
  data: VeterinaryLabReportData
): string {
  const evalResult = evaluateVeterinaryLabReport(data);

  const antibiogramHtml =
    data.antibiogram.length > 0
      ? `
  <div style="font-weight: 800; font-size: 9pt; margin-top: 10px; margin-bottom: 2px;">
    WYNIKI BADANIA LEKOWRAŻLIWOŚCI (ANTYBIOGRAM):
  </div>
  <table>
    <thead>
      <tr>
        <th>Substancja Czynna (Antybiotyk)</th>
        <th style="width: 140px; text-align: center;">Wrażliwość Szczepu</th>
        <th>Uwagi Farmakologiczne</th>
      </tr>
    </thead>
    <tbody>
      ${data.antibiogram
        .map(
          (a) => `
        <tr>
          <td style="font-weight: 700;">${a.antibioticName}</td>
          <td style="text-align: center; font-weight: 900; color: ${
            a.susceptibility === 'S'
              ? '#166534'
              : a.susceptibility === 'I'
              ? '#ca8a04'
              : '#991b1b'
          };">
            ${
              a.susceptibility === 'S'
                ? 'WRAŻLIWY (S)'
                : a.susceptibility === 'I'
                ? 'ŚREDNIO WRAŻLIWY (I)'
                : 'OPORNY (R)!'
            }
          </td>
          <td style="font-size: 8pt; color: #475569;">${a.notes || '—'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  `
      : '';

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Karta Badań Laboratoryjnych — ${data.reportNumber}</title>
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
    .lab-name { font-size: 13pt; font-weight: 900; text-transform: uppercase; color: #0284c7; }
    .doc-type { font-size: 9pt; color: #475569; margin-top: 2px; }
    .meta-box { font-size: 8pt; text-align: right; color: #334155; }

    .status-banner {
      border: 1.5px solid ${evalResult.statusColor};
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-text { font-size: 10.5pt; font-weight: 900; color: ${evalResult.statusColor}; }
    .racing-status {
      font-size: 8pt;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 4px;
      background: ${evalResult.isFitForRacing ? '#dcfce7' : '#fee2e2'};
      color: ${evalResult.isFitForRacing ? '#166534' : '#991b1b'};
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .card-title {
      font-size: 8.5pt;
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

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      margin-bottom: 8px;
      font-size: 8pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: left;
    }

    .prescription-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 3.5px solid #16a34a;
      padding: 8px 10px;
      margin-bottom: 10px;
      font-size: 8pt;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
      padding-top: 8px;
    }
    .sig-col {
      text-align: center;
      border-top: 1px dashed #64748b;
      padding-top: 6px;
    }
    .sig-title { font-size: 7.5pt; color: #64748b; text-transform: uppercase; }
    .sig-name { font-size: 8pt; font-weight: 800; margin-top: 2px; }

    .footer {
      margin-top: 14px;
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
      <div class="lab-name">${data.laboratoryName}</div>
      <div class="doc-type">SPRAWOZDANIE Z BADAŃ PARAZYTOLOGICZNYCH I BAKTERIOLOGICZNYCH (Z-088)</div>
    </div>
    <div class="meta-box">
      <div>Protokół nr: <strong>${data.reportNumber}</strong></div>
      <div>Pobrano: <strong>${data.samplingDate}</strong> | Zbadano: <strong>${data.completionDate}</strong></div>
      <div>Lekarz prowadzący: <strong>${data.veterinarianName}</strong></div>
    </div>
  </div>

  <div class="status-banner">
    <div>
      <div class="status-text">${evalResult.statusLabel}</div>
      <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
        Rozpoznanie: <strong>${evalResult.primaryDiagnoses.join(' • ')}</strong>
      </div>
    </div>
    <div class="racing-status">
      ${evalResult.isFitForRacing ? 'DOPUSZCZONY DO LOTÓW' : 'ZAKAZ LOTÓW'}
    </div>
  </div>

  <div class="grid-2">
    <!-- Metryka próbki -->
    <div class="card">
      <div class="card-title">METRYKA PRÓBKI I GOŁĘBNIKA</div>
      <div class="row">
        <span class="label">Hodowca / Właściciel:</span>
        <span class="val">${data.breederName} (${data.breederPzhgpNumber})</span>
      </div>
      <div class="row">
        <span class="label">Gołębnik:</span>
        <span class="val">${data.loftName}</span>
      </div>
      <div class="row">
        <span class="label">Badana grupa ptaków:</span>
        <span class="val" style="text-transform: uppercase;">${data.flockSection}</span>
      </div>
      <div class="row">
        <span class="label">Rodzaj nadesłanego materiału:</span>
        <span class="val">${SAMPLE_TYPE_LABELS[data.sampleType]}</span>
      </div>
    </div>

    <!-- Wyniki Parazytologii -->
    <div class="card">
      <div class="card-title">WYNIKI KOPROSKOPII I WYMAZÓW</div>
      <div class="row">
        <span class="label">Kokcydia (Eimeria sp.):</span>
        <span class="val" style="color: ${data.coccidiaOpg > 5000 ? '#991b1b' : '#166534'};">
          ${data.coccidiaOpg} OPG
        </span>
      </div>
      <div class="row">
        <span class="label">Glisty (Ascaridia columbae):</span>
        <span class="val" style="color: ${data.ascaridiaPresent ? '#991b1b' : '#166534'};">
          ${data.ascaridiaPresent ? `OBECNE (${data.ascaridiaEpg} EPG)` : 'NIE STWIERDZONO'}
        </span>
      </div>
      <div class="row">
        <span class="label">Nicienie włoskowate (Capillaria):</span>
        <span class="val" style="color: ${data.capillariaPresent ? '#991b1b' : '#166534'};">
          ${data.capillariaPresent ? `OBECNE (${data.capillariaEpg} EPG)` : 'NIE STWIERDZONO'}
        </span>
      </div>
      <div class="row">
        <span class="label">Rzęsistek (Trichomonas gallinae):</span>
        <span class="val" style="color: ${data.trichomonasLevel !== 'negative' ? '#ca8a04' : '#166534'};">
          ${data.trichomonasLevel.toUpperCase()}
        </span>
      </div>
      <div class="row">
        <span class="label">Salmonella / E. coli patogenne:</span>
        <span class="val" style="color: ${data.salmonellaDetected ? '#991b1b' : '#166534'};">
          ${data.salmonellaDetected ? 'SALMONELLA POZYTYWNA!' : 'Ujemny (czysto)'}
        </span>
      </div>
    </div>
  </div>

  ${antibiogramHtml}

  ${
    data.treatmentPrescribed
      ? `
  <div class="prescription-box">
    <div style="font-weight: 800; font-size: 8.5pt; color: #166534; margin-bottom: 4px;">
      ORDYNACJA LEKARSKA I ZALECENIA TERAPEUTYCZNE:
    </div>
    <div class="row">
      <span class="label">Preparat / Substancja czynna:</span>
      <span class="val">${data.medicationName} (${data.activeSubstance})</span>
    </div>
    <div class="row">
      <span class="label">Dawkowanie i czas podawania:</span>
      <span class="val">${data.dosageInstruction} (przez ${data.treatmentDurationDays} dni)</span>
    </div>
    <div class="row">
      <span class="label">Karencja lotowa / Kontrola po leczeniu:</span>
      <span class="val" style="color: #991b1b;">Karencja: ${data.withdrawalDays} dni • Kontrola za: ${data.retestRecommendedDays} dni</span>
    </div>
  </div>
  `
      : ''
  }

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; margin-bottom: 8px;">
    <strong>Wnioski Kliniczne i Działania Naprawcze:</strong>
    <ul style="margin: 2px 0; padding-left: 16px; color: #334155;">
      ${evalResult.actionableTherapySteps.map((s) => `<li>${s}</li>`).join('')}
    </ul>
  </div>

  <div class="signatures-grid">
    <div class="sig-col">
      <div class="sig-title">Diagnosta Laboratoryjny</div>
      <div class="sig-name">Podpis i pieczęć analityka ZHW</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Lekarz Weterynarii Zlecający</div>
      <div class="sig-name">${data.veterinarianName}</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Kartoteka Laboratoryjna Parazytoz i Bakteriologii Z-088</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
