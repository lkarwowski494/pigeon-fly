/**
 * PIGEON-FLY — Kalkulator Zegarowy Odchyłek Czasowych i Synchronizacji DCF-77 / GPS (Z-071)
 * Standard PZHGP (art. 44 Regulaminu Lotowo-Zegarowego PZHGP i FCI).
 * Obliczanie chodu zegara (przyspieszanie/spóźnianie), proporcjonalna korekta czasu odbicia
 * oraz kontrola dopuszczalnej tolerancji (max ±3 s/h i ±5 s/doba).
 */

export type ClockType = 'ELECTRONIC_ESK' | 'MECHANICAL_BENZING' | 'MECHANICAL_STB' | 'MECHANICAL_JUNIOR';

export interface ClockTypeMeta {
  type: ClockType;
  name: string;
  isElectronic: boolean;
  maxHourlyToleranceSec: number; // 3.0 s/h
  maxDailyToleranceSec: number; // 5.0 s/24h
}

export const CLOCK_TYPES: Record<ClockType, ClockTypeMeta> = {
  ELECTRONIC_ESK: {
    type: 'ELECTRONIC_ESK',
    name: 'Zegar Elektroniczny ESK (Tauris / Benzing / Bricon / Mega / Tipes)',
    isElectronic: true,
    maxHourlyToleranceSec: 1.0, // ESK ma wyższą precyzję
    maxDailyToleranceSec: 3.0,
  },
  MECHANICAL_BENZING: {
    type: 'MECHANICAL_BENZING',
    name: 'Zegar Mechaniczny Wskazówkowy Benzing Combi / Quartz',
    isElectronic: false,
    maxHourlyToleranceSec: 3.0,
    maxDailyToleranceSec: 72.0,
  },
  MECHANICAL_STB: {
    type: 'MECHANICAL_STB',
    name: 'Zegar Mechaniczny STB / Swiss Timer',
    isElectronic: false,
    maxHourlyToleranceSec: 3.0,
    maxDailyToleranceSec: 72.0,
  },
  MECHANICAL_JUNIOR: {
    type: 'MECHANICAL_JUNIOR',
    name: 'Zegar Mechaniczny Junior / Paloma / Toulet',
    isElectronic: false,
    maxHourlyToleranceSec: 3.0,
    maxDailyToleranceSec: 72.0,
  },
};

export type ClockValidationStatus =
  | 'PERFECT_SYNC'
  | 'NORMAL_TOLERANCE'
  | 'ACCEPTABLE_DRIFT'
  | 'DISQUALIFIED_EXCEEDED';

export interface ClockSyncSession {
  clockId: string;
  clockType: ClockType;
  clockNumber: string;
  breederName: string;
  raceName: string;
  // Punkt 1: Nastawianie zegarów (Clocking-in)
  masterSyncStartIso: string; // Czas wzorcowy matki DCF-77 / GPS
  clockSyncStartIso: string; // Czas na zegarze zawodnika w momencie nastawienia
  // Punkt 2: Otwieranie zegarów (Clocking-out)
  masterSyncEndIso: string; // Czas wzorcowy matki DCF-77 / GPS przy otwarciu
  clockSyncEndIso: string; // Czas na zegarze zawodnika przy otwarciu
}

export interface ClockDriftResult {
  sessionDurationHours: number;
  masterDurationSeconds: number;
  clockDurationSeconds: number;
  totalDriftSeconds: number; // >0 zegar przyspiesza, <0 spóźnia się
  hourlyDriftSeconds: number;
  dailyEquivalentDriftSeconds: number;
  status: ClockValidationStatus;
  statusDescription: string;
  isDisqualified: boolean;
  disqualificationReason?: string;
}

export interface ArrivalCorrectionInput {
  clockArrivalIso: string; // Czas odbicia odczytany z paska/zegara
  syncSession: ClockSyncSession;
  driftResult: ClockDriftResult;
  raceDistanceMeters: number;
}

export interface CorrectedArrivalResult {
  clockArrivalIso: string;
  officialArrivalIso: string;
  correctionOffsetSeconds: number; // w sekundach (dodawane lub odejmowane)
  originalVelocityMPerMin: number;
  officialCorrectedVelocityMPerMin: number;
  velocityImpactMPerMin: number;
  explanation: string;
}

export interface ClockProtocolData {
  protocolNumber: string;
  issueDate: string;
  raceName: string;
  pzhgpBranch: string;
  pzhgpSection: string;
  session: ClockSyncSession;
  drift: ClockDriftResult;
  arrivals: {
    ringNumber: string;
    clockTime: string;
    correctedTime: string;
    driftSeconds: number;
    officialVelocity: number;
  }[];
}

/**
 * Oblicza odchyłkę chodu zegara zgodnie z art. 44 Regulaminu PZHGP
 */
export function calculateClockDrift(session: ClockSyncSession): ClockDriftResult {
  const mStart = new Date(session.masterSyncStartIso).getTime();
  const cStart = new Date(session.clockSyncStartIso).getTime();
  const mEnd = new Date(session.masterSyncEndIso).getTime();
  const cEnd = new Date(session.clockSyncEndIso).getTime();

  const masterDurationSeconds = Math.round((mEnd - mStart) / 1000);
  const clockDurationSeconds = Math.round((cEnd - cStart) / 1000);

  const totalDriftSeconds = clockDurationSeconds - masterDurationSeconds;
  const sessionDurationHours = masterDurationSeconds > 0
    ? Number((masterDurationSeconds / 3600).toFixed(2))
    : 1;

  const hourlyDriftSeconds = Number((totalDriftSeconds / sessionDurationHours).toFixed(3));
  const dailyEquivalentDriftSeconds = Number((hourlyDriftSeconds * 24).toFixed(2));

  const limits = CLOCK_TYPES[session.clockType] || CLOCK_TYPES.MECHANICAL_BENZING;
  const absHourly = Math.abs(hourlyDriftSeconds);
  const absDaily = Math.abs(dailyEquivalentDriftSeconds);

  let status: ClockValidationStatus = 'NORMAL_TOLERANCE';
  let isDisqualified = false;
  let statusDescription = 'Zegar w pełni sprawny technicznie. Odchyłka w normie.';
  let disqualificationReason: string | undefined;

  if (totalDriftSeconds === 0) {
    status = 'PERFECT_SYNC';
    statusDescription = 'Perfekcyjna synchronizacja (0.0 s odchyłki).';
  } else if (absHourly > limits.maxHourlyToleranceSec || absDaily > limits.maxDailyToleranceSec) {
    status = 'DISQUALIFIED_EXCEEDED';
    isDisqualified = true;
    disqualificationReason = `Przekroczono dopuszczalną odchyłkę chodu zegara wg art. 44 PZHGP (${absHourly.toFixed(2)} s/h > ${limits.maxHourlyToleranceSec} s/h lub ${absDaily.toFixed(1)} s/24h > ${limits.maxDailyToleranceSec} s). Zegar unieważniony!`;
    statusDescription = 'DYSKWALIFIKACJA ZEGARA: Odchyłka chodu przekracza dopuszczalny limit regulaminowy.';
  } else if (absHourly >= limits.maxHourlyToleranceSec * 0.7) {
    status = 'ACCEPTABLE_DRIFT';
    statusDescription = 'Zegar w dopuszczalnej tolerancji, ale blisko progu ostrzegawczego. Wymagana proporcjonalna korekta czasu.';
  }

  return {
    sessionDurationHours,
    masterDurationSeconds,
    clockDurationSeconds,
    totalDriftSeconds,
    hourlyDriftSeconds,
    dailyEquivalentDriftSeconds,
    status,
    statusDescription,
    isDisqualified,
    disqualificationReason,
  };
}

/**
 * Wylicza proporcjonalną korektę czasu odbicia konkretnego gołębia
 */
export function correctArrivalTimestamp(params: ArrivalCorrectionInput): CorrectedArrivalResult {
  const { clockArrivalIso, syncSession, driftResult, raceDistanceMeters } = params;

  const cStart = new Date(syncSession.clockSyncStartIso).getTime();
  const cEnd = new Date(syncSession.clockSyncEndIso).getTime();
  const cArrival = new Date(clockArrivalIso).getTime();
  const mStart = new Date(syncSession.masterSyncStartIso).getTime();

  const totalClockSpan = cEnd - cStart;
  const arrivalElapsed = cArrival - cStart;

  // Proporcja upływu czasu (0.0 do 1.0)
  const ratio = totalClockSpan > 0 ? arrivalElapsed / totalClockSpan : 0;

  // Całkowita odchyłka zegara (jeśli zegar przyspiesza, driftResult.totalDriftSeconds > 0)
  // Wtedy czas zegara wyprzedza matkę, więc od czasu zegara trzeba ODJĄĆ korektę
  const correctionOffsetSeconds = Number((ratio * driftResult.totalDriftSeconds).toFixed(2));

  // Czas urzędowy matki
  const officialArrivalMs = cArrival - (correctionOffsetSeconds * 1000);
  const officialArrivalIso = new Date(officialArrivalMs).toISOString();

  // Obliczenie prędkości przed i po korekcie
  const originalFlightSeconds = Math.max(1, (cArrival - mStart) / 1000);
  const officialFlightSeconds = Math.max(1, (officialArrivalMs - mStart) / 1000);

  const originalVelocityMPerMin = Number(((raceDistanceMeters / originalFlightSeconds) * 60).toFixed(3));
  const officialCorrectedVelocityMPerMin = Number(((raceDistanceMeters / officialFlightSeconds) * 60).toFixed(3));
  const velocityImpactMPerMin = Number((officialCorrectedVelocityMPerMin - originalVelocityMPerMin).toFixed(3));

  const explanation = driftResult.totalDriftSeconds > 0
    ? `Zegar przyspieszał: odjęto ${correctionOffsetSeconds.toFixed(1)} s proporcjonalnie do czasu przelotu. Prędkość skorygowana o ${velocityImpactMPerMin > 0 ? '+' : ''}${velocityImpactMPerMin} m/min.`
    : driftResult.totalDriftSeconds < 0
    ? `Zegar spóźniał się: dodano ${Math.abs(correctionOffsetSeconds).toFixed(1)} s proporcjonalnie do czasu przelotu. Prędkość skorygowana o ${velocityImpactMPerMin} m/min.`
    : 'Brak odchyłki: czas odbicia w 100% zgodny z czasem wzorcowym matki.';

  return {
    clockArrivalIso,
    officialArrivalIso,
    correctionOffsetSeconds,
    originalVelocityMPerMin,
    officialCorrectedVelocityMPerMin,
    velocityImpactMPerMin,
    explanation,
  };
}

/**
 * Generuje urzędowy A4 Protokół Zegarowy Otwierania i Rozliczania Zegarów dla Komisji Zegarowej PZHGP
 */
export function generateClockProtocolHtml(data: ClockProtocolData): string {
  const { session, drift, arrivals } = data;
  const clockMeta = CLOCK_TYPES[session.clockType];

  const arrivalRows = arrivals.map((a, idx) => `
    <tr>
      <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
      <td style="font-weight: bold; font-family: monospace;">${escapeHtml(a.ringNumber)}</td>
      <td style="text-align: center;">${new Date(a.clockTime).toLocaleTimeString('pl-PL')}</td>
      <td style="text-align: center; font-weight: bold; color: #2B579A;">${new Date(a.correctedTime).toLocaleTimeString('pl-PL')}</td>
      <td style="text-align: center; color: ${a.driftSeconds > 0 ? '#E05656' : '#2e7d32'};">
        ${a.driftSeconds > 0 ? `-${a.driftSeconds.toFixed(1)} s` : `+${Math.abs(a.driftSeconds).toFixed(1)} s`}
      </td>
      <td style="text-align: right; font-weight: bold;">${a.officialVelocity.toFixed(2)} m/min</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Protokół Zegarowy PZHGP — ${escapeHtml(data.protocolNumber)}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 12mm; }
    body { font-family: Arial, sans-serif; font-size: 11.5px; line-height: 1.4; color: #1a1a1a; }
    .header-table { width: 100%; border-bottom: 2px solid #2B579A; padding-bottom: 8px; margin-bottom: 12px; }
    .title { font-size: 16px; font-weight: 800; color: #2B579A; text-transform: uppercase; }
    .subtitle { font-size: 10.5px; color: #555; }
    .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
    .meta-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .meta-item { flex: 1; min-width: 160px; }
    .meta-label { font-size: 9.5px; text-transform: uppercase; color: #64748B; font-weight: bold; }
    .meta-val { font-size: 12px; font-weight: bold; color: #0F172A; margin-top: 1px; }
    .drift-banner { display: flex; background: #EFF6FF; border: 1px solid #93C5FD; border-radius: 6px; padding: 10px; margin-bottom: 14px; text-align: center; }
    .drift-col { flex: 1; border-right: 1px solid #BFDBFE; padding: 4px; }
    .drift-col:last-child { border-right: none; }
    .drift-val { font-size: 16px; font-weight: 800; color: #1E40AF; }
    .drift-lbl { font-size: 9px; text-transform: uppercase; color: #475569; margin-top: 2px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
    table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; }
    table.data-table th { background: #f1f5f9; color: #1e293b; text-transform: uppercase; font-size: 10px; text-align: left; }
    .legal-clause { background: #F8FAFC; border-left: 3px solid #2B579A; padding: 8px; font-size: 10px; color: #334155; margin-bottom: 20px; line-height: 1.45; }
    .signatures-table { width: 100%; margin-top: 24px; page-break-inside: avoid; }
    .signatures-table td { width: 33.33%; text-align: center; vertical-align: bottom; padding: 0 10px; }
    .sig-line { border-bottom: 1px dotted #555; height: 35px; margin-bottom: 5px; }
    .sig-label { font-size: 9px; color: #555; text-transform: uppercase; }
  </style>
</head>
<body>

  <table class="header-table">
    <tr>
      <td>
        <div class="title">Polski Związek Hodowców Gołębi Pocztowych</div>
        <div class="subtitle">Oficjalny Protokół Rozliczenia i Korekty Chodu Zegara (art. 44 Regulaminu PZHGP)</div>
      </td>
      <td style="text-align: right;">
        <div style="font-size: 12px; font-weight: bold; color: #2B579A;">Nr: ${escapeHtml(data.protocolNumber)}</div>
        <div style="font-size: 10px; color: #666;">Data: ${escapeHtml(data.issueDate)}</div>
      </td>
    </tr>
  </table>

  <div class="meta-box">
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Hodowca</div>
        <div class="meta-val">${escapeHtml(session.breederName)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Jednostka PZHGP</div>
        <div class="meta-val">${escapeHtml(data.pzhgpBranch)} / ${escapeHtml(data.pzhgpSection)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Lot Konkursowy</div>
        <div class="meta-val">${escapeHtml(session.raceName)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Typ i Numer Zegara</div>
        <div class="meta-val">${escapeHtml(clockMeta.name)} (Nr ${escapeHtml(session.clockNumber)})</div>
      </div>
    </div>
  </div>

  <div class="drift-banner">
    <div class="drift-col">
      <div class="drift-val">${drift.sessionDurationHours} h</div>
      <div class="drift-lbl">Czas Pracy Zegara</div>
    </div>
    <div class="drift-col">
      <div class="drift-val" style="color: ${drift.isDisqualified ? '#E05656' : drift.totalDriftSeconds === 0 ? '#4CAF50' : '#1E40AF'};">
        ${drift.totalDriftSeconds > 0 ? `+${drift.totalDriftSeconds}` : drift.totalDriftSeconds} s
      </div>
      <div class="drift-lbl">Odchyłka Całkowita</div>
    </div>
    <div class="drift-col">
      <div class="drift-val">${Math.abs(drift.hourlyDriftSeconds).toFixed(2)} s/h</div>
      <div class="drift-lbl">Odchyłka na Godzinę (Max ${clockMeta.maxHourlyToleranceSec} s/h)</div>
    </div>
    <div class="drift-col">
      <div class="drift-val" style="color: ${drift.isDisqualified ? '#E05656' : '#2e7d32'};">
        ${drift.isDisqualified ? 'DYSKWALIFIKACJA' : 'ZGODNY (WAŻNY)'}
      </div>
      <div class="drift-lbl">Orzeczenie Sędziowskie</div>
    </div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30px; text-align: center;">Lp.</th>
        <th style="width: 140px;">Obrączka Rodowa</th>
        <th style="text-align: center; width: 110px;">Czas z Zegara</th>
        <th style="text-align: center; width: 110px;">Czas Skorygowany</th>
        <th style="text-align: center; width: 90px;">Korekta</th>
        <th style="text-align: right;">Prędkość Oficjalna</th>
      </tr>
    </thead>
    <tbody>
      ${arrivalRows.length > 0 ? arrivalRows : '<tr><td colspan="6" style="text-align: center; padding: 12px; color: #666;">Brak odnotowanych przylotów w protokole.</td></tr>'}
    </tbody>
  </table>

  <div class="legal-clause">
    <strong>Klauzula Prawna PZHGP (art. 44 Regulaminu):</strong><br/>
    Niniejszym Komisja Zegarowa stwierdza, że odczyty czasu nastawienia i otwarcia zegara zostały zweryfikowane
    z radiowym zegarem wzorcowym DCF-77 / sygnałem atomowym GPS. Zgodnie z regulaminem, w przypadku zegarów
    chodzących w granicach tolerancji, zastosowano matematyczną korektę proporcjonalną do czasu przelotu każdego gołębia.
    ${drift.isDisqualified ? `<br/><strong style="color: #E05656;">UWAGA: Zegar przekroczył limit tolerancji (${drift.disqualificationReason}).</strong>` : ''}
  </div>

  <table class="signatures-table">
    <tr>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Podpis Hodowcy</div>
      </td>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Przewodniczący Komisji Zegarowej</div>
      </td>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Członek Komisji Zegarowej</div>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
