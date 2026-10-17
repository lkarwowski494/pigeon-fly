/**
 * PIGEON-FLY — Generator Protokołu Wyrywkowej Kontroli Antydopingowej (Z-093 / DEC-107)
 * Procedura pobierania prób biologicznych FCI i PZHGP (FCI Prohibited Substances Sampling Protocol):
 * - Losowanie i typowanie ptaków do kontroli (koszowanie, punkt przylotu, wystawa ogólnopolska, audyt).
 * - Rodzaje prób biologicznych: odchody świeże (feces pool), wymaz/płukanie wola, wymaz z kloaki, krew obwodowa.
 * - Procedura łańcucha dowodowego (Chain of Custody):
 *   * Podział próby: Próbka A (badanie główne) + Próbka B (kontrpróbka depozytowa).
 *   * Bezpieczne plomby jednorazowe z kodem kreskowym (Tamper-Evident Barcode Seals).
 *   * Warunki termiczne transportu (izotermiczny pojemnik chłodniczy +4°C).
 * - Weryfikacja obecności hodowcy podczas plombowania i oświadczenie o braku zastrzeżeń.
 * - Urzędowy Protokół Pobrania Prób A4 HTML/PDF dla laboratorium FCI (Gandawa / IES Kraków / PIW-PIB).
 */

import { Sex } from './types';

export type AntidopingSampleEvent =
  | 'race_basketing'
  | 'race_arrival'
  | 'national_exhibition'
  | 'unannounced_loft_audit';

export type AntidopingSampleType =
  | 'feces_pool'
  | 'crop_lavage'
  | 'cloacal_swab'
  | 'blood_serum'
  | 'feather_matrix';

export interface PigeonSamplingIdentity {
  ringNumber: string; // np. "PL-0284-23-1402"
  sex: Sex; // 'cock' | 'hen' | 'unknown'
  plumageColor: string; // np. "Niebieski"
  electronicChipSerial?: string; // np. "CHIP-99014"
  concourseArrivalOrder?: number; // np. 1. na liście
}

export interface AntidopingSamplingData {
  protocolNumber: string; // np. "DOP-FCI-2026/007"
  samplingDate: string; // YYYY-MM-DD
  samplingTime: string; // HH:mm
  event: AntidopingSampleEvent;
  eventName: string; // np. "Lot Narodowy Bruksela (980 km)"
  samplingLocation: string; // np. "Punkt Koszowania Poznań Wilda" / "Gołębnik hodowcy"
  pigeon: PigeonSamplingIdentity;
  breederName: string;
  breederPzhgpNumber: string;
  sampleType: AntidopingSampleType;
  sampleASerial: string; // np. "FCI-A-89104"
  sampleBSerial: string; // np. "FCI-B-89105"
  tamperEvidentSealIntact: boolean;
  storageTemperatureCelsius: number; // np. 4
  transportContainerSerial: string; // np. "COOL-FCI-03"
  targetLaboratory: string; // np. "Ghent University Anti-Doping Lab (Ghent, Belgium)"
  fciInspectorName: string; // Delegat Komisji Antydopingowej
  veterinarianName: string; // Lekarz weterynarii pobierający próbkę
  vetLicenseNumber: string; // Nr PWZW lekarza
  breederWitnessName: string; // Świadek hodowcy / hodowca
  breederPresentDuringSealing: boolean;
  breederObjections: string; // np. "Brak zastrzeżeń do procedury pobrania i plombowania"
  notes?: string;
}

export const SAMPLE_EVENT_LABELS: Record<AntidopingSampleEvent, string> = {
  race_basketing: 'Koszowanie przed lotem konkursowym (Punkt wkładania)',
  race_arrival: 'Kontrola przylotowa bezpośrednio po locie (Gołębnik)',
  national_exhibition: 'Wystawa Ogólnopolska / Okręgowa PZHGP & FCI',
  unannounced_loft_audit: 'Niezapowiedziana kontrola antydopingowa w gołębniku',
};

export const SAMPLE_TYPE_LABELS: Record<AntidopingSampleType, string> = {
  feces_pool: 'Zbiorcza świeża próbka kału z klatki jednostkowej (folia sterylna)',
  crop_lavage: 'Płukanie wola / wymaz z gardzieli (sonda sterylna)',
  cloacal_swab: 'Głęboki wymaz z kloaki (sterylna wymazówka transportowa)',
  blood_serum: 'Krew obwodowa z żyły skrzydłowej (probówka EDTA / skrzepowa)',
  feather_matrix: 'Pióra lotowe (badanie depozytowe matrycy keratynowej)',
};

/**
 * Validates mandatory fields and chain of custody constraints for official FCI anti-doping protocol.
 */
export function validateAntidopingSampling(data: AntidopingSamplingData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.protocolNumber || !data.protocolNumber.trim()) {
    errors.push('Brak numeru protokołu antydopingowego!');
  }
  if (!data.samplingDate) {
    errors.push('Brak daty pobrania próbek biologicznych!');
  }
  if (!data.pigeon.ringNumber || !data.pigeon.ringNumber.trim()) {
    errors.push('Brak numeru obrączki rodowej badanego gołębia!');
  }
  if (!data.breederName || !data.breederName.trim()) {
    errors.push('Brak nazwiska hodowcy!');
  }
  if (!data.sampleASerial || !data.sampleASerial.trim()) {
    errors.push('Brak numeru plomby bezpiecznej Próbki A!');
  }
  if (!data.sampleBSerial || !data.sampleBSerial.trim()) {
    errors.push('Brak numeru plomby bezpiecznej Próbki B (kontrpróbka)!');
  }
  if (data.sampleASerial === data.sampleBSerial) {
    errors.push('Numery plomb Próbki A i Próbki B muszą być unikalne!');
  }
  if (!data.veterinarianName || !data.veterinarianName.trim()) {
    errors.push('Brak nazwiska lekarza weterynarii pobierającego próbkę!');
  }
  if (!data.vetLicenseNumber || !data.vetLicenseNumber.trim()) {
    errors.push('Brak numeru PWZW lekarza weterynarii!');
  }
  if (!data.fciInspectorName || !data.fciInspectorName.trim()) {
    errors.push('Brak nazwiska delegata ds. antydopingu PZHGP/FCI!');
  }
  if (!data.breederPresentDuringSealing) {
    errors.push('Wymagana jest obecność hodowcy lub upoważnionego świadka przy plombowaniu prób!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates official A4 Printable HTML Anti-Doping Sampling Certificate.
 */
export function generateAntidopingSamplingHtml(data: AntidopingSamplingData): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Protokół Pobrania Prób Antydopingowych FCI — ${data.protocolNumber}</title>
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
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .banner-title { font-size: 11pt; font-weight: 900; color: #0f172a; }
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
      font-size: 8.5pt;
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

    .seals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .seal-box {
      border: 1.5px dashed #0284c7;
      border-radius: 6px;
      padding: 8px 12px;
      background: #f0f9ff;
      text-align: center;
    }
    .seal-label { font-size: 8pt; font-weight: 800; color: #0369a1; text-transform: uppercase; }
    .seal-code { font-size: 13pt; font-weight: 900; font-family: monospace; color: #0f172a; margin: 4px 0; }
    .seal-desc { font-size: 7.5pt; color: #64748b; }

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
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
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
      <div class="title">Protokół Pobrania Prób do Kontroli Antydopingowej</div>
      <div class="subtitle">Komisja Lekarsko-Dopingowa FCI & Regulamin Antydopingowy PZHGP (Z-093)</div>
    </div>
    <div class="meta">
      <div>Protokół Nr: <strong>${data.protocolNumber}</strong></div>
      <div>Data pobrania: <strong>${data.samplingDate}</strong>, godz. <strong>${data.samplingTime}</strong></div>
      <div>Laboratorium: <strong>${data.targetLaboratory}</strong></div>
    </div>
  </div>

  <div class="banner">
    <div>
      <div class="banner-title">Gołąb: ${data.pigeon.ringNumber}</div>
      <div class="banner-desc">
        Płeć: <strong>${data.pigeon.sex === 'cock' ? '1.0 Samiec' : data.pigeon.sex === 'hen' ? '0.1 Samica' : 'Nieznana'}</strong> • 
        Barwa: <strong>${data.pigeon.plumageColor}</strong> • 
        Chip ESK: <strong>${data.pigeon.electronicChipSerial || '—'}</strong>
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 7.5pt; color: #64748b;">Hodowca:</span><br>
      <strong style="font-size: 10pt; color: #0f172a;">${data.breederName}</strong> (${data.breederPzhgpNumber})
    </div>
  </div>

  <div class="grid-2">
    <!-- Okoliczności Pobrania -->
    <div class="card">
      <div class="card-title">1. OKOLICZNOŚCI I MIEJSCE KONTROLI</div>
      <div class="row">
        <span class="label">Okoliczność pobrania:</span>
        <span class="val">${SAMPLE_EVENT_LABELS[data.event]}</span>
      </div>
      <div class="row">
        <span class="label">Nazwa lotu / imprezy:</span>
        <span class="val">${data.eventName}</span>
      </div>
      <div class="row">
        <span class="label">Miejsce pobrania:</span>
        <span class="val">${data.samplingLocation}</span>
      </div>
      <div class="row">
        <span class="label">Materiał biologiczny:</span>
        <span class="val" style="color: #0369a1;">${SAMPLE_TYPE_LABELS[data.sampleType]}</span>
      </div>
    </div>

    <!-- Łańcuch Dowodowy -->
    <div class="card">
      <div class="card-title">2. ŁAŃCUCH DOWODOWY (CHAIN OF CUSTODY)</div>
      <div class="row">
        <span class="label">Pojemnik transportowy:</span>
        <span class="val" style="font-family: monospace;">${data.transportContainerSerial}</span>
      </div>
      <div class="row">
        <span class="label">Temperatura chłodzenia:</span>
        <span class="val">${data.storageTemperatureCelsius}°C (zabezpieczona)</span>
      </div>
      <div class="row">
        <span class="label">Plomby nienaruszone:</span>
        <span class="val" style="color: #166534;">${data.tamperEvidentSealIntact ? 'TAK (Zweryfikowane)' : 'NIE'}</span>
      </div>
      <div class="row">
        <span class="label">Obecność hodowcy przy plombowaniu:</span>
        <span class="val" style="color: #166534;">${data.breederPresentDuringSealing ? 'TAK (Obecny osobiście)' : 'NIE'}</span>
      </div>
    </div>
  </div>

  <div style="font-weight: 800; font-size: 9pt; margin-bottom: 2px;">
    3. NUMERY PLOMB BEZPIECZNYCH PRÓBKI A I B (TAMPER-EVIDENT SEALS):
  </div>
  <div class="seals-grid">
    <div class="seal-box">
      <div class="seal-label">PRÓBKA GŁÓWNA A (BADANIE PIERWSZE)</div>
      <div class="seal-code">${data.sampleASerial}</div>
      <div class="seal-desc">Przeznaczona do natychmiastowej analizy screeningowej w laboratorium FCI</div>
    </div>
    <div class="seal-box">
      <div class="seal-label">KONTRPRÓBKA B (DEPOZYT ROZSTRZYGAJĄCY)</div>
      <div class="seal-code">${data.sampleBSerial}</div>
      <div class="seal-desc">Zabezpieczona w chłodni laboratoryjnej do ewentualnego badania odwoławczego</div>
    </div>
  </div>

  <div class="notes-box">
    <strong>Oświadczenie Hodowcy / Świadka:</strong> ${data.breederObjections || 'Brak zastrzeżeń do procedury pobrania próby, pakowania i plombowania.'}
  </div>

  <div style="font-size: 7.5pt; color: #64748b; line-height: 1.35; margin-bottom: 12px;">
    Pobranie próbki biologicznej zrealizowano zgodnie z Kodeksem Antydopingowym FCI i regulaminem PZHGP.
    Próbka A i Próbka B zostały zapakowane w sterylne probówki, oklejone nierozerwalnymi plombami z kodem kreskowym
    i umieszczone w zaplombowanym pojemniku chłodniczym w obecności hodowcy.
  </div>

  <div class="signatures">
    <div class="sig-col">
      <div class="sig-title">Delegat ds. Antydopingu FCI/PZHGP</div>
      <div class="sig-name">${data.fciInspectorName}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Uprawniony Lekarz Weterynarii</div>
      <div class="sig-name">${data.veterinarianName}</div>
      <div style="font-size: 7.5pt; color: #64748b;">PWZW: ${data.vetLicenseNumber}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Hodowca / Właściciel Ptaka</div>
      <div class="sig-name">${data.breederWitnessName}</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Protokół Kontroli Antydopingowej Z-093 (DEC-107)</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
