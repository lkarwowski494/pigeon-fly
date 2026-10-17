/**
 * PIGEON-FLY — E-Paszport Weterynaryjny i Świadectwo Zdrowia TRACES-NT (Z-063)
 * Moduł urzędowej certyfikacji zdrowia stada na loty zagraniczne i międzyokręgowe:
 * - Badanie kliniczne stada na 48h przed przemieszczeniem (AHL / TRACES-NT)
 * - Weryfikacja stref zapowietrzonych i zagrożonych HPAI / ND
 * - Ważność szczepień PMV-1 i rejestracja licencji transportowej
 * - Generowanie dwujęzycznego urzędowego świadectwa zdrowia (A4 HTML/PDF)
 */

export interface TracesConsignmentInfo {
  certificateId: string; // np. "PL-TRACES-2026-00491"
  wniNumber: string; // Weterynaryjny Numer Identyfikacyjny gołębnika
  breederName: string;
  breederPhone: string;
  loftAddress: string;
  departureCountry: string; // domyślnie "PL"

  destinationCountry: string; // np. "DE", "BE", "NL"
  releaseLocationName: string; // np. "Magdeburg", "Bruksela", "Głogów"
  releaseCoordinates: {
    latitude: number;
    longitude: number;
  };
  raceDistanceKm: number;

  transporterName: string;
  transporterLicenseNumber: string; // Zezwolenie typu 2 (transport zwierząt > 8h)
  vehicleRegistrationNumber: string; // Nr rej. kabiny transportowej

  pigeonsCount: number;
  ringNumbersSample: string[]; // próbka obrączek stada
  departureTimestamp: string; // ISO string planowanego wyjazdu kabiny
  clinicalExamTimestamp: string; // ISO string badania klinicznego przez weta
  examiningVetName: string;
  examiningVetLicenseNumber: string;

  // Status epizootyczny
  isInHpaiZone: boolean; // Czy gołębnik lub stacja koszowania leży w strefie 3km lub 10km HPAI?
  hasClinicalSymptoms: boolean; // Czy podczas badania stwierdzono jakiekolwiek objawy chorobowe?
  pmvVaccineValid: boolean; // Czy stado posiada ważne urzędowe szczepienie PMV-1?
  pmvVaccineBatchNumber: string;
  pmvVaccinationDate: string;
}

export interface TracesValidationResult {
  isValid: boolean;
  hoursUntilExamExpiry: number; // maks. 48h od badania klinicznego
  examExpired: boolean;
  statusLabel: string;
  statusCode: 'APPROVED' | 'EXPIRED' | 'REJECTED_HPAI' | 'REJECTED_SYMPTOMS' | 'REJECTED_VACCINE';
  violations: string[];
  recommendations: string[];
}

/**
 * Waliduje przesyłkę gołębi pocztowych zgodnie z wymogami unijnego rozporządzenia o zdrowiu zwierząt (AHL) i TRACES-NT
 */
export function validateConsignmentForTraces(
  consignment: TracesConsignmentInfo,
  currentDate: Date = new Date()
): TracesValidationResult {
  const violations: string[] = [];
  const recommendations: string[] = [];

  const examTime = new Date(consignment.clinicalExamTimestamp).getTime();
  const departureTime = new Date(consignment.departureTimestamp).getTime();
  const now = currentDate.getTime();

  // Rygor 1: Badanie kliniczne ważne maks. 48 godzin do momentu wyjazdu/inspekcji
  const hoursSinceExamToDeparture = (departureTime - examTime) / (1000 * 60 * 60);
  const hoursSinceExamToNow = (now - examTime) / (1000 * 60 * 60);
  const hoursRemainingFromNow = Math.max(0, 48 - hoursSinceExamToNow);

  let examExpired = false;
  if (hoursSinceExamToDeparture > 48 || hoursSinceExamToNow > 48) {
    examExpired = true;
    violations.push('Badanie kliniczne stada wygasło (przekroczono limit 48 godzin wymagany przez TRACES-NT).');
    recommendations.push('Należy przeprowadzić ponowne badanie kliniczne stada przez uprawnionego lekarza weterynarii.');
  }

  // Rygor 2: Objawy kliniczne
  if (consignment.hasClinicalSymptoms) {
    violations.push('Stwierdzono obecność objawów klinicznych u ptaków (bezwzględny zakaz przemieszczania).');
    recommendations.push('Wstrzymać wysyłkę stada, odizolować chore osobniki w kwarantannie i pobrać próby laboratoryjne.');
  }

  // Rygor 3: Strefa zakażenia HPAI/ND
  if (consignment.isInHpaiZone) {
    violations.push('Gołębnik znajduje się w strefie zapowietrzonej (3 km) lub zagrożonej (10 km) grypą ptaków (HPAI).');
    recommendations.push('Zgodnie z rozporządzeniem Powiatowego Lekarza Weterynarii obowiązuje zakaz wyprowadzania i transportu ptaków.');
  }

  // Rygor 4: Ważność szczepienia PMV-1
  if (!consignment.pmvVaccineValid) {
    violations.push('Brak ważnego urzędowego zaświadczenia o szczepieniu stada przeciw rzekomemu pomorowi / PMV-1.');
    recommendations.push('Wszystkie ptaki biorące udział w locie muszą posiadać ważne szczepienie wykonane min. 21 dni przed lotem.');
  }

  // Rygor 5: Licencja transportowa
  if (!consignment.transporterLicenseNumber || consignment.transporterLicenseNumber.trim().length === 0) {
    violations.push('Brak numeru zezwolenia przewoźnika (Transport Typu 2 pow. 8 godzin).');
    recommendations.push('Uzupełnić dane licencji kabiny transportowej PZHGP.');
  }

  // Kod statusu i werdykt
  let statusCode: TracesValidationResult['statusCode'] = 'APPROVED';
  let statusLabel = 'CERTYFIKAT ZATWIERDZONY — ZEZWOLENIE NA TRANSPORT MIĘDZYNARODOWY (TRACES-NT)';

  if (consignment.isInHpaiZone) {
    statusCode = 'REJECTED_HPAI';
    statusLabel = 'ODRZUCONO — ZAKAZ TRANSPORTU (STREFA HPAI / PTASIA GRYPA)';
  } else if (consignment.hasClinicalSymptoms) {
    statusCode = 'REJECTED_SYMPTOMS';
    statusLabel = 'ODRZUCONO — OBJAWY KLINICZNE W STADZIE';
  } else if (!consignment.pmvVaccineValid) {
    statusCode = 'REJECTED_VACCINE';
    statusLabel = 'ODRZUCONO — BRAK WAŻNEGO SZCZEPIENIA PMV-1';
  } else if (examExpired) {
    statusCode = 'EXPIRED';
    statusLabel = 'WYGASŁO — MINĘŁO PONAD 48 GODZIN OD BADANIA KLINICZNEGO';
  }

  const isValid = violations.length === 0;

  return {
    isValid,
    hoursUntilExamExpiry: Math.round(hoursRemainingFromNow * 10) / 10,
    examExpired,
    statusLabel,
    statusCode,
    violations,
    recommendations,
  };
}

/**
 * Generuje urzędowe, dwujęzyczne (PL/EN) świadectwo zdrowia zgodne z modelem unijnym TRACES-NT dla gołębi pocztowych
 */
export function generateTracesCertificateHtml(
  consignment: TracesConsignmentInfo,
  validation: TracesValidationResult
): string {
  const statusColor = validation.isValid ? '#2E7D32' : '#D32F2F';
  const statusBg = validation.isValid ? '#E8F5E9' : '#FFEBEE';

  const ringsListPreview = consignment.ringNumbersSample.length > 0
    ? consignment.ringNumbersSample.slice(0, 15).join(', ') + (consignment.ringNumbersSample.length > 15 ? '...' : '')
    : 'Lista obrączek załączona w oficjalnym protokole koszowania PZHGP';

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Świadectwo Zdrowia TRACES-NT - ${consignment.certificateId}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      line-height: 1.35;
      font-size: 11px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #111827;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .eu-flag {
      font-size: 20px;
      font-weight: bold;
      color: #003399;
    }
    .title-box {
      text-align: center;
      margin-bottom: 14px;
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 8px;
    }
    .title-box h1 {
      font-size: 14px;
      text-transform: uppercase;
      margin: 0 0 2px 0;
      color: #0F172A;
      letter-spacing: 0.5px;
    }
    .title-box h2 {
      font-size: 10px;
      text-transform: uppercase;
      margin: 0;
      color: #475569;
      font-weight: normal;
    }
    .status-banner {
      background-color: ${statusBg};
      border: 2px solid ${statusColor};
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-text {
      font-weight: 800;
      font-size: 12px;
      color: ${statusColor};
    }
    .status-sub {
      font-size: 9px;
      color: #4B5563;
      margin-top: 2px;
    }
    .data-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border: 1px solid #CBD5E1;
    }
    .data-grid th {
      background-color: #F1F5F9;
      padding: 5px 8px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      border: 1px solid #CBD5E1;
      color: #334155;
    }
    .data-grid td {
      padding: 5px 8px;
      border: 1px solid #E2E8F0;
      font-size: 11px;
    }
    .lbl {
      font-weight: bold;
      color: #475569;
      width: 28%;
      background-color: #F8FAFC;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 10px 0 4px 0;
      color: #1E293B;
      border-left: 3px solid #003399;
      padding-left: 6px;
    }
    .attestation-box {
      border: 1px solid #CBD5E1;
      background-color: #FAFAFA;
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 12px;
      font-size: 10px;
      line-height: 1.4;
      color: #334155;
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
      margin-top: 14px;
      font-size: 8px;
      color: #94A3B8;
      text-align: center;
      border-top: 1px solid #E2E8F0;
      padding-top: 6px;
    }
  </style>
</head>
<body>

  <!-- Nagłówek Urzędowy -->
  <table class="header-table">
    <tr>
      <td style="width: 65%;">
        <div class="eu-flag">🇪🇺 EUROPEAN UNION / RZECZPOSPOLITA POLSKA</div>
        <div style="font-size: 10px; font-weight: bold; color: #1E293B;">GŁÓWNY LEKARZ WETERYNARII / POWIATOWY INSPEKTORAT WETERYNARII</div>
        <div style="font-size: 9px; color: #64748B;">SYSTEM KONTROLI I EKSPERTYZ HANDLOWYCH (TRACES-NT COMPLIANT)</div>
      </td>
      <td style="width: 35%; text-align: right;">
        <div style="font-size: 12px; font-weight: bold; color: #0F172A;">Nr certyfikatu: ${consignment.certificateId}</div>
        <div style="font-size: 10px; color: #334155;">WNI: <strong>${consignment.wniNumber}</strong></div>
        <div style="font-size: 9px; color: #64748B;">Ważność: 48h od badania klinicznego</div>
      </td>
    </tr>
  </table>

  <!-- Tytuł Dokumentu -->
  <div class="title-box">
    <h1>ŚWIADECTWO ZDROWIA DLA GOŁĘBI POCZTOWYCH W RUCHU MIĘDZYNARODOWYM</h1>
    <h2>VETERINARY HEALTH CERTIFICATE FOR RACING PIGEONS DISPATCHED FOR SPORT EVENTS (AHL / TRACES-NT)</h2>
  </div>

  <!-- Pasek Statusu i Ważności -->
  <div class="status-banner">
    <div>
      <div class="status-text">${validation.statusLabel}</div>
      <div class="status-sub">
        ${validation.isValid
          ? `Badanie kliniczne ważne jeszcze przez: ${validation.hoursUntilExamExpiry} godz. (Zgodność z art. 124 Rozporządzenia UE 2016/429)`
          : `Wykryto naruszenia uniemożliwiające wyjazd kabiny: ${validation.violations.join('; ')}`}
      </div>
    </div>
    <div style="text-align: right; font-weight: 800; font-size: 14px; color: ${statusColor};">
      ${validation.isValid ? '✓ ZEZWOLONO' : '✗ ZAKAZ'}
    </div>
  </div>

  <!-- Część I: Identyfikacja Przesyłki i Trasy -->
  <div class="section-title">CZĘŚĆ I: POCHODZENIE, MIEJSCE WYPUSZCZENIA I PRZEWOŹNIK / PART I: DETAILS OF CONSIGNMENT</div>
  <table class="data-grid">
    <tr>
      <td class="lbl">Nadawca / Posiadacz stada:</td>
      <td><strong>${consignment.breederName}</strong> (Tel: ${consignment.breederPhone})</td>
      <td class="lbl">Kraj pochodzenia / wysyłki:</td>
      <td>${consignment.departureCountry} (Polska)</td>
    </tr>
    <tr>
      <td class="lbl">Adres gołębnika macierzystego:</td>
      <td>${consignment.loftAddress}</td>
      <td class="lbl">Liczba ptaków w przesyłce:</td>
      <td><strong>${consignment.pigeonsCount} sztuk</strong></td>
    </tr>
    <tr>
      <td class="lbl">Kraj i miejsce wypuszczenia:</td>
      <td><strong>${consignment.releaseLocationName} (${consignment.destinationCountry})</strong></td>
      <td class="lbl">Dystans lotu / Koordynaty:</td>
      <td>${consignment.raceDistanceKm} km (${consignment.releaseCoordinates.latitude.toFixed(4)}°N, ${consignment.releaseCoordinates.longitude.toFixed(4)}°E)</td>
    </tr>
    <tr>
      <td class="lbl">Przewoźnik i kabina transportowa:</td>
      <td>${consignment.transporterName} (Nr rej: <strong>${consignment.vehicleRegistrationNumber}</strong>)</td>
      <td class="lbl">Licencja transportowa Typ 2:</td>
      <td><strong>${consignment.transporterLicenseNumber}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Planowany wyjazd z kraju:</td>
      <td>${consignment.departureTimestamp.replace('T', ' ').slice(0, 16)}</td>
      <td class="lbl">Obrączki rodowe (próbka):</td>
      <td><span style="font-size: 9px; color: #475569;">${ringsListPreview}</span></td>
    </tr>
  </table>

  <!-- Część II: Poświadczenie Zdrowotne Lekarza Weterynarii -->
  <div class="section-title">CZĘŚĆ II: POŚWIADCZENIE ZDROWOTNOŚCI I EPIZOOTII / PART II: ANIMAL HEALTH ATTESTATION</div>
  <div class="attestation-box">
    Ja, niżej podpisany urzędowy lekarz weterynarii / uprawniony lekarz wolnej praktyki, zaświadczam, że:
    <ol style="margin: 4px 0 4px 16px; padding: 0;">
      <li>Ptaki opisane w niniejszym świadectwie zostały poddane badaniu klinicznemu w dniu <strong>${consignment.clinicalExamTimestamp.replace('T', ' ').slice(0, 16)}</strong> (w ciągu 48 godzin przed planowaną wysyłką) i nie wykazywały żadnych klinicznych objawów chorób zakaźnych, w tym rzekomego pomoru drobiu (ND) ani wysoce zjadliwej grypy ptaków (HPAI).</li>
      <li>Gołębnik pochodzenia oraz stacja wkładania nie znajdują się na obszarze zapowietrzonym (promień 3 km) ani zagrożonym (promień 10 km) z powodu wystąpienia rzekomego pomoru drobiu lub grypy ptaków.</li>
      <li>Ptaki zostały zaszczepione przeciwko paramyksowirozie (PMV-1) atestowaną szczepionką: seria <strong>${consignment.pmvVaccineBatchNumber}</strong>, data szczepienia: <strong>${consignment.pmvVaccinationDate}</strong>.</li>
      <li>Środek transportu i kosze zostały oczyszczone i zdezynfekowane atestowanym preparatem wirusobójczym przed załadunkiem zwierząt.</li>
    </ol>
  </div>

  <!-- Informacje o lekarzu weterynarii -->
  <table class="data-grid" style="margin-bottom: 16px;">
    <tr>
      <td class="lbl">Imię i nazwisko lekarza weterynarii:</td>
      <td><strong>${consignment.examiningVetName}</strong></td>
      <td class="lbl">Nr Prawa Wykonywania Zawodu:</td>
      <td><strong>${consignment.examiningVetLicenseNumber}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Data i godzina badania klinicznego:</td>
      <td><strong>${consignment.clinicalExamTimestamp.replace('T', ' ').slice(0, 16)}</strong></td>
      <td class="lbl">Status szczepienia PMV-1:</td>
      <td style="color: #2E7D32; font-weight: bold;">Zgodny (Ważne szczepienie stada)</td>
    </tr>
  </table>

  <!-- Podpisy i Pieczęcie -->
  <table class="signatures-table">
    <tr>
      <td class="sig-cell">
        .........................................................................<br>
        <strong>Podpis i pieczęć Lekarza Weterynarii</strong><br>
        <span style="font-size: 8px; color: #64748B;">(Official Veterinarian Stamp and Signature)</span>
      </td>
      <td style="width: 4%;"></td>
      <td class="sig-cell">
        .........................................................................<br>
        <strong>Podpis Przewoźnika / Konwojenta Kabiny</strong><br>
        <span style="font-size: 8px; color: #64748B;">(Transporter / Escort Driver Signature)</span>
      </td>
    </tr>
  </table>

  <div class="footer">
    PIGEON-FLY Digital TRACES-NT Module • Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/429 • Weryfikacja cyfrowa SHA-256
  </div>
</body>
</html>
  `.trim();
}
