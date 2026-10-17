/**
 * PIGEON-FLY — Ewidencja Błąkaczy i Kwarantanna Obcych Ptaków (Found Pigeon Registry)
 * Zgodność z Regulaminem PZHGP oraz wytycznymi PIW w zakresie bioasekuracji:
 * - Dekodowanie obrączek krajowych (PZHGP) i zagranicznych (DV, BE/BELG, NL, CZ, SK, RO, HU).
 * - Ścisła kwarantanna sanitarna w izolatce (ochrona stada przed PMV-1, salmonellą, ospą).
 * - Triaż kliniczny wycieńczenia, postępowanie elektrolitowo-odżywcze i ścieżka kontaktu z właścicielem.
 * - Generator urzędowego A4 Protokołu Zgłoszenia Błąkacza i Kwarantanny Zoohigienicznej.
 */

export type CountryCode =
  | 'PL'
  | 'DV'
  | 'BE'
  | 'NL'
  | 'CZ'
  | 'SK'
  | 'RO'
  | 'HU'
  | 'OTHER';

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  PL: 'Polska (PZHGP)',
  DV: 'Niemcy (Verband Deutscher Brieftaubenzüchter)',
  BE: 'Belgia (KBDB / RFCB)',
  NL: 'Holandia (NPO - Nederlandse Postduivenhouders Organisatie)',
  CZ: 'Czechy (ČMSSKHP)',
  SK: 'Słowacja (SZCHPH)',
  RO: 'Rumunia (FNCPR)',
  HU: 'Węgry (MBSZ)',
  OTHER: 'Inna federacja zagraniczna (FCI)',
};

export type FoundPigeonStatus =
  | 'in_quarantine'
  | 'owner_contacted'
  | 'repatriated_to_owner'
  | 'released_after_recovery'
  | 'adopted_with_transfer'
  | 'deceased_in_isolation';

export const FOUND_STATUS_LABELS: Record<FoundPigeonStatus, string> = {
  in_quarantine: 'W izolatce (kwarantanna sanitarna)',
  owner_contacted: 'Właściciel zidentyfikowany i powiadomiony',
  repatriated_to_owner: 'Zwrócony właścicielowi (odbiór / kurier)',
  released_after_recovery: 'Wypuszczony po odkarmieniu w sprzyjającej pogodzie',
  adopted_with_transfer: 'Zaadoptowany za pisemną zgodą właściciela',
  deceased_in_isolation: 'Padł w izolatce z wycieńczenia / obrażeń',
};

export type ExhaustionLevel = 'mild' | 'moderate' | 'severe' | 'critical';

export const EXHAUSTION_LABELS: Record<ExhaustionLevel, string> = {
  mild: 'Lekkie zmęczenie (odpoczynek 24h, pobiera karmę)',
  moderate: 'Umiarkowane wycieńczenie (zapadnięte wole, suchość błon śluzowych)',
  severe: 'Ciężkie wycieńczenie (ostry mostek, kacheksja, ataksja)',
  critical: 'Stan krytyczny (hipotermia, niezdolność do stania, zasinienie woskówki)',
};

export type ClinicalSymptom =
  | 'healthy_tired'
  | 'severe_dehydration'
  | 'emaciation_keel'
  | 'wing_droop'
  | 'crop_stasis'
  | 'diarrhea'
  | 'predator_wound'
  | 'pox_lesions';

export const SYMPTOM_LABELS: Record<ClinicalSymptom, string> = {
  healthy_tired: 'Brak objawów chorobowych — tylko zmęczenie',
  severe_dehydration: 'Głębokie odwodnienie ustroju',
  emaciation_keel: 'Ostry grzebień mostka (spalona tkanka mięśniowa)',
  wing_droop: 'Opadnięte skrzydło / naderwanie więzadeł',
  crop_stasis: 'Zaleganie płynu w wolu / zarzucanie wola',
  diarrhea: 'Wodnista lub śluzowata biegunka (podejrzenie paratyfusu/kokcydiozy)',
  predator_wound: 'Rany szarpane po ataku jastrzębia / sokoła',
  pox_lesions: 'Zmiany ospowe na powiekach / woskówce (kwarantanna bezwzględna)',
};

export interface FoundPigeonEntry {
  id: string;
  ringNumber: string;
  countryCode: CountryCode;
  foreignFederationName?: string;
  discoveryDate: string; // YYYY-MM-DD
  discoveryTime: string; // HH:mm
  finderName: string;
  finderPhone: string;
  finderLoftAddress: string;
  finderBranch: string;
  quarantineCageNumber: string;
  status: FoundPigeonStatus;
  exhaustionLevel: ExhaustionLevel;
  plumageColor: string;
  sex: 'cock' | 'hen' | 'unknown';
  electronicChipCode?: string;
  symptoms: ClinicalSymptom[];
  treatmentGiven: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerBranch?: string;
  contactMethod?: 'pzhgp_portal' | 'phone_call' | 'sms' | 'social_media' | 'unidentified';
  repatriationCostPln?: number;
  resolutionDate?: string;
  notes?: string;
}

export interface FoundPigeonValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FoundPigeonsStats {
  total: number;
  inQuarantine: number;
  ownerContacted: number;
  repatriated: number;
  released: number;
  foreignCount: number;
  criticalCount: number;
}

/**
 * Automatycznie dekoduje kod kraju i federację na podstawie numeru obrączki.
 */
export function decodeRingCountry(ring: string): {
  countryCode: CountryCode;
  federationName: string;
  isForeign: boolean;
} {
  const clean = ring.trim().toUpperCase();

  if (clean.startsWith('PL') || clean.startsWith('POLSKA')) {
    return { countryCode: 'PL', federationName: COUNTRY_NAMES.PL, isForeign: false };
  }
  if (clean.startsWith('DV') || clean.startsWith('GER') || clean.startsWith('DE')) {
    return { countryCode: 'DV', federationName: COUNTRY_NAMES.DV, isForeign: true };
  }
  if (clean.startsWith('BE') || clean.startsWith('BELG')) {
    return { countryCode: 'BE', federationName: COUNTRY_NAMES.BE, isForeign: true };
  }
  if (clean.startsWith('NL')) {
    return { countryCode: 'NL', federationName: COUNTRY_NAMES.NL, isForeign: true };
  }
  if (clean.startsWith('CZ')) {
    return { countryCode: 'CZ', federationName: COUNTRY_NAMES.CZ, isForeign: true };
  }
  if (clean.startsWith('SK')) {
    return { countryCode: 'SK', federationName: COUNTRY_NAMES.SK, isForeign: true };
  }
  if (clean.startsWith('RO')) {
    return { countryCode: 'RO', federationName: COUNTRY_NAMES.RO, isForeign: true };
  }
  if (clean.startsWith('HU')) {
    return { countryCode: 'HU', federationName: COUNTRY_NAMES.HU, isForeign: true };
  }

  return { countryCode: 'OTHER', federationName: COUNTRY_NAMES.OTHER, isForeign: true };
}

/**
 * Waliduje wpis w rejestrze błąkaczy.
 */
export function validateFoundPigeonEntry(entry: FoundPigeonEntry): FoundPigeonValidationResult {
  const errors: string[] = [];

  if (!entry.ringNumber || entry.ringNumber.trim().length < 4) {
    errors.push('Wymagany jest pełny numer obrączki rodowej znalezionego ptaka.');
  }

  if (!entry.discoveryDate) {
    errors.push('Wymagana jest data przybicia / znalezienia ptaka.');
  }

  if (!entry.finderName || entry.finderName.trim().length < 3) {
    errors.push('Wymagane jest imię i nazwisko hodowcy-znalazcy.');
  }

  if (!entry.finderPhone || entry.finderPhone.trim().length < 6) {
    errors.push('Wymagany jest numer telefonu kontaktowego znalazcy.');
  }

  if (!entry.quarantineCageNumber || entry.quarantineCageNumber.trim().length === 0) {
    errors.push('Wymagany jest numer klatki izolacyjnej (wymóg bioasekuracji PIW).');
  }

  if (entry.status === 'repatriated_to_owner' && (!entry.ownerName || entry.ownerName.trim().length < 3)) {
    errors.push('Dla statusu zwrotu do właściciela wymagane jest nazwisko właściciela.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Oblicza syntetyczne statystyki błąkaczy w gołębniku / sekcji.
 */
export function calculateFoundPigeonsStats(entries: FoundPigeonEntry[]): FoundPigeonsStats {
  let inQuarantine = 0;
  let ownerContacted = 0;
  let repatriated = 0;
  let released = 0;
  let foreignCount = 0;
  let criticalCount = 0;

  entries.forEach((e) => {
    if (e.status === 'in_quarantine') inQuarantine++;
    if (e.status === 'owner_contacted') ownerContacted++;
    if (e.status === 'repatriated_to_owner') repatriated++;
    if (e.status === 'released_after_recovery') released++;
    if (e.countryCode !== 'PL') foreignCount++;
    if (e.exhaustionLevel === 'critical' || e.exhaustionLevel === 'severe') criticalCount++;
  });

  return {
    total: entries.length,
    inQuarantine,
    ownerContacted,
    repatriated,
    released,
    foreignCount,
    criticalCount,
  };
}

/**
 * Generuje urzędowy dokument A4 HTML Protokołu Kwarantanny i Zgłoszenia Błąkacza.
 */
export function generateFoundPigeonProtocolHtml(entry: FoundPigeonEntry): string {
  const isForeign = entry.countryCode !== 'PL';

  const symptomsList =
    entry.symptoms && entry.symptoms.length > 0
      ? entry.symptoms.map((s) => `<li>${SYMPTOM_LABELS[s]}</li>`).join('')
      : '<li>Brak uchwytnych objawów chorobowych.</li>';

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Karta Błąkacza - ${entry.ringNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #0f172a;
      line-height: 1.35;
      margin: 0;
      padding: 0;
    }
    .header-box {
      border: 2px solid ${isForeign ? '#2563eb' : '#059669'};
      background-color: ${isForeign ? '#eff6ff' : '#ecfdf5'};
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      text-align: center;
    }
    .header-title {
      font-size: 13pt;
      font-weight: 900;
      color: ${isForeign ? '#1e40af' : '#065f46'};
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .header-sub {
      font-size: 8.5pt;
      font-weight: bold;
      color: #475569;
    }
    .ring-banner {
      background-color: #0f172a;
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ring-code {
      font-family: monospace;
      font-size: 14pt;
      font-weight: 900;
      letter-spacing: 1px;
      color: #38bdf8;
    }
    .status-badge {
      font-size: 8.5pt;
      font-weight: bold;
      background-color: #334155;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .section-card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      margin-bottom: 10px;
      background-color: #f8fafc;
    }
    .section-title {
      font-size: 9pt;
      font-weight: 900;
      color: #1e3a8a;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 6px;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
    }
    .grid-table td {
      padding: 3px 4px;
      font-size: 8.5pt;
    }
    .label {
      font-weight: bold;
      color: #475569;
    }
    .val {
      font-weight: bold;
      color: #0f172a;
    }
    .bio-warning {
      border: 1.5px solid #dc2626;
      background-color: #fef2f2;
      border-radius: 4px;
      padding: 8px 10px;
      margin-bottom: 10px;
      font-size: 8.5pt;
    }
    .bio-title {
      font-weight: 900;
      color: #b91c1c;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    .sig-cell {
      width: 50%;
      text-align: center;
      vertical-align: top;
      padding: 0 16px;
    }
    .sig-line {
      border-bottom: 1px dashed #0f172a;
      height: 38px;
      margin-bottom: 4px;
    }
    .sig-desc {
      font-size: 7.5pt;
      color: #475569;
    }
  </style>
</head>
<body>

  <div class="header-box">
    <div class="header-title">PROTOKÓŁ PRZYJĘCIA BŁĄKACZA &amp; KARTA KWARANTANNY</div>
    <div class="header-sub">Procedura Rejestracji Zagubionych Gołębi Pocztowych PZHGP / FCI • Wymogi Sanitarne PIW</div>
  </div>

  <div class="ring-banner">
    <div>
      <span style="font-size: 9pt; color: #94a3b8;">NUMER OBRĄCZKI: </span>
      <span class="ring-code">${entry.ringNumber}</span>
    </div>
    <div class="status-badge">${FOUND_STATUS_LABELS[entry.status]}</div>
  </div>

  <!-- BIOASEKURACJA I IZOLACJA -->
  <div class="bio-warning">
    <div class="bio-title">🛡️ Klauzula Bioasekuracji Sanitarnej (PIW)</div>
    Obcy ptak o nieznanym statusie epizootycznym został umieszczony w klatce izolacyjnej <strong>Nr ${entry.quarantineCageNumber}</strong>. Obowiązuje bezwzględny zakaz bezpośredniego kontaktu z lotnikami stada podstawowego przez minimum 7 dni. Zapewniono osobne poidło i karmnik celkowy.
  </div>

  <!-- 1. IDENTYFIKACJA PTAKA I FEDERACJI -->
  <div class="section-card">
    <div class="section-title">1. Identyfikacja Ptaka i Przynależność Federacyjna</div>
    <table class="grid-table">
      <tr>
        <td style="width: 20%;" class="label">Kraj / Federacja:</td>
        <td style="width: 30%;" class="val">${COUNTRY_NAMES[entry.countryCode]}</td>
        <td style="width: 20%;" class="label">Płeć / Barwa:</td>
        <td style="width: 30%;" class="val">${entry.sex === 'cock' ? '1.0 ♂' : entry.sex === 'hen' ? '0.1 ♀' : 'Nieokreślona'} • ${entry.plumageColor}</td>
      </tr>
      <tr>
        <td class="label">Chip elektroniczny:</td>
        <td class="val" style="font-family: monospace;">${entry.electronicChipCode || 'Brak chipa'}</td>
        <td class="label">Data i godzina przybicia:</td>
        <td class="val">${entry.discoveryDate} o godz. ${entry.discoveryTime}</td>
      </tr>
      <tr>
        <td class="label">Poziom wycieńczenia:</td>
        <td class="val" style="color: ${entry.exhaustionLevel === 'critical' ? '#dc2626' : '#0f172a'};">${EXHAUSTION_LABELS[entry.exhaustionLevel]}</td>
        <td class="label">Klatka w izolatce:</td>
        <td class="val" style="color: #2563eb;">Klatka Izolacyjna ${entry.quarantineCageNumber}</td>
      </tr>
    </table>
  </div>

  <!-- 2. TRIAŻ KLINICZNY I POSTĘPOWANIE -->
  <div class="section-card">
    <div class="section-title">2. Triaż Zdrowotny i Zastosowane Postępowanie Regeneracyjne</div>
    <table class="grid-table">
      <tr>
        <td style="width: 25%; vertical-align: top;" class="label">Stwierdzone objawy:</td>
        <td colspan="3" class="val">
          <ul style="margin: 0; padding-left: 16px;">
            ${symptomsList}
          </ul>
        </td>
      </tr>
      <tr>
        <td class="label" style="vertical-align: top;">Zastosowana kuracja:</td>
        <td colspan="3" class="val">${entry.treatmentGiven || 'Odpoczynek, poidło elektrolitowe, karma regeneracyjna.'}</td>
      </tr>
    </table>
  </div>

  <!-- 3. DANE ZNALAZCY I WŁAŚCICIELA -->
  <div class="section-card">
    <div class="section-title">3. Dane Znalazcy i Status Kontaktu z Właścicielem</div>
    <table class="grid-table">
      <tr>
        <td style="width: 20%;" class="label">Znalazca (Hodowca):</td>
        <td style="width: 30%;" class="val">${entry.finderName} (Tel: ${entry.finderPhone})</td>
        <td style="width: 20%;" class="label">Gołębnik znalazcy:</td>
        <td style="width: 30%;" class="val">${entry.finderBranch} • ${entry.finderLoftAddress}</td>
      </tr>
      <tr>
        <td class="label">Właściciel ptaka:</td>
        <td class="val">${entry.ownerName ? `${entry.ownerName} (${entry.ownerBranch || 'Brak danych'})` : 'Oczekuje na identyfikację w bazie PZHGP / FCI'}</td>
        <td class="label">Telefon właściciela:</td>
        <td class="val">${entry.ownerPhone || 'Brak kontaktu'}</td>
      </tr>
      <tr>
        <td class="label">Sposób zgłoszenia:</td>
        <td class="val">${entry.contactMethod === 'pzhgp_portal' ? 'Baza Błąkaczy PZHGP' : entry.contactMethod === 'phone_call' ? 'Telefon bezpośredni' : entry.contactMethod === 'sms' ? 'Wiadomość SMS' : 'W toku weryfikacji'}</td>
        <td class="label">Data zakończenia sprawy:</td>
        <td class="val">${entry.resolutionDate || 'W toku kwarantanny'}</td>
      </tr>
      ${
        entry.notes
          ? `
      <tr>
        <td class="label">Uwagi i adnotacje:</td>
        <td colspan="3" class="val" style="font-style: italic;">${entry.notes}</td>
      </tr>
      `
          : ''
      }
    </table>
  </div>

  <!-- PODPISY -->
  <table class="signatures-table">
    <tr>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8.5pt;">Podpis Znalazcy (Opiekuna Izolatki)</div>
        <div class="sig-desc">${entry.finderName}</div>
      </td>
      <td class="sig-cell">
        <div class="sig-line"></div>
        <div style="font-weight: bold; font-size: 8.5pt;">Właściciel / Delegat Sekcji ds. Błąkaczy</div>
        <div class="sig-desc">Potwierdzenie zgłoszenia / odbioru ptaka</div>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}
