/**
 * PIGEON-FLY — Fair-Play & Anti-Doping Consent Declaration Engine (Z-080 / DEC-94)
 * Official PZHGP & FCI anti-doping agreement, biological sampling consent, and ethical charter.
 * Complies with FCI International Racing Pigeon Veterinary & Anti-Doping Regulations.
 */

export interface FairPlayBreederProfile {
  breederName: string;
  pzhgpMemberNumber: string; // np. "0284-1420"
  branchName: string; // np. "Oddział 0284 Gostyń"
  sectionName: string; // np. "Sekcja 1 Gostyń"
  loftAddress: string;
  loftCoordinates: string; // np. "51°52'14.2\"N, 17°01'12.4\"E"
  seasonYear: number;
  declarationDate: string; // YYYY-MM-DD
}

export interface FairPlayClauses {
  antiDopingCommitment: boolean; // Zobowiązanie do przestrzegania Kodeksu Antydopingowego FCI
  biologicalSamplingConsent: boolean; // Zgoda na pobranie próbek (kał, krew, wole, pióra) w dowolnym momencie
  bannedSubstancesFree: boolean; // Brak stosowania środków z listy zabronionej FCI
  disciplinaryConsequencesAcknowledged: boolean; // Świadomość dyskwalifikacji i zawieszenia w prawach członka
  animalWelfareDeclaration: boolean; // Zapewnienie humanitarnych warunków i ważnych szczepień PMV-1
  noActiveSuspensions: boolean; // Brak aktywnych kar dyscyplinarnych w PZHGP/FCI
}

export interface FairPlayEvaluation {
  isFullyCompliant: boolean;
  complianceScore: number; // 0 - 100%
  statusLabel: string;
  statusColor: string;
  missingClauses: string[];
  breederProfile: FairPlayBreederProfile;
  clauses: FairPlayClauses;
}

/**
 * Evaluates fair play declaration completeness.
 */
export function evaluateFairPlayDeclaration(
  profile: FairPlayBreederProfile,
  clauses: FairPlayClauses
): FairPlayEvaluation {
  const missingClauses: string[] = [];

  if (!clauses.antiDopingCommitment) {
    missingClauses.push('Brak oświadczenia o przestrzeganiu Kodeksu Antydopingowego FCI.');
  }
  if (!clauses.biologicalSamplingConsent) {
    missingClauses.push('Brak zgody na bezwarunkowe pobranie próbek biologicznych przez Delegata PZHGP.');
  }
  if (!clauses.bannedSubstancesFree) {
    missingClauses.push('Brak oświadczenia o niestosowaniu substancji dopingujących.');
  }
  if (!clauses.disciplinaryConsequencesAcknowledged) {
    missingClauses.push('Brak potwierdzenia znajomości sankcji dyscyplinarnych i karnych.');
  }
  if (!clauses.animalWelfareDeclaration) {
    missingClauses.push('Brak deklaracji zapewnienia dobrostanu zwierząt i szczepień PMV-1.');
  }
  if (!clauses.noActiveSuspensions) {
    missingClauses.push('Brak oświadczenia o braku aktywnych kar dyscyplinarnych.');
  }

  const totalClauses = 6;
  const acceptedClauses = totalClauses - missingClauses.length;
  const complianceScore = Math.round((acceptedClauses / totalClauses) * 100);

  const isFullyCompliant = missingClauses.length === 0;
  const statusLabel = isFullyCompliant
    ? 'DEKLARACJA KOMPLETNA — DOPUSZCZONY DO SEZONU LOTOWEGO'
    : 'BRAK WYMAGANYCH KLAUZUL — BLOKADA WSPÓŁZAWODNICTWA';
  const statusColor = isFullyCompliant ? '#10B981' : '#EF4444';

  return {
    isFullyCompliant,
    complianceScore,
    statusLabel,
    statusColor,
    missingClauses,
    breederProfile: profile,
    clauses,
  };
}

/**
 * Generates official A4 Fair-Play and Anti-Doping Declaration HTML.
 */
export function generateFairPlayDeclarationHtml(evaluation: FairPlayEvaluation): string {
  const p = evaluation.breederProfile;
  const c = evaluation.clauses;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Oświadczenie Antydopingowe i Karta Fair-Play — PZHGP ${p.seasonYear}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.4;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 14.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 9pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8.5pt; text-align: right; color: #334155; }
    .status-banner {
      border: 1.5px solid ${evaluation.statusColor};
      background: ${evaluation.isFullyCompliant ? '#ecfdf5' : '#fef2f2'};
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 14px;
    }
    .status-title {
      font-size: 11pt;
      font-weight: 800;
      color: ${evaluation.statusColor};
      text-transform: uppercase;
    }
    .profile-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .profile-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      font-size: 9pt;
    }
    .profile-label {
      background: #f8fafc;
      font-weight: 700;
      width: 32%;
      color: #334155;
    }
    .clause-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 10px;
      background: #ffffff;
    }
    .clause-header {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    .clause-check {
      font-size: 13pt;
      font-weight: bold;
      margin-right: 8px;
      color: #047857;
    }
    .clause-title {
      font-weight: 800;
      font-size: 9.5pt;
      color: #0f172a;
    }
    .clause-text {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.35;
      padding-left: 24px;
    }
    .warning-box {
      background: #fffbeb;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 8.5pt;
      color: #92400e;
      margin-top: 12px;
      margin-bottom: 16px;
    }
    .sign-section {
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
    }
    .sign-box {
      width: 220px;
      border-top: 1px dashed #64748b;
      text-align: center;
      font-size: 8pt;
      padding-top: 6px;
      color: #334155;
    }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
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
      <div class="title">Karta Etyki i Deklaracja Antydopingowa</div>
      <div class="subtitle">Oficjalne Oświadczenie Uczestnika Współzawodnictwa PZHGP & FCI (Z-080)</div>
    </div>
    <div class="meta">
      <div><strong>${p.branchName}</strong></div>
      <div>${p.sectionName}</div>
      <div>Sezon Lotowy: <strong>${p.seasonYear}</strong></div>
    </div>
  </div>

  <div class="status-banner">
    <div class="status-title">${evaluation.statusLabel}</div>
    <div style="font-size: 8.5pt; color: #334155; margin-top: 2px;">
      Poziom akceptacji wymogów regulaminowych: <strong>${evaluation.complianceScore}%</strong>
    </div>
  </div>

  <table class="profile-table">
    <tr>
      <td class="profile-label">Imię i Nazwisko Hodowcy:</td>
      <td><strong>${p.breederName}</strong></td>
      <td class="profile-label">Nr Członkowski PZHGP:</td>
      <td><strong>${p.pzhgpMemberNumber}</strong></td>
    </tr>
    <tr>
      <td class="profile-label">Adres Gołębnika:</td>
      <td>${p.loftAddress}</td>
      <td class="profile-label">Współrzędne Geodezyjne (WGS-84):</td>
      <td>${p.loftCoordinates}</td>
    </tr>
    <tr>
      <td class="profile-label">Data Złożenia Deklaracji:</td>
      <td colspan="3">${p.declarationDate}</td>
    </tr>
  </table>

  <!-- Clause 1 -->
  <div class="clause-box">
    <div class="clause-header">
      <span class="clause-check">${c.antiDopingCommitment ? '☑' : '☒'}</span>
      <span class="clause-title">1. Zobowiązanie do Przestrzegania Zasad Antydopingowych FCI</span>
    </div>
    <div class="clause-text">
      Oświadczam, że zapoznałem się z Regulaminem Lotowo-Zegarowym PZHGP oraz Międzynarodowymi Przepisami Antydopingowymi FCI (Fédération Colombophile Internationale). Zobowiązuję się do bezwzględnego ich przestrzegania pod rygorem odpowiedzialności dyscyplinarnej.
    </div>
  </div>

  <!-- Clause 2 -->
  <div class="clause-box">
    <div class="clause-header">
      <span class="clause-check">${c.biologicalSamplingConsent ? '☑' : '☒'}</span>
      <span class="clause-title">2. Bezwarunkowa Zgoda na Pobranie Próbek Biologicznych</span>
    </div>
    <div class="clause-text">
      Wyrażam bezwarunkową zgodę na pobranie próbek biologicznych (odchody, wymaz z wola, pióra, próbki krwi) od dowolnych gołębi z mojego stada przez uprawnionego Delegata Zarządu Głównego PZHGP lub Urzędowego Lekarza Weterynarii w każdym momencie (przed koszowaniem, po locie oraz w gołębniku macierzystym).
    </div>
  </div>

  <!-- Clause 3 -->
  <div class="clause-box">
    <div class="clause-header">
      <span class="clause-check">${c.bannedSubstancesFree ? '☑' : '☒'}</span>
      <span class="clause-title">3. Oświadczenie o Niestosowaniu Substancji Zabronionych</span>
    </div>
    <div class="clause-text">
      Oświadczam, że gołębie zgłaszane do lotów konkursowych nie otrzymywały i nie otrzymują żadnych substancji z oficjalnej Listy Środków Zabronionych FCI, w tym w szczególności: sterydów anaboliczno-androgennych, kortykosteroidów, beta-agonistów, stymulantów ośrodkowego układu nerwowego oraz analgetyków opioidowych.
    </div>
  </div>

  <!-- Clause 4 -->
  <div class="clause-box">
    <div class="clause-header">
      <span class="clause-check">${c.disciplinaryConsequencesAcknowledged ? '☑' : '☒'}</span>
      <span class="clause-title">4. Świadomość Sankcji Dyscyplinarnych i Prawnych</span>
    </div>
    <div class="clause-text">
      Przyjmuję do wiadomości, że w przypadku stwierdzenia wyniku pozytywnego próby antydopingowej grożą mi sankcje: natychmiastowa dyskwalifikacja gołębi, anulowanie wyników całego sezonu, przepadek zdobytych nagród, zawieszenie lub wykluczenie ze struktur PZHGP oraz zawiadomienie organów ścigania z tytułu Ustawy o Ochronie Zwierząt.
    </div>
  </div>

  <!-- Clause 5 -->
  <div class="clause-box">
    <div class="clause-header">
      <span class="clause-check">${c.animalWelfareDeclaration ? '☑' : '☒'}</span>
      <span class="clause-title">5. Gwarancja Dobrostanu i Ochrony Weterynaryjnej Stada</span>
    </div>
    <div class="clause-text">
      Zapewniam, że całe stado lotowe posiada ważne, poświadczone urzędowo szczepienia przeciwko rzekomemu pomorowi gołębi (paramyksowiroza PMV-1), a w gołębniku utrzymywane są optymalne standardy zoohigieniczne, wentylacyjne i żywieniowe.
    </div>
  </div>

  <!-- Clause 6 -->
  <div class="clause-box">
    <div class="clause-header">
      <span class="clause-check">${c.noActiveSuspensions ? '☑' : '☒'}</span>
      <span class="clause-title">6. Oświadczenie o Braku Kar Dyscyplinarnych</span>
    </div>
    <div class="clause-text">
      Oświadczam, że nie ciążą na mnie żadne prawomocne wyroki Sądów Koleżeńskich PZHGP ani zakazy uczestnictwa we współzawodnictwie lotowym w Polsce i za granicą.
    </div>
  </div>

  <div class="warning-box">
    <strong>Pouczenie Prawne:</strong> Złożenie fałszywego oświadczenia lub odmowa poddania się kontroli antydopingowej skutkuje natychmiastowym wstrzymaniem wydawania list konkursowych i wszczęciem procedury dyscyplinarnej.
  </div>

  <div class="sign-section">
    <div class="sign-box">
      <div>........................................................</div>
      <strong>Czytelny Podpis Hodowcy</strong>
      <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">(Własnoręcznie)</div>
    </div>
    <div class="sign-box">
      <div>........................................................</div>
      <strong>Prezes / Wiceprezes ds. Lotowych</strong>
      <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Podpis i Pieczęć Oddziału PZHGP</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Formularz Deklaracji Etycznej i Antydopingowej Z-080</div>
    <div>Wydrukowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
