import {
  validateCrateRental,
  isRentalOverdue,
  calculateDepotStats,
  generateCrateRentalProtocolHtml,
  CrateInventoryItem,
  CrateRentalEntry,
  CRATE_TYPE_LABELS,
  RENTAL_PURPOSE_LABELS,
} from '../src/domain/crateInventoryRentalRegistry';

const sampleCrates: CrateInventoryItem[] = [
  {
    crateId: 'KOSZ-042',
    inventoryNumber: 'INW/2026/42',
    type: 'aluminum_standard',
    capacityPigeons: 20,
    status: 'in_storage',
    condition: 'excellent',
    lastDisinfectionDate: '2026-05-01',
  },
  {
    crateId: 'KOSZ-043',
    inventoryNumber: 'INW/2026/43',
    type: 'aluminum_heavy',
    capacityPigeons: 30,
    status: 'rented',
    condition: 'good',
    lastDisinfectionDate: '2026-04-20',
    currentHolderBreederName: 'Tomasz Nowak',
  },
  {
    crateId: 'KOSZ-044',
    inventoryNumber: 'INW/2026/44',
    type: 'wood_traditional',
    capacityPigeons: 25,
    status: 'quarantine_disinfection',
    condition: 'fair',
    lastDisinfectionDate: '2026-03-10',
  },
  {
    crateId: 'KOSZ-045',
    inventoryNumber: 'INW/2026/45',
    type: 'training_small',
    capacityPigeons: 12,
    status: 'damaged_maintenance',
    condition: 'damaged',
    lastDisinfectionDate: '2026-02-15',
  },
];

const sampleRentals: CrateRentalEntry[] = [
  {
    rentalId: 'WYP-2026/088',
    crateId: 'KOSZ-043',
    breederName: 'Tomasz Nowak',
    breederPzhgpNumber: 'PL-0284-1102',
    checkoutDate: '2026-05-05',
    expectedReturnDate: '2026-05-10', // overdue on 2026-05-15
    depositPaidPln: 100,
    depositReturned: false,
    purpose: 'private_training',
    conditionAtCheckout: 'Czysty, zamki sprawne, brak uszkodzeń',
    disinfectionConfirmedOnReturn: false,
    officerName: 'Piotr Kaczmarek',
    notes: 'Wypożyczenie na prywatny trening przed lotem Bruksela.',
  },
];

describe('crateInventoryRentalRegistry (Z-094 / DEC-108)', () => {
  it('validates a complete and compliant crate rental entry', () => {
    const res = validateCrateRental(sampleRentals[0]);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('detects missing fields and invalid return date earlier than checkout', () => {
    const invalid = validateCrateRental({
      ...sampleRentals[0],
      rentalId: '',
      crateId: '',
      breederName: '',
      expectedReturnDate: '2026-05-01', // earlier than checkout 2026-05-05
    });

    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.some((e) => e.includes('wypożyczenia'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('klatki'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('hodowcy'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('wcześniejsza'))).toBe(true);
  });

  it('detects overdue rentals when past expected return date', () => {
    const overdue = isRentalOverdue(sampleRentals[0], '2026-05-15');
    expect(overdue).toBe(true);

    const notOverdue = isRentalOverdue(sampleRentals[0], '2026-05-08');
    expect(notOverdue).toBe(false);

    const returned = isRentalOverdue(
      {
        ...sampleRentals[0],
        actualReturnDate: '2026-05-09',
      },
      '2026-05-15'
    );
    expect(returned).toBe(false);
  });

  it('calculates summary depot statistics accurately', () => {
    const stats = calculateDepotStats(sampleCrates, sampleRentals, '2026-05-15');

    expect(stats.totalCrates).toBe(4);
    expect(stats.availableInStorage).toBe(1);
    expect(stats.currentlyRented).toBe(1);
    expect(stats.inDisinfectionOrRepair).toBe(2);
    expect(stats.overdueRentalsCount).toBe(1);
    expect(stats.totalDepositsHeldPln).toBe(100);
  });

  it('contains comprehensive crate type and purpose labels', () => {
    expect(CRATE_TYPE_LABELS.aluminum_standard).toContain('Aluminiowa');
    expect(CRATE_TYPE_LABELS.training_small).toContain('bagażnika');
    expect(RENTAL_PURPOSE_LABELS.private_training).toContain('trening');
    expect(RENTAL_PURPOSE_LABELS.derby_loft_exchange).toContain('derbowy');
  });

  it('generates valid print-ready HTML Handover Protocol', () => {
    const html = generateCrateRentalProtocolHtml(
      sampleRentals[0],
      sampleCrates[1],
      { branchName: 'Oddział 0284 Poznań', sectionName: 'Sekcja Wilda' }
    );

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Protokół Zdawczo-Odbiorczy Sprzętu Transportowego');
    expect(html).toContain('WYP-2026/088');
    expect(html).toContain('KOSZ-043');
    expect(html).toContain('Tomasz Nowak');
    expect(html).toContain('Piotr Kaczmarek');
    expect(html).toContain('100 PLN');
    expect(html).toContain('Oddział 0284 Poznań');
    expect(html).toContain('Sekcja Wilda');
  });
});
