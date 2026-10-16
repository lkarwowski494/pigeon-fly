/**
 * PIGEON-FLY — Pedigree PDF Generator (Rodowód 4-pokoleniowy A4)
 * Generates print-ready HTML for expo-print with anti-counterfeit verification QR code.
 */

import { Pigeon, PedigreeNode } from './types';
import { getPedigreeVerificationUrl } from './qr';
import QRCode from 'qrcode';

export interface PedigreePdfOptions {
  loftName: string;
  breederName: string;
  breederPhone?: string;
  inbreedingF?: number;
}

export function generatePedigreeHtml(
  root: PedigreeNode,
  options: PedigreePdfOptions
): string {
  const pigeon = root.pigeon;
  const verifyUrl = getPedigreeVerificationUrl(pigeon.qrCodeUuid);
  const inbreedingPct = options.inbreedingF !== undefined ? (options.inbreedingF * 100).toFixed(2) : '0.00';

  const renderPigeonBox = (node?: PedigreeNode | null, label = '') => {
    if (!node) {
      return `
        <div class="pigeon-box empty-box">
          <div class="box-label">${label}</div>
          <div class="box-empty-text">Brak danych w rodowodzie</div>
        </div>
      `;
    }

    const p = node.pigeon;
    const sexIcon = p.sex === 'cock' ? '♂ Samiec' : p.sex === 'hen' ? '♀ Samica' : 'Nieznana';
    const notesHtml = p.notes ? `<div class="box-notes">${p.notes}</div>` : '';

    return `
      <div class="pigeon-box ${p.sex}">
        <div class="box-label">${label} — ${sexIcon}</div>
        <div class="box-ring">${p.countryCode}-${p.ringNumber}</div>
        <div class="box-meta">Rocznik: ${p.year} • Barwa: ${p.plumageColor}</div>
        ${notesHtml}
      </div>
    `;
  };

  // Generation 1: Parents
  const sire = root.father;
  const dam = root.mother;

  // Generation 2: Grandparents
  const sireFather = sire?.father;
  const sireMother = sire?.mother;
  const damFather = dam?.father;
  const damMother = dam?.mother;

  // Generation 3: Great-Grandparents
  const sfF = sireFather?.father;
  const sfM = sireFather?.mother;
  const smF = sireMother?.father;
  const smM = sireMother?.mother;
  const dfF = damFather?.father;
  const dfM = damFather?.mother;
  const dmM = damMother?.mother;
  const dmF = damMother?.father;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rodowód — ${pigeon.countryCode}-${pigeon.ringNumber}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #121417;
      background: #FFFFFF;
      font-size: 11px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #121417;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .loft-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .breeder-meta {
      font-size: 12px;
      color: #4A505E;
      margin-top: 2px;
    }
    .qr-verify-box {
      text-align: right;
    }
    .verify-url {
      font-size: 9px;
      color: #6A7180;
      font-family: monospace;
    }
    .main-bird-card {
      background: #F4F6F9;
      border: 2px solid #2B303C;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .main-ring {
      font-size: 22px;
      font-weight: 900;
      font-family: monospace;
    }
    .main-meta {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-top: 2px;
    }
    .inbreeding-badge {
      background: #EBF3FF;
      border: 1px solid #90CAF9;
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 700;
      color: #1565C0;
    }

    /* Pedigree Grid */
    .tree-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
      height: 480px;
    }
    .col-parents, .col-grandparents, .col-great-grandparents {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .pigeon-box {
      background: #FFFFFF;
      border: 1px solid #CBD2DF;
      border-radius: 4px;
      padding: 6px 8px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .cock {
      border-left: 4px solid #1976D2;
    }
    .hen {
      border-left: 4px solid #E91E63;
    }
    .box-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #717B8C;
      margin-bottom: 2px;
    }
    .box-ring {
      font-size: 13px;
      font-weight: 800;
      font-family: monospace;
      color: #121417;
    }
    .box-meta {
      font-size: 10px;
      color: #555C6A;
      margin-top: 1px;
    }
    .box-notes {
      font-size: 9px;
      color: #717B8C;
      margin-top: 2px;
      font-style: italic;
    }
    .empty-box {
      background: #FAFBFD;
      border-style: dashed;
      color: #A0A6B2;
      align-items: center;
      justify-content: center;
    }
    .box-empty-text {
      font-size: 10px;
      color: #A0A6B2;
    }

    .footer {
      border-top: 1px solid #CBD2DF;
      margin-top: 8px;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #717B8C;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="loft-title">${options.loftName}</div>
      <div class="breeder-meta">Hodowca: ${options.breederName} ${options.breederPhone ? `• Tel: ${options.breederPhone}` : ''}</div>
    </div>
    <div class="qr-verify-box">
      <div style="font-weight: 800; font-size: 11px;">Certyfikat Autentyczności</div>
      <div class="verify-url">${verifyUrl}</div>
    </div>
  </div>

  <div class="main-bird-card">
    <div>
      <div class="main-ring">${pigeon.countryCode}-${pigeon.ringNumber}</div>
      <div class="main-meta">Płeć: ${pigeon.sex === 'cock' ? 'Samiec ♂' : 'Samica ♀'} • Rocznik: ${pigeon.year} • Barwa: ${pigeon.plumageColor}</div>
    </div>
    <div class="inbreeding-badge">
      Inbred (F): ${inbreedingPct}%
    </div>
  </div>

  <div class="tree-grid">
    <!-- Generation 1: Parents -->
    <div class="col-parents">
      ${renderPigeonBox(sire, 'Ojciec')}
      ${renderPigeonBox(dam, 'Matka')}
    </div>

    <!-- Generation 2: Grandparents -->
    <div class="col-grandparents">
      ${renderPigeonBox(sireFather, 'Dziadek (O)')}
      ${renderPigeonBox(sireMother, 'Babka (O)')}
      ${renderPigeonBox(damFather, 'Dziadek (M)')}
      ${renderPigeonBox(damMother, 'Babka (M)')}
    </div>

    <!-- Generation 3: Great-Grandparents -->
    <div class="col-great-grandparents">
      ${renderPigeonBox(sfF, 'Pradziadek')}
      ${renderPigeonBox(sfM, 'Prababka')}
      ${renderPigeonBox(smF, 'Pradziadek')}
      ${renderPigeonBox(smM, 'Prababka')}
      ${renderPigeonBox(dfF, 'Pradziadek')}
      ${renderPigeonBox(dfM, 'Prababka')}
      ${renderPigeonBox(dmF, 'Pradziadek')}
      ${renderPigeonBox(dmM, 'Prababka')}
    </div>
  </div>

  <div class="footer">
    <div>Wygenerowano w aplikacji Pigeon-Fly — Cyfrowy Notes Mistrza (Offline-First)</div>
    <div>Weryfikacja online: ${verifyUrl}</div>
  </div>
</body>
</html>
  `.trim();
}

export interface BasketPigeonItem {
  index: number;
  ringNumber: string;
  color: string;
  sex: string;
  isTip?: boolean; // typowany do serii np. 5/50
  auxiliaryRing?: string;
}

export interface BasketingListPdfOptions {
  loftName: string;
  breederName: string;
  clubBranch: string;
  raceName: string;
  releaseLocation: string;
  basketingDate: string;
  pigeons: BasketPigeonItem[];
}

export function generateRaceBasketingListHtml(options: BasketingListPdfOptions): string {
  const rows = options.pigeons
    .map(
      (p) => `
    <tr>
      <td style="text-align: center; font-weight: bold;">${p.index}</td>
      <td style="font-family: monospace; font-size: 13px; font-weight: bold;">${p.ringNumber}</td>
      <td>${p.color}</td>
      <td style="text-align: center;">${p.sex === 'cock' ? '1.0 ♂' : '0.1 ♀'}</td>
      <td style="text-align: center; font-family: monospace;">${p.auxiliaryRing || '—'}</td>
      <td style="text-align: center; font-weight: bold; color: ${p.isTip ? '#B45309' : '#94A3B8'};">
        ${p.isTip ? '★ SERIA (T)' : '—'}
      </td>
      <td style="border-bottom: 1px dotted #CBD5E1; min-width: 60px;"></td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lista Wkładaniowa — ${options.raceName}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, sans-serif; color: #0F172A; font-size: 11px; margin: 0; }
    .header { border-bottom: 2px solid #0F172A; padding-bottom: 8px; margin-bottom: 12px; }
    .title { font-size: 18px; font-weight: 900; text-transform: uppercase; }
    .meta-row { display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #F1F5F9; border: 1px solid #CBD5E1; padding: 6px; font-size: 11px; text-transform: uppercase; }
    td { border: 1px solid #E2E8F0; padding: 5px 6px; }
    .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; }
    .sign-box { border-top: 1px solid #0F172A; width: 180px; text-align: center; padding-top: 4px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Oficjalna Lista Wkładaniowa Gołębi do Kosza</div>
    <div class="meta-row">
      <div><strong>Hodowca:</strong> ${options.breederName} (${options.loftName})</div>
      <div><strong>Oddział / Sekcja:</strong> ${options.clubBranch}</div>
    </div>
    <div class="meta-row">
      <div><strong>Lot:</strong> ${options.raceName} (${options.releaseLocation})</div>
      <div><strong>Data Koszowania:</strong> ${options.basketingDate} • <strong>Sztuk:</strong> ${options.pigeons.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35px;">Lp.</th>
        <th>Numer Obrączki Rodowej</th>
        <th>Barwa</th>
        <th style="width: 55px;">Płeć</th>
        <th>Obrączka Pomocnicza / Czip</th>
        <th style="width: 80px;">Typowanie</th>
        <th>Podpis Komisji</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    <div class="sign-box">Podpis Hodowcy</div>
    <div class="sign-box">Komisja Wkładaniowa (1)</div>
    <div class="sign-box">Komisja Wkładaniowa (2)</div>
  </div>
</body>
</html>
  `.trim();
}

export interface TreatmentRecordItem {
  date: string;
  eventType: string;
  productName: string;
  batchNumber?: string;
  targetPigeon: string;
  withdrawalDays: number;
  expiryOrDue?: string;
  notes?: string;
}

export function generateVeterinaryTreatmentBookHtml(options: {
  loftName: string;
  breederName: string;
  veterinarianName?: string;
  records: TreatmentRecordItem[];
}): string {
  const rows = options.records
    .map(
      (r, i) => `
    <tr>
      <td style="text-align: center;">${i + 1}</td>
      <td style="font-weight: bold;">${r.date}</td>
      <td><span style="font-weight: 700; text-transform: uppercase;">${r.eventType}</span></td>
      <td><strong>${r.productName}</strong> ${r.batchNumber ? `<br><small style="color: #64748B;">Seria: ${r.batchNumber}</small>` : ''}</td>
      <td>${r.targetPigeon}</td>
      <td style="text-align: center; font-weight: bold; color: ${r.withdrawalDays > 0 ? '#DC2626' : '#16A34A'};">
        ${r.withdrawalDays} dni
      </td>
      <td>${r.notes || '—'}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>E-Księga Leczenia Zwierząt PIW — ${options.loftName}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: -apple-system, sans-serif; color: #0F172A; font-size: 11px; margin: 0; }
    .header { border-bottom: 2px solid #0F172A; padding-bottom: 8px; margin-bottom: 12px; }
    .title { font-size: 16px; font-weight: 900; text-transform: uppercase; }
    .subtitle { font-size: 11px; color: #475569; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #F1F5F9; border: 1px solid #CBD5E1; padding: 6px; font-size: 10px; text-transform: uppercase; }
    td { border: 1px solid #E2E8F0; padding: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">E-Książka Leczenia Zwierząt i Zabiegów Weterynaryjnych</div>
    <div class="subtitle">Zgodna z wymaganiami Powiatowego Lekarza Weterynarii (PIW) i przepisami antydopingowymi FCI</div>
    <div style="margin-top: 6px; display: flex; justify-content: space-between;">
      <div><strong>Hodowla:</strong> ${options.loftName} (${options.breederName})</div>
      <div><strong>Lekarz Weterynarii Prowadzący:</strong> ${options.veterinarianName || 'Lek. wet. stada'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;">Lp.</th>
        <th style="width: 75px;">Data</th>
        <th style="width: 100px;">Zabieg</th>
        <th>Preparat / Nr Serii</th>
        <th>Grupa Ptaków / Nr Obrączki</th>
        <th style="width: 70px;">Karencja</th>
        <th>Uwagi / Dawka</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
  `.trim();
}

export interface QrStickerItem {
  pigeonId: string;
  ringNumber: string;
  countryCode: string;
  year: number;
  qrPayload: string;
  auxiliaryRing?: string;
}

export interface StickerSheetOptions {
  loftName: string;
  breederName: string;
  stickers: QrStickerItem[];
}

export function generateInlineQrSvg(value: string, displaySizeMm: number = 14): string {
  try {
    const qr = QRCode.create(value || 'PIGEONFLY:EMPTY', { errorCorrectionLevel: 'H' });
    const count = qr.modules.size;
    let d = '';

    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.modules.get(row, col)) {
          d += `M${col},${row}h1v1h-1z `;
        }
      }
    }

    return `<svg viewBox="0 0 ${count} ${count}" width="${displaySizeMm}mm" height="${displaySizeMm}mm" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><path d="${d}" fill="#000000"/></svg>`;
  } catch {
    return `<div style="width: ${displaySizeMm}mm; height: ${displaySizeMm}mm; background: #E2E8F0; font-size: 8px;">QR</div>`;
  }
}

export function generateQrStickerSheetHtml(options: StickerSheetOptions): string {
  const stickersHtml = options.stickers
    .map((s) => {
      const qrSvg = generateInlineQrSvg(s.qrPayload, 14);
      return `
      <div class="sticker">
        <div class="sticker-top">${s.countryCode} '${String(s.year).slice(-2)}</div>
        <div class="sticker-qr">${qrSvg}</div>
        <div class="sticker-ring">${s.ringNumber}</div>
        ${s.auxiliaryRing ? `<div class="sticker-aux">${s.auxiliaryRing}</div>` : ''}
      </div>
    `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Arkusz Mikronaklejek QR na Obrączki — ${options.loftName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      margin: 0;
      padding: 0;
      color: #0F172A;
    }
    .sheet-header {
      border-bottom: 2px solid #0F172A;
      padding-bottom: 4px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .sheet-title {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sheet-meta {
      font-size: 10px;
      color: #475569;
    }
    .stickers-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 3mm;
    }
    .sticker {
      border: 1px dashed #94A3B8;
      border-radius: 4px;
      padding: 2mm 1mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      box-sizing: border-box;
      min-height: 25mm;
    }
    .sticker-top {
      font-size: 8px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: 0.5px;
      margin-bottom: 1mm;
    }
    .sticker-qr {
      line-height: 0;
    }
    .sticker-ring {
      font-size: 7.5px;
      font-weight: 800;
      color: #0F172A;
      margin-top: 1.5mm;
      text-align: center;
      word-break: break-all;
    }
    .sticker-aux {
      font-size: 6.5px;
      font-weight: 700;
      color: #16A34A;
      margin-top: 0.5mm;
    }
  </style>
</head>
<body>
  <div class="sheet-header">
    <div class="sheet-title">Pigeon-Fly · Mikronaklejki QR na Obrączki Rodowe (8-10 mm)</div>
    <div class="sheet-meta">${options.loftName} (${options.breederName}) • Etykiet: ${options.stickers.length}</div>
  </div>
  <div class="stickers-grid">
    ${stickersHtml}
  </div>
</body>
</html>
  `.trim();
}

/**
 * -------------------------------------------------------------
 * Z-270: Nest Box Cards PDF Generator (Karty Cel Gniazdowych A4)
 * -------------------------------------------------------------
 */

export interface NestBoxCardItem {
  nestBox: string; // np. "Cela A-04"
  roundNumber: number; // 1, 2, 3
  pairedDate: string; // YYYY-MM-DD
  inbreedingF?: number;
  cockRingNumber: string;
  cockYear?: number;
  cockColor?: string;
  cockStrain?: string; // Linia / Pochodzenie
  cockNotes?: string;
  henRingNumber: string;
  henYear?: number;
  henColor?: string;
  henStrain?: string;
  henNotes?: string;
  egg1Date?: string;
  egg2Date?: string;
  eggStatus?: string;
  expectedHatchDate?: string;
  bandingWindow?: string; // Doba 6-8 (np. "18.04 - 20.04")
  chick1RingNumber?: string;
  chick2RingNumber?: string;
  weanedDate?: string;
  notes?: string;
  qrPayload?: string;
}

export interface NestBoxCardsPdfOptions {
  loftName: string;
  breederName: string;
  seasonYear: number;
  cards: NestBoxCardItem[];
}

export function generateNestBoxCardsHtml(options: NestBoxCardsPdfOptions): string {
  const cardsHtml = options.cards
    .map((c) => {
      const inbreedingText =
        c.inbreedingF !== undefined
          ? (c.inbreedingF * 100).toFixed(2) + '%'
          : '0.00%';
      const qrSvg = generateInlineQrSvg(
        c.qrPayload || `PIGEONFLY:NESTBOX:${c.nestBox}:${c.cockRingNumber}:${c.henRingNumber}`,
        16
      );

      return `
      <div class="card-wrapper">
        <div class="cut-guide">✂ WYCIĄĆ WZDŁUŻ LINII — KARTA FRONTU CELI GNIAZDOWEJ</div>
        <div class="nest-card">
          <div class="card-header">
            <div>
              <div class="card-loft">${options.loftName} • SEZON ${options.seasonYear}</div>
              <div class="nest-box-badge">${c.nestBox}</div>
            </div>
            <div class="header-right">
              <div class="round-badge">LĘG #${c.roundNumber}</div>
              <div class="qr-box">${qrSvg}</div>
            </div>
          </div>

          <div class="parents-grid">
            <div class="parent-box cock">
              <div class="parent-role">♂ SAMIEC (OJCIEC)</div>
              <div class="parent-ring">${c.cockRingNumber}</div>
              <div class="parent-meta">${c.cockYear ? `'${String(c.cockYear).slice(-2)} • ` : ''}${c.cockColor || 'Niebieski'}${c.cockStrain ? ` • ${c.cockStrain}` : ''}</div>
              ${c.cockNotes ? `<div class="parent-notes">${c.cockNotes}</div>` : ''}
            </div>

            <div class="parent-box hen">
              <div class="parent-role">♀ SAMICA (MATKA)</div>
              <div class="parent-ring">${c.henRingNumber}</div>
              <div class="parent-meta">${c.henYear ? `'${String(c.henYear).slice(-2)} • ` : ''}${c.henColor || 'Pstry'}${c.henStrain ? ` • ${c.henStrain}` : ''}</div>
              ${c.henNotes ? `<div class="parent-notes">${c.henNotes}</div>` : ''}
            </div>
          </div>

          <div class="inbreeding-row">
            <span>Złożenie pary: <strong>${c.pairedDate}</strong></span>
            <span>Współczynnik inbredu Wrighta (F): <strong class="inbred-val">${inbreedingText}</strong></span>
          </div>

          <table class="milestones-table">
            <thead>
              <tr>
                <th>Jajo 1</th>
                <th>Jajo 2</th>
                <th>Owoskopia (D.5)</th>
                <th>Wylęg (D.18)</th>
                <th class="th-alert">Obrączkowanie (D. 6–8)</th>
                <th>Odsadzenie</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${c.egg1Date || '—'}</td>
                <td>${c.egg2Date || '—'}</td>
                <td>${c.eggStatus || 'Zapłodnione'}</td>
                <td>${c.expectedHatchDate || '—'}</td>
                <td class="td-alert">${c.bandingWindow || '—'}</td>
                <td>${c.weanedDate || '—'}</td>
              </tr>
            </tbody>
          </table>

          <div class="chicks-row">
            <div class="chick-slot">
              <span class="slot-label">Młode 1 (Obrączka rodowa):</span>
              <span class="slot-val">${c.chick1RingNumber || '...........................................'}</span>
            </div>
            <div class="chick-slot">
              <span class="slot-label">Młode 2 (Obrączka rodowa):</span>
              <span class="slot-val">${c.chick2RingNumber || '...........................................'}</span>
            </div>
          </div>

          <div class="notes-field">
            <span class="notes-label">Notatki hodowcy z odchowu:</span>
            <div class="notes-line">${c.notes || ''}</div>
          </div>
        </div>
      </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Karty Cel Gniazdowych — ${options.loftName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 10px;
    }
    .cards-container {
      display: flex;
      flex-direction: column;
      gap: 12mm;
    }
    .card-wrapper {
      page-break-inside: avoid;
    }
    .cut-guide {
      font-size: 8px;
      color: #64748B;
      border-bottom: 1px dashed #CBD5E1;
      padding-bottom: 2mm;
      margin-bottom: 3mm;
      text-align: center;
      letter-spacing: 0.5px;
    }
    .nest-card {
      border: 2px solid #0F172A;
      border-radius: 6px;
      padding: 10px;
      background: #FFFFFF;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1.5px solid #0F172A;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .card-loft {
      font-size: 10px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .nest-box-badge {
      font-size: 20px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: 0.5px;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .round-badge {
      background: #0F172A;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .qr-box {
      line-height: 0;
    }
    .parents-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 6px;
    }
    .parent-box {
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      padding: 6px 8px;
      background: #F8FAFC;
    }
    .parent-box.cock {
      border-left: 3px solid #2563EB;
    }
    .parent-box.hen {
      border-left: 3px solid #DC2626;
    }
    .parent-role {
      font-size: 9px;
      font-weight: 800;
      color: #475569;
      margin-bottom: 2px;
    }
    .parent-ring {
      font-size: 13px;
      font-weight: 900;
      color: #0F172A;
      font-family: monospace;
    }
    .parent-meta {
      font-size: 9px;
      color: #64748B;
      margin-top: 2px;
    }
    .parent-notes {
      font-size: 8.5px;
      color: #334155;
      font-style: italic;
      margin-top: 2px;
    }
    .inbreeding-row {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      background: #F1F5F9;
      padding: 4px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .inbred-val {
      color: #D97706;
    }
    .milestones-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .milestones-table th, .milestones-table td {
      border: 1px solid #CBD5E1;
      padding: 4px 6px;
      text-align: center;
      font-size: 9px;
    }
    .milestones-table th {
      background: #F8FAFC;
      font-weight: 700;
      color: #475569;
    }
    .th-alert {
      background: #FEF3C7 !important;
      color: #92400E !important;
      font-weight: 800 !important;
    }
    .td-alert {
      background: #FFFBEB;
      color: #B45309;
      font-weight: 800;
    }
    .chicks-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .chick-slot {
      border: 1px dashed #94A3B8;
      border-radius: 4px;
      padding: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .slot-label {
      font-size: 8.5px;
      color: #475569;
      font-weight: 700;
    }
    .slot-val {
      font-size: 11px;
      font-weight: 900;
      color: #0F172A;
      font-family: monospace;
    }
    .notes-field {
      border-top: 1px solid #E2E8F0;
      padding-top: 4px;
    }
    .notes-label {
      font-size: 8px;
      color: #94A3B8;
      text-transform: uppercase;
      font-weight: 700;
    }
    .notes-line {
      min-height: 14px;
      font-size: 9px;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="cards-container">
    ${cardsHtml}
  </div>
</body>
</html>
  `.trim();
}



