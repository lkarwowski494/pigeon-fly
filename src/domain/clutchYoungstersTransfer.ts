/**
 * PIGEON-FLY — Clutch Youngsters Transfer & Parental Registry Engine (Z-089 / DEC-103)
 * Biological breeding lifecycle and automated transfer of weaned youngsters into racing team:
 * - Breeding milestones: Oviposition D1 & D2 (+44h) -> Incubation (18 days) -> Hatching.
 * - Banding window: 6th-8th day of life (FCI 8.0 mm seamless metal ring).
 * - Weaning date calculation: 21-25th day (optimal 24 days), shift from crop milk to grain.
 * - Automated profile creation: transfers weaned young bird into racing squad ('mlode')
 *   with full pedigree linkage (sire, dam, lineage, plumage phenotype).
 * - Printable A4 Clutch & Parental Registry Certificate HTML/PDF.
 */

import { Pigeon, Sex } from './types';

export interface ClutchYoungster {
  id: string;
  chickNumber: 1 | 2;
  hatchDate: string; // YYYY-MM-DD
  ringNumber: string; // np. "PL-0284-26-1401"
  chipBandSerial?: string; // np. "CHIP-99014"
  sex: Sex; // 'cock' | 'hen' | 'unknown'
  plumageColor: string; // np. "Niebieski nakrapiany"
  weaningDate: string; // YYYY-MM-DD
  targetLoftSection: string; // np. "Gołębnik Młodych (Sekcja 3)"
  transferredToRacingSquad: boolean;
  transferredAt?: string;
  notes?: string;
}

export interface ClutchTransferPair {
  clutchId: string;
  nestBox: string; // np. "Cela B-04"
  roundNumber: number; // 1, 2, 3
  // Sire & Dam
  sireRingNumber: string;
  sireStrain?: string; // np. "Janssen / Aarden"
  sireColor?: string;
  damRingNumber: string;
  damStrain?: string; // np. "Koopman / Gaby Vandenabeele"
  damColor?: string;
  // Dates
  pairingDate: string; // YYYY-MM-DD
  egg1LayDate: string;
  egg2LayDate: string;
  chicks: ClutchYoungster[];
  notes?: string;
}

/**
 * Calculates optimal weaning date (typically 24 days post-hatch).
 */
export function calculateWeaningDate(hatchDate: string, daysOffset = 24): string {
  const d = new Date(hatchDate);
  if (isNaN(d.getTime())) return hatchDate;
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates mandatory banding window (6th to 8th day post-hatch).
 */
export function calculateBandingWindow(hatchDate: string): {
  startDate: string;
  endDate: string;
  optimalDate: string;
} {
  const d = new Date(hatchDate);
  d.setHours(12, 0, 0, 0);

  const start = new Date(d);
  start.setDate(d.getDate() + 6);

  const opt = new Date(d);
  opt.setDate(d.getDate() + 7);

  const end = new Date(d);
  end.setDate(d.getDate() + 8);

  const fmt = (date: Date) => date.toISOString().split('T')[0];

  return {
    startDate: fmt(start),
    optimalDate: fmt(opt),
    endDate: fmt(end),
  };
}

/**
 * Validates whether a youngster is eligible for transfer to active racing squad.
 */
export function validateYoungsterTransfer(chick: ClutchYoungster): {
  canTransfer: boolean;
  reason?: string;
} {
  if (!chick.ringNumber || !chick.ringNumber.trim()) {
    return { canTransfer: false, reason: 'Brak numeru obrączki rodowej!' };
  }
  if (!chick.hatchDate) {
    return { canTransfer: false, reason: 'Brak zdefiniowanej daty wyklucia!' };
  }
  if (chick.transferredToRacingSquad) {
    return { canTransfer: false, reason: 'Młody został już wcześniej przeniesiony do stada!' };
  }
  return { canTransfer: true };
}

/**
 * Converts weaned youngsters from clutch into active racing pigeon profiles.
 */
export function transferYoungstersToRacingSquad(
  clutch: ClutchTransferPair,
  loftId = 'loft-default'
): {
  transferredPigeons: Partial<Pigeon>[];
  count: number;
  updatedClutch: ClutchTransferPair;
} {
  const transferredPigeons: Partial<Pigeon>[] = [];
  const updatedChicks = clutch.chicks.map((chick) => {
    const val = validateYoungsterTransfer(chick);
    if (!val.canTransfer) {
      return chick;
    }

    const seasonYear = new Date().getFullYear();
    const newPigeon: Partial<Pigeon> = {
      id: `pigeon-${Date.now()}-${chick.chickNumber}`,
      loftId,
      ringNumber: chick.ringNumber.trim(),
      countryCode: chick.ringNumber.startsWith('PL') ? 'PL' : 'DV',
      year: seasonYear,
      sex: chick.sex,
      plumageColor: chick.plumageColor || 'Niebieski',
      status: 'racing',
      fatherId: clutch.sireRingNumber,
      motherId: clutch.damRingNumber,
      auxiliaryRingNumber: chick.chipBandSerial,
    };

    transferredPigeons.push(newPigeon);

    return {
      ...chick,
      transferredToRacingSquad: true,
      transferredAt: new Date().toISOString(),
    };
  });

  return {
    transferredPigeons,
    count: transferredPigeons.length,
    updatedClutch: {
      ...clutch,
      chicks: updatedChicks,
    },
  };
}

/**
 * Generates official A4 Clutch & Parental Registry Certificate HTML.
 */
export function generateClutchRegistryHtml(
  clutch: ClutchTransferPair,
  meta?: {
    loftName?: string;
    breederName?: string;
    seasonYear?: number;
  }
): string {
  const loft = meta?.loftName || 'Gołębnik Mistrza Pigeon-Fly';
  const breeder = meta?.breederName || 'Hodowca PZHGP';
  const year = meta?.seasonYear || new Date().getFullYear();

  const chicksHtml = clutch.chicks
    .map(
      (c) => `
    <tr>
      <td style="text-align: center; font-weight: 700;">#${c.chickNumber}</td>
      <td style="font-family: monospace; font-weight: 800; font-size: 9pt; color: #0f172a;">${c.ringNumber}</td>
      <td style="text-align: center;">${c.hatchDate}</td>
      <td style="text-align: center;">${c.sex === 'cock' ? '1.0 Samiec' : c.sex === 'hen' ? '0.1 Samica' : 'Młody (b/p)'}</td>
      <td>${c.plumageColor}</td>
      <td style="text-align: center; font-weight: 700; color: #0284c7;">${c.weaningDate}</td>
      <td style="text-align: center; font-family: monospace; font-size: 8pt;">${c.chipBandSerial || '—'}</td>
      <td style="text-align: center; font-weight: 800; color: ${c.transferredToRacingSquad ? '#166534' : '#991b1b'};">
        ${c.transferredToRacingSquad ? 'W STADZIE LOTÓW' : 'W GNIEŹDZIE'}
      </td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Karta Lęgu i Rejestr Młodych — ${clutch.nestBox}</title>
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
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8pt; text-align: right; color: #334155; }

    .banner {
      background: #f8fafc;
      border: 1.5px solid #0284c7;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .banner-title { font-size: 11pt; font-weight: 900; color: #0284c7; }
    .banner-desc { font-size: 8pt; color: #475569; margin-top: 2px; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .card-title {
      font-size: 9pt;
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
      margin-top: 6px;
      margin-bottom: 12px;
      font-size: 8pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: left;
    }

    .notes-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #0284c7;
      padding: 6px 10px;
      margin-bottom: 12px;
      font-size: 8pt;
      color: #334155;
    }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 24px;
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
      margin-top: 16px;
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
      <div class="title">Kartoteka Rozpłodowa i Rejestr Lęgowy</div>
      <div class="subtitle">Ewidencja Rodzicielska i Transfer Młodych do Stada Lotowego (Z-089)</div>
    </div>
    <div class="meta">
      <div><strong>${loft}</strong></div>
      <div>Hodowca: <strong>${breeder}</strong></div>
      <div>Sezon Lęgowy: <strong>${year}</strong></div>
    </div>
  </div>

  <div class="banner">
    <div>
      <div class="banner-title">${clutch.nestBox} — Lęg Rundy ${clutch.roundNumber}</div>
      <div class="banner-desc">
        Data sparowania: <strong>${clutch.pairingDate}</strong> • Złożenie jaj: <strong>${clutch.egg1LayDate} / ${clutch.egg2LayDate}</strong>
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 8pt; color: #64748b;">Młode w lęgu:</span>
      <strong style="font-size: 11pt; color: #0f172a;"> ${clutch.chicks.length} szt.</strong>
    </div>
  </div>

  <div class="grid-2">
    <!-- Ojciec (Samiec) -->
    <div class="card">
      <div class="card-title">1.0 OJCIEC (SAMIEC ROZPŁODOWY)</div>
      <div class="row">
        <span class="label">Numer Obrączki:</span>
        <span class="val" style="font-family: monospace; color: #0284c7;">${clutch.sireRingNumber}</span>
      </div>
      <div class="row">
        <span class="label">Szczep / Linia:</span>
        <span class="val">${clutch.sireStrain || 'Rasa Czysta PZHGP'}</span>
      </div>
      <div class="row">
        <span class="label">Upierzenie:</span>
        <span class="val">${clutch.sireColor || 'Niebieski'}</span>
      </div>
    </div>

    <!-- Matka (Samica) -->
    <div class="card">
      <div class="card-title">0.1 MATKA (SAMICA ROZPŁODOWA)</div>
      <div class="row">
        <span class="label">Numer Obrączki:</span>
        <span class="val" style="font-family: monospace; color: #0284c7;">${clutch.damRingNumber}</span>
      </div>
      <div class="row">
        <span class="label">Szczep / Linia:</span>
        <span class="val">${clutch.damStrain || 'Rasa Czysta PZHGP'}</span>
      </div>
      <div class="row">
        <span class="label">Upierzenie:</span>
        <span class="val">${clutch.damColor || 'Ciemno-nakrapiana'}</span>
      </div>
    </div>
  </div>

  <div style="font-weight: 800; font-size: 9pt; margin-bottom: 2px;">
    EWIDENCJA ZAOBRĄCZKOWANYCH PISKLĄT I TRANSFER DO LOTNIKÓW:
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">Lp</th>
        <th>Obrączka Rodowa</th>
        <th style="text-align: center;">Wyklucie</th>
        <th style="text-align: center;">Płeć</th>
        <th>Barwa Upierzenia</th>
        <th style="text-align: center;">Odsadzenie</th>
        <th style="text-align: center;">Chip ESK</th>
        <th style="text-align: center;">Status Przeniesienia</th>
      </tr>
    </thead>
    <tbody>
      ${chicksHtml}
    </tbody>
  </table>

  ${
    clutch.notes
      ? `
  <div class="notes-box">
    <strong>Uwagi Hodowlane:</strong> ${clutch.notes}
  </div>
  `
      : ''
  }

  <div style="font-size: 7.5pt; color: #64748b; line-height: 1.35;">
    Zaobrączkowanie piskląt zostało wykonane w 6-8 dniu życia oficjalną obrączką rodową PZHGP (średnica 8.0 mm).
    Po ukończeniu 24 dnia życia młode podlegają odsadzeniu do sekcji gołębnika młodych i automatycznej rejestracji
    w stoisku lotowym jako aktywni zawodnicy sezonu lotów gołębi młodych.
  </div>

  <div class="signatures">
    <div class="sig-col">
      <div class="sig-title">Mistrz Hodowli / Właściciel</div>
      <div class="sig-name">${breeder}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Weryfikator Księgi Hodowlanej</div>
      <div class="sig-name">Podpis i pieczęć gołębnika</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Kartoteka Lęgowa i Rejestr Młodych Z-089</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
