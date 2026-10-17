/**
 * PIGEON-FLY — Generator Świadectwa Zgonu i Protokołu Utylizacji Padłego Gołębia (Z-090 / DEC-104)
 * Procedura urzędowa PIW, PZHGP i ewidencja strat biologicznych stada:
 * - Przyczyny upadku: atak drapieżnika, choroby zakaźne (PMV-1, Salmonella, Poxvirus, YPDS),
 *   uraz kolizyjny w locie, wycieńczenie powrotne, humanitarna eutanazja weterynaryjna.
 * - Ocena makroskopowa narządów (umięśnienie mostka, wole, wątroba, worki płucne, jelita).
 * - Ewidencja likwidacji obrączki rodowej (przecięcie komisyjne / depozyt / pamiątka).
 * - Protokół utylizacji zwłok UPPZ (Kat. 2 / Kat. 3) zgodnie z Rozp. WE 1069/2009.
 * - Alarm epizootyczny i zgłoszenie do Powiatowego Inspektoratu Weterynarii (PIW).
 * - Druk urzędowego świadectwa A4 / PDF.
 */

import { Sex } from './types';

export type PigeonMortalityCause =
  | 'predator'
  | 'infectious_disease'
  | 'trauma_flight_collision'
  | 'exhaustion_post_race'
  | 'humane_euthanasia'
  | 'unknown';

export type RingDisposalAction =
  | 'ring_cut_destroyed'
  | 'ring_deposited_branch'
  | 'kept_memorial';

export type CarcassDisposalMethod =
  | 'vet_cremation'
  | 'rendering_plant_cat2_cat3'
  | 'piw_autopsy';

export type MuscleCondition = 'normal' | 'moderate_cachexia' | 'severe_wasting';

export interface AutopsyFindings {
  muscleCondition: MuscleCondition;
  cropCondition: string;
  liverCondition: string;
  airSacsCondition: string;
  intestinesCondition: string;
}

export interface PigeonMortalityProtocolData {
  protocolNumber: string; // np. "ZGON-2026/014"
  incidentDate: string; // YYYY-MM-DD
  discoveryTime?: string; // HH:mm
  loftName: string;
  breederName: string;
  breederPzhgpNumber: string;
  ringNumber: string; // np. "PL-0284-23-1402"
  sex: Sex; // 'cock' | 'hen' | 'unknown'
  plumageColor: string;
  birthYear: number;
  causeCategory: PigeonMortalityCause;
  causeDescription: string;
  incidentLocation: string; // np. "Gołębnik domowy - Cela A-04", "Trasa lotu Bruksela"
  autopsyConducted: boolean;
  autopsyFindings: AutopsyFindings;
  ringDisposal: RingDisposalAction;
  carcassDisposal: CarcassDisposalMethod;
  disposalCompanyOrClinic: string; // np. "Klinika Weterynaryjna AVI-MED" / "SARIA Kat. 2/3"
  disposalCertificateNumber?: string;
  veterinarianName?: string;
  vetLicenseNumber?: string;
  epizooticNotificationRequired: boolean;
  epizooticDiseaseSuspected?: string;
  notes?: string;
}

export const CAUSE_LABELS: Record<PigeonMortalityCause, string> = {
  predator: 'Atak drapieżnika (jastrząb / kuna / sokół / lis)',
  infectious_disease: 'Podejrzenie choroby zakaźnej (PMV-1 / Salmonella / Ospa)',
  trauma_flight_collision: 'Uraz mechaniczny / zderzenie w locie (linie, wiatrak)',
  exhaustion_post_race: 'Skrajne wycieńczenie powrotne po maratonie (>700 km)',
  humane_euthanasia: 'Humanitarna eutanazja weterynaryjna (wskazanie lekarskie)',
  unknown: 'Przyczyna nieustalona / nagły zgon',
};

export const RING_DISPOSAL_LABELS: Record<RingDisposalAction, string> = {
  ring_cut_destroyed: 'Obrączka rodowa przecięta i zniszczona komisyjnie',
  ring_deposited_branch: 'Obrączka zdeponowana w macierzystej Sekcji/Oddziale PZHGP',
  kept_memorial: 'Obrączka pozostawiona u hodowcy w celach memoratywnych',
};

export const CARCASS_DISPOSAL_LABELS: Record<CarcassDisposalMethod, string> = {
  vet_cremation: 'Utylizacja / kremacja kliniczna za pośrednictwem lecznicy (UPPZ)',
  rendering_plant_cat2_cat3: 'Certyfikowany zakład utylizacyjny (Kategoria 2/3 - SARIA/itp.)',
  piw_autopsy: 'Przekazanie zwłok do ZHW / PIW na urzędowe badanie sekcyjne',
};

/**
 * Validates mandatory fields for official veterinary mortality protocol.
 */
export function validatePigeonMortality(data: PigeonMortalityProtocolData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.protocolNumber || !data.protocolNumber.trim()) {
    errors.push('Brak numeru protokołu!');
  }
  if (!data.ringNumber || !data.ringNumber.trim()) {
    errors.push('Brak numeru obrączki rodowej padłego gołębia!');
  }
  if (!data.incidentDate) {
    errors.push('Brak daty zdarzenia/znalezienia padłego ptaka!');
  }
  if (!data.breederName || !data.breederName.trim()) {
    errors.push('Brak nazwiska hodowcy!');
  }
  if (!data.disposalCompanyOrClinic || !data.disposalCompanyOrClinic.trim()) {
    errors.push('Brak nazwy podmiotu utylizującego zwłoki (lecznica / zakład UPPZ)!');
  }

  if (data.causeCategory === 'humane_euthanasia' && !data.veterinarianName) {
    errors.push('W przypadku eutanazji wymagane jest podanie nazwiska lekarza weterynarii!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Evaluates whether suspected cause triggers mandatory PIW notification (zwalczanie z urzędu / epizootia).
 */
export function evaluateEpizooticRisk(data: PigeonMortalityProtocolData): {
  requiresImmediatePiwReport: boolean;
  alertMessage?: string;
} {
  const infectious = data.causeCategory === 'infectious_disease';
  const suspiciousDesc = (data.causeDescription + ' ' + (data.epizooticDiseaseSuspected || '')).toLowerCase();

  const isNotifiable =
    suspiciousDesc.includes('pmv') ||
    suspiciousDesc.includes('paramykso') ||
    suspiciousDesc.includes('gryp') ||
    suspiciousDesc.includes('influenza') ||
    suspiciousDesc.includes('salmonell') ||
    suspiciousDesc.includes('rzekomy pomór') ||
    suspiciousDesc.includes('newcastle') ||
    suspiciousDesc.includes('ospa') ||
    data.epizooticNotificationRequired;

  if (infectious && isNotifiable) {
    return {
      requiresImmediatePiwReport: true,
      alertMessage:
        'UWAGA! Podejrzenie choroby zakaźnej podlegającej obowiązkowi zgłoszenia (Rozp. MRiRW / Ustawa o ochronie zdrowia zwierząt). Wymagany natychmiastowy kontakt z Powiatowym Inspektoratem Weterynarii (PIW) oraz zabezpieczenie zwłok w chłodni (+4°C) do sekcji urzędowej.',
    };
  }

  return {
    requiresImmediatePiwReport: false,
  };
}

/**
 * Generates official A4 Printable HTML Certificate of Mortality and Disposal Protocol.
 */
export function generatePigeonMortalityProtocolHtml(
  data: PigeonMortalityProtocolData
): string {
  const epizootic = evaluateEpizooticRisk(data);

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Świadectwo Zgonu i Protokół Utylizacji Padłego Gołębia — ${data.protocolNumber}</title>
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

    .alert-banner {
      background: #fef2f2;
      border: 1.5px solid #dc2626;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      color: #991b1b;
      font-size: 8pt;
      line-height: 1.35;
    }

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
      border-left: 3.5px solid #64748b;
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
      <div class="title">Świadectwo Zgonu i Protokół Utylizacji Padłego Gołębia</div>
      <div class="subtitle">Ewidencja Strat Hodowlanych i Procedura PIW / UPPZ (Z-090)</div>
    </div>
    <div class="meta">
      <div>Protokół Nr: <strong>${data.protocolNumber}</strong></div>
      <div>Data zgonu: <strong>${data.incidentDate}</strong> ${data.discoveryTime ? 'godz. ' + data.discoveryTime : ''}</div>
      <div>Hodowca: <strong>${data.breederName}</strong> (${data.breederPzhgpNumber})</div>
    </div>
  </div>

  ${
    epizootic.requiresImmediatePiwReport
      ? `
  <div class="alert-banner">
    <strong>⚠️ ALARM EPIZOOTYCZNY — OBOWIĄZEK ZGŁOSZENIA DO PIW:</strong><br>
    ${epizootic.alertMessage}
  </div>
  `
      : ''
  }

  <div class="banner">
    <div>
      <div class="banner-title">Oznaczenie Ptaka: ${data.ringNumber}</div>
      <div class="banner-desc">
        Płeć: <strong>${data.sex === 'cock' ? '1.0 Samiec' : data.sex === 'hen' ? '0.1 Samica' : 'Nieznana'}</strong> • 
        Rocznik: <strong>${data.birthYear}</strong> • 
        Upierzenie: <strong>${data.plumageColor}</strong> • 
        Miejsce: <strong>${data.incidentLocation}</strong>
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 8pt; color: #64748b;">Status stada:</span><br>
      <strong style="font-size: 10pt; color: #dc2626;">WYREJESTROWANY (ZGON)</strong>
    </div>
  </div>

  <div class="grid-2">
    <!-- Przyczyna Zgonu -->
    <div class="card">
      <div class="card-title">1. PRZYCZYNA UPADKU / OKOLICZNOŚCI</div>
      <div class="row">
        <span class="label">Kategoria przyczyny:</span>
        <span class="val" style="color: #0f172a;">${CAUSE_LABELS[data.causeCategory]}</span>
      </div>
      <div class="row">
        <span class="label">Szczegóły / Opis zdarzenia:</span>
        <span class="val">${data.causeDescription}</span>
      </div>
      ${
        data.epizooticDiseaseSuspected
          ? `
      <div class="row">
        <span class="label">Podejrzewana jednostka:</span>
        <span class="val" style="color: #dc2626;">${data.epizooticDiseaseSuspected}</span>
      </div>
      `
          : ''
      }
    </div>

    <!-- Likwidacja Obrączki i Utylizacja -->
    <div class="card">
      <div class="card-title">2. LIKWIDACJA OBRĄCZKI I PROCEDURA UPPZ</div>
      <div class="row">
        <span class="label">Postępowanie z obrączką:</span>
        <span class="val">${RING_DISPOSAL_LABELS[data.ringDisposal]}</span>
      </div>
      <div class="row">
        <span class="label">Metoda utylizacji zwłok:</span>
        <span class="val">${CARCASS_DISPOSAL_LABELS[data.carcassDisposal]}</span>
      </div>
      <div class="row">
        <span class="label">Podmiot utylizujący:</span>
        <span class="val">${data.disposalCompanyOrClinic}</span>
      </div>
      ${
        data.disposalCertificateNumber
          ? `
      <div class="row">
        <span class="label">Nr dowodu utylizacji:</span>
        <span class="val" style="font-family: monospace;">${data.disposalCertificateNumber}</span>
      </div>
      `
          : ''
      }
    </div>
  </div>

  <div style="font-weight: 800; font-size: 9pt; margin-bottom: 2px;">
    3. BADANIE POŚMIERTNE (MAKROSKOPOWA OCENA NARZĄDÓW):
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Układ / Narząd</th>
        <th>Obraz Makroskopowy i Wyniki Oględzin</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Kondycja mostka i mięśni</strong></td>
        <td>
          ${
            data.autopsyFindings.muscleCondition === 'normal'
              ? 'Prawidłowe umięśnienie, brak ubytków masy mięśniowej.'
              : data.autopsyFindings.muscleCondition === 'moderate_cachexia'
              ? 'Umiarkowane wychudzenie (ostry mostek), redukcja tkanki tłuszczowej.'
              : 'Głęboka atrofia mięśni piersiowych (kacheksja, stan agonalny).'
          }
        </td>
      </tr>
      <tr>
        <td><strong>Wole i przełyk</strong></td>
        <td>${data.autopsyFindings.cropCondition || 'Błona śluzowa bez zmian, brak serowatych nalotów rzęsistka.'}</td>
      </tr>
      <tr>
        <td><strong>Wątroba i narządy miąższowe</strong></td>
        <td>${data.autopsyFindings.liverCondition || 'Barwa ciemnobrunatna, bez ognisk martwiczych i przekrwień.'}</td>
      </tr>
      <tr>
        <td><strong>Worki powietrzne i płuca</strong></td>
        <td>${data.autopsyFindings.airSacsCondition || 'Worki przejrzyste, płuca jasnoróżowe, bez nalotów włóknika/grzybicy.'}</td>
      </tr>
      <tr>
        <td><strong>Przewód pokarmowy i jelita</strong></td>
        <td>${data.autopsyFindings.intestinesCondition || 'Brak treści krwotocznej, brak makroskopowych pasożytów (glist/tasiemców).'}</td>
      </tr>
    </tbody>
  </table>

  ${
    data.notes
      ? `
  <div class="notes-box">
    <strong>Uwagi i zalecenia weterynaryjne:</strong> ${data.notes}
  </div>
  `
      : ''
  }

  <div class="signatures">
    <div class="sig-col">
      <div class="sig-title">Hodowca / Zgłaszający</div>
      <div class="sig-name">${data.breederName}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Lekarz Weterynarii / Świadek</div>
      <div class="sig-name">${data.veterinarianName || 'Podpis lekarza weterynarii'}</div>
      ${data.vetLicenseNumber ? `<div style="font-size: 7.5pt; color: #64748b;">Nr PWZW: ${data.vetLicenseNumber}</div>` : ''}
    </div>
    <div class="sig-col">
      <div class="sig-title">Potwierdzenie Utylizacji (UPPZ)</div>
      <div class="sig-name">Podpis i pieczęć odbiorcy</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Protokół Śmierci i Utylizacji Ptaka Z-090 (DEC-104)</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
