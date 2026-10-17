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

export interface ConcourseSheetPdfItem {
  position: number;
  ringNumber: string;
  plumageColor?: string;
  sex?: 'cock' | 'hen' | 'unknown' | string;
  fancierName?: string;
  loftName?: string;
  arrivalTime: string;
  distanceKm: number;
  velocityMPerMin: number;
  fciCoeff: number;
  gmpPoints: number;
  isTip?: boolean;
}

export interface ConcourseSheetPdfOptions {
  clubBranch?: string;
  raceName: string;
  releaseLocation: string;
  releaseDateTime?: string;
  distanceKm: number;
  totalBasketed: number;
  basePercent: 20 | 25 | 33;
  prizeLimit: number;
  winningVelocity: number;
  lastPrizeVelocity: number;
  items: ConcourseSheetPdfItem[];
  seriesSummary?: {
    seriesName: string;
    totalPoints: number;
    countingBirdsCount: number;
  };
}

export function generateConcourseSheetHtml(options: ConcourseSheetPdfOptions): string {
  const rows = options.items
    .map((item) => {
      const sexLabel = item.sex === 'cock' ? '1.0 ♂' : item.sex === 'hen' ? '0.1 ♀' : '—';
      const seriesBadge = item.isTip
        ? '<span style="background: #FEF3C7; color: #B45309; padding: 2px 6px; border-radius: 3px; font-weight: bold;">★ 5/50</span>'
        : '<span style="color: #94A3B8;">—</span>';

      return `
      <tr>
        <td style="text-align: center; font-weight: 900; background: #F8FAFC;">${item.position}</td>
        <td style="font-weight: 700;">${item.fancierName || 'Hodowca Pigeon-Fly'}</td>
        <td style="font-family: monospace; font-size: 11px; font-weight: 900; color: #0F172A;">${item.ringNumber}</td>
        <td style="text-align: center; font-size: 10px;">${sexLabel}</td>
        <td style="font-size: 10px; color: #475569;">${item.plumageColor || '—'}</td>
        <td style="text-align: center; font-family: monospace; font-size: 10.5px;">${item.arrivalTime}</td>
        <td style="text-align: right; font-family: monospace;">${item.distanceKm.toFixed(3)}</td>
        <td style="text-align: right; font-weight: 900; color: #1E293B; font-family: monospace;">${item.velocityMPerMin.toFixed(3)}</td>
        <td style="text-align: right; font-family: monospace; color: #0369A1; font-weight: 700;">${item.fciCoeff.toFixed(3)}</td>
        <td style="text-align: right; font-weight: 900; color: #15803D; font-family: monospace;">${item.gmpPoints.toFixed(2)}</td>
        <td style="text-align: center; font-size: 9.5px;">${seriesBadge}</td>
      </tr>
      `;
    })
    .join('');

  const seriesHtml = options.seriesSummary
    ? `
    <div class="series-card">
      <div class="series-title">🏆 ${options.seriesSummary.seriesName}</div>
      <div class="series-body">
        Zdobyte punkty: <strong>${options.seriesSummary.totalPoints.toFixed(2)} pkt</strong> &nbsp;•&nbsp; 
        Liczba ptaków punktujących w serii: <strong>${options.seriesSummary.countingBirdsCount}</strong>
      </div>
    </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lista Konkursowa — ${options.raceName}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F172A; font-size: 10px; margin: 0; line-height: 1.3; }
    .header { border-bottom: 2px solid #0F172A; padding-bottom: 8px; margin-bottom: 10px; }
    .union-title { font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #475569; }
    .main-title { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 2px 0; color: #0F172A; }
    .branch-subtitle { font-size: 12px; font-weight: 700; color: #2563EB; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 10px 0; }
    .stat-box { border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px; background: #F8FAFC; text-align: center; }
    .stat-label { font-size: 8px; color: #64748B; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
    .stat-value { font-size: 12px; font-weight: 900; color: #0F172A; font-family: monospace; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #0F172A; color: #FFFFFF; font-size: 9px; padding: 5px 4px; text-transform: uppercase; border: 1px solid #0F172A; }
    td { border: 1px solid #CBD5E1; padding: 4px; font-size: 9.5px; }
    tr:nth-child(even) { background-color: #F8FAFC; }
    
    .series-card { margin-top: 12px; padding: 8px 12px; border: 1px solid #FCD34D; background: #FFFBEB; border-radius: 6px; }
    .series-title { font-size: 11px; font-weight: 800; color: #92400E; margin-bottom: 2px; }
    .series-body { font-size: 10px; color: #78350F; }
    
    .footer { margin-top: 25px; display: flex; justify-content: space-between; page-break-inside: avoid; }
    .signature-block { width: 160px; text-align: center; border-top: 1px solid #0F172A; padding-top: 4px; margin-top: 35px; font-size: 9px; color: #475569; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <div class="union-title">Polski Związek Hodowców Gołębi Pocztowych • Regulamin FCI</div>
    <div class="main-title">Oficjalna Lista Konkursowa</div>
    <div class="branch-subtitle">${options.clubBranch || 'Zarząd Oddziału / Sekcji Hodowlanej'}</div>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-label">Miejscowość / Lot</div>
      <div class="stat-value" style="font-size: 10.5px;">${options.releaseLocation}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Godzina Wypuszczenia</div>
      <div class="stat-value">${options.releaseDateTime || '—'}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Średni Dystans</div>
      <div class="stat-value">${options.distanceKm.toFixed(3)} km</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Baza Konkursowa</div>
      <div class="stat-value">${options.basePercent}% (1 : ${Math.round(100 / options.basePercent)})</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Gołębi w Koszu</div>
      <div class="stat-value">${options.totalBasketed}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Liczba Konkursów</div>
      <div class="stat-value" style="color: #D97706;">${options.prizeLimit}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Prędkość I Ptaka</div>
      <div class="stat-value" style="color: #15803D;">${options.winningVelocity.toFixed(2)} m/m</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Prędkość Ostatniego</div>
      <div class="stat-value" style="color: #B45309;">${options.lastPrizeVelocity.toFixed(2)} m/m</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 32px;">Lp.</th>
        <th>Hodowca / Gołębnik</th>
        <th>Nr Obrączki Rodowej</th>
        <th style="width: 44px;">Płeć</th>
        <th>Barwa</th>
        <th>Czas Przylotu</th>
        <th>Dyst. [km]</th>
        <th>Prędkość [m/m]</th>
        <th>Coeff.</th>
        <th>Pkt. GMP</th>
        <th style="width: 50px;">Seria</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  ${seriesHtml}

  <div class="footer">
    <div class="signature-block">Przewodniczący Komisji Lotowej</div>
    <div class="signature-block">Komisja Obliczeniowa</div>
    <div class="signature-block">Przewodniczący Komisji Zegarowej</div>
  </div>
</body>
</html>
  `.trim();
}

export interface YpdsEmergencyReportPdfOptions {
  loftName: string;
  breederName: string;
  pigeonRingNumber: string;
  isYoungBird: boolean;
  date: string;
  symptoms: string[];
  riskLevel: string;
  summary: string;
  contraindications: string[];
  protocols: { title: string; description: string; priority: string }[];
  veterinarianNotes?: string;
}

export function generateYpdsEmergencyReportHtml(options: YpdsEmergencyReportPdfOptions): string {
  const isEmergency = options.riskLevel === 'acute' || options.riskLevel === 'critical';
  const badgeColor =
    options.riskLevel === 'critical'
      ? '#DC2626'
      : options.riskLevel === 'acute'
      ? '#EA580C'
      : options.riskLevel === 'suspected'
      ? '#D97706'
      : '#16A34A';

  const riskLabel =
    options.riskLevel === 'critical'
      ? 'KRYTYCZNE ZAGROŻENIE ŻYCIA (ZAPAŚĆ ADENO-COLI)'
      : options.riskLevel === 'acute'
      ? 'OSTRE ADENO-COLI / YPDS (ALARM EPIDEMIOLOGICZNY)'
      : options.riskLevel === 'suspected'
      ? 'PODEJRZENIE NIESTRAWNOŚCI / ZASTOJU WOLA'
      : 'BRAK ZAGROŻENIA (PTAK ZDROWY)';

  const symptomsList =
    options.symptoms.length > 0
      ? options.symptoms
          .map((s) => `<li style="margin-bottom: 4px; color: #DC2626; font-weight: 700;">⚠️ ${s}</li>`)
          .join('')
      : '<li style="color: #16A34A;">Brak objawów chorobowych</li>';

  const contraindicationsList = options.contraindications
    .map((c) => `<li style="margin-bottom: 4px; color: #991B1B;">⛔ ${c}</li>`)
    .join('');

  const protocolsList = options.protocols
    .map(
      (p) => `
    <div style="background: #F8FAFC; border-left: 3px solid #0284C7; padding: 6px 10px; margin-bottom: 6px; border-radius: 4px;">
      <div style="font-weight: 800; font-size: 11px; color: #0369A1;">${p.title}</div>
      <div style="font-size: 9.5px; color: #334155; margin-top: 2px;">${p.description}</div>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Karta Triage YPDS — ${options.pigeonRingNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; color: #0F172A; margin: 0; padding: 0; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0F172A; padding-bottom: 8px; margin-bottom: 12px; }
    .title { font-size: 18px; font-weight: 900; color: #0F172A; letter-spacing: 0.5px; }
    .subtitle { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-top: 2px; }
    .alert-banner { background: #FEF2F2; border: 2px solid ${badgeColor}; border-radius: 6px; padding: 10px; margin-bottom: 14px; }
    .alert-badge { display: inline-block; background: ${badgeColor}; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; letter-spacing: 0.5px; }
    .alert-summary { font-size: 11px; font-weight: 700; color: #0F172A; line-height: 1.4; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .card { background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px; }
    .card-title { font-size: 11px; font-weight: 800; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
    ul { margin: 0; padding-left: 16px; }
    .footer { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #CBD5E1; padding-top: 14px; }
    .sign-box { border-bottom: 1px dashed #94A3B8; height: 35px; margin-top: 25px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">KLINICZNY PROTOKÓŁ TRIAGE YPDS</div>
      <div class="subtitle">${options.loftName} • Hodowca: ${options.breederName}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12px; font-weight: 900; font-family: monospace;">${options.pigeonRingNumber}</div>
      <div style="font-size: 9px; color: #64748B;">Wiek: ${options.isYoungBird ? 'Młode (<1 rok)' : 'Dorosły (≥1 rok)'} • Data: ${options.date}</div>
    </div>
  </div>

  <div class="alert-banner">
    <div class="alert-badge">${riskLabel}</div>
    <div class="alert-summary">${options.summary}</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Stwierdzone Objawy Kliniczne</div>
      <ul>${symptomsList}</ul>
    </div>
    <div class="card">
      <div class="card-title">Bezwzględne Przeciwwskazania</div>
      <ul>${contraindicationsList}</ul>
    </div>
  </div>

  <div class="card" style="margin-bottom: 14px;">
    <div class="card-title">Zalecana Procedura Ratunkowa RD-27</div>
    ${protocolsList}
  </div>

  <div class="card">
    <div class="card-title">Zalecenia Lekarza Weterynarii / Wynik Sekcji</div>
    <div style="min-height: 40px; color: #64748B; font-style: italic;">
      ${options.veterinarianNotes || 'Wpis lekarza weterynarii lub zalecenia antybiogramu (w przypadku powikłań bakteryjnych Salmonella / E. coli):'}
    </div>
  </div>

  <div class="footer">
    <div>
      <div style="font-weight: 700; color: #475569;">Podpis hodowcy / zgłaszającego kwarantannę:</div>
      <div class="sign-box"></div>
    </div>
    <div>
      <div style="font-weight: 700; color: #475569;">Pieczęć i podpis lekarza weterynarii:</div>
      <div class="sign-box"></div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * -------------------------------------------------------------
 * Z-307: Urzędowe Zaświadczenie Szczepienia Stada (PZHGP / PIW)
 * -------------------------------------------------------------
 */

export interface VaccinationCertificatePdfOptions {
  certificateNumber: string;
  issueDate: string;
  vetName: string;
  vetLicenseNumber: string;
  clinicName: string;
  clinicAddress: string;
  loftName: string;
  fancierName: string;
  fancierAddress: string;
  pzhgpBranch: string;
  vaccineName: string;
  batchNumber: string;
  vaccinationDate: string;
  expiryDate: string;
  pigeons: {
    ringNumber: string;
    sex?: string;
    color?: string;
    ageYears?: number;
  }[];
}

export function generateVaccinationCertificateHtml(
  options: VaccinationCertificatePdfOptions
): string {
  const pigeonRows = options.pigeons
    .map(
      (p, idx) => `
    <tr>
      <td style="text-align: center; width: 36px;">${idx + 1}</td>
      <td style="font-weight: 900; font-family: monospace; font-size: 11px;">${p.ringNumber}</td>
      <td style="text-align: center;">${p.sex === 'cock' ? '1.0 Samiec' : p.sex === 'hen' ? '0.1 Samica' : '—'}</td>
      <td>${p.color || '—'}</td>
      <td style="text-align: center;">${p.ageYears !== undefined ? `${p.ageYears} lat` : '—'}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Zaświadczenie Szczepienia — ${options.certificateNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #0F172A; }
    .header-table { width: 100%; border-bottom: 2px solid #0F172A; padding-bottom: 8px; margin-bottom: 12px; }
    .title { font-size: 15px; font-weight: 900; text-transform: uppercase; color: #0F172A; }
    .subtitle { font-size: 10px; color: #475569; margin-top: 2px; }
    .cert-no { font-size: 13px; font-weight: 800; color: #E5A93C; font-family: monospace; }
    
    .meta-grid { display: table; width: 100%; margin-bottom: 12px; }
    .meta-col { display: table-cell; width: 50%; vertical-align: top; padding: 4px; }
    .box { background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px; font-size: 10.5px; }
    .box-title { font-weight: 900; font-size: 11px; color: #1E293B; margin-bottom: 4px; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; padding-bottom: 2px; }
    
    .vaccine-card { background: #EFF6FF; border: 1px solid #93C5FD; border-radius: 6px; padding: 8px; margin-bottom: 12px; font-size: 11px; }
    .vaccine-grid { display: flex; justify-content: space-between; }
    
    .table-container { width: 100%; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #1E293B; color: #FFFFFF; font-weight: 800; padding: 5px 8px; text-align: left; }
    td { border-bottom: 1px solid #E2E8F0; padding: 4px 8px; }
    tr:nth-child(even) { background: #F8FAFC; }
    
    .declaration { background: #F0FDF4; border-left: 3px solid #16A34A; padding: 8px; font-size: 10px; color: #166534; margin-bottom: 16px; border-radius: 4px; }
    
    .signatures { display: flex; justify-content: space-between; margin-top: 20px; }
    .sign-col { width: 45%; text-align: center; }
    .sign-box { border-bottom: 1px solid #64748B; height: 50px; margin-bottom: 4px; }
    .sign-label { font-size: 9px; color: #64748B; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <div class="title">URZĘDOWE ZAŚWIADCZENIE SZCZEPIENIA GOŁĘBI</div>
        <div class="subtitle">Wymóg PZHGP & Rozporządzenie MRiRW ws. zwalczania rzekomego pomoru drobiu (PMV-1)</div>
      </td>
      <td style="text-align: right;">
        <div class="cert-no">Nr: ${options.certificateNumber}</div>
        <div style="font-size: 10px; color: #64748B;">Wydano: ${options.issueDate}</div>
      </td>
    </tr>
  </table>

  <div class="meta-grid">
    <div class="meta-col">
      <div class="box">
        <div class="box-title">Lekarz Weterynarii / Przychodnia</div>
        <div><strong>${options.vetName}</strong></div>
        <div>Nr PWZ: <strong>${options.vetLicenseNumber}</strong></div>
        <div>${options.clinicName}</div>
        <div>${options.clinicAddress}</div>
      </div>
    </div>
    <div class="meta-col">
      <div class="box">
        <div class="box-title">Hodowca / Posiadacz Gołębnika</div>
        <div><strong>${options.fancierName}</strong> — ${options.loftName}</div>
        <div>${options.fancierAddress}</div>
        <div>Przynależność: <strong>${options.pzhgpBranch}</strong></div>
      </div>
    </div>
  </div>

  <div class="vaccine-card">
    <div style="font-weight: 800; color: #1E40AF; margin-bottom: 4px;">DANE ZASTOSOWANEGO BIOPREPARATU:</div>
    <div>Nazwa handlowa: <strong>${options.vaccineName}</strong> • Seria (Batch): <strong>${options.batchNumber}</strong></div>
    <div>Data iniekcji: <strong>${options.vaccinationDate}</strong> • Ważność zaświadczenia (365 dni): <strong>${options.expiryDate}</strong></div>
  </div>

  <div class="table-container">
    <div style="font-weight: 800; margin-bottom: 4px;">WYKAZ ZASZCZEPIONYCH GOŁĘBI (${options.pigeons.length} szt.):</div>
    <table>
      <thead>
        <tr>
          <th style="width: 36px; text-align: center;">L.p.</th>
          <th>Numer Obrączki Rodowej</th>
          <th style="text-align: center;">Płeć</th>
          <th>Barwa upierzenia</th>
          <th style="text-align: center;">Wiek</th>
        </tr>
      </thead>
      <tbody>
        ${pigeonRows}
      </tbody>
    </table>
  </div>

  <div class="declaration">
    <strong>OŚWIADCZENIE LEKARZA WETERYNARII:</strong><br>
    Niniejszym zaświadczam, że wyżej wymienione gołębie pocztowe zostały zbadane klinicznie i zaszczepione przeciwko paramyksowirozie gołębi (PMV-1) zgodnie z instrukcją producenta szczepionki. W momencie szczepienia ptaki nie wykazywały objawów klinicznych chorób zakaźnych. Po upływie 21 dni od iniekcji stado uzyskuje pełną odporność poszczepienną i jest dopuszczone do lotów konkursowych oraz wystaw.
  </div>

  <div class="signatures">
    <div class="sign-col">
      <div class="sign-box"></div>
      <div class="sign-label">Podpis hodowcy (potwierdzenie tożsamości stada)</div>
    </div>
    <div class="sign-col">
      <div class="sign-box"></div>
      <div class="sign-label">Pieczęć i podpis uprawnionego lekarza weterynarii</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}





