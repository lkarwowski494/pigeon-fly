/**
 * PIGEON-FLY — Generator Protokołu Weryfikacji i Plombowania Klatek Transportowych (Z-072)
 * Standard PZHGP i FCI: Nadzór Komisji Koszowej, rejestr plomb kabiny transportowej,
 * weryfikacja zoohigieniczna poideł i wentylacji oraz oświadczenie konwojenta.
 */

export type SealPosition =
  | 'LEFT_SIDE_CURTAIN'
  | 'RIGHT_SIDE_CURTAIN'
  | 'REAR_INSPECTION_DOOR'
  | 'RELEASE_MECHANISM_LOCK'
  | 'WATER_TANK_VALVE'
  | 'ROOF_HATCH';

export interface SealPositionMeta {
  position: SealPosition;
  label: string;
  shortLabel: string;
  icon: string;
  recommendedCount: number;
}

export const SEAL_POSITIONS: Record<SealPosition, SealPositionMeta> = {
  LEFT_SIDE_CURTAIN: {
    position: 'LEFT_SIDE_CURTAIN',
    label: 'Burtowa Żaluzja / Drzwi Lewej Strony Kabiny',
    shortLabel: 'Burta Lewa',
    icon: '⬅️',
    recommendedCount: 2,
  },
  RIGHT_SIDE_CURTAIN: {
    position: 'RIGHT_SIDE_CURTAIN',
    label: 'Burtowa Żaluzja / Drzwi Prawej Strony Kabiny',
    shortLabel: 'Burta Prawa',
    icon: '➡️',
    recommendedCount: 2,
  },
  REAR_INSPECTION_DOOR: {
    position: 'REAR_INSPECTION_DOOR',
    label: 'Tylne Drzwi Rewizyjne / Korytarz Obsługowy',
    shortLabel: 'Drzwi Tylne',
    icon: '🚪',
    recommendedCount: 1,
  },
  RELEASE_MECHANISM_LOCK: {
    position: 'RELEASE_MECHANISM_LOCK',
    label: 'Rygiel Głównego Mechanizmu Spustowego Burt',
    shortLabel: 'Automat Spustowy',
    icon: '🔒',
    recommendedCount: 1,
  },
  WATER_TANK_VALVE: {
    position: 'WATER_TANK_VALVE',
    label: 'Zawór Spustowy Zbiornika Czystej Wody',
    shortLabel: 'Zawór Wody',
    icon: '💧',
    recommendedCount: 1,
  },
  ROOF_HATCH: {
    position: 'ROOF_HATCH',
    label: 'Właz Dachowy / Klapy Wentylacji Awaryjnej',
    shortLabel: 'Właz Dachowy',
    icon: '🔝',
    recommendedCount: 1,
  },
};

export interface SealItem {
  id: string;
  position: SealPosition;
  sealCode: string; // np. "PL-0284-SEAL-8891"
  isVerifiedIntact: boolean;
  notes?: string;
}

export interface CabinWelfareChecklist {
  floorGratesAndBeddingOk: boolean;
  wateringSystemFunctioning: boolean;
  freshWaterLoadedLiters: number;
  ventilationFansOperational: boolean;
  temperatureSensorsOperational: boolean;
  densityNormsCompliant: boolean;
  totalBasketsCount: number;
  totalPigeonsCount: number;
  avgPigeonsPerBasket: number;
}

export interface CabinSealingProtocolData {
  protocolNumber: string;
  issueDate: string; // YYYY-MM-DD
  departureTimeIso: string;
  pzhgpBranch: string;
  pzhgpSection: string;
  raceName: string;
  releasePlace: string;
  vehicleRegistrationPlate: string; // np. "PGS 44102"
  cabinModel: string; // np. "Geraldy 3000 / Hermans"
  convoyLeaderName: string;
  convoyLeaderPhone: string;
  driverName: string;
  commissionChairmanName: string;
  commissionMemberName: string;
  seals: SealItem[];
  welfare: CabinWelfareChecklist;
  routeNotes?: string;
}

export interface SealingReadinessResult {
  isReadyForDeparture: boolean;
  totalSealsCount: number;
  missingSealsCount: number;
  checklistIssues: string[];
  readinessScorePct: number;
}

/**
 * Oblicza gotowość transportu do odjazdu na punkt wypuszczenia
 */
export function calculateSealingReadiness(protocol: CabinSealingProtocolData): SealingReadinessResult {
  const issues: string[] = [];
  let score = 100;

  // 1. Plomby
  const totalSealsCount = protocol.seals.length;
  const verifiedIntactCount = protocol.seals.filter((s) => s.isVerifiedIntact && s.sealCode.trim()).length;
  const missingSealsCount = totalSealsCount - verifiedIntactCount;

  if (totalSealsCount < 4) {
    issues.push(`Wymagane zaplombowanie minimum 4 newralgicznych stref kabiny (obecnie: ${totalSealsCount}).`);
    score -= 25;
  }
  if (missingSealsCount > 0) {
    issues.push(`${missingSealsCount} plomb nie zostało zweryfikowanych jako nienaruszone lub brak numeru.`);
    score -= 20;
  }

  // 2. Dobrostan kabiny
  if (!protocol.welfare.floorGratesAndBeddingOk) {
    issues.push('Zastrzeżenia do stanu higienicznego rusztów lub ściółki w koszach.');
    score -= 15;
  }
  if (!protocol.welfare.wateringSystemFunctioning) {
    issues.push('Niesprawny system pojenia lub brak dostępu ptaków do rynien z wodą.');
    score -= 25;
  }
  if (protocol.welfare.freshWaterLoadedLiters < 100) {
    issues.push(`Niewystarczająca rezerwa wody pitnej w zbiorniku (${protocol.welfare.freshWaterLoadedLiters} l < 100 l).`);
    score -= 15;
  }
  if (!protocol.welfare.ventilationFansOperational) {
    issues.push('Awaria wentylatorów mechanicznych kabiny transportowej.');
    score -= 25;
  }
  if (!protocol.welfare.densityNormsCompliant) {
    issues.push(`Przekroczono normę zagęszczenia koszy (${protocol.welfare.avgPigeonsPerBasket} ptaków/kosz).`);
    score -= 20;
  }

  const isReadyForDeparture = score >= 80 && issues.length === 0;

  return {
    isReadyForDeparture,
    totalSealsCount,
    missingSealsCount,
    checklistIssues: issues,
    readinessScorePct: Math.max(0, score),
  };
}

/**
 * Generuje urzędowy dokument A4 Protokołu Plombowania Kabiny PZHGP
 */
export function generateCabinSealingProtocolHtml(data: CabinSealingProtocolData): string {
  const readiness = calculateSealingReadiness(data);

  const sealRows = data.seals.map((s, idx) => {
    const meta = SEAL_POSITIONS[s.position] || SEAL_POSITIONS.LEFT_SIDE_CURTAIN;
    return `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td><strong>${meta.icon} ${meta.label}</strong></td>
        <td style="font-family: monospace; font-size: 13px; font-weight: bold; color: #2B579A;">${escapeHtml(s.sealCode)}</td>
        <td style="text-align: center;">
          <span style="font-weight: bold; color: ${s.isVerifiedIntact ? '#2e7d32' : '#E05656'};">
            ${s.isVerifiedIntact ? '✓ ZAPLOMBOWANA' : '✗ BRAK / USZKODZONA'}
          </span>
        </td>
        <td style="font-size: 10px; color: #555;">${escapeHtml(s.notes || '—')}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Protokół Plombowania Kabiny — ${escapeHtml(data.protocolNumber)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 12mm; }
    body { font-family: Arial, sans-serif; font-size: 11.5px; line-height: 1.4; color: #1a1a1a; margin: 0; }
    .header-table { width: 100%; border-bottom: 2px solid #2B579A; padding-bottom: 8px; margin-bottom: 12px; }
    .title { font-size: 15px; font-weight: 800; color: #2B579A; text-transform: uppercase; }
    .subtitle { font-size: 10.5px; color: #555; }
    .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
    .meta-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .meta-item { flex: 1; min-width: 160px; }
    .meta-label { font-size: 9px; text-transform: uppercase; color: #64748B; font-weight: bold; }
    .meta-val { font-size: 12px; font-weight: bold; color: #0F172A; margin-top: 1px; }
    .welfare-banner { display: flex; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 14px; text-align: center; }
    .welfare-col { flex: 1; border-right: 1px solid #e2e8f0; padding: 4px; }
    .welfare-col:last-child { border-right: none; }
    .welfare-val { font-size: 15px; font-weight: 800; color: #2B579A; }
    .welfare-lbl { font-size: 9px; text-transform: uppercase; color: #64748B; margin-top: 2px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
    table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; }
    table.data-table th { background: #f1f5f9; color: #1e293b; text-transform: uppercase; font-size: 9.5px; text-align: left; }
    .checklist-card { background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px; margin-bottom: 14px; font-size: 10.5px; }
    .legal-clause { background: #F0FDF4; border-left: 3px solid #16A34A; padding: 8px; font-size: 10px; color: #166534; margin-bottom: 16px; border-radius: 4px; }
    .signatures-table { width: 100%; margin-top: 20px; page-break-inside: avoid; }
    .signatures-table td { width: 25%; text-align: center; vertical-align: bottom; padding: 0 6px; }
    .sig-line { border-bottom: 1px dotted #555; height: 35px; margin-bottom: 4px; }
    .sig-label { font-size: 8.5px; color: #555; text-transform: uppercase; }
  </style>
</head>
<body>

  <table class="header-table">
    <tr>
      <td>
        <div class="title">Polski Związek Hodowców Gołębi Pocztowych</div>
        <div class="subtitle">Urzędowy Protokół Plombowania i Stanu Technicznego Kabiny Transportowej</div>
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
        <div class="meta-label">Jednostka PZHGP</div>
        <div class="meta-val">${escapeHtml(data.pzhgpBranch)} (${escapeHtml(data.pzhgpSection)})</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Lot Konkursowy / Cel</div>
        <div class="meta-val">${escapeHtml(data.raceName)} — ${escapeHtml(data.releasePlace)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Pojazd / Kabina</div>
        <div class="meta-val">${escapeHtml(data.vehicleRegistrationPlate)} (${escapeHtml(data.cabinModel)})</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Obsada Konwoju</div>
        <div class="meta-val">Konwojent: ${escapeHtml(data.convoyLeaderName)} • Kierowca: ${escapeHtml(data.driverName)}</div>
      </div>
    </div>
  </div>

  <div class="welfare-banner">
    <div class="welfare-col">
      <div class="welfare-val">${data.welfare.totalPigeonsCount}</div>
      <div class="welfare-lbl">Ptaków w Kabinie</div>
    </div>
    <div class="welfare-col">
      <div class="welfare-val">${data.welfare.totalBasketsCount}</div>
      <div class="welfare-lbl">Klatek / Koszy</div>
    </div>
    <div class="welfare-col">
      <div class="welfare-val">${data.welfare.avgPigeonsPerBasket} szt.</div>
      <div class="welfare-lbl">Średnio w Koszu</div>
    </div>
    <div class="welfare-col">
      <div class="welfare-val">${data.welfare.freshWaterLoadedLiters} l</div>
      <div class="welfare-lbl">Zapas Czystej Wody</div>
    </div>
    <div class="welfare-col">
      <div class="welfare-val" style="color: ${readiness.isReadyForDeparture ? '#2e7d32' : '#E05656'};">
        ${readiness.isReadyForDeparture ? 'ZATWIERDZONY' : 'ZASTRZEŻENIA'}
      </div>
      <div class="welfare-lbl">Status Wyjazdu</div>
    </div>
  </div>

  <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; margin-bottom: 6px; color: #1E293B;">
    Rejestr Urzędowych Plomb Zabezpieczających (${data.seals.length} szt.):
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 28px; text-align: center;">Lp.</th>
        <th style="width: 170px;">Miejsce Plombowania</th>
        <th style="width: 140px;">Numer Unikalny Plomby</th>
        <th style="width: 110px; text-align: center;">Stan Plomby</th>
        <th>Uwagi / Uwzględnione Rewizje</th>
      </tr>
    </thead>
    <tbody>
      ${sealRows.length > 0 ? sealRows : '<tr><td colspan="5" style="text-align: center; padding: 10px;">Brak zarejestrowanych plomb.</td></tr>'}
    </tbody>
  </table>

  <div class="checklist-card">
    <div style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase; color: #334155;">
      Weryfikacja Dobrostanu i Zoohigieny Transportowej:
    </div>
    <div>• Czystość podłóg i rusztów w klatkach: <strong>${data.welfare.floorGratesAndBeddingOk ? '✓ Pozytywna' : '✗ Zastrzeżenia'}</strong></div>
    <div>• Sprawność poideł kropelkowych / rynien: <strong>${data.welfare.wateringSystemFunctioning ? '✓ Sprawne' : '✗ Niesprawne'}</strong></div>
    <div>• Wymuszona wentylacja mechaniczna: <strong>${data.welfare.ventilationFansOperational ? '✓ Sprawna (wszystkie sekcje)' : '✗ Awaria wentylatorów'}</strong></div>
    <div>• Zgodność norm zagęszczenia FCI/PZHGP: <strong>${data.welfare.densityNormsCompliant ? '✓ W normie' : '✗ Przepełnienie koszy'}</strong></div>
  </div>

  <div class="legal-clause">
    <strong>Oświadczenie Komisji i Konwoju:</strong><br/>
    Niniejszym Komisja Wkładaniowa potwierdza, że kabina transportowa została protokolarnie sprawdzona pod kątem
    dobrostanu ptaków i zabezpieczona powyższymi plombami. Konwojent i kierowca zobowiązują się do transportu stada
    zgodnie z przepisami PZHGP oraz do nienaruszania plomb aż do momentu otwarcia burt na punkcie wypuszczenia.
  </div>

  <table class="signatures-table">
    <tr>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Przewodniczący Komisji Koszowej</div>
      </td>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Członek Komisji Koszowej</div>
      </td>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Główny Konwojent Lotu</div>
      </td>
      <td>
        <div class="sig-line"></div>
        <div class="sig-label">Kierowca Kabiny</div>
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
