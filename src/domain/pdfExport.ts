/**
 * PIGEON-FLY — Pedigree PDF Generator (Rodowód 4-pokoleniowy A4)
 * Generates print-ready HTML for expo-print with anti-counterfeit verification QR code.
 */

import { Pigeon, PedigreeNode } from './types';
import { getPedigreeVerificationUrl } from './qr';

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
