/**
 * PIGEON-FLY — Property-Based Testing (PBT) for Wright's Inbreeding Coefficient
 * Mathematical Invariants:
 * 1. Boundedness: 0.0 <= F <= 1.0 (and 0% <= percentage <= 100%)
 * 2. Self-Mating: cockId == henId => F == 1.0
 * 3. Unrelated Mating: Disjoint pedigree genealogies => F == 0.0
 * 4. Full Sibling Mating: Offspring of shared unrelated parents => F == 0.25 (25%)
 * 5. Parent-Offspring Mating: F == 0.25 (25%)
 */

import fc from 'fast-check';
import { calculateWrightInbreeding } from '../../src/domain/genetics';
import { Pigeon } from '../../src/domain/types';

function createMockPigeon(id: string, fatherId?: string, motherId?: string): Pigeon {
  return {
    id,
    loftId: 'loft-pbt',
    ringNumber: `PL-${id}`,
    countryCode: 'PL',
    year: 2024,
    sex: 'cock',
    plumageColor: 'blue_bar',
    status: 'breeding',
    fatherId,
    motherId,
    qrCodeUuid: `qr-${id}`,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Property-Based Testing: Wright's Inbreeding Coefficient", () => {
  const PROP_SEED = process.env.PROP_SEED ? parseInt(process.env.PROP_SEED, 10) : 20261018;

  beforeAll(() => {
    console.log(`[PBT INBREEDING] Running 1000 trials with PROP_SEED=${PROP_SEED}`);
  });

  it('Invariant 1: Boundedness — F is always strictly within [0.0, 1.0]', () => {
    // Generate random DAG pedigrees with up to 10 generations
    const pigeonGen = fc.tuple(
      fc.string({ minLength: 1, maxLength: 8 }),
      fc.string({ minLength: 1, maxLength: 8 })
    );

    fc.assert(
      fc.property(pigeonGen, ([cockId, henId]) => {
        const lookup = new Map<string, Pigeon>();
        lookup.set(cockId, createMockPigeon(cockId));
        lookup.set(henId, createMockPigeon(henId));

        const result = calculateWrightInbreeding(cockId, henId, lookup);
        return result.coefficientF >= 0.0 && result.coefficientF <= 1.0 &&
               result.percentage >= 0.0 && result.percentage <= 100.0;
      }),
      { numRuns: 1000, seed: PROP_SEED }
    );
  });

  it('Invariant 2: Self-mating identity always yields F = 1.0', () => {
    const idGen = fc.string({ minLength: 1, maxLength: 10 });

    fc.assert(
      fc.property(idGen, (id) => {
        const lookup = new Map<string, Pigeon>();
        lookup.set(id, createMockPigeon(id));
        const res = calculateWrightInbreeding(id, id, lookup);
        return res.coefficientF === 1.0 && res.percentage === 100.0 && res.level === 'extreme';
      }),
      { numRuns: 1000, seed: PROP_SEED }
    );
  });

  it('Invariant 3: Disjoint Ancestors always yield F = 0.0', () => {
    const disjointGen = fc.tuple(
      fc.integer({ min: 1, max: 500 }),
      fc.integer({ min: 501, max: 1000 })
    );

    fc.assert(
      fc.property(disjointGen, ([cockNum, henNum]) => {
        const cockId = `c_${cockNum}`;
        const henId = `h_${henNum}`;
        const lookup = new Map<string, Pigeon>();
        
        // Build 3-generation disjoint lineage
        const cFather = `cf_${cockNum}`;
        const cMother = `cm_${cockNum}`;
        const hFather = `hf_${henNum}`;
        const hMother = `hm_${henNum}`;

        lookup.set(cockId, createMockPigeon(cockId, cFather, cMother));
        lookup.set(cFather, createMockPigeon(cFather));
        lookup.set(cMother, createMockPigeon(cMother));

        lookup.set(henId, createMockPigeon(henId, hFather, hMother));
        lookup.set(hFather, createMockPigeon(hFather));
        lookup.set(hMother, createMockPigeon(hMother));

        const res = calculateWrightInbreeding(cockId, henId, lookup);
        return res.coefficientF === 0.0 && res.percentage === 0.0 && res.level === 'none';
      }),
      { numRuns: 1000, seed: PROP_SEED }
    );
  });

  it('Invariant 4: Full Sibling mating with unrelated parents always yields F = 0.25 (25%)', () => {
    const parentIdGen = fc.tuple(
      fc.string({ minLength: 2, maxLength: 8 }),
      fc.string({ minLength: 2, maxLength: 8 })
    ).filter(([f, m]) => f !== m);

    fc.assert(
      fc.property(parentIdGen, ([fatherId, motherId]) => {
        const lookup = new Map<string, Pigeon>();
        const cockId = `sibling_cock_${fatherId}`;
        const henId = `sibling_hen_${motherId}`;

        lookup.set(fatherId, createMockPigeon(fatherId));
        lookup.set(motherId, createMockPigeon(motherId));
        lookup.set(cockId, createMockPigeon(cockId, fatherId, motherId));
        lookup.set(henId, createMockPigeon(henId, fatherId, motherId));

        const res = calculateWrightInbreeding(cockId, henId, lookup);
        return Math.abs(res.coefficientF - 0.25) < 1e-4 && Math.abs(res.percentage - 25.0) < 1e-2;
      }),
      { numRuns: 1000, seed: PROP_SEED }
    );
  });
});
