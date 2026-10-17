/**
 * PIGEON-FLY — Electronic Clocking Systems (ESK) Data Import Engine (Z-050)
 * Parses flight clockings from Benzing, Tauris, Bricon, and Mega/Unikon systems
 * from text logs (.txt, .dat, .csv), normalizes ring numbers, deduplicates antenna hits,
 * and matches with race basketing data to compute flight speeds (m/min).
 */

import { BasketEntry } from './basketing';
import { ArrivalWithPigeon } from '../db/raceRepository';

export type EskClockBrand =
  | 'tauris'
  | 'benzing'
  | 'bricon'
  | 'mega'
  | 'generic_csv'
  | 'unknown';

export interface EskArrivalRecord {
  id: string;
  orderIndex: number;
  rawLine: string;
  clockBrand: EskClockBrand;
  originalRing: string;
  ringNumber: string; // Normalized (e.g. PL-0284-23-1402)
  countryCode: string;
  year?: number;
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string; // HH:MM:SS or HH:MM:SS.sss
  arrivalTimeIso: string; // Full ISO timestamp
  clockSpeedMPerMin?: number; // Speed calculated by ESK terminal if present
  calculatedSpeedMPerMin?: number; // Speed calculated using race distance & release time
  antenna?: string;
  chipCode?: string;
  status: 'valid' | 'duplicate' | 'time_paradox' | 'unbasketed' | 'error';
  errorMessage?: string;
  isMatchedWithBasket?: boolean;
  basketPigeonId?: string;
}

export interface EskParseOptions {
  clockBrand?: EskClockBrand;
  defaultDate?: string; // YYYY-MM-DD fallback if clock line has only time
  raceDistanceMeters?: number;
  releaseTimeIso?: string;
}

export interface EskParseResult {
  clockBrand: EskClockBrand;
  totalLines: number;
  records: EskArrivalRecord[];
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  summaryText: string;
}

export interface EskMatchResult {
  matchedRecords: EskArrivalRecord[];
  unmatchedRecords: EskArrivalRecord[];
  unbasketedCount: number;
  arrivalsToSave: ArrivalWithPigeon[];
}

/**
 * Normalizes pigeon ring number into canonical uppercase format:
 * e.g. "pl-0284-23-0001402" -> "PL-0284-23-1402"
 * e.g. "PL 0284 23 1402" -> "PL-0284-23-1402"
 * e.g. "DV 01234 24 512" -> "DV-01234-24-512"
 */
export function normalizeEskRingNumber(rawRing: string): string {
  if (!rawRing) return '';

  let cleaned = rawRing.trim().toUpperCase();

  // Replace commas, semicolons, tabs, multiple spaces, dots, slashes with hyphens
  cleaned = cleaned.replace(/[\s\t.,/_]+/g, '-');

  // Remove consecutive hyphens
  cleaned = cleaned.replace(/-+/g, '-');

  // Handle prefix like PL0284 -> PL-0284
  const matchCountryPrefix = cleaned.match(/^([A-Z]{2,4})(\d+.*)$/);
  if (matchCountryPrefix) {
    const country = matchCountryPrefix[1];
    const rest = matchCountryPrefix[2];
    if (!rest.startsWith('-')) {
      cleaned = `${country}-${rest}`;
    }
  }

  // Handle leading zeros in the final sequence number (e.g. PL-0284-23-0001402 -> PL-0284-23-1402)
  const parts = cleaned.split('-');
  if (parts.length >= 4) {
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart) && lastPart.length > 3) {
      const strippedNumber = parseInt(lastPart, 10).toString();
      parts[parts.length - 1] = strippedNumber;
      cleaned = parts.join('-');
    }
  }

  return cleaned;
}

/**
 * Autodetects the clock manufacturer brand from header or content signatures.
 */
export function detectClockBrand(content: string): EskClockBrand {
  const upper = content.toUpperCase();
  if (upper.includes('TAURIS') || upper.includes('WORLD TERMINAL')) {
    return 'tauris';
  }
  if (
    upper.includes('BENZING') ||
    upper.includes('CLUB M1') ||
    upper.includes('BENZING LIVE') ||
    upper.includes('ATIS')
  ) {
    return 'benzing';
  }
  if (upper.includes('BRICON') || upper.includes('PASBOX') || upper.includes('SPEEDY')) {
    return 'bricon';
  }
  if (upper.includes('MEGA') || upper.includes('UNIKON')) {
    return 'mega';
  }
  if (
    upper.includes('RING') ||
    upper.includes('OBRĄCZKA') ||
    upper.includes('OBRACZKA') ||
    upper.includes('ANKUNFT') ||
    upper.includes('PRZYLOT')
  ) {
    return 'generic_csv';
  }
  return 'unknown';
}

/**
 * Parses date string in multiple common formats:
 * DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, DD.MM.YY
 */
function parseDateString(dateStr: string, defaultDate: string): string {
  if (!dateStr) return defaultDate;
  const clean = dateStr.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // DD.MM.YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  return defaultDate;
}

/**
 * Parses time string in formats: HH:MM:SS or HH:MM:SS.sss
 */
function parseTimeString(timeStr: string): string {
  if (!timeStr) return '12:00:00';
  const clean = timeStr.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    const s = match[3];
    return match[4] ? `${h}:${m}:${s}.${match[4]}` : `${h}:${m}:${s}`;
  }
  return clean;
}

/**
 * Parses raw text or CSV content from ESK clock export.
 */
export function parseEskArrivalFile(
  content: string,
  options?: EskParseOptions
): EskParseResult {
  const brand = options?.clockBrand && options.clockBrand !== 'unknown'
    ? options.clockBrand
    : detectClockBrand(content);

  const effectiveBrand: EskClockBrand = brand === 'unknown' ? 'generic_csv' : brand;
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  const defaultDate = options?.defaultDate || todayIsoDate;

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rawRecords: EskArrivalRecord[] = [];
  let orderCounter = 1;
  let errorCount = 0;

  for (const line of lines) {
    // Ignore header banner lines
    const lineUpper = line.toUpperCase();
    if (
      lineUpper.startsWith('---') ||
      lineUpper.startsWith('===') ||
      lineUpper.startsWith('TAURIS WORLD') ||
      lineUpper.startsWith('BENZING LIVE') ||
      lineUpper.startsWith('BRICON SPEEDY') ||
      lineUpper.startsWith('MEGA SYSTEM') ||
      lineUpper.startsWith('LP;') ||
      lineUpper.startsWith('NR;') ||
      lineUpper.startsWith('RING;') ||
      lineUpper.startsWith('OBRĄCZKA') ||
      lineUpper.startsWith('OBRACZKA') ||
      lineUpper.startsWith('DATA;') ||
      lineUpper.startsWith('TIME;') ||
      lineUpper.includes('LISTA PRZYLOTÓW') ||
      lineUpper.includes('ANKUNFTSLISTE')
    ) {
      continue;
    }

    // Try parsing line according to format
    const parsed = parseLine(line, effectiveBrand, defaultDate, orderCounter);
    if (parsed) {
      rawRecords.push(parsed);
      orderCounter++;
    } else {
      errorCount++;
    }
  }

  // Deduplication: group by normalized ringNumber
  // If the same bird is clocked multiple times, the first arrival is valid, subsequent are duplicate.
  const seenRings = new Map<string, EskArrivalRecord>();
  let duplicateCount = 0;
  let validCount = 0;

  for (const rec of rawRecords) {
    if (seenRings.has(rec.ringNumber)) {
      rec.status = 'duplicate';
      rec.errorMessage = `Ptak odbity powtórnie (pierwsze odbicie: ${seenRings.get(rec.ringNumber)!.arrivalTime})`;
      duplicateCount++;
    } else {
      seenRings.set(rec.ringNumber, rec);
      rec.status = 'valid';
      validCount++;
    }
  }

  const summaryText = `Wykryto system: ${effectiveBrand.toUpperCase()}. Przetworzono ${rawRecords.length} przylotów (Prawidłowe: ${validCount}, Duplikaty anten: ${duplicateCount}, Błędy formatu: ${errorCount}).`;

  return {
    clockBrand: effectiveBrand,
    totalLines: lines.length,
    records: rawRecords,
    validCount,
    duplicateCount,
    errorCount,
    summaryText,
  };
}

function isLikelySpeed(valStr: string): boolean {
  if (!/^\d+(?:[.,]\d+)?$/.test(valStr)) return false;
  const num = parseFloat(valStr.replace(',', '.'));
  if (valStr.includes('.') || valStr.includes(',')) {
    return num >= 200 && num <= 3000;
  }
  return num >= 400 && num <= 2600;
}

/**
 * Parses an individual clock line based on detected brand or generic heuristic.
 */
function parseLine(
  line: string,
  brand: EskClockBrand,
  defaultDate: string,
  orderIndex: number
): EskArrivalRecord | null {
  // 1. Semicolon-delimited (typical Benzing CSV or German exports)
  if (line.includes(';')) {
    const parts = line.split(';').map((p) => p.trim());
    if (parts.length >= 3) {
      let ring = '';
      let dateStr = defaultDate;
      let timeStr = '';
      let speed: number | undefined;
      let antenna: string | undefined;
      let chip: string | undefined;

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (/^[A-Z]{2,4}[-\s]?\d+/i.test(p) && !ring) {
          ring = p;
        } else if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(p) && dateStr === defaultDate) {
          dateStr = parseDateString(p, defaultDate);
        } else if (/^\d{1,2}:\d{2}:\d{2}/.test(p) && !timeStr) {
          timeStr = parseTimeString(p);
        } else if (isLikelySpeed(p) && !speed) {
          speed = parseFloat(p.replace(',', '.'));
        } else if (/^(?:ANT:?)?\d{1,2}$/i.test(p) && !antenna && i > 0) {
          antenna = p;
        } else if (/^[0-9A-F]{6,10}$/i.test(p) && !chip) {
          chip = p;
        }
      }

      if (ring && timeStr) {
        const normRing = normalizeEskRingNumber(ring);
        const arrivalIso = `${dateStr}T${timeStr.split('.')[0]}.000Z`;
        return {
          id: `esk-${orderIndex}-${Date.now()}`,
          orderIndex,
          rawLine: line,
          clockBrand: brand,
          originalRing: ring,
          ringNumber: normRing,
          countryCode: normRing.split('-')[0] || 'PL',
          arrivalDate: dateStr,
          arrivalTime: timeStr,
          arrivalTimeIso: arrivalIso,
          clockSpeedMPerMin: speed,
          antenna,
          chipCode: chip,
          status: 'valid',
        };
      }
    }
  }

  // 2. Comma-delimited (Generic CSV / Tauris CSV)
  if (line.includes(',')) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      let ring = '';
      let dateStr = defaultDate;
      let timeStr = '';
      let speed: number | undefined;
      let antenna: string | undefined;
      let chip: string | undefined;

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (/^[A-Z]{2,4}[-\s]?\d+/i.test(p) && !ring) {
          ring = p;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(p) || /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(p)) {
          dateStr = parseDateString(p, defaultDate);
        } else if (/^\d{1,2}:\d{2}:\d{2}/.test(p) && !timeStr) {
          timeStr = parseTimeString(p);
        } else if (isLikelySpeed(p) && !speed) {
          speed = parseFloat(p.replace(',', '.'));
        } else if (/^(?:A\d+|\d{1,2})$/i.test(p) && !antenna && i > 0) {
          antenna = p;
        } else if (/^[0-9A-F]{6,10}$/i.test(p) && !chip) {
          chip = p;
        }
      }

      if (ring && timeStr) {
        const normRing = normalizeEskRingNumber(ring);
        const arrivalIso = `${dateStr}T${timeStr.split('.')[0]}.000Z`;
        return {
          id: `esk-${orderIndex}-${Date.now()}`,
          orderIndex,
          rawLine: line,
          clockBrand: brand,
          originalRing: ring,
          ringNumber: normRing,
          countryCode: normRing.split('-')[0] || 'PL',
          arrivalDate: dateStr,
          arrivalTime: timeStr,
          arrivalTimeIso: arrivalIso,
          clockSpeedMPerMin: speed,
          antenna,
          chipCode: chip,
          status: 'valid',
        };
      }
    }
  }

  // 3. Space-delimited / fixed-width text line (Tauris, Benzing M1, Bricon, Mega)
  const tokens = line.split(/\s+/).map((t) => t.trim()).filter((t) => t.length > 0);
  if (tokens.length >= 2) {
    let ring = '';
    let dateStr = defaultDate;
    let timeStr = '';
    let speed: number | undefined;
    let antenna: string | undefined;
    let chip: string | undefined;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (/^[A-Z]{2,4}[-\s]?\d+/i.test(t) && !ring) {
        ring = t;
      } else if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(t) && dateStr === defaultDate) {
        dateStr = parseDateString(t, defaultDate);
      } else if (/^\d{1,2}:\d{2}:\d{2}/.test(t) && !timeStr) {
        timeStr = parseTimeString(t);
      } else if (isLikelySpeed(t) && !speed) {
        speed = parseFloat(t.replace(',', '.'));
      } else if (/^(?:A\d+|ANT:?\d+|\d{1,2})$/i.test(t) && !antenna && i > 0) {
        antenna = t;
      } else if (/^[0-9A-F]{6,10}$/i.test(t) && !chip) {
        chip = t;
      }
    }

    if (ring && timeStr) {
      const normRing = normalizeEskRingNumber(ring);
      const arrivalIso = `${dateStr}T${timeStr.split('.')[0]}.000Z`;
      return {
        id: `esk-${orderIndex}-${Date.now()}`,
        orderIndex,
        rawLine: line,
        clockBrand: brand,
        originalRing: ring,
        ringNumber: normRing,
        countryCode: normRing.split('-')[0] || 'PL',
        arrivalDate: dateStr,
        arrivalTime: timeStr,
        arrivalTimeIso: arrivalIso,
        clockSpeedMPerMin: speed,
        antenna,
        chipCode: chip,
        status: 'valid',
      };
    }
  }

  return null;
}

/**
 * Matches parsed ESK records with basketed pigeons and calculates flight speed.
 */
export function matchEskWithBasketed(
  records: EskArrivalRecord[],
  basketed: BasketEntry[],
  raceParams: {
    releaseTimeIso: string;
    raceDistanceMeters: number;
    raceId?: string;
  }
): EskMatchResult {
  const basketMap = new Map<string, BasketEntry>();
  for (const b of basketed) {
    const norm = normalizeEskRingNumber(b.ringNumber);
    basketMap.set(norm, b);
  }

  const releaseMs = new Date(raceParams.releaseTimeIso).getTime();
  const matchedRecords: EskArrivalRecord[] = [];
  const unmatchedRecords: EskArrivalRecord[] = [];
  const arrivalsToSave: ArrivalWithPigeon[] = [];
  let unbasketedCount = 0;

  for (const rec of records) {
    // Only process valid records (or allow user to inspect duplicates)
    if (rec.status === 'duplicate' || rec.status === 'error') {
      unmatchedRecords.push(rec);
      continue;
    }

    const arrivalMs = new Date(rec.arrivalTimeIso).getTime();

    // Check time paradox: arrival before release
    if (arrivalMs < releaseMs) {
      rec.status = 'time_paradox';
      rec.errorMessage = `Czas przylotu (${rec.arrivalTime}) jest wcześniejszy niż start lotu (${new Date(raceParams.releaseTimeIso).toLocaleTimeString('pl-PL')})!`;
      unmatchedRecords.push(rec);
      continue;
    }

    // Compute velocity: v = distance / flightTimeMinutes
    const flightMinutes = (arrivalMs - releaseMs) / (1000 * 60);
    let speed = 0;
    if (flightMinutes > 0 && raceParams.raceDistanceMeters > 0) {
      speed = Number((raceParams.raceDistanceMeters / flightMinutes).toFixed(3));
      rec.calculatedSpeedMPerMin = speed;
    }

    const matchedBasket = basketMap.get(rec.ringNumber);
    if (matchedBasket) {
      rec.isMatchedWithBasket = true;
      rec.basketPigeonId = matchedBasket.pigeonId;
      matchedRecords.push(rec);

      // Create ArrivalWithPigeon object
      const arrivalItem: ArrivalWithPigeon = {
        id: `esk-arr-${rec.orderIndex}-${Date.now()}`,
        raceId: raceParams.raceId || 'race-01',
        pigeonId: matchedBasket.pigeonId,
        ringNumber: rec.ringNumber,
        countryCode: matchedBasket.countryCode || rec.countryCode,
        year: matchedBasket.year || new Date().getFullYear(),
        sex: matchedBasket.sex,
        plumageColor: matchedBasket.plumageColor || 'Niebieski',
        arrivalTime: rec.arrivalTimeIso,
        distanceMeters: raceParams.raceDistanceMeters,
        velocityMPerMin: rec.clockSpeedMPerMin || speed,
        scanType: 'esk',
        isManualOverride: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      arrivalsToSave.push(arrivalItem);
    } else {
      rec.status = 'unbasketed';
      rec.errorMessage = `Gołąb ${rec.ringNumber} nie figuruje na liście wkładaniowej tego lotu!`;
      unbasketedCount++;
      unmatchedRecords.push(rec);

      // Even unbasketed birds can be saved with placeholder pigeon metadata
      const arrivalItem: ArrivalWithPigeon = {
        id: `esk-arr-${rec.orderIndex}-${Date.now()}`,
        raceId: raceParams.raceId || 'race-01',
        pigeonId: `unbasketed-${rec.ringNumber}`,
        ringNumber: rec.ringNumber,
        countryCode: rec.countryCode,
        year: new Date().getFullYear(),
        sex: 'cock',
        plumageColor: 'Nieznana (Niekoszowany)',
        arrivalTime: rec.arrivalTimeIso,
        distanceMeters: raceParams.raceDistanceMeters,
        velocityMPerMin: rec.clockSpeedMPerMin || speed,
        scanType: 'esk',
        isManualOverride: true,
        overrideReason: 'Ptak niekoszowany odbity na zegarze ESK',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      arrivalsToSave.push(arrivalItem);
    }
  }

  // Sort arrivals descending by velocity
  arrivalsToSave.sort((a, b) => b.velocityMPerMin - a.velocityMPerMin);

  return {
    matchedRecords,
    unmatchedRecords,
    unbasketedCount,
    arrivalsToSave,
  };
}

/**
 * Realistic sample ESK test logs for breeder demonstration and automated tests.
 */
export const SAMPLE_ESK_FILES = {
  tauris: `TAURIS WORLD TERMINAL - RAPORT PRZYLOTÓW
LOT: Magdeburg  DYSTANS: 345.200 km  START: 06:00:00
--------------------------------------------------------
001  PL-0284-23-1402   12.05.2024 10:14:22   A1   9A2B3C4D   1342.541
002  DV-01234-24-512   12.05.2024 10:18:05   A1   3B4C5D6E   1324.112
003  PL-0284-22-801    12.05.2024 10:21:40   A2   7F8A9B1C   1305.820
004  PL-0284-23-1402   12.05.2024 10:22:15   A2   9A2B3C4D   1302.500
005  PL-0284-21-305    12.05.2024 10:25:50   A1   1C2D3E4F   1286.200`,

  benzing: `BENZING LIVE - ANKUNFTSLISTE
Wettflug: Magdeburg  Datum: 12.05.2024
Nr;Ringnummer;Datum;Uhrzeit;Geschwindigkeit;Ant;Chip
1;PL-0284-23-1402;12.05.2024;10:14:22.40;1342.54;01;9A2B3C4D
2;DV-01234-24-512;12.05.2024;10:18:05.10;1324.11;01;3B4C5D6E
3;PL-0284-22-801;12.05.2024;10:21:40.85;1305.82;02;7F8A9B1C
4;PL-0284-20-9999;12.05.2024;10:29:12.00;1269.45;01;5E6F7A8B`,

  bricon: `BRICON SPEEDY / CLUB MASTER
Lot: Magdeburg  12/05/2024
001 PL-0284-23-1402 12/05/2024 10:14:22 Ant:01 1342.54
002 DV-01234-24-512 12/05/2024 10:18:05 Ant:01 1324.11
003 PL-0284-22-801  12/05/2024 10:21:40 Ant:02 1305.82`,
};
