/**
 * PIGEON-FLY — Stud & Champion Pigeon Lease Agreement Engine (Z-081 / DEC-95)
 * Formal legal and breeding contract between fanciers:
 * - Leased breeding/racing pigeon identification and valuation
 * - Offspring sharing models (alternating clutches, 50/50 split, fixed fee)
 * - Pedigree & ownership card retention (Właściciel zachowuje kartę tożsamości obrączki)
 * - Strict housing terms (ptak wyłącznie w celce rozpłodowej — bezwzględny zakaz wolnych oblatów)
 * - Veterinary clearance & PIW autopsy obligation on casualty
 */

export type OffspringSharingModel =
  | 'alternating_clutches' // Lęgi naprzemienne: Lęg 1 i 3 dla Właściciela, Lęg 2 i 4 dla Dzierżawcy
  | 'equal_split_per_clutch' // Po 1 młodym z każdego lęgu (naprzemienny pierwszy wybór)
  | 'all_to_lessee_fixed_fee' // Wszystkie pisklęta dla Dzierżawcy w zamian za opłatę
  | 'custom_terms'; // Indywidualny podział piskląt

export interface LeasePartyDetails {
  fullName: string;
  pzhgpMemberNumber: string; // np. "0284-1420"
  branchSection: string; // np. "Oddział 0284 Gostyń, Sekcja 1"
  address: string;
  phone: string;
  email?: string;
}

export interface LeasePigeonDetails {
  ringNumber: string; // np. "PL-0284-23-1402"
  pedigreeName?: string; // np. "Błękitny As"
  sex: 'cock' | 'hen';
  birthYear: number;
  plumageColor: string; // np. "Niebieski nakrapiany"
  strain: string; // np. "Koopman / Gaby Vandenabeele"
  chipRingNumber?: string; // Nr chipa elektronicznego ESK
  estimatedValuePln: number; // Szacunkowa wartość rynkowa / ubezpieczeniowa
}

export interface StudLeaseAgreementRecord {
  id: string;
  contractNumber: string; // np. "DZIERZ-2026/001"
  agreementDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  lessor: LeasePartyDetails; // Właściciel / Użyczający
  lessee: LeasePartyDetails; // Dzierżawca / Biorący w użyczenie
  pigeon: LeasePigeonDetails;
  offspringSharingModel: OffspringSharingModel;
  offspringSharingNotes?: string;
  leaseFeePln?: number; // Opłata dzierżawna (0 jeśli bezpłatne użyczenie)
  strictHousingClause: boolean; // Zakaz wypuszczania z gołębnika (wyłącznie cela rozpłodowa i woliera)
  ringCardsRetainedByLessor: boolean; // Karty własności obrączek pozostają u właściciela
  veterinaryClearanceConfirmed: boolean; // Potwierdzenie aktualnego szczepienia PMV-1 i braku pasożytów
  autopsyRequiredOnCasualty: boolean; // Obowiązkowa sekcja zwłok PIW w przypadku zgonu
  quarantineReturnRequired: boolean; // 21-dniowa kwarantanna po powrocie do gołębnika macierzystego
  specialConditions?: string[];
  isSigned: boolean;
}

export interface AgreementValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  offspringModelLabel: string;
}

/**
 * Validates stud lease agreement completeness and legal soundness.
 */
export function validateStudLeaseAgreement(
  agreement: StudLeaseAgreementRecord
): AgreementValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!agreement.lessor.fullName || !agreement.lessor.pzhgpMemberNumber) {
    errors.push('Brak pełnych danych identyfikacyjnych Właściciela (Użyczającego).');
  }
  if (!agreement.lessee.fullName || !agreement.lessee.pzhgpMemberNumber) {
    errors.push('Brak pełnych danych identyfikacyjnych Dzierżawcy (Biorącego w użyczenie).');
  }
  if (!agreement.pigeon.ringNumber) {
    errors.push('Brak numeru obrączki rodowej przekazywanego ptaka.');
  }
  if (agreement.pigeon.estimatedValuePln <= 0) {
    warnings.push('Wartość szacunkowa ptaka nie została zdefiniowana (zalecana na wypadek odszkodowania).');
  }
  if (!agreement.strictHousingClause) {
    errors.push('Krytyczny brak klauzuli zakazu wypuszczania ptaka na wolne obloty!');
  }
  if (!agreement.ringCardsRetainedByLessor) {
    warnings.push('Karta tożsamości obrączki powinna bezwzględnie pozostać w depozycie Właściciela.');
  }
  if (!agreement.autopsyRequiredOnCasualty) {
    warnings.push('Brak wymogu urzędowej sekcji zwłok (PIW) w przypadku padnięcia ptaka.');
  }

  let offspringModelLabel = 'Lęgi naprzemienne (Lęg 1/3 Właściciel, Lęg 2/4 Dzierżawca)';
  if (agreement.offspringSharingModel === 'equal_split_per_clutch') {
    offspringModelLabel = 'Równy podział lęgów (po 1 młodym z pary, naprzemienny 1. wybór)';
  } else if (agreement.offspringSharingModel === 'all_to_lessee_fixed_fee') {
    offspringModelLabel = 'Wszystkie pisklęta dla Dzierżawcy (stała opłata dzierżawna)';
  } else if (agreement.offspringSharingModel === 'custom_terms') {
    offspringModelLabel = 'Warunki indywidualne ustalone w załączniku';
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    offspringModelLabel,
  };
}

/**
 * Generates official A4 Stud Pigeon Lease Agreement HTML.
 */
export function generateStudLeaseAgreementHtml(
  agreement: StudLeaseAgreementRecord
): string {
  const val = validateStudLeaseAgreement(agreement);
  const p = agreement.pigeon;
  const l = agreement.lessor;
  const d = agreement.lessee;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Umowa Dzierżawy Rozpłodowej Gołębia — ${agreement.contractNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.4;
      font-size: 9pt;
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
    .title { font-size: 14pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 8.5pt; color: #475569; margin-top: 2px; }
    .contract-nr { font-size: 10pt; font-weight: 800; color: #0369a1; text-align: right; }
    .parties-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .parties-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      vertical-align: top;
      width: 50%;
    }
    .party-title {
      font-weight: 800;
      text-transform: uppercase;
      font-size: 8.5pt;
      color: #0f172a;
      background: #f8fafc;
      padding-bottom: 4px;
      margin-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
    }
    .pigeon-box {
      border: 1.5px solid #0284c7;
      background: #f0f9ff;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 12px;
    }
    .pigeon-title {
      font-size: 11pt;
      font-weight: 900;
      color: #0369a1;
      margin-bottom: 4px;
    }
    .pigeon-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      font-size: 8.5pt;
    }
    .section-title {
      font-size: 9.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      margin-top: 10px;
      margin-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
    }
    .clauses-list {
      margin: 0;
      padding-left: 18px;
      font-size: 8.5pt;
      color: #334155;
      line-height: 1.35;
    }
    .clauses-list li {
      margin-bottom: 4px;
    }
    .highlight-clause {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      padding: 4px 8px;
      margin: 4px 0;
      font-weight: 600;
    }
    .signs-grid {
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
    }
    .sign-col {
      width: 220px;
      border-top: 1px dashed #64748b;
      text-align: center;
      font-size: 8pt;
      padding-top: 4px;
      color: #475569;
    }
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
      <div class="title">Umowa Dzierżawy i Użyczenia Rozpłodowego</div>
      <div class="subtitle">Standard PZHGP / FCI — Regulacja Własności i Podziału Przyrostu Naturalnego (Z-081)</div>
    </div>
    <div>
      <div class="contract-nr">Nr: ${agreement.contractNumber}</div>
      <div style="font-size: 8pt; color: #64748b; text-align: right;">Data: ${agreement.agreementDate}</div>
    </div>
  </div>

  <table class="parties-table">
    <tr>
      <td>
        <div class="party-title">WŁAŚCICIEL (UŻYCZAJĄCY)</div>
        <div><strong>${l.fullName}</strong></div>
        <div>Nr PZHGP: <strong>${l.pzhgpMemberNumber}</strong></div>
        <div>${l.branchSection}</div>
        <div>Adres: ${l.address}</div>
        <div>Tel: ${l.phone}</div>
      </td>
      <td>
        <div class="party-title">DZIERŻAWCA (BIORĄCY W UŻYCZENIE)</div>
        <div><strong>${d.fullName}</strong></div>
        <div>Nr PZHGP: <strong>${d.pzhgpMemberNumber}</strong></div>
        <div>${d.branchSection}</div>
        <div>Adres: ${d.address}</div>
        <div>Tel: ${d.phone}</div>
      </td>
    </tr>
  </table>

  <div class="pigeon-box">
    <div class="pigeon-title">Przedmiot Umowy: ${p.ringNumber} ${p.pedigreeName ? `("${p.pedigreeName}")` : ''}</div>
    <div class="pigeon-grid">
      <div>Płeć: <strong>${p.sex === 'cock' ? 'Samiec 1.0' : 'Samica 0.1'}</strong></div>
      <div>Rocznik: <strong>${p.birthYear}</strong></div>
      <div>Barwa: <strong>${p.plumageColor}</strong></div>
      <div>Szczep / Linia: <strong>${p.strain}</strong></div>
      <div>Wartość Ubezpieczeniowa: <strong>${p.estimatedValuePln} PLN</strong></div>
      <div>Okres Dzierżawy: <strong>${agreement.startDate} do ${agreement.endDate}</strong></div>
    </div>
  </div>

  <div class="section-title">§ 1. Warunki Bytowe i Bezwzględny Zakaz Oblotów</div>
  <ol class="clauses-list">
    <li class="highlight-clause">
      Biorący w użyczenie zobowiązuje się do utrzymywania ptaka WYŁĄCZNIE w celi rozpłodowej lub zabezpieczonej wolierze. Obowiązuje bezwzględny ZAKAZ wypuszczania gołębia na otwarte obloty wokół gołębnika pod rygorem pełnej odpowiedzialności odszkodowawczej.
    </li>
    <li>
      Biorący w użyczenie zapewnia gołębiowi pełnowartościową karmę rozpłodową, stały dostęp do świeżej wody, gritu mineralnego oraz optymalne warunki zoohigieniczne i mikroklimatyczne.
    </li>
  </ol>

  <div class="section-title">§ 2. Zasady Podziału Potomstwa (Piskląt)</div>
  <ol class="clauses-list">
    <li>
      Strony ustalają następujący model podziału przyrostu naturalnego: <strong>${val.offspringModelLabel}</strong>.
    </li>
    ${agreement.offspringSharingNotes ? `<li>Szczegóły podziału: <em>${agreement.offspringSharingNotes}</em></li>` : ''}
    <li>
      Obrączki rodowe dla piskląt przypadających danej stronie zapewnia strona uprawniona do odbioru danego potomka.
    </li>
    <li>
      Oryginał karty tożsamości obrączki rodowej oraz oryginał rodowodu ptaka pozostają bezwzględnie w depozycie Właściciela.
    </li>
  </ol>

  <div class="section-title">§ 3. Zdrowie, Padnięcie i Odpowiedzialność</div>
  <ol class="clauses-list">
    <li>
      Użyczający oświadcza, że gołąb posiada aktualne, ważne szczepienie przeciwko PMV-1 (paramyksowiroza) i jest wolny od inwazji pasożytniczych.
    </li>
    <li>
      W przypadku nagłego zachorowania Biorący w użyczenie zobowiązany jest do natychmiastowego powiadomienia Właściciela i wdrożenia leczenia pod nadzorem lekarza weterynarii.
    </li>
    <li>
      W przypadku padnięcia ptaka, Biorący w użyczenie ma obowiązek zabezpieczyć zwłoki w chłodni i poddać je urzędowej sekcji zwłok (autopsji) w Państwowym Instytucie Weterynaryjnym (PIW) lub uprawnionej lecznicy celem wykluczenia rażącego zaniedbania.
    </li>
    <li>
      Po zakończeniu okresu dzierżawy ptak wraca do Właściciela i podlega obowiązkowej 21-dniowej kwarantannie izolacyjnej.
    </li>
  </ol>

  <div class="signs-grid">
    <div class="sign-col">
      <div>........................................................</div>
      <strong>Właściciel (Użyczający)</strong>
      <div style="font-size: 7.5pt; margin-top: 2px;">(Czytelny podpis)</div>
    </div>
    <div class="sign-col">
      <div>........................................................</div>
      <strong>Dzierżawca (Biorący w użyczenie)</strong>
      <div style="font-size: 7.5pt; margin-top: 2px;">(Czytelny podpis)</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Umowa Użyczenia i Dzierżawy Rozpłodowej Z-081</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
