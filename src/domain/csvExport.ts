/**
 * PIGEON-FLY — CSV Export Domain Engine (FCI / PZHGP & District Programs)
 * Generates semicolon-separated CSV files compatible with Microsoft Excel,
 * LibreOffice Calc, and PZHGP calculation systems (Kalkulator Zegarowy, SuperGołąb).
 */

import { Pigeon } from './types';
import { BasketPigeonItem } from './pdfExport';

export interface ConcourseCsvItem {
  position: number;
  ringNumber: string;
  sex?: 'cock' | 'hen' | 'unknown' | string;
  plumageColor?: string;
  fancierName?: string;
  loftName?: string;
  arrivalTime: string;
  distanceKm: number;
  velocityMPerMin: number;
  fciCoeff: number;
  gmpPoints: number;
  isTip?: boolean;
}

export interface ConcourseCsvOptions {
  clubBranch?: string;
  raceName: string;
  releaseLocation: string;
  releaseDateTime?: string;
  distanceKm: number;
  totalBasketed: number;
  basePercent: number;
  prizeLimit: number;
  items: ConcourseCsvItem[];
}

export interface BasketingCsvOptions {
  clubBranch?: string;
  raceName: string;
  releaseLocation: string;
  basketingDate: string;
  pigeons: BasketPigeonItem[];
}

/**
 * Escapes CSV field value according to RFC 4180 with European semicolon delimiter support.
 */
export function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports official Concourse Sheet results into European semicolon-delimited CSV.
 */
export function exportConcourseToCsv(options: ConcourseCsvOptions): string {
  const lines: string[] = [];

  // Metadata comments / header rows
  lines.push(`# PIGEON-FLY — Oficjalna Lista Konkursowa PZHGP / FCI`);
  lines.push(`# Lot: ${escapeCsvField(options.raceName)} (${escapeCsvField(options.releaseLocation)})`);
  lines.push(`# Dystans: ${options.distanceKm.toFixed(3)} km | Start: ${escapeCsvField(options.releaseDateTime || '—')}`);
  lines.push(`# Wlozone: ${options.totalBasketed} | Baza: ${options.basePercent}% | Konkursow: ${options.prizeLimit}`);
  if (options.clubBranch) {
    lines.push(`# Jednostka: ${escapeCsvField(options.clubBranch)}`);
  }
  lines.push('');

  // Column Headers
  const headers = [
    'Pozycja',
    'Numer_Obraczki',
    'Plec',
    'Barwa',
    'Hodowca',
    'Golebnik',
    'Czas_Przylotu',
    'Dystans_km',
    'Predkosc_m_min',
    'Coeff_FCI',
    'Punkty_GMP',
    'Seria_5_50',
  ];
  lines.push(headers.join(';'));

  // Data rows
  for (const item of options.items) {
    const sexStr = item.sex === 'cock' ? '1.0' : item.sex === 'hen' ? '0.1' : '—';
    const seriesStr = item.isTip ? 'TAK' : 'NIE';
    const row = [
      escapeCsvField(item.position),
      escapeCsvField(item.ringNumber),
      escapeCsvField(sexStr),
      escapeCsvField(item.plumageColor || ''),
      escapeCsvField(item.fancierName || ''),
      escapeCsvField(item.loftName || ''),
      escapeCsvField(item.arrivalTime),
      escapeCsvField(item.distanceKm.toFixed(3)),
      escapeCsvField(item.velocityMPerMin.toFixed(3)),
      escapeCsvField(item.fciCoeff.toFixed(3)),
      escapeCsvField(item.gmpPoints.toFixed(2)),
      escapeCsvField(seriesStr),
    ];
    lines.push(row.join(';'));
  }

  return lines.join('\r\n');
}

/**
 * Exports Basketing List (lista wkładaniowa) into semicolon-delimited CSV.
 */
export function exportBasketingToCsv(options: BasketingCsvOptions): string {
  const lines: string[] = [];

  lines.push(`# PIGEON-FLY — Lista Wkladaniowa do Kosza`);
  lines.push(`# Lot: ${escapeCsvField(options.raceName)} (${escapeCsvField(options.releaseLocation)})`);
  lines.push(`# Data koszowania: ${escapeCsvField(options.basketingDate)} | Wlozono sztuk: ${options.pigeons.length}`);
  if (options.clubBranch) {
    lines.push(`# Oddzial / Sekcja: ${escapeCsvField(options.clubBranch)}`);
  }
  lines.push('');

  const headers = [
    'Lp',
    'Numer_Obraczki',
    'Barwa',
    'Plec',
    'Obraczka_Pomocnicza_Czip',
    'Typowanie_Seria',
  ];
  lines.push(headers.join(';'));

  for (const p of options.pigeons) {
    const sexStr = p.sex === 'cock' ? '1.0' : p.sex === 'hen' ? '0.1' : '—';
    const row = [
      escapeCsvField(p.index),
      escapeCsvField(p.ringNumber),
      escapeCsvField(p.color),
      escapeCsvField(sexStr),
      escapeCsvField(p.auxiliaryRing || ''),
      escapeCsvField(p.isTip ? 'SERIA' : 'ZWYKLY'),
    ];
    lines.push(row.join(';'));
  }

  return lines.join('\r\n');
}

/**
 * Exports Flock Inventory (spis stada) into semicolon-delimited CSV for PZHGP annual registration.
 */
export function exportFlockToCsv(pigeons: Pigeon[]): string {
  const lines: string[] = [];

  lines.push(`# PIGEON-FLY — Rejestr Stada Golebi Pocztowych`);
  lines.push(`# Wygenerowano: ${new Date().toISOString().slice(0, 10)} | Liczba ptakow: ${pigeons.length}`);
  lines.push('');

  const headers = [
    'Lp',
    'Kraj',
    'Numer_Obraczki',
    'Rocznik',
    'Plec',
    'Barwa_Upierzenia',
    'Oko',
    'Status',
    'Obraczka_Pomocnicza',
    'Znacznik_Kolor',
    'Ojciec_ID',
    'Matka_ID',
    'Uwagi',
  ];
  lines.push(headers.join(';'));

  pigeons.forEach((p, idx) => {
    const sexStr = p.sex === 'cock' ? '1.0' : p.sex === 'hen' ? '0.1' : '—';
    const row = [
      escapeCsvField(idx + 1),
      escapeCsvField(p.countryCode),
      escapeCsvField(p.ringNumber),
      escapeCsvField(p.year),
      escapeCsvField(sexStr),
      escapeCsvField(p.plumageColor),
      escapeCsvField(p.eyeSign || ''),
      escapeCsvField(p.status),
      escapeCsvField(p.auxiliaryRingNumber || ''),
      escapeCsvField(p.clipBandColor || ''),
      escapeCsvField(p.fatherId || ''),
      escapeCsvField(p.motherId || ''),
      escapeCsvField(p.notes || ''),
    ];
    lines.push(row.join(';'));
  });

  return lines.join('\r\n');
}
