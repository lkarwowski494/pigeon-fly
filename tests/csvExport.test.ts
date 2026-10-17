/**
 * PIGEON-FLY — Unit Tests for CSV Export Engine (csvExport.ts)
 */

import {
  escapeCsvField,
  exportConcourseToCsv,
  exportBasketingToCsv,
  exportFlockToCsv,
  ConcourseCsvOptions,
  BasketingCsvOptions,
} from '../src/domain/csvExport';
import { Pigeon } from '../src/domain/types';

describe('CSV Export Engine — escapeCsvField', () => {
  test('returns empty string for null and undefined', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  test('returns raw string when no delimiters or special chars present', () => {
    expect(escapeCsvField('PL-0284-23-1402')).toBe('PL-0284-23-1402');
    expect(escapeCsvField(1234.56)).toBe('1234.56');
  });

  test('wraps in double quotes and escapes internal quotes when field has semicolon or quotes', () => {
    expect(escapeCsvField('Gostyń; Sekcja Poniec')).toBe('"Gostyń; Sekcja Poniec"');
    expect(escapeCsvField('Lot "Magdeburg"')).toBe('"Lot ""Magdeburg"""');
    expect(escapeCsvField('Linia 1\nLinia 2')).toBe('"Linia 1\nLinia 2"');
  });
});

describe('CSV Export Engine — exportConcourseToCsv', () => {
  test('generates semicolon-separated CSV with PZHGP header and arrival rows', () => {
    const options: ConcourseCsvOptions = {
      clubBranch: 'Oddział 0284 Gostyń',
      raceName: 'Lot Narodowy Bruksela',
      releaseLocation: 'Bruksela (BE)',
      releaseDateTime: '2026-06-20 06:00:00',
      distanceKm: 785.45,
      totalBasketed: 3500,
      basePercent: 20,
      prizeLimit: 700,
      items: [
        {
          position: 1,
          ringNumber: 'PL-0284-23-1402',
          sex: 'cock',
          plumageColor: 'Niebieski',
          fancierName: 'Stanisław Kowalski',
          loftName: 'Mistrz Loft',
          arrivalTime: '16:45:12',
          distanceKm: 785.45,
          velocityMPerMin: 1215.345,
          fciCoeff: 0.286,
          gmpPoints: 40.0,
          isTip: true,
        },
        {
          position: 2,
          ringNumber: 'DV-01234-24-512',
          sex: 'hen',
          plumageColor: 'Pstry',
          fancierName: 'Marek Nowak',
          loftName: 'Wichura',
          arrivalTime: '16:48:30',
          distanceKm: 785.45,
          velocityMPerMin: 1209.112,
          fciCoeff: 0.571,
          gmpPoints: 39.97,
          isTip: false,
        },
      ],
    };

    const csv = exportConcourseToCsv(options);
    expect(csv).toContain('# PIGEON-FLY — Oficjalna Lista Konkursowa PZHGP / FCI');
    expect(csv).toContain('Lot Narodowy Bruksela');
    expect(csv).toContain('Pozycja;Numer_Obraczki;Plec;Barwa;Hodowca;Golebnik;Czas_Przylotu;Dystans_km;Predkosc_m_min;Coeff_FCI;Punkty_GMP;Seria_5_50');
    expect(csv).toContain('1;PL-0284-23-1402;1.0;Niebieski;Stanisław Kowalski;Mistrz Loft;16:45:12;785.450;1215.345;0.286;40.00;TAK');
    expect(csv).toContain('2;DV-01234-24-512;0.1;Pstry;Marek Nowak;Wichura;16:48:30;785.450;1209.112;0.571;39.97;NIE');
  });
});

describe('CSV Export Engine — exportBasketingToCsv', () => {
  test('generates basketing list CSV with series indicators', () => {
    const options: BasketingCsvOptions = {
      clubBranch: 'Sekcja Rawicz',
      raceName: 'Magdeburg I',
      releaseLocation: 'Magdeburg',
      basketingDate: '2026-05-10',
      pigeons: [
        {
          index: 1,
          ringNumber: 'PL-0284-23-1402',
          color: 'Niebieski',
          sex: 'cock',
          auxiliaryRing: 'CHIP-9901',
          isTip: true,
        },
        {
          index: 2,
          ringNumber: 'PL-0284-24-8801',
          color: 'Płowy',
          sex: 'hen',
          isTip: false,
        },
      ],
    };

    const csv = exportBasketingToCsv(options);
    expect(csv).toContain('# PIGEON-FLY — Lista Wkladaniowa do Kosza');
    expect(csv).toContain('Lp;Numer_Obraczki;Barwa;Plec;Obraczka_Pomocnicza_Czip;Typowanie_Seria');
    expect(csv).toContain('1;PL-0284-23-1402;Niebieski;1.0;CHIP-9901;SERIA');
    expect(csv).toContain('2;PL-0284-24-8801;Płowy;0.1;;ZWYKLY');
  });
});

describe('CSV Export Engine — exportFlockToCsv', () => {
  test('generates complete flock registry CSV for PZHGP annual census', () => {
    const pigeons: Pigeon[] = [
      {
        id: 'p-1',
        loftId: 'loft-1',
        ringNumber: 'PL-0284-23-1402',
        countryCode: 'PL',
        year: 2023,
        sex: 'cock',
        plumageColor: 'Niebieski',
        status: 'racing',
        eyeSign: 'Żółte',
        auxiliaryRingNumber: 'TAURIS-01',
        clipBandColor: 'red',
        fatherId: 'p-father',
        motherId: 'p-mother',
        notes: 'Super lotnik, GMP 2024',
        qrCodeUuid: 'uuid-1',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'p-2',
        loftId: 'loft-1',
        ringNumber: 'PL-0284-22-9854',
        countryCode: 'PL',
        year: 2022,
        sex: 'hen',
        plumageColor: 'Nakrapiana',
        status: 'breeding',
        qrCodeUuid: 'uuid-2',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const csv = exportFlockToCsv(pigeons);
    expect(csv).toContain('# PIGEON-FLY — Rejestr Stada Golebi Pocztowych');
    expect(csv).toContain('Lp;Kraj;Numer_Obraczki;Rocznik;Plec;Barwa_Upierzenia;Oko;Status;Obraczka_Pomocnicza;Znacznik_Kolor;Ojciec_ID;Matka_ID;Uwagi');
    expect(csv).toContain('1;PL;PL-0284-23-1402;2023;1.0;Niebieski;Żółte;racing;TAURIS-01;red;p-father;p-mother;"Super lotnik, GMP 2024"');
    expect(csv).toContain('2;PL;PL-0284-22-9854;2022;0.1;Nakrapiana;;breeding;;;;;');
  });
});
