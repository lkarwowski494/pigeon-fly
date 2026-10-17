/**
 * PIGEON-FLY — E-Rejestr Wypożyczeń Koszy Transportowych i Ewidencja Skrzynek Sekcyjnych (Z-094 / DEC-108)
 * Gospodarka inwentarzem klatek i koszy Sekcji / Oddziału PZHGP:
 * - Ewidencja magazynowa skrzynek (aluminiowe, drewniane, treningowe do bagażnika, kabinowe).
 * - System wydań i zwrotów dla hodowców (treningi prywatne, wywózki, izolacja).
 * - Rozliczanie kaucji finansowych (PLN) i kontrola terminowości zwrotu (alarm opóźnienia - Overdue).
 * - Obowiązek dezynfekcji biobójczej kosza przed ponownym przyjęciem do magazynu.
 * - Oficjalny Protokół Zdawczo-Odbiorczy A4 HTML/PDF z podpisami gospodarza sekcji i hodowcy.
 */

export type CrateType =
  | 'aluminum_standard'
  | 'aluminum_heavy'
  | 'wood_traditional'
  | 'training_small';

export type CrateStatus =
  | 'in_storage'
  | 'rented'
  | 'quarantine_disinfection'
  | 'damaged_maintenance';

export type CratePhysicalCondition =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'damaged';

export type RentalPurpose =
  | 'private_training'
  | 'race_transport'
  | 'derby_loft_exchange'
  | 'medical_isolation';

export interface CrateInventoryItem {
  crateId: string; // np. "KOSZ-0284-042"
  inventoryNumber: string; // np. "INW/2026/42"
  type: CrateType;
  capacityPigeons: number; // np. 20 ptaków
  status: CrateStatus;
  condition: CratePhysicalCondition;
  lastDisinfectionDate: string; // YYYY-MM-DD
  currentHolderBreederName?: string;
  notes?: string;
}

export interface CrateRentalEntry {
  rentalId: string; // np. "WYP-2026/088"
  crateId: string;
  breederName: string;
  breederPzhgpNumber: string;
  checkoutDate: string; // YYYY-MM-DD
  expectedReturnDate: string; // YYYY-MM-DD
  actualReturnDate?: string;
  depositPaidPln: number; // np. 100 zł
  depositReturned: boolean;
  purpose: RentalPurpose;
  conditionAtCheckout: string;
  conditionAtReturn?: string;
  disinfectionConfirmedOnReturn: boolean;
  officerName: string; // Gospodarz sekcji wydający sprzęt
  notes?: string;
}

export const CRATE_TYPE_LABELS: Record<CrateType, string> = {
  aluminum_standard: 'Aluminiowa standardowa (20-25 ptaków, lekka)',
  aluminum_heavy: 'Aluminiowa wzmocniona kabinowa (30 ptaków)',
  wood_traditional: 'Tradycyjna drewniana ze sklejki i rusztem',
  training_small: 'Kompaktowa do bagażnika na krótkie wywózki (10-15 ptaków)',
};

export const RENTAL_PURPOSE_LABELS: Record<RentalPurpose, string> = {
  private_training: 'Prywatny trening stada / wywózka próbna',
  race_transport: 'Dowóz gołębi na punkt wkładania (koszowanie)',
  derby_loft_exchange: 'Przewóz młodych na gołębnik derbowy (MWG)',
  medical_isolation: 'Izolacja transportowa chorych ptaków do lecznicy',
};

/**
 * Checks if a rental is overdue compared to current date.
 */
export function isRentalOverdue(
  rental: CrateRentalEntry,
  currentDate = new Date().toISOString().split('T')[0]
): boolean {
  if (rental.actualReturnDate) return false;
  return rental.expectedReturnDate < currentDate;
}

/**
 * Validates mandatory fields for crate rental registration.
 */
export function validateCrateRental(rental: CrateRentalEntry): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!rental.rentalId || !rental.rentalId.trim()) {
    errors.push('Brak numeru ewidencyjnego wypożyczenia!');
  }
  if (!rental.crateId || !rental.crateId.trim()) {
    errors.push('Brak oznaczenia wypożyczanej klatki/kosza!');
  }
  if (!rental.breederName || !rental.breederName.trim()) {
    errors.push('Brak nazwiska wypożyczającego hodowcy!');
  }
  if (!rental.checkoutDate) {
    errors.push('Brak daty wydania sprzętu!');
  }
  if (!rental.expectedReturnDate) {
    errors.push('Brak planowanej daty zwrotu kosza!');
  }
  if (rental.expectedReturnDate < rental.checkoutDate) {
    errors.push('Planowana data zwrotu nie może być wcześniejsza niż data wydania!');
  }
  if (!rental.officerName || !rental.officerName.trim()) {
    errors.push('Brak nazwiska gospodarza sekcji wydającego kosz!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates summary metrics for crate depot inventory.
 */
export function calculateDepotStats(
  inventory: CrateInventoryItem[],
  rentals: CrateRentalEntry[],
  currentDate = new Date().toISOString().split('T')[0]
): {
  totalCrates: number;
  availableInStorage: number;
  currentlyRented: number;
  inDisinfectionOrRepair: number;
  overdueRentalsCount: number;
  totalDepositsHeldPln: number;
} {
  const totalCrates = inventory.length;
  const availableInStorage = inventory.filter((c) => c.status === 'in_storage').length;
  const currentlyRented = inventory.filter((c) => c.status === 'rented').length;
  const inDisinfectionOrRepair = inventory.filter(
    (c) => c.status === 'quarantine_disinfection' || c.status === 'damaged_maintenance'
  ).length;

  const activeRentals = rentals.filter((r) => !r.actualReturnDate);
  const overdueRentalsCount = activeRentals.filter((r) =>
    isRentalOverdue(r, currentDate)
  ).length;

  const totalDepositsHeldPln = activeRentals
    .filter((r) => !r.depositReturned)
    .reduce((sum, r) => sum + (r.depositPaidPln || 0), 0);

  return {
    totalCrates,
    availableInStorage,
    currentlyRented,
    inDisinfectionOrRepair,
    overdueRentalsCount,
    totalDepositsHeldPln,
  };
}

/**
 * Generates official A4 Printable HTML Handover Protocol of Crate Rental.
 */
export function generateCrateRentalProtocolHtml(
  rental: CrateRentalEntry,
  crate: CrateInventoryItem,
  meta?: { branchName?: string; sectionName?: string }
): string {
  const branch = meta?.branchName || 'Oddział 0284 Poznań Zachód';
  const section = meta?.sectionName || 'Sekcja 1 Wilda';

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Protokół Wypożyczenia Kosza Transportowego — ${rental.rentalId}</title>
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

    .notes-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #0f172a;
      padding: 6px 10px;
      margin-bottom: 12px;
      font-size: 8pt;
      color: #334155;
    }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
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
      <div class="title">Protokół Zdawczo-Odbiorczy Sprzętu Transportowego</div>
      <div class="subtitle">Ewidencja Inwentarzowa Klatek i Koszy Sekcji PZHGP (Z-094)</div>
    </div>
    <div class="meta">
      <div>Protokół Nr: <strong>${rental.rentalId}</strong></div>
      <div>${branch} • ${section}</div>
      <div>Wydano dnia: <strong>${rental.checkoutDate}</strong></div>
    </div>
  </div>

  <div class="banner">
    <div>
      <div class="banner-title">Kosz: ${crate.crateId} (${crate.inventoryNumber})</div>
      <div class="banner-desc">
        Typ: <strong>${CRATE_TYPE_LABELS[crate.type]}</strong> • Pojemność: <strong>${crate.capacityPigeons} gołębi</strong>
      </div>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 7.5pt; color: #64748b;">Kaucja zwrotna:</span><br>
      <strong style="font-size: 12pt; color: #166534;">${rental.depositPaidPln} PLN</strong>
    </div>
  </div>

  <div class="grid-2">
    <!-- Dane Wypożyczenia -->
    <div class="card">
      <div class="card-title">1. STRONY I CEL DYSPONOWANIA</div>
      <div class="row">
        <span class="label">Wypożyczający Hodowca:</span>
        <span class="val">${rental.breederName}</span>
      </div>
      <div class="row">
        <span class="label">Numer Hodowcy PZHGP:</span>
        <span class="val" style="font-family: monospace;">${rental.breederPzhgpNumber}</span>
      </div>
      <div class="row">
        <span class="label">Cel wypożyczenia:</span>
        <span class="val">${RENTAL_PURPOSE_LABELS[rental.purpose]}</span>
      </div>
      <div class="row">
        <span class="label">Planowany termin zwrotu:</span>
        <span class="val" style="color: #0284c7;">${rental.expectedReturnDate}</span>
      </div>
    </div>

    <!-- Stan Techniczny i Sanitarny -->
    <div class="card">
      <div class="card-title">2. STAN PRZY WYDANIU I DEZYNFEKCJA</div>
      <div class="row">
        <span class="label">Stan techniczny przy wydaniu:</span>
        <span class="val">${rental.conditionAtCheckout}</span>
      </div>
      <div class="row">
        <span class="label">Ostatnia dezynfekcja magazynowa:</span>
        <span class="val">${crate.lastDisinfectionDate}</span>
      </div>
      <div class="row">
        <span class="label">Gospodarz wydający sprzęt:</span>
        <span class="val">${rental.officerName}</span>
      </div>
      <div class="row">
        <span class="label">Kaucja pobrana do kasy:</span>
        <span class="val">${rental.depositPaidPln > 0 ? 'TAK (Pokwitowano)' : 'Zwolniony z kaucji'}</span>
      </div>
    </div>
  </div>

  <div class="notes-box">
    <strong>Klauzula Odpowiedzialności i Bioasekuracji:</strong><br>
    Wypożyczający zobowiązuje się do zwrotu kosza w stanie niepogorszonym oraz do przeprowadzenia dokładnego
    oczyszczenia z odchodów i oprysku preparatem biobójczym (Virkon S / Ecocid) przed zwrotem do magazynu sekcyjnego.
    Niezwrócenie kosza w terminie lub jego uszkodzenie powoduje przepadek kaucji na fundusz sprzętowy sekcji.
  </div>

  ${
    rental.actualReturnDate
      ? `
  <div style="background: #f0fdf4; border: 1.5px solid #16a34a; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px;">
    <strong>POTWIERDZENIE ZWROTU SPRZĘTU DO MAGAZYNU:</strong><br>
    Zwrócono dnia: <strong>${rental.actualReturnDate}</strong> • 
    Dezynfekcja przy zwrocie: <strong>${rental.disinfectionConfirmedOnReturn ? 'Zatwierdzona' : 'Brak'}</strong> • 
    Zwrot kaucji: <strong>${rental.depositReturned ? 'Zwrócono ' + rental.depositPaidPln + ' PLN' : 'Zatrzymano'}</strong>
  </div>
  `
      : ''
  }

  <div class="signatures">
    <div class="sig-col">
      <div class="sig-title">Gospodarz Sprzętu / Wydający</div>
      <div class="sig-name">${rental.officerName}</div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Wypożyczający Hodowca</div>
      <div class="sig-name">${rental.breederName}</div>
    </div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • E-Rejestr Sprzętu i Koszy Sekcyjnych Z-094 (DEC-108)</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
