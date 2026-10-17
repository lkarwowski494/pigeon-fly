/**
 * PIGEON-FLY — Generator Protokołu Wykreślenia i Ewidencji Zdarzeń Losowych (Z-068)
 * Standard PZHGP: Rejestr upadków, ataków drapieżników, zagubień w lotach i wykreśleń ze stada.
 * Gwarantuje integralność biologiczną i genealogiczną bazy danych (drzewa rodowodowe nie ulegają uszkodzeniu).
 */

export type DecommissionCause =
  | 'RAPTOR_ATTACK'
  | 'LOST_IN_RACE'
  | 'MORTALITY_ILLNESS'
  | 'MORTALITY_NATURAL'
  | 'TRANSFER_SALE'
  | 'OTHER';

export interface DecommissionCauseMeta {
  cause: DecommissionCause;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  description: string;
}

export const DECOMMISSION_CAUSES: Record<DecommissionCause, DecommissionCauseMeta> = {
  RAPTOR_ATTACK: {
    cause: 'RAPTOR_ATTACK',
    label: 'Atak drapieżnika (jastrząb / sokół / krogulec)',
    shortLabel: 'Drapieżnik',
    icon: '🦅',
    color: '#E05656',
    description: 'Ofiara ataku drapieżnika skrzydlatego lub ssaka (np. kuna, łasica)',
  },
  LOST_IN_RACE: {
    cause: 'LOST_IN_RACE',
    label: 'Zagubienie w locie konkursowym lub treningu',
    shortLabel: 'Zagubiony w locie',
    icon: '🧭',
    color: '#E5A93C',
    description: 'Ptak nie powrócił z lotu po zamknięciu konkursu lub z treningu kabinowego',
  },
  MORTALITY_ILLNESS: {
    cause: 'MORTALITY_ILLNESS',
    label: 'Upadek / choroba zakaźna / eutanazja weterynaryjna',
    shortLabel: 'Choroba / Eutanazja',
    icon: '⚕️',
    color: '#AF52DE',
    description: 'Padnięcie w wyniku schorzenia lub humanitarna eutanazja lekarsko-weterynaryjna',
  },
  MORTALITY_NATURAL: {
    cause: 'MORTALITY_NATURAL',
    label: 'Upadek naturalny / wiek / uraz mechaniczny',
    shortLabel: 'Naturalny / Wiek',
    icon: '🕊️',
    color: '#8E8E93',
    description: 'Zgon ze starości, niewydolności krążenia lub po urazie mechanicznym w gołębniku',
  },
  TRANSFER_SALE: {
    cause: 'TRANSFER_SALE',
    label: 'Zbycie / darowizna / wywóz do innej hodowli',
    shortLabel: 'Zbycie / Sprzedaż',
    icon: '🤝',
    color: '#34C759',
    description: 'Oficjalny transfer własności wraz z kartą tożsamości do innego hodowcy',
  },
  OTHER: {
    cause: 'OTHER',
    label: 'Inne zdarzenie losowe',
    shortLabel: 'Inne zdarzenie',
    icon: '⚠️',
    color: '#FF9500',
    description: 'Nietypowe zdarzenie losowe udokumentowane oświadczeniem hodowcy',
  },
};

export interface DecommissionRecord {
  id: string;
  pigeonId: string;
  ringNumber: string;
  sex: 'cock' | 'hen';
  year: number;
  color: string;
  lineage?: string;
  cause: DecommissionCause;
  eventDate: string; // YYYY-MM-DD
  locationOrRace?: string; // np. "Gołębnik macierzysty" lub "Lot nr 3 - Minden"
  witnessOrConfirmation?: string; // np. "Odnaleziona obrączka", "Protokół sekcyjny"
  notes?: string;
}

export interface FlockDecommissionStats {
  totalRegistered: number;
  totalDecommissioned: number;
  activeFlockSize: number;
  lossRatePercentage: number;
  byCause: Record<DecommissionCause, number>;
  causePercentages: Record<DecommissionCause, number>;
  mostFrequentCause: DecommissionCause | null;
}

export interface DecommissionProtocolData {
  protocolNumber: string;
  issueDate: string; // YYYY-MM-DD
  seasonYear: number;
  breederName: string;
  pzhgpBranch: string;
  pzhgpSection: string;
  loftCoordinates?: string;
  totalRegisteredFlock: number;
  records: DecommissionRecord[];
  notes?: string;
}

/**
 * Oblicza statystyki wykreśleń i wskaźniki ubytków stada
 */
export function calculateDecommissionStats(
  records: DecommissionRecord[],
  totalRegistered: number
): FlockDecommissionStats {
  const initialByCause: Record<DecommissionCause, number> = {
    RAPTOR_ATTACK: 0,
    LOST_IN_RACE: 0,
    MORTALITY_ILLNESS: 0,
    MORTALITY_NATURAL: 0,
    TRANSFER_SALE: 0,
    OTHER: 0,
  };

  const byCause = records.reduce((acc, rec) => {
    acc[rec.cause] = (acc[rec.cause] || 0) + 1;
    return acc;
  }, { ...initialByCause });

  const totalDecommissioned = records.length;
  const activeFlockSize = Math.max(0, totalRegistered - totalDecommissioned);
  const lossRatePercentage = totalRegistered > 0
    ? Number(((totalDecommissioned / totalRegistered) * 100).toFixed(1))
    : 0;

  const causePercentages: Record<DecommissionCause, number> = {
    RAPTOR_ATTACK: 0,
    LOST_IN_RACE: 0,
    MORTALITY_ILLNESS: 0,
    MORTALITY_NATURAL: 0,
    TRANSFER_SALE: 0,
    OTHER: 0,
  };

  let maxCount = 0;
  let mostFrequent: DecommissionCause | null = null;

  for (const [causeKey, count] of Object.entries(byCause) as [DecommissionCause, number][]) {
    causePercentages[causeKey] = totalDecommissioned > 0
      ? Number(((count / totalDecommissioned) * 100).toFixed(1))
      : 0;
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = causeKey;
    }
  }

  return {
    totalRegistered,
    totalDecommissioned,
    activeFlockSize,
    lossRatePercentage,
    byCause,
    causePercentages,
    mostFrequentCause: mostFrequent,
  };
}

/**
 * Generuje urzędowy dokument A4 Protokołu Wykreślenia i Rejestru Zdarzeń Losowych dla PZHGP
 */
export function generateDecommissionProtocolHtml(data: DecommissionProtocolData): string {
  const stats = calculateDecommissionStats(data.records, data.totalRegisteredFlock);

  const rowsHtml = data.records.map((r, index) => {
    const meta = DECOMMISSION_CAUSES[r.cause] || DECOMMISSION_CAUSES.OTHER;
    const sexSymbol = r.sex === 'cock' ? '♂ Samiec' : '♀ Samica';
    return `
      <tr>
        <td style="text-align: center; font-weight: bold;">${index + 1}</td>
        <td style="font-weight: bold; font-family: monospace; font-size: 13px;">${escapeHtml(r.ringNumber)}</td>
        <td>${sexSymbol} / ${r.year}</td>
        <td>${escapeHtml(r.color)}</td>
        <td style="text-align: center;">${escapeHtml(r.eventDate)}</td>
        <td>
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${meta.color}22; color: ${meta.color}; border: 1px solid ${meta.color};">
            ${meta.icon} ${meta.shortLabel}
          </span>
        </td>
        <td style="font-size: 11px; color: #444;">
          ${escapeHtml(r.locationOrRace || '—')}
          ${r.witnessOrConfirmation ? `<br/><i style="color: #666;">Potw: ${escapeHtml(r.witnessOrConfirmation)}</i>` : ''}
          ${r.notes ? `<br/><span style="color: #888;">${escapeHtml(r.notes)}</span>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  const causesBreakdownHtml = (Object.keys(stats.byCause) as DecommissionCause[])
    .filter((k) => stats.byCause[k] > 0)
    .map((k) => {
      const meta = DECOMMISSION_CAUSES[k];
      const count = stats.byCause[k];
      const pct = stats.causePercentages[k];
      return `
        <div style="flex: 1; min-width: 130px; margin: 4px; padding: 8px; border-radius: 6px; background: #f9f9f9; border-left: 4px solid ${meta.color}; font-size: 11px;">
          <div style="font-weight: bold; color: #222;">${meta.icon} ${meta.shortLabel}</div>
          <div style="font-size: 14px; font-weight: bold; color: ${meta.color}; margin-top: 2px;">
            ${count} szt. <span style="font-size: 11px; font-weight: normal; color: #666;">(${pct}%)</span>
          </div>
        </div>
      `;
    }).join('');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Protokół Wykreślenia i Rejestr Zdarzeń Losowych — ${escapeHtml(data.protocolNumber)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #2B579A;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: middle;
    }
    .org-title {
      font-size: 14px;
      font-weight: bold;
      color: #2B579A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title {
      font-size: 18px;
      font-weight: 800;
      color: #111;
      margin: 4px 0;
      text-transform: uppercase;
    }
    .doc-subtitle {
      font-size: 11px;
      color: #555;
    }
    .meta-card {
      background: #f4f7fa;
      border: 1px solid #d0dbe5;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }
    .meta-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .meta-item {
      flex: 1;
      min-width: 180px;
    }
    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      font-weight: bold;
    }
    .meta-value {
      font-size: 12px;
      font-weight: bold;
      color: #111;
      margin-top: 1px;
    }
    .stats-card {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
      background: #fafafa;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    .stat-box {
      flex: 1;
      padding: 6px;
      border-right: 1px solid #e1e4e8;
    }
    .stat-box:last-child {
      border-right: none;
    }
    .stat-box-val {
      font-size: 18px;
      font-weight: 800;
      color: #2B579A;
    }
    .stat-box-lbl {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      margin-top: 2px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-size: 11px;
      text-transform: uppercase;
      text-align: left;
    }
    .declaration-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #2B579A;
      padding: 8px 12px;
      font-size: 10.5px;
      color: #334155;
      margin-bottom: 20px;
      line-height: 1.45;
    }
    .signatures-table {
      width: 100%;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .signatures-table td {
      width: 33.33%;
      text-align: center;
      vertical-align: bottom;
      padding: 0 10px;
    }
    .sig-line {
      border-bottom: 1px dotted #555;
      height: 35px;
      margin-bottom: 5px;
    }
    .sig-label {
      font-size: 10px;
      color: #555;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 20px;
      font-size: 9px;
      color: #777;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <table class="header-table">
    <tr>
      <td>
        <div class="org-title">Polski Związek Hodowców Gołębi Pocztowych</div>
        <div class="doc-title">Protokół Wykreślenia i Rejestr Zdarzeń Losowych</div>
        <div class="doc-subtitle">Ewidencja upadków, ofiar drapieżników i ubytków stada lotowego / rozrodczego (Sezon ${data.seasonYear})</div>
      </td>
      <td style="text-align: right;">
        <div style="font-size: 13px; font-weight: bold; color: #2B579A;">Nr: ${escapeHtml(data.protocolNumber)}</div>
        <div style="font-size: 11px; color: #666;">Data: ${escapeHtml(data.issueDate)}</div>
      </td>
    </tr>
  </table>

  <div class="meta-card">
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Hodowca / Właściciel</div>
        <div class="meta-value">${escapeHtml(data.breederName)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Jednostka PZHGP</div>
        <div class="meta-value">${escapeHtml(data.pzhgpBranch)} / ${escapeHtml(data.pzhgpSection)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Koordynaty Gołębnika (WGS-84)</div>
        <div class="meta-value">${escapeHtml(data.loftCoordinates || 'Nie podano')}</div>
      </div>
    </div>
  </div>

  <div class="stats-card">
    <div class="stat-box">
      <div class="stat-box-val">${stats.totalRegistered}</div>
      <div class="stat-box-lbl">Stan Początkowy Stada</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color: #E05656;">-${stats.totalDecommissioned}</div>
      <div class="stat-box-lbl">Wykreślone / Ubytki</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color: #2e7d32;">${stats.activeFlockSize}</div>
      <div class="stat-box-lbl">Aktualny Stan Aktywny</div>
    </div>
    <div class="stat-box">
      <div class="stat-box-val" style="color: ${stats.lossRatePercentage > 25 ? '#E05656' : '#2B579A'};">${stats.lossRatePercentage}%</div>
      <div class="stat-box-lbl">Wskaźnik Ubytków</div>
    </div>
  </div>

  ${stats.totalDecommissioned > 0 ? `
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
        Struktura Przyczyn Zdarzeń Losowych
      </div>
      <div style="display: flex; flex-wrap: wrap;">
        ${causesBreakdownHtml}
      </div>
    </div>
  ` : ''}

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30px; text-align: center;">Lp.</th>
        <th style="width: 140px;">Nr Obrączki Rodowej</th>
        <th style="width: 100px;">Płeć / Rocznik</th>
        <th style="width: 90px;">Barwa</th>
        <th style="width: 85px; text-align: center;">Data Zdarzenia</th>
        <th style="width: 120px;">Przyczyna</th>
        <th>Okoliczności / Potwierdzenie</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml.length > 0 ? rowsHtml : `<tr><td colspan="7" style="text-align: center; color: #777; padding: 16px;">Brak wykreślonych gołębi w wybranym okresie.</td></tr>`}
    </tbody>
  </table>

  <div class="declaration-box">
    <strong>Gwarancja Integralności Bazy Danych i Drzew Rodowodowych:</strong><br/>
    Niniejszy protokół stanowi oficjalną podstawę wykreślenia w/w gołębi z aktywnego stanu lotowego/rozpłodowego.
    Zgodnie ze standardem aplikacji PIGEON-FLY, dane rodowodowe i genetyczne wykreślonych osobników pozostają trwale
    zabezpieczone w cyfrowej księdze rodowodowej, co gwarantuje pełną ciągłość generacyjną ich potomstwa i przodków.
    Hodowca oświadcza pod rygorem odpowiedzialności dyscyplinarnej PZHGP, że podane przyczyny i okoliczności są zgodne z prawdą.
  </div>

  <table class="signatures-table">
    <tr>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Podpis Hodowcy</div>
      </td>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Przewodniczący Komisji Lotowej Sekcji</div>
      </td>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Członek Zarządu Oddziału PZHGP</div>
      </td>
    </tr>
  </table>

  <div class="footer">
    <span>PIGEON-FLY System v1.0 — Moduł Ewidencji Stada i Zdarzeń Losowych (Z-068)</span>
    <span>Wygenerowano: ${new Date().toLocaleString('pl-PL')}</span>
  </div>

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
