import {
  calculateDecommissionStats,
  generateDecommissionProtocolHtml,
  DECOMMISSION_CAUSES,
  DecommissionRecord,
  DecommissionProtocolData,
} from '../src/domain/pigeonDecommission';

describe('Pigeon Decommission & Random Event Protocol Engine (Z-068)', () => {
  const sampleRecords: DecommissionRecord[] = [
    {
      id: 'dec-1',
      pigeonId: 'p-101',
      ringNumber: 'PL-0284-21-4501',
      sex: 'cock',
      year: 2021,
      color: 'Niebieski',
      cause: 'RAPTOR_ATTACK',
      eventDate: '2026-05-12',
      locationOrRace: 'Gołębnik domowy (oblot poranny)',
      witnessOrConfirmation: 'Resztki piór i obrączka na wylocie',
      notes: 'Zaatakowany przez samicę jastrzębia gołębiarza',
    },
    {
      id: 'dec-2',
      pigeonId: 'p-102',
      ringNumber: 'PL-0284-22-1205',
      sex: 'hen',
      year: 2022,
      color: 'Ciemna',
      cause: 'RAPTOR_ATTACK',
      eventDate: '2026-06-01',
      locationOrRace: 'Wylot gołębnika',
      witnessOrConfirmation: 'Świadek: sąsiad Jan Kowalski',
    },
    {
      id: 'dec-3',
      pigeonId: 'p-103',
      ringNumber: 'PL-0284-23-7890',
      sex: 'cock',
      year: 2023,
      color: 'Pstry',
      cause: 'LOST_IN_RACE',
      eventDate: '2026-06-20',
      locationOrRace: 'Lot nr 4 - Minden (540 km)',
      witnessOrConfirmation: 'Brak odczytu w zegarze ESK',
      notes: 'Załamanie pogody na trasie lotu',
    },
    {
      id: 'dec-4',
      pigeonId: 'p-104',
      ringNumber: 'DV-01234-20-888',
      sex: 'hen',
      year: 2020,
      color: 'Płowa',
      cause: 'MORTALITY_NATURAL',
      eventDate: '2026-07-15',
      locationOrRace: 'Przedział rozpłodowy',
      witnessOrConfirmation: 'Zgon naturalny (wiek 6 lat)',
    },
    {
      id: 'dec-5',
      pigeonId: 'p-105',
      ringNumber: 'PL-0284-24-3321',
      sex: 'cock',
      year: 2024,
      color: 'Szpak',
      cause: 'TRANSFER_SALE',
      eventDate: '2026-08-01',
      locationOrRace: 'Transfer do hodowli PZHGP 0456',
      witnessOrConfirmation: 'Umowa nr UMW-2026-01 + Karta Tożsamości',
    },
  ];

  describe('Statistics & Flock Health Analysis', () => {
    it('accurately calculates flock reduction, loss rate and cause breakdown', () => {
      const stats = calculateDecommissionStats(sampleRecords, 50);

      expect(stats.totalRegistered).toBe(50);
      expect(stats.totalDecommissioned).toBe(5);
      expect(stats.activeFlockSize).toBe(45);
      expect(stats.lossRatePercentage).toBe(10); // 5/50 = 10.0%

      expect(stats.byCause.RAPTOR_ATTACK).toBe(2);
      expect(stats.byCause.LOST_IN_RACE).toBe(1);
      expect(stats.byCause.MORTALITY_NATURAL).toBe(1);
      expect(stats.byCause.TRANSFER_SALE).toBe(1);
      expect(stats.byCause.MORTALITY_ILLNESS).toBe(0);

      expect(stats.causePercentages.RAPTOR_ATTACK).toBe(40); // 2/5 = 40%
      expect(stats.causePercentages.LOST_IN_RACE).toBe(20);
      expect(stats.mostFrequentCause).toBe('RAPTOR_ATTACK');
    });

    it('handles empty decommission lists gracefully', () => {
      const stats = calculateDecommissionStats([], 60);

      expect(stats.totalRegistered).toBe(60);
      expect(stats.totalDecommissioned).toBe(0);
      expect(stats.activeFlockSize).toBe(60);
      expect(stats.lossRatePercentage).toBe(0);
      expect(stats.mostFrequentCause).toBeNull();
    });

    it('protects against active flock underflow when records exceed registered count', () => {
      const stats = calculateDecommissionStats(sampleRecords, 3);
      expect(stats.activeFlockSize).toBe(0); // Math.max(0, 3 - 5)
    });
  });

  describe('Cause Metadata & Rules', () => {
    it('defines valid labels, badges and icons for all causes', () => {
      expect(DECOMMISSION_CAUSES.RAPTOR_ATTACK.icon).toBe('🦅');
      expect(DECOMMISSION_CAUSES.LOST_IN_RACE.icon).toBe('🧭');
      expect(DECOMMISSION_CAUSES.MORTALITY_ILLNESS.icon).toBe('⚕️');
      expect(DECOMMISSION_CAUSES.MORTALITY_NATURAL.icon).toBe('🕊️');
      expect(DECOMMISSION_CAUSES.TRANSFER_SALE.icon).toBe('🤝');
    });
  });

  describe('A4 Protocol Document HTML Generation', () => {
    it('generates compliant PZHGP official document with all records and integrity clause', () => {
      const protocolData: DecommissionProtocolData = {
        protocolNumber: 'PW-2026/08/01',
        issueDate: '2026-08-05',
        seasonYear: 2026,
        breederName: 'Janusz Kowalski (PL-0284-1234)',
        pzhgpBranch: 'Oddział 0284 Gostyń',
        pzhgpSection: 'Sekcja 01 Gostyń-Centrum',
        loftCoordinates: '51°52\'44.5"N 17°00\'40.2"E',
        totalRegisteredFlock: 80,
        records: sampleRecords,
        notes: 'Weryfikacja przed lotami gołębi młodych.',
      };

      const html = generateDecommissionProtocolHtml(protocolData);

      expect(html).toContain('Protokół Wykreślenia i Rejestr Zdarzeń Losowych');
      expect(html).toContain('PW-2026/08/01');
      expect(html).toContain('Janusz Kowalski');
      expect(html).toContain('Oddział 0284 Gostyń');
      expect(html).toContain('PL-0284-21-4501');
      expect(html).toContain('PL-0284-23-7890');
      expect(html).toContain('DV-01234-20-888');
      expect(html).toContain('Gwarancja Integralności Bazy Danych');
      expect(html).toContain('Przewodniczący Komisji Lotowej Sekcji');
      expect(html).toContain('Członek Zarządu Oddziału PZHGP');
      expect(html).toContain('80'); // initial flock
      expect(html).toContain('-5'); // decommissioned
      expect(html).toContain('75'); // active flock
    });
  });
});
