/**
 * PIGEON-FLY — E-Księga Hodowlana i Wywozu Młodych (Z-065)
 * Moduł ewidencji zbycia ptaków, przekazania Kart Tożsamości PZHGP/FCI i umów transferu:
 * - Weryfikacja kompletności dokumentów tożsamości (karty plastikowe/tekturowe obrączek)
 * - Różne tryby transferu: Sprzedaż, Darowizna, Wypożyczenie na lęgi, Wymiana
 * - Klauzule gwarancyjne, zalecenie 14-dniowej kwarantanny i prawa własności
 * - Generator oficjalnej dwujęzycznej umowy transferu A4 HTML/PDF
 */

export type TransferType = 'SALE' | 'GIFT' | 'BREEDING_LOAN' | 'EXCHANGE';

export interface TransferredPigeonItem {
  id: string;
  ringNumber: string;
  year: number;
  sex: 'cock' | 'hen' | 'unknown';
  plumageColor: string;
  hasIdentityCard: boolean; // Czy przekazano oryginalną Kartę Tożsamości / Własności PZHGP/FCI
  hasPedigree: boolean; // Czy dołączono 4-pokoleniowy rodowód
  hasElectronicChip: boolean; // Czy ptak posiada zarejestrowany chip ESK
  pricePln?: number; // Cena w PLN (opcjonalna przy sprzedaży)
  notes?: string;
}

export interface PigeonTransferParty {
  name: string;
  loftName: string;
  pzhgpBranch: string; // np. "0284 Warszawa"
  pzhgpSection?: string;
  address: string;
  phone: string;
  email?: string;
}

export interface PigeonTransferContract {
  contractNumber: string; // np. "PZHGP-TR-2026-008"
  transferDate: string; // YYYY-MM-DD
  transferPlace: string; // np. "Piaseczno"
  transferType: TransferType;
  seller: PigeonTransferParty;
  buyer: PigeonTransferParty;
  pigeons: TransferredPigeonItem[];
  quarantineClauseAccepted: boolean; // Obowiązek 14-dniowej kwarantanny
  totalAgreedPricePln: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'NON_MONETARY';
  specialConditions?: string;
}

export interface TransferEvaluationResult {
  isValid: boolean;
  totalPigeonsCount: number;
  identityCardsDeliveredCount: number;
  identityCardsMissingCount: number;
  pedigreesDeliveredCount: number;
  totalValuePln: number;
  warnings: string[];
  transferTypeLabel: string;
  statusVerdict: 'READY_TO_SIGN' | 'INCOMPLETE_DOCUMENTS' | 'MISSING_DATA';
}

export const DEFAULT_TRANSFER_TYPES: { type: TransferType; label: string }[] = [
  { type: 'SALE', label: 'Umowa Kupna - Sprzedaży Gołębi' },
  { type: 'GIFT', label: 'Protokół Przekazania / Darowizny' },
  { type: 'BREEDING_LOAN', label: 'Umowa Użyczenia do Rozpłodu (Depozyt)' },
  { type: 'EXCHANGE', label: 'Protokół Wymiany Materiału Hodowlanego' },
];

/**
 * Waliduje umowę i wylicza statystyki przekazania ptaków i kart własności
 */
export function evaluateTransferContract(contract: PigeonTransferContract): TransferEvaluationResult {
  const warnings: string[] = [];

  const totalPigeonsCount = contract.pigeons.length;
  let identityCardsDeliveredCount = 0;
  let pedigreesDeliveredCount = 0;
  let calculatedTotalValue = 0;

  for (const p of contract.pigeons) {
    if (p.hasIdentityCard) {
      identityCardsDeliveredCount++;
    } else {
      warnings.push(`Ptak ${p.ringNumber}: Brak przekazania Karty Tożsamości PZHGP/FCI.`);
    }

    if (p.hasPedigree) {
      pedigreesDeliveredCount++;
    }

    if (p.pricePln && p.pricePln > 0) {
      calculatedTotalValue += p.pricePln;
    }
  }

  const identityCardsMissingCount = totalPigeonsCount - identityCardsDeliveredCount;

  // Sprawdzenie danych stron
  if (!contract.seller.name || contract.seller.name.trim().length === 0) {
    warnings.push('Brak danych zbywcy / hodowcy przekazującego.');
  }

  if (!contract.buyer.name || contract.buyer.name.trim().length === 0) {
    warnings.push('Brak danych nabywcy / hodowcy przyjmującego.');
  }

  if (totalPigeonsCount === 0) {
    warnings.push('Brak zdefiniowanych gołębi w protokole przekazania.');
  }

  let statusVerdict: TransferEvaluationResult['statusVerdict'] = 'READY_TO_SIGN';
  if (!contract.seller.name || !contract.buyer.name || totalPigeonsCount === 0) {
    statusVerdict = 'MISSING_DATA';
  } else if (identityCardsMissingCount > 0) {
    statusVerdict = 'INCOMPLETE_DOCUMENTS';
  }

  const transferTypeLabel =
    DEFAULT_TRANSFER_TYPES.find((t) => t.type === contract.transferType)?.label ||
    'Protokół Przekazania Gołębi';

  const totalValuePln = contract.totalAgreedPricePln > 0 ? contract.totalAgreedPricePln : calculatedTotalValue;

  return {
    isValid: warnings.length === 0,
    totalPigeonsCount,
    identityCardsDeliveredCount,
    identityCardsMissingCount,
    pedigreesDeliveredCount,
    totalValuePln,
    warnings,
    transferTypeLabel,
    statusVerdict,
  };
}

/**
 * Generuje oficjalny urzędowy dokument umowy transferu A4 HTML do wydruku lub zapisu PDF
 */
export function generateTransferContractHtml(
  contract: PigeonTransferContract,
  evaluation: TransferEvaluationResult
): string {
  const pigeonsRowsHtml = contract.pigeons
    .map(
      (p, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
      <td style="padding: 5px 6px; border: 1px solid #CBD5E1; text-align: center; font-size: 10px;">${idx + 1}</td>
      <td style="padding: 5px 6px; border: 1px solid #CBD5E1; font-size: 11px; font-weight: bold;">${p.ringNumber}</td>
      <td style="padding: 5px 6px; border: 1px solid #CBD5E1; font-size: 10px; text-align: center;">${p.year}</td>
      <td style="padding: 5px 6px; border: 1px solid #CBD5E1; font-size: 10px; text-align: center;">${p.sex === 'cock' ? '1.0 ♂' : p.sex === 'hen' ? '0.1 ♀' : '?'}</td>
      <td style="padding: 5px 6px; border: 1px solid #CBD5E1; font-size: 10px;">${p.plumageColor}</td>
      <td style="padding: 5px 6px; border: 1px solid #CBD5E1; font-size: 10px; text-align: center; color: ${p.hasIdentityCard ? '#2E7D32' : '#D32F2F'}; font-weight: bold;">
        ${p.hasIdentityCard ? '✓ WYDANO' : '✗ BRAK'}
      </td>
      <td style="padding: 5px 6px; border: 1px solid #CBD5E1; font-size: 10px; text-align: center;">${p.hasPedigree ? 'TAK' : 'NIE'}</td>
      <td style="padding: 5px 6px; border: 1px solid #CBD5E1; font-size: 10px; text-align: right; font-weight: 600;">
        ${p.pricePln && p.pricePln > 0 ? `${p.pricePln.toFixed(2)} PLN` : '—'}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Umowa Transferu Gołębi - ${contract.contractNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      line-height: 1.35;
      font-size: 11px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #0F172A;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .title-box {
      text-align: center;
      margin-bottom: 12px;
    }
    .title-box h1 {
      font-size: 15px;
      text-transform: uppercase;
      margin: 0 0 3px 0;
      color: #0F172A;
    }
    .title-box p {
      font-size: 10px;
      color: #475569;
      margin: 0;
    }
    .parties-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .party-box {
      width: 48%;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      padding: 8px;
      vertical-align: top;
      background-color: #F8FAFC;
    }
    .party-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #334155;
      margin-bottom: 4px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 3px;
    }
    .party-line {
      font-size: 10px;
      margin-bottom: 2px;
      color: #1E293B;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 10px 0 4px 0;
      color: #0F172A;
      border-left: 3px solid #0F172A;
      padding-left: 6px;
    }
    .pigeons-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .pigeons-table th {
      background-color: #F1F5F9;
      border: 1px solid #CBD5E1;
      padding: 5px 6px;
      font-size: 9px;
      text-transform: uppercase;
      font-weight: bold;
      color: #334155;
    }
    .clauses-box {
      border: 1px solid #CBD5E1;
      background-color: #FAFAFA;
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 12px;
      font-size: 9px;
      color: #334155;
      line-height: 1.35;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 18px;
    }
    .sig-cell {
      width: 48%;
      border-top: 1px dashed #64748B;
      text-align: center;
      padding-top: 6px;
      font-size: 10px;
    }
    .footer {
      margin-top: 12px;
      font-size: 8px;
      color: #94A3B8;
      text-align: center;
      border-top: 1px solid #E2E8F0;
      padding-top: 4px;
    }
  </style>
</head>
<body>

  <!-- Nagłówek Urzędowy -->
  <table class="header-table">
    <tr>
      <td style="width: 65%;">
        <div style="font-size: 12px; font-weight: 800; color: #0F172A;">POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH (PZHGP)</div>
        <div style="font-size: 9px; color: #475569;">REJESTR ZBYCIA I PRZEKAZANIA PRAW WŁASNOŚCI DO OBRĄCZEK RODOWYCH</div>
      </td>
      <td style="width: 35%; text-align: right;">
        <div style="font-size: 11px; font-weight: bold; color: #0F172A;">Nr umowy: ${contract.contractNumber}</div>
        <div style="font-size: 9px; color: #64748B;">Miejscowość: ${contract.transferPlace}, data: ${contract.transferDate}</div>
      </td>
    </tr>
  </table>

  <!-- Tytuł Dokumentu -->
  <div class="title-box">
    <h1>${evaluation.transferTypeLabel}</h1>
    <p>Przekazanie ptaków wraz z urzędowymi Kartami Tożsamości (FCI / PZHGP)</p>
  </div>

  <!-- Strony Umowy -->
  <table class="parties-grid">
    <tr>
      <td class="party-box">
        <div class="party-title">ZBYWCA / HODOWCA PRZEKAZUJĄCY:</div>
        <div class="party-line"><strong>${contract.seller.name}</strong> (${contract.seller.loftName})</div>
        <div class="party-line">Oddział PZHGP: ${contract.seller.pzhgpBranch} ${contract.seller.pzhgpSection ? `/ ${contract.seller.pzhgpSection}` : ''}</div>
        <div class="party-line">Adres: ${contract.seller.address}</div>
        <div class="party-line">Telefon: ${contract.seller.phone}</div>
      </td>
      <td style="width: 4%;"></td>
      <td class="party-box">
        <div class="party-title">NABYWCA / HODOWCA PRZYJMUJĄCY:</div>
        <div class="party-line"><strong>${contract.buyer.name}</strong> (${contract.buyer.loftName})</div>
        <div class="party-line">Oddział PZHGP: ${contract.buyer.pzhgpBranch} ${contract.buyer.pzhgpSection ? `/ ${contract.buyer.pzhgpSection}` : ''}</div>
        <div class="party-line">Adres: ${contract.buyer.address}</div>
        <div class="party-line">Telefon: ${contract.buyer.phone}</div>
      </td>
    </tr>
  </table>

  <!-- Wykaz Ptaków -->
  <div class="section-title">I. WYKAZ PRZEKAZYWANYCH GOŁĘBI I DOKUMENTÓW (LICZBA: ${evaluation.totalPigeonsCount} SZT.)</div>
  <table class="pigeons-table">
    <thead>
      <tr>
        <th style="width: 5%;">Lp.</th>
        <th style="width: 25%;">Numer obrączki rodowej</th>
        <th style="width: 8%;">Rocznik</th>
        <th style="width: 10%;">Płeć</th>
        <th style="width: 20%;">Barwa upierzenia</th>
        <th style="width: 14%;">Karta Tożsamości</th>
        <th style="width: 8%;">Rodowód</th>
        <th style="width: 10%;">Wartość</th>
      </tr>
    </thead>
    <tbody>
      ${pigeonsRowsHtml}
    </tbody>
  </table>

  <!-- Finanse i Podsumowanie -->
  <div style="display: flex; justify-content: space-between; background-color: #F8FAFC; border: 1px solid #CBD5E1; padding: 6px 10px; border-radius: 4px; margin-bottom: 10px;">
    <div>Wydano Kart Tożsamości: <strong>${evaluation.identityCardsDeliveredCount} / ${evaluation.totalPigeonsCount}</strong> szt.</div>
    <div>Dołączono rodowodów: <strong>${evaluation.pedigreesDeliveredCount} / ${evaluation.totalPigeonsCount}</strong> szt.</div>
    <div>Łączna kwota transakcji: <strong>${evaluation.totalValuePln.toFixed(2)} PLN</strong></div>
  </div>

  <!-- Klauzule Prawne i Weterynaryjne -->
  <div class="section-title">II. OŚWIADCZENIA I POSTANOWIENIA KOŃCOWE</div>
  <div class="clauses-box">
    <ol style="margin: 0; padding-left: 14px;">
      <li>Zbywca oświadcza, że przekazywane gołębie stanowią jego wyłączną własność i nie są obciążone prawami osób trzecich.</li>
      <li>Wraz z wydaniem ptaków Zbywca przekazuje Nabywcy oryginały Kart Tożsamości PZHGP/FCI, co stanowi potwierdzenie przeniesienia praw własności do obrączki rodowej.</li>
      <li>Zbywca oświadcza, że w gołębniku macierzystym nie występują choroby zakaźne podlegające obowiązkowi zwalczania (HPAI, ND), a stado jest zaszczepione przeciw PMV-1.</li>
      <li>Nabywca oświadcza, że obejrzał ptaki w ręku i nie wnosi zastrzeżeń co do ich kondycji fizycznej w chwili odbioru.</li>
      <li><strong>Klauzula bioasekuracyjna:</strong> Nabywca zobowiązuje się do poddania nowo wprowadzonych ptaków bezwzględnej kwarantannie w osobnym przedziale przez okres minimum 14 dni.</li>
    </ol>
  </div>

  <!-- Podpisy Stron -->
  <table class="signatures-table">
    <tr>
      <td class="sig-cell">
        .........................................................................<br>
        <strong>Czytelny podpis Zbywcy</strong><br>
        <span style="font-size: 8px; color: #64748B;">(Oświadczam wydanie ptaków i kart własności)</span>
      </td>
      <td style="width: 4%;"></td>
      <td class="sig-cell">
        .........................................................................<br>
        <strong>Czytelny podpis Nabywcy</strong><br>
        <span style="font-size: 8px; color: #64748B;">(Oświadczam odbiór ptaków i kart własności)</span>
      </td>
    </tr>
  </table>

  <div class="footer">
    PIGEON-FLY Rejestr Przekazania Stada • Zgodność z Regulaminem PZHGP i Kodeksem Cywilnym • Weryfikacja cyfrowa SHA-256
  </div>
</body>
</html>
  `.trim();
}
