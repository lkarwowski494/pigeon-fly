/**
 * Tests for PigeonRepository & Pedigree Tree Traversal
 */

import { PigeonRepository } from '../src/db/pigeonRepository';
import { DatabaseConnection } from '../src/db/database';
import { Pigeon } from '../src/domain/types';

class MockPigeonDb implements DatabaseConnection {
  public pigeons: Map<string, any> = new Map();

  async execAsync(_sql: string): Promise<void> {}

  async runAsync(sql: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    if (sql.includes('INSERT INTO pigeons')) {
      const [
        id, loftId, ringNumber, countryCode, year, sex, plumageColor, eyeSign,
        status, fatherId, motherId, photoUrl, eyePhotoUrl, wingPhotoUrl,
        qrCodeUuid, notes, isDeleted, createdAt, updatedAt
      ] = params;
      this.pigeons.set(String(id), {
        id,
        loft_id: loftId,
        ring_number: ringNumber,
        country_code: countryCode,
        year,
        sex,
        plumage_color: plumageColor,
        eye_sign: eyeSign,
        status,
        father_id: fatherId,
        mother_id: motherId,
        photo_url: photoUrl,
        eye_photo_url: eyePhotoUrl,
        wing_photo_url: wingPhotoUrl,
        qr_code_uuid: qrCodeUuid,
        notes,
        is_deleted: isDeleted,
        created_at: createdAt,
        updated_at: updatedAt,
      });
    } else if (sql.includes('UPDATE pigeons SET is_deleted = 1')) {
      const [_updatedAt, id] = params;
      const p = this.pigeons.get(String(id));
      if (p) {
        p.is_deleted = 1;
      }
    }
    return { lastInsertRowId: 1, changes: 1 };
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (sql.includes('SELECT * FROM pigeons WHERE loft_id = ?')) {
      const [loftId] = params;
      const list = Array.from(this.pigeons.values()).filter(
        (p) => p.loft_id === loftId && p.is_deleted === 0
      );
      return list as T[];
    }
    return [];
  }

  async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    if (sql.includes('WHERE id = ?')) {
      const [id] = params;
      const p = this.pigeons.get(String(id));
      if (p && p.is_deleted === 0) return p as T;
    } else if (sql.includes('WHERE qr_code_uuid = ?')) {
      const [qrUuid] = params;
      for (const p of this.pigeons.values()) {
        if (p.qr_code_uuid === qrUuid && p.is_deleted === 0) return p as T;
      }
    }
    return null;
  }

  async closeAsync(): Promise<void> {}
}

describe('PigeonRepository — CRUD and Pedigree Tree', () => {
  let mockDb: MockPigeonDb;
  let repo: PigeonRepository;

  beforeEach(() => {
    mockDb = new MockPigeonDb();
    repo = new PigeonRepository(mockDb);
  });

  test('inserts and retrieves pigeon by ID', async () => {
    const pigeon: Pigeon = {
      id: 'p-01',
      loftId: 'loft-01',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'racing',
      qrCodeUuid: 'uuid-1234',
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    await repo.insertPigeon(pigeon);
    const retrieved = await repo.getPigeonById('p-01');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.ringNumber).toBe('PL-0284-23-1402');
    expect(retrieved?.sex).toBe('cock');
  });

  test('retrieves pigeon by QR code UUID', async () => {
    const pigeon: Pigeon = {
      id: 'p-02',
      loftId: 'loft-01',
      ringNumber: 'DV-01234-24-512',
      countryCode: 'DV',
      year: 2024,
      sex: 'hen',
      plumageColor: 'Płowa',
      status: 'breeding',
      qrCodeUuid: 'uuid-qr-999',
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    await repo.insertPigeon(pigeon);
    const retrieved = await repo.getPigeonByQrUuid('uuid-qr-999');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('p-02');
  });

  test('soft deletes pigeon so it is no longer returned', async () => {
    const pigeon: Pigeon = {
      id: 'p-03',
      loftId: 'loft-01',
      ringNumber: 'NL-2023-888',
      countryCode: 'NL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Szpak',
      status: 'racing',
      qrCodeUuid: 'uuid-del-3',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    await repo.insertPigeon(pigeon);
    await repo.deletePigeon('p-03');

    const retrieved = await repo.getPigeonById('p-03');
    expect(retrieved).toBeNull();
  });

  test('recursively builds 3-generation pedigree tree', async () => {
    // Grandfather
    await repo.insertPigeon({
      id: 'gf-1',
      loftId: 'loft-01',
      ringNumber: 'PL-0284-18-100',
      countryCode: 'PL',
      year: 2018,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'retired',
      qrCodeUuid: 'uuid-gf1',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    });

    // Father (son of gf-1)
    await repo.insertPigeon({
      id: 'f-1',
      loftId: 'loft-01',
      ringNumber: 'PL-0284-20-200',
      countryCode: 'PL',
      year: 2020,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'breeding',
      fatherId: 'gf-1',
      qrCodeUuid: 'uuid-f1',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    });

    // Subject Pigeon (son of f-1)
    await repo.insertPigeon({
      id: 'sub-1',
      loftId: 'loft-01',
      ringNumber: 'PL-0284-23-300',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'racing',
      fatherId: 'f-1',
      qrCodeUuid: 'uuid-sub1',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    });

    const tree = await repo.buildPedigreeTree('sub-1', 3);

    expect(tree).not.toBeNull();
    expect(tree?.pigeon.id).toBe('sub-1');
    expect(tree?.father?.pigeon.id).toBe('f-1');
    expect(tree?.father?.father?.pigeon.id).toBe('gf-1');
    expect(tree?.father?.father?.generation).toBe(2);
  });
});
