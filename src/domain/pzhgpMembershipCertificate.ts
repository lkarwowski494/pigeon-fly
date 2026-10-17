/**
 * PIGEON-FLY — Official PZHGP Membership & Ring Allocation Certificate (Z-086 / DEC-100)
 * Formal Polish Pigeon Breeders Association (PZHGP) Membership and Band Registry Certificate:
 * - Legal confirmation of active membership, section/branch/district assignment.
 * - Formal registry of official FCI/EE ring bands allocated for the breeding season.
 * - Purpose verification: District Veterinary Inspectorate (PIW), national exhibitions, international convoy transit.
 * - Statutory compliance check: Annual membership fees, PMV-1 vaccination, disciplinary clearance.
 * - Signatures and official seal of the Branch Board (Prezes, Sekretarz).
 */

export type CertificatePurpose =
  | 'veterinary_inspection'
  | 'national_exhibition'
  | 'border_crossing_transit'
  | 'general_membership';

export interface RingSeriesEntry {
  id: string;
  seriesRange: string; // np. "PL-0284-26-1001 — PL-0284-26-1060"
  ringsCount: number; // np. 60
  color: string; // np. "Czerwony (FCI 2026)"
  issueDate: string;
  paid: boolean;
}

export interface PzhgpMembershipCertificateData {
  certificateNumber: string;
  issueDate: string;
  seasonYear: number;
  purpose: CertificatePurpose;
  // Breeder Details
  breederName: string;
  breederPzhgpNumber: string;
  districtName: string; // Okręg np. "Okręg Poznań"
  branchName: string; // Oddział np. "0284 Nowy Tomyśl"
  sectionName: string; // Sekcja np. "Sekcja 01 Zbąszyń"
  loftAddress: string;
  loftLatitude: number;
  loftLongitude: number;
  membershipSinceYear: number;
  // Legal & Sanitary Status
  isMembershipFeePaid: boolean;
  hasDisciplinarySanctions: boolean;
  pmvVaccinationCertified: boolean;
  sanitaryVetApprovalNumber?: string; // np. "WET-POZ-2026/092"
  // Allocated Ring Series
  allocatedRings: RingSeriesEntry[];
  identityCardsIssued: boolean;
  // Branch Board Signatures
  branchPresident: string;
  branchSecretary: string;
  officialNotes?: string;
}

export interface CertificateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalRingsAllocated: number;
  statusLabel: string;
  statusColor: string;
}

export const PURPOSE_LABELS: Record<CertificatePurpose, string> = {
  veterinary_inspection:
    'Kontrola Powiatowego Inspektoratu Weterynarii (PIW) — Rejestr Bioasekuracji i Stada',
  national_exhibition:
    'Zgłoszenie do Ogólnopolskiej / Okręgowej Wystawy Gołębi Pocztowych PZHGP',
  border_crossing_transit:
    'Międzynarodowy Transport i Zezwolenie na Wypuszczenie w UE (Niemcy, Belgia, Holandia)',
  general_membership:
    'Ogólne Potwierdzenie Przynależności Związkowej i Praw Członkowskich',
};

/**
 * Validates membership certificate conformity against PZHGP statutory rules.
 */
export function validatePzhgpMembershipCertificate(
  data: PzhgpMembershipCertificateData
): CertificateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.breederName.trim()) {
    errors.push('Brak imienia i nazwiska hodowcy.');
  }
  if (!data.breederPzhgpNumber.trim()) {
    errors.push('Brak numeru ewidencyjnego PZHGP hodowcy.');
  }
  if (!data.branchPresident.trim() || !data.branchSecretary.trim()) {
    errors.push('Zaświadczenie wymaga podpisów Prezesa i Sekretarza Oddziału.');
  }
  if (!data.isMembershipFeePaid) {
    errors.push('Brak opłaconej rocznej składki członkowskiej PZHGP na dany sezon!');
  }
  if (data.hasDisciplinarySanctions) {
    errors.push('Aktywna kara dyscyplinarna — brak uprawnień do wydania zaświadczenia.');
  }
  if (!data.pmvVaccinationCertified) {
    errors.push('Brak aktualnego urzędowego zaświadczenia o szczepieniu PMV-1.');
  }

  const totalRingsAllocated = data.allocatedRings.reduce(
    (sum, r) => sum + r.ringsCount,
    0
  );

  if (totalRingsAllocated === 0) {
    warnings.push('Brak przydzielonych obrączek rodowych w ewidencji zaświadczenia.');
  }

  const hasUnpaidRings = data.allocatedRings.some((r) => !r.paid);
  if (hasUnpaidRings) {
    warnings.push('Część przydzielonych serii obrączek rodowych nie została opłacona.');
  }

  if (!data.identityCardsIssued) {
    warnings.push('Karty tożsamości obrączek nie zostały jeszcze wydane hodowcy.');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    totalRingsAllocated,
    statusLabel: isValid
      ? 'ZAŚWIADCZENIE WAŻNE — PEŁNE PRAWA CZŁONKOWSKIE'
      : 'ZAŚWIADCZENIE NIEWAŻNE — WYKRYTO BRAKI FORMALNE',
    statusColor: isValid ? '#166534' : '#991b1b',
  };
}

/**
 * Generates official PZHGP A4 printable Certificate of Membership & Ring Allocation.
 */
export function generatePzhgpMembershipCertificateHtml(
  data: PzhgpMembershipCertificateData
): string {
  const validation = validatePzhgpMembershipCertificate(data);
  const purposeText = PURPOSE_LABELS[data.purpose] || PURPOSE_LABELS.general_membership;

  const ringsHtml = data.allocatedRings
    .map(
      (r, idx) => `
    <tr>
      <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
      <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${r.seriesRange}</td>
      <td style="text-align: center; font-weight: 700;">${r.ringsCount} szt.</td>
      <td style="text-align: center;">${r.color}</td>
      <td style="text-align: center;">${r.issueDate}</td>
      <td style="text-align: center; font-weight: 700; color: ${r.paid ? '#166534' : '#991b1b'};">
        ${r.paid ? 'OPŁACONA' : 'NIEOPŁACONA'}
      </td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Zaświadczenie PZHGP — ${data.breederName}</title>
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
    .cert-border {
      border: 3px double #0f172a;
      padding: 14px 18px;
      min-height: 96%;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .pzhgp-name { font-size: 13pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .pzhgp-branch { font-size: 10pt; font-weight: 700; color: #0284c7; margin-top: 2px; }
    .meta-box { font-size: 8pt; text-align: right; color: #334155; }

    .cert-title-container {
      text-align: center;
      margin: 14px 0 10px 0;
    }
    .cert-title {
      font-size: 15pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f172a;
    }
    .cert-number {
      font-size: 9pt;
      font-weight: 700;
      color: #64748b;
      margin-top: 2px;
    }

    .purpose-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0284c7;
      padding: 6px 12px;
      margin-bottom: 12px;
      font-size: 8.5pt;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .info-card {
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
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 8pt;
    }
    .info-label { color: #64748b; font-weight: 600; }
    .info-val { font-weight: 700; color: #0f172a; text-align: right; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 10px;
      font-size: 8pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: left;
    }

    .legal-clause {
      font-size: 7.5pt;
      color: #475569;
      line-height: 1.35;
      margin-top: 10px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      text-align: justify;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 24px;
      padding-top: 8px;
    }
    .sig-col {
      text-align: center;
      border-top: 1px dashed #64748b;
      padding-top: 6px;
    }
    .sig-title { font-size: 7.5pt; font-weight: 700; color: #475569; text-transform: uppercase; }
    .sig-name { font-size: 8pt; font-weight: 800; color: #0f172a; margin-top: 2px; }

    .stamp-box {
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7.5pt;
      color: #94a3b8;
      text-transform: uppercase;
      margin-top: 6px;
    }

    .footer {
      margin-top: 14px;
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
  <div class="cert-border">
    <div class="header">
      <div>
        <div class="pzhgp-name">POLSKI ZWIĄZEK HODOWCÓW GOŁĘBI POCZTOWYCH</div>
        <div class="pzhgp-branch">ZARZĄD ODDZIAŁU: ${data.branchName} • ${data.districtName}</div>
      </div>
      <div class="meta-box">
        <div>Miejscowość: <strong>Zbąszyń</strong></div>
        <div>Data wydania: <strong>${data.issueDate}</strong></div>
        <div>Sezon Lotowy: <strong>${data.seasonYear}</strong></div>
      </div>
    </div>

    <div class="cert-title-container">
      <div class="cert-title">ZAŚWIADCZENIE CZŁONKOWSKIE I EWIDENCJA OBRĄCZEK</div>
      <div class="cert-number">Nr rej.: ${data.certificateNumber}</div>
    </div>

    <div class="purpose-banner">
      <strong>Cel wydania zaświadczenia:</strong> ${purposeText}
    </div>

    <div class="grid-2">
      <!-- Breeder info -->
      <div class="info-card">
        <div class="card-title">DANE IDENTYFIKACYJNE HODOWCY</div>
        <div class="info-row">
          <span class="info-label">Imię i Nazwisko Hodowcy:</span>
          <span class="info-val">${data.breederName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nr ewidencyjny PZHGP:</span>
          <span class="info-val" style="color: #0284c7;">${data.breederPzhgpNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Sekcja / Oddział:</span>
          <span class="info-val">${data.sectionName} (${data.branchName})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Adres Gołębnika:</span>
          <span class="info-val">${data.loftAddress}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Współrzędne WGS-84:</span>
          <span class="info-val">${data.loftLatitude.toFixed(5)}°N, ${data.loftLongitude.toFixed(5)}°E</span>
        </div>
        <div class="info-row">
          <span class="info-label">Członek Związku od roku:</span>
          <span class="info-val">${data.membershipSinceYear}</span>
        </div>
      </div>

      <!-- Legal Status -->
      <div class="info-card">
        <div class="card-title">STATUS STATUTOWY I SANITARNY</div>
        <div class="info-row">
          <span class="info-label">Składka członkowska ${data.seasonYear}:</span>
          <span class="info-val" style="color: ${data.isMembershipFeePaid ? '#166534' : '#991b1b'};">
            ${data.isMembershipFeePaid ? 'OPŁACONA (Aktywny)' : 'ZALEGŁOŚĆ'}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Kary dyscyplinarne:</span>
          <span class="info-val" style="color: ${!data.hasDisciplinarySanctions ? '#166534' : '#991b1b'};">
            ${!data.hasDisciplinarySanctions ? 'BRAK (Czyste konto)' : 'AKTYWNE ZAWIESZENIE'}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Szczepienie PMV-1:</span>
          <span class="info-val" style="color: ${data.pmvVaccinationCertified ? '#166534' : '#991b1b'};">
            ${data.pmvVaccinationCertified ? 'POTWIERDZONE' : 'BRAK'}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Nr rejestru PIW:</span>
          <span class="info-val">${data.sanitaryVetApprovalNumber || 'Zgłoszony PIW'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Karty tożsamości obrączek:</span>
          <span class="info-val">${data.identityCardsIssued ? 'Wydane do rąk własnych' : 'W depozycie Oddziału'}</span>
        </div>
      </div>
    </div>

    <div style="font-weight: 800; font-size: 9pt; margin-bottom: 2px;">
      OFICJALNY REJESTR PRZYDZIELONYCH OBRĄCZEK RODOWYCH PZHGP (ŁĄCZNIE: ${validation.totalRingsAllocated} SZTUK):
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 25px; text-align: center;">Lp</th>
          <th>Zakres Numeracyjny Serii Obrączek</th>
          <th style="text-align: center;">Liczba</th>
          <th style="text-align: center;">Standard / Kolor FCI</th>
          <th style="text-align: center;">Data Przydziału</th>
          <th style="text-align: center;">Status Opłaty</th>
        </tr>
      </thead>
      <tbody>
        ${ringsHtml}
      </tbody>
    </table>

    ${
      data.officialNotes
        ? `
    <div style="font-size: 8pt; background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; margin-bottom: 8px;">
      <strong>Uwagi Zarządu Oddziału:</strong> ${data.officialNotes}
    </div>
    `
        : ''
    }

    <div class="legal-clause">
      Zarząd Oddziału PZHGP niniejszym zaświadcza, że wyżej wymieniony hodowca jest pełnoprawnym członkiem 
      Polskiego Związku Hodowców Gołębi Pocztowych, a wyszczególnione obrączki rodowe zostały oficjalnie nabyte, 
      zarejestrowane w Centralnej Bazie Danych PZHGP i stanowią wyłączną własność hodowcy zgodnie ze Statutem PZHGP. 
      Zaświadczenie uprawnia do uczestnictwa w rywalizacji sportowej, zgłaszania gołębi do wystaw oraz kontroli weterynaryjnej.
    </div>

    <div class="signatures-grid">
      <div class="sig-col">
        <div class="sig-title">Sekretarz Oddziału</div>
        <div class="sig-name">${data.branchSecretary}</div>
        <div class="stamp-box">Podpis Sekretarza</div>
      </div>
      <div class="sig-col">
        <div class="sig-title">Pieczęć Okrągła Oddziału</div>
        <div class="sig-name">${data.branchName}</div>
        <div class="stamp-box">Miejsce na Pieczęć Urzędową</div>
      </div>
      <div class="sig-col">
        <div class="sig-title">Prezes Zarządu Oddziału</div>
        <div class="sig-name">${data.branchPresident}</div>
        <div class="stamp-box">Podpis Prezesa</div>
      </div>
    </div>

    <div class="footer">
      <div>PIGEON-FLY v0.1.0 • Certyfikat Przynależności i Obrączek PZHGP Z-086 (DEC-100)</div>
      <div>Wydrukowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
    </div>
  </div>
</body>
</html>`;
}
